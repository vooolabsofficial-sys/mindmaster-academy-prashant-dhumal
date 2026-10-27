import {
  StaffUser,
  AuditLogEntry,
  Coupon,
  LessonWatchStat,
  StudentRecord,
  Course,
  Book,
} from "./types";
import {
  INITIAL_STAFF_USERS,
  INITIAL_COUPONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_STAFF_COURSES,
  INITIAL_WATCH_STATS,
  INITIAL_STUDENTS,
} from "./mockStaffData";
import { recordServerAuditLog } from "./auditLogger";
import { normalizePhone } from "./phoneUtils";

export type StaffCourse = Course;

function getSupabase() {
  try {
    if (typeof window === "undefined") {
      const { createAdminClient } = require("./supabase/admin");
      return createAdminClient();
    } else {
      const { createClient } = require("./supabase/client");
      return createClient();
    }
  } catch {
    return null;
  }
}

const KEYS = {
  CURRENT_STAFF: "mma_current_staff",
  STAFF_USERS: "mma_staff_users",
  COUPONS: "mma_coupons",
  COURSES: "mma_staff_courses",
  BOOKS: "mma_staff_books",
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
      (p) => p === "messages.manage" || p === "students.view" || p === "freegrant.manage"
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
  return safeGetItem<AuditLogEntry[]>(KEYS.AUDIT_LOGS, []);
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
    staffId: current.staffId || current.id,
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
  recordServerAuditLog({
    staff_id: newEntry.staffId,
    staff_name: newEntry.staffName,
    staff_role: newEntry.staffRole,
    action: newEntry.action,
    entity_type: newEntry.entityType,
    entity_id: newEntry.entityId,
    entity_name: newEntry.entityName,
    meta: { entityName, staffName: current.name, details },
  });

  const supabase = getSupabase();
  if (supabase) {
    try {
      supabase.from("audit_log").insert({
        staff_id: current.staffId || current.id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details,
        meta: { entityName, staffName: current.name, timestamp: formattedTime },
        at: now.toISOString(),
        created_at: now.toISOString(),
      }).then(({ error }: any) => {
        if (error) console.warn("Supabase audit log insert error:", error.message);
      });
    } catch {}
  }
}

