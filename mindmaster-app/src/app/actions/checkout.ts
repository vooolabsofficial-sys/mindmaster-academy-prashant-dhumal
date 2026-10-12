"use server";

import crypto from "crypto";
import Razorpay from "razorpay";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { MOCK_COURSES, COURSE_ID_MAP } from "@/lib/mockData";
import { INITIAL_COUPONS, INITIAL_STUDENTS } from "@/lib/mockStaffData";
import { getStaffCoupons, getStaffStudents, saveStaffCoupon } from "@/lib/staffStore";
import { hasUserRedeemedCoupon, recordCouponRedemption } from "@/lib/couponRedemptionStore";

export interface CouponValidationResult {
  success: boolean;
  coupon?: {
    id: string;
    code: string;
    discountType: "flat" | "percent";
    value: number; // Flat paise or percentage (e.g. 20 for 20%)
    discountAmountPaise: number;
  };
  message?: string;
  error?: string;
}

export interface RazorpayOrderResult {
  success: boolean;
  orderId?: string;
  amountPaise?: number;
  currency?: string;
  keyId?: string;
  isMock?: boolean;
  error?: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  purchaseId?: string;
  courseId?: string;
  expiresAt?: string;
  error?: string;
}

/**
 * Server Action: validateCoupon
 * Enforces:
 * 1. active (is_active !== false and status !== 'disabled')
 * 2. within starts_at & ends_at
 * 3. applies_all or course in coupon_courses / selectedCourseIds
 * 4. total limit left (used_count < usage_limit)
 * 5. per-user once check via coupon_redemptions
 */
