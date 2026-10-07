import assert from "assert";
import { POST as staffLoginPost } from "../src/app/api/staff/login/route.js";
import {
  getLockoutStatus,
  recordFailedAttempt,
  clearFailedAttempts,
  findStaffAccount,
} from "../src/lib/staffAuthService.js";
import { middleware } from "../src/middleware.js";
import { getServerAuditLogs, recordServerAuditLog } from "../src/lib/auditLogger.js";
import { verifyArgon2, hashArgon2 } from "../src/lib/argon2.js";

console.log("=========================================================");
console.log("🚀 VERIFYING STAFF AUTH, LOCKOUT, RBAC & AUDIT LOGGING");
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
  // 1. Staff Login staff_id + password (Argon2)
  // =========================================================================
  console.log("--- 1. Staff Login & Argon2 Verification ---");

  await test("Argon2 hashes and verifies passwords correctly", async () => {
    const rawPass = "OwnerSecret@2026";
    const hash = await hashArgon2(rawPass);
    assert(hash && hash.startsWith("$argon2id$"), "Hash should be valid Argon2id encoded string");
    const isMatch = await verifyArgon2(rawPass, hash);
    assert(isMatch === true, "Argon2 verification should return true for matching password");
    const isFalse = await verifyArgon2("WrongPass123", hash);
    assert(isFalse === false, "Argon2 verification should return false for incorrect password");
  });

  await test("Staff login succeeds for MMA-000 with valid credentials", async () => {
    clearFailedAttempts("MMA-000");
    const req = new Request("http://localhost:3000/api/staff/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staff_id: "MMA-000", password: "Owner@2026" }),
    });
    const res = await staffLoginPost(req);
    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.staff.staff_id, "MMA-000");
    assert.strictEqual(json.role, "main_admin");
    assert.strictEqual(json.must_change_password, true);

    // Verify session cookie is set
    const setCookie = res.headers.get("set-cookie");
    assert(setCookie && setCookie.includes("mma_staff_session"), "mma_staff_session cookie should be set");
  });

  // =========================================================================
  // 2. 5-Fail Lockout Check
  // =========================================================================
  console.log("\n--- 2. 5-Fail Lockout Enforcement ---");

  await test("5 consecutive failed logins lock the account", async () => {
    const targetId = "TEST-LOCKOUT-01";
    clearFailedAttempts(targetId);

    // First 4 failed attempts: account should NOT be locked
    for (let i = 1; i <= 4; i++) {
      const { locked, attemptsLeft } = recordFailedAttempt(targetId);
      assert.strictEqual(locked, false, `Attempt ${i} should not lock account`);
      assert.strictEqual(attemptsLeft, 5 - i, `Expected ${5 - i} attempts left`);
    }

    // 5th failed attempt: account MUST lock
    const fifth = recordFailedAttempt(targetId);
    assert.strictEqual(fifth.locked, true, "5th failed attempt must lock account");
    assert.strictEqual(fifth.attemptsLeft, 0);

    // Verify getLockoutStatus returns isLocked = true
    const status = getLockoutStatus(targetId);
    assert.strictEqual(status.isLocked, true);
    assert(status.remainingSec > 0 && status.remainingSec <= 900, "Lockout duration should be ~15 minutes");

    // Login API should return 423 Locked
    const req = new Request("http://localhost:3000/api/staff/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staff_id: targetId, password: "AnyPassword" }),
    });
    const res = await staffLoginPost(req);
    assert.strictEqual(res.status, 423, `Expected HTTP 423 Locked, got ${res.status}`);
    const json = await res.json();
    assert.strictEqual(json.isLocked, true);
    assert(json.error.includes("Account locked due to 5 consecutive failed attempts"));

    // Cleanup
    clearFailedAttempts(targetId);
    assert.strictEqual(getLockoutStatus(targetId).isLocked, false);
  });

  // =========================================================================
  // 3. Suspend Check Per Request
  // =========================================================================
  console.log("\n--- 3. Suspend Check Per Request ---");

  await test("Suspended staff accounts are blocked and sessions killed in login", async () => {
    const req = new Request("http://localhost:3000/api/staff/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staff_id: "MMA-004", password: "Any" }), // MMA-004 is suspended
    });
    const res = await staffLoginPost(req);
    assert.strictEqual(res.status, 403, `Expected 403, got ${res.status}`);
    const json = await res.json();
    assert.strictEqual(json.isSuspended, true);
  });

  await test("Suspended staff session visiting API route is killed with 403", async () => {
    const suspendedSession = {
      staff_id: "MMA-SUSPENDED",
      name: "Suspended Agent",
      role: "sub_admin",
      status: "suspended",
      permissions: ["messages.manage"],
    };

    const req = new Request("http://localhost:3000/api/courses", {
      method: "GET",
      headers: {
        cookie: `mma_staff_session=${encodeURIComponent(JSON.stringify(suspendedSession))}`,
      },
    });

    const res = await middleware(req);
    assert.strictEqual(res.status, 403, `Suspended session on API should return 403, got ${res.status}`);
    const json = await res.json();
    assert.strictEqual(json.isSuspended, true);
  });

  // =========================================================================
  // 4. Forced Password Change
  // =========================================================================
  console.log("\n--- 4. Forced Password Change ---");

  await test("Staff with must_change_password=true is redirected to /staff/change-password", async () => {
    const needPassChangeSession = {
      staff_id: "MMA-000",
      name: "Owner",
      role: "main_admin",
      status: "active",
      must_change_password: true,
      permissions: [],
    };

    const req = new Request("http://localhost:3000/admin/settings", {
      method: "GET",
      headers: {
        cookie: `mma_staff_session=${encodeURIComponent(JSON.stringify(needPassChangeSession))}`,
      },
    });

    const res = await middleware(req);
    // Should be redirect to /staff/change-password
    assert.strictEqual(res.status, 307, `Expected 307 redirect, got ${res.status}`);
    const location = res.headers.get("location");
    assert(location && location.includes("/staff/change-password"), `Expected redirect to /staff/change-password, got ${location}`);
  });

  // =========================================================================
  // 5. /admin vs /sub Middleware with Permission Keys
  // =========================================================================
  console.log("\n--- 5. /admin vs /sub Middleware & RBAC ---");

  await test("Sub-admin hitting /admin/* gets 403 Forbidden (main_admin_required)", async () => {
    const subAdminSession = {
      staff_id: "MMA-001",
      name: "Support Staff",
      role: "sub_admin",
      status: "active",
      must_change_password: false,
      permissions: ["messages.manage", "students.view"],
    };

    const req = new Request("http://localhost:3000/admin/sub-admins", {
      method: "GET",
      headers: {
        cookie: `mma_staff_session=${encodeURIComponent(JSON.stringify(subAdminSession))}`,
      },
    });

    const res = await middleware(req);
    assert.strictEqual(res.status, 403, `Sub-admin accessing /admin/* must get 403, got ${res.status}`);
    // Check rewrite header or URL
    const rewriteHeader = res.headers.get("x-middleware-rewrite");
    assert(rewriteHeader && rewriteHeader.includes("main_admin_required"), `Expected rewrite with main_admin_required, got ${rewriteHeader}`);
  });

  await test("Main-admin hitting /admin/* is allowed (200/Next)", async () => {
    const mainAdminSession = {
      staff_id: "MMA-000",
      name: "Owner",
      role: "main_admin",
      status: "active",
      must_change_password: false,
      permissions: [],
    };

    const req = new Request("http://localhost:3000/admin/sub-admins", {
      method: "GET",
      headers: {
        cookie: `mma_staff_session=${encodeURIComponent(JSON.stringify(mainAdminSession))}`,
      },
    });

    const res = await middleware(req);
    assert.strictEqual(res.status, 200, `Main admin accessing /admin/* should pass, got ${res.status}`);
  });

  await test("Sub-admin without messages.manage accessing /sub/messages gets 403", async () => {
    const subAdminWithoutMessages = {
      staff_id: "MMA-002",
      name: "Student Finder Staff",
      role: "sub_admin",
      status: "active",
      must_change_password: false,
      permissions: ["students.view"], // lacks messages.manage
    };

    const req = new Request("http://localhost:3000/sub/messages", {
      method: "GET",
      headers: {
        cookie: `mma_staff_session=${encodeURIComponent(JSON.stringify(subAdminWithoutMessages))}`,
      },
    });

    const res = await middleware(req);
    assert.strictEqual(res.status, 403, `Sub-admin without messages.manage must get 403, got ${res.status}`);
    const rewriteHeader = res.headers.get("x-middleware-rewrite");
    assert(rewriteHeader && rewriteHeader.includes("messages.manage"), `Expected perm=messages.manage in rewrite, got ${rewriteHeader}`);
  });

  await test("Sub-admin with messages.manage accessing /sub/messages is allowed (200)", async () => {
    const subAdminWithMessages = {
      staff_id: "MMA-001",
      name: "Support Staff",
      role: "sub_admin",
      status: "active",
      must_change_password: false,
      permissions: ["messages.manage"],
    };

    const req = new Request("http://localhost:3000/sub/messages", {
      method: "GET",
      headers: {
        cookie: `mma_staff_session=${encodeURIComponent(JSON.stringify(subAdminWithMessages))}`,
      },
    });

    const res = await middleware(req);
    assert.strictEqual(res.status, 200, `Sub-admin with messages.manage should pass, got ${res.status}`);
  });

  await test("Sub-admin without students.view accessing /sub/students gets 403", async () => {
    const subAdminWithoutStudents = {
      staff_id: "MMA-003",
      name: "Chat Staff",
      role: "sub_admin",
      status: "active",
      must_change_password: false,
      permissions: ["messages.manage"], // lacks students.view
    };

    const req = new Request("http://localhost:3000/sub/students", {
      method: "GET",
      headers: {
        cookie: `mma_staff_session=${encodeURIComponent(JSON.stringify(subAdminWithoutStudents))}`,
      },
    });

    const res = await middleware(req);
    assert.strictEqual(res.status, 403, `Sub-admin without students.view must get 403, got ${res.status}`);
    const rewriteHeader = res.headers.get("x-middleware-rewrite");
    assert(rewriteHeader && rewriteHeader.includes("students.view"), `Expected perm=students.view in rewrite, got ${rewriteHeader}`);
  });

  // =========================================================================
  // 6. Audit Middleware on Mutating Staff Actions
  // =========================================================================
  console.log("\n--- 6. Audit Middleware & Log Persistence ---");

  await test("Mutating staff actions automatically write audit rows", async () => {
    const initialCount = getServerAuditLogs().length;

    const staffSession = {
      staff_id: "MMA-001",
      name: "Support Staff",
      role: "sub_admin",
      status: "active",
      must_change_password: false,
      permissions: ["messages.manage"],
    };

    // Mutating POST request through middleware
    const req = new Request("http://localhost:3000/api/support/reply?id=msg-999", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: `mma_staff_session=${encodeURIComponent(JSON.stringify(staffSession))}`,
      },
      body: JSON.stringify({ message: "Resolving student query" }),
    });

    await middleware(req);

    // Verify audit row was written
    const updatedLogs = getServerAuditLogs();
    assert.strictEqual(updatedLogs.length, initialCount + 1, "Audit log count should increment by 1");

    const latest = updatedLogs[0];
    assert.strictEqual(latest.staff_id, "MMA-001");
    assert.strictEqual(latest.staffName, "Support Staff");
    assert.strictEqual(latest.staffRole, "sub_admin");
    assert(latest.action.includes("POST"), `Action should include POST, got ${latest.action}`);
    assert.strictEqual(latest.entity_id, "msg-999");
    assert(latest.timestamp, "Timestamp should be populated");
  });

  await test("Mutating DELETE request by main_admin records audit row", async () => {
    const initialCount = getServerAuditLogs().length;

    const mainAdminSession = {
      staff_id: "MMA-000",
      name: "Owner",
      role: "main_admin",
      status: "active",
      must_change_password: false,
      permissions: [],
    };

    const req = new Request("http://localhost:3000/api/courses/delete?id=crs-test", {
      method: "DELETE",
      headers: {
        cookie: `mma_staff_session=${encodeURIComponent(JSON.stringify(mainAdminSession))}`,
      },
    });

    await middleware(req);

    const updatedLogs = getServerAuditLogs();
    assert.strictEqual(updatedLogs.length, initialCount + 1, "Audit log count should increment by 1");
    const latest = updatedLogs[0];
    assert.strictEqual(latest.staff_id, "MMA-000");
    assert(latest.action.includes("DELETE"));
    assert.strictEqual(latest.entity_id, "crs-test");
  });

  console.log("\n=========================================================");
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} VERIFICATION CHECKS PASSED FOR STAFF AUTH & AUDIT!`);
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