// ----------------------------------------------------
// STAFF CRUD (MAIN ADMIN ONLY)
// ----------------------------------------------------
export function getStaffUsers(): StaffUser[] {
  const users = safeGetItem<StaffUser[]>(KEYS.STAFF_USERS, INITIAL_STAFF_USERS);
  // Data migration: delete staff_permissions rows whose permission_key is not in (messages.manage, students.view, freegrant.manage)
  return users.map((u) => {
    if (u.role === "sub_admin") {
      return {
        ...u,
        permissions: (u.permissions || []).filter(
          (p) => p === "messages.manage" || p === "students.view" || p === "freegrant.manage"
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
            (p) => p === "messages.manage" || p === "students.view" || p === "freegrant.manage"
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

  const supabase = getSupabase();
  if (supabase) {
    try {
      supabase.from("staff_accounts").upsert({
        staff_id: sanitizedStaff.staffId || sanitizedStaff.id,
        full_name: sanitizedStaff.name,
        phone: normalizePhone(sanitizedStaff.phone),
        role: sanitizedStaff.role,
        password_hash: sanitizedStaff.password || "$argon2id$v=19$m=65536,t=3,p=1$JrNHmszER1RNPWUBVM/8zg$3MRAw0LH9c4FBd+8N6lhF19AYm3MZ/x/5jEZqA/d1LM",
        must_change_password: Boolean(sanitizedStaff.mustChangePassword),
        status: sanitizedStaff.status === "suspended" ? "suspended" : "active",
        created_by: current.staffId || "MMA-000",
      }, { onConflict: "staff_id" }).then(async ({ error }: any) => {
        if (!error && sanitizedStaff.permissions) {
          await supabase.from("staff_permissions").delete().eq("staff_id", sanitizedStaff.staffId || sanitizedStaff.id);
          const perms = sanitizedStaff.permissions.map((p) => ({
            staff_id: sanitizedStaff.staffId || sanitizedStaff.id,
            permission_key: p,
          }));
          if (perms.length > 0) {
            await supabase.from("staff_permissions").insert(perms);
          }
        }
      });
    } catch {}
  }
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

  const supabase = getSupabase();
  if (supabase) {
    try {
      supabase.from("staff_accounts").update({ status: newStatus }).or(`id.eq.${target.id},staff_id.eq.${target.staffId || target.id}`).then(() => {});
    } catch {}
  }

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

  const supabase = getSupabase();
  if (supabase) {
    try {
      supabase.from("staff_accounts").delete().or(`id.eq.${target.id},staff_id.eq.${target.staffId || target.id}`).then(() => {});
    } catch {}
  }

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
  razorpay_key_id?: string;
  razorpay_key_secret?: string;
  razorpay_mode?: "live" | "test";
  concurrent_devices?: number;
  auto_send_reminders?: boolean;
  academy_title?: string;
  founder_name?: string;
  centre_address?: string;
  support_phone?: string;
  support_email?: string;
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
  razorpay_key_id: "rzp_live_8F91kM4892482",
  razorpay_key_secret: "sec_live_99d14a2f8b894ce12a",
  razorpay_mode: "live",
  concurrent_devices: 1,
  auto_send_reminders: true,
  academy_title: "MindMaster Academy",
  founder_name: "Prashant Dhumal",
  centre_address: "Narhe Centre Desk, Pune, Maharashtra 411041",
  support_phone: "+91 84593 44077",
  support_email: "mindmasterdhumal@gmail.com",
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

  const supabase = getSupabase();
  if (supabase) {
    try {
      supabase.from("settings").upsert({
        id: 1,
        max_sub_admins: settings.max_sub_admins ?? 50,
        default_access_months: settings.default_access_months ?? 3,
        default_video_live_days: settings.default_video_live_days ?? 30,
        default_coupon_days: settings.default_coupon_days ?? 7,
        renewal_coupon_percent: settings.renewal_coupon_percent ?? 50,
        reminder_template: settings.reminder_template || DEFAULT_PLATFORM_SETTINGS.reminder_template,
        maintenance: Boolean(settings.maintenance),
        youtube_api_key: settings.youtube_api_key || null,
        razorpay_key_id: settings.razorpay_key_id || "rzp_live_8F91kM4892482",
        razorpay_key_secret: settings.razorpay_key_secret || "sec_live_99d14a2f8b894ce12a",
        razorpay_mode: settings.razorpay_mode || "live",
        concurrent_devices: settings.concurrent_devices ?? 1,
        auto_send_reminders: settings.auto_send_reminders ?? true,
        academy_title: settings.academy_title || "MindMaster Academy",
        founder_name: settings.founder_name || "Prashant Dhumal",
        centre_address: settings.centre_address || "Narhe Centre Desk, Pune, Maharashtra 411041",
        support_phone: settings.support_phone || "+91 84593 44077",
        support_email: settings.support_email || "mindmasterdhumal@gmail.com",
        updated_at: new Date().toISOString(),
      }).then(({ error }: any) => {
        if (error) console.warn("Supabase settings upsert error:", error.message);
      });
    } catch {}
  }
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
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("mma_courses_changed"));
  }
  logStaffAction(
    isNew ? "COURSE_CREATE" : "COURSE_UPDATE",
    "course",
    course.id,
    course.title,
    `Saved course (Segment: ${course.targetSegment || "general"}, Status: ${course.status})`
  );

  const supabase = getSupabase();
  if (supabase) {
    try {
      supabase.from("courses").upsert({
        code: course.code,
        title: course.title,
        title_mr: course.titleMr || course.title,
        subtitle: course.subtitle || null,
        description: course.description || "",
        header_tint: course.headerTint || "sky",
        price_paise: course.pricePaise || 0,
        original_price_paise: course.originalPricePaise || course.pricePaise || 0,
        is_free: Boolean(course.isFree),
        access_months: course.accessMonths || 3,
        status: course.status === "scheduled" ? "draft" : (course.status || "live"),
        target_segment: course.targetSegment || "general",
        standards: course.standards || null,
        publish_at: course.publishAt || null,
        remove_at: course.removeAt || null,
        badge_text: course.badgeText || null,
        badge_type: course.badgeType || null,
        image_src: course.imageSrc || null,
        instructor_name: course.instructorName || "Prashant Dhumal Sir",
        instructor_title: course.instructorTitle || "International Memory Trainer & Author",
        category: course.category || "memory",
        features: course.features || [],
      }, { onConflict: "code" }).then(({ error }: any) => {
        if (error) console.warn("Supabase course upsert error:", error.message);
      });
    } catch {}
  }
}

export function toggleCourseStatus(courseId: string): void {
  const courses = getStaffCourses();
  const target = courses.find((c) => c.id === courseId);
  if (!target) return;

  const newStatus = target.status === "live" ? "draft" : "live";
  const updated = courses.map((c) =>
    c.id === courseId ? { ...c, status: newStatus as any } : c
  );

  safeSetItem(KEYS.COURSES, updated);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("mma_courses_changed"));
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      supabase.from("courses").update({ status: newStatus }).or(`id.eq.${target.id},code.eq.${target.code}`).then(() => {});
    } catch {}
  }

  logStaffAction(
    "COURSE_UPDATE",
    "course",
    target.id,
    target.title,
    `Changed course status to ${newStatus}`
  );
}

export async function saveCourseToSupabase(course: Course): Promise<{ data: Course | null; error: any }> {
  // Update local cache synchronously for instant UI update
  saveStaffCourse(course);

  const supabase = getSupabase();
  if (!supabase) return { data: course, error: null };

  try {
    const payload: any = {
      code: course.code,
      title: course.title,
      title_mr: course.titleMr || course.title,
      subtitle: course.subtitle || null,
      description: course.description || "",
      header_tint: course.headerTint || "sky",
      price_paise: course.pricePaise || 0,
      original_price_paise: course.originalPricePaise || course.pricePaise || 0,
      is_free: Boolean(course.isFree),
      access_months: course.accessMonths || 3,
      status: course.status === "scheduled" ? "draft" : (course.status || "live"),
      target_segment: course.targetSegment || "general",
      standards: course.standards || null,
      publish_at: course.publishAt || null,
      remove_at: course.removeAt || null,
      badge_text: course.badgeText || null,
      badge_type: course.badgeType || null,
      image_src: course.imageSrc || null,
      instructor_name: course.instructorName || "Prashant Dhumal Sir",
      instructor_title: course.instructorTitle || "International Memory Trainer & Author",
      category: course.category || "memory",
      features: course.features || [],
    };

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(course.id);
    if (isUuid) {
      payload.id = course.id;
    }

    const { data, error } = await supabase
      .from("courses")
      .upsert(payload, { onConflict: "code" })
      .select()
      .single();

    if (error) {
      console.warn("Supabase saveCourseToSupabase error:", error);
      return { data: null, error };
    }

    if (data) {
      const savedCourse: Course = {
        ...course,
        id: data.id,
      };
      saveStaffCourse(savedCourse);
      return { data: savedCourse, error: null };
    }

    return { data: course, error: null };
  } catch (err: any) {
    console.warn("Supabase course exception:", err);
    return { data: null, error: err };
  }
}

