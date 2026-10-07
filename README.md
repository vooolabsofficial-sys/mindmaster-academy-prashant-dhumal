# 🎓 MindMaster Academy — Official Website

> **Founder & Master Coach**: Prashant (Sagar) Dhumal  
> **Location**: Satara, Maharashtra  
> **Tech Stack**: React 19 + TypeScript (TSX) + Vite + Tailwind CSS + React Router  

---

## 📂 प्रकल्प रचना (Project Structure)

```
mind master acadamy  prashant dhumal/
├── src/
│   ├── components/
│   │   ├── Navbar.tsx          # मुख्य हेडर, नॅव्हिगेशन व मोबाईल हॅम्बर्गर मेनू
│   │   └── Footer.tsx          # ग्लोबल फुटर, कोर्सेस लिंक्स, फोन व सोशल लिंक्स
│   ├── pages/
│   │   ├── Home.tsx            # मुख्य होमपेज (हिरो, कोर्सेस, आकडेवारी, टेस्टिमोनियल्स)
│   │   ├── Courses.tsx         # ५ कोर्सेस: मेमरी, ट्रेनर, पोलीस भरती, कॅलेंडर, वैदिक गणित
│   │   ├── About.tsx           # प्रशांत धुमाळ सर, अकॅडमी प्रवास, कार्यशाळा गॅलरी
│   │   ├── Results.tsx         # विद्यार्थ्यांचे निकाल, आकाश मोरे, पूजा देशमुख व यशोगाथा
│   │   ├── Contact.tsx         # ॲडमिशन चौकशी, पत्ते, फोन, थेट संपर्क फॉर्म
│   │   ├── DemoHub.tsx         # ६० सेकंदांचा कोर्स शोधक व डेमो क्लास बुकिंग
│   │   └── DesignSystem.tsx    # UI डिझाईन सिस्टीम व घटक संदर्भ
│   ├── App.tsx                 # राऊट्स आणि लेआउट
│   ├── main.tsx                # ॲप्लिकेशन बूटस्ट्रॅप
│   └── index.css               # Tailwind CSS बेस डायरेक्टिव्ह्ज
├── public/
│   └── assets/
│       ├── images/             # सर्व १९ मूळ हाय-रिझोल्यूशन इमेजेस
│       └── screenshots/        # मूळ Stitch स्क्रीन संदर्भ स्क्रीनशॉट्स
├── html_backup/                # मूळ HTML फाईल्सचा सुरक्षित बॅकअप
├── tailwind.config.js          # अकॅडमीचे ब्रँड कलर्स व फॉन्ट्स (Literata + Manrope)
├── tsconfig.json               # TypeScript Configuration
└── package.json                # प्रोजेक्ट डिपेंडन्सीज व कमांड्स
```

---

## ⚡ प्रकल्प कसा चालवावा? (How to Run)

### १. डेव्हलपमेंट सर्व्हर सुरू करा (Start Development Server)
```bash
npm run dev
```
ब्राउझरमध्ये **`http://localhost:3000/`** उघडा.

### २. प्रॉडक्शन बिल्ड तयार करा (Production Build)
```bash
npm run build
```
`dist/` फोल्डरमध्ये तयार झालेल्या फाईल्स कोणत्याही होस्टिंगवर थेट अपलोड करता येतात.

---

## ✏️ बदल कसे करावे? (How to Edit Content)

- **फोन नंबर किंवा संपर्क माहिती बदलायची असल्यास**:
  - `src/components/Footer.tsx` आणि `src/pages/Contact.tsx` मध्ये बदला.
- **नवीन कोर्स जोडायचा असल्यास**:
  - `src/pages/Courses.tsx` मध्ये कोर्स कार्ड जोडा.
- **फोटो किंवा इमेज बदलायची असल्यास**:
  - नवीन इमेज `public/assets/images/` मध्ये ठेवा आणि संबंधित `.tsx` पेजमध्ये पाथ द्या.
