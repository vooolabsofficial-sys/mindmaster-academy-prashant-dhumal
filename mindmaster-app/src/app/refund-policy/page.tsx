"use client";

import React from "react";
import LegalPageLayout, {
  TableOfContentItem,
  KeyTakeawayItem,
} from "@/components/legal/LegalPageLayout";
import {
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  CreditCard,
  PhoneCall,
  Mail,
  ShieldCheck,
  Building2,
  ArrowRight,
  LifeBuoy
} from "lucide-react";

const TOC_ITEMS: TableOfContentItem[] = [
  { id: "sec-nature", titleEn: "1. Nature of Digital Services", titleMr: "१. डिजिटल शैक्षणिक सेवेचे स्वरूप" },
  { id: "sec-no-refund", titleEn: "2. General Non-Refundable Policy", titleMr: "२. अभ्यासक्रम फी परतावा धोरण" },
  { id: "sec-duplicate-refunds", titleEn: "3. 100% Refund for Duplicate Transactions", titleMr: "३. दुबार पेमेंटसाठी १००% परतावा हमी" },
  { id: "sec-failed-transactions", titleEn: "4. Failed Deductions & Auto Reversals", titleMr: "४. अयशस्वी व्यवहार व स्वयंचलित परतावा" },
  { id: "sec-how-to-claim", titleEn: "5. Step-by-Step Ticket Raising Guide", titleMr: "५. परतावा मागणी करण्याची टप्प्याटप्प्याने पद्धत" },
  { id: "sec-timeline", titleEn: "6. Refund Timelines & Banking Modes", titleMr: "६. परताव्याची मुदत (५ ते ७ कामाचे दिवस)" },
  { id: "sec-free-demo", titleEn: "7. Free Demos & Trial Evaluation", titleMr: "७. मोफत डेमो व्हिडिओ व पूर्वतपासणी" },
  { id: "sec-contact", titleEn: "8. Helpdesk & Grievance Assistance", titleMr: "८. हेल्पलाइन व मदत केंद्र" },
];

const KEY_TAKEAWAYS: KeyTakeawayItem[] = [
  {
    icon: <RotateCcw className="w-4 h-4 text-amber-600" />,
    titleEn: "Instant Digital Access",
    titleMr: "तात्काळ डिजिटल प्रवेश",
    descEn: "Course formulas and videos unlock instantly upon payment. Fees are non-refundable once content is accessed.",
    descMr: "पेमेंट झाल्यावर कोर्स तात्काळ सुरू होतो. एकदा व्हिडिओ पाहिले की फी परत केली जात नाही.",
    badgeEn: "Standard Policy",
    badgeMr: "नियम",
    color: "amber",
  },
  {
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
    titleEn: "100% Duplicate Refund",
    titleMr: "१००% दुबार परतावा",
    descEn: "If charged twice due to a network glitch, the extra amount is refunded 100% with zero cancellation fees.",
    descMr: "नेटवर्क त्रुटीमुळे दोनदा पैसे कापले गेल्यास जादाची रक्कम १००% कोणतीही कपात न करता परत मिळते.",
    badgeEn: "Zero Deductions",
    badgeMr: "१००% परतावा",
    color: "emerald",
  },
  {
    icon: <Clock className="w-4 h-4 text-blue-600" />,
    titleEn: "5 to 7 Working Days",
    titleMr: "५ ते ७ कामाचे दिवस",
    descEn: "Approved refunds credit directly back to your original source (Google Pay, PhonePe, UPI, Bank Account).",
    descMr: "मंजूर परतावा थेट तुमच्या मूळ खात्यात (UPI, PhonePe, GPay किंवा बँक) ५ ते ७ दिवसांत जमा होतो.",
    badgeEn: "Direct Credit",
    badgeMr: "थेट बँक जमा",
    color: "blue",
  },
  {
    icon: <LifeBuoy className="w-4 h-4 text-purple-600" />,
    titleEn: "In-App Ticket Desk",
    titleMr: "ॲपमधील सपोर्ट डेस्क",
    descEn: "Easily track payment issues by raising a ticket from Student Profile under 'Payment / Course Access'.",
    descMr: "विद्यार्थी प्रोफाईल सेटिंग्जमधून 'Payment / Course Access' अंतर्गत तिकीट नोंदवून पाठपुरावा करा.",
    badgeEn: "24h Response",
    badgeMr: "२४ तास मदत",
    color: "purple",
  },
];

