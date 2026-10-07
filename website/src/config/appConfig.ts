// Configuration for linking the marketing website to the MindMaster student web app and mobile PWA

export const getAppBaseUrl = (): string => {
  // If explicitly provided via environment variable
  const metaEnv = (import.meta as any)?.env;
  if (metaEnv && metaEnv.VITE_APP_URL) {
    return metaEnv.VITE_APP_URL;
  }

  // If in browser and on localhost or local IP, use local dev port 3001
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("192.168.")) {
      return "http://localhost:3001";
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
};

export const getAppCourseCheckoutUrl = (websiteCourseId: string): string => {
  const code = COURSE_ID_MAP[websiteCourseId.toLowerCase()] || "MM-01";
  return getAppUrl(`/checkout?course=${code}`);
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
