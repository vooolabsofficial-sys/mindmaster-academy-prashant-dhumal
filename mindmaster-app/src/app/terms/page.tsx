"use client";

import React from "react";
import LegalPageLayout, {
  TableOfContentItem,
  KeyTakeawayItem,
} from "@/components/legal/LegalPageLayout";
import {
  Smartphone,
  ShieldAlert,
  Clock,
  Scale,
  AlertTriangle,
  FileCheck,
  CheckCircle2,
  Lock,
  Tv,
  Ban,
  Building2,
  PhoneCall,
  Mail,
  MapPin
} from "lucide-react";

const TOC_ITEMS: TableOfContentItem[] = [
  { id: "sec-agreement", titleEn: "1. Acceptance of Terms", titleMr: "१. अटींची स्वीकृती व करार" },
  { id: "sec-single-device", titleEn: "2. Strict Single-Device Login Policy", titleMr: "२. सिंगल-डिव्हाइस लॉगिन धोरण (DRM)" },
  { id: "sec-anti-piracy", titleEn: "3. Anti-Piracy, Dynamic Watermarking & Copyright", titleMr: "३. पायरसी प्रतिबंध व कॉपीराइट कायदा" },
  { id: "sec-penalties", titleEn: "4. Legal Penalties Under Indian Acts", titleMr: "४. भारतीय कायद्यानुसार कायदेशीर दंड" },
  { id: "sec-validity", titleEn: "5. Course Validity & Expiration", titleMr: "५. कोर्सची मुदत व वैधता" },
  { id: "sec-conduct", titleEn: "6. Student Code of Conduct", titleMr: "६. विद्यार्थ्यांची आचारसंहिता" },
  { id: "sec-disclaimer", titleEn: "7. Academic Disclaimer & Limitation", titleMr: "७. शैक्षणिक अस्वीकरण व जबाबदारी मर्यादा" },
  { id: "sec-jurisdiction", titleEn: "8. Governing Law & Jurisdiction", titleMr: "८. अधिकारक्षेत्र (सातारा / पुणे न्यायालय)" },
];

const KEY_TAKEAWAYS: KeyTakeawayItem[] = [
  {
    icon: <Smartphone className="w-4 h-4 text-amber-600" />,
    titleEn: "1 Active Student Device",
    titleMr: "१ विद्यार्थी • १ डिव्हाइस",
    descEn: "Strict DRM limits access to 1 phone/computer at a time. New logins terminate older sessions instantly.",
    descMr: "एका वेळी एकाच मोबाईलवर अभ्यास करता येईल. दुसऱ्या डिव्हाइसवर लॉगिन केल्यास जुने सेशन आपोआप बंद होईल.",
    badgeEn: "Single Session",
    badgeMr: "१ डिव्हाइस",
    color: "amber",
  },
  {
    icon: <Tv className="w-4 h-4 text-purple-600" />,
    titleEn: "Dynamic Watermarking",
    titleMr: "डायनॅमिक वॉटरमार्क",
    descEn: "Video lectures and notes display your masked phone and student ID to deter screen recording & leaks.",
    descMr: "व्हिडिओ आणि नोट्सवर तुमचा मोबाईल नंबर सतत दिसतो, ज्यामुळे स्क्रीन रेकॉर्डिंग किंवा गैरवापर तत्काळ पकडला जातो.",
    badgeEn: "Anti-Leak DRM",
    badgeMr: "पायरसी बंदी",
    color: "purple",
  },
  {
    icon: <Ban className="w-4 h-4 text-red-600" />,
    titleEn: "Zero-Tolerance Piracy",
    titleMr: "पायरसीवर कडक बंदी",
    descEn: "Telegram/WhatsApp leak results in permanent ban, zero refund, and criminal copyright prosecution.",
    descMr: "व्हिडिओ टेलिग्राम किंवा व्हॉट्सॲपवर शेअर केल्यास खाते तत्काळ बंद होईल व कायदेशीर कारवाई केली जाईल.",
    badgeEn: "Copyright Act",
    badgeMr: "गुन्हेगारी दंड",
    color: "blue",
  },
  {
    icon: <Scale className="w-4 h-4 text-emerald-600" />,
    titleEn: "Satara / Pune Courts",
    titleMr: "सातारा / पुणे अधिकारक्षेत्र",
    descEn: "All legal proceedings and arbitration fall under the exclusive jurisdiction of courts in Satara & Pune.",
    descMr: "सर्व कायदेशीर बाबी आणि वाद केवळ सातारा किंवा पुणे न्यायालयाच्या कार्यक्षेत्रात चालवले जातील.",
    badgeEn: "MH Jurisdiction",
    badgeMr: "महाराष्ट्र",
    color: "emerald",
  },
];