export async function deleteCourseFromSupabase(courseId: string): Promise<boolean> {
  deleteStaffCourse(courseId);
  const supabase = getSupabase();
  if (!supabase) return true;
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseId);
    let q = supabase.from("courses").delete();
    if (isUuid) {
      q = q.or(`id.eq.${courseId},code.eq.${courseId}`);
    } else {
      q = q.eq("code", courseId);
    }
    const { error } = await q;
    if (error) console.warn("Supabase deleteCourseFromSupabase error:", error);
    return !error;
  } catch {
    return false;
  }
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
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("mma_courses_changed"));
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      supabase.from("courses").delete().or(`id.eq.${courseId},code.eq.${courseId}`).then(({ error }: any) => {
        if (error) console.warn("Supabase course delete error:", error.message);
      });
    } catch {}
  }

    logStaffAction(
      "COURSE_DELETE",
      "course",
      target.id,
      target.title,
      `Main admin permanently removed course`
    );
}

// ----------------------------------------------------
// DIGITAL BOOKS & STUDY MATERIAL STORE
// ----------------------------------------------------
export function getStaffBooks(): Book[] {
  return safeGetItem<Book[]>(KEYS.BOOKS, []);
}

export function saveStaffBook(book: Book): void {
  const books = getStaffBooks();
  const idx = books.findIndex((b) => b.id === book.id || (book.code && b.code === book.code));
  let updated: Book[];
  let isNew = false;
  if (idx >= 0) {
    updated = [...books];
    updated[idx] = { ...updated[idx], ...book };
  } else {
    isNew = true;
    updated = [book, ...books];
  }
  safeSetItem(KEYS.BOOKS, updated);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("mma_books_changed"));
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      supabase.from("books").upsert({
        code: book.code || `BK-${Date.now().toString().slice(-4)}`,
        course_id: book.courseId || null,
        title: book.title,
        subtitle: book.subtitle || null,
        description: book.description || null,
        file_path: book.filePath,
        pages: book.pages || 1,
        file_size_mb: book.fileSizeMb || 5.0,
        cover_image: book.coverImage || null,
        is_free: Boolean(book.isFree),
        price_paise: book.pricePaise || 0,
        original_price_paise: book.originalPricePaise || 0,
        access_months: book.accessMonths || 6,
        status: book.status || "live",
        header_tint: book.headerTint || "sky",
        badge_text: book.badgeText || null,
      }, { onConflict: "code" }).then(({ error }: any) => {
        if (error) console.warn("Supabase book upsert error:", error.message);
      });
    } catch {}
  }

  logStaffAction(
    isNew ? "BOOK_CREATE" : "BOOK_UPDATE",
    "course",
    book.id,
    book.title,
    isNew
      ? `Created digital book "${book.title}" (${book.isFree ? "Free" : "₹" + Math.round((book.pricePaise || 0) / 100)})`
      : `Updated digital book "${book.title}"`
  );
}

export function deleteStaffBook(bookId: string): void {
  const current = getCurrentStaff();
  if (current.role !== "main_admin") {
    safeAlert("Unauthorized: Only Main Admin can delete books.");
    return;
  }
  const books = getStaffBooks();
  const target = books.find((b) => b.id === bookId);
  if (!target) return;

  const updated = books.filter((b) => b.id !== bookId);
  safeSetItem(KEYS.BOOKS, updated);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("mma_books_changed"));
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      supabase.from("books").delete().or(`id.eq.${bookId},code.eq.${bookId}`).then(({ error }: any) => {
        if (error) console.warn("Supabase book delete error:", error.message);
      });
    } catch {}
  }

  logStaffAction(
    "BOOK_DELETE",
    "course",
    target.id,
    target.title,
    `Main admin permanently removed book "${target.title}"`
  );
}

