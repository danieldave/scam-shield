/* =====================================================================
   Scam Shield - app.js
   PART 1  Saving on this device (safely)
   PART 2  Pages and navigation (top bar + bottom bar)
   PART 3  Home: steps, tips, knowledge
   PART 4  Scam types + example dropdown
   PART 5  Spot It: click the suspicious parts, running score
   PART 6  Verify: check a message, compare with our examples, report
   PART 7  Q&A: answers from our own guide
   PART 8  Quiz + Knowledge Earn (points, badges and stars)
   PART 9  Report Center
   PART 10 Log in and profiles (saved only on this device)
   ===================================================================== */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const icon = id => `<svg><use href="#i-${id}"/></svg>`;

// ---------- PART 1: saving on this device ----------
// raw = shared by everyone on this device (the list of profiles, who is logged in).
// store = saved for the person who is logged in (or for "guest" when nobody is).
const raw = {
  get(key, fallback) { try { const v = localStorage.getItem("scamshield_" + key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; } },
  set(key, value) { try { localStorage.setItem("scamshield_" + key, JSON.stringify(value)); } catch (e) { /* private mode: keep going */ } },
  del(key) { try { localStorage.removeItem("scamshield_" + key); } catch (e) { } }
};
const ACCOUNTS = raw.get("accounts", {});            // { profileId: { name, email, salt, hash, created } }
let CURRENT = raw.get("current", null);              // profileId of the person logged in, or null
if (CURRENT && !ACCOUNTS[CURRENT]) CURRENT = null;
const prefix = () => CURRENT ? "u_" + CURRENT + "_" : "";
const store = {
  get(key, fallback) { return raw.get(prefix() + key, fallback); },
  set(key, value) { raw.set(prefix() + key, value); }
};
const PROFILE_KEYS = ["points", "reports", "spot", "best", "fivestar"];
function toast(text) {
  const t = $("#toast"); t.textContent = text; t.classList.add("show");
  clearTimeout(toast.timer); toast.timer = setTimeout(() => t.classList.remove("show"), 2600);
}

// ---------- PART 2: pages ----------
const PAGES = ["home", "types", "spot", "verify", "report", "ask", "quiz"];
function showPage() {
  const id = PAGES.includes(location.hash.slice(1)) ? location.hash.slice(1) : "home";
  $$(".page").forEach(p => p.classList.toggle("on", p.id === "page-" + id));
  $$("[data-page]").forEach(a => a.classList.toggle("on", a.dataset.page === id));
  document.title = $("#page-" + id).dataset.title + " · Scam Shield";
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", showPage);

// ---------- PART 3: home ----------
$("#stepsHome").innerHTML = WHAT_TO_DO.map((s, i) =>
  `<li><span class="ic ${["red", "red", "blue", "purple", "green"][i]}">${icon(s.icon)}</span><b>${esc(s.title)}</b><span>${esc(s.text)}</span></li>`).join("");
$("#tipsHome").innerHTML = QUICK_TIPS.map(t => `<li>${icon("check")}<span>${esc(t)}</span></li>`).join("");

// Knowledge Earn: points and badges
const BADGES = [{ name: "Scam Spotter", at: 30 }, { name: "Smart Checker", at: 100 }, { name: "Shield Guardian", at: 200 }, { name: "5-Star Shield", at: 500 }];
const STAR_EVERY = 100, FIVE_STARS = 500;              // 1 star for every 100 points, 5 stars at 500
let points = store.get("points", 0);
const starsFor = p => Math.min(5, Math.floor(p / STAR_EVERY));
function addPoints(n) {
  const before = BADGES.filter(b => points >= b.at).length;
  const starsBefore = starsFor(points);
  points += n; store.set("points", points);
  // 500 points: 5 stars. Save the award (with the date) in this profile, once.
  if (points >= FIVE_STARS && !store.get("fivestar", null)) store.set("fivestar", { date: new Date().toLocaleDateString(), points });
  drawPoints();
  const pt = $(".points"); pt.classList.remove("pop"); void pt.offsetWidth; pt.classList.add("pop");
  const after = BADGES.filter(b => points >= b.at);
  const starsNow = starsFor(points);
  if (starsNow === 5 && starsBefore < 5) { toast("5 STARS! You are a 5-Star Scam Shield. Award saved!"); confetti(); confetti(); }
  else if (after.length > before) { toast("New badge: " + after[after.length - 1].name + "!"); confetti(); }
  else if (starsNow > starsBefore) { toast("New star! " + starsNow + " of 5 stars"); confetti(); }
}
function drawStars(p) {
  const n = starsFor(p);
  return `<div class="starrow" aria-label="${n} of 5 stars">${[1, 2, 3, 4, 5].map(i => `<span class="${i <= n ? "on" : ""}">${icon("star")}</span>`).join("")}</div>
    <small>${n} of 5 stars${n < 5 ? ` · ${STAR_EVERY - (p % STAR_EVERY)} points to the next star` : " · all stars earned!"}</small>`;
}
function drawPoints() {
  const pct = Math.min(100, Math.round(points / FIVE_STARS * 100));
  const award = store.get("fivestar", null);
  ["Top", "Home", "Quiz"].forEach(k => { const el = $("#points" + k); if (el) el.textContent = points; });
  ["Home", "Quiz"].forEach(k => {
    $("#bar" + k).style.width = pct + "%";
    $("#stars" + k).innerHTML = drawStars(points);
    $("#badges" + k).innerHTML = BADGES.map(b => `<span class="badge ${points >= b.at ? "got" : ""}" title="${b.at} points">${icon(points >= b.at ? "star" : "lock")}${b.name}</span>`).join("");
    const box = $("#award" + k);
    box.hidden = !award;
    if (award) box.innerHTML = `${icon("star")}<div><b>5-Star Scam Shield</b><small>Earned on ${esc(award.date)}${CURRENT ? " by " + esc(ACCOUNTS[CURRENT].name) : ""}. Saved on this device.</small></div>`;
  });
  if (typeof drawLogin === "function") drawLogin();
}
function confetti() {
  const colors = ["#2F80ED", "#2EAE6B", "#FDB022", "#E5484D", "#7C5CFC"];
  for (let i = 0; i < 40; i++) {
    const c = document.createElement("i"); c.className = "confetti";
    c.style.left = Math.random() * 100 + "vw"; c.style.background = colors[i % colors.length];
    c.style.animationDelay = Math.random() * .5 + "s"; document.body.appendChild(c);
    setTimeout(() => c.remove(), 2400);
  }
}

// ---------- PART 4: scam types ----------
$("#typesGrid").innerHTML = SCAM_TYPES.map(t => `
  <article class="type"><img src="images/types/${t.icon}.svg" alt="" loading="lazy" width="240" height="150">
    <div class="in"><h3>${esc(t.title)}</h3><p>${esc(t.short)}</p>
      <ul>${t.flags.map(f => `<li>${esc(f)}</li>`).join("")}</ul>
      <details><summary>Show an example</summary><div class="msg"><small>Made-up example</small>${esc(t.examples[0])}</div></details>
    </div></article>`).join("");
const sel = $("#exampleSelect");
sel.innerHTML = SCAM_TYPES.map(t => `<option value="${t.id}">${esc(t.title)}</option>`).join("");
function drawExamples() {
  const t = SCAM_TYPES.find(x => x.id === sel.value);
  $("#exampleBox").innerHTML = t.examples.map((m, i) => `<div class="msg"><small>Made-up example ${i + 1}</small>${esc(m)}</div>`).join("") +
    `<p class="note"><b>Red flags:</b> ${t.flags.map(esc).join(" · ")}</p>`;
}
sel.addEventListener("change", drawExamples); drawExamples();

// ---------- PART 5: Spot It ----------
let spotState = store.get("spot", {});        // { cardIndex: { picked: [...], checked: true } }
function totalFlags() { return SPOT_EXAMPLES.reduce((n, e) => n + e.parts.filter(p => p.why).length, 0); }
function drawSpot() {
  $("#spotList").innerHTML = SPOT_EXAMPLES.map((e, i) => `
    <article class="card spot" data-i="${i}">
      <div class="from"><span>${esc(e.from)}</span><span>Message ${i + 1} of ${SPOT_EXAMPLES.length}</span></div>
      <div class="bubble">${e.parts.map((p, j) => `<span class="part ${p.why ? "flag" : ""}" data-j="${j}" tabindex="0" role="button">${esc(p.t)}</span>`).join("")}</div>
      <div class="actions"><button class="btn small check" type="button">Check my answer</button><span class="result"></span></div>
      <ul class="explain"></ul>
    </article>`).join("");
  $$(".spot").forEach(card => {
    const i = card.dataset.i, st = spotState[i] || { picked: [] };
    st.picked.forEach(j => $(`.part[data-j="${j}"]`, card).classList.add("picked"));
    if (st.checked) reveal(card, false);
  });
  score();
}
function score() {
  let found = 0, falseA = 0, done = 0;
  SPOT_EXAMPLES.forEach((e, i) => {
    const st = spotState[i]; if (!st || !st.checked) return;
    done++;
    st.picked.forEach(j => { if (e.parts[j].why) found++; else falseA++; });
  });
  $("#foundAll").textContent = found; $("#totalAll").textContent = totalFlags();
  $("#falseAll").textContent = falseA; $("#doneAll").textContent = done; $("#cardsAll").textContent = SPOT_EXAMPLES.length;
}
function reveal(card, award) {
  const i = card.dataset.i, e = SPOT_EXAMPLES[i], st = spotState[i];
  card.classList.add("checked");
  const flags = e.parts.map((p, j) => ({ p, j })).filter(x => x.p.why);
  const got = flags.filter(x => st.picked.includes(x.j)).length;
  const falseA = st.picked.filter(j => !e.parts[j].why).length;
  $(".check", card).disabled = true;
  $(".result", card).innerHTML = (e.scam ? `<span class="verdict bad">SCAM · ${esc(e.type)}</span>` : `<span class="verdict ok">SAFE MESSAGE</span>`) +
    ` <b>${got}/${flags.length}</b> found${falseA ? `, ${falseA} false alarm${falseA > 1 ? "s" : ""}` : ""}`;
  $(".explain", card).innerHTML = e.scam
    ? flags.map(x => `<li class="${st.picked.includes(x.j) ? "found" : "missed"}"><b>"${esc(x.p.t.trim())}"</b>: ${esc(x.p.why)}</li>`).join("")
    : `<li class="${falseA ? "missed" : "found"}">This message is safe: it asks for no money, no codes and no clicks, and tells you to check in person. Not every message is a scam: the skill is to check calmly.</li>`;
  if (award) {
    const pts = got * 5 + (e.scam ? 0 : (falseA ? 0 : 10));
    if (pts > 0) { addPoints(pts); toast("+" + pts + " points"); }
  }
}
$("#spotList").addEventListener("click", ev => {
  const card = ev.target.closest(".spot"); if (!card) return;
  const i = card.dataset.i; spotState[i] = spotState[i] || { picked: [] };
  const st = spotState[i];
  if (ev.target.classList.contains("part") && !st.checked) {
    const j = Number(ev.target.dataset.j);
    ev.target.classList.toggle("picked");
    st.picked = st.picked.includes(j) ? st.picked.filter(x => x !== j) : st.picked.concat(j);
    store.set("spot", spotState);
  }
  if (ev.target.classList.contains("check") && !st.checked) {
    st.checked = true; store.set("spot", spotState); reveal(card, true); score();
  }
});
$("#spotList").addEventListener("keydown", ev => { if ((ev.key === "Enter" || ev.key === " ") && ev.target.classList.contains("part")) { ev.preventDefault(); ev.target.click(); } });
$("#resetSpot").addEventListener("click", () => { spotState = {}; store.set("spot", spotState); drawSpot(); toast("Spot It reset. Try again!"); });
drawSpot();

// ---------- PART 6: Verify ----------
const STOP = new Set("how what why when where who which does should can could would know there ask the and you your for are this that with have has was will now our not but all can get from his her its they them their out please just about into very".split(" "));
const words = s => s.toLowerCase().replace(/[^a-z0-9₦ ]+/g, " ").split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));
const ALL_EXAMPLES = [].concat(
  ...SCAM_TYPES.map(t => t.examples.map(m => ({ text: m, type: t.title }))),
  SPOT_EXAMPLES.filter(e => e.scam).map(e => ({ text: e.parts.map(p => p.t).join(""), type: e.type })));

