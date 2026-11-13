# Scam Shield v2 · Think · Spot · Stay Safe

A digital-safety website built by the **ByteBusters Coding Club, Yewa College, Ilaro** (Odu'a Investment Foundation).
It teaches students aged 9-17 to spot online scams, practise on made-up messages, check a suspicious message and take a quiz.

## What's new in v2

| Upgrade | What it does | Where |
|---|---|---|
| **AI second opinion** | After the offline checker, the AI reads the message and explains the red flags in simple English | `api/check.js` |
| **Link safety check** | Links in the message are checked against Google Safe Browsing (optional key) | `api/_lib/shared.js` |
| **AI tutor** | When our own Q&A guide has no answer, the AI tutor answers | `api/ask.js` |
| **SEO** | 8 real scam-guide pages + FAQ page, titles, descriptions, canonical links, sitemap, social preview image | `scams/`, `faq/`, `sitemap.xml` |
| **AEO** | Every page answers the question in its first sentence and carries FAQ, HowTo and Article structured data | `tools/build.js` |
| **GEO** | `llms.txt` summary for AI assistants, robots.txt welcomes AI search bots, clear publisher info | `llms.txt`, `robots.txt` |
| **Installable app** | Manifest + icons so phones can "Add to Home screen" | `manifest.webmanifest` |

**Offline first:** if there is no internet or no key, everything still works with the offline checker and our own guide.

## New in version 3: the Scam Library, Scam Radar and the widget

| What | Where | Why it matters |
|---|---|---|
| **Scam Library** (124 real pages) | `tools/library.js` → `/is-it-real/`, `/help/`, `/on/`, `/for/`, `/meaning/`, `/signs/` | People search for the exact message on their phone ("is the FG grant message real?"). Each page answers one question in its first sentence, which is what Google and AI tools quote. |
| **Scam Radar** | `/radar/`, `api/radar.js`, `js/radar.js` | Anonymous weekly counts of the *kinds* of scam being checked. Only short labels are sent, never the message. |
| **Checker for other websites** | `/widget/`, `embed.html` | Schools, banks and community groups paste one line of code to show our checker on their own site. |
| **Smarter offline checker** | `js/data.js` | Writing the library showed 11 scam messages the checker missed. It now catches code requests ("send me the 6 digits"), "to this account" and fake credit alerts. |

**To add a page:** add one entry to `tools/library.js`, run `node tools/build.js`, then `npm test`.

**To switch the Scam Radar on (adult job, free):** in Vercel open the project → **Storage** → **Create Database** → **Upstash for Redis** → connect it to this project → **Redeploy**. Vercel adds the two settings (`KV_REST_API_URL`, `KV_REST_API_TOKEN`) by itself. Until then the radar page says it is not switched on.

**Search Console codes:** paste them into `tools/site.json` as `"googleVerify"` and `"bingVerify"`, then run `node tools/build.js`. Every page gets the tags.

**Moving to our own domain:** change `"url"` in `tools/site.json`, build again, and add the new address to `ALLOWED_ORIGINS` in Vercel.

## Put it live on Vercel (one time)

1. Go to vercel.com → **Add New → Project** → import `danieldave/scam-shield` from GitHub. No build settings are needed.
2. Open **Settings → Environment Variables** and add:
   - `OPENAI_API_KEY`: the ByteBusters OpenAI key (**required** for the AI)
   - `SAFE_BROWSING_KEY`: optional, a free Google Safe Browsing API key
   - `OPENAI_MODEL`: optional, default `gpt-4o-mini`
3. Press **Redeploy**.
4. If Vercel gives the site a different address than `https://scam-shield-blond.vercel.app`, put the real address in `tools/site.json`, run `node tools/build.js` and push again.
5. Submit `https://<your-address>/sitemap.xml` in Google Search Console and Bing Webmaster Tools.

> Never paste an API key into any file. Keys live only in Vercel's Environment Variables.

## Commands

```bash
node tools/build.js     # rebuild the guide pages, sitemap, robots.txt and llms.txt after changing js/data.js or tools/guides.js
node tools/test.js      # 22 checks: API safety, fair-use limit, cache, SEO tags, JSON-LD (no key needed)
MOCK=1 node tools/dev.js   # run locally at http://localhost:3000 with a pretend AI (free)
```

## How the API stays safe and ready to scale

- **Key hidden** on the server, never in the browser.
- **Personal details hidden** (phone numbers, emails) before anything is sent to the AI.
- **Fair-use limit:** 30 checks and 40 questions per visitor per hour.
- **Cache:** the same message twice costs only once.
- **Strict JSON answers**, cleaned on the server: a red flag is kept only if its words really appear in the message.
- **Only our website** may call the API (origin check).
- **Graceful fallback:** if anything fails, the offline result is still shown.

### Scaling up later
- Swap the in-memory limit and cache in `api/_lib/shared.js` for **Upstash Redis** (free tier on Vercel) so all servers share them.
- Add new scam types in `js/data.js` + `tools/guides.js` → `node tools/build.js` creates the new page automatically.
- Add Yoruba, Hausa or Igbo versions of the guide pages (with `hreflang`) to reach more people.

## Project map

```
index.html            the app (Home, Scam Types, Spot It, Verify, Report, Q&A, Quiz)
js/data.js            ALL the content (scams, examples, quiz, Q&A)
js/app.js             how the app works
js/config.js          switch the AI helper on/off
api/check.js          AI second opinion            (Vercel function)
api/ask.js            AI tutor                     (Vercel function)
api/_lib/shared.js    safety helpers: limits, cache, hide details, Safe Browsing
tools/build.js        makes the SEO/AEO/GEO pages
tools/guides.js       the words on each guide page
scams/ faq/           generated guide pages (do not edit by hand: edit guides.js and rebuild)
```

Scam Shield is an educational tool made by students, not a commercial fraud-detection system. All example messages are fictional.
