import { NextResponse } from "next/server";

/**
 * In-Memory Sliding Window Rate Limiter
 * Provides rate limiting for logins (5/min), coupons (10/min), support messages (5/min),
 * lead submissions (5/min), and certificates (10/min).
 */

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      record.timestamps = record.timestamps.filter((t) => now - t < 300000);
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(key);
      }
    }
  }, 300000);

  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }
}

/**
 * Extract client IP address reliably from request headers
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  return "127.0.0.1";
}

export function checkRateLimit(
  key: string,
  limit: number = 5,
  windowMs: number = 60000
): { success: boolean; remaining: number; resetInSec: number } {
  const now = Date.now();
  let record = rateLimitStore.get(key);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(key, record);
  }

  // Keep only timestamps within window
  record.timestamps = record.timestamps.filter((t) => now - t < windowMs);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const resetInSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return {
      success: false,
      remaining: 0,
      resetInSec,
    };
  }

  record.timestamps.push(now);
  return {
    success: true,
    remaining: limit - record.timestamps.length,
    resetInSec: Math.ceil(windowMs / 1000),
  };
}

/**
 * Standard 429 Too Many Requests response with Retry-After header
 */
export function rateLimitResponse(
  resetInSec: number,
  message?: string,
  corsHeaders?: Record<string, string>
) {
  return NextResponse.json(
    {
      success: false,
      error: message || `Too many attempts. Please wait ${resetInSec} seconds before trying again.`,
      retryAfter: resetInSec,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(resetInSec),
        ...(corsHeaders || {}),
      },
    }
  );
}
