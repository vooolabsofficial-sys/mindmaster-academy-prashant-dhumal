"use client";

import React from "react";
import LegalPageLayout, {
  TableOfContentItem,
  KeyTakeawayItem,
} from "@/components/legal/LegalPageLayout";
import {
  ShieldCheck,
  Lock,
  CreditCard,
  UserCheck,
  Server,
  FileKey,
  HardDrive,
  AlertCircle,
  Mail,
  PhoneCall,
  MapPin,
  Clock,
  EyeOff,
  Database
} from "lucide-react";

const TOC_ITEMS: TableOfContentItem[] = [
  { id: "sec-introduction", titleEn: "1. Introduction & Overview", titleMr: "१. प्रस्तावना व व्याप्ती" },
  { id: "sec-data-collection", titleEn: "2. Personal Data We Collect", titleMr: "२. आम्ही गोळा करणारी वैयक्तिक माहिती" },
  { id: "sec-data-purpose", titleEn: "3. Educational Purpose of Processing", titleMr: "३. माहिती वापरण्याचे शैक्षणिक उद्दिष्ट" },
  { id: "sec-payment-security", titleEn: "4. Payment Gateway & PCI-DSS Compliance", titleMr: "४. पेमेंट सुरक्षा आणि रेझरपे नियम" },
  { id: "sec-storage-rls", titleEn: "5. Supabase Database & Row Level Security (RLS)", titleMr: "५. सुरक्षित डेटाबेस व रो-लेव्हल सिक्युरिटी" },
  { id: "sec-cookies-offline", titleEn: "6. Cookies & Service Worker Offline Caches", titleMr: "६. कुकीज व ऑफलाइन कॅश धोरण" },
  { id: "sec-student-rights", titleEn: "7. Student Rights & Account Management", titleMr: "७. विद्यार्थ्यांचे हक्क व खाते नियंत्रण" },
  { id: "sec-grievance-officer", titleEn: "8. Data Grievance Redressal Officer", titleMr: "८. वैधानिक तक्रार निवारण अधिकारी" },
];

