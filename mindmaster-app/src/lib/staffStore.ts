import {
  StaffUser,
  AuditLogEntry,
  Coupon,
  LessonWatchStat,
  StudentRecord,
  Course,
} from "./types";
import {
  INITIAL_STAFF_USERS,
  INITIAL_COUPONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_STAFF_COURSES,
  INITIAL_WATCH_STATS,
  INITIAL_STUDENTS,
} from "./mockStaffData";

const KEYS = {
  CURRENT_STAFF: "mma_current_staff",
  STAFF_USERS: "mma_staff_users",
  COUPONS: "mma_coupons",
  COURSES: "mma_staff_courses",
  AUDIT_LOGS: "mma_audit_logs",
  WATCH_STATS: "mma_watch_stats",
  STUDENTS: "mma_students",
};

const SERVER_MEM_STORE = new Map<string, any>();

function safeGetItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return SERVER_MEM_STORE.has(key) ? (SERVER_MEM_STORE.get(key) as T) : fallback;
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return fallback;
  }
}

function safeSetItem<T>(key: string, data: T): void {
  if (typeof window === "undefined") {
    SERVER_MEM_STORE.set(key, data);
    return;
  }
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error writing ${key} to storage:`, err);
  }
}

function safeAlert(msg: string): void {
  if (typeof window !== "undefined" && typeof (window as any).alert === "function") {
    (window as any).alert(msg);
  } else if (typeof global !== "undefined" && (global as any).alert) {
    (global as any).alert(msg);
  } else {
    console.warn("[Action Prevented]:", msg);
  }
}

// ----------------------------------------------------
// CURRENT ACTIVE STAFF SESSION
// ----------------------------------------------------
// ----------------------------------------------------
// CURRENT ACTIVE STAFF SESSION
// ----------------------------------------------------
export function getCurrentStaff(): StaffUser {
  const staff = safeGetItem<StaffUser>(KEYS.CURRENT_STAFF, INITIAL_STAFF_USERS[0]);
  if (staff && staff.role === "sub_admin") {
    staff.permissions = (staff.permissions || []).filter(
      (p) => p === "messages.manage" || p === "students.view"
    );
  }
  return staff;
}

export function setCurrentStaff(staff: StaffUser): void {
  if (staff && staff.role === "sub_admin") {
    staff.permissions = (staff.permissions || []).filter(
      (p) => p === "messages.manage" || p === "students.view"
    );
  }
  safeSetItem(KEYS.CURRENT_STAFF, staff);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("mma_staff_changed"));
  }
}

export function logoutStaff(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEYS.CURRENT_STAFF);
  window.dispatchEvent(new Event("mma_staff_changed"));
}

// ----------------------------------------------------
// AUDIT LOG (MANDATORY MUTATING ACTION TRACKER)
// ----------------------------------------------------
export function getAuditLogs(): AuditLogEntry[] {
  return safeGetItem<AuditLogEntry[]>(KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
}

export function logStaffAction(
  action: string,
  entityType: AuditLogEntry["entityType"],
  entityId: string,
  entityName: string,
  details: string
): void {
  const current = getCurrentStaff();
  const logs = getAuditLogs();
  const now = new Date();
  const formattedTime = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 8)}`;

  const newEntry: AuditLogEntry = {
    id: `aud-${Date.now()}`,
    staffId: current.id,
    staffName: current.name,
    staffRole: current.role,
    action,
    entityType,
    entityId,
    entityName,
    details,
    timestamp: formattedTime,
  };

  const updated = [newEntry, ...logs];
  safeSetItem(KEYS.AUDIT_LOGS, updated);
}

// ----------------------------------------------------
// STAFF CRUD (MAIN ADMIN ONLY)
// ----------------------------------------------------
export function getStaffUsers(): StaffUser[] {
  const users = safeGetItem<StaffUser[]>(KEYS.STAFF_USERS, INITIAL_STAFF_USERS);
  // Data migration: delete staff_permissions rows whose permission_key is not in (messages.manage, students.view)
  return users.map((u) => {
    if (u.role === "sub_admin") {
      return {
        ...u,
        permissions: (u.permissions || []).filter(
          (p) => p === "messages.manage" || p === "students.view"
        ),
      };
    }
    return u;
  });
}

