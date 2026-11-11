#!/usr/bin/env node
/* =====================================================================
   tools/dev.js  -  run Scam Shield on your own computer, like Vercel does
     OPENAI_API_KEY=sk-...  node tools/dev.js      (real AI answers)
     MOCK=1 node tools/dev.js                      (pretend AI, free)
   Then open http://localhost:3000
   ===================================================================== */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.PORT || 3000);
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml' };

if (process.env.MOCK) {                       // pretend to be OpenAI so practice costs nothing
  process.env.OPENAI_API_KEY = 'mock';
  const real = global.fetch;
  global.fetch = async (url, opts) => {
    if (!String(url).includes('openai.com')) return real(url, opts);
    const msg = JSON.parse(opts.body).messages[1].content;
    const quote = (msg.match(/(PIN[^.\n]{0,20}|OTP|processing fee|guaranteed|it's me)/i) || [])[0];
    const reply = /QUESTION:/.test(msg)
      ? { answer: 'This is a practice answer from MOCK mode. With a real key, the AI tutor answers here.', followups: ['What is phishing?', 'What is an OTP?'] }
      : { verdict: quote ? 'likely_scam' : 'looks_safe', confidence: quote ? 90 : 70, type: quote ? 'Phishing' : 'Safe message',
          flags: quote ? [{ quote, why: 'Practice reason from MOCK mode.' }] : [], explain: 'MOCK mode answer: use a real key for real AI thinking.',
          steps: ['Do not click any link', 'Tell a trusted adult'] };
    return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify(reply) } }] }) };
  };
}

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/')) {
    const file = path.join(ROOT, 'api', path.basename(url.pathname) + '.js');
    if (!fs.existsSync(file)) { res.writeHead(404); return res.end(); }
    let raw = ''; req.on('data', c => raw += c); req.on('end', () => {
      try { req.body = JSON.parse(raw || '{}'); } catch (e) { req.body = {}; }
      res.status = c => { res.statusCode = c; return res; };
      res.json = d => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(d)); };
      require(file)(req, res);
    });
    return;
  }
  let p = path.join(ROOT, decodeURIComponent(url.pathname));
  if (!p.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
  if (!fs.existsSync(p)) { res.writeHead(404, { 'Content-Type': TYPES['.html'] }); return fs.createReadStream(path.join(ROOT, '404.html')).pipe(res); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
}).listen(PORT, () => console.log(`Scam Shield running at http://localhost:${PORT}${process.env.MOCK ? '  (MOCK AI)' : ''}`));
