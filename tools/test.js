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
function call(handler, { method = 'POST', body = {}, origin = 'https://scam-shield-blond.vercel.app', ip = '1.1.1.1' } = {}) {
  return new Promise(resolve => {
    const res = { headers: {}, code: 200, setHeader(k, v) { this.headers[k] = v; },
      status(c) { this.code = c; return this; }, json(d) { resolve({ code: this.code, data: d, headers: this.headers }); }, end() { resolve({ code: this.code }); } };
    handler({ method, body, headers: { origin, host: 'scam-shield-blond.vercel.app', 'x-forwarded-for': ip } }, res);
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

  console.log('Offline checker (js/checker.js)');
  const vm = require('vm'); const ctx = {}; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/data.js'), 'utf8') + ';globalThis.D={SCAM_TYPES,SPOT_EXAMPLES,RED_FLAGS};', ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/checker.js'), 'utf8'), ctx);
  const flags = t => ctx.ScamChecker.findFlags(t, ctx.D.RED_FLAGS);
  const level = t => { const r = flags(t).reduce((n, f) => n + f.flag.weight, 0); return r >= 6 ? 'high' : r >= 3 ? 'medium' : 'low'; };
  const ids = t => flags(t).map(f => f.flag.id);
  const FG = 'FG N50,000 Naira Cash Transfer Ongoning, No BVN Required\n\nThe Federal Government Of Nigeria through The Minister of Humanitarian Affairs is Giving out N50,000 Cash Transfer to All Nigerians, i just got mine.\n\nGet Yours Here Now\nhttps://fg-cash.example/fg50k\n\nSHARE WITH EVERYONE';
  await ok('"No BVN required" is NOT read as asking for a BVN', () => assert.ok(!ids(FG).includes('secret')));
  await ok('"Cash transfer to all Nigerians" is NOT read as asking you to pay', () => assert.ok(!ids(FG).includes('pay')));
  await ok('fake government cash message is HIGH with the right red flags', () => {
    assert.strictEqual(level(FG), 'high');
    ['freemoney', 'chain', 'identity', 'link', 'urgent'].forEach(id => assert.ok(ids(FG).includes(id), id));
  });
  await ok('"We will never ask for your PIN" is a warning, not a request', () => assert.ok(!ids('We will never ask for your PIN or OTP.').includes('secret')));
  await ok('"Enter your PIN and OTP" IS a request', () => assert.ok(ids('Enter your PIN and OTP at kudi.example now.').includes('secret')));
  await ok('every made-up scam example is MEDIUM or HIGH', () => {
    const all = [].concat(...ctx.D.SCAM_TYPES.map(t => t.examples), ctx.D.SPOT_EXAMPLES.filter(e => e.scam).map(e => e.parts.map(p => p.t).join('')));
    all.forEach(t => assert.notStrictEqual(level(t), 'low', 'missed: ' + t.slice(0, 60)));
  });
  await ok('every safe example is LOW', () => {
    ctx.D.SPOT_EXAMPLES.filter(e => !e.scam).forEach(e => { const t = e.parts.map(p => p.t).join(''); assert.strictEqual(level(t), 'low', 'false alarm: ' + t.slice(0, 60)); });
  });

  console.log('SEO / AEO / GEO pages');
  const DIRS = ['scams', 'is-it-real', 'help', 'on', 'for', 'meaning', 'signs'];
  const htmls = ['index.html', 'faq/index.html', 'radar/index.html', 'widget/index.html',
    ...DIRS.flatMap(dir => [`${dir}/index.html`, ...fs.readdirSync(path.join(ROOT, dir)).filter(d => !d.includes('.')).map(d => `${dir}/${d}/index.html`)])];
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

  // ---------- VERSION 3: the Scam Library, the Radar and the widget ----------
  const L = require('./library');
  await ok('library: every page has a unique address and every link points to a real page', () => {
    const slugs = L.NAMED.map(n => n[0]);
    assert.strictEqual(new Set(slugs).size, slugs.length);
    [...L.CHANNELS.map(c => c[3]), ...L.PEOPLE.map(c => c[3]), ...L.TERMS.map(t => [t[4]])].flat().forEach(x => assert.ok(slugs.includes(x), x));
    slugs.forEach(x => assert.ok(fs.existsSync(path.join(ROOT, 'is-it-real', x, 'index.html')), x));
  });
  await ok('library: examples are made up (no real links, no phone numbers)', () => {
    L.NAMED.forEach(n => {
      (n[4].match(/\b[\w-]+\.(com|ng|net|org|app|site|xyz)\b/gi) || []).forEach(l => assert.fail(n[0] + ' has a real-looking link: ' + l));
      [n[3], n[4], n[6]].forEach(t => assert.ok(!/\b0[789]\d{9}\b|\+234/.test(t), n[0] + ' has a phone number'));
    });
    L.HELP.forEach(h => assert.ok(!/\b0[789]\d{9}\b|\+234/.test(h.flat().join(' ')), h[0]));
  });
  await ok('library: the offline checker flags most of our own examples', () => {
    const vm = require('vm');
    const D = vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/data.js'), 'utf8') + '\n;({ RED_FLAGS })', {});
    require('../js/checker.js');
    const risky = L.NAMED.filter(n => globalThis.ScamChecker.findFlags(n[4], D.RED_FLAGS).reduce((a, f) => a + f.flag.weight, 0) >= 3).length;
    assert.ok(risky / L.NAMED.length >= 0.8, risky + ' of ' + L.NAMED.length);
  });
  await ok('library pages: quick answer first, one canonical, FAQ schema', () => {
    const h = fs.readFileSync(path.join(ROOT, 'is-it-real/fg-grant-message/index.html'), 'utf8');
    assert.ok(h.indexOf('answer-box') < h.indexOf('<h2>')); assert.strictEqual((h.match(/rel="canonical"/g) || []).length, 1);
    assert.ok(h.includes('"FAQPage"')); assert.ok(h.includes('/signs/'));
  });
  await ok('radar: its lists match the checker', () => {
    const vm = require('vm');
    const D = vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/data.js'), 'utf8') + '\n;({ RED_FLAGS, SCAM_TYPES })', {});
    const R = require('../api/radar.js');
    assert.strictEqual([...R.FLAGS].sort().join(), Array.from(D.RED_FLAGS, f => f.id).sort().join());
    D.SCAM_TYPES.forEach(t => assert.ok(R.TYPES.includes(t.id), t.id));
  });
  await ok('radar: without a database it says "not switched on" and never crashes', async () => {
    delete process.env.KV_REST_API_URL; delete process.env.UPSTASH_REDIS_REST_URL;
    const R = require('../api/radar.js');
    const g = await call(R, { method: 'GET' }); assert.strictEqual(g.data.live, false);
    const p = await call(R, { body: { type: 'phishing', flags: ['secret'] }, ip: '7.7.7.1' }); assert.strictEqual(p.data.counted, false);
  });
  await ok('radar: only labels from our list are counted, never text', async () => {
    process.env.KV_REST_API_URL = 'https://db.example'; process.env.KV_REST_API_TOKEN = 't';
    const real = global.fetch; let sent = null;
    global.fetch = async (u, o) => { sent = JSON.parse(o.body); return { ok: true, json: async () => sent.map(() => ({ result: 1 })) }; };
    const R = require('../api/radar.js');
    const r = await call(R, { body: { type: 'my secret message 08012345678', flags: ['secret', 'secret', 'DROP TABLE', 'urgent'] }, ip: '7.7.7.2' });
    assert.strictEqual(r.data.counted, true);
    const text = JSON.stringify(sent);
    assert.ok(text.includes('t:other') && text.includes('f:secret') && text.includes('f:urgent'));
    assert.ok(!text.includes('DROP') && !text.includes('0801'));
    assert.strictEqual(sent.filter(c => c[2] === 'f:secret').length, 1);
    const bad = await call(R, { body: { flags: ['nonsense'] }, ip: '7.7.7.3' }); assert.strictEqual(bad.code, 400);
    global.fetch = async () => ({ ok: true, json: async () => [{ result: ['total', '5', 't:phishing', '3', 'f:secret', '3'] }, ...Array(6).fill({ result: [] })] });
    const g = await call(R, { method: 'GET' }); assert.strictEqual(g.data.total, 5); assert.strictEqual(g.data.types[0].id, 'phishing');
    global.fetch = real; delete process.env.KV_REST_API_URL; delete process.env.KV_REST_API_TOKEN;
  });
  await ok('widget: /embed may be shown inside other websites, other pages may not', () => {
    const v = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
    const rule = v.headers.find(h => h.headers.some(x => x.key === 'X-Frame-Options'));
    assert.ok(new RegExp('^' + rule.source + '$').test('/scams/phishing')); assert.ok(!new RegExp('^' + rule.source + '$').test('/embed'));
    assert.ok(fs.readFileSync(path.join(ROOT, 'embed.html'), 'utf8').includes('noindex'));
  });
  await ok('no API key is written in any website file', () => {
    const files = ['index.html', 'js/app.js', 'js/config.js', 'js/data.js', 'js/checker.js'];
    files.forEach(f => assert.ok(!/sk-[A-Za-z0-9_-]{20,}/.test(fs.readFileSync(path.join(ROOT, f), 'utf8')), f));
  });

  console.log(`\nAll ${passed} checks passed.`);
})().catch(e => { console.error('\n  ✗ FAILED:', e.message); process.exit(1); });
