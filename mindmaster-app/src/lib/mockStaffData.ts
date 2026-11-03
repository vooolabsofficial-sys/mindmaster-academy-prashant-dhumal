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
    email: "subadmin@mindmasteredu.in",
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
    email: "sneha.support@mindmasteredu.in",
    phone: "+91 97650 98765",
    role: "sub_admin",
    permissions: [],
    status: "active",
    lastLoginAt: new Date().toISOString(),
    mustChangePassword: false,
    password: "Staff@2026",
  },
  {
    id: "staff-mma-admin",
    staffId: "MMA-999",
    name: "System Co-Admin (Technical)",
    email: "admin@mindmasteredu.in",
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
    mustChangePassword: false,
    password: "Admin@2026",
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

// Production Clean Slate: 0 Fake Students (Real learners load strictly from Supabase)
export const INITIAL_STUDENTS: StudentRecord[] = [];