function hidePersonal(text) {
  return text.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[hidden email]")
    .replace(/\+?\d[\d\s-]{6,}\d/g, "[hidden number]");
}
function findFlags(text) {
  const low = " " + text.toLowerCase() + " ";
  return RED_FLAGS.map(f => {
    const hits = f.words.filter(w => /^[a-z]+$/.test(w) ? new RegExp("\\b" + w + "\\b").test(low) : low.includes(w));
    return hits.length ? { flag: f, hits } : null;
  }).filter(Boolean);
}
function closest(text) {
  const a = new Set(words(text)); let best = null;
  ALL_EXAMPLES.forEach(ex => {
    const b = new Set(words(ex.text)); const same = [...a].filter(w => b.has(w)).length;
    const sim = same / Math.max(1, Math.min(a.size, b.size) + (Math.abs(a.size - b.size) / 2));
    if (!best || sim > best.sim) best = { ...ex, sim };
  });
  return best;
}
function highlight(text, found) {
  let html = esc(text);
  const all = [...new Set(found.flatMap(f => f.hits))].sort((x, y) => y.length - x.length);
  all.forEach(w => {
    const re = /^[a-z]+$/.test(w) ? new RegExp("\\b(" + w + ")\\b", "gi") : new RegExp("(" + esc(w).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
    html = html.replace(re, "\u0001$1\u0002");
  });
  return html.replace(/\u0001/g, "<mark>").replace(/\u0002/g, "</mark>");
}
let lastCheck = null;
function verify() {
  const raw = $("#verifyText").value.trim();
  const box = $("#verifyResult");
  if (raw.length < 15) { box.innerHTML = `<div class="empty">${icon("ask")}<p>Please paste a longer message (at least a full sentence).</p></div>`; return; }
  const text = hidePersonal(raw);
  const found = findFlags(text);
  const risk = found.reduce((n, f) => n + f.flag.weight, 0);
  const level = risk >= 6 ? "high" : risk >= 3 ? "medium" : "low";
  const label = { high: "HIGH: many scam warning signs", medium: "MEDIUM: some warning signs", low: "LOW: few warning signs found" }[level];
  const pos = Math.min(96, 6 + risk * 9);
  const best = closest(text);
  const simPct = Math.round(Math.min(1, best.sim) * 100);
  box.innerHTML = `
    <h3>${icon("verify")}Result</h3>
    <div class="risk ${level}">${label}</div>
    <div class="meter"><i style="left:4%"></i></div>
    <ul class="flags">${found.length ? found.map(f => `<li><b>${esc(f.flag.label)}</b><br><small>Words: ${f.hits.map(esc).join(", ")}</small></li>`).join("")
      : "<li><b>No common red flags found.</b><br><small>That does not prove it is safe. Still check who sent it.</small></li>"}</ul>
    <div class="highlight">${highlight(text, found)}</div>
    <div class="compare"><b>Closest made-up example (${simPct}% similar):</b> ${esc(best.type)}<br><i>"${esc(best.text)}"</i></div>
    <p class="note">Result from our learning tool. It can miss scams and can be wrong. When in doubt: stop, don't share, verify with a trusted adult.</p>`;
  requestAnimationFrame(() => setTimeout(() => { $(".meter i", box).style.left = pos + "%"; }, 30));
  lastCheck = { text, level, flags: found.map(f => f.flag.label), type: found.length ? guessType(found, best) : "Not sure" };
  $("#reportCard").hidden = false;
  $("#repType").value = lastCheck.type;
  drawAdvice();
  if (window.innerWidth < 720) box.scrollIntoView({ behavior: "smooth", block: "start" });
}
function guessType(found, best) {
  const ids = found.map(f => f.flag.id);
  if (ids.includes("control")) return "Tech Support Scams";
  if (ids.includes("secret")) return "Phishing Scams";
  if (ids.includes("love")) return "Romance Scams";
  if (ids.includes("toogood")) return "Investment Scams";
  if (ids.includes("prize")) return "Fake Prizes & Giveaways";
  if (ids.includes("identity")) return "Impersonation Scams";
  const t = SCAM_TYPES.find(x => best.type.toLowerCase().includes(x.title.split(" ")[0].toLowerCase()));
  return t ? t.title : "Not sure";
}
const TYPE_OPTIONS = SCAM_TYPES.map(t => `<option>${esc(t.title)}</option>`).join("") +
  "<option>Fake payment alert</option><option>Delivery fee scam</option><option>Loan scam</option><option>Exam scam</option><option>Account takeover</option><option>Other</option><option>Not sure</option>";
$("#repType").innerHTML = TYPE_OPTIONS;
const ADVICE = {
  "No, I did not": "Well done for stopping. Don't reply. Block the sender and delete the message after you report it.",
  "I clicked a link": "Close the page. Do not type anything. If you entered a password, change it now and turn on two-step verification. Tell a trusted adult.",
  "I replied": "Stop replying now. Do not send any codes or details. Block the sender and tell a trusted adult.",
  "I sent money or details": "Act fast: tell a trusted adult NOW and contact your bank using its official number or app. Keep screenshots. Change your passwords. It is not your fault."
};
function adviceHTML(a) { return `<div class="advice ${a !== "No, I did not" ? "warn" : ""}"><b>What to do now:</b> ${esc(ADVICE[a])}</div>`; }
function drawAdvice() { $("#repAdvice").innerHTML = adviceHTML($("#repAction").value); }
$("#repAction").addEventListener("change", drawAdvice);
$("#verifyBtn").addEventListener("click", verify);
let sampleN = 0;
$("#sampleBtn").addEventListener("click", () => {
  const samples = [SCAM_TYPES[0].examples[0], SCAM_TYPES[6].examples[0], SCAM_TYPES[7].examples[0], "Reminder: the inter-house sports competition starts on Saturday at 9am at the school field. Come with your house shirt."];
  $("#verifyText").value = samples[sampleN++ % samples.length]; verify();
});

// The reports list is shared by the Verify page and the Report Center (PART 9).
let reports = store.get("reports", []);
function drawReports() {
  $("#repCount").textContent = reports.length ? `(${reports.length})` : "";
  $("#reportList").innerHTML = reports.length ? reports.map((r, i) => `
    <li><div class="meta"><span>${esc(r.date)} · ${esc(r.where)} · ${esc(r.type)}${r.who ? " · pretended to be: " + esc(r.who) : ""}</span><span>Risk: ${esc(r.level.toUpperCase())} <button type="button" data-del="${i}">Delete</button></span></div>
    <p>${esc(r.text)}</p><small class="note">What I did: ${esc(r.action)}</small></li>`).join("") :
    `<li class="note">No reports yet. Use the form above, or check a message on the Verify page and press "Save report".</li>`;
}
function saveReport(r) {
  reports.unshift(r);
  reports = reports.slice(0, 100); store.set("reports", reports); drawReports();
  toast(CURRENT ? "Report saved in your profile" : "Report saved on this device"); addPoints(2);
}
$("#saveReport").addEventListener("click", () => {
  if (!lastCheck) return;
  saveReport({ date: new Date().toLocaleString(), where: $("#repWhere").value, type: $("#repType").value, action: $("#repAction").value,
    level: lastCheck.level, flags: lastCheck.flags, text: lastCheck.text.slice(0, 600) });
  $("#reportCard").hidden = true;
});
$("#reportList").addEventListener("click", ev => {
  const i = ev.target.dataset.del; if (i === undefined) return;
  reports.splice(Number(i), 1); store.set("reports", reports); drawReports();
});
$("#clearReports").addEventListener("click", () => { if (reports.length && confirm("Delete all reports on this device?")) { reports = []; store.set("reports", reports); drawReports(); } });
$("#exportReports").addEventListener("click", () => {
  if (!reports.length) { toast("No reports to download yet"); return; }
  const who = CURRENT ? `Profile: ${ACCOUNTS[CURRENT].name}\n` : "";
  const txt = "SCAM SHIELD: MY REPORTS (made on this device)\n" + who + "\n" + reports.map((r, i) =>
    `#${i + 1}  ${r.date}\nWhere: ${r.where}${r.when ? "\nReceived on: " + r.when : ""}\nType: ${r.type}${r.who ? "\nPretended to be: " + r.who : ""}\nRisk: ${r.level}\nWhat I did: ${r.action}\nWarning signs: ${r.flags.join("; ") || "none found"}\nMessage: ${r.text}\n`).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([txt], { type: "text/plain" })); a.download = "scam-shield-reports.txt"; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
});
drawReports();

