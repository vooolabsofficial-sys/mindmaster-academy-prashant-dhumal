// Server-side & Client storage for rich coupon redemptions
import { CouponRedemptionRecord } from "./types";

export type { CouponRedemptionRecord };

declare global {
  // eslint-disable-next-line no-var
  var _mma_server_coupon_redemptions: CouponRedemptionRecord[] | undefined;
}

const SEED_REDEMPTIONS: CouponRedemptionRecord[] = [
  {
    id: "red-01",
    userId: "std-pune-02",
    couponId: "cpn-5",
    couponCode: "ABHINAVA100",
    studentName: "तन्वी देशपांडे",
    studentMobile: "+91 98221 00001",
    courseId: "c-mm-01",
    courseTitle: "Memory Technique Seminar",
    originalPricePaise: 99900,
    discountPaise: 10000,
    paidPaise: 89900,
    at: "2026-10-08T10:15:00Z",
  },
  {
    id: "red-02",
    userId: "std-active",
    couponId: "cpn-2",
    couponCode: "POLICEBHARTI",
    studentName: "विशाल पाटील",
    studentMobile: "+91 98221 00002",
    courseId: "c-mm-03",
    courseTitle: "Police Bharti 100% Prep",
    originalPricePaise: 129900,
    discountPaise: 50000,
    paidPaise: 79900,
    at: "2026-10-09T14:30:00Z",
  },
  {
    id: "red-03",
    userId: "std-pune-01",
    couponId: "cpn-1",
    couponCode: "WELCOME50",
    studentName: "रोहन कुलकर्णी",
    studentMobile: "+91 98221 11223",
    courseId: "c-mm-01",
    courseTitle: "Memory Technique Seminar",
    originalPricePaise: 99900,
    discountPaise: 49950,
    paidPaise: 49950,
    at: "2026-10-10T11:20:00Z",
  },
  {
    id: "red-04",
    userId: "std-satara-01",
    couponId: "cpn-4",
    couponCode: "PRASHANT50",
    studentName: "गणेश कदम",
    studentMobile: "+91 98811 55667",
    courseId: "c-mm-04",
    courseTitle: "Superfast 500-Yr Calendar",
    originalPricePaise: 49900,
    discountPaise: 20000,
    paidPaise: 29900,
    at: "2026-10-11T09:45:00Z",
  },
  {
    id: "red-05",
    userId: "std-sangli-01",
    couponId: "cpn-3",
    couponCode: "VEDIC300",
    studentName: "कविता माने",
    studentMobile: "+91 98901 22334",
    courseId: "c-mm-05",
    courseTitle: "Vedic Maths Speed System",
    originalPricePaise: 79900,
    discountPaise: 30000,
    paidPaise: 49900,
    at: "2026-10-11T16:00:00Z",
  },
];

if (!globalThis._mma_server_coupon_redemptions) {
  globalThis._mma_server_coupon_redemptions = [...SEED_REDEMPTIONS];
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
      const raw = localStorage.getItem("mma_coupon_redemptions");
      if (raw) return JSON.parse(raw);
    } catch {}
  }
  return globalThis._mma_server_coupon_redemptions || SEED_REDEMPTIONS;
}

export function getRedemptionsByCoupon(couponIdOrCode: string): CouponRedemptionRecord[] {
  const all = getRedemptions();
  const target = couponIdOrCode.trim().toLowerCase();
  return all.filter(
    (r) => r.couponId.toLowerCase() === target || r.couponCode.toLowerCase() === target
  );
}
