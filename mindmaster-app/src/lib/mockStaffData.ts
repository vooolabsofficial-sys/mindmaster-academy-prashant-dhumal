import {
  StaffUser,
  AuditLogEntry,
  Coupon,
  LessonWatchStat,
  StudentRecord,
  Course,
} from "./types";

// ==========================================
// PRE-SEEDED STAFF USERS (MMA-000 Owner Account)
// ==========================================
const ownerPhone =
  process.env.NEXT_PUBLIC_OWNER_PHONE ||
  process.env.OWNER_PHONE ||
  "+91 84593 44077";
const ownerTempPass =
  process.env.NEXT_PUBLIC_OWNER_TEMP_PASSWORD ||
  process.env.OWNER_TEMP_PASSWORD ||
  "Owner@2026";

export const INITIAL_STAFF_USERS: StaffUser[] = [
  {
    id: "staff-mma-000",
    staffId: "MMA-000",
    name: "Prashant Dhumal",
    email: "mindmasterdhumal@gmail.com",
    phone: ownerPhone,
    role: "main_admin",
    permissions: [
      "messages.manage",
      "students.view",
      "videos.manage",
      "courses.manage",
      "coupons.manage",
      "reports.view",
      "notes.books.manage",
      "freegrant.manage",
    ],
    status: "active",
    lastLoginAt: new Date().toISOString(),
    mustChangePassword: true,
    password: ownerTempPass,
  },
  {
    id: "staff-mma-001",
    staffId: "MMA-001",
    name: "Staff Coordinator (Sub Admin)",
    email: "subadmin@mindmasteracademy.in",
    phone: "+91 98765 43211",
    role: "sub_admin",
    permissions: [
      "messages.manage",
      "students.view",
    ],
    status: "active",
    lastLoginAt: new Date().toISOString(),
    mustChangePassword: false,
    password: "Staff@2026",
  },
  {
    id: "staff-mma-002",
    staffId: "MMA-002",
    name: "Sneha Patil (No Keys)",
    email: "sneha.support@mindmasteracademy.in",
    phone: "+91 97650 98765",
    role: "sub_admin",
    permissions: [],
    status: "active",
    lastLoginAt: new Date().toISOString(),
    mustChangePassword: false,
    password: "Staff@2026",
  },
];

// Production Clean Slate: 0 Fake Coupons
export const INITIAL_COUPONS: Coupon[] = [];

// Production Clean Slate: 0 Fake Audit Logs
export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [];

// Production Clean Slate: 0 Fake Courses
export const INITIAL_STAFF_COURSES: Course[] = [];

// Production Clean Slate: 0 Fake Watch Stats
export const INITIAL_WATCH_STATS: LessonWatchStat[] = [];

// Seed student personas defined with diverse subscription states for verification
export const INITIAL_STUDENTS: StudentRecord[] = [
  {
    id: "std-new",
    name: "Aditi Kulkarni",
    email: "aditi.k@gmail.com",
    phone: "+91 98220 11111",
    district: "Pune",
    taluka: "Haveli",
    school: "Pune Model School",
    standard: "10th Standard",
    enrolledCourseCodes: [],
    enrolledCourseTitles: [],
    totalWatchSec: 0,
    completedLessonsCount: 0,
    totalLessonsCount: 0,
    joinedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    status: "active",
    coursesTaken: [],
    lessonWatches: [],
    recentActivity: [],
  },
  {
    id: "std-active",
    name: "Rohan Deshmukh",
    email: "rohan.d@gmail.com",
    phone: "+91 98220 22222",
    district: "Satara",
    taluka: "Karad",
    school: "Karad High School",
    standard: "Police Bharti",
    enrolledCourseCodes: ["MM-01"],
    enrolledCourseTitles: ["Memory Techniques"],
    totalWatchSec: 3600,
    completedLessonsCount: 5,
    totalLessonsCount: 10,
    joinedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    status: "active",
    coursesTaken: [
      {
        courseId: "c-mm-01",
        courseCode: "MM-01",
        courseTitle: "Memory Techniques",
        purchasedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 90 * 86400000).toISOString(),
        daysLeft: 90,
        progressPct: 50,
        completedLessons: 5,
        totalLessons: 10,
        isExpired: false,
      },
    ],
    lessonWatches: [],
    recentActivity: [],
  },
  {
    id: "std-expired",
    name: "Snehal Shinde",
    email: "snehal.s@gmail.com",
    phone: "+91 98220 33333",
    district: "Kolhapur",
    taluka: "Karvir",
    school: "Kolhapur Vidyalaya",
    standard: "MPSC Aspirant",
    enrolledCourseCodes: ["MM-02"],
    enrolledCourseTitles: ["Vedic Maths"],
    totalWatchSec: 1800,
    completedLessonsCount: 3,
    totalLessonsCount: 10,
    joinedAt: new Date(Date.now() - 100 * 86400000).toISOString(),
    lastActiveAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    status: "active",
    coursesTaken: [
      {
        courseId: "c-mm-02",
        courseCode: "MM-02",
        courseTitle: "Vedic Maths",
        purchasedAt: new Date(Date.now() - 100 * 86400000).toISOString(),
        expiresAt: new Date(Date.now() - 10 * 86400000).toISOString(),
        daysLeft: 0,
        progressPct: 30,
        completedLessons: 3,
        totalLessons: 10,
        isExpired: true,
      },
    ],
    lessonWatches: [],
    recentActivity: [],
  },
];
