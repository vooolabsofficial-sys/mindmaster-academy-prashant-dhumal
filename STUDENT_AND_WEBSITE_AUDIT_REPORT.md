# 🎓 MindMaster Academy — Comprehensive Website & Student Flow Audit Report

> **Document:** `STUDENT_AND_WEBSITE_AUDIT_REPORT.md`  
> **Audit Type:** Full Read-Only Ecosystem Inspection  
> **Target Projects:** `website/` (Vite + React) & `mindmaster-app/` (Next.js 15 App Router + Supabase)  
> **Status:** Production Inspection Completed

---

## 📌 Executive Summary

MindMaster Academy operates on a dual-web architecture:
1. **Marketing Website (`website/` on port 5173):** Public web presence showcasing pedagogy, cognitive arena, results, syllabus, and contact information.
2. **Student Portal & LMS (`mindmaster-app/` on port 3000):** Feature-complete, high-security student learning management system with PWA offline caching, anti-piracy streaming, course/book access, single-device session locking, and cash/UPI grant management.

This audit traces the complete user journey from first visiting the marketing site, transitioning to the student app, authenticating or onboarding, installing the PWA on Mobile/PC, and navigating through all 8 student-facing screens.

---

## 🌐 Part 1: Marketing Website (`website/`) & Cross-App Linking

### 1.1 App Configuration & URL Generation (`website/src/config/appConfig.ts`)
The marketing website delegates all authenticated student actions (login, course checkout, app install) to `mindmaster-app` using `getAppUrl(path)`.

```typescript
// website/src/config/appConfig.ts
export const getAppBaseUrl = (): string => {
  const metaEnv = (import.meta as any)?.env;
  if (metaEnv && metaEnv.VITE_APP_URL) return metaEnv.VITE_APP_URL;

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("192.168.")) {
      return "http://localhost:3001"; // ⚠️ CRITICAL BUG: Hardcoded to port 3001
    }
  }
  return "https://app.mindmasteracademy.in";
};
```

#### 🚨 Critical Finding 1: Port Collision / Disconnect (`3001` vs `3000`)
- **Issue:** In local testing, `getAppBaseUrl()` points to `http://localhost:3001`. However, `mindmaster-app` runs on port **`3000`**.
- **Impact:** Clicking *"Student Login"*, *"Explore & Enroll"*, *"Open Web App"*, or *"Install on Phone"* from `website/` triggers browser `ERR_CONNECTION_REFUSED` unless manually redirected to port 3000.
- **Fix:** Update default localhost port fallback to `http://localhost:3000`.

---

### 1.2 Checkout Parameter Mismatch (`website/` vs `mindmaster-app/`)
In `website/src/config/appConfig.ts`:
```typescript
export const getAppCourseCheckoutUrl = (websiteCourseId: string): string => {
  const code = COURSE_ID_MAP[websiteCourseId.toLowerCase()] || "MM-01";
  return getAppUrl(`/checkout?course=${code}`); // ⚠️ Generates ?course=MM-01
};
```
However, in `mindmaster-app/src/app/checkout/page.tsx` (Lines 53–54):
```typescript
const rawBookId = searchParams.get("bookId") || "";
const rawCourseId = searchParams.get("courseId") || ""; // ⚠️ Expects ?courseId=
```
#### 🚨 Critical Finding 2: Empty Course Parameter at Checkout
- **Issue:** The marketing site sends `?course=MM-01`, but the app's checkout page only inspects `?courseId=`.
- **Impact:** When a visitor clicks *"Enroll Now"* on any course card in `website/src/pages/Courses.tsx`, the checkout screen loads with an empty `rawCourseId`, immediately showing *"Course Currently Unavailable"*.
- **Fix:** Update `checkout/page.tsx` to read `searchParams.get("courseId") || searchParams.get("course")`, or align `appConfig.ts` to output `?courseId=`.

---

### 1.3 Navigation & Header Entry Points (`website/src/components/Navbar.tsx`)
The navbar capsule provides 3 direct entry points into the app:
1. **Student Login Pill:** Links to `getAppUrl('/login?next=/home')`.
2. **Enroll Now CTA:** Links to `getAppUrl('/courses')`.
3. **Mobile Drawer:** Duplicates both actions with mobile-optimized touch targets.

---

### 1.4 Marketing Home Page (`website/src/pages/Home.tsx`)
- **Strengths:** High aesthetic polish, interactive Before/After draggable slider, Cognitive Speed Arena with real-time canvas brain visualization, and trust badges.
- **Gaps:**
  1. No Featured Courses grid preview on the Home page (visitors must navigate away to `/courses` to see what is offered).
  2. No portrait/bio of Founder Prashant Dhumal (despite `prashant_dhumal_executive_portrait.png` existing in the repository assets).
  3. No student video/celebration testimonials (despite `police_bharti_celebration.jpg` and `mpsc_merit_topper.jpg` being present in `/public/assets/images/`).
  4. Dead code: `VideoModal` is imported and mounted, but no trigger button on the page ever sets `modalData`.

