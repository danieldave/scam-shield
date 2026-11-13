/* =====================================================================
   tools/build-library.js  -  turns tools/library.js into real pages
   Called by tools/build.js. Makes:
     /is-it-real/<slug>/   one page per named scam message
     /help/<slug>/         "it already happened, what do I do?"
     /on/<slug>/           scams by app or channel
     /for/<slug>/          scams by who is targeted
     /meaning/<slug>/      words to know (OTP, BVN, phishing...)
     /signs/<id>/          one page per warning sign our checker looks for
     /radar/  /widget/     the Scam Radar and the free checker for other websites
   ===================================================================== */
'use strict';
const L = require('./library');

module.exports = function ({ page, write, esc, D, URL_, pages, ctas, doSteps, GUIDES, TODAY, Checker }) {
  const typeOf = id => D.SCAM_TYPES.find(t => t.id === id);
  const named = Object.fromEntries(L.NAMED.map(n => [n[0], n]));
  const short = s => s.length > 155 ? s.slice(0, 150).replace(/\s\S*$/, '') + '…' : s;
  const faqSchema = list => ({ '@type': 'FAQPage', mainEntity: list.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
  const article = (headline, description, loc) => ({ '@type': 'Article', headline, description, inLanguage: 'en-NG', image: URL_ + '/images/og-image.png',
    datePublished: '2026-11-13', dateModified: TODAY, author: { '@id': URL_ + '/#org' }, publisher: { '@id': URL_ + '/#org' }, mainEntityOfPage: URL_ + loc });
  const linkList = slugs => `<ul class="grid-links">${slugs.map(s => { const n = named[s]; if (!n) throw new Error('library.js: unknown scam "' + s + '"'); return `<li><a href="/is-it-real/${s}/"><b>${esc(n[1])}</b>${esc(short(n[3]).slice(0, 110))}…</a></li>`; }).join('')}</ul>`;
  const flagsOf = text => Checker.findFlags(text, D.RED_FLAGS);
  const checkerBox = text => {
    const found = flagsOf(text);
    return found.length ? `<h2>What our offline checker sees in this message</h2>
  <ul class="redflags">${found.map(f => `<li><a href="/signs/${f.flag.id}/">${esc(f.flag.label)}</a> <small>(words: ${esc(f.hits.slice(0, 4).join(', '))})</small></li>`).join('')}</ul>
  <p>Paste any message you receive into the <a href="/#verify">checker</a> to see its warning signs in seconds.</p>` : '';
  };

  // ---------- /is-it-real/<slug>/ ----------
  L.NAMED.forEach(([slug, q, type, answer, example, signs, truth]) => {
    const t = typeOf(type); if (!t) throw new Error('library.js: unknown type "' + type + '" in ' + slug);
    const loc = `/is-it-real/${slug}/`;
    const related = L.NAMED.filter(n => n[2] === type && n[0] !== slug).slice(0, 4).map(n => n[0]);
    const faq = [[q, answer], ['How does the real thing work?', truth], ['What should I do if I already replied or paid?', GUIDES[type].caught]];
    write(`is-it-real/${slug}/index.html`, page({
      rel: `is-it-real/${slug}/index.html`, title: `${q} | Scam Shield`, description: short(answer), h1: q,
      crumbs: [['Home', '/'], ['Is it real?', '/is-it-real/'], [q, loc]],
      body: `
  <p class="answer-box"><b>Quick answer:</b> ${esc(answer)}</p>
  <h2>What the message looks like (made-up example)</h2>
  <div class="msg"><small>Made-up example</small>${esc(example)}</div>
  <h2>The warning signs</h2>
  <ul class="redflags">${signs.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
  ${checkerBox(example)}
  <h2>How the real thing works</h2>
  <p>${esc(truth)}</p>
  <h2>What to do if you get this message</h2>
  ${doSteps}
  <h2>If you already replied, clicked or paid</h2>
  <p>${esc(GUIDES[type].caught)}</p>
  <p>This is a type of <a href="/scams/${type}/">${esc(t.title.toLowerCase().replace(/s$/, ''))}</a>.</p>
  ${ctas}
  ${related.length ? `<h2>Similar messages</h2>${linkList(related)}` : ''}`,
      schema: [article(q, answer, loc), faqSchema(faq)]
    }));
    pages.push({ loc, pri: '0.8' });
  });
  write('is-it-real/index.html', page({
    rel: 'is-it-real/index.html', title: `Is this message real? ${L.NAMED.length} scam messages in Nigeria, answered | Scam Shield`,
    description: 'Quick yes-or-no answers about the scam messages Nigerians receive most: fake grants, free data, bank alerts, BVN and NIN texts, exam runs and more.',
    h1: 'Is this message real? Quick answers',
    crumbs: [['Home', '/'], ['Is it real?', '/is-it-real/']],
    body: `
  <p class="answer-box"><b>Quick answer:</b> If a message promises free money, asks for a fee first, asks for a code, or tells you to share it with your contacts, treat it as a scam. Find your message below, or paste it into the <a href="/#verify">checker</a>.</p>
  ${D.SCAM_TYPES.map(t => { const list = L.NAMED.filter(n => n[2] === t.id); return list.length ? `<h2>${esc(t.title)}</h2>${linkList(list.map(n => n[0]))}` : ''; }).join('')}
  ${ctas}`,
    schema: [{ '@type': 'CollectionPage', name: 'Is this message real?', inLanguage: 'en-NG', dateModified: TODAY,
      hasPart: L.NAMED.map(n => ({ '@type': 'Article', headline: n[1], url: URL_ + `/is-it-real/${n[0]}/` })) }]
  }));
  pages.push({ loc: '/is-it-real/', pri: '0.9' });

  // ---------- /help/<slug>/ ----------
  L.HELP.forEach(([slug, q, answer, steps]) => {
    const loc = `/help/${slug}/`;
    write(`help/${slug}/index.html`, page({
      rel: `help/${slug}/index.html`, title: `${q} Steps to take now | Scam Shield`, description: short(answer), h1: q,
      crumbs: [['Home', '/'], ['Help now', '/help/'], [q, loc]],
      body: `
  <p class="answer-box"><b>Quick answer:</b> ${esc(answer)}</p>
  <h2>Do these steps in order</h2>
  <ol class="steps">${steps.map(x => `<li>${esc(x)}</li>`).join('')}</ol>
  <p class="note"><b>Remember:</b> never use a phone number or link that came in the scam message. Use the number on the back of the bank card or the official app. Nobody honest charges a fee to "recover" stolen money.</p>
  <h2>Other things that can go wrong</h2>
  <ul class="grid-links">${L.HELP.filter(h => h[0] !== slug).slice(0, 6).map(h => `<li><a href="/help/${h[0]}/"><b>${esc(h[1])}</b></a></li>`).join('')}</ul>
  ${ctas}`,
      schema: [article(q, answer, loc), faqSchema([[q, answer + ' ' + steps.join(' ')]]),
        { '@type': 'HowTo', name: q, step: steps.map((x, i) => ({ '@type': 'HowToStep', position: i + 1, text: x })) }]
    }));
    pages.push({ loc, pri: '0.8' });
  });
  write('help/index.html', page({
    rel: 'help/index.html', title: 'I think I was scammed: what to do now | Scam Shield',
    description: 'Step-by-step help if you shared an OTP, clicked a scam link, sent money, lost your WhatsApp or are being threatened online.',
    h1: 'Help now: what to do after a scam', crumbs: [['Home', '/'], ['Help now', '/help/']],
    body: `
  <p class="answer-box"><b>Quick answer:</b> Tell a trusted adult now, contact the bank through its official app or the number on the back of the card, change your passwords, and keep the evidence. Acting in the first hour gives the best chance.</p>
  <ul class="grid-links">${L.HELP.map(h => `<li><a href="/help/${h[0]}/"><b>${esc(h[1])}</b>${esc(short(h[2]).slice(0, 110))}…</a></li>`).join('')}</ul>
  ${ctas}`,
    schema: [faqSchema(L.HELP.map(h => [h[1], h[2]]))]
  }));
  pages.push({ loc: '/help/', pri: '0.9' });

  // ---------- /on/<slug>/ and /for/<slug>/ ----------
  L.CHANNELS.forEach(([slug, name, answer, list, tips]) => {
    const loc = `/on/${slug}/`, q = `What are the common ${name} scams in Nigeria?`;
    write(`on/${slug}/index.html`, page({
      rel: `on/${slug}/index.html`, title: `${name} scams in Nigeria: the common ones and how to stay safe | Scam Shield`, description: short(answer),
      h1: `${name} scams: what to watch for`, crumbs: [['Home', '/'], ['By app', '/on/'], [name, loc]],
      body: `
  <p class="answer-box"><b>Quick answer:</b> ${esc(answer)}</p>
  <h2>Messages you may see on ${esc(name)}</h2>${linkList(list)}
  <h2>Safety settings and habits for ${esc(name)}</h2>
  <ul class="redflags">${tips.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
  ${ctas}`,
      schema: [article(`${name} scams: what to watch for`, answer, loc), faqSchema([[q, answer], [`How do I stay safe on ${name}?`, tips.join(' ')]])]
    }));
    pages.push({ loc, pri: '0.7' });
  });
  L.PEOPLE.forEach(([slug, name, answer, list]) => {
    const loc = `/for/${slug}/`, q = `Which scams target ${name} in Nigeria?`;
    write(`for/${slug}/index.html`, page({
      rel: `for/${slug}/index.html`, title: `Scams that target ${name} in Nigeria | Scam Shield`, description: short(answer),
      h1: `Scams that target ${name}`, crumbs: [['Home', '/'], ['By person', '/for/'], [name, loc]],
      body: `
  <p class="answer-box"><b>Quick answer:</b> ${esc(answer)}</p>
  <h2>The messages to know</h2>${linkList(list)}
  <h2>The 5 steps that work every time</h2>${doSteps}
  ${slug === 'teachers-and-schools' ? '<p>Schools can put the free checker on their own website: see <a href="/widget/">Scam Shield for your website</a>.</p>' : ''}
  ${ctas}`,
      schema: [article(`Scams that target ${name}`, answer, loc), faqSchema([[q, answer]])]
    }));
    pages.push({ loc, pri: '0.7' });
  });
  const hub = (dir, title, h1, desc, items) => {
    write(`${dir}/index.html`, page({ rel: `${dir}/index.html`, title: title + ' | Scam Shield', description: desc, h1, crumbs: [['Home', '/'], [h1, `/${dir}/`]],
      body: `<p class="answer-box"><b>Quick answer:</b> ${esc(desc)}</p><ul class="grid-links">${items.map(([href, b, sm]) => `<li><a href="${href}"><b>${esc(b)}</b>${esc(sm || '')}</a></li>`).join('')}</ul>${ctas}`,
      schema: [{ '@type': 'CollectionPage', name: h1, inLanguage: 'en-NG', dateModified: TODAY }] }));
    pages.push({ loc: `/${dir}/`, pri: '0.7' });
  };
  hub('on', 'Scams by app: WhatsApp, SMS, Instagram, Telegram and more', 'Scams by app', 'Each app has its own favourite scams. Pick the app to see the messages to expect and the settings that protect you.', L.CHANNELS.map(c => [`/on/${c[0]}/`, c[1], short(c[2]).slice(0, 100) + '…']));
  hub('for', 'Scams by who they target: students, parents, traders and more', 'Scams by person', 'Scammers change the story to fit the person. Pick who you are to see the scams aimed at you.', L.PEOPLE.map(c => [`/for/${c[0]}/`, c[1][0].toUpperCase() + c[1].slice(1), short(c[2]).slice(0, 100) + '…']));

  // ---------- /meaning/<slug>/ ----------
  L.TERMS.forEach(([slug, word, meaning, more, rel]) => {
    const loc = `/meaning/${slug}/`, q = `What does ${word} mean?`;
    write(`meaning/${slug}/index.html`, page({
      rel: `meaning/${slug}/index.html`, title: `What is ${word}? Simple meaning with an example | Scam Shield`, description: short(meaning),
      h1: `What is ${word}?`, crumbs: [['Home', '/'], ['Words to know', '/meaning/'], [word, loc]],
      body: `
  <p class="answer-box"><b>Quick answer:</b> ${esc(meaning)}</p>
  <p>${esc(more)}</p>
  <h2>See it in a real situation</h2>${linkList([rel])}
  <h2>More words to know</h2>
  <p class="chips-links">${L.TERMS.filter(x => x[0] !== slug).map(x => `<a href="/meaning/${x[0]}/">${esc(x[1])}</a>`).join(' · ')}</p>
  ${ctas}`,
      schema: [{ '@type': 'DefinedTerm', name: word, description: meaning + ' ' + more, url: URL_ + loc, inDefinedTermSet: URL_ + '/meaning/' }, faqSchema([[q, meaning + ' ' + more]])]
    }));
    pages.push({ loc, pri: '0.6' });
  });
  hub('meaning', 'Scam words explained simply: OTP, BVN, phishing, SIM swap', 'Words to know', 'Short, simple meanings of the words used in scams and online safety, each with a real situation.', L.TERMS.map(t => [`/meaning/${t[0]}/`, t[1], short(t[2]).slice(0, 100) + '…']));

  // ---------- /signs/<id>/ : one page per warning sign the checker looks for ----------
  const SIGN_WHY = {
    secret: 'Codes like a PIN, OTP or password exist to prove it is you. An honest company already has what it needs and never asks you to send them.',
    pay: 'Scams need your money to move before you have time to check. Real prizes, jobs, loans and grants do not ask you to pay first.',
    urgent: 'Hurry stops thinking. A deadline or a threat is there so you act before asking anyone.',
    prize: 'Free money and surprise prizes make people excited, and excited people skip checks.',
    freemoney: 'Governments and big companies do not hand out money through forwarded messages. Real programmes are announced on official websites and have checks.',
    fakealert: 'An SMS can be typed by anyone. Only the balance inside your own banking app proves that money arrived.',
    chain: 'Asking you to forward a message is how a scam spreads for free. Honest offers do not need you to recruit your contacts.',
    toogood: 'Big reward, no risk and no effort is the oldest bait there is. Real money always has a real explanation.',
    secrecy: 'Scammers ask for secrecy because one question to a parent or teacher would end the trick.',
    identity: 'Anyone can type "it is me" or copy a logo. Check using a number or contact you already had before the message arrived.',
    control: 'An app that shares your screen or controls your phone lets a stranger see your codes and open your accounts.',
    love: 'Fast affection from a stranger online builds trust that is later used to ask for money or private pictures.',
    link: 'A link can lead to a copy of a real website. Typing the address yourself, or opening the real app, avoids the trap.'
  };
  D.RED_FLAGS.forEach(f => {
    const loc = `/signs/${f.id}/`;
    const hits = L.NAMED.filter(n => flagsOf(n[4]).some(x => x.flag.id === f.id)).slice(0, 8).map(n => n[0]);
    const why = SIGN_WHY[f.id] || 'This pattern appears again and again in scam messages, so our checker looks for it.';
    const h1 = `Warning sign: ${f.label}`;
    write(`signs/${f.id}/index.html`, page({
      rel: `signs/${f.id}/index.html`, title: `Scam warning sign: ${f.label} | Scam Shield`, description: short(why), h1,
      crumbs: [['Home', '/'], ['Warning signs', '/signs/'], [f.label, loc]],
      body: `
  <p class="answer-box"><b>Quick answer:</b> ${esc(why)}</p>
  <h2>Words our checker looks for</h2>
  <p class="chips-links">${f.words.slice(0, 18).map(w => `<span>${esc(w)}</span>`).join(' · ')}</p>
  ${f.needsAsk ? '<p>Our checker is careful: it only counts these words when the same sentence is <b>asking</b> you for them. "No BVN required" is a promise, not a request.</p>' : ''}
  ${hits.length ? `<h2>Messages that show this sign</h2>${linkList(hits)}` : ''}
  ${ctas}`,
      schema: [article(h1, why, loc), faqSchema([[`Why is "${f.label}" a scam warning sign?`, why]])]
    }));
    pages.push({ loc, pri: '0.6' });
  });
  hub('signs', `The ${D.RED_FLAGS.length} warning signs of a scam message`, 'Warning signs', 'Scam messages repeat the same tricks. Learn the warning signs our checker looks for and you can spot a scam you have never seen before.', D.RED_FLAGS.map(f => [`/signs/${f.id}/`, f.label, '']));

  // ---------- /radar/ ----------
  write('radar/index.html', page({
    rel: 'radar/index.html', title: 'Scam Radar: which scams are being checked most this week | Scam Shield',
    description: 'A live, anonymous count of the kinds of scam messages people checked on Scam Shield in the last 7 days. No messages or personal details are stored.',
    h1: 'Scam Radar: what people are checking this week', crumbs: [['Home', '/'], ['Scam Radar', '/radar/']],
    body: `
  <p class="answer-box"><b>How it works:</b> every time someone uses the checker, we add 1 to a counter for the <b>kind</b> of scam and its warning signs. We never store the message, a name, a number or a location.</p>
  <div id="radar" class="radar" aria-live="polite"><p>Loading the radar…</p></div>
  <h2>Always in season</h2>${linkList(['fg-grant-message', 'free-data-giveaway', 'bank-account-blocked-sms', 'whatsapp-code-request', 'fake-credit-alert', 'work-from-home-typing-job'])}
  <p class="note">For teachers, journalists and community leaders: these counts show what people near you are worried about right now. You may quote them with a link to this page.</p>
  ${ctas}
  <script src="/js/radar.js" defer></script>`,
    schema: [{ '@type': 'Dataset', name: 'Scam Radar: kinds of scam messages checked in the last 7 days', description: 'Anonymous weekly counts of scam categories checked by users of Scam Shield in Nigeria. No message content or personal data is stored.', url: URL_ + '/radar/', isAccessibleForFree: true, creator: { '@id': URL_ + '/#org' }, license: 'https://creativecommons.org/licenses/by/4.0/' }]
  }));
  pages.push({ loc: '/radar/', pri: '0.8' });

  // ---------- /widget/ ----------
  const code = `<iframe src="${URL_}/embed" title="Scam Shield message checker" width="100%" height="560" style="border:0;max-width:520px" loading="lazy"></iframe>`;
  write('widget/index.html', page({
    rel: 'widget/index.html', title: 'Free scam checker for your website (schools, banks, churches, NGOs) | Scam Shield',
    description: 'Add the free Scam Shield message checker to any website with one line of code. It works offline in the browser and stores nothing.',
    h1: 'Put the free scam checker on your website', crumbs: [['Home', '/'], ['For your website', '/widget/']],
    body: `
  <p class="answer-box"><b>Quick answer:</b> copy one line of code into your website and your visitors can check suspicious messages without leaving your page. It is free, it shows no adverts, and the message never leaves the visitor's phone.</p>
  <h2>1. Copy this code</h2>
  <pre class="code" id="embedCode">${esc(code)}</pre>
  <button class="btn" type="button" onclick="navigator.clipboard&&navigator.clipboard.writeText(document.getElementById('embedCode').textContent).then(()=>this.textContent='Copied ✓')">Copy the code</button>
  <h2>2. Paste it where you want the checker</h2>
  <p>It works in WordPress (Custom HTML block), Blogger, Wix, Google Sites and any HTML page.</p>
  <h2>See it working</h2>
  ${code}
  <h2>Who is it for?</h2>
  <ul class="redflags"><li><b>Schools:</b> on the school website or e-learning page.</li><li><b>Banks, fintechs and cooperatives:</b> on the "security" or "contact us" page.</li><li><b>Churches, mosques and community groups:</b> on the announcements page.</li><li><b>News sites and NGOs:</b> beside stories about fraud.</li></ul>
  <p class="note">The embedded checker uses our offline red-flag list only. It is a learning tool: it can miss scams and it can be wrong.</p>`,
    schema: [{ '@type': 'SoftwareApplication', name: 'Scam Shield embeddable message checker', applicationCategory: 'SecurityApplication', operatingSystem: 'Any (web browser)', offers: { '@type': 'Offer', price: '0', priceCurrency: 'NGN' }, url: URL_ + '/widget/' }]
  }));
  pages.push({ loc: '/widget/', pri: '0.7' });

  return { counts: { named: L.NAMED.length, help: L.HELP.length, channels: L.CHANNELS.length, people: L.PEOPLE.length, terms: L.TERMS.length, signs: D.RED_FLAGS.length }, L };
};
