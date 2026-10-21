/* =====================================================================
   data.js  -  ALL THE CONTENT of Scam Shield
   Every message, name, number and link here is MADE UP for learning.
   Links end in ".example", a web ending that can never be a real site.
   No real company, bank or person is named.
   ===================================================================== */

// ---------- 1. COMMON SCAM TYPES ----------
const SCAM_TYPES = [
  { id: "phishing", icon: "phishing", title: "Phishing Scams", short: "Fake messages that trick you into sharing passwords, PINs or codes.",
    flags: ["Says your account will be blocked or closed", "Asks for your PIN, password or OTP code", "Link looks almost right, but not quite"],
    examples: [
      "Kudikudi Bank ALERT: Your account will be BLOCKED in 30 minutes. Verify now at kudikudi-secure-login.example and enter your PIN and OTP.",
      "Dear customer, your mailbox is full. Click mail-upgrade-now.example and type your password to keep receiving emails."] },
  { id: "prize", icon: "prize", title: "Fake Prizes & Giveaways", short: "Promises of rewards, gifts or money that are too good to be true.",
    flags: ["You won something you never entered", "You must pay a 'fee' to collect the prize", "Very short deadline"],
    examples: [
      "CONGRATULATIONS!!! You have WON ₦2,500,000 in the PlayNet Mega Promo. Pay ₦5,000 processing fee within 24 hours to claim.",
      "Free data giveaway! Share this message with 20 friends and enter your phone PIN to get 50GB free."] },
  { id: "romance", icon: "romance", title: "Romance Scams", short: "Fake friends or partners online who build trust, then ask for money.",
    flags: ["Very loving words very quickly", "Cannot do a video call", "A sudden problem that needs your money"],
    examples: [
      "Hello dear, I saw your profile and my heart chose you. I am an engineer working abroad. My gift box for you is stuck at customs, please help me pay ₦40,000.",
      "My love, I cannot video call because my camera is broken. Please send me your bank card photo so I can send you money."] },
  { id: "shopping", icon: "shopping", title: "Online Shopping Scams", short: "Fake sellers, items that do not exist, or payment tricks.",
    flags: ["Price far too low", "Pay first into a personal account", "No pay-on-delivery, no address, no reviews"],
    examples: [
      "Bazaar9 Store: Brand-new smartphone ₦15,000 only (normal price ₦300,000)! Pay to my personal account first. No pay on delivery.",
      "Last 2 pairs of designer sneakers ₦5,000! Send money now, I will send the waybill later. Don't call, chat only."] },
  { id: "tech", icon: "tech", title: "Tech Support Scams", short: "Fake 'helpers' who want to control your phone or computer.",
    flags: ["Scary pop-up: 'virus detected!'", "Asks you to install an app so they can control your device", "Asks for payment to 'fix' it"],
    examples: [
      "WARNING! 5 viruses detected on your phone! Call TechHelp Desk now and install RemoteFix so our agent can clean your phone. Fee: ₦8,000.",
      "Your computer licence has expired. Your files will be deleted today. Pay ₦20,000 in gift cards to renew."] },
  { id: "invest", icon: "invest", title: "Investment Scams", short: "False promises of big returns with 'no risk'.",
    flags: ["'Guaranteed' profit", "Money doubles very fast", "You must bring friends to withdraw"],
    examples: [
      "Join DoubleUp Club! Invest ₦10,000 today and get ₦20,000 in 7 days. 100% guaranteed, no risk. Invite 3 friends to unlock your withdrawal.",
      "Secret coin opportunity! Only 10 slots left. Send money now before the price explodes."] },
  { id: "job", icon: "job", title: "Fake Job Offers", short: "Jobs that ask YOU to pay before you start.",
    flags: ["Big pay for very easy work", "Registration or training fee", "Interview only on chat"],
    examples: [
      "QuickJob Agency: Work from home typing and earn ₦50,000 daily! No experience needed. Pay ₦3,000 registration to start today.",
      "You are shortlisted for a scholarship abroad. Pay ₦25,000 'processing fee' to secure your slot within 48 hours."] },
  { id: "impersonate", icon: "impersonate", title: "Impersonation Scams", short: "Someone pretends to be a friend, family member or official.",
    flags: ["New number, 'it's me'", "An emergency and a request for money", "Asks you to keep it secret"],
    examples: [
      "Hi, it's me, I changed my number. I have an emergency at school, please send ₦10,000 to this account now. Don't tell Mum.",
      "This is the Exam Office. Your result is on hold. Pay ₦7,500 today to this number or your result will be cancelled."] }
];

