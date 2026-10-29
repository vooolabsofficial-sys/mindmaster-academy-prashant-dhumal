"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  LifeBuoy,
  PhoneCall,
  Gift,
  Activity,
  ListPlus,
  FileText,
  Tag,
  Users,
  BarChart3,
  ExternalLink,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Languages,
  Clock,
  Building2,
  Lock,
  Search,
  BookOpen
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { getCurrentStaff } from "@/lib/staffStore";
import { StaffUser } from "@/lib/types";

interface SopItem {
  id: string;
  role: "sub_admin" | "main_admin" | "all";
  sopNumber: string;
  titleEn: string;
  titleMr: string;
  badgeEn: string;
  badgeMr: string;
  descEn: string;
  descMr: string;
  stepsEn: string[];
  stepsMr: string[];
  rulesEn: string[];
  rulesMr: string[];
  actionHref: string;
  actionTextEn: string;
  actionTextMr: string;
  color: "blue" | "emerald" | "amber" | "purple";
}

const SOP_REGISTRY: SopItem[] = [
  {
    id: "sop-1",
    role: "all",
    sopNumber: "SOP-01",
    titleEn: "Student Support Ticket Resolution & One-Click Calling",
    titleMr: "विद्यार्थी सपोर्ट तिकीट हाताळणी आणि वन-क्लिक कॉलिंग",
    badgeEn: "Customer Care • Daily Task",
    badgeMr: "ग्राहक सेवा • दैनंदिन काम",
    descEn: "Review incoming student queries, call the student directly from the portal, record notes, and mark tickets resolved.",
    descMr: "विद्यार्थ्यांच्या अडचणी पहा, पोर्टलवरून थेट फोन करा, उत्तरे नोंदवा आणि तिकीट सोडवले म्हणून मार्क करा.",
    stepsEn: [
      "Navigate to Messages (admin/messages or sub/messages) to view the live ticket queue.",
      "Inspect the student's category: 'Payment / Course Access', 'Request Device Reset', or 'Technical Query'.",
      "Click the green '📞 Call Student' button to initiate a verified phone call to the student's registered mobile number.",
      "Type a concise administrative reply explaining the resolution or advice, then click 'Submit Reply & Resolve'.",
    ],
    stepsMr: [
      "मेसेजेस विभागात (admin/messages किंवा sub/messages) जाऊन प्रलंबित तिकिटे पहा.",
      "तिकीट कॅटेगरी तपासा: 'Payment / Course Access', 'Request Device Reset' किंवा 'Technical Query'.",
      "हिरव्या रंगाच्या '📞 Call Student' बटनावर क्लिक करून थेट विद्यार्थ्याला फोन करा.",
      "समस्या सुटल्यानंतर उत्तराच्या रकान्यात माहिती लिहा आणि 'Submit Reply & Resolve' वर क्लिक करा.",
    ],
    rulesEn: [
      "Always maintain polite, professional academic decorum representing Prashant Dhumal Sir's Academy.",
      "Never share staff personal mobile numbers; all formal interactions must refer to the Satara Helpdesk (+91 84593 44077).",
    ],
    rulesMr: [
      "प्रशांत धुमाळ सरांच्या संस्थेचे प्रतिनिधित्व करताना नेहमी आदरयुक्त आणि सुसंस्कृत भाषेचा वापर करा.",
      "कर्मचाऱ्यांनी स्वतःचा खाजगी नंबर देऊ नये; सर्व अधिकृत संवादासाठी सातारा हेल्पलाइनचा उल्लेख करावा.",
    ],
    actionHref: "/admin/messages",
    actionTextEn: "Open Ticket Desk",
    actionTextMr: "तिकीट डेस्क उघडा",
    color: "blue",
  },
  {
    id: "sop-2",
    role: "all",
    sopNumber: "SOP-02",
    titleEn: "Authorizing & Processing Student Device Reset Requests",
    titleMr: "विद्यार्थी डिव्हाइस रीसेट विनंतीची पडताळणी व मंजुरी",
    badgeEn: "DRM Security • Critical Protocol",
    badgeMr: "DRM सुरक्षा • महत्त्वाची कार्यपद्धती",
    descEn: "Verify that a student has genuinely purchased a new handset before clearing their active single-device DRM session lock.",
    descMr: "विद्यार्थ्याने खरंच नवीन फोन घेतला आहे याची फोनवर खात्री करूनच जुने सेशन लॉक हटवा.",
    stepsEn: [
      "Filter tickets by category 'Request Device Reset' in the messages queue.",
      "Click 'Call Student' and ask for their registered Full Name, District, and previous handset model.",
      "Verify that the request is genuine and not an attempt to share login credentials with friends or Telegram groups.",
      "Click 'Approve Device Reset'. The portal clears the student's active_device_id token in Supabase.",
      "Advise the student to log in on their new handset immediately via OTP.",
    ],
    stepsMr: [
      "मेसेजेसमध्ये 'Request Device Reset' या कॅटेगरीची तिकिटे निवडा.",
      "विद्यार्थ्याला फोन करून त्याचे पूर्ण नाव, जिल्हा आणि आधीच्या मोबाईलचे मॉडेल विचारा.",
      "ही विनंती खरी आहे आणि मित्रांना पासवर्ड देण्यासाठी नाही याची खात्री करा.",
      "'Approve Device Reset' बटनावर क्लिक करा. डेटाबेसमधून जुना डिव्हाइस टोकन साफ केला जाईल.",
      "विद्यार्थ्याला नवीन फोनवर जाऊन ओटीपी द्वारे पुन्हा लॉगिन करण्यास सांगा.",
    ],
    rulesEn: [
      "Do NOT approve more than 2 device resets per student per month without Super-Admin written sign-off.",
      "Every device reset action is permanently logged with your staff ID in the audit trail (admin/my-activity).",
    ],
    rulesMr: [
      "एका विद्यार्थ्याला एका महिन्यात २ पेक्षा जास्त वेळा डिव्हाइस रीसेट देऊ नका; शंका असल्यास मुख्य ॲडमिनशी बोला.",
      "प्रत्येक रीसेट कारवाई तुमच्या कर्मचारी आयडीसह ऑडिट लॉगमध्ये कायमस्वरूपी नोंदवली जाते.",
    ],
    actionHref: "/admin/messages",
    actionTextEn: "Review Reset Requests",
    actionTextMr: "रीसेट विनंत्या तपासा",
    color: "amber",
  },
  {
    id: "sop-3",
    role: "all",
    sopNumber: "SOP-03",
    titleEn: "Issuing Manual Course Grants for Offline Cash Admissions",
    titleMr: "ऑफलाइन रोख प्रवेशांसाठी मॅन्युअल कोर्स ॲक्सेस देणे",
    badgeEn: "Admissions • Financial Audit",
    badgeMr: "प्रवेश • आर्थिक ऑडिट",
    descEn: "Grant instant course access to offline students who paid cash at Satara or Pune study centers after verifying fee receipts.",
    descMr: "सातारा किंवा पुणे केंद्रावर रोख फी भरणाऱ्या विद्यार्थ्यांना पावती तपासून मोफत कोर्स ॲक्सेस द्या.",
    stepsEn: [
      "Navigate to Course Grants (admin/grants).",
      "Enter the student's registered 10-digit mobile number (+91 format).",
      "Select the authorized course (e.g., Vedic Maths Mastery 2026) and access duration (e.g., 12 Months).",
      "Mandatory: Enter the physical Center Fee Pavati (Receipt) Number (e.g., REC-SATARA-2026-904).",
      "Click 'Grant Instant Access'. The system generates a ₹0 system purchase linked to the student's profile.",
    ],
    stepsMr: [
      "कोर्स ग्रँट्स विभागात जा (admin/grants).",
      "विद्यार्थ्याचा १० अंकी नोंदणीकृत मोबाईल क्रमांक प्रविष्ट करा.",
      "मंजूर केलेला कोर्स (उदा. वैदिक गणित २०२६) आणि मुदत निवडा.",
      "अनिवार्य: सातारा/पुणे केंद्राची प्रत्यक्ष फी पावती क्रमांक (उदा. REC-SATARA-2026-904) टाका.",
      "'Grant Instant Access' वर क्लिक करा. सिस्टीम तात्काळ ₹० पावतीसह कोर्स सुरू करेल.",
    ],
    rulesEn: [
      "Never issue a course grant without a signed physical fee receipt from an authorized academy counselor.",
      "Sub-Admins have a daily quota limit. Grants issued are cross-checked weekly with academy bank deposits.",
    ],
    rulesMr: [
      "अधिकृत कागदी फी पावतीशिवाय कोणत्याही विद्यार्थ्यास मोफत कोर्स ॲक्सेस देऊ नका.",
      "सब-ॲडमिनला दैनंदिन कोटा मर्यादा असते. सर्व नोंदी दर आठवड्याला बँकेच्या जमा रकमेसोबत तपासल्या जातात.",
    ],
    actionHref: "/admin/grants",
    actionTextEn: "Open Grants Manager",
    actionTextMr: "ग्रँट्स मॅनेजर उघडा",
    color: "emerald",
  },
  {
    id: "sop-4",
    role: "all",
    sopNumber: "SOP-04",
    titleEn: "Monitoring Staff Action Log & Operational Compliance",
    titleMr: "कर्मचारी कृती लॉग आणि नियमांचे पालन तपासणे",
    badgeEn: "Accountability • Audit Log",
    badgeMr: "पारदर्शकता • ऑडिट लॉग",
    descEn: "Review your personal action history, active session token, and daily quota consumption.",
    descMr: "तुमच्या खात्यावरून झालेल्या सर्व कृती, ॲक्टिव्ह सेशन आणि दैनिक कामाचा हिशोब तपासा.",
    stepsEn: [
      "Click 'My Activity' in the sidebar (admin/my-activity or sub/activity).",
      "Inspect the real-time timeline of ticket replies, device resets, and student profile views.",
      "Confirm that no unrecognized actions appear under your staff ID.",
      "At the end of your shift, click 'Log Out' to terminate your administrative browser session safely.",
    ],
    stepsMr: [
      "मेन्यूमधील 'My Activity' पर्यायावर क्लिक करा (admin/my-activity किंवा sub/activity).",
      "तिकीट उत्तरे, डिव्हाइस रीसेट आणि पाहिलेल्या प्रोफाईल्सचा टाइमलाइन रेकॉर्ड तपासा.",
      "तुमच्या नावावर कोणतीही संशयास्पद किंवा चुकीची नोंद नाही याची खात्री करा.",
      "काम संपल्यानंतर सुरक्षिततेसाठी नेहमी 'Log Out' बटनावर क्लिक करा.",
    ],
    rulesEn: [
      "Do NOT share staff login credentials with other interns or counselors.",
      "Lock your computer screen whenever leaving your desk at Satara or Narhe regional centers.",
    ],
    rulesMr: [
      "कर्मचारी पासवर्ड इतर कोणाशीही शेअर करू नका.",
      "सातारा किंवा नऱ्हे केंद्रावर काम करताना सीट सोडण्यापूर्वी कॉम्प्युटर स्क्रीन नेहमी लॉक करा.",
    ],
    actionHref: "/admin/my-activity",
    actionTextEn: "View My Activity",
    actionTextMr: "माझा कृती लॉग पहा",
    color: "purple",
  },
  {
    id: "sop-5",
    role: "main_admin",
    sopNumber: "SOP-05",
    titleEn: "Syncing YouTube Playlists & Bulk Parsing Lesson Links",
    titleMr: "युट्यूब प्लेलिस्ट सिंक करणे व व्हिडिओ लिंक्स जोडणे",
    badgeEn: "Content CMS • Super-Admin",
    badgeMr: "कंटेंट सीएमएस • मुख्य ॲडमिन",
    descEn: "Import curriculum video lectures from unlisted YouTube playlists or paste bulk links with automated lesson ordering.",
    descMr: "अनलिस्टेड युट्यूब प्लेलिस्टवरून नवीन लेक्चर्स जोडा किंवा बल्क लिंक्स पेस्ट करून धडे क्रमबद्ध करा.",
    stepsEn: [
      "Open Playlist Manager (admin/playlist).",
      "Paste the YouTube Playlist URL or click 'Bulk Paste Multiple Links'.",
      "The parser extracts YouTube Video IDs and automatically numbers lessons (Lesson 01, Lesson 02, etc.).",
      "Mark designated introductory lessons as 'Free Demo' so non-enrolled students can preview them.",
      "Click 'Save Curriculum to Database'. Videos instantly reflect in student course players.",
    ],
    stepsMr: [
      "प्लेलिस्ट मॅनेजर उघडा (admin/playlist).",
      "युट्यूब प्लेलिस्टची लिंक पेस्ट करा किंवा 'Bulk Paste Links' पर्याय वापरा.",
      "सिस्टीम आपोआप व्हिडिओ आयडी ओळखून लेक्चर्सना क्रम (धडा १, २...) देते.",
      "डेमोसाठी काही लेक्चर्स 'Free Demo' म्हणून मार्क करा जेणेकरून विद्यार्थी ते मोफत पाहू शकतील.",
      "'Save Curriculum' वर क्लिक करा. सर्व व्हिडिओ विद्यार्थ्यांच्या ॲपमध्ये तत्काळ सुरू होतील.",
    ],
    rulesEn: [
      "Always set lecture videos to 'Unlisted' on YouTube — never 'Public' (to prevent free unauthorized indexing).",
      "Ensure DRM watermarking toggle remains enabled for all proprietary calculation algorithms.",
    ],
    rulesMr: [
      "युट्यूबवर व्हिडिओ नेहमी 'Unlisted' ठेवावेत — कधीही 'Public' करू नका.",
      "सर्व वैदिक गणित ट्रिक्ससाठी डायनॅमिक वॉटरमार्क सुरू असल्याची खात्री करा.",
    ],
    actionHref: "/admin/playlist",
    actionTextEn: "Open Playlist Manager",
    actionTextMr: "प्लेलिस्ट मॅनेजर उघडा",
    color: "blue",
  },
  {
    id: "sop-6",
    role: "main_admin",
    sopNumber: "SOP-06",
    titleEn: "Uploading PDF Books & Handwritten Mnemonic Notes",
    titleMr: "पीडीएफ पुस्तके व हस्तलिखित नोट्स अपलोड करणे",
    badgeEn: "Library CMS • Super-Admin",
    badgeMr: "लायब्ररी सीएमएस • मुख्य ॲडमिन",
    descEn: "Upload high-quality study materials, digital books, and practice sheets to Supabase encrypted storage.",
    descMr: "अभ्यासक्रमाची पुस्तके, हस्तलिखित सूत्रे आणि सराव प्रश्नसंच सुरक्षित क्लाउड स्टोरेजवर अपलोड करा.",
    stepsEn: [
      "Navigate to Notes & Books Manager (admin/notes).",
      "Click 'Upload New PDF Book / Note'.",
      "Select your PDF file (max 25MB per file; compressed for high-speed mobile viewing).",
      "Enter Book Title, Subject (e.g., 500-Year Calendar Shortcuts), Author (Prashant Dhumal Sir), and Page Count.",
      "Select target course association and toggle 'Allow Offline PWA Vault'.",
      "Click 'Publish'. Notes become accessible in student video players and the digital library.",
    ],
    stepsMr: [
      "नोट्स व बुक्स मॅनेजरमध्ये जा (admin/notes).",
      "'Upload New PDF Book / Note' वर क्लिक करा.",
      "तुमची पीडीएफ फाईल निवडा (मोबाईलसाठी साईझ कॉम्प्रेस केलेली असावी).",
      "पुस्तकाचे नाव, विषय, लेखक (प्रशांत धुमाळ सर) आणि पानांची संख्या लिहा.",
      "संबंधित कोर्स निवडा आणि 'Allow Offline PWA Vault' पर्याय सुरू ठेवा.",
      "'Publish' वर क्लिक करा. पुस्तके विद्यार्थ्यांच्या डिजिटल लायब्ररीमध्ये उपलब्ध होतील.",
    ],
    rulesEn: [
      "PDFs must contain official MindMaster Academy watermark and copyright notices on each page.",
      "Do NOT upload copyrighted third-party reference books without written licensing permissions.",
    ],
    rulesMr: [
      "सर्व पीडीएफ पानांवर अकॅडमीचा अधिकृत वॉटरमार्क आणि संपर्क क्रमांक असावा.",
      "परवानगीशिवाय इतर कोणत्याही लेखकाची किंवा प्रकाशनाची पुस्तके अपलोड करू नका.",
    ],
    actionHref: "/admin/notes",
    actionTextEn: "Open Notes Manager",
    actionTextMr: "नोट्स मॅनेजर उघडा",
    color: "emerald",
  },
  {
    id: "sop-7",
    role: "main_admin",
    sopNumber: "SOP-07",
    titleEn: "Creating Promotional & School Institutional Coupons",
    titleMr: "सवलत कूपन कोड तयार करणे व व्यवस्थापन",
    badgeEn: "Marketing • Super-Admin",
    badgeMr: "मार्केटिंग • मुख्य ॲडमिन",
    descEn: "Issue coupon codes for festival discounts, school partnerships, and student renewal incentives.",
    descMr: "सणासुदीच्या सवलती, शाळांसाठी विशेष डिस्काउंट आणि जुन्या विद्यार्थ्यांसाठी कूपन कोड तयार करा.",
    stepsEn: [
      "Open Coupon Manager (admin/coupons).",
      "Click 'Create New Coupon'.",
      "Enter Coupon Code in ALL CAPS (e.g. FESTIVE500, SATARA50, RENEW50).",
      "Set Discount Type: Flat Rupees (₹500 off) OR Percentage (50% off).",
      "Define Expiry Date, Minimum Order Amount, and Maximum Usage Count (e.g., first 100 students).",
      "Click 'Save Coupon'. Codes validate instantaneously during checkout.",
    ],
    stepsMr: [
      "कूपन मॅनेजर उघडा (admin/coupons).",
      "'Create New Coupon' बटनावर क्लिक करा.",
      "कूपन कोड मोठ्या अक्षरात लिहा (उदा. FESTIVE500, SATARA50, RENEW50).",
      "सवलतीचा प्रकार निवडा: थेट रुपये सूट (उदा. ₹५००) किंवा टक्केवारी (उदा. ५०%).",
      "मुदत संपण्याची तारीख आणि जास्तीत जास्त विद्यार्थ्यांची संख्या (उदा. १०० विद्यार्थी) ठरवा.",
      "'Save Coupon' वर क्लिक करा. चेकआऊट पेजवर हा कोड तात्काळ लागू होईल.",
    ],
    rulesEn: [
      "Always set an explicit expiry date to prevent legacy coupon misuse.",
      "Check redemptions weekly in reports to ensure financial margin sustainability.",
    ],
    rulesMr: [
      "कूपनचा गैरवापर टाळण्यासाठी नेहमी योग्य मुदत (Expiry Date) निश्चित करा.",
      "आर्थिक ताळमेळ तपासण्यासाठी आठवड्यातून एकदा वापरलेल्या कूपन्सचा रिपोर्ट तपासा.",
    ],
    actionHref: "/admin/coupons",
    actionTextEn: "Open Coupon Manager",
    actionTextMr: "कूपन मॅनेजर उघडा",
    color: "amber",
  },
  {
    id: "sop-8",
    role: "main_admin",
    sopNumber: "SOP-08",
    titleEn: "Sub-Admin RBAC Provisioning & Permissions Governance",
    titleMr: "सब-ॲडमिन खाते निर्मिती आणि अधिकार नियंत्रण (RBAC)",
    badgeEn: "Access Control • Super-Admin",
    badgeMr: "अधिकार नियंत्रण • मुख्य ॲडमिन",
    descEn: "Provision sub-admin accounts for regional center counselors, configure permissions, and monitor action ceilings.",
    descMr: "विभागीय केंद्रांच्या कर्मचाऱ्यांसाठी खाती तयार करा, त्यांना योग्य अधिकार द्या आणि सुरक्षेवर लक्ष ठेवा.",
    stepsEn: [
      "Navigate to Sub-Admin Manager (admin/sub-admins).",
      "Click 'Add New Sub-Admin'.",
      "Enter Counselor Name, Mobile Phone, Regional Study Center (e.g., Satara / Narhe), and Temporary PIN.",
      "Configure Scoped Permissions: 'students.view' (read student profiles) and 'messages.manage' (reply to tickets).",
      "Set Daily Action Limit (e.g., max 25 grants/day) to prevent rogue bulk operations.",
      "If a counselor leaves the organization, click 'Suspend Staff' to kill all active sessions immediately.",
    ],
    stepsMr: [
      "सब-ॲडमिन मॅनेजरमध्ये जा (admin/sub-admins).",
      "'Add New Sub-Admin' वर क्लिक करा.",
      "कर्मचाऱ्याचे नाव, मोबाईल नंबर, केंद्र (सातारा / नऱ्हे) आणि तात्पुरता पिन टाका.",
      "अधिकार निवडा: 'students.view' (विद्यार्थी माहिती पाहणे) आणि 'messages.manage' (तिकीट उत्तरे देणे).",
      "गैरवापर रोखण्यासाठी दैनंदिन कृती मर्यादा (उदा. दिवसाला २५ ग्रँट्स) निश्चित करा.",
      "कर्मचाऱ्याने काम सोडल्यास 'Suspend Staff' वर क्लिक करून त्याचे खाते तत्काळ बंद करा.",
    ],
    rulesEn: [
      "Grant Delete or Report Export permissions ONLY to verified senior administrative directors.",
      "Review the Sub-Admin activity dashboard monthly for inactive accounts.",
    ],
    rulesMr: [
      "डेटा डिलीट करण्याचे किंवा आर्थिक रिपोर्ट डाऊनलोड करण्याचे अधिकार फक्त वरिष्ठ संचालकांनाच द्या.",
      "काही महिने न वापरलेली खाती वेळेवर बंद करा.",
    ],
    actionHref: "/admin/sub-admins",
    actionTextEn: "Open Sub-Admins",
    actionTextMr: "सब-ॲडमिन मॅनेजर उघडा",
    color: "purple",
  },
  {
    id: "sop-9",
    role: "main_admin",
    sopNumber: "SOP-09",
    titleEn: "Streaming & Exporting Financial, Student & Audit CSV Reports",
    titleMr: "आर्थिक, विद्यार्थी व ऑडिट CSV रिपोर्ट्स डाऊनलोड करणे",
    badgeEn: "Analytics • Super-Admin",
    badgeMr: "अनालिटिक्स • मुख्य ॲडमिन",
    descEn: "Export large datasets via Web ReadableStreams without hitting Vercel serverless memory or timeout constraints.",
    descMr: "हजारो विद्यार्थ्यांचा डेटा आणि फी पावत्या सर्व्हर हँग न होता थेट CSV फाईलमध्ये डाऊनलोड करा.",
    stepsEn: [
      "Navigate to Reports & Analytics (admin/reports).",
      "Choose Report Scope: 'Financial Transactions', 'Enrolled Students Roster', or 'Forensic Audit Logs'.",
      "Select Date Filter (e.g., Last 30 Days, Year-to-Date, or Custom Range).",
      "Click 'Stream Export to CSV'. The endpoint processes chunks on the fly using ReadableStream.",
      "Open the generated CSV in Microsoft Excel or Google Sheets for accounting and tax reconciliation.",
    ],
    stepsMr: [
      "रिपोर्ट्स व अनालिटिक्स विभागात जा (admin/reports).",
      "रिपोर्टचा प्रकार निवडा: 'Financial Transactions', 'Enrolled Students' किंवा 'Audit Logs'.",
      "तारखेचा कालावधी (उदा. मागील ३० दिवस किंवा संपूर्ण वर्ष) निवडा.",
      "'Stream Export to CSV' वर क्लिक करा. सिस्टीम तत्काळ डेटा डाऊनलोड सुरू करेल.",
      "डाऊनलोड झालेली फाईल एक्सेल (Excel) मध्ये उघडून जीएसटी व हिशोबासाठी वापरा.",
    ],
    rulesEn: [
      "Financial CSV reports contain student phone numbers and Razorpay payment IDs; store exports securely.",
      "All CSV export actions are logged permanently with operator IP address in the forensic audit trail.",
    ],
    rulesMr: [
      "आर्थिक रिपोर्ट्समध्ये विद्यार्थ्यांचे फोन नंबर आणि पेमेंट आयडी असतात; या फाईल्स सुरक्षित ठेवा.",
      "प्रत्येक रिपोर्ट डाऊनलोडची नोंद ॲडमिनच्या IP ॲड्रेससह ऑडिट लॉगमध्ये ठेवली जाते.",
    ],
    actionHref: "/admin/reports",
    actionTextEn: "Open Reports Hub",
    actionTextMr: "रिपोर्ट्स हब उघडा",
    color: "blue",
  },
];

