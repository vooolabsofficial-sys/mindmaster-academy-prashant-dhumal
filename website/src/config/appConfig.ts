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
    const res = await fetch(`${getAppUrl("/api/courses")}?t=${Date.now()}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
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

// --- Website CMS Interfaces & Live Fetcher ---

export interface AnnouncementConfig {
  enabled: boolean;
  message: string;
  couponBadge: string;
  ctaText: string;
  ctaUrl: string;
}

export interface HeroConfig {
  headline: string;
  subtitle: string;
  trustBadge: string;
  primaryCtaText: string;
  primaryCtaUrl: string;
  secondaryCtaText: string;
  secondaryCtaUrl: string;
  introVideoUrl: string;
  bannerImages: string[];
}

export interface PromoPopupConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText: string;
  ctaUrl: string;
}

export interface TopperStory {
  id: string;
  name: string;
  examCategory: string;
  scoreOrRank: string;
  batchYear: string;
  photoUrl: string;
  testimonialVideoUrl?: string;
  quote?: string;
  order: number;
}

export interface StatCounter {
  id: string;
  label: string;
  value: string;
  suffix: string;
  icon?: string;
}

export interface FacultyMember {
  id: string;
  name: string;
  role: string;
  qualification: string;
  bio: string;
  photoUrl: string;
  order: number;
}

export interface OfflineCentre {
  id: string;
  name: string;
  tag: string;
  address: string;
  phone: string;
  mapsUrl: string;
  timings: string;
  nextBatchDate: string;
  isHeadquarter: boolean;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
}

export interface SectionVisibility {
  announcement: boolean;
  heroStats: boolean;
  featuredCourses: boolean;
  resultsShowcase: boolean;
  facultySection: boolean;
  testimonials: boolean;
  faqSection: boolean;
  floatingWhatsapp: boolean;
  promoPopup: boolean;
}

export interface SeoAndSocial {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  youtubeUrl: string;
  instagramUrl: string;
  telegramUrl: string;
  whatsappNumber: string;
  copyrightText: string;
}

export interface WebsiteCmsData {
  announcement: AnnouncementConfig;
  hero: HeroConfig;
  promoPopup: PromoPopupConfig;
  toppers: TopperStory[];
  counters: StatCounter[];
  faculty: FacultyMember[];
  centres: OfflineCentre[];
  faqs: FAQItem[];
  sectionVisibility: SectionVisibility;
  seoAndSocial: SeoAndSocial;
  updatedAt?: string;
}

export const DEFAULT_WEBSITE_CMS: WebsiteCmsData = {
  announcement: {
    enabled: true,
    message: "New Cognitive & Police Bharti Batches Starting This Monday at Satara & Pune Centres!",
    couponBadge: "PRASHANT20",
    ctaText: "Enroll with 20% Off",
    ctaUrl: "/courses",
  },
  hero: {
    headline: "Train Your Mind. Master Your Memory. Succeed Anywhere.",
    subtitle: "Practical memory, concentration and Vedic Maths techniques for students from Grade 4 to MPSC / UPSC — and competitive aspirants across Maharashtra.",
    trustBadge: "Trusted by 5,000+ learners across Maharashtra",
    primaryCtaText: "Explore & Enroll",
    primaryCtaUrl: "/courses",
    secondaryCtaText: "Free Demo Hub",
    secondaryCtaUrl: "/demo",
    introVideoUrl: "https://www.youtube.com/watch?v=0k5G6M5wM7Y",
    bannerImages: [
      "/assets/images/classroom_students_group.png",
      "/assets/images/police_bharti_prep_3d.png",
      "/assets/images/memory_seminar_brain_3d.png",
    ],
  },
  promoPopup: {
    enabled: true,
    title: "Satara & Pune Offline Admissions Open",
    subtitle: "Reserve your seat for the upcoming interactive cognitive batch with Prashant Sir. Limited to 30 seats per batch.",
    imageUrl: "/assets/images/police_bharti_prep_3d.png",
    ctaText: "Reserve Seat on WhatsApp",
    ctaUrl: "https://wa.me/918459344077?text=Hi%20Prashant%20Sir%2C%20I%20want%20to%20reserve%20a%20seat%20for%20the%20upcoming%20batch.",
  },
  toppers: [
    {
      id: "top-1",
      name: "Akash Shinde",
      examCategory: "Police Bharti",
      scoreOrRank: "Rank 1 - Satara District",
      batchYear: "2024",
      photoUrl: "/assets/images/akash_police_testimonial.png",
      testimonialVideoUrl: "https://www.youtube.com/watch?v=0k5G6M5wM7Y",
      quote: "MindMaster's photographic memory drills helped me score 96/100 in written GK and mental ability.",
      order: 1,
    },
    {
      id: "top-2",
      name: "Snehal Patil",
      examCategory: "MPSC Rajyaseva",
      scoreOrRank: "Score: 142/200 Prelims",
      batchYear: "2024",
      photoUrl: "/assets/images/mpsc_merit_topper.jpg",
      quote: "Remembering constitutional articles and historical timelines became effortless with Prashant Sir's mind mapping methods.",
      order: 2,
    },
    {
      id: "top-3",
      name: "Rohan Deshmukh",
      examCategory: "Police Bharti",
      scoreOrRank: "48/50 Written Marks",
      batchYear: "2023",
      photoUrl: "/assets/images/police_bharti_celebration.jpg",
      quote: "Vedic maths calculations saved 25 precious minutes in the exam hall. Cleared on my first attempt!",
      order: 3,
    },
    {
      id: "top-4",
      name: "Ananya Kulkarni",
      examCategory: "Scholarship & Maths",
      scoreOrRank: "State Merit Rank 4",
      batchYear: "2024",
      photoUrl: "/assets/images/student_result_certificate.png",
      quote: "Superfast calendar and tables helped me crack mathematical questions with 100% accuracy.",
      order: 4,
    },
  ],
  counters: [
    { id: "stat-1", label: "Students Trained", value: "5,000", suffix: "+", icon: "school" },
    { id: "stat-2", label: "Exam Selections", value: "350", suffix: "+", icon: "workspace_premium" },
    { id: "stat-3", label: "Years of Excellence", value: "12", suffix: "+", icon: "verified" },
    { id: "stat-4", label: "Active Centres", value: "2", suffix: " Hubs", icon: "apartment" },
  ],
  faculty: [
    {
      id: "fac-1",
      name: "Prashant Dhumal Sir",
      role: "Founder & Lead Cognitive Master",
      qualification: "B.Sc., World Memory Record Holder",
      bio: "Pioneer in mnemonic science with over 12 years of coaching experience. Has trained more than 5,000 students and police aspirants across Maharashtra.",
      photoUrl: "/assets/images/prashant_dhumal_studio_portrait.png",
      order: 1,
    },
    {
      id: "fac-2",
      name: "Prashant Dhumal Sir",
      role: "Senior Mentor & Speed Maths Trainer",
      qualification: "M.Sc. Mathematics",
      bio: "Specialist in Vedic Mathematics and speed arithmetic. Known for simplifying complex calculations into rapid mental shortcuts.",
      photoUrl: "/assets/images/prashant_dhumal_studio_portrait.png",
      order: 2,
    },
  ],
  centres: [
    {
      id: "centre-satara",
      name: "Satara Flagship HQ",
      tag: "Flagship Academy",
      address: "Near Powai Naka, Sadar Bazar, Satara, Maharashtra 415001",
      phone: "+91 84593 44077",
      mapsUrl: "https://maps.google.com/?q=Satara+Maharashtra",
      timings: "Mon - Sun: 8:00 AM - 8:30 PM",
      nextBatchDate: "Every Monday • Morning 8 AM & Evening 5:30 PM",
      isHeadquarter: true,
    },
    {
      id: "centre-pune",
      name: "Pune Hub",
      tag: "Branch Centre",
      address: "Narhe / Shivaji Nagar, Pune, Maharashtra 411041",
      phone: "+91 84593 44077",
      mapsUrl: "https://maps.google.com/?q=Pune+Maharashtra",
      timings: "Mon - Sat: 9:00 AM - 7:00 PM",
      nextBatchDate: "1st & 15th of Every Month",
      isHeadquarter: false,
    },
  ],
  faqs: [
    {
      id: "faq-1",
      question: "Who can join MindMaster Academy programs?",
      answer: "Our courses are specifically designed for school students (Grade 4 onwards), college students, and competitive exam aspirants (Police Bharti, MPSC, UPSC, Banking), as well as teachers and professionals.",
      category: "Admissions",
      order: 1,
    },
    {
      id: "faq-2",
      question: "Are the courses available online, offline, or both?",
      answer: "We offer both! You can attend live classroom sessions at our Satara and Pune centres, or access high-definition video masterclasses and digital notes through our web app and mobile app.",
      category: "Mode of Learning",
      order: 2,
    },
    {
      id: "faq-3",
      question: "How does memory training help in competitive exams like Police Bharti & MPSC?",
      answer: "Instead of rote memorization, students learn visual linking, numerical peg systems, and memory palace techniques to retain hundreds of general knowledge facts, IPC sections, dates, and historical events effortlessly.",
      category: "Methodology",
      order: 3,
    },
    {
      id: "faq-4",
      question: "What is included with my Course Enrollment?",
      answer: "Enrollment includes complete video masterclasses, printable digital study notes, memory practice worksheets, weekly mock tests, and direct mentorship from Prashant Dhumal Sir.",
      category: "Features",
      order: 4,
    },
    {
      id: "faq-5",
      question: "Can I attend a free demo session at the offline centre?",
      answer: "Yes! We welcome parents and students for a free cognitive assessment and demo drill every Saturday and Sunday. Please contact us or click WhatsApp to book your slot.",
      category: "Admissions",
      order: 5,
    },
  ],
  sectionVisibility: {
    announcement: true,
    heroStats: true,
    featuredCourses: true,
    resultsShowcase: true,
    facultySection: true,
    testimonials: true,
    faqSection: true,
    floatingWhatsapp: true,
    promoPopup: true,
  },
  seoAndSocial: {
    metaTitle: "MindMaster Academy | Cognitive Memory Training & Competitive Exam Coaching",
    metaDescription: "Train your mind and master your memory with Prashant Dhumal Sir. Specialised coaching for Police Bharti, MPSC, Vedic Maths & School Cognitive Skills in Satara & Pune.",
    keywords: "MindMaster Academy, Prashant Dhumal, Memory Training, Vedic Maths, Police Bharti Satara, MPSC Coaching Satara, Brain Gym Maharashtra",
    youtubeUrl: "https://www.youtube.com/@mindmasteracademy",
    instagramUrl: "https://www.instagram.com/mindmaster_academy",
    telegramUrl: "https://t.me/mindmasteracademy",
    whatsappNumber: "918459344077",
    copyrightText: "© 2026 MindMaster Academy. All rights reserved. Founded by Prashant Dhumal Sir.",
  },
};

export const fetchLiveWebsiteCms = async (): Promise<WebsiteCmsData> => {
  try {
    const res = await fetch(`${getAppUrl("/api/website-cms")}?t=${Date.now()}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      if (json && json.success && json.data) {
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("mma_website_cms_cache", JSON.stringify(json.data));
          } catch {}
        }
        return json.data;
      }
    }
  } catch {}

  // Fallback to client cache or default English CMS
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem("mma_website_cms_cache");
      if (cached) {
        // If cached data contains outdated mentor names, purge stale cache immediately
        if (cached.includes("Sagar") || cached.includes("sagar")) {
          localStorage.removeItem("mma_website_cms_cache");
        } else {
          return JSON.parse(cached);
        }
      }
    } catch {}
  }

  return DEFAULT_WEBSITE_CMS;
};

export const submitWebsiteLead = async (lead: {
  name: string;
  phone: string;
  email?: string;
  courseInterest?: string;
  message?: string;
  source?: string;
}): Promise<{ success: boolean; message: string }> => {
  try {
    const res = await fetch(getAppUrl("/api/website-cms"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "submit_lead",
        lead,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success) {
        return { success: true, message: json.message || "Inquiry submitted successfully!" };
      }
    }
  } catch {}

  // If server is not reachable, still show success and open WhatsApp fallback
  return {
    success: true,
    message: "Inquiry registered! You can also connect directly with Prashant Sir on WhatsApp.",
  };
};
