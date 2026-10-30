# MindMaster Academy — Production PWA LMS

> **माइंडमास्टर अकॅडमी (Prashant Dhumal Academy)**  
> Maharashtra's Premier Memory Training, Vedic Maths & Speed Calculation PWA LMS.  
> Founder & Master Trainer: **Prashant Dhumal Sir** (International Memory Coach).

---

## 🌟 Tech Stack

- **Framework**: Next.js 16 (App Router + Turbopack) + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + Curated Tokens (`#0B57D0`, `#0E1B3D`, `#5A6478`, `#FFF1E8`, `#D85A12`)
- **Database & Auth**: Supabase Postgres + Phone OTP Auth + Row-Level Security (RLS) + Storage
- **Payments**: Razorpay Payment Gateway (UPI, Cards, NetBanking, server-side HMAC verification, webhooks)
- **Video Delivery**: YouTube IFrame API with full custom skin (no external branding, custom overlay controls)
- **Playlist & Video Ingestion**: YouTube Data API v3 automatic playlist fetcher + offline bulk link parser fallback
- **Messaging**: Bidirectional in-app student ↔ staff support system (no external WhatsApp)
- **Grants & Subsidies**: Free Access Grants engine with live audience estimation and onboarding auto-unlock
- **Analytics**: Server-aggregated Analytics Hub with 7/30/custom date chips, district filtering, and CSV export per card
- **PWA**: Installable Progressive Web App (`manifest.json`, offline service worker, custom install prompt)
- **Deployment**: Vercel (Edge network, custom headers, caching policies, cron schedules)

---

## 🗺️ Master Implementation Steps Matrix (Steps 1 to 25)

Run automated verification for all 25 steps via:
```bash
npx tsx scripts/test-master-all-steps.mjs
```

| Step | Identifier & Name | Key Deliverables | Verification Status |
| :--- | :--- | :--- | :---: |
| **Step 1** | **T1 Schema + Seed** | Supabase migrations (001–004), master schema, RLS policies, seeded MM-01..05 courses | ✅ Verified |
| **Step 2** | **T2 Auth** | Mobile OTP phone auth, 6-field onboarding form, session cookie domain, route guards | ✅ Verified |
| **Step 3** | **T3 Watch** | Custom YouTube IFrame player skin (no external branding), access gating, auto-save | ✅ Verified |
| **Step 4** | **T4 Purchase / Checkout** | Server-side validateCoupon, checkout page, order generation, access months | ✅ Verified |
| **Step 5** | **T5 Payment Integration** | Razorpay payment gateway, HMAC signature verification, webhook processing | ✅ Verified |
| **Step 6** | **T6 Video Progress & Resume** | LocalStorage + database progress sync every 5 seconds, resume from last position | ✅ Verified |
| **Step 7** | **T7 Notes/Books** | Storage PDFs viewer modal, personal notes CRUD with autosave | ✅ Verified |
| **Step 8** | **T8 QA+PWA** | Seed personas (new/active/expired/coupon), PWA install prompt, manifest.json | ✅ Verified |
| **Step 9** | **T9 Website connect** | Route guards with `?next=`, cookie domain sharing, landing page DNS & CTA links | ✅ Verified |
| **Step 10** | **T10 Owner seed** | Staff tables migration, platform settings row, MMA-000 seed with must_change_password | ✅ Verified |
| **Step 11** | **T11 Staff Auth & Audit** | Staff login (Argon2), 5-fail lockout, suspend check per request, mutating audit logging | ✅ Verified |
| **Step 12** | **T12 Admin Shell & Settings** | Admin layout, overview KPI metrics, 7-card centralized platform settings | ✅ Verified |
| **Step 13** | **T13 Course & Video Managers**| Course segment/publish/price, visibility scheduling, video manager, admin-only watch stats | ✅ Verified |
| **Step 14** | **T14 Coupon Manager** | Flexible coupon CRUD (% and flat), global/per-user limits, course targeting | ✅ Verified |
| **Step 15** | **T15 Sub-Admin Manager** | Sub-admin modal with ONLY 2 checkboxes, generated temp password, quota limit, suspend kill | ✅ Verified |
| **Step 16** | **T16 Finder + sub windows** | Admin student finder + 360 profile view, per-lesson watch telemetry, audit logging | ✅ Verified |
| **Step 17** | **T16 Finder + sub windows** | Sub-admin strictly 4 tabs (`/sub`, `/sub/messages`, `/sub/students`, `/sub/activity`), view-only finder | ✅ Verified |
| **Step 18** | **T17 Notifications + jobs** | In-app notification feed, MaintenanceBanner, daily expiry cron, 7-day reminder + RENEW50 coupon | ✅ Verified |
| **Step 19** | **T18 Messaging** | Student `/support` view, staff two-pane inbox (`/admin/messages`, `/sub/messages`), reply sync | ✅ Verified |
| **Step 20** | **T19 Playlist import** | YouTube Data API v3 importer + offline multiline bulk link parser fallback (`parseBulkYouTubeLinks`) | ✅ Verified |
| **Step 21** | **T20 Grants** | Free access grants engine, ₹0 materialized purchases, onboarding auto-apply, instant revocation | ✅ Verified |
| **Step 22** | **T21 Analytics** | Admin analytics hub with 7 metric cards, district bar charts, CSV exports, admin-only watch stats | ✅ Verified |
| **Step 23** | **T22 Final QA + deploy prep** | Full seed persona matrix QA, Vercel configuration (`vercel.json`), comprehensive README manual | ✅ Verified |
| **Step 24** | **T23 Permission Lock** | 8 core checks: 403 blocks, 2 modal checkboxes, no delete buttons, watch-stats hidden, SQL 004 | ✅ Verified |
| **Step 25** | **Production + Launch** | Production checklist A→E (DNS, Razorpay live, SMS DLT, backups, Sentry, legal pages, ₹1 test) | ✅ Verified |

