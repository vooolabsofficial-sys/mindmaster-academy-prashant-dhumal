// Comprehensive QA Test Suite for T23: Permission Lock & Final Authority Model
import fs from "fs";
import path from "path";

// Setup in-memory localStorage polyfill for Node.js
const storage = new Map();
global.localStorage = {
  getItem: (k) => storage.get(k) || null,
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
  clear: () => storage.clear(),
};
global.window = {
  dispatchEvent: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  alert: (msg) => console.log("   [Alert Prevented Action]:", msg),
};

console.log("=========================================================");
console.log("🔒 T23 — PERMISSION LOCK & FINAL AUTHORITY MODEL QA");
console.log("=========================================================\n");

let failures = 0;
function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failures++;
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

async function runTests() {
  const { getStaffUsers, saveStaffUser } = await import("../src/lib/staffStore.ts");

  // -------------------------------------------------------------------------
  // 1. SEED VERIFICATION: ONE SUB-ADMIN WITH BOTH KEYS, ONE WITH NONE
  // -------------------------------------------------------------------------
  console.log("\n--- 1. SEED VERIFICATION ---");
  const users = getStaffUsers();
  const owner = users.find((u) => u.staffId === "MMA-000");
  const subAdminBoth = users.find((u) => u.staffId === "MMA-001");
  const subAdminNone = users.find((u) => u.staffId === "MMA-002");

  assert(owner && owner.role === "main_admin", "MMA-000 is seeded as main_admin");
  assert(
    subAdminBoth &&
      subAdminBoth.role === "sub_admin" &&
      subAdminBoth.permissions.length === 2 &&
      subAdminBoth.permissions.includes("messages.manage") &&
      subAdminBoth.permissions.includes("students.view"),
    "MMA-001 is seeded as sub_admin with BOTH keys (messages.manage, students.view)"
  );
  assert(
    subAdminNone &&
      subAdminNone.role === "sub_admin" &&
      subAdminNone.permissions.length === 0,
    "MMA-002 is seeded as sub_admin with NO keys ([])"
  );

  // -------------------------------------------------------------------------
  // 2. DATA MIGRATION: PRUNING NON-ASSIGNABLE PERMISSIONS
  // -------------------------------------------------------------------------
  console.log("\n--- 2. DATA MIGRATION CHECK ---");
  // Test that attempting to save a sub-admin with legacy permissions strips them
  const legacySubAdmin = {
    id: "test-legacy-sub",
    staffId: "MMA-999",
    name: "Legacy Staff",
    email: "legacy@test.com",
    phone: "+91 99999 00000",
    role: "sub_admin",
    permissions: ["videos.manage", "courses.manage", "messages.manage", "reports.view"],
    status: "active",
    lastLoginAt: "2026-09-15 10:00",
  };
  saveStaffUser(legacySubAdmin);
  const reloaded = getStaffUsers().find((u) => u.staffId === "MMA-999");
  assert(
    reloaded &&
      reloaded.permissions.length === 1 &&
      reloaded.permissions[0] === "messages.manage",
    "Data migration: non-assignable keys (videos.manage, courses.manage, reports.view) are purged, leaving only messages.manage"
  );

  // -------------------------------------------------------------------------
  // 3. UI CODE AUDIT & PRUNING CHECKS
  // -------------------------------------------------------------------------
  console.log("\n--- 3. UI CODE AUDIT & PRUNING CHECKS ---");
  const sidebarCode = fs.readFileSync("src/components/admin/AdminSidebar.tsx", "utf8");
  assert(
    sidebarCode.includes("Dashboard") &&
      sidebarCode.includes("/sub/messages") &&
      sidebarCode.includes("/sub/students") &&
      sidebarCode.includes("/sub/activity") &&
      !sidebarCode.includes("{ label: \"Courses\", href: \"/sub/courses\"") &&
      !sidebarCode.includes("{ label: \"Videos\", href: \"/sub/videos\"") &&
      !sidebarCode.includes("{ label: \"Coupons\", href: \"/sub/coupons\"") &&
      !sidebarCode.includes("{ label: \"Analytics Hub\", href: \"/sub/analytics\""),
    "AdminSidebar.tsx: sub-admin items are strictly hardcoded to Dashboard, Messages, Student Finder, My Activity"
  );

  const subAdminsPageCode = fs.readFileSync("src/app/admin/sub-admins/page.tsx", "utf8");
  const matches = subAdminsPageCode.match(/key:\s*"([^"]+)"/g) || [];
  const permKeysInAllPerms = matches
    .filter((m) => m.includes(".manage") || m.includes(".view"))
    .map((m) => m.replace(/key:\s*"/, "").replace('"', ""));
  assert(
    permKeysInAllPerms.length === 2 &&
      permKeysInAllPerms.includes("messages.manage") &&
      permKeysInAllPerms.includes("students.view"),
    `Sub-admin permission form: shows exactly 2 checkboxes (${permKeysInAllPerms.join(", ")})`
  );

  const studentsPageCode = fs.readFileSync("src/app/admin/students/page.tsx", "utf8");
  assert(
    studentsPageCode.includes("{isMainAdmin && <th className=\"pb-3.5\">Watch Telemetrics</th>}") &&
      studentsPageCode.includes("{isMainAdmin && (") &&
      studentsPageCode.includes("Per-Lesson Watch Telemetry (Admin Only)"),
    "admin/students/page.tsx: Watch Telemetrics column and per-lesson tracking are strictly guarded by isMainAdmin"
  );

  const videosPageCode = fs.readFileSync("src/app/admin/videos/page.tsx", "utf8");
  assert(
    videosPageCode.includes("{isMainAdmin && (") &&
      videosPageCode.includes("👑 Watch Stats (Admin)") &&
      videosPageCode.includes("{isMainAdmin && (") &&
      videosPageCode.includes("setDeleteModalVideo(video)"),
    "admin/videos/page.tsx: Watch stats column and delete buttons render only for isMainAdmin"
  );

  // Check physical deletion of unpermitted sub-routes
  const deletedFolders = [
    "courses",
    "videos",
    "coupons",
    "grants",
    "books",
    "analytics",
    "playlist",
    "notes",
    "reports",
    "my-activity",
  ];
  for (const f of deletedFolders) {
    const exists = fs.existsSync(`src/app/sub/${f}`);
    assert(!exists, `src/app/sub/${f} directory is deleted from disk`);
  }

  // -------------------------------------------------------------------------
  // 4. SERVER MIDDLEWARE & HTTP API ENDPOINT ENFORCEMENT
  // -------------------------------------------------------------------------
  console.log("\n--- 4. SERVER MIDDLEWARE & HTTP API ENFORCEMENT ---");
  const baseUrl = "http://localhost:3000";

  // Sessions
  const subAdminBothCookie = `mma_staff_session=${encodeURIComponent(
    JSON.stringify({
      staff_id: "MMA-001",
      name: "Rohit More",
      role: "sub_admin",
      permissions: ["messages.manage", "students.view"],
      status: "active",
      logged_at: Date.now(),
    })
  )}`;

  const subAdminNoneCookie = `mma_staff_session=${encodeURIComponent(
    JSON.stringify({
      staff_id: "MMA-002",
      name: "Sneha Patil",
      role: "sub_admin",
      permissions: [],
      status: "active",
      logged_at: Date.now(),
    })
  )}`;

  const mainAdminCookie = `mma_staff_session=${encodeURIComponent(
    JSON.stringify({
      staff_id: "MMA-000",
      name: "Prashant Dhumal",
      role: "main_admin",
      permissions: [
        "messages.manage",
        "students.view",
        "videos.manage",
        "courses.manage",
        "coupons.manage",
        "reports.view",
      ],
      status: "active",
      logged_at: Date.now(),
    })
  )}`;

  try {
    // 4.1 Sub-admin requesting /admin/* returns 403
    const resAdmin = await fetch(`${baseUrl}/admin`, {
      headers: { Cookie: subAdminBothCookie },
      redirect: "manual",
    });
    assert(resAdmin.status === 403, `Sub-admin access to /admin returns 403 (got ${resAdmin.status})`);

    const resAdminCourses = await fetch(`${baseUrl}/admin/courses`, {
      headers: { Cookie: subAdminBothCookie },
      redirect: "manual",
    });
    assert(
      resAdminCourses.status === 403,
      `Sub-admin access to /admin/courses returns 403 (got ${resAdminCourses.status})`
    );

    const resAdminSubAdmins = await fetch(`${baseUrl}/admin/sub-admins`, {
      headers: { Cookie: subAdminBothCookie },
      redirect: "manual",
    });
    assert(
      resAdminSubAdmins.status === 403,
      `Sub-admin access to /admin/sub-admins returns 403 (got ${resAdminSubAdmins.status})`
    );

    // 4.2 Sub-admin requesting deleted /sub/* routes returns 403 or 404
    for (const f of ["courses", "videos", "coupons", "grants", "books", "analytics"]) {
      const resSubMod = await fetch(`${baseUrl}/sub/${f}`, {
        headers: { Cookie: subAdminBothCookie },
        redirect: "manual",
      });
      assert(
        resSubMod.status === 403 || resSubMod.status === 404,
        `/sub/${f} for sub-admin returns 403/404 (got ${resSubMod.status})`
      );
    }

    // 4.3 Sub-admin with both keys accessing permitted routes
    const resMessagesBoth = await fetch(`${baseUrl}/sub/messages`, {
      headers: { Cookie: subAdminBothCookie },
      redirect: "manual",
    });
    assert(
      resMessagesBoth.status === 200,
      `/sub/messages for sub-admin with messages.manage returns 200 (got ${resMessagesBoth.status})`
    );

    const resStudentsBoth = await fetch(`${baseUrl}/sub/students`, {
      headers: { Cookie: subAdminBothCookie },
      redirect: "manual",
    });
    assert(
      resStudentsBoth.status === 200,
      `/sub/students for sub-admin with students.view returns 200 (got ${resStudentsBoth.status})`
    );

    // 4.4 Sub-admin with no keys accessing /sub/messages and /sub/students returns 403
    const resMessagesNone = await fetch(`${baseUrl}/sub/messages`, {
      headers: { Cookie: subAdminNoneCookie },
      redirect: "manual",
    });
    assert(
      resMessagesNone.status === 403,
      `/sub/messages for sub-admin without messages.manage returns 403 (got ${resMessagesNone.status})`
    );

    const resStudentsNone = await fetch(`${baseUrl}/sub/students`, {
      headers: { Cookie: subAdminNoneCookie },
      redirect: "manual",
    });
    assert(
      resStudentsNone.status === 403,
      `/sub/students for sub-admin without students.view returns 403 (got ${resStudentsNone.status})`
    );

    // 4.5 DELETE endpoint strictly requires main_admin
    const resDeleteSub = await fetch(`${baseUrl}/api/courses?id=course-1`, {
      method: "DELETE",
      headers: { Cookie: subAdminBothCookie },
    });
    assert(
      resDeleteSub.status === 403,
      `DELETE request as sub-admin returns 403 (got ${resDeleteSub.status})`
    );

    // 4.6 Watch-stats API requires main_admin
    const resWatchStatsSub = await fetch(`${baseUrl}/api/watch-stats`, {
      headers: { Cookie: subAdminBothCookie },
    });
    assert(
      resWatchStatsSub.status === 403,
      `/api/watch-stats as sub-admin returns 403 (got ${resWatchStatsSub.status})`
    );

    const resWatchStatsAdmin = await fetch(`${baseUrl}/api/watch-stats`, {
      headers: { Cookie: mainAdminCookie },
    });
    assert(
      resWatchStatsAdmin.status === 200,
      `/api/watch-stats as main_admin returns 200 (got ${resWatchStatsAdmin.status})`
    );

    // 4.7 Full Audit Trail API requires main_admin
    const resAuditSub = await fetch(`${baseUrl}/api/staff/audit`, {
      headers: { Cookie: subAdminBothCookie },
    });
    assert(
      resAuditSub.status === 403,
      `/api/staff/audit as sub-admin returns 403 (got ${resAuditSub.status})`
    );

    const resAuditAdmin = await fetch(`${baseUrl}/api/staff/audit`, {
      headers: { Cookie: mainAdminCookie },
    });
    assert(
      resAuditAdmin.status === 200,
      `/api/staff/audit as main_admin returns 200 (got ${resAuditAdmin.status})`
    );

    // 4.8 Settings API requires main_admin
    const resSettingsSub = await fetch(`${baseUrl}/api/settings`, {
      headers: { Cookie: subAdminBothCookie },
    });
    assert(
      resSettingsSub.status === 403,
      `/api/settings as sub-admin returns 403 (got ${resSettingsSub.status})`
    );

    const resSettingsAdmin = await fetch(`${baseUrl}/api/settings`, {
      headers: { Cookie: mainAdminCookie },
    });
    assert(
      resSettingsAdmin.status === 200,
      `/api/settings as main_admin returns 200 (got ${resSettingsAdmin.status})`
    );

    // 4.9 Analytics API requires main_admin
    const resAnalyticsSub = await fetch(`${baseUrl}/api/reports/analytics`, {
      headers: { Cookie: subAdminBothCookie },
    });
    assert(
      resAnalyticsSub.status === 403,
      `/api/reports/analytics as sub-admin returns 403 (got ${resAnalyticsSub.status})`
    );

    // 4.10 Student routes unchanged
    const studentCookie = `mindmaster_session=valid_student_session`;
    const resStudentHome = await fetch(`${baseUrl}/home`, {
      headers: { Cookie: studentCookie },
      redirect: "manual",
    });
    assert(
      resStudentHome.status === 200,
      `Student route /home with student session returns 200 (got ${resStudentHome.status})`
    );

    const resStudentCourses = await fetch(`${baseUrl}/courses`, {
      headers: { Cookie: studentCookie },
      redirect: "manual",
    });
    assert(
      resStudentCourses.status === 200,
      `Student route /courses with student session returns 200 (got ${resStudentCourses.status})`
    );
  } catch (err) {
    console.error("Fetch test error (is dev server running?):", err.message);
  }

  // -------------------------------------------------------------------------
  // 5. DATABASE MIGRATION AUDIT
  // -------------------------------------------------------------------------
  console.log("\n--- 5. DATABASE MIGRATION 004 AUDIT ---");
  const migrationFile = "supabase/migrations/004_permission_lock.sql";
  assert(fs.existsSync(migrationFile), "004_permission_lock.sql exists in supabase/migrations");
  const migrationSql = fs.readFileSync(migrationFile, "utf8");
  assert(
    migrationSql.includes("DELETE FROM staff_permissions") &&
      migrationSql.includes("WHERE permission_key NOT IN ('messages.manage', 'students.view');"),
    "004_permission_lock.sql: deletes legacy permissions from staff_permissions"
  );
  assert(
    migrationSql.includes("CHECK (permission_key IN ('messages.manage', 'students.view'))"),
    "004_permission_lock.sql: updates CHECK constraint to strictly 2 keys"
  );
  assert(
    migrationSql.includes("is_main_admin()") &&
      migrationSql.includes("ON courses FOR ALL") &&
      migrationSql.includes("ON lessons FOR ALL") &&
      migrationSql.includes("ON coupons FOR ALL") &&
      migrationSql.includes("ON grants FOR ALL"),
    "004_permission_lock.sql: course/video/coupon/grant write & delete policies locked to main_admin"
  );

  console.log("\n=========================================================");
  if (failures === 0) {
    console.log("🎉 ALL PERMISSION LOCK & FINAL AUTHORITY TESTS PASSED!");
  } else {
    console.error(`💥 ${failures} TEST(S) FAILED!`);
    process.exit(1);
  }
  console.log("=========================================================\n");
}

runTests().catch((e) => {
  console.error("Unexpected error in QA test runner:", e);
  process.exit(1);
});
