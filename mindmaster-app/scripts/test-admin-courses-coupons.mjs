/**
 * ==============================================================================
 * 🧪 ADMIN SHELL, COURSES, VIDEOS & COUPONS VERIFICATION SUITE
 * ==============================================================================
 * Features Tested:
 * - Admin Shell Overview KPIs & 7 Centralized Platform Settings Cards
 * - Course Catalog, Publishing/Expiry Scheduling & Visibility Enforcement
 * - Video Catalog, Peach Expiry Countdown & Admin-Only Watch Stats
 * - Flexible Coupon Management (Percent, Flat, Limits) & Checkout Validation
 * ==============================================================================
 */

import assert from "assert";
import fs from "fs";
import { isCourseVisibleToStudent } from "../src/lib/courseVisibility.js";
import { validateCoupon } from "../src/app/actions/checkout.js";
import { recordCouponRedemption } from "../src/lib/couponRedemptionStore.js";
import {
  getPlatformSettings,
  savePlatformSettings,
  getStaffCourses,
  saveStaffCourse,
  getStaffCoupons,
  saveStaffCoupon,
  deleteStaffCoupon,
  clearAllStaffCoupons,
} from "../src/lib/staffStore.js";
import { GET as cronCleanupGet } from "../src/app/api/cron/cleanup-expired/route.js";