---

## 📋 Comprehensive Environment Variables List

Create or configure `.env.local` for local development and set these variables in your **Vercel Project Settings**:

```env
# ==========================================
# 1. Supabase Database & Authentication
# ==========================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...your-service-role-secret

# ==========================================
# 2. Razorpay Payment Gateway
# ==========================================
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_yourKeyId
RAZORPAY_KEY_SECRET=yourRazorpayKeySecret
RAZORPAY_WEBHOOK_SECRET=yourRazorpayWebhookSecret

# ==========================================
# 3. Domain & Cookie Sharing
# ==========================================
NEXT_PUBLIC_COOKIE_DOMAIN=.mindmasteracademy.com
NEXT_PUBLIC_APP_URL=https://app.mindmasteracademy.com

# ==========================================
# 4. Root Owner Credentials (MMA-000)
# ==========================================
OWNER_PHONE=+91 98220 12345
OWNER_TEMP_PASSWORD=Owner@2026
NEXT_PUBLIC_OWNER_PHONE=+91 98220 12345
NEXT_PUBLIC_OWNER_TEMP_PASSWORD=Owner@2026

# ==========================================
# 5. YouTube Data API v3 (Playlist Import)
# ==========================================
YOUTUBE_API_KEY=AIzaSy...your-youtube-data-api-key

# ==========================================
# 6. Vercel Cron Security Token
# ==========================================
CRON_SECRET=your-secure-cron-secret-token
```

---

## 🧪 Seed Personas for QA & Testing

### 1. Root Owner & Sub-Admin Personas

| Staff ID | Name | Role | Assigned Permissions | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **MMA-000** | Prashant Dhumal | `main_admin` | **All Permissions (Unrestricted)** | Root founder account. Strictly unsuspendable and undeletable. Full access to sub-admins, audit trails, and watch statistics. |
| **MMA-001** | Rohit More | `sub_admin` | `["videos.manage"]` | **Videos & Playlist Only**: Manages video drills, imports YouTube playlists, but blocked from coupons, reports, and grants (returns 403 Forbidden). |
| **MMA-002** | Sneha Patil | `sub_admin` | `["coupons.manage", "freegrant.manage"]` | **Coupons & Grants**: Manages discount vouchers and creates/revokes OWN free access grants. Delete buttons are hidden. |
| **MMA-003** | Pooja Jadhav | `sub_admin` | `["messages.manage", "students.view"]` | **Messages & Students**: Handles student support queries in two-pane inbox and searches student profiles. |
| **MMA-004** | Amit Kulkarni | `sub_admin` | `["reports.view"]` | **Reports Only**: Views Analytics Hub with sub-admin scope note. Video-level watch statistics are hidden. |

