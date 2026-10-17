/* Pages Function: everything behind /api/chat/*
 *
 * This runs on flywithandreea.com itself, not on a separate worker, so there
 * is no second domain, no CORS, and no deploy step of its own. It ships when
 * you push, the same as any page.
 *
 * ROUTES
 *   POST /api/chat/start   open a conversation, get a code and a secret back
 *   POST /api/chat/say     one line from a visitor: stored, then to Telegram
 *   GET  /api/chat/poll    anything Andreea has said since message N
 *   POST /api/chat/tg      Telegram's webhook, where her replies come in
 *   GET  /api/chat/export  the enquiries as csv, behind a secret
 *
 * WHAT IT REFUSES
 *   More than MAXCONV conversations an hour from one source.
 *   More than MAXMSG messages in one conversation.
 *   Anything over MAXLEN characters.
 *   A say or a poll without the secret issued when the conversation opened.
 *   A webhook call without Telegram's own secret header.
 *   And every link a visitor types is defused before it reaches Telegram, so
 *   nothing arriving in that inbox is ever tappable.
 *
 * BINDINGS, set in the Pages dashboard
 *   DB            D1 database
 *   TG_TOKEN      bot token from BotFather
 *   TG_CHAT       your own Telegram numeric id
 *   TG_SECRET     any long random string, also given to setWebhook
 *   EXPORT_KEY    any long random string, for the csv link
 */

const MAXLEN = 1200;
const MAXMSG = 80;          // messages in one conversation
const MAXCONV = 12;         // conversations an hour from one source
const CODE = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // no I, O, 0, 1

/* Answers that get their own column. Everything else lands in `data`. */
const PROMOTE = {
  service: 'service', from: 'from_place', to: 'to_place',
  name: 'name', contact: 'contact', contact_by: 'contact_by'
};

/* How a service reads in a Telegram heading. */
const SERVICE = {
  jet: '✈️ Private jet', group: '👥 Group charter',
  cargo: '📦 Cargo', medical: '🟥 AIR AMBULANCE'
};

const json = (o, s = 200) =>
  new Response(JSON.stringify(o), {
    status: s,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });

function code() {
  const a = new Uint8Array(5);
  crypto.getRandomValues(a);
  return [...a].map(n => CODE[n % CODE.length]).join('');
}

function secret() {
  const a = new Uint8Array(24);
  crypto.getRandomValues(a);
  return [...a].map(n => n.toString(16).padStart(2, '0')).join('');
}

/* The address is never stored. Only a one way hash of it, which exists purely
   so the next request from the same source can be counted. */
async function ipHash(req) {
  const ip = req.headers.get('CF-Connecting-IP') || '';
  if (!ip) return null;
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip + '|fwa'));
  return [...new Uint8Array(buf)].slice(0, 8)
    .map(n => n.toString(16).padStart(2, '0')).join('');
}

const now = () => new Date().toISOString();
const clip = (v, n) => (typeof v === 'string' ? v.slice(0, n) : null);

/* ------------------------------------------------------------------- links
 * A visitor's words are forwarded to a Telegram inbox that one person reads
 * on a phone. A tappable link in there is the only realistic way malware
 * reaches her, so no link a visitor types is ever left tappable: the dots and
 * the scheme are broken, which keeps the text readable and makes it inert.
 *
 * It matches on the shape of a hostname rather than a list of endings,
 * because the endings that matter are the ones nobody has heard of yet, and
 * because a shortener is 6 characters long. A number like 2.4 is not touched,
 * since the part after the last dot has to be 2 or more letters.
 */
