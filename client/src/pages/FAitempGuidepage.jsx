import { useState, useEffect, useRef } from 'react';

// ─── Data ─────────────────────────────────────────────────────────────────────

const SCENARIOS = [
  {
    id: 'heart_attack',
    emoji: '❤️',
    name: 'Heart Attack',
    nameHi: 'दिल का दौरा',
    severity: 'critical',          // critical | high | medium | low
    callEmergency: true,
    tip: 'Aspirin (325mg) chaba ke khao — agar allergy nahi hai toh. Swallow mat karo.',
    tipHi: 'Aspirin (325mg) चबाएं — अगर एलर्जी नहीं है तो। निगलें नहीं।',
    steps: [
      {
        icon: '📞',
        title: '112 call karo',
        titleHi: '112 कॉल करें',
        desc: 'Turant ambulance bulao. Location clearly batao. Call mat kaato.',
        descHi: 'तुरंत एम्बुलेंस बुलाएं। लोकेशन clearly बताएं। कॉल मत काटें।',
        duration: null,
      },
      {
        icon: '🛋️',
        title: 'Patient ko comfortable position mein lao',
        titleHi: 'मरीज को आरामदायक position में लाएं',
        desc: 'Half-sitting (45°) ya flat lita do. Tight kapde aur belt dhili karo. Hila mat.',
        descHi: 'Half-sitting (45°) या flat लेटा दें। टाइट कपड़े और बेल्ट ढीले करें।',
        duration: null,
      },
      {
        icon: '💊',
        title: 'Aspirin do (agar available hai)',
        titleHi: 'Aspirin दें (अगर उपलब्ध है)',
        desc: '325mg aspirin chaba ke khane ko kaho. Allergy check karo pehle.',
        descHi: '325mg aspirin चबाकर खाने को कहें। पहले एलर्जी check करें।',
        duration: null,
      },
      {
        icon: '😮‍💨',
        title: 'Breathing check karo',
        titleHi: 'सांस चेक करें',
        desc: '10 seconds tak chest movement dekho. Agar breathing band ho jaye — CPR shuru karo.',
        descHi: '10 सेकंड तक chest movement देखें। अगर सांस बंद हो जाए — CPR शुरू करें।',
        duration: 10,
      },
      {
        icon: '🤲',
        title: 'CPR: 30 chest compressions',
        titleHi: 'CPR: 30 chest compressions',
        desc: 'Dono haath chest ke center mein rakho. 5–6 cm gehrai mein press karo, 100–120 per minute ki speed se.',
        descHi: 'दोनों हाथ chest के center में रखें। 5–6 cm गहराई में press करें, 100–120 प्रति मिनट की speed से।',
        duration: 18,
      },
      {
        icon: '💨',
        title: 'CPR: 2 rescue breaths',
        titleHi: 'CPR: 2 rescue breaths',
        desc: 'Naak band karo, muh seal karke 2 baar breath do. 30:2 cycle tab tak jaari rakho jab tak ambulance aaye.',
        descHi: 'नाक बंद करें, मुंह से seal करके 2 बार सांस दें। 30:2 cycle तब तक जारी रखें जब तक एम्बुलेंस आए।',
        duration: null,
      },
      {
        icon: '🏥',
        title: 'Ambulance aane par info do',
        titleHi: 'एम्बुलेंस आने पर जानकारी दें',
        desc: 'Patient ki age, medicines, allergies, aur symptoms ka time ambulance team ko batao.',
        descHi: 'मरीज की उम्र, दवाइयां, एलर्जी, और symptoms का समय एम्बुलेंस टीम को बताएं।',
        duration: null,
      },
    ],
  },
  {
    id: 'unconscious',
    emoji: '😵',
    name: 'Behosh / Unconscious',
    nameHi: 'बेहोश',
    severity: 'critical',
    callEmergency: true,
    tip: 'Behosh person ko kuch khilao / pilao mat — choking ka risk hai.',
    tipHi: 'बेहोश व्यक्ति को कुछ खिलाएं/पिलाएं नहीं — choking का खतरा है।',
    steps: [
      {
        icon: '🔊',
        title: 'Response check karo',
        titleHi: 'Response चेक करें',
        desc: 'Naam pukaro, kaandha hika ke check karo. Agar koi response nahi — 112 call karo.',
        descHi: 'नाम पुकारें, कंधा हिलाकर देखें। कोई response नहीं — 112 call करें।',
        duration: null,
      },
      {
        icon: '📞',
        title: '112 call karo',
        titleHi: '112 कॉल करें',
        desc: 'Location, age, aur symptoms clearly batao. Speaker pe rakh ke guide lo.',
        descHi: 'Location, उम्र, और symptoms clearly बताएं। Speaker पर रखकर guide लें।',
        duration: null,
      },
      {
        icon: '🫁',
        title: 'Breathing check karo',
        titleHi: 'सांस चेक करें',
        desc: '10 second mein chest movement dekho. Munh se hawa feel karo.',
        descHi: '10 सेकंड में chest movement देखें। मुंह से हवा feel करें।',
        duration: 10,
      },
      {
        icon: '↩️',
        title: 'Recovery position mein rakho',
        titleHi: 'Recovery position में रखें',
        desc: 'Agar breathe kar raha hai: left side mein lita do. Sar thoda peeche tilt karo — airway khulega.',
        descHi: 'अगर सांस ले रहा है: left side में लेटाएं। सिर थोड़ा पीछे tilt करें — airway खुलेगी।',
        duration: null,
      },
      {
        icon: '🤲',
        title: 'Breathing nahi — CPR shuru karo',
        titleHi: 'सांस नहीं — CPR शुरू करें',
        desc: '30 chest compressions + 2 rescue breaths. Tab tak jaari rakho jab tak help aaye.',
        descHi: '30 chest compressions + 2 rescue breaths। तब तक जारी रखें जब तक help आए।',
        duration: null,
      },
      {
        icon: '🌡️',
        title: 'Warm rakkho, move mat karo',
        titleHi: 'गर्म रखें, हिलाएं नहीं',
        desc: 'Blanket/dupatte se dhako. Spine injury ka risk — professional aane tak mat hilao.',
        descHi: 'कंबल/दुपट्टे से ढकें। Spine injury का risk — professional आने तक हिलाएं नहीं।',
        duration: null,
      },
    ],
  },
  {
    id: 'poisoning',
    emoji: '☠️',
    name: 'Bachche ne kuch Nigal Liya',
    nameHi: 'बच्चे ने कुछ निगल लिया',
    severity: 'high',
    callEmergency: true,
    tip: 'Vomit karana MAT — chemicals wapas aakar throat damage kar sakte hain.',
    tipHi: 'उल्टी करवाएं नहीं — chemicals वापस आकर गले को नुकसान पहुंचा सकते हैं।',
    steps: [
      {
        icon: '🔍',
        title: 'Kya nigala — pata karo',
        titleHi: 'क्या निगला — पता करें',
        desc: 'Container / packet dhundho. Kya item, kitni quantity, kab — note karo. Bachche ki age/weight yaad karo.',
        descHi: 'Container/packet ढूंढें। क्या item, कितनी quantity, कब — note करें। बच्चे की उम्र/वजन याद करें।',
        duration: null,
      },
      {
        icon: '📞',
        title: 'Poison helpline / 112 call karo',
        titleHi: 'Poison helpline / 112 कॉल करें',
        desc: 'India Poison Control: 1800-116-117 (toll free). Exact item aur quantity batao.',
        descHi: 'India Poison Control: 1800-116-117 (toll free)। Exact item और quantity बताएं।',
        duration: null,
      },
      {
        icon: '🚫',
        title: 'Vomit KARANA MAT',
        titleHi: 'उल्टी करवाएं नहीं',
        desc: 'Koi bhi cheez pilao ya khilao mat jab tak doctor na kahe. Milk bhi nahi.',
        descHi: 'कोई भी चीज़ पिलाएं/खिलाएं नहीं जब तक डॉक्टर न कहे। दूध भी नहीं।',
        duration: null,
      },
      {
        icon: '👁️',
        title: 'Symptoms observe karo',
        titleHi: 'Symptoms observe करें',
        desc: 'Breathing, skin color, alertness check karo. Seizure ya unconsciousness — turant 112.',
        descHi: 'Breathing, skin color, alertness चेक करें। Seizure या बेहोशी — तुरंत 112।',
        duration: null,
      },
      {
        icon: '🏥',
        title: 'Hospital le jao — container saath lo',
        titleHi: 'Hospital ले जाएं — container साथ लें',
        desc: 'Woh container/packet/pill strip saath le jaao — doctors ko exact info chahiye hogi.',
        descHi: 'वह container/packet/pill strip साथ ले जाएं — डॉक्टरों को exact जानकारी चाहिए होगी।',
        duration: null,
      },
    ],
  },
  {
    id: 'burns',
    emoji: '🔥',
    name: 'Burns / Jalana',
    nameHi: 'जलना',
    severity: 'high',
    callEmergency: false,
    tip: 'Toothpaste, ghee, ya koi cream BILKUL mat lagao — infection aur badhega.',
    tipHi: 'Toothpaste, घी, या कोई cream बिल्कुल नहीं लगाएं — infection और बढ़ेगा।',
    steps: [
      {
        icon: '🚿',
        title: 'Cool running water daalo — 20 min',
        titleHi: 'ठंडा पानी डालें — 20 मिनट',
        desc: 'Thanda (not ice cold) paani 20 minute tak daalo. Ice, butter, toothpaste bilkul nahi.',
        descHi: 'ठंडा (ice cold नहीं) पानी 20 मिनट तक डालें। Ice, butter, toothpaste बिल्कुल नहीं।',
        duration: 1200,
      },
      {
        icon: '✂️',
        title: 'Kapde aur jewelry gently hatao',
        titleHi: 'कपड़े और गहने धीरे से हटाएं',
        desc: 'Chipke kapde mat kheencho. Jewelry hatao — swelling ke baad nikaalna mushkil hoga.',
        descHi: 'चिपके कपड़े नहीं खींचें। Jewelry हटाएं — सूजन के बाद निकालना मुश्किल होगा।',
        duration: null,
      },
      {
        icon: '🩹',
        title: 'Loosely dhako',
        titleHi: 'ढीला ढकें',
        desc: 'Saaf plastic wrap ya saaf kapde se loosely dhako. Tight mat karo — circulation block hoga.',
        descHi: 'साफ plastic wrap या साफ कपड़े से ढीला ढकें। Tight नहीं — circulation block होगा।',
        duration: null,
      },
      {
        icon: '💊',
        title: 'Dard ke liye paracetamol',
        titleHi: 'दर्द के लिए paracetamol',
        desc: 'Paracetamol ya ibuprofen de sakte ho. Blisters mat phodo — infection ka risk.',
        descHi: 'Paracetamol या ibuprofen दे सकते हैं। Blisters मत फोड़ें — infection का खतरा।',
        duration: null,
      },
      {
        icon: '🏥',
        title: 'Doctor kab jaana hai',
        titleHi: 'Doctor कब जाना है',
        desc: 'Face/hands/genitals pe burns, ya 3cm se bade burns, ya deep burns — hospital zaroor jao.',
        descHi: 'Face/hands/genitals पर burns, या 3cm से बड़े burns, या deep burns — hospital ज़रूर जाएं।',
        duration: null,
      },
    ],
  },
  {
    id: 'fracture',
    emoji: '🦴',
    name: 'Fracture / Tuti Haddi',
    nameHi: 'टूटी हड्डी',
    severity: 'medium',
    callEmergency: false,
    tip: 'Haddi ko forcefully straighten karne ki koshish MAT karo — nerve ya blood vessel damage ho sakti hai.',
    tipHi: 'हड्डी को जबरदस्ती सीधा करने की कोशिश नहीं करें — nerve या blood vessel damage हो सकती है।',
    steps: [
      {
        icon: '🛑',
        title: 'Move mat karo — immobilize karo',
        titleHi: 'हिलाएं नहीं — immobilize करें',
        desc: 'Fractured part ko bilkul mat hilao. Patient ko bhi stable rakho.',
        descHi: 'Fractured part को बिल्कुल नहीं हिलाएं। मरीज को भी stable रखें।',
        duration: null,
      },
      {
        icon: '🧊',
        title: 'Ice pack lagao',
        titleHi: 'Ice pack लगाएं',
        desc: 'Kapde mein wrap karke ice lagao. 20 min on, 20 min off. Swelling aur dard kam hoga.',
        descHi: 'कपड़े में लपेटकर ice लगाएं। 20 min on, 20 min off। सूजन और दर्द कम होगा।',
        duration: 1200,
      },
      {
        icon: '🪵',
        title: 'Splint banao',
        titleHi: 'Splint बनाएं',
        desc: 'Stick ya cardboard se injured part ko support do. Kapde se loosely baandho — tight nahi.',
        descHi: 'Stick या cardboard से injured part को support दें। कपड़े से ढीला बांधें — tight नहीं।',
        duration: null,
      },
      {
        icon: '💜',
        title: 'Circulation check karo',
        titleHi: 'Circulation चेक करें',
        desc: 'Har 10 min mein fingers/toes ki feeling check karo. Numbness ya blue color — splint dhila karo.',
        descHi: 'हर 10 मिनट में fingers/toes की feeling चेक करें। सुन्नपन या नीला रंग — splint ढीला करें।',
        duration: 600,
      },
      {
        icon: '🏥',
        title: 'Hospital jao — X-ray zaroori hai',
        titleHi: 'Hospital जाएं — X-ray ज़रूरी है',
        desc: 'Open fracture (haddi bahar dikhti ho) mein turant 112. Warna jaldi hospital le jao.',
        descHi: 'Open fracture (हड्डी बाहर दिखती हो) में तुरंत 112। वरना जल्दी hospital ले जाएं।',
        duration: null,
      },
    ],
  },
  {
    id: 'bleeding',
    emoji: '🩸',
    name: 'Bleeding / Khoon aana',
    nameHi: 'खून आना',
    severity: 'high',
    callEmergency: false,
    tip: 'Koi object wound mein ghusa ho — nikalo MAT. Uske around pressure dalo.',
    tipHi: 'कोई object wound में घुसा हो — निकालें नहीं। उसके around pressure दें।',
    steps: [
      {
        icon: '🧤',
        title: 'Apni safety pehle',
        titleHi: 'अपनी safety पहले',
        desc: 'Gloves pahno ya plastic bag use karo. Dusre ka khoon direct touch mat karo.',
        descHi: 'Gloves पहनें या plastic bag use करें। दूसरे का खून directly touch नहीं करें।',
        duration: null,
      },
      {
        icon: '🤲',
        title: 'Direct pressure do — 10 min tak',
        titleHi: '10 मिनट तक direct pressure दें',
        desc: 'Saaf kapde se ghav pe seedha dabao. Kam se kam 10 min tak. Dabana band mat karo check karne ke liye.',
        descHi: 'साफ कपड़े से घाव पर सीधा दबाएं। कम से कम 10 मिनट तक। जांचने के लिए दबाना बंद नहीं करें।',
        duration: 600,
      },
      {
        icon: '⬆️',
        title: 'Injured part upar uthao',
        titleHi: 'Injured part ऊपर उठाएं',
        desc: 'Haath ya pair pe hai toh dil se upar uthao — gravity se blood flow kam hoga.',
        descHi: 'हाथ या पैर पर है तो दिल से ऊपर उठाएं — gravity से blood flow कम होगा।',
        duration: null,
      },
      {
        icon: '🩹',
        title: 'Bandage baandho',
        titleHi: 'Bandage बांधें',
        desc: 'Kapda bhig jaye toh utar ke naya nahi — upar se naya dalo. Zyada tight mat karo.',
        descHi: 'कपड़ा भीग जाए तो उतारकर नया नहीं — ऊपर से नया डालें। बहुत tight नहीं बांधें।',
        duration: null,
      },
      {
        icon: '📞',
        title: '112 kab call karo',
        titleHi: '112 कब call करें',
        desc: '10 min mein khoon band na ho, bahut zyada blood loss ho, ya wound bahut deep/bada ho.',
        descHi: '10 मिनट में खून बंद न हो, बहुत ज़्यादा blood loss हो, या wound बहुत deep/बड़ा हो।',
        duration: null,
      },
    ],
  },
  {
    id: 'snakebite',
    emoji: '🐍',
    name: 'Snake Bite',
    nameHi: 'सांप का काटना',
    severity: 'critical',
    callEmergency: true,
    tip: 'Saanp ko maaro mat — zyada accidents isi mein hote hain. Snake ki photo lene ki bhi zaroorat nahi.',
    tipHi: 'सांप को मारें नहीं — ज़्यादा accidents इसी में होते हैं। सांप की photo लेने की भी ज़रूरत नहीं।',
    steps: [
      {
        icon: '🏃',
        title: 'Saanp se door ho jao',
        titleHi: 'सांप से दूर हो जाएं',
        desc: 'Patient aur sab saanp se door ho jao. Hilo mat zyada — movement se venom jaldi failta hai.',
        descHi: 'मरीज और सब सांप से दूर हो जाएं। ज़्यादा नहीं हिलें — movement से venom जल्दी फैलता है।',
        duration: null,
      },
      {
        icon: '📞',
        title: 'Turant 112 call karo',
        titleHi: 'तुरंत 112 call करें',
        desc: 'Anti-venom sirf hospital mein milta hai. Ek minute bhi mat gawao.',
        descHi: 'Anti-venom सिर्फ hospital में मिलता है। एक मिनट भी नहीं गंवाएं।',
        duration: null,
      },
      {
        icon: '🛋️',
        title: 'Lita do — shant rakho',
        titleHi: 'लेटाएं — शांत रखें',
        desc: 'Bitten part ko dil ke neeche rakho. Panic aur movement se venom jaldi failti hai.',
        descHi: 'Bitten part को दिल से नीचे रखें। Panic और movement से venom जल्दी फैलती है।',
        duration: null,
      },
      {
        icon: '✂️',
        title: 'Ring/watch/jewelry nikalo',
        titleHi: 'Ring/watch/jewelry निकालें',
        desc: 'Bitten area ke aas paas se sab jewelry hatao — swelling se baad nikaalna impossible ho jayega.',
        descHi: 'Bitten area के आसपास से सब jewelry हटाएं — सूजन से बाद निकालना impossible हो जाएगा।',
        duration: null,
      },
      {
        icon: '🚫',
        title: 'Yeh BILKUL mat karo',
        titleHi: 'यह बिल्कुल नहीं करें',
        desc: 'Zehr mat choosno. Tourniquet / kapda mat baandho. Cut mat lagao. Barf mat lagao. Yeh sab galat hain.',
        descHi: 'ज़हर मत चूसें। Tourniquet/कपड़ा मत बांधें। Cut मत लगाएं। बर्फ मत लगाएं। यह सब गलत है।',
        duration: null,
      },
      {
        icon: '⏱️',
        title: 'Time note karo',
        titleHi: 'समय note करें',
        desc: 'Bite ka exact time, symptoms ka time — doctors ko ye info chahiye hogi. Kitna swelling hua — mark karo.',
        descHi: 'Bite का exact समय, symptoms का समय — डॉक्टरों को यह जानकारी चाहिए होगी।',
        duration: null,
      },
    ],
  },
  {
    id: 'choking',
    emoji: '😤',
    name: 'Choking / Kuch Fas Gaya',
    nameHi: 'गले में फंसना',
    severity: 'critical',
    callEmergency: true,
    tip: 'Agar koi khud khaas raha hai ya baat kar sakta hai — unhe khud nikalne do. Tab tak haath mat lagao.',
    tipHi: 'अगर कोई खुद खांस रहा है या बात कर सकता है — उन्हें खुद निकालने दें। तब तक हाथ मत लगाएं।',
    steps: [
      {
        icon: '🔊',
        title: 'Severity assess karo',
        titleHi: 'Severity assess करें',
        desc: 'Kya baat kar sakte hain? Agar haan — strong khaansi ke liye encourage karo. Agar nahi — agla step.',
        descHi: 'क्या बात कर सकते हैं? अगर हां — strong खांसी के लिए encourage करें। अगर नहीं — अगला step।',
        duration: null,
      },
      {
        icon: '👊',
        title: '5 back blows do',
        titleHi: '5 back blows दें',
        desc: 'Patient ke side mein khado. Ek haath se chest pakdo. Doosre haath se shoulder blades ke beech mein 5 baar strong thok do.',
        descHi: 'मरीज के side में खड़े हों। एक हाथ से chest पकड़ें। दूसरे हाथ से shoulder blades के बीच 5 बार ज़ोर से थोकें।',
        duration: null,
      },
      {
        icon: '🫃',
        title: '5 abdominal thrusts (Heimlich)',
        titleHi: '5 abdominal thrusts (Heimlich)',
        desc: 'Patient ke peeche khado. Ek mutti navel ke upar rakh. Doosra haath upar. Andar-upar ki taraf 5 baar jhatka do.',
        descHi: 'मरीज के पीछे खड़े हों। एक मुट्ठी navel के ऊपर रखें। दूसरा हाथ ऊपर। अंदर-ऊपर की तरफ 5 बार झटका दें।',
        duration: null,
      },
      {
        icon: '🔄',
        title: 'Alternate karte raho',
        titleHi: 'Alternate करते रहें',
        desc: '5 back blows + 5 abdominal thrusts — yeh cycle tab tak repeat karo jab tak cheez nikal na jaye ya ambulance na aaye.',
        descHi: '5 back blows + 5 abdominal thrusts — यह cycle तब तक repeat करें जब तक चीज़ न निकले या एम्बुलेंस न आए।',
        duration: null,
      },
      {
        icon: '👶',
        title: 'Bachche ke liye (< 1 year)',
        titleHi: 'बच्चे के लिए (< 1 साल)',
        desc: 'Abdominal thrust mat karo. Forearm pe ulta lita ke 5 back blows do. Phir chest pe 2 fingers se 5 chest thrusts.',
        descHi: 'Abdominal thrust नहीं। Forearm पर उल्टा लेटाकर 5 back blows दें। फिर chest पर 2 fingers से 5 chest thrusts।',
        duration: null,
      },
    ],
  },
];

