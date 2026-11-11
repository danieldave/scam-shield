/* =====================================================================
   Scam Shield - checker.js  (the OFFLINE red-flag checker)
   ---------------------------------------------------------------------
   Version 1 only looked for single words, so it made mistakes like:
     "No BVN required"       -> wrongly said "asks for your BVN"
     "Cash transfer to all"  -> wrongly said "asks you to pay"
   Version 2 reads the words AROUND each clue, like a careful reader:

   RULE 1  NOT-WORDS     "no BVN", "without a fee", "fee not required"
                         -> a promise, not a request: skip it.
   RULE 2  ASKING-WORDS  A secret code or a payment only counts when the
                         SAME sentence asks for it: "enter your PIN",
                         "pay ₦5,000", "send your BVN".
   RULE 3  PHRASES       Many clues are short phrases ("giving out",
                         "share with everyone"), so one word alone
                         does not trigger them.

   Used by js/app.js in the browser and by tools/test.js.
   ===================================================================== */
(function (root) {
  // Words that turn a clue into a promise: "no BVN", "without any fee", "never ask for your PIN"
  const NOT_BEFORE = /\b(no|not|without|never|zero|free of|don't need|do not need|no need for)\s+(?:\S+\s+){0,2}$/;
  // "We will NEVER ASK for your PIN", "don't share your OTP": a safety warning, not a request
  const WARNING_BEFORE = /\b(never|don't|do not|not|won't|will not)\s+(ask|share|give|send|tell|disclose|reveal|request)\b(?:\s+\S+){0,4}\s*$/;
  const NOT_AFTER = /^\S*\s+(?:\S+\s+){0,1}(not required|not needed|is not required|isn't required|free)\b/;
  // Words that show someone is ASKING you for something
  const ASKING = /\b(send|enter|share|give|provide|type|input|confirm|verify|update|submit|tell|reply|drop|pay|paying|deposit|forward|your|ur|kindly|click)\b/;

  const isLetters = w => /^[a-z ]+$/.test(w);
  const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Split into sentences so "ask" is checked in the SAME sentence as the clue
  function sentences(text) {
    return (" " + text.toLowerCase() + " ").split(/(?<=[.!?\n])\s+|\n+/).map(s => " " + s.trim() + " ").filter(s => s.trim());
  }

  function findIn(sentence, word) {
    const re = isLetters(word) ? new RegExp("\\b" + escapeRe(word) + "\\b", "g") : new RegExp(escapeRe(word), "g");
    const spots = [];
    let m;
    while ((m = re.exec(sentence))) { spots.push(m.index); if (!m[0].length) re.lastIndex++; }
    return spots;
  }

  function negated(sentence, at, word) {
    const before = sentence.slice(Math.max(0, at - 30), at);
    const after = sentence.slice(at, at + word.length + 25);
    const longBefore = sentence.slice(Math.max(0, at - 60), at);
    return NOT_BEFORE.test(before) || WARNING_BEFORE.test(longBefore) || NOT_AFTER.test(after);
  }

  // Returns [{ flag, hits: ["word", ...] }] for every red flag found
  function findFlags(text, RED_FLAGS) {
    const parts = sentences(text);
    return RED_FLAGS.map(flag => {
      const hits = new Set();
      parts.forEach(s => {
        if (flag.needsAsk && !ASKING.test(s)) return;               // RULE 2
        flag.words.forEach(w => {
          findIn(s, w).forEach(at => { if (!negated(s, at, w)) hits.add(w); });   // RULE 1
        });
      });
      return hits.size ? { flag, hits: [...hits] } : null;
    }).filter(Boolean);
  }

  root.ScamChecker = { findFlags };
})(typeof window !== "undefined" ? window : globalThis);
