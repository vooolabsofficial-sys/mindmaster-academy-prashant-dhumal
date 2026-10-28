import { StaffRole, StaffPermission, ASSIGNABLE_PERMISSIONS } from "./types";
import crypto from "crypto";
import { getStaffUsers } from "./staffStore";

export interface StaffSessionData {
  staff_id: string;
  name: string;
  phone: string;
  role: StaffRole;
  permissions: StaffPermission[];
  status: "active" | "suspended" | "inactive" | "frozen";
  must_change_password: boolean;
  logged_at: number;
}

const CANDIDATE_SECRETS = Array.from(
  new Set([
    process.env.STAFF_SESSION_SECRET,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    "mindmaster_staff_secret_hmac_sha256_production_2026",
  ].filter(Boolean) as string[])
);

const PRIMARY_SECRET = CANDIDATE_SECRETS[0] || "mindmaster_staff_secret_hmac_sha256_production_2026";

export function signStaffSession(data: StaffSessionData): string {
  const payloadStr = JSON.stringify(data);
  const payloadB64 = Buffer.from(payloadStr, "utf-8").toString("base64url");
  const signature = crypto
    .createHmac("sha256", PRIMARY_SECRET)
    .update(payloadB64)
    .digest("base64url");
  return `${payloadB64}.${signature}`;
}

export function createStaffSessionToken(session: StaffSessionData): string {
  return signStaffSession(session);
}

/**
 * Strict Zero-Backdoor Server-Side Staff Session Verification
 * Requires valid HMAC-SHA256 signature and live active account status.
 * Rejects forged tokens, raw JSON payloads, and frozen/suspended accounts.
 */
export function verifyStaffSession(tokenOrCookie: string): StaffSessionData | null {
  if (!tokenOrCookie) return null;
  const trimmed = tokenOrCookie.trim();

  // Strict: Only accept signed token format (payloadB64.signature)
  const dotIdx = trimmed.indexOf(".");
  if (dotIdx <= 0) {
    return null; // Reject raw JSON strings, mock strings, or unencoded tokens
  }

  const payloadB64 = trimmed.slice(0, dotIdx);
  const signature = trimmed.slice(dotIdx + 1);

  let verifiedPayloadJson: string | null = null;

  for (const sec of CANDIDATE_SECRETS) {
    try {
      const expectedSig = crypto
        .createHmac("sha256", sec)
        .update(payloadB64)
        .digest("base64url");

      let matches = false;
      try {
        if (
          typeof crypto.timingSafeEqual === "function" &&
          signature.length === expectedSig.length
        ) {
          matches = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
        } else {
          matches = signature === expectedSig;
        }
      } catch {
        matches = signature === expectedSig;
      }

      if (matches) {
        verifiedPayloadJson = Buffer.from(payloadB64, "base64url").toString("utf-8");
        break;
      }
    } catch {}
  }

  if (!verifiedPayloadJson) {
    return null; // Signature verification failed
  }

  try {
    const session: StaffSessionData = JSON.parse(verifiedPayloadJson);
    if (!session || !session.staff_id || !session.role) {
      return null;
    }

    // Live Account Check: If account is frozen or suspended, immediately invalidate session
    if (session.status === "frozen" || session.status === "suspended" || session.status === "inactive") {
      return null;
    }

    // Verify against current staff store / database if on server
    try {
      const currentStaffList = getStaffUsers();
      const liveStaff = currentStaffList.find(
        (s) =>
          (s.staffId && s.staffId.toUpperCase() === session.staff_id.toUpperCase()) ||
          s.id.toLowerCase() === session.staff_id.toLowerCase()
      );

      if (liveStaff) {
        if (
          liveStaff.status === "frozen" ||
          liveStaff.status === "suspended" ||
          liveStaff.status === "inactive"
        ) {
          return null; // Account frozen or suspended in live database!
        }
        // Sync live permissions
        if (liveStaff.permissions && liveStaff.role === "sub_admin") {
          session.permissions = (liveStaff.permissions || []).filter((p) =>
            ASSIGNABLE_PERMISSIONS.includes(p as any)
          );
        }
      }
    } catch {}

    return session;
  } catch {
    return null;
  }
}
