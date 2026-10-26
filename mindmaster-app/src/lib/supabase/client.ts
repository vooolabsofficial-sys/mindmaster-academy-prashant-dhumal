import { createBrowserClient } from "@supabase/ssr";

export function getCookieDomain(hostOrReq?: string | any): string | undefined {
  let hostname = "";
  if (typeof window !== "undefined") {
    hostname = window.location.hostname;
  } else if (typeof hostOrReq === "string") {
    hostname = hostOrReq.split(":")[0];
  } else if (hostOrReq && typeof hostOrReq.get === "function") {
    const rawHost = hostOrReq.get("host") || "";
    hostname = rawHost.split(":")[0];
  }

  // Never set explicit domain on Vercel preview/production (*.vercel.app), localhost, or IP addresses
  if (
    !hostname ||
    hostname.includes("localhost") ||
    hostname.includes("vercel.app") ||
    hostname.includes("127.0.0.1") ||
    /^\d+\.\d+\.\d+\.\d+$/.test(hostname)
  ) {
    return undefined;
  }

  if (hostname.includes("mindmasteracademy.in")) {
    return process.env.NEXT_PUBLIC_COOKIE_DOMAIN || ".mindmasteracademy.in";
  }

  return undefined;
}

export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "https://dummy.supabase.co";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    "dummy-anon-key";
  const cookieDomain = getCookieDomain();

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: {
      name: "sb-mindmaster-auth-token",
      domain: cookieDomain,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  });
}

/**
 * Logout handler: signs out from Supabase and clears auth cookies across the whole domain (.mindmasteracademy.in)
 */
export async function signOutAndClearCookie() {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.warn("Supabase signOut warning:", err);
  }

  // Clear server-side cookie headers
  try {
    fetch("/api/student/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    }).catch(() => {});
  } catch {}

  if (typeof document !== "undefined") {
    const domain = getCookieDomain();
    const domainStr = domain ? `; domain=${domain}` : "";
    document.cookie = `sb-mindmaster-auth-token=; path=/${domainStr}; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    document.cookie = `sb-access-token=; path=/${domainStr}; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    document.cookie = `mindmaster_session=; path=/${domainStr}; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;

    // Also clear cookie without domain just in case
    document.cookie = `sb-mindmaster-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  }

  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("mindmaster_session_token");
    localStorage.removeItem("mindmaster_user_profile");
    localStorage.removeItem("mindmaster_onboarding_completed");
    localStorage.removeItem("mindmaster_user_phone");
  }
}