// ---------- 2. SPOT IT: click the suspicious parts ----------
// Each message is cut into parts. A part with "why" is a red flag.
const SPOT_EXAMPLES = [
  { from: "SMS from: KUDIKUDI-BNK", type: "Phishing", scam: true, parts: [
    { t: "Kudikudi Bank ALERT: " },
    { t: "Your account will be BLOCKED in 30 minutes.", why: "Panic and a short deadline. Scammers rush you so you do not stop to think." },
    { t: " To keep it open, " },
    { t: "click kudikudi-secure-login.example", why: "A strange link. A real bank never sends you a link to 'unblock' your account. Open your bank app yourself." },
    { t: " and " },
    { t: "enter your PIN and OTP.", why: "No real bank ever asks for your PIN or OTP code. Anyone who asks is a scammer." },
    { t: " Thank you for banking with us." }] },
  { from: "WhatsApp from: +000 000 0001", type: "Fake prize", scam: true, parts: [
    { t: "🎉 " },
    { t: "CONGRATULATIONS!!! You have WON ₦2,500,000", why: "You cannot win a competition you never entered." },
    { t: " in the PlayNet Mega Promo. " },
    { t: "Pay ₦5,000 processing fee", why: "A real prize never asks you to pay to collect it." },
    { t: " to agent Mr. Chris " },
    { t: "within 24 hours or you lose it!", why: "A deadline to make you hurry." }] },
  { from: "Email from: hr@quickjob-agency.example", type: "Fake job", scam: true, parts: [
    { t: "Dear Applicant, " },
    { t: "Work from home typing and earn ₦50,000 daily!", why: "Very big pay for very easy work is a classic trap." },
    { t: " " },
    { t: "No experience, no interview needed.", why: "Real jobs check who you are and what you can do." },
    { t: " " },
    { t: "Pay ₦3,000 registration", why: "A real employer pays YOU. They never ask you to pay to get the job." },
    { t: " and send your full name and BVN to start." , why: "Never send ID numbers to a stranger. They can be used to steal from you." }] },
  { from: "SMS from: 0000 000 0000", type: "Impersonation", scam: true, parts: [
    { t: "Hi, " },
    { t: "it's me, I changed my number.", why: "A new number that claims to be someone you know. Call their OLD number to check." },
    { t: " " },
    { t: "I have an emergency, please send ₦10,000 to this account now.", why: "An emergency plus a money request. Scammers use fear and love for family." },
    { t: " " },
    { t: "Don't tell Mum.", why: "Asking for secrecy is a big red flag. Always tell a trusted adult." }] },
  { from: "School portal notice", type: "Safe message", scam: false, parts: [
    { t: "Dear Parents and Students, " },
    { t: "the PTA meeting holds on Friday at 4pm in the school hall." },
    { t: " There is no payment for this meeting. " },
    { t: "For questions, please see the school office in person." },
    { t: " Thank you." }] },
  { from: "Pop-up on a website", type: "Tech support", scam: true, parts: [
    { t: "⚠️ " },
    { t: "WARNING! 5 viruses detected on your phone!", why: "Websites cannot scan your phone. Scary pop-ups are made to frighten you." },
    { t: " " },
    { t: "Call TechHelp Desk now", why: "They want you to call THEM, so they can trick you on the phone." },
    { t: " and " },
    { t: "install RemoteFix so our agent can control your phone.", why: "Never let a stranger control your phone or computer." },
    { t: " Fee: ₦8,000." }] },
  { from: "Chat on a selling app", type: "Online shopping", scam: true, parts: [
    { t: "Bazaar9 Store: " },
    { t: "Brand-new smartphone ₦15,000 only (normal price ₦300,000)!", why: "Far too cheap. If a price looks too good to be true, it usually is." },
    { t: " " },
    { t: "Pay to my personal account first.", why: "Real shops use safe payment methods, not a personal account." },
    { t: " " },
    { t: "No pay on delivery. Don't call, chat only.", why: "They avoid any way for you to check them." }] },
  { from: "Direct message on social media", type: "Investment", scam: true, parts: [
    { t: "Join DoubleUp Club! " },
    { t: "Invest ₦10,000 today, get ₦20,000 in 7 days.", why: "Money does not double in a week. That is a promise, not an investment." },
    { t: " " },
    { t: "100% guaranteed, no risk.", why: "Every real investment has some risk. 'Guaranteed' is a warning sign." },
    { t: " " },
    { t: "Invite 3 friends to unlock your withdrawal.", why: "Needing new people to pay old people is how pyramid schemes work." }] }
];

