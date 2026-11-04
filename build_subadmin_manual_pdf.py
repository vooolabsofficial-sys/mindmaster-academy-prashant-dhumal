# -*- coding: utf-8 -*-
"""
MindMaster Academy Sub-Admin (Staff) Master Manual PDF Generator
Compiles comprehensive Marathi staff operations guide into print-ready A4 PDF.
"""

import os
import subprocess
import sys

HTML_CONTENT = """<!DOCTYPE html>
<html lang="mr">
<head>
  <meta charset="utf-8">
  <title>माइंडमास्टर अकॅडमी — सब-ॲडमिन (स्टाफ) मास्टर मॅन्युअल</title>
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
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 75%, #0052ff 100%);
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
      color: #fbcfe8;
      margin-bottom: 20px;
    }
    .cover-title {
      font-size: 36px;
      font-weight: 800;
      line-height: 1.25;
      margin: 0 0 10px 0;
      color: #ffffff;
      text-shadow: 0 2px 10px rgba(0,0,0,0.3);
    }
    .cover-subtitle {
      font-size: 17px;
      font-weight: 600;
      color: #c7d2fe;
      margin-bottom: 25px;
      line-height: 1.4;
    }
    .cover-tagline {
      font-size: 13.5px;
      color: #e2e8f0;
      max-width: 620px;
      border-left: 3px solid #f472b6;
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
      margin-top: auto;
    }
    .cover-meta div span {
      display: block;
      color: #a5b4fc;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .cover-meta div strong {
      color: #ffffff;
      font-size: 12.5px;
    }
    .cover-footer {
      margin-top: 25px;
      padding-top: 15px;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #cbd5e1;
    }

    /* Page Setup */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin-bottom: 16px;
      font-size: 10px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .page-header .academy {
      font-weight: 700;
      color: #4338ca;
    }
    .page-break {
      page-break-after: always;
    }

    /* Headings */
    h1, h2, h3, h4 {
      color: #0f172a;
      break-after: avoid;
    }
    h2.chapter-title {
      font-size: 18px;
      font-weight: 800;
      color: #4338ca;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 6px;
      margin-top: 20px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    h2.chapter-title span.badge {
      background: #4f46e5;
      color: #ffffff;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 6px;
      font-weight: 700;
    }
    h3.section-title {
      font-size: 14.5px;
      font-weight: 700;
      color: #312e81;
      margin-top: 14px;
      margin-bottom: 8px;
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
      background: #eef2ff;
      border-left: 4px solid #6366f1;
      color: #312e81;
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
      background: #1e1b4b;
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
      margin-bottom: 6px;
    }
    ul.check-list li::before {
      content: "✔";
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: bold;
    }

    code {
      background: #f1f5f9;
      color: #4338ca;
      padding: 1px 5px;
      border-radius: 4px;
      font-size: 11px;
      font-family: monospace;
      border: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>

  <!-- ==================== कव्हर पेज (COVER PAGE) ==================== -->
  <div class="cover-page">
    <div>
      <div class="cover-badge">माइंडमास्टर अकॅडमी • अधिकृत स्टाफ कार्यपद्धती मॅन्युअल (SUB-ADMIN)</div>
      <h1 class="cover-title">सब-ॲडमिन (स्टाफ)<br>मास्टर मॅन्युअल</h1>
      <div class="cover-subtitle">प्रशासकीय कर्मचारी, सपोर्ट एक्झिक्युटिव्ह व सहाय्यक शिक्षकांसाठी संपूर्ण कार्यपद्धती गाईड</div>
      <div class="cover-tagline">
        संस्थापक व मार्गदर्शक: आंतरराष्ट्रीय मेमरी ट्रेनर <strong>प्रशांत धुमाळ सर</strong><br>
        सातारा फ्लॅगशिप मुख्यालय • अधिकृत पोर्टल: <code>https://app.mindmasteredu.in/staff/login</code>
      </div>
    </div>

    <div>
      <div class="cover-meta">
        <div>
          <span>दस्तऐवज प्रकार</span>
          <strong>सब-ॲडमिन कार्यपद्धती मॅन्युअल</strong>
        </div>
        <div>
          <span>पोर्टल ॲक्सेस URL</span>
          <strong>app.mindmasteredu.in/staff/login</strong>
        </div>
        <div>
          <span>सुरक्षा निकष</span>
          <strong>Argon2id Encyption & DRM Protection</strong>
        </div>
        <div>
          <span>अधिकृत अधिकार कक्षा</span>
          <strong>७ स्वतंत्र ऑपरेशन्स अधिकार (Permission Matrix)</strong>
        </div>
      </div>

      <div class="cover-footer">
        <span>© २०२६ माइंडमास्टर अकॅडमी, सातारा. सर्व हक्क राखीव.</span>
        <span>फक्त अधिकृत अकॅडमी कर्मचाऱ्यांसाठी (Sub-Admin Staff Only)</span>
      </div>
    </div>
  </div>

  <!-- ==================== अनुक्रमणिका (TABLE OF CONTENTS) ==================== -->
  <div class="page-header">
    <span class="academy">माइंडमास्टर अकॅडमी</span>
    <span>सब-ॲडमिन मास्टर मॅन्युअल: अनुक्रमणिका</span>
  </div>

  <h2 class="chapter-title" style="margin-top: 0;"><span class="badge">अनुक्रमणिका</span> संपूर्ण १२ प्रकरणांचा तपशीलवार तक्ता</h2>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 14%;">प्रकरण क्र.</th>
        <th style="width: 60%;">प्रकरणाचे नाव व कव्हर केलेले विषय</th>
        <th style="width: 26%;">संबंधित URL / स्क्रीन</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>प्रकरण १</strong></td>
        <td><strong>सब-ॲडमिनची ओळख, कार्यकक्षा व सुरक्षा कवच</strong> — हुद्दा, ७ अधिकार, व 403 सुरक्षा मर्यादा</td>
        <td>Role &amp; Guardrails</td>
      </tr>
      <tr>
        <td><strong>प्रकरण २</strong></td>
        <td><strong>प्रथमच लॉगिन, तात्पुरता पासवर्ड व स्वतःचा पासवर्ड सेट करणे</strong> — स्टेप-बाय-स्टेप पासवर्ड बदल</td>
        <td><code>/staff/login, /staff/change-password</code></td>
      </tr>
      <tr>
        <td><strong>प्रकरण ३</strong></td>
        <td><strong>दैनंदिन लॉगिन व टॉपबार कंट्रोल्स</strong> — दैनंदिन लॉगिन, ग्लोबल सर्च, थीम टॉगल व मोबाईल नेव्हिगेशन</td>
        <td>Header Controls</td>
      </tr>
      <tr>
        <td><strong>प्रकरण ४</strong></td>
        <td><strong>सब-ॲडमिन मुख्य कन्सोल (Dashboard)</strong> — ॲक्टिव्ह मॉड्युल्स, आजचे काम व स्टेट्स टाईल्स</td>
        <td><code>https://app.mindmasteredu.in/sub</code></td>
      </tr>
      <tr>
        <td><strong>प्रकरण ५</strong></td>
        <td><strong>विद्यार्थी शोध, ३६०° प्रोफाइल व DRM फोन लॉक अनलॉक करणे</strong> — मोबाईलने शोध, फोन लॉक रीसेट</td>
        <td><code>/sub/students</code> &amp; Student Drawer</td>
      </tr>
      <tr>
        <td><strong>प्रकरण ६</strong></td>
        <td><strong>मॅन्युअल व ऑफलाइन ॲडमिशन कार्यपद्धती</strong> — रोख/UPI ॲडमिशन, हप्ते नोंद, Approval Mode नियम</td>
        <td><code>/admin/grants</code></td>
      </tr>
      <tr>
        <td><strong>प्रकरण ७</strong></td>
        <td><strong>विद्यार्थी सपोर्ट डेस्क व तिकीट निवारण</strong> — थेट चॅट, शंका समाधान व Resolve तिकीट नोंद</td>
        <td><code>/sub/messages</code></td>
      </tr>
      <tr>
        <td><strong>प्रकरण ८</strong></td>
        <td><strong>अभ्यासाची पुस्तके, नोट्स व कूपन व्यवस्थापन</strong> — ई-बुक्स अपलोड व सवलत कूपन तयार करणे</td>
        <td><code>/admin/notes, /admin/coupons</code></td>
      </tr>
      <tr>
        <td><strong>प्रकरण ९</strong></td>
        <td><strong>माझी दैनंदिन ॲक्टिव्हिटी व रोख फी हिशोब</strong> — ऑपरेटर ऑडिट, दिवसभराची रोख फी टॅली व सेटलमेंट</td>
        <td><code>/sub/activity</code></td>
      </tr>
      <tr>
        <td><strong>प्रकरण १०</strong></td>
        <td><strong>वैयक्तिक प्रोफाईल, अधिकार व पासवर्ड सेटिंग्स</strong> — अधिकार मॅट्रिक्स, केंद्र माहिती, पासवर्ड अपडेट</td>
        <td><code>/sub/settings</code></td>
      </tr>
      <tr>
        <td><strong>प्रकरण ११</strong></td>
        <td><strong>सब-ॲडमिनच्या कामातील १० प्रत्यक्ष अडचणी व आपत्कालीन कृती</strong> — तांत्रिक अडचणींवर अचूक उपाय</td>
        <td>Troubleshooting Matrix</td>
      </tr>
      <tr>
        <td><strong>प्रकरण १२</strong></td>
        <td><strong>सब-ॲडमिनसाठी १० सुवर्ण नियम व सुरक्षित लॉगआऊट</strong> — Do's &amp; Don'ts, कामाची नैतिकता व Sign Out</td>
        <td>Best Practices &amp; Security</td>
      </tr>
    </tbody>
  </table>

  <div class="alert-box alert-warning">
    <strong>⚠️ महत्त्वाचा सुरक्षा नियम:</strong> सब-ॲडमिन आयडी आणि पासवर्ड हा तुमचा वैयक्तिक डिजिटल स्वाक्षरीसारखा आहे. तुमच्या आयडीवरून होणाऱ्या प्रत्येक ॲडमिशन, फोन अनलॉक आणि सपोर्ट मेसेजची नोंद सिस्टीममध्ये कायमची राहते. त्यामुळे तुमचा पासवर्ड कोणाशीही शेअर करू नका.
  </div>

  <div class="page-break"></div>

  <!-- ==================== प्रकरण १ व २ ==================== -->
  <div class="page-header">
    <span class="academy">माइंडमास्टर अकॅडमी</span>
    <span>प्रकरण १ व २: ओळख, कार्यकक्षा व प्रथम लॉगिन</span>
  </div>

  <h2 class="chapter-title"><span class="badge">प्रकरण १</span> सब-ॲडमिनची ओळख, कार्यकक्षा व सुरक्षा कवच</h2>

  <h3 class="section-title">१.१ सब-ॲडमिन कोण असतो?</h3>
  <p>सब-ॲडमिन (Staff User) हा माइंडमास्टर अकॅडमीच्या सातारा मुख्यालय किंवा पुणे शाखेतील अधिकृत कर्मचारी, सपोर्ट एक्झिक्युटिव्ह किंवा सहाय्यक शिक्षक असतो. मुख्य ॲडमिन (प्रशांत धुमाळ सर) कर्मचाऱ्याच्या जबाबदारीनुसार त्याला विशिष्ट अधिकार प्रदान करतात.</p>

  <h3 class="section-title">१.२ सात (७) स्वतंत्र अधिकार (Permission Matrix):</h3>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 25%;">अधिकार कोड (Key)</th>
        <th style="width: 45%;">काय करता येते? (Permitted Actions)</th>
        <th style="width: 30%;">कोणाला दिला जातो?</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>students.view</code></td>
        <td>विद्यार्थी शोधणे, प्रोफाइल पाहणे, फोन लॉक (DRM) रीसेट करणे व पिन रीसेट करणे.</td>
        <td>सपोर्ट स्टाफ, फ्रंट डेस्क</td>
      </tr>
      <tr>
        <td><code>messages.manage</code></td>
        <td>विद्यार्थ्यांच्या शंकांना थेट उत्तरे देणे, तिकीट सोडवणे व रेझोल्युशन नोट लिहिणे.</td>
        <td>सपोर्ट एक्झिक्युटिव्ह</td>
      </tr>
      <tr>
        <td><code>freegrant.manage</code></td>
        <td>सेमिनार किंवा ऑफलाइन रोख/UPI फी घेऊन विद्यार्थ्यांना कोर्स देणे (Approval Mode सह).</td>
        <td>ॲडमिशन कॉर्डिनेटर</td>
      </tr>
      <tr>
        <td><code>courses.manage</code></td>
        <td>अभ्यासक्रम, व्हिडिओ धडे पाहणे व संपादित करणे.</td>
        <td>वरिष्ठ शिक्षक / मॉडरेटर</td>
      </tr>
      <tr>
        <td><code>notes.books.manage</code></td>
        <td>अभ्यासक्रमाच्या ई-बुक्स, फॉर्म्युला शीट्स आणि सरावाच्या नोट्स अपलोड करणे.</td>
        <td>अकॅडमिक टीम</td>
      </tr>
      <tr>
        <td><code>coupons.manage</code></td>
        <td>शाळा किंवा सेमिनारसाठी सवलत कूपन्स (% किंवा थेट ₹ सूट) तयार करणे.</td>
        <td>मार्केटिंग स्टाफ</td>
      </tr>
      <tr>
        <td><code>reports.view</code></td>
        <td>अकॅडमीचे एकूण ॲडमिशन अहवाल पाहणे (महसूल पाहणे).</td>
        <td>शाखा व्यवस्थापक (Branch Mgr)</td>
      </tr>
    </tbody>
  </table>

  <h3 class="section-title">१.३ सब-ॲडमिन काय करू शकत नाही? (Strictly Forbidden Boundaries):</h3>
  <ul>
    <li>इतर सब-ॲडमिन कर्मचाऱ्यांना नेमणे किंवा काढून टाकणे.</li>
    <li>अकॅडमीच्या मुख्य सेटिंग्स (Razorpay Keys, प्रशांत सरांची डिजिटल स्वाक्षरी, अकॅडमीचा अधिकृत शिक्का) बदलणे.</li>
    <li>मुख्य मार्केटिंग वेबसाईट CMS (`/admin/website-cms`) बदलणे.</li>
    <li>सिस्टीमचे मुख्य ऑडिट लॉग्ज (`/admin/audit`) पाहणे.</li>
  </ul>
  <div class="alert-box alert-danger">
    <strong>🛡️ ४०३ Forbidden सुरक्षा कवच:</strong> जर सब-ॲडमिनने ब्राउझरमध्ये टाईप करून प्रतिबंधित पानात (`/admin/settings` किंवा `/admin/sub-admins`) जाण्याचा प्रयत्न केला, तर सिस्टीमची <code>PermissionGuard</code> सुरक्षा त्याला तात्काळ अडवून <strong>"403 Forbidden - Operational Authority Not Granted"</strong> चा स्क्रीन दाखवते.
  </div>

  <hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 16px 0;">

  <h2 class="chapter-title"><span class="badge">प्रकरण २</span> प्रथमच लॉगिन, तात्पुरता पासवर्ड व स्वतःचा पासवर्ड सेट करणे</h2>

  <div class="info-card" style="background: #f0fdf4; border-left: 4px solid #16a34a;">
    <strong style="color: #166534; font-size: 13.5px;">🔐 नवीन सब-ॲडमिनचा पहिला लॉगिन व पासवर्ड बदलण्याचा अचूक प्रवास:</strong>
    <ol class="steps-list" style="margin-top: 8px;">
      <li><strong>क्रेडेंशियल्स मिळणे:</strong> मुख्य ॲडमिनकडून कर्मचाऱ्याला व्हॉट्सॲपवर त्याचा <strong>Staff ID</strong> (उदा. <code>MMA-002</code>) आणि <strong>तात्पुरता पासवर्ड</strong> (उदा. <code>StaffTemp#2026</code>) मिळतो.</li>
      <li><strong>लॉगिन स्क्रीनवर जाणे:</strong> मोबाईल किंवा लॅपटॉपवर <code>https://app.mindmasteredu.in/staff/login</code> उघडावे.</li>
      <li><strong>तात्पुरता लॉगिन:</strong> आपला Staff ID व मिळालेला तात्पुरता पासवर्ड टाकून <strong>"Sign In"</strong> दाबावे.</li>
      <li><strong>अनिवार्य पासवर्ड रिसेट स्क्रीन:</strong> सिस्टीम तात्काळ ओळखते की हा पहिला लॉगिन आहे (<code>must_change_password: true</code>) आणि कर्मचाऱ्याला थेट <code>/staff/change-password</code> पानावर पाठवते. जोपर्यंत नवीन पासवर्ड सेट होत नाही, तोपर्यंत इतर कोणतेही पान उघडता येत नाही!</li>
      <li><strong>नवीन पासवर्डचे नियम:</strong> कर्मचाऱ्याने सध्याचा तात्पुरता पासवर्ड टाकावा, त्यानंतर आपला नवीन स्वतःचा गोपनीय पासवर्ड टाकावा (किमान ८ अक्षरे, १ कॅपिटल, १ अंक आणि १ विशेष चिन्ह जसे <code>@, #, $</code>).</li>
      <li><strong>"Save &amp; Activate Staff Account"</strong> दाबताच पासवर्ड सिस्टीममध्ये एनक्रिप्ट होऊन कायमचा सेव्ह होतो आणि सब-ॲडमिनचा डॅशबोर्ड उघडतो.</li>
      <li><strong>दैनंदिन लॉगिन:</strong> दुसऱ्या दिवसापासून कर्मचाऱ्याने <code>/staff/login</code> वर नेहमी स्वतःच्या या नवीन पासवर्डने लॉगिन करावे.</li>
    </ol>
  </div>

  <div class="page-break"></div>

  <!-- ==================== प्रकरण ३ व ४ ==================== -->
  <div class="page-header">
    <span class="academy">माइंडमास्टर अकॅडमी</span>
    <span>प्रकरण ३ व ४: दैनिक लॉगिन, टॉपबार व मुख्य कन्सोल</span>
  </div>

  <h2 class="chapter-title"><span class="badge">प्रकरण ३</span> दैनंदिन लॉगिन व टॉपबार कंट्रोल्स</h2>

  <h3 class="section-title">३.१ दैनंदिन लॉगिनची सवय:</h3>
  <p>दररोज सकाळी ऑफिसमध्ये आल्यावर किंवा काम सुरू करताना <code>https://app.mindmasteredu.in/staff/login</code> उघडून आपल्या Staff ID व स्वतःच्या पासवर्डने लॉगिन करावे.</p>

  <h3 class="section-title">३.२ टॉपबारवरील सर्व टूल्स (Header Controls):</h3>
  <ol class="steps-list">
    <li><strong>MindMaster Logo &amp; Sub-Admin Chip:</strong> डाव्या कोपऱ्यात लोगो आणि जांभळ्या रंगाचा <strong>"Sub-Admin"</strong> बिल्ला दिसतो. यावर क्लिक केल्यास थेट मुख्य डॅशबोर्ड उघडतो.</li>
    <li><strong>मोबाईल हॅम्बर्गर मेनू (Mobile Menu):</strong> जर तुम्ही मोबाईलवर काम करत असाल, तर डाव्या कोपऱ्यातील तीन रेषा (Menu Icon) दाबताच संपूर्ण साईडबार नेव्हिगेशन ड्रॉवर उघडतो.</li>
    <li><strong>ग्लोबल स्टुडंट सर्च बॉक्स (Global Student Search):</strong> पानाच्या मध्यभागी असलेल्या सर्च बारमध्ये विद्यार्थ्याचे नाव किंवा १०-अंकी फोन नंबर टाका; तुम्ही कोणत्याही पानावर असलात तरी १ सेकंदात विद्यार्थ्याची पूर्ण माहिती उघडते.</li>
    <li><strong>लाईट व डार्क मोड (Theme Switcher):</strong> सूर्य (Sun) व चंद्र (Moon) आयकॉनवर क्लिक करून दिवसा लाईट मोड आणि रात्री डोळ्यांच्या संरक्षणासाठी डार्क मोड निवडता येतो.</li>
    <li><strong>सपोर्ट नोटिफिकेशन्स (Bell Icon):</strong> नवीन मेसेजेस आणि सिस्टीम अलर्ट्स लाल ठिपक्यासह दिसतात.</li>
    <li><strong>स्टाफ प्रोफाईल चिप व डायरेक्ट लॉगआऊट:</strong> उजव्या कोपऱ्यात तुमचे नाव (उदा. <em>सचिन कदम</em>) दिसते. शेजारील लाल <strong>Log Out</strong> बटण दाबून सुरक्षित बाहेर पडता येते.</li>
  </ol>

  <hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 16px 0;">

  <h2 class="chapter-title"><span class="badge">प्रकरण ४</span> सब-ॲडमिन मुख्य कन्सोल (`/sub` Dashboard)</h2>

  <p>लॉगिन केल्यावर समोर दिसणारे मुख्य कामाचे पान (`https://app.mindmasteredu.in/sub`). यात ३ प्रमुख विभाग आहेत:</p>

  <h3 class="section-title">४.१ ॲक्टिव्ह मॉड्युल्स बॅनर (Active Authority Banner):</h3>
  <p>पानाच्या सर्वात वरती तुमचे नाव, केंद्र (उदा. <em>Satara Campus</em>), Staff ID आणि मुख्य ॲडमिनने तुम्हाला दिलेले सर्व सक्रिय अधिकार निळ्या बिल्ल्यांमध्ये दिसतात. यामुळे तुम्हाला कोणती कामे करण्याची परवानगी आहे हे स्पष्ट समजते.</p>

  <h3 class="section-title">४.२ तीन प्रमुख स्टेट्स टाईल्स (Overview Metrics):</h3>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 30%;">स्टेट्स टाईल</th>
        <th style="width: 45%;">काय माहिती दिसते?</th>
        <th style="width: 25%;">शॉर्टकट कृती</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Student Support &amp; Messages</strong></td>
        <td>एकूण चालू असलेली संभाषणे आणि उत्तराची वाट पाहणारे प्रलंबित मेसेज (उदा. <code>३ Unread Queries</code>).</td>
        <td><strong>"Open Support Inbox"</strong> दाबा.</td>
      </tr>
      <tr>
        <td><strong>Student Cohorts (View Only)</strong></td>
        <td>अकॅडमीमध्ये एकूण किती विद्यार्थी शिकत आहेत याची अचूक संख्या.</td>
        <td><strong>"Search Learners"</strong> दाबा.</td>
      </tr>
      <tr>
        <td><strong>Operator Audit Feed</strong></td>
        <td>तुम्ही स्वतः आजपर्यंत सिस्टीममध्ये केलेल्या एकूण कृतींची संख्या (ॲडमिशन, फोन अनलॉक).</td>
        <td><strong>"View Activity Timeline"</strong> दाबा.</td>
      </tr>
    </tbody>
  </table>

  <h3 class="section-title">४.३ परमिटेड मॉड्युल्स लाँचर्स (Permitted Launchers):</h3>
  <p>तुम्हाला मिळालेल्या अधिकारांनुसार खाली थेट कामाचे शॉर्टकट कार्ड्स दिसतात: <em>Support Desk, Student Management, Offline Grants, Study Books, Coupons</em>. ज्या मॉड्युल्सचा अधिकार नाही, त्यावर कुलूप (Lock) दिसते.</p>

  <div class="page-break"></div>

  <!-- ==================== प्रकरण ५ व ६ ==================== -->
  <div class="page-header">
    <span class="academy">माइंडमास्टर अकॅडमी</span>
    <span>प्रकरण ५ व ६: विद्यार्थी शोध, फोन अनलॉक व ऑफलाइन ॲडमिशन</span>
  </div>

  <h2 class="chapter-title"><span class="badge">प्रकरण ५</span> विद्यार्थी शोध, ३६०° प्रोफाइल व DRM फोन लॉक अनलॉक करणे (`/sub/students`)</h2>

  <h3 class="section-title">५.१ विद्यार्थी कसा शोधावा?</h3>
  <ol class="steps-list">
    <li><code>/sub/students</code> वर जाणे किंवा वरच्या सर्च बारमध्ये विद्यार्थ्याचा १०-अंकी मोबाईल नंबर टाकणे.</li>
    <li>एका सेकंदात विद्यार्थ्याचे पूर्ण नाव, नोंदणी तारीख, चालू कोर्सेस आणि प्रगती टक्केवारी समोर येते.</li>
  </ol>

  <h3 class="section-title">५.२ ग्लोबल स्टुडंट ड्रॉवर (Student 360° Drawer):</h3>
  <p>विद्यार्थ्याच्या नावावर क्लिक करताच उजव्या बाजूने स्लाईड-ओव्हर ड्रॉवर उघडतो. यात त्याचे नाव, ईमेल, फोन, जिल्‍ह्याचे नाव, आणि अभ्यासक्रमाची स्थिती दिसते.</p>

  <h3 class="section-title">५.३ सिंगल-डिव्हाइस लॉक अनलॉक करणे (Reset Device Lock - अतिमहत्त्वाचे काम!):</h3>
  <div class="info-card" style="background: #eff6ff; border-left: 4px solid #3b82f6;">
    <strong>📱 विद्यार्थ्याचा फोन बदलल्यास किंवा एरर आल्यास:</strong><br>
    अँटी-पायरेसी नियमांमुळे विद्यार्थ्याचे ॲप एका वेळी एकाच फोनमध्ये चालते. जेव्हा विद्यार्थी नवीन मोबाईल घेतो किंवा फोन फॉरमॅट करतो, तेव्हा त्याला <em>"Device Locked - Only 1 Phone Allowed"</em> असा एरर येतो.<br>
    <strong>सब-ॲडमिनने काय करावे?</strong>
    <ol class="steps-list" style="margin-top: 6px;">
      <li>विद्यार्थ्याचा फोन नंबर आणि नाव विचारून ओळख पटवून घ्या.</li>
      <li>स्टुडंट ड्रॉवरमधील हिरव्या रंगाचे <strong>"Reset Device Lock"</strong> बटण दाबा.</li>
      <li>१ सेकंदात जुना फोन सिस्टीममधून अनलॉक होतो.</li>
      <li>विद्यार्थ्याला नवीन फोनमध्ये ॲप उघडून लगेच लॉगिन करण्यास सांगा. विद्यार्थी आनंदाने अभ्यास सुरू करू शकेल!</li>
    </ol>
  </div>

  <h3 class="section-title">५.४ स्टुडंट लॉगिन पिन रीसेट करणे (Reset Student PIN):</h3>
  <p>जर विद्यार्थी आपला ४-अंकी लॉगिन पिन विसरला असेल, तर स्टुडंट ड्रॉवरमधील <strong>"Reset Student PIN"</strong> दाबा. त्याचा पिन डीफॉल्ट <code>1234</code> किंवा नवीन तात्पुरता पिन सेट होईल, ज्यामुळे तो तात्काळ लॉगिन करू शकेल.</p>

  <hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 16px 0;">

  <h2 class="chapter-title"><span class="badge">प्रकरण ६</span> मॅन्युअल व ऑफलाइन ॲडमिशन कार्यपद्धती (`/admin/grants`)</h2>

  <h3 class="section-title">६.१ रोख किंवा थेट UPI फी घेऊन ॲडमिशन कसे द्यावे?</h3>
  <ol class="steps-list">
    <li>डॅशबोर्डवरून किंवा मेनूमधून <code>/admin/grants</code> उघडा.</li>
    <li><strong>Student Details:</strong> विद्यार्थ्याचा १०-अंकी मोबाईल नंबर आणि पूर्ण नाव टाका.</li>
    <li><strong>Course Selection:</strong> विद्यार्थी जो कोर्स शिकणार आहे त्यावर टिक करा (उदा. <em>Vedic Maths Masterclass</em>). एकाच वेळी अनेक कोर्सेसचा कॉम्बोही निवडता येतो.</li>
    <li><strong>Access Duration:</strong> कोर्सची मुदत निवडा (उदा. ३ महिने, ६ महिने किंवा १ वर्ष).</li>
    <li><strong>Payment Method:</strong> फी कशी मिळाली ते निवडा: <code>Cash (रोख)</code> किंवा <code>Direct UPI</code>.</li>
    <li><strong>Amount Collected:</strong> प्रत्यक्ष मिळालेली रक्कम टाका (उदा. ₹२,०००).</li>
    <li><strong>Pending Dues (असल्यास):</strong> जर विद्यार्थ्याने हप्त्याने फी भरली असेल, तर बाकी राहिलेली रक्कम आणि पुढील देय तारीख टाका.</li>
    <li><strong>"Grant Course Access"</strong> दाबा.</li>
  </ol>

  <h3 class="section-title">६.२ Approval Mode चे नियम (अतिशय महत्त्वाचे!):</h3>
  <div class="alert-box alert-warning">
    <strong>⚠️ अप्रूव्हल मोड कसा काम करतो?</strong><br>
    मुख्य ॲडमिनने (प्रशांत सरांनी) तुमच्या आयडीवर <strong>Approval Mode ON</strong> ठेवला असल्यास, तुम्ही दिलेले ॲडमिशन तात्काळ सुरू न होता <strong>"Pending Approval"</strong> रांगेत जाते. प्रशांत सरांनी मुख्य ॲडमिन पॅनलमधून मंजूर केल्यावरच विद्यार्थ्याच्या ॲपमध्ये कोर्स दिसतो.<br>
    <em>टीप:</em> जर पालकांची घाई असेल, तर मुख्य ॲडमिनला व्हॉट्सॲपवर कळवून लगेच अप्रूव्ह करून घ्यावे.
  </div>

  <div class="page-break"></div>

  <!-- ==================== प्रकरण ७ व ८ ==================== -->
  <div class="page-header">
    <span class="academy">माइंडमास्टर अकॅडमी</span>
    <span>प्रकरण ७ व ८: सपोर्ट डेस्क, बुक्स व कूपन्स</span>
  </div>

  <h2 class="chapter-title"><span class="badge">प्रकरण ७</span> विद्यार्थी सपोर्ट डेस्क व तिकीट निवारण (`/sub/messages`)</h2>

  <h3 class="section-title">७.१ सपोर्ट इनबॉक्स रचना:</h3>
  <p>विद्यार्थी जेव्हा ॲपमधील <em>'Help &amp; Support'</em> वरून मेसेज पाठवतात, तेव्हा तो सब-ॲडमिनच्या <code>/sub/messages</code> इनबॉक्समध्ये येतो. डाव्या बाजूला संभाषणांची यादी दिसते आणि न वाचलेल्या मेसेजसमोर लाल बॅज दिसतो.</p>

  <h3 class="section-title">७.२ विद्यार्थ्यांच्या शंकांना उत्तरे देणे:</h3>
  <ol class="steps-list">
    <li>डाव्या बाजूच्या यादीतून विद्यार्थ्याच्या नावावर क्लिक करा.</li>
    <li>विद्यार्थ्याने विचारलेली अडचण वाचा (उदा. <em>"सर, माझे वैदिक मॅथ्सचे चॅप्टर ४ चे व्हिडिओ दिसत नाहीत"</em>).</li>
    <li>खालील टेक्स्ट बॉक्समध्ये स्पष्ट, नम्र व मार्गदर्शक मराठीत उत्तर टाईप करा आणि <strong>"Send"</strong> दाबा.</li>
    <li>मेसेज विद्यार्थ्याच्या मोबाईलवर तात्काळ पोहोचतो.</li>
  </ol>

  <h3 class="section-title">७.३ तिकीट सोडवणे व नोंद लिहिणे (Mark Ticket Resolved):</h3>
  <div class="info-card">
    <strong>तिकीट क्लोज करण्याची कार्यपद्धती:</strong>
    <ol class="steps-list" style="margin-top: 6px;">
      <li>विद्यार्थ्याची अडचण पूर्ण सुटल्यावर वर उजवीकडील <strong>"Mark Ticket as Resolved"</strong> बटण दाबा.</li>
      <li>सिस्टीम विचारते: <em>"Resolution Note"</em>.</li>
      <li>तिथे तुम्ही नेमके काय केले ते थोडक्यात लिहा (उदा. <em>"पालकांशी बोलून ॲपमधील कॅशे क्लिअर करून व्हिडिओ सुरू करून दिला"</em>).</li>
      <li><strong>"Confirm Resolve"</strong> दाबा. तिकीट सोडवले गेल्याची नोंद सिस्टीममध्ये कायमची सेव्ह होते.</li>
    </ol>
  </div>

  <hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 16px 0;">

  <h2 class="chapter-title"><span class="badge">प्रकरण ८</span> अभ्यासाची पुस्तके, नोट्स व कूपन व्यवस्थापन</h2>

  <h3 class="section-title">८.१ डिजिटल बुक्स व नोट्स अपलोड करणे (`/admin/notes`):</h3>
  <p>जर तुम्हाला <code>notes.books.manage</code> अधिकार मिळाला असेल:</p>
  <ul>
    <li><code>/admin/notes</code> वर जाऊन <strong>"+ Add Study Material"</strong> दाबा.</li>
    <li>संबंधित कोर्स निवडा (उदा. <em>Super Memory Mastery</em>).</li>
    <li>साहित्य प्रकार निवडा: <code>PDF Book</code>, <code>Worksheet</code> किंवा <code>Practice Notes</code>.</li>
    <li>फाईल सिलेक्ट करा आणि शीर्षक द्या (उदा. <em>"वैदिक मॅथ्स सूत्र संकलन भाग १"</em>).</li>
    <li><strong>"Publish Note"</strong> दाबताच सर्व विद्यार्थ्यांच्या ॲपमधील लायब्ररीमध्ये हे पुस्तक त्वरित दिसेल.</li>
  </ul>

  <h3 class="section-title">८.२ सवलत कूपन्स बनवणे (`/admin/coupons`):</h3>
  <p>जर तुम्हाला <code>coupons.manage</code> अधिकार मिळाला असेल:</p>
  <ul>
    <li>सेमिनार किंवा शालेय कॅम्पसाठी कूपन तयार करा (उदा. कोड: <code>SATARA500</code>).</li>
    <li>सूट प्रकार: <strong>Flat ₹ Discount (उदा. ₹५०० थेट सूट)</strong> किंवा <strong>Percentage % (उदा. २०% सूट)</strong>.</li>
    <li>मुदत (Expiry Date) आणि एकूण वापर संख्या (उदा. प्रथम १०० विद्यार्थी) सेट करून सेव्ह करा.</li>
  </ul>

  <div class="page-break"></div>

  <!-- ==================== प्रकरण ९ व १० ==================== -->
  <div class="page-header">
    <span class="academy">माइंडमास्टर अकॅडमी</span>
    <span>प्रकरण ९ व १०: माझी ॲक्टिव्हिटी, रोख हिशोब व प्रोफाईल</span>
  </div>

  <h2 class="chapter-title"><span class="badge">प्रकरण ९</span> माझी दैनंदिन ॲक्टिव्हिटी व रोख फी हिशोब (`/sub/activity`)</h2>

  <h3 class="section-title">९.१ वैयक्तिक ऑपरेटर ऑडिट फीड (Personal Audit Timeline):</h3>
  <p>तुम्ही केलेल्या प्रत्येक कामाची नोंद पारदर्शकतेसाठी ठेवली जाते. <code>/sub/activity</code> वर तुम्हाला खालील गोष्टी दिसतात:</p>
  <ul>
    <li><strong>आज दिलेली ॲडमिशन्स:</strong> तुम्ही आज किती विद्यार्थ्यांना मॅन्युअल कोर्स दिला.</li>
    <li><strong>अनलॉक केलेले फोन (DRM Resets):</strong> तुम्ही आज किती विद्यार्थ्यांचे फोन लॉक रीसेट केले.</li>
    <li><strong>अचूक टाईमस्टॅम्प (IST):</strong> कोणत्या मिनिटाला कोणती कृती केली.</li>
  </ul>

  <h3 class="section-title">९.२ गोळा झालेली रोख रक्कम (Today's Cash Collection):</h3>
  <p>सेमिनारमध्ये किंवा ऑफिसमध्ये विद्यार्थ्यांनी रोखीने भरलेली एकूण फी पानाच्या वर ठळक आकड्यात दिसते (उदा. <code>Today's Cash Collected: ₹१४,५००</code>).</p>

  <h3 class="section-title">९.३ संध्याकाळी हिशोब टॅली करणे (Cash Settlement Protocol):</h3>
  <div class="alert-box alert-success">
    <strong>💼 दैनंदिन रोख हिशोब प्रोटोकॉल:</strong><br>
    १. दररोज संध्याकाळी ऑफिस सुटण्यापूर्वी <code>/sub/activity</code> मधील रोख फी तपासा.<br>
    २. जमा झालेली रोख रक्कम मुख्य ॲडमिनकडे (प्रशांत सरांकडे) किंवा अकॅडमीच्या बँक खात्यात जमा करा.<br>
    ३. मुख्य ॲडमिन <code>/admin/sub-admins</code> मधून तुमच्या नावापुढील <strong>"Mark Cash Settled"</strong> करतील.<br>
    ४. यामुळे हिशोबात कधीही तफावत किंवा संशय राहत नाही आणि कर्मचाऱ्याची विश्वासार्हता वाढते!
  </div>

  <hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 16px 0;">

  <h2 class="chapter-title"><span class="badge">प्रकरण १०</span> वैयक्तिक प्रोफाईल, अधिकार व पासवर्ड सेटिंग्स (`/sub/settings`)</h2>

  <h3 class="section-title">१०.१ अधिकार मॅट्रिक्स पाहणे (View My Assigned Permissions):</h3>
  <p><code>/sub/settings</code> वर तुम्हाला मिळालेल्या अधिकारांची यादी दिसते. हिरवे चिन्ह म्हणजे अधिकार चालू आहे आणि लाल चिन्ह म्हणजे अधिकार नाही.</p>

  <h3 class="section-title">१०.२ स्वतःचा पासवर्ड बदलणे (Change Password):</h3>
  <ol class="steps-list">
    <li>पानावरील <strong>"Update Security Password"</strong> सेक्शनमध्ये जा.</li>
    <li>सध्याचा पासवर्ड टाका.</li>
    <li>नवीन सुरक्षित पासवर्ड टाका (किमान ८ अक्षरे, १ अंक, १ विशेष चिन्ह).</li>
    <li><strong>"Update Password"</strong> दाबा. पासवर्ड ताबडतोब बदलला जाईल.</li>
  </ol>
  <div class="alert-box alert-info">
    <strong>💡 सुरक्षिततेचा सल्ला:</strong> दर ३० ते ४५ दिवसांनी स्वतःचा पासवर्ड बदलण्याची सवय ठेवा.
  </div>

  <div class="page-break"></div>

  <!-- ==================== प्रकरण ११ व १२ ==================== -->
  <div class="page-header">
    <span class="academy">माइंडमास्टर अकॅडमी</span>
    <span>प्रकरण ११ व १२: अडचणी निवारण व सुवर्ण नियम</span>
  </div>

  <h2 class="chapter-title"><span class="badge">प्रकरण ११</span> सब-ॲडमिनच्या कामातील १० प्रत्यक्ष अडचणी व आपत्कालीन कृती</h2>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 5%;">क्र.</th>
        <th style="width: 33%;">संभाव्य अडचण / प्रसंग</th>
        <th style="width: 62%;">सब-ॲडमिनने काय करावे? (निवारण कृती)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>१</strong></td>
        <td><strong>पानावर जाताना 'Access Denied / 403' एरर येतो</strong></td>
        <td>तुम्हाला त्या पानाचे अधिकार नाहीत. डॅशबोर्डवर परत जा. जर ते काम तुमच्या जबाबदारीचे असेल तर मुख्य ॲडमिनशी बोलून अधिकार चालू करून घ्या.</td>
      </tr>
      <tr>
        <td><strong>२</strong></td>
        <td><strong>ॲडमिशन दिले पण विद्यार्थ्याच्या ॲपमध्ये कोर्स दिसत नाही</strong></td>
        <td>तुमचा आयडी 'Approval Mode' मध्ये आहे. <code>/admin/grants</code> मध्ये ते 'Pending' दिसत असेल. मुख्य ॲडमिनला सांगून तात्काळ मंजूर करून घ्या.</td>
      </tr>
      <tr>
        <td><strong>३</strong></td>
        <td><strong>विद्यार्थी नवीन फोनमध्ये लॉगिन करू शकत नाही (Device Locked)</strong></td>
        <td><code>/sub/students</code> मध्ये जाऊन विद्यार्थ्याच्या नावापुढील <strong>"Reset Device Lock"</strong> हिरवे बटण दाबा. १ सेकंदात कुलूप उघडेल.</td>
      </tr>
      <tr>
        <td><strong>४</strong></td>
        <td><strong>विद्यार्थी आपला ४-अंकी लॉगिन पिन विसरला</strong></td>
        <td>स्टुडंट ड्रॉवरमधून <strong>"Reset Student PIN"</strong> दाबा. त्याचा पिन डीफॉल्ट <code>1234</code> सेट होईल, ज्याने तो ताबडतोब लॉगिन करू शकेल.</td>
      </tr>
      <tr>
        <td><strong>५</strong></td>
        <td><strong>विद्यार्थ्याचा व्हिडिओ प्ले होत नाही किंवा काळी स्क्रीन येते</strong></td>
        <td>विद्यार्थ्याला इंटरनेट कनेक्शन तपासण्यास सांगा किंवा ॲप बंद करून पुन्हा चालू करण्यास सांगा. अडचण कायम राहिल्यास तिकीट वरिष्ठ ॲडमिनकडे पाठवा.</td>
      </tr>
      <tr>
        <td><strong>६</strong></td>
        <td><strong>पालक म्हणतात पैसे बँक खात्यातून कट झाले पण कोर्स सुरू झाला नाही</strong></td>
        <td>पालकांकडून बँक मेसेजमधील Razorpay Payment ID (उदा. <code>pay_NxYz123</code>) घ्या आणि पडताळणीसाठी मुख्य ॲडमिनला तात्काळ पाठवा.</td>
      </tr>
      <tr>
        <td><strong>७</strong></td>
        <td><strong>विद्यार्थ्याने अर्धी फी दिली आहे व उरलेली फी पुढील महिन्यात देणार आहे</strong></td>
        <td>Grant फॉर्ममध्ये 'Amount Paid' मध्ये भरलेली रक्कम टाका आणि 'Pending Dues' मध्ये उर्वरित रक्कम व पुढील तारीख नोंदवून ठेवा.</td>
      </tr>
      <tr>
        <td><strong>८</strong></td>
        <td><strong>विद्यार्थ्याला दुसरा कोर्स बदलायचा आहे (Course Swap)</strong></td>
        <td>सब-ॲडमिन कोर्स स्वॅप करू शकत नाही; पालकांची विनंती नोंदवून तिकीट मुख्य ॲडमिनकडे (प्रशांत सरांकडे) फॉरवर्ड करा.</td>
      </tr>
      <tr>
        <td><strong>९</strong></td>
        <td><strong>सब-ॲडमिन स्वतःचा लॉगिन पासवर्ड विसरला</strong></td>
        <td><code>https://app.mindmasteredu.in/staff/forgot-password</code> वर जा किंवा मुख्य ॲडमिनला तात्पुरता पासवर्ड रीसेट करण्याची विनंती करा.</td>
      </tr>
      <tr>
        <td><strong>१०</strong></td>
        <td><strong>कामाच्या वेळेत अचानक सर्व सब-ॲडमिन खाती लॉक झाली (Freeze Mode)</strong></td>
        <td>मुख्य ॲडमिनने सुरक्षेसाठी इमर्जन्सी लॉक केला आहे. घाबरू नका; शांत राहा आणि प्रशांत सरांच्या सूचनेची वाट पहा.</td>
      </tr>
    </tbody>
  </table>

  <hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 16px 0;">

  <h2 class="chapter-title"><span class="badge">प्रकरण १२</span> सब-ॲडमिनसाठी १० सुवर्ण नियम व सुरक्षित लॉगआऊट</h2>

  <h3 class="section-title">१२.१ काय करू नये आणि काय करावे (Do's &amp; Don'ts Checklist):</h3>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 50%; background: #991b1b;">कधीही करू नका ❌ (Strictly Prohibited)</th>
        <th style="width: 50%; background: #065f46;">नेहमी हेच करा ✔️ (Best Practice)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>ओळख न पटवता अनोळखी व्यक्तीचा फोन लॉक (DRM) रीसेट करणे.</td>
        <td>विद्यार्थ्याचे नाव व १०-अंकी नंबर विचारून खात्री झाल्यावरच फोन अनलॉक करा.</td>
      </tr>
      <tr>
        <td>गोळा केलेल्या रोख फीची सिस्टीममध्ये नोंद न करता पैसे घेणे.</td>
        <td>प्रत्येक रोख फीची पावती व सिस्टीममध्ये <code>/admin/grants</code> वर त्वरित नोंद करा.</td>
      </tr>
      <tr>
        <td>स्वतःचा सब-ॲडमिन आयडी व पासवर्ड मित्रांना किंवा इतरांना देणे.</td>
        <td>आपला पासवर्ड गोपनीय ठेवा आणि दर ३० दिवसांनी बदला.</td>
      </tr>
      <tr>
        <td>सपोर्ट चॅटवर विद्यार्थ्यांशी किंवा पालकांशी उद्धटपणे बोलणे.</td>
        <td>सपोर्ट चॅटवर नेहमी आदरपूर्वक, नम्र व प्रोत्साहनपर मराठीत संवाद साधा.</td>
      </tr>
      <tr>
        <td>काम संपल्यावर ब्राऊझर उघडा ठेवून कॉम्प्युटर सोडून जाणे.</td>
        <td>काम संपताच नेहमी <strong>"Log Out"</strong> बटण दाबून सेशन सुरक्षित बंद करा.</td>
      </tr>
    </tbody>
  </table>

  <h3 class="section-title">१२.२ सुरक्षित लॉगआऊट (Staff Sign-Out):</h3>
  <div class="info-card">
    <strong>लॉगआऊट करण्याची योग्य पद्धत:</strong>
    <ol class="steps-list" style="margin-top: 6px;">
      <li>स्क्रीनच्या उजव्या वरच्या कोपऱ्यातील लाल <strong>"Log Out"</strong> (किंवा Sign Out) बटणावर क्लिक करा.</li>
      <li>कन्फर्मेशन बॉक्समध्ये <strong>"Yes, Sign Out"</strong> दाबा.</li>
      <li>सिस्टीम ब्राउझरमधील एनक्रिप्टेड कुकी नष्ट करते आणि तुम्हाला पुन्हा <code>/staff/login</code> स्क्रीनवर आणते. यामुळे इतर कोणीही तुमच्या संगणकावरून गैरवापर करू शकत नाही.</li>
    </ol>
  </div>

  <div style="text-align: center; margin-top: 25px; padding-top: 15px; border-top: 1px solid #cbd5e1; font-size: 11px; color: #64748b;">
    <strong>माइंडमास्टर अकॅडमी, सातारा</strong> • आंतरराष्ट्रीय मेमरी ट्रेनर प्रशांत धुमाळ सर • अधिकृत सब-ॲडमिन कार्यपद्धती नियमावली २०२६
  </div>

</body>
</html>
"""

