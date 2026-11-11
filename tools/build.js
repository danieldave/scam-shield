#!/usr/bin/env node
/* =====================================================================
   tools/build.js  -  makes the pages search engines and AI can read
   ---------------------------------------------------------------------
   The main app (index.html) changes pages with JavaScript, so Google sees
   only ONE page. This script turns our content into REAL pages:

     /scams/                 all scam guides
     /scams/<type>/          one guide per scam type   (SEO + AEO)
     /faq/                   every question and answer (AEO: FAQ schema)
     /sitemap.xml            the list of pages for Google and Bing
     /robots.txt             says who may read the site (incl. AI search)
     /llms.txt               a short summary for AI assistants (GEO)

   Run it every time you change js/data.js or tools/guides.js:
       node tools/build.js
   The website address comes from tools/site.json.
   ===================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const SITE = JSON.parse(fs.readFileSync(path.join(__dirname, 'site.json'), 'utf8'));
const URL_ = SITE.url.replace(/\/$/, '');
const TODAY = new Date().toISOString().slice(0, 10);
const GUIDES = require('./guides');

// Read js/data.js exactly as the browser does, then pick out the lists.
const code = fs.readFileSync(path.join(ROOT, 'js/data.js'), 'utf8');
const D = vm.runInNewContext(code + '\n;({ SCAM_TYPES, SPOT_EXAMPLES, QA, QUIZ, WHAT_TO_DO, QUICK_TIPS, RED_FLAGS })', {});

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const json = obj => JSON.stringify(obj).replace(/</g, '\\u003c');
const write = (rel, text) => {
  const file = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
  console.log('  wrote', rel);
};

const PUBLISHER = {
  '@type': 'EducationalOrganization',
  '@id': URL_ + '/#org',
  name: SITE.publisher,
  url: URL_ + '/',
  logo: URL_ + '/images/logo.svg',
  address: { '@type': 'PostalAddress', addressLocality: 'Ilaro', addressRegion: 'Ogun State', addressCountry: 'NG' },
  parentOrganization: { '@type': 'Organization', name: SITE.parent }
};

// ---------- one shared page frame ----------
function page({ rel, title, description, h1, crumbs, body, schema }) {
  const url = URL_ + '/' + rel.replace(/index\.html$/, '');
  const graph = [PUBLISHER, {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: URL_ + c[1] }))
  }].concat(schema || []);
  return `<!doctype html>
<html lang="en-NG">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
<meta name="theme-color" content="#12305A">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Scam Shield">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${URL_}/images/og-image.png">
<meta property="og:locale" content="en_NG">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/images/logo.svg">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="stylesheet" href="/css/style.css">
<script type="application/ld+json">${json({ '@context': 'https://schema.org', '@graph': graph })}</script>
</head>
<body>
<header class="topbar simple-top">
  <a class="brand" href="/" aria-label="Scam Shield home"><img src="/images/logo.svg" alt="" width="40" height="40"><span><b>Scam Shield</b><small>Think · Spot · Stay Safe</small></span></a>
  <nav class="topnav" aria-label="Main">
    <a href="/scams/">Scam guides</a><a href="/faq/">FAQ</a><a href="/#verify">Verify a message</a><a href="/#quiz">Quiz</a>
  </nav>
</header>
<main class="guide">
  <nav class="crumbs" aria-label="Breadcrumb">${crumbs.map((c, i) => i < crumbs.length - 1 ? `<a href="${c[1]}">${esc(c[0])}</a> › ` : esc(c[0])).join('')}</nav>
  <h1>${esc(h1)}</h1>
${body}
  <p class="updated">Written by students of the ${esc(SITE.publisher)}. Last updated <time datetime="${TODAY}">${TODAY}</time>. All example messages are made up for learning.</p>
</main>
<footer class="foot">
  <p><b>Scam Shield</b> is an educational awareness tool made by students, not a commercial fraud-detection system.</p>
  <p class="copyright">&copy; ${TODAY.slice(0, 4)} ${esc(SITE.publisher)}</p>
</footer>
</body>
</html>
`;
}

const ctas = `<div class="cta"><a class="btn" href="/#verify">Check a message you got</a><a class="btn ghost" href="/#spot">Practise: Spot It</a><a class="btn ghost" href="/#quiz">Take the quiz</a></div>`;
const doSteps = `<ol>${D.WHAT_TO_DO.map(s => `<li><b>${esc(s.title)}.</b> ${esc(s.text)}</li>`).join('')}</ol>`;
const pages = [{ loc: '/', pri: '1.0' }];
// Which Spot It practice messages belong on which guide page
const SPOT_FOR = {
  phishing: ['Phishing', 'Account takeover'], prize: ['Fake prize', 'Fake free data'], romance: [],
  shopping: ['Online shopping', 'Delivery fee', 'Fake payment alert'], tech: ['Tech support'],
  invest: ['Investment', 'Loan scam'], job: ['Fake job', 'Fake grant'], impersonate: ['Impersonation', 'Exam scam']
};

// ---------- /scams/<type>/ ----------
console.log('Building Scam Shield pages for', URL_);
D.SCAM_TYPES.forEach(t => {
  const g = GUIDES[t.id];
  if (!g) throw new Error('tools/guides.js has no guide for "' + t.id + '". Add one, then build again.');
  const rel = `scams/${t.id}/index.html`;
  const name = t.title.replace(/ Scams?$/, '');
  const an = /^[aeiou]/i.test(g.search) ? 'an' : 'a';
  const title = `${g.search[0].toUpperCase() + g.search.slice(1)}: signs, examples & what to do | Scam Shield`;
  const faq = [[`What is ${an} ${g.search}?`, g.answer], [`What should I do if I fell for ${an} ${g.search}?`, g.caught]].concat(g.faq);
  const spots = D.SPOT_EXAMPLES.filter(e => e.scam && (SPOT_FOR[t.id] || []).includes(e.type));
  const body = `
  <p class="answer-box"><b>Quick answer:</b> ${esc(g.answer)}</p>
  <img class="hero-img" src="/images/types/${t.icon}.svg" alt="Cartoon picture of ${an} ${esc(g.search)}" width="360" height="225">
  <h2>Warning signs of ${esc(name.toLowerCase())} scams</h2>
  <ul class="redflags">${t.flags.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
  <h2>How this scam works, step by step</h2>
  <ol>${g.how.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
  <h2>Example messages (made up)</h2>
  ${t.examples.concat(spots.map(e => e.parts.map(p => p.t).join(''))).map((m, i) => `<div class="msg"><small>Made-up example ${i + 1}</small>${esc(m)}</div>`).join('')}
  <h2>What to do if you get one</h2>
  ${doSteps}
  <h2>What to do if you already clicked, replied or paid</h2>
  <p>${esc(g.caught)}</p>
  <h2>Questions people ask</h2>
  ${faq.map(([q, a]) => `<div class="faq-item"><h3>${esc(q)}</h3><p>${esc(a)}</p></div>`).join('')}
  ${ctas}
  <h2>Other scams to know</h2>
  <ul class="grid-links">${D.SCAM_TYPES.filter(x => x.id !== t.id).map(x => `<li><a href="/scams/${x.id}/"><b>${esc(x.title)}</b>${esc(x.short)}</a></li>`).join('')}</ul>`;
  write(rel, page({
    rel, title, h1: `${t.title}: how to spot them and what to do`,
    description: g.answer.length > 155 ? g.answer.slice(0, 150).replace(/\s\S*$/, '') + '…' : g.answer,
    crumbs: [['Home', '/'], ['Scam guides', '/scams/'], [t.title, `/scams/${t.id}/`]],
    body,
    schema: [
      { '@type': 'Article', headline: `${t.title}: how to spot them and what to do`, description: g.answer, inLanguage: 'en-NG',
        image: URL_ + '/images/og-image.png', datePublished: '2026-10-30', dateModified: TODAY,
        author: { '@id': URL_ + '/#org' }, publisher: { '@id': URL_ + '/#org' }, mainEntityOfPage: URL_ + `/scams/${t.id}/`,
        about: { '@type': 'Thing', name: g.search }, educationalLevel: 'Secondary school', audience: { '@type': 'EducationalAudience', educationalRole: 'student' } },
      { '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
      { '@type': 'HowTo', name: `What to do if you get ${an} ${g.search} message`, step: D.WHAT_TO_DO.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.title, text: s.text })) }
    ]
  }));
  pages.push({ loc: `/scams/${t.id}/`, pri: '0.8' });
});

// ---------- /scams/ ----------
write('scams/index.html', page({
  rel: 'scams/index.html',
  title: 'Common scams in Nigeria explained for students | Scam Shield',
  description: `Simple guides to the ${D.SCAM_TYPES.length} online scams young people in Nigeria meet most: phishing, fake prizes, fake jobs and more. Signs and what to do.`,
  h1: 'Scam guides: the most common online scams, explained simply',
  crumbs: [['Home', '/'], ['Scam guides', '/scams/']],
  body: `
  <p class="answer-box"><b>Quick answer:</b> Most online scams try one of three things: get your money, get your secret codes (PIN, OTP, password, BVN), or get control of your phone or account. They all use pressure, so the best defence is to stop, check and ask a trusted adult.</p>
  <ul class="grid-links">${D.SCAM_TYPES.map(t => `<li><a href="/scams/${t.id}/"><img src="/images/types/${t.icon}.svg" alt="" loading="lazy" width="240" height="110"><b>${esc(t.title)}</b>${esc(t.short)}</a></li>`).join('')}</ul>
  <h2>The 5 steps that work against every scam</h2>
  ${doSteps}
  ${ctas}`,
  schema: [{ '@type': 'CollectionPage', name: 'Scam guides', inLanguage: 'en-NG', dateModified: TODAY, publisher: { '@id': URL_ + '/#org' },
    hasPart: D.SCAM_TYPES.map(t => ({ '@type': 'Article', headline: t.title, url: URL_ + `/scams/${t.id}/` })) }]
}));
pages.push({ loc: '/scams/', pri: '0.9' });

// ---------- /faq/ ----------
write('faq/index.html', page({
  rel: 'faq/index.html',
  title: `Scam questions and answers for students (${D.QA.length} answers) | Scam Shield`,
  description: 'Clear answers to what students ask about scams: OTPs, phishing links, fake jobs, fake alerts and what to do after clicking a scam link.',
  h1: 'Scam questions and answers',
  crumbs: [['Home', '/'], ['FAQ', '/faq/']],
  body: `
  <p class="answer-box"><b>Quick answer:</b> If a message rushes you, asks for money first, or asks for your PIN, OTP, password or BVN, treat it as a scam until a trusted adult helps you check it.</p>
  ${D.QA.map(x => `<div class="faq-item"><h3>${esc(x.q)}</h3><p>${esc(x.a)}</p></div>`).join('')}
  <p>Still have a question? <a href="/#ask">Ask the Scam Shield tutor</a>.</p>
  ${ctas}`,
  schema: [{ '@type': 'FAQPage', mainEntity: D.QA.map(x => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })) }]
}));
pages.push({ loc: '/faq/', pri: '0.8' });

// ---------- sitemap.xml ----------
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `  <url><loc>${URL_}${p.loc}</loc><lastmod>${TODAY}</lastmod><priority>${p.pri}</priority></url>`).join('\n')}
</urlset>
`);

// ---------- robots.txt ----------
write('robots.txt', `# Scam Shield: everyone may read our guides, including AI search tools,
# because the goal is to help as many people as possible stay safe.
User-agent: *
Allow: /
Disallow: /api/

# AI search and answer engines (GEO): welcome
User-agent: GPTBot
Allow: /
User-agent: OAI-SearchBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: Applebot-Extended
Allow: /

Sitemap: ${URL_}/sitemap.xml
`);

// ---------- llms.txt (GEO) ----------
write('llms.txt', `# Scam Shield

> Scam Shield is a free, student-built digital-safety website from the ${SITE.publisher} (${SITE.parent}), Ogun State, Nigeria. It teaches young people aged 9-17 to recognise online scams, practise on made-up example messages, check a suspicious message (offline red-flag checker plus an optional AI second opinion), report scams and take a quiz.

Key facts:
- Real banks never ask for a PIN, OTP, password or BVN by SMS, call or chat.
- A real prize, job or scholarship never asks you to pay a fee first.
- When unsure: stop, don't share, verify using a contact you already trust, tell a trusted adult.
- All example messages on the site are fictional; links end in ".example".
- Scam Shield is an educational tool, not a commercial fraud-detection system.

## Scam guides
${D.SCAM_TYPES.map(t => `- [${t.title}](${URL_}/scams/${t.id}/): ${GUIDES[t.id].answer}`).join('\n')}

## Help
- [Scam questions and answers](${URL_}/faq/): ${D.QA.length} short answers for students
- [Check a message](${URL_}/#verify): paste a suspicious message to see its warning signs
- [Practise: Spot It](${URL_}/#spot): click the red flags in made-up messages
- [Quiz](${URL_}/#quiz): 10 random questions from a bank of ${D.QUIZ.length}
`);

// ---------- keep index.html pointing at the same address ----------
const indexFile = path.join(ROOT, 'index.html');
let index = fs.readFileSync(indexFile, 'utf8');
const old = (index.match(/<link rel="canonical" href="([^"]+?)\/?">/) || [])[1];
if (old && old.replace(/\/$/, '') !== URL_) {
  index = index.split(old.replace(/\/$/, '')).join(URL_);
  fs.writeFileSync(indexFile, index);
  console.log('  updated index.html address:', old, '->', URL_);
}

console.log('Done:', pages.length, 'pages in the sitemap.');
