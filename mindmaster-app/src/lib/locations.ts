// ============================================================================
// CANONICAL HIERARCHICAL LOCATION ENGINE (STATE -> DISTRICT -> TALUKA)
// Single Source of Truth for Geographic Targeting & Student Profiles
// ============================================================================

export interface TalukaItem {
  id: string;
  name: string;
  nameMr?: string;
}

export interface DistrictItem {
  id: string;
  name: string;
  nameMr?: string;
  talukas: TalukaItem[];
}

export interface StateItem {
  id: string;
  code: string;
  name: string;
  nameMr?: string;
  districts: DistrictItem[];
}

// ----------------------------------------------------------------------------
// Complete Maharashtra State with all 36 Districts and Canonical Talukas
// ----------------------------------------------------------------------------
const MAHARASHTRA_DISTRICTS: DistrictItem[] = [
  {
    id: "pune",
    name: "Pune",
    nameMr: "पुणे",
    talukas: [
      { id: "pune_city", name: "Pune City", nameMr: "पुणे शहर" },
      { id: "haveli", name: "Haveli", nameMr: "हवेली" },
      { id: "baramati", name: "Baramati", nameMr: "बारामती" },
      { id: "shirur", name: "Shirur", nameMr: "शिरूर" },
      { id: "daund", name: "Daund", nameMr: "दौंड" },
      { id: "indapur", name: "Indapur", nameMr: "इंदापूर" },
      { id: "junnar", name: "Junnar", nameMr: "जुन्नर" },
      { id: "khed", name: "Khed (Rajgurunagar)", nameMr: "खेड" },
      { id: "ambegaon", name: "Ambegaon", nameMr: "आंबेगाव" },
      { id: "maval", name: "Maval", nameMr: "मावळ" },
      { id: "mulshi", name: "Mulshi", nameMr: "मुळशी" },
      { id: "velhe", name: "Velhe", nameMr: "वेल्हे" },
      { id: "bhor", name: "Bhor", nameMr: "भोर" },
      { id: "purandar", name: "Purandar (Saswad)", nameMr: "पुरंदर" },
    ],
  },
  {
    id: "mumbai_suburban",
    name: "Mumbai Suburban",
    nameMr: "मुंबई उपनगर",
    talukas: [
      { id: "andheri", name: "Andheri", nameMr: "अंधेरी" },
      { id: "borivali", name: "Borivali", nameMr: "बोरिवली" },
      { id: "kurla", name: "Kurla", nameMr: "कुर्ला" },
      { id: "bandra", name: "Bandra", nameMr: "वांद्रे" },
    ],
  },
  {
    id: "mumbai_city",
    name: "Mumbai City",
    nameMr: "मुंबई शहर",
    talukas: [
      { id: "south_mumbai", name: "South Mumbai", nameMr: "दक्षिण मुंबई" },
      { id: "colaba", name: "Colaba", nameMr: "कुलाबा" },
      { id: "dadar", name: "Dadar", nameMr: "दादर" },
    ],
  },
  {
    id: "thane",
    name: "Thane",
    nameMr: "ठाणे",
    talukas: [
      { id: "thane_city", name: "Thane", nameMr: "ठाणे" },
      { id: "kalyan", name: "Kalyan", nameMr: "कल्याण" },
      { id: "bhiwandi", name: "Bhiwandi", nameMr: "भिवंडी" },
      { id: "ulhasnagar", name: "Ulhasnagar", nameMr: "उल्हासनगर" },
      { id: "ambernath", name: "Ambernath", nameMr: "अंबरनाथ" },
      { id: "murbad", name: "Murbad", nameMr: "मुरबाड" },
      { id: "shahapur", name: "Shahapur", nameMr: "शहापूर" },
    ],
  },
  {
    id: "palghar",
    name: "Palghar",
    nameMr: "पालघर",
    talukas: [
      { id: "palghar_city", name: "Palghar", nameMr: "पालघर" },
      { id: "vasai", name: "Vasai", nameMr: "वसई" },
      { id: "dahanu", name: "Dahanu", nameMr: "डहाणू" },
      { id: "wada", name: "Wada", nameMr: "वाडा" },
      { id: "jawhar", name: "Jawhar", nameMr: "जव्हार" },
      { id: "mokhada", name: "Mokhada", nameMr: "मोखाडा" },
      { id: "talasari", name: "Talasari", nameMr: "तलासरी" },
      { id: "vikramgad", name: "Vikramgad", nameMr: "विक्रमगड" },
    ],
  },
  {
    id: "raigad",
    name: "Raigad",
    nameMr: "रायगड",
    talukas: [
      { id: "alibag", name: "Alibag", nameMr: "अलिबाग" },
      { id: "panvel", name: "Panvel", nameMr: "पनवेल" },
      { id: "karjat_raigad", name: "Karjat", nameMr: "कर्जत" },
      { id: "khalapur", name: "Khalapur", nameMr: "खालापूर" },
      { id: "pen", name: "Pen", nameMr: "पेण" },
      { id: "uran", name: "Uran", nameMr: "उरण" },
      { id: "roha", name: "Roha", nameMr: "रोहा" },
      { id: "mangaon", name: "Mangaon", nameMr: "माणगाव" },
      { id: "mahad", name: "Mahad", nameMr: "महाड" },
      { id: "shrivardhan", name: "Shrivardhan", nameMr: "श्रीवर्धन" },
      { id: "murud", name: "Murud", nameMr: "मुरुड" },
    ],
  },
  {
    id: "ratnagiri",
    name: "Ratnagiri",
    nameMr: "रत्नागिरी",
    talukas: [
      { id: "ratnagiri_city", name: "Ratnagiri", nameMr: "रत्नागिरी" },
      { id: "chiplun", name: "Chiplun", nameMr: "चिपळूण" },
      { id: "khed_ratnagiri", name: "Khed", nameMr: "खेड" },
      { id: "dapoli", name: "Dapoli", nameMr: "दापोली" },
      { id: "guhagar", name: "Guhagar", nameMr: "गुहागर" },
      { id: "sangameshwar", name: "Sangameshwar", nameMr: "संगमेश्वर" },
      { id: "rajapur", name: "Rajapur", nameMr: "राजापूर" },
      { id: "lanja", name: "Lanja", nameMr: "लांजा" },
      { id: "mandangad", name: "Mandangad", nameMr: "मंडणगड" },
    ],
  },
  {
    id: "sindhudurg",
    name: "Sindhudurg",
    nameMr: "सिंधुदुर्ग",
    talukas: [
      { id: "kudal", name: "Kudal", nameMr: "कुडाळ" },
      { id: "kankavli", name: "Kankavli", nameMr: "कणकवली" },
      { id: "sawantwadi", name: "Sawantwadi", nameMr: "सावंतवाडी" },
      { id: "malvan", name: "Malvan", nameMr: "मालवण" },
      { id: "vengurla", name: "Vengurla", nameMr: "वेंगुर्ला" },
      { id: "devgad", name: "Devgad", nameMr: "देवगड" },
      { id: "dodamarg", name: "Dodamarg", nameMr: "दोडामार्ग" },
      { id: "vaibhavwadi", name: "Vaibhavwadi", nameMr: "वैभववाडी" },
    ],
  },
  {
    id: "nashik",
    name: "Nashik",
    nameMr: "नाशिक",
    talukas: [
      { id: "nashik_city", name: "Nashik", nameMr: "नाशिक" },
      { id: "malegaon", name: "Malegaon", nameMr: "मालेगाव" },
      { id: "niphad", name: "Niphad", nameMr: "निफाड" },
      { id: "sinnar", name: "Sinnar", nameMr: "सिन्नर" },
      { id: "dindori", name: "Dindori", nameMr: "दिंडोरी" },
      { id: "igatpuri", name: "Igatpuri", nameMr: "इगतपुरी" },
      { id: "kalwan", name: "Kalwan", nameMr: "कळवण" },
      { id: "baglan", name: "Baglan (Satana)", nameMr: "बागलाण" },
      { id: "chandwad", name: "Chandwad", nameMr: "चांदवड" },
      { id: "yeola", name: "Yeola", nameMr: "येवला" },
      { id: "nandgaon_nashik", name: "Nandgaon", nameMr: "नांदगाव" },
      { id: "trimbakeshwar", name: "Trimbakeshwar", nameMr: "त्र्यंबकेश्वर" },
      { id: "deola", name: "Deola", nameMr: "देवळा" },
    ],
  },
  {
    id: "ahmednagar",
    name: "Ahmednagar (Ahilyanagar)",
    nameMr: "अहिल्यानगर (अहमदनगर)",
    talukas: [
      { id: "nagar", name: "Nagar", nameMr: "नगर" },
      { id: "sangamner", name: "Sangamner", nameMr: "संगमनेर" },
      { id: "shrirampur", name: "Shrirampur", nameMr: "श्रीरामपूर" },
      { id: "rahuri", name: "Rahuri", nameMr: "राहुरी" },
      { id: "kopargaon", name: "Kopargaon", nameMr: "कोपरगाव" },
      { id: "rahata", name: "Rahata (Shirdi)", nameMr: "राहाता" },
      { id: "akole", name: "Akole", nameMr: "अकोले" },
      { id: "parner", name: "Parner", nameMr: "पारनेर" },
      { id: "shrigonda", name: "Shrigonda", nameMr: "श्रीगोंदा" },
      { id: "karjat_ahmednagar", name: "Karjat", nameMr: "कर्जत" },
      { id: "jamkhed", name: "Jamkhed", nameMr: "जामखेड" },
      { id: "shevgaon", name: "Shevgaon", nameMr: "शेवगाव" },
      { id: "pathardi", name: "Pathardi", nameMr: "पाथर्डी" },
      { id: "newasa", name: "Newasa", nameMr: "नेवासा" },
    ],
  },
  {
    id: "satara",
    name: "Satara",
    nameMr: "सातारा",
    talukas: [
      { id: "satara_city", name: "Satara", nameMr: "सातारा" },
      { id: "karad", name: "Karad", nameMr: "कराड" },
      { id: "wai", name: "Wai", nameMr: "वाई" },
      { id: "phaltan", name: "Phaltan", nameMr: "फलटण" },
      { id: "koregaon", name: "Koregaon", nameMr: "कोरेगाव" },
      { id: "khatav", name: "Khatav (Vaduj)", nameMr: "खटाव" },
      { id: "man", name: "Man (Dahiwadi)", nameMr: "माण" },
      { id: "patan", name: "Patan", nameMr: "पाटण" },
      { id: "mahabaleshwar", name: "Mahabaleshwar", nameMr: "महाबळेश्वर" },
      { id: "khandala", name: "Khandala", nameMr: "खंडाळा" },
      { id: "jaoli", name: "Jaoli", nameMr: "जावळी" },
    ],
  },
  {
    id: "sangli",
    name: "Sangli",
    nameMr: "सांगली",
    talukas: [
      { id: "miraj", name: "Miraj", nameMr: "मिरज" },
      { id: "tasgaon", name: "Tasgaon", nameMr: "तासगाव" },
      { id: "walwa", name: "Walwa (Islampur)", nameMr: "वाळवा" },
      { id: "shirala", name: "Shirala", nameMr: "शिराळा" },
      { id: "khanapur", name: "Khanapur (Vita)", nameMr: "खानापूर" },
      { id: "atpadi", name: "Atpadi", nameMr: "आटपाडी" },
      { id: "jat", name: "Jat", nameMr: "जत" },
      { id: "kadegaon", name: "Kadegaon", nameMr: "कडेगाव" },
      { id: "kavathe_mahankal", name: "Kavathe Mahankal", nameMr: "कवठे महांकाळ" },
      { id: "palus", name: "Palus", nameMr: "पलूस" },
    ],
  },
  {
    id: "kolhapur",
    name: "Kolhapur",
    nameMr: "कोल्हापूर",
    talukas: [
      { id: "karvir", name: "Karvir", nameMr: "करवीर" },
      { id: "panhala", name: "Panhala", nameMr: "पन्हाळा" },
      { id: "hatkanangale", name: "Hatkanangale", nameMr: "हातकणंगले" },
      { id: "shirol", name: "Shirol", nameMr: "शिरोळ" },
      { id: "kagal", name: "Kagal", nameMr: "कागल" },
      { id: "gadhinglaj", name: "Gadhinglaj", nameMr: "गडहिंग्लज" },
      { id: "radhanagari", name: "Radhanagari", nameMr: "राधानगरी" },
      { id: "bhudargad", name: "Bhudargad", nameMr: "भुदरगड" },
      { id: "ajra", name: "Ajra", nameMr: "आजरा" },
      { id: "chandgad", name: "Chandgad", nameMr: "चंदगड" },
      { id: "shahuwadi", name: "Shahuwadi", nameMr: "शाहूवाडी" },
      { id: "gaganbawda", name: "Gaganbawda", nameMr: "गगनबावडा" },
    ],
  },
  {
    id: "solapur",
    name: "Solapur",
    nameMr: "सोलापूर",
    talukas: [
      { id: "north_solapur", name: "North Solapur", nameMr: "उत्तर सोलापूर" },
      { id: "south_solapur", name: "South Solapur", nameMr: "दक्षिण सोलापूर" },
      { id: "barshi", name: "Barshi", nameMr: "बार्शी" },
      { id: "pandharpur", name: "Pandharpur", nameMr: "पंढरपूर" },
      { id: "malshiras", name: "Malshiras", nameMr: "माळशिरस" },
      { id: "sangola", name: "Sangola", nameMr: "सांगोला" },
      { id: "karmala", name: "Karmala", nameMr: "करमाळा" },
      { id: "madha", name: "Madha", nameMr: "माढा" },
      { id: "mohol", name: "Mohol", nameMr: "मोहोळ" },
      { id: "akkalkot", name: "Akkalkot", nameMr: "अक्कलकोट" },
      { id: "mangalwedha", name: "Mangalwedha", nameMr: "मंगळवेढा" },
    ],
  },
  {
    id: "chhatrapati_sambhajinagar",
    name: "Chhatrapati Sambhajinagar (Aurangabad)",
    nameMr: "छत्रपती संभाजीनगर",
    talukas: [
      { id: "aurangabad_city", name: "Chhatrapati Sambhajinagar", nameMr: "संभाजीनगर" },
      { id: "paithan", name: "Paithan", nameMr: "पैठण" },
      { id: "vaijapur", name: "Vaijapur", nameMr: "वैजापूर" },
      { id: "gangapur", name: "Gangapur", nameMr: "गंगापूर" },
      { id: "sillod", name: "Sillod", nameMr: "सिल्लोड" },
      { id: "kannad", name: "Kannad", nameMr: "कन्नड" },
      { id: "khuldabad", name: "Khuldabad", nameMr: "खुल्दाबाद" },
      { id: "phulambri", name: "Phulambri", nameMr: "फुलंब्री" },
      { id: "soegaon", name: "Soegaon", nameMr: "सोयगाव" },
    ],
  },
  {
    id: "jalna",
    name: "Jalna",
    nameMr: "जालना",
    talukas: [
      { id: "jalna_city", name: "Jalna", nameMr: "जालना" },
      { id: "ambad", name: "Ambad", nameMr: "अंबड" },
      { id: "bhokardan", name: "Bhokardan", nameMr: "भोकरदन" },
      { id: "badnapur", name: "Badnapur", nameMr: "बदनापूर" },
      { id: "partur", name: "Partur", nameMr: "परतूर" },
      { id: "ghansawangi", name: "Ghansawangi", nameMr: "घनसावंगी" },
      { id: "mantha", name: "Mantha", nameMr: "मंठा" },
      { id: "jafrabad", name: "Jafrabad", nameMr: "जाफ्राबाद" },
    ],
  },
  {
    id: "beed",
    name: "Beed",
    nameMr: "बीड",
    talukas: [
      { id: "beed_city", name: "Beed", nameMr: "बीड" },
      { id: "georai", name: "Georai", nameMr: "गेवराई" },
      { id: "majalgaon", name: "Majalgaon", nameMr: "माजलगाव" },
      { id: "ambajogai", name: "Ambajogai", nameMr: "अंबाजोगाई" },
      { id: "kaij", name: "Kaij", nameMr: "केज" },
      { id: "parli", name: "Parli", nameMr: "परळी" },
      { id: "ashti", name: "Ashti", nameMr: "आष्टी" },
      { id: "patoda", name: "Patoda", nameMr: "पाटोदा" },
      { id: "dharur", name: "Dharur", nameMr: "धारूर" },
      { id: "shirur_kasar", name: "Shirur Kasar", nameMr: "शिरूर कासार" },
      { id: "wadwani", name: "Wadwani", nameMr: "वडवणी" },
    ],
  },
  {
    id: "latur",
    name: "Latur",
    nameMr: "लातूर",
    talukas: [
      { id: "latur_city", name: "Latur", nameMr: "लातूर" },
      { id: "ausa", name: "Ausa", nameMr: "औसा" },
      { id: "nilanga", name: "Nilanga", nameMr: "निलंगा" },
      { id: "udgir", name: "Udgir", nameMr: "उदगीर" },
      { id: "ahmedpur", name: "Ahmedpur", nameMr: "अहमदपूर" },
      { id: "chakur", name: "Chakur", nameMr: "चाकूर" },
      { id: "renapur", name: "Renapur", nameMr: "रेणापूर" },
      { id: "deoni", name: "Deoni", nameMr: "देवणी" },
      { id: "shirur_anantpal", name: "Shirur Anantpal", nameMr: "शिरूर अनंतपाळ" },
      { id: "jalkot", name: "Jalkot", nameMr: "जळकोट" },
    ],
  },
  {
    id: "dharashiv",
    name: "Dharashiv (Osmanabad)",
    nameMr: "धाराशिव (उस्मानाबाद)",
    talukas: [
      { id: "dharashiv_city", name: "Dharashiv", nameMr: "धाराशिव" },
      { id: "tuljapur", name: "Tuljapur", nameMr: "तुळजापूर" },
      { id: "omerga", name: "Omerga", nameMr: "उमरगा" },
      { id: "kalamb", name: "Kalamb", nameMr: "कळंब" },
      { id: "paranda", name: "Paranda", nameMr: "परांडा" },
      { id: "bhoom", name: "Bhoom", nameMr: "भूम" },
      { id: "washi", name: "Washi", nameMr: "वाशी" },
      { id: "lohara", name: "Lohara", nameMr: "लोहारा" },
    ],
  },
  {
    id: "nanded",
    name: "Nanded",
    nameMr: "नांदेड",
    talukas: [
      { id: "nanded_city", name: "Nanded", nameMr: "नांदेड" },
      { id: "ardhapur", name: "Ardhapur", nameMr: "अर्धापूर" },
      { id: "mudkhed", name: "Mudkhed", nameMr: "मुदखेड" },
      { id: "bhokar", name: "Bhokar", nameMr: "भोकर" },
      { id: "loha", name: "Loha", nameMr: "लोहा" },
      { id: "kandhar", name: "Kandhar", nameMr: "कंधार" },
      { id: "kinwat", name: "Kinwat", nameMr: "किनवट" },
      { id: "hadgaon", name: "Hadgaon", nameMr: "हदगाव" },
      { id: "deglur", name: "Deglur", nameMr: "देगलूर" },
      { id: "mukhed", name: "Mukhed", nameMr: "मुखेड" },
      { id: "biloli", name: "Biloli", nameMr: "बिलोली" },
      { id: "dharmabad", name: "Dharmabad", nameMr: "धर्माबाद" },
    ],
  },
  {
    id: "parbhani",
    name: "Parbhani",
    nameMr: "परभणी",
    talukas: [
      { id: "parbhani_city", name: "Parbhani", nameMr: "परभणी" },
      { id: "gangakhed", name: "Gangakhed", nameMr: "गंगाखेड" },
      { id: "jintur", name: "Jintur", nameMr: "जिंतूर" },
      { id: "pathri", name: "Pathri", nameMr: "पाथरी" },
      { id: "sailu", name: "Sailu", nameMr: "सेलू" },
      { id: "manwath", name: "Manwath", nameMr: "मानवत" },
      { id: "purna", name: "Purna", nameMr: "पूर्णा" },
      { id: "sonpeth", name: "Sonpeth", nameMr: "सोनपेठ" },
      { id: "palam", name: "Palam", nameMr: "पालम" },
    ],
  },
  {
    id: "hingoli",
    name: "Hingoli",
    nameMr: "हिंगोली",
    talukas: [
      { id: "hingoli_city", name: "Hingoli", nameMr: "हिंगोली" },
      { id: "kalamnuri", name: "Kalamnuri", nameMr: "कलमनुरी" },
      { id: "basmath", name: "Basmath", nameMr: "वसमत" },
      { id: "aundha_nagnath", name: "Aundha Nagnath", nameMr: "औंढा नागनाथ" },
      { id: "sengaon", name: "Sengaon", nameMr: "सेनगाव" },
    ],
  },
  {
    id: "nagpur",
    name: "Nagpur",
    nameMr: "नागपूर",
    talukas: [
      { id: "nagpur_urban", name: "Nagpur Urban", nameMr: "नागपूर शहर" },
      { id: "nagpur_rural", name: "Nagpur Rural", nameMr: "नागपूर ग्रामीण" },
      { id: "kamptee", name: "Kamptee", nameMr: "कामठी" },
      { id: "hingna", name: "Hingna", nameMr: "हिंगणा" },
      { id: "katol", name: "Katol", nameMr: "काटोल" },
      { id: "narkhed", name: "Narkhed", nameMr: "नरखेड" },
      { id: "savner", name: "Savner", nameMr: "सावनेर" },
      { id: "kalameshwar", name: "Kalameshwar", nameMr: "कलमेश्वर" },
      { id: "ramtek", name: "Ramtek", nameMr: "रामटेक" },
      { id: "umred", name: "Umred", nameMr: "उमरेड" },
    ],
  },
  {
    id: "amravati",
    name: "Amravati",
    nameMr: "अमरावती",
    talukas: [
      { id: "amravati_city", name: "Amravati", nameMr: "अमरावती" },
      { id: "achalpur", name: "Achalpur", nameMr: "अचलपूर" },
      { id: "chandur_bazar", name: "Chandur Bazar", nameMr: "चांदूर बाजार" },
      { id: "warud", name: "Warud", nameMr: "वरूड" },
      { id: "morshi", name: "Morshi", nameMr: "मोर्शी" },
      { id: "daryapur", name: "Daryapur", nameMr: "दर्यापूर" },
      { id: "anjangaon_surji", name: "Anjangaon Surji", nameMr: "अंजनगाव सुर्जी" },
      { id: "chikhaldara", name: "Chikhaldara", nameMr: "चिखलदरा" },
    ],
  },
  {
    id: "akola",
    name: "Akola",
    nameMr: "अकोला",
    talukas: [
      { id: "akola_city", name: "Akola", nameMr: "अकोला" },
      { id: "akot", name: "Akot", nameMr: "आकोट" },
      { id: "balapur", name: "Balapur", nameMr: "बाळापूर" },
      { id: "telhara", name: "Telhara", nameMr: "तेल्हारा" },
      { id: "patur", name: "Patur", nameMr: "पातूर" },
      { id: "murtizapur", name: "Murtizapur", nameMr: "मुर्तिजापूर" },
    ],
  },
  {
    id: "buldhana",
    name: "Buldhana",
    nameMr: "बुलढाणा",
    talukas: [
      { id: "buldhana_city", name: "Buldhana", nameMr: "बुलढाणा" },
      { id: "chikhli", name: "Chikhli", nameMr: "चिखली" },
      { id: "mehkar", name: "Mehkar", nameMr: "मेहकर" },
      { id: "khamgaon", name: "Khamgaon", nameMr: "खामगाव" },
      { id: "malkapur", name: "Malkapur", nameMr: "मलकापूर" },
      { id: "shegaon", name: "Shegaon", nameMr: "शेगाव" },
      { id: "lonar", name: "Lonar", nameMr: "लोणार" },
    ],
  },
  {
    id: "washim",
    name: "Washim",
    nameMr: "वाशिम",
    talukas: [
      { id: "washim_city", name: "Washim", nameMr: "वाशिम" },
      { id: "risod", name: "Risod", nameMr: "रिसोड" },
      { id: "malegaon_washim", name: "Malegaon", nameMr: "मालेगाव" },
      { id: "mangrulpir", name: "Mangrulpir", nameMr: "मंगरुळपीर" },
      { id: "karanja_lad", name: "Karanja", nameMr: "कारंजा" },
    ],
  },
  {
    id: "yavatmal",
    name: "Yavatmal",
    nameMr: "यवतमाळ",
    talukas: [
      { id: "yavatmal_city", name: "Yavatmal", nameMr: "यवतमाळ" },
      { id: "pusad", name: "Pusad", nameMr: "पुसद" },
      { id: "umarkhed", name: "Umarkhed", nameMr: "उमरखेड" },
      { id: "digras", name: "Digras", nameMr: "दिग्रस" },
      { id: "darwha", name: "Darwha", nameMr: "दारव्हा" },
      { id: "wani", name: "Wani", nameMr: "वणी" },
      { id: "arni", name: "Arni", nameMr: "आर्णी" },
    ],
  },
  {
    id: "wardha",
    name: "Wardha",
    nameMr: "वर्धा",
    talukas: [
      { id: "wardha_city", name: "Wardha", nameMr: "वर्धा" },
      { id: "deoli", name: "Deoli", nameMr: "देवळी" },
      { id: "arvi", name: "Arvi", nameMr: "आर्वी" },
      { id: "hinganghat", name: "Hinganghat", nameMr: "हिंगणघाट" },
      { id: "seloo", name: "Seloo", nameMr: "सेलू" },
    ],
  },
  {
    id: "chandrapur",
    name: "Chandrapur",
    nameMr: "चंद्रपूर",
    talukas: [
      { id: "chandrapur_city", name: "Chandrapur", nameMr: "चंद्रपूर" },
      { id: "warora", name: "Warora", nameMr: "वरोरा" },
      { id: "bhadravati", name: "Bhadravati", nameMr: "भद्रावती" },
      { id: "ballarpur", name: "Ballarpur", nameMr: "बल्लारपूर" },
      { id: "rajura", name: "Rajura", nameMr: "राजूरा" },
      { id: "bramhapuri", name: "Bramhapuri", nameMr: "ब्रह्मपुरी" },
    ],
  },
  {
    id: "gadchiroli",
    name: "Gadchiroli",
    nameMr: "गडचिरोली",
    talukas: [
      { id: "gadchiroli_city", name: "Gadchiroli", nameMr: "गडचिरोली" },
      { id: "armori", name: "Armori", nameMr: "आरमोरी" },
      { id: "chamorshi", name: "Chamorshi", nameMr: "चामोर्शी" },
      { id: "aheri", name: "Aheri", nameMr: "अहेरी" },
      { id: "desaignaj", name: "Desaiganj (Wadsa)", nameMr: "देसाईगंज" },
    ],
  },
  {
    id: "bhandara",
    name: "Bhandara",
    nameMr: "भंडारा",
    talukas: [
      { id: "bhandara_city", name: "Bhandara", nameMr: "भंडारा" },
      { id: "tumsar", name: "Tumsar", nameMr: "तुमसर" },
      { id: "sakoli", name: "Sakoli", nameMr: "साकोली" },
      { id: "pauni", name: "Pauni", nameMr: "पवनी" },
    ],
  },
  {
    id: "gondia",
    name: "Gondia",
    nameMr: "गोंदिया",
    talukas: [
      { id: "gondia_city", name: "Gondia", nameMr: "गोंदिया" },
      { id: "tirora", name: "Tirora", nameMr: "तिरोडा" },
      { id: "amgaon", name: "Amgaon", nameMr: "आमगाव" },
      { id: "deori", name: "Deori", nameMr: "देवरी" },
    ],
  },
  {
    id: "jalgaon",
    name: "Jalgaon",
    nameMr: "जळगाव",
    talukas: [
      { id: "jalgaon_city", name: "Jalgaon", nameMr: "जळगाव" },
      { id: "bhusawal", name: "Bhusawal", nameMr: "भुसावळ" },
      { id: "chalisgaon", name: "Chalisgaon", nameMr: "चाळीसगाव" },
      { id: "chopda", name: "Chopda", nameMr: "चोपडा" },
      { id: "pachora", name: "Pachora", nameMr: "पाचोरा" },
      { id: "amalner", name: "Amalner", nameMr: "अमळनेर" },
      { id: "jamner", name: "Jamner", nameMr: "जामनेर" },
      { id: "raver", name: "Raver", nameMr: "रावेर" },
    ],
  },
  {
    id: "dhule",
    name: "Dhule",
    nameMr: "धुळे",
    talukas: [
      { id: "dhule_city", name: "Dhule", nameMr: "धुळे" },
      { id: "shirpur", name: "Shirpur", nameMr: "शिरपूर" },
      { id: "sakri", name: "Sakri", nameMr: "साक्री" },
      { id: "sindkheda", name: "Sindkheda", nameMr: "शिंदखेडा" },
    ],
  },
  {
    id: "nandurbar",
    name: "Nandurbar",
    nameMr: "नंदुरबार",
    talukas: [
      { id: "nandurbar_city", name: "Nandurbar", nameMr: "नंदुरबार" },
      { id: "shahada", name: "Shahada", nameMr: "शहादा" },
      { id: "navapur", name: "Navapur", nameMr: "नवापूर" },
      { id: "taloda", name: "Taloda", nameMr: "तळोदा" },
      { id: "akkalkuwa", name: "Akkalkuwa", nameMr: "अक्कलकुवा" },
    ],
  },
];

