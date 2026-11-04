"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/phoneUtils";
import { COURSE_ID_MAP } from "@/lib/mockData";
import {
  verifyStudentCourseAccessSchema,
  getStudentActiveEnrollmentsSchema,
  getStudentTransactionHistorySchema,
  verifyStudentBookAccessSchema,
} from "@/lib/validations";

export interface StudentAccessCheckResult {
  hasAccess: boolean;
  expiresAt?: string;
  source?: "free" | "purchase" | "grant";
}

/**
 * Server Action: verifyStudentCourseAccess
 * Runs with server-side Service Role (admin.ts) to verify course enrollment
 * across both purchases (user_id / profiles) and course_grants (10-digit student_phone).
 */
export async function verifyStudentCourseAccess(params: {
  courseId: string;
  userPhone?: string;
  userId?: string;
}): Promise<StudentAccessCheckResult> {
  const parsed = verifyStudentCourseAccessSchema.safeParse(params);
  if (!parsed.success) {
    return { hasAccess: false };
  }

  const { courseId } = params;
  const cleanPhone = normalizePhone(params.userPhone);
  let resolvedUserId = params.userId || "";

  const dbCourseUuid = COURSE_ID_MAP[courseId] || courseId;
  const targetCourseIds = Array.from(new Set([courseId, dbCourseUuid].filter(Boolean)));
  const nowIso = new Date().toISOString();

  try {
    const supabase = createAdminClient();

    // 1. Check if course is free or open
    try {
      const { data: dbCourse } = await supabase
        .from("courses")
        .select("id, is_free, status")
        .in("id", targetCourseIds)
        .maybeSingle();

      if (dbCourse && dbCourse.is_free) {
        return { hasAccess: true, source: "free" };
      }
    } catch {}

    // 2. Resolve profile UUID from clean 10-digit phone if userId is missing
    if (!resolvedUserId && cleanPhone) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("phone", cleanPhone)
          .maybeSingle();
        if (profile?.id) {
          resolvedUserId = profile.id;
        }
      } catch {}
    }

    // 3. Check live Supabase purchases by user_id
    if (resolvedUserId) {
      const { data: purchase } = await supabase
        .from("purchases")
        .select("id, expires_at, status")
        .eq("user_id", resolvedUserId)
        .in("course_id", targetCourseIds)
        .in("status", ["success", "active"])
        .gt("expires_at", nowIso)
        .maybeSingle();

      if (purchase) {
        return {
          hasAccess: true,
          expiresAt: purchase.expires_at,
          source: "purchase",
        };
      }
    }

    // 4. Check live Supabase course_grants by normalized 10-digit phone
    if (cleanPhone) {
      const { data: grant } = await supabase
        .from("course_grants")
        .select("id, valid_until, status")
        .eq("student_phone", cleanPhone)
        .in("course_id", targetCourseIds)
        .eq("status", "active")
        .gt("valid_until", nowIso)
        .maybeSingle();

      if (grant) {
        return {
          hasAccess: true,
          expiresAt: grant.valid_until,
          source: "grant",
        };
      }
    }

    return { hasAccess: false };
  } catch (err: any) {
    console.warn("verifyStudentCourseAccess error:", err?.message);
    return { hasAccess: false };
  }
}

/**
 * Server Action: getStudentActiveEnrollments
 * Fetches all unexpired purchases and active grants for a student,
 * returning a map of courseId -> expiresAt ISO string.
 */
export async function getStudentActiveEnrollments(params: {
  userPhone?: string;
  userId?: string;
}): Promise<Record<string, string>> {
  const parsed = getStudentActiveEnrollmentsSchema.safeParse(params);
  if (!parsed.success) return {};

  const cleanPhone = normalizePhone(params.userPhone);
  let resolvedUserId = params.userId || "";
  const enrollments: Record<string, string> = {};
  const now = new Date();

  try {
    const supabase = createAdminClient();

    // 1. Resolve student profile user_id from 10-digit phone if needed
    if (!resolvedUserId && cleanPhone) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("phone", cleanPhone)
          .maybeSingle();
        if (profile?.id) resolvedUserId = profile.id;
      } catch {}
    }

    // 2. Query purchases by user_id
    if (resolvedUserId) {
      const { data: purchases } = await supabase
        .from("purchases")
        .select("course_id, expires_at, status")
        .eq("user_id", resolvedUserId)
        .in("status", ["success", "active"]);

      if (purchases) {
        purchases.forEach((p: any) => {
          if (!p.expires_at || new Date(p.expires_at) > now) {
            enrollments[p.course_id] = p.expires_at;
          }
        });
      }
    }

    // 3. Query course_grants by normalized 10-digit phone
    if (cleanPhone) {
      const { data: grants } = await supabase
        .from("course_grants")
        .select("course_id, valid_until, status")
        .eq("student_phone", cleanPhone)
        .eq("status", "active");

      if (grants) {
        grants.forEach((g: any) => {
          if (!g.valid_until || new Date(g.valid_until) > now) {
            enrollments[g.course_id] = g.valid_until;
          }
        });
      }
    }

    return enrollments;
  } catch (err: any) {
    console.warn("getStudentActiveEnrollments error:", err?.message);
    return enrollments;
  }
}