// ---------- PART 7: Q&A ----------
function bestAnswers(question) {
  const q = question.toLowerCase(); const qw = new Set(words(q));
  return QA.map(item => {
    let s = 0;
    item.k.forEach(k => { if (q.includes(k)) s += 3 + k.split(" ").length; });
    words(item.q).forEach(w => { if (qw.has(w)) s += 1; });
    return { item, s };
  }).filter(x => x.s >= 2).sort((a, b) => b.s - a.s);
}
function ask(question) {
  const out = $("#answer");
  if (question.trim().length < 3) { out.innerHTML = `<div class="answer"><p>Please type a question first.</p></div>`; return; }
  const list = bestAnswers(question);
  if (!list.length) {
    out.innerHTML = `<div class="answer"><h4>I don't have an answer for that yet.</h4><p>Try asking about phishing, OTPs, links, fake jobs, online shopping, what to do after clicking a link, or how Scam Shield works. You can also ask a trusted adult or a teacher.</p></div>`;
    return;
  }
  const top = list[0].item;
  out.innerHTML = `<div class="answer"><h4>${esc(top.q)}</h4><p>${esc(top.a)}</p></div>` +
    (list.length > 1 ? `<div class="related"><small>Related questions</small><div class="chips">${list.slice(1, 4).map(x => `<button class="chip" type="button">${esc(x.item.q)}</button>`).join("")}</div></div>` : "");
}
$("#askBtn").addEventListener("click", () => ask($("#askText").value));
$("#askText").addEventListener("keydown", ev => { if (ev.key === "Enter" && !ev.shiftKey) { ev.preventDefault(); ask($("#askText").value); } });
$("#popular").innerHTML = QA.slice(0, 10).map(x => `<button class="chip" type="button">${esc(x.q)}</button>`).join("");
document.addEventListener("click", ev => {
  if (ev.target.classList.contains("chip")) { $("#askText").value = ev.target.textContent; ask(ev.target.textContent); $("#askText").scrollIntoView({ behavior: "smooth", block: "center" }); }
});

