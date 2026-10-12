import assert from "assert";
import { validateCoupon } from "../src/app/actions/checkout.ts";
import {
  getStaffCoupons,
  saveStaffCoupon,
  toggleStaffCouponStatus,
} from "../src/lib/staffStore.ts";
import {
  getRedemptionsByCoupon,
  recordCouponRedemption,
} from "../src/lib/couponRedemptionStore.ts";

async function run() {
  console.log("=== Testing Professional Coupon Management & Tracking ===");

  saveStaffCoupon({
    id: "cpn-2",
    code: "POLICEBHARTI",
    description: "Police Bharti Special",
    discountType: "flat",
    discountValue: 50000,
    minOrderValuePaise: 99900,
    appliesTo: "all",
    applies_all: true,
    selectedCourseIds: [],
    usageLimitPerUser: "once",
    status: "active",
    is_active: true,
  });

  // 1. Minimum Order Value Check
  const resMinOrderFail = await validateCoupon("POLICEBHARTI", "c-mm-04", "std-test-user"); // c-mm-04 price is ₹499, min order for POLICEBHARTI is ₹999
  assert.strictEqual(resMinOrderFail.success, false, "Should fail when course price is below minOrderValue");
  assert(resMinOrderFail.error?.includes("किमान"), "Error should mention minimum order amount");
  console.log("✓ Minimum order value requirement correctly enforced");

  // 2. Instant Paused Status Check
  const pausedCpn = {
    id: "test-paused-cpn",
    code: "TESTPAUSED",
    description: "Temporary paused flash deal",
    discountType: "percentage",
    discountValue: 20,
    appliesTo: "all",
    applies_all: true,
    selectedCourseIds: [],
    usageLimitPerUser: "once",
    per_user_usage: "once",
    validityType: "days",
    validDays: 14,
    maxTotalUses: 50,
    usage_limit: 50,
    totalUsed: 5,
    used_count: 5,
    status: "paused",
    is_active: false,
    createdAt: "2026-10-01",
  };
  saveStaffCoupon(pausedCpn);

  const resPaused = await validateCoupon("TESTPAUSED", "c-mm-01", "std-test-user");
  assert.strictEqual(resPaused.success, false, "Should reject paused coupons");
  assert(resPaused.error?.includes("तात्पुरता बंद") || resPaused.error?.includes("Paused"), "Should show paused message");
  console.log("✓ Paused/Inactive coupon properly rejected");

  // Toggle to active
  const toggled = toggleStaffCouponStatus("test-paused-cpn");
  assert.strictEqual(toggled?.status, "active", "Should toggle status to active");
  const resResumed = await validateCoupon("TESTPAUSED", "c-mm-01", "std-fresh-user-999");
  assert.strictEqual(resResumed.success, true, "Should succeed after resuming coupon");
  console.log("✓ Toggle status switch works seamlessly");

  // 3. Quota Limit Check (e.g. 100 students)
  const fullCpn = {
    id: "test-quota-full",
    code: "QUOTAFULL100",
    description: "Sold out batch coupon",
    discountType: "flat",
    discountValue: 10000,
    appliesTo: "all",
    applies_all: true,
    selectedCourseIds: [],
    usageLimitPerUser: "once",
    per_user_usage: "once",
    validityType: "days",
    validDays: 14,
    maxTotalUses: 100,
    usage_limit: 100,
    totalUsed: 100,
    used_count: 100,
    status: "active",
    is_active: true,
    createdAt: "2026-10-01",
  };
  saveStaffCoupon(fullCpn);

  const resFull = await validateCoupon("QUOTAFULL100", "c-mm-01", "std-quota-tester");
  assert.strictEqual(resFull.success, false, "Should fail when coupon reaches 100/100 limit");
  assert(resFull.error?.includes("मर्यादा (Quota) समाप्त"), "Should show quota finished error");
  console.log("✓ 100-student quota limit auto-expiry enforced");

  // 4. Rich Redemption Tracking Log
  recordCouponRedemption(
    "std-audit-test",
    "test-paused-cpn",
    "TESTPAUSED",
    {
      studentName: "अभिजीत पवार",
      studentMobile: "+91 99220 55443",
      courseId: "c-mm-01",
      courseTitle: "Memory Technique Seminar",
      originalPricePaise: 99900,
      discountPaise: 19980,
      paidPaise: 79920,
    }
  );

  const redemptions = getRedemptionsByCoupon("TESTPAUSED");
  assert(redemptions.length >= 1, "Should record and retrieve redemption");
  const latest = redemptions[0];
  assert.strictEqual(latest.studentName, "अभिजीत पवार", "Should store student name in redemption audit");
  assert.strictEqual(latest.discountPaise, 19980, "Should store exact discount amount");
  console.log("✓ Rich redemption student audit log successfully verified");

  console.log("🎉 ALL PROFESSIONAL COUPON MANAGEMENT TESTS PASSED!");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