/**
 * Server Action: verifyStudentBookAccess
 * Verifies if a student has access to a book (either free, purchased directly, granted,
 * or purchased/granted via its linked course).
 */
export async function verifyStudentBookAccess(params: {
  bookId: string;
  userPhone?: string;
  userId?: string;
}): Promise<StudentAccessCheckResult> {
  const parsed = verifyStudentBookAccessSchema.safeParse(params);
  if (!parsed.success) {
    return { hasAccess: false };
  }

  const { bookId } = params;
  const cleanPhone = normalizePhone(params.userPhone);
  let resolvedUserId = params.userId || "";
  const nowIso = new Date().toISOString();

  try {
    const supabase = createAdminClient();

    // 1. Fetch book record to check is_free and linked course_id
    let dbBook: any = null;
    try {
      const { data } = await supabase
        .from("books")
        .select("id, is_free, course_id, status")
        .or(`id.eq.${bookId},code.ilike.${bookId}`)
        .maybeSingle();
      if (data) dbBook = data;
    } catch {}

    if (dbBook && dbBook.is_free) {
      return { hasAccess: true, source: "free" };
    }

    // 2. Resolve profile UUID from clean 10-digit phone if userId is missing
    if (!resolvedUserId && cleanPhone) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("phone", cleanPhone)
          .maybeSingle();
        if (profile?.id) resolvedUserId = profile.id;
      } catch {}
    }

    const bookUuid = dbBook?.id || bookId;
    const linkedCourseId = dbBook?.course_id;

    // 3. Check direct book purchases by user_id
    if (resolvedUserId) {
      const { data: bookPurchase } = await supabase
        .from("purchases")
        .select("id, expires_at, status")
        .eq("user_id", resolvedUserId)
        .eq("book_id", bookUuid)
        .in("status", ["success", "active"])
        .gt("expires_at", nowIso)
        .maybeSingle();

      if (bookPurchase) {
        return {
          hasAccess: true,
          expiresAt: bookPurchase.expires_at,
          source: "purchase",
        };
      }

      // If linked to a course, check if student bought that course
      if (linkedCourseId) {
        const { data: coursePurchase } = await supabase
          .from("purchases")
          .select("id, expires_at, status")
          .eq("user_id", resolvedUserId)
          .eq("course_id", linkedCourseId)
          .in("status", ["success", "active"])
          .gt("expires_at", nowIso)
          .maybeSingle();

        if (coursePurchase) {
          return {
            hasAccess: true,
            expiresAt: coursePurchase.expires_at,
            source: "purchase",
          };
        }
      }
    }

    // 4. Check grants by normalized phone
    if (cleanPhone) {
      const { data: bookGrant } = await supabase
        .from("course_grants")
        .select("id, valid_until, status")
        .eq("student_phone", cleanPhone)
        .eq("book_id", bookUuid)
        .eq("status", "active")
        .gt("valid_until", nowIso)
        .maybeSingle();

      if (bookGrant) {
        return {
          hasAccess: true,
          expiresAt: bookGrant.valid_until,
          source: "grant",
        };
      }

      if (linkedCourseId) {
        const { data: courseGrant } = await supabase
          .from("course_grants")
          .select("id, valid_until, status")
          .eq("student_phone", cleanPhone)
          .eq("course_id", linkedCourseId)
          .eq("status", "active")
          .gt("valid_until", nowIso)
          .maybeSingle();

        if (courseGrant) {
          return {
            hasAccess: true,
            expiresAt: courseGrant.valid_until,
            source: "grant",
          };
        }
      }
    }
  } catch (err: any) {
    console.warn("verifyStudentBookAccess error:", err?.message);
  }

  return { hasAccess: false };
}