// ---------- 3. VERIFY: red-flag rules for the message checker ----------
const RED_FLAGS = [
  { id: "secret", label: "Asks for PIN, password, OTP or codes", weight: 3,
    words: ["pin", "otp", "password", "passcode", "one-time", "one time", "cvv", "bvn", "nin", "verification code", "security code", "login details", "card details", "card number"] },
  { id: "pay", label: "Asks you to pay or send money", weight: 3,
    words: ["pay", "fee", "send money", "transfer", "processing", "registration", "deposit", "gift card", "recharge card", "airtime", "send ₦", "account number"] },
  { id: "urgent", label: "Rushes you with a deadline or a threat", weight: 2,
    words: ["urgent", "immediately", "now", "today", "within 24", "within 48", "hours", "minutes", "blocked", "suspended", "deactivated", "expire", "last chance", "final warning", "act fast", "hurry"] },
  { id: "prize", label: "Prize, win or something free", weight: 2,
    words: ["congratulations", "won", "winner", "prize", "giveaway", "free", "reward", "lottery", "promo", "bonus", "claim"] },
  { id: "toogood", label: "Too good to be true (big money, no risk)", weight: 2,
    words: ["guaranteed", "double", "no risk", "100%", "earn ₦", "daily", "weekly profit", "returns", "invest", "rich", "passive income"] },
  { id: "link", label: "Contains a link to click", weight: 2,
    words: ["http", "www.", "click", ".com", ".ng", ".net", ".link", ".xyz", ".example", "bit.ly", "tap here", "link"] },
  { id: "secrecy", label: "Asks you to keep it secret", weight: 2,
    words: ["don't tell", "do not tell", "keep it secret", "between us", "confidential", "no one should know"] },
  { id: "identity", label: "'It's me', new number, or pretends to be an official", weight: 2,
    words: ["new number", "changed my number", "it's me", "it is me", "official", "head office", "customer care", "agent", "exam office", "police"] },
  { id: "control", label: "Wants to install an app or control your device", weight: 3,
    words: ["install", "download", "remote", "anydesk", "screen share", "control your", "apk"] },
  { id: "love", label: "Love or friendship that quickly turns to money", weight: 2,
    words: ["my dear", "hello dear", "my love", "sweetheart", "my heart", "customs", "stuck", "gift box", "abroad"] }
];

// ---------- 4. QUICK TIPS and WHAT TO DO ----------
const QUICK_TIPS = [
  "Be careful with messages you did not expect, even if they look official.",
  "Never share your PIN, password, OTP or BVN with anyone. Not even 'customer care'.",
  "Check the link before you click. Better: type the real address yourself.",
  "Look for spelling mistakes, strange numbers and pressure to hurry.",
  "If it sounds too good to be true, it is probably a scam.",
  "Talk to a trusted adult before you send money or personal details."
];
const WHAT_TO_DO = [
  { icon: "stop", title: "Stop. Don't click", text: "Do not click links, open attachments or reply. Scammers want you to act fast." },
  { icon: "lock", title: "Don't share", text: "Never share your password, PIN, OTP, BVN or photos of your cards." },
  { icon: "search", title: "Check & verify", text: "Contact the person or organisation using a number or app YOU already trust, not the one in the message." },
  { icon: "flag", title: "Report it", text: "Tell a trusted adult. Use the 'Report' button on the app or platform, and report to the real organisation." },
  { icon: "shield", title: "Keep devices safe", text: "Use strong passwords, turn on two-step verification and keep your apps updated." }
];

