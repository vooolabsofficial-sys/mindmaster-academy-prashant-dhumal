"use server";

import crypto from "crypto";
import Razorpay from "razorpay";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { COURSE_ID_MAP } from "@/lib/mockData";
import { getStaffCoupons, getStaffStudents, saveStaffCoupon, getStaffCourses, getStaffBooks } from "@/lib/staffStore";
import { hasUserRedeemedCoupon, recordCouponRedemption } from "@/lib/couponRedemptionStore";
import { normalizePhone } from "@/lib/phoneUtils";
import { calculateExpiryIST, extendExpiryIST, formatIST } from "@/lib/istTime";
import { checkRateLimit } from "@/lib/rateLimit";

export async function resolveCourse(courseId: string) {
  try {
    const supabase = createAdminClient();
    const { data: dbCourse } = await supabase
      .from("courses")
      .select("*")
      .or(`id.eq.${courseId},code.ilike.${courseId}`)
      .maybeSingle();

    if (dbCourse) {
      return {
        id: dbCourse.id,
        code: dbCourse.code,
        title: dbCourse.title,
        pricePaise: Number(dbCourse.price_paise) || 0,
        originalPricePaise: Number(dbCourse.original_price_paise) || 0,
        accessMonths: dbCourse.access_months || 3,
        dbUuid: dbCourse.id,
      };
    }
  } catch {}

  const staffCourses = getStaffCourses ? getStaffCourses() : [];
  const foundStaff = staffCourses.find(
    (c) => c.id === courseId || c.code.toLowerCase() === courseId.toLowerCase()
  );
  if (foundStaff) {
    return {
      id: foundStaff.id,
      code: foundStaff.code,
      title: foundStaff.title,
      pricePaise: foundStaff.pricePaise,
      originalPricePaise: foundStaff.originalPricePaise,
      accessMonths: foundStaff.accessMonths || 3,
      dbUuid: COURSE_ID_MAP[foundStaff.id] || foundStaff.id,
    };
  }

  return null;
}

export async function resolveBook(bookId: string) {
  try {
    const supabase = createAdminClient();
    const { data: dbBook } = await supabase
      .from("books")
      .select("*")
      .or(`id.eq.${bookId},code.ilike.${bookId}`)
      .maybeSingle();

    if (dbBook) {
      return {
        id: dbBook.id,
        code: dbBook.code || "BOOK",
        title: dbBook.title,
        subtitle: dbBook.subtitle || "",
        pricePaise: Number(dbBook.price_paise) || 0,
        originalPricePaise: Number(dbBook.original_price_paise) || 0,
        accessMonths: dbBook.access_months || 6,
        isFree: dbBook.is_free ?? false,
        dbUuid: dbBook.id,
      };
    }
  } catch {}

  const staffBooks = getStaffBooks ? getStaffBooks() : [];
  const foundStaff = staffBooks.find(
    (b) => b.id === bookId || (b.code && b.code.toLowerCase() === bookId.toLowerCase())
  );
  if (foundStaff) {
    return {
      id: foundStaff.id,
      code: foundStaff.code || "BOOK",
      title: foundStaff.title,
      subtitle: foundStaff.subtitle || "",
      pricePaise: foundStaff.pricePaise || 0,
      originalPricePaise: foundStaff.originalPricePaise || 0,
      accessMonths: foundStaff.accessMonths || 6,
      isFree: foundStaff.isFree ?? false,
      dbUuid: foundStaff.id,
    };
  }

  return null;
}

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

export interface AvailableCouponChip {
  id: string;
  code: string;
  description: string;
  discountType: "flat" | "percent";
  discountValue: number;
  badgeText: string;
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
  bookId?: string;
  expiresAt?: string;
  error?: string;
}

/**
 * Server Action: validateCoupon
 * Enforces:
 * 1. active (is_active !== false and status !== 'disabled')
 * 2. within starts_at & ends_at
 * 3. applies_all or item in coupon_courses / coupon_books
 * 4. total limit left (used_count < usage_limit)
 * 5. per-user once check via coupon_redemptions
 * 6. student-specific assigned_phone validation
 */