const KEY_TAKEAWAYS: KeyTakeawayItem[] = [
  {
    icon: <Lock className="w-4 h-4 text-blue-600" />,
    titleEn: "Zero Banking Storage",
    titleMr: "बँकिंग तपशील साठवले जात नाहीत",
    descEn: "Payments process via Razorpay PCI-DSS Level 1 gateway. We never see or store debit/credit cards or UPI PINs.",
    descMr: "पेमेंट थेट रेझरपे द्वारे होते. आम्ही तुमचे डेबिट/क्रेडिट कार्ड क्रमांक किंवा UPI PIN कधीही सेव्ह करत नाही.",
    badgeEn: "PCI-DSS Safe",
    badgeMr: "१००% सुरक्षित",
    color: "blue",
  },
  {
    icon: <Database className="w-4 h-4 text-emerald-600" />,
    titleEn: "Supabase RLS Encrypted",
    titleMr: "एन्क्रिप्टेड डेटाबेस",
    descEn: "All profiles, video watch telemetry, and test scores are shielded by strict PostgreSQL Row Level Security (RLS).",
    descMr: "सर्व विद्यार्थी डेटा, व्हिडिओ वॉच टाईम व गुण PostgreSQL रो-लेव्हल सिक्युरिटीने पूर्णपणे संरक्षित आहेत.",
    badgeEn: "Strict RLS",
    badgeMr: "संरक्षित RLS",
    color: "emerald",
  },
  {
    icon: <EyeOff className="w-4 h-4 text-purple-600" />,
    titleEn: "No Third-Party Ads",
    titleMr: "जाहिरात कंपन्यांना विक्री नाही",
    descEn: "Your phone number is strictly for OTP login and batch updates. We never sell, rent, or trade student records.",
    descMr: "तुमचा फोन नंबर फक्त लॉगिन आणि शैक्षणिक सूचनांसाठी वापरला जातो. डेटा कोणालाही विकला जात नाही.",
    badgeEn: "100% Private",
    badgeMr: "खाजगी",
    color: "purple",
  },
  {
    icon: <UserCheck className="w-4 h-4 text-amber-600" />,
    titleEn: "Student Data Rights",
    titleMr: "विद्यार्थ्यांचे हक्क",
    descEn: "Inspect, rectify, or request data deletion anytime via In-App Support Tickets or our Satara Head Office.",
    descMr: "ॲपमधील सपोर्ट डेस्क किंवा सातारा मुख्यालयाशी संपर्क साधून तुमची माहिती कधीही अद्यतनित किंवा नष्ट करू शकता.",
    badgeEn: "Full Control",
    badgeMr: "पूर्ण अधिकार",
    color: "amber",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      currentTab="privacy"
      titleEn="Privacy Policy & Student Data Protection"
      titleMr="गोपनीयता धोरण आणि विद्यार्थी डेटा संरक्षण"
      subtitleEn="MindMaster Academy is committed to safeguarding student confidentiality, payment integrity, and data privacy under Indian Law."
      subtitleMr="माइंडमास्टर अकॅडमी भारतीय कायद्यानुसार विद्यार्थ्यांची गोपनीयता, पेमेंट सुरक्षा आणि डेटा संरक्षण जपण्यासाठी कटिबद्ध आहे."
      bannerSrc="/assets/guide/legal-privacy.webp"
      bannerAlt="MindMaster Academy Privacy Policy & Data Security Banner"
      tableOfContents={TOC_ITEMS}
      keyTakeaways={KEY_TAKEAWAYS}
    >
      {(lang) => {
        const isMr = lang === "mr";

        if (isMr) {
          return (
            <>
              {/* मराठी आवृत्ती */}
              <div id="sec-introduction" className="space-y-3 pt-2">
                <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                  कलम १ • प्रस्तावना
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  १. प्रस्तावना व धोरणाची व्याप्ती
                </h2>
                <p>
                  माइंडमास्टर अकॅडमी (संस्थापक व मार्गदर्शक: प्रशांत धुमाळ सर) च्या अधिकृत डिजिटल प्लॅटफॉर्मवर (वेबसाइट, PWA ॲप्लिकेशन आणि क्लासरूम सिस्टीम) आपले सहर्ष स्वागत आहे. आम्ही स्पर्धा परीक्षा, वैदिक गणित आणि स्मरणशक्ती सुधारणा अभ्यासक्रमांसाठी तंत्रज्ञानाचा वापर करताना प्रत्येक विद्यार्थ्याच्या गोपनीयतेचा आदर करतो.
                </p>
                <p>
                  हे गोपनीयता धोरण स्पष्ट करते की आम्ही तुमची कोणती माहिती गोळा करतो, ती कशी सुरक्षित ठेवली जाते आणि डिजिटल वैयक्तिक डेटा संरक्षण कायदा (DPDP Act, 2023) तसेच माहिती तंत्रज्ञान कायदा, २००० अंतर्गत तुमचे कायदेशीर हक्क काय आहेत.
                </p>
              </div>

              <div id="sec-data-collection" className="space-y-4 pt-4 border-t border-slate-100">
                <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                  कलम २ • संकलित माहिती
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  २. आम्ही गोळा करणारी वैयक्तिक माहिती
                </h2>
                <p>
                  आम्ही केवळ शैक्षणिक सेवा देणे आणि सिंगल-डिव्हाइस लॉगिन सुरक्षितता राखण्यासाठी आवश्यक असलेली मर्यादित माहितीच संकलित करतो:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <strong className="text-xs text-slate-900 block font-bold">अ. विद्यार्थ्याची ओळख:</strong>
                    <p className="text-xs text-slate-600">
                      पूर्ण नाव, नोंदणीकृत मोबाईल फोन नंबर (+९१), पर्यायी ईमेल पत्ता, जिल्हा, तालुका, शाळा किंवा महाविद्यालयाचे नाव.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <strong className="text-xs text-slate-900 block font-bold">आ. शैक्षणिक प्रगती व गुण:</strong>
                    <p className="text-xs text-slate-600">
                      व्हिडिओ पाहण्याचा वेळ (Watch-time telemetry), सोडवलेल्या सराव चाचण्यांचे गुण आणि प्रमाणपत्र अनुक्रमांक.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <strong className="text-xs text-slate-900 block font-bold">इ. डिव्हाइस व सुरक्षा नोंदी (DRM):</strong>
                    <p className="text-xs text-slate-600">
                      डिव्हाइस आयडेंटिफायर (Fingerprint), ऑपरेटिंग सिस्टीम, IP ॲड्रेस आणि ॲक्टिव्ह सेशन टोकन (एका वेळी एकाच फोनवर लॉगिन सुनिश्चित करण्यासाठी).
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <strong className="text-xs text-slate-900 block font-bold">ई. पेमेंट व्यवहार आयडी:</strong>
                    <p className="text-xs text-slate-600">
                      रेझरपे ऑर्डर आयडी, पेमेंट स्टेटस व तारीख. आम्ही कधीही कार्ड नंबर किंवा UPI पिन साठवत नाही.
                    </p>
                  </div>
                </div>
              </div>

              <div id="sec-data-purpose" className="space-y-4 pt-4 border-t border-slate-100">
                <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                  कलम ३ • माहितीचा वापर
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  ३. माहिती वापरण्याचे शैक्षणिक उद्दिष्ट
                </h2>
                <p>
                  संकलित केलेली माहिती खालील शैक्षणिक आणि कायदेशीर कारणांसाठीच वापरली जाते:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700">
                  <li>विद्यार्थ्यांच्या खरेदीनुसार व्हिडिओ लेक्चर्स, सराव प्रश्नपत्रिका व ई-बुक्स तत्काळ सुरू करणे.</li>
                  <li>विद्यार्थ्याच्या मूळ नावाने कायदेशीर व आयएसओ प्रमाणित गुणपत्रिका आणि पावती (Fee Receipt) तयार करणे.</li>
                  <li>बॅच सुरू होणे, परीक्षा मार्गदर्शन आणि अभ्यासक्रमाच्या मुदतीबाबत व्हॉट्सॲप अथवा SMS द्वारे थेट सूचना पाठवणे.</li>
                  <li>व्हिडिओ पायरसी रोखणे आणि एकाच खात्याचा गैरवापर टाळणे.</li>
                </ul>
              </div>

              <div id="sec-payment-security" className="space-y-4 pt-4 border-t border-slate-100">
                <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                  कलम ४ • आर्थिक व्यवहार सुरक्षा
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  ४. पेमेंट गेटवे आणि PCI-DSS अनुपालन
                </h2>
                <p>
                  माइंडमास्टर अकॅडमीवरील सर्व ऑनलाइन आर्थिक व्यवहार <strong>Razorpay Payment Gateway</strong> द्वारे पूर्ण केले जातात. रेझरपे ही भारतीय रिझर्व्ह बँक (RBI) मान्यताप्राप्त आणि PCI-DSS Level 1 प्रमाणित संस्था आहे.
                </p>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>बँकिंग सुरक्षिततेची खात्री:</strong> सर्व व्यवहार २५६-बिट SSL/TLS एन्क्रिप्शनने सुरक्षित केले जातात. तुमचे बँक खाते, डेबिट/क्रेडिट कार्ड पासवर्ड किंवा यूपीआय पिन आमच्या सर्व्हरवर कधीही येत नाही व सेव्ह केला जात नाही.
                  </div>
                </div>
              </div>

              <div id="sec-storage-rls" className="space-y-4 pt-4 border-t border-slate-100">
                <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                  कलम ५ • डेटा स्टोरेज व RLS
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  ५. Supabase डेटाबेस आणि रो-लेव्हल सिक्युरिटी (RLS)
                </h2>
                <p>
                  आमचा डेटाबेस जागतिक दर्जाच्या <strong>Supabase PostgreSQL</strong> क्लाउड इन्फ्रास्ट्रक्चरवर चालतो. आम्ही कठोर रो-लेव्हल सिक्युरिटी (Row Level Security - RLS) धोरणे लागू केली आहेत:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700">
                  <li>प्रत्येक विद्यार्थ्याला फक्त त्याचा स्वतःचाच शैक्षणिक रेकॉर्ड पाहण्याची मुभा असते.</li>
                  <li>कोणताही बाह्य युझर दुसऱ्या विद्यार्थ्याचा मोबाईल क्रमांक, नाव किंवा चाचणी गुण पाहू शकत नाही.</li>
                  <li>ॲडमिन प्रवेश फक्त अधिकृत, टू-फॅक्टर ऑथेंटिकेशन असणाऱ्या कर्मचाऱ्यांसाठीच मर्यादित आहे.</li>
                </ul>
              </div>

              <div id="sec-cookies-offline" className="space-y-4 pt-4 border-t border-slate-100">
                <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                  कलम ६ • कुकीज व ऑफलाइन कॅश
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  ६. कुकीज व सर्व्हिस वर्कर ऑफलाइन कॅश
                </h2>
                <p>
                  आमचे प्रोग्रेसिव्ह वेब ॲप (PWA) अखंडित अभ्यासाचा अनुभव देण्यासाठी स्थानिक ब्राउझर कुकीज आणि <code>Service Worker (sw.js)</code> चा वापर करते.
                </p>
                <p>
                  यामुळे इंटरनेट कनेक्शन कमकुवत असतानाही सेव्ह केलेल्या नोट्स, सूत्रे आणि अभ्यासक्रम विनाअडथळा उघडता येतात. विद्यार्थी प्रोफाईल सेटिंग्जमधील &quot;Clear App Cache&quot; पर्यायावर क्लिक करून हा कॅश कधीही हटवू शकतात.
                </p>
              </div>

              <div id="sec-student-rights" className="space-y-4 pt-4 border-t border-slate-100">
                <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                  कलम ७ • विद्यार्थ्यांचे अधिकार
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  ७. विद्यार्थ्यांचे हक्क व खाते नियंत्रण
                </h2>
                <p>
                  भारतातील प्रत्येक विद्यार्थ्याला त्याच्या वैयक्तिक माहितीबाबत खालील कायदेशीर हक्क आहेत:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700">
                  <li><strong>माहिती पाहण्याचा हक्क:</strong> तुम्ही ॲपमध्ये स्वतःची नोंदवलेली सर्व माहिती तपासू शकता.</li>
                  <li><strong>माहिती दुरुस्तीचा हक्क:</strong> नावातील स्पेलिंग किंवा शाळा बदलण्यासाठी ॲपमधील सपोर्ट डेस्कवरून विनंती करू शकता.</li>
                  <li><strong>खाते हटवण्याचा हक्क:</strong> अभ्यासक्रम पूर्ण झाल्यानंतर किंवा आवश्यकतेनुसार आपले खाते कायमस्वरूपी हटवण्याची विनंती करता येते.</li>
                </ul>
              </div>

              <div id="sec-grievance-officer" className="space-y-4 pt-4 border-t border-slate-100">
                <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                  कलम ८ • तक्रार निवारण
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  ८. वैधानिक डेटा तक्रार निवारण अधिकारी
                </h2>
                <p>
                  माहिती तंत्रज्ञान कायदा २००० (कलम ४३A व नियम ५) नुसार माइंडमास्टर अकॅडमीने विद्यार्थ्यांच्या तक्रारींसाठी खालील अधिकृत अधिकाऱ्याची नियुक्ती केली आहे:
                </p>
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="font-extrabold text-sm text-slate-900">
                    प्रशांत धुमाळ सर (संस्थापक व मार्गदर्शक)
                  </div>
                  <div className="text-slate-600">
                    डेटा संरक्षण व तक्रार निवारण अधिकारी, माइंडमास्टर अकॅडमी
                  </div>
                  <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                    <div className="flex items-center gap-2">
                      <PhoneCall className="w-4 h-4 text-blue-600" />
                      <span>हेल्पलाइन: +91 84593 44077</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <span>ईमेल: mindmasterdhumal@gmail.com</span>
                    </div>
                    <div className="flex items-start gap-2 sm:col-span-2">
                      <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>पत्ता: माइंडमास्टर अकॅडमी, पोवई नाक्याजवळ, सातारा - ४१५००१, महाराष्ट्र, भारत.</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          );
        }

        // English Version (Default & Primary Legal Reference)
        return (
          <>
            <div id="sec-introduction" className="space-y-3 pt-2">
              <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                Section 1 • Introduction & Scope
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                1. Introduction & Overview
              </h2>
              <p>
                Welcome to <strong>MindMaster Academy</strong> (founded and mentored by <strong>Prashant Dhumal Sir</strong>). We provide competitive exam preparation, Vedic Mathematics methodologies, and speed calculation training through our online web application, Progressive Web App (PWA), and offline learning centers.
              </p>
              <p>
                This Privacy Policy outlines how MindMaster Academy collects, uses, encrypts, and protects student personal information in full compliance with the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong> and the <strong>Information Technology Act, 2000</strong>.
              </p>
            </div>

            <div id="sec-data-collection" className="space-y-4 pt-4 border-t border-slate-100">
              <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                Section 2 • Data Collection
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                2. Personal Data We Collect
              </h2>
              <p>
                We collect minimal, strictly purposeful student information necessary to deliver educational video content, evaluate tests, and enforce digital rights management (DRM):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <strong className="text-xs text-slate-900 block font-bold">A. Student Identity Information:</strong>
                  <p className="text-xs text-slate-600">
                    Full Name, verified Mobile Phone Number (+91 format), optional Email Address, District, Taluka, and School/College Name.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <strong className="text-xs text-slate-900 block font-bold">B. Academic & Telemetry Metrics:</strong>
                  <p className="text-xs text-slate-600">
                    Video watch-time heartbeats, lesson completion marks, speed calculation practice test scores, and ISO certificate credentials.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <strong className="text-xs text-slate-900 block font-bold">C. Device & DRM Security Telemetry:</strong>
                  <p className="text-xs text-slate-600">
                    Browser user-agent, unique device fingerprint token, IP address, and active session tokens used strictly to enforce single-device session integrity.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <strong className="text-xs text-slate-900 block font-bold">D. Financial & Transaction Logs:</strong>
                  <p className="text-xs text-slate-600">
                    Razorpay Order IDs, Payment IDs, and invoice timestamps. MindMaster Academy never accesses or stores debit/credit cards or UPI PINs.
                  </p>
                </div>
              </div>
            </div>

            <div id="sec-data-purpose" className="space-y-4 pt-4 border-t border-slate-100">
              <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                Section 3 • Purpose of Processing
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                3. Educational Purpose of Data Processing
              </h2>
              <p>
                Student personal data is processed solely for legitimate educational and security objectives:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700">
                <li>Instant unlocking and streaming of enrolled video lectures, practice drills, and digital books.</li>
                <li>Generating verifiable, ISO-compliant Certificates of Completion and GST-compliant fee receipts under the student&apos;s legal name.</li>
                <li>Dispatching critical academic alerts, batch announcements, and certificate dispatch updates via WhatsApp or SMS.</li>
                <li>Enforcing strict single-device login protection and anti-piracy digital watermarking.</li>
              </ul>
            </div>

            <div id="sec-payment-security" className="space-y-4 pt-4 border-t border-slate-100">
              <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                Section 4 • Payment Gateway Security
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                4. Payment Gateway &amp; PCI-DSS Compliance
              </h2>
              <p>
                All online payments on MindMaster Academy are processed through <strong>Razorpay Payment Gateway</strong>, a certified <strong>PCI-DSS Level 1</strong> compliant payment aggregator regulated by the Reserve Bank of India (RBI).
              </p>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>End-to-End Encryption Guarantee:</strong> All payment communications utilize 256-bit TLS/SSL encryption. MindMaster Academy never has access to, nor retains, any confidential payment credentials including Card CVVs, Expiry Dates, NetBanking passwords, or UPI MPINs.
                </div>
              </div>
            </div>

            <div id="sec-storage-rls" className="space-y-4 pt-4 border-t border-slate-100">
              <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                Section 5 • Database Security & RLS
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                5. Supabase PostgreSQL &amp; Row Level Security (RLS)
              </h2>
              <p>
                All student records are hosted on an enterprise-grade <strong>Supabase PostgreSQL</strong> cloud database. We enforce strict database-level <strong>Row Level Security (RLS)</strong> policies:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700">
                <li>Students can only view and mutate their own profile, enrolled courses, and exam test results.</li>
                <li>Cross-student record inspection is strictly blocked at the PostgreSQL engine level.</li>
                <li>Staff and mentor access is isolated through authenticated role-based access control (RBAC) with complete audit logging.</li>
              </ul>
            </div>

            <div id="sec-cookies-offline" className="space-y-4 pt-4 border-t border-slate-100">
              <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                Section 6 • Cookies & Offline Caches
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                6. Cookies &amp; Service Worker Offline Caches
              </h2>
              <p>
                Our Progressive Web App (PWA) uses secure HTTP cookies and a client-side <code>Service Worker (sw.js)</code> cache to optimize learning speeds and support offline study notes when network reception is low.
              </p>
              <p>
                Students can purge cached notes or local session assets at any time via Student Settings by clicking <em>&quot;Clear App Cache &amp; Re-Sync&quot;</em>.
              </p>
            </div>

            <div id="sec-student-rights" className="space-y-4 pt-4 border-t border-slate-100">
              <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                Section 7 • Student Rights
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                7. Student Rights &amp; Account Management
              </h2>
              <p>
                Under Indian data protection frameworks, students and legal guardians retain the following absolute rights:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700">
                <li><strong>Right of Access &amp; Summary:</strong> Inspect all personal data and watch history retained on our platform.</li>
                <li><strong>Right of Correction:</strong> Request immediate correction of spelling mistakes in your name, school, or contact details.</li>
                <li><strong>Right of Erasure:</strong> Request permanent deletion of non-statutory student records upon completion of studies.</li>
              </ul>
            </div>

            <div id="sec-grievance-officer" className="space-y-4 pt-4 border-t border-slate-100">
              <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                Section 8 • Grievance Officer
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                8. Statutory Data Grievance Redressal Officer
              </h2>
              <p>
                In compliance with the Information Technology Act, 2000 and rules made thereunder, the contact details of the official Grievance Officer for MindMaster Academy are as follows:
              </p>
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="font-extrabold text-sm text-slate-900">
                  Prashant Dhumal Sir (Founder &amp; Mentor)
                </div>
                <div className="text-slate-600">
                  Data Protection &amp; Student Grievance Officer, MindMaster Academy
                </div>
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                  <div className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-blue-600" />
                    <span>Direct Helpline: +91 84593 44077</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span>Official Email: mindmasterdhumal@gmail.com</span>
                  </div>
                  <div className="flex items-start gap-2 sm:col-span-2">
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Headquarters: MindMaster Academy, Near Powai Naka, Satara - 415001, Maharashtra, India.</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      }}
    </LegalPageLayout>
  );
}
