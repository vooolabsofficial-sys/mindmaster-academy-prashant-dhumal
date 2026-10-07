export type LanguageCode = "en" | "mr" | "hi" | "gu" | "kn" | "te" | "ta" | "bn";

export interface LanguageInfo {
  code: LanguageCode;
  nativeName: string;
  englishName: string;
  region: string;
}

export const DEFAULT_LANGUAGE: LanguageCode = "en";

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: "en", nativeName: "English", englishName: "English", region: "Global" },
  { code: "mr", nativeName: "मराठी", englishName: "Marathi", region: "Maharashtra" },
  { code: "hi", nativeName: "हिंदी", englishName: "Hindi", region: "Pan-India" },
  { code: "gu", nativeName: "ગુજરાતી", englishName: "Gujarati", region: "Gujarat" },
  { code: "kn", nativeName: "ಕನ್ನಡ", englishName: "Kannada", region: "Karnataka" },
  { code: "te", nativeName: "తెలుగు", englishName: "Telugu", region: "Andhra & Telangana" },
  { code: "ta", nativeName: "தமிழ்", englishName: "Tamil", region: "Tamil Nadu" },
  { code: "bn", nativeName: "বাংলা", englishName: "Bengali", region: "West Bengal" },
];

export interface TranslationDictionary {
  // Navigation
  "nav.home": string;
  "nav.courses": string;
  "nav.myLearning": string;
  "nav.support": string;
  "nav.profile": string;

  // TopBar
  "topbar.searchPlaceholder": string;
  "topbar.portalBadge": string;
  "topbar.installApp": string;

  // Profile / Settings
  "profile.title": string;
  "profile.verifiedBadge": string;
  "profile.editButton": string;
  "profile.cancelButton": string;
  "profile.saveSuccess": string;
  "profile.sectionAccount": string;
  "profile.sectionApp": string;
  "profile.sectionStats": string;
  "profile.myPurchases": string;
  "profile.myPurchasesSub": string;
  "profile.language": string;
  "profile.languageSub": string;
  "profile.help": string;
  "profile.helpSub": string;
  "profile.appVersion": string;
  "profile.logout": string;

  // Language Modal
  "langModal.title": string;
  "langModal.subtitle": string;
  "langModal.confirmToast": string;
  "langModal.close": string;

  // Common
  "common.offlineBanner": string;
  "common.offlineRetry": string;
  "common.onlineRestored": string;
  "common.noCourses": string;
  "common.showAll": string;
}

