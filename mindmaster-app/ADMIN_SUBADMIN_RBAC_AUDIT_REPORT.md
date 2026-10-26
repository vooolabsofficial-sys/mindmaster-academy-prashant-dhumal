# MindMaster Academy — Technical Audit Report
## Main Admin, Sub-Admin, Staff Auth & RBAC System Architecture

**Document Version:** 1.0.0  
**Project:** `mindmaster-app`  
**Audit Type:** Read-Only Full System Inspection & Codebase Audit  
**Author / Reviewer:** Antigravity Engineering  
**Scope:** Admin (`/admin/*`), Sub-Admin (`/sub/*`), Staff Auth (`/staff/*`), RBAC Components, Navigation, Supporting APIs & Data Stores  

---

## 1. Executive Summary

MindMaster Academy operates a role-based access control (RBAC) architecture separating **Main Admin** (Founder / Supreme Authority — Prashant Dhumal, `MMA-000`) and **Sub-Admins** (Regional / Study Desk Staff, e.g. Narhe Centre Hub).

This audit documents:
1. **Every single `/admin/*`, `/sub/*`, and `/staff/*` page**: exact UI widgets, buttons, filters, modal forms, and whether they interact with live Supabase PostgreSQL tables or browser `localStorage` / memory stores.
2. **Sub-Admin vs Main Admin Capabilities**: Permission keys (`staff_permissions`), visual console identities, and dual-layer UI/API enforcement.
3. **Complete Inventory of "Notes" References**: Every file and line where student or admin "Notes" is referenced, facilitating clean migration to "Books Only".
4. **Current Gaps, Stubs & Architectural Vulnerabilities**: Highlighting in-memory persistence models, unsigned session cookies, and client-side direct mutations.

---

## 2. Page-by-Page Technical Breakdown

### A. Main Admin Pages (`/admin/*`)

---

#### 1. Mission Control Overview — [`src/app/admin/page.tsx`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/admin/page.tsx)
* **Exact Features & Visual Widgets:**
  * **Top Metrics Row:** Realized Paid Revenue (₹), Total Paid Orders, Active Courses, Active Coupons, Total Learners, Free Grants Waived Value.
  * **Interactive Controls:** Time filter buttons (`7D`, `30D`, `90D`, `ALL`), District filter dropdown (Maharashtra districts), Refresh button, and 1-Click Master Excel Export (`.xlsx`).
  * **Recent Purchases Live Feed:** Real-time table of recent customer orders (Student Name, Phone, Item Title, Mode, Date, Amount).
  * **Course Performance Grid:** Progress bars showing sales share, order counts, and revenue per course.
  * **System Status Health Indicator:** Online status badge with Narhe Centre study desk meta.
* **Modals & Drawers:** None directly on page (links out to sub-modules).
* **Data Sources & Supabase vs Storage:**
  * **Hybrid / Live Supabase First:** Directly queries live Supabase tables: `purchases` (with `profiles(full_name, phone)` join), `courses`, `coupons`, `course_grants`, and `profiles`.
  * **Fallback:** If Supabase query fails or returns empty offline, falls back to `staffStore.ts` (`getStaffCourses()`, `getStaffCoupons()`, `getStaffStudents()`) and `grantStore.ts` (`getGrants()`).

---

#### 2. System Audit Trail — [`src/app/admin/audit/page.tsx`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/admin/audit/page.tsx)
* **Exact Features & Visual Widgets:**
  * **Header:** Title with `adminOnly` badge and event counter chip.
  * **Filters:** Free-text search (operator, action, entity, details), Staff member dropdown filter, Action type dropdown filter (`COURSE_CREATE`, `COUPON_CREATE`, `STUDENT_360_VIEW`, etc.), Date range chips (`All Time`, `Today`, `Last 7 Days`, `This Month`).
  * **Log Table:** Columns for Timestamp, Operator (with `ADMIN` / `SUB` badge), Action Type, Target Entity, Details.
  * **Action Button:** "Export Audit Log (.csv)" button (generates browser CSV).
* **Permission Enforcement:** Gated by `<PermissionGuard adminOnly={true}>`.
* **Data Sources & Supabase vs Storage:**
  * **Client localStorage / Memory Store:** Currently calls `getAuditLogs()` from `staffStore.ts` (stored under `KEYS.AUDIT_LOGS` in `localStorage`).
  * **Gap:** Does **not** query the `/api/staff/audit` endpoint or `audit_logs` Supabase table on initial render; logging writes both to `localStorage` and asynchronously inserts to Supabase `audit_logs`, but reads currently pull from local storage.

---

#### 3. Coupons & Scholarship Vouchers — [`src/app/admin/coupons/page.tsx`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/admin/coupons/page.tsx)
* **Exact Features & Visual Widgets:**
  * **Header & Quick Creation:** Promo generator bar with Code input, Discount type (`%` or `Flat ₹`), Discount value, Scope (`All Courses`, `Specific Course`, `Digital Book`), Quick Generate button (`MMA-` prefix), and "+ Advanced Coupon" drawer trigger.
  * **Top Metric Tiles:** Active Promos count, Total Redemptions count, Total Discount Given (₹), Attributed Gross Revenue (₹).
  * **Coupon Cards Grid:** Interactive coupon tickets with dashed borders, discount pills, validity dates, total redemptions vs limits, and target school/district tags.
  * **Card Actions:** Toggle Status (`Pause` / `Activate`), Copy Code button, Edit drawer trigger, Delete button (Main Admin only).