export async function saveBookToSupabase(book: Book): Promise<{ data: any; error: any }> {
  saveStaffBook(book);
  const supabase = getSupabase();
  if (!supabase) return { data: book, error: null };
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(book.id);
    const dbRecord: any = {
      code: book.code || `BK-${Date.now().toString().slice(-4)}`,
      course_id: book.courseId || null,
      title: book.title,
      subtitle: book.subtitle || null,
      description: book.description || null,
      file_path: book.filePath,
      pages: book.pages || 1,
      file_size_mb: book.fileSizeMb || 5.0,
      cover_image: book.coverImage || null,
      is_free: Boolean(book.isFree),
      price_paise: book.pricePaise || 0,
      original_price_paise: book.originalPricePaise || 0,
      access_months: book.accessMonths || 6,
      status: book.status || "live",
      header_tint: book.headerTint || "sky",
      badge_text: book.badgeText || null,
    };
    if (isUuid) {
      dbRecord.id = book.id;
    }
    const res = await supabase.from("books").upsert(dbRecord, { onConflict: "code" });
    if (res.error) {
      console.warn("saveBookToSupabase error:", res.error.message);
    }
    return res;
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function deleteBookFromSupabase(bookId: string): Promise<boolean> {
  deleteStaffBook(bookId);
  const supabase = getSupabase();
  if (!supabase) return true;
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bookId);
    let q = supabase.from("books").delete();
    if (isUuid) {
      q = q.or(`id.eq.${bookId},code.eq.${bookId}`);
    } else {
      q = q.eq("code", bookId);
    }
    const { error } = await q;
    if (error) {
      console.warn("deleteBookFromSupabase error:", error.message);
    }
    return !error;
  } catch {
    return false;
  }
}

export async function toggleBookStatus(bookId: string): Promise<void> {
  const books = getStaffBooks();
  const target = books.find((b) => b.id === bookId);
  if (!target) return;

  const newStatus = target.status === "live" ? "draft" : "live";
  const updated = books.map((b) =>
    b.id === bookId ? { ...b, status: newStatus as "live" | "draft" } : b
  );
  safeSetItem(KEYS.BOOKS, updated);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("mma_books_changed"));
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from("books").update({ status: newStatus }).or(`id.eq.${bookId},code.eq.${bookId}`);
    } catch {}
  }

  logStaffAction(
    "BOOK_UPDATE",
    "course",
    target.id,
    target.title,
    `Changed book status to ${newStatus}`
  );
}

export async function toggleBookPricing(bookId: string): Promise<void> {
  const books = getStaffBooks();
  const target = books.find((b) => b.id === bookId);
  if (!target) return;

  const newIsFree = !target.isFree;
  const updated = books.map((b) =>
    b.id === bookId ? { ...b, isFree: newIsFree } : b
  );
  safeSetItem(KEYS.BOOKS, updated);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("mma_books_changed"));
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from("books").update({ is_free: newIsFree }).or(`id.eq.${bookId},code.eq.${bookId}`);
    } catch {}
  }

  logStaffAction(
    "BOOK_UPDATE",
    "course",
    target.id,
    target.title,
    `Toggled book pricing to ${newIsFree ? "Free" : "Paid"}`
  );
}

export function saveStaffStudent(student: StudentRecord): void {
  const students = getStaffStudents();
  const idx = students.findIndex((s) => s.id === student.id || s.phone === student.phone);
  let updated: StudentRecord[];
  if (idx >= 0) {
    updated = [...students];
    updated[idx] = { ...updated[idx], ...student };
  } else {
    updated = [student, ...students];
  }
  safeSetItem(KEYS.STUDENTS, updated);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("mma_students_changed"));
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      const cleanPhone = normalizePhone(student.phone);
      supabase.from("profiles").upsert({
        phone: cleanPhone,
        full_name: student.name,
        village: student.taluka || "",
        taluka: student.taluka || "",
        district: student.district || "",
        school_name: student.school || "",
        school: student.school || "",
        role: "student",
      }, { onConflict: "phone" }).then(({ error }: any) => {
        if (error) console.warn("Supabase profile upsert error:", error.message);
      });
    } catch {}
  }
}

