// Central Indian Standard Time (IST - Asia/Kolkata, UTC+05:30) Engine
// Guarantees exact activation-to-expiry timestamping independent of client clock manipulation

export const IST_TIMEZONE = "Asia/Kolkata";
export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // +05:30

/**
 * Returns current server timestamp in ISO string format (UTC)
 */
export function getNowUTC(): string {
  return new Date().toISOString();
}

/**
 * Parses any date/string/number safely into a valid JavaScript Date object
 */
export function parseDateSafe(input: string | Date | number | undefined | null): Date {
  if (!input) return new Date();
  if (input instanceof Date) return isNaN(input.getTime()) ? new Date() : input;
  const d = new Date(input);
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Formats any timestamp into human-readable Indian Standard Time (IST)
 * Example: "12 May 2026, 11:59 PM IST"
 */
export function formatIST(
  dateInput: string | Date | number | undefined | null,
  options?: {
    includeTime?: boolean;
    dateOnly?: boolean;
    short?: boolean;
  }
): string {
  if (!dateInput) return "N/A";
  const date = parseDateSafe(dateInput);

  try {
    if (options?.dateOnly) {
      return new Intl.DateTimeFormat("en-IN", {
        timeZone: IST_TIMEZONE,
        day: "2-digit",
        month: options.short ? "short" : "long",
        year: "numeric",
      }).format(date);
    }

    const formatted = new Intl.DateTimeFormat("en-IN", {
      timeZone: IST_TIMEZONE,
      day: "2-digit",
      month: options?.short ? "short" : "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);

    return `${formatted} IST`;
  } catch {
    return date.toLocaleDateString("en-IN");
  }
}

/**
 * Calculate exact expiration timestamp in IST.
 * When endOfDay is true (default), pins expiration to 23:59:59.999 IST of the final day.
 */
export function calculateExpiryIST(
  startDateInput: string | Date | number | undefined | null,
  options: {
    days?: number;
    months?: number;
    exactDate?: string; // YYYY-MM-DD
    endOfDay?: boolean;
  }
): string {
  const start = parseDateSafe(startDateInput);
  const endOfDay = options.endOfDay !== false;

  // 1. If exact date provided (e.g. from an Exam Date picker YYYY-MM-DD)
  if (options.exactDate) {
    const parts = options.exactDate.split("-").map(Number);
    if (parts.length === 3) {
      const [year, month, day] = parts;
      // Construct 23:59:59 in IST (UTC+5:30)
      // 23:59:59.999 in IST = 18:29:59.999 UTC of the same day
      const utcMs = Date.UTC(year, month - 1, day, 18, 29, 59, 999);
      return new Date(utcMs).toISOString();
    }
  }

  // 2. If days or months specified
  let totalDays = 0;
  if (options.days) {
    totalDays += options.days;
  }
  if (options.months) {
    totalDays += options.months * 30; // standard academic month duration
  }
  if (totalDays <= 0) {
    totalDays = 180; // default 6 months
  }

  // Calculate target date
  const targetMs = start.getTime() + totalDays * 86400000;
  const targetDate = new Date(targetMs);

  if (endOfDay) {
    // Determine the IST year, month, day of the target date
    const parts = new Intl.DateTimeFormat("en-IN", {
      timeZone: IST_TIMEZONE,
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).formatToParts(targetDate);

    const year = Number(parts.find((p) => p.type === "year")?.value || targetDate.getFullYear());
    const month = Number(parts.find((p) => p.type === "month")?.value || targetDate.getMonth() + 1);
    const day = Number(parts.find((p) => p.type === "day")?.value || targetDate.getDate());

    // 23:59:59.999 IST = 18:29:59.999 UTC
    const endOfDayUtcMs = Date.UTC(year, month - 1, day, 18, 29, 59, 999);
    return new Date(endOfDayUtcMs).toISOString();
  }

  return targetDate.toISOString();
}

/**
 * Extend an existing course expiry without losing existing remaining days.
 * If currentExpiry is still in the future, adds onto currentExpiry.
 * If already expired, starts new duration from current IST moment.
 */
export function extendExpiryIST(
  currentExpiryInput: string | Date | number | undefined | null,
  options: {
    days?: number;
    months?: number;
    exactDate?: string;
  }
): string {
  const now = Date.now();
  let baseDate = new Date(now);

  if (currentExpiryInput) {
    const cur = parseDateSafe(currentExpiryInput);
    if (cur.getTime() > now) {
      baseDate = cur; // still active: add on top of remaining validity!
    }
  }

  return calculateExpiryIST(baseDate, {
    days: options.days,
    months: options.months,
    exactDate: options.exactDate,
    endOfDay: true,
  });
}

/**
 * Returns true if the expiry timestamp has passed in current IST time
 */
export function isExpiredIST(expiresAtInput: string | Date | number | undefined | null): boolean {
  if (!expiresAtInput) return true;
  const exp = parseDateSafe(expiresAtInput);
  return exp.getTime() <= Date.now();
}

/**
 * Returns detailed breakdown of remaining days, hours, and human-friendly label in IST
 */
export function getRemainingTimeIST(expiresAtInput: string | Date | number | undefined | null): {
  days: number;
  hours: number;
  minutes: number;
  isExpired: boolean;
  label: string;
} {
  if (!expiresAtInput) {
    return { days: 0, hours: 0, minutes: 0, isExpired: true, label: "Expired" };
  }

  const exp = parseDateSafe(expiresAtInput);
  const now = Date.now();
  const diffMs = exp.getTime() - now;

  if (diffMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, isExpired: true, label: "Expired" };
  }

  const days = Math.floor(diffMs / (86400000));
  const hours = Math.floor((diffMs % 86400000) / (3600000));
  const minutes = Math.floor((diffMs % 3600000) / (60000));

  let label = "";
  if (days > 365) {
    label = `${Math.floor(days / 365)} Year(s) left`;
  } else if (days > 30) {
    label = `${Math.floor(days / 30)} Month(s) left`;
  } else if (days > 0) {
    label = `${days}d ${hours}h left`;
  } else {
    label = `${hours}h ${minutes}m left`;
  }

  return {
    days,
    hours,
    minutes,
    isExpired: false,
    label,
  };
}