* **Modals & Drawers:**
  * **Slide-over Advanced Coupon Drawer:** Custom code, Discount mode (`Percentage` vs `Flat Amount`), Validity (`Fixed Expiry Date` vs `Rolling Days from creation`), Min Order Value, Max Total Uses, Max Uses Per User, Target Category/Curriculum, Multi-Course & Multi-Book checklists, and School/College specificity.
  * **Delete Confirmation Modal:** Admin-only confirmation dialog.
* **Permission Enforcement:** Gated by `<PermissionGuard permission="coupons.manage">`.
* **Data Sources & Supabase vs Storage:**
  * **Hybrid:** Reads initially via `getStaffCoupons()` from `staffStore.ts` (with live fetch attempt from Supabase `coupons` table).
  * **Writes:** `saveStaffCoupon()` updates `localStorage` and upserts to Supabase table `coupons`, plus deletes/re-inserts relations in `coupon_courses` and `coupon_books`.

---

#### 4. Course Builder & Target Segments — [`src/app/admin/courses/page.tsx`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/admin/courses/page.tsx)
* **Exact Features & Visual Widgets:**
  * **Top Metrics Row:** Total Courses, Live Active Courses, Total Curriculum Hours, Total Enrolled Learners.
  * **Target Segment Filter Pills:** `All Segments`, `School/Students`, `Police Bharti Aspirants`, `MPSC/UPSC Candidates`, `General Memory`.
  * **Status Filter:** `All`, `Live Only`, `Drafts Only`.
  * **Course Cards Grid:** Course card with header tint (mint, sky, peach, lavender), course code (`MM-01`), Title, Subtitle, Lessons count, Pricing (Free vs Paid ₹), Target audience badge, and Validity (months).
  * **Card Actions:** Toggle Status (`Live` / `Draft`), Edit Course drawer, View in Video Manager link, and Delete button (Main Admin only).
* **Modals & Drawers:**
  * **Course Creation / Edit Slide-Over Drawer:** Code (`MM-XX`), Title (English & Marathi `title_mr`), Subtitle, Description, Category, Target Segment, Standards (multi-select: 5th–10th, 11th–12th, Graduate), Header Tint picker, Price (₹) & Original Price (₹), Free course checkbox, Access duration (1–12 months), Status (`live`, `draft`), Badge text, and Key feature highlights.
  * **Delete Course Modal:** Main Admin only.
* **Permission Enforcement:** Gated by `<PermissionGuard permission="courses.manage">`.
* **Data Sources & Supabase vs Storage:**
  * Reads via `getStaffCourses()` (`localStorage`); updates via `saveStaffCourse()` which updates `localStorage` and upserts to Supabase table `courses` (`code` unique constraint).

---

#### 5. Free Access Grants Manager — [`src/app/admin/grants/page.tsx`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/admin/grants/page.tsx)
* **Exact Features & Visual Widgets:**
  * **Summary Metrics:** Active Grants, Students Covered, Total Waived Value (₹), Revoked Grants count.
  * **Filters:** Search (reason, recipient, course, author), Scope type filter (`All`, `District`, `Taluka`, `School`, `Student`, `All Students`), Status filter (`All`, `Active`, `Revoked`), Sub-Admin View toggle (`My Grants` vs `All Academy Grants`).
  * **Grant Registry Table:** Scope & Recipient, Item Access (Course or Book), Duration & Validity, Coverage count, Reason, Status badge, Created By & Date, Revoke Action button.
* **Modals & Drawers:**
  * **Create Free Access Grant Drawer:**
    * Target Scope selector: `District` (with quick-select buttons for Pune, Satara, Kolhapur, etc.), `Taluka`, `School` (quick-select popular schools), `Student` (student picker dropdown or phone), `All Students`.
    * Item type selector: `Course` (Specific Course or All Academy Courses) vs `Digital Book` (Paid / Standalone book dropdown).
    * Access duration slider (1–12 months).
    * **Live Server Match Preview Card:** Debounced API query to `/api/grants/count` reporting exact matching profile count and estimated waived fee total.
    * Grant Reason & Approval Note mandatory textarea.
  * **Revoke Confirmation Modal:** Immediate access termination confirmation dialog.
* **Permission Enforcement:** Gated by `<PermissionGuard permission="freegrant.manage">`. Sub-Admins can only revoke grants created by their own `staff_id`.
* **Data Sources & Supabase vs Storage:**
  * **Reads:** Calls `fetchDbGrants()` from Supabase table `course_grants` with local fallback to `grantStore.ts`.
  * **Audience Match Query:** Hits live `/api/grants/count` route querying Supabase `profiles` table.
  * **Writes:** `createGrant()` updates `mma_grants`, `mma_grant_purchases`, `mindmaster_active_purchases`, and performs batch insert into Supabase table `course_grants`.

---

#### 6. In-App Student Support Messages — [`src/app/admin/messages/page.tsx`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/admin/messages/page.tsx)
* **Exact Features & Visual Widgets:**
  * **Two-Pane Messenger Layout:**
    * **Left Pane:** Search input, Filter pills (`All`, `Unread`, `By Course`, `By District`), Course dropdown selector, District dropdown selector, and scrollable Conversation List with student avatar, unread bubble, last message snippet, and timestamp.
    * **Right Pane:** Active Conversation Header with student details and course badge, message bubble feed with Staff vs Student distinction, and message composer input with Enter-to-send.
* **Modals & Drawers:** None (embedded 2-pane layout).
* **Permission Enforcement:** Gated by `<PermissionGuard permission="messages.manage">`.
* **Data Sources & Supabase vs Storage:**
  * **Local Storage / In-Memory Store Only:** Uses `messageStore.ts` (`safeGetItem`/`safeSetItem` targeting `mma_conversations` and `mma_messages`).
  * **Gap:** No live Supabase table read/write is wired up for conversations/messages.