// ---------- PART 8: Quiz ----------
let quiz = null;
function newQuiz() {
  const order = QUIZ.map((_, i) => i).sort(() => Math.random() - .5).slice(0, 10);
  quiz = { order, n: 0, right: 0 }; drawQuestion();
}
function drawQuestion() {
  const box = $("#quizBox");
  if (quiz.n >= quiz.order.length) {
    const best = Math.max(store.get("best", 0), quiz.right); store.set("best", best);
    box.innerHTML = `<div class="final"><p>Quiz complete!</p><div class="big">${quiz.right}/10</div>
      <p>${quiz.right >= 8 ? "Excellent! You are a strong Scam Shield." : quiz.right >= 5 ? "Good work! Read the tips and try again." : "Keep practising: every try makes your shield stronger."}</p>
      <p class="note">Your best score: ${best}/10</p><button class="btn" id="again" type="button">Take a new quiz</button></div>`;
    $("#again").addEventListener("click", newQuiz);
    if (quiz.right >= 8) confetti();
    return;
  }
  const base = QUIZ[quiz.order[quiz.n]];
  const mix = base.a.map((text, i) => ({ text, i })).sort(() => Math.random() - .5);   // shuffle the answers
  const item = { q: base.q, why: base.why, a: mix.map(m => m.text), c: mix.findIndex(m => m.i === base.c) };
  box.innerHTML = `<div class="qtop"><span>Question ${quiz.n + 1} of 10</span><span>Score: ${quiz.right}</span></div>
    <div class="bar"><span style="width:${quiz.n * 10}%"></span></div>
    <p class="qq">${esc(item.q)}</p>
    <div class="opts">${item.a.map((a, i) => `<button class="opt" type="button" data-i="${i}">${esc(a)}</button>`).join("")}</div>
    <div id="fb"></div>`;
  $$(".opt", box).forEach(b => b.addEventListener("click", () => {
    const pick = Number(b.dataset.i), ok = pick === item.c;
    $$(".opt", box).forEach(x => { x.disabled = true; if (Number(x.dataset.i) === item.c) x.classList.add("right"); });
    if (!ok) b.classList.add("wrong");
    if (ok) { quiz.right++; addPoints(10); }
    $("#fb").innerHTML = `<div class="feedback ${ok ? "ok" : "no"}"><b>${ok ? "Correct! +10 points." : "Not quite."}</b> ${esc(item.why)}</div>
      <p><button class="btn" id="next" type="button">${quiz.n === 9 ? "See my score" : "Next question"}</button></p>`;
    $("#next").addEventListener("click", () => { quiz.n++; drawQuestion(); });
  }));
}
$("#resetPoints").addEventListener("click", () => {
  if (confirm("Reset your points, stars and badges?")) { points = 0; store.set("points", 0); raw.del(prefix() + "fivestar"); drawPoints(); }
});
$("#quizCount").textContent = QUIZ.length;

