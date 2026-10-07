// Server-side & Test in-memory store for coupon redemptions

export interface CouponRedemptionRecord {
  id: string;
  userId: string;
  couponId: string;
  couponCode: string;
  at: string;
}

declare global {
  // eslint-disable-next-line no-var
  var _mma_server_coupon_redemptions: CouponRedemptionRecord[] | undefined;
}

if (!globalThis._mma_server_coupon_redemptions) {
  // Seed Persona 4 and std-coupon-used previous usage of single-use coupons
  globalThis._mma_server_coupon_redemptions = [
    {
      id: "red-seed-1",
      userId: "22222222-2222-2222-2222-222222222204", // Persona 4 (Coupon-Used Student)
      couponId: "seed-prashant50",
      couponCode: "PRASHANT50",
      at: "2026-08-20T10:00:00Z",
    },
    {
      id: "red-seed-2",
      userId: "std-coupon-used", // Pre-seeded coupon-used test student
      couponId: "cpn-1",
      couponCode: "WELCOME50",
      at: "2026-08-20T14:30:00Z",
    },
    {
      id: "red-seed-3",
      userId: "std-coupon-used",
      couponId: "seed-prashant50",
      couponCode: "PRASHANT50",
      at: "2026-08-22T11:00:00Z",
    },
  ];
}

export function hasUserRedeemedCoupon(userId: string, couponIdentifier: string): boolean {
  if (!userId || !couponIdentifier) return false;
  const list = globalThis._mma_server_coupon_redemptions || [];
  const cleanId = couponIdentifier.toLowerCase();
  return list.some(
    (r) =>
      r.userId === userId &&
      (r.couponId.toLowerCase() === cleanId || r.couponCode.toLowerCase() === cleanId)
  );
}

export function recordCouponRedemption(userId: string, couponId: string, couponCode: string): CouponRedemptionRecord {
  const record: CouponRedemptionRecord = {
    id: `red-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    couponId,
    couponCode: couponCode.toUpperCase(),
    at: new Date().toISOString(),
  };

  if (!globalThis._mma_server_coupon_redemptions) {
    globalThis._mma_server_coupon_redemptions = [];
  }
  globalThis._mma_server_coupon_redemptions.push(record);
  return record;
}

export function getRedemptions(): CouponRedemptionRecord[] {
  return globalThis._mma_server_coupon_redemptions || [];
}