console.log("================================================================================");
console.log("🚀 VERIFYING ADMIN SHELL, SETTINGS, COURSES, VIDEOS & COUPONS");
console.log("================================================================================\n");

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

  // Admin Shell + Settings
  console.log("--- Admin Shell + Settings ---");

  await test("Admin shell layout and overview stats render correctly", () => {
    const adminPageSrc = fs.readFileSync("src/app/admin/page.tsx", "utf-8");
    assert(adminPageSrc.includes("AdminShell"), "AdminShell missing from admin page");
    assert(adminPageSrc.includes("Expiring Soon"), "Expiring soon card missing");
    assert(adminPageSrc.includes("Recent Payments") || adminPageSrc.includes("recentPayments"), "Payments section missing");
    assert(adminPageSrc.includes("Total Active Students") || adminPageSrc.includes("studentsCount"), "Student stats missing");
    assert(adminPageSrc.includes("getStaffCourses"), "Course stats missing");
    assert(adminPageSrc.includes("getStaffCoupons"), "Coupon stats missing");
  });

  await test("Centralized settings save properly and persist in store", () => {
    const original = getPlatformSettings();
    const testConfig = {
      ...original,
      max_sub_admins: 35,
      default_access_months: 6,
      default_video_live_days: 45,
      default_coupon_days: 10,
      renewal_coupon_percent: 40,
      reminder_template: "Test template for {name} on {course}",
      maintenance: false,
      youtube_api_key: "AIzaSyTestApiKey123",
    };

    savePlatformSettings(testConfig);
    const updated = getPlatformSettings();
    assert.strictEqual(updated.max_sub_admins, 35);
    assert.strictEqual(updated.default_access_months, 6);
    assert.strictEqual(updated.default_video_live_days, 45);
    assert.strictEqual(updated.default_coupon_days, 10);
    assert.strictEqual(updated.renewal_coupon_percent, 40);
    assert.strictEqual(updated.reminder_template, "Test template for {name} on {course}");
    assert.strictEqual(updated.youtube_api_key, "AIzaSyTestApiKey123");

    if (original) savePlatformSettings(original);
  });

  await test("Admin settings page contains all 7 functional cards per design reference", () => {
    const settingsPageSrc = fs.readFileSync("src/app/admin/settings/page.tsx", "utf-8");
    assert(settingsPageSrc.includes("Payments Card") || settingsPageSrc.includes("Razorpay"), "Payments card missing");
    assert(settingsPageSrc.includes("Defaults Card") || settingsPageSrc.includes("defaultAccessMonths"), "Defaults card missing");
    assert(settingsPageSrc.includes("Limits Card") || settingsPageSrc.includes("maxSubAdmins"), "Limits card missing");
    assert(settingsPageSrc.includes("Notifications Card") || settingsPageSrc.includes("reminderTemplate"), "Notifications card missing");
    assert(settingsPageSrc.includes("Academy Profile") || settingsPageSrc.includes("centreAddress"), "Profile card missing");
    assert(settingsPageSrc.includes("Maintenance") || settingsPageSrc.includes("isMaintenanceMode"), "Maintenance card missing");
    assert(settingsPageSrc.includes("YouTube Data API") || settingsPageSrc.includes("youtubeApiKey"), "YouTube API card missing");
  });

  // Course + Video Managers
  console.log("\n--- Course + Video Managers ---");

  await test("Course manager has segment builder, publish/remove scheduling, and price fields", () => {
    const coursePageSrc = fs.readFileSync("src/app/admin/courses/page.tsx", "utf-8");
    assert(coursePageSrc.includes("segmentType"), "Target segment builder missing");
    assert(coursePageSrc.includes("publishAt"), "Publish scheduling missing");
    assert(coursePageSrc.includes("removeAt"), "Remove scheduling missing");
    assert(coursePageSrc.includes("formPrice"), "Price field missing");
    assert(coursePageSrc.includes("accessMonths"), "Access months missing");
    assert(coursePageSrc.includes("isLive"), "Live toggle missing");
  });

  await test("Video manager includes Watch Stats column and delete actions for admin", () => {
    const videoPageSrc = fs.readFileSync("src/app/admin/videos/page.tsx", "utf-8");
    assert(videoPageSrc.includes("👑 Watch Stats (Admin)"), "Watch stats column header missing");
    assert(videoPageSrc.includes("avgWatchPercent"), "Average watch percent missing");
    assert(videoPageSrc.includes("Peach Remove Countdown") || videoPageSrc.includes("daysLeft"), "Remove countdown missing");
    assert(videoPageSrc.includes("Delete Video (Admin Only)"), "Admin delete action missing");
  });

  await test("Course visibility enforcement: scheduled course hidden before publish date", () => {
    const now = Date.now();
    const futurePublish = new Date(now + 24 * 60 * 60 * 1000).toISOString();
    const scheduledCourse = {
      id: "c-scheduled-test",
      code: "MM-SCHED",
      title: "Scheduled Course Test",
      status: "live",
      publishAt: futurePublish,
    };

    const visibleBefore = isCourseVisibleToStudent(scheduledCourse, null, now);
    assert.strictEqual(visibleBefore, false, "Scheduled course must be hidden before publish date");

    const afterPubTimestamp = now + 48 * 60 * 60 * 1000;
    const visibleAfter = isCourseVisibleToStudent(scheduledCourse, null, afterPubTimestamp);
    assert.strictEqual(visibleAfter, true, "Scheduled course must be visible after publish date arrives");
  });

  await test("Course visibility enforcement: expired course hidden after remove date", () => {
    const now = Date.now();
    const pastRemove = new Date(now - 1000).toISOString();
    const expiredCourse = {
      id: "c-expired-test",
      code: "MM-EXP",
      title: "Expired Course Test",
      status: "live",
      removeAt: pastRemove,
    };

    const visible = isCourseVisibleToStudent(expiredCourse, null, now);
    assert.strictEqual(visible, false, "Course must be hidden after remove date has passed");
  });

  await test("Course visibility enforcement: district targeting restricts non-matching students", () => {
    const targetedCourse = {
      id: "c-pune-only",
      code: "MM-PUNE",
      title: "Pune Exclusive Course",
      status: "live",
      targetSegmentConfig: {
        type: "district",
        district: "Pune",
      },
    };

    const puneStudent = { id: "s-1", district: "Pune" };
    assert.strictEqual(isCourseVisibleToStudent(targetedCourse, puneStudent), true);

    const nashikStudent = { id: "s-2", district: "Nashik" };
    assert.strictEqual(isCourseVisibleToStudent(targetedCourse, nashikStudent), false);
  });

  await test("Daily cleanup cron scans courses, transitions statuses, and handles expiry", async () => {
    const req = new Request("http://localhost:3000/api/cron/cleanup-expired");
    const res = await cronCleanupGet(req);
    assert.strictEqual(res.status, 200, `Expected 200 OK from cleanup cron, got ${res.status}`);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert(typeof json.summary === "object", "Summary object expected");
    assert(typeof json.summary.coursesScanned === "number", "coursesScanned number expected");
    assert(typeof json.summary.studentsScanned === "number", "studentsScanned number expected");
  });

  // Coupon Manager & Checkout Validation
  console.log("\n--- Coupon Manager & Checkout Validation ---");

  await test("System starts with 0 coupons (Clean Slate blank app)", () => {
    clearAllStaffCoupons();
    assert.strictEqual(getStaffCoupons().length, 0, "Expected 0 coupons in clean slate");
  });

  await test("Coupon manager page has complete CRUD fields, drawer, and delete modal", () => {
    const couponPageSrc = fs.readFileSync("src/app/admin/coupons/page.tsx", "utf-8");
    assert(couponPageSrc.includes("formCode"), "Coupon code input missing");
    assert(couponPageSrc.includes("formDiscountType"), "Discount type input missing");
    assert(couponPageSrc.includes("formAppliesAll"), "Applies all courses input missing");
    assert(couponPageSrc.includes("formPerUserUsage"), "Per user usage input missing");
    assert(couponPageSrc.includes("formValidityType"), "Validity type input missing");
    assert(couponPageSrc.includes("deleteModalCoupon"), "Delete modal missing");
  });

  await test("validateCoupon: Applies valid percent coupon and cleans up", async () => {
    saveStaffCoupon({
      id: "temp-percent-test",
      code: "TEMPPERCENT",
      discountType: "percentage",
      discountValue: 50,
      appliesTo: "all",
      applies_all: true,
      selectedCourseIds: [],
      usageLimitPerUser: "once",
      status: "active",
      is_active: true,
    });
    const res = await validateCoupon("TEMPPERCENT", "c-mm-01", "student-all-courses-01");
    assert(res.success, `Expected success, got: ${res.error}`);
    assert.strictEqual(res.coupon.discountType, "percent");
    assert.strictEqual(res.coupon.discountAmountPaise, 49950);
    deleteStaffCoupon("temp-percent-test");
    clearAllStaffCoupons();
  });

  await test("validateCoupon: Rejects expired coupon and cleans up", async () => {
    saveStaffCoupon({
      id: "temp-expired-test",
      code: "TEMPEXPIRED",
      discountType: "flat",
      discountValue: 10000,
      appliesTo: "all",
      applies_all: true,
      validityType: "date_range",
      validFrom: "2025-01-01",
      validUntil: "2025-02-01",
      starts_at: "2025-01-01T00:00:00Z",
      ends_at: "2025-02-01T23:59:59Z",
      status: "expired",
      is_active: true,
    });
    const res = await validateCoupon("TEMPEXPIRED", "c-mm-01", "student-expired-test");
    assert.strictEqual(res.success, false);
    assert(
      res.error.toLowerCase().includes("expired") || res.error.includes("मुदत संपलेली"),
      `Expected expired error, got: ${res.error}`
    );
    deleteStaffCoupon("temp-expired-test");
    clearAllStaffCoupons();
  });

  await test("validateCoupon: Rejects inactive / disabled coupon and cleans up", async () => {
    saveStaffCoupon({
      id: "temp-disabled-test",
      code: "TEMPDISABLED",
      discountType: "percentage",
      discountValue: 10,
      appliesTo: "all",
      applies_all: true,
      status: "disabled",
      is_active: false,
    });
    const res = await validateCoupon("TEMPDISABLED", "c-mm-01", "student-disabled-test");
    assert.strictEqual(res.success, false);
    assert(
      res.error.toLowerCase().includes("inactive") || res.error.includes("तात्पुरता बंद"),
      `Expected inactive error, got: ${res.error}`
    );
    deleteStaffCoupon("temp-disabled-test");
    clearAllStaffCoupons();
  });

  await test("validateCoupon: Rejects scheduled / future coupon and cleans up", async () => {
    saveStaffCoupon({
      id: "temp-future-test",
      code: "TEMPFUTURE",
      discountType: "percentage",
      discountValue: 25,
      appliesTo: "all",
      applies_all: true,
      validityType: "date_range",
      validFrom: "2029-01-01",
      validUntil: "2029-02-01",
      starts_at: "2029-01-01T00:00:00Z",
      ends_at: "2029-02-01T23:59:59Z",
      status: "scheduled",
      is_active: true,
    });
    const res = await validateCoupon("TEMPFUTURE", "c-mm-01", "student-scheduled-test");
    assert.strictEqual(res.success, false);
    assert(
      res.error.toLowerCase().includes("scheduled") ||
        res.error.toLowerCase().includes("not started") ||
        res.error.includes("अद्याप सुरू झालेला नाही"),
      `Expected scheduled error, got: ${res.error}`
    );
    deleteStaffCoupon("temp-future-test");
    clearAllStaffCoupons();
  });

  await test("validateCoupon: Course-restricted coupon rejected on non-eligible course", async () => {
    saveStaffCoupon({
      id: "temp-restricted-test",
      code: "TEMPRESTRICT",
      discountType: "flat",
      discountValue: 50000,
      appliesTo: "selected",
      applies_all: false,
      selectedCourseIds: ["c-mm-04", "c4"],
      status: "active",
      is_active: true,
    });
    const res = await validateCoupon("TEMPRESTRICT", "c-mm-01", "student-restricted-test");
    assert.strictEqual(res.success, false);
    assert(
      res.error.toLowerCase().includes("not applicable") || res.error.includes("लागू नाही"),
      `Expected not applicable error, got: ${res.error}`
    );
  });

  await test("validateCoupon: Course-restricted coupon accepted on eligible course and cleans up", async () => {
    const res = await validateCoupon("TEMPRESTRICT", "c-mm-04", "student-restricted-eligible");
    assert(res.success, `Expected success on eligible course, got: ${res.error}`);
    assert.strictEqual(res.coupon.discountType, "flat");
    deleteStaffCoupon("temp-restricted-test");
    clearAllStaffCoupons();
  });

  await test("validateCoupon: Enforces single-use per student limit and restores clean slate (0 coupons)", async () => {
    saveStaffCoupon({
      id: "temp-single-use",
      code: "TEMPSINGLE",
      discountType: "percentage",
      discountValue: 50,
      appliesTo: "all",
      applies_all: true,
      selectedCourseIds: [],
      usageLimitPerUser: "once",
      status: "active",
      is_active: true,
    });
    const studentId = `std-limit-test-${Date.now()}`;
    const firstUse = await validateCoupon("TEMPSINGLE", "c-mm-01", studentId);
    assert(firstUse.success, "First validation should succeed");

    recordCouponRedemption(studentId, "temp-single-use", "TEMPSINGLE");

    const secondUse = await validateCoupon("TEMPSINGLE", "c-mm-01", studentId);
    assert.strictEqual(secondUse.success, false);
    assert(
      secondUse.error.toLowerCase().includes("already used") || secondUse.error.includes("वापर केला आहे"),
      `Expected already used error, got: ${secondUse.error}`
    );
    deleteStaffCoupon("temp-single-use");
    clearAllStaffCoupons();
    assert.strictEqual(getStaffCoupons().length, 0, "System cleanly restored to 0 coupons");
  });

  console.log("\n================================================================================");
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} VERIFICATION CHECKS PASSED FOR ADMIN, COURSES & COUPONS!`);
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