const SEVERITY_CONFIG = {
  critical: { label: 'CRITICAL', labelHi: 'गंभीर', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' },
  high:     { label: 'HIGH',     labelHi: 'उच्च',    color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)' },
  medium:   { label: 'MEDIUM',   labelHi: 'मध्यम',  color: '#eab308', bg: 'rgba(234,179,8,0.12)',  border: 'rgba(234,179,8,0.3)'  },
  low:      { label: 'LOW',      labelHi: 'कम',      color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)'  },
};

// ─── Timer Hook ───────────────────────────────────────────────────────────────

function useTimer(seconds) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning]     = useState(false);
  const intervalRef               = useRef(null);

  useEffect(() => {
    setRemaining(seconds);
    setRunning(false);
    clearInterval(intervalRef.current);
  }, [seconds]);

  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) { clearInterval(intervalRef.current); setRunning(false); return 0; }
          return r - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const toggle = () => { if (remaining > 0) setRunning((r) => !r); };
  const reset  = () => { clearInterval(intervalRef.current); setRunning(false); setRemaining(seconds); };

  return { remaining, running, toggle, reset, done: remaining === 0 };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TimerBadge({ seconds }) {
  const { remaining, running, toggle, reset, done } = useTimer(seconds);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pct  = ((seconds - remaining) / seconds) * 100;

  return (
    <div style={{ marginTop: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '10px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: done ? '#22c55e' : '#15b38a', borderRadius: 2, transition: 'width 1s linear' }} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: done ? '#4ade80' : '#e2e8f0', minWidth: 44 }}>
          {done ? '✓ Done' : `${mins}:${String(secs).padStart(2, '0')}`}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={toggle} style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', background: done ? 'rgba(34,197,94,0.2)' : '#15b38a', color: done ? '#4ade80' : 'white', fontSize: 12, fontWeight: 600, cursor: done ? 'default' : 'pointer' }}>
          {done ? '✓ Completed' : running ? '⏸ Pause' : '▶ Start Timer'}
        </button>
        {!done && <button onClick={reset} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: 'rgba(255,255,255,0.07)', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>↺</button>}
      </div>
    </div>
  );
}

function StepCard({ step, index, active, done, lang, color }) {
  const title = lang === 'hi' ? step.titleHi : step.title;
  const desc  = lang === 'hi' ? step.descHi  : step.desc;

  return (
    <div style={{
      display: 'flex', gap: 14, padding: '14px 0',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      opacity: done ? 0.6 : active ? 1 : 0.35,
      transition: 'opacity 0.3s',
    }}>
      {/* Left — number + line */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700,
          background: done ? 'rgba(34,197,94,0.2)' : active ? color : 'rgba(255,255,255,0.08)',
          color:      done ? '#4ade80'              : active ? 'white' : '#94a3b8',
          border:     done ? '1.5px solid #4ade80'  : active ? `1.5px solid ${color}` : '1.5px solid rgba(255,255,255,0.1)',
          boxShadow:  active && !done ? `0 0 14px ${color}55` : 'none',
          transition: 'all 0.3s',
        }}>
          {done ? '✓' : index + 1}
        </div>
        <div style={{ width: 1.5, flex: 1, minHeight: 16, background: active ? `${color}66` : 'rgba(255,255,255,0.06)' }} />
      </div>

      {/* Icon */}
      <div style={{
        width: 38, height: 38, borderRadius: 8, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20,
        background: active ? `${color}22` : 'rgba(255,255,255,0.04)',
        border: active ? `1px solid ${color}44` : '1px solid rgba(255,255,255,0.06)',
        alignSelf: 'flex-start',
      }}>
        {step.icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: active ? '#f1f5f9' : '#cbd5e1', marginBottom: 4 }}>{title}</p>
        <p style={{ fontSize: 12, color: active ? '#cbd5e1' : '#64748b', lineHeight: 1.6 }}>{desc}</p>
        {active && step.duration && <TimerBadge seconds={step.duration} />}
      </div>
    </div>
  );
}

