# MindMaster Academy — System Security, Backup & Disaster Recovery Guide

> **Confidential & Important:** हे डॉक्युमेंट Voolabs आणि MindMaster Academy च्या संपूर्ण सिस्टीमचे मास्टर सिक्युरिटी व रिकव्हरी मॅन्युअल आहे. भविष्यात कधीही सर्व्हर, डेटाबेस किंवा कोड रिस्टोअर करायचा असल्यास खालील सर्व माहिती वापरता येईल.

---

## १. मास्टर क्रेडेन्शियल्स आणि कीज (Credentials Reference)

सर्व सिक्रेट कीज आणि पासवर्ड्स सुरक्षिततेसाठी **`mindmaster-app/.env.local`** फाईलमध्ये स्थानिक पातळीवर सेव्ह आहेत. GitHub वर कोणत्याही सिक्रेट कीज अपलोड केल्या जात नाहीत (`.gitignore` सुरक्षित केले आहे).

| Key | Description | Status |
| :--- | :--- | :--- |
| **NEXT_PUBLIC_SUPABASE_URL** | `https://xyycqnpqnrtumoemlels.supabase.co` | Live & Connected |
| **DATABASE_URL** | `postgres://postgres:[DB_PASSWORD]@db.xyycqnpqnrtumoemlels.supabase.co:5432/postgres` (Stored in `.env.local`) | PostgreSQL 15+ |
| **OWNER_PHONE** | `+918459344077` | Prashant Dhumal Sir (Owner Account MMA-000) |
| **OWNER_TEMP_PASSWORD** | Stored in `.env.local` / Secure Vault | Master Initial Admin Access |
| **SUPPORT_PHONE** | `+918459344077` | Public Support & WhatsApp Helpline |
| **SUPPORT_EMAIL** | `mindmasterdhumal@gmail.com` | Official Academy Email |

---

## २. डेटाबेस आर्किटेक्चर आणि २३ टेबल्स (Database Schema)

सर्व २३ टेबल्सचे संपूर्ण SQL स्ट्रक्चर खालील दोन फाईल्समध्ये कायमस्वरूपी सेव्ह आहे:
* **Master Schema File:** `mindmaster-app/supabase/consolidated_production_schema.sql`
* **Direct Migration Deployer:** `mindmaster-app/scripts/deploy-live-schema.mjs`

### प्रमुख टेबल्स:
1. **`profiles`**: विद्यार्थी प्रोफाईल्स, फोन नंबर, Argon2 पासवर्ड हॅश, ४-अंकी सिक्युरिटी पिन, सत्र टोकन, इयत्ता व ऑनबोर्डिंग स्थिती.
2. **`courses`**: सर्व कोर्सेस, किंमती (Paise), व्हेलिडिटी महिने, कॅटेगरी.
3. **`lessons`**: व्हिडिओ धडे, कालावधी, YouTube/HLS लिंक्स.
4. **`course_grants`**: विनामूल्य किंवा ॲडमिनने दिलेल्या कोर्सेसचे ॲक्सेस.
5. **`staff_accounts` & `staff_permissions`**: ॲडमिन व सब-ॲडमिन परवानग्या (८ बारीक परवानग्या).
6. **`settings`**: अकॅडमी सेटिंग्स, Razorpay कीज, Keep-Alive टाईमस्टॅम्प.
7. **`audit_log` & `audit_logs`**: कोणतीही ॲडमिन ॲक्शन रेकॉर्ड करणारा टाइमस्टॅम्प लॉग.

---

## ३. ऑटो-कीप-अलाइव्ह सिस्टीम (Supabase कधीही बंद पडणार नाही)

* **समस्या:** Supabase चा फ्री टियर ७ दिवस कोणताही डेटाबेस वापर नसेल तर आपोआप **"Paused"** होतो.
* **आपला कायमस्वरूपी उपाय:**
  1. **API Endpoint:** `src/app/api/cron/keep-alive/route.ts` तयार केला आहे, जो दररोज `settings` टेबलमध्ये हलकी अपडेट क्वेरी करतो.
  2. **Vercel Cron:** `vercel.json` मध्ये `"0 6 * * *"` (दररोज सकाळी ६ वाजता) हा क्रॉन जॉब स्वयंचलित चालेल.
  3. **Browser Silent Ping:** विद्यार्थी किंवा ॲडमिन ॲप वापरत असताना दर १२ तासांनी एकदा बॅकग्राउंडमध्ये सायलेंट पिंग जाते.

---

## ४. स्टुडंट डेटा ड्युअल-बॅकअप (Dual-Safety Persistence)

* विद्यार्थ्यांची खाती, सत्रे (Sessions) आणि ऑनबोर्डिंग डेटा **एकाच वेळी दोन ठिकाणी** सुरक्षित राहतो:
  1. **लाइव्ह Supabase Cloud (`profiles` टेबल):** मुख्य क्लाउड डेटाबेस.
  2. **स्थानिक डिस्क कॅशे (`mindmaster-app/.data/students-store.json`):** सर्व्हर क्रॅश झाला किंवा इंटरनेट तात्पुरते गेले तरी लोकल डिस्कवरून डेटा ताबडतोब वाचला जातो.

---

## ५. वन-क्लिक बॅकअप आणि रिस्टोर कमांड्स (Recovery Commands)

भविष्यात कधीही डेटाचा संपूर्ण बॅकअप घ्यायचा असेल किंवा रिस्टोअर करायचा असेल तर खालील कमांड्स उपलब्ध आहेत:

### संपूर्ण लाईव्ह डेटाबेसचा बॅकअप घेण्यासाठी:
```bash
node scripts/create-live-backup.mjs
```
* हा कमांड लाइव्ह Supabase मधील सर्व २३ टेबल्सचा डेटा `mindmaster-app/backups/latest_supabase_backup.json` मध्ये सुरक्षित सेव्ह करतो.

### नवीन सर्व्हरवर संपूर्ण डेटाबेस पूर्ववत (Deploy) करण्यासाठी:
```bash
node scripts/deploy-live-schema.mjs
```

### एंड-टू-एंड स्टुडंट ऑथ टेस्ट चालवण्यासाठी:
```bash
npm run test:e2e-live
```

---

## ६. डोमेन आणि होस्टिंग स्ट्रक्चर (Vercel Architecture)

* **वेबसाईट (Vite + React):** `https://mindmasteracademy.in` (Root Domain)
* **वेब ॲप (Next.js 16 Portal):** `https://app.mindmasteracademy.in` (Subdomain)
* **कुकी डोमेन:** `.mindmasteracademy.in` (वेबसाईटवरून ॲपमध्ये जाताना लॉगिन आपोआप टिकून राहते).