// ---------- 5. QUIZ ----------
const QUIZ = [
  { q: "A message says your bank account will be blocked in 30 minutes unless you share your OTP. What should you do?",
    a: ["Send the OTP quickly", "Ignore the link and contact your bank using its official app or number", "Reply asking for more time"], c: 1,
    why: "No real bank asks for your OTP. Contact the bank yourself, using a number you already trust." },
  { q: "You 'won' a prize in a competition you never entered. They ask for a ₦5,000 fee. This is…",
    a: ["A lucky day", "A fake prize scam", "Normal for big prizes"], c: 1, why: "Real prizes never ask you to pay to collect them." },
  { q: "Which of these is the BIGGEST red flag?", a: ["A message with good grammar", "A message asking you to keep it secret from your parents", "A message from your school notice board"], c: 1,
    why: "Scammers ask for secrecy so no one can warn you." },
  { q: "A friend messages from a NEW number asking for money urgently. What do you do first?",
    a: ["Send the money: friends help friends", "Call your friend's OLD number to check", "Send half the money"], c: 1, why: "Always verify using a contact you already have." },
  { q: "An online seller offers a ₦300,000 phone for ₦15,000, pay first. This is probably…",
    a: ["A great deal", "A shopping scam", "A school project"], c: 1, why: "A price far too low plus 'pay first' is a classic shopping scam." },
  { q: "What is an OTP?", a: ["A one-time code to confirm it is really you", "A type of phone", "A free gift"], c: 0,
    why: "OTP means One-Time Password. It is like a key: never give it to anyone." },
  { q: "A pop-up says '5 viruses found! Call this number now.' You should…",
    a: ["Call the number", "Close the page and tell an adult", "Install the app they suggest"], c: 1, why: "Websites cannot scan your phone. Close the page." },
  { q: "An 'investment' promises to double your money in 7 days, guaranteed. This is…",
    a: ["Safe because it says guaranteed", "A warning sign of an investment scam", "How banks work"], c: 1, why: "Real investments have risk. Guaranteed fast profit is a lie." },
  { q: "Which link is the safest way to open your bank's website?",
    a: ["The link in an SMS", "Typing the address you already know, or using the official app", "A link from a stranger on social media"], c: 1,
    why: "Go to the website or app yourself. Do not trust links in surprise messages." },
  { q: "A job offer asks you to pay ₦3,000 'registration'. A real employer…",
    a: ["Pays you, not the other way round", "Always asks for a fee", "Asks for your BVN on WhatsApp"], c: 0, why: "Paying to get a job is a scam sign." },
  { q: "Someone online says they love you after 2 days and needs money for 'customs'. This is…",
    a: ["True love", "A romance scam", "A gift"], c: 1, why: "Fast love plus a money problem is a romance scam pattern." },
  { q: "After you think you have been scammed, what should you do?",
    a: ["Keep quiet because you feel embarrassed", "Tell a trusted adult and report it quickly", "Delete everything"], c: 1,
    why: "Speak up fast. Scams are not your fault, and quick reports can stop more harm." },
  { q: "What does 'two-step verification' do?", a: ["Makes your phone faster", "Adds a second check, so a stolen password is not enough", "Deletes viruses"], c: 1,
    why: "Even if someone gets your password, they still need the second step." },
  { q: "A message has many spelling mistakes and says 'Dear Costumer'. This is…",
    a: ["A clue it may be a scam", "Proof it is from your bank", "Not important at all"], c: 0, why: "Poor spelling and odd greetings are common clues." },
  { q: "Is EVERY message about money a scam?", a: ["Yes, always", "No. Check carefully: who sent it, what it asks, and verify it yourself", "Only on Sundays"], c: 1,
    why: "Not every message is a scam. The skill is to stop, check and verify." }
];