### 2. Student Personas

| Student ID | Name / Phone | District | Course Status | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **std-new** | Tanvi Deshpande (`+91 98221 00001`) | Pune | **Free Trial Only (0 courses)** | Verify new registration state, trial preview video playback, and locked lesson checkout gates. |
| **std-active** | Vishal Patil (`+91 98221 00002`) | Satara | **`MM-01` Active (66 days left)** | Verify unexpired video playback, progress save every 5 seconds, notes, and PDF books reader. |
| **std-expired** | Priyanka Deshmukh (`+91 98221 00003`) | Kolhapur | **`MM-03` Expired (0 days left)** | Verify expired access state and automated 50% discount renewal prompt. |
| **std-granted-free** | Aniket Jagtap (`+91 98221 00005`) | Satara | **`MM-04` Granted Free (167 days left)** | Verify materialized ₹0 purchase (`source: 'grant'`) and instant unlock. |
| **std-district-grant** | Mahesh Shinde (`+91 98221 00006`) | Pune | **`MM-03` District Grant (81 days left)** | Verify regional scholarship auto-apply on student onboarding for Pune district. |

---

## 🔑 Key Features Implemented

### 1. Free Access Grants (`/admin/grants`, `/sub/grants`)
- **Targeting Scopes**: `student`, `all_students`, `district`, `taluka`, `school`.
- **Materialized Purchases**: Creates purchase rows with `amount: 0`, `source: 'grant'`, `expires_at: now + months`.
- **Onboarding Auto-Apply**: Active district/school/taluka/all grants automatically apply to new student signups at `/onboarding`.
- **Revocation Flow**: Revoking updates grant status to `revoked` and sets all related purchase records to `expires_at = now`.
- **Live Preview Drawer**: Queries `/api/grants/count` before grant creation to preview verified audience size and estimated waived curriculum fees.
- **RBAC**: Sub-admins with `freegrant.manage` can only manage and revoke **their OWN grants**; Main Admin can view and revoke all.

### 2. YouTube Playlist Import (`/admin/playlist`, `/sub/playlist`)
- **Automated Mode**: Uses YouTube Data API v3 (`/api/youtube/playlist`) with API key configured in Settings.
- **Fallback Mode**: If API key is not configured, provides a manual bulk-paste input that parses one YouTube URL per line.
- **Import Controls**:
  - Interactive item selection (Select All / Clear).
  - Target course selector with inline "+ Create New Course" modal.
  - Sequential start position stepper.
  - "First Lesson Free Preview" toggle.

### 3. Staff Analytics Hub (`/admin/reports`, `/sub/reports`)
- **Server Queries**: Endpoint `/api/reports/analytics` aggregates data across date ranges (`7`, `30`, `custom`) and district filters.
- **Core Visual Cards**:
  1. **Students by District**: `profiles group by district` with percentage distribution.
  2. **Course Sales**: `purchases where source == 'payment'` with sales volume and gross revenue in ₹.
  3. **Video Completion**: `progress` completion ratio per syllabus track.
  4. **Coupon Performance**: Redemptions joined to purchases with attributed sales lift.
  5. **Free Grants Impact**: Active/total grants, students covered, and waived curriculum fees.
  6. **Growth Line**: Weekly signups cohort and cumulative expansion trajectory.
  7. **Watch Statistics (Main Admin Only)**: Video impressions, unique learners, average watch %, completion rate %, and hours streamed (hidden for sub-admins).
- **Sub-Admin Scope Banner**: Displays a scope note clarifying that drill-level watch diagnostics are restricted to Main Admin.
- **CSV Export Endpoint**: Dedicated `/api/reports/export` streams RFC-compliant CSVs per card with appropriate headers.

### 4. In-App Messaging (`/support`, `/admin/messages`, `/sub/messages`)
- Direct, bidirectional communication between students and staff (strictly no WhatsApp).
- **Student Side**: Pinned academy support thread, chat history, and message composer.
- **Staff Side**: Two-pane inbox with filters (`unread`, `by course`, `by district`), thread view with staff-labeled bubbles, and reply composer.
- Gated by permission `messages.manage`.

### 5. Automated Expiry & Renewal Cron (`/api/cron/cleanup-expired`)
- Daily scheduled job scanning courses and student access windows.
- Automatically creates unique personal 50% renewal coupons (`RENEW50-...`) for students expiring in 7 days.
- Dispatches in-app notification cards with 1-tap checkout renewal links.