---

#### 7. Personal Activity Timeline — [`src/app/admin/my-activity/page.tsx`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/admin/my-activity/page.tsx)
* **Exact Features & Visual Widgets:**
  * **Header Banner:** Staff ID badge (`staff_id = MMA-XXX`), personal events counter, and summary cards (Role & Designation, Assigned Staff ID, Active Permission Keys count).
  * **Filter Pills:** `All Activity`, `Students & 360`, `Courses`, `Lessons & Videos`, `Coupons`.
  * **Vertical Chronological Timeline:** Action icon nodes, action badge, target entity name, entity type, timestamp, operation details, Log ID, and operator name.
* **Modals & Drawers:** None.
* **Permission Enforcement:** Open to any logged-in staff member inside `<AdminShell>`.
* **Data Sources & Supabase vs Storage:**
  * Reads `getAuditLogs()` from `staffStore.ts` (`localStorage`) and filters rows where `staffId === currentStaff.id`.

---

#### 8. Digital Books & Notes Manager — [`src/app/admin/notes/page.tsx`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/admin/notes/page.tsx)
* **Exact Features & Visual Widgets:**
  * **Top Metrics Row:** Total Books, Free Books (100% free), Paid Books (standalone), Course-Linked Books.
  * **Search & Filters:** Search input (title, code `BK-01`, course, topic), Filter pills (`All Books`, `Free for All`, `Paid Standalone`, `Course-Linked`, `Live Only`, `Drafts Only`).
  * **Books Grid:** Pastel header tint strip with code & badge, book cover thumbnail, course link indicator, page count, file size (MB), pricing display (Free vs ₹ price with crossed original price), PDF preview link.
  * **Card Actions:** "Make Paid" / "Make Free" toggle button, "Publish Live" / "Unpublish Draft" toggle button, Edit details button, Delete button (Main Admin only).
* **Modals & Drawers:**
  * **Create / Edit Book Modal:** Access mode selector (`100% Free for All Students`, `Paid Standalone Book`, `Included with Specific Course`), Code (`BK-XX`), Title, Subtitle, Description, Course selector, Price & Original Price inputs, Access duration (months), Pages count, File size (MB), Cover image URL (with 6 preset buttons), PDF file path (with 4 preset buttons), Status (`live`, `draft`, `archived`), Header Tint selector (mint, sky, peach, lavender, pink), and Badge text.
  * **Delete Book Confirmation Modal:** Main Admin only.
* **Permission Enforcement:** Gated by `<PermissionGuard permission="notes.books.manage">`.
* **Data Sources & Supabase vs Storage:**
  * **Live Supabase First:** In `useEffect`, executes `supabase.from("books").select("*, courses(title)")` to load real records; updates via `saveStaffBook()` which writes to `localStorage` and upserts to Supabase `books` table.

---

#### 9. Course & Playlist Builder — [`src/app/admin/playlist/page.tsx`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/admin/playlist/page.tsx)
* **Exact Features & Visual Widgets:**
  * **Top Header:** Title with `videos.manage` badge and "Back to Video Manager" link.
  * **API Key Notice:** Displays warning banner if YouTube Data API key is missing in Platform Settings, providing link to `/admin/settings`.
  * **Mode Tabs:** `Fetch YouTube Playlist (API)` (active if API key set) vs `Bulk Paste Video Links (Manual)`.
  * **API Import Input:** Playlist URL / ID input with "Fetch Playlist Lessons" button.
  * **Bulk Paste Input:** Multiline textarea supporting `Title | URL` or raw video links.
  * **Target Curriculum Settings Bar:** Course selector dropdown, "+ New Course" inline modal trigger, Starting Lesson Position (default 1), "First Lesson Free Preview" checkbox, Default validity / live days input.
  * **Parsed Lessons Review Table:** Select all checkbox, Individual item checkboxes, Video thumbnail, Video ID, Editable Lesson Title, Duration, and Remove row button.
  * **Import Execution Button:** "Import X Selected Lessons into Course" with real-time success/failure alert.
* **Modals & Drawers:**
  * **Inline Course Creation Modal:** Title, Category, and Price inputs to spin up a new course without leaving the playlist builder.
* **Permission Enforcement:** Gated by `<PermissionGuard permission="videos.manage">`.
* **Data Sources & Supabase vs Storage:**
  * Hits `/api/youtube/playlist` for YouTube Data API v3; imports via `importPlaylistLessons()` in `playlistStore.ts` which saves to `mma_videos` (`localStorage`) and upserts lessons into Supabase table `lessons`.

---