// ---------- 6. Q&A: answers about Scam Shield and scams ----------
const QA = [
  { k: ["what is scam shield", "about", "this website", "who made", "purpose"], q: "What is Scam Shield?",
    a: "Scam Shield is an educational awareness website made by students. It uses made-up example messages to teach the warning signs of scams and what to do. It is a learning tool, not a real scam-detection system." },
  { k: ["what is a scam", "scam mean", "define scam", "meaning"], q: "What is a scam?",
    a: "A scam is a trick to steal your money, your personal details or control of your accounts. Scammers pretend to be someone you trust, or offer something too good to be true." },
  { k: ["phishing"], q: "What is phishing?",
    a: "Phishing is when a scammer sends a fake message (SMS, email, chat) that looks real, to make you click a link or share your password, PIN or OTP." },
  { k: ["otp", "pin", "password", "code"], q: "Should I ever share my OTP or PIN?",
    a: "Never. Not with 'customer care', not with an 'agent', not with a friend. A real bank or company will never ask for your PIN, password or OTP." },
  { k: ["link", "click", "url", "website safe"], q: "How do I know if a link is safe?",
    a: "Be careful with links in messages you did not expect. Look for small spelling changes in the address. The safest way is to type the address you already know, or open the official app yourself." },
  { k: ["clicked", "i clicked", "opened the link", "what if i click"], q: "I already clicked a scam link. What now?",
    a: "Don't panic. Don't enter any details. Close the page. If you typed a password, change it now and turn on two-step verification. Tell a trusted adult. If money or bank details are involved, contact your bank using its official number straight away." },
  { k: ["sent money", "paid", "lost money", "scammed", "victim"], q: "I sent money to a scammer. What should I do?",
    a: "Act fast and tell a trusted adult. Contact your bank through its official number or app immediately. Keep screenshots of the messages. Report the account on the platform where it happened. It is not your fault: scammers are skilled tricksters." },
  { k: ["report", "where to report", "how to report"], q: "How do I report a scam?",
    a: "Use the 'Verify' page to check the message and save a report on this device. Then tell a trusted adult, use the 'Report' or 'Block' button on the app where you got it, and report to the real organisation it pretended to be." },
  { k: ["verify", "check message", "how does verify", "checker"], q: "How does the Verify page work?",
    a: "You paste a message. Our code looks for common warning signs, like requests for PINs or money, deadlines, prizes and links, and compares the message with our made-up examples. It gives a learning result, not a guarantee. Always check with a trusted adult." },
  { k: ["data", "privacy", "saved", "store", "send my"], q: "Does Scam Shield save or send my data?",
    a: "No. Scam Shield works offline. Nothing is sent to the internet. Reports are saved only on this device, and numbers and email addresses are hidden before saving. You can delete them at any time." },
  { k: ["romance", "love", "boyfriend", "girlfriend", "online friend"], q: "What is a romance scam?",
    a: "A scammer pretends to like or love you online. They build trust fast, avoid video calls, and then ask for money, gifts or photos. Never send money or private photos to someone you only know online." },
  { k: ["job", "work", "employ", "scholarship"], q: "How do I spot a fake job or scholarship?",
    a: "Watch out if they ask you to pay a fee, promise very big pay for easy work, or only talk on chat. Real employers and scholarships do not ask you to pay to be chosen." },
  { k: ["shopping", "buy", "seller", "online store", "delivery"], q: "How do I shop online safely?",
    a: "Be careful of prices far below normal, sellers who want payment to a personal account first, and sellers who refuse pay-on-delivery or calls. Ask an adult to help you check the seller." },
  { k: ["investment", "invest", "double", "crypto", "profit"], q: "How do I spot an investment scam?",
    a: "Big warning signs: 'guaranteed' profit, money doubling fast, pressure to join today, and needing to invite friends before you can withdraw." },
  { k: ["two-step", "2fa", "two factor", "two-factor", "verification"], q: "What is two-step verification?",
    a: "It is a second lock on your account. After your password, you also confirm with a code or the app. A stolen password alone is then not enough." },
  { k: ["strong password", "good password", "create password"], q: "How do I make a strong password?",
    a: "Use a long passphrase of 3 or 4 random words, add numbers or symbols, and use a different password for each account. A password manager can help." },
  { k: ["quiz", "knowledge", "points", "badge", "earn"], q: "How does Knowledge Earn work?",
    a: "Every correct quiz answer and every red flag you find on Spot It earns points. Points unlock badges: Scam Spotter, Smart Checker and Shield Guardian. Your points stay on this device." },
  { k: ["how long", "time", "fast learn", "expert"], q: "How long does it take to learn this?",
    a: "Learning to spot scams is a habit you build over time, not something you finish in one day. Practise a little every week, and keep up as scammers change their tricks." },
  { k: ["offline", "internet", "without data"], q: "Does Scam Shield work without internet?",
    a: "Yes. Once the files are on your device, everything works offline." },
  { k: ["real", "are these real", "examples real", "fictional"], q: "Are the example messages real?",
    a: "No. Every example is made up for learning. The names, numbers and links are fictional, and no real company or bank is named." },
  { k: ["safe message", "not a scam", "legit", "genuine"], q: "Is every suspicious-looking message a scam?",
    a: "No. Some real messages look odd. The safe habit is the same: stop, check who sent it, and verify using a contact you already trust before you act." }
];