export default function RefundPolicyPage() {
  return (
    <LegalPageLayout
      currentTab="refund"
      titleEn="Cancellation & Refund Policy"
      titleMr="रद्दीकरण व फी परतावा धोरण"
      subtitleEn="Clear, transparent terms regarding digital course delivery, 100% duplicate charge refunds, and Razorpay processing."
      subtitleMr="डिजिटल कोर्सेस, दुबार पेमेंटसाठी १००% परतावा हमी आणि रेझरपे प्रक्रियेबाबत स्पष्ट व पारदर्शक नियमावली."
      bannerSrc="/assets/guide/legal-refund.webp"
      bannerAlt="MindMaster Academy Refund & Cancellation Policy Banner"
      tableOfContents={TOC_ITEMS}
      keyTakeaways={KEY_TAKEAWAYS}
    >
      {(lang) => {
        const isMr = lang === "mr";

        if (isMr) {
          return (
            <>
              {/* मराठी आवृत्ती */}
              <div id="sec-nature" className="space-y-3 pt-2">
                <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                  कलम १ • सेवेचे स्वरूप
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  १. डिजिटल शैक्षणिक सेवेचे स्वरूप
                </h2>
                <p>
                  माइंडमास्टर अकॅडमी (संस्थापक: प्रशांत धुमाळ सर) च्या सर्व ऑनलाइन कोर्सेस, वैदिक गणिताच्या ट्रिक्स, स्पीड कॅल्क्युलेशन व्हिडिओ लेक्चर्स आणि ई-बुक्स हे पूर्णपणे डिजिटल स्वरूपातील बौद्धिक संपदा आहेत.
                </p>
                <p>
                  यशस्वी पेमेंट होताच विद्यार्थ्याच्या खात्यामध्ये संपूर्ण अभ्यासक्रम आणि चाचण्या तात्काळ अनलॉक केल्या जातात.
                </p>
              </div>

              <div id="sec-no-refund" className="space-y-4 pt-4 border-t border-slate-100">
                <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                  कलम २ • फी परतावा नियम
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  २. सामान्य अभ्यासक्रम फी परतावा धोरण
                </h2>
                <p>
                  कारण डिजिटल अभ्यासक्रम, गुप्त स्मरणशक्ती सूत्रे आणि व्हिडिओ रेकॉर्डिंग्स खरेदी केल्यानंतर तात्काळ पाहता येतात, त्यामुळे <strong>एकदा कोर्स सामग्री ॲक्सेस किंवा पाहिली गेल्यानंतर भरलेली फी कोणत्याही कारणास्तव परत (Refund) केली जात नाही</strong>.
                </p>
                <p>
                  विद्यार्थ्यांनी व पालकांनी प्रवेश घेण्यापूर्वी आमच्या मोफत डेमो व्हिडिओंचा लाभ घेऊन खात्री करावी, ही नम्र विनंती.
                </p>
              </div>

              <div id="sec-duplicate-refunds" className="space-y-4 pt-4 border-t border-slate-100">
                <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                  कलम ३ • दुबार पेमेंट हमी
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  ३. तांत्रिक त्रुटीमुळे झालेल्या दुबार पेमेंटसाठी १००% परतावा हमी
                </h2>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
                  <div className="font-extrabold flex items-center gap-1.5 text-emerald-950">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>१००% परतावा नियम (कोणतीही कपात नाही):</span>
                  </div>
                  <p>
                    इंटरनेट कनेक्शन खंडित झाल्यामुळे किंवा बँकेच्या सर्व्हरच्या त्रुटीमुळे जर एकाच कोर्ससाठी तुमच्या खात्यातून दोनदा किंवा अधिक वेळा पैसे कापले गेले असतील तर:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>जास्तीची कापलेली रक्कम <strong>१००% परत</strong> केली जाईल.</li>
                    <li>यासाठी कोणतेही प्रोसेसिंग शुल्क किंवा दंड आकारला जाणार नाही.</li>
                    <li>आमची रेझरपे ऑटोमेशन सिस्टीम अशा दुबार नोंदी आपोआप ओळखून परतावा सुरू करते.</li>
                  </ul>
                </div>
              </div>

              <div id="sec-failed-transactions" className="space-y-4 pt-4 border-t border-slate-100">
                <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                  कलम ४ • अयशस्वी व्यवहार
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  ४. बँक खात्यातून पैसे कापले पण कोर्स अनलॉक न झाल्यास
                </h2>
                <p>
                  कधीकधी बँक आणि पेमेंट गेटवेमधील संपर्कात अडथळा आल्यास खात्यातून पैसे वजा होतात परंतु कोर्स सुरू होत नाही. अशा वेळी:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700">
                  <li>बँकेच्या नियमांनुसार २४ ते ४८ तासांत हे पैसे तुमच्या बँक खात्यात आपोआप परत जमा होतात.</li>
                  <li>जर २४ तासांनंतरही पैसे परत आले नाहीत किंवा कोर्स अनलॉक झाला नाही, तर त्वरित आमच्या हेल्पलाइनवर संपर्क साधावा.</li>
                </ul>
              </div>

              <div id="sec-how-to-claim" className="space-y-4 pt-4 border-t border-slate-100">
                <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                  कलम ५ • सपोर्ट तिकीट पद्धत
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  ५. परतावा मागणी करण्याची टप्प्याटप्प्याने पद्धत (In-App Ticket Desk)
                </h2>
                <p>
                  परतावा किंवा पेमेंट समस्येबाबत जलद निराकरणासाठी खालील पद्धतीचा अवलंब करा:
                </p>
                <div className="space-y-2.5 pt-1">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shrink-0">१</span>
                    <div className="text-xs">
                      <strong>विद्यार्थी प्रोफाईल उघडा:</strong> माइंडमास्टर ॲपमध्ये खालच्या मेन्यूमधून &quot;Profile&quot; पर्यायावर जा.
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shrink-0">२</span>
                    <div className="text-xs">
                      <strong>सपोर्ट डेस्क निवडा:</strong> &quot;In-App Support Desk&quot; वर क्लिक करून &quot;Create Support Ticket&quot; निवडा.
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shrink-0">३</span>
                    <div className="text-xs">
                      <strong>कॅटेगरी निवडा:</strong> &quot;Payment / Course Access&quot; ही कॅटेगरी निवडून तुमचा रेझरपे ऑर्डर आयडी किंवा बँकेचा UTR क्रमांक लिहा.
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shrink-0">४</span>
                    <div className="text-xs">
                      <strong>तातडीने खात्री:</strong> आमची सातारा कार्यालयीन टीम २४ तासांच्या आत रेझरपेशी संपर्क साधून परतावा मंजूर करेल.
                    </div>
                  </div>
                </div>
              </div>

              <div id="sec-timeline" className="space-y-4 pt-4 border-t border-slate-100">
                <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                  कलम ६ • परताव्याची मुदत
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  ६. परताव्याची मुदत व बँकिंग पद्धती (५ ते ७ कामाचे दिवस)
                </h2>
                <p>
                  परतावा मंजूर झाल्यानंतर, भारतीय रिझर्व्ह बँक (RBI) आणि बँकिंग प्रणालीनुसार <strong>५ ते ७ कामाच्या दिवसांत (5 to 7 Working Days)</strong> मूळ पेमेंट स्त्रोताकडे रक्कम पाठवली जाते:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700">
                  <li><strong>UPI (Google Pay, PhonePe, Paytm, BHIM):</strong> मूळ बँक खात्यात थेट जमा.</li>
                  <li><strong>डेबिट / क्रेडिट कार्ड:</strong> संबंधित कार्ड जारी करणाऱ्या बँकेच्या खात्यात क्रेडिट.</li>
                  <li><strong>नेटबँकिंग:</strong> मूळ बँक खात्यामध्ये परतावा.</li>
                </ul>
              </div>

              <div id="sec-free-demo" className="space-y-4 pt-4 border-t border-slate-100">
                <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                  कलम ७ • मोफत डेमो
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  ७. मोफत डेमो व्हिडिओ व पूर्वतपासणी
                </h2>
                <p>
                  प्रत्येक विद्यार्थ्याला शिकवण्याची पद्धत, व्हिडिओ गुणवत्ता आणि अभ्यासक्रमाची माहिती समजून घेता यावी म्हणून आम्ही सर्व प्रमुख कोर्सेसचे मोफत डेमो व्हिडिओ उपलब्ध करून दिले आहेत. विद्यार्थी व पालकांनी फी भरण्यापूर्वी हे डेमो अवश्य पाहावेत.
                </p>
              </div>

              <div id="sec-contact" className="space-y-4 pt-4 border-t border-slate-100">
                <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                  कलम ८ • मदत केंद्र
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  ८. सातारा हेल्पडेस्क व मदत संपर्क
                </h2>
                <p>
                  पेमेंट संदर्भातील कोणत्याही अडचणीसाठी आमच्या अधिकृत सातारा केंद्राशी त्वरित संपर्क साधावा:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[11px] font-black uppercase text-slate-500 block">फोन व व्हॉट्सॲप:</span>
                    <a href="tel:+918459344077" className="text-blue-600 font-bold flex items-center gap-1.5 text-xs">
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>+91 84593 44077</span>
                    </a>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[11px] font-black uppercase text-slate-500 block">ईमेल संपर्क:</span>
                    <a href="mailto:mindmasterdhumal@gmail.com" className="text-blue-600 font-bold flex items-center gap-1.5 text-xs truncate">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">mindmasterdhumal@gmail.com</span>
                    </a>
                  </div>
                </div>
              </div>
            </>
          );
        }

        // English Version
        return (
          <>
            <div id="sec-nature" className="space-y-3 pt-2">
              <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                Section 1 • Nature of Delivery
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                1. Nature of Digital Educational Services
              </h2>
              <p>
                MindMaster Academy (mentored by <strong>Prashant Dhumal Sir</strong>) delivers instant, real-time digital educational content including full-length video courses, Vedic Mathematics speed modules, speed calculation algorithms, practice drills, and digital books.
              </p>
              <p>
                Upon successful confirmation of payment, the enrolled course content and practice tests are instantaneously unlocked in the student&apos;s digital account.
              </p>
            </div>

            <div id="sec-no-refund" className="space-y-4 pt-4 border-t border-slate-100">
              <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                Section 2 • General Refund Policy
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                2. General Non-Refundable Subscription Policy
              </h2>
              <p>
                Because proprietary intellectual property, memory formulas, and video curricula are delivered and accessible immediately upon purchase, <strong>course and book subscription fees are non-refundable once content has been accessed or streamed</strong>.
              </p>
              <p>
                Students and parents are strongly encouraged to inspect our extensive library of free preview lessons before finalizing paid enrollment.
              </p>
            </div>

            <div id="sec-duplicate-refunds" className="space-y-4 pt-4 border-t border-slate-100">
              <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                Section 3 • Duplicate Payments
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                3. 100% Refund Guarantee for Duplicate Transactions
              </h2>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
                <div className="font-extrabold flex items-center gap-1.5 text-emerald-950">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>100% Duplicate Charge Refund Guarantee:</span>
                </div>
                <p>
                  If an internet disconnection, network timeout, or payment gateway delay causes your bank account, UPI, or card to be debited more than once for the same course or digital book:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>The duplicate amount will be <strong>refunded 100%</strong> without any administrative or cancellation fee deductions.</li>
                  <li>Our automated Razorpay webhook infrastructure routinely catches and flags duplicate transactions for priority refunding.</li>
                </ul>
              </div>
            </div>

            <div id="sec-failed-transactions" className="space-y-4 pt-4 border-t border-slate-100">
              <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                Section 4 • Failed Transactions
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                4. Bank Debited But Course Not Unlocked
              </h2>
              <p>
                Occasionally, momentary banking communication interruptions may cause funds to be deducted from your account while your student dashboard does not immediately unlock:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700">
                <li>In most cases, the issuing bank automatically reconciles and reverses the unsettled charge to your account within 24 to 48 hours.</li>
                <li>If the course remains locked after 24 hours, you may raise a ticket with your transaction reference (UTR or Razorpay ID) for instant manual unlock or payment tracing.</li>
              </ul>
            </div>

            <div id="sec-how-to-claim" className="space-y-4 pt-4 border-t border-slate-100">
              <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                Section 5 • How to Claim Refund
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                5. Step-by-Step Ticket Raising Guide (In-App Support Desk)
              </h2>
              <p>
                To raise a payment inquiry or duplicate refund claim, follow these simple steps inside your student portal:
              </p>
              <div className="space-y-2.5 pt-1">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shrink-0">1</span>
                  <div className="text-xs">
                    <strong>Navigate to Profile:</strong> Open the MindMaster App and click on &quot;Profile&quot; in the bottom navigation bar.
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shrink-0">2</span>
                  <div className="text-xs">
                    <strong>Open In-App Support Desk:</strong> Tap on &quot;In-App Support Desk&quot; and select &quot;Create Support Ticket&quot;.
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shrink-0">3</span>
                  <div className="text-xs">
                    <strong>Select Category &amp; Details:</strong> Choose category &quot;Payment / Course Access&quot;, enter your Razorpay Order ID (e.g. <code>order_...</code>) or bank UTR number, and explain the glitch.
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shrink-0">4</span>
                  <div className="text-xs">
                    <strong>Priority Resolution:</strong> Our finance team in Satara verifies the gateway logs and initiates the refund within 24 business hours.
                  </div>
                </div>
              </div>
            </div>

            <div id="sec-timeline" className="space-y-4 pt-4 border-t border-slate-100">
              <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                Section 6 • Refund Timelines
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                6. Refund Timelines &amp; Banking Modes (5 to 7 Working Days)
              </h2>
              <p>
                Once an authorized refund is triggered via Razorpay, funds are credited strictly to the original source account in accordance with Reserve Bank of India (RBI) turnaround cycles:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700">
                <li><strong>UPI (Google Pay, PhonePe, Paytm, BHIM):</strong> Credited directly to the linked primary bank account within 2 to 5 business days.</li>
                <li><strong>Debit / Credit Card:</strong> Credited to the issuing card statement within 5 to 7 business days depending on the bank.</li>
                <li><strong>NetBanking:</strong> Deposited directly into the source savings/current bank account.</li>
              </ul>
            </div>

            <div id="sec-free-demo" className="space-y-4 pt-4 border-t border-slate-100">
              <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                Section 7 • Free Demos
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                7. Free Demos &amp; Trial Evaluation
              </h2>
              <p>
                We believe in 100% transparency. Every curriculum offers free introductory modules, test series samples, and speed formula walkthroughs so students and parents can evaluate course suitability before making any financial investment.
              </p>
            </div>

            <div id="sec-contact" className="space-y-4 pt-4 border-t border-slate-100">
              <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                Section 8 • Contact Information
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                8. Helpdesk &amp; Grievance Redressal
              </h2>
              <p>
                If you have questions regarding an invoice or refund status, reach out to our team with your transaction details:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[11px] font-black uppercase text-slate-500 block">WhatsApp &amp; Helpline:</span>
                  <a href="tel:+918459344077" className="text-blue-600 font-bold flex items-center gap-1.5 text-xs">
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>+91 84593 44077</span>
                  </a>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[11px] font-black uppercase text-slate-500 block">Official Accounts Email:</span>
                  <a href="mailto:mindmasterdhumal@gmail.com" className="text-blue-600 font-bold flex items-center gap-1.5 text-xs truncate">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="truncate">mindmasterdhumal@gmail.com</span>
                  </a>
                </div>
              </div>
            </div>
          </>
        );
      }}
    </LegalPageLayout>
  );
}