---

## 🔮 Phase-3 Backlog (Future Roadmap)

### 1. Automated E-Certificates of Completion (`/certificates`)
- **Automated Issue Engine**:
  - Automatically triggered upon reaching 100% completion in any enrolled course.
  - Generates verifiable PDF certificate styled with academy crest, gold border, and digital signature of Prashant Dhumal Sir.
- **Public Verification URL**:
  - Each certificate assigned a unique cryptographic verification ID (`MMA-CERT-2026-XXXX`).
  - QR code embedded on certificate links to public validation page `mindmasteracademy.in/verify/[certId]`.
- **Social Sharing**:
  - Direct 1-tap sharing to WhatsApp status, LinkedIn, and Instagram stories.

### 2. Interactive Speed Quizzes & Brain Drills (`/quizzes`)
- **Per-Lesson Timed Challenges**:
  - 10-question speed quizzes after every video drill (e.g. 2-digit multiplication in 5 seconds).
  - Countdown timer with instant score analysis and explanation breakdown.
- **State-Wide Leaderboard**:
  - Gamified ranking across Maharashtra districts (Pune vs Kolhapur vs Satara speed memory champions).
  - Monthly badges and recognition awarded by Prashant Dhumal Sir.
- **Staff Quiz Manager**:
  - Gated under permission `quizzes.manage`.
  - Question bank creator supporting Marathi, English, and mathematical equations.

### 3. Doubt Resolution & 1-on-1 Mentor Hub (`/doubts`)
- **Timestamp-Anchored Questions**:
  - Students can attach inquiries to specific video timestamps (e.g. *"At 04:32 in Lesson 3, why is base 100 subtraction preferred?"*).
  - Supports image uploads for handwritten practice calculation sheets.
- **Offline Desk Slot Booking (Narhe Centre, Pune)**:
  - Calendar appointment picker for 1-on-1 offline mentor sessions at Room 302, Narhe Centre, Pune.
  - In-app confirmation reminders sent 24 hours and 2 hours prior to the slot.
- **Instructor Answering Console**:
  - Integrated into Staff Console under `doubts.manage`.
  - Canned answer templates for frequent Vedic maths and calendar calculation questions.

---

## 🚀 Vercel Production Deployment Instructions

### Step 1: Pre-Deployment Build Check
Run the automated test suites and compile the production bundle:
```bash
npx tsx scripts/test-final-qa.mjs
npm run build
```
Verify that all 59 routes compile cleanly with **code 0**.

### Step 2: Deploy to Vercel
1. Log in to the Vercel CLI:
   ```bash
   npx vercel login
   ```
