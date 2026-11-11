/* =====================================================================
   tools/guides.js  -  the extra words for each Scam Guide page
   ---------------------------------------------------------------------
   Search engines (SEO), answer engines like Google's answer boxes (AEO)
   and AI search like ChatGPT or Perplexity (GEO) love pages that:
     1. answer the question in the FIRST sentence ("answer")
     2. use the exact questions people type ("faq")
     3. give clear steps ("steps")
   Each key matches an "id" in js/data.js > SCAM_TYPES.
   To add a new scam type: add it to data.js, add its guide here,
   then run:  node tools/build.js
   ===================================================================== */
module.exports = {
  phishing: {
    search: "phishing scam",
    answer: "A phishing scam is a fake SMS, email or chat message that pretends to come from your bank, school or an app, so you click a link or share your password, PIN or OTP. Real banks in Nigeria never ask for your PIN or OTP by message or phone call.",
    how: ["The scammer copies the name and style of a bank or company you know.", "The message creates panic: your account will be blocked or closed.", "A link takes you to a fake page that looks real.", "Anything you type there (password, PIN, OTP) goes straight to the scammer."],
    caught: "Close the page and do not type anything else. If you typed a password, change it now from the real app and turn on two-step verification. If it was your bank PIN or OTP, tell a trusted adult and call your bank on the number on the back of the card.",
    faq: [
      ["Will my bank ever ask for my OTP?", "No. Your OTP is a one-time code that proves it is really you. A bank, POS agent or 'customer care' worker never needs it. Anyone who asks for it is trying to steal from you."],
      ["How can I tell if a link is fake?", "Look closely at the address. Fake links add extra words like '-secure-login' or use strange endings. The safest habit is not to click at all: open your bank app or type the real address yourself."],
      ["What should I do with a phishing message?", "Do not reply or click. Take a screenshot, report and block the sender in the app, tell a trusted adult, then delete it."]
    ]
  },
  prize: {
    search: "fake prize scam",
    answer: "A fake prize scam tells you that you have won money, data or a gift in a promo you never entered, then asks you to pay a 'processing fee' or share your details to collect it. A real prize never asks you to pay first.",
    how: ["You get an exciting message: 'CONGRATULATIONS, you have WON!'", "The prize is big, often millions of naira or free data.", "To 'claim' it you must pay a small fee, buy airtime or share your PIN.", "After you pay, the scammer disappears or asks for more."],
    caught: "Stop paying. Do not send any more money or codes. Keep screenshots, block the sender and tell a trusted adult. If you paid from a bank account, contact your bank through its official app or the number on your card quickly.",
    faq: [
      ["Can I win a promo I never entered?", "No. If you never entered, you cannot win. That single fact exposes most fake prize messages."],
      ["Why do they ask for only a small fee?", "Because a small amount feels safe to pay. Scammers send the same message to thousands of people, so many small fees add up to a lot of money."],
      ["Are free data giveaways on WhatsApp real?", "Almost never. 'Share with 20 friends to get free data' messages spread scams and can steal your details. Check offers only inside your network's official app."]
    ]
  },
  romance: {
    search: "romance scam",
    answer: "A romance scam is when someone online pretends to love you or be your close friend, builds trust quickly, and then asks for money, gifts, card photos or private pictures. They usually refuse video calls and always have a sudden emergency.",
    how: ["A stranger sends very sweet messages, very fast.", "They say they live abroad or have an important job.", "They avoid video calls with excuses like a broken camera.", "Then a problem appears: a gift 'stuck at customs', a hospital bill, a ticket."],
    caught: "Stop sending money or photos. Do not be ashamed: these scammers are very skilled. Save the chat, block and report the account, and tell a trusted adult. If they threaten you, do not pay; tell an adult straight away.",
    faq: [
      ["Why won't they video call?", "Because the photos they use are stolen from someone else. A video call would show they are not the person in the pictures."],
      ["Is it a scam if they never asked for money yet?", "It may be early. Romance scammers often wait weeks before asking. Be careful with anyone you have never met who becomes very close very fast."],
      ["What should I do if someone threatens to share my photos?", "Do not pay and do not send more. Keep the messages, block the person, report the account and tell a trusted adult immediately. It is not your fault."]
    ]
  },
  shopping: {
    search: "online shopping scam",
    answer: "An online shopping scam is a fake seller who offers items at a very low price, asks you to pay into a personal account first, and then never delivers. Real sellers usually allow pay-on-delivery, have reviews and give a real address.",
    how: ["An advert shows a phone, shoes or clothes for a tiny price.", "The seller says 'last few pieces' to rush you.", "They refuse pay-on-delivery and want a transfer first.", "After payment, they block you or ask for a 'delivery fee'."],
    caught: "Keep the chat, the advert and the payment receipt. Report the seller on the app, tell a trusted adult and contact your bank through official channels to ask about the transfer.",
    faq: [
      ["How do I know if an online seller is real?", "Check for reviews from real buyers, a physical address, pay-on-delivery and a business account name that matches the shop. A very low price is the biggest warning sign."],
      ["Is it safe to pay into a personal account?", "It is risky. Scammers prefer personal accounts because they are hard to trace. Use pay-on-delivery or a trusted platform's payment system."],
      ["What is a fake payment alert?", "It is a fake SMS or screenshot that looks like a bank credit alert. Sellers should always confirm money in their real bank app before giving out goods."]
    ]
  },
  tech: {
    search: "tech support scam",
    answer: "A tech support scam is a scary pop-up, call or message that says your phone or computer has a virus or an expired licence, then asks you to call a number, install an app or pay to 'fix' it. Real companies do not contact you this way.",
    how: ["A loud pop-up says 'VIRUS DETECTED!' or 'Your files will be deleted'.", "It gives a number to call or an app to install.", "The 'agent' asks you to install a remote-control app like a screen-sharing tool.", "Then they ask for payment or steal what is on your device."],
    caught: "Close the pop-up or turn off the device. If you installed an app, uninstall it and change your passwords from another device. Tell a trusted adult. If you paid, contact your bank quickly.",
    faq: [
      ["Can a website know my phone has a virus?", "No. A web page cannot scan your phone. Any page that says it found viruses is lying to scare you."],
      ["Should I install an app a stranger tells me to?", "Never. Apps that control your screen let the stranger see and do everything, including opening your bank app."],
      ["How do I close a scary pop-up?", "Close the browser tab or the whole browser. Do not tap buttons inside the pop-up, not even 'Cancel'."]
    ]
  },
  invest: {
    search: "investment scam",
    answer: "An investment scam promises to double your money quickly with 'guaranteed' profit and 'no risk', then asks you to invite friends before you can withdraw. Real investments can lose money, and no honest scheme guarantees fast doubling.",
    how: ["Someone shows screenshots of big profits.", "They promise 'double in 7 days, 100% guaranteed'.", "Early members may get paid, using money from new members.", "Withdrawals get blocked unless you bring more people, then the scheme collapses."],
    caught: "Stop adding money and do not bring friends in. Keep all chats and receipts, tell a trusted adult and report the scheme. In Nigeria, check if an investment company is registered with the Securities and Exchange Commission on its official website.",
    faq: [
      ["Can money really double in a week?", "No honest investment can promise that. 'Guaranteed' and 'no risk' together are one of the clearest scam signs."],
      ["Why do they ask me to invite friends?", "Because the scheme lives on new money. Your friends' money is used to pay older members, until it all collapses."],
      ["How do I check an investment company in Nigeria?", "Ask a trusted adult to look the company up on the official website of the Securities and Exchange Commission (SEC Nigeria) before any money is sent."]
    ]
  },
  job: {
    search: "fake job offer scam",
    answer: "A fake job offer promises big pay for easy work, skips proper interviews, and asks you to pay a 'registration', 'training' or 'processing' fee before you start. A real employer pays you; they never ask you to pay them to get the job.",
    how: ["An advert offers big daily pay for simple work from home.", "No experience or interview is needed.", "You must pay a fee or send your BVN or NIN to 'register'.", "After paying, the job never comes, or they ask for more fees."],
    caught: "Do not pay more. If you sent your BVN, NIN or bank details, tell a trusted adult and contact your bank. Report the advert and warn friends who saw it.",
    faq: [
      ["Do real jobs ask for a registration fee?", "No. Real employers pay you. A fee before you start is the clearest sign of a fake job."],
      ["Are scholarship offers that ask for a fee real?", "Be very careful. Real scholarships are announced on official school or government websites, and you apply there. A message asking for a 'processing fee' to secure a slot is a scam."],
      ["Should I send my BVN or NIN to get a job?", "Never send ID numbers to someone you only met on chat. They can be used to open accounts or steal money in your name."]
    ]
  },
  impersonate: {
    search: "impersonation scam",
    answer: "An impersonation scam is when someone pretends to be a friend, family member, teacher or official, often from a new number, and asks for urgent money or secrets. The fix is simple: contact the real person using a number you already have.",
    how: ["A message says 'Hi, it's me, I changed my number'.", "There is an emergency and they need money now.", "They ask you to keep it secret, often 'don't tell Mum'.", "Some pretend to be an exam office, police or customer care to scare you."],
    caught: "Do not send anything. Call the real person on their old, saved number. Tell a trusted adult. If you already sent money, contact your bank through official channels quickly and keep the messages.",
    faq: [
      ["My friend messaged from a new number asking for money. What do I do?", "Call their old number or ask a question only the real friend knows. Real friends will understand that you checked."],
      ["Why do scammers say 'don't tell your parents'?", "Because a trusted adult would spot the trick. Any message that asks you to keep secrets from your family is a red flag."],
      ["Can an exam office ask me to pay to release my result?", "Be very careful. Exam bodies publish fees on their official websites. A random message asking you to pay a number today is a scam."]
    ]
  }
};