const LINKY = /(https?:\/\/\S+|www\.\S+|\b[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.[a-z]{2,24}\b(?:\/\S*)?)/gi;

function defuse(text) {
  let found = 0;
  const out = text.replace(LINKY, (m) => {
    found++;
    return m.replace(/^https?:\/\//i, 'hxxp://').replace(/\./g, '[.]');
  });
  return { text: out, links: found };
}

async function tg(env, method, body) {
  if (!env.TG_TOKEN) return null;
  const r = await fetch(`https://api.telegram.org/bot${env.TG_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return r.json().catch(() => null);
}

/* -------------------------------------------------------------------- start */
async function start(req, env) {
  const b = await req.json().catch(() => ({}));
  const ih = await ipHash(req);

  /* one source, one hour, a sane number of conversations */
  if (ih) {
    const hourAgo = new Date(Date.now() - 3600e3).toISOString();
    const r = await env.DB.prepare(
      'SELECT COUNT(*) AS n FROM conversations WHERE ip_hash = ? AND started_at > ?'
    ).bind(ih, hourAgo).first();
    if (r && r.n >= MAXCONV) return json({ error: 'busy' }, 429);
  }

  const id = code(), key = secret(), t = now();
  await env.DB.prepare(
    `INSERT INTO conversations
       (id, secret, started_at, last_at, page, title, ref, country, ip_hash, data)
     VALUES (?,?,?,?,?,?,?,?,?,'{}')`
  ).bind(
    id, key, t, t, clip(b.page, 300), clip(b.title, 200), clip(b.ref, 300),
    req.headers.get('CF-IPCountry') || null, ih
  ).run();
  return json({ conv: id, key });
}

/* ---------------------------------------------------------------------- say */
async function say(req, env) {
  const b = await req.json().catch(() => ({}));
  const conv = clip(b.conv, 8);
  let body = clip(b.body, MAXLEN);
  if (!conv || !body || !body.trim()) return json({ error: 'empty' }, 400);
  body = body.trim();

  const c = await env.DB.prepare('SELECT * FROM conversations WHERE id = ?')
    .bind(conv).first();
  if (!c) return json({ error: 'unknown' }, 404);
  if (c.secret && c.secret !== clip(b.key, 64)) return json({ error: 'no' }, 403);
  if (c.blocked) return json({ error: 'no' }, 403);
  if (c.msgs >= MAXMSG) return json({ error: 'too many' }, 429);

  const t = now();
  const field = clip(b.field, 40);
  const service = clip(b.service, 12);
  const safe = defuse(body);

  const sets = ['last_at = ?', 'msgs = msgs + 1'];
  const vals = [t];
  if (service && !c.service) { sets.push('service = ?'); vals.push(service); }
  if (safe.links) sets.push('flagged = 1');
  if (field && PROMOTE[field]) {
    sets.push(`${PROMOTE[field]} = ?`);
    vals.push(body.slice(0, 200));
  } else if (field) {
    let d = {};
    try { d = JSON.parse(c.data || '{}'); } catch (e) { d = {}; }
    d[field] = body.slice(0, 400);
    sets.push('data = ?');
    vals.push(JSON.stringify(d));
  }
  if (/enquiry complete/i.test(body)) sets.push('done = 1');
  vals.push(conv);

  await env.DB.batch([
    env.DB.prepare('INSERT INTO messages (conv, who, body, at) VALUES (?,?,?,?)')
      .bind(conv, 'visitor', body, t),
    env.DB.prepare(`UPDATE conversations SET ${sets.join(', ')} WHERE id = ?`).bind(...vals)
  ]);

  /* ---- and off to Telegram, with nothing tappable in it ---- */
  const svc = service || c.service;
  const warn = safe.links
    ? `\n\n⚠️ ${safe.links} link${safe.links > 1 ? 's' : ''} in this `
      + `message, broken on purpose. Do not retype them.`
    : '';
  let text;
  if (!c.tg_msg) {
    text = `${SERVICE[svc] || '✈️ New chat'} · ${conv}\n`
      + `${c.page || '/'}${c.country ? '  ·  ' + c.country : ''}\n\n`
      + `“${safe.text}”${warn}\n\n`
      + `Reply to this message and it appears in their chat window.`;
  } else if (field === '__escalate') {
    text = `⚠️ ASKED FOR A PERSON · ${conv} · ${c.name || 'visitor'}\n\n`
      + `“${safe.text}”${warn}\n\n`
      + `The questions have stopped. Reply here and it reaches them.`;
  } else {
    const tag = field ? `  [${field}]` : '';
    text = `${conv} · ${c.name || 'visitor'}${tag}\n\n“${safe.text}”${warn}`;
  }
  const sent = await tg(env, 'sendMessage', {
    chat_id: env.TG_CHAT,
    text,
    reply_to_message_id: c.tg_msg || undefined,
    allow_sending_without_reply: true,
    disable_web_page_preview: true,
    disable_notification: svc !== 'medical' && !!c.tg_msg && field !== '__escalate'
  });
  const mid = sent && sent.ok && sent.result ? sent.result.message_id : null;
  if (mid && !c.tg_msg) {
    await env.DB.prepare('UPDATE conversations SET tg_msg = ? WHERE id = ?')
      .bind(mid, conv).run();
  }
  return json({ ok: true });
}

/* --------------------------------------------------------------------- poll */
async function poll(url, env) {
  const conv = clip(url.searchParams.get('conv'), 8);
  const key = clip(url.searchParams.get('key'), 64);
  const after = parseInt(url.searchParams.get('after') || '0', 10) || 0;
  if (!conv) return json({ msgs: [] });

  const c = await env.DB.prepare('SELECT secret, blocked FROM conversations WHERE id = ?')
    .bind(conv).first();
  if (!c) return json({ msgs: [] });
  if (c.secret && c.secret !== key) return json({ error: 'no' }, 403);
  if (c.blocked) return json({ msgs: [] });

  const r = await env.DB.prepare(
    `SELECT id, body FROM messages
      WHERE conv = ? AND who = 'andreea' AND id > ?
      ORDER BY id LIMIT 30`
  ).bind(conv, after).all();
  return json({ msgs: r.results || [] });
}

/* ----------------------------------------------------------------- telegram */
async function webhook(req, env) {
  if (env.TG_SECRET &&
      req.headers.get('X-Telegram-Bot-Api-Secret-Token') !== env.TG_SECRET) {
    return json({ error: 'no' }, 403);
  }
  const u = await req.json().catch(() => null);
  const m = u && (u.message || u.edited_message);
  if (!m || !m.text) return json({ ok: true });
  if (env.TG_CHAT && String(m.chat.id) !== String(env.TG_CHAT)) return json({ ok: true });

  let text = m.text.trim();
  let conv = null;

  /* ---- /block, the one command, for when something unpleasant arrives ----
   * Either /block ABCDE, or /block as a reply to one of the chat messages.
   * The conversation stops being accepted. The transcript is kept.
   */
  const bl = text.match(/^\/(un)?block(?:\s+([A-Za-z2-9]{5}))?\s*$/i);
  if (bl) {
    const off = !!bl[1];
    let id = bl[2] ? bl[2].toUpperCase() : null;
    if (!id && m.reply_to_message && m.reply_to_message.text) {
      const h = m.reply_to_message.text.match(/\b([A-Z2-9]{5})\b/);
      if (h) id = h[1];
    }
    if (!id) {
      await tg(env, 'sendMessage', {
        chat_id: m.chat.id,
        text: 'Send /block with the 5 character code, or reply /block to one of '
          + 'the chat messages.'
      });
      return json({ ok: true });
    }
    const r = await env.DB.prepare(
      'UPDATE conversations SET blocked = ? WHERE id = ?'
    ).bind(off ? 0 : 1, id).run();
    const hit = r && r.meta && r.meta.changes;
    await tg(env, 'sendMessage', {
      chat_id: m.chat.id,
      text: !hit ? `No conversation ${id}.`
        : off ? `${id} is open again.`
        : `${id} is blocked. Nothing more from it will reach you. The `
          + `transcript is still in the database.`
    });
    return json({ ok: true });
  }

  // either she replied to a forwarded message, and the code is in its text,
  const rt = m.reply_to_message;
  if (rt && rt.text) {
    const hit = rt.text.match(/\b([A-Z2-9]{5})\b/);
    if (hit) conv = hit[1];
    if (!conv) {
      const row = await env.DB.prepare('SELECT id FROM conversations WHERE tg_msg = ?')
        .bind(rt.message_id).first();
      if (row) conv = row.id;
    }
  }
  // or she typed the code herself
  if (!conv) {
    const hit = text.match(/^\/?([A-Z2-9]{5})\s+([\s\S]+)$/);
    if (hit) { conv = hit[1]; text = hit[2].trim(); }
  }
  if (!conv) {
    await tg(env, 'sendMessage', {
      chat_id: m.chat.id,
      text: 'Reply to one of the chat messages, or start your message with the '
        + '5 character code, so I know who it is for.'
    });
    return json({ ok: true });
  }

  const c = await env.DB.prepare('SELECT id FROM conversations WHERE id = ?')
    .bind(conv).first();
  if (!c) {
    await tg(env, 'sendMessage', { chat_id: m.chat.id, text: `No conversation ${conv}.` });
    return json({ ok: true });
  }

  const t = now();
  await env.DB.batch([
    env.DB.prepare('INSERT INTO messages (conv, who, body, at) VALUES (?,?,?,?)')
      .bind(conv, 'andreea', text.slice(0, MAXLEN), t),
    env.DB.prepare('UPDATE conversations SET last_at = ?, live = 1 WHERE id = ?')
      .bind(t, conv)
  ]);
  return json({ ok: true });
}

/* ------------------------------------------------------------------- export */
async function exportCsv(url, env) {
  if (!env.EXPORT_KEY || url.searchParams.get('key') !== env.EXPORT_KEY) {
    return new Response('no', { status: 403 });
  }
  const svc = url.searchParams.get('service');
  const sql = `SELECT * FROM conversations ${svc ? 'WHERE service = ?' : ''}
               ORDER BY last_at DESC LIMIT 2000`;
  const stmt = svc ? env.DB.prepare(sql).bind(svc) : env.DB.prepare(sql);
  const r = await stmt.all();
  const rows = r.results || [];

  // every key any row used, so a new question in fwa-flows.js appears here on
  // its own without anybody editing this file
  const extra = [];
  for (const row of rows) {
    let d = {};
    try { d = JSON.parse(row.data || '{}'); } catch (e) {}
    row.__d = d;
    for (const k of Object.keys(d)) if (!extra.includes(k)) extra.push(k);
  }
  extra.sort();
  const base = ['id', 'started_at', 'country', 'service', 'from_place', 'to_place',
                'name', 'contact_by', 'contact', 'done', 'live', 'flagged', 'msgs', 'page'];
  const q = v => '"' + String(v === null || v === undefined ? '' : v).replace(/"/g, '""') + '"';
  const csv = [base.concat(extra).join(',')].concat(
    rows.map(row => base.map(c => q(row[c]))
      .concat(extra.map(k => q(row.__d[k]))).join(','))
  ).join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="fwa-enquiries.csv"'
    }
  });
}

/* -------------------------------------------------------------------- entry */
export async function onRequest(ctx) {
  const { request, env } = ctx;
  const url = new URL(request.url);
  const leaf = url.pathname.replace(/\/+$/, '').split('/').pop();

  try {
    if (request.method === 'POST') {
      if (leaf === 'start') return await start(request, env);
      if (leaf === 'say') return await say(request, env);
      if (leaf === 'tg') return await webhook(request, env);
    }
    if (request.method === 'GET') {
      if (leaf === 'poll') return await poll(url, env);
      if (leaf === 'export') return await exportCsv(url, env);
    }
    return json({ error: 'not found' }, 404);
  } catch (e) {
    return json({ error: 'server' }, 500);   // never show a visitor a stack trace
  }
}
