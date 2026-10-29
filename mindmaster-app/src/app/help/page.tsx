"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  HelpCircle,
  BookOpen,
  Smartphone,
  CreditCard,
  Video,
  Download,
  LifeBuoy,
  Award,
  Search,
  ChevronDown,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  PhoneCall,
  Mail,
  Building2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Languages,
  Globe,
  ArrowLeft,
  FileText,
  Clock,
  Zap,
} from "lucide-react";
import AppShell from "@/components/navigation/AppShell";
import { useLanguage } from "@/lib/LanguageContext";

interface StepGuide {
  id: string;
  stepNum: string;
  titleEn: string;
  titleMr: string;
  badgeEn: string;
  badgeMr: string;
  descEn: string;
  descMr: string;
  imageSrc: string;
  imageAlt: string;
  pointsEn: string[];
  pointsMr: string[];
  actionLabelEn: string;
  actionLabelMr: string;
  actionHref: string;
  color: "blue" | "emerald" | "amber" | "purple";
}

interface FaqItem {
  id: string;
  category: "device" | "payment" | "courses" | "certificate" | "general";
  categoryLabelEn: string;
  categoryLabelMr: string;
  questionEn: string;
  questionMr: string;
  answerEn: string;
  answerMr: string;
  actionHref?: string;
  actionTextEn?: string;
  actionTextMr?: string;
}

