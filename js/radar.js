/* =====================================================================
   Scam Shield - radar.js
   1. ScamRadar.send(found)  tells the Scam Radar WHICH KIND of scam was
      checked. It sends only short labels (like "phishing", "urgent").
      The message itself never leaves the phone.
   2. On the /radar/ page it draws the counts as bars.
   ===================================================================== */
(function () {
  const NAMES = { phishing: ["Phishing (fake bank or login)", "/scams/phishing/"], prize: ["Fake prizes and giveaways", "/scams/prize/"], romance: ["Romance and blackmail", "/scams/romance/"],
    shopping: ["Shopping, payment and fake alerts", "/scams/shopping/"], tech: ["Tech support and remote apps", "/scams/tech/"], invest: ["Investment and loans", "/scams/invest/"],
    job: ["Fake jobs and grants", "/scams/job/"], impersonate: ["Impersonation", "/scams/impersonate/"], other: ["Other", "/scams/"] };
  const SIGNS = { secret: "Asks for PIN, OTP or codes", pay: "Asks you to pay", urgent: "Rushes you", prize: "Prize or something free", freemoney: "Free money from 'government'",
    fakealert: "Says money was 'sent'", chain: "Share it with others", toogood: "Too good to be true", link: "Contains a link", secrecy: "Keep it secret", identity: "Pretends to be someone", control: "Wants to control your device", love: "Love that turns to money" };

  // Which kind of scam do these warning signs point to?
  function kind(ids) {
    const has = id => ids.includes(id);
    return has("control") ? "tech" : has("freemoney") ? "job" : has("secret") ? "phishing" : has("love") ? "romance" : has("toogood") ? "invest" :
      has("prize") ? "prize" : has("identity") ? "impersonate" : (has("pay") || has("fakealert")) ? "shopping" : "other";
  }
  function send(found) {
    try {
      const ids = found.map(f => f.flag.id);
      const weight = found.reduce((n, f) => n + f.flag.weight, 0);
      if (weight < 3) return;                                   // only count messages with real warning signs
      fetch("/api/radar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: kind(ids), flags: ids }), keepalive: true }).catch(() => {});
    } catch (e) { /* the radar must never break the checker */ }
  }
  window.ScamRadar = { send, kind };

  const box = document.getElementById("radar");
  if (!box) return;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const bars = (rows, label) => { const max = Math.max(1, ...rows.map(r => r.count));
    return rows.map(r => `<div class="rbar"><span>${label(r)}</span><i style="width:${Math.max(4, Math.round(r.count / max * 100))}%"></i><b>${r.count}</b></div>`).join(""); };
  fetch("/api/radar").then(r => r.json()).then(d => {
    if (!d.live) { box.innerHTML = '<p class="note">The live counter is not switched on yet. Below are the messages that are always in season.</p>'; return; }
    if (!d.total) { box.innerHTML = '<p class="note">No messages have been checked in the last 7 days yet. Be the first: <a href="/#verify">check a message</a>.</p>'; return; }
    box.innerHTML = `<p class="radar-total"><b>${d.total}</b> suspicious messages checked in the last ${d.days} days</p>
      <h2>Kinds of scam</h2>${bars(d.types, r => `<a href="${NAMES[r.id][1]}">${esc(NAMES[r.id][0])}</a>`)}
      <h2>Warning signs seen most</h2>${bars(d.flags, r => `<a href="/signs/${r.id}/">${esc(SIGNS[r.id] || r.id)}</a>`)}`;
  }).catch(() => { box.innerHTML = '<p class="note">The radar could not load. Check your internet and try again.</p>'; });
})();