// ----------------------------------------------------------------------------
// Canonical Indian States Dataset
// ----------------------------------------------------------------------------
export const ALL_INDIAN_STATES: StateItem[] = [
  {
    id: "maharashtra",
    code: "MH",
    name: "Maharashtra",
    nameMr: "महाराष्ट्र",
    districts: MAHARASHTRA_DISTRICTS,
  },
  {
    id: "gujarat",
    code: "GJ",
    name: "Gujarat",
    nameMr: "गुजरात",
    districts: [
      { id: "ahmedabad", name: "Ahmedabad", talukas: [{ id: "ahmedabad_city", name: "Ahmedabad City" }, { id: "daskroi", name: "Daskroi" }] },
      { id: "surat", name: "Surat", talukas: [{ id: "surat_city", name: "Surat City" }, { id: "choryasi", name: "Choryasi" }] },
      { id: "vadodara", name: "Vadodara", talukas: [{ id: "vadodara_city", name: "Vadodara City" }] },
      { id: "rajkot", name: "Rajkot", talukas: [{ id: "rajkot_city", name: "Rajkot City" }] },
    ],
  },
  {
    id: "karnataka",
    code: "KA",
    name: "Karnataka",
    nameMr: "कर्नाटक",
    districts: [
      { id: "bengaluru", name: "Bengaluru Urban", talukas: [{ id: "bangalore_north", name: "Bangalore North" }, { id: "bangalore_south", name: "Bangalore South" }] },
      { id: "belagavi", name: "Belagavi", talukas: [{ id: "belagavi_city", name: "Belagavi" }, { id: "chikodi", name: "Chikodi" }, { id: "gokak", name: "Gokak" }] },
      { id: "dharwad", name: "Dharwad", talukas: [{ id: "hubballi", name: "Hubballi" }, { id: "dharwad_city", name: "Dharwad" }] },
    ],
  },
  {
    id: "madhya_pradesh",
    code: "MP",
    name: "Madhya Pradesh",
    nameMr: "मध्य प्रदेश",
    districts: [
      { id: "indore", name: "Indore", talukas: [{ id: "indore_city", name: "Indore" }] },
      { id: "bhopal", name: "Bhopal", talukas: [{ id: "bhopal_city", name: "Bhopal" }] },
      { id: "jabalpur", name: "Jabalpur", talukas: [{ id: "jabalpur_city", name: "Jabalpur" }] },
    ],
  },
  {
    id: "goa",
    code: "GA",
    name: "Goa",
    nameMr: "गोवा",
    districts: [
      { id: "north_goa", name: "North Goa", talukas: [{ id: "panaji", name: "Tiswadi (Panaji)" }, { id: "bardez", name: "Bardez (Mapusa)" }] },
      { id: "south_goa", name: "South Goa", talukas: [{ id: "salcete", name: "Salcete (Margao)" }, { id: "mormugao", name: "Mormugao (Vasco)" }] },
    ],
  },
  {
    id: "rajasthan",
    code: "RJ",
    name: "Rajasthan",
    nameMr: "राजस्थान",
    districts: [
      { id: "jaipur", name: "Jaipur", talukas: [{ id: "jaipur_city", name: "Jaipur" }] },
      { id: "jodhpur", name: "Jodhpur", talukas: [{ id: "jodhpur_city", name: "Jodhpur" }] },
      { id: "kota", name: "Kota", talukas: [{ id: "kota_city", name: "Kota" }] },
    ],
  },
  {
    id: "delhi",
    code: "DL",
    name: "Delhi (NCR)",
    nameMr: "दिल्ली",
    districts: [
      { id: "new_delhi", name: "New Delhi", talukas: [{ id: "connaught_place", name: "Connaught Place" }] },
      { id: "central_delhi", name: "Central Delhi", talukas: [{ id: "daryaganj", name: "Daryaganj" }] },
    ],
  },
  {
    id: "telangana",
    code: "TS",
    name: "Telangana",
    nameMr: "तेलंगणा",
    districts: [
      { id: "hyderabad", name: "Hyderabad", talukas: [{ id: "hyderabad_city", name: "Hyderabad" }, { id: "secunderabad", name: "Secunderabad" }] },
    ],
  },
];