#### 10. Staff Analytics Hub & Reports — [`src/app/admin/reports/page.tsx`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/admin/reports/page.tsx)
* **Exact Features & Visual Widgets:**
  * **Top Filters:** Date Range chips (`7 Days`, `30 Days`, `Custom`), District selector dropdown, "Export Excel (.xlsx)" master export button.
  * **Custom Date Range Bar:** Start Date and End Date pickers with "Apply Date Filter" button.
  * **Sub-Admin Scoped Notice:** Displays scope restriction notice explaining that learner playback telemetrics are hidden for Sub-Admins.
  * **Top KPI Cards:** Gross Paid Revenue (₹), Paid Enrollments, Video Completion Ratio (%), Subsidized Grant Value (₹).
  * **7 Detailed Analytical Cards:**
    1. *Students by District:* Percentage progress bars grouped by Maharashtra districts + "Export District CSV" button.
    2. *Course Sales:* Paid order counts, gross revenue, and percentage share per course + "Export Sales CSV" button.
    3. *Video Completion:* Progress completed ratios per course + "Export Completion CSV" button.
    4. *Coupon Performance:* Code, discount type, orders count, attributed gross revenue, total discount given + "Export Coupon CSV" button.
    5. *Free Grants Impact:* Active grants, students covered, waived fees total, and scope breakdown pills (`Single Student`, `District`, `School`, `Taluka`, `All`) + "Export Grants CSV" button.
    6. *Growth Line:* Weekly cohort registrations with cumulative student count + "Export Growth CSV" button.
    7. *Watch Statistics (Main Admin Exclusive):* Lecture name, Course, Total views, Unique learners, Average watch %, Completion rate, Hours streamed + "Export Watch Stats CSV" button.
* **Permission Enforcement:** Gated by `<PermissionGuard permission="reports.view">`. Card 7 (Watch Statistics) is hidden from Sub-Admins in the UI and blocked on the API.
* **Data Sources & Supabase vs Storage:**
  * Queries server route `/api/reports/analytics?range=...&district=...` (which aggregates Supabase tables: `purchases`, `profiles`, `progress`, `coupons`, `course_grants`) with local calculation fallback via `analyticsEngine.ts`.
  * Exports trigger `/api/reports/export?card=...` generating live server-side CSV files.

---

#### 11. Master Platform Settings — [`src/app/admin/settings/page.tsx`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/admin/settings/page.tsx)
* **Exact Features & Visual Widgets:**
  * **Header:** "ADMIN ONLY" badge and "Save All Configurations" commit button.
  * **Card 1 (Payments / Razorpay):** Key ID input, Key Secret input, "Show/Mask Key" button, Live Production vs Sandbox (Test) toggle, and Webhook Active connection status indicator.
  * **Card 2 (YouTube API):** Google / YouTube Data API v3 key input with Show/Hide toggle and configuration status indicator.
  * **Card 3 (Course & Video Defaults):** Default Course Access (months), Default Video Live Window (days), Default Coupon Validity (days).
  * **Card 4 (System Capacity & Quota Limits):** Maximum Allowed Sub-Admins input with visual capacity progress bar (`x / max_sub_admins Slots Used`), Concurrent Student Devices ceiling.
  * **Card 5 (In-App Retention Notifications):** Auto-send reminders toggle, Expiry reminder template textarea (supporting `{name}`, `{course}`, `{days}`, `{percent}`), Renewal coupon discount percentage, and Live In-App Notification Preview bubble.
  * **Card 6 (Academy Profile & Narhe Desk):** Academy Title, Founder Name, Centre Address, Support Phone, Support Email.
  * **Card 7 (System Maintenance Mode):** Master Maintenance toggle with student-facing warning banner preview.
* **Permission Enforcement:** Gated by `<PermissionGuard adminOnly={true}>`.
* **Data Sources & Supabase vs Storage:**
  * **Reads/Writes:** Uses `getPlatformSettings()` and `savePlatformSettings()` from `staffStore.ts`.
  * **Supabase Sync:** `savePlatformSettings()` updates `localStorage` and upserts to Supabase table `settings` (`id = 1`). Also supported by server route `/api/settings` (`GET`/`POST`).

---

#### 12. Student Finder & 360 Telemetrics — [`src/app/admin/students/page.tsx`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/admin/students/page.tsx)
* **Exact Features & Visual Widgets:**
  * **Header:** "Grant Admission / Offline Access" button, "Export Excel (.xlsx)" button, and In-App notification badge.
  * **Filters:** Typo-tolerant fuzzy search input (Fuse.js), District dropdown, Taluka dropdown, School/College dropdown, Enrolled Course dropdown, and Progress filter chips (`All`, `0-25%`, `26-75%`, `76-99%`, `100%` - Main Admin only).
  * **Students Table:** Student Name & Phone, Region & School, Enrolled Course Code badges, Watch Telemetrics progress bar (Main Admin only), Status badge (`● Active`), Action buttons.
  * **Table Row Actions:** Direct WhatsApp deep link (`wa.me/91...`), "360 View" drawer trigger, "Alert" in-app notification modal trigger, "Grant Access" admission modal trigger.
* **Modals & Drawers:**
  * **360 Student Telemetrics Slide-Over Drawer:**
    * Header with student name, enrollment date, direct WhatsApp button, and Direct Call button (`tel:`).
    * Registration & Institutional profile card (phone, email, district, taluka, school, standard).
    * Enrolled courses with access expiry countdown chips (`Expires in X days`, `Access Expired`) and progress bars.
    * Per-Lesson Watch Telemetry breakdown (Lecture title, course code, minutes watched, completion %) — **Main Admin Only**; Sub-Admins see a locked clearance notice.
    * Recent Learning & Portal Activity event feed.
    * Mandatory audit logging (`STUDENT_360_VIEW`) dispatched on drawer open.
  * **Send In-App Notification Modal:** Title, Body, and target student preview with instant delivery feedback.
  * **Grant Admission / Offline Access Modal:** 10-digit mobile number, Student Name, Course selector, Access duration (months), Payment Mode (`Cash`, `Direct UPI PhonePe/GPay`, `Free Grant / Scholarship`), Amount Paid (₹), Approval Remarks. On submit, displays a receipt dialog with one-click WhatsApp receipt dispatch.