export async function updateStudentProfileCascading(
  oldPhone: string,
  newProfile: { name: string; phone: string; district: string; taluka?: string; school?: string }
): Promise<{ success: boolean; error?: string }> {
  const oldClean = normalizePhone(oldPhone);
  const newClean = normalizePhone(newProfile.phone);

  if (!newClean || newClean.length !== 10) {
    return { success: false, error: "Please enter a valid 10-digit mobile number." };
  }

  // 1. Update in-memory / local storage students
  const students = getStaffStudents();
  const student = students.find((s) => normalizePhone(s.phone) === oldClean);
  if (student) {
    student.name = newProfile.name.trim();
    student.phone = newClean;
    student.district = newProfile.district.trim();
    if (newProfile.taluka !== undefined) student.taluka = newProfile.taluka.trim();
    if (newProfile.school !== undefined) student.school = newProfile.school.trim();
    saveStaffStudent(student);
  }

  // 2. Cascade across course_grants & grant purchases in local storage
  if (typeof window !== "undefined") {
    try {
      const rawGrants = localStorage.getItem("mma_grants");
      if (rawGrants) {
        const grants = JSON.parse(rawGrants);
        const updatedGrants = grants.map((g: any) => {
          if (
            normalizePhone(g.scope_value || g.scopeValue || "") === oldClean ||
            normalizePhone(g.student_phone || g.studentPhone || "") === oldClean
          ) {
            return {
              ...g,
              scope_value: newClean,
              scopeValue: newClean,
              student_phone: newClean,
              studentPhone: newClean,
              student_name: newProfile.name.trim(),
              studentName: newProfile.name.trim(),
            };
          }
          return g;
        });
        localStorage.setItem("mma_grants", JSON.stringify(updatedGrants));
      }

      const rawPurchases = localStorage.getItem("mma_grant_purchases");
      if (rawPurchases) {
        const purchases = JSON.parse(rawPurchases);
        const updatedPurchases = purchases.map((p: any) => {
          if (normalizePhone(p.studentPhone || p.student_phone || "") === oldClean) {
            return {
              ...p,
              studentPhone: newClean,
              student_phone: newClean,
              studentName: newProfile.name.trim(),
              student_name: newProfile.name.trim(),
            };
          }
          return p;
        });
        localStorage.setItem("mma_grant_purchases", JSON.stringify(updatedPurchases));
      }

      const rawAccounts = localStorage.getItem("mma_student_accounts");
      if (rawAccounts) {
        const accounts = JSON.parse(rawAccounts);
        const updatedAccounts = accounts.map((a: any) => {
          if (normalizePhone(a.cleanPhone || a.phone || "") === oldClean) {
            return {
              ...a,
              phone: `+91${newClean}`,
              cleanPhone: newClean,
              full_name: newProfile.name.trim(),
              district: newProfile.district.trim(),
              taluka: newProfile.taluka?.trim() || a.taluka,
              school_name: newProfile.school?.trim() || a.school_name,
            };
          }
          return a;
        });
        localStorage.setItem("mma_student_accounts", JSON.stringify(updatedAccounts));
      }
    } catch (e) {
      console.warn("Local storage cascading error:", e);
    }
  }

  // 3. Supabase Cascading Updates: profiles, course_grants, video_likes
  const supabase = getSupabase();
  if (supabase) {
    try {
      // a) Profiles
      await supabase
        .from("profiles")
        .update({
          phone: newClean,
          full_name: newProfile.name.trim(),
          district: newProfile.district.trim(),
          taluka: newProfile.taluka?.trim() || "",
          school_name: newProfile.school?.trim() || "",
          school: newProfile.school?.trim() || "",
        })
        .eq("phone", oldClean);

      // b) Course Grants
      await supabase
        .from("course_grants")
        .update({
          student_phone: newClean,
          student_name: newProfile.name.trim(),
        })
        .eq("student_phone", oldClean);

      // c) Video Likes
      await supabase
        .from("video_likes")
        .update({
          user_phone: newClean,
        })
        .eq("user_phone", oldClean);
    } catch (err: any) {
      console.warn("Supabase cascading update error:", err?.message);
    }
  }

  // 4. Log to Audit Log
  logStaffAction(
    "STUDENT_PROFILE_UPDATE",
    "student",
    newClean,
    newProfile.name,
    `Cascading profile update: ${oldClean} -> ${newClean}, Name: ${newProfile.name}, District: ${newProfile.district}. Synchronized across profiles, course_grants, and video_likes.`
  );

  return { success: true };
}

// ----------------------------------------------------
// ADVANCED COUPONS
// ----------------------------------------------------
export function getStaffCoupons(): Coupon[] {
  return safeGetItem<Coupon[]>(KEYS.COUPONS, INITIAL_COUPONS);
}

export function clearAllStaffCoupons(): void {
  safeSetItem(KEYS.COUPONS, []);
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("mma_coupon_redemptions");
    } catch {}
  }
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
    `Saved coupon: Scope=${coupon.appliesTo}, UsageLimit=${coupon.usageLimitPerUser}, Validity=${coupon.validityType}${coupon.school ? `, School=${coupon.school}` : ""}`
  );

  const supabase = getSupabase();
  if (supabase) {
    try {
      supabase.from("coupons").upsert({
        code: coupon.code.toUpperCase(),
        discount_type: coupon.discountType === "flat" ? "flat" : "percent",
        value: coupon.discountValue || 0,
        usage_limit: coupon.maxTotalUses || coupon.usage_limit || 100,
        used_count: coupon.totalUsed || coupon.used_count || 0,
        is_active: coupon.is_active !== false && coupon.status !== "disabled",
        status: coupon.status || "active",
        applies_all: coupon.appliesTo === "all" || coupon.applies_all !== false,
        school: coupon.school || null,
        min_order_value_paise: coupon.minOrderValuePaise || 0,
        starts_at: coupon.starts_at || null,
        ends_at: coupon.ends_at || null,
      }, { onConflict: "code" }).select("id").maybeSingle().then(async ({ data: dbCpn, error }: any) => {
        if (!error && dbCpn?.id) {
          if (coupon.selectedCourseIds && coupon.selectedCourseIds.length > 0) {
            await supabase.from("coupon_courses").delete().eq("coupon_id", dbCpn.id);
            const courseRows = coupon.selectedCourseIds.filter((id) => id.length === 36).map((cid) => ({ coupon_id: dbCpn.id, course_id: cid }));
            if (courseRows.length > 0) await supabase.from("coupon_courses").insert(courseRows);
          }
          if (coupon.selectedBookIds && coupon.selectedBookIds.length > 0) {
            await supabase.from("coupon_books").delete().eq("coupon_id", dbCpn.id);
            const bookRows = coupon.selectedBookIds.filter((id) => id.length === 36).map((bid) => ({ coupon_id: dbCpn.id, book_id: bid }));
            if (bookRows.length > 0) await supabase.from("coupon_books").insert(bookRows);
          }
        }
      });
    } catch {}
  }
}

