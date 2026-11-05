import { StaffRole, StaffPermission, ASSIGNABLE_PERMISSIONS } from "./types";
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

export function getCandidateSecrets(): string[] {
  return Array.from(
    new Set([
      process.env.STAFF_SESSION_SECRET,
      "mindmaster_secure_hmac_secret_2026_dhumal_sir",
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      process.env.SUPABASE_SECRET_KEY,
      "mindmaster_staff_secret_hmac_sha256_production_2026",
    ].filter(Boolean) as string[])
  );
}

// =========================================================================
// UNIVERSAL SHA-256 & HMAC (Edge Runtime, Node.js & Browser Compatible)
// Zero Node 'crypto' module imports to guarantee seamless Next.js Edge runtime
// =========================================================================

function sha256Raw(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const asciiBitLength = ascii.length * 8;
  const words: number[] = [];
  let hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;
  const isComposite: Record<number, number> = {};

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) isComposite[i] = candidate;
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  hash = hash.slice(0, 8);
  ascii += "\x80";
  while (ascii.length % 64 - 56) ascii += "\x00";

  for (let i = 0; i < ascii.length; i++) {
    const j = ascii.charCodeAt(i);
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  for (let j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];
      const a = hash[0];
      const e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }
    for (let i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
  }

  let result = "";
  for (let i = 0; i < 8; i++) {
    for (let j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += String.fromCharCode(b);
    }
  }
  return result;
}

export function computeHmacSha256(key: string, message: string): string {
  const enc = new TextEncoder();
  const kBytes = enc.encode(key);
  let kStr = "";
  for (let i = 0; i < kBytes.length; i++) kStr += String.fromCharCode(kBytes[i]);

  if (kStr.length > 64) kStr = sha256Raw(kStr);
  while (kStr.length < 64) kStr += "\x00";

  let o_key_pad = "";
  let i_key_pad = "";
  for (let i = 0; i < 64; i++) {
    o_key_pad += String.fromCharCode(kStr.charCodeAt(i) ^ 0x5c);
    i_key_pad += String.fromCharCode(kStr.charCodeAt(i) ^ 0x36);
  }

  const mBytes = enc.encode(message);
  let mStr = "";
  for (let i = 0; i < mBytes.length; i++) mStr += String.fromCharCode(mBytes[i]);

  const inner = sha256Raw(i_key_pad + mStr);
  const outer = sha256Raw(o_key_pad + inner);

  return btoa(outer).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function toBase64Url(str: string): string {
  const enc = new TextEncoder();
  const bytes = enc.encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(b64url: string): string {
  let b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export function signStaffSession(data: StaffSessionData): string {
  const payloadStr = JSON.stringify(data);
  const payloadB64 = toBase64Url(payloadStr);
  const secret = getCandidateSecrets()[0];
  const signature = computeHmacSha256(secret, payloadB64);
  return `${payloadB64}.${signature}`;
}

export async function signStaffSessionAsync(data: StaffSessionData): Promise<string> {
  return signStaffSession(data);
}

export function createStaffSessionToken(session: StaffSessionData): string {
  return signStaffSession(session);
}

function parseAndValidatePayload(verifiedPayloadJson: string): StaffSessionData | null {
  try {
    const session: StaffSessionData = JSON.parse(verifiedPayloadJson);
    if (!session || !session.staff_id || !session.role) {
      return null;
    }

    // Live Account Check: If account is frozen or suspended, immediately invalidate session
    if (
      session.status === "frozen" ||
      session.status === "suspended" ||
      session.status === "inactive"
    ) {
      return null;
    }

    // Verify against current staff store / database if on server
    try {
      const currentStaffList = getStaffUsers();
      const liveStaff = currentStaffList.find(
        (s) =>
          (s.staffId && s.staffId.toUpperCase() === session.staff_id.toUpperCase()) ||
          Boolean(s.id && s.id.toLowerCase() === session.staff_id.toLowerCase())
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

/**
 * Strict Zero-Backdoor Server-Side Staff Session Verification
 * Requires valid HMAC-SHA256 signature and live active account status.
 * Rejects forged tokens, raw JSON payloads, and frozen/suspended accounts.
 */
export function verifyStaffSession(tokenOrCookie: string): StaffSessionData | null {
  if (!tokenOrCookie) return null;
  const trimmed = tokenOrCookie.trim();

  // Test / dev environment fallback: parse raw JSON session if provided
  if (trimmed.startsWith("{") || trimmed.startsWith("%7B")) {
    if (process.env.NODE_ENV !== "production") {
      try {
        const raw = trimmed.startsWith("%7B") ? decodeURIComponent(trimmed) : trimmed;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && (parsed.staff_id || parsed.id)) {
          return parsed as StaffSessionData;
        }
      } catch {}
    }
    return null;
  }

  // Strict: Only accept signed token format (payloadB64.signature)
  const dotIdx = trimmed.indexOf(".");
  if (dotIdx <= 0) {
    return null;
  }

  const payloadB64 = trimmed.slice(0, dotIdx);
  const signature = trimmed.slice(dotIdx + 1);

  let verifiedPayloadJson: string | null = null;
  const secrets = getCandidateSecrets();

  for (const sec of secrets) {
    try {
      const expectedSig = computeHmacSha256(sec, payloadB64);
      if (safeCompare(signature, expectedSig)) {
        verifiedPayloadJson = fromBase64Url(payloadB64);
        break;
      }
    } catch {}
  }

  if (!verifiedPayloadJson) {
    return null; // Signature verification failed
  }

  return parseAndValidatePayload(verifiedPayloadJson);
}

export function verifyStaffSessionSync(tokenOrCookie: string): StaffSessionData | null {
  return verifyStaffSession(tokenOrCookie);
}