// ---------- PART 9: Report Center ----------
$("#rcType").innerHTML = TYPE_OPTIONS;
$("#rcType").value = "Not sure";
$("#rcWhen").value = new Date().toISOString().slice(0, 10);
$("#rcWhen").max = $("#rcWhen").value;                 // you cannot get a message in the future
function drawRcAdvice() { $("#rcAdvice").innerHTML = adviceHTML($("#rcAction").value); }
$("#rcAction").addEventListener("change", drawRcAdvice); drawRcAdvice();
$("#rcSave").addEventListener("click", () => {
  const raw_ = $("#rcText").value.trim();
  if (raw_.length < 10) { toast("Please type or paste the message first"); $("#rcText").focus(); return; }
  const text = hidePersonal(raw_);
  const found = findFlags(text);
  const risk = found.reduce((n, f) => n + f.flag.weight, 0);
  saveReport({ date: new Date().toLocaleString(), when: $("#rcWhen").value, where: $("#rcWhere").value, type: $("#rcType").value,
    who: hidePersonal($("#rcWho").value.trim()).slice(0, 80), action: $("#rcAction").value,
    level: risk >= 6 ? "high" : risk >= 3 ? "medium" : "low", flags: found.map(f => f.flag.label), text: text.slice(0, 1000) });
  $("#rcText").value = ""; $("#rcWho").value = "";
  $("#reportList").closest(".card").scrollIntoView({ behavior: "smooth", block: "start" });
});