* **Permission Enforcement:** Gated by `<PermissionGuard permission="students.view">`.
* **Data Sources & Supabase vs Storage:**
  * Reads from `getStaffStudents()` (`localStorage` / `staffStore.ts`).
  * Offline cash admission calls `grantCashAdmission()` in `grantStore.ts` which inserts into Supabase table `course_grants` and updates student profiles.

---

#### 13. Sub-Admin Provisioning Manager — [`src/app/admin/sub-admins/page.tsx`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/admin/sub-admins/page.tsx)
* **Exact Features & Visual Widgets:**
  * **Header:** Quota chip (`x / max_sub_admins Sub-Admins Provisioned`), "+ Add New Sub-Admin" button (auto-disabled if capacity reached).
  * **Filters:** Search (name, staff ID, phone, email), Status filter (`All`, `Active`, `Suspended`), Permission filter chips (`All`, `messages.manage`, `students.view`).
  * **Sub-Admins Table:** Staff ID badge (`MMA-001`, `MMA-002`...), Staff details (name, phone, email, `FOUNDER` badge for root), Assigned Permissions chips, Status badge, Instant Suspend toggle switch, Edit button, Delete button (Main Admin only).
  * **Bottom Embedded System Audit Trail Card:** Filterable audit log viewer with staff filter, action filter, date range chips, and immutable event rows.
* **Modals & Drawers:**
  * **Slide-over Provisioning Drawer:** Auto-assigned Staff ID display, Full Name, Email, Mobile phone (+91), Permission checkboxes (`messages.manage`, `students.view`), "Require password reset on first login" toggle.
  * **Temporary Credentials Modal (Shown Once Upon Creation):** Displays assigned Staff ID, temporary password (e.g. `TempXy@4921`), and "Copy Credentials" button formatted for SMS/WhatsApp onboarding.
  * **Delete Confirmation Modal:** Permanent deletion modal.
* **Permission Enforcement:** Gated by `<PermissionGuard adminOnly={true}>`.
* **Data Sources & Supabase vs Storage:**
  * Reads/writes via `getStaffUsers()`, `saveStaffUser()`, `toggleStaffStatus()`, and `deleteStaffUser()`.
  * Upserts to Supabase table `staff_accounts` and `staff_permissions`.

---

#### 14. Video Lecture Manager — [`src/app/admin/videos/page.tsx`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/admin/videos/page.tsx)
* **Exact Features & Visual Widgets:**
  * **Header:** "Import Playlist" link (to `/admin/playlist`), "+ Link Video Lecture" drawer trigger.
  * **Filters:** Search query (title, video ID), Course dropdown, Status filter (`All`, `Active`, `Expiring Soon`, `Expired`).
  * **Video Lectures Table:** Lesson Position & Title, Target Course, Video Stream Type (`YouTube` / `Custom HLS`), Video ID / Preview Link, Expiry Countdown Chip (`Expires in X days`), Free Preview indicator, Action buttons.
  * **Actions:** Edit details, Open external stream preview, Delete video (Main Admin only).
* **Modals & Drawers:**
  * **Video Lecture Drawer:** Video stream type selector (`YouTube` vs `Custom HLS`), Link or Video ID input (with automatic YouTube URL parser), Lesson Title, Course selector, Publish date-time picker, Validity mode (`Rolling Days` vs `Fixed Removal Date`), Free Preview toggle, Duration in minutes, Lesson description, Lesson position, Part number, Series title.
  * **Delete Confirmation Modal:** Main Admin only.
* **Permission Enforcement:** Gated by `<PermissionGuard permission="videos.manage">`.
* **Data Sources & Supabase vs Storage:**
  * Reads and writes to `getStoredVideos()` (`mma_videos` in `localStorage`).
  * **Gap:** Does not directly read from Supabase `lessons` table on mount; sync to `lessons` table only occurs when using the Playlist Import flow.

---

### B. Sub-Admin Portal Pages (`/sub/*`)

---

#### 1. Sub-Admin Dashboard — [`src/app/sub/page.tsx`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/sub/page.tsx)
* **Exact Features & Visual Widgets:**
  * **Assigned Operational Authority Banner:** Displays logged-in Sub-Admin name, email, specific provisioned permission keys (`messages.manage`, `students.view`), "MMA-000 Provisioned" badge, Narhe Study Centre node status, and "View My Audit Log" link.
  * **3 Scoped Stat Tiles:**
    1. *Student Support & Messages:* Active conversations count, unread count, "Open Support Inbox →" link.
    2. *Student Cohorts (View Only):* Learner count, 360 profile lookup note, "Search Learners →" link.
    3. *Operator Audit Feed:* Personal actions count, "View My Activity Timeline →" link.
  * **Permitted Module Launchers Card:** Direct launcher cards for In-App Messages, Student Finder, and My Activity.
  * **Recent Assigned Activity Table:** Real-time feed of actions performed by this specific Sub-Admin ID.
  * **Scoped Policy Warning Banner:** Explicit disclaimer that courses, video catalog, playlist importer, coupons, grants, books, analytics, settings, and deletion operations are strictly reserved for Main Admin.
* **Permission Enforcement:** Styled specifically for Sub-Admin view.
* **Data Sources:** Reads from `staffStore.ts` and `messageStore.ts` (`localStorage` / in-memory).

---

#### 2. Sub-Admin Activity — [`src/app/sub/activity/page.tsx`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/sub/activity/page.tsx)
* **Implementation:** Thin wrapper rendering `<MyActivityPage />` from [`src/app/admin/my-activity/page.tsx`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/admin/my-activity/page.tsx).
* **Behavior:** Renders the personal audit timeline filtered strictly to the Sub-Admin's own `staffId`.