export async function validateCoupon(
  code: string,
  itemId: string,
  userId?: string,
  studentSchool?: string,
  itemType: "course" | "book" = "course",
  studentMobile?: string
): Promise<CouponValidationResult> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) {
    return { success: false, error: "Please enter a coupon code." };
  }

  // Rate limit: 10 attempts per minute per student
  const rateTarget = userId || studentMobile || "anon";
  const rate = checkRateLimit(`coupon_validate:${rateTarget}`, 10, 60000);
  if (!rate.success) {
    return {
      success: false,
      error: `Too many coupon attempts. Please wait ${rate.resetInSec} seconds before trying again.`,
    };
  }

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
    studentUserId = "22222222-2222-2222-2222-222222222201";
  }

  const isBook = itemType === "book";
  const item = isBook ? await resolveBook(itemId) : await resolveCourse(itemId);
  if (!item) {
    return {
      success: false,
      error: isBook ? "Selected digital book not found." : "Selected course not found.",
    };
  }
  const dbItemUuid = item.dbUuid;
  const itemPricePaise = item.pricePaise;
  const now = new Date();

  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("dummy.supabase.co");

  const resolveStudentSchool = async (): Promise<string> => {
    if (studentSchool !== undefined) {
      return studentSchool.trim();
    }
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
    const students = getStaffStudents ? getStaffStudents() : [];
    const cleanPhone = normalizePhone(studentUserId);
    const match = students.find(
      (s) =>
        s.id === studentUserId ||
        (cleanPhone && normalizePhone(s.phone) === cleanPhone)
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
        // Check 1: status & is_active
        const isStatusActive = !coupon.status || coupon.status === "active";
        if (
          !isStatusActive ||
          coupon.is_active === false ||
          coupon.status === "disabled" ||
          coupon.status === "paused" ||
          coupon.status === "expired"
        ) {
          return { success: false, error: "This coupon code is currently inactive or paused." };
        }

        // Check 2: Validity window
        const validFrom = coupon.starts_at || coupon.valid_from || coupon.validFrom;
        const validUntil = coupon.ends_at || coupon.valid_until || coupon.validUntil;
        if (validFrom && new Date(validFrom) > now) {
          return { success: false, error: "This coupon is scheduled and has not started yet." };
        }
        if (validUntil && new Date(validUntil) < now) {
          return { success: false, error: "This coupon code has expired." };
        }

        // Check 3: Minimum Order Value Check
        const minOrderPaise = coupon.min_order_value_paise || coupon.minOrderValuePaise || 0;
        if (minOrderPaise > 0 && itemPricePaise < minOrderPaise) {
          return {
            success: false,
            error: `This coupon code is valid only on orders of at least ₹${Math.round(minOrderPaise / 100)}.`,
          };
        }

        // Check 4: Usage limit
        const usageLimit = coupon.usage_limit || coupon.max_total_uses || coupon.maxTotalUses;
        const usedCount = coupon.used_count || coupon.total_used || coupon.totalUsed || 0;
        if (usageLimit && usedCount >= usageLimit) {
          return { success: false, error: "This coupon has reached its maximum usage limit." };
        }

        // Check 5: School restriction
        const requiredSchool = (coupon.school || "").trim();
        if (requiredSchool) {
          const currentStudentSchool = await resolveStudentSchool();
          if (currentStudentSchool.toLowerCase() !== requiredSchool.toLowerCase()) {
            return {
              success: false,
              error: `This coupon is valid only for students of ${requiredSchool}.`,
            };
          }
        }

        // Check 5b: Student-Specific Assigned Phone
        const assignedPhone = (coupon.assigned_phone || coupon.assignedPhone || "").trim();
        if (assignedPhone) {
          const normAssigned = normalizePhone(assignedPhone);
          const normStudent = normalizePhone(studentMobile || "");
          if (!normStudent || normAssigned !== normStudent) {
            return {
              success: false,
              error: `This coupon code is valid only for student mobile ending in ...${normAssigned.slice(-4)}.`,
            };
          }
        }

        // Check 6: applies_all or Course/Book mapping
        const appliesAll =
          coupon.applies_all !== false && coupon.applies_all !== null
            ? coupon.applies_all
            : coupon.appliesTo === "all";

        if (!appliesAll) {
          let isApplicable = false;
          if (isBook) {
            const { data: bookMappings } = await supabase
              .from("coupon_books")
              .select("book_id")
              .eq("coupon_id", coupon.id);

            if (bookMappings && bookMappings.length > 0) {
              isApplicable = bookMappings.some(
                (m) => m.book_id === dbItemUuid || m.book_id === item.id || m.book_id === item.code
              );
            } else if (coupon.selected_book_ids || coupon.selectedBookIds) {
              const ids = coupon.selected_book_ids || coupon.selectedBookIds || [];
              isApplicable = ids.some(
                (bid: string) => bid === item.id || bid === item.code || item.id.includes(bid)
              );
            }
          } else {
            const { data: courseMappings } = await supabase
              .from("coupon_courses")
              .select("course_id")
              .eq("coupon_id", coupon.id);

            if (courseMappings && courseMappings.length > 0) {
              isApplicable = courseMappings.some(
                (m) => m.course_id === dbItemUuid || m.course_id === item.id || m.course_id === item.code
              );
            } else if (coupon.selected_course_ids || coupon.selectedCourseIds) {
              const ids = coupon.selected_course_ids || coupon.selectedCourseIds || [];
              isApplicable = ids.some(
                (cid: string) => cid === item.id || cid === item.code || item.id.includes(cid)
              );
            }
          }

          if (!isApplicable) {
            return {
              success: false,
              error: isBook
                ? "This coupon code is not applicable to the selected book."
                : "This coupon code is not applicable to the selected course.",
            };
          }
        }

        // Check 7: Per-user once check
        const perUserRule =
          coupon.per_user_usage || coupon.usage_limit_per_user || coupon.usageLimitPerUser || "once";

        if (perUserRule === "once") {
          let alreadyUsed = false;
          const { data: existingRedemption } = await supabase
            .from("coupon_redemptions")
            .select("id")
            .eq("coupon_id", coupon.id)
            .eq("user_id", studentUserId)
            .maybeSingle();

          if (existingRedemption) alreadyUsed = true;

          const cleanMobile = normalizePhone(studentMobile || "");
          if (!alreadyUsed && cleanMobile) {
            const { data: phoneRedemption } = await supabase
              .from("coupon_redemptions")
              .select("id")
              .eq("coupon_id", coupon.id)
              .eq("student_mobile", cleanMobile)
              .maybeSingle();
            if (phoneRedemption) alreadyUsed = true;
          }

          if (
            alreadyUsed ||
            hasUserRedeemedCoupon(studentUserId, coupon.id) ||
            hasUserRedeemedCoupon(studentUserId, coupon.code) ||
            (cleanMobile && (hasUserRedeemedCoupon(cleanMobile, coupon.id) || hasUserRedeemedCoupon(cleanMobile, coupon.code)))
          ) {
            return {
              success: false,
              error: "You have already used this coupon once. Limit: 1 use per student.",
            };
          }
        }

        // Calculate discount
        const isPercent =
          coupon.discount_type === "percent" || coupon.discount_type === "percentage";
        let discountAmountPaise = 0;
        if (isPercent) {
          discountAmountPaise = Math.round((itemPricePaise * coupon.value) / 100);
        } else {
          discountAmountPaise = coupon.value < 1000 ? coupon.value * 100 : coupon.value;
        }

        discountAmountPaise = Math.min(itemPricePaise, discountAmountPaise);

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

  // Fallback: Admin-Created Store / In-Memory Coupon Validation
  const storeCoupons = getStaffCoupons ? getStaffCoupons() : [];
  const mockCoupon = storeCoupons.find((c) => c.code.toUpperCase() === cleanCode);

  if (mockCoupon) {
    if (mockCoupon.status === "disabled" || mockCoupon.status === "paused" || mockCoupon.is_active === false) {
      return { success: false, error: "This coupon code is currently Paused or inactive." };
    }

    if (mockCoupon.status === "scheduled" || (mockCoupon.starts_at && new Date(mockCoupon.starts_at) > now) || (mockCoupon.validFrom && new Date(mockCoupon.validFrom) > now)) {
      return { success: false, error: "This coupon code has not started yet (scheduled)." };
    }
    if (mockCoupon.status === "expired" || (mockCoupon.ends_at && new Date(mockCoupon.ends_at) < now) || (mockCoupon.validUntil && new Date(mockCoupon.validUntil) < now)) {
      return { success: false, error: "This coupon code has expired." };
    }

    if (mockCoupon.minOrderValuePaise && itemPricePaise < mockCoupon.minOrderValuePaise) {
      return {
        success: false,
        error: `This coupon code is valid only on orders of at least ₹${Math.round(mockCoupon.minOrderValuePaise / 100)}.`,
      };
    }

    const maxUses = mockCoupon.maxTotalUses || mockCoupon.usage_limit || 500;
    const totalUsed = mockCoupon.totalUsed || mockCoupon.used_count || 0;
    if (totalUsed >= maxUses) {
      return { success: false, error: "This coupon code usage limit (quota) has been reached." };
    }

    const mockSchool = (mockCoupon.school || "").trim();
    if (mockSchool) {
      const currentStudentSchool = await resolveStudentSchool();
      if (currentStudentSchool.toLowerCase() !== mockSchool.toLowerCase()) {
        return {
          success: false,
          error: `This coupon is valid only for students of ${mockSchool}.`,
        };
      }
    }

    const mockAssignedPhone = (mockCoupon.assigned_phone || (mockCoupon as any).assignedPhone || "").trim();
    if (mockAssignedPhone) {
      const normAssigned = normalizePhone(mockAssignedPhone);
      const normStudent = normalizePhone(studentMobile || "");
      if (!normStudent || normAssigned !== normStudent) {
        return {
          success: false,
          error: `This coupon code is valid only for student mobile ending in ...${normAssigned.slice(-4)}.`,
        };
      }
    }

    const appliesAll =
      mockCoupon.applies_all !== false &&
      (mockCoupon.appliesTo === "all" ||
        (!mockCoupon.selectedCourseIds?.length && !mockCoupon.selectedBookIds?.length));

    if (!appliesAll) {
      if (isBook) {
        const selectedBookIds = mockCoupon.selectedBookIds || [];
        const matchesBook = selectedBookIds.some((id) =>
          id === item.id || id === item.code || item.id.includes(id)
        );
        if (!matchesBook) {
          return {
            success: false,
            error: "This coupon code is not applicable to the selected book.",
          };
        }
      } else {
        const selectedIds = mockCoupon.selectedCourseIds || [];
        const matchesCourse = selectedIds.some((id) =>
          id === item.id || id === item.code || item.id.includes(id)
        );
        if (!matchesCourse) {
          return {
            success: false,
            error: "This coupon code is not applicable to the selected course.",
          };
        }
      }
    }

    const perUser = mockCoupon.per_user_usage || mockCoupon.usageLimitPerUser || "once";
    if (perUser === "once") {
      const cleanMobile = normalizePhone(studentMobile || "");
      if (
        hasUserRedeemedCoupon(studentUserId, mockCoupon.id) ||
        hasUserRedeemedCoupon(studentUserId, mockCoupon.code) ||
        (cleanMobile && (hasUserRedeemedCoupon(cleanMobile, mockCoupon.id) || hasUserRedeemedCoupon(cleanMobile, mockCoupon.code)))
      ) {
        return {
          success: false,
          error: "You have already used this coupon once. Limit: 1 use per student.",
        };
      }
    }

    const isPercent =
      mockCoupon.discountType === "percentage" || mockCoupon.discountType === "percent";
    let discountPaise = 0;
    if (isPercent) {
      discountPaise = Math.round((itemPricePaise * mockCoupon.discountValue) / 100);
    } else {
      discountPaise =
        mockCoupon.discountValue < 1000
          ? mockCoupon.discountValue * 100
          : mockCoupon.discountValue;
    }
    discountPaise = Math.min(itemPricePaise, discountPaise);

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
 * Server Action: getAvailableCoupons
 * Returns active, public coupons that can be applied to the current course/book
 */
export async function getAvailableCoupons(params: {
  itemId: string;
  itemType?: "course" | "book";
  studentMobile?: string;
  studentSchool?: string;
}): Promise<AvailableCouponChip[]> {
  const { itemId, itemType = "course", studentMobile, studentSchool } = params;
  const isBook = itemType === "book";
  const now = new Date();
  const cleanPhone = normalizePhone(studentMobile || "");
  const chips: AvailableCouponChip[] = [];
  const seenCodes = new Set<string>();

  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("dummy.supabase.co");

  if (isSupabaseConfigured) {
    try {
      const supabase = createAdminClient();
      const { data: dbCoupons } = await supabase
        .from("coupons")
        .select("*")
        .eq("is_active", true);

      if (dbCoupons && Array.isArray(dbCoupons)) {
        for (const c of dbCoupons) {
          if (c.status === "disabled" || c.status === "paused" || c.status === "expired") continue;
          if (c.is_public_chip === false || c.isPublicChip === false) continue;
          if (c.starts_at && new Date(c.starts_at) > now) continue;
          if (c.ends_at && new Date(c.ends_at) < now) continue;
          if (c.usage_limit && (c.used_count || 0) >= c.usage_limit) continue;

          // Check assigned phone
          if (c.assigned_phone) {
            if (!cleanPhone || normalizePhone(c.assigned_phone) !== cleanPhone) continue;
          }

          // Check school
          if (c.school && studentSchool && c.school.toLowerCase() !== studentSchool.toLowerCase()) {
            continue;
          }

          // Check applicability
          const appliesAll = c.applies_all !== false && c.appliesTo !== "selected";
          if (!appliesAll) {
            let matches = false;
            if (isBook) {
              const { data: bMap } = await supabase
                .from("coupon_books")
                .select("book_id")
                .eq("coupon_id", c.id);
              matches = (bMap || []).some(
                (m) => m.book_id === itemId || (c.selected_book_ids || []).includes(itemId)
              );
            } else {
              const { data: cMap } = await supabase
                .from("coupon_courses")
                .select("course_id")
                .eq("coupon_id", c.id);
              matches = (cMap || []).some(
                (m) => m.course_id === itemId || (c.selected_course_ids || []).includes(itemId)
              );
            }
            if (!matches) continue;
          }

          const isPercent = c.discount_type === "percent" || c.discount_type === "percentage";
          const badgeText = isPercent
            ? `${c.value}% OFF`
            : `₹${c.value < 1000 ? c.value : Math.round(c.value / 100)} OFF`;

          chips.push({
            id: c.id,
            code: c.code.toUpperCase(),
            description: c.description || "Official Academy Offer",
            discountType: isPercent ? "percent" : "flat",
            discountValue: c.value,
            badgeText,
          });
          seenCodes.add(c.code.toUpperCase());
        }
      }
    } catch {}
  }

  // Fallback to staff store coupons
  const staffCoupons = getStaffCoupons ? getStaffCoupons() : [];
  for (const c of staffCoupons) {
    if (seenCodes.has(c.code.toUpperCase())) continue;
    if (c.is_active === false || c.status === "disabled" || c.status === "paused" || c.status === "expired") continue;
    if (c.is_public_chip === false || (c as any).isPublicChip === false) continue;
    if (c.starts_at && new Date(c.starts_at) > now) continue;
    if (c.ends_at && new Date(c.ends_at) < now) continue;
    const maxUses = c.maxTotalUses || c.usage_limit || 500;
    const totalUsed = c.totalUsed || c.used_count || 0;
    if (totalUsed >= maxUses) continue;

    const assigned = c.assigned_phone || (c as any).assignedPhone;
    if (assigned) {
      if (!cleanPhone || normalizePhone(assigned) !== cleanPhone) continue;
    }
    if (c.school && studentSchool && c.school.toLowerCase() !== studentSchool.toLowerCase()) continue;

    const appliesAll = c.applies_all !== false && (c.appliesTo === "all" || (!c.selectedCourseIds?.length && !c.selectedBookIds?.length));
    if (!appliesAll) {
      if (isBook) {
        const matches = (c.selectedBookIds || []).some((b) => b === itemId || itemId.includes(b));
        if (!matches) continue;
      } else {
        const matches = (c.selectedCourseIds || []).some((cid) => cid === itemId || itemId.includes(cid));
        if (!matches) continue;
      }
    }

    const isPercent = c.discountType === "percentage" || c.discountType === "percent";
    const badgeText = isPercent
      ? `${c.discountValue}% OFF`
      : `₹${c.discountValue < 1000 ? c.discountValue : Math.round(c.discountValue / 100)} OFF`;

    chips.push({
      id: c.id,
      code: c.code.toUpperCase(),
      description: c.description || "Special Academy Offer",
      discountType: isPercent ? "percent" : "flat",
      discountValue: c.discountValue,
      badgeText,
    });
    seenCodes.add(c.code.toUpperCase());
  }

  return chips;
}

/**
 * Server Action: createRazorpayOrder
 * Creates Razorpay order server-side in paise for courses and books
 */
export async function createRazorpayOrder({
  courseId,
  bookId,
  itemType = "course",
  couponCode,
  studentMobile,
  studentName,
  userId,
  studentSchool,
}: {
  courseId?: string;
  bookId?: string;
  itemType?: "course" | "book";
  couponCode?: string;
  studentMobile: string;
  studentName: string;
  userId?: string;
  studentSchool?: string;
}): Promise<RazorpayOrderResult> {
  const actualItemType = bookId || itemType === "book" ? "book" : "course";
  const itemId = (actualItemType === "book" ? bookId : courseId) || "";

  let studentUserId = userId;
  if (!studentUserId) {
    try {
      const cookieStore = await cookies();
      studentUserId =
        cookieStore.get("mindmaster_session")?.value ||
        cookieStore.get("sb-access-token")?.value;
    } catch {}
  }

  const item =
    actualItemType === "book"
      ? await resolveBook(itemId)
      : await resolveCourse(itemId);

  if (!item) {
    return {
      success: false,
      error: actualItemType === "book" ? "Selected book not found." : "Selected course not found.",
    };
  }

  const dbItemUuid = item.dbUuid;
  const cleanMobile = normalizePhone(studentMobile);

  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("dummy.supabase.co");

  if (isSupabaseConfigured) {
    try {
      const supabase = createAdminClient();

      if (actualItemType === "book") {
        if (studentUserId) {
          const { data: existingPurchase } = await supabase
            .from("purchases")
            .select("id, expires_at, status")
            .eq("user_id", studentUserId)
            .eq("book_id", dbItemUuid)
            .in("status", ["success", "active"])
            .gt("expires_at", new Date().toISOString())
            .maybeSingle();

          if (existingPurchase) {
            return {
              success: false,
              error: "You already have active access to this book. Visit My Books to read it.",
            };
          }
        }
        if (cleanMobile) {
          const { data: existingGrant } = await supabase
            .from("course_grants")
            .select("id, valid_until, status")
            .eq("student_phone", cleanMobile)
            .eq("book_id", dbItemUuid)
            .eq("status", "active")
            .gt("valid_until", new Date().toISOString())
            .maybeSingle();

          if (existingGrant) {
            return {
              success: false,
              error: "You already have active access to this book via an academy grant.",
            };
          }
        }
      } else {
        if (studentUserId) {
          const { data: existingPurchase } = await supabase
            .from("purchases")
            .select("id, expires_at, status")
            .eq("user_id", studentUserId)
            .in("course_id", [item.id, dbItemUuid])
            .in("status", ["success", "active"])
            .gt("expires_at", new Date().toISOString())
            .maybeSingle();

          if (existingPurchase) {
            return {
              success: false,
              error: "You already have active access to this course. Please visit My Courses to watch your lessons.",
            };
          }
        }
        if (cleanMobile) {
          const { data: existingGrant } = await supabase
            .from("course_grants")
            .select("id, valid_until, status")
            .eq("student_phone", cleanMobile)
            .in("course_id", [item.id, item.code, dbItemUuid])
            .eq("status", "active")
            .gt("valid_until", new Date().toISOString())
            .maybeSingle();

          if (existingGrant) {
            return {
              success: false,
              error: "You already have active access to this course via an academy grant. Visit My Courses to begin learning.",
            };
          }
        }
      }
    } catch (chkErr) {
      console.warn("Pre-payment access check warning:", chkErr);
    }
  }

  let finalPaise = item.pricePaise;

  if (couponCode) {
    const couponValidation = await validateCoupon(
      couponCode,
      itemId,
      studentUserId,
      studentSchool,
      actualItemType,
      studentMobile
    );
    if (couponValidation.success && couponValidation.coupon) {
      finalPaise = Math.max(0, item.pricePaise - couponValidation.coupon.discountAmountPaise);
    }
  }

  // 100% Free / Full Scholarship Enrollment: No payment gateway required
  if (finalPaise <= 0) {
    const freeOrderId = `free_scholarship_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return {
      success: true,
      orderId: freeOrderId,
      amountPaise: 0,
      currency: "INR",
      keyId: "free_enrollment",
      isMock: true,
    };
  }

  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (keyId && keySecret && !keyId.includes("yourKeyId") && !keySecret.includes("yourRazorpayKeySecret")) {
    try {
      const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

      const options = {
        amount: finalPaise,
        currency: "INR",
        receipt: `rcpt_${Date.now()}_${item.code}`,
        notes: {
          itemType: actualItemType,
          courseId: actualItemType === "course" ? item.id : "",
          bookId: actualItemType === "book" ? item.id : "",
          itemCode: item.code,
          studentName,
          studentMobile: cleanMobile,
          couponCode: couponCode || "",
          userId: studentUserId || cleanMobile,
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
  bookId,
  itemType = "course",
  couponCode,
  amountPaise,
  userId,
  studentName,
  studentMobile,
}: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  courseId?: string;
  bookId?: string;
  itemType?: "course" | "book";
  couponCode?: string;
  amountPaise: number;
  userId?: string;
  studentName?: string;
  studentMobile?: string;
}): Promise<PaymentVerificationResult> {
  const actualItemType = bookId || itemType === "book" ? "book" : "course";
  const itemId = (actualItemType === "book" ? bookId : courseId) || "";

  const item =
    actualItemType === "book"
      ? await resolveBook(itemId)
      : await resolveCourse(itemId);

  if (!item) {
    return {
      success: false,
      error: actualItemType === "book" ? "Selected book not found." : "Selected course not found.",
    };
  }

  const accessMonths = item.accessMonths || (actualItemType === "book" ? 6 : 3);
  const dbItemUuid = item.dbUuid;

  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  const isFreeOrder = razorpay_order_id.startsWith("free_") || amountPaise === 0;
  const isMockOrder = razorpay_order_id.startsWith("order_mock_");
  if (!isFreeOrder && !isMockOrder && keySecret && !keySecret.includes("yourRazorpayKeySecret")) {
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

  const expiresAtIso = calculateExpiryIST(new Date(), { months: accessMonths, endOfDay: true });

  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("dummy.supabase.co");

  let finalUserId = userId || "22222222-2222-2222-2222-222222222201";

  const handleCouponFulfillment = async (couponId: string | null) => {
    if (!couponCode) return;
    const cleanCode = couponCode.trim().toUpperCase();
    const discountAmountPaise = Math.max(0, item.pricePaise - amountPaise);

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

    recordCouponRedemption(
      finalUserId,
      couponId || cleanCode,
      cleanCode,
      {
        studentName: studentName || "Student",
        studentMobile: studentMobile || "",
        courseId: actualItemType === "course" ? item.id : undefined,
        courseTitle: actualItemType === "course" ? item.title : undefined,
        bookId: actualItemType === "book" ? item.id : undefined,
        bookTitle: actualItemType === "book" ? item.title : undefined,
        itemType: actualItemType,
        originalPricePaise: item.pricePaise,
        discountPaise: discountAmountPaise,
        paidPaise: amountPaise,
      }
    );
  };

  if (isSupabaseConfigured) {
    try {
      const supabase = createAdminClient();

      const cleanMobile = normalizePhone(studentMobile);
      if (!userId && cleanMobile) {
        try {
          const { data: prof } = await supabase
            .from("profiles")
            .select("id")
            .eq("phone", cleanMobile)
            .maybeSingle();
          if (prof?.id) {
            finalUserId = prof.id;
          } else {
            const { data: newProf } = await supabase
              .from("profiles")
              .insert({
                phone: cleanMobile,
                full_name: studentName?.trim() || `Student ${cleanMobile.slice(-4)}`,
                role: "student",
              })
              .select("id")
              .maybeSingle();
            if (newProf?.id) finalUserId = newProf.id;
          }
        } catch {}
      }
      if (!userId && !finalUserId) {
        try {
          const { data: { users } } = await supabase.auth.admin.listUsers();
          if (users?.[0]?.id) finalUserId = users[0].id;
        } catch {}
      }

      if (razorpay_order_id || razorpay_payment_id) {
        const { data: existingPurchase } = await supabase
          .from("purchases")
          .select("id, expires_at, status")
          .or(`razorpay_order_id.eq.${razorpay_order_id},razorpay_payment_id.eq.${razorpay_payment_id}`)
          .in("status", ["success", "active"])
          .maybeSingle();

        if (existingPurchase) {
          return {
            success: true,
            purchaseId: existingPurchase.id,
            courseId: actualItemType === "course" ? item.id : undefined,
            bookId: actualItemType === "book" ? item.id : undefined,
            expiresAt: existingPurchase.expires_at,
          };
        }
      }

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
              item_type: actualItemType,
              book_id: actualItemType === "book" ? dbItemUuid : null,
              book_title: actualItemType === "book" ? item.title : null,
            });
        }

        await handleCouponFulfillment(couponId);
      }

      // Upsert into purchases
      let finalExpiresAtIso = expiresAtIso;
      try {
        const query = supabase
          .from("purchases")
          .select("id, expires_at, status")
          .eq("user_id", finalUserId)
          .in("status", ["success", "active"]);
        if (actualItemType === "book") {
          query.eq("book_id", dbItemUuid);
        } else {
          query.eq("course_id", dbItemUuid);
        }
        const { data: priorPurchase } = await query.maybeSingle();
        if (priorPurchase?.expires_at) {
          finalExpiresAtIso = extendExpiryIST(priorPurchase.expires_at, { months: accessMonths });
        }
      } catch {}

      const purchasePayload: any = {
        user_id: finalUserId,
        item_type: actualItemType,
        course_id: actualItemType === "course" ? dbItemUuid : null,
        book_id: actualItemType === "book" ? dbItemUuid : null,
        amount_paise: amountPaise,
        coupon_id: couponId,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        status: "success",
        purchased_at: new Date().toISOString(),
        expires_at: finalExpiresAtIso,
      };

      const conflictCol = actualItemType === "book" ? "user_id,book_id" : "user_id,course_id";

      const { data: purchase } = await supabase
        .from("purchases")
        .upsert(purchasePayload, { onConflict: conflictCol })
        .select("id")
        .single();

      return {
        success: true,
        purchaseId: purchase?.id || `purch_${Date.now()}`,
        courseId: actualItemType === "course" ? item.id : undefined,
        bookId: actualItemType === "book" ? item.id : undefined,
        expiresAt: expiresAtIso,
      };
    } catch (err: any) {
      console.warn("DB purchase recording fallback:", err);
    }
  }

  if (couponCode) {
    await handleCouponFulfillment(null);
  }

  return {
    success: true,
    purchaseId: `purch_local_${Date.now()}`,
    courseId: actualItemType === "course" ? item.id : undefined,
    bookId: actualItemType === "book" ? item.id : undefined,
    expiresAt: expiresAtIso,
  };
}