export function toggleStaffCouponStatus(couponId: string): Coupon | undefined {
  const coupons = getStaffCoupons();
  const target = coupons.find((c) => c.id === couponId);
  if (!target) return undefined;

  const newStatus = target.status === "active" ? "paused" : "active";
  const updatedCoupon: Coupon = {
    ...target,
    status: newStatus,
    is_active: newStatus === "active",
  };

  saveStaffCoupon(updatedCoupon);
  return updatedCoupon;
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

  const supabase = getSupabase();
  if (supabase) {
    try {
      supabase.from("coupons").delete().or(`id.eq.${couponId},code.eq.${couponId}`).then(({ error }: any) => {
        if (error) console.warn("Supabase coupon delete error:", error.message);
      });
    } catch {}
  }
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
  return safeGetItem<StudentRecord[]>(KEYS.STUDENTS, []);
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

// ----------------------------------------------------
// DIRECT SUPABASE DB ASYNC FETCHERS & HYDRATION
// ----------------------------------------------------
export async function fetchDbCourses(): Promise<Course[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return getStaffCourses();
    const { data, error } = await supabase.from("courses").select("*").order("created_at", { ascending: true });
    if (error || !data) return getStaffCourses();
    const mapped: Course[] = data.map((d: any) => ({
      id: d.id,
      code: d.code,
      title: d.title,
      titleMr: d.title_mr || d.title,
      subtitle: d.subtitle || "",
      description: d.description || "",
      headerTint: d.header_tint || "sky",
      pricePaise: Number(d.price_paise) || 0,
      originalPricePaise: Number(d.original_price_paise) || Number(d.price_paise) || 0,
      isFree: Boolean(d.is_free),
      accessMonths: d.access_months || 3,
      status: d.status || "live",
      targetSegment: d.target_segment || "general",
      standards: d.standards || undefined,
      publishAt: d.publish_at || undefined,
      removeAt: d.remove_at || undefined,
      badgeText: d.badge_text || undefined,
      badgeType: d.badge_type || undefined,
      imageSrc: d.image_src || "/assets/images/memory_seminar_brain_3d.png",
      instructorName: d.instructor_name || "Prashant Dhumal Sir",
      instructorTitle: d.instructor_title || "International Memory Trainer & Author",
      totalStudents: d.total_students || 0,
      rating: Number(d.rating) || 5.0,
      ratingCount: d.rating_count || 0,
      lessonsCount: d.lessons_count || 0,
      totalDurationHours: Number(d.total_duration_hours) || 0,
      category: d.category || "memory",
      features: d.features || [],
    }));
    safeSetItem(KEYS.COURSES, mapped);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("mma_courses_changed"));
    }
    return mapped;
  } catch {
    return getStaffCourses();
  }
}

export async function fetchDbCoupons(): Promise<Coupon[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return getStaffCoupons();
    const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    if (error || !data) return getStaffCoupons();
    const mapped: Coupon[] = data.map((c: any) => ({
      id: c.id,
      code: c.code,
      discountType: c.discount_type === "flat" ? "flat" : "percentage",
      discountValue: c.value,
      appliesTo: c.applies_all ? "all" : "selected",
      applies_all: Boolean(c.applies_all),
      usageLimitPerUser: (c.per_user_usage === 1 || c.per_user_usage === "once") ? "once" : "multiple",
      validityType: "date_range",
      starts_at: c.starts_at ? c.starts_at.slice(0, 10) : undefined,
      ends_at: c.ends_at ? c.ends_at.slice(0, 10) : undefined,
      maxTotalUses: c.usage_limit || 100,
      status: c.status || (c.is_active ? "active" : "disabled"),
      is_active: Boolean(c.is_active),
      totalUsed: c.used_count || 0,
      school: c.school || undefined,
      minOrderValuePaise: Number(c.min_order_value_paise) || 0,
    }));
    safeSetItem(KEYS.COUPONS, mapped);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("mma_coupons_changed"));
    }
    return mapped;
  } catch {
    return getStaffCoupons();
  }
}