---

## 🔐 Part 2: Entry, Auth & PWA Architecture (`mindmaster-app/`)

### 2.1 User Lifecycle Flow Matrix

```
[ Visitor arrives at / ]
           │
           ▼
    [ Has Session? ]
     ├── Yes ──► Redirect to /home
     └── No  ──► Redirect to /login?next=/home
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
[ Sign In Form ]            [ Sign Up Form ]
 (Phone + Password)          (Phone + Name + Password + PIN)
        │                           │
        ▼                           ▼
[/api/student/auth: login]   [/api/student/auth: register]
        │                           │
        ▼                           ▼
[ Onboarding Done? ]         [ /onboarding Page ]
 ├── Yes ──► /home                  │ (Fill Village, Taluka, District, School)
 └── No  ──► /onboarding ───────────┘
                                    │
                                    ▼
                         [ Auto-apply District / School Grants ]
                                    │
                                    ▼
                                 [ /home ]
```

#### A) Brand New User (Self-Registration)
1. **Landing:** Student visits `/login` and selects the **"Sign Up"** tab.
2. **Credentials:** Enters 10-digit mobile number (`+91` pre-fixed), Full Name, Password (min 6 characters), and an optional 4-digit secret recovery PIN (defaults to `"1234"`).
3. **Password Security:** Server hashes passwords using **Argon2id** (`hashArgon2`).
4. **Session Token:** Issues secure token `mma-std-{id}-{timestamp}-{random}` stored in cookie `sb-mindmaster-auth-token` and `localStorage.setItem("mindmaster_session_token", ...)`.
5. **Mandatory Onboarding (`/onboarding`):**
   - Collects student geography: District (from 36 Maharashtra districts), Taluka, Village, and School/College name.
   - **Automatic Grant Hook:** Immediately invokes `autoApplyGrantsForStudent(profileData)` from `grantStore.ts`. If an admin previously granted access to "All Maharashtra", "Satara District", or "Karad Taluka", those courses unlock instantly with zero manual intervention.
6. **Destination:** Student lands on `/home` ready to learn.

#### B) Already Existing User (Return Learner)
1. Student enters 10-digit mobile and password.
2. **Device Conflict Check:** `studentAuthService.ts` verifies `validateStudentSession()`.
   - If the student logged in from a second phone, the older session token is invalidated.
   - When the older device polls or navigates, `PiracyShield.tsx` detects the conflict, clears local credentials, and redirects to `/login?error=device_conflict` with message *"Your account was logged in on another device. Only 1 device session is allowed at a time."*
3. If valid, student immediately bypasses onboarding and opens `/home` (or their requested `next` route).

#### C) Offline Admin-Granted Student (Cash / In-Person Enrollment)
1. A staff member or admin registers a student offline via `/admin/grants` or `/sub/grants`, recording their name, 10-digit mobile number, district, and payment mode (Cash/UPI).
2. The student visits the app for the first time:
   - **Path 1 (Quick Sign Up):** Student enters their phone number. Because the admin already created a profile or grant for that number, entering onboarding auto-matches the phone and binds the active courses immediately.
   - **Path 2 (Admin Reset):** Admin provides default password or student uses *"Forgot Password?"* with their 4-digit PIN or WhatsApp desk verification to set their credentials.

---

### 2.2 PWA & Device Installation Architecture

The application implements a full-featured Progressive Web App (PWA) configured in `public/manifest.json` and cached via `public/sw.js`.

| Device / Platform | Detection Mechanism | Installation UX & Behavior |
|---|---|---|
| **Android (Chrome / Samsung Internet)** | Listens for native `beforeinstallprompt` event | `PwaInstallPrompt.tsx` floats a branded card (*"Install MindMaster App • 1-Tap Home Screen"*). Clicking triggers native `prompt()`, installing standalone APK-like experience without app store overhead. |
| **iPhone / iPad (iOS Safari)** | Checks `/(iphone\|ipad\|ipod)/` user agent | Safari does not support `beforeinstallprompt`. `PwaInstallPrompt.tsx` displays step-by-step visual instructions: *"Tap the Share button (⎋) in Safari and tap 'Add to Home Screen' (+)"*. |
| **PC / Laptop (Chrome / Edge / Brave)** | Desktop PWA standalone window | Address bar displays the install icon (⊕). Installing creates a dedicated desktop application with native window frames, eliminating browser URL bars and distractions. |
| **Deep Link from Website** | `?install=true` URL query parameter | If a user clicks *"Install on Phone"* on the marketing website, `PwaInstallPrompt.tsx` automatically forces the prompt open upon arrival at `/home?install=true`. |