export async function validateCoupon(
  code: string,
  courseId: string,
  userId?: string,
  studentSchool?: string
): Promise<CouponValidationResult> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) {
    return { success: false, error: "Please enter a coupon code." };
  }

  // 1. Resolve student user ID (either passed, from cookie, or QA Persona fallback)
  let studentUserId = userId;
  if (!studentUserId) {
    try {
      const cookieStore = await cookies();
      studentUserId =
        cookieStore.get("mindmaster_session")?.value ||
        cookieStore.get("sb-access-token")?.value;
    } catch {}
  }
  if (!studentUserId) {
    studentUserId = "22222222-2222-2222-2222-222222222201"; // Default student
  }

  // Find course details to compute price discount
  const course =
    MOCK_COURSES.find(
      (c) => c.id === courseId || c.code.toLowerCase() === courseId.toLowerCase()
    ) || MOCK_COURSES[0];
  const dbCourseUuid = COURSE_ID_MAP[course.id] || course.id;
  const now = new Date();

  // Try DB first if real Supabase is configured
  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("dummy.supabase.co");

  // Helper to resolve student's school field
  const resolveStudentSchool = async (): Promise<string> => {
    if (studentSchool !== undefined) {
      return studentSchool.trim();
    }
    // Check Supabase profile if configured
    if (isSupabaseConfigured && studentUserId) {
      try {
        const supabase = createAdminClient();
        const { data: profile } = await supabase
          .from("profiles")
          .select("school_name, school")
          .eq("id", studentUserId)
          .maybeSingle();
        if (profile?.school_name || profile?.school) {
          return (profile.school_name || profile.school).trim();
        }
      } catch {}
    }
    // Check StudentRecord in staffStore / INITIAL_STUDENTS
    const students = getStaffStudents ? getStaffStudents() : INITIAL_STUDENTS;
    const digits = (studentUserId || "").replace(/\D/g, "");
    const match = students.find(
      (s) =>
        s.id === studentUserId ||
        s.phone === studentUserId ||
        (digits.length >= 10 && s.phone.replace(/\D/g, "").includes(digits))
    );
    if (match?.school) {
      return match.school.trim();
    }
    return "";
  };

  if (isSupabaseConfigured) {
    try {
      const supabase = createAdminClient();
      const { data: coupon, error } = await supabase
        .from("coupons")
        .select("*")
        .ilike("code", cleanCode)
        .maybeSingle();

    if (!error && coupon) {
      // Check 1: is_active
      if (coupon.is_active === false || coupon.status === "disabled") {
        return { success: false, error: "This coupon code is currently inactive." };
      }

      // Check 2: Validity window (starts_at & ends_at)
      if (coupon.starts_at && new Date(coupon.starts_at) > now) {
        return { success: false, error: "This coupon is scheduled and has not started yet." };
      }
      if (coupon.ends_at && new Date(coupon.ends_at) < now) {
        return { success: false, error: "This coupon code has expired." };
      }

      // Check 3: Usage limit
      const usageLimit = coupon.usage_limit || coupon.max_total_uses || coupon.maxTotalUses;
      const usedCount = coupon.used_count || coupon.total_used || coupon.totalUsed || 0;
      if (usageLimit && usedCount >= usageLimit) {
        return { success: false, error: "This coupon has reached its maximum usage limit." };
      }

      // Check: School restriction
      const requiredSchool = (coupon.school || "").trim();
      if (requiredSchool) {
        const currentStudentSchool = await resolveStudentSchool();
        if (currentStudentSchool.toLowerCase() !== requiredSchool.toLowerCase()) {
          return {
            success: false,
            error: `हा कूपन फक्त ${requiredSchool} च्या विद्यार्थ्यांसाठी आहे.`,
          };
        }
      }

      // Check 4: applies_all or Course mapping via coupon_courses
      const appliesAll =
        coupon.applies_all !== false && coupon.applies_all !== null
          ? coupon.applies_all
          : coupon.appliesTo === "all";

      if (!appliesAll) {
        const { data: courseMappings } = await supabase
          .from("coupon_courses")
          .select("course_id")
          .eq("coupon_id", coupon.id);

        let isApplicable = false;
        if (courseMappings && courseMappings.length > 0) {
          isApplicable = courseMappings.some(
            (m) => m.course_id === dbCourseUuid || m.course_id === course.id
          );
        } else if (coupon.selected_course_ids || coupon.selectedCourseIds) {
          const ids = coupon.selected_course_ids || coupon.selectedCourseIds || [];
          isApplicable = ids.some(
            (cid: string) => cid === course.id || cid === course.code || course.id.includes(cid)
          );
        }

        if (!isApplicable) {
          return {
            success: false,
            error: "This coupon code is not applicable to the selected course.",
          };
        }
      }

      // Check 5: Per-user once check via coupon_redemptions
      const perUserRule =
        coupon.per_user_usage || coupon.usage_limit_per_user || coupon.usageLimitPerUser || "once";

      if (perUserRule === "once") {
        const { data: existingRedemption } = await supabase
          .from("coupon_redemptions")
          .select("id")
          .eq("coupon_id", coupon.id)
          .eq("user_id", studentUserId)
          .maybeSingle();

        if (
          existingRedemption ||
          hasUserRedeemedCoupon(studentUserId, coupon.id) ||
          hasUserRedeemedCoupon(studentUserId, coupon.code)
        ) {
          return {
            success: false,
            error: "You have already used this coupon once. Limit: 1 use per student.",
          };
        }
      }

      // Calculate discount amount in paise
      const isPercent =
        coupon.discount_type === "percent" || coupon.discount_type === "percentage";
      let discountAmountPaise = 0;
      if (isPercent) {
        discountAmountPaise = Math.round((course.pricePaise * coupon.value) / 100);
      } else {
        discountAmountPaise = coupon.value < 1000 ? coupon.value * 100 : coupon.value;
      }

      discountAmountPaise = Math.min(course.pricePaise, discountAmountPaise);

      return {
        success: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          discountType: isPercent ? "percent" : "flat",
          value: coupon.value,
          discountAmountPaise,
        },
        message: isPercent
          ? `Congratulations! ${coupon.value}% discount applied!`
          : `Congratulations! ₹${Math.round(discountAmountPaise / 100)} discount applied!`,
      };
    }
  } catch (err) {
    console.warn("Supabase coupon validation error, using store validation:", err);
  }
}

  // In-Memory / Store Validation (supports WELCOME50, VEDIC300, POLICEBHARTI, FESTIVE25, SUMMER99, PRASHANT50)
  const storeCoupons = getStaffCoupons ? getStaffCoupons() : INITIAL_COUPONS;
  const mockCoupon = storeCoupons.find((c) => c.code.toUpperCase() === cleanCode);

  if (mockCoupon) {
    // 1. Active Check
    if (mockCoupon.status === "disabled" || mockCoupon.status === "paused" || mockCoupon.is_active === false) {
      return { success: false, error: "हा कूपन कोड सध्या तात्पुरता बंद आहे (Inactive / Paused)." };
    }

    // 2. Starts_at & Ends_at / Validity check
    if (mockCoupon.status === "scheduled") {
      return { success: false, error: "हा कूपन कोड अद्याप सुरू झालेला नाही." };
    }
    if (mockCoupon.status === "expired") {
      return { success: false, error: "या कूपन कोडची मुदत संपलेली (Expired) आहे." };
    }
    if (mockCoupon.starts_at && new Date(mockCoupon.starts_at) > now) {
      return { success: false, error: "हा कूपन कोड अद्याप सुरू झालेला नाही." };
    }
    if (mockCoupon.ends_at && new Date(mockCoupon.ends_at) < now) {
      return { success: false, error: "या कूपन कोडची मुदत संपलेली (Expired) आहे." };
    }
    if (mockCoupon.validFrom && new Date(mockCoupon.validFrom) > now) {
      return { success: false, error: "हा कूपन कोड अद्याप सुरू झालेला नाही." };
    }
    if (mockCoupon.validUntil && new Date(mockCoupon.validUntil) < now) {
      return { success: false, error: "या कूपन कोडची मुदत संपलेली (Expired) आहे." };
    }

    // 3. Minimum Order Value Check
    if (mockCoupon.minOrderValuePaise && course.pricePaise < mockCoupon.minOrderValuePaise) {
      return {
        success: false,
        error: `हा कूपन कोड किमान ₹${Math.round(mockCoupon.minOrderValuePaise / 100)} च्या खरेदीवरच लागू आहे.`,
      };
    }

    // 4. Total Limit Left Check (e.g. 100 students)
    const maxUses = mockCoupon.maxTotalUses || mockCoupon.usage_limit || 500;
    const totalUsed = mockCoupon.totalUsed || mockCoupon.used_count || 0;
    if (totalUsed >= maxUses) {
      return { success: false, error: "या कूपन कोडची वापर मर्यादा (Quota) समाप्त झाली आहे." };
    }

    // School restriction check
    const mockSchool = (mockCoupon.school || "").trim();
    if (mockSchool) {
      const currentStudentSchool = await resolveStudentSchool();
      if (currentStudentSchool.toLowerCase() !== mockSchool.toLowerCase()) {
        return {
          success: false,
          error: `हा कूपन फक्त ${mockSchool} च्या विद्यार्थ्यांसाठी आहे.`,
        };
      }
    }

    // 4. Applies_all or course in coupon_courses
    const appliesAll =
      mockCoupon.applies_all !== false &&
      (mockCoupon.appliesTo === "all" ||
        !mockCoupon.selectedCourseIds ||
        mockCoupon.selectedCourseIds.length === 0);

    if (!appliesAll) {
      const selectedIds = mockCoupon.selectedCourseIds || [];
      const matchesCourse = selectedIds.some((id) =>
        id === course.id || id === course.code || course.id.includes(id)
      );
      if (!matchesCourse) {
        return {
          success: false,
          error: "This coupon code is not applicable to the selected course.",
        };
      }
    }

    // 5. Per-User Once Check via coupon_redemptions
    const perUser = mockCoupon.per_user_usage || mockCoupon.usageLimitPerUser || "once";
    if (perUser === "once") {
      if (
        hasUserRedeemedCoupon(studentUserId, mockCoupon.id) ||
        hasUserRedeemedCoupon(studentUserId, mockCoupon.code)
      ) {
        return {
          success: false,
          error: "You have already used this coupon once. Limit: 1 use per student.",
        };
      }
    }

    // Compute discount
    const isPercent =
      mockCoupon.discountType === "percentage" || mockCoupon.discountType === "percent";
    let discountPaise = 0;
    if (isPercent) {
      discountPaise = Math.round((course.pricePaise * mockCoupon.discountValue) / 100);
    } else {
      discountPaise =
        mockCoupon.discountValue < 1000
          ? mockCoupon.discountValue * 100
          : mockCoupon.discountValue;
    }
    discountPaise = Math.min(course.pricePaise, discountPaise);

    return {
      success: true,
      coupon: {
        id: mockCoupon.id,
        code: mockCoupon.code,
        discountType: isPercent ? "percent" : "flat",
        value: mockCoupon.discountValue,
        discountAmountPaise: discountPaise,
      },
      message: isPercent
        ? `Congratulations! ${mockCoupon.discountValue}% discount applied!`
        : `Congratulations! ₹${Math.round(discountPaise / 100)} discount applied!`,
    };
  }

  return {
    success: false,
    error: "Invalid coupon code. Please enter a valid coupon code.",
  };
}

