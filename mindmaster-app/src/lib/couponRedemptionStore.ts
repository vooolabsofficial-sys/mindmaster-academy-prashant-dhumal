// Server-side & Client storage for rich coupon redemptions
import { CouponRedemptionRecord } from "./types";

export type { CouponRedemptionRecord };

declare global {
  // eslint-disable-next-line no-var
  var _mma_server_coupon_redemptions: CouponRedemptionRecord[] | undefined;
}

// Clean slate for production: no mock redemptions
const SEED_REDEMPTIONS: CouponRedemptionRecord[] = [];

if (!globalThis._mma_server_coupon_redemptions) {
  globalThis._mma_server_coupon_redemptions = [];
}

export function hasUserRedeemedCoupon(userId: string, couponIdentifier: string): boolean {
  if (!userId || !couponIdentifier) return false;
  const list = getRedemptions();
  const cleanId = couponIdentifier.trim().toLowerCase();
  return list.some(
    (r) =>
      r.userId === userId &&
      (r.couponId.toLowerCase() === cleanId || r.couponCode.toLowerCase() === cleanId)
  );
}

function getSupabase() {
  try {
    if (typeof window === "undefined") {
      const { createAdminClient } = require("./supabase/admin");
      return createAdminClient();
    } else {
      const { createClient } = require("./supabase/client");
      return createClient();
    }
  } catch {
    return null;
  }
}

export function recordCouponRedemption(
  userId: string,
  couponId: string,
  couponCode: string,
  details?: {
    studentName?: string;
    studentMobile?: string;
    courseId?: string;
    courseTitle?: string;
    bookId?: string;
    bookTitle?: string;
    itemType?: "course" | "book";
    originalPricePaise?: number;
    discountPaise?: number;
    paidPaise?: number;
  }
): CouponRedemptionRecord {
  const record: CouponRedemptionRecord = {
    id: `red-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    couponId,
    couponCode: couponCode.toUpperCase(),
    studentName: details?.studentName,
    studentMobile: details?.studentMobile,
    courseId: details?.courseId,
    courseTitle: details?.courseTitle,
    bookId: details?.bookId,
    bookTitle: details?.bookTitle,
    itemType: details?.itemType || "course",
    originalPricePaise: details?.originalPricePaise,
    discountPaise: details?.discountPaise,
    paidPaise: details?.paidPaise,
    at: new Date().toISOString(),
  };

  if (!globalThis._mma_server_coupon_redemptions) {
    globalThis._mma_server_coupon_redemptions = [...SEED_REDEMPTIONS];
  }
  globalThis._mma_server_coupon_redemptions.unshift(record);

  // Sync to localStorage if in browser
  if (typeof window !== "undefined") {
    try {
      const stored = getRedemptions();
      const updated = [record, ...stored.filter((r) => r.id !== record.id)];
      localStorage.setItem("mma_coupon_redemptions", JSON.stringify(updated));
    } catch {}
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      supabase.from("coupon_redemptions").insert({
        coupon_code: couponCode.toUpperCase(),
        user_id: userId && userId.includes("-") && userId.length === 36 ? userId : undefined,
        student_name: details?.studentName || null,
        student_mobile: details?.studentMobile || null,
        course_id: details?.courseId || null,
        course_title: details?.courseTitle || null,
        item_type: details?.itemType || "course",
        book_id: details?.bookId || null,
        book_title: details?.bookTitle || null,
        original_price_paise: details?.originalPricePaise || null,
        discount_paise: details?.discountPaise || null,
        paid_paise: details?.paidPaise || null,
      }).then(({ error }: any) => {
        if (error) console.warn("Supabase coupon_redemptions insert error:", error.message);
      });
    } catch {}
  }

  return record;
}

export async function fetchDbRedemptions(): Promise<CouponRedemptionRecord[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return getRedemptions();
    const { data, error } = await supabase
      .from("coupon_redemptions")
      .select("*")
      .order("redeemed_at", { ascending: false });

    if (error || !data) return getRedemptions();

    const mapped: CouponRedemptionRecord[] = data.map((d: any) => ({
      id: d.id,
      userId: d.user_id || "",
      couponId: d.coupon_id || d.coupon_code,
      couponCode: d.coupon_code,
      studentName: d.student_name || undefined,
      studentMobile: d.student_mobile || undefined,
      courseId: d.course_id || undefined,
      courseTitle: d.course_title || undefined,
      itemType: d.item_type || "course",
      bookId: d.book_id || undefined,
      bookTitle: d.book_title || undefined,
      originalPricePaise: Number(d.original_price_paise) || undefined,
      discountPaise: Number(d.discount_paise) || undefined,
      paidPaise: Number(d.paid_paise) || undefined,
      at: d.redeemed_at || d.at || new Date().toISOString(),
    }));

    if (typeof window !== "undefined") {
      localStorage.setItem("mma_coupon_redemptions", JSON.stringify(mapped));
    }
    globalThis._mma_server_coupon_redemptions = mapped;
    return mapped;
  } catch {
    return getRedemptions();
  }
}

export function getRedemptions(): CouponRedemptionRecord[] {
  if (typeof window !== "undefined") {
    try {
      if (localStorage.getItem("mma_mock_coupons_purged_v3") !== "true") {
        localStorage.removeItem("mma_coupon_redemptions");
      }
      const raw = localStorage.getItem("mma_coupon_redemptions");
      if (raw) return JSON.parse(raw);
    } catch {}
  }
  return globalThis._mma_server_coupon_redemptions || SEED_REDEMPTIONS;
}

export function clearAllRedemptions(): void {
  globalThis._mma_server_coupon_redemptions = [];
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("mma_coupon_redemptions");
    } catch {}
  }
}

export function getRedemptionsByCoupon(couponIdOrCode: string): CouponRedemptionRecord[] {
  const all = getRedemptions();
  const target = couponIdOrCode.trim().toLowerCase();
  return all.filter(
    (r) => r.couponId.toLowerCase() === target || r.couponCode.toLowerCase() === target
  );
}