export async function fetchDbStudents(): Promise<StudentRecord[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return getStaffStudents();

    // Fetch profiles with purchases and progress
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*, purchases(id, course_id, book_id, expires_at, status, item_type), progress(lesson_id, completed)")
      .order("created_at", { ascending: false });

    if (error || !profiles) return getStaffStudents();

    // Cache courses and books
    const allCourses = getStaffCourses();
    const allBooks = getStaffBooks();
    const coursesMap = new Map<string, any>(allCourses.map((c) => [c.id, c]));
    allCourses.forEach((c) => {
      if (c.code) coursesMap.set(c.code, c);
    });
    const booksMap = new Map<string, any>(allBooks.map((b) => [b.id, b]));
    allBooks.forEach((b) => {
      if (b.code) booksMap.set(b.code, b);
    });

    // Fetch active course grants to merge offline admissions
    let grants: any[] = [];
    try {
      const { data: grantsData } = await supabase
        .from("course_grants")
        .select("*")
        .eq("status", "active");
      if (grantsData) grants = grantsData;
    } catch {}

    const grantsByPhone = new Map<string, any[]>();
    grants.forEach((g) => {
      const p = normalizePhone(g.student_phone);
      if (!grantsByPhone.has(p)) grantsByPhone.set(p, []);
      grantsByPhone.get(p)!.push(g);
    });

    const nowMs = Date.now();

    const mapped: StudentRecord[] = profiles.map((p: any) => {
      const cleanPhone = normalizePhone(p.phone);
      const activePurchases = (p.purchases || []).filter((pur: any) => pur.status === "active");
      const userGrants = grantsByPhone.get(cleanPhone) || [];

      // Calculate progress
      const userProgress = p.progress || [];
      const completedLessons = userProgress.filter((prog: any) => prog.completed).length;

      const coursesTakenList: any[] = [];
      const enrolledBooksList: any[] = [];

      activePurchases.forEach((pur: any) => {
        const expDate = pur.expires_at ? new Date(pur.expires_at) : new Date(nowMs + 90 * 86400000);
        const daysLeft = Math.max(0, Math.ceil((expDate.getTime() - nowMs) / (1000 * 60 * 60 * 24)));
        const isExpired = expDate.getTime() < nowMs;

        const isBook = Boolean(pur.book_id || pur.item_type === "book" || booksMap.has(pur.course_id));

        if (isBook) {
          const bookId = pur.book_id || pur.course_id;
          const bObj = booksMap.get(bookId);
          enrolledBooksList.push({
            id: bookId,
            title: bObj?.title || "Digital Handbook",
            code: bObj?.code || "BK",
            enrolledAt: p.created_at ? p.created_at.slice(0, 10) : "",
            expiresAt: pur.expires_at || expDate.toISOString(),
            daysLeft,
            isExpired,
            purchaseId: pur.id,
          });
        } else {
          const cObj = coursesMap.get(pur.course_id);
          coursesTakenList.push({
            courseId: pur.course_id || "MM-01",
            courseCode: cObj?.code || "MM-01",
            courseTitle: cObj?.title || "Enrolled Course",
            purchasedAt: p.created_at ? p.created_at.slice(0, 10) : "",
            expiresAt: pur.expires_at || expDate.toISOString(),
            daysLeft,
            isExpired,
            progressPct: completedLessons > 0 ? Math.min(100, completedLessons * 10) : 0,
            completedLessons,
            totalLessons: cObj?.lessonsCount || 10,
            itemType: "course",
            purchaseId: pur.id,
          });
        }
      });

      userGrants.forEach((g: any) => {
        const expDate = g.valid_until ? new Date(g.valid_until) : new Date(nowMs + 90 * 86400000);
        const daysLeft = Math.max(0, Math.ceil((expDate.getTime() - nowMs) / (1000 * 60 * 60 * 24)));
        const isExpired = expDate.getTime() < nowMs;

        const isBook = Boolean(g.book_id || g.item_type === "book" || booksMap.has(g.course_id));

        if (isBook) {
          const bookId = g.book_id || g.course_id;
          if (!enrolledBooksList.some((b) => b.id === bookId)) {
            const bObj = booksMap.get(bookId);
            enrolledBooksList.push({
              id: bookId,
              title: g.book_title || bObj?.title || "Granted Book Access",
              code: bObj?.code || "GRANT-BK",
              enrolledAt: g.created_at ? g.created_at.slice(0, 10) : "",
              expiresAt: g.valid_until || expDate.toISOString(),
              daysLeft,
              isExpired,
              grantId: g.id,
            });
          }
        } else {
          if (!coursesTakenList.some((c) => c.courseId === g.course_id)) {
            const cObj = coursesMap.get(g.course_id);
            coursesTakenList.push({
              courseId: g.course_id,
              courseCode: cObj?.code || "GRANT",
              courseTitle: g.course_title || cObj?.title || "Granted Access",
              purchasedAt: g.created_at ? g.created_at.slice(0, 10) : "",
              expiresAt: g.valid_until || expDate.toISOString(),
              daysLeft,
              isExpired,
              progressPct: 0,
              completedLessons: 0,
              totalLessons: cObj?.lessonsCount || 10,
              itemType: "course",
              grantId: g.id,
            });
          }
        }
      });

      const enrolledTitles = coursesTakenList.map((c) => c.courseTitle);
      const enrolledCodes = coursesTakenList.map((c) => c.courseCode);

      return {
        id: p.id,
        name: p.full_name || "Student",
        phone: cleanPhone,
        email: p.email || "",
        district: p.district || "Pune",
        taluka: p.taluka || "",
        school: p.school_name || p.school || "",
        standard: p.standard || p.target_exam || "10th",
        registeredAt: p.created_at ? p.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
        status: "active",
        enrolledCourseCodes: enrolledCodes,
        enrolledCourseTitles: enrolledTitles,
        totalWatchSec: completedLessons * 600,
        completedLessonsCount: completedLessons,
        lastActiveAt: new Date().toISOString(),
        coursesTaken: coursesTakenList,
        enrolledBooks: enrolledBooksList,
      };
    });

    safeSetItem(KEYS.STUDENTS, mapped);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("mma_students_changed"));
    }
    return mapped;
  } catch {
    return getStaffStudents();
  }
}

