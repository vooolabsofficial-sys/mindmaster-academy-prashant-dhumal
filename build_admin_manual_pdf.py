# -*- coding: utf-8 -*-
"""
MindMaster Academy Admin Master Manual PDF Generator
Compiles comprehensive Marathi administrator guide into print-ready A4 PDF.
"""

import os
import subprocess
import sys

HTML_CONTENT = """<!DOCTYPE html>
<html lang="mr">
<head>
  <meta charset="utf-8">
  <title>माइंडमास्टर अकॅडमी — मुख्य ॲडमिनिस्ट्रेटर मास्टर मॅन्युअल</title>
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
      background: linear-gradient(135deg, #0a192f 0%, #002b80 50%, #0052ff 100%);
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
    .cover-meta-item strong {
      color: #ffde59;
      display: block;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .cover-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.2);
      padding-top: 15px;
      font-size: 11px;
      color: #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    /* Document Layout */
    .page-header {
      border-bottom: 2px solid #0052ff;
      padding-bottom: 6px;
      margin-bottom: 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .page-header span.academy {
      color: #0052ff;
      font-weight: 800;
    }
    .page-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
      margin-top: 25px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9px;
      color: #94a3b8;
    }

    /* Headings */
    h1, h2, h3, h4 {
      color: #0f172a;
      break-after: avoid;
    }
    h2.chapter-title {
      font-size: 19px;
      font-weight: 800;
      color: #0040c7;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 6px;
      margin-top: 24px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    h2.chapter-title span.badge {
      background: #0052ff;
      color: #ffffff;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 6px;
      font-weight: 700;
    }
    h3.section-title {
      font-size: 15px;
      font-weight: 700;
      color: #1e3a8a;
      margin-top: 16px;
      margin-bottom: 8px;
    }
    h4.subsection-title {
      font-size: 13px;
      font-weight: 700;
      color: #334155;
      margin-top: 12px;
      margin-bottom: 6px;
    }

    /* Content Cards & Alert Boxes */
    .info-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 14px;
      margin-bottom: 14px;
    }
    .alert-box {
      border-radius: 8px;
      padding: 10px 14px;
      margin: 12px 0;
      font-size: 12px;
      line-height: 1.5;
    }
    .alert-danger {
      background: #fef2f2;
      border-left: 4px solid #ef4444;
      color: #991b1b;
    }
    .alert-warning {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      color: #92400e;
    }
    .alert-success {
      background: #f0fdf4;
      border-left: 4px solid #10b981;
      color: #065f46;
    }
    .alert-info {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      color: #1e40af;
    }

    /* Tables */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 11.5px;
    }
    table.data-table th, table.data-table td {
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
      text-align: left;
    }
    table.data-table th {
      background: #0f172a;
      color: #ffffff;
      font-weight: 700;
    }
    table.data-table tr:nth-child(even) {
      background: #f8fafc;
    }

    /* Steps List */
    ol.steps-list {
      margin: 8px 0;
      padding-left: 20px;
    }
    ol.steps-list li {
      margin-bottom: 6px;
    }
    ul.check-list {
      list-style-type: none;
      padding-left: 0;
      margin: 8px 0;
    }
    ul.check-list li {
      padding-left: 22px;
      position: relative;
      margin-bottom: 5px;
    }
    ul.check-list li::before {
      content: "✔";
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: bold;
    }

    /* Code & Syntax */
    .code-block {
      background: #0f172a;
      color: #38bdf8;
      font-family: Consolas, monospace;
      font-size: 11px;
      padding: 8px 12px;
      border-radius: 6px;
      margin: 8px 0;
      white-space: pre-wrap;
    }

    /* Page break helpers */
    .page-break {
      page-break-before: always;
    }
    .avoid-break {
      page-break-inside: avoid;
    }
  </style>
</head>
<body>

  <!-- ==================== मुखपृष्ठ (COVER PAGE) ==================== -->
  <div class="cover-page">
    <div>
      <div class="cover-badge">अधिकृत प्रशासक मार्गदर्शिका • २०२६</div>
      <h1 class="cover-title">माइंडमास्टर अकॅडमी</h1>
      <div class="cover-subtitle">मुख्य ॲडमिनिस्ट्रेटर मास्टर कार्यपद्धती मॅन्युअल (Admin Master Operations Manual)</div>
      <div class="cover-tagline">
        आंतरराष्ट्रीय मेमरी ट्रेनर <strong>प्रशांत धुमाळ सर</strong> यांच्या मार्गदर्शनाखालील सातारा फ्लॅगशिप मुख्यालय आणि पुणे शाखा प्रशासनासाठीचे परिपूर्ण मार्गदर्शक पुस्तक.
      </div>
    </div>

    <div>
      <div class="cover-meta">
        <div class="cover-meta-item">
          <strong>संस्था नाव:</strong> माइंडमास्टर अकॅडमी, सातारा
        </div>
        <div class="cover-meta-item">
          <strong>पोर्टल वेब लिंक:</strong> app.mindmasteredu.in/admin/login
        </div>
        <div class="cover-meta-item">
          <strong>अधिकार स्तर:</strong> मुख्य ॲडमिन (Main Admin MMA-000)
        </div>
        <div class="cover-meta-item">
          <strong>गोपनीयता दर्जा:</strong> अत्यंत गोपनीय (Strictly Confidential)
        </div>
      </div>

      <div class="cover-footer">
        <span>© २०२६ माइंडमास्टर अकॅडमी • सर्व हक्क राखीव.</span>
        <span>प्रमाणित कार्यपद्धती (ISO 9001:2015 Pedagogy)</span>
      </div>
    </div>
  </div>

  <!-- ==================== अनुक्रमणिका (TABLE OF CONTENTS) ==================== -->
  <div class="page-header">
    <span class="academy">माइंडमास्टर अकॅडमी</span>
    <span>प्रशासकीय कार्यपद्धती मॅन्युअल</span>
  </div>

  <h2 class="chapter-title"><span class="badge">विषयसूची</span> अनुक्रमणिका (Table of Contents)</h2>
  
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 12%;">प्रकरण</th>
        <th style="width: 60%;">प्रकरणाचे नाव व सविस्तर घटक</th>
        <th style="width: 28%;">संबंधित विभाग / URL</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>प्रकरण १</strong></td>
        <td><strong>ॲडमिन लॉगिन व सिक्युरिटी गेटवे</strong> — Staff ID, Argon2id पासवर्ड, रोल निवड व चुका निवारण</td>
        <td><code>/admin/login</code></td>
      </tr>
      <tr>
        <td><strong>प्रकरण २</strong></td>
        <td><strong>ॲडमिन टॉपबार टूल्स</strong> — ग्लोबल सर्च, डार्क मोड, सिस्टीम नोटिफिकेशन्स व सुरक्षित लॉगआऊट</td>
        <td>Admin Topbar</td>
      </tr>
      <tr>
        <td><strong>प्रकरण ३</strong></td>
        <td><strong>मुख्य डॅशबोर्ड व महसूल टॅली</strong> — ४ प्रमुख मॅट्रिक्स, ७-दिवसीय एक्स्पायरी व व्हॉट्सॲप स्मरणपत्र</td>
        <td><code>/admin</code></td>
      </tr>
      <tr>
        <td><strong>प्रकरण ४</strong></td>
        <td><strong>अभ्यासक्रम, व्हिडिओ व लायब्ररी</strong> — कोर्सेस बनवणे, युट्यूब Unlisted नियम, प्लेलिस्ट इम्पोर्ट व बुक्स</td>
        <td><code>/admin/courses, /videos, /notes</code></td>
      </tr>
      <tr>
        <td><strong>प्रकरण ५</strong></td>
        <td><strong>विद्यार्थी व्यवस्थापन व DRM</strong> — ३६०° शोध, प्रगती, सिंगल-डिव्हाइस लॉक रीसेट व पासवर्ड रीसेट</td>
        <td><code>/admin/students</code></td>
      </tr>
      <tr>
        <td><strong>प्रकरण ६</strong></td>
        <td><strong>मॅन्युअल ॲडमिशन, कोर्स देणे, काढणे व बदलणे</strong> — ४ पद्धती, Revoke Access, Swap Course</td>
        <td><code>/admin/grants</code></td>
      </tr>
      <tr>
        <td><strong>प्रकरण ७</strong></td>
        <td><strong>सवलत कूपन सिस्टीम</strong> — % किंवा ₹ सूट, फोन नंबर लॉक कूपन, शाळा टॅगिंग व ऑडिट तक्ता</td>
        <td><code>/admin/coupons</code></td>
      </tr>
      <tr>
        <td><strong>प्रकरण ८</strong></td>
        <td><strong>विद्यार्थी सपोर्ट व ब्रॉडकास्ट</strong> — थेट चॅट सपोर्ट, तिकीट सोडवणे व ॲप पुश नोटिफिकेशन्स</td>
        <td><code>/admin/messages</code></td>
      </tr>
      <tr>
        <td><strong>प्रकरण ९</strong></td>
        <td><strong>सब-ॲडमिन स्टाफ नेमणूक व नियंत्रण</strong> — नवीन सब-ॲडमिन, ७ अधिकार, प्रथम लॉगिन व पासवर्ड सेट, सस्पेंड/डिलीट, Freeze All</td>
        <td><code>/admin/sub-admins, /staff/login</code></td>
      </tr>
      <tr>
        <td><strong>प्रकरण १०</strong></td>
        <td><strong>सर्व तांत्रिक शक्यता व विद्यार्थ्याला कोर्स दिल्यानंतरचे प्रसंग</strong> — सर्व १२ प्रत्यक्ष प्रसंग व अचूक ॲडमिन निवारण तक्ता</td>
        <td>Emergency &amp; Troubleshooting</td>
      </tr>
      <tr>
        <td><strong>प्रकरण ११</strong></td>
        <td><strong>मास्टर सेटिंग्स, ब्रँडिंग व बॅकअप</strong> — प्रमाणपत्र सह्या, रेझरपे कीज, दर रविवारी JSON बॅकअप</td>
        <td><code>/admin/settings</code></td>
      </tr>
      <tr>
        <td><strong>प्रकरण १२</strong></td>
        <td><strong>मार्केटिंग वेबसाईट CMS</strong> — ऑफर बॅनर, हिरो व्हिडिओ, टेस्टिमोनियल्स व्यवस्थापन</td>
        <td><code>/admin/website-cms</code></td>
      </tr>
      <tr>
        <td><strong>प्रकरण १३</strong></td>
        <td><strong>सिस्टीम ऑडिट लॉग</strong> — प्रत्येक कृतीची तारीख, वेळ व कर्मचाऱ्याची कायमस्वरूपी नोंद</td>
        <td><code>/admin/audit</code></td>
      </tr>
      <tr>
        <td><strong>प्रकरण १४</strong></td>
        <td><strong>नेहमी होणाऱ्या ५ गंभीर चुका व उपाय</strong> — Do's and Don'ts तपासणी यादी</td>
        <td>Quality Control</td>
      </tr>
      <tr>
        <td><strong>प्रकरण १५</strong></td>
        <td><strong>सुरक्षित लॉगआऊट</strong> — सेशन समाप्ती व कुकी क्लिअरन्स</td>
        <td>Terminal Exit</td>
      </tr>
    </tbody>
  </table>

  <div class="alert-box alert-warning">
    <strong>⚠️ महत्त्वाचा सुरक्षा इशारा:</strong> हे मॅन्युअल फक्त माइंडमास्टर अकॅडमीच्या अधिकृत मुख्य प्रशासक आणि अधिकृत सब-ॲडमिन स्टाफसाठी आहे. यातील क्रेडेंशियल्स, बॅकअप पद्धती आणि सुरक्षा नियमावली बाहेरील कोणत्याही अनधिकृत व्यक्तीशी शेअर करू नये.
  </div>

  <div class="page-break"></div>

  <!-- ==================== प्रकरण १ व २ ==================== -->
  <div class="page-header">
    <span class="academy">माइंडमास्टर अकॅडमी</span>
    <span>प्रकरण १ व २: लॉगिन, सुरक्षा व टॉपबार</span>
  </div>

  <h2 class="chapter-title"><span class="badge">प्रकरण १</span> ॲडमिन लॉगिन व सिक्युरिटी गेटवे</h2>
  
  <div class="info-card">
    <strong>पोर्टल वेब लिंक:</strong> <code>https://app.mindmasteredu.in/admin/login</code><br>
    <strong>स्थानिक डेव्हलपमेंट पत्ता:</strong> <code>http://localhost:3000/admin/login</code>
  </div>

  <h3 class="section-title">१.१ लॉगिन करण्याची टप्प्याटप्प्याने पद्धत:</h3>
  <ol class="steps-list">
    <li>कोणत्याही ब्राउझरमध्ये (Google Chrome, Microsoft Edge किंवा Safari) <code>https://app.mindmasteredu.in/admin/login</code> उघडा.</li>
    <li>पानाच्या वर **'Executive (Main Admin)'** टॅब निवडलेला असल्याची खात्री करा.</li>
    <li>**Staff ID:** तुमचा मुख्य ॲडमिन आयडी टाका (उदा. <code>MMA-000</code>).</li>
    <li>**Password:** तुमचा सुरक्षित पासवर्ड टाका. पासवर्ड तपासायचा असल्यास उजवीकडील डोळ्याच्या चिन्हावर (Eye Icon) क्लिक करा.</li>
    <li>निळ्या रंगाचे **"Sign In to Console"** बटण दाबा.</li>
  </ol>

  <div class="alert-box alert-info">
    <strong>🔒 तांत्रिक सुरक्षा माहिती:</strong> माइंडमास्टर ॲपमध्ये पासवर्ड साध्या अक्षरात सेव्ह न होता <strong>Argon2id</strong> या जगातील सर्वोच्च एनक्रिप्शन अल्गोरिदमने सुरक्षित केला जातो. लॉगिन होताच ब्राऊझरमध्ये तात्पुरती एनक्रिप्टेड कुकी <code>mma_staff_session</code> तयार होते.
  </div>

  <h3 class="section-title">१.२ लॉगिन करताना होणाऱ्या सामान्य चुका व उपाय:</h3>
  <ul>
    <li>❌ <strong>"Authentication failed" एरर आल्यास:</strong> Staff ID मध्ये स्पेस नाही ना आणि पासवर्ड कॅप्स लॉक चालू नाही ना ते तपासा.</li>
    <li>❌ <strong>पासवर्ड विसरल्यास:</strong> <code>/staff/forgot-password</code> वर जा किंवा मुख्य डेटाबेस ॲडमिनिस्ट्रेटरशी संपर्क साधा.</li>
  </ul>

  <h3 class="section-title">१.३ मुख्य ॲडमिनचा पहिला लॉगिन व पासवर्ड सेट करणे (Initial Executive Setup):</h3>
  <div class="info-card" style="background: #f0fdf4; border-left-color: #16a34a;">
    <strong style="color: #166534;">🔑 सिस्टीम सुरू करताना पहिला मुख्य ॲडमिन लॉगिन कसा करावा?</strong>
    <ol class="steps-list" style="margin-top: 6px;">
      <li><strong>सुरुवातीचा डीफॉल्ट लॉगिन:</strong> डेव्हलपमेंट किंवा सिस्टीम लाँच वेळी दिलेला मुख्य Staff ID (उदा. <code>MMA-000</code>) आणि सुरुवातीचा डीफॉल्ट पासवर्ड वापरून <code>/admin/login</code> वर लॉगिन करा.</li>
      <li><strong>तात्काळ पासवर्ड बदलणे:</strong> पहिल्या लॉगिननंतर सुरक्षेसाठी लगेच उजव्या कोपऱ्यातील प्रोफाइल आयकॉनवर क्लिक करा किंवा <code>/staff/change-password</code> वर जा.</li>
      <li><strong>मजबूत पासवर्ड नियम:</strong> किमान ८ अक्षरे, कॅपिटल अक्षर, अंक व विशेष चिन्ह (उदा. <code>Mind@2026#Satara</code>) असा स्वतःचा गोपनीय पासवर्ड सेट करा.</li>
      <li><strong>कन्फर्म करा:</strong> पासवर्ड सेव्ह होताच सिस्टीममध्ये Argon2id एनक्रिप्शनने तो कायमचा सुरक्षित होतो. आता फक्त तुम्हीच हा पासवर्ड वापरून ॲडमिन कन्सोल उघडू शकाल.</li>
    </ol>
  </div>

  <hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 18px 0;">

  <h2 class="chapter-title"><span class="badge">प्रकरण २</span> ॲडमिन टॉपबार टूल्स (Admin Topbar Controls)</h2>
  
  <p>लॉगिन केल्यावर स्क्रीनवर कायम वरती दिसणारी निळी/पांढरी पट्टी (Topbar) खालीलप्रमाणे काम करते:</p>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 25%;">टूलचे नाव</th>
        <th style="width: 75%;">कसे वापरावे व त्याचे कार्य</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>१. ब्रँडिंग लोगो</strong></td>
        <td>डाव्या कोपऱ्यातील 'MindMaster Academy - SATARA FLAGSHIP HQ' वर क्लिक केल्यास कोणत्याही पाठावरून थेट मुख्य डॅशबोर्डवर जाता येते.</td>
      </tr>
      <tr>
        <td><strong>२. ग्लोबल सर्च बार</strong></td>
        <td>शॉर्टकट सर्च: यात विद्यार्थ्याचे नाव, १०-अंकी मोबाईल नंबर किंवा ईमेल टाईप करा; १ सेकंदात विद्यार्थ्याचा संपूर्ण प्रोफाईल इतिहास उघडतो.</td>
      </tr>
      <tr>
        <td><strong>३. थीम टॉगल (Light / Dark)</strong></td>
        <td>सूर्य/चंद्र चिन्हावर क्लिक करून रात्री डोळ्यांच्या संरक्षणासाठी डार्क मोड आणि दिवसा लाईट मोड चालू करता येतो.</td>
      </tr>
      <tr>
        <td><strong>४. सिस्टीम बेल नोटिफिकेशन्स</strong></td>
        <td>सब-ॲडमिनने पाठवलेल्या नवीन ॲडमिशन विनंत्या किंवा महत्त्वाच्या सिस्टीम नोटिसा येथे लाल ठिपक्यासह दिसतात.</td>
      </tr>
      <tr>
        <td><strong>५. प्रोफाइल व डायरेक्ट लॉगआऊट</strong></td>
        <td>उजव्या कोपऱ्यात ॲडमिनच्या नावावर क्लिक करून **"Log Out"** बटण दाबून एका सेकंदात सुरक्षितपणे बाहेर पडता येते.</td>
      </tr>
    </tbody>
  </table>

  <div class="page-break"></div>

  <!-- ==================== प्रकरण ३ व ४ ==================== -->
  <div class="page-header">
    <span class="academy">माइंडमास्टर अकॅडमी</span>
    <span>प्रकरण ३ व ४: डॅशबोर्ड व अभ्यासक्रम व्यवस्थापन</span>
  </div>

  <h2 class="chapter-title"><span class="badge">प्रकरण ३</span> मुख्य डॅशबोर्ड व महसूल टॅली (`/admin`)</h2>
  
  <h3 class="section-title">३.१ चार प्रमुख सांख्यिकी कार्डे (Live Metric Cards):</h3>
  <ol class="steps-list">
    <li><strong>एकूण ॲक्टिव्ह विद्यार्थी (Active Students):</strong> चालू कोर्स असलेले वैध विद्यार्थी (कोणत्याही खोट्या डमी आकड्यांशिवाय).</li>
    <li><strong>एकूण महसूल (Total Revenue ₹):</strong> ऑनलाइन रेझरपे पेमेंट + मॅन्युअल रोख (Cash) व थेट UPI कलेक्शनची बेरीज. टाइमफिल्टर: Today, This Week, This Month.</li>
    <li><strong>एक्स्पायरी यादी (Expiring in 7 Days):** पुढील आठवड्यात ज्यांचा कोर्स संपणार आहे अशा विद्यार्थ्यांची संख्या.</li>
    <li><strong>सक्रिय अभ्यासक्रम (Active Courses):</strong> अकॅडमीतील विक्रीसाठी उपलब्ध सर्व कोर्सेस.</li>
  </ol>

  <h3 class="section-title">३.२ मुदत संपत आलेल्या विद्यार्थ्यांना व्हॉट्सॲप स्मरणपत्र पाठवणे:</h3>
  <p>तक्त्यामध्ये विद्यार्थ्याच्या नावापुढील <strong>"Send Reminder"</strong> बटण दाबताच त्याच्या व्हॉट्सॲपवर अधिकृत संदेश जातो:</p>
  <div class="code-block">"नमस्कार [विद्यार्थ्याचे नाव], माइंडमास्टर अकॅडमीच्या [कोर्सचे नाव] या कोर्सची मुदत पुढील ३ दिवसांत संपत आहे. आपला अभ्यास अखंड चालू ठेवण्यासाठी खालील लिंकवरून रिन्यू करा..."</div>

  <hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 18px 0;">

  <h2 class="chapter-title"><span class="badge">प्रकरण ४</span> अभ्यासक्रम, व्हिडिओ व डिजिटल बुक्स व्यवस्थापन</h2>

  <h3 class="section-title">४.१ नवीन कोर्स कसा तयार करावा? (`/admin/courses`):</h3>
  <ol class="steps-list">
    <li><code>/admin/courses</code> वर जाऊन <strong>"+ Create New Course"</strong> बटण दाबा.</li>
    <li><strong>Course Title:</strong> कोर्सचे नाव (उदा. <code>Superfast Vedic Maths Mastery</code>).</li>
    <li><strong>Course Code:</strong> २ ते ६ अक्षरी युनिक कोड (उदा. <code>VM-01</code>, <code>MM-02</code>).</li>
    <li><strong>Category:</strong> <code>Vedic Maths</code>, <code>Memory Training</code>, <code>500-Year Calendar</code>.</li>
    <li><strong>Pricing (फी रचना):</strong> Original Price (उदा. ₹२,९९९) आणि Offer Price (उदा. ₹१,४९९).</li>
    <li><strong>Thumbnail Image:</strong> पोस्टर किंवा कव्हर फोटो अपलोड करा.</li>
    <li><strong>Status:</strong> 'Published' (ॲपवर सर्वांना दिसेल) किंवा 'Draft' (फक्त ॲडमिनला दिसेल).</li>
    <li><strong>"Save Course"</strong> दाबा.</li>
  </ol>

  <h3 class="section-title">४.२ व्हिडिओ धडे जोडणे व युट्यूब Unlisted चा कडक नियम (`/admin/videos`):</h3>
  <div class="alert-box alert-danger">
    <strong>🚨 अतिमहत्त्वाचा युट्यूब नियम (Unlisted Video Rule):</strong><br>
    युट्यूब स्टुडिओमध्ये व्हिडिओ अपलोड करताना तो नेहमी <strong>"Unlisted"</strong> म्हणूनच सेव्ह करा!<br>
    • <strong>Public ठेवल्यास:</strong> व्हिडिओ युट्यूबवर कोणीही मोफत सर्च करून पाहू शकेल (पायरेसी होईल).<br>
    • <strong>Private ठेवल्यास:</strong> आपल्या ॲपमधील विद्यार्थ्यांना व्हिडिओ दिसणार नाही (Video Unavailable एरर येईल).<br>
    • <strong>Unlisted ठेवल्यास:</strong> फक्त आपल्या माइंडमास्टर ॲपमधूनच सुरक्षितपणे व्हिडिओ प्ले होईल.
  </div>

  <ol class="steps-list">
    <li>ड्रॉपडाउनमधून कोर्स निवडा आणि <strong>"+ Add New Video Lesson"</strong> दाबा.</li>
    <li><strong>Lesson Number:</strong> धड्याचा क्रमांक टाका (उदा. धडा १, २, ३).</li>
    <li><strong>Lesson Title:</strong> धड्याचे नाव मराठी किंवा इंग्रजीत लिहा.</li>
    <li><strong>YouTube Video ID:</strong> युट्यूब लिंकमधील ११ अक्षरी आयडी टाका (उदा. <code>https://www.youtube.com/watch?v=AbCdEf12345</code> मधील <code>AbCdEf12345</code>).</li>
    <li><strong>Duration:</strong> व्हिडिओ किती मिनिटांचा आहे ते टाका (उदा. २५ मिनिटे).</li>
    <li><strong>मोफत डेमो टॉगल (Free Demo Preview):</strong> जर हा पहिला धडा खरेदी न केलेल्या विद्यार्थ्यांनाही फ्रीमध्ये दाखवायचा असेल, तर हे टॉगल <strong>ON</strong> करा.</li>
    <li><strong>"Save Lesson"</strong> दाबा.</li>
  </ol>

  <h3 class="section-title">४.३ युट्यूब प्लेलिस्ट एका क्लिकवर इम्पोर्ट करणे (`/admin/playlist`):</h3>
  <p>युट्यूब प्लेलिस्टची URL पेस्ट करा -> <strong>"Fetch Playlist"</strong> दाबा -> कोर्स निवडा -> <strong>"Bulk Import All Lessons"</strong> दाबा. २०-३० व्हिडिओ सेकंदात ॲपमध्ये सेव्ह होतात!</p>

  <h3 class="section-title">४.४ ई-बुक्स व डिजिटल नोट्स अपलोड (`/admin/notes`):</h3>
  <p>पुस्तकाचे नाव, लेखक, कोर्स निवडा आणि PDF फाईल अपलोड करा. <strong>"In-App Reader Only"</strong> पर्याय निवडल्यास विद्यार्थी ॲपमध्येच पुस्तक वाचू शकतील, बाहेर डाऊनलोड किंवा लीक करू शकणार नाहीत.</p>

  <div class="page-break"></div>

  <!-- ==================== प्रकरण ५ व ६ ==================== -->
  <div class="page-header">
    <span class="academy">माइंडमास्टर अकॅडमी</span>
    <span>प्रकरण ५ व ६: विद्यार्थी, DRM अनलॉक व कोर्स देणे/काढणे</span>
  </div>

  <h2 class="chapter-title"><span class="badge">प्रकरण ५</span> विद्यार्थी व्यवस्थापन व DRM डिव्हाइस लॉक (`/admin/students`)</h2>

  <h3 class="section-title">५.१ सिंगल-डिव्हाइस लॉक रीसेट (Reset Device Lock - सर्वात महत्त्वाचे!):</h3>
  <div class="info-card">
    <strong>समस्या का येते?</strong> पायरेसी रोखण्यासाठी ॲपमध्ये एका विद्यार्थ्याला एकाच फोनमध्ये ॲप चालवता येते. जर विद्यार्थ्याने नवीन मोबाईल खरेदी केला, किंवा पालकांचा दुसरा फोन वापरला, तर त्याला <em>"Your account is locked to another device"</em> असा एरर येतो.
  </div>

  <div class="alert-box alert-success">
    <strong>ॲडमिनने काय करावे? (फक्त १ सेकंदाचे काम):</strong>
    <ol class="steps-list" style="margin-top: 5px;">
      <li><code>/admin/students</code> वर जाऊन विद्यार्थ्याचा १०-अंकी मोबाईल नंबर सर्च करा.</li>
      <li>विद्यार्थ्याच्या नावापुढील <strong>"Reset Device Lock" (किंवा Unlock Phone)</strong> या बटणावर क्लिक करा.</li>
      <li>कन्फर्म करा. जुन्या फोनचे बंधन तात्काळ निघून जाईल आणि विद्यार्थी नवीन फोनवर लगेच लॉगिन करू शकेल!</li>
    </ol>
  </div>

  <h3 class="section-title">५.२ विद्यार्थ्याचा पासवर्ड रीसेट करणे (Reset PIN):</h3>
  <p>विद्यार्थी ४-अंकी पिन विसरल्यास <strong>"Reset Password"</strong> वर क्लिक करून तात्पुरता पिन (उदा. <code>1234</code>) सेट करा.</p>

  <h3 class="section-title">५.३ विद्यार्थ्याचा संपूर्ण व्यवहार इतिहास व अधिकृत फी पावती (Fee Receipts & Payment Ledger):</h3>
  <div class="info-card" style="background: #eff6ff; border-left-color: #2563eb;">
    <strong style="color: #1e40af;">💳 विद्यार्थ्याच्या सर्व ऑनलाईन व ऑफलाईन व्यवहारांची तपासणी:</strong>
    <p style="margin-top: 5px; font-size: 12px; color: #334155;">
      <code>/admin/students</code> मध्ये विद्यार्थ्याच्या नावावर क्लिक केल्यावर उघडणाऱ्या <strong>Student 360 Drawer</strong> मध्ये चौथा टॅब <strong>"Receipts & Fees"</strong> जोडला आहे:
    </p>
    <ul class="check-list" style="margin-top: 6px;">
      <li><strong>एकत्रित लेजर (Unified Ledger):</strong> विद्यार्थ्याने रेझरपे/UPI द्वारे केलेले ऑनलाईन पेमेंट किंवा केंद्रावर दिलेली रोख फी/हप्ता या सर्वांची अचूक नोंद येथे एकत्र दिसते.</li>
      <li><strong>१-क्लिक A4 फी पावती PDF:</strong> <strong>"Download PDF Receipt"</strong> वर क्लिक करताच अधिकृत क्रमांक (उदा. <code>REC-VEDIC-8492</code>), विद्यार्थ्याचे नाव, फोन, भरलेली फी आणि प्रशांत सरांच्या स्वाक्षरीसह A4 पावती जनरेट होते.</li>
      <li><strong>थेट व्हॉट्सॲप शेअर:</strong> <strong>"Share to WhatsApp"</strong> बटनाने पालकांच्या व्हॉट्सॲपवर फी पावतीचा अधिकृत मेसेज एका सेकंदात पाठवता येतो.</li>
      <li><strong>विद्यार्थी स्वतःही पावती घेऊ शकतो:</strong> विद्यार्थ्याला त्याच्या <code>/profile</code> मधील <em>"माझे कोर्सेस, व्यवहार व फी पावत्या"</em> आणि <code>/my-courses</code> मधील <em>"फी पावत्या"</em> टॅबमधून कधीही स्वतःची पावती डाऊनलोड करता येते.</li>
    </ul>
  </div>

  <hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 18px 0;">

  <h2 class="chapter-title"><span class="badge">प्रकरण ६</span> मॅन्युअल ॲडमिशन, कोर्स देणे, काढणे व बदलणे (Grant, Revoke & Swap)</h2>

  <h3 class="section-title">६.१ विद्यार्थ्याला कोर्स देण्याच्या सर्व ४ पद्धती (How to Give Course):</h3>
  
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 25%;">पद्धत</th>
        <th style="width: 75%;">कृती व वापराचे प्रसंग</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>१. स्वयंचलित ऑनलाइन (Razorpay)</strong></td>
        <td>विद्यार्थी स्वतः ॲपमधून पैसे भरतो; वेबहूकद्वारे सेकंदात कोर्स चालू होतो. ॲडमिनला काहीही करावे लागत नाही.</td>
      </tr>
      <tr>
        <td><strong>२. एकल मॅन्युअल ॲडमिशन (`/admin/grants`)</strong></td>
        <td>सेमिनारमध्ये रोख फी किंवा फोनपे/गुगलपे वर पैसे आल्यास: <strong>"+ Grant Direct Admission"</strong> दाबा -> विद्यार्थ्याचा १०-अंकी फोन टाका -> कोर्स निवडा -> मुदत निवडा (१ महिना ते Lifetime) -> पेमेंट पद्धत (Cash/UPI/Scholarship) निवडा -> <strong>"Issue Course Grant"</strong> दाबा.</td>
      </tr>
      <tr>
        <td><strong>३. सेमिनार बल्क ॲडमिशन (CSV Batch)</strong></td>
        <td>सेमिनारमधील ५०-१०० विद्यार्थ्यांना एकाच वेळी प्रवेश देण्यासाठी: <code>/admin/grants</code> मधील <strong>"Bulk Grants"</strong> दाबा. फोन, नाव, कोर्सकोड, महिने, फी असा डेटा पेस्ट करून ५ सेकंदात सर्वांना ॲक्सेस द्या.</td>
      </tr>
      <tr>
        <td><strong>४. स्टुडंट ड्रॉवरमधून देणे (`/admin/students`)</strong></td>
        <td>विद्यार्थ्याचा फोन सर्च करा -> <strong>"+ Enroll New Course"</strong> बटण दाबून थेट नवीन कोर्स चालू करा.</td>
      </tr>
    </tbody>
  </table>

  <h3 class="section-title">६.२ विद्यार्थ्याचा कोर्स कसा काढावा? (How to Revoke Course):</h3>
  <ol class="steps-list">
    <li><code>/admin/students</code> वर जाऊन विद्यार्थ्याचा १०-अंकी फोन नंबर सर्च करा.</li>
    <li>विद्यार्थ्याच्या नावावर क्लिक करून <strong>Student 360 Drawer</strong> उघडा.</li>
    <li>Enrolled Courses यादीमध्ये ज्या कोर्सचा ॲक्सेस काढायचा आहे, त्यासमोरील लाल रंगाचे <strong>"Revoke Access" (कचऱ्याची कुंडी)</strong> दाबा.</li>
    <li><strong>अनिवार्य कारण लिहा (Mandatory Reason):</strong> ॲकॅडमीच्या सुरक्षिततेसाठी कारण विचारले जाते (उदा. <em>"पालकांनी फी परतावा मागितला"</em> किंवा <em>"चुकीचा कोर्स लागला होता"</em>).</li>
    <li><strong>Confirm Revoke</strong> दाबताच विद्यार्थ्याच्या ॲपमधून तो कोर्स तात्काळ लॉक होतो आणि ऑडिट लॉगमध्ये नोंद होते.</li>
  </ol>

  <h3 class="section-title">६.३ चुकीचा कोर्स बदलून दुसरा कसा द्यावा? (Course Swap):</h3>
  <p>विद्यार्थ्याला 'वैदिक मॅथ्स' ऐवजी चुकून 'मेमरी' दिला असेल, तर जुना कोर्स रद्द करण्याऐवजी ड्रॉवरमधील <strong>"Swap Course"</strong> बटण दाबा -> जुना कोर्स व नवीन कोर्स निवडा -> <strong>"Confirm Swap"</strong> दाबा. विद्यार्थ्याचा आयडी आणि प्रोग्रेस सुरक्षित राहून कोर्स सेकंदात बदलला जातो!</p>

  <div class="page-break"></div>

  <!-- ==================== प्रकरण ७ व ८ ==================== -->
  <div class="page-header">
    <span class="academy">माइंडमास्टर अकॅडमी</span>
    <span>प्रकरण ७ व ८: कूपन सिस्टीम, सपोर्ट व ब्रॉडकास्ट</span>
  </div>

  <h2 class="chapter-title"><span class="badge">प्रकरण ७</span> सवलत कूपन सिस्टीम (Coupon Engine - `/admin/coupons`)</h2>

  <h3 class="section-title">७.१ नवीन कूपन तयार करतानाचे सर्व ऑप्शन्स:</h3>
  
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 30%;">पर्याय (Field Name)</th>
        <th style="width: 70%;">काय माहिती भरावी व त्याचा तांत्रिक नियम</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Coupon Code</strong></td>
        <td>नेहमी कॅपिटल अक्षरे (उदा. <code>DIWALI50</code>, <code>SATARA20</code>, <code>TEACHER100</code>).</td>
      </tr>
      <tr>
        <td><strong>Discount Type & Value</strong></td>
        <td><strong>Percentage (%)</strong> (उदा. ५०% सूट) किंवा <strong>Flat Amount (₹)</strong> (उदा. ₹५०० थेट सूट).</td>
      </tr>
      <tr>
        <td><strong>Minimum Order Value</strong></td>
        <td>सूट मिळण्यासाठी कार्टचे किमान मूल्य किती असावे (उदा. ₹९९९ च्या खरेदीवरच चालेल).</td>
      </tr>
      <tr>
        <td><strong>Public Checkout Chip</strong></td>
        <td><strong>ON (होय):</strong> चेकआऊट स्क्रीनवर सर्व विद्यार्थ्यांना दिसेल. <strong>OFF (नाही):</strong> गुप्त राहील; ज्याला कोड द्याल त्याने टाईप केल्यावरच सूट मिळेल.</td>
      </tr>
      <tr>
        <td><strong>Applicability</strong></td>
        <td><strong>All Courses:</strong> सर्व कोर्सेसवर लागू होईल. <strong>Specific Courses:</strong> फक्त निवडलेल्या कोर्सेसवरच चालेल.</td>
      </tr>
      <tr>
        <td><strong>Student Phone Lock (अतिशय खास)</strong></td>
        <td>यात विद्यार्थ्याचा १०-अंकी नंबर टाकल्यास <strong>फक्त आणि फक्त तोच विद्यार्थी ते कूपन वापरू शकेल.</strong> इतर कोणी टाकल्यास अमान्य होईल.</td>
      </tr>
      <tr>
        <td><strong>School / College Tag</strong></td>
        <td>विशिष्ट शाळा/कॉलेजसाठी कूपन (उदा. <code>KBP College Satara</code>) जेणेकरून त्या संस्थेचे रिपोर्ट समजतात.</td>
      </tr>
      <tr>
        <td><strong>Per-User Limit</strong></td>
        <td><code>Once per student</code> (एका विद्यार्थ्याला १ दाच वापरता येईल) किंवा <code>Multiple times</code>.</td>
      </tr>
      <tr>
        <td><strong>Validity Dates</strong></td>
        <td>सुरू होण्याची आणि संपण्याची अचूक तारीख (मुदत संपताच कूपन आपोआप बंद होते).</td>
      </tr>
      <tr>
        <td><strong>Usage Limit</strong></td>
        <td>एकूण किती विद्यार्थी हे कूपन वापरू शकतात (उदा. पहिल्या १०० विद्यार्थ्यांसाठी).</td>
      </tr>
    </tbody>
  </table>

  <h3 class="section-title">७.२ कूपन वापर तक्ता व ऑडिट (Redemptions Log):</h3>
  <p>प्रत्येक कूपनच्या समोरील <strong>"View Uses" (डोळ्याचा आयकॉन)</strong> दाबा. कोणत्या विद्यार्थ्याने (नाव व फोन), कोणत्या तारखेला, किती वाजता, कोणता कोर्स खरेदी करताना कूपन वापरले आणि किती रुपयांची सूट मिळाली याचा संपूर्ण हिशोब समोर येतो व एक्सेलमध्ये एक्सपोर्ट होतो.</p>

  <hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 18px 0;">

  <h2 class="chapter-title"><span class="badge">प्रकरण ८</span> विद्यार्थी सपोर्ट, मेसेजिंग व ब्रॉडकास्ट नोटिफिकेशन्स</h2>

  <h3 class="section-title">८.१ थेट सपोर्ट चॅट (`/admin/messages`):</h3>
  <ol class="steps-list">
    <li>विद्यार्थ्याने ॲपमधील 'Support' वरून पाठवलेले प्रश्न <code>/admin/messages</code> वर दिसतात.</li>
    <li>ॲडमिन थेट चॅटमध्ये उत्तर टाईप करू शकतो.</li>
    <li>अडचण सोडवल्यावर <strong>"Mark Ticket as Resolved"</strong> बटण दाबा.</li>
  </ol>

  <h3 class="section-title">८.२ ॲप ब्रॉडकास्ट नोटीस (Push Alert Notification):</h3>
  <p>सर्व विद्यार्थ्यांना एकाच वेळी मोबाईलवर स्क्रोलिंग मेसेज किंवा अलर्ट पाठवण्यासाठी:</p>
  <ol class="steps-list">
    <li><code>/admin/students</code> वरून <strong>"Broadcast Notification"</strong> बटण दाबा.</li>
    <li><strong>Title:</strong> सूचनेचा मथळा (उदा. <code>रविवार विशेष मेमरी लाईव्ह क्लास</code>).</li>
    <li><strong>Message:</strong> संपूर्ण संदेश लिहा (उदा. <em>"सर्व विद्यार्थ्यांनी रविवारी सकाळी १०:०० वाजता ॲपमध्ये उपस्थित राहावे. प्रशांत सर मार्गदर्शन करतील."</em>).</li>
    <li><strong>Target:</strong> All Students किंवा विशिष्ट कोर्स निवडा -> <strong>"Send Notification Now"</strong> दाबा. सर्व विद्यार्थ्यांच्या फोनवर सेकंदात मेसेज उमटेल!</li>
  </ol>

  <div class="page-break"></div>

  <!-- ==================== प्रकरण ९ ==================== -->
  <div class="page-header">
    <span class="academy">माइंडमास्टर अकॅडमी</span>
    <span>प्रकरण ९: सब-ॲडमिन स्टाफ नेमणूक, प्रथम लॉगिन व नियंत्रण</span>
  </div>

  <h2 class="chapter-title"><span class="badge">प्रकरण ९</span> सब-ॲडमिन स्टाफ नेमणूक, अधिकार व नियंत्रण (`/admin/sub-admins`)</h2>

  <h3 class="section-title">९.१ नवीन सब-ॲडमिन कसा बनवायचा? (How to Create Sub-Admin):</h3>
  <ol class="steps-list">
    <li><code>/admin/sub-admins</code> वर जाऊन <strong>"+ Add Sub-Admin Staff"</strong> दाबा.</li>
    <li><strong>नाव व आयडी:</strong> पूर्ण नाव, मोबाईल नंबर, अधिकृत ईमेल आणि केंद्र (Satara / Pune).</li>
    <li><strong>Approval Mode Toggle:</strong> हे ON ठेवल्यास सब-ॲडमिनने दिलेल्या ऑफलाइन ॲडमिशनला मुख्य ॲडमिनने मंजूर केल्याशिवाय कोर्स सुरू होणार नाही. (नवीन कर्मचाऱ्यांसाठी हे चालू ठेवावे).</li>
    <li><strong>७ स्वतंत्र अधिकारांची निवड (Permission Matrix):</strong>
      <ul class="check-list" style="margin-top: 5px;">
        <li><code>students.view</code> — विद्यार्थी शोधणे व DRM फोन लॉक अनलॉक करणे.</li>
        <li><code>messages.manage</code> — सपोर्ट मेसेजची उत्तरे देणे.</li>
        <li><code>freegrant.manage</code> — ऑफलाइन रोख/UPI फी घेऊन ॲडमिशन देणे.</li>
        <li><code>courses.manage</code> — व्हिडिओ व कोर्सेस बदलणे (फक्त वरिष्ठ शिक्षकांना द्यावे).</li>
        <li><code>notes.books.manage</code> — पुस्तके व नोट्स अपलोड करणे.</li>
        <li><code>coupons.manage</code> — सवलत कूपन्स बनवणे.</li>
        <li><code>reports.view</code> — अकॅडमीचे बँक खाते व महसूल पाहणे.</li>
      </ul>
    </li>
    <li><strong>"Create Staff Account"</strong> दाबा आणि <strong>"Copy to WhatsApp"</strong> दाबून कर्मचाऱ्याला क्रेडेंशियल्स पाठवा.</li>
  </ol>

  <h3 class="section-title">९.२ नवीन सब-ॲडमिनने प्रथमच लॉगिन कसे करावे व स्वतःचा पासवर्ड कसा सेट करावा? (First Login Workflow):</h3>
  <div class="info-card" style="background: #f0fdf4; border-left-color: #16a34a;">
    <strong style="color: #166534; font-size: 13.5px;">🔐 नवीन सब-ॲडमिनचा पहिला लॉगिन व पासवर्ड बदलण्याचा अचूक प्रवास:</strong>
    <ol class="steps-list" style="margin-top: 8px;">
      <li><strong>क्रेडेंशियल्स मिळणे:</strong> मुख्य ॲडमिनकडून कर्मचाऱ्याला व्हॉट्सॲपवर त्याचा <strong>Staff ID</strong> (उदा. <code>MMA-002</code>) आणि <strong>तात्पुरता पासवर्ड</strong> (उदा. <code>StaffTemp#2026</code>) मिळतो.</li>
      <li><strong>लॉगिन स्क्रीनवर जाणे:</strong> कर्मचाऱ्याने मोबाईल किंवा लॅपटॉपवर <code>https://app.mindmasteredu.in/staff/login</code> (किंवा <code>mindmasteredu.in/staff</code>) उघडावे.</li>
      <li><strong>तात्पुरता लॉगिन:</strong> आपला Staff ID व मिळालेला तात्पुरता पासवर्ड टाकून <strong>"Sign In"</strong> दाबावे.</li>
      <li><strong>अनिवार्य पासवर्ड रिसेट स्क्रीन:</strong> सिस्टीम तात्काळ ओळखते की हा पहिला लॉगिन आहे (<code>must_change_password: true</code>) आणि कर्मचाऱ्याला थेट <code>/staff/change-password</code> पानावर पाठवते. जुन्या पासवर्डने इतर कोणतेही पान उघडता येत नाही!</li>
      <li><strong>नवीन पासवर्डचे नियम:</strong> कर्मचाऱ्याने सध्याचा तात्पुरता पासवर्ड टाकावा, त्यानंतर आपला नवीन स्वतःचा गोपनीय पासवर्ड टाकावा (किमान ८ अक्षरे, १ अंक आणि १ विशेष चिन्ह जसे <code>@, #, $</code>).</li>
      <li><strong>"Save &amp; Activate Staff Account"</strong> दाबताच पासवर्ड सिस्टीममध्ये एनक्रिप्ट होऊन कायमचा सेव्ह होतो आणि सब-ॲडमिनचा डॅशबोर्ड उघडतो.</li>
      <li><strong>दैनंदिन लॉगिन:</strong> दुसऱ्या दिवसापासून कर्मचाऱ्याने <code>/staff/login</code> वर नेहमी स्वतःच्या या नवीन पासवर्डने लॉगिन करावे. जर त्याने त्याच्या अधिकाराबाहेरील पानावर जाण्याचा प्रयत्न केला, तर सिस्टीम <strong>"403 Forbidden - Access Denied"</strong> चा स्क्रीन दाखवून सुरक्षित ठेवते.</li>
    </ol>
  </div>

  <h3 class="section-title">९.३ सब-ॲडमिनला कसे काढावे किंवा बंद करावे? (Remove / Deactivate):</h3>
  <ul>
    <li><strong>पद्धत १: तात्पुरते सस्पेंड करणे (Suspend):</strong> कर्मचाऱ्याच्या नावापुढील पिवळे <strong>"Suspend"</strong> बटण दाबा. त्याचा ॲक्सेस १ सेकंदात ब्लॉक होईल. पुन्हा कामावर आल्यावर "Activate" करता येईल.</li>
    <li><strong>पद्धत २: कायमस्वरूपी काढून टाकणे (Permanent Delete):</strong> लाल रंगाचे <strong>"Delete"</strong> आयकॉन दाबा आणि कन्फर्म करा. त्याचे सर्व लॉगिन कायमचे नष्ट होईल.</li>
    <li><strong>पद्धत ३: इमर्जन्सी किक-आऊट (Freeze All Sub-Admins):</strong> संशय आल्यास पानावरील <strong>"Freeze All Sub-Admins"</strong> हे लाल बटण दाबा. अकॅडमीचे सर्व सब-ॲडमिन १ सेकंदात सस्पेंड होतील; फक्त मुख्य ॲडमिन (प्रशांत सर) लॉगिन राहतील!</li>
    <li><strong>रोख फी जमा करणे (Cash Settlement):</strong> सब-ॲडमिनने गोळा केलेली रोख रक्कम मुख्य ॲडमिनकडे दिल्यावर <strong>"Mark Cash Settled"</strong> दाबा.</li>
  </ul>

  <div class="page-break"></div>

  <!-- ==================== प्रकरण १० ==================== -->
  <div class="page-header">
    <span class="academy">माइंडमास्टर अकॅडमी</span>
    <span>प्रकरण १०: सर्व तांत्रिक शक्यता व विद्यार्थ्याला कोर्स दिल्यानंतरचे प्रसंग</span>
  </div>

  <h2 class="chapter-title"><span class="badge">प्रकरण १०</span> सर्व बाजूंच्या तांत्रिक शक्यता व विद्यार्थ्याला कोर्स दिल्यानंतरचे सर्व १२ प्रत्यक्ष प्रसंग (Troubleshooting Matrix)</h2>

  <p style="margin-bottom: 12px; font-size: 12.5px; color: #475569;">
    अकॅडमी चालवताना विद्यार्थ्याला कोर्स दिल्यानंतर उद्भवू शकणाऱ्या सर्व प्रकारच्या अडचणी, तांत्रिक प्रसंग व ॲडमिन निवारण कृती:
  </p>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 5%;">क्र.</th>
        <th style="width: 32%;">संभाव्य प्रसंग / विद्यार्थ्याची अडचण</th>
        <th style="width: 63%;">ॲडमिनने काय करावे? (अचूक निवारण कृती)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>१</strong></td>
        <td><strong>कोर्स दिला पण विद्यार्थ्याच्या ॲपमध्ये दिसत नाही</strong></td>
        <td><strong>मोबाईल नंबर तपासा:</strong> <code>/admin/students</code> मध्ये विद्यार्थ्याचा नंबर तपासा. जर नंबर अगदी बरोबर असेल, तर विद्यार्थ्याला ॲपमधील <em>'My Courses'</em> पानावर वरून खाली ओढून (Pull-to-refresh) किंवा ॲप रीस्टार्ट करण्यास सांगा.</td>
      </tr>
      <tr>
        <td><strong>२</strong></td>
        <td><strong>व्हिडिओ प्ले करताना काळी स्क्रीन किंवा "Video Unavailable"</strong></td>
        <td><strong>युट्यूब प्रायव्हसी तपासा:</strong> व्हिडिओ युट्यूबवर <strong>Private</strong> राहिला असल्यास हा एरर येतो. युट्यूब स्टुडिओमध्ये जाऊन तो <strong>Unlisted</strong> करा. एका सेकंदात सर्व विद्यार्थ्यांच्या ॲपमध्ये व्हिडिओ सुरू होईल.</td>
      </tr>
      <tr>
        <td><strong>३</strong></td>
        <td><strong>१००% कोर्स पूर्ण केला पण प्रमाणपत्र (Certificate) Claim होत नाही</strong></td>
        <td><strong>शेवटचे सेकंद शिल्लक:</strong> विद्यार्थ्याने एखादा व्हिडिओ शेवटचे २-३ सेकंद शिल्लक असताना बंद केला असल्यास प्रगती ९९% अडकते. त्याला तो व्हिडिओ १ मिनिट पुन्हा प्ले करण्यास सांगा किंवा ॲडमिन <code>/admin/students</code> मधील ड्रॉवरमधून <strong>"Mark 100% Complete"</strong> करू शकतो.</td>
      </tr>
      <tr>
        <td><strong>४</strong></td>
        <td><strong>प्रमाणपत्रावर विद्यार्थ्याच्या नावात स्पेलिंगची चूक झाली</strong></td>
        <td><strong>इन्स्टंट री-जनरेट:</strong> <code>/admin/students</code> वर जाऊन विद्यार्थ्याच्या नावापुढील <strong>'Edit'</strong> दाबा. अचूक नाव टाईप करून सेव्ह करा. जुने प्रमाणपत्र आपोआप रद्द होऊन नवीन अचूक स्पेलिंगचे PDF प्रमाणपत्र त्वरित तयार होते.</td>
      </tr>
      <tr>
        <td><strong>५</strong></td>
        <td><strong>विद्यार्थ्याने नवीन मोबाईल घेतला / "Device Lock" एरर</strong></td>
        <td><strong>१-क्लिक DRM अनलॉक:</strong> अँटी-पायरेसीमुळे जुना फोन लॉक असतो. <code>/admin/students</code> मध्ये विद्यार्थ्याच्या नावापुढील हिरवे <strong>"Reset Device Lock"</strong> बटण दाबा. विद्यार्थी नवीन फोनमध्ये लगेच लॉगिन करू शकेल.</td>
      </tr>
      <tr>
        <td><strong>६</strong></td>
        <td><strong>एकाच घरात दोन मुले, फोन एकच आणि २ वेगवेगळे कोर्सेस हवे आहेत</strong></td>
        <td><strong>मल्टी-कोर्स सपोर्ट:</strong> सिस्टीम एका मोबाईलवर अनेक कोर्सेसना पूर्णपणे सपोर्ट करते. <code>/admin/grants</code> वरून त्याच नंबरवर दुसरा कोर्स ॲक्टिव्हेट करा. दोघांची प्रगती व प्रमाणपत्रे वेगवेगळी राहतील.</td>
      </tr>
      <tr>
        <td><strong>७</strong></td>
        <td><strong>३ महिन्यांची मुदत संपली आणि व्हिडिओ लॉक झाले (Course Expired)</strong></td>
        <td><strong>२ पर्याय:</strong> १) जर विद्यार्थ्याला मुदत वाढवून द्यायची असेल तर <code>/admin/grants</code> मधून <strong>"Extend Access (1 Month / 3 Months)"</strong> दाबा. २) किंवा ५०% सवलतीचे कूपन तयार करून त्याला ॲपमधून रिन्यू करण्यास सांगा.</td>
      </tr>
      <tr>
        <td><strong>८</strong></td>
        <td><strong>विद्यार्थ्याने हप्त्याने फी भरली (Partial Installment Payment)</strong></td>
        <td><strong>बाकी फी नोंद:</strong> <code>/admin/grants</code> मध्ये ॲडमिशन देताना 'Amount Paid' मध्ये भरलेली रक्कम टाका आणि 'Pending Dues' मध्ये उर्वरित रक्कम व पुढील तारीख टाका. सिस्टीम हिशोबाची अचूक नोंद ठेवेल.</td>
      </tr>
      <tr>
        <td><strong>९</strong></td>
        <td><strong>विद्यार्थ्याला ॲडमिशन रद्द करायचे आहे / फी परतावा (Refund Request)</strong></td>
        <td><strong>Revoke Access:</strong> <code>/admin/students</code> वर जाऊन <strong>"Revoke Course Access"</strong> दाबा. सिस्टीम अनिवार्य कारण विचारेल (उदा. <em>"पालकांची विनंती - फी रिफंड मंजूर"</em>). कारण टाकून कन्फर्म करा. Audit मध्ये कायमची नोंद होईल.</td>
      </tr>
      <tr>
        <td><strong>१०</strong></td>
        <td><strong>चुकीचा कोर्स खरेदी केला व दुसरा कोर्स हवा आहे (Course Swap)</strong></td>
        <td><strong>कोर्स स्वॅप:</strong> विद्यार्थ्याला डिलीट करण्याची अजिबात गरज नाही! <code>/admin/grants</code> मधील <strong>"Swap Course"</strong> बटण वापरून जुना कोर्स काढून नवीन कोर्स १ सेकंदात विद्यार्थ्याला ट्रान्सफर करा.</td>
      </tr>
      <tr>
        <td><strong>११</strong></td>
        <td><strong>विद्यार्थी आपला पासवर्ड / ४-अंकी लॉगिन पिन विसरला</strong></td>
        <td><strong>पिन रीसेट:</strong> <code>/admin/students</code> वर जाऊन विद्यार्थ्याच्या नावापुढील <strong>"Reset PIN"</strong> दाबा. त्याचा पिन डीफॉल्ट <code>1234</code> किंवा नवीन तात्पुरता पिन सेट होईल, ज्यामुळे तो तात्काळ लॉगिन करू शकेल.</td>
      </tr>
      <tr>
        <td><strong>१२</strong></td>
        <td><strong>व्हिडिओ रेकॉर्डिंग किंवा चोरी करण्याचा प्रयत्न (Anti-Piracy Detection)</strong></td>
        <td><strong>वॉटरमार्क तपासणी:</strong> व्हिडिओवर विद्यार्थ्याचा फोन नंबर सतत हलक्या अक्षरात तरंगत असतो. जर सोशल मीडियावर चोरीचा व्हिडिओ आढळला, तर त्या नंबरवरून विद्यार्थ्याचा शोध घेऊन <code>/admin/students</code> मधून त्याला कायमचे सस्पेंड करा.</td>
      </tr>
      <tr>
        <td><strong>१३</strong></td>
        <td><strong>विद्यार्थ्याला किंवा पालकांना अधिकृत फी पावती (Official Fee Receipt) हवी आहे</strong></td>
        <td><strong>१-क्लिक पावती:</strong> <code>/admin/students</code> वर विद्यार्थ्याचा फोन सर्च करा -> <strong>Student Drawer</strong> उघडा -> <strong>"Receipts & Fees"</strong> टॅबवर जाऊन <strong>"Download PDF Receipt"</strong> दाबा किंवा <strong>"Share via WhatsApp"</strong> दाबा. विद्यार्थी स्वतःही <code>/profile</code> वरून पावती डाऊनलोड करू शकतो.</td>
      </tr>
      <tr>
        <td><strong>१४</strong></td>
        <td><strong>विद्यार्थ्याने अर्धी फी दिली असून उर्वरित हप्ता बाकी आहे (Installment Pending)</strong></td>
        <td><strong>हप्ता ट्रॅकिंग:</strong> ऑफलाईन ॲडमिशन देताना <em>"Installment Due"</em> रक्कम व अंतिम तारीख टाका. पावतीवर व ड्रॉवरमध्ये पिवळ्या रंगात <em>"हप्ता बाकी"</em> असा अलर्ट दिसेल. उर्वरित फी जमा झाल्यावर <strong>"Clear Due"</strong> करून पूर्ण पावती द्या.</td>
      </tr>
      <tr>
        <td><strong>१५</strong></td>
        <td><strong>नवीन ॲडमिन किंवा सब-ॲडमिन बनवला, त्याला लॉगिन कसे करावे ते समजत नाही</strong></td>
        <td><strong>प्रथम लॉगिन पद्धत:</strong> त्याला त्याचा Staff ID व तात्पुरता पासवर्ड पाठवा. त्याने <code>/staff/login</code> वर लॉगिन करावे. सिस्टीम त्याला थेट <code>/staff/change-password</code> वर नेईल, जेथे त्याने किमान ८ अक्षरांचा स्वतःचा नवा पासवर्ड सेट करावा.</td>
      </tr>
    </tbody>
  </table>

  <div class="page-break"></div>

  <!-- ==================== प्रकरण ११, १२ व १३ ==================== -->
  <div class="page-header">
    <span class="academy">माइंडमास्टर अकॅडमी</span>
    <span>प्रकरण ११, १२ व १३: मास्टर सेटिंग्स, CMS व ऑडिट</span>
  </div>

  <h2 class="chapter-title"><span class="badge">प्रकरण ११</span> अकॅडमी मास्टर सेटिंग्स, ब्रँडिंग, पेमेंट्स व बॅकअप (`/admin/settings`)</h2>

  <h3 class="section-title">११.१ प्रमाणपत्रावर उमटणारे ब्रँडिंग (Identity & Certificates):</h3>
  <ul>
    <li><strong>Academy Title:</strong> <code>MindMaster Academy</code> (प्रमाणपत्रावर आणि पावत्यांवर छापले जाणारे नाव).</li>
    <li><strong>Founder Name:</strong> <code>Prashant Dhumal Sir</code> (आंतरराष्ट्रीय मेमरी ट्रेनर).</li>
    <li><strong>Official Signature URL:</strong> प्रशांत सरांच्या डिजिटल स्वाक्षरीची पारदर्शक इमेज फाईल (विद्यार्थ्याने कोर्स पूर्ण करताच याच सहीचे PDF प्रमाणपत्र तयार होते).</li>
    <li><strong>Official Stamp / Seal URL:</strong> अकॅडमीचा अधिकृत सोनेरी शिक्का.</li>
  </ul>

  <h3 class="section-title">११.२ पेमेंट गेटवे व अँटी-पायरेसी (Payment & DRM):</h3>
  <ul>
    <li><strong>Razorpay Mode:</strong> <code>Live</code> (प्रत्यक्ष पैशांचे व्यवहार चालू ठेवण्यासाठी).</li>
    <li><strong>Single-Device Lock:</strong> **नेहमी चालू (ON) ठेवावे** (एका वेळी एकाच फोनमध्ये ॲप चालेल).</li>
    <li><strong>Dynamic Video Watermark:</strong> **नेहमी चालू (ON) ठेवावे** (व्हिडिओ चालू असताना विद्यार्थ्याचा मोबाईल नंबर स्क्रीनवर हलक्या अक्षरात तरंगतो, ज्यामुळे स्क्रीन रेकॉर्डिंग किंवा कॅमेऱ्याने चोरी करता येत नाही).</li>
  </ul>

  <h3 class="section-title">११.३ सिस्टीम डेटा बॅकअप (Download Backup .json - दर रविवारी आवश्यक!):</h3>
  <div class="alert-box alert-success">
    <strong>💾 दर रविवारी बॅकअप कसा घ्यावा?</strong><br>
    <code>/admin/settings</code> वर जाऊन <strong>"Download Backup (.json)"</strong> बटण दाबा.<br>
    एका क्लिकमध्ये सर्व विद्यार्थ्यांची यादी, भरलेली फी, कोर्सेस, व्हिडिओ आणि कूपन्सचा संपूर्ण डेटा सुरक्षित फाईलमध्ये कॉम्प्युटरवर सेव्ह होतो. भविष्यात इंटरनेट किंवा सर्व्हरवर काहीही झाले, तरी अकॅडमीचा डेटा सुरक्षित राहतो!
  </div>

  <hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 18px 0;">

  <h2 class="chapter-title"><span class="badge">प्रकरण १२</span> मुख्य मार्केटिंग वेबसाईट CMS व्यवस्थापन (`/admin/website-cms`)</h2>
  <ol class="steps-list">
    <li><strong>Top Announcement Bar:</strong> वेबसाईटच्या सर्वात वरची ऑफर पट्टी चालू/बंद करणे (उदा. <em>"दिवाळी विशेष ५०% सूट"</em>).</li>
    <li><strong>Hero Video:</strong> मुख्य पानावरील प्रशांत सरांचा व्हिडिओ आणि टॅगलाईन बदलणे.</li>
    <li><strong>Student Testimonials:</strong> नवीन विद्यार्थ्यांचा फोटो, ५-स्टार रेटिंग आणि अभिप्राय जोडणे.</li>
    <li>बदल झाल्यावर <strong>"Publish to Live Website"</strong> दाबताच ५ सेकंदांत बदल मुख्य वेबसाईटवर दिसतात.</li>
  </ol>

  <hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 18px 0;">

  <h2 class="chapter-title"><span class="badge">प्रकरण १३</span> सिस्टीम ऑडिट लॉग व ट्रॅकिंग (`/admin/audit`)</h2>
  <p>अकॅडमीमध्ये पारदर्शकता राखण्यासाठी सिस्टीममधील प्रत्येक हालचालीची नोंद ठेवली जाते: कोणी कोर्स जोडला, कोणी फोन अनलॉक केला, कोणी कूपन बनवले? यामध्ये <strong>तारीख, अचूक वेळ (IST), कर्मचाऱ्याचे नाव, आयडी आणि IP ॲड्रेस</strong> कायमचा नोंदवला जातो.</p>

  <div class="page-break"></div>

  <!-- ==================== प्रकरण १४ व १५ ==================== -->
  <div class="page-header">
    <span class="academy">माइंडमास्टर अकॅडमी</span>
    <span>प्रकरण १४ व १५: चुका टाळणे व सुरक्षित लॉगआऊट</span>
  </div>

  <h2 class="chapter-title"><span class="badge">प्रकरण १४</span> नेहमी होणाऱ्या ५ गंभीर चुका व उपाय (Do's & Don'ts Checklist)</h2>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 10%;">क्र.</th>
        <th style="width: 45%; background: #991b1b;">कधीही करू नका ❌ (Strictly Prohibited)</th>
        <th style="width: 45%; background: #065f46;">नेहमी हेच करा ✔️ (Best Practice)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>१</strong></td>
        <td>युट्यूबवर व्हिडिओ <strong>Public</strong> किंवा <strong>Private</strong> ठेवणे.</td>
        <td>युट्यूबवर व्हिडिओ नेहमी <strong>Unlisted</strong> ठेवा, जेणेकरून तो फक्त आपल्या ॲपमध्येच चालेल.</td>
      </tr>
      <tr>
        <td><strong>२</strong></td>
        <td>विद्यार्थ्याची ओळख न पटवता फोन लॉक (DRM) रीसेट करणे.</td>
        <td>विद्यार्थ्याचा १०-अंकी नंबर आणि नाव विचारून खात्री झाल्यावरच <strong>"Reset Device Lock"</strong> दाबा.</td>
      </tr>
      <tr>
        <td><strong>३</strong></td>
        <td>मुख्य ॲडमिनचा पासवर्ड इतर कर्मचाऱ्यांना देणे.</td>
        <td>कर्मचाऱ्याला नेहमी स्वतंत्र <strong>Sub-Admin ID</strong> आणि आवश्यक तेवढेच अधिकार द्या.</td>
      </tr>
      <tr>
        <td><strong>४</strong></td>
        <td>सेमिनारमधील रोख फी गोळा करून आठवडाभर हिशोब प्रलंबित ठेवणे.</td>
        <td>दररोज संध्याकाळी <code>/admin/grants</code> मधील हिशोब तपासून सब-ॲडमिन कॅश Settle करा.</td>
      </tr>
      <tr>
        <td><strong>५</strong></td>
        <td>महिनोन-महिने सिस्टीमचा बॅकअप न घेणे.</td>
        <td><strong>दर रविवारी</strong> <code>/admin/settings</code> मधील <strong>"Download Backup (.json)"</strong> वरून बॅकअप सेव्ह करा.</td>
      </tr>
    </tbody>
  </table>

  <hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 25px 0;">

  <h2 class="chapter-title"><span class="badge">प्रकरण १५</span> सुरक्षित लॉगआऊट (Admin Session Termination)</h2>

  <div class="info-card">
    <strong>काम संपल्यावर कसे बाहेर पडावे?</strong>
    <ol class="steps-list" style="margin-top: 8px;">
      <li>स्क्रीनच्या उजव्या वरच्या कोपऱ्यातील तुमच्या प्रोफाइल नावावर क्लिक करा.</li>
      <li>लाल रंगाचे <strong>"Log Out" (किंवा Sign Out)</strong> बटण दाबा.</li>
      <li>कन्फर्मेशन बॉक्समध्ये <strong>"Yes, Sign Out"</strong> दाबा.</li>
    </ol>
    <p style="font-size: 11.5px; color: #475569; margin-top: 6px;">
      <strong>तांत्रिक परिणाम:</strong> सिस्टीम ब्राउझरमधील एनक्रिप्टेड कुकी तात्काळ नष्ट करते आणि तुम्हाला पुन्हा लॉगिन स्क्रीनवर आणते. यामुळे तुमच्या संगणकावर इतर कोणीही बसले तरी ॲडमिन पॅनल उघडू शकणार नाही.
    </p>
  </div>

  <div style="margin-top: 40px; text-align: center; border-top: 2px solid #e2e8f0; padding-top: 20px;">
    <div style="font-size: 15px; font-weight: 800; color: #0040c7;">माइंडमास्टर अकॅडमी, सातारा</div>
    <div style="font-size: 11px; color: #64748b; margin-top: 3px;">
      पवई नाका, सातारा शहर, महाराष्ट्र - ४१५००१ • संपर्क: +९१ ८४५९३ ४४०७७ • mindmasterdhumal@gmail.com
    </div>
    <div style="font-size: 10px; color: #94a3b8; margin-top: 8px;">
      दस्तऐवज निर्मिती: २०२६ • आंतरराष्ट्रीय मेमरी ट्रेनर प्रशांत धुमाळ सर • सर्व हक्क सुरक्षित.
    </div>
  </div>

</body>
</html>
"""

def generate_pdf():
    work_dir = os.path.abspath(os.path.dirname(__file__))
    html_file = os.path.join(work_dir, "temp_admin_manual.html")
    pdf_file = os.path.join(work_dir, "MindMaster_Admin_Master_Manual_Marathi.pdf")

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

    print("Generating PDF...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if os.path.exists(pdf_file) and os.path.getsize(pdf_file) > 0:
        size_kb = os.path.getsize(pdf_file) / 1024
        print(f"SUCCESS: PDF generated successfully! Size: {size_kb:.1f} KB")
        print(f"File path: {pdf_file}")
    else:
        print("Error generating PDF:", result.stderr)
        sys.exit(1)

if __name__ == "__main__":
    generate_pdf()
