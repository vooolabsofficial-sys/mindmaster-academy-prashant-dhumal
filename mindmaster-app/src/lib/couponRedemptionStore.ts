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

export function recordCouponRedemption(
  userId: string,
  couponId: string,
  couponCode: string,
  details?: {
    studentName?: string;
    studentMobile?: string;
    courseId?: string;
    courseTitle?: string;
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

  return record;
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
