// Configuration for linking the marketing website to the MindMaster student web app and mobile PWA

export const getAppBaseUrl = (): string => {
  // If explicitly provided via environment variable
  const metaEnv = (import.meta as any)?.env;
  if (metaEnv && metaEnv.VITE_APP_URL) {
    return metaEnv.VITE_APP_URL;
  }

  // If in browser, check localStorage override or localhost
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("mma_app_url");
      if (stored) return stored;
    } catch {}

    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("192.168.")) {
      return "http://localhost:3000";
    }
  }

  // Default production subdomain for the web app
  return "https://app.mindmasteracademy.in";
};

// Generate full app URL for any route
export const getAppUrl = (path: string = ""): string => {
  const base = getAppBaseUrl().replace(/\/+$/, "");
  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `${base}${cleanPath}`;
};

// Course mapping between website IDs and App Course Codes
export const COURSE_ID_MAP: Record<string, string> = {
  "mm-01": "MM-01",
  "mm-02": "MM-02",
  "mm-03": "MM-03",
  "mm-04": "MM-04",
  "mm-05": "MM-05",
  "mm-06": "MM-06",
};

export interface LiveDbCourse {
  id: string;
  code: string;
  title: string;
  titleMr?: string;
  subtitle?: string;
  description?: string;
  pricePaise?: number;
  originalPricePaise?: number;
  isFree?: boolean;
  status: "live" | "draft" | "upcoming";
  category?: string;
}

// Fetch live courses from student app API / Supabase sync
export const fetchLiveCoursesFromApp = async (): Promise<LiveDbCourse[]> => {
  try {
    const res = await fetch(getAppUrl("/api/courses"), {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (data && Array.isArray(data.courses)) {
      return data.courses.filter((c: any) => c.status === "live");
    }
    return [];
  } catch {
    return [];
  }
};

export const getWhatsAppPreBookUrl = (courseTitle: string = "MindMaster Academy Courses"): string => {
  const text = `Namaskar Prashant Sir, I visited mindmasteracademy.in. Please notify me and reserve my seat when the "${courseTitle}" batch launches!`;
  return `https://wa.me/918459344077?text=${encodeURIComponent(text)}`;
};

export const getAppCourseCheckoutUrl = (websiteCourseId: string): string => {
  const code = COURSE_ID_MAP[websiteCourseId.toLowerCase()] || websiteCourseId.toUpperCase();
  return getAppUrl(`/checkout?course=${code}`);
};

export const getAppBookCheckoutUrl = (bookId: string): string => {
  return getAppUrl(`/checkout?book=${bookId}`);
};

export const getAppLegalUrl = (tab: "privacy" | "terms" | "refund" = "privacy"): string => {
  return getAppUrl(`/legal?tab=${tab}`);
};

export const getAppCourseDetailUrl = (websiteCourseId: string): string => {
  const code = COURSE_ID_MAP[websiteCourseId.toLowerCase()] || "MM-01";
  return getAppUrl(`/courses`);
};

// Helper to detect mobile device for custom labels
export const isMobileDevice = (): boolean => {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};