export interface StudentTransactionItem {
  id: string;
  receiptNo: string;
  title: string;
  courseCode: string;
  itemType: "course" | "book";
  date: string;
  amountPaise: number;
  paymentMode: "online" | "cash" | "upi" | "scholarship" | "free";
  paymentId: string;
  orderId?: string;
  status: "success" | "active" | "installment" | "pending";
  expiresAt: string;
  installmentDue?: number;
  installmentDueDate?: string;
  receiptText?: string;
}

/**
 * Server Action: getStudentTransactionHistory
 * Fetches unified payment transaction history, orders, and fee receipts for a student
 * across both Supabase purchases table and course_grants table.
 */
export async function getStudentTransactionHistory(params: {
  userPhone?: string;
  userId?: string;
}): Promise<StudentTransactionItem[]> {
  const parsed = getStudentTransactionHistorySchema.safeParse(params);
  if (!parsed.success) return [];

  const cleanPhone = normalizePhone(params.userPhone);
  let resolvedUserId = params.userId || "";
  const transactions: StudentTransactionItem[] = [];

  try {
    const supabase = createAdminClient();

    // 1. Resolve student profile user_id from phone if missing
    if (!resolvedUserId && cleanPhone) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("phone", cleanPhone)
          .maybeSingle();
        if (profile?.id) {
          resolvedUserId = profile.id;
        }
      } catch {}
    }

    // 2. Fetch purchases from Supabase
    if (resolvedUserId) {
      try {
        const { data: purchases } = await supabase
          .from("purchases")
          .select("*, courses(title, code), books(title, code)")
          .eq("user_id", resolvedUserId)
          .order("purchased_at", { ascending: false });

        if (purchases && purchases.length > 0) {
          purchases.forEach((p: any) => {
            const courseCode = p.courses?.code || p.books?.code || "MM";
            const title = p.courses?.title || p.books?.title || (p.item_type === "book" ? "MindMaster E-Book" : "MindMaster Masterclass");
            const payId = p.razorpay_payment_id || `PAY-${p.id.slice(-8)}`;
            const receiptNo = `REC-${courseCode}-${payId.slice(-6).toUpperCase()}`;

            transactions.push({
              id: p.id,
              receiptNo,
              title,
              courseCode,
              itemType: p.item_type || "course",
              date: p.purchased_at || p.created_at || new Date().toISOString(),
              amountPaise: Number(p.amount_paise) || 0,
              paymentMode: "online",
              paymentId: payId,
              orderId: p.razorpay_order_id,
              status: p.status === "active" || p.status === "success" ? "success" : "pending",
              expiresAt: p.expires_at || new Date().toISOString(),
            });
          });
        }
      } catch (err: any) {
        console.warn("Error querying purchases:", err?.message);
      }
    }

    // 3. Fetch course grants from Supabase
    if (cleanPhone) {
      try {
        const { data: grants } = await supabase
          .from("course_grants")
          .select("*")
          .eq("student_phone", cleanPhone)
          .order("granted_at", { ascending: false });

        if (grants && grants.length > 0) {
          grants.forEach((g: any) => {
            const courseCode = g.course_code || "MM";
            const title = g.course_title || "Academic Grant Program";
            const payId = g.payment_id || `GRNT-${g.id.slice(-8)}`;
            const receiptNo = `REC-GRNT-${courseCode}-${g.id.slice(-6).toUpperCase()}`;
            const isInstallment = g.installment_due && Number(g.installment_due) > 0;

            transactions.push({
              id: g.id,
              receiptNo,
              title,
              courseCode,
              itemType: g.item_type || "course",
              date: g.granted_at || g.created_at || new Date().toISOString(),
              amountPaise: (Number(g.amount_paid) || 0) * 100,
              paymentMode: g.payment_mode || "cash",
              paymentId: payId,
              status: isInstallment ? "installment" : "active",
              expiresAt: g.valid_until || g.expires_at || new Date().toISOString(),
              installmentDue: Number(g.installment_due) || 0,
              installmentDueDate: g.installment_due_date,
              receiptText: g.receipt_text,
            });
          });
        }
      } catch (err: any) {
        console.warn("Error querying course_grants:", err?.message);
      }
    }
  } catch (err: any) {
    console.warn("getStudentTransactionHistory error:", err?.message);
  }

  // Sort unified transactions by date descending
  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}