export function saveStaffUser(staff: StaffUser): void {
  const current = getCurrentStaff();
  if (current.role !== "main_admin") {
    safeAlert("Unauthorized: Sub-admin CRUD requires main_admin authority.");
    return;
  }

  // Strictly sanitize sub-admin permissions to assignable whitelist only
  const sanitizedStaff = {
    ...staff,
    permissions:
      staff.role === "sub_admin"
        ? (staff.permissions || []).filter(
            (p) => p === "messages.manage" || p === "students.view"
          )
        : staff.permissions,
  };

  const users = getStaffUsers();
  const idx = users.findIndex((u) => u.id === sanitizedStaff.id);
  let updated: StaffUser[];
  let isNew = false;

  if (idx >= 0) {
    updated = [...users];
    updated[idx] = sanitizedStaff;
  } else {
    isNew = true;
    updated = [sanitizedStaff, ...users];
  }

  safeSetItem(KEYS.STAFF_USERS, updated);
  logStaffAction(
    isNew ? "SUBADMIN_CREATE" : "SUBADMIN_UPDATE",
    "subadmin",
    sanitizedStaff.id,
    sanitizedStaff.name,
    isNew
      ? `Added sub-admin with permissions [${sanitizedStaff.permissions.join(", ")}]`
      : `Updated permissions or status for ${sanitizedStaff.name}`
  );
}

export function toggleStaffStatus(staffId: string): void {
  const users = getStaffUsers();
  const target = users.find((u) => u.id === staffId || u.staffId === staffId);
  if (!target) return;

  // Root Owner MMA-000 is strictly unsuspendable
  if (target.role === "main_admin" || target.staffId === "MMA-000") {
    safeAlert("Unauthorized: Root Main Admin (MMA-000) is unsuspendable.");
    return;
  }

  const newStatus = target.status === "active" ? "suspended" : "active";
  const updated = users.map((u) =>
    u.id === target.id ? { ...u, status: newStatus as "active" | "suspended" } : u
  );
  safeSetItem(KEYS.STAFF_USERS, updated);

  // INSTANT SESSION KILL: If suspended user is currently logged in, terminate session immediately
  const current = getCurrentStaff();
  if (newStatus === "suspended" && (current.id === target.id || current.staffId === target.staffId)) {
    logoutStaff();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("mma_session_killed", { detail: { staffId: target.id } }));
    }
  }

  logStaffAction(
    newStatus === "suspended" ? "SUBADMIN_SUSPEND" : "SUBADMIN_ACTIVATE",
    "subadmin",
    target.id,
    target.name,
    newStatus === "suspended"
      ? `Suspended account for ${target.name} (${target.staffId || target.id}). Active sessions killed instantly.`
      : `Re-activated account for ${target.name} (${target.staffId || target.id}).`
  );

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("mma_staff_changed"));
  }
}

export function deleteStaffUser(staffId: string): void {
  const current = getCurrentStaff();
  if (current.role !== "main_admin") {
    safeAlert("Unauthorized: Only Main Admin can delete staff accounts.");
    return;
  }
  const users = getStaffUsers();
  const target = users.find((u) => u.id === staffId || u.staffId === staffId);
  if (!target) return;

  if (target.role === "main_admin") {
    safeAlert("Cannot delete root Main Admin account.");
    return;
  }

  const updated = users.filter((u) => u.id !== target.id && u.staffId !== target.staffId);
  safeSetItem(KEYS.STAFF_USERS, updated);

  // If deleted user was active in session, kill session
  if (current.id === target.id || current.staffId === target.staffId) {
    logoutStaff();
  }

  logStaffAction(
    "SUBADMIN_DELETE",
    "subadmin",
    target.id,
    target.name,
    `Main admin permanently removed sub-admin account ${target.staffId || target.id} (${target.name})`
  );

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("mma_staff_changed"));
  }
}

// ----------------------------------------------------
// PLATFORM SETTINGS (max_sub_admins, defaults, etc.)
// ----------------------------------------------------
export interface PlatformSettings {
  max_sub_admins: number;
  default_access_months: number;
  default_video_live_days: number;
  default_coupon_days: number;
  renewal_coupon_percent: number;
  reminder_template: string;
  maintenance: boolean;
  youtube_api_key?: string;
}

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  max_sub_admins: 50,
  default_access_months: 3,
  default_video_live_days: 30,
  default_coupon_days: 7,
  renewal_coupon_percent: 50,
  reminder_template:
    "Namaskar {name}, your access to {course} will expire in {days} days. Renew today to get {percent}% off!",
  maintenance: false,
  youtube_api_key: "",
};

export function getPlatformSettings(): PlatformSettings {
  return safeGetItem<PlatformSettings>("mma_settings", DEFAULT_PLATFORM_SETTINGS);
}

export function savePlatformSettings(settings: PlatformSettings): void {
  safeSetItem("mma_settings", settings);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("mma_settings_changed"));
  }
  logStaffAction(
    "SETTINGS_UPDATE",
    "settings",
    "platform_settings",
    "Platform Settings",
    `Updated platform settings: max_sub_admins=${settings.max_sub_admins}, maintenance=${settings.maintenance}`
  );
}