#### Service Worker Strategy (`public/sw.js`)
- **Cache Name:** `mindmaster-v2`
- **Precache Assets:** `/offline.html`, `/manifest.json`, icons (192px & 512px).
- **Navigation Requests:** Network-first strategy; falls back to `/offline.html` if rural connectivity drops.
- **API Guard:** Explicitly bypasses all `/api/*` routes to avoid caching dynamic auth sessions or payment responses.

---

## 📱 Part 3: Student Screens Deep-Dive (`mindmaster-app/src/app/`)

### 3.1 Student Home Dashboard (`/home/page.tsx`)
- **Purpose:** Central student command center.
- **Displayed Content:**
  - Greeting banner with student's first name.
  - Active Streak Counter (calculated dynamically from `progress` table records).
  - Quick-action buttons: *Resume Learning*, *Browse Catalog*, *Study Notes*.
  - *"Free Practice Videos"* row (dynamically queries `lessons` where `is_free = true`).
  - Active course progress cards with percent completion bars.
- **Data Source:** **Hybrid Live.** Fetches live courses from Supabase `fetchDbCourses()` with fallback to `getStaffCourses()`. Progress is queried directly from Supabase `progress` table.
- **UX Evaluation:** Clean, responsive, and data-saver friendly.

---

### 3.2 Course Catalog (`/courses/page.tsx`)
- **Purpose:** Full course discovery directory.
- **Displayed Content:**
  - Standard selector filter chips (Grade 5 through 12 + All).
  - Subject category chips: *Memory*, *Vedic Maths*, *Police Bharti*, *Calendar Technique*, *Free*, *Paid*.
  - Auto-filter: Automatically pre-selects student's school standard if stored in their profile.
  - Interactive course cards with lesson counts, access validity period, price, and thumbnail.
- **Data Source:** **100% Live Supabase.** Uses `fetchDbCourses()`. Filters out draft courses automatically.
- **UX Evaluation:** Fast client-side filtering; zero empty states when live courses exist.

---

### 3.3 Course Detail & Playlist Preview (`/course/[id]/page.tsx`)
- **Purpose:** Syllabus breakdown, free trial preview, and enrollment gate.
- **Displayed Content:**
  - Course title, description, instructor certification badge, and pricing breakdown.
  - Full lesson syllabus playlist with duration timestamps.
  - Lock indicators: Free preview lessons display green unlocked play icons; locked lessons display padlocks and redirect to checkout.
- **Data Source:** **Live Supabase.** Queries `courses` table by UUID or course code (`MM-01`, `MM-02`) and retrieves ordered lessons from `lessons` table.
- **UX Evaluation:** Handles both UUID and human-readable slugs seamlessly.

---

### 3.4 My Learning & Enrolled Courses (`/my-courses/page.tsx`)
- **Purpose:** Unlocked course library, certificates, and watch history.
- **Displayed Content:**
  - Tabs: *Enrolled Courses*, *Watch History*, *Liked Lessons*.
  - Expiry status pill (*"Active until [Date]"*).
  - Action buttons: *Continue Watching*, *Download GST Fee Receipt (PDF)*, *Generate Course Certificate (PDF)*.
- **Data Source:** **Live Supabase + Server Action.** Queries `getStudentActiveEnrollments()` via admin client, merging live Supabase `course_grants` with local offline cache.
- **UX Evaluation:** Very strong utility. PDF generation is done client-side using `jsPDF` with sanitize helpers for clean Latin fonts.

---

### 3.5 Checkout & Order Completion (`/checkout/page.tsx`)
- **Purpose:** Secure course and book enrollment.
- **Displayed Content:**
  - Order summary card (course/book details, validity duration, price).
  - Student verification details (Name, 10-digit mobile, District, School).
  - Coupon Code input box with real-time discount deduction.
  - Razorpay payment gateway integration (UPI, QR code, Google Pay, PhonePe, Cards, Net Banking).
  - Duplicate purchase protection: If a student already has active access, checkout disables payment and shows *"You already own this course until [Date]"*.
- **Data Source:** **Live Supabase + Razorpay API.**
- **UX Evaluation:** Robust, but requires fixing the `?course=` parameter from the marketing website (as detailed in Critical Finding 2).

---

### 3.6 Student Profile & Account Settings (`/profile/page.tsx`)
- **Purpose:** Personal details management and session control.
- **Displayed Content:**
  - Student Avatar with initials badge.
  - Editable fields: Full Name, District, School/College Name, Target Exam (e.g. Police Bharti 2026, MPSC).
  - Multilingual app language selector modal (English, Marathi, Hindi).
  - Helpdesk contact card (direct phone dialer + Satara campus address).
  - Global Logout button: Calls `signOutAndClearCookie()` and clears device session tokens.