const STEP_GUIDES: StepGuide[] = [
  {
    id: "step-1",
    stepNum: "01",
    titleEn: "Student OTP Login & Strict Single-Device Lock",
    titleMr: "विद्यार्थी ओटीपी लॉगिन आणि सिंगल-डिव्हाइस नियम",
    badgeEn: "Step 01 • Account Security",
    badgeMr: "पायरी ०१ • खाते सुरक्षा",
    descEn: "Log in with your verified mobile number and OTP. MindMaster Academy enforces strict single-device DRM protection.",
    descMr: "नोंदणीकृत मोबाईल नंबर आणि ओटीपी द्वारे लॉगिन करा. एका वेळी एकाच मोबाईलवर अभ्यास करता येईल.",
    imageSrc: "/assets/guide/step-1-login-device.webp",
    imageAlt: "Student Login & Single Device Security Mockup",
    pointsEn: [
      "Enter your 10-digit Indian mobile number (+91) and receive a secure 6-digit OTP via SMS.",
      "Strict 1 Student = 1 Active Device: Logging in on a second phone or PC automatically terminates prior sessions.",
      "Changing your handset? Simply request a 'Device Reset' in Student Settings > In-App Support Desk.",
      "Never share OTPs or login credentials. Automated monitoring permanently locks accounts attempting simultaneous streams.",
    ],
    pointsMr: [
      "तुमचा १० अंकी भारतीय मोबाईल क्रमांक (+९१) टाका आणि सुरक्षित ६ अंकी ओटीपी मिळवा.",
      "१ विद्यार्थी = १ डिव्हाइस नियम: दुसऱ्या मोबाईलवर लॉगिन केल्यास जुने सेशन आपोआप बंद होईल.",
      "नवीन मोबाईल घेतला असल्यास प्रोफाईल सेटिंग्जमधील 'In-App Support Desk' वरून 'Device Reset' ची विनंती करा.",
      "ओटीपी किंवा पासवर्ड कोणाशीही शेअर करू नका. एकाच वेळी दोन ठिकाणी वापरल्यास खाते लॉक केले जाते.",
    ],
    actionLabelEn: "Go to Login / Profile",
    actionLabelMr: "लॉगिन / प्रोफाईलवर जा",
    actionHref: "/profile",
    color: "blue",
  },
  {
    id: "step-2",
    stepNum: "02",
    titleEn: "Selecting Course, Coupon Code & Razorpay Checkout",
    titleMr: "कोर्स निवडणे, कूपन कोड आणि सुरक्षित पेमेंट",
    badgeEn: "Step 02 • Fast Enrollment",
    badgeMr: "पायरी ०२ • जलद प्रवेश",
    descEn: "Browse Vedic Maths & memory courses, apply promotional coupons, and complete instant UPI/card checkout.",
    descMr: "वैदिक गणित व स्मरणशक्ती अभ्यासक्रम निवडा, कूपन कोड वापरून सूट मिळवा आणि तत्काळ पेमेंट पूर्ण करा.",
    imageSrc: "/assets/guide/step-2-buy-course-coupon.webp",
    imageAlt: "Course Selection and Coupon Checkout Mockup",
    pointsEn: [
      "Explore full course syllabi, introductory preview videos, and teacher credentials before purchasing.",
      "Have a school or promotional coupon code? Enter it on checkout (e.g., FESTIVE500) and click 'Apply' for instant discounts.",
      "Pay securely using Google Pay, PhonePe, Paytm, BHIM UPI, NetBanking, or Credit/Debit Cards via Razorpay PCI-DSS Level 1 gateway.",
      "Your course, video lectures, and practice drills unlock instantaneously upon payment confirmation.",
    ],
    pointsMr: [
      "खरेदी करण्यापूर्वी संपूर्ण अभ्यासक्रम, मोफत डेमो व्हिडिओ आणि मार्गदर्शक सरांचे तपशील तपासा.",
      "शाळा किंवा अकॅडमीचा कूपन कोड असल्यास चेकआऊट पेजवर तो टाकून तत्काळ फी सवलत मिळवा.",
      "Google Pay, PhonePe, Paytm, UPI किंवा नेटबँकिंग द्वारे रेझरपे सुरक्षित गेटवेने पैसे भरा.",
      "पेमेंट यशस्वी होताच व्हिडिओ लेक्चर्स आणि सराव चाचण्या तुमच्या खात्यात तत्काळ अनलॉक होतात.",
    ],
    actionLabelEn: "Browse Live Courses",
    actionLabelMr: "सर्व कोर्सेस पहा",
    actionHref: "/courses",
    color: "emerald",
  },
  {
    id: "step-3",
    stepNum: "03",
    titleEn: "HD Video Player, Dynamic Watermark & PDF Notes",
    titleMr: "फुल एचडी व्हिडिओ प्लेअर, वॉटरमार्क आणि नोट्स",
    badgeEn: "Step 03 • Daily Learning",
    badgeMr: "पायरी ०३ • दैनिक अभ्यास",
    descEn: "Watch crystal-clear lesson streams, adjust speed up to 2x, read handwritten formulas, and follow anti-piracy rules.",
    descMr: "स्पष्ट व्हिडिओ लेक्चर्स पहा, स्पीड १.२५x ते २x वाढवा, हस्तलिखित नोट्स वाचा आणि पायरसी नियमांचे पालन करा.",
    imageSrc: "/assets/guide/step-3-watch-video-notes.webp",
    imageAlt: "HD Video Player and PDF Notes Mockup",
    pointsEn: [
      "Stream lessons in 1080p HD with resume playback functionality (remembers exactly where you paused).",
      "Dynamic moving watermark containing your masked mobile number and student ID floats across the player to deter piracy.",
      "Screen recording, capturing, or sharing credentials on Telegram/WhatsApp is strictly illegal under the Indian Copyright Act.",
      "Download or view official PDF notes, formula sheets, and speed calculation trick charts directly below each video.",
    ],
    pointsMr: [
      "१०८०p फुल एचडी व्हिडिओ पहा. तुम्ही जिथे व्हिडिओ थांबवला होता, तिथूनच तो पुन्हा सुरू होतो.",
      "पायरसी रोखण्यासाठी व्हिडिओवर तुमचा मोबाईल नंबर सतत दिसतो. स्क्रीन रेकॉर्डिंग करण्यास सक्त मनाई आहे.",
      "टेलिग्राम किंवा व्हॉट्सॲपवर व्हिडिओ शेअर केल्यास कॉपीराइट कायद्यानुसार गुन्हा दाखल केला जाऊ शकतो.",
      "प्रत्येक व्हिडिओखाली दिलेली हस्तलिखित सूत्रे, ट्रिक्स आणि पीडीएफ नोट्स सहजपणे डाऊनलोड करा.",
    ],
    actionLabelEn: "Open My Learning",
    actionLabelMr: "माझे कोर्सेस उघडा",
    actionHref: "/my-courses",
    color: "amber",
  },
  {
    id: "step-4",
    stepNum: "04",
    titleEn: "Install MindMaster PWA App & Offline Study Vault",
    titleMr: "माइंडमास्टर ॲप इन्स्टॉल करणे आणि ऑफलाइन अभ्यास",
    badgeEn: "Step 04 • Mobile PWA",
    badgeMr: "पायरी ०४ • मोबाईल ॲप",
    descEn: "Install MindMaster directly to your Android or iPhone home screen without heavy app stores, and study notes offline.",
    descMr: "प्ले स्टोअरच्या कटकटीशिवाय ॲप थेट मोबाईल होमस्क्रीनवर इन्स्टॉल करा आणि इंटरनेट नसतानाही नोट्स वाचा.",
    imageSrc: "/assets/guide/step-4-install-pwa.webp",
    imageAlt: "PWA Mobile Installation and Offline Study Mockup",
    pointsEn: [
      "Android Users: Open the website in Google Chrome > tap 3 dots (top right) > click 'Install App' or 'Add to Home Screen'.",
      "iPhone Users: Open the website in Safari > tap the Share icon (square with arrow) > scroll and tap 'Add to Home Screen'.",
      "Enjoy a distraction-free, fullscreen app experience with zero app store updates taking up storage space (< 2 MB total).",
      "Offline Study Vault: Cached syllabus, notes, and speed calculation practice questions open smoothly even without internet.",
    ],
    pointsMr: [
      "अँड्रॉइड युझर्स: क्रोम ब्राउझरमध्ये उघडा > उजव्या बाजूला ३ डॉट्सवर क्लिक करा > 'Install App' निवडा.",
      "आयफोन युझर्स: सफारी ब्राउझरमध्ये उघडा > शेअर आयकॉनवर क्लिक करा > 'Add to Home Screen' निवडा.",
      "कोणत्याही जाहिरातीशिवाय फुलस्क्रीन ॲपचा अनुभव मिळवा. ॲपचा आकार फक्त २ MB पेक्षा कमी आहे.",
      "ऑफलाइन मोड: इंटरनेट बंद असतानाही सेव्ह केलेल्या नोट्स आणि वैदिक गणिताची सूत्रे सहज उघडता येतात.",
    ],
    actionLabelEn: "View Offline Vault in Settings",
    actionLabelMr: "ऑफलाइन व्हॉल्ट पहा",
    actionHref: "/profile",
    color: "purple",
  },
  {
    id: "step-5",
    stepNum: "05",
    titleEn: "Student Settings & In-App Support Ticket Desk",
    titleMr: "विद्यार्थी सेटिंग्ज आणि थेट सपोर्ट तिकीट डेस्क",
    badgeEn: "Step 05 • Student Helpdesk",
    badgeMr: "पायरी ०५ • मदत केंद्र",
    descEn: "Need a phone session reset or have payment questions? Raise a ticket from Profile and get staff resolution within 24h.",
    descMr: "मोबाईल बदलल्यास डिव्हाइस रीसेट हवे असल्यास किंवा पेमेंट अडचण असल्यास थेट ॲपमधून तिकीट नोंदवा.",
    imageSrc: "/assets/guide/step-5-raise-ticket.webp",
    imageAlt: "Support Ticket Desk and Settings Mockup",
    pointsEn: [
      "Navigate to Profile > click on 'In-App Support Desk' or 'Support' tab in the navigation menu.",
      "Click 'Create Support Ticket' and pick your issue category: 'Request Device Reset', 'Payment / Course Access', or 'Technical Help'.",
      "Attach your Order ID or phone change details so our Satara office can verify and resolve your query immediately.",
      "Track staff responses, approval status, and resolution timestamps directly in your ticket history.",
    ],
    pointsMr: [
      "प्रोफाईलमध्ये जा > 'In-App Support Desk' वर क्लिक करा किंवा मेन्यूमधील 'Support' पर्याय निवडा.",
      "'Create Support Ticket' वर क्लिक करून कॅटेगरी निवडा (उदा. 'Request Device Reset' किंवा 'Payment / Course Access').",
      "तुमचा ऑर्डर आयडी किंवा माहिती लिहा, जेणेकरून सातारा कार्यालयीन टीम तत्काळ मदत करू शकेल.",
      "तिकीट स्टेटस (Pending / Resolved) आणि सरांचे उत्तर थेट तुमच्या ॲपमध्ये ट्रॅक करा.",
    ],
    actionLabelEn: "Raise Support Ticket",
    actionLabelMr: "सपोर्ट तिकीट नोंदवा",
    actionHref: "/support",
    color: "blue",
  },
  {
    id: "step-6",
    stepNum: "06",
    titleEn: "100% Course Completion & Verifiable QR Certificate",
    titleMr: "१००% अभ्यासक्रम पूर्ण आणि QR कोड प्रमाणपत्र",
    badgeEn: "Step 06 • Official Certificate",
    badgeMr: "पायरी ०६ • अधिकृत प्रमाणपत्र",
    descEn: "Watch 100% of course lessons, confirm your legal name, and download an ISO 9001:2015 signed certificate with live QR.",
    descMr: "सर्व लेक्चर्स १००% पूर्ण करा, तुमचे नाव तपासा आणि थेट QR कोड असलेले अधिकृत डिजिटल प्रमाणपत्र मिळवा.",
    imageSrc: "/assets/guide/step-6-claim-certificate.webp",
    imageAlt: "Verifiable Certificate of Completion Mockup",
    pointsEn: [
      "Course watch progress automatically tracks each second watched; hitting 100% unlocks the 'Claim Certificate' button.",
      "Verify that your student full name matches your school and government ID for official school academic validity.",
      "Instantly download a high-resolution, print-ready vector A4 Certificate signed by Prashant Dhumal Sir.",
      "Each certificate features an embedded QR code that anyone can scan to verify authenticity at mindmaster.academy/verify-certificate.",
    ],
    pointsMr: [
      "सिस्टीम तुमचा व्हिडिओ पाहण्याचा वेळ आपोआप मोजते; १००% पूर्ण होताच 'Claim Certificate' बटन सुरू होते.",
      "शालेय दाखल्यानुसार तुमचे पूर्ण नाव योग्य असल्याची खात्री करा, जेणेकरून प्रमाणपत्र अधिकृत मानले जाईल.",
      "प्रशांत धुमाळ सरांची स्वाक्षरी आणि आयएसओ ९००१:२०१५ शिक्का असलेले डिजिटल प्रमाणपत्र तत्काळ डाऊनलोड करा.",
      "प्रमाणपत्रावरील QR कोड स्कॅन करून कोणीही ऑनलाइन खात्री करू शकते (mindmaster.academy/verify-certificate).",
    ],
    actionLabelEn: "Verify Certificate QR",
    actionLabelMr: "प्रमाणपत्र QR पडताळा",
    actionHref: "/verify-certificate",
    color: "emerald",
  },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    id: "faq-1",
    category: "device",
    categoryLabelEn: "Device & Login",
    categoryLabelMr: "डिव्हाइस व लॉगिन",
    questionEn: "Why does the app say 'Logged in on another device' or 'Session Locked'?",
    questionMr: "ॲपमध्ये 'Logged in on another device' किंवा सेशन लॉक का दाखवते?",
    answerEn: "MindMaster Academy enforces a strict 1 Student = 1 Active Device DRM policy to protect proprietary course curriculum and prevent account piracy. If you log in on a new phone, laptop, or browser, your earlier session is automatically terminated. To reset your authorized device after purchasing a new phone, go to Profile > In-App Support Desk > select 'Request Device Reset'. Our staff approves verified student requests within 2 hours.",
    answerMr: "अभ्यासक्रमाच्या पायरसीला आळा घालण्यासाठी आमचे '१ विद्यार्थी = १ डिव्हाइस' धोरण लागू आहे. तुम्ही दुसऱ्या फोनवर किंवा कॉम्प्युटरवर लॉगिन केल्यास जुने सेशन बंद होते. नवीन मोबाईल घेतल्यास विद्यार्थी प्रोफाईल सेटिंग्जमधील 'In-App Support Desk' वरून 'Request Device Reset' ची विनंती करा. आमची टीम २ तासांत जुने सेशन रीसेट करते.",
    actionHref: "/support",
    actionTextEn: "Request Device Reset",
    actionTextMr: "डिव्हाइस रीसेट विनंती करा",
  },
  {
    id: "faq-2",
    category: "payment",
    categoryLabelEn: "Payments & Refunds",
    categoryLabelMr: "पेमेंट व परतावा",
    questionEn: "What if money was deducted from my UPI/bank account, but the course is still locked?",
    questionMr: "माझ्या खात्यातून पैसे कापले गेले परंतु कोर्स अजूनही लॉक असेल तर काय करावे?",
    answerEn: "Due to banking server timeouts or slow internet connections, a payment confirmation may take 5 to 15 minutes to reconcile with Razorpay. If your course does not unlock automatically within 30 minutes, go to Profile > Support Desk > create a ticket under 'Payment / Course Access' with your Razorpay Payment ID (pay_...) or bank UTR number. Our finance team in Satara verifies the transaction and unlocks your course immediately.",
    answerMr: "कधीकधी इंटरनेट किंवा बँकेच्या सर्व्हरमुळे पेमेंट कन्फर्मेशन येण्यास ५ ते १५ मिनिटे लागू शकतात. जर ३० मिनिटांनंतरही कोर्स सुरू झाला नाही, तर प्रोफाईल सेटिंग्जमधील सपोर्ट डेस्कवरून 'Payment / Course Access' अंतर्गत तिकीट नोंदवा आणि बँकेचा UTR किंवा रेझरपे आयडी लिहा. आमची टीम तात्काळ खात्री करून कोर्स सुरू करून देईल.",
    actionHref: "/support",
    actionTextEn: "Open Payment Ticket",
    actionTextMr: "पेमेंट सपोर्ट तिकीट उघडा",
  },
  {
    id: "faq-3",
    category: "general",
    categoryLabelEn: "General & Language",
    categoryLabelMr: "सामान्य व भाषा",
    questionEn: "How do I switch the application language back to English?",
    questionMr: "ॲपची भाषा पुन्हा मूळ इंग्रजी (English) भाषेत कशी बदलावी?",
    answerEn: "English is the primary fallback language of MindMaster Academy. Whenever any regional language (such as Marathi) is active, the top navigation bar and settings page always keep a prominent blue button labeled 'Switch to English' in clear English text. Simply click 'Switch to English' to reset the entire portal to English instantly without refreshing.",
    answerMr: "इंग्रजी ही माइंडमास्टर अकॅडमीची मुख्य भाषा आहे. तुम्ही मराठी भाषा निवडलेली असतानाही वरील टॉप बार आणि सेटिंग्जमध्ये निळ्या रंगात 'Switch to English' हे बटन सतत दिसते. त्यावर क्लिक करताच संपूर्ण ॲप तत्काळ इंग्रजी भाषेत रीसेट होते.",
  },
  {
    id: "faq-4",
    category: "courses",
    categoryLabelEn: "Courses & Videos",
    categoryLabelMr: "कोर्सेस व व्हिडिओ",
    questionEn: "Can I download course videos or notes for offline studying?",
    questionMr: "मी व्हिडिओ किंवा नोट्स ऑफलाइन अभ्यासासाठी डाऊनलोड करू शकतो का?",
    answerEn: "All handwritten PDF formula sheets, mnemonic charts, and practice question sets can be downloaded or saved to your browser's Progressive Web App (PWA) Offline Vault to read anytime without internet. However, full video lectures are streamed securely online to enforce anti-piracy dynamic watermarking and copyright compliance under Indian Law.",
    answerMr: "सर्व हस्तलिखित पीडीएफ नोट्स, ५०० वर्षांचे कॅलेंडर ट्रिक्स आणि सराव प्रश्नसंच तुम्ही डाऊनलोड करू शकता किंवा PWA ऑफलाइन व्हॉल्टमध्ये सेव्ह करून इंटरनेटशिवाय वाचू शकता. परंतु व्हिडिओ लेक्चर्स पायरसी सुरक्षेसाठी ऑनलाइनच प्ले होतात.",
    actionHref: "/books",
    actionTextEn: "Browse PDF Notes",
    actionTextMr: "पीडीएफ पुस्तके पहा",
  },
  {
    id: "faq-5",
    category: "certificate",
    categoryLabelEn: "Certificates",
    categoryLabelMr: "प्रमाणपत्र",
    questionEn: "When and how do I receive my Course Completion Certificate?",
    questionMr: "मला अभ्यासक्रम पूर्ण झाल्याचे प्रमाणपत्र कधी व कसे मिळेल?",
    answerEn: "Your Certificate of Completion unlocks automatically as soon as your verified watch progress reaches 100% across all video lessons in the course. You can verify your legal name spelling and immediately download a high-resolution, print-ready A4 PDF certificate signed by Prashant Dhumal Sir, complete with an ISO 9001:2015 seal and a public QR verification code.",
    answerMr: "कोर्समधील सर्व व्हिडिओ १००% पाहून पूर्ण होताच प्रमाणपत्राचे बटन सुरू होते. तुमचे नाव तपासून तुम्ही तत्काळ प्रशांत धुमाळ सरांची स्वाक्षरी आणि आयएसओ ९००१:२०१५ मान्यता असलेले हाय-रिझोल्यूशन A4 पीडीएफ प्रमाणपत्र डाऊनलोड करू शकता. यावर ऑनलाइन पडताळणीसाठी QR कोड असतो.",
    actionHref: "/verify-certificate",
    actionTextEn: "Verify Certificate Portal",
    actionTextMr: "प्रमाणपत्र पडताळणी पोर्टल",
  },
  {
    id: "faq-6",
    category: "general",
    categoryLabelEn: "PWA Mobile App",
    categoryLabelMr: "मोबाईल ॲप",
    questionEn: "How do I install MindMaster Academy on my Android or iPhone?",
    questionMr: "माइंडमास्टर अकॅडमी ॲप अँड्रॉइड किंवा आयफोनवर कसे इन्स्टॉल करावे?",
    answerEn: "MindMaster is a modern Progressive Web App (PWA). On Android, open Google Chrome, tap the 3 dots menu at the top right, and click 'Install App' or 'Add to Home Screen'. On iPhone, open Safari, tap the Share icon (square with arrow), and select 'Add to Home Screen'. It creates a native fullscreen app icon on your phone without wasting store memory (< 2 MB total).",
    answerMr: "माइंडमास्टर हे प्रोग्रेसिव्ह वेब ॲप (PWA) आहे. अँड्रॉइडवर क्रोम उघडून ३ डॉट्सवर टॅप करा आणि 'Install App' निवडा. आयफोनवर सफारीमध्ये शेअर आयकॉन दाबून 'Add to Home Screen' निवडा. हे ॲप तुमच्या फोनवर अतिशय कमी जागेत (२ MB पेक्षा कमी) सुरू होते.",
  },
  {
    id: "faq-7",
    category: "payment",
    categoryLabelEn: "Payments & Refunds",
    categoryLabelMr: "पेमेंट व परतावा",
    questionEn: "How do I apply a Coupon Code during course checkout?",
    questionMr: "कोर्स खरेदी करताना कूपन कोड कसा वापरावा?",
    answerEn: "On the course checkout screen, look for the 'Coupon Code / कूपन कोड' input box right above the payment total. Type your authorized code (e.g. FESTIVE500 or SCHOOLPRO) and click 'Apply'. The discount will immediately deduct from your total payable amount before proceeding to Razorpay.",
    answerMr: "चेकआऊट पेजवर पेमेंट रकमेच्या वर 'Coupon Code / कूपन कोड' चा रकाना असतो. तिथे तुमचा कूपन कोड टाका आणि 'Apply' बटनावर क्लिक करा. फी तत्काळ कमी होऊन उर्वरित रक्कम रेझरपे द्वारे भरता येईल.",
    actionHref: "/courses",
    actionTextEn: "Explore Courses",
    actionTextMr: "कोर्सेस पहा",
  },
  {
    id: "faq-8",
    category: "courses",
    categoryLabelEn: "Courses & Videos",
    categoryLabelMr: "कोर्सेस व व्हिडिओ",
    questionEn: "Can I access MindMaster Academy on my desktop PC or laptop?",
    questionMr: "मी कॉम्प्युटर किंवा लॅपटॉपवर माइंडमास्टर अकॅडमी वापरू शकतो का?",
    answerEn: "Yes! MindMaster Academy is fully responsive across desktop computers, MacBooks, Windows laptops, and tablets. However, the single-device session rule still applies: you can only be actively logged in on either your phone OR your laptop at any single given time.",
    answerMr: "होय! माइंडमास्टर ॲप लॅपटॉप, कॉम्प्युटर आणि टॅबलेटवर उत्तम चालते. फक्त 'सिंगल-डिव्हाइस' नियमानुसार एका वेळी एकतर मोबाईलवर किंवा लॅपटॉपवरच अभ्यास करता येईल.",
  },
  {
    id: "faq-9",
    category: "courses",
    categoryLabelEn: "Courses & Videos",
    categoryLabelMr: "कोर्सेस व व्हिडिओ",
    questionEn: "Is there any negative marking in speed calculation practice drills?",
    questionMr: "सराव चाचण्यांमध्ये चुकीच्या उत्तरांसाठी निगेटिव्ह मार्किंग असते का?",
    answerEn: "No. Our speed calculation tests and Vedic Mathematics drills are designed to build confidence, mental agility, and instant calculation speed. You can re-attempt practice quizzes as many times as you like to master 500-year calendar calculations and rapid multiplication tricks.",
    answerMr: "नाही! वैदिक गणिताच्या सराव चाचण्यांमध्ये कोणतेही निगेटिव्ह मार्किंग नसते. विद्यार्थ्यांचा गणितातील आत्मविश्वास आणि गती वाढवण्यासाठी तुम्ही या चाचण्या कितीही वेळा पुन्हा सोडू शकता.",
  },
  {
    id: "faq-10",
    category: "general",
    categoryLabelEn: "General & Troubleshooting",
    categoryLabelMr: "सामान्य व समस्या निवारण",
    questionEn: "How do I clear the app cache if a video is buffering or notes won't open?",
    questionMr: "व्हिडिओ अडकत असल्यास किंवा नोट्स न उघडल्यास ॲप कॅश कसा क्लिअर करावा?",
    answerEn: "Open Student Settings (Profile) > navigate to the Storage / Cache section > click 'Clear App Cache & Sync Offline Data'. This purges stale Service Worker browser caches and re-downloads the freshest course modules from our cloud server.",
    answerMr: "विद्यार्थी प्रोफाईल सेटिंग्जमध्ये जा > स्टोरेज विभागात जाऊन 'Clear App Cache & Sync' वर क्लिक करा. यामुळे जुना कॅश साफ होऊन सर्व व्हिडिओ व नोट्स नव्याने लोड होतात.",
    actionHref: "/profile",
    actionTextEn: "Go to Settings Storage",
    actionTextMr: "सेटिंग्ज स्टोरेजवर जा",
  },
  {
    id: "faq-11",
    category: "general",
    categoryLabelEn: "Direct Helpdesk",
    categoryLabelMr: "थेट मदत कक्ष",
    questionEn: "How can I speak directly with Prashant Dhumal Sir or the Satara Helpdesk?",
    questionMr: "प्रशांत धुमाळ सर किंवा सातारा हेल्पडेस्कशी थेट संपर्क कसा साधावा?",
    answerEn: "You can reach our official Satara Academy headquarters by calling our student helpline at +91 84593 44077, sending a WhatsApp message to +91 84593 44077, or visiting our flagship study center near Powai Naka, Satara, Maharashtra (415001).",
    answerMr: "तुम्ही आमच्या सातारा मुख्यालयाशी +91 84593 44077 या हेल्पलाईन क्रमांकावर थेट फोन करू शकता किंवा व्हॉट्सॲप मेसेज पाठवू शकता. तसेच पोवई नाका, सातारा येथील आमच्या मुख्य केंद्रास भेट देऊ शकता.",
    actionHref: "tel:+918459344077",
    actionTextEn: "Call Helpline: +91 84593 44077",
    actionTextMr: "फोन करा: +91 84593 44077",
  },
  {
    id: "faq-12",
    category: "courses",
    categoryLabelEn: "Courses & Validity",
    categoryLabelMr: "कोर्स व मुदत",
    questionEn: "What happens after my course validity period expires?",
    questionMr: "माझ्या कोर्सची मुदत संपल्यावर काय होते?",
    answerEn: "Once your chosen validity period (1, 3, 6, or 12 months) ends, course video playback will lock automatically. However, your claimed Certificates of Completion and fee pavatis remain permanently saved in your profile. You can renew your course anytime at a 50% continuation discount using promo code RENEW50.",
    answerMr: "कोर्सची मुदत संपल्यानंतर व्हिडिओ लेक्चर्स लॉक होतात. परंतु तुमचे मिळवलेले प्रमाणपत्र आणि फी पावती प्रोफाईलमध्ये कायमस्वरूपी सुरक्षित राहतात. तुम्ही 'RENEW50' कूपन वापरून ५०% सवलतीत पुन्हा मुदत वाढवू शकता.",
    actionHref: "/courses",
    actionTextEn: "Renew Course",
    actionTextMr: "कोर्स नूतनीकरण करा",
  },
];