---

#### 3. Sub-Admin Support Messages — [`src/app/sub/messages/page.tsx`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/sub/messages/page.tsx)
* **Implementation:** Streamlined version of `/admin/messages`.
* **Features:** Two-pane student support messenger. Filters are simplified to free-text search and `All` vs `Unread` (course and district filters omitted). Allows reading threads, marking as read, and replying as staff.
* **Permission Enforcement:** Gated by `<PermissionGuard permission="messages.manage">`.
* **Data Sources:** Uses `messageStore.ts` (`localStorage`).

---

#### 4. Sub-Admin Student Finder — [`src/app/sub/students/page.tsx`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/sub/students/page.tsx)
* **Implementation:** Renders `<StudentFinderPage />` from [`src/app/admin/students/page.tsx`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/admin/students/page.tsx).
* **Automatic Sub-Admin Redactions:**
  * Progress percentage filter chips are hidden.
  * The "Watch Telemetrics" table column is hidden.
  * In the 360 Profile drawer, the per-lesson playback breakdown is replaced with: *"🔒 Individual lecture-level telemetric playback history is restricted to Main Admin."*
* **Permission Enforcement:** Gated by `<PermissionGuard permission="students.view">`.

---

### C. Staff Authentication Pages (`/staff/*`)

---

#### 1. Staff Login — [`src/app/staff/login/page.tsx`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/staff/login/page.tsx)
* **Features:** Staff ID / Phone / Email input, Password input with Show/Hide toggle, "Sign In to Console" button with loading spinner, Rate-limiting lockout notice ("Too many failed attempts. Locked for 15 minutes"), "Forgot Password?" link, Quick-fill demo credentials bar (Prashant Dhumal Main Admin vs Sub-Admin).
* **Flow:** Calls `/api/staff/login`. If `mustChangePassword` is true, redirects immediately to `/staff/change-password`. If `role === "sub_admin"`, redirects to `/sub`. Otherwise redirects to `/admin`. Sets HTTP-only session cookie `mma_staff_session`.

---

#### 2. Mandatory First-Time Password Reset — [`src/app/staff/change-password/page.tsx`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/staff/change-password/page.tsx)
* **Features:** Security banner explaining first-time reset requirement, Current / Temporary Password input, New Password input (min 8 chars, 1 uppercase, 1 special char, 1 number), Confirm New Password input, Real-time checklist validation.
* **Flow:** Calls `/api/staff/change-password`. Verifies current password using Argon2, hashes new password with Argon2, clears `must_change_password`, updates `staff_accounts`, and redirects to `/sub` or `/admin`.

---

#### 3. Staff Forgot Password & SMS OTP — [`src/app/staff/forgot-password/page.tsx`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/staff/forgot-password/page.tsx)
* **Features:** Step 1: Staff ID or Registered Mobile number input + "Send Recovery OTP" button. Step 2: 6-digit OTP input (with simulated test OTP auto-display in development), New Password, Confirm Password, and "Reset Password & Login" button.
* **Flow:** Calls `/api/staff/forgot-password` with `step = "request_otp"` and `step = "verify_and_reset"`.

---

## 3. Sub-Admin vs Main Admin Differences & RBAC Architecture