function ScenarioDetail({ scenario, lang, onClose }) {
  const [activeStep, setActiveStep] = useState(0);
  const sev = SEVERITY_CONFIG[scenario.severity];

  const tip = lang === 'hi' ? scenario.tipHi : scenario.tip;
  const name = lang === 'hi' ? scenario.nameHi : scenario.name;

  const goNext = () => setActiveStep((s) => Math.min(s + 1, scenario.steps.length - 1));
  const goPrev = () => setActiveStep((s) => Math.max(s - 1, 0));

  return (
    <div style={{ animation: 'slideUp 0.25s ease' }}>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>

      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <span style={{ fontSize: 32 }}>{scenario.emoji}</span>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, padding: '2px 8px', borderRadius: 4, background: sev.bg, color: sev.color, border: `1px solid ${sev.border}`, display: 'inline-block', marginBottom: 4 }}>
            {sev.label}
          </span>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>{name}</p>
        </div>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.07)', color: '#94a3b8', cursor: 'pointer', fontSize: 16 }}>✕</button>
      </div>

      {/* Emergency call banner */}
      {scenario.callEmergency && (
        <div style={{ margin: '16px 20px 0', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>📞</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#fca5a5' }}>EMERGENCY — 112 call karo abhi</p>
            <p style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>Yeh steps ambulance aane tak karo</p>
          </div>
          <a href="tel:112" style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>
            Call 112
          </a>
        </div>
      )}

      {/* Progress */}
      <div style={{ padding: '14px 20px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>
          Step {activeStep + 1} / {scenario.steps.length}
        </span>
        <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((activeStep + 1) / scenario.steps.length) * 100}%`, background: sev.color, borderRadius: 2, transition: 'width 0.4s ease' }} />
        </div>
        <span style={{ fontSize: 11, color: '#64748b' }}>{Math.round(((activeStep + 1) / scenario.steps.length) * 100)}%</span>
      </div>

      {/* Steps list */}
      <div style={{ padding: '6px 20px 6px' }}>
        {scenario.steps.map((step, i) => (
          <div key={i} onClick={() => setActiveStep(i)} style={{ cursor: 'pointer' }}>
            <StepCard step={step} index={i} active={i === activeStep} done={i < activeStep} lang={lang} color={sev.color} />
          </div>
        ))}
      </div>

      {/* Tip box */}
      <div style={{ margin: '0 20px 16px', background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 8 }}>
        <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>⚠️</span>
        <p style={{ fontSize: 12, color: '#fde047', lineHeight: 1.6 }}><strong>Important:</strong> {tip}</p>
      </div>

      {/* Nav buttons */}
      <div style={{ display: 'flex', gap: 10, padding: '0 20px 20px' }}>
        <button onClick={goPrev} disabled={activeStep === 0} style={{ flex: 1, padding: '11px 0', borderRadius: 9, border: 'none', background: 'rgba(255,255,255,0.07)', color: '#94a3b8', fontSize: 13, fontWeight: 600, cursor: activeStep === 0 ? 'not-allowed' : 'pointer', opacity: activeStep === 0 ? 0.4 : 1 }}>
          ← Pehla Step
        </button>
        <button onClick={goNext} disabled={activeStep === scenario.steps.length - 1} style={{ flex: 2, padding: '11px 0', borderRadius: 9, border: 'none', background: activeStep === scenario.steps.length - 1 ? 'rgba(255,255,255,0.07)' : '#15b38a', color: activeStep === scenario.steps.length - 1 ? '#475569' : 'white', fontSize: 13, fontWeight: 600, cursor: activeStep === scenario.steps.length - 1 ? 'not-allowed' : 'pointer' }}>
          {activeStep === scenario.steps.length - 1 ? '✓ All Steps Done' : 'Agla Step →'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page Component ───────────────────────────────────────────────────────

export default function FirstAidGuidePage() {
  const [selected, setSelected] = useState(null);
  const [lang, setLang]         = useState('en'); // 'en' | 'hi'
  const [search, setSearch]     = useState('');

  const filtered = SCENARIOS.filter((s) => {
    const q = search.toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || s.nameHi.includes(q);
  });

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── Page Header ── */}
      <div style={{ padding: '24px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 46, height: 46, background: 'linear-gradient(135deg,#ef4444,#b91c1c)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
              🚑
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>First Aid Guide</h1>
              <p style={{ fontSize: 13, color: '#64748b', margin: '3px 0 0' }}>
                {lang === 'hi' ? 'आपातकाल में step-by-step instructions' : 'Step-by-step emergency instructions — works offline'}
              </p>
            </div>
          </div>
          {/* Language toggle */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 3, gap: 3, flexShrink: 0 }}>
            {['en', 'hi'].map((l) => (
              <button key={l} onClick={() => setLang(l)} style={{
                padding: '5px 14px', borderRadius: 6, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: lang === l ? '#15b38a' : 'transparent',
                color:      lang === l ? 'white'   : '#94a3b8',
                transition: 'all 0.2s',
              }}>
                {l === 'en' ? 'EN' : 'हिं'}
              </button>
            ))}
          </div>
        </div>

        {/* Offline badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 20, padding: '4px 12px', marginBottom: 20 }}>
          <span style={{ width: 6, height: 6, background: '#4ade80', borderRadius: '50%', display: 'inline-block' }} />
          <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 500 }}>Works Offline — No internet needed</span>
        </div>
      </div>

      {/* ── Search ── */}
      {!selected && (
        <div style={{ padding: '0 24px 16px' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#64748b' }}>🔍</span>
            <input
              type="text"
              placeholder={lang === 'hi' ? 'Emergency search करें...' : 'Search emergency...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '11px 14px 11px 40px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#e2e8f0', fontSize: 14, outline: 'none' }}
            />
          </div>
        </div>
      )}

      {/* ── Content ── */}
      {selected ? (
        <div style={{ background: '#1e293b', margin: '0 24px 24px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <ScenarioDetail scenario={selected} lang={lang} onClose={() => setSelected(null)} />
        </div>
      ) : (
        <div style={{ padding: '0 24px 32px' }}>
          {/* Severity legend */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {Object.entries(SEVERITY_CONFIG).map(([key, cfg]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, display: 'inline-block' }} />
                <span style={{ fontSize: 11, color: '#64748b' }}>{cfg.label}</span>
              </div>
            ))}
          </div>

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
            {filtered.map((s) => {
              const sev = SEVERITY_CONFIG[s.severity];
              return (
                <button key={s.id} onClick={() => { setSelected(s); setSearch(''); }}
                  style={{
                    background: '#1e293b', border: `1px solid rgba(255,255,255,0.07)`,
                    borderRadius: 14, padding: '18px 14px', cursor: 'pointer',
                    textAlign: 'center', position: 'relative', overflow: 'hidden',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = sev.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <span style={{ position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: '50%', background: sev.color }} />
                  <span style={{ fontSize: 30, display: 'block', marginBottom: 8 }}>{s.emoji}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', lineHeight: 1.35, display: 'block' }}>
                    {lang === 'hi' ? s.nameHi : s.name}
                  </span>
                  {s.callEmergency && (
                    <span style={{ marginTop: 6, display: 'inline-block', fontSize: 10, color: sev.color, background: sev.bg, padding: '2px 7px', borderRadius: 4, fontWeight: 600 }}>
                      📞 112
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569' }}>
              <p style={{ fontSize: 32 }}>🔍</p>
              <p style={{ fontSize: 14, marginTop: 8 }}>Koi scenario nahi mila</p>
            </div>
          )}

          {/* Disclaimer */}
          <div style={{ marginTop: 24, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '12px 16px' }}>
            <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
              ⚕️ <strong style={{ color: '#a5b4fc' }}>Medical Disclaimer:</strong> Yeh guide general first-aid information ke liye hai. Professional medical help hamesha pehle contact karo. Yeh kisi doctor ki jagah nahi le sakta.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}