/**
 * Server Action: createRazorpayOrder
 * Creates Razorpay order server-side in paise
 */
export async function createRazorpayOrder({
  courseId,
  couponCode,
  studentMobile,
  studentName,
  userId,
  studentSchool,
}: {
  courseId: string;
  couponCode?: string;
  studentMobile: string;
  studentName: string;
  userId?: string;
  studentSchool?: string;
}): Promise<RazorpayOrderResult> {
  let studentUserId = userId;
  if (!studentUserId) {
    try {
      const cookieStore = await cookies();
      studentUserId =
        cookieStore.get("mindmaster_session")?.value ||
        cookieStore.get("sb-access-token")?.value;
    } catch {}
  }

  const course = MOCK_COURSES.find((c) => c.id === courseId) || MOCK_COURSES[0];
  let finalPaise = course.pricePaise;

  if (couponCode) {
    const couponValidation = await validateCoupon(couponCode, courseId, studentUserId, studentSchool);
    if (couponValidation.success && couponValidation.coupon) {
      finalPaise = Math.max(100, course.pricePaise - couponValidation.coupon.discountAmountPaise);
    }
  }

  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  // Real Razorpay API call if valid credentials provided
  if (keyId && keySecret && !keyId.includes("yourKeyId") && !keySecret.includes("yourRazorpayKeySecret")) {
    try {
      const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

      const options = {
        amount: finalPaise,
        currency: "INR",
        receipt: `rcpt_${Date.now()}_${course.code}`,
        notes: {
          courseId: course.id,
          courseCode: course.code,
          studentName,
          studentMobile,
          couponCode: couponCode || "",
          userId: studentUserId || "22222222-2222-2222-2222-222222222201",
        },
      };

      const order = await razorpay.orders.create(options);

      return {
        success: true,
        orderId: order.id,
        amountPaise: finalPaise,
        currency: "INR",
        keyId,
        isMock: false,
      };
    } catch (err: any) {
      console.error("Razorpay order creation error:", err);
      return {
        success: false,
        error: err.message || "Error creating payment order.",
      };
    }
  }

  // Graceful Mock Order for preview / test environments without live Razorpay keys
  const mockOrderId = `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  return {
    success: true,
    orderId: mockOrderId,
    amountPaise: finalPaise,
    currency: "INR",
    keyId: keyId || "rzp_test_mindmaster_academy",
    isMock: true,
  };
}

/**
 * Server Action: verifyRazorpayPayment
 * Verifies Razorpay payment signature server-side, records purchase, increments coupon used_count
 */
export async function verifyRazorpayPayment({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  courseId,
  couponCode,
  amountPaise,
  userId,
  studentName,
  studentMobile,
}: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  courseId: string;
  couponCode?: string;
  amountPaise: number;
  userId?: string;
  studentName?: string;
  studentMobile?: string;
}): Promise<PaymentVerificationResult> {
  const course = MOCK_COURSES.find((c) => c.id === courseId) || MOCK_COURSES[0];
  const accessMonths = course.accessMonths || 3;
  const dbCourseUuid = COURSE_ID_MAP[course.id] || course.id;

  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  // Signature verification
  const isMockOrder = razorpay_order_id.startsWith("order_mock_");
  if (!isMockOrder && keySecret && !keySecret.includes("yourRazorpayKeySecret")) {
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return {
        success: false,
        error: "Payment signature verification failed (Invalid payment signature).",
      };
    }
  }

  // Calculate expiration date: now + course.access_months
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + accessMonths);
  const expiresAtIso = expiresAt.toISOString();

  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("dummy.supabase.co");

  let finalUserId = userId || "22222222-2222-2222-2222-222222222201";

  // Helper to record coupon redemption and increment counters
  const handleCouponFulfillment = async (couponId: string | null) => {
    if (!couponCode) return;
    const cleanCode = couponCode.trim().toUpperCase();
    const discountAmountPaise = Math.max(0, course.pricePaise - amountPaise);

    // 1. Update staff store coupon counter
    try {
      const staffCoupons = getStaffCoupons();
      const cpn = staffCoupons.find((c) => c.code.toUpperCase() === cleanCode);
      if (cpn) {
        const newUsed = (cpn.used_count || cpn.totalUsed || 0) + 1;
        const isNowFull = newUsed >= (cpn.usage_limit || cpn.maxTotalUses || 500);
        saveStaffCoupon({
          ...cpn,
          totalUsed: newUsed,
          used_count: newUsed,
          status: isNowFull ? "expired" : cpn.status,
        });
      }
    } catch {}

    // 2. Record rich redemption in redemption store
    recordCouponRedemption(
      finalUserId,
      couponId || cleanCode,
      cleanCode,
      {
        studentName: studentName || "Student",
        studentMobile: studentMobile || "",
        courseId: course.id,
        courseTitle: course.title,
        originalPricePaise: course.pricePaise,
        discountPaise: discountAmountPaise,
        paidPaise: amountPaise,
      }
    );
  };

  if (isSupabaseConfigured) {
    try {
      const supabase = createAdminClient();

      // 1. Get user id or default fallback
      if (!userId) {
        try {
          const { data: { users } } = await supabase.auth.admin.listUsers();
          if (users?.[0]?.id) finalUserId = users[0].id;
        } catch {}
      }

      // 2. Fetch coupon ID if applied
      let couponId: string | null = null;
      if (couponCode) {
        const { data: cp } = await supabase
          .from("coupons")
          .select("id, used_count")
          .ilike("code", couponCode.trim())
          .maybeSingle();

        if (cp) {
          couponId = cp.id;
          await supabase
            .from("coupons")
            .update({ used_count: (cp.used_count || 0) + 1 })
            .eq("id", cp.id);

          await supabase
            .from("coupon_redemptions")
            .insert({
              user_id: finalUserId,
              coupon_id: cp.id,
              at: new Date().toISOString(),
            });
        }

        await handleCouponFulfillment(couponId);
      }

      // 3. Upsert into purchases table
      const { data: purchase } = await supabase
        .from("purchases")
        .upsert(
          {
            user_id: finalUserId,
            course_id: dbCourseUuid,
            amount_paise: amountPaise,
            coupon_id: couponId,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            status: "success",
            purchased_at: new Date().toISOString(),
            expires_at: expiresAtIso,
          },
          { onConflict: "user_id,course_id" }
        )
        .select("id")
        .single();

      return {
        success: true,
        purchaseId: purchase?.id || `purch_${Date.now()}`,
        courseId: course.id,
        expiresAt: expiresAtIso,
      };
    } catch (err: any) {
      console.warn("DB purchase recording fallback:", err);
    }
  }

  // Local store redemption fulfillment
  if (couponCode) {
    await handleCouponFulfillment(null);
  }

  return {
    success: true,
    purchaseId: `purch_local_${Date.now()}`,
    courseId: course.id,
    expiresAt: expiresAtIso,
  };
}