export default function HelpPage() {
  const { currentLanguage, setLanguage } = useLanguage();
  const isMarathi = currentLanguage === "mr";

  const [activeTab, setActiveTab] = useState<"steps" | "faq" | "troubleshoot">("steps");
  const [faqSearch, setFaqSearch] = useState("");
  const [selectedFaqCategory, setSelectedFaqCategory] = useState<string>("all");
  const [openFaqId, setOpenFaqId] = useState<string | null>("faq-1");

  // Filter FAQs based on search and category
  const filteredFaqs = useMemo(() => {
    return FAQ_ITEMS.filter((faq) => {
      const matchesCategory =
        selectedFaqCategory === "all" || faq.category === selectedFaqCategory;

      const query = faqSearch.toLowerCase().trim();
      if (!query) return matchesCategory;

      const matchesQuery =
        faq.questionEn.toLowerCase().includes(query) ||
        faq.questionMr.toLowerCase().includes(query) ||
        faq.answerEn.toLowerCase().includes(query) ||
        faq.answerMr.toLowerCase().includes(query);

      return matchesCategory && matchesQuery;
    });
  }, [faqSearch, selectedFaqCategory]);

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto py-4 sm:py-6 px-3 sm:px-6 pb-24 text-slate-800 select-none">
        
        {/* Breadcrumb Navigation */}
        <div className="mb-4 flex items-center justify-between flex-wrap gap-2 text-xs">
          <Link
            href="/home"
            className="inline-flex items-center gap-1.5 font-bold text-blue-600 hover:text-blue-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isMarathi ? "माइंडमास्टर ॲपवर परत जा" : "Back to MindMaster App"}</span>
          </Link>
          <div className="flex items-center gap-2 text-slate-500 font-semibold">
            <span>MindMaster</span>
            <span>/</span>
            <span className="text-slate-800 font-bold">
              {isMarathi ? "मदत केंद्र व मार्गदर्शिका" : "Help Center & Guide"}
            </span>
          </div>
        </div>

        {/* Hero Header Card */}
        <header className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-sm mb-6 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
            <div className="flex-1 space-y-3">
              {/* Badge */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-blue-800 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    {isMarathi
                      ? "अधिकृत विद्यार्थी मदत केंद्र • २०२६"
                      : "Official Student Knowledge Base • 2026"}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>
                    {isMarathi ? "सत्यापित शैक्षणिक मार्गदर्शक" : "Verified Video Guide"}
                  </span>
                </span>
              </div>

              {/* Title & Subtitle */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                {isMarathi
                  ? "माइंडमास्टर ॲप कसे वापरावे? (मार्गदर्शिका)"
                  : "How to Use MindMaster App (Interactive Guide)"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-2xl leading-relaxed">
                {isMarathi
                  ? "लॉगिन, सिंगल-डिव्हाइस नियम, व्हिडिओ प्लेअर, ऑफलाइन नोट्स आणि प्रमाणपत्र मिळवण्याची संपूर्ण सविस्तर माहिती."
                  : "Comprehensive visual step-by-step guides, single-device DRM rules, video playback tips, offline PWA study mode, and verified certificate claiming."}
              </p>
            </div>

            {/* Language Switcher with Always-Visible English Reset */}
            <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
              <div className="text-[11px] font-extrabold text-slate-600 flex items-center gap-1.5">
                <Languages className="w-4 h-4 text-blue-600" />
                <span>
                  Language / भाषा:{" "}
                  <strong className="text-blue-600">
                    {isMarathi ? "मराठी (Marathi)" : "English (Primary)"}
                  </strong>
                </span>
              </div>

              {/* Language Switcher Buttons */}
              <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                    !isMarathi
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>English (Primary)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLanguage("mr")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                    isMarathi
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  }`}
                >
                  <span>मराठी</span>
                </button>
              </div>

              {/* Always keep "Switch to English" visible when Marathi is active */}
              {isMarathi && (
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className="text-[11px] font-extrabold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1 rounded-xl transition flex items-center gap-1.5 cursor-pointer mt-0.5 animate-pulse"
                >
                  <span>← Switch to English</span>
                </button>
              )}
            </div>
          </div>

          {/* Interactive Top Tab Bar */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setActiveTab("steps")}
              className={`flex items-center gap-2 py-2.5 px-4 rounded-2xl text-xs font-extrabold transition cursor-pointer shrink-0 ${
                activeTab === "steps"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-700 border border-slate-200/80"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>{isMarathi ? "सविस्तर ६ पायऱ्या (Step-by-Step)" : "Visual 6-Step Guide"}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("faq")}
              className={`flex items-center gap-2 py-2.5 px-4 rounded-2xl text-xs font-extrabold transition cursor-pointer shrink-0 ${
                activeTab === "faq"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-700 border border-slate-200/80"
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>{isMarathi ? "वारंवार विचारले जाणारे प्रश्न (FAQ)" : "Student FAQs (12+)"}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("troubleshoot")}
              className={`flex items-center gap-2 py-2.5 px-4 rounded-2xl text-xs font-extrabold transition cursor-pointer shrink-0 ${
                activeTab === "troubleshoot"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-700 border border-slate-200/80"
              }`}
            >
              <LifeBuoy className="w-4 h-4" />
              <span>{isMarathi ? "समस्या निवारण व सपोर्ट तिकीट" : "Troubleshooting & Support Desk"}</span>
            </button>
          </div>
        </header>

        {/* =========================================================================
            TAB 1: 6-STEP VISUAL HOW-TO GUIDE
           ========================================================================= */}
        {activeTab === "steps" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>
                  {isMarathi
                    ? "ॲप वापरण्याच्या ६ मुख्य पायऱ्या"
                    : "Complete 6-Step Visual Walkthrough"}
                </span>
              </h2>
              <span className="text-[11px] font-bold text-slate-400">
                {isMarathi ? "६ पायऱ्यांचे मार्गदर्शन" : "Steps 01 to 06"}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {STEP_GUIDES.map((step) => {
                return (
                  <div
                    key={step.id}
                    id={step.id}
                    className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row gap-6 items-stretch"
                  >
                    {/* Left/Top: High-Quality Vector WebP Preview Illustration */}
                    <div className="lg:w-1/2 relative min-h-[220px] sm:min-h-[280px] lg:min-h-[340px] rounded-2xl overflow-hidden border border-slate-200 shadow-2xs bg-slate-950 shrink-0">
                      <Image
                        src={step.imageSrc}
                        alt={step.imageAlt}
                        fill
                        sizes="(max-width: 1024px) 100vw, 550px"
                        className="object-cover object-center"
                      />
                    </div>

                    {/* Right/Bottom: Step Details & Direct Action Button */}
                    <div className="lg:w-1/2 flex flex-col justify-between gap-4">
                      <div className="space-y-3">
                        {/* Step Header Badge */}
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                            {isMarathi ? step.badgeMr : step.badgeEn}
                          </span>
                          <span className="text-2xl font-black text-slate-300 font-mono">
                            {step.stepNum}
                          </span>
                        </div>

                        {/* Step Title & Description */}
                        <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                          {isMarathi ? step.titleMr : step.titleEn}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                          {isMarathi ? step.descMr : step.descEn}
                        </p>

                        {/* Bullet Points */}
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          {(isMarathi ? step.pointsMr : step.pointsEn).map((point, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{point}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Step Action Button */}
                      <div className="pt-3 border-t border-slate-100">
                        <Link
                          href={step.actionHref}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-extrabold text-xs transition shadow-sm shadow-blue-500/25 cursor-pointer"
                        >
                          <span>{isMarathi ? step.actionLabelMr : step.actionLabelEn}</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: INTERACTIVE FAQ ACCORDION (12+ Real Student Queries)
           ========================================================================= */}
        {activeTab === "faq" && (
          <div className="space-y-6">
            {/* Search Input & Category Filter Bar */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  placeholder={
                    isMarathi
                      ? "काहीही शोधा... (उदा. लॉगिन, पैसे कापले, डिव्हाइस, प्रमाणपत्र, भाषा)"
                      : "Search FAQs... (e.g. device lock, payment deducted, offline, certificate, language)"
                  }
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15 transition shadow-2xs"
                />
                {faqSearch && (
                  <button
                    type="button"
                    onClick={() => setFaqSearch("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
                {[
                  { id: "all", en: "All Questions", mr: "सर्व प्रश्न" },
                  { id: "device", en: "Device & Login", mr: "डिव्हाइस व लॉगिन" },
                  { id: "payment", en: "Payments & Refunds", mr: "पेमेंट व परतावा" },
                  { id: "courses", en: "Courses & Videos", mr: "कोर्सेस व व्हिडिओ" },
                  { id: "certificate", en: "Certificates", mr: "प्रमाणपत्र" },
                  { id: "general", en: "General Help", mr: "सामान्य मदत" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedFaqCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full whitespace-nowrap transition cursor-pointer ${
                      selectedFaqCategory === cat.id
                        ? "bg-blue-600 text-white font-black shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                    }`}
                  >
                    {isMarathi ? cat.mr : cat.en}
                  </button>
                ))}
              </div>
            </div>

            {/* FAQ List */}
            <div className="space-y-3">
              {filteredFaqs.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3">
                  <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
                  <h3 className="font-extrabold text-sm text-slate-800">
                    {isMarathi ? "कोणतेही प्रश्न सापडले नाहीत" : "No Matching Questions Found"}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {isMarathi
                      ? "वेगळा शब्द टाईप करून पहा किंवा आमच्या सातारा हेल्पडेस्कवर थेट संपर्क साधा."
                      : "Try different search keywords or reach out directly to our student helpdesk."}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setFaqSearch("");
                      setSelectedFaqCategory("all");
                    }}
                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-extrabold hover:bg-blue-100 transition"
                  >
                    {isMarathi ? "सर्व प्रश्न दाखवा" : "Reset Filters"}
                  </button>
                </div>
              ) : (
                filteredFaqs.map((faq) => {
                  const isOpen = openFaqId === faq.id;

                  return (
                    <div
                      key={faq.id}
                      className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                        className="w-full p-4 sm:p-5 text-left flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50/60 transition"
                      >
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block">
                            {isMarathi ? faq.categoryLabelMr : faq.categoryLabelEn}
                          </span>
                          <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug">
                            {isMarathi ? faq.questionMr : faq.questionEn}
                          </h3>
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 mt-1 ${
                            isOpen ? "rotate-180 text-blue-600" : ""
                          }`}
                        />
                      </button>

                      {isOpen && (
                        <div className="px-4 sm:px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 space-y-3">
                          <p>{isMarathi ? faq.answerMr : faq.answerEn}</p>
                          {faq.actionHref && (
                            <div>
                              <Link
                                href={faq.actionHref}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition"
                              >
                                <span>{isMarathi ? faq.actionTextMr : faq.actionTextEn}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: QUICK TROUBLESHOOTING & DIRECT TICKET CTA
           ========================================================================= */}
        {activeTab === "troubleshoot" && (
          <div className="space-y-6">
            {/* Diagnostic Checklist Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider block mb-1">
                  {isMarathi ? "स्वयं-तपासणी सूची" : "Self-Diagnostic Checklist"}
                </span>
                <h2 className="text-xl font-black text-slate-900">
                  {isMarathi ? "त्वरित समस्या निवारण मार्गदर्शक" : "Quick Troubleshooting Steps"}
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  {isMarathi
                    ? "कोणतीही तांत्रिक अडचण आल्यास खालील ४ सोप्या गोष्टी तपासा:"
                    : "Try these 4 quick solutions to resolve common app glitches in seconds:"}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center shrink-0">
                      1
                    </div>
                    <h3 className="font-extrabold text-xs text-slate-900">
                      {isMarathi ? "ॲप कॅश क्लिअर करा" : "Clear Browser & App Cache"}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {isMarathi
                      ? "विद्यार्थी प्रोफाईल सेटिंग्जमधील 'Clear App Cache' वर क्लिक करा जेणेकरून जुना डेटा निघून जाईल."
                      : "Go to Profile Settings > Storage and tap 'Clear App Cache' to remove outdated cached notes."}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center shrink-0">
                      2
                    </div>
                    <h3 className="font-extrabold text-xs text-slate-900">
                      {isMarathi ? "सिंगल-डिव्हाइस रीसेट करा" : "Request Device Reset"}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {isMarathi
                      ? "मोबाईल बदलला असल्यास प्रोफाईल सेटिंग्जमधील 'Request Device Reset' वरून तिकीट पाठवा."
                      : "If you upgraded your handset, raise a 'Request Device Reset' ticket to unlink the previous session."}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 font-black text-xs flex items-center justify-center shrink-0">
                      3
                    </div>
                    <h3 className="font-extrabold text-xs text-slate-900">
                      {isMarathi ? "व्हिडिओ आवाज अनम्युट करा" : "Unmute Video Player Audio"}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {isMarathi
                      ? "काही मोबाईलमध्ये व्हिडिओ आपोआप म्यूट सुरू होतो; प्लेअरवरील स्पीकर आयकॉनवर टॅप करा."
                      : "Mobile browsers may start videos on mute; tap the volume speaker icon in the player controls."}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center shrink-0">
                      4
                    </div>
                    <h3 className="font-extrabold text-xs text-slate-900">
                      {isMarathi ? "पेमेंट पावती तपासा" : "Check Order ID in Pavati"}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {isMarathi
                      ? "पैसे कापल्यास बँकेचा UTR क्रमांक किंवा रेझरपे आयडी लिहून ठेवा जेणेकरून खात्री करता येईल."
                      : "Note your bank UTR number or Razorpay order reference to expedite staff verification."}
                  </p>
                </div>
              </div>
            </div>

            {/* Direct In-App Ticket Desk CTA Banner */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 text-white px-3 py-1 rounded-full inline-block">
                  {isMarathi ? "थेट विद्यार्थी मदत कक्ष" : "Direct Student Resolution"}
                </span>
                <h3 className="text-xl sm:text-2xl font-black leading-tight">
                  {isMarathi
                    ? "अजूनही अडचण सुटली नाही का? थेट तिकीट तयार करा."
                    : "Still facing an issue? Raise an In-App Support Ticket."}
                </h3>
                <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                  {isMarathi
                    ? "आमचे सातारा मुख्यालय कार्यालयीन कामकाजाच्या २४ तासांत तुमच्या समस्येचे निराकरण करेल."
                    : "Our Satara academic team and technical executives review your ticket and resolve it within 24 business hours."}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
                <Link
                  href="/support"
                  className="px-5 py-3 rounded-2xl bg-white text-blue-700 font-black text-xs hover:bg-blue-50 transition shadow-sm text-center flex items-center justify-center gap-2"
                >
                  <LifeBuoy className="w-4 h-4 text-blue-600" />
                  <span>{isMarathi ? "सपोर्ट तिकीट नोंदवा" : "Raise Support Ticket"}</span>
                </Link>

                <a
                  href="https://wa.me/918459344077?text=Namaskar%20Prashant%20Sir%2C%20I%20need%20help%20with%20MindMaster%20Academy%20app."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs transition shadow-sm text-center flex items-center justify-center gap-2"
                >
                  <span>WhatsApp: +91 84593 44077</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Official Academy Contact Footer Card */}
        <div className="mt-8 p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-xs">
                MindMaster Academy • Satara Flagship Center
              </h4>
              <p className="text-[11px] text-slate-500">
                Near Powai Naka, Satara (415001) | Pune Campus: Zeal Chowk, Narhe, Pune
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/privacy-policy"
              className="text-xs font-bold text-slate-600 hover:text-blue-600 transition"
            >
              Privacy Policy
            </Link>
            <span>•</span>
            <Link
              href="/terms"
              className="text-xs font-bold text-slate-600 hover:text-blue-600 transition"
            >
              Terms (DRM)
            </Link>
            <span>•</span>
            <Link
              href="/refund-policy"
              className="text-xs font-bold text-slate-600 hover:text-blue-600 transition"
            >
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
