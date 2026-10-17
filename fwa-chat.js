/* fwa-chat.js - the chat bubble for flywithandreea.com
 *
 * Self contained apart from fwa-flows.js, which holds every word it says.
 * Drops in the same way /fwa-photos.js and /sticky-cta.js already do.
 *
 * WHAT IT DOES
 *   Offers 4 services, walks through the questions for whichever is chosen,
 *   and hands the conversation to Andreea. Every answer reaches her Telegram
 *   as it is given, so she can cut in at any point. The moment she replies the
 *   script stops and it becomes a live chat.
 *
 *   It never quotes a price, never promises anything and never offers a
 *   medical opinion. When it does not understand it says so plainly and puts
 *   the question back, rather than guessing.
 *
 * WHERE IT SITS
 *   Bottom right, 85px up, clearing the 69px sticky CTA bar. Panel at z-index
 *   9100 against that bar's 9000.
 */
(function () {
  'use strict';
  if (window.__fwaChat) return;
  window.__fwaChat = 1;

  var F = window.FWA_FLOWS;
  if (!F) { if (window.console) console.warn('fwa-chat: fwa-flows.js is missing'); return; }

  var API = '/api/chat';
  var KEY = 'fwa-chat';
  var POLL_OPEN = 4000;
  var POLL_SHUT = 25000;
  var MAXLEN = 1200;
  var BEAT = 420;          // the pause before the next line, so it reads as speech

  /* ------------------------------------------------------------------ state */
  var S;
  try { S = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) { S = null; }
  if (!S || !S.conv) {
    S = { conv: null, key: null, svc: null, i: 0, data: {}, live: false,
          after: 0, log: [], seen: true, done: false };
  }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

  /* ------------------------------------------------------------------ paper
   * The wallpaper, drawn rather than loaded, so the widget stays one file with
   * nothing to fetch. Planes, clouds and a contrail, very faint, on the warm
   * grey a messaging app uses.
   */
  var WALL = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'"
    + "%20width='150'%20height='150'%20viewBox='0%200%20150%20150'%3E%3Cg%20fill="
    + "'none'%20stroke='%23D8CDBF'%20stroke-width='1.1'%20stroke-linecap='round'"
    + "%20stroke-linejoin='round'%3E%3Cpath%20d='M20%2032l18-6-5%206%205%206-18-6z'"
    + "/%3E%3Cpath%20d='M92%2022c3-7%2013-6%2014%201%205-1%208%203%207%207H87c-4-4%200"
    + "-8%205-8z'/%3E%3Cpath%20d='M36%2092c8-10%2020-10%2028%200'/%3E%3Cpath%20d='M110"
    + "%20112l16-5-4%205%204%205-16-5z'/%3E%3Ccircle%20cx='124'%20cy='60'%20r='3.2'/"
    + "%3E%3Ccircle%20cx='18'%20cy='128'%20r='3.2'/%3E%3Cpath%20d='M62%20136c6-5%2014"
    + "-5%2020%200'/%3E%3C/g%3E%3C/svg%3E\")";

  /* -------------------------------------------------------------------- css
   * The conversation is shaped like the one everybody already knows how to
   * use: wallpaper, tails on the bubbles, a time and a pair of ticks in the
   * corner, a pill to type in.
   *
   * TO CHANGE THE OUTGOING BUBBLE to the site's own gold instead of the
   * familiar green, swap the 2 values marked OUT below for #F3E8DB.
   */
  var CSS = [
    /* --- the bubble: her face in a white ring, with a gold aura breathing
       out of it so the eye finds it without anything jumping about --- */
    /* The same 54px circle as the .fwa-top ring, on the same right edge,
       sitting directly above it: 90 bottom + 54 tall + 12 of air = 156. */
    '.fwac-b{position:fixed;right:24px;bottom:156px;width:54px;height:54px;border-radius:50%;',
    'box-sizing:border-box;background:#fff;border:0;padding:3px;cursor:pointer;z-index:9100;',
    'display:flex;align-items:center;justify-content:center;',
    'box-shadow:0 12px 30px -10px rgba(29,29,31,.35);transition:transform .18s}',
    '.fwac-b:hover{transform:translateY(-2px)}',
    '.fwac-b img{width:100%;height:100%;border-radius:50%;object-fit:cover;display:block}',
    '.fwac-b.on{display:none}',
    '.fwac-dot{position:absolute;top:0;right:0;width:13px;height:13px;border-radius:50%;',
    'background:#C0392B;border:2px solid #fff;display:none;z-index:2}',
    '.fwac-b.new .fwac-dot{display:block}',
    /* the aura. 2 rings, half a cycle apart, so it never stops and never
       looks like a loading spinner. It is a shadow, so it costs no layout. */
    '.fwac-aura{position:absolute;inset:0;border-radius:50%;pointer-events:none;',
    'animation:fwacAura 2.8s cubic-bezier(.26,.6,.3,1) infinite}',
    '.fwac-aura.two{animation-delay:1.4s}',
    '.fwac-b.on .fwac-aura{animation:none;box-shadow:none}',
    '@keyframes fwacAura{',
    '0%{box-shadow:0 0 0 0 rgba(203,173,145,.62)}',
    '70%{box-shadow:0 0 0 17px rgba(203,173,145,0)}',
    '100%{box-shadow:0 0 0 0 rgba(203,173,145,0)}}',
    '@media (prefers-reduced-motion:reduce){.fwac-aura{animation:none}}',
    '.fwac-p{position:fixed;right:24px;bottom:222px;width:368px;max-width:calc(100vw - 36px);',
    'height:520px;max-height:calc(100vh - 262px);background:#fff;border-radius:4px;z-index:9100;',
    'display:none;flex-direction:column;overflow:hidden;box-shadow:0 18px 56px rgba(0,0,0,.3);',
    'font-family:-apple-system,"system-ui","SF Pro Text",sans-serif}',
    '.fwac-p.on{display:flex}',
    /* --- the header, an avatar and a name, as a conversation has --- */
    '.fwac-h{background:#1D1D1F;padding:11px 14px;flex:none;display:flex;align-items:center;',
    'gap:11px}',
    '.fwac-av{width:38px;height:38px;border-radius:50%;background:#CBAD91;flex:none;',
    'display:flex;align-items:center;justify-content:center}',
    '.fwac-av svg{width:19px;height:19px;fill:#1D1D1F}',
    '.fwac-av img{width:100%;height:100%;border-radius:50%;object-fit:cover;display:block}',
    '.fwac-h b{display:block;font-family:Cinzel,serif;font-weight:500;font-size:14px;',
    'letter-spacing:.13em;color:#CBAD91;text-transform:uppercase;line-height:1.2}',
    '.fwac-h i{display:block;font-style:normal;font-size:11.5px;color:rgba(255,255,255,.5);',
    'margin-top:2px}',
    '.fwac-h>div:nth-child(2){flex:1;min-width:0}',
    '.fwac-x{flex:none;width:30px;height:30px;border-radius:50%;border:0;background:none;',
    'cursor:pointer;color:rgba(255,255,255,.62);font:300 21px/1 -apple-system,sans-serif;',
    'display:flex;align-items:center;justify-content:center;padding:0;',
    'transition:background .15s,color .15s}',
    '.fwac-x:hover{background:rgba(255,255,255,.1);color:#fff}',
    '.fwac-h i em{font-style:normal;color:#7FB685}',

    /* --- the wallpaper --- */
    '.fwac-m{flex:1;overflow-y:auto;padding:14px 11px 10px;background-color:#EFE7DE;',
    'background-image:' + WALL + ';background-size:150px 150px}',

    /* --- a day divider, the way a conversation opens --- */
    '.fwac-day{text-align:center;margin:2px 0 12px}',
    '.fwac-day span{display:inline-block;background:rgba(255,255,255,.86);color:#54656F;',
    'font-size:11px;letter-spacing:.04em;padding:5px 12px;border-radius:7px;',
    'box-shadow:0 1px .5px rgba(11,20,26,.13);text-transform:uppercase}',

    /* --- the bubbles, with a tail on the first corner --- */
    '.fwac-row{display:flex;margin-bottom:3px}',
    '.fwac-row.out{justify-content:flex-end}',
    '.fwac-row+.fwac-row{margin-top:3px}',
    '.fwac-bub{position:relative;max-width:82%;padding:6px 8px 7px 9px;border-radius:8px;',
    'box-shadow:0 1px .5px rgba(11,20,26,.13);font-size:14.2px;line-height:1.42;',
    'color:#111B21;display:flex;flex-wrap:wrap;align-items:flex-end;',
    'word-wrap:break-word;overflow-wrap:anywhere}',
    '.fwac-row.in .fwac-bub{background:#fff;border-top-left-radius:0;margin-left:9px}',
    '.fwac-row.out .fwac-bub{background:#D9FDD3;border-top-right-radius:0;margin-right:9px}',  /* OUT */
    '.fwac-bub::before{content:"";position:absolute;top:0;width:9px;height:13px}',
    '.fwac-row.in .fwac-bub::before{left:-9px;background:#fff;',
    'clip-path:polygon(100% 0,100% 100%,0 0)}',
    '.fwac-row.out .fwac-bub::before{right:-9px;background:#D9FDD3;',                           /* OUT */
    'clip-path:polygon(0 0,0 100%,100% 0)}',
    '.fwac-txt{white-space:pre-wrap;flex:1 1 auto;min-width:0}',
    '.fwac-meta{flex:0 0 auto;margin-left:9px;align-self:flex-end;font-size:11px;',
    'color:rgba(17,27,33,.45);display:flex;align-items:center;gap:3px;',
    'position:relative;top:3px;white-space:nowrap}',
    '.fwac-meta svg{width:15px;height:15px;fill:#53BDEB}',

    /* --- a centred note, for the rare thing that is not a message --- */
    '.fwac-note{text-align:center;margin:6px 0 10px}',
    '.fwac-note span{display:inline-block;background:rgba(255,246,208,.92);color:#5B5340;',
    'font-size:11.5px;line-height:1.5;padding:6px 12px;border-radius:7px;max-width:88%;',
    'box-shadow:0 1px .5px rgba(11,20,26,.13)}',

    /* --- the 3 dots while she is composing --- */
    '.fwac-typ .fwac-bub{padding:11px 13px}',
    '.fwac-typ i{width:7px;height:7px;border-radius:50%;background:#9AA5AC;display:block;',
    'margin-right:4px;animation:fwacb 1.3s infinite}',
    '.fwac-typ i:nth-child(2){animation-delay:.18s}',
    '.fwac-typ i:nth-child(3){animation-delay:.36s;margin-right:0}',
    '@keyframes fwacb{0%,60%,100%{opacity:.35;transform:translateY(0)}',
    '30%{opacity:1;transform:translateY(-3px)}}',
    /* --- the answers, shaped like the quick replies a business account sends --- */
    '.fwac-c{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 12px;justify-content:flex-end}',
    '.fwac-c button{border:0;background:#fff;color:#1E7B6B;cursor:pointer;border-radius:8px;',
    'padding:9px 15px;font:500 13.5px/1.2 -apple-system,sans-serif;',
    'box-shadow:0 1px .5px rgba(11,20,26,.13);transition:background .12s}',
    '.fwac-c button:hover{background:#F2F7F5}',
    '.fwac-c button.sel{background:#1E7B6B;color:#fff}',
    '.fwac-c button.go{background:#CBAD91;color:#1D1D1F;font-weight:600}',
    '.fwac-c button.skip{color:#8696A0}',

    /* --- the pill to type in --- */
    '.fwac-f{flex:none;background:#F0F2F5;display:flex;align-items:flex-end;gap:8px;',
    'padding:8px 10px}',
    /* The box is as tall as its one line, and the line sits in the middle of
       it. The padding is even on both sides so the centred hint is truly
       centred, and box-sizing keeps the measured height honest when it grows. */
    '.fwac-f .fwac-pill{flex:1;background:#fff;border-radius:19px;display:flex;',
    'align-items:center;min-height:38px;padding:0 14px}',
    '.fwac-f textarea{flex:1;box-sizing:border-box;border:0;outline:0;resize:none;',
    'padding:9px 0;height:38px;',
    'font:400 14px/1.4 -apple-system,sans-serif;color:#111B21;max-height:92px;',
    'background:none}',
    '.fwac-f textarea::placeholder{color:#8696A0}',
    /* The hint sits in the middle of the box, because it is an invitation
       rather than a half typed message. The moment they type a character it
       goes back to the left, where words belong. */
    '.fwac-f textarea{text-align:center}',
    '.fwac-f textarea.has{text-align:left}',
    '.fwac-f button{border:0;cursor:pointer;flex:none;width:38px;height:38px;border-radius:50%;',
    'background:#CBAD91;display:flex;align-items:center;justify-content:center;padding:0}',
    '.fwac-f button svg{width:18px;height:18px;fill:#1D1D1F}',
    '.fwac-f button:disabled{background:#D5D9DC;cursor:default}',
    '.fwac-f button:disabled svg{fill:#fff}',
    '.fwac-n{flex:none;padding:7px 16px 9px;font-size:10px;letter-spacing:.03em;',
    'color:#8696A0;background:#F0F2F5;text-align:center;line-height:1.4}',
    '@media(max-width:520px){.fwac-p{right:10px;left:10px;width:auto;bottom:214px;',
    'max-height:calc(100vh - 254px)}',
    '.fwac-b{right:24px;bottom:152px;width:50px;height:50px}}'
  ].join('');

  /* ------------------------------------------------------------------- dom */
  /* Her picture, inline so the header never waits on a request and never
     flashes an empty circle. 120px square webp, about 3kb. */
  var FACE = 'data:image/webp;base64,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';

  var st = document.createElement('style'); st.textContent = CSS;
  document.head.appendChild(st);

  var btn = document.createElement('button');
  btn.className = 'fwac-b';
  btn.setAttribute('aria-label', 'Chat with Andreea');
  btn.innerHTML = '<span class="fwac-aura"></span><span class="fwac-aura two"></span>'
    + '<img src="' + FACE + '" alt="">'
    + '<span class="fwac-dot"></span>';

  var SEND = '<svg viewBox="0 0 24 24"><path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z"/></svg>';
  var TICKS = '<svg viewBox="0 0 18 18"><path d="M17.4 5.2 8.1 14.5 4.3 10.7l.9-.9 2.9 2.9'
    + ' 8.4-8.4.9.9zM12.9 5.2 3.6 14.5 0 10.9l.9-.9 2.7 2.7 8.4-8.4.9.9z"/></svg>';

  var pan = document.createElement('div');
  pan.className = 'fwac-p';
  pan.innerHTML =
    '<div class="fwac-h"><div class="fwac-av">'
    + '<img src="' + FACE + '" alt="" width="38" height="38">' + '</div>'
    + '<div><b>Fly With Andreea</b><i id="fwacStat"><em>&#9679;</em> online</i>'
    + '</div>'
    + '<button class="fwac-x" id="fwacX" type="button" aria-label="Close">'
    + '&times;</button></div>'
    + '<div class="fwac-m" id="fwacM" role="log" aria-live="polite"></div>'
    + '<div class="fwac-f"><div class="fwac-pill">'
    + '<textarea id="fwacT" rows="1" placeholder="Message"'
    + ' aria-label="Message" maxlength="' + MAXLEN + '"></textarea></div>'
    + '<button id="fwacS" type="button" aria-label="Send">' + SEND + '</button></div>'
    + '<div class="fwac-n">Your details are used only to answer you.</div>';

  document.body.appendChild(btn);
  document.body.appendChild(pan);

  var mBox = pan.querySelector('#fwacM');
  var tArea = pan.querySelector('#fwacT');
  var sBtn = pan.querySelector('#fwacS');
  var xBtn = pan.querySelector('#fwacX');

  /* ---------------------------------------------------------------- drawing */
  function clock(d) {
    d = d || new Date();
    var h = d.getHours(), m = d.getMinutes();
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }
  function paint(who, body, at) {
    if (who === 'note') {
      var n = document.createElement('div');
      n.className = 'fwac-note';
      n.innerHTML = '<span></span>';
      n.firstChild.textContent = body;
      mBox.appendChild(n); scroll();
      return n;
    }
    var row = document.createElement('div');
    row.className = 'fwac-row ' + (who === 'visitor' ? 'out' : 'in');
    var bub = document.createElement('div');
    bub.className = 'fwac-bub';
    var txt = document.createElement('span');
    txt.className = 'fwac-txt';
    txt.textContent = body;
    var meta = document.createElement('span');
    meta.className = 'fwac-meta';
    meta.textContent = at || clock();
    /* ticks only on what the visitor sent, because only that was delivered */
    if (who === 'visitor') meta.innerHTML += TICKS;
    bub.appendChild(txt); bub.appendChild(meta);
    row.appendChild(bub);
    mBox.appendChild(row);
    scroll();
    return row;
  }
  function add(who, body) {
    stopTyping();
    var at = clock();
    paint(who, body, at);
    S.log.push([who, body, at]);
    save();
  }

  /* the 3 dots, shown while the next line is on its way */
  var typing = null;
  function startTyping() {
    if (typing || S.live) return;
    typing = document.createElement('div');
    typing.className = 'fwac-row in fwac-typ';
    typing.innerHTML = '<div class="fwac-bub"><i></i><i></i><i></i></div>';
    mBox.appendChild(typing);
    scroll();
    var st = document.getElementById('fwacStat');
    if (st) st.innerHTML = 'typing…';
  }
  function stopTyping() {
    if (typing && typing.parentNode) typing.parentNode.removeChild(typing);
    typing = null;
    var st = document.getElementById('fwacStat');
    if (st && st.innerHTML.indexOf('typing') > -1) {
      st.innerHTML = '<em>&#9679;</em> online';
    }
  }
  function scroll() { mBox.scrollTop = mBox.scrollHeight; }
  function clearChips() {
    var c = mBox.querySelectorAll('.fwac-c');
    for (var i = 0; i < c.length; i++) c[i].parentNode.removeChild(c[i]);
  }
  function chips(list, onPick, opts) {
    clearChips();
    opts = opts || {};
    var wrap = document.createElement('div');
    wrap.className = 'fwac-c';
    list.forEach(function (label) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      if (opts.skip && label === opts.skip) b.className = 'skip';
      b.addEventListener('click', function () { onPick(label, b); });
      wrap.appendChild(b);
    });
    if (opts.done) {
      var g = document.createElement('button');
      g.type = 'button'; g.className = 'go'; g.textContent = opts.done;
      g.addEventListener('click', function () { onPick('__done', g); });
      wrap.appendChild(g);
    }
    mBox.appendChild(wrap);
    scroll();
    return wrap;
  }
  function dayLine() {
    var d = document.createElement('div');
    d.className = 'fwac-day';
    d.innerHTML = '<span>Today</span>';
    mBox.appendChild(d);
  }
  function redraw() {
    mBox.innerHTML = '';
    dayLine();
    for (var i = 0; i < S.log.length; i++) {
      paint(S.log[i][0], S.log[i][1], S.log[i][2]);
    }
  }

  /* ------------------------------------------------------------------- net */
  function post(path, body) {
    return fetch(API + path, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); });
  }
  function ensure() {
    if (S.conv) return Promise.resolve(S.conv);
    return post('/start', {
      page: location.pathname, ref: (document.referrer || '').slice(0, 300),
      title: document.title.slice(0, 200)
    }).then(function (r) { S.conv = r.conv; S.key = r.key; save(); return r.conv; });
  }
  var missed = 0;
  function tell(body, field, service) {
    ensure().then(function (conv) {
      return post('/say', { conv: conv, key: S.key, body: body, field: field,
                            service: service });
    }).then(function () { missed = 0; })['catch'](function () {
      missed++;
      if (missed === 1) {
        add('note', 'That did not reach her. Trying once more.');
        setTimeout(function () {
          ensure().then(function (c) {
            return post('/say', { conv: c, key: S.key, body: body, field: field,
                                service: service });
          })['catch'](function () {
            add('note', 'Still no connection. WhatsApp on +971 50 337 2980 will reach '
              + 'her straight away.');
          });
        }, 3000);
      }
    });
  }

  /* ----------------------------------------------------------------- script */
  function flow() { return S.svc ? F[S.svc] : null; }
  function step() {
    var f = flow();
    return f && S.i < f.steps.length ? f.steps[S.i] : null;
  }
  function shows(s) {
    if (!s.when) return true;
    return S.data[s.when.field] === s.when.is;
  }
  /* {X} takes its wording from the answer before it. {anything else} is the
   * answer already filed under that name, so a question can say the city back
   * to the person rather than calling it "your departure city". */
  function wordFor(s) {
    var t = s.ask;
    if (s.vary) {
      var prev = S.data.contact_by;
      t = t.replace('{X}', s.vary[prev] || 'way to reach you');
    }
    /* A token with no answer behind it must never reach a customer as
       braces. It should not happen, every such step is guarded, but a
       question is worth asking clumsily rather than showing them {from}. */
    return t.replace(/\{([a-z_]+)\}/g, function (m, k) {
      return S.data[k] || 'the city';
    });
  }

  /* move to a step id, or forward by one, skipping anything hidden */
  function goTo(id) {
    var f = flow();
    for (var i = 0; i < f.steps.length; i++) {
      if (f.steps[i].id === id) { S.i = i; return; }
    }
    S.i = f.steps.length;
  }
  function advance(jump) {
    if (jump === '__end') { S.i = flow().steps.length; return run(); }
    if (jump) { goTo(jump); return run(); }
    S.i++;
    run();
  }

  /* Everything collected, written out the way a PA reads it back. The labels
   * and their order live in fwa-flows.js, so a new question appears here on
   * its own without this file changing. */
  function summary() {
    var L = F.labels || {}, out = [], seen = {};
    (F.order || []).forEach(function (k) {
      if (S.data[k] && L[k]) { out.push(L[k] + ': ' + S.data[k]); seen[k] = 1; }
    });
    for (var k in S.data) {
      if (!seen[k] && L[k] && S.data[k]) out.push(L[k] + ': ' + S.data[k]);
    }
    return out.join('\n');
  }

  function finish() {
    var name = (S.data.name || '').split(/[\s,]+/)[0] || '';
    var by = F.byWord[S.data.contact_by] || 'the details you gave';
    var t = (F.endings[S.svc] || 'Thank you. Andreea has everything.')
      .replace('{name}', name).replace(/,\s*\./, '.')
      .replace('{by}', by);
    add('andreea', t);
    S.done = true; save();
    tell('--- enquiry complete: ' + F[S.svc].label + ' ---', null, S.svc);
  }

  /* Nothing may be sent while the next line is on its way. Without this, a
   * fast typist can answer the question after next before it has been asked,
   * and the script advances twice on one answer. */
  var busy = false;
  function soon(fn, ms) {
    busy = true;
    startTyping();                 // she is composing, and it shows
    setTimeout(function () { busy = false; fn(); }, ms);
  }

  function run() {
    if (S.live) return;
    var f = flow();
    if (!f) return;
    if (S.i >= f.steps.length) return finish();

    var s = f.steps[S.i];
    if (!shows(s)) { S.i++; return run(); }
    save();

    if (s.type === 'end') return finish();

    add('andreea', wordFor(s));

    if (s.type === 'say') { soon(advance, BEAT + 400); return; }

    /* A summary, then a chance to correct it, before anything is handed over */
    if (s.type === 'review') {
      var sum = summary();
      soon(function () {
        add('andreea', sum || 'I do not seem to have anything recorded yet.');
        chips(s.options, function (label) {
          clearChips();
          add('visitor', label);
          if (s.field) { S.data[s.field] = label; save(); }
          tell(label, s.field || null, S.svc);
          var jump = (s.next && s.next[label]) || s.goto;
          soon(function () { advance(jump); }, BEAT);
        });
        lock(true, 'Tap an answer above, or write to Andreea');
      }, BEAT + 300);
      return;
    }

    if (s.type === 'chips') {
      chips(s.options, function (label) {
        clearChips();
        add('visitor', label);
        if (s.field) { S.data[s.field] = label; save(); }
        if (s.field) tell(label, s.field, S.svc); else tell(label, null, S.svc);
        if (s.action && s.action[label]) {
          try { window.location.href = s.action[label]; } catch (e) {}
        }
        var jump = (s.next && s.next[label]) || s.goto;
        soon(function () { advance(jump); }, BEAT);
      });
      lock(true, 'Tap an answer above, or write to Andreea');
      return;
    }

    if (s.type === 'multi') {
      var picked = [];
      chips(s.options, function (label, b) {
        if (label === '__done') {
          if (!picked.length) return;
          clearChips();
          var joined = picked.join(', ');
          add('visitor', joined);
          S.data[s.field] = joined; save();
          tell(joined, s.field, S.svc);
          soon(function () { advance(s.goto); }, BEAT);
          return;
        }
        var at = picked.indexOf(label);
        if (at > -1) { picked.splice(at, 1); b.className = ''; }
        else { picked.push(label); b.className = 'sel'; }
      }, { done: 'Done' });
      lock(true, 'Tap everything that applies, then Done');
      return;
    }

    /* text */
    if (s.optional) {
      chips(['Skip'], function () {
        clearChips();
        add('visitor', 'Skip');
        soon(function () { advance(s.goto); }, BEAT);
      }, { skip: 'Skip' });
    }
    lock(false, s.hint || 'Message');
  }

  function lock(on, hint) {
    tArea.placeholder = hint || 'Message';
    tArea.disabled = false;              // never actually blocked, they may always type
    sBtn.disabled = !tArea.value.trim();
    if (tArea.value) tArea.classList.add('has'); else tArea.classList.remove('has');
  }

  /* ------------------------------------------------- the service picker */
  function askService() {
    add('andreea', F.open.ask);
    chips(F.open.options, function (label) {
      clearChips();
      add('visitor', label);
      S.svc = F.open.map[label];
      S.i = 0; S.data = {}; save();
      tell(label, 'service', S.svc);
      soon(run, BEAT);
    });
    lock(true, 'Tap one above, or just write to Andreea');
  }

  /* --------------------------------------------------- Listen, off topic */
  /* mode 'all'    every aside, used when buttons were on screen
   *      'always' only the ones that could never be an answer
   *      'guard'  only the 2 that must fire anywhere: abuse, and card or
   *               passport or medical details. Used on a description box,
   *               where the whole point is to take the words as given. A
   *               budget written into a correction is a correction, not a
   *               question about price. */
  function asideFor(text, mode) {
    if (F.rude && F.rude.re.test(text)) return { hard: true, say: F.rude.say };
    for (var i = 0; i < F.aside.length; i++) {
      var a = F.aside[i];
      if (a.only && a.only !== S.svc) continue;
      if (mode === 'guard' && a.k !== 'sensitive') continue;
      if (mode === 'always' && !a.always) continue;
      if (a.re.test(text)) return a;
    }
    return null;
  }
  function looksLikeAQuestion(t) {
    return /\?\s*$/.test(t) || /^(how|what|who|why|when|where|can|could|do|does|did|is|are|will|would|should)\b/i.test(t);
  }

  function handleTyped(text) {
    var s = step();

    /* nothing is running: she is live, or the script is finished */
    if (S.live || S.done || !s) { tell(text, null, S.svc); return; }

    var expectingText = (s.type === 'text');
    var a = null;

    if (expectingText && s.raw) {
      /* a description box. Take the words, whatever is in them. */
      a = asideFor(text, 'guard');
    } else if (!expectingText) {
      /* chips were on screen, so anything typed is an aside by definition */
      a = asideFor(text, 'all') || { say: F.unknown };
    } else if (looksLikeAQuestion(text)) {
      a = asideFor(text, 'all');
      if (!a && text.length < 60) a = { say: F.unknown };
    } else {
      /* an answer is expected, so only the patterns that could never be an
         answer are looked for */
      a = asideFor(text, 'always');
    }

    if (a) {
      /* `escalate` means they asked for a person. The script stops there and
         does not resume, because carrying on asking questions after somebody
         has asked for a human is the rudest thing a chat can do. */
      tell(text, a.escalate ? '__escalate' : null, S.svc);
      soon(function () {
        add('andreea', a.say);
        if (a.hard) return;
        if (a.escalate) { S.live = true; save(); lock(false, 'Message'); return; }
        soon(function () {
          add('andreea', F.resume);
          S.i--;                       // run() will put the same question back
          advance();
        }, BEAT + 260);
      }, BEAT);
      return;
    }

    /* a real answer to a text question */
    if (s.field) { S.data[s.field] = text; save(); }
    tell(text, s.field || null, S.svc);
    clearChips();
    soon(function () { advance((s.next && s.next[text]) || s.goto); }, BEAT);
  }

  function send(text) {
    text = (text || '').trim();
    if (!text || busy) return;
    if (text.length > MAXLEN) text = text.slice(0, MAXLEN);
    add('visitor', text);
    handleTyped(text);
  }

  /* ------------------------------------------------------------------ poll */
  var timer = null;
  function poll() {
    if (!S.conv) return;
    fetch(API + '/poll?conv=' + encodeURIComponent(S.conv)
          + '&key=' + encodeURIComponent(S.key || '') + '&after=' + S.after)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (r) {
        if (!r || !r.msgs || !r.msgs.length) return;
        clearChips();
        for (var i = 0; i < r.msgs.length; i++) {
          add('andreea', r.msgs[i].body);
          S.after = Math.max(S.after, r.msgs[i].id);
        }
        S.live = true; save();            // she is here, the script steps aside
        lock(false, 'Message');
        if (!pan.classList.contains('on')) {
          btn.classList.add('new'); S.seen = false; save();
        }
      })['catch'](function () {});
  }
  function retime() {
    if (timer) clearInterval(timer);
    timer = setInterval(poll, pan.classList.contains('on') ? POLL_OPEN : POLL_SHUT);
  }

  /* ---------------------------------------------------------------- events */
  function open() {
    pan.classList.add('on'); btn.classList.add('on'); btn.classList.remove('new');
    S.seen = true; save();
    if (!S.log.length) { if (!mBox.querySelector('.fwac-day')) dayLine(); askService(); }
    tArea.focus(); scroll(); retime(); poll();
  }
  function shut() { pan.classList.remove('on'); btn.classList.remove('on'); retime(); }

  xBtn.addEventListener('click', shut);

  btn.addEventListener('click', function () {
    pan.classList.contains('on') ? shut() : open();
  });
  sBtn.addEventListener('click', function () {
    var v = tArea.value; tArea.value = ''; grow(); send(v); tArea.focus();
  });
  tArea.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      var v = tArea.value; tArea.value = ''; grow(); send(v);
    }
  });
  function grow() {
    tArea.style.height = 'auto';
    tArea.style.height = Math.max(38, Math.min(tArea.scrollHeight, 96)) + 'px';
    sBtn.disabled = !tArea.value.trim();
    if (tArea.value) tArea.classList.add('has'); else tArea.classList.remove('has');
  }
  tArea.addEventListener('input', grow);
  grow();
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && pan.classList.contains('on')) shut();
  });

  /* ---------------------------------------------------------------- resume */
  if (S.log.length) { redraw(); if (!S.seen) btn.classList.add('new'); }
  retime();
  if (S.conv) poll();

  window.fwaChat = {
    open: open, close: shut,
    state: function () { return S; },
    send: function (t) { send(t); }
  };
})();
