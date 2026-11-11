#!/usr/bin/env node
/* =====================================================================
   tools/test.js  -  checks the API and the SEO pages WITHOUT a real key
   Run:  npm test      (or: node tools/test.js)
   We pretend to be OpenAI with a fake "fetch", so no money is spent.
   ===================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const ROOT = path.join(__dirname, '..');
let passed = 0;
const ok = (name, fn) => Promise.resolve().then(fn).then(() => { passed++; console.log('  ✓', name); });

// A fake request and response, like Vercel gives us
function call(handler, { method = 'POST', body = {}, origin = 'https://scam-shield.vercel.app', ip = '1.1.1.1' } = {}) {
  return new Promise(resolve => {
    const res = { headers: {}, code: 200, setHeader(k, v) { this.headers[k] = v; },
      status(c) { this.code = c; return this; }, json(d) { resolve({ code: this.code, data: d, headers: this.headers }); }, end() { resolve({ code: this.code }); } };
    handler({ method, body, headers: { origin, host: 'scam-shield.vercel.app', 'x-forwarded-for': ip } }, res);
  });
}

// The fake OpenAI: always answers with this
let openaiCalls = 0;
const FAKE = {
  verdict: 'likely_scam', confidence: 93, type: 'Phishing',
  flags: [{ quote: 'enter your PIN and OTP', why: 'Banks never ask for these.' }, { quote: 'words that are NOT in the message', why: 'made up' }],
  explain: 'This message wants your secret codes.', steps: ['Do not click', 'Tell a trusted adult']
};
global.fetch = async (url) => {
  if (String(url).includes('openai.com')) {
    openaiCalls++;
    return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify(url.includes('x') ? FAKE : FAKE) } }] }) };
  }
  if (String(url).includes('safebrowsing')) return { ok: true, json: async () => ({ matches: [{ threat: { url: 'http://kudikudi-secure-login.example' } }] }) };
  throw new Error('unexpected fetch ' + url);
};

(async () => {
  console.log('API');
  delete process.env.OPENAI_API_KEY;
  const check = require('../api/check');
  const ask = require('../api/ask');
  const S = require('../api/_lib/shared');
  const MSG = 'Kudikudi Bank ALERT: account BLOCKED. Visit http://kudikudi-secure-login.example and enter your PIN and OTP. Call 0803 123 4567 or mail me@x.com';

  await ok('without a key the helper says it is switched off (503)', async () => {
    const r = await call(check, { body: { text: MSG } }); assert.strictEqual(r.code, 503); assert.ok(r.data.offline);
  });
  process.env.OPENAI_API_KEY = 'test-key';
  process.env.SAFE_BROWSING_KEY = 'test-key';

  await ok('phone numbers and emails are hidden', () => {
    const h = S.hidePersonal(MSG); assert.ok(!h.includes('0803')); assert.ok(!h.includes('me@x.com')); assert.ok(h.includes('[hidden number]'));
  });
  await ok('only GET is refused (405)', async () => { assert.strictEqual((await call(check, { method: 'GET' })).code, 405); });
  await ok('a strange website is blocked (403)', async () => { assert.strictEqual((await call(check, { origin: 'https://evil.example', body: { text: MSG } })).code, 403); });
  await ok('a too-short message is refused (400)', async () => { assert.strictEqual((await call(check, { body: { text: 'hi' } })).code, 400); });
  await ok('a real check returns a clean answer', async () => {
    const r = await call(check, { body: { text: MSG } });
    assert.strictEqual(r.code, 200);
    assert.strictEqual(r.data.verdict, 'likely_scam');
    assert.strictEqual(r.data.flags.length, 1, 'made-up quotes must be removed');
    assert.ok(r.data.links.checked && r.data.links.dangerous.length === 1, 'Safe Browsing result included');
    assert.ok(r.data.confidence >= 95, 'dangerous link raises confidence');
  });
  await ok('the same message again comes from the cache (no new OpenAI call)', async () => {
    const before = openaiCalls; const r = await call(check, { body: { text: MSG } });
    assert.ok(r.data.cached); assert.strictEqual(openaiCalls, before);
  });
  await ok('fair-use limit kicks in after 30 checks per hour', async () => {
    let last;
    for (let i = 0; i < 31; i++) last = await call(check, { ip: '9.9.9.9', body: { text: MSG + ' ' + i } });
    assert.strictEqual(last.code, 429);
  });
  await ok('the AI tutor answers a question', async () => {
    FAKE.answer = 'Never share your OTP.'; FAKE.followups = ['What is phishing?'];
    const r = await call(ask, { body: { question: 'Can POS agents ask for my OTP?' } });
    assert.strictEqual(r.code, 200); assert.ok(r.data.answer.length > 0);
  });

  console.log('SEO / AEO / GEO pages');
  const htmls = ['index.html', 'faq/index.html', 'scams/index.html', ...fs.readdirSync(path.join(ROOT, 'scams')).filter(d => !d.includes('.')).map(d => `scams/${d}/index.html`)];
  for (const f of htmls) {
    await ok(f + ': title, description, canonical, one h1, valid JSON-LD', () => {
      const h = fs.readFileSync(path.join(ROOT, f), 'utf8');
      assert.ok(/<title>.{10,72}<\/title>/.test(h), 'title 10-72 characters');
      const desc = ((h.match(/<meta name="description" content="([^"]*)">/) || [])[1] || '').replace(/&#39;|&amp;|&quot;/g, 'x');
      assert.ok(desc.length >= 50 && desc.length <= 165, 'description 50-165 characters (' + desc.length + ')');
      assert.ok(h.includes('rel="canonical"'), 'canonical');
      if (f !== 'index.html') assert.strictEqual((h.match(/<h1/g) || []).length, 1, 'exactly one h1');
      const ld = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
      assert.ok(ld.length, 'has JSON-LD'); ld.forEach(m => JSON.parse(m[1]));
    });
  }
  await ok('sitemap, robots and llms.txt exist and agree', () => {
    const sm = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
    const rb = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8');
    const ll = fs.readFileSync(path.join(ROOT, 'llms.txt'), 'utf8');
    assert.ok(rb.includes('Sitemap:')); assert.ok(ll.startsWith('# Scam Shield'));
    assert.strictEqual((sm.match(/<url>/g) || []).length, htmls.length);
  });
  await ok('no API key is written in any website file', () => {
    const files = ['index.html', 'js/app.js', 'js/config.js', 'js/data.js'];
    files.forEach(f => assert.ok(!/sk-[A-Za-z0-9_-]{20,}/.test(fs.readFileSync(path.join(ROOT, f), 'utf8')), f));
  });

  console.log(`\nAll ${passed} checks passed.`);
})().catch(e => { console.error('\n  ✗ FAILED:', e.message); process.exit(1); });
