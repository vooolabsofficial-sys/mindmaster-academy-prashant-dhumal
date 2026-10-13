import assert from "assert";
import crypto from "crypto";
import fs from "fs";
import { validateCoupon, createRazorpayOrder, verifyRazorpayPayment } from "../src/app/actions/checkout.js";
import { MOCK_COURSES, COURSE_ID_MAP } from "../src/lib/mockData.js";
import { recordCouponRedemption, clearAllRedemptions } from "../src/lib/couponRedemptionStore.js";
import { saveStaffCoupon, clearAllStaffCoupons } from "../src/lib/staffStore.js";

console.log("================================================================================");
console.log("💳 VERIFYING CHECKOUT, COUPON VALIDATION & RAZORPAY FLOW");
console.log("================================================================================\n");

async function runTests() {
  let passed = 0;
  let failed = 0;

  // Seed isolated test coupons for checkout validation
  saveStaffCoupon({
    id: "chk-test-welcome",
    code: "CHKWELCOME50",
    description: "50% Welcome",
    discountType: "percentage",
    discountValue: 50,
    appliesTo: "all",
    applies_all: true,
    selectedCourseIds: [],
    usageLimitPerUser: "once",
    validityType: "date_range",
    validFrom: "2026-10-01",
    validUntil: "2026-12-31",
    starts_at: "2026-10-01T00:00:00Z",
    ends_at: "2026-12-31T23:59:59Z",
    maxTotalUses: 100,
    totalUsed: 0,
    status: "active",
    is_active: true,
  });
  saveStaffCoupon({
    id: "chk-test-vedic",
    code: "CHKVEDIC300",
    description: "Flat ₹300",
    discountType: "flat",
    discountValue: 30000,
    appliesTo: "all",
    applies_all: true,
    selectedCourseIds: [],
    usageLimitPerUser: "once",
    validityType: "date_range",
    validFrom: "2026-10-01",
    validUntil: "2026-12-31",
    starts_at: "2026-10-01T00:00:00Z",
    ends_at: "2026-12-31T23:59:59Z",
    maxTotalUses: 100,
    totalUsed: 0,
    status: "active",
    is_active: true,
  });
  saveStaffCoupon({
    id: "chk-test-disabled",
    code: "CHKDISABLED10",
    description: "Disabled coupon",
    discountType: "percentage",
    discountValue: 10,
    appliesTo: "all",
    applies_all: true,
    status: "disabled",
    is_active: false,
  });
  saveStaffCoupon({
    id: "chk-test-festive",
    code: "CHKFESTIVE25",
    description: "Future coupon",
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
  saveStaffCoupon({
    id: "chk-test-summer",
    code: "CHKSUMMER99",
    description: "Expired coupon",
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
  saveStaffCoupon({
    id: "chk-test-police",
    code: "CHKPOLICE",
    description: "Course restricted",
    discountType: "flat",
    discountValue: 50000,
    appliesTo: "selected",
    applies_all: false,
    selectedCourseIds: ["c-mm-04", "c4"],
    usageLimitPerUser: "once",
    status: "active",
    is_active: true,
  });

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

  // 1. SERVER-SIDE validateCoupon
  console.log("--- 1. SERVER-SIDE validateCoupon ---");

  await test("Valid percent coupon applies correctly (CHKWELCOME50 on c-mm-01)", async () => {
    const res = await validateCoupon("CHKWELCOME50", "c-mm-01", "test-user-fresh-01");
    assert(res.success, `Expected success, got: ${res.error}`);
    assert(res.coupon, "Coupon details missing");
    assert(res.coupon.discountType === "percent", "Discount type should be percent");
    assert(res.coupon.discountAmountPaise === 49950, `Expected 49950 discount, got ${res.coupon.discountAmountPaise}`);
  });

  await test("Valid flat coupon applies correctly (CHKVEDIC300 on c-mm-02)", async () => {
    const res = await validateCoupon("CHKVEDIC300", "c-mm-02", "test-user-fresh-02");
    assert(res.success, `Expected success, got: ${res.error}`);
    assert(res.coupon, "Coupon details missing");
    assert(res.coupon.discountType === "flat", "Discount type should be flat");
    assert(res.coupon.discountAmountPaise === 30000, `Expected 30000 discount, got ${res.coupon.discountAmountPaise}`);
  });

  await test("Disabled coupon is rejected (CHKDISABLED10)", async () => {
    const res = await validateCoupon("CHKDISABLED10", "c-mm-01", "test-user-fresh-03");
    assert(!res.success, "Disabled coupon should not succeed");
    assert(
      res.error?.toLowerCase().includes("inactive") || res.error?.includes("तात्पुरता बंद"),
      `Expected inactive error, got: ${res.error}`
    );
  });

  await test("Scheduled coupon is rejected (CHKFESTIVE25)", async () => {
    const res = await validateCoupon("CHKFESTIVE25", "c-mm-01", "test-user-fresh-04");
    assert(!res.success, "Scheduled coupon should not succeed");
    assert(
      res.error?.toLowerCase().includes("scheduled") ||
        res.error?.toLowerCase().includes("not started") ||
        res.error?.includes("अद्याप सुरू झालेला नाही"),
      `Expected scheduled error, got: ${res.error}`
    );
  });

  await test("Expired coupon is rejected (CHKSUMMER99)", async () => {
    const res = await validateCoupon("CHKSUMMER99", "c-mm-01", "test-user-fresh-05");
    assert(!res.success, "Expired coupon should not succeed");
    assert(
      res.error?.toLowerCase().includes("expired") || res.error?.includes("मुदत संपलेली"),
      `Expected expired error, got: ${res.error}`
    );
  });

  await test("Course-restricted coupon on wrong course is rejected (CHKPOLICE on c-mm-01)", async () => {
    const res = await validateCoupon("CHKPOLICE", "c-mm-01", "test-user-fresh-06");
    assert(!res.success, "Restricted coupon should not apply to non-eligible course");
    assert(
      res.error?.toLowerCase().includes("not applicable") || res.error?.includes("लागू नाही"),
      `Expected not applicable error, got: ${res.error}`
    );
  });

  await test("Single-use per student rule prevents re-use", async () => {
    const studentId = `student-single-use-${Date.now()}`;
    const first = await validateCoupon("CHKWELCOME50", "c-mm-01", studentId);
    assert(first.success, "First use should succeed");

    recordCouponRedemption(studentId, "chk-test-welcome", "CHKWELCOME50");

    const second = await validateCoupon("CHKWELCOME50", "c-mm-01", studentId);
    assert(!second.success, "Second use of once-per-student coupon should fail");
    assert(
      second.error?.toLowerCase().includes("already used") || second.error?.includes("वापर केला आहे"),
      `Expected already used error, got: ${second.error}`
    );
  });

  // 2. RAZORPAY ORDER CREATION
  console.log("\n--- 2. RAZORPAY ORDER CREATION ---");

  await test("createRazorpayOrder creates order in paise with full course price", async () => {
    const res = await createRazorpayOrder({
      courseId: "c-mm-04",
      studentMobile: "9876543210",
      studentName: "Rahul Shinde",
      userId: "test-user-order-01",
    });
    assert(res.success, `Order creation failed: ${res.error}`);
    assert(res.orderId, "Order ID missing");
    assert(res.amountPaise === 49900, `Expected 49900 paise, got ${res.amountPaise}`);
    assert(res.currency === "INR", "Currency should be INR");
  });

  await test("createRazorpayOrder applies coupon discount to order amount", async () => {
    const res = await createRazorpayOrder({
      courseId: "c-mm-01",
      couponCode: "CHKWELCOME50",
      studentMobile: "9876543210",
      studentName: "Rahul Shinde",
      userId: "test-user-order-02",
    });
    assert(res.success, `Order creation failed: ${res.error}`);
    assert(res.amountPaise === 49950, `Expected 49950 paise with 50% discount, got ${res.amountPaise}`);
  });

  // 3. SIGNATURE VERIFICATION & PURCHASE CREATION
  console.log("\n--- 3. SIGNATURE VERIFICATION & PURCHASE CREATION ---");

  await test("Signature verification: rejects invalid signature", async () => {
    const mockSecret = "test_key_secret_for_qa_verification_12345";
    process.env.RAZORPAY_KEY_SECRET = mockSecret;

    const orderId = "order_real_test_12345";
    const paymentId = "pay_real_test_67890";
    const wrongSignature = "bad_hex_signature_that_does_not_match";

    const res = await verifyRazorpayPayment({
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: wrongSignature,
      courseId: "c-mm-04",
      amountPaise: 49900,
      userId: "test-user-sig-fail",
    });

    assert(!res.success, "Invalid signature should be rejected");
    assert(res.error?.includes("verification failed"), `Expected signature error, got: ${res.error}`);
  });

  await test("Signature verification: accepts valid HMAC SHA-256 signature", async () => {
    const mockSecret = "test_key_secret_for_qa_verification_12345";
    process.env.RAZORPAY_KEY_SECRET = mockSecret;

    const orderId = "order_real_test_valid_01";
    const paymentId = "pay_real_test_valid_01";
    const expectedSig = crypto
      .createHmac("sha256", mockSecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const res = await verifyRazorpayPayment({
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: expectedSig,
      courseId: "c-mm-04",
      amountPaise: 49900,
      userId: "test-user-sig-pass",
    });

    assert(res.success, `Expected verification success, got: ${res.error}`);
    assert(res.purchaseId, "Purchase ID missing");
    assert(res.expiresAt, "expiresAt missing");

    const expDate = new Date(res.expiresAt);
    const now = new Date();
    const diffDays = Math.round((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    assert(diffDays >= 85 && diffDays <= 95, `Expected ~90 days access, got ${diffDays} days`);
  });

  await test("Test-mode mock payment verification passes and sets expires_at", async () => {
    const res = await verifyRazorpayPayment({
      razorpay_order_id: "order_mock_test_123",
      razorpay_payment_id: "pay_mock_test_456",
      razorpay_signature: "mock_signature_approved",
      courseId: "c-mm-05",
      amountPaise: 79900,
      userId: "test-student-unlock-tester",
    });

    assert(res.success, `Expected mock verification success, got: ${res.error}`);
    assert(res.expiresAt, "expiresAt missing");
    const expDate = new Date(res.expiresAt);
    assert(expDate > new Date(), "Expiration date must be in the future");
  });

  // 4. RAZORPAY WEBHOOK HANDLER
  console.log("\n--- 4. RAZORPAY WEBHOOK HANDLER ---");

  const webhookSrc = fs.readFileSync("src/app/api/razorpay/webhook/route.ts", "utf-8");

  test("Webhook handler verifies HMAC SHA-256 signature", () => {
    assert(webhookSrc.includes("x-razorpay-signature"), "x-razorpay-signature header check missing");
    assert(webhookSrc.includes("createHmac(\"sha256\""), "createHmac sha256 missing");
    assert(webhookSrc.includes("timingSafeEqual") || webhookSrc.includes("expectedSignature !== signature"), "Signature equality check missing");
  });

  test("Webhook handles payment.captured and order.paid events", () => {
    assert(webhookSrc.includes("payment.captured"), "payment.captured check missing");
    assert(webhookSrc.includes("order.paid"), "order.paid check missing");
  });

  test("Webhook creates purchase record with expires_at = now + accessMonths", () => {
    assert(webhookSrc.includes("accessMonths"), "accessMonths calculation missing");
    assert(webhookSrc.includes("expiresAt.setMonth(expiresAt.getMonth() + accessMonths)"), "expiresAt addition missing");
    assert(webhookSrc.includes(".from(\"purchases\").upsert("), "purchases upsert call missing");
    assert(webhookSrc.includes("expires_at: expiresAt.toISOString()"), "expires_at assignment missing");
  });

  // 5. INSTANT UNLOCK INTEGRATION
  console.log("\n--- 5. INSTANT COURSE UNLOCK CHECK ---");

  const checkoutPageSrc = fs.readFileSync("src/app/checkout/page.tsx", "utf-8");
  const watchPageSrc = fs.readFileSync("src/app/watch/[lessonId]/page.tsx", "utf-8");

  test("Checkout page saves active purchase to localStorage on payment success", () => {
    assert(checkoutPageSrc.includes("mindmaster_active_purchases"), "mindmaster_active_purchases key missing in checkout");
    assert(checkoutPageSrc.includes("activePurchases[course.id] = expiresAt"), "activePurchases mapping missing");
    assert(checkoutPageSrc.includes("activePurchases[course.code] = expiresAt"), "activePurchases course code mapping missing");
  });

  test("/watch page immediately checks active purchase and unlocks course", () => {
    assert(watchPageSrc.includes("mindmaster_active_purchases"), "mindmaster_active_purchases check missing in watch");
    assert(watchPageSrc.includes("hasLocalAccess"), "hasLocalAccess evaluation missing");
    assert(watchPageSrc.includes("setHasAccess(true)"), "setHasAccess(true) missing");
  });

  clearAllStaffCoupons();
  clearAllRedemptions();

  console.log("\n================================================================================");
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} CHECKOUT, COUPON & RAZORPAY CHECKS PASSED!`);
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