export const TRANSLATIONS: Record<LanguageCode, TranslationDictionary> = {
  en: {
    "nav.home": "Home",
    "nav.courses": "Courses",
    "nav.myLearning": "My Learning",
    "nav.support": "Support",
    "nav.profile": "Profile",

    "topbar.searchPlaceholder": "Search courses, memory formulas, lessons...",
    "topbar.portalBadge": "Student Portal • Narhe Centre, Pune",
    "topbar.installApp": "Install App",

    "profile.title": "Student Profile & Settings",
    "profile.verifiedBadge": "Verified Student",
    "profile.editButton": "Edit Profile",
    "profile.cancelButton": "Cancel",
    "profile.saveSuccess": "Profile information updated successfully!",
    "profile.sectionAccount": "Account",
    "profile.sectionApp": "Application",
    "profile.sectionStats": "Learning Statistics",
    "profile.myPurchases": "My Purchases",
    "profile.myPurchasesSub": "Payment receipts, GST invoices & batch access",
    "profile.language": "Language",
    "profile.languageSub": "Application language preference",
    "profile.help": "Help & Support Helpline",
    "profile.helpSub": "Direct telephone helpline to Narhe Campus Desk",
    "profile.appVersion": "App Version",
    "profile.logout": "Sign Out from All Devices",

    "langModal.title": "Choose App Language",
    "langModal.subtitle": "Select your preferred language for the entire application",
    "langModal.confirmToast": "Application language changed to English",
    "langModal.close": "Close",

    "common.offlineBanner": "Offline Mode: Internet disconnected. Downloaded notes remain available.",
    "common.offlineRetry": "Retry",
    "common.onlineRestored": "Internet connection restored!",
    "common.noCourses": "No courses found matching your selection",
    "common.showAll": "Show All Courses",
  },

  mr: {
    "nav.home": "मुख्यपृष्ठ",
    "nav.courses": "अभ्यासक्रम",
    "nav.myLearning": "माझे शिक्षण",
    "nav.support": "मदत कक्ष",
    "nav.profile": "माझी प्रोफाइल",

    "topbar.searchPlaceholder": "अभ्यासक्रम, फॉर्म्युले आणि लेक्चर्स शोधा...",
    "topbar.portalBadge": "विद्यार्थी पोर्टल • नऱ्हे केंद्र, पुणे",
    "topbar.installApp": "अ‍ॅप इन्स्टॉल करा",

    "profile.title": "विद्यार्थी प्रोफाइल आणि सेटिंग्ज",
    "profile.verifiedBadge": "प्रमाणित विद्यार्थी",
    "profile.editButton": "माहिती बदला",
    "profile.cancelButton": "रद्द करा",
    "profile.saveSuccess": "प्रोफाइल माहिती यशस्वीरित्या जतन झाली!",
    "profile.sectionAccount": "खाते",
    "profile.sectionApp": "अ‍ॅप्लिकेशन",
    "profile.sectionStats": "अभ्यास प्रगती आकडेवारी",
    "profile.myPurchases": "माझे खरेदी केलेले कोर्सेस",
    "profile.myPurchasesSub": "पावत्या, जीएसटी इनव्हॉइस आणि बॅच प्रवेश",
    "profile.language": "भाषा",
    "profile.languageSub": "अ‍ॅपची प्राथमिक भाषा निवडा",
    "profile.help": "मदत व सपोर्ट हेल्पलाइन",
    "profile.helpSub": "नऱ्हे कॅम्पस डेस्क थेट फोन मदत",
    "profile.appVersion": "अ‍ॅप आवृत्ती",
    "profile.logout": "सर्व उपकरणांतून बाहेर पडा",

    "langModal.title": "अ‍ॅपची भाषा निवडा",
    "langModal.subtitle": "संपूर्ण अ‍ॅपसाठी तुमची पसंतीची भाषा निवडा",
    "langModal.confirmToast": "अ‍ॅपची भाषा मराठीमध्ये बदलली आहे",
    "langModal.close": "बंद करा",

    "common.offlineBanner": "ऑफलाइन मोड: इंटरनेट बंद आहे. डाउनलोड केलेल्या नोट्स उपलब्ध आहेत.",
    "common.offlineRetry": "पुन्हा तपासा",
    "common.onlineRestored": "इंटरनेट कनेक्शन पूर्ववत झाले आहे!",
    "common.noCourses": "कोणताही अभ्यासक्रम उपलब्ध नाही",
    "common.showAll": "सर्व अभ्यासक्रम पहा",
  },

  hi: {
    "nav.home": "होम",
    "nav.courses": "पाठ्यक्रम",
    "nav.myLearning": "मेरा अध्ययन",
    "nav.support": "सहायता केंद्र",
    "nav.profile": "मेरी प्रोफ़ाइल",

    "topbar.searchPlaceholder": "पाठ्यक्रम, सूत्र और व्याख्यान खोजें...",
    "topbar.portalBadge": "छात्र पोर्टल • नर्हे केंद्र, पुणे",
    "topbar.installApp": "ऐप इंस्टॉल करें",

    "profile.title": "छात्र प्रोफ़ाइल और सेटिंग्स",
    "profile.verifiedBadge": "सत्यापित छात्र",
    "profile.editButton": "प्रोफ़ाइल संपादित करें",
    "profile.cancelButton": "रद्द करें",
    "profile.saveSuccess": "प्रोफ़ाइल जानकारी सफलतापूर्वक सुरक्षित की गई!",
    "profile.sectionAccount": "खाता",
    "profile.sectionApp": "एप्लिकेशन",
    "profile.sectionStats": "अध्ययन सांख्यिकी",
    "profile.myPurchases": "मेरी खरीददारी",
    "profile.myPurchasesSub": "भुगतान रसीदें, जीएसटी चालान और बैच एक्सेस",
    "profile.language": "भाषा",
    "profile.languageSub": "एप्लिकेशन भाषा प्राथमिकता",
    "profile.help": "सहायता और हेल्पलाइन",
    "profile.helpSub": "नर्हे कैंपस डेस्क सीधा टेलीफोन संपर्क",
    "profile.appVersion": "ऐप संस्करण",
    "profile.logout": "सभी डिवाइसों से साइन आउट करें",

    "langModal.title": "ऐप की भाषा चुनें",
    "langModal.subtitle": "संपूर्ण एप्लिकेशन के लिए अपनी पसंदीदा भाषा चुनें",
    "langModal.confirmToast": "ऐप की भाषा हिंदी में बदल दी गई है",
    "langModal.close": "बंद करें",

    "common.offlineBanner": "ऑफ़लाइन मोड: इंटरनेट बंद है। डाउनलोड किए गए नोट्स उपलब्ध हैं।",
    "common.offlineRetry": "पुनः प्रयास करें",
    "common.onlineRestored": "इंटरनेट कनेक्शन बहाल हो गया है!",
    "common.noCourses": "कोई पाठ्यक्रम नहीं मिला",
    "common.showAll": "सभी पाठ्यक्रम देखें",
  },

  gu: {
    "nav.home": "હોમ",
    "nav.courses": "અભ્યાસક્રમો",
    "nav.myLearning": "મારું શિક્ષણ",
    "nav.support": "સહાયતા",
    "nav.profile": "પ્રોફાઇલ",

    "topbar.searchPlaceholder": "અભ્યાસક્રમો, સૂત્રો અને પાઠ શોધો...",
    "topbar.portalBadge": "વિદ્યાર્થી પોર્ટલ • નરહે કેન્દ્ર, પુણે",
    "topbar.installApp": "એપ્લિકેશન ઇન્સ્ટોલ કરો",

    "profile.title": "વિદ્યાર્થી પ્રોફાઇલ અને સેટિંગ્સ",
    "profile.verifiedBadge": "ચકાસાયેલ વિદ્યાર્થી",
    "profile.editButton": "પ્રોફાઇલ સંપાદિત કરો",
    "profile.cancelButton": "રદ કરો",
    "profile.saveSuccess": "પ્રોફાઇલ સફળતાપૂર્વક અપડેટ થઈ ગઈ!",
    "profile.sectionAccount": "ખાતું",
    "profile.sectionApp": "એપ્લિકેશન",
    "profile.sectionStats": "શિક્ષણ આંકડા",
    "profile.myPurchases": "મારી ખરીદીઓ",
    "profile.myPurchasesSub": "ચુકવણી રસીદો અને બેચ ઍક્સેસ",
    "profile.language": "ભાષા",
    "profile.languageSub": "એપ્લિકેશન ભાષા પ્રાથમિકતા",
    "profile.help": "સહાયતા અને હેલ્પલાઇન",
    "profile.helpSub": "નરહે કેમ્પસ ડેસ્ક સીધો ટેલિફોન સંપર્ક",
    "profile.appVersion": "એપ આવૃત્તિ",
    "profile.logout": "બધા ઉપકરણોમાંથી સાઇન આઉટ કરો",

    "langModal.title": "એપ્લિકેશન ભાષા પસંદ કરો",
    "langModal.subtitle": "સમગ્ર એપ્લિકેશન માટે તમારી મનપસંદ ભાષા પસંદ કરો",
    "langModal.confirmToast": "એપ્લિકેશન ભાષા ગુજરાતીમાં બદલાઈ ગઈ છે",
    "langModal.close": "બંધ કરો",

    "common.offlineBanner": "ઑફલાઇન મોડ: ઇન્ટરનેટ બંધ છે. ડાઉનલોડ કરેલી નોંધો ઉપલબ્ધ છે.",
    "common.offlineRetry": "ફરી પ્રયાસ કરો",
    "common.onlineRestored": "ઇન્ટરનેટ કનેક્શન પુનઃસ્થાપિત થયું છે!",
    "common.noCourses": "કોઈ અભ્યાસક્રમ મળ્યો નથી",
    "common.showAll": "બધા અભ્યાસક્રમો જુઓ",
  },

  kn: {
    "nav.home": "ಮುಖಪುಟ",
    "nav.courses": "ಕೋರ್ಸ್‌ಗಳು",
    "nav.myLearning": "ನನ್ನ ಕಲಿಕೆ",
    "nav.support": "ಬೆಂಬಲ",
    "nav.profile": "ಪ್ರೊಫೈಲ್",

    "topbar.searchPlaceholder": "ಕೋರ್ಸ್‌ಗಳು ಮತ್ತು ಪಾಠಗಳನ್ನು ಹುಡುಕಿ...",
    "topbar.portalBadge": "ವಿದ್ಯಾರ್ಥಿ ಪೋರ್ಟಲ್ • ನರ್ಹೆ ಕೇಂದ್ರ, ಪುಣೆ",
    "topbar.installApp": "ಆಪ್ ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಿ",

    "profile.title": "ವಿದ್ಯಾರ್ಥಿ ಪ್ರೊಫೈಲ್ ಮತ್ತು ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    "profile.verifiedBadge": "ಪರಿಶೀಲಿಸಿದ ವಿದ್ಯಾರ್ಥಿ",
    "profile.editButton": "ಪ್ರೊಫೈಲ್ ಸಂಪಾದಿಸಿ",
    "profile.cancelButton": "ರದ್ದುಮಾಡಿ",
    "profile.saveSuccess": "ಪ್ರೊಫೈಲ್ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!",
    "profile.sectionAccount": "ಖಾತೆ",
    "profile.sectionApp": "ಅಪ್ಲಿಕೇಶನ್",
    "profile.sectionStats": "ಕಲಿಕೆಯ ಅಂಕಿಅಂಶಗಳು",
    "profile.myPurchases": "ನನ್ನ ಖರೀದಿಗಳು",
    "profile.myPurchasesSub": "ರಸೀದಿಗಳು ಮತ್ತು ಪ್ರವೇಶ ವಿವರಗಳು",
    "profile.language": "ಭಾಷೆ",
    "profile.languageSub": "ಅಪ್ಲಿಕೇಶನ್ ಭಾಷಾ ಆದ್ಯತೆ",
    "profile.help": "ಸಹಾಯವಾಣಿ",
    "profile.helpSub": "ನರ್ಹೆ ಕ್ಯಾಂಪಸ್ ಡೆಸ್ಕ್ ದೂರವಾಣಿ ಸಂಪರ್ಕ",
    "profile.appVersion": "ಆಪ್ ಆವೃತ್ತಿ",
    "profile.logout": "ಎಲ್ಲಾ ಸಾಧನಗಳಿಂದ ಸೈನ್ ಔಟ್ ಮಾಡಿ",

    "langModal.title": "ಆಪ್ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    "langModal.subtitle": "ಇಡೀ ಅಪ್ಲಿಕೇಶನ್‌ಗಾಗಿ ನಿಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯನ್ನು ಆರಿಸಿ",
    "langModal.confirmToast": "ಆಪ್ ಭಾಷೆಯನ್ನು ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ",
    "langModal.close": "ಮುಚ್ಚಿ",

    "common.offlineBanner": "ಆಫ್‌ಲೈನ್ ಮೋಡ್: ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕವಿಲ್ಲ. ಡೌನ್‌ಲೋಡ್ ಮಾಡಿದ ಟಿಪ್ಪಣಿಗಳು ಲಭ್ಯವಿದೆ.",
    "common.offlineRetry": "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ",
    "common.onlineRestored": "ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕ ಪುನಃಸ್ಥಾಪನೆಯಾಗಿದೆ!",
    "common.noCourses": "ಯಾವುದೇ ಕೋರ್ಸ್‌ಗಳು ಕಂಡುಬಂದಿಲ್ಲ",
    "common.showAll": "ಎಲ್ಲಾ ಕೋರ್ಸ್‌ಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
  },

  te: {
    "nav.home": "హోమ్",
    "nav.courses": "కోర్సులు",
    "nav.myLearning": "నా లెర్నింగ్",
    "nav.support": "సహాయం",
    "nav.profile": "ప్రొఫైల్",

    "topbar.searchPlaceholder": "కోర్సులు మరియు పాఠాలను శోధించండి...",
    "topbar.portalBadge": "విద్యార్థి పోర్టల్ • నర్హే కేంద్రం, పూణే",
    "topbar.installApp": "యాప్ ఇన్‌స్టాల్ చేయండి",

    "profile.title": "విద్యార్థి ప్రొఫైల్ మరియు సెట్టింగ్‌లు",
    "profile.verifiedBadge": "ధృవీకరించబడిన విద్యార్థి",
    "profile.editButton": "ప్రొఫైల్ సవరించండి",
    "profile.cancelButton": "రద్దు చేయండి",
    "profile.saveSuccess": "ప్రొఫైల్ విజయవంతంగా నవీకరించబడింది!",
    "profile.sectionAccount": "ఖాతా",
    "profile.sectionApp": "అప్లికేషన్",
    "profile.sectionStats": "అభ్యాస గణాంకాలు",
    "profile.myPurchases": "నా కొనుగోళ్లు",
    "profile.myPurchasesSub": "రసీదులు మరియు బ్యాచ్ యాక్సెస్",
    "profile.language": "భాష",
    "profile.languageSub": "అప్లికేషన్ భాష ప్రాధాన్యత",
    "profile.help": "సహాయం & హెల్ప్‌లైన్",
    "profile.helpSub": "నర్హే క్యాంపస్ డెస్క్ ప్రత్యక్ష ఫోన్",
    "profile.appVersion": "యాప్ వెర్షన్",
    "profile.logout": "అన్ని పరికరాల నుండి సైన్ అవుట్ చేయండి",

    "langModal.title": "యాప్ భాషను ఎంచుకోండి",
    "langModal.subtitle": "మొత్తం అప్లికేషన్ కోసం మీ ప్రాధాన్య భాషను ఎంచుకోండి",
    "langModal.confirmToast": "యాప్ భాష తెలుగుగా మార్చబడింది",
    "langModal.close": "మూసివేయండి",

    "common.offlineBanner": "ఆఫ్‌లైన్ మోడ్: ఇంటర్నెట్ ఆపివేయబడింది. డౌన్‌లోడ్ చేసిన నోట్స్ అందుబాటులో ఉన్నాయి.",
    "common.offlineRetry": "మళ్లీ ప్రయత్నించండి",
    "common.onlineRestored": "ఇంటర్నెట్ కనెక్షన్ పునరుద్ధరించబడింది!",
    "common.noCourses": "కోర్సులు ఏవీ కనుగొనబడలేదు",
    "common.showAll": "అన్ని కోర్సులను చూడండి",
  },

  ta: {
    "nav.home": "முகப்பு",
    "nav.courses": "பாடநெறிகள்",
    "nav.myLearning": "எனது கற்றல்",
    "nav.support": "ஆதரவு",
    "nav.profile": "சுயவிவரம்",

    "topbar.searchPlaceholder": "பாடநெறிகள் மற்றும் பாடங்களைத் தேடுங்கள்...",
    "topbar.portalBadge": "மாணவர் போர்ட்டல் • நர்ஹே மையம், புனே",
    "topbar.installApp": "செயலியை நிறுவவும்",

    "profile.title": "மாணவர் சுயவிவரம் மற்றும் அமைப்புகள்",
    "profile.verifiedBadge": "சரிபார்க்கப்பட்ட மாணவர்",
    "profile.editButton": "சுயவிவரத்தைத் திருத்து",
    "profile.cancelButton": "ரத்துசெய்",
    "profile.saveSuccess": "சுயவிவரம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது!",
    "profile.sectionAccount": "கணக்கு",
    "profile.sectionApp": "பயன்பாடு",
    "profile.sectionStats": "கற்றல் புள்ளிவிவரங்கள்",
    "profile.myPurchases": "எனது கொள்முதல்கள்",
    "profile.myPurchasesSub": "ரசீதுகள் மற்றும் அணுகல் விவரங்கள்",
    "profile.language": "மொழி",
    "profile.languageSub": "பயன்பாட்டு மொழி விருப்பம்",
    "profile.help": "உதவி மற்றும் உதவி எண்",
    "profile.helpSub": "நர்ஹே வளாக மேசை நேரடி தொலைபேசி உதவி",
    "profile.appVersion": "செயலி பதிப்பு",
    "profile.logout": "அனைத்து சாதனங்களிலிருந்தும் வெளியேறவும்",

    "langModal.title": "செயலி மொழியைத் தேர்ந்தெடுக்கவும்",
    "langModal.subtitle": "முழு பயன்பாட்டிற்கும் உங்கள் விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்",
    "langModal.confirmToast": "செயலி மொழி தமிழுக்கு மாற்றப்பட்டது",
    "langModal.close": "மூடுக",

    "common.offlineBanner": "ஆஃப்லைன் பயன்முறை: இணைய இணைப்பு இல்லை. பதிவிறக்கிய குறிப்புகள் உள்ளன.",
    "common.offlineRetry": "மீண்டும் முயற்சி செய்",
    "common.onlineRestored": "இணைய இணைப்பு மீட்டமைக்கப்பட்டது!",
    "common.noCourses": "பாடநெறிகள் எதுவும் கிடைக்கவில்லை",
    "common.showAll": "அனைத்து பாடநெறிகளையும் பார்க்கவும்",
  },

  bn: {
    "nav.home": "হোম",
    "nav.courses": "কোর্সসমূহ",
    "nav.myLearning": "আমার শিক্ষা",
    "nav.support": "সহায়তা",
    "nav.profile": "প্রোফাইল",

    "topbar.searchPlaceholder": "কোর্স এবং পাঠ অনুসন্ধান করুন...",
    "topbar.portalBadge": "ছাত্র পোর্টাল • নারহে কেন্দ্র, পুনে",
    "topbar.installApp": "অ্যাপ ইনস্টল করুন",

    "profile.title": "ছাত্র প্রোফাইল এবং সেটিংস",
    "profile.verifiedBadge": "যাচাইকৃত ছাত্র",
    "profile.editButton": "প্রোফাইল সম্পাদনা করুন",
    "profile.cancelButton": "বাতিল করুন",
    "profile.saveSuccess": "প্রোফাইল সফলভাবে আপডেট হয়েছে!",
    "profile.sectionAccount": "অ্যাকাউন্ট",
    "profile.sectionApp": "অ্যাপ্লিকেশন",
    "profile.sectionStats": "শেখার পরিসংখ্যান",
    "profile.myPurchases": "আমার ক্রয়সমূহ",
    "profile.myPurchasesSub": "রসিদ এবং ব্যাচ অ্যাক্সেস",
    "profile.language": "ভাষা",
    "profile.languageSub": "অ্যাপ্লিকেশন ভাষা পছন্দ",
    "profile.help": "সহায়তা ও হেল্পলাইন",
    "profile.helpSub": "নারহে ক্যাম্পাস ডেস্ক সরাসরি ফোন সহায়তা",
    "profile.appVersion": "অ্যাপ সংস্করণ",
    "profile.logout": "সমস্ত ডিভাইস থেকে সাইন আউট করুন",

    "langModal.title": "অ্যাপের ভাষা চয়ন করুন",
    "langModal.subtitle": "সমগ্র অ্যাপ্লিকেশনের জন্য আপনার পছন্দের ভাষা নির্বাচন করুন",
    "langModal.confirmToast": "অ্যাপের ভাষা বাংলায় পরিবর্তন করা হয়েছে",
    "langModal.close": "বন্ধ করুন",

    "common.offlineBanner": "অফলাইন মোড: ইন্টারনেট সংযোগ বিচ্ছিন্ন। ডাউনলোড করা নোট উপলব্ধ রয়েছে।",
    "common.offlineRetry": "পুনরায় চেষ্টা করুন",
    "common.onlineRestored": "ইন্টারনেট সংযোগ পুনরুদ্ধার হয়েছে!",
    "common.noCourses": "কোনো কোর্স পাওয়া যায়নি",
    "common.showAll": "সমস্ত কোর্স দেখুন",
  },
};

export function getTranslation(lang: LanguageCode, key: keyof TranslationDictionary): string {
  const dictionary = TRANSLATIONS[lang] || TRANSLATIONS[DEFAULT_LANGUAGE];
  return dictionary[key] || TRANSLATIONS[DEFAULT_LANGUAGE][key] || key;
}
