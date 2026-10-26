import { StaffUser, StaffRole, StaffPermission, AuditLogEntry } from "./types";
import { INITIAL_STAFF_USERS } from "./mockStaffData";
import { getStaffUsers } from "./staffStore";

export type { StaffSessionData } from "./staffSession";
export {
  signStaffSession,
  createStaffSessionToken,
  verifyStaffSession,
} from "./staffSession";

export interface LockoutInfo {
  attempts: number;
  lockedUntil: number | null; // timestamp ms
}

// In-memory / storage keys
const LOCKOUT_MAP = new Map<string, LockoutInfo>();
const OTP_MAP = new Map<string, { otp: string; expiresAt: number; phone: string }>();

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Get current lockout status for a staff_id.
 */
export function getLockoutStatus(staffId: string): { isLocked: boolean; remainingSec: number } {
  const info = LOCKOUT_MAP.get(staffId.toUpperCase());
  if (!info || !info.lockedUntil) {
    return { isLocked: false, remainingSec: 0 };
  }

  const now = Date.now();
  if (now < info.lockedUntil) {
    return {
      isLocked: true,
      remainingSec: Math.ceil((info.lockedUntil - now) / 1000),
    };
  }

  // Lockout expired -> reset
  LOCKOUT_MAP.delete(staffId.toUpperCase());
  return { isLocked: false, remainingSec: 0 };
}

/**
 * Record a failed attempt. Locks out if >= 5.
 */
export function recordFailedAttempt(staffId: string): { locked: boolean; attemptsLeft: number } {
  const key = staffId.toUpperCase();
  const current = LOCKOUT_MAP.get(key) || { attempts: 0, lockedUntil: null };
  current.attempts += 1;

  if (current.attempts >= MAX_FAILED_ATTEMPTS) {
    current.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    LOCKOUT_MAP.set(key, current);
    return { locked: true, attemptsLeft: 0 };
  }

  LOCKOUT_MAP.set(key, current);
  return { locked: false, attemptsLeft: MAX_FAILED_ATTEMPTS - current.attempts };
}

/**
 * Reset failed attempts upon successful login.
 */
export function clearFailedAttempts(staffId: string): void {
  LOCKOUT_MAP.delete(staffId.toUpperCase());
}

/**
 * Find staff member by staff_id, phone, or email.
 */
import { normalizePhone } from "./phoneUtils";
import crypto from "crypto";

// (Session management functions are now in ./staffSession to preserve Edge runtime compatibility)

export function findStaffAccount(identifier: string): StaffUser | null {
  const clean = identifier.trim().toLowerCase();
  const normalizedPhone = normalizePhone(identifier);

  // Read from dynamic staff store
  const allStaff = getStaffUsers();

  const user = allStaff.find((u) => {
    const matchId = (u.staffId && u.staffId.toLowerCase() === clean) || u.id.toLowerCase() === clean;
    const matchEmail = u.email && u.email.toLowerCase() === clean;
    const matchPhone = normalizedPhone && normalizePhone(u.phone) === normalizedPhone;
    return matchId || matchEmail || matchPhone;
  });

  if (user && user.role === "sub_admin") {
    return {
      ...user,
      permissions: (user.permissions || []).filter(
        (p) => p === "messages.manage" || p === "students.view" || p === "freegrant.manage"
      ),
    };
  }

  return user || null;
}

/**
 * Generate SMS OTP for password reset (valid for 5 minutes).
 */
export function generateSmsOtp(staffId: string): { success: boolean; phone?: string; error?: string; otpDebug?: string } {
  const user = findStaffAccount(staffId);
  if (!user) {
    return { success: false, error: "No staff account found with this Staff ID or Phone." };
  }

  if (user.status === "suspended" || (user.status as any) === "inactive") {
    return { success: false, error: "This staff account is suspended. Contact Main Admin." };
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000;

  const key = (user.staffId || user.id).toUpperCase();
  OTP_MAP.set(key, { otp, expiresAt, phone: user.phone });

  console.log(`[SMS GATEWAY SIMULATION] Sent OTP ${otp} to ${user.phone} for staff ${key}`);

  return {
    success: true,
    phone: user.phone,
    otpDebug: otp, // Returned for dev/testing verification
  };
}

/**
 * Verify SMS OTP and reset password.
 */
export async function verifyOtpAndResetPassword(
  staffId: string,
  enteredOtp: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const user = findStaffAccount(staffId);
  if (!user) return { success: false, error: "Staff account not found." };

  const key = (user.staffId || user.id).toUpperCase();
  const record = OTP_MAP.get(key);

  if (!record) {
    return { success: false, error: "No OTP request found. Please request a new OTP." };
  }

  if (Date.now() > record.expiresAt) {
    OTP_MAP.delete(key);
    return { success: false, error: "OTP expired. Please request a new one." };
  }

  if (record.otp !== enteredOtp.trim()) {
    return { success: false, error: "Invalid OTP entered. Please check SMS." };
  }

  // Success -> Hash new password with Argon2
  const { hashArgon2 } = await import("./argon2");
  const hashed = await hashArgon2(newPassword);
  user.password = hashed;
  user.mustChangePassword = false;

  // Clear OTP & lockout
  OTP_MAP.delete(key);
  clearFailedAttempts(key);

  // Update in storage
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("mma_staff_users");
      const users: StaffUser[] = stored ? JSON.parse(stored) : INITIAL_STAFF_USERS;
      const idx = users.findIndex((u) => u.id === user.id);
      if (idx >= 0) users[idx] = user;
      localStorage.setItem("mma_staff_users", JSON.stringify(users));
    } catch {}
  }

  return { success: true };
}
