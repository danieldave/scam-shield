/* Scam Shield - THE SCAM DRILL
 * 10 messages, picked at random. You say SCAM or SAFE. After each one,
 * the same checker the site uses shows you the warning signs it found,
 * so you learn what to look for. At the end you get a score to share.
 * Nothing is sent anywhere: the drill runs on your phone. */
(function () {
  "use strict";
  var box = document.getElementById("drill"); if (!box || !window.DRILL) return;
  var ROUNDS = 10, list = [], at = 0, score = 0, streak = 0, best = 0;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function start() {
    var s = shuffle(window.DRILL.filter(function (m) { return m.k === "s"; })).slice(0, 6), r = shuffle(window.DRILL.filter(function (m) { return m.k === "r"; })).slice(0, 4);
    list = shuffle(s.concat(r)); at = 0; score = 0; streak = 0; best = 0; ask();
  }
  function ask() {
    var m = list[at];
    box.innerHTML = '<p class="d-count">Message ' + (at + 1) + ' of ' + ROUNDS + ' · score ' + score + (streak > 1 ? ' · 🔥 ' + streak + ' in a row' : '') + '</p>' +
      '<div class="d-bar"><i style="width:' + (at / ROUNDS * 100) + '%"></i></div>' +
      '<div class="d-phone"><div class="d-msg">' + esc(m.t) + '</div></div>' +
      '<div class="d-btns"><button type="button" class="btn d-scam" data-a="s">🚨 It is a SCAM</button><button type="button" class="btn d-safe" data-a="r">✅ It is SAFE</button></div>';
  }
  function answer(a) {
    var m = list[at], right = a === m.k, flags = [];
    try { flags = window.ScamChecker.findFlags(m.t, RED_FLAGS); } catch (e) {}
    if (right) { score++; streak++; best = Math.max(best, streak); } else streak = 0;
    var why = m.k === "s"
      ? (flags.length ? 'Warning signs in this message:<ul>' + flags.slice(0, 4).map(function (f) { return '<li><b>' + esc(f.flag.label || f.flag.id) + '</b>' + (f.hits && f.hits.length ? ' (“' + esc(f.hits[0]) + '”)' : '') + '</li>'; }).join("") + '</ul>' : 'It asks for money, a code or a secret, or it rushes you. Real offices do not do that.')
      : 'Nothing here asks for your money, PIN or code, and nobody is rushing you. That is what a normal message looks like.';
    box.innerHTML = '<p class="d-count">Message ' + (at + 1) + ' of ' + ROUNDS + ' · score ' + score + '</p><div class="d-bar"><i style="width:' + ((at + 1) / ROUNDS * 100) + '%"></i></div>' +
      '<div class="d-phone"><div class="d-msg">' + esc(m.t) + '</div></div>' +
      '<div class="d-result ' + (right ? "good" : "bad") + '"><b>' + (right ? "Correct! " : "Not this time. ") + 'This one is ' + (m.k === "s" ? "a SCAM." : "SAFE.") + '</b><div>' + why + '</div></div>' +
      '<div class="d-btns"><button type="button" class="btn" data-next>' + (at + 1 < ROUNDS ? "Next message →" : "See my score") + '</button></div>';
  }
  function finish() {
    var rank = score === 10 ? ["🛡️", "Scam Shield Master", "Nobody is fooling you today."] : score >= 8 ? ["🦅", "Sharp Eye", "You caught almost everything."] : score >= 5 ? ["👀", "Getting There", "Read the warning signs once more and try again."] : ["🌱", "Learner", "Scammers are clever. Practise and you will beat them."];
    var text = "I scored " + score + "/10 on the Scam Shield Scam Drill (" + rank[1] + "). Can you beat me? " + location.origin + "/drill/";
    box.innerHTML = '<div class="d-end"><div class="d-big" aria-hidden="true">' + rank[0] + '</div><h2>' + score + ' out of 10</h2><p><b>' + rank[1] + '.</b> ' + rank[2] + (best > 2 ? ' Best run: ' + best + ' in a row.' : '') + '</p>' +
      '<div class="d-btns"><button type="button" class="btn" data-share>📣 Challenge a friend</button><button type="button" class="btn ghost" data-again>🔁 Play again</button></div>' +
      '<p class="note" id="d-note" aria-live="polite"></p><p><a href="/signs/">Learn the 13 warning signs →</a> · <a href="/">Check a real message →</a></p></div>';
    box.querySelector("[data-share]").onclick = function () {
      if (navigator.share) navigator.share({ text: text }).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { document.getElementById("d-note").textContent = "Copied. Paste it in WhatsApp."; });
    };
  }
  box.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    if (b.hasAttribute("data-a")) answer(b.getAttribute("data-a"));
    else if (b.hasAttribute("data-next")) { at++; at < ROUNDS ? ask() : finish(); }
    else if (b.hasAttribute("data-again") || b.hasAttribute("data-start")) start();
  });
  box.innerHTML = '<div class="d-end"><div class="d-big" aria-hidden="true">🎯</div><h2>10 messages. Scam or safe?</h2><p>Some are real scams people receive. Some are normal messages. Tap your answer and see why.</p><div class="d-btns"><button type="button" class="btn" data-start>Start the drill</button></div></div>';
})();
