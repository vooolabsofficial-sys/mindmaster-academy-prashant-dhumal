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
    mustChangePassword: false,
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
      "freegrant.manage",
    ],
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

// Production Clean Slate: 0 Fake Students
export const INITIAL_STUDENTS: StudentRecord[] = [];