// ----------------------------------------------------
// COURSES WITH TARGET SEGMENT & SCHEDULING
// ----------------------------------------------------
export function getStaffCourses(): Course[] {
  return safeGetItem<Course[]>(KEYS.COURSES, INITIAL_STAFF_COURSES);
}

export function saveStaffCourse(course: Course): void {
  const courses = getStaffCourses();
  const idx = courses.findIndex((c) => c.id === course.id);
  let updated: Course[];
  let isNew = false;

  if (idx >= 0) {
    updated = [...courses];
    updated[idx] = course;
  } else {
    isNew = true;
    updated = [course, ...courses];
  }

  safeSetItem(KEYS.COURSES, updated);
  logStaffAction(
    isNew ? "COURSE_CREATE" : "COURSE_UPDATE",
    "course",
    course.id,
    course.title,
    `Saved course (Segment: ${course.targetSegment || "general"}, Status: ${course.status})`
  );
}

export function deleteStaffCourse(courseId: string): void {
  const current = getCurrentStaff();
  if (current.role !== "main_admin") {
    safeAlert("Unauthorized: Only Main Admin can delete courses.");
    return;
  }
  const courses = getStaffCourses();
  const target = courses.find((c) => c.id === courseId);
  if (!target) return;

  const updated = courses.filter((c) => c.id !== courseId);
  safeSetItem(KEYS.COURSES, updated);
  logStaffAction(
    "COURSE_DELETE",
    "course",
    target.id,
    target.title,
    `Main admin permanently removed course`
  );
}

// ----------------------------------------------------
// ADVANCED COUPONS
// ----------------------------------------------------
export function getStaffCoupons(): Coupon[] {
  return safeGetItem<Coupon[]>(KEYS.COUPONS, INITIAL_COUPONS);
}

export function saveStaffCoupon(coupon: Coupon): void {
  const coupons = getStaffCoupons();
  const idx = coupons.findIndex((c) => c.id === coupon.id);
  let updated: Coupon[];
  let isNew = false;

  if (idx >= 0) {
    updated = [...coupons];
    updated[idx] = coupon;
  } else {
    isNew = true;
    updated = [coupon, ...coupons];
  }

  safeSetItem(KEYS.COUPONS, updated);
  logStaffAction(
    isNew ? "COUPON_CREATE" : "COUPON_UPDATE",
    "coupon",
    coupon.id,
    coupon.code,
    `Saved coupon: Scope=${coupon.appliesTo}, UsageLimit=${coupon.usageLimitPerUser}, Validity=${coupon.validityType}`
  );
}

export function deleteStaffCoupon(couponId: string): void {
  const current = getCurrentStaff();
  if (current.role !== "main_admin") {
    safeAlert("Unauthorized: Only Main Admin can delete coupons.");
    return;
  }
  const coupons = getStaffCoupons();
  const target = coupons.find((c) => c.id === couponId);
  if (!target) return;

  const updated = coupons.filter((c) => c.id !== couponId);
  safeSetItem(KEYS.COUPONS, updated);
  logStaffAction(
    "COUPON_DELETE",
    "coupon",
    target.id,
    target.code,
    `Main admin permanently deleted coupon`
  );
}

// ----------------------------------------------------
// LESSON WATCH STATS & TRACKING
// ----------------------------------------------------
export function getLessonWatchStats(): LessonWatchStat[] {
  return safeGetItem<LessonWatchStat[]>(KEYS.WATCH_STATS, INITIAL_WATCH_STATS);
}

// ----------------------------------------------------
// STUDENTS REPOSITORY & IN-APP NOTIFICATION (NO WHATSAPP)
// ----------------------------------------------------
export function getStaffStudents(): StudentRecord[] {
  return safeGetItem<StudentRecord[]>(KEYS.STUDENTS, INITIAL_STUDENTS);
}

export function sendInAppNotification(studentId: string, title: string, message: string): void {
  const students = getStaffStudents();
  const target = students.find((s) => s.id === studentId);
  const studentName = target ? target.name : "All Students";

  if (typeof window !== "undefined") {
    try {
      const { addStudentNotification } = require("./studentNotificationStore");
      addStudentNotification({
        userId: studentId,
        title,
        body: message,
        type: "reminder",
        actionUrl: "/my-courses",
      });
    } catch {}
  }

  logStaffAction(
    "IN_APP_NOTIFICATION_SENT",
    "student",
    studentId,
    studentName,
    `Sent in-app notification: "${title}" - ${message}`
  );
}
