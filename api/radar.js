/* =====================================================================
   /api/radar   - THE SCAM RADAR (anonymous counters)
   ---------------------------------------------------------------------
   POST { type, flags[] }  adds 1 to today's counter for that KIND of scam
                           and for each warning sign.
   GET                     returns the totals for the last 7 days.

   PRIVACY BY DESIGN: the message itself is never sent here. We only
   receive short labels from a fixed list (below). Anything else is
   thrown away, so nobody can sneak text into the counters.

   The counters live in a small free database (Upstash Redis, added from
   the Vercel "Storage" tab). Until an adult adds it, the radar politely
   says it is not switched on, and everything else keeps working.
   ===================================================================== */
'use strict';
const S = require('./_lib/shared');

const TYPES = ['phishing', 'prize', 'romance', 'shopping', 'tech', 'invest', 'job', 'impersonate', 'other'];
const FLAGS = ['secret', 'pay', 'urgent', 'prize', 'freemoney', 'fakealert', 'chain', 'toogood', 'link', 'secrecy', 'identity', 'control', 'love'];
const DAYS = 7;

const DB_URL = () => (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/$/, '');
const DB_TOKEN = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const day = (back = 0) => new Date(Date.now() - back * 86400000).toISOString().slice(0, 10);

async function db(commands) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const r = await fetch(DB_URL() + '/pipeline', { method: 'POST', signal: ctrl.signal,
      headers: { Authorization: 'Bearer ' + DB_TOKEN(), 'Content-Type': 'application/json' }, body: JSON.stringify(commands) });
    if (!r.ok) throw new Error('The database said ' + r.status);
    return r.json();
  } finally { clearTimeout(timer); }
}

let memo = null;   // the totals are remembered for 5 minutes so the database is not asked on every visit

module.exports = async function handler(req, res) {
  if (!S.allowOrigin(req, res)) return res.status(403).json({ error: 'This website is not allowed to use the Scam Radar.' });
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const live = !!(DB_URL() && DB_TOKEN());

  if (req.method === 'GET') {
    if (!live) return res.status(200).json({ live: false, days: DAYS, total: 0, types: [], flags: [] });
    if (memo && Date.now() - memo.t < 300000) return res.status(200).json(memo.v);
    try {
      const rows = await db(Array.from({ length: DAYS }, (_, i) => ['HGETALL', 'radar:' + day(i)]));
      const sum = {};
      rows.forEach(row => { const a = (row && row.result) || []; for (let i = 0; i < a.length; i += 2) sum[a[i]] = (sum[a[i]] || 0) + Number(a[i + 1] || 0); });
      const pick = (prefix, list) => list.map(id => ({ id, count: sum[prefix + id] || 0 })).filter(x => x.count).sort((a, b) => b.count - a.count);
      const v = { live: true, days: DAYS, total: sum.total || 0, types: pick('t:', TYPES), flags: pick('f:', FLAGS), updated: new Date().toISOString() };
      memo = { t: Date.now(), v };
      return res.status(200).json(v);
    } catch (e) { console.error('radar read:', e.message); return res.status(200).json({ live: false, days: DAYS, total: 0, types: [], flags: [] }); }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Use GET or POST.' });
  if (!S.allowed(S.visitor(req) + ':radar', 30)) return res.status(429).json({ error: 'Too many.' });
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};
  const type = TYPES.includes(body.type) ? body.type : 'other';                       // only labels from OUR list
  const flags = [...new Set(Array.isArray(body.flags) ? body.flags : [])].filter(f => FLAGS.includes(f)).slice(0, FLAGS.length);
  if (!flags.length) return res.status(400).json({ error: 'Nothing to count.' });
  if (!live) return res.status(200).json({ counted: false, live: false });
  try {
    const key = 'radar:' + day();
    await db([['HINCRBY', key, 'total', 1], ['HINCRBY', key, 't:' + type, 1]].concat(flags.map(f => ['HINCRBY', key, 'f:' + f, 1]), [['EXPIRE', key, 15 * 86400]]));
    return res.status(200).json({ counted: true, live: true });
  } catch (e) { console.error('radar write:', e.message); return res.status(200).json({ counted: false, live: true }); }
};
module.exports.TYPES = TYPES; module.exports.FLAGS = FLAGS;
