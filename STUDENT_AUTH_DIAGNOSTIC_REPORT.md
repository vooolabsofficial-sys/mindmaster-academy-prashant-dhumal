# 🔍 MindMaster Academy — Student Authentication & Navigation Pipeline Diagnostic Report

> **File:** `STUDENT_AUTH_DIAGNOSTIC_REPORT.md`  
> **Type:** Read-Only Deep Technical Diagnostic Audit  
> **Status:** Inspection Complete — All Root Causes Identified  
> **Audited Modules:** `website/` (Vite 6 + React 19) & `mindmaster-app/` (Next.js 16 App Router + Supabase)

---

## 📌 Executive Summary & Root-Cause Matrix

| Pipeline Segment | Primary Files | Severity | Root Cause Summary |
| :--- | :--- | :--- | :--- |
| **1. Cross-App Navigation** | [`website/src/config/appConfig.ts:14`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/website/src/config/appConfig.ts#L14) | **HIGH** | `website` generates `http://localhost:3000/login?next=/home`. In previous configs and docs, app was referenced on port `3001` (ref `appConfig.ts:10` comments & `sub-admins/page.tsx:220`). Neither dev server was running during test. |
| **2. Auth Memory Volatility** | [`mindmaster-app/src/lib/studentAuthService.ts:23`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/lib/studentAuthService.ts#L23) | **CRITICAL** | Registered student accounts are stored in an in-memory `Map` (`SERVER_STORE`). When the Node server restarts or a serverless worker recycles, **all registered accounts are erased**. |
| **3. Missing DB Columns** | [`mindmaster-app/supabase/consolidated_production_schema.sql:35`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/supabase/consolidated_production_schema.sql#L35) & [`route.ts:125`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/api/student/auth/route.ts#L125) | **CRITICAL** | Supabase `profiles` schema has **no `password_hash`, `recovery_pin`, or `email` columns**. Registration **never saves passwords to the database**. When memory resets, `authenticateStudent` finds no `password_hash` in Supabase, treats the user as unregistered (`USER_NOT_FOUND`), and the UI flips back to Sign Up. |
| **4. Supabase DNS Resolution** | [`mindmaster-app/.env.local:5-15`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/.env.local#L5-L15) | **CRITICAL** | `NEXT_PUBLIC_SUPABASE_URL` points to `xyycqnpqnrtumoemlels.supabase.co`. Host lookup fails with `DNS_ERROR_RCODE_NAME_ERROR` (`ENOTFOUND`). All live DB auth fallback queries throw `TypeError: fetch failed`. |
| **5. Cookie vs LocalStorage Guard Conflict** | [`src/middleware.ts:65`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/middleware.ts#L65) vs [`src/components/navigation/AppShell.tsx:18`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/components/navigation/AppShell.tsx#L18) | **HIGH** | `middleware.ts` allows route entry using HTTP cookies (`sb-mindmaster-auth-token` / `mindmaster_session`). However, `AppShell.tsx` guards the page on the client using `localStorage`. If `mindmaster_user_profile` is missing from `localStorage` (cross-origin / new tab / private mode), `AppShell` immediately redirects back to `/login?next=/home`. |
| **6. Onboarding Redirect Loop** | [`src/app/api/student/auth/route.ts:258`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/api/student/auth/route.ts#L258) & [`src/middleware.ts:94`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/middleware.ts#L94) | **HIGH** | Calling `response.cookies.delete("mindmaster_onboarding_pending")` in `route.ts` strips the domain option, leaving domain-scoped cookies (`.mindmasteracademy.in`) alive in the browser. `middleware.ts` continues to see `mindmaster_onboarding_pending=true` and repeatedly redirects `/home` back to `/onboarding`. |

---

## 1. Website Entry Links & Port Architecture (`website/`)

### 1.1 URL Generation Inspection
- **File:** [`website/src/config/appConfig.ts`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/website/src/config/appConfig.ts)
```typescript
export const getAppBaseUrl = (): string => {
  const metaEnv = (import.meta as any)?.env;
  if (metaEnv && metaEnv.VITE_APP_URL) return metaEnv.VITE_APP_URL;

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("192.168.")) {
      return "http://localhost:3000";
    }
  }
  return "https://app.mindmasteracademy.in";
};
```

- **URLs Generated:**
  - **"Student Login":**
    - Code: [`website/src/components/Navbar.tsx:92`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/website/src/components/Navbar.tsx#L92) and [`website/src/pages/Home.tsx:77`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/website/src/pages/Home.tsx#L77)
    - Local: `http://localhost:3000/login?next=/home`
    - Production: `https://app.mindmasteracademy.in/login?next=/home`
  - **"Open Web App":**
    - Code: [`website/src/pages/Home.tsx:166`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/website/src/pages/Home.tsx#L166)
    - Local: `http://localhost:3000/home`
    - Production: `https://app.mindmasteracademy.in/home`
  - **"Install on Phone":**
    - Code: [`website/src/pages/Home.tsx:214`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/website/src/pages/Home.tsx#L214)
    - Local: `http://localhost:3000/home?install=true`
    - Production: `https://app.mindmasteracademy.in/home?install=true`

### 1.2 Running Ports & Cross-Origin State
- `website/` runs on **Port 5173** ([`website/vite.config.ts:8`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/website/vite.config.ts#L8)).
- `mindmaster-app/` runs on **Port 3000** (`next dev`).
- **Origin Isolation:** `localStorage` is separated by origin. A student clicking a link on `http://localhost:5173/` arrives at `http://localhost:3000/` with a completely distinct and empty `localStorage` scope.

---

## 2. Student Login UI & Form Submission (`login/page.tsx` & `onboarding/page.tsx`)

### 2.1 Sign In Flow (`handleSignIn` in [`login/page.tsx:134-198`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/login/page.tsx#L134-L198))
1. Student enters mobile number and password.
2. Dispatches `POST /api/student/auth` with `{ action: "login", phone, password }`.
3. **If user not found (`USER_NOT_FOUND`):**
   ```typescript
   if (data.code === "USER_NOT_FOUND" || (data.error && data.error.includes("not registered"))) {
     setActiveTab("signup");
     setSuccessMessage("This mobile number is not registered yet. Please create your account below.");
     return;
   }
   ```
   *Behavior:* The tab flips to Sign Up automatically.
4. **If login succeeds:**
   - Saves `mindmaster_session_token`: `"tok-" + data.user.id`.
   - Saves `mindmaster_verified_phone`: `data.user.phone`.
   - **Crucial gap:** If `data.onboardingCompleted` is `false`, `mindmaster_user_profile` is **not saved** in `localStorage`.
   - Redirects via `setTimeout(() => router.replace(...), 500)`.

### 2.2 Sign Up Flow (`handleSignUp` in [`login/page.tsx:201-237`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/login/page.tsx#L201-L237))
1. Student inputs Full Name, Phone, Password, and 4-Digit Recovery PIN.
2. Dispatches `POST /api/student/auth` with `{ action: "register", phone, password, fullName, recoveryPin }`.
3. Saves `mindmaster_session_token` and `mindmaster_verified_phone`.
4. Redirects via `setTimeout(() => router.replace(/onboarding?next=/home&phone=...), 600)`.

### 2.3 Onboarding Form (`handleSubmit` in [`onboarding/page.tsx:43-131`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/onboarding/page.tsx#L43-L131))
1. Student inputs Full Name, Village, Taluka, District, School.
2. Saves `mindmaster_user_profile` JSON and `mindmaster_onboarding_completed: "true"` into `localStorage`.
3. Dispatches `POST /api/student/auth` with `{ action: "complete-onboarding", ... }`.
4. Attempts client-side `document.cookie` deletion for `mindmaster_onboarding_pending`.
5. Redirects to destination via `router.push(nextParam)`.

---

## 3. Backend Auth API & Database Integrity (`route.ts` & `studentAuthService.ts`)

### 3.1 The In-Memory Volatility Flaw
In [`src/lib/studentAuthService.ts:23-45`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/lib/studentAuthService.ts#L23-L45):
```typescript
const SERVER_STORE = new Map<string, StudentAccount[]>();
```
- When a student registers, their account is inserted into `SERVER_STORE`.
- On server restart, file save (HMR), or serverless worker recycle, `SERVER_STORE` is reset to `[]`.

### 3.2 Database Schema & Payload Inconsistencies
When `/api/student/auth` processes `register`:
```typescript
// src/app/api/student/auth/route.ts:125-134
await supabase.from("profiles").upsert(
  {
    phone: clean,
    full_name: student.full_name,
    email: student.email || null,
    role: "student",
    updated_at: new Date().toISOString(),
  },
  { onConflict: "phone" }
);
```
**Defects Identified:**
1. **Password is Never Persisted:** `password_hash` is completely absent from the upsert.
2. **Missing Database Columns:** In [`supabase/consolidated_production_schema.sql:35-50`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/supabase/consolidated_production_schema.sql#L35-L50), `profiles` lacks:
   - `password_hash TEXT`
   - `recovery_pin VARCHAR(10)`
   - `email VARCHAR(255)`
3. **Database Unreachable:** `.env.local` specifies `xyycqnpqnrtumoemlels.supabase.co`. DNS verification returned `DNS_ERROR_RCODE_NAME_ERROR` (`ENOTFOUND`). Live DB sync fails on every request.

### 3.3 Why Existing Students Cannot Sign In
When a student attempts to log in after server memory has reset:
1. `findStudentByPhone(clean)` returns `undefined`.
2. `studentAuthService.ts:133` queries `profiles` via Supabase admin client.
3. Because `password_hash` was never stored in the database, `profile.password_hash` is `""`.
4. Line 172 triggers:
   ```typescript
   if (!student.password_hash) {
     return {
       success: false,
       code: "USER_NOT_FOUND",
       error: "This mobile number is new! Please enter your name and password to create an account.",
     };
   }
   ```
5. `login/page.tsx` catches `code === "USER_NOT_FOUND"` and flips to Sign Up. The user can never log in.

---

## 4. Middleware & Session Guard Mismatch (`middleware.ts` & `AppShell.tsx`)

### 4.1 Server-Side Middleware Guard ([`src/middleware.ts:65-101`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/middleware.ts#L65-L101))
- Evaluated on server for `/home`, `/courses`, `/books`, `/watch`, `/checkout`, etc.
- Inspects HTTP Cookies:
  - `hasAuthToken = cookies.some(c => c.name.startsWith("sb-") && c.name.includes("-auth-token")) || cookies.has("mindmaster_session")`
  - `onboardingPending = cookies.get("mindmaster_onboarding_pending")?.value === "true"`
- Enforcements:
  - If `!hasAuthToken`: 307 Redirect to `/login?next=<currentPath>`.
  - If `onboardingPending && !pathname.startsWith("/onboarding")`: 307 Redirect to `/onboarding?next=<currentPath>`.

### 4.2 Client-Side AppShell Guard Conflict ([`src/components/navigation/AppShell.tsx:18-62`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/components/navigation/AppShell.tsx#L18-L62))
- `AppShell` wraps `/home`, `/courses`, `/books`, etc.
- Evaluated on the client via `useEffect`:
  1. `supabase.auth.getUser()`: Returns `null` because phone authentication uses a custom backend route rather than Supabase native auth.
  2. Fallback check:
     ```typescript
     const localToken = localStorage.getItem("mindmaster_session_token");
     if (localToken) {
       const localProfile = localStorage.getItem("mindmaster_user_profile");
       if (!localProfile) {
         router.replace(`/onboarding?next=${encodeURIComponent(currentPath)}`);
         return;
       }
       setIsAuthenticated(true);
       return;
     }
     router.replace(`/login?next=${encodeURIComponent(currentPath)}`);
     ```
- **The Conflict:**
  - A user with valid cookies will pass `middleware.ts`.
  - However, if `localStorage` lacks `mindmaster_user_profile` (e.g. cross-origin navigation, cleared storage, private window, or uncompleted onboarding), `AppShell.tsx` immediately executes `router.replace('/login')`.
  - On `/login`, `checkSession()` also finds empty storage and displays the form, causing an unexpected bounce to login.

### 4.3 Stuck Onboarding Cookie Loop
- In [`src/app/api/student/auth/route.ts:258-263`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/app/api/student/auth/route.ts#L258-L263):
  ```typescript
  response.cookies.set("mindmaster_onboarding_pending", "", {
    path: "/",
    domain: cookieDomain,
    maxAge: 0,
  });
  response.cookies.delete("mindmaster_onboarding_pending");
  ```
- Calling `.delete()` without explicit domain options overrides the preceding header, preventing browsers from removing domain-level cookies (`.mindmasteracademy.in`).
- Result: `mindmaster_onboarding_pending=true` persists. `middleware.ts` intercepts `/home` and redirects back to `/onboarding`, creating an **infinite redirect loop**.

### 4.4 Anti-Piracy Heartbeat Ejection ([`PiracyShield.tsx:200-235`](file:///c:/Users/vrushabh/Desktop/mind%20master%20acadamy%20%20prashant%20dhumal/mindmaster-app/src/components/common/PiracyShield.tsx#L200-L235))
- Mounted on `/watch/[lessonId]` and `/books`.
- Every 25s, dispatches heartbeat to `/api/student/auth` (`action: "validate-session"`).
- `route.ts:275` extracts `token` from `req.cookies.get("sb-mindmaster-auth-token")`.
- If cookies are missing or mismatched, `validateStudentSession` fails (403 `device_conflict`), purging `localStorage` and forcing `window.location.href = "/login?error=device_conflict"`.

---

## 5. Direct Action Items for Remediation

1. **Persist Credentials in Database:**
   - Execute SQL migration to add missing columns to `profiles`:
     ```sql
     ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;
     ALTER TABLE profiles ADD COLUMN IF NOT EXISTS recovery_pin VARCHAR(10);
     ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email VARCHAR(255);
     ```
   - Update `route.ts` line 125 to save `password_hash: student.password_hash` and `recovery_pin: student.recovery_pin` into `profiles`.
2. **Configure Active Supabase Connection:**
   - Replace the inactive URL in `mindmaster-app/.env.local` with the active Supabase project credentials.
3. **Harmonize Guard Logic:**
   - In `AppShell.tsx`, if `localStorage` profile is missing but auth cookies or local session token exist, fetch the profile from `/api/student/auth` (or hydrate from token) instead of immediately kicking to `/login`.
4. **Fix Domain Cookie Clearing:**
   - Remove redundant `response.cookies.delete(...)` calls and provide `{ path: "/", domain: cookieDomain, maxAge: 0 }` consistently.
5. **Port Alignment in Local Development:**
   - Ensure both developers and docs consistently run `mindmaster-app` on Port 3000 and `website` on Port 5173.
