/**
 * MindMaster Academy - Canonical Phone Normalization & Validation Utility
 * Standardizes all student and staff mobile numbers to 10 digits
 * to prevent authentication and access-gating mismatches (+91 vs 10 digits).
 */

export function normalizePhone(raw?: string | null): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");

  // If 12 digits starting with Indian country code 91
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }

  // If 11 digits starting with leading 0 (e.g. 09823456789)
  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }

  // If more than 10 digits, slice the last 10
  if (digits.length > 10) {
    return digits.slice(-10);
  }

  return digits;
}

export function isValidIndianMobile(raw?: string | null): boolean {
  const normalized = normalizePhone(raw);
  // Valid Indian mobile numbers are 10 digits starting with 6, 7, 8, or 9
  return /^[6-9]\d{9}$/.test(normalized);
}

export function formatDisplayPhone(raw?: string | null): string {
  const clean = normalizePhone(raw);
  if (clean.length === 10) {
    return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`;
  }
  return raw || "";
}
