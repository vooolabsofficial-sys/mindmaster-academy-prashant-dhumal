import fs from "fs";
import path from "path";

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

export interface LeadItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
  courseInterest?: string;
  message?: string;
  status: "New" | "Contacted" | "Enrolled";
  source: string;
  createdAt: string;
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
  leads: LeadItem[];
  toppers: TopperStory[];
  counters: StatCounter[];
  faculty: FacultyMember[];
  centres: OfflineCentre[];
  faqs: FAQItem[];
  sectionVisibility: SectionVisibility;
  seoAndSocial: SeoAndSocial;
  updatedAt: string;
}

export const DEFAULT_WEBSITE_CMS: WebsiteCmsData = {
  announcement: {
    enabled: false,
    message: "",
    couponBadge: "",
    ctaText: "",
    ctaUrl: "",
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
    enabled: false,
    title: "",
    subtitle: "",
    imageUrl: "",
    ctaText: "",
    ctaUrl: "",
  },
  leads: [
    {
      id: "lead-seed-1",
      name: "Akash Shinde",
      phone: "9822012345",
      email: "akash.shinde@gmail.com",
      courseInterest: "Police Bharti Special",
      message: "Interested in the offline batch at Satara centre.",
      status: "Contacted",
      source: "Website Hero Form",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: "lead-seed-2",
      name: "Pooja Jadhav",
      phone: "9423098765",
      email: "pooja.j@outlook.com",
      courseInterest: "Vedic Maths Masterclass",
      message: "Want details for 7th grade student demo class.",
      status: "New",
      source: "Contact Page",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ],
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
    announcement: false,
    heroStats: true,
    featuredCourses: true,
    resultsShowcase: true,
    facultySection: true,
    testimonials: true,
    faqSection: true,
    floatingWhatsapp: true,
    promoPopup: false,
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
  updatedAt: new Date().toISOString(),
};

// In-memory fallback cache
let memoryCmsCache: WebsiteCmsData = { ...DEFAULT_WEBSITE_CMS };

function getStoreFilePath(): string {
  return path.join(process.cwd(), ".data", "website-cms.json");
}

export function readWebsiteCmsSync(): WebsiteCmsData {
  try {
    const filePath = getStoreFilePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        const result: WebsiteCmsData = {
          ...DEFAULT_WEBSITE_CMS,
          ...parsed,
          announcement: { ...DEFAULT_WEBSITE_CMS.announcement, ...(parsed.announcement || {}) },
          hero: { ...DEFAULT_WEBSITE_CMS.hero, ...(parsed.hero || {}) },
          promoPopup: { ...DEFAULT_WEBSITE_CMS.promoPopup, ...(parsed.promoPopup || {}) },
          sectionVisibility: { ...DEFAULT_WEBSITE_CMS.sectionVisibility, ...(parsed.sectionVisibility || {}) },
          seoAndSocial: { ...DEFAULT_WEBSITE_CMS.seoAndSocial, ...(parsed.seoAndSocial || {}) },
        };
        memoryCmsCache = result;
        return result;
      }
    }
  } catch (e) {
    console.warn("Failed reading .data/website-cms.json, using fallback", e);
  }

  if (memoryCmsCache) return memoryCmsCache;

  // Initialize file if not exists
  try {
    const filePath = getStoreFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(DEFAULT_WEBSITE_CMS, null, 2), "utf-8");
  } catch {}

  memoryCmsCache = { ...DEFAULT_WEBSITE_CMS };
  return memoryCmsCache;
}

export function writeWebsiteCmsSync(data: Partial<WebsiteCmsData>): WebsiteCmsData {
  const current = readWebsiteCmsSync();
  const merged: WebsiteCmsData = {
    ...current,
    ...data,
    announcement: { ...current.announcement, ...(data.announcement || {}) },
    hero: { ...current.hero, ...(data.hero || {}) },
    promoPopup: { ...current.promoPopup, ...(data.promoPopup || {}) },
    leads: data.leads || current.leads,
    toppers: data.toppers || current.toppers,
    counters: data.counters || current.counters,
    faculty: data.faculty || current.faculty,
    centres: data.centres || current.centres,
    faqs: data.faqs || current.faqs,
    sectionVisibility: { ...current.sectionVisibility, ...(data.sectionVisibility || {}) },
    seoAndSocial: { ...current.seoAndSocial, ...(data.seoAndSocial || {}) },
    updatedAt: new Date().toISOString(),
  };

  memoryCmsCache = merged;

  try {
    const filePath = getStoreFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(merged, null, 2), "utf-8");
  } catch (e) {
    console.warn("Failed saving .data/website-cms.json", e);
  }

  return merged;
}

export function addLeadSync(lead: {
  name: string;
  phone: string;
  email?: string;
  courseInterest?: string;
  message?: string;
  source?: string;
}): LeadItem {
  const current = readWebsiteCmsSync();
  const newLead: LeadItem = {
    id: `lead-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: lead.name.trim(),
    phone: lead.phone.trim(),
    email: lead.email?.trim() || "",
    courseInterest: lead.courseInterest?.trim() || "General Inquiry",
    message: lead.message?.trim() || "",
    status: "New",
    source: lead.source || "Website Form",
    createdAt: new Date().toISOString(),
  };

  const updatedLeads = [newLead, ...current.leads];
  writeWebsiteCmsSync({ leads: updatedLeads });
  return newLead;
}

export function updateLeadStatusSync(leadId: string, status: LeadItem["status"]): boolean {
  const current = readWebsiteCmsSync();
  const index = current.leads.findIndex((l) => l.id === leadId);
  if (index === -1) return false;
  current.leads[index].status = status;
  writeWebsiteCmsSync({ leads: current.leads });
  return true;
}

export function deleteLeadSync(leadId: string): boolean {
  const current = readWebsiteCmsSync();
  const filtered = current.leads.filter((l) => l.id !== leadId);
  if (filtered.length === current.leads.length) return false;
  writeWebsiteCmsSync({ leads: filtered });
  return true;
}
