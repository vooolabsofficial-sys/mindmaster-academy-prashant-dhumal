# -*- coding: utf-8 -*-
"""
MindMaster Academy Student Master Guide PDF Generator
Compiles comprehensive Marathi Student & Parent guide into print-ready A4 PDF.
"""

import os
import subprocess
import sys

HTML_CONTENT = """<!DOCTYPE html>
<html lang="mr">
<head>
  <meta charset="utf-8">
  <title>माइंडमास्टर अकॅडमी — विद्यार्थी व पालक संपूर्ण मार्गदर्शिका</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Mukta:wght@400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 16mm 14mm 16mm 14mm;
    }
    @page:first {
      margin: 0;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Noto Sans Devanagari', 'Mukta', 'Plus Jakarta Sans', sans-serif;
      font-size: 13px;
      line-height: 1.6;
      color: #1e293b;
      margin: 0;
      padding: 0;
      background: #ffffff;
    }

    /* Cover Page */
    .cover-page {
      width: 100vw;
      height: 100vh;
      min-height: 297mm;
      max-height: 297mm;
      padding: 30mm 20mm 20mm 20mm;
      background: linear-gradient(135deg, #091e3a 0%, #10438c 50%, #1e6bf0 100%);
      color: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-after: always;
      position: relative;
      overflow: hidden;
    }
    .cover-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 6px 14px;
      border-radius: 30px;
      font-size: 11px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      font-weight: 700;
      color: #ffde59;
      margin-bottom: 20px;
    }
    .cover-title {
      font-size: 38px;
      font-weight: 800;
      line-height: 1.25;
      margin: 0 0 10px 0;
      color: #ffffff;
      text-shadow: 0 2px 10px rgba(0,0,0,0.3);
    }
    .cover-subtitle {
      font-size: 18px;
      font-weight: 600;
      color: #93c5fd;
      margin-bottom: 25px;
      line-height: 1.4;
    }
    .cover-tagline {
      font-size: 14px;
      color: #e2e8f0;
      max-width: 600px;
      border-left: 3px solid #ffde59;
      padding-left: 12px;
      margin-bottom: 40px;
    }
    .cover-meta {
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 14px;
      padding: 16px 20px;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      font-size: 12px;
    }
    .cover-meta div strong {
      color: #ffde59;
    }
    .cover-footer {
      font-size: 11px;
      color: #cbd5e1;
      display: flex;
      justify-content: space-between;
      border-top: 1px solid rgba(255,255,255,0.2);
      padding-top: 15px;
    }

    /* Page Setup & Running Header */
    .page-header {
      font-size: 10px;
      color: #64748b;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 5px;
      margin-bottom: 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .page-header span.academy {
      font-weight: 700;
      color: #0040c7;
    }

    /* Headings */
    h2.chapter-title {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 6px;
      margin-top: 0;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    h2.chapter-title .badge {
      background: #2563eb;
      color: #ffffff;
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 6px;
      font-weight: 700;
    }
    h3.section-title {
      font-size: 14px;
      font-weight: 700;
      color: #1e3a8a;
      margin-top: 14px;
      margin-bottom: 6px;
    }

    /* Cards & Callouts */
    .info-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #2563eb;
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 12px;
      font-size: 12.5px;
    }
    .alert-box {
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 12px;
      font-size: 12px;
      line-height: 1.5;
    }
    .alert-warning {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-left: 4px solid #d97706;
      color: #92400e;
    }
    .alert-info {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-left: 4px solid #2563eb;
      color: #1e40af;
    }
    .alert-success {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-left: 4px solid #16a34a;
      color: #166534;
    }

    /* Tables */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0 16px 0;
      font-size: 12px;
    }
    table.data-table th, table.data-table td {
      border: 1px solid #cbd5e1;
      padding: 8px 10px;
      text-align: left;
      vertical-align: top;
    }
    table.data-table th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
    }
    table.data-table tr:nth-child(even) td {
      background: #f8fafc;
    }

    /* Lists */
    ol.steps-list {
      margin: 6px 0 12px 18px;
      padding: 0;
    }
    ol.steps-list li {
      margin-bottom: 6px;
      font-size: 12.5px;
      line-height: 1.5;
    }
    ul.check-list {
      list-style: none;
      padding-left: 0;
      margin: 6px 0 12px 0;
    }
    ul.check-list li {
      position: relative;
      padding-left: 20px;
      margin-bottom: 5px;
      font-size: 12.5px;
    }
    ul.check-list li::before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #16a34a;
      font-weight: 800;
    }

    .page-break {
      page-break-after: always;
    }

    code {
      background: #f1f5f9;
      padding: 1px 5px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 11px;
      color: #0f172a;
      border: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>

  <!-- ==================== मुखपृष्ठ (COVER PAGE) ==================== -->
  <div class="cover-page">
    <div>
      <div class="cover-badge">★ अधिकृत विद्यार्थी व पालक मार्गदर्शिका २०२६ ★</div>
      <h1 class="cover-title">माइंडमास्टर अकॅडमी<br>विद्यार्थी मास्टर मॅन्युअल</h1>
      <div class="cover-subtitle">ॲप कसे वापरावे, कोर्सेस पाहणे, प्रॅक्टिस टूल्स, फी पावत्या व प्रमाणपत्र डाऊनलोड</div>
      <div class="cover-tagline">
        लॉगिनपासून प्रमाणपत्र मिळवण्यापर्यंतच्या प्रत्येक पर्यायाची साध्या व सोप्या मराठीत परिपूर्ण माहिती. एकाही ठिकाणी न अडकता शिका स्मार्ट पद्धतीने!
      </div>
    </div>

    <div>
      <div class="cover-meta">
        <div><strong>प्रशिक्षक:</strong> आंतरराष्ट्रीय मेमरी ट्रेनर प्रशांत धुमाळ सर</div>
        <div><strong>संस्था:</strong> माइंडमास्टर अकॅडमी, सातारा</div>
        <div><strong>वेब पोर्टल:</strong> mindmaster.academy / app.mindmasteredu.in</div>
        <div><strong>प्रमाणन:</strong> ISO 9001:2015 मान्यताप्राप्त शैक्षणिक सिस्टीम</div>
      </div>
      <div class="cover-footer">
        <span>MindMaster Student Operations Guide v2.0</span>
        <span>सर्व हक्क राखीव • शैक्षणिक वर्ष २०२६</span>
      </div>
    </div>
  </div>

  <!-- ==================== अनुक्रमणिका (TABLE OF CONTENTS) ==================== -->
  <div class="page-header">
    <span class="academy">माइंडमास्टर अकॅडमी</span>
    <span>विद्यार्थी मार्गदर्शिका • अनुक्रमणिका</span>
  </div>

  <h2 class="chapter-title"><span class="badge">विषयसूची</span> अनुक्रमणिका (Table of Contents)</h2>
  
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 14%;">प्रकरण</th>
        <th style="width: 62%;">प्रकरणाचे नाव व सविस्तर घटक</th>
        <th style="width: 24%;">ॲपमधील विभाग</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>प्रकरण १</strong></td>
        <td><strong>ॲपमध्ये प्रवेश व नोंदणी (Registration & Login)</strong> — मोबाईल नंबरने लॉगिन, ४-अंकी सिक्युरिटी पिन, प्रोफाइल पूर्ण करणे</td>
        <td><code>/login, /onboarding</code></td>
      </tr>
      <tr>
        <td><strong>प्रकरण २</strong></td>
        <td><strong>होम स्क्रीन व डॅशबोर्ड (Home Navigation)</strong> — सुरू असलेले लेक्चर्स, दैनिक सराव (Daily Drills), स्ट्रीक व प्रगती</td>
        <td><code>/home</code></td>
      </tr>
      <tr>
        <td><strong>प्रकरण ३</strong></td>
        <td><strong>कोर्सेस एक्सप्लोर करणे व ॲडमिशन (Courses & Checkout)</strong> — अभ्यासक्रम निवड, कूपन कोड वापरणे, ऑनलाईन UPI फी भरणे</td>
        <td><code>/courses, /checkout</code></td>
      </tr>
      <tr>
        <td><strong>प्रकरण ४</strong></td>
        <td><strong>माझे कोर्सेस विभाग (My Learning Hub)</strong> — ॲक्टिव्ह कोर्सेस, वॉच हिस्ट्री, लाईक केलेले व्हिडिओ व कोर्स वैधता</td>
        <td><code>/my-courses</code></td>
      </tr>
      <tr>
        <td><strong>प्रकरण ५</strong></td>
        <td><strong>व्हिडिओ लेक्चर्स कसे पहावे? (Video Classroom Player)</strong> — स्पीड कंट्रोल, फुलस्क्रीन, नोट्स पाहणे व DRM सुरक्षा नियम</td>
        <td><code>/watch/[id]</code></td>
      </tr>
      <tr>
        <td><strong>प्रकरण ६</strong></td>
        <td><strong>डिजिटल लायब्ररी व ई-बुक्स (Offline Vault)</strong> — पुस्तके, वर्कशीट PDF वाचणे व इंटरनेटशिवाय ऑफलाइन सेव्ह करणे</td>
        <td><code>/books, /notes</code></td>
      </tr>
      <tr>
        <td><strong>प्रकरण ७</strong></td>
        <td><strong>संपूर्ण व्यवहार इतिहास व फी पावती डाऊनलोड (Fee Receipts)</strong> — सर्व ऑनलाईन/ऑफलाईन पेमेंट्स, १-क्लिक A4 PDF पावती व WhatsApp शेअर</td>
        <td><code>/profile, /my-courses</code></td>
      </tr>
      <tr>
        <td><strong>प्रकरण ८</strong></td>
        <td><strong>अधिकृत प्रमाणपत्र मिळवणे व पडताळणी (Certificates)</strong> — कोर्स पूर्ण झाल्यावर क्लेम करणे, रंगीत PDF डाऊनलोड व QR कोड व्हेरिफिकेशन</td>
        <td><code>/certificate</code></td>
      </tr>
      <tr>
        <td><strong>प्रकरण ९</strong></td>
        <td><strong>विद्यार्थी प्रोफाइल, भाषा व सुरक्षा (Settings & PIN)</strong> — मराठी/इंग्रजी भाषा निवड, पिन बदलणे, कॅश मेमरी क्लिअर करणे</td>
        <td><code>/profile</code></td>
      </tr>
      <tr>
        <td><strong>प्रकरण १०</strong></td>
        <td><strong>सपोर्ट डेस्क व शंका निरसन (Student Helpdesk)</strong> — शिक्षकांना मेसेज पाठवणे, तक्रार तिकीट उघडणे व हेल्पलाइन नंबर</td>
        <td><code>/support, /help</code></td>
      </tr>
      <tr>
        <td><strong>प्रकरण ११</strong></td>
        <td><strong>सिंगल-डिव्हाइस लॉक व तांत्रिक अडचणींचे निवारण (Troubleshooting)</strong> — मोबाईल बदलल्यास काय करावे, व्हिडिओ न दिसणे व उपाय</td>
        <td>Device Security</td>
      </tr>
      <tr>
        <td><strong>प्रकरण १२</strong></td>
        <td><strong>विद्यार्थी व पालकांसाठी १० सुवर्णनियम (Do's and Don'ts)</strong> — उत्कृष्ट स्मरणशक्ती व वेगवान गणितासाठी महत्त्वाच्या सवयी</td>
        <td>Best Practices</td>
      </tr>
    </tbody>
  </table>

  <div class="alert-box alert-info">
    <strong>💡 पालकांसाठी विशेष सूचना:</strong> हे मॅन्युअल घरातील प्रत्येक पालकांनी एकदा नक्की वाचावे, जेणेकरून विद्यार्थ्यांना ऑनलाईन अभ्यास करताना कोणतीही अडचण येणार नाही आणि त्यांच्या प्रगतीवर लक्ष ठेवणे सोपे जाईल.
  </div>

  <div class="page-break"></div>

  <!-- ==================== प्रकरण १ व २ ==================== -->
  <div class="page-header">
    <span class="academy">माइंडमास्टर अकॅडमी</span>
    <span>प्रकरण १ व २: नोंदणी, लॉगिन व होम स्क्रीन</span>
  </div>

  <h2 class="chapter-title"><span class="badge">प्रकरण १</span> ॲपमध्ये प्रवेश व नोंदणी (Registration & Login)</h2>

  <h3 class="section-title">१.१ ॲप किंवा वेबसाईटवर कसे जावे?</h3>
  <div class="info-card">
    <strong>अधिकृत वेबसाईट लिंक:</strong> <code>https://mindmaster.academy</code> किंवा <code>https://app.mindmasteredu.in</code><br>
    कोणत्याही स्मार्टफोन, टॅबलेट किंवा लॅपटॉपवरील Google Chrome, Edge किंवा Safari ब्राउझरमध्ये ही लिंक उघडा.
  </div>

  <h3 class="section-title">१.२ पहिल्यांदाच नोंदणी व लॉगिन करण्याची पद्धत:</h3>
  <ol class="steps-list">
    <li>लॉगिन स्क्रीनवर तुमचा <strong>१०-अंकी चालू मोबाईल नंबर</strong> टाका.</li>
    <li><strong>"Continue with Mobile"</strong> या निळ्या बटनावर क्लिक करा.</li>
    <li>पहिल्यांदा लॉगिन करत असल्यास, तुम्हाला तुमचा स्वतःचा <strong>४-अंकी सिक्युरिटी पिन (Security PIN)</strong> तयार करण्यास सांगितले जाईल (उदा. <code>2468</code> किंवा <code>5500</code>). हा पिन नेहमी लक्षात ठेवावा.</li>
    <li><strong>विद्यार्थी माहिती (Profile Setup):</strong> तुमचे पूर्ण नाव, तुमची शाळा, सध्याची इयत्ता (उदा. 5th, 8th, 10th), गाव/शहर आणि जिल्हा (उदा. सातारा, पुणे) भरा.</li>
    <li><strong>"Complete Profile &amp; Start Learning"</strong> दाबा. तुमचे विद्यार्थी खाते त्वरित सुरू होईल!</li>
  </ol>

  <div class="alert-box alert-warning">
    <strong>⚠️ महत्त्वाचा सुरक्षा नियम:</strong> तुमचा मोबाईल नंबर आणि ४-अंकी पिन मित्रांसोबत किंवा इतर कोणाशीही शेअर करू नका. एका खात्यावर एकाच वेळी एकाच फोनमध्ये ॲप चालवता येते.
  </div>

  <hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 18px 0;">

  <h2 class="chapter-title"><span class="badge">प्रकरण २</span> होम स्क्रीन व डॅशबोर्ड (Home Dashboard Navigation)</h2>

  <p>ॲपमध्ये लॉगिन केल्यावर सर्वात आधी <strong>Home Screen</strong> उघडते. येथे खालील मुख्य घटक दिसतात:</p>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 25%;">घटक / विभाग</th>
        <th style="width: 75%;">कशासाठी वापरावा व काय फायदा होतो?</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>१. Continue Learning Banner</strong></td>
        <td>तुम्ही काल किंवा आधी ज्या व्हिडिओ लेक्चर्सवर थांबला होता, तो लेक्चर्स येथे एका क्लिकवर जिथून सुटला होता तिथूनच पुन्हा सुरू होतो (Resume Playback).</td>
      </tr>
      <tr>
        <td><strong>२. Daily Streak &amp; Practice</strong></td>
        <td>दररोज न चुकता सराव केल्यास तुमची <em>"Learning Streak"</em> वाढते. यामुळे विद्यार्थ्यांमध्ये रोज अभ्यास करण्याची आवड निर्माण होते.</td>
      </tr>
      <tr>
        <td><strong>३. वैदिक मॅथ्स व मेमरी शॉर्टकट</strong></td>
        <td>वेगाने पाढे तयार करणे, गुणाकार करणे आणि स्मरणशक्ती तंत्रांचे झटपट सराव टूल्स (Quick Math Drills) होम स्क्रीनवर थेट मिळतात.</td>
      </tr>
      <tr>
        <td><strong>४. टॉप नोटिफिकेशन बेल (Bell Icon)</strong></td>
        <td>अकॅडमीकडून नवीन लेक्चर्स, लाईव्ह वेबिनार्स किंवा सुट्ट्यांच्या सूचना या बेल आयकॉनवर क्लिक करून पाहता येतात.</td>
      </tr>
    </tbody>
  </table>

  <div class="page-break"></div>

  <!-- ==================== प्रकरण ३ व ४ ==================== -->
  <div class="page-header">
    <span class="academy">माइंडमास्टर अकॅडमी</span>
    <span>प्रकरण ३ व ४: कोर्सेस प्रवेश व माय लर्निंग हब</span>
  </div>

  <h2 class="chapter-title"><span class="badge">प्रकरण ३</span> कोर्सेस एक्सप्लोर करणे व ॲडमिशन (Courses & Checkout)</h2>

  <h3 class="section-title">३.१ नवीन कोर्सेस कसे पहावे? (`/courses`):</h3>
  <ol class="steps-list">
    <li>खालील मेनूमधून किंवा मेनूबारमधून <strong>"Courses"</strong> या पर्यायावर क्लिक करा.</li>
    <li>येथे अकॅडमीचे सर्व अधिकृत मास्टरक्लासेस दिसतील:
      <ul class="check-list" style="margin-top: 4px;">
        <li><strong>Vedic Mathematics Mastery:</strong> ५ ते १० पट वेगाने गणित सोडवण्याच्या वैदिक ट्रिक्स.</li>
        <li><strong>Speed Memory &amp; Brain Activation:</strong> अभ्यासक्रमातील मोठी उत्तरे, तारखा व सायन्स सूत्रे एकाच वाचनात लक्षात ठेवणे.</li>
        <li><strong>Abacus Mental Arithmetic:</strong> लहान मुलांच्या मेंदूच्या दोन्ही बाजूंचा समतोल विकास.</li>
      </ul>
    </li>
    <li>कोणत्याही कोर्सवर क्लिक करून त्याचा सविस्तर अभ्यासक्रम, व्हिडिओंची संख्या आणि फी तपासा.</li>
  </ol>

  <h3 class="section-title">३.२ ऑनलाईन फी भरून प्रवेश कसा घ्यावा? (Checkout & Payment):</h3>
  <ol class="steps-list">
    <li>कोर्सच्या पानावर <strong>"Enroll Now" (प्रवेश घ्या)</strong> या बटनावर क्लिक करा.</li>
    <li><strong>कूपन कोड असल्यास (Apply Coupon):</strong> सेमिनारमध्ये किंवा शाळेत मिळालेला कूपन कोड टाका आणि <em>"Apply"</em> दाबा. फीमध्ये तात्काळ सवलत (Discount) मिळेल.</li>
    <li><strong>सुरक्षित पेमेंट गेटवे (Razorpay Secure):</strong> <em>"Proceed to Pay"</em> दाबा. तुम्ही Google Pay, PhonePe, Paytm, UPI, ATM Debit Card किंवा NetBanking द्वारे फी भरू शकता.</li>
    <li>पेमेंट यशस्वी होताच <strong>१ सेकंदात</strong> कोर्स तुमच्या खात्यात सुरू होतो आणि स्क्रीनवर हिरव्या रंगाचा कन्फर्मेशन मेसेज येतो!</li>
  </ol>

  <div class="alert-box alert-success">
    <strong>🏢 ऑफलाईन सेमिनार किंवा केंद्रावर फी भरली असल्यास:</strong> जर तुम्ही प्रशांत सरांच्या सेमिनारमध्ये किंवा सातारा केंद्रावर रोख (Cash) फी दिली असेल, तर अकॅडमीचे शिक्षक तुमच्या फोन नंबरवर थेट कोर्स ॲक्टिव्हेट करतात. तुम्हाला पुन्हा पैसे भरण्याची गरज नसते.
  </div>

  <hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 18px 0;">

  <h2 class="chapter-title"><span class="badge">प्रकरण ४</span> माझे कोर्सेस विभाग (My Learning Hub - `/my-courses`)</h2>

  <p>तुम्ही प्रवेश घेतलेले सर्व कोर्सेस पाहण्यासाठी खालील पट्टीतील <strong>"My Courses" (किंवा 'माझे कोर्सेस')</strong> वर जा. या पानात ४ अत्यंत उपयुक्त टॅब आहेत:</p>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 25%;">टॅबचे नाव</th>
        <th style="width: 75%;">सविस्तर माहिती व वापर</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>१. Active Enrolled</strong></td>
        <td>तुम्ही सध्या शिकत असलेले सर्व सक्रिय कोर्सेस. प्रत्येक कोर्सच्या खाली तुमची वैधता (उदा. <em>Valid Till: 15 Aug 2026</em>) दिसते. <strong>"Continue Learning"</strong> दाबून थेट व्हिडिओ चालू करा.</td>
      </tr>
      <tr>
        <td><strong>२. Watch History</strong></td>
        <td>तुम्ही आतापर्यंत पाहिलेल्या सर्व व्हिडिओंची यादी. किती मिनिटे पाहिले ते अचूक समजते आणि पुन्हा पाहणे सोपे होते.</td>
      </tr>
      <tr>
        <td><strong>३. Liked Lessons</strong></td>
        <td>व्हिडिओ पाहताना तुम्ही ज्या लेक्चर्सना 'Like' (अंगठ्याचे चिन्ह) केले होते, ते सर्व आवडीचे लेक्चर्स येथे एकाच ठिकाणी साठवले जातात.</td>
      </tr>
      <tr>
        <td><strong>४. फी पावत्या व व्यवहार</strong></td>
        <td><strong>(नवीन आणि अत्यंत महत्त्वाचे!)</strong> तुम्ही भरलेल्या फीची अधिकृत पावती क्रमांक (उदा. <code>REC-VEDIC-8492</code>), रक्कम आणि १-क्लिक <strong>"Download PDF Receipt"</strong> बटण येथे मिळते!</td>
      </tr>
    </tbody>
  </table>

  <div class="page-break"></div>

  <!-- ==================== प्रकरण ५ व ६ ==================== -->
  <div class="page-header">
    <span class="academy">माइंडमास्टर अकॅडमी</span>
    <span>प्रकरण ५ व ६: व्हिडिओ क्लासरूम व डिजिटल लायब्ररी</span>
  </div>

  <h2 class="chapter-title"><span class="badge">प्रकरण ५</span> व्हिडिओ लेक्चर्स कसे पहावे? (Video Classroom Player)</h2>

  <h3 class="section-title">५.१ व्हिडिओ प्लेअरमधील स्मार्ट ऑप्शन्स:</h3>
  <ol class="steps-list">
    <li><strong>व्हिडिओ सुरू करणे:</strong> कोर्समधील कोणत्याही धड्यावर (Lesson) क्लिक करा. व्हिडिओ हाय-स्पीड क्लाऊड सर्व्हरवरून लगेच सुरू होतो.</li>
    <li><strong>स्पीड कंट्रोल (Playback Speed):</strong> व्हिडिओची गती <code>0.75x</code>, <code>1.0x (Normal)</code>, <code>1.25x</code>, <code>1.5x</code> किंवा <code>2.0x</code> करता येते. वेगाने रिव्हिजन करण्यासाठी <code>1.5x</code> चा वापर करा.</li>
    <li><strong>फुलस्क्रीन मोड (Full Screen):</strong> उजव्या कोपऱ्यातील चौकोनी बटनावर क्लिक करून आडव्या (Landscape) स्क्रीनवर संपूर्ण स्पष्टतेसह व्हिडिओ पहा.</li>
    <li><strong>धड्यांची अनुक्रमणिका (Curriculum Drawer):</strong> व्हिडिओच्या खाली किंवा बाजूला संपूर्ण अभ्यासक्रमाची यादी असते, ज्यामुळे पुढील धड्यावर जाणे सोपे होते.</li>
  </ol>

  <div class="alert-box alert-warning">
    <strong>🔒 DRM अँटी-पायरेसी सुरक्षा व स्क्रीन रेकॉर्डिंग नियम:</strong>
    <ul class="check-list" style="margin-top: 5px;">
      <li>व्हिडिओ चालू असताना स्क्रीनवर तुमचा १०-अंकी मोबाईल नंबर हलक्या अक्षरात वॉटरमार्क म्हणून तरंगत असतो.</li>
      <li>ॲपमधील व्हिडिओंचे स्क्रीन रेकॉर्डिंग किंवा स्क्रीनशॉट काढण्यास कायद्याने सक्त मनाई आहे. स्क्रीन रेकॉर्डिंग चालू केल्यास स्क्रीन काळी पडते.</li>
      <li>अकॅडमीचे व्हिडिओ दुसऱ्या कोणालाही विकणे किंवा सोशल मीडियावर टाकणे हा सायबर गुन्हा आहे. असे केल्यास खाते तात्काळ कायमस्वरूपी बंद केले जाते.</li>
    </ul>
  </div>

  <hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 18px 0;">

  <h2 class="chapter-title"><span class="badge">प्रकरण ६</span> डिजिटल लायब्ररी व ई-बुक्स (Offline Vault - `/books`)</h2>

  <h3 class="section-title">६.१ पुस्तके व वर्कशीट PDF कशी वाचावी?</h3>
  <ol class="steps-list">
    <li>मेनूमधील <strong>"Books / Notes"</strong> या पर्यायावर क्लिक करा.</li>
    <li>येथे प्रशांत सरांनी तयार केलेली अधिकृत पुस्तके, फॉर्म्युला शीट्स आणि सरावाच्या वर्कशीट्स उपलब्ध आहेत.</li>
    <li>पुस्तकावर क्लिक करताच <strong>In-App PDF Viewer</strong> मध्ये पुस्तक सुरक्षितपणे उघडते. पान पलटण्यासाठी डावीकडे/उजवीकडे स्वाइप करा किंवा झूम करा.</li>
  </ol>

  <h3 class="section-title">६.२ ऑफलाइन व्हॉल्ट (इंटरनेट नसतानाही पुस्तके वाचणे):</h3>
  <div class="info-card" style="background: #f0fdf4; border-left-color: #16a34a;">
    <strong style="color: #166534;">⚡ गावी जाताना किंवा रेंज नसताना अभ्यास कसा करावा?</strong>
    <p style="margin-top: 4px; font-size: 12px; color: #334155;">
      तुम्ही पुस्तकासमोरील <strong>"Save Offline"</strong> बटनावर क्लिक केल्यास ते पुस्तक तुमच्या फोनच्या एनक्रिप्टेड ब्राउझर मेमरीमध्ये सेव्ह होते. त्यानंतर इंटरनेट (Data) पूर्णपणे बंद असले तरीही तुम्ही ती पुस्तके कधीही वाचू शकता!
    </p>
  </div>

  <div class="page-break"></div>

  <!-- ==================== प्रकरण ७ व ८ ==================== -->
  <div class="page-header">
    <span class="academy">माइंडमास्टर अकॅडमी</span>
    <span>प्रकरण ७ व ८: फी पावती डाऊनलोड व प्रमाणपत्र</span>
  </div>

  <h2 class="chapter-title"><span class="badge">प्रकरण ७</span> संपूर्ण व्यवहार इतिहास व फी पावती डाऊनलोड (Fee Receipts & Invoices)</h2>

  <h3 class="section-title">७.१ फी पावती PDF डाऊनलोड करण्याची २ सोपी ठिकाणे:</h3>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 30%;">कुठून डाऊनलोड करावी?</th>
        <th style="width: 70%;">कशी डाऊनलोड करावी? (Step-by-Step)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>पद्धत १: My Courses पानातून (`/my-courses`)</strong></td>
        <td><code>/my-courses</code> उघडा -> चौथा टॅब <strong>"फी पावत्या व व्यवहार"</strong> दाबा -> कोर्ससमोरील निळ्या रंगाचे <strong>"पावती PDF" (Download PDF)</strong> बटण दाबा. अधिकृत पावती १ सेकंदात तुमच्या फोनमध्ये सेव्ह होईल!</td>
      </tr>
      <tr>
        <td><strong>पद्धत २: Profile पानातून (`/profile`)</strong></td>
        <td><code>/profile</code> उघडा -> <strong>"माझे कोर्सेस, व्यवहार व फी पावत्या"</strong> वर क्लिक करा -> येथे तुमचे सर्व ऑनलाईन/ऑफलाईन पेमेंट्स, हप्ते, पावती क्रमांक (उदा. <code>REC-VEDIC-8492</code>) दिसतील. तेथून <strong>"Download Receipt"</strong> दाबा.</td>
      </tr>
    </tbody>
  </table>

  <h3 class="section-title">७.२ अधिकृत फी पावतीमध्ये काय काय माहिती असते?</h3>
  <div class="info-card" style="background: #eff6ff; border-left-color: #2563eb;">
    <strong style="color: #1e40af;">📄 माइंडमास्टर अधिकृत फी पावती (Official A4 Tax Receipt Details):</strong>
    <ul class="check-list" style="margin-top: 5px;">
      <li>माइंडमास्टर अकॅडमी, सातारा हेड ऑफिसचा अधिकृत पत्ता व संपर्क क्रमांक.</li>
      <li>विद्यार्थ्याचे पूर्ण नाव, अधिकृत मोबाईल नंबर आणि जिल्हा.</li>
      <li>पावती क्रमांक (Receipt No), पेमेंट आयडी (Payment ID) आणि तारीख.</li>
      <li>कोर्सचे नाव, भरलेली फी आणि प्रवेश वैधता (Validity Period).</li>
      <li>ISO 9001:2015 गुणवत्ता शिक्का आणि आंतरराष्ट्रीय मेमरी ट्रेनर प्रशांत धुमाळ सरांची अधिकृत डिजिटल स्वाक्षरी.</li>
      <li>पालकांसाठी <strong>"Share via WhatsApp"</strong> बटण, ज्याने पावती पालकांच्या मोबाईलवर थेट पाठवता येते.</li>
    </ul>
  </div>

  <hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 18px 0;">

  <h2 class="chapter-title"><span class="badge">प्रकरण ८</span> अधिकृत प्रमाणपत्र मिळवणे व पडताळणी (Certificates - `/certificate`)</h2>

  <h3 class="section-title">८.१ कोर्स पूर्ण झाल्यावर सर्टिफिकेट कसे क्लेम करावे?</h3>
  <ol class="steps-list">
    <li>कोर्समधील सर्व व्हिडिओ लेक्चर्स १००% पाहून पूर्ण करा.</li>
    <li><code>/my-courses</code> किंवा <code>/certificate</code> वर गेल्यावर कोर्ससमोरील <strong>"Claim Certificate"</strong> (प्रमाणपत्र मिळवा) हे सोनेरी बटण सक्रिय होईल.</li>
    <li>त्यावर क्लिक करा. सिस्टीम तुमच्या नावाची खात्री करेल.</li>
    <li><strong>"Download Certificate PDF"</strong> दाबा. तुमचे आंतरराष्ट्रीय दर्जाचे रंगीत A4 प्रमाणपत्र तात्काळ डाऊनलोड होईल! हे प्रमाणपत्र तुम्ही प्रिंट काढून लॅमिनेट करू शकता.</li>
  </ol>

  <h3 class="section-title">८.२ क्यूआर कोड पडताळणी (Live QR Verification):</h3>
  <p>प्रत्येक प्रमाणपत्रावर खाली एक सुरक्षित QR कोड असतो. हा QR कोड जगातील कोणत्याही मोबाईल कॅमेऱ्याने स्कॅन केल्यास <code>app.mindmasteredu.in/verify-certificate</code> उघडते आणि विद्यार्थ्याचे नाव व कोर्स अधिकृत असल्याचे सरकारी व शैक्षणिक संस्थांना तात्काळ सिद्ध होते.</p>

  <div class="page-break"></div>

  <!-- ==================== प्रकरण ९ व १० ==================== -->
  <div class="page-header">
    <span class="academy">माइंडमास्टर अकॅडमी</span>
    <span>प्रकरण ९ व १०: प्रोफाइल सेटिंग्स व सपोर्ट डेस्क</span>
  </div>

  <h2 class="chapter-title"><span class="badge">प्रकरण ९</span> विद्यार्थी प्रोफाइल, भाषा व सुरक्षा (Settings & PIN)</h2>

  <h3 class="section-title">९.१ प्रोफाइलमधील उपयुक्त सेटिंग्स (`/profile`):</h3>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 28%;">सेटिंगचा पर्याय</th>
        <th style="width: 72%;">कशी वापरावी व कृती</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>१. नाव व शाळेची माहिती बदलणे</strong></td>
        <td><strong>"Edit Profile"</strong> वर क्लिक करून स्पेलिंग दुरुस्त करा. हेच नाव प्रमाणपत्रावर छापून येत असल्याने नाव अचूक असल्याची खात्री करा.</td>
      </tr>
      <tr>
        <td><strong>२. भाषा निवड (मराठी / English)</strong></td>
        <td><strong>"App Language"</strong> वर क्लिक करा. तुम्हाला आवडेल ती भाषा (मराठी किंवा इंग्रजी) एका क्लिकवर निवडा. संपूर्ण ॲप त्याच भाषेत दिसेल.</td>
      </tr>
      <tr>
        <td><strong>३. ४-अंकी सिक्युरिटी पिन बदलणे</strong></td>
        <td><strong>"Security &amp; PIN"</strong> वर जाऊन जुना पिन टाका आणि नवीन पिन सेट करा.</td>
      </tr>
      <tr>
        <td><strong>४. स्टोरेज व कॅश मेमरी क्लिअर करणे</strong></td>
        <td>ॲप हळू चालत असल्यास <strong>"Storage &amp; Offline Books"</strong> मधील <em>"Clear Cache &amp; Sync Data"</em> दाबा. तुमचे कोर्सेस सुरक्षित राहून ॲप रॉकेटच्या वेगाने चालेल.</td>
      </tr>
    </tbody>
  </table>

  <hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 18px 0;">

  <h2 class="chapter-title"><span class="badge">प्रकरण १०</span> सपोर्ट डेस्क व शंका निरसन (Student Helpdesk - `/support`)</h2>

  <h3 class="section-title">१०.१ अभ्यास करताना अडचण आल्यास मदत कशी मिळवावी?</h3>
  <ol class="steps-list">
    <li>मेनूतील <strong>"Support" (मदत केंद्र)</strong> या पर्यायावर क्लिक करा.</li>
    <li><strong>नवीन तिकीट उघडा (Create Ticket):</strong> तुमची अडचण निवडा (उदा. <em>कोर्समधील शंका, तांत्रिक अडचण, फी पावती, किंवा प्रमाणपत्र अडचण</em>).</li>
    <li>तुमचा प्रश्न मराठी किंवा इंग्रजीत टाईप करा आणि <strong>"Submit Ticket"</strong> दाबा.</li>
    <li>माइंडमास्टर अकॅडमीचे शिक्षक व सपोर्ट टीम २४ तासांच्या आत तुमच्या तिकीटाला थेट ॲपमध्ये उत्तर देतात.</li>
  </ol>

  <div class="alert-box alert-success">
    <strong>📞 तातडीच्या मदतीसाठी थेट अकॅडमी संपर्क:</strong><br>
    • <strong>हेल्पलाइन नंबर:</strong> +९१ ८४५९३ ४४०७७ (सकाळी ९ ते संध्याकाळी ७)<br>
    • <strong>ईमेल सपोर्ट:</strong> mindmasterdhumal@gmail.com<br>
    • <strong>सातारा मुख्य केंद्र:</strong> पवई नाका, सातारा शहर, महाराष्ट्र - ४१५००१
  </div>

  <div class="page-break"></div>

  <!-- ==================== प्रकरण ११ व १२ ==================== -->
  <div class="page-header">
    <span class="academy">माइंडमास्टर अकॅडमी</span>
    <span>प्रकरण ११ व १२: डिव्हाइस सुरक्षा व सुवर्णनियम</span>
  </div>

  <h2 class="chapter-title"><span class="badge">प्रकरण ११</span> सिंगल-डिव्हाइस लॉक व तांत्रिक अडचणींचे निवारण</h2>

  <h3 class="section-title">११.१ "Your Account is Locked to Another Device" एरर आल्यास काय करावे?</h3>
  <div class="info-card">
    <strong>हा एरर का येतो?</strong> पायरेसी रोखण्यासाठी तुमचे खाते तुम्ही पहिल्यांदा ज्या मोबाईलमध्ये लॉगिन केले होते, त्या मोबाईलशी सुरक्षितपणे लॉक होते. जर तुम्ही दुसरा फोन वापरला किंवा फोन फॉरमॅट केला तर हा एरर येतो.
  </div>

  <div class="alert-box alert-info">
    <strong>उपाय (केवळ २ मिनिटांत):</strong>
    <ol class="steps-list" style="margin-top: 5px;">
      <li>अकॅडमीच्या हेल्पलाइनवर <strong>+९१ ८४५९३ ४४०७७</strong> संपर्क करा किंवा व्हॉट्सॲप मेसेज करा.</li>
      <li>तुमचा <strong>१०-अंकी रजिस्टर्ड मोबाईल नंबर</strong> आणि <strong>विद्यार्थ्याचे नाव</strong> सांगा.</li>
      <li>अकॅडमीचे ॲडमिन सर तुमच्या खात्याचा <em>"Device Lock"</em> एका सेकंदात रीसेट करतील.</li>
      <li>त्यानंतर तुम्ही तुमच्या नवीन फोनमध्ये लगेच लॉगिन करू शकता!</li>
    </ol>
  </div>

  <h3 class="section-title">११.२ इतर सामान्य अडचणी व जलद उपाय:</h3>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 30%;">समस्या</th>
        <th style="width: 70%;">अचूक उपाय</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>व्हिडिओ फिरत राहतो (Buffering)</strong></td>
        <td>तुमचे इंटरनेट कनेक्शन तपासा. किंवा व्हिडिओ सेटींगमध्ये जाऊन रिझोल्युशन कमी करा (उदा. 480p निवडा).</td>
      </tr>
      <tr>
        <td><strong>४-अंकी पिन आठवत नाही</strong></td>
        <td>लॉगिन स्क्रीनवरील <strong>"Forgot PIN?"</strong> दाबा किंवा अकॅडमी सरांना कॉल करून पिन तात्पुरता रीसेट करून घ्या.</td>
      </tr>
      <tr>
        <td><strong>फी भरली पण कोर्स दिसत नाही</strong></td>
        <td>ॲप बंद करून पुन्हा चालू करा किंवा <code>/profile</code> वर जाऊन <em>"Clear Cache &amp; Sync Data"</em> दाबा. बँक सर्व्हरकडून कन्फर्मेशन मिळताच कोर्स आपोआप चालू होतो.</td>
      </tr>
    </tbody>
  </table>

  <hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 18px 0;">

  <h2 class="chapter-title"><span class="badge">प्रकरण १२</span> विद्यार्थी व पालकांसाठी १० सुवर्णनियम (Do's & Don'ts)</h2>

  <ul class="check-list">
    <li><strong>१. दररोज १५ मिनिटे सराव:</strong> दररोज नियमितपणे किमान १५ ते २० मिनिटे वेदिक मॅथ्स व मेमरी टेक्निक्सचा सराव करा.</li>
    <li><strong>२. वही व पेन सोबत ठेवा:</strong> व्हिडिओ लेक्चर्स पाहताना प्रशांत सरांनी सांगितलेल्या ट्रिक्स वहीत लिहून काढा.</li>
    <li><strong>३. स्वतःचे पासवर्ड गोपनीय ठेवा:</strong> तुमचा मोबाईल नंबर व पिन मित्रांना देऊ नका.</li>
    <li><strong>४. क्रमाने शिका:</strong> पहिला धडा पूर्ण समजल्याशिवाय थेट पाचव्या धड्यावर जाऊ नका; गणिताचा पाया पक्का करा.</li>
    <li><strong>५. कुटुंबासोबत गेम खेळा:</strong> शिकलेल्या मेमरी ट्रिक्स आई-बाबा किंवा भावंडांना दाखवा, त्यामुळे आत्मविश्वास वाढतो.</li>
    <li><strong>६. डाऊनलोड केलेली फी पावती जपून ठेवा:</strong> भविष्यातील शैक्षणिक नोंदीसाठी फी पावती PDF सेव्ह ठेवा.</li>
    <li><strong>७. प्रमाणपत्र वेळेवर क्लेम करा:</strong> कोर्स संपताच अधिकृत ISO प्रमाणपत्र डाऊनलोड करून घरात लावा.</li>
    <li><strong>८. स्क्रीन रेकॉर्डिंग करू नका:</strong> यामुळे खाते ब्लॉक होण्याचा धोका असतो.</li>
    <li><strong>९. रात्री झोपण्यापूर्वी ५ मिनिटे उजळणी:</strong> मेंदू झोपेत असताना शिकलेल्या गोष्टी कायमस्वरूपी मेमरीत सेव्ह करतो.</li>
    <li><strong>१०. अडचण आल्यास घाबरू नका:</strong> माइंडमास्टरची सपोर्ट टीम नेहमी तुमच्या मदतीसाठी सज्ज आहे!</li>
  </ul>

  <div style="margin-top: 30px; text-align: center; border-top: 2px solid #e2e8f0; padding-top: 15px;">
    <div style="font-size: 15px; font-weight: 800; color: #0040c7;">माइंडमास्टर अकॅडमी, सातारा</div>
    <div style="font-size: 11px; color: #64748b; margin-top: 3px;">
      पवई नाका, सातारा शहर, महाराष्ट्र - ४१५००१ • संपर्क: +९१ ८४५९३ ४४०७७ • mindmasterdhumal@gmail.com
    </div>
    <div style="font-size: 10px; color: #94a3b8; margin-top: 6px;">
      दस्तऐवज निर्मिती: २०२६ • आंतरराष्ट्रीय मेमरी ट्रेनर प्रशांत धुमाळ सर • सर्व हक्क सुरक्षित.
    </div>
  </div>

</body>
</html>
"""