export default function AdminGuidePage() {
  const [staff, setStaff] = useState<StaffUser>(getCurrentStaff());
  const [isMarathi, setIsMarathi] = useState(false);
  const [roleFilter, setRoleFilter] = useState<"all" | "sub_admin" | "main_admin">("all");
  const [sopSearch, setSopSearch] = useState("");

  useEffect(() => {
    setStaff(getCurrentStaff());
  }, []);

  const isMainAdmin = staff.role === "main_admin";

  // Filter SOPs
  const filteredSops = SOP_REGISTRY.filter((sop) => {
    // Role filter
    if (roleFilter === "sub_admin" && sop.role === "main_admin") return false;
    if (roleFilter === "main_admin" && sop.role === "sub_admin") return false;

    // Search query
    const q = sopSearch.toLowerCase().trim();
    if (!q) return true;

    return (
      sop.titleEn.toLowerCase().includes(q) ||
      sop.titleMr.toLowerCase().includes(q) ||
      sop.descEn.toLowerCase().includes(q) ||
      sop.descMr.toLowerCase().includes(q) ||
      sop.sopNumber.toLowerCase().includes(q)
    );
  });

  return (
    <AdminShell>
      <div className="space-y-6 pb-20 select-none text-slate-800 font-sans">
        
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
              <Link href="/admin" className="hover:text-blue-600 transition">
                Admin Console
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-extrabold">
                {isMarathi ? "मदत व कार्यपद्धती मार्गदर्शिका (SOP)" : "Help & Operational SOP Guide"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <span>
                {isMarathi
                  ? "कर्मचारी व सब-ॲडमिन कार्यपद्धती (SOP Manual)"
                  : "Staff & Sub-Admin Operational SOP Manual"}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {isMarathi
                ? "माइंडमास्टर अकॅडमीच्या दैनंदिन कामकाजासाठी अधिकृत मार्गदर्शक तत्त्वे व नियमावली."
                : "Official Standard Operating Procedures (SOP) for customer care, device resets, course grants & system administration."}
            </p>
          </div>

          {/* Bilingual Language Switcher */}
          <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
            <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
              <Languages className="w-4 h-4 text-blue-600" />
              <span>
                Language / भाषा:{" "}
                <strong className="text-blue-600">
                  {isMarathi ? "मराठी (Marathi)" : "English (Primary)"}
                </strong>
              </span>
            </div>

            <div className="flex items-center bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setIsMarathi(false)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  !isMarathi
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>English (Primary)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMarathi(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  isMarathi
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span>मराठी</span>
              </button>
            </div>

            {/* Always-visible reset button when Marathi is active */}
            {isMarathi && (
              <button
                type="button"
                onClick={() => setIsMarathi(false)}
                className="text-[11px] font-extrabold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1 rounded-xl transition cursor-pointer mt-0.5 animate-pulse"
              >
                <span>← Switch to English</span>
              </button>
            )}
          </div>
        </div>

        {/* Hero Visual SOP Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm overflow-hidden flex flex-col lg:flex-row items-center gap-8">
          <div className="lg:w-7/12 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full shadow-2xs">
                ● Active Protocol • 2026 Edition
              </span>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                Role: <strong className="text-slate-800 uppercase">{staff.role}</strong>
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              {isMarathi
                ? "विद्यार्थी सेवा, डिव्हाइस रीसेट व कोर्स ग्रँट्स कार्यपद्धती"
                : "Student Care, Single-Device Verification & Course Grants SOP"}
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {isMarathi
                ? "प्रशांत धुमाळ सरांच्या मार्गदर्शनाखाली सातारा व पुणे केंद्रातील कर्मचाऱ्यांनी प्रत्येक विद्यार्थ्याला तत्पर, पारदर्शक व नियमानुसार सेवा देण्यासाठी ही नियमावली तयार करण्यात आली आहे."
                : "Standard protocols governing support desk responsiveness, one-click outbound calling, manual grant audits against physical fee receipts, and dynamic DRM security."}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-black uppercase text-blue-600 block">Tickets SLA</span>
                <span className="font-extrabold text-slate-900">&lt; 24h Turnaround</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-black uppercase text-emerald-600 block">Device Reset</span>
                <span className="font-extrabold text-slate-900">Phone Verification</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-black uppercase text-purple-600 block">Audit Trail</span>
                <span className="font-extrabold text-slate-900">100% Traceable</span>
              </div>
            </div>
          </div>

          <div className="lg:w-5/12 relative w-full h-56 sm:h-72 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-950 shrink-0">
            <Image
              src="/assets/guide/admin-sop-tickets-grants.webp"
              alt="Admin SOP Ticket Resolution & Manual Grants Illustration"
              fill
              sizes="(max-width: 1024px) 100vw, 500px"
              className="object-cover object-center"
            />
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Role Filter Pills */}
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 text-xs font-bold">
            <button
              type="button"
              onClick={() => setRoleFilter("all")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                roleFilter === "all"
                  ? "bg-blue-600 text-white font-black shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {isMarathi ? "सर्व SOPs (९)" : "All SOPs (9)"}
            </button>

            <button
              type="button"
              onClick={() => setRoleFilter("sub_admin")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                roleFilter === "sub_admin"
                  ? "bg-blue-600 text-white font-black shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {isMarathi ? "सब-ॲडमिन कार्यपद्धती (४)" : "Sub-Admin Core SOPs (4)"}
            </button>

            {isMainAdmin && (
              <button
                type="button"
                onClick={() => setRoleFilter("main_admin")}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                  roleFilter === "main_admin"
                    ? "bg-blue-600 text-white font-black shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {isMarathi ? "सुपर-ॲडमिन कार्यपद्धती (५)" : "Super-Admin Console SOPs (5)"}
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={sopSearch}
              onChange={(e) => setSopSearch(e.target.value)}
              placeholder={isMarathi ? "SOP शोधा..." : "Search SOPs..."}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>
        </div>

        {/* SOP Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSops.map((sop) => {
            return (
              <div
                key={sop.id}
                id={sop.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-5"
              >
                <div className="space-y-4">
                  {/* Card Header Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                      {isMarathi ? sop.badgeMr : sop.badgeEn}
                    </span>
                    <span className="text-xs font-mono font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                      {sop.sopNumber}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                      {isMarathi ? sop.titleMr : sop.titleEn}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {isMarathi ? sop.descMr : sop.descEn}
                    </p>
                  </div>

                  {/* Step-by-Step Instructions */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      {isMarathi ? "कार्यपद्धती टप्पे (Action Steps):" : "Execution Steps:"}
                    </span>
                    {(isMarathi ? sop.stepsMr : sop.stepsEn).map((st, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                        <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{st}</span>
                      </div>
                    ))}
                  </div>

                  {/* Operational Security Rules */}
                  <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 space-y-1">
                    <span className="font-extrabold flex items-center gap-1.5 text-amber-950 text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>{isMarathi ? "महत्त्वाचे नियम (Mandatory Rules):" : "Compliance Rules:"}</span>
                    </span>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                      {(isMarathi ? sop.rulesMr : sop.rulesEn).map((rl, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {rl}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Direct Action Link */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400">
                    Target: {sop.actionHref}
                  </span>
                  <Link
                    href={sop.actionHref}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-extrabold text-xs transition shadow-xs cursor-pointer"
                  >
                    <span>{isMarathi ? sop.actionTextMr : sop.actionTextEn}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminShell>
  );
}