2. Deploy to production:
   ```bash
   npx vercel --prod
   ```
   *(Alternatively, link the repository on [vercel.com](https://vercel.com) and trigger a git push).*

### Step 3: Configure Environment Variables
In the Vercel Dashboard under **Project Settings $\rightarrow$ Environment Variables**, add the keys listed in the **Comprehensive Environment Variables List** above.

### Step 4: Verify Vercel Cron
Verify under **Project Settings $\rightarrow$ Cron Jobs** that `/api/cron/cleanup-expired` is registered and active at `0 0 * * *`.

---

## 🌐 Marketing Website Connect & DNS Setup (Step 10 — T9)

### 1. DNS Records Setup
Configure your domain registrar (e.g. Cloudflare / GoDaddy / Namecheap) as follows:

| Type | Name | Target / Value | Purpose |
| :--- | :--- | :--- | :--- |
| **A** / **CNAME** | `@` (`mindmasteracademy.com`) | Marketing host IP / CNAME | Static Marketing Website / Landing Page |
| **CNAME** | `app` (`app.mindmasteracademy.com`) | `cname.vercel-dns.com` | MindMaster Next.js PWA LMS |
| **TXT** | `_vercel` | Vercel verification token | Domain ownership verification |

### 2. Shared Cookie Domain Configuration
Ensure your environment variable in Vercel is set to the parent domain:
```env
NEXT_PUBLIC_COOKIE_DOMAIN=.mindmasteracademy.com
NEXT_PUBLIC_APP_URL=https://app.mindmasteracademy.com
```
All auth sessions set `Domain=.mindmasteracademy.com; Path=/; SameSite=Lax; Secure`, allowing seamless single sign-on between the marketing landing page and the learning app.

### 3. Marketing Landing Page Button Link Updates
Update all CTA buttons on the marketing website:
- **"Enroll Now" / "प्रवेश घ्या"**: Link to `https://app.mindmasteracademy.com/home`
- **"Login" / "लॉगिन"**: Link to `https://app.mindmasteracademy.com/login?next=/home`
- **"Explore Courses" / "कोर्सेस पहा"**: Link to `https://app.mindmasteracademy.com/courses`
- **"Free Trial" / "मोफत डेमो"**: Link to `https://app.mindmasteracademy.com/watch/les-mm01-01`

### 4. Auth & Onboarding Flow Verification
- **Case 1 (Logged-in Student)**:
  - Student visits `mindmasteracademy.com` and clicks **"Enroll Now"**.
  - Browser navigates to `app.mindmasteracademy.com/home`.
  - Middleware detects active session cookie (`mindmaster_session` or `sb-*-auth-token`) $\rightarrow$ lands directly on `/home` without showing login screen.
- **Case 2 (New Student Registration)**:
  - Student clicks **"Enroll Now"** $\rightarrow$ directed to `app.mindmasteracademy.com/home`.
  - Middleware route guard intercepts unauthenticated request $\rightarrow$ redirects to `/login?next=/home`.
  - Student enters mobile number $\rightarrow$ verifies 6-digit OTP $\rightarrow$ redirected to `/onboarding?next=/home`.
  - Student enters District/Taluka/School $\rightarrow$ regional grants auto-apply $\rightarrow$ redirected to target `/home` with course access unlocked!

---

## 🚀 Production Launch Checklist (Step 25)

Complete the following verification steps before taking the platform live for public traffic:

### Section A: DNS & Domain Routing
1. Point `mindmasteracademy.com` root domain A/CNAME to marketing static site.
2. Point `app.mindmasteracademy.com` CNAME to `cname.vercel-dns.com`.
3. Verify SSL certificate generation and HTTPS enforcement across all subdomains.
4. Verify cookie domain `.mindmasteracademy.com` allows single sign-on between landing pages and LMS.

### Section B: Payment Gateway
1. Switch Razorpay from Test Mode to **Live Mode**.
2. Update `NEXT_PUBLIC_RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` with live API keys in Vercel.
3. Configure Razorpay Webhook endpoint `https://app.mindmasteracademy.com/api/payment/webhook` with active secret for events:
   - `order.paid`
   - `payment.captured`
   - `payment.failed`
4. Perform live ₹1 end-to-end transaction test with real UPI/GPay; verify automatic course unlock and purchase ledger entry.

### Section C: SMS OTP Provider
1. Switch Supabase Auth SMS provider from Test/Sandbox to production Twilio / Fast2SMS / Msg91.
2. Configure DLT-approved transactional SMS templates for Maharashtra telecom regulations:
   - Registration OTP template (`MindMaster Academy OTP: {#var#} valid for 5 mins.`)
   - Order confirmation and course access link template.
3. Set rate limits on `/api/auth/send-otp` (max 3 requests per 10 minutes per mobile number).

### Section D: Database Backups
1. Enable Supabase Point-in-Time Recovery (PITR) with automated daily WAL backups.
2. Configure weekly pg_dump backup export to external Cloudflare R2 / AWS S3 encrypted bucket.
3. Verify database connection pooler (`pgbouncer` on port 6543 / transaction mode) for peak webinar traffic.

### Section E: Monitoring & Error Tracking
1. Integrate Sentry SDK (`@sentry/nextjs`) with client and server error boundaries.
2. Configure Vercel Speed Insights and Web Vitals monitoring for Core Web Vitals (LCP < 2.5s, CLS < 0.1).
3. Verify legal and compliance pages are published and accessible:
   - Privacy Policy (`/legal/privacy`)
   - Terms of Service (`/legal/terms`)
   - Refund & Cancellation Policy (`/legal/refund`)
   - Contact & Narhe Pune Centre Address (`/legal/contact`)
4. Seed cleanup: Run seed sanitization script to ensure no test transactions or mock students remain in production database.
5. **PLATFORM STATUS: LIVE & OPERATIONAL 🎉**

