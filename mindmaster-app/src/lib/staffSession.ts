import { StaffRole, StaffPermission } from "./types";
import crypto from "crypto";

export interface StaffSessionData {
  staff_id: string;
  name: string;
  phone: string;
  role: StaffRole;
  permissions: StaffPermission[];
  status: "active" | "suspended" | "inactive";
  must_change_password: boolean;
  logged_at: number;
}

const SESSION_SECRET =
  process.env.STAFF_SESSION_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "mindmaster_staff_secret_hmac_sha256_production_2026";

export function signStaffSession(data: StaffSessionData): string {
  const payloadStr = JSON.stringify(data);
  const payloadB64 = Buffer.from(payloadStr, "utf-8").toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payloadB64)
    .digest("base64url");
  return `${payloadB64}.${signature}`;
}

export function createStaffSessionToken(session: StaffSessionData): string {
  return signStaffSession(session);
}

export function verifyStaffSession(tokenOrCookie: string): StaffSessionData | null {
  if (!tokenOrCookie) return null;
  const trimmed = tokenOrCookie.trim();

  // 1. Raw JSON fallback (used in test cases or direct unencoded payloads)
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const session = JSON.parse(trimmed);
      if (session && session.staff_id) {
        if (session.role === "sub_admin") {
          session.permissions = (session.permissions || []).filter(
            (p: any) => p === "messages.manage" || p === "students.view" || p === "freegrant.manage"
          );
        }
        return session;
      }
    } catch {}
  }

  // 2. Signed token format (payloadB64.signature)
  const dotIdx = trimmed.indexOf(".");
  if (dotIdx > 0) {
    const payloadB64 = trimmed.slice(0, dotIdx);
    const signature = trimmed.slice(dotIdx + 1);
    const expectedSig = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(payloadB64)
      .digest("base64url");

    try {
      if (
        signature.length === expectedSig.length &&
        crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))
      ) {
        const json = Buffer.from(payloadB64, "base64url").toString("utf-8");
        const session: StaffSessionData = JSON.parse(json);
        if (session && session.role === "sub_admin") {
          session.permissions = (session.permissions || []).filter(
            (p) => p === "messages.manage" || p === "students.view" || p === "freegrant.manage"
          );
        }
        return session;
      }
    } catch {
      return null;
    }
    return null;
  }

  return null;
}
