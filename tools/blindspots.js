#!/usr/bin/env node
/* tools/blindspots.js - THE BLIND-SPOT TEST for the offline checker.
   Run: node tools/blindspots.js
   It feeds the checker messages it has NEVER seen: scams people really get
   (English, Pidgin, Yoruba, Hausa, Igbo) and normal safe messages.
   A MISS        = a scam the checker called LOW.
   A FALSE ALARM = a safe message the checker called MEDIUM or HIGH.
   To keep the checker fresh: add new messages here, run, then teach js/data.js.
   HONEST SCORE HISTORY (Nov 2026)
     First run, before any fix:   23 of 41 scams caught. Yoruba, Hausa, Igbo: 1 of 11.
     Second batch, fresh wording:  8 of 15 caught before its fixes.
     So: a word list always trails new wording. Expect about half of brand-new
     scam styles to be missed until they are added. The AI second opinion and
     this monthly test are how we close the gap.
   Every message is made up for testing. Names and numbers are not real. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');

const SCAMS = [
  // --- English ---
  ['en', 'fake debit alert', 'Dear customer, your account has been debited N85,000. If you did not do this transaction, call our agent now on 0800 000 0000 to reverse it.'],
  ['en', 'BVN block', 'CBN NOTICE: Your BVN has been suspended due to incomplete KYC. Dial the code sent to you and send the OTP to this number to reactivate within 24hrs.'],
  ['en', 'NIN-SIM', 'NCC: Your SIM will be barred today. Your NIN is not linked. Reply with your NIN and date of birth to avoid disconnection.'],
  ['en', 'WhatsApp code', 'Hi, sorry I sent you a 6-digit code by SMS by mistake. Can you please send it back to me? It is urgent.'],
  ['en', 'new number', 'Hello mum, this is my new number, my phone fell in water. Please I need 15k for something at school today, send to this Opay account, I will explain later.'],
  ['en', 'job fee', 'Congratulations! You have been shortlisted for Shell graduate trainee 2026. Pay N5,500 for your medical form and aptitude slot to secure your place.'],
  ['en', 'task job', 'Earn N15,000 daily from home. Just like and follow YouTube videos. No experience. Message our HR manager on Telegram to start and get paid today.'],
  ['en', 'crypto doubling', 'Invest N20,000 and get N200,000 in 45 minutes. 100% guaranteed, no risk. I am a certified trader. DM me now, slots are limited.'],
  ['en', 'ponzi', 'Join our platform. Put in 50k and get 50% profit every week. Bring 2 friends and earn bonus. Withdraw any time. Register before it closes on Friday.'],
  ['en', 'POS reversal', 'I mistakenly sent N30,000 to your account just now. Please check your alert and send it back to this number, I am at the hospital.'],
  ['en', 'delivery fee', 'Your parcel from DHL is on hold at Lagos office. Pay N2,500 clearance fee through this link to release it today: dhl-ng-parcel.top/pay'],
  ['en', 'scholarship fee', 'You have been selected for the 2026 Federal Scholarship Award of N250,000. Pay N3,000 processing fee to get your award letter.'],
  ['en', 'JAMB upgrade', 'We upgrade JAMB scores. Add 80 marks to your UTME result before admission list. Pay half now and balance after. 100% sure, we have people inside JAMB.'],
  ['en', 'WAEC expo', 'WAEC 2026 expo. Get real questions and answers midnight before each paper. Subscribe N4,000 per subject. Whatsapp only, do not call.'],
  ['en', 'romance', 'My love, I am an engineer on an oil rig. I want to come and see you but my account is frozen. Please help me with $300 for the ticket, I will pay you back double. Do not tell anyone about us yet.'],
  ['en', 'sextortion', 'I have your pictures. Pay N50,000 before tonight or I will send them to all your friends and your school. Do not tell your parents.'],
  ['en', 'tech support', 'Your phone has 5 viruses! Install this cleaner app now and allow remote access so our Microsoft technician can fix it.'],
  ['en', 'giveaway', 'MTN 25th anniversary! You have won 50GB free data and N100,000. Click to claim and share with 10 WhatsApp groups: mtn-anniv-gift.xyz'],
  ['en', 'loan app', 'Instant loan N500,000 with no collateral, no BVN. Pay N4,000 insurance fee first and receive your loan in 5 minutes.'],
  ['en', 'account takeover', 'Instagram: someone tried to log in to your account. Verify your password here to keep your account: instagram-secure-help.online'],
  ['en', 'fake buyer', 'I want to buy your phone. I have paid, see the alert screenshot. My driver is coming to collect it now, give it to him quickly.'],
  ['en', 'grant', 'Tony Elumelu Foundation grant: you qualify for N1,500,000. Send your full name, account number, ATM card number and expiry date for payment.'],
  ['en', 'prayer money', 'Man of God saw a vision about you. Sow a seed of N10,000 today to this account so the danger will pass. Do not delay and do not tell anybody.'],
  ['en', 'school fees portal', 'Notice to parents: the school account has changed. Pay this term fees to the new account below today to avoid your child being sent home.'],
  ['en', 'gift card', 'Hi, this is your principal. I am in a meeting. Buy 3 iTunes gift cards of N10,000 and send me the codes now. I will refund you.'],
  // --- Pidgin ---
  ['pcm', 'new number', 'Abeg na me, I don change number. Help me with 10k sharp sharp, I go return am tomorrow. No tell mummy.'],
  ['pcm', 'prize', 'You don win N500,000 for our promo! Send your account number and ATM pin make we credit you now now.'],
  ['pcm', 'investment', 'Bros, this business dey pay. Put 20k today, collect 60k for 3 days. Sure plug, no be scam. Slot remain small.'],
  ['pcm', 'OTP', 'Na bank dey call. Dem send you one code now, abeg call the number give me make I block the thief wey dey your account.'],
  ['pcm', 'job', 'Work dey for Dubai, salary 400k. Just pay 25k for visa form make we process am this week. Hurry, e remain 3 space.'],
  // --- Yoruba ---
  ['yo', 'prize', 'E ku orire! E ti jawe olubori N200,000. E fi nomba account yin ati PIN ATM yin ranse ki a le san owo naa bayii.'],
  ['yo', 'new number', 'Mummy, emi ni. Nomba mi tuntun niyi. E jowo e fi owo N20,000 ranse si account yii kiakia, mo wa ninu wahala. E ma so fun enikeni.'],
  ['yo', 'fee', 'Ijoba n pin owo iranwo N50,000 fun gbogbo omo Naijiria. San N2,000 owo iforukosile ki o le gba tire loni.'],
  ['yo', 'OTP', 'Banki yin ni. A ti fi koodu OTP ranse si yin. E so koodu naa fun wa bayii ki a ma ba ti account yin pa.'],
  // --- Hausa ---
  ['ha', 'prize', 'Barka! Ka ci kyautar N300,000. Aiko da lambar asusun bankinka da PIN na ATM domin mu tura maka kudin yanzu.'],
  ['ha', 'new number', 'Baba, ni ne. Wannan sabuwar lambata ce. Don Allah ka tura min N15,000 yanzu yanzu, ina cikin matsala. Kada ka gaya wa kowa.'],
  ['ha', 'fee', 'Gwamnati tana raba tallafin N50,000 ga kowa. Biya N1,500 kudin rajista domin ka karbi naka yau.'],
  ['ha', 'OTP', 'Bankinku ne. Mun aiko muku lambar OTP. Ku gaya mana lambar yanzu domin kada a rufe asusunku.'],
  // --- Igbo ---
  ['ig', 'prize', 'Ekele! I meriri N250,000. Zite nomba akaunt gi na PIN ATM gi ka anyi kwuo gi ugwo ugbu a.'],
  ['ig', 'new number', 'Nne, o bu m. Nke a bu nomba ohuru m. Biko zitere m N10,000 ugbu a, a no m na nsogbu. Agwala onye obula.'],
  ['ig', 'fee', 'Gọọmenti na-ekesa ego enyemaka N50,000. Kwuo N2,000 ego ndebanye aha ka i nweta nke gi taa.']
];

const SAFE = [
  ['en', 'real debit alert', 'Debit: NGN 2,500.00 Acc: 012****789 Desc: POS purchase SHOPRITE Date: 14-Nov-2026 Bal: NGN 18,340.55'],
  ['en', 'real credit alert', 'Credit: NGN 10,000.00 from ADAEZE O. Acc: 012****789 Bal: NGN 28,340.55. Thank you for banking with us.'],
  ['en', 'school notice', 'Dear parents, the PTA meeting holds on Saturday 21 November at 10am in the school hall. Please come on time.'],
  ['en', 'school fees reminder', 'Reminder: second term school fees are due by 15 January. Pay at the bursar office or the school bank account printed on the bill.'],
  ['en', 'friend plan', 'Are you coming for football practice tomorrow? Coach said 4pm at the field. Bring water.'],
  ['en', 'mum', 'Please buy bread and eggs on your way home. I will give you the money when you get back.'],
  ['en', 'data bundle', 'You have used 80% of your 5GB data bundle. Dial the usual code on your phone to buy more data.'],
  ['en', 'OTP delivered', 'Your one-time code is 482913. Do not share it with anyone. Our staff will never ask for it.'],
  ['en', 'exam timetable', 'WAEC timetable: Mathematics is on Thursday 9am. Come with your photo card, pencil and calculator.'],
  ['en', 'church', 'Youth fellowship is by 5pm today. We will practise the songs for Sunday. Do not be late.'],
  ['en', 'delivery real', 'Your order has been shipped and will arrive between Tuesday and Thursday. You will pay nothing extra on delivery.'],
  ['en', 'teacher homework', 'Class, read chapter 4 of your Basic Science textbook and answer questions 1 to 5 before Monday.'],
  ['en', 'birthday', 'Happy birthday my guy! We are coming to your house by 3pm with cake. Tell your mum.'],
  ['en', 'bank advice', 'Security tip from your bank: we will never ask for your PIN, OTP or password by call, SMS or email.'],
  ['en', 'job real', 'Thank you for applying. Your interview is on Monday 10am at our office. Bring your CV. There is no fee at any stage.'],
  ['en', 'power', 'Notice: there will be no light in our area tomorrow from 9am to 3pm because of repairs on the transformer.'],
  ['en', 'coding club', 'ByteBusters coding club meets Wednesday after school in the computer lab. We are building our showcase website.'],
  ['pcm', 'friend', 'How far? You don chop? Make we go read for library by 2. I go wait you for gate.'],
  ['pcm', 'mum', 'Abeg when you dey come back, buy pepper and tomato from Mama Tola. I don give her the money.'],
  ['yo', 'greeting', 'E kaaro ma. Se daadaa ni e ji? Mo n bo wa ki yin ni irole oni.'],
  ['yo', 'school', 'Awon obi, ipade PTA yoo waye ni ojo Satide ni agogo mewa owuro ni gbongan ile-iwe.'],
  ['ha', 'greeting', 'Ina kwana? Yaya iyali? Zan zo gidanku gobe da yamma in sha Allah.'],
  ['ha', 'school', 'Iyaye, za a yi taron PTA ranar Asabar da karfe goma na safe a dakin taro na makaranta.'],
  ['ig', 'greeting', 'Ututu oma. Kedu ka i mere? Aga m abia ileta gi echi.'],
  ['en', 'transfer between friends', 'I have sent the N2,000 I owe you for the project materials. Check your account. Thanks for helping me.']
];

// --- SECOND BATCH (written after the first round of fixes, to see how the checker does on fresh wording) ---
[
  ["en", 'batch 2', "Your Opay wallet has been restricted. To lift the restriction, verify your details at opay-verify-ng.site before midnight."],
  ["en", 'batch 2', "Good day. I am Barrister James. A late client left $4.5 million with no next of kin. I need your help to claim it. You will get 40 percent."],
  ["en", 'batch 2', "NYSC/NPower recruitment 2026 is out. Fill the form and pay N2,000 to be shortlisted. Only 200 slots left."],
  ["en", 'batch 2', "Dear student, your JAMB profile has an error. Send your registration number and email password to correct it before result is released."],
  ["pcm", 'batch 2', "Oga, na wrong transfer I do. Na my pikin school fees. Abeg return the 25k to this account, God go bless you."],
  ["en", 'batch 2', "Baby I miss you. My dad is sick and the hospital wants a deposit. Can you send me 20k? I will pay back next week. Please don't let your people know."],
  ["en", 'batch 2', "Free 10GB for all Airtel users to celebrate Independence. Tap here to activate and send to 15 friends."],
  ["en", 'batch 2', "We are hiring models aged 13-17. No experience. Send your full pictures and your home address on WhatsApp to register."],
  ["ha", 'batch 2', "Sannu, an zabe ka domin samun kyautar waya iPhone. Tura lambar katin ATM dinka da OTP domin a kawo maka."],
  ["yo", 'batch 2', "E kaasan, a n wa awon osise. Owo osu N150,000. E san N3,000 fun fọọmu ki e le bere ise ni ose yii."],
  ["ig", 'batch 2', "Nwanne, akaunt m nwere nsogbu. Biko nyere m aka were akaunt gi nata ego, m ga-enye gi 10 percent."],
  ["en", 'batch 2', "Your Facebook page will be deleted for breaking the rules. Appeal here in 12 hours: fb-appeal-center.info"],
  ["en", 'batch 2', "Hello, I am calling from your bank's fraud desk. Someone is taking money now. Read me the numbers on the front and back of your card so I can stop it."],
  ["en", 'batch 2', "Buy this PS5 for N80,000 only, brand new. Pay before delivery to the account below. Many buyers waiting."],
  ["en", 'batch 2', "Double your airtime! Send N500 airtime to this number and get N2,000 back instantly."]
].forEach(x => SCAMS.push(x));
[
  ["en", 'batch 2', "Your Uber code is 4471. Never share this code."],
  ["en", 'batch 2', "Hi dear students, the Mathematics test has been moved to Friday. Revise fractions and decimals."],
  ["en", 'batch 2', "Daddy please can you send me 2k for transport? I am at the bus stop near school."],
  ["en", 'batch 2', "Your electricity token is 1234-5678-9012-3456-7890. Units: 45.6kWh. Thank you."],
  ["en", 'batch 2', "The library will close early today by 2pm for cleaning."],
  ["en", 'batch 2', "Welcome to the class WhatsApp group. Please do not post adverts here."],
  ["en", 'batch 2', "Your JAMB registration was successful. Print your slip from the official portal when it is ready."],
  ["yo", 'batch 2', "Mo ti de ile. Se e ti jeun? E pe mi ti e ba raye."],
  ["pcm", 'batch 2', "Na tomorrow be the match. Come with your jersey and boots."],
  ["en", 'batch 2', "Your flight is confirmed for 2 December. Check in opens 24 hours before departure."],
  ["en", 'batch 2', "Thanks for your payment of N5,000. Your receipt number is 88213."]
].forEach(x => SAFE.push(x));

const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/data.js'), 'utf8') + ';globalThis.D={RED_FLAGS};', ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/checker.js'), 'utf8'), ctx);
const check = t => { const f = ctx.ScamChecker.findFlags(t, ctx.D.RED_FLAGS); const r = f.reduce((n, x) => n + x.flag.weight, 0); return { level: r >= 6 ? 'high' : r >= 3 ? 'medium' : 'low', ids: f.map(x => x.flag.id) }; };

const misses = SCAMS.map(s => [s, check(s[2])]).filter(x => x[1].level === 'low');
const alarms = SAFE.map(s => [s, check(s[2])]).filter(x => x[1].level !== 'low');
const high = SCAMS.filter(s => check(s[2]).level === 'high').length;
const show = list => list.forEach(([s, r]) => console.log(`   [${s[0]}] ${s[1]} -> ${r.level.toUpperCase()} (${r.ids.join(', ') || 'no flags'})`));
console.log(`Scams: ${SCAMS.length - misses.length} of ${SCAMS.length} caught (${high} HIGH). Safe: ${SAFE.length - alarms.length} of ${SAFE.length} left alone.`);
if (misses.length) { console.log('\nMISSES (scams called LOW):'); show(misses); }
if (alarms.length) { console.log('\nFALSE ALARMS (safe messages flagged):'); show(alarms); }
module.exports = { SCAMS, SAFE, misses: misses.length, alarms: alarms.length };
if (require.main === module && process.argv.includes('--strict') && (misses.length > SCAMS.length * 0.1 || alarms.length > 3)) process.exit(1);