### 1. Role & Permission Keys Architecture
Staff roles and permissions are defined in [`src/lib/types.ts`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/lib/types.ts#L159-L168) and enforced through the helper `hasStaffPermission(staff, permission)`:

```typescript
export type StaffRole = "main_admin" | "sub_admin";

export type StaffPermission =
  | "courses.manage"
  | "videos.manage"
  | "coupons.manage"
  | "freegrant.manage"
  | "reports.view"
  | "students.view"
  | "messages.manage"
  | "notes.books.manage";
```

### 2. The Final Operational Authority Model
In accordance with the project's strict delegation model:
* **Main Admin (MMA-000 / Prashant Dhumal):** Supreme administrator. Holds unrestricted authority over every module, database setting, quota, coupon, grant, course, video, report, and delete operation.
* **Sub-Admin:** Intentionally restricted to operational support only. In [`src/lib/staffAuthService.ts`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/lib/staffAuthService.ts#L107-L113) and [`src/lib/staffStore.ts`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/lib/staffStore.ts#L187-L198), sub-admin permissions are strictly filtered to an assignable whitelist:
  1. `messages.manage`: Reply to student support threads and view message history.
  2. `students.view`: Search enrolled learners and view 360 profiles (with individual video watch telemetry redacted).
* **All other permissions** (`courses.manage`, `videos.manage`, `coupons.manage`, `freegrant.manage`, `notes.books.manage`, `reports.view`, and all deletion actions) are stripped from Sub-Admins and reserved for Main Admin.

### 3. Comparison Matrix: Main Admin vs Sub-Admin

| Functional Area / Route | Main Admin (`/admin/*`) | Sub-Admin (`/sub/*`) | Enforcement Layer |
| :--- | :--- | :--- | :--- |
| **Console Identity & Theme** | Deep Navy Blue (`#0A1128`) Supreme Console | Clean Lavender/White (`#EDE8FF`) Scoped Console | CSS / [`AdminSidebar.tsx`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/components/admin/AdminSidebar.tsx) |
| **Sub-Admin CRUD & Provisioning** | Full (Create, Edit, Suspend, Delete) | ❌ Hidden & Blocked | `<PermissionGuard adminOnly={true}>` |
| **Master Platform Settings** | Full Access (`/admin/settings`) | ❌ Hidden & Blocked | `<PermissionGuard adminOnly={true}>` & `/api/settings` (403) |
| **System Audit Trail** | Full System-wide Log (`/admin/audit`) | Own Activities Only (`/sub/activity`) | UI Filter + `/api/staff/audit` (403) |
| **Analytics & Reports** | Full 7 Cards + Watch Telemetrics (`/admin/reports`) | ❌ Gated from sidebar nav | `<PermissionGuard permission="reports.view">` |
| **Courses & Video Builder** | Full CRUD, Reorder, Delete | ❌ Gated from sub sidebar | `<PermissionGuard permission="courses.manage">` |
| **Playlist Importer** | Full YouTube API & Bulk Paste | ❌ Gated from sub sidebar | `<PermissionGuard permission="videos.manage">` |
| **Coupons & Grants** | Full Creation & Revocation | ❌ Gated from sub sidebar | `<PermissionGuard permission="coupons.manage">` |
| **Student 360 Profile** | Full View (including per-lesson watch seconds) | Redacted View (per-lesson telemetrics hidden) | In-component check `isMainAdmin` |
| **Student In-App Messages** | Full Access (`/admin/messages`) | Full Access (`/sub/messages`) | Permission `messages.manage` |
| **Delete Any Entity** | Allowed | ❌ Strictly forbidden across all models | Hard checks in stores & UI buttons |

### 4. Enforcement Points: UI vs API

1. **Client UI Layer:**
   * **Route Level:** [`PermissionGuard.tsx`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/components/admin/PermissionGuard.tsx) checks `staff.role` and `hasStaffPermission(staff, permission)`. If unauthorized, renders an access-denied state with a return button.
   * **Navigation Level:** [`AdminSidebar.tsx`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/components/admin/AdminSidebar.tsx) and [`AdminTopbar.tsx`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/components/admin/AdminTopbar.tsx) filter navigation arrays so unauthorized links never appear in the DOM.
   * **Component Level:** Delete buttons and deep telemetry columns check `currentStaff.role === "main_admin"`.
2. **Server API Layer:**
   * `/api/settings`: Inspects `mma_staff_session` cookie; returns `403 Forbidden` if role is not `main_admin`.
   * `/api/staff/audit`: Inspects session cookie; returns `403 Forbidden` if not `main_admin`.
   * `/api/reports/analytics` & `/api/reports/export`: Verifies staff session cookie; returns `403` if missing or unauthorized.
   * `/api/grants/count`: Verifies valid staff session before executing count queries on `profiles`.

---

## 4. Comprehensive "Notes" References Inventory
*(For clean deprecation when keeping only Books)*

### A. Student Navigation & Core UI
1. **Sidebar Navigation:**
   * [`src/components/navigation/SidebarNav.tsx:24`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/components/navigation/SidebarNav.tsx#L24):
     ```typescript
     { href: "/notes", label: "Notes & Books", icon: FileText }
     ```
2. **Books Page Navigation Header:**
   * [`src/app/books/page.tsx:409-414`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/books/page.tsx#L409-L414):
     Link pointing to `/notes` ("My Notes" tab switch next to "Course Books").
3. **Student Notes Workspace Page:**
   * [`src/app/notes/page.tsx`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/notes/page.tsx): Entire 1,036-line page dedicated to rich-text personal study note taking, timestamp syncing, and autosave.
4. **Middleware Route Protection:**
   * [`src/middleware.ts:51`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/middleware.ts#L51) & [`src/middleware.ts:374`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/middleware.ts#L374): `pathname.startsWith("/notes")` and `matcher: ["/notes/:path*"]`.

### B. Video Watch Page (`/watch/[lessonId]`)
1. **Timestamped Quick Notes State & Handlers:**
   * [`src/app/watch/[lessonId]/page.tsx:116`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/watch/%5BlessonId%5D/page.tsx#L116): `const [lessonNotes, setLessonNotes] = useState<Note[]>([]);`
   * [`src/app/watch/[lessonId]/page.tsx:797-850`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/watch/%5BlessonId%5D/page.tsx#L797-L850): `loadLessonNotes()` querying Supabase `notes` table and `localStorage.mindmaster_user_notes`.
   * [`src/app/watch/[lessonId]/page.tsx:870-935`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/watch/%5BlessonId%5D/page.tsx#L870-L935): `handleSaveQuickNote()` and `handleDeleteNote()`.
2. **Notes UI Dock & Links:**
   * [`src/app/watch/[lessonId]/page.tsx:1323`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/watch/%5BlessonId%5D/page.tsx#L1323): Quick Note Taking form section.
   * [`src/app/watch/[lessonId]/page.tsx:1439`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/watch/%5BlessonId%5D/page.tsx#L1439): Text: `"⏱️ Captures at {formatTime(currentTime)} • Synced to /notes"`.
   * [`src/app/watch/[lessonId]/page.tsx:1461`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/watch/%5BlessonId%5D/page.tsx#L1461): Link: `<Link href="/notes">View all notes</Link>`.

### C. Admin & Staff Navigation / Topbar
1. **Admin Sidebar Navigation:**
   * [`src/components/admin/AdminSidebar.tsx:55`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/components/admin/AdminSidebar.tsx#L55):
     ```typescript
     { label: "Books & Notes", href: "/admin/notes", icon: "📖", permission: "notes.books.manage" }
     ```
2. **Admin Topbar Navigation:**
   * [`src/components/admin/AdminTopbar.tsx:90 & 104`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/components/admin/AdminTopbar.tsx#L90):
     ```typescript
     { label: "Books & Notes", href: "/admin/notes", icon: "📖", permission: "notes.books.manage" }
     ```
3. **Admin Notes Page Title:**
   * [`src/app/admin/notes/page.tsx:300`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/admin/notes/page.tsx#L300):
     `<h2>Notes & Digital Books Manager</h2>` (button: `"+ Add Digital Book / Notes"`).

### D. Offline Storage, Types & Localization
1. **Offline Storage Engine:**
   * [`src/lib/offlineStorage.ts:16-78`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/lib/offlineStorage.ts#L16-L78): IndexedDB object store `"notes"`, `saveNoteOffline()`, `getNotesOffline()`, `deleteNoteOffline()`.
2. **Types & Data Models:**
   * [`src/lib/types.ts:163`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/lib/types.ts#L163): `StaffPermission` includes `"notes.books.manage"`.
   * [`src/lib/mockData.ts:22`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/lib/mockData.ts#L22): `export const MOCK_NOTES: Note[] = [];`.
3. **Banners & Shields:**
   * [`src/components/common/OfflineBanner.tsx:52`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/components/common/OfflineBanner.tsx#L52): `"Saved offline notes and cached handbooks remain accessible."`
   * [`src/components/common/PiracyShield.tsx:9`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/components/common/PiracyShield.tsx#L9): `contentType?: "video" | "notes" | "book" | "general"`.

---

## 5. Current Gaps, Stubs & Hardcoded Parts

### 1. In-Memory / LocalStorage Persistence Without Supabase
* **Messaging System (`messageStore.ts`):** Student ↔ Staff chat conversations and messages are stored exclusively in browser `localStorage` (`mma_conversations`, `mma_messages`) and server memory maps. There are no active Supabase `messages` or `conversations` tables wired up. If a student messages from one device or browser, staff on another machine cannot see it.
* **Audit Trail Reads (`/admin/audit/page.tsx`):** While mutations trigger async insert calls to Supabase `audit_logs`, the page itself calls `getAuditLogs()` from `staffStore.ts` which reads from browser `localStorage`. A freshly opened browser will see zero audit logs unless populated locally.
* **Video Catalog (`/admin/videos/page.tsx`):** The Video Lecture Manager reads from `getStoredVideos()` (`mma_videos` in `localStorage`) rather than querying the Supabase `lessons` table on mount.
* **Student Directory (`/admin/students/page.tsx`):** Uses `getStaffStudents()` (`localStorage` under `KEYS.STUDENTS`). When admissions are granted offline via `grantCashAdmission`, it saves to `localStorage` and upserts a row to `profiles`, but the initial list is not populated via a live `SELECT * FROM profiles WHERE role = 'student'`.

### 2. Security & Session Vulnerabilities
* **Cookie-Based Staff Session Without Signature Verification:** In [`src/app/api/staff/login/route.ts`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/api/staff/login/route.ts), the session cookie `mma_staff_session` stores a JSON payload containing `{ id, staffId, role, name, permissions }`. In API routes (`/api/settings`, `/api/reports/analytics`, `/api/staff/audit`), the cookie is parsed using `JSON.parse(staffCookie)`. It is not cryptographically signed (e.g. via JWT with a server secret or verified against a session token in a `staff_sessions` table).
* **OTP Bypass in Development / Debug Mode:** In [`src/app/api/staff/forgot-password/route.ts:51`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/api/staff/forgot-password/route.ts#L51), the API response includes `dev_otp: otp` in the JSON response payload. This must be removed before production deployment.

### 3. Missing API Endpoints / Client-Side Direct Mutations
* **Settings Modification:** In [`src/app/admin/settings/page.tsx`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/admin/settings/page.tsx#L83-L92), clicking "Save All Configurations" calls `savePlatformSettings(settings)` which runs client-side and attempts a direct browser Supabase upsert. It does **not** `fetch('/api/settings', { method: 'POST' })`, leaving the backend route unused by the UI.

### 4. Hardcoded Mock Fallback Residue
* **Demo Auto-Fill Credentials:** On [`src/app/staff/login/page.tsx`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/staff/login/page.tsx), quick-fill buttons exist for `MMA-000` (`Admin@MMA2026!`) and `MMA-001` (`Staff@MMA2026!`).
* **Excel Exporter Dummy Placeholders:** In [`src/app/admin/reports/page.tsx:128`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/admin/reports/page.tsx#L128), master Excel export uses dummy phone `+91 98XXXXXXXX` for aggregated batch rows rather than querying individual customer transaction logs.

---

## 6. Implementation Action Plan

1. **Keep Books, Deprecate Notes:**
   * Rename `/admin/notes` to `/admin/books` (and update navigation in `AdminSidebar.tsx` and `AdminTopbar.tsx`).
   * In Student Navigation, change `/notes` to `/books` in [`SidebarNav.tsx:24`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/components/navigation/SidebarNav.tsx#L24).
   * In `/watch/[lessonId]`, remove the "Synced to /notes" label and redirect note viewing to the student notebook or archive.
2. **Migrate 4 In-Memory Stores to Supabase:**
   * `messageStore.ts` ➔ Supabase `conversations` & `messages` tables with Realtime channels.
   * `auditLogger.ts` / `staffStore.getAuditLogs()` ➔ Live `SELECT * FROM audit_logs ORDER BY created_at DESC`.
   * `videos/page.tsx` ➔ Live `SELECT * FROM lessons ORDER BY position ASC`.
   * `students/page.tsx` ➔ Live `SELECT * FROM profiles WHERE role = 'student'`.
3. **Sign Staff Session Cookie:** Replace the plaintext JSON `mma_staff_session` cookie with a signed JWT or server session table.