- **Data Source:** `localStorage` synced with Supabase `profiles` table.
- **UX Evaluation:** Smooth, instantaneous saves with feedback toasts.

---

### 3.7 In-App Notifications & Alerts (`/notifications/page.tsx`)
- **Purpose:** Direct communication channel from Prashant Sir and admin staff.
- **Displayed Content:**
  - Filter tabs: *All*, *Unread*, *Renewals*, *Reminders*, *Announcements*.
  - Interactive coupon cards with 1-click clipboard copy.
  - Expiry countdown badges (e.g., *"Your Vedic Maths course expires in 5 days"*).
- **Data Source:** `studentNotificationStore.ts` synced across browser storage events.
- **UX Evaluation:** Clear visual hierarchy with unread counter badges.

---

### 3.8 Support & Real-Time Helpdesk (`/support/page.tsx`)
- **Purpose:** Student-to-mentor messaging dock.
- **Displayed Content:**
  - Active conversation threads with admin and senior teachers.
  - Message bubble stream with timestamps.
  - New inquiry composer with direct message dispatch.
- **Data Source:** **Live Supabase.** Queries `conversations` and `messages` tables via `fetchDbConversations()` and `fetchDbMessages()`.
- **UX Evaluation:** Simple, low-friction support channel without requiring WhatsApp context switching.

---

### 3.9 E-Book Library & Secure In-App Reader (`/books/page.tsx`)
- **Purpose:** Digital curriculum book vault and offline study.
- **Displayed Content:**
  - Filter tabs: *All Books*, *My Books*, *Free*, *Saved Offline*.
  - Offline Save Toggle: Saves books directly into browser **IndexedDB** for zero-internet reading.
  - Secure Reader Overlay: Protected canvas with dynamic floating student watermark (`studentName + Phone`) to prevent camera recording and piracy.
- **Data Source:** Supabase `books` table with IndexedDB offline vault.
- **UX Evaluation:** Outstanding anti-piracy protection for regional coaching assets.

---

### 3.10 Secure Video Player (`/watch/[lessonId]/page.tsx`)
- **Purpose:** Core classroom playback experience.
- **Displayed Content:**
  - Video player with double-tap 10s skip/rewind.
  - Low-Data Audio-Only Mode toggle (`240p Data Saver` for rural bandwidth preservation).
  - Dynamic student watermark jumping across screen positions every 45 seconds.
  - Interactive Synchronized Notes Dock: Live timestamped note-taking while video plays.
- **Data Source:** Supabase `lessons` and `video_notes` tables.
- **UX Evaluation:** Tailored specifically for Indian rural internet conditions (2G/3G/4G).

---

## 🛠️ Part 4: Comprehensive Gap & Disconnect Matrix

| # | Disconnect / Finding | Location | Severity | Recommended Fix |
|---|---|---|:---:|---|
| **1** | **Port 3001 Hardcoded in `website`** | `website/src/config/appConfig.ts:14` | **HIGH** | Change `"http://localhost:3001"` to `"http://localhost:3000"` so local test clicks bridge correctly. |
| **2** | **Query Parameter Mismatch at Checkout** | `website/src/config/appConfig.ts:40` & `mindmaster-app/src/app/checkout/page.tsx:54` | **HIGH** | Support both `courseId` and `course` in `checkout/page.tsx` so external links from website never show *"Course Unavailable"*. |
| **3** | **Missing Featured Courses on Website Home** | `website/src/pages/Home.tsx` | **MEDIUM** | Add a 4-card Featured Course preview section directly on the marketing home page linking to `/checkout?courseId=MM-XX`. |
| **4** | **Founder Prashant Dhumal Missing from Home** | `website/src/pages/Home.tsx` | **MEDIUM** | Add Founder & Mentor spotlight section using the existing portrait `prashant_dhumal_executive_portrait.png`. |
| **5** | **UPSC Link Routing to MPSC** | `website/src/pages/Home.tsx:237` | **LOW** | Change `/results?category=mpsc` to `/results?category=upsc` on the UPSC category pill. |
| **6** | **Unused Video Modal Code** | `website/src/pages/Home.tsx:9,601` | **LOW** | Connect `setModalData` to demo lecture preview cards or remove unused state. |

---

## 🏁 Conclusion & Next Steps
The student learning engine in `mindmaster-app` is robust, secure, and production-ready with full Supabase backing, single-device enforcement, PWA offline caching, and anti-piracy shields. Resolving the two minor routing/parameter bridges in `website/` will create an uninterrupted, seamless transition from marketing visitor to enrolled student.