export async function fetchDbSettings(): Promise<PlatformSettings> {
  try {
    const supabase = getSupabase();
    if (!supabase) return getPlatformSettings();
    const { data, error } = await supabase.from("settings").select("*").eq("id", 1).maybeSingle();
    if (error || !data) return getPlatformSettings();
    const mapped: PlatformSettings = {
      max_sub_admins: data.max_sub_admins ?? 50,
      default_access_months: data.default_access_months ?? 3,
      default_video_live_days: data.default_video_live_days ?? 30,
      default_coupon_days: data.default_coupon_days ?? 7,
      renewal_coupon_percent: data.renewal_coupon_percent ?? 50,
      reminder_template: data.reminder_template || DEFAULT_PLATFORM_SETTINGS.reminder_template,
      maintenance: Boolean(data.maintenance),
      youtube_api_key: data.youtube_api_key || "",
      razorpay_key_id: data.razorpay_key_id || DEFAULT_PLATFORM_SETTINGS.razorpay_key_id,
      razorpay_key_secret: data.razorpay_key_secret || DEFAULT_PLATFORM_SETTINGS.razorpay_key_secret,
      razorpay_mode: data.razorpay_mode || DEFAULT_PLATFORM_SETTINGS.razorpay_mode,
      concurrent_devices: data.concurrent_devices ?? DEFAULT_PLATFORM_SETTINGS.concurrent_devices,
      auto_send_reminders: data.auto_send_reminders !== undefined ? Boolean(data.auto_send_reminders) : true,
      academy_title: data.academy_title || DEFAULT_PLATFORM_SETTINGS.academy_title,
      founder_name: data.founder_name || DEFAULT_PLATFORM_SETTINGS.founder_name,
      centre_address: data.centre_address || DEFAULT_PLATFORM_SETTINGS.centre_address,
      support_phone: data.support_phone || DEFAULT_PLATFORM_SETTINGS.support_phone,
      support_email: data.support_email || DEFAULT_PLATFORM_SETTINGS.support_email,
    };
    safeSetItem("mma_settings", mapped);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("mma_settings_changed"));
    }
    return mapped;
  } catch {
    return getPlatformSettings();
  }
}

export async function fetchDbStaff(): Promise<StaffUser[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return getStaffUsers();
    const { data, error } = await supabase.from("staff_accounts").select("*, staff_permissions(permission_key)").order("created_at", { ascending: true });
    if (error || !data) return getStaffUsers();
    const mapped: StaffUser[] = data.map((s: any) => ({
      id: s.id,
      staffId: s.staff_id,
      name: s.full_name,
      email: s.email || `${(s.staff_id || "staff").toLowerCase()}@mindmasteracademy.in`,
      phone: s.phone,
      role: s.role,
      permissions: (s.staff_permissions || []).map((p: any) => p.permission_key),
      status: s.status,
      mustChangePassword: Boolean(s.must_change_password),
      password: s.password_hash,
    }));
    safeSetItem(KEYS.STAFF_USERS, mapped);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("mma_staff_changed"));
    }
    return mapped;
  } catch {
    return getStaffUsers();
  }
}

export async function fetchDbBooks(): Promise<Book[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return getStaffBooks();
    const { data, error } = await supabase
      .from("books")
      .select("*, courses(title)")
      .order("created_at", { ascending: false });

    if (error || !data) return getStaffBooks();

    const mapped: Book[] = data.map((b: any) => ({
      id: b.id,
      code: b.code || `BK-${b.id.slice(0, 4)}`,
      courseId: b.course_id || null,
      courseTitle: b.courses?.title || (b.course_id ? "Associated Course" : "Standalone Digital Book"),
      title: b.title,
      subtitle: b.subtitle || "",
      description: b.description || "",
      filePath: b.file_path,
      pages: b.pages || 24,
      fileSizeMb: Number(b.file_size_mb) || 4.5,
      coverImage: b.cover_image || "/assets/images/vedic_maths_abacus_3d.png",
      isFree: Boolean(b.is_free),
      pricePaise: Number(b.price_paise) || 0,
      originalPricePaise: Number(b.original_price_paise) || 0,
      accessMonths: b.access_months || 6,
      status: b.status || "live",
      headerTint: b.header_tint || "sky",
      badgeText: b.badge_text || "",
      createdAt: b.created_at,
    }));

    safeSetItem(KEYS.BOOKS, mapped);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("mma_books_changed"));
    }
    return mapped;
  } catch {
    return getStaffBooks();
  }
}

export async function fetchDbAuditLogs(staffId?: string): Promise<AuditLogEntry[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return getAuditLogs();
    let query = supabase
      .from("audit_log")
      .select("*")
      .order("at", { ascending: false })
      .limit(200);

    if (staffId && staffId !== "all") {
      query = query.eq("staff_id", staffId);
    }

    const { data, error } = await query;

    if (error || !data) return getAuditLogs();

    const mapped: AuditLogEntry[] = data.map((d: any) => ({
      id: d.id,
      timestamp: d.at ? new Date(d.at).toLocaleString("en-IN") : "",
      staffId: d.staff_id || "MMA-000",
      staffName: d.meta?.staffName || d.staff_id || "Prashant Dhumal",
      action: d.action,
      entityType: d.entity_type,
      entityId: d.entity_id,
      entityName: d.meta?.entityName || d.details || "",
      details: d.details || "",
    }));

    safeSetItem(KEYS.AUDIT_LOGS, mapped);
    return mapped;
  } catch {
    return getAuditLogs();
  }
}
