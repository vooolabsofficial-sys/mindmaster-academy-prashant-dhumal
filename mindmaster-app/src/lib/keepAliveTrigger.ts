/**
 * MindMaster Academy - Supabase Free Tier Keep-Alive Trigger
 * Performs a silent, throttled ping once every 12 hours per browser
 * to ensure Supabase database traffic never lapses and never pauses.
 */

export function triggerSupabaseKeepAlive(): void {
  if (typeof window === "undefined") return;
  try {
    const STORAGE_KEY = "mma_supabase_keep_alive_last";
    const lastPing = localStorage.getItem(STORAGE_KEY);
    const now = Date.now();
    const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

    if (!lastPing || now - parseInt(lastPing, 10) > TWELVE_HOURS_MS) {
      localStorage.setItem(STORAGE_KEY, now.toString());
      // Throttled background ping (silent, non-blocking)
      fetch("/api/cron/keep-alive", { method: "GET" }).catch(() => {});
    }
  } catch {
    // Fail silently in restricted sandbox / private mode
  }
}
