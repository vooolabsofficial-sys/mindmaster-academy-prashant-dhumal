/**
 * ==============================================================================
 * 🧪 NOTES, BOOKS, PWA, WEBSITE CONNECT & ROOT OWNER VERIFICATION SUITE
 * ==============================================================================
 * Features Tested:
 * - Personal Notes & Course Books PDFs with storage modal & autosave
 * - PWA Manifest, App Install Prompt & Meta Titles
 * - Marketing Website Connect, Cookie Domain Sharing & Route Guards
 * - Root Owner MMA-000 seed & must_change_password flow
 * ==============================================================================
 */

import assert from "assert";
import fs from "fs";
import { findStaffAccount } from "../src/lib/staffAuthService.js";
import { calculateAllowedWords } from "../src/lib/types.js";
import { MOCK_BOOKS } from "../src/lib/mockData.js";
import { INITIAL_STUDENTS } from "../src/lib/mockStaffData.js";

console.log("================================================================================");
console.log("🚀 VERIFYING NOTES, BOOKS, PWA, WEBSITE CONNECT & OWNER SEED");
console.log("================================================================================\n");

async function runTests() {
  let passed = 0;
  let failed = 0;

  function test(desc, fn) {
    try {
      fn();
      console.log(`✅ PASS: ${desc}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${desc} -> ${err.message}`);
      failed++;
    }
  }

  // Personal Notes & Course Books
  const notesPageSrc = fs.readFileSync("src/app/notes/page.tsx", "utf-8");

  test("/notes page includes tabs for Personal Notes and Course Books & PDFs", () => {
    assert(notesPageSrc.includes("activeTab === \"notes\""), "activeTab notes check missing");
    assert(notesPageSrc.includes("activeTab === \"books\""), "activeTab books check missing");
    assert(notesPageSrc.includes("Personal Notes"), "Personal Notes label missing");
    assert(notesPageSrc.includes("Course Books &amp; PDFs") || notesPageSrc.includes("Course Books & PDFs"), "Course Books & PDFs label missing");
  });

  test("/notes renders PDF reader modal with zoom and download controls", () => {
    assert(notesPageSrc.includes("PDF Reader Modal"), "PDF reader modal missing");
    assert(notesPageSrc.includes("ZoomOut"), "ZoomOut missing");
    assert(notesPageSrc.includes("ZoomIn"), "ZoomIn missing");
    assert(notesPageSrc.includes("pdfZoom"), "pdfZoom zoom state missing");
    assert(notesPageSrc.includes("<iframe"), "PDF iframe element missing");
    assert(notesPageSrc.includes("setReadingBook(null)"), "Modal close handler missing");
  });

  test("Personal notes CRUD enforces word limits and captures timestamp", () => {
    assert(notesPageSrc.includes("calculateAllowedWords"), "calculateAllowedWords missing");
    assert(notesPageSrc.includes("timestampSec"), "timestampSec missing");
    assert(notesPageSrc.includes("saveStatus"), "saveStatus state missing");
    assert(notesPageSrc.includes("autosaveTimerRef"), "autosaveTimerRef missing");

    const words10Min = calculateAllowedWords(600);
    const words30Min = calculateAllowedWords(1800);
    assert(words10Min > 0 && words10Min <= 400, "10 min word limit should be capped");
    assert(words30Min > words10Min, "30 min lecture should allow more words than 10 min lecture");
  });

  // PWA & Meta
  const manifestSrc = fs.readFileSync("public/manifest.json", "utf-8");
  const topBarSrc = fs.readFileSync("src/components/navigation/TopBar.tsx", "utf-8");

  test("PWA manifest is properly configured", () => {
    const manifest = JSON.parse(manifestSrc);
    assert(manifest.name.includes("MindMaster"), "Manifest name missing");
    assert(manifest.display === "standalone", "Display mode should be standalone");
    assert(manifest.start_url === "/home" || manifest.start_url === "/", "Valid start_url required");
    assert(manifest.icons && manifest.icons.length > 0, "PWA icons missing");
  });

  test("TopBar includes PWA install prompt handler", () => {
    assert(topBarSrc.includes("beforeinstallprompt"), "beforeinstallprompt listener missing");
    assert(topBarSrc.includes("Install App"), "Install App CTA missing");
    assert(topBarSrc.includes("handleInstallClick"), "Install click handler missing");
  });

  test("Meta titles present across key student pages", () => {
    assert(notesPageSrc.includes("<title>"), "Notes page meta title missing");
    const watchSrc = fs.readFileSync("src/app/watch/[lessonId]/page.tsx", "utf-8");
    assert(watchSrc.includes("<title>"), "Watch page meta title missing");
    const booksSrc = fs.readFileSync("src/app/books/page.tsx", "utf-8");
    assert(booksSrc.includes("<title>"), "Books page meta title missing");
  });

  test("Seed student personas defined with diverse subscription states", () => {
    assert(INITIAL_STUDENTS.some((s) => s.id === "std-new"), "std-new missing");
    assert(INITIAL_STUDENTS.some((s) => s.id === "std-active"), "std-active missing");
    assert(INITIAL_STUDENTS.some((s) => s.id === "std-expired"), "std-expired missing");
  });

  // Website Connect & Route Guards
  const middlewareSrc = fs.readFileSync("src/middleware.ts", "utf-8");
  const readmeSrc = fs.readFileSync("README.md", "utf-8");

  test("Middleware route guards redirect unauthenticated students to /login?next=", () => {
    assert(middlewareSrc.includes("loginUrl.searchParams.set(\"next\", currentPath)"), "Login redirect with ?next= missing");
    assert(middlewareSrc.includes("mindmaster_onboarding_pending"), "Onboarding pending check missing");
  });

  test("README documents DNS setup, cookie domain, and marketing CTA links", () => {
    assert(readmeSrc.includes("Marketing Website Connect & DNS Setup"), "Marketing DNS section missing");
    assert(readmeSrc.includes("NEXT_PUBLIC_COOKIE_DOMAIN"), "Cookie domain documentation missing");
    assert(readmeSrc.includes("https://app.mindmasteracademy.com/home"), "Enroll CTA link missing");
    assert(readmeSrc.includes("cname.vercel-dns.com"), "Vercel CNAME documentation missing");
  });

  // Owner Seed & Login
  const migration003Src = fs.readFileSync("supabase/migrations/003_phase2_staff_rbac_schema.sql", "utf-8");

  test("Migration 003 creates staff_accounts, staff_permissions, audit_log, and settings", () => {
    assert(migration003Src.includes("CREATE TABLE IF NOT EXISTS staff_accounts"), "staff_accounts table missing");
    assert(migration003Src.includes("CREATE TABLE IF NOT EXISTS staff_permissions"), "staff_permissions table missing");
    assert(migration003Src.includes("CREATE TABLE IF NOT EXISTS audit_log"), "audit_log table missing");
    assert(migration003Src.includes("CREATE TABLE IF NOT EXISTS settings"), "settings table missing");
  });

  test("Migration 003 seeds single row settings and MMA-000 owner account", () => {
    assert(migration003Src.includes("INSERT INTO settings"), "Settings row insertion missing");
    assert(migration003Src.includes("'MMA-000'"), "MMA-000 owner seed missing");
    assert(migration003Src.includes("must_change_password"), "must_change_password field missing");
  });

  test("Owner account MMA-000 resolves from env with must_change_password = true", () => {
    const owner = findStaffAccount("MMA-000");
    assert(owner, "Owner account MMA-000 not found in staff accounts");
    assert(owner.role === "main_admin", "Owner role must be main_admin");
    assert(owner.status === "active", "Owner must be active");
    assert(owner.mustChangePassword === true, "Owner must have mustChangePassword = true for initial setup");
    assert(owner.phone, "Owner phone number missing");
  });

  test("Owner logs in successfully at /staff/login API with env password and must_change_password flag", async () => {
    const { POST } = await import("../src/app/api/staff/login/route.js");
    const req = new Request("http://localhost:3000/api/staff/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staff_id: "MMA-000", password: "Owner@2026" }),
    });
    const res = await POST(req);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const json = await res.json();
    assert(json.success === true, "Login should succeed");
    assert(json.staff.staff_id === "MMA-000", "Staff ID should be MMA-000");
    assert(json.staff.role === "main_admin", "Role should be main_admin");
    assert(json.staff.must_change_password === true, "must_change_password should be true");
  });

  console.log("\n================================================================================");
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} VERIFICATION CHECKS PASSED FOR NOTES, BOOKS, PWA & OWNER!`);
  } else {
    console.log(`💥 ${failed} TEST(S) FAILED! (${passed} passed)`);
    process.exit(1);
  }
  console.log("================================================================================\n");
}

runTests().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