// ---------- PART 10: Log in and profiles ----------
// A practice login: profiles live ONLY on this device (no internet).
// The password is never saved as text: we save a scrambled "hash" of it.
const idFor = email => { let h = 2166136261; for (const c of email) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h.toString(36); };
async function hashPassword(password, salt) {
  const text = salt + ":" + password;
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  } catch (e) {                                        // very old browsers: a simpler scramble
    let h = 0; for (let r = 0; r < 500; r++) for (const c of text + r) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0;
    return "s" + h.toString(16);
  }
}
const initials = name => name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
function drawLogin() {
  const label = $("#loginLabel"), btn = $("#loginBtn");
  if (CURRENT) {
    const a = ACCOUNTS[CURRENT];
    btn.classList.add("in");
    btn.innerHTML = `<span class="avatar">${esc(initials(a.name))}</span><span id="loginLabel">${esc(a.name.split(" ")[0])}</span>`;
    btn.title = "My profile";
  } else {
    btn.classList.remove("in");
    btn.innerHTML = `${icon("user")}<span id="loginLabel">Log in</span>`;
    btn.title = "Log in or create a profile";
  }
}
function openAuth(view) {
  $("#authBox").hidden = false;
  document.body.classList.add("noscroll");
  if (CURRENT) return drawProfile();
  const create = view === "create";
  $("#authBody").innerHTML = `
    <h2 id="authTitle">${create ? "Create your profile" : "Log in"}</h2>
    <p class="note">${create ? "Your points, stars and reports will be saved under your name." : "Log in to see your points, stars and reports."}</p>
    <div class="tabs"><button type="button" class="${create ? "" : "on"}" data-view="login">Log in</button><button type="button" class="${create ? "on" : ""}" data-view="create">Create profile</button></div>
    <form id="authForm" novalidate>
      ${create ? `<label>Your name <input id="aName" type="text" maxlength="30" autocomplete="nickname" placeholder="e.g. Ada"></label>` : ""}
      <label>Email <input id="aEmail" type="email" maxlength="80" autocomplete="username" placeholder="e.g. ada@school.example"></label>
      <label>Password <input id="aPass" type="password" maxlength="60" autocomplete="${create ? "new-password" : "current-password"}" placeholder="At least 6 characters"></label>
      ${create ? `<label>Type the password again <input id="aPass2" type="password" maxlength="60" autocomplete="new-password"></label>` : ""}
      <p class="error" id="aErr" role="alert"></p>
      <button class="btn" type="submit">${create ? "Create my profile" : "Log in"}</button>
    </form>
    <p class="note privacy">${icon("lock")}<span>This is a <b>practice login</b>. It works offline and is saved <b>only on this device</b>. Never use a password you use for a real account (email, bank or social media).</span></p>`;
  $(create ? "#aName" : "#aEmail").focus();
}
function closeAuth() { $("#authBox").hidden = true; document.body.classList.remove("noscroll"); }
function drawProfile() {
  const a = ACCOUNTS[CURRENT], award = store.get("fivestar", null);
  $("#authBody").innerHTML = `
    <div class="profile-head"><span class="avatar big">${esc(initials(a.name))}</span>
      <div><h2 id="authTitle">${esc(a.name)}</h2><p class="note">${esc(a.email)} · profile since ${esc(a.created)}</p></div></div>
    <div class="stats">
      <div><b>${points}</b><small>points</small></div>
      <div><b>${starsFor(points)}/5</b><small>stars</small></div>
      <div><b>${BADGES.filter(b => points >= b.at).length}</b><small>badges</small></div>
      <div><b>${reports.length}</b><small>reports</small></div>
    </div>
    <div class="stars">${drawStars(points)}</div>
    ${award ? `<div class="award">${icon("star")}<div><b>5-Star Scam Shield</b><small>Earned on ${esc(award.date)}</small></div></div>` : ""}
    <div class="row"><a class="btn small" href="#report" data-close>My reports</a><a class="btn small ghost" href="#quiz" data-close>Earn points</a><button class="btn small ghost danger" id="logout" type="button">Log out</button></div>
    <p class="note privacy">${icon("lock")}<span>Saved only on this device.</span></p>`;
}
$("#loginBtn").addEventListener("click", () => openAuth("login"));
$("#authClose").addEventListener("click", closeAuth);
$("#authBox").addEventListener("click", ev => {
  if (ev.target.id === "authBox" || ev.target.closest("[data-close]")) closeAuth();
  const tab = ev.target.closest("[data-view]"); if (tab) openAuth(tab.dataset.view);
  if (ev.target.closest("#logout")) { raw.set("current", null); location.reload(); }
});
document.addEventListener("keydown", ev => { if (ev.key === "Escape" && !$("#authBox").hidden) closeAuth(); });
$("#authBox").addEventListener("submit", async ev => {
  ev.preventDefault();
  const err = $("#aErr"), create = !!$("#aName");
  const email = $("#aEmail").value.trim().toLowerCase(), pass = $("#aPass").value;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = "Please type a valid email, like ada@school.example"; return; }
  if (pass.length < 6) { err.textContent = "The password needs at least 6 characters."; return; }
  const id = idFor(email);
  if (create) {
    const name = $("#aName").value.trim().replace(/\s+/g, " ");
    if (name.length < 2) { err.textContent = "Please type your name (at least 2 letters)."; return; }
    if (pass !== $("#aPass2").value) { err.textContent = "The two passwords are not the same."; return; }
    if (ACCOUNTS[id]) { err.textContent = "A profile with this email already exists on this device. Please log in."; return; }
    const salt = Math.random().toString(36).slice(2, 10);
    ACCOUNTS[id] = { name, email, salt, hash: await hashPassword(pass, salt), created: new Date().toLocaleDateString() };
    raw.set("accounts", ACCOUNTS);
    // keep the progress made before logging in: copy it into the new profile
    PROFILE_KEYS.forEach(k => { const v = raw.get(k, null); if (v !== null) raw.set("u_" + id + "_" + k, v); });
    raw.set("current", id);
    raw.set("welcome", "Welcome, " + name + "! Your profile is ready.");
    location.reload();
  } else {
    const a = ACCOUNTS[id];
    if (!a || a.hash !== await hashPassword(pass, a.salt)) { err.textContent = "Email or password is not correct."; return; }
    raw.set("current", id);
    raw.set("welcome", "Welcome back, " + a.name + "!");
    location.reload();
  }
});

// ---------- start ----------
$("#year").textContent = new Date().getFullYear();
drawPoints();
newQuiz();
showPage();
const hello = raw.get("welcome", null);
if (hello) { raw.del("welcome"); setTimeout(() => toast(hello), 400); }
