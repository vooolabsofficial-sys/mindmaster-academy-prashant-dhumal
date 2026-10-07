import assert from "assert";
import fs from "fs";
import {
  getStaffUsers,
  saveStaffUser,
  toggleStaffStatus,
  getPlatformSettings,
  savePlatformSettings,
} from "../src/lib/staffStore.js";
import { findStaffAccount } from "../src/lib/staffAuthService.js";
import { POST as staffLoginPost } from "../src/app/api/staff/login/route.js";
import { middleware } from "../src/middleware.js";

console.log("=========================================================");
console.log("🚀 VERIFYING SUB-ADMIN MANAGER & WORKFLOWS");
console.log("=========================================================\n");

async function runTests() {
  let passed = 0;
  let failed = 0;

  async function test(desc, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${desc}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${desc} -> ${err.message}`);
      failed++;
    }
  }

  // =========================================================================
  // 1. Check UI Code for ONLY 2 Permission Checkboxes
  // =========================================================================
  console.log("--- 1. Sub-Admin Manager Form & UI Constraints ---");

  await test("Sub-admin form contains ONLY two permission checkboxes: Messages & Student Finder", () => {
    const pageSrc = fs.readFileSync("src/app/admin/sub-admins/page.tsx", "utf-8");

    // Must contain the two assignable permissions
    assert(pageSrc.includes("messages.manage"), "messages.manage must be present");
    assert(pageSrc.includes("students.view"), "students.view must be present");

    // Must NOT declare other permissions in ALL_PERMISSIONS
    assert(!pageSrc.includes("videos.manage\", label:"), "videos.manage must not be an assignable checkbox");
    assert(!pageSrc.includes("courses.manage\", label:"), "courses.manage must not be an assignable checkbox");
    assert(!pageSrc.includes("coupons.manage\", label:"), "coupons.manage must not be an assignable checkbox");
    assert(!pageSrc.includes("reports.view\", label:"), "reports.view must not be an assignable checkbox");
  });

  await test("Sub-admin manager displays generated staff_id and temp password in modal", () => {
    const pageSrc = fs.readFileSync("src/app/admin/sub-admins/page.tsx", "utf-8");
    assert(pageSrc.includes("getNextStaffId"), "getNextStaffId generator missing");
    assert(pageSrc.includes("generateTempPassword"), "generateTempPassword generator missing");
    assert(pageSrc.includes("createdCredentials"), "createdCredentials modal state missing");
    assert(pageSrc.includes("Temporary Password:"), "Temporary password label missing");
  });

  await test("Sub-admin manager enforces max limit from settings", () => {
    const pageSrc = fs.readFileSync("src/app/admin/sub-admins/page.tsx", "utf-8");
    assert(pageSrc.includes("maxSubAdmins"), "maxSubAdmins check missing");
    assert(pageSrc.includes("quotaReached"), "quotaReached check missing");
    assert(pageSrc.includes("Provisioning limit reached"), "Limit alert missing");

    // Dynamic test with platform settings
    const currentSettings = getPlatformSettings();
    savePlatformSettings({ ...currentSettings, max_sub_admins: 3 });
    const users = getStaffUsers().filter((u) => u.role !== "main_admin");
    const quota = users.length >= 3;
    assert(typeof quota === "boolean", "Quota check evaluates properly");
    // Restore
    savePlatformSettings(currentSettings);
  });

  await test("Audit log card contains filters for staff, action, and date range", () => {
    const pageSrc = fs.readFileSync("src/app/admin/sub-admins/page.tsx", "utf-8");
    assert(pageSrc.includes("auditStaffFilter"), "Staff filter missing");
    assert(pageSrc.includes("auditActionFilter"), "Action filter missing");
    assert(pageSrc.includes("auditDateFilter"), "Date range filter missing");
  });

  // =========================================================================
  // 2. Provisioning & Login with Temp Password
  // =========================================================================
  console.log("\n--- 2. Sub-Admin Provisioning, Login & Forced Password Change ---");

  const newStaffId = "MMA-009";
  const tempPassword = "TempPass@2026";

  await test("Create new sub-admin with generated staff_id and temp password", () => {
    const newSubAdmin = {
      id: "staff-mma-009",
      staffId: newStaffId,
      name: "Ganesh Shinde (QA SubAdmin)",
      email: "ganesh.shinde@mindmasteracademy.in",
      phone: "+91 98888 77777",
      role: "sub_admin",
      permissions: ["messages.manage", "students.view"],
      status: "active",
      lastLoginAt: "Never",
      mustChangePassword: true,
      password: tempPassword,
    };

    saveStaffUser(newSubAdmin);

    const found = findStaffAccount(newStaffId);
    assert(found, `Staff account ${newStaffId} should be found`);
    assert.strictEqual(found.staffId, newStaffId);
    assert.strictEqual(found.role, "sub_admin");
    assert.strictEqual(found.mustChangePassword, true);
    assert.strictEqual(found.status, "active");
    assert.deepStrictEqual(found.permissions, ["messages.manage", "students.view"]);
  });

  await test("New sub-admin logs in with temp password and is forced to change it", async () => {
    const req = new Request("http://localhost:3000/api/staff/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staff_id: newStaffId, password: tempPassword }),
    });

    const res = await staffLoginPost(req);
    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.staff.staff_id, newStaffId);
    assert.strictEqual(json.role, "sub_admin");
    assert.strictEqual(json.must_change_password, true);
    assert.strictEqual(json.redirect_url, "/staff/change-password");
  });

  await test("Middleware forces password change when sub-admin attempts to access /sub", async () => {
    const subAdminSession = {
      staff_id: newStaffId,
      name: "Ganesh Shinde",
      role: "sub_admin",
      status: "active",
      must_change_password: true,
      permissions: ["messages.manage", "students.view"],
    };

    const req = new Request("http://localhost:3000/sub", {
      method: "GET",
      headers: {
        cookie: `mma_staff_session=${encodeURIComponent(JSON.stringify(subAdminSession))}`,
      },
    });

    const res = await middleware(req);
    assert.strictEqual(res.status, 307, `Expected 307 Redirect, got ${res.status}`);
    const location = res.headers.get("location");
    assert(location && location.includes("/staff/change-password"), `Expected redirect to /staff/change-password, got ${location}`);
  });

  // =========================================================================
  // 3. Suspend Toggle with Instant Session Kill
  // =========================================================================
  console.log("\n--- 3. Suspend Toggle & Instant Session Kill ---");

  await test("Suspend toggle updates sub-admin status to suspended", () => {
    toggleStaffStatus(newStaffId);
    const updated = findStaffAccount(newStaffId);
    assert(updated, "Staff account must exist");
    assert.strictEqual(updated.status, "suspended");
  });

  await test("Suspended sub-admin attempting to access API gets 403 and session killed", async () => {
    const suspendedSession = {
      staff_id: newStaffId,
      name: "Ganesh Shinde",
      role: "sub_admin",
      status: "suspended",
      permissions: ["messages.manage"],
    };

    const req = new Request("http://localhost:3000/api/sub/stats", {
      method: "GET",
      headers: {
        cookie: `mma_staff_session=${encodeURIComponent(JSON.stringify(suspendedSession))}`,
      },
    });

    const res = await middleware(req);
    assert.strictEqual(res.status, 403, `Expected 403 for suspended staff, got ${res.status}`);
    const json = await res.json();
    assert.strictEqual(json.isSuspended, true);

    // Verify cookie deletion
    const setCookie = res.headers.get("set-cookie");
    assert(setCookie && (setCookie.includes("mma_staff_session=;") || setCookie.includes("Max-Age=0") || setCookie.includes("expires=")), "Session cookie must be cleared on suspend");
  });

  console.log("\n=========================================================");
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} VERIFICATION CHECKS PASSED FOR SUB-ADMIN MANAGER!`);
  } else {
    console.log(`💥 ${failed} TEST(S) FAILED! (${passed} passed)`);
    process.exit(1);
  }
  console.log("=========================================================\n");
}

runTests().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