export default function TermsPage() {
  return (
    <LegalPageLayout
      currentTab="terms"
      titleEn="Terms of Service & Anti-Piracy Policy"
      titleMr="सेवा अटी, नियम व पायरसी विरोधी धोरण"
      subtitleEn="Mandatory student code of conduct, Single-Device DRM session lock, and copyright compliance under Indian Law."
      subtitleMr="विद्यार्थ्यांसाठी अनिवार्य आचारसंहिता, सिंगल-डिव्हाइस सेशन लॉक आणि भारतीय कॉपीराइट कायद्याचे पालन."
      bannerSrc="/assets/guide/legal-terms.webp"
      bannerAlt="MindMaster Academy Terms and Anti-Piracy Shield Banner"
      tableOfContents={TOC_ITEMS}
      keyTakeaways={KEY_TAKEAWAYS}
    >
      {(lang) => {
        const isMr = lang === "mr";

        if (isMr) {
          return (
            <>
              {/* मराठी आवृत्ती */}
              <div id="sec-agreement" className="space-y-3 pt-2">
                <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                  कलम १ • कराराची व्याप्ती
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  १. अटींची स्वीकृती व कायदेशीर करार
                </h2>
                <p>
                  माइंडमास्टर अकॅडमी (संस्थापक: प्रशांत धुमाळ सर) च्या कोणत्याही कोर्समध्ये प्रवेश घेण्यापूर्वी, ॲप वापरताना किंवा डिजिटल पुस्तक खरेदी करताना विद्यार्थी आणि त्यांच्या पालकांनी हे नियम व अटी काळजीपूर्वक वाचणे अनिवार्य आहे.
                </p>
                <p>
                  आमच्या ॲपवर खाते तयार करणे किंवा फी भरणे म्हणजे तुम्ही या सर्व नियमांशी कायदेशीररीत्या बांधील आहात असा त्याचा स्पष्ट अर्थ होतो.
                </p>
              </div>

              <div id="sec-single-device" className="space-y-4 pt-4 border-t border-slate-100">
                <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                  कलम २ • डिव्हाइस सुरक्षा
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  २. सिंगल-डिव्हाइस लॉगिन धोरण (Strict Single-Device Policy)
                </h2>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                  <div className="font-extrabold flex items-center gap-2 text-amber-950">
                    <Smartphone className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>१ विद्यार्थी = १ डिव्हाइस नियम:</span>
                  </div>
                  <p>
                    प्रत्येक विद्यार्थ्याचा प्रवेश हा वैयक्तिक अभ्यासासाठी असतो. आमची सिस्टीम एका वेळी एकाच मोबाईल फोनवर किंवा लॅपटॉपवर लॉगिन करण्यास परवानगी देते.
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>एकाच वेळी दोन वेगवेगळ्या मोबाईलवर लॉगिन करण्याचा प्रयत्न केल्यास जुने सेशन तत्काळ बंद होईल.</li>
                    <li>सतत संशयास्पद डिव्हाइस बदल आढळल्यास सुरक्षिततेसाठी खाते आपोआप २४ तासांसाठी लॉक केले जाईल.</li>
                    <li>नवीन फोन घेतल्यास विद्यार्थी प्रोफाईल सेटिंग्जमधील &quot;Request Device Reset&quot; पर्यायावरून किंवा सातारा हेल्पलाइनवर संपर्क साधून आपले डिव्हाइस रीसेट करून घेऊ शकतात.</li>
                  </ul>
                </div>
              </div>

              <div id="sec-anti-piracy" className="space-y-4 pt-4 border-t border-slate-100">
                <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                  कलम ३ • बौद्धिक संपदा व कॉपीराइट
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  ३. पायरसी प्रतिबंध, डायनॅमिक वॉटरमार्किंग व कॉपीराइट
                </h2>
                <p>
                  माइंडमास्टर अकॅडमीच्या सर्व व्हिडिओ लेक्चर्स, ५०० वर्षांचे कॅलेंडर ट्रिक्स, वैदिक गणित सूत्रे, ट्रिक्स नोट्स आणि प्रश्नपत्रिका ही <strong>प्रशांत धुमाळ सर</strong> यांची स्वतंत्र बौद्धिक संपदा (Intellectual Property) आहे.
                </p>
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-2">
                  <div className="font-extrabold flex items-center gap-1.5 text-red-950">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>स्क्रीन रेकॉर्डिंग आणि शेअरिंगवर कडक बंदी:</span>
                  </div>
                  <p>
                    आमच्या व्हिडिओ प्लेअर आणि नोट्सवर विद्यार्थ्याचा नोंदणीकृत मोबाईल क्रमांक आणि युझर आयडी सतत तरंगत्या (Floating) वॉटरमार्कच्या स्वरूपात दिसतो.
                  </p>
                  <p>
                    थर्ड-पार्टी ॲप्स वापरून स्क्रीन रेकॉर्ड करणे, स्क्रीनशॉट काढणे, किंवा व्हिडिओ टेलिग्राम ग्रुप, व्हॉट्सॲप अथवा युट्यूबवर अपलोड करणे हा फौजदारी गुन्हा आहे.
                  </p>
                </div>
              </div>

              <div id="sec-penalties" className="space-y-4 pt-4 border-t border-slate-100">
                <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                  कलम ४ • कायदेशीर कारवाई
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  ४. भारतीय कायद्यानुसार कायदेशीर तरतुदी व दंड
                </h2>
                <p>
                  कोणत्याही विद्यार्थ्याने किंवा व्यक्तीने सामग्रीची पायरसी केल्यास खालील भारतीय कायद्यांनुसार कारवाई केली जाईल:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700">
                  <li><strong>भारतीय कॉपीराइट कायदा, १९५७ (कलम ५१, ६३ आणि ६३A):</strong> अनधिकृत कॉपी केल्यास ३ वर्षांपर्यंतचा कारावास आणि ₹५०,००० ते ₹२,००,००० पर्यंतचा दंड.</li>
                  <li><strong>माहिती तंत्रज्ञान कायदा, २००० (कलम ४३ आणि ६६):</strong> डिजिटल चोरी, अनधिकृत डेटा कॉपी आणि संगणक सुरक्षिततेचे उल्लंघन केल्याबद्दल कडक शिक्षेची तरतूद.</li>
                  <li><strong>अकॅडमी कारवाई:</strong> संबंधित विद्यार्थ्याचे खाते कोणतीही पूर्वसूचना किंवा फी परतावा न देता <strong>कायमस्वरूपी बंद (Permanent Suspension)</strong> केले जाईल आणि झालेल्या आर्थिक नुकसानीपोटी ₹५,००,००० पर्यंतच्या भरपाईचा दावा दाखल केला जाईल.</li>
                </ul>
              </div>

              <div id="sec-validity" className="space-y-4 pt-4 border-t border-slate-100">
                <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                  कलम ५ • कोर्स वैधता
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  ५. कोर्सची मुदत व वैधता
                </h2>
                <p>
                  प्रत्येक कोर्सची मुदत खरेदीच्या वेळी निवडलेल्या कालावधीनुसार (उदा. १ महिना, ३ महिने, ६ महिने किंवा १२ महिने) मर्यादित असते.
                </p>
                <p>
                  ठरलेली मुदत संपल्यानंतर व्हिडिओ लेक्चर्स आपोआप लॉक होतात. अभ्यास पुढे सुरू ठेवण्यासाठी विद्यार्थ्याला अधिकृत नूतनीकरण (Renewal) करावे लागेल.
                </p>
              </div>

              <div id="sec-conduct" className="space-y-4 pt-4 border-t border-slate-100">
                <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                  कलम ६ • आचारसंहिता
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  ६. विद्यार्थ्यांची आचारसंहिता व शिस्त
                </h2>
                <p>
                  सर्व विद्यार्थ्यांनी शिक्षक, सहकारी विद्यार्थी आणि सपोर्ट टीमशी संवाद साधताना सुसंस्कृत भाषेचा वापर करावा. चॅट किंवा सपोर्ट तिकीट डेस्कवर असभ्य वर्तन केल्यास खाते निलंबित केले जाऊ शकते.
                </p>
              </div>

              <div id="sec-disclaimer" className="space-y-4 pt-4 border-t border-slate-100">
                <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                  कलम ७ • शैक्षणिक अस्वीकरण
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  ७. शैक्षणिक अस्वीकरण व जबाबदारी मर्यादा
                </h2>
                <p>
                  माइंडमास्टर अकॅडमी वैदिक गणित आणि स्मरणशक्ती सुधारण्यासाठी सर्वोत्तम मार्गदर्शक तंत्रे शिकवते. स्पर्धा परीक्षांमधील अंतिम यश हे विद्यार्थ्याचा सातत्यपूर्ण सराव, अभ्यास आणि वैयक्तिक क्षमतेवर अवलंबून असते.
                </p>
              </div>

              <div id="sec-jurisdiction" className="space-y-4 pt-4 border-t border-slate-100">
                <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                  कलम ८ • न्यायालयीन अधिकारक्षेत्र
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  ८. अधिकारक्षेत्र (Jurisdiction)
                </h2>
                <p>
                  या करारातून किंवा माइंडमास्टर अकॅडमीच्या सेवांतून उद्भवणारे कोणतेही वाद, तंटे किंवा कायदेशीर दावे केवळ <strong>सातारा किंवा पुणे (महाराष्ट्र, भारत)</strong> येथील सक्षम न्यायालयांच्या अखत्यारीत चालवले जातील.
                </p>
              </div>
            </>
          );
        }

        // English Version
        return (
          <>
            <div id="sec-agreement" className="space-y-3 pt-2">
              <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                Section 1 • Agreement Scope
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                1. Acceptance of Terms &amp; Student Agreement
              </h2>
              <p>
                By enrolling in any online course, creating a student profile, accessing digital books, or using the MindMaster Academy Progressive Web App (founded and mentored by <strong>Prashant Dhumal Sir</strong>), you agree to be legally bound by these Terms of Service.
              </p>
              <p>
                If you are under 18 years of age, you confirm that your parent or legal guardian has reviewed and agreed to these terms on your behalf.
              </p>
            </div>

            <div id="sec-single-device" className="space-y-4 pt-4 border-t border-slate-100">
              <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                Section 2 • Single-Device DRM
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                2. Strict Single-Device Session Policy
              </h2>
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                <div className="font-extrabold flex items-center gap-2 text-amber-950">
                  <Smartphone className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>One Student • One Active Device:</span>
                </div>
                <p>
                  Each course license is granted strictly for individual educational use. Our platform employs real-time session tokens and DRM fingerprinting to monitor concurrent device usage.
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Logging into your account from a second handset or browser automatically invalidates and terminates any earlier active session.</li>
                  <li>Frequent concurrent device switching will trigger an automated 24-hour security lock on the student profile to prevent credential sharing.</li>
                  <li>Students upgrading their smartphone can request an authorized session reset via <em>Student Settings &gt; In-App Support Desk &gt; &quot;Request Device Reset&quot;</em>.</li>
                </ul>
              </div>
            </div>

            <div id="sec-anti-piracy" className="space-y-4 pt-4 border-t border-slate-100">
              <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                Section 3 • Intellectual Property
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                3. Anti-Piracy, Dynamic Watermarking &amp; Copyright Notice
              </h2>
              <p>
                All video lectures, Vedic Maths mnemonic tables, 500-year calendar speed shortcuts, test series questions, and digital books are the exclusive intellectual property of <strong>Prashant Dhumal Sir / MindMaster Academy</strong>.
              </p>
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-2">
                <div className="font-extrabold flex items-center gap-1.5 text-red-950">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Dynamic Watermarking &amp; Recording Prohibition:</span>
                </div>
                <p>
                  To deter intellectual property theft, our video player and notes reader continuously render a dynamic, floating watermark displaying the student&apos;s registered phone number and account ID across the display.
                </p>
                <p>
                  Capturing footage via screen-recording software, capturing external mobile camera feeds, downloading unencrypted stream segments, or redistributing content via Telegram, WhatsApp, YouTube, or Google Drive is strictly illegal.
                </p>
              </div>
            </div>

            <div id="sec-penalties" className="space-y-4 pt-4 border-t border-slate-100">
              <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                Section 4 • Legal Penalties
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                4. Statutory Legal Penalties Under Indian Law
              </h2>
              <p>
                Any student or unauthorized third party detected pirating, scraping, or circulating course materials will face full civil and criminal prosecution under Indian Acts:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700">
                <li><strong>Indian Copyright Act, 1957 (Sections 51, 63, and 63A):</strong> Willful copyright infringement carries imprisonment up to three (3) years and criminal fines ranging from ₹50,000 to ₹2,00,000.</li>
                <li><strong>Information Technology Act, 2000 (Sections 43 and 66):</strong> Hacking, unauthorized downloading, digital data extraction, and circumvention of DRM controls are punishable with heavy compensation and criminal liability.</li>
                <li><strong>Academy Enforcement:</strong> The offending account will be permanently banned with <strong>zero refund</strong>, and MindMaster Academy reserves the right to institute legal proceedings for civil damages up to ₹5,00,000.</li>
              </ul>
            </div>

            <div id="sec-validity" className="space-y-4 pt-4 border-t border-slate-100">
              <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                Section 5 • Course Validity
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                5. Course Validity &amp; Expiration
              </h2>
              <p>
                Course access is valid strictly for the enrollment term chosen during checkout (e.g., 1 Month, 3 Months, 6 Months, or 12 Months). Upon expiration, video playback and practice tests lock automatically unless officially renewed.
              </p>
            </div>

            <div id="sec-conduct" className="space-y-4 pt-4 border-t border-slate-100">
              <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                Section 6 • Code of Conduct
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                6. Student Code of Conduct
              </h2>
              <p>
                Students are expected to maintain academic decorum when interacting with faculty, support executives, and peers. Any abusive language, harassment, or fraudulent misuse of helpdesks will result in immediate disciplinary suspension.
              </p>
            </div>

            <div id="sec-disclaimer" className="space-y-4 pt-4 border-t border-slate-100">
              <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                Section 7 • Disclaimer
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                7. Academic Disclaimer &amp; Limitation of Liability
              </h2>
              <p>
                MindMaster Academy provides proven mnemonic and calculation methodologies. Examination results, scholarships, and academic ranks ultimately depend on individual student dedication, practice drills, and adherence to coursework.
              </p>
            </div>

            <div id="sec-jurisdiction" className="space-y-4 pt-4 border-t border-slate-100">
              <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                Section 8 • Jurisdiction
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                8. Governing Law &amp; Jurisdiction
              </h2>
              <p>
                These Terms and any disputes arising out of MindMaster Academy services shall be governed exclusively by the laws of India, and subject to the exclusive jurisdiction of the competent courts in <strong>Satara / Pune, Maharashtra, India</strong>.
              </p>
            </div>
          </>
        );
      }}
    </LegalPageLayout>
  );
}
