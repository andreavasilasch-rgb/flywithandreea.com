/* Fly with Andreea — World Cup Fan Vote API (Cloudflare Worker + D1).
   Binding: DB -> flywithandreea-worldcup-votes (id 76d9ab21-a2e3-4181-b82a-29a895252983) */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};
function json(o, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', ...CORS } });
}
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    try {
      // GET /api/tally-all  -> { matchId: { team: count } }
      if (url.pathname === '/api/tally-all') {
        const { results } = await env.DB.prepare(
          'SELECT match_id, team, COUNT(*) AS c FROM votes GROUP BY match_id, team'
        ).all();
        const out = {};
        for (const r of results) { (out[r.match_id] = out[r.match_id] || {})[r.team] = r.c; }
        return json(out);
      }
      // POST /api/vote  { voter, match, team }
      if (url.pathname === '/api/vote' && req.method === 'POST') {
        const b = await req.json();
        if (!b || !b.voter || !b.match || !b.team) return json({ error: 'missing fields' }, 400);
        await env.DB.prepare(
          'INSERT INTO votes(voter_id, match_id, team, updated_at) VALUES(?1,?2,?3,?4) ' +
          'ON CONFLICT(voter_id, match_id) DO UPDATE SET team=?3, updated_at=?4'
        ).bind(String(b.voter).slice(0,64), String(b.match).slice(0,64), String(b.team).slice(0,80), Date.now()).run();
        const { results } = await env.DB.prepare(
          'SELECT team, COUNT(*) AS c FROM votes WHERE match_id=?1 GROUP BY team'
        ).bind(String(b.match).slice(0,64)).all();
        const teams = {}; for (const r of results) teams[r.team] = r.c;
        return json({ match: b.match, teams });
      }
      return json({ error: 'not found' }, 404);
    } catch (e) {
      return json({ error: String(e && e.message || e) }, 500);
    }
  }
};