def generate_pdf():
    workspace_dir = os.path.dirname(os.path.abspath(__file__))
    temp_html_path = os.path.join(workspace_dir, "temp_subadmin_manual.html")
    output_pdf_path = os.path.join(workspace_dir, "MindMaster_SubAdmin_Master_Manual_Marathi.pdf")
    desktop_pdf_path = os.path.join(os.path.expanduser("~"), "Desktop", "MindMaster_SubAdmin_Master_Manual_Marathi.pdf")

    print(f"Writing SubAdmin HTML to: {temp_html_path}")
    with open(temp_html_path, "w", encoding="utf-8") as f:
        f.write(HTML_CONTENT)

    edge_paths = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    ]
    browser_bin = None
    for p in edge_paths:
        if os.path.exists(p):
            browser_bin = p
            break

    if not browser_bin:
        print("ERROR: Microsoft Edge not found.")
        sys.exit(1)

    print(f"Using browser: {browser_bin}")
    print("Generating SubAdmin PDF...")
    cmd = [
        browser_bin,
        "--headless",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={output_pdf_path}",
        temp_html_path
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"ERROR generating PDF: {result.stderr}")
        sys.exit(1)

    if os.path.exists(output_pdf_path):
        size_kb = os.path.getsize(output_pdf_path) / 1024
        print(f"SUCCESS: SubAdmin PDF generated successfully! Size: {size_kb:.1f} KB")
        print(f"File path: {output_pdf_path}")

        try:
            with open(output_pdf_path, "rb") as src, open(desktop_pdf_path, "wb") as dst:
                dst.write(src.read())
            print(f"SUCCESS: Copied to Desktop: {desktop_pdf_path}")
        except Exception as e:
            print(f"Warning: Could not copy to Desktop ({e}).")
    else:
        print("ERROR: Output PDF file was not created.")
        sys.exit(1)

if __name__ == "__main__":
    generate_pdf()