// ----------------------------------------------------------------------------
// Utility Lookups & Helpers
// ----------------------------------------------------------------------------

export function getCanonicalStates(): StateItem[] {
  return ALL_INDIAN_STATES;
}

export function getDistrictsByState(stateIdOrName: string): DistrictItem[] {
  if (!stateIdOrName) return [];
  const clean = stateIdOrName.trim().toLowerCase();
  const state = ALL_INDIAN_STATES.find(
    (s) => s.id === clean || s.name.toLowerCase() === clean || s.code.toLowerCase() === clean
  );
  return state ? state.districts : [];
}

export function getTalukasByDistrict(districtIdOrName: string, stateId: string = "maharashtra"): TalukaItem[] {
  if (!districtIdOrName) return [];
  const districts = getDistrictsByState(stateId);
  const clean = districtIdOrName.trim().toLowerCase();
  const dist = districts.find(
    (d) => d.id === clean || d.name.toLowerCase() === clean || d.name.toLowerCase().startsWith(clean)
  );
  return dist ? dist.talukas : [];
}

/**
 * Cleanly normalizes user typed or stored district names to canonical display name
 */
export function normalizeDistrictName(input: string): string {
  if (!input) return "All Districts";
  const clean = input.trim().toLowerCase();
  for (const state of ALL_INDIAN_STATES) {
    for (const dist of state.districts) {
      if (dist.id === clean || dist.name.toLowerCase() === clean || dist.name.toLowerCase().includes(clean)) {
        return dist.name;
      }
    }
  }
  return input.trim();
}

/**
 * Cleanly normalizes user typed taluka name
 */
export function normalizeTalukaName(district: string, taluka: string): string {
  if (!taluka) return "";
  const talukas = getTalukasByDistrict(district);
  const clean = taluka.trim().toLowerCase();
  const found = talukas.find(
    (t) => t.id === clean || t.name.toLowerCase() === clean || t.name.toLowerCase().includes(clean)
  );
  return found ? found.name : taluka.trim();
}