def generate_pdf():
    work_dir = os.path.abspath(os.path.dirname(__file__))
    html_file = os.path.join(work_dir, "temp_student_manual.html")
    pdf_file = os.path.join(work_dir, "MindMaster_Student_Guide_Marathi.pdf")

    print(f"Writing HTML to: {html_file}")
    with open(html_file, "w", encoding="utf-8") as f:
        f.write(HTML_CONTENT)

    edge_paths = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    ]

    browser_exe = None
    for p in edge_paths:
        if os.path.exists(p):
            browser_exe = p
            break

    if not browser_exe:
        print("Error: No Chromium browser (Edge or Chrome) found.")
        sys.exit(1)

    print(f"Using browser: {browser_exe}")
    cmd = [
        browser_exe,
        "--headless",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={pdf_file}",
        html_file
    ]

    print("Generating Student Guide PDF...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if os.path.exists(pdf_file) and os.path.getsize(pdf_file) > 0:
        size_kb = os.path.getsize(pdf_file) / 1024
        print(f"SUCCESS: Student Guide PDF generated successfully! Size: {size_kb:.1f} KB")
        print(f"File path: {pdf_file}")
    else:
        print("Error generating PDF:", result.stderr)
        sys.exit(1)

if __name__ == "__main__":
    generate_pdf()
