import { Course, StudentRecord, Book } from "./types";
import { getStaffStudents, getStaffCourses, getStaffBooks, getCurrentStaff, getStaffUsers, logStaffAction, saveStaffStudent } from "./staffStore";
import { addStudentNotification } from "./studentNotificationStore";
import { normalizePhone } from "./phoneUtils";

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

export type GrantScopeType = "student" | "all_students" | "district" | "taluka" | "school";

export interface Grant {
  id: string;
  created_by: string;
  createdBy: string;
  createdByName: string;
  scope_type: GrantScopeType;
  scopeType: GrantScopeType;
  scope_value: string;
  scopeValue: string;
  course_scope: "one" | "all";
  courseScope: "one" | "all";
  item_type?: "course" | "book";
  itemType?: "course" | "book";
  book_id?: string;
  bookId?: string;
  bookTitle?: string;
  course_id?: string;
  courseId?: string;
  courseTitle?: string;
  months: number;
  ends_at: string;
  endsAt: string;
  reason: string;
  status: "active" | "pending_approval" | "revoked" | "rejected";
  created_at: string;
  createdAt: string;
  affectedStudentsCount: number;
  payment_mode?: "cash" | "upi" | "scholarship";
  paymentMode?: "cash" | "upi" | "scholarship";
  upi_ref?: string;
  upiRef?: string;
  amount_paid?: number;
  amountPaid?: number;
  whatsapp_sent?: boolean;
  whatsappSent?: boolean;
  student_phone?: string;
  studentPhone?: string;
  student_name?: string;
  studentName?: string;
  settlement_status?: "unsettled" | "settled";
  settlementStatus?: "unsettled" | "settled";
  settled_at?: string;
  settledAt?: string;
  settled_by?: string;
  settledBy?: string;
  settled_by_name?: string;
  approved_at?: string;
  approvedAt?: string;
  approved_by?: string;
  approvedBy?: string;
  rejection_reason?: string;
  rejectionReason?: string;
}

export interface GrantPurchase {
  id: string;
  grant_id: string;
  grantId: string;
  user_id: string;
  studentId: string;
  studentName: string;
  studentPhone: string;
  course_id: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  amount: 0;
  amount_paise: 0;
  pricePaise: number; // Value waived in paise for analytics
  source: "grant";
  expires_at: string;
  expiresAt: string;
  status: "active" | "pending_approval" | "revoked" | "rejected";
  created_at: string;
  createdAt: string;
}

const STORAGE_KEY_GRANTS = "mma_grants";
const STORAGE_KEY_GRANT_PURCHASES = "mma_grant_purchases";

// Production Clean Slate: 0 Fake Grants & Purchases
const SEEDED_GRANTS: Grant[] = [];
const SEEDED_PURCHASES: GrantPurchase[] = [];

const SERVER_MEM_STORE = new Map<string, any>();

export function getGrants(): Grant[] {
  if (typeof window === "undefined") {
    return SERVER_MEM_STORE.has(STORAGE_KEY_GRANTS) ? SERVER_MEM_STORE.get(STORAGE_KEY_GRANTS) : [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GRANTS);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export async function fetchDbGrants(): Promise<Grant[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return getGrants();
    const { data, error } = await supabase
      .from("course_grants")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) return getGrants();

    const mapped: Grant[] = data.map((d: any) => {
      let scopeType: GrantScopeType = "student";
      let scopeVal = d.student_phone || d.student_name;
      if (d.remarks && d.remarks.includes("[")) {
        const match = d.remarks.match(/\[(student|all_students|district|taluka|school):(.*?)\]/);
        if (match) {
          scopeType = match[1] as GrantScopeType;
          scopeVal = match[2];
        }
      }

      return {
        id: d.id,
        created_by: d.granted_by,
        createdBy: d.granted_by,
        createdByName: d.granted_by_name || "Admin",
        scope_type: scopeType,
        scopeType: scopeType,
        scope_value: scopeVal,
        scopeValue: scopeVal,
        course_scope: "one",
        courseScope: "one",
        item_type: d.item_type || "course",
        itemType: d.item_type || "course",
        book_id: d.book_id || undefined,
        bookId: d.book_id || undefined,
        bookTitle: d.item_type === "book" ? d.course_title : undefined,
        course_id: d.item_type !== "book" ? d.course_id : undefined,
        courseId: d.item_type !== "book" ? d.course_id : undefined,
        courseTitle: d.course_title,
        months: 6,
        ends_at: d.valid_until,
        endsAt: d.valid_until,
        reason: d.remarks || "Direct Admission",
        status: d.status || "active",
        created_at: d.created_at,
        createdAt: d.created_at,
        affectedStudentsCount: 1,
        payment_mode: d.payment_mode || "scholarship",
        paymentMode: d.payment_mode || "scholarship",
        upi_ref: d.upi_ref || d.utr_number || undefined,
        upiRef: d.upi_ref || d.utr_number || undefined,
        amount_paid: Number(d.amount_paid) || 0,
        amountPaid: Number(d.amount_paid) || 0,
        settlement_status: d.settlement_status || (d.payment_mode === "cash" ? "unsettled" : "settled"),
        settlementStatus: d.settlement_status || (d.payment_mode === "cash" ? "unsettled" : "settled"),
        settled_at: d.settled_at || undefined,
        settledAt: d.settled_at || undefined,
        settled_by: d.settled_by || undefined,
        settledBy: d.settled_by || undefined,
        approved_at: d.approved_at || undefined,
        approvedAt: d.approved_at || undefined,
        approved_by: d.approved_by || undefined,
        approvedBy: d.approved_by || undefined,
        rejection_reason: d.rejection_reason || undefined,
        rejectionReason: d.rejection_reason || undefined,
        whatsapp_sent: Boolean(d.whatsapp_sent),
        whatsappSent: Boolean(d.whatsapp_sent),
        student_phone: d.student_phone,
        studentPhone: d.student_phone,
        student_name: d.student_name,
        studentName: d.student_name,
      };
    });

    saveGrants(mapped);
    return mapped;
  } catch {
    return getGrants();
  }
}

export function saveGrants(grants: Grant[]): void {
  if (typeof window === "undefined") {
    SERVER_MEM_STORE.set(STORAGE_KEY_GRANTS, grants);
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY_GRANTS, JSON.stringify(grants));
    window.dispatchEvent(new Event("mma_grants_changed"));
  } catch (e) {
    console.error("Failed to save grants", e);
  }
}

export function getGrantPurchases(): GrantPurchase[] {
  if (typeof window === "undefined") {
    return SERVER_MEM_STORE.has(STORAGE_KEY_GRANT_PURCHASES) ? SERVER_MEM_STORE.get(STORAGE_KEY_GRANT_PURCHASES) : [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GRANT_PURCHASES);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveGrantPurchases(purchases: GrantPurchase[]): void {
  if (typeof window === "undefined") {
    SERVER_MEM_STORE.set(STORAGE_KEY_GRANT_PURCHASES, purchases);
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY_GRANT_PURCHASES, JSON.stringify(purchases));
    window.dispatchEvent(new Event("mma_grant_purchases_changed"));
  } catch (e) {
    console.error("Failed to save grant purchases", e);
  }
}

// Find students matching given scope parameters
export function getMatchingStudents(scopeType: GrantScopeType, scopeValue: string): StudentRecord[] {
  const students = getStaffStudents();
  const val = (scopeValue || "").trim().toLowerCase();

  switch (scopeType) {
    case "all_students":
      return students;
    case "student":
      return students.filter(
        (s) =>
          s.id === scopeValue ||
          s.name.toLowerCase().includes(val) ||
          s.phone.includes(val) ||
          s.email.toLowerCase().includes(val)
      );
    case "district":
      if (!val) return [];
      return students.filter((s) => s.district && s.district.toLowerCase().includes(val));
    case "taluka":
      if (!val) return [];
      return students.filter((s) => s.taluka && s.taluka.toLowerCase().includes(val));
    case "school":
      if (!val) return [];
      return students.filter((s) => s.school && s.school.toLowerCase().includes(val));
    default:
      return [];
  }
}

export function getMatchingStudentCount(scopeType: GrantScopeType, scopeValue: string): number {
  return getMatchingStudents(scopeType, scopeValue).length;
}

// Create and materialize grant
export function createGrant(params: {
  scopeType: GrantScopeType;
  scopeValue: string;
  courseScope: "one" | "all";
  courseId?: string;
  itemType?: "course" | "book";
  bookId?: string;
  months?: number;
  validityDays?: number;
  customExpiryDate?: string;
  reason: string;
}): Grant {
  const currentStaff = getCurrentStaff();
  const allCourses = getStaffCourses();
  const allBooks = getStaffBooks();
  const matchingStudents = getMatchingStudents(params.scopeType, params.scopeValue);

  if (params.scopeType === "student" && matchingStudents.length === 0) {
    throw new Error("No students match the specified scope. Please adjust your criteria.");
  }

  const isBookGrant = params.itemType === "book";
  let targetCourses: Course[] = [];
  let targetBook: Book | null = null;

  if (isBookGrant) {
    const foundBook = allBooks.find((b) => b.id === params.bookId || b.code === params.bookId);
    if (!foundBook) throw new Error("Please select a valid digital book.");
    targetBook = foundBook;
  } else {
    // Determine target courses
    if (params.courseScope === "all") {
      targetCourses = allCourses.filter((c) => c.status !== "removed" && c.status !== "archived");
    } else {
      const single = allCourses.find((c) => c.id === params.courseId);
      if (!single) throw new Error("Please select a valid course.");
      targetCourses = [single];
    }
  }

  const now = new Date();
  let endsAt: string;
  let months = params.months || 3;
  if (params.customExpiryDate) {
    endsAt = new Date(params.customExpiryDate).toISOString();
    months = Math.max(1, Math.round((new Date(params.customExpiryDate).getTime() - now.getTime()) / (30 * 86400000)));
  } else if (params.validityDays) {
    endsAt = new Date(now.getTime() + params.validityDays * 86400000).toISOString();
    months = Math.max(1, Math.round(params.validityDays / 30));
  } else if ((params.months || 0) >= 36) {
    endsAt = new Date(now.getTime() + 3650 * 86400000).toISOString();
    months = 120;
  } else {
    endsAt = new Date(now.getTime() + months * 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  const grantId = `grant-${Date.now()}`;

  const itemTitle = isBookGrant
    ? targetBook?.title || "Digital Book"
    : params.courseScope === "all"
    ? "All Academy Courses"
    : targetCourses[0]?.title || "Specific Course";

  // Prevent duplicate active grants for single student scope
  if (params.scopeType === "student") {
    const cleanTargetPhone = normalizePhone(params.scopeValue);
    const existingGrants = getGrants();
    const duplicate = existingGrants.find((g) => {
      const gPhone = normalizePhone(g.scope_value || g.scopeValue || g.student_phone || g.studentPhone || "");
      const gItem = g.course_id || g.courseId || g.book_id || g.bookId;
      const targetItem = isBookGrant ? targetBook?.id : (params.courseScope === "one" ? targetCourses[0]?.id : "all");
      const isMatchItem = targetItem === "all" || gItem === targetItem || g.course_scope === "all";
      const isActive = g.status === "active" && new Date(g.ends_at || g.endsAt).getTime() > Date.now();
      return (
        (gPhone === cleanTargetPhone || (params.scopeValue && (g.scope_value?.includes(params.scopeValue) || g.student_name?.includes(params.scopeValue)))) &&
        isMatchItem &&
        isActive
      );
    });

    if (duplicate) {
      const expDate = (duplicate.ends_at || duplicate.endsAt).slice(0, 10);
      throw new Error(`Student already has active access to "${itemTitle}" valid until ${expDate}. Duplicate grant prevented.`);
    }
  }

  const newGrant: Grant = {
    id: grantId,
    created_by: currentStaff.id,
    createdBy: currentStaff.id,
    createdByName: currentStaff.name,
    scope_type: params.scopeType,
    scopeType: params.scopeType,
    scope_value: params.scopeValue.trim(),
    scopeValue: params.scopeValue.trim(),
    course_scope: params.courseScope,
    courseScope: params.courseScope,
    item_type: isBookGrant ? "book" : "course",
    itemType: isBookGrant ? "book" : "course",
    book_id: isBookGrant ? targetBook?.id : undefined,
    bookId: isBookGrant ? targetBook?.id : undefined,
    bookTitle: isBookGrant ? targetBook?.title : undefined,
    course_id: isBookGrant ? targetBook?.id : params.courseScope === "one" ? targetCourses[0]?.id : undefined,
    courseId: isBookGrant ? targetBook?.id : params.courseScope === "one" ? targetCourses[0]?.id : undefined,
    courseTitle: itemTitle,
    months,
    ends_at: endsAt,
    endsAt,
    reason: params.reason.trim(),
    status: "active",
    created_at: now.toISOString(),
    createdAt: now.toISOString(),
    affectedStudentsCount: matchingStudents.length,
  };

  // Materialize purchases for each student
  const existingPurchases = getGrantPurchases();
  const newPurchases: GrantPurchase[] = [];

  if (isBookGrant && targetBook) {
    const book = targetBook;
    matchingStudents.forEach((student) => {
      newPurchases.push({
        id: `gp-${Date.now()}-${student.id}-${book.id}`,
        grant_id: grantId,
        grantId,
        user_id: student.id,
        studentId: student.id,
        studentName: student.name,
        studentPhone: student.phone,
        course_id: book.id,
        courseId: book.id,
        courseCode: book.code || "BK",
        courseTitle: book.title,
        amount: 0,
        amount_paise: 0,
        pricePaise: book.pricePaise || 0,
        source: "grant",
        expires_at: endsAt,
        expiresAt: endsAt,
        status: "active",
        created_at: now.toISOString(),
        createdAt: now.toISOString(),
      });
    });
  } else {
    matchingStudents.forEach((student) => {
      targetCourses.forEach((course) => {
        newPurchases.push({
          id: `gp-${Date.now()}-${student.id}-${course.id}`,
          grant_id: grantId,
          grantId,
          user_id: student.id,
          studentId: student.id,
          studentName: student.name,
          studentPhone: student.phone,
          course_id: course.id,
          courseId: course.id,
          courseCode: course.code,
          courseTitle: course.title,
          amount: 0,
          amount_paise: 0,
          pricePaise: course.pricePaise || 0,
          source: "grant",
          expires_at: endsAt,
          expiresAt: endsAt,
          status: "active",
          created_at: now.toISOString(),
          createdAt: now.toISOString(),
        });
      });
    });
  }

  // Save new grant and grant purchases
  const grants = getGrants();
  saveGrants([newGrant, ...grants]);
  saveGrantPurchases([...newPurchases, ...existingPurchases]);

  // Update localStorage mindmaster_active_purchases so current student sees instant unlock
  if (typeof window !== "undefined") {
    try {
      const activePurchases = JSON.parse(
        localStorage.getItem("mindmaster_active_purchases") || "{}"
      );
      if (isBookGrant && targetBook) {
        activePurchases[targetBook.id] = endsAt;
        if (targetBook.code) activePurchases[targetBook.code] = endsAt;
      } else {
        targetCourses.forEach((c) => {
          activePurchases[c.id] = endsAt;
        });
      }
      localStorage.setItem("mindmaster_active_purchases", JSON.stringify(activePurchases));
      window.dispatchEvent(new Event("storage"));
    } catch (e) {
      console.warn("Could not sync active purchases to client storage", e);
    }
  }

  // Audit_log every create
  logStaffAction(
    "GRANT_CREATE",
    "grant",
    newGrant.id,
    `Grant: ${params.scopeType}=${params.scopeValue}`,
    `Created free access grant ${grantId} (${params.months}m) for ${matchingStudents.length} student(s) on ${isBookGrant ? `Book "${targetBook?.title}"` : `${targetCourses.length} course(s)`}. Reason: ${params.reason}`
  );

  const supabase = getSupabase();
  if (supabase && matchingStudents.length > 0) {
    try {
      const grantRows: any[] = [];
      if (isBookGrant && targetBook) {
        const book = targetBook;
        matchingStudents.forEach((st) => {
          const cleanPhone = normalizePhone(st.phone);
          grantRows.push({
            student_phone: cleanPhone,
            student_name: st.name,
            course_id: book.id,
            item_type: "book",
            book_id: book.id,
            course_title: book.title,
            granted_by: currentStaff.staffId || currentStaff.id,
            granted_by_name: currentStaff.name,
            payment_mode: "scholarship",
            amount_paid: 0,
            valid_until: endsAt,
            remarks: `Batch Book Grant [${params.scopeType}:${params.scopeValue}]: ${params.reason}`,
            status: "active",
          });
        });
      } else if (targetCourses.length > 0) {
        matchingStudents.forEach((st) => {
          const cleanPhone = normalizePhone(st.phone);
          targetCourses.forEach((c) => {
            grantRows.push({
              student_phone: cleanPhone,
              student_name: st.name,
              course_id: c.id,
              item_type: "course",
              course_title: c.title,
              granted_by: currentStaff.staffId || currentStaff.id,
              granted_by_name: currentStaff.name,
              payment_mode: "scholarship",
              amount_paid: 0,
              valid_until: endsAt,
              remarks: `Batch Course Grant [${params.scopeType}:${params.scopeValue}]: ${params.reason}`,
              status: "active",
            });
          });
        });
      }

      if (grantRows.length > 0) {
        supabase.from("course_grants").insert(grantRows).then(({ error }: any) => {
          if (error) console.warn("Supabase course_grants batch insert error:", error.message);
        });
      }
    } catch {}
  }

  return newGrant;
}

// Revoke: status revoked and related grant purchases expires_at = now
export function revokeGrant(grantId: string): boolean {
  const currentStaff = getCurrentStaff();
  const grants = getGrants();
  const grant = grants.find((g) => g.id === grantId);
  if (!grant) return false;

  // Sub-admins with freegrant.manage revoke OWN grants; main_admin revokes all
  if (currentStaff.role !== "main_admin" && (grant.created_by || grant.createdBy) !== currentStaff.id) {
    throw new Error("Unauthorized: Sub-admins can only revoke grants created by themselves.");
  }

  const nowIso = new Date().toISOString();

  // Mark grant as revoked
  const updatedGrants = grants.map((g) => (g.id === grantId ? { ...g, status: "revoked" as const } : g));
  saveGrants(updatedGrants);

  // Mark related grant purchases with status: 'revoked' and expires_at = now
  const purchases = getGrantPurchases();
  const updatedPurchases = purchases.map((p) =>
    (p.grant_id === grantId || p.grantId === grantId)
      ? { ...p, status: "revoked" as const, expires_at: nowIso, expiresAt: nowIso }
      : p
  );
  saveGrantPurchases(updatedPurchases);

  // Expire in client local storage active purchases
  if (typeof window !== "undefined") {
    try {
      const activePurchases = JSON.parse(
        localStorage.getItem("mindmaster_active_purchases") || "{}"
      );
      if (grant.course_id || grant.courseId) {
        delete activePurchases[grant.course_id || grant.courseId!];
      }
      localStorage.setItem("mindmaster_active_purchases", JSON.stringify(activePurchases));
      window.dispatchEvent(new Event("storage"));
    } catch (e) {}
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      supabase.from("course_grants").update({ status: "revoked" }).eq("id", grantId).then(() => {});
    } catch {}
  }

  // Audit_log every revoke
  logStaffAction(
    "GRANT_REVOKE",
    "grant",
    grant.id,
    `Revoke Grant: ${grant.scope_type || grant.scopeType}=${grant.scope_value || grant.scopeValue}`,
    `Revoked free access grant ${grantId}. Related purchases expired immediately (expires_at=now) for ${grant.affectedStudentsCount} students.`
  );

  return true;
}

// Active all/district/taluka/school grants auto-apply to new signups at onboarding
export function autoApplyGrantsForStudent(profile: {
  id?: string;
  phone: string;
  full_name?: string;
  district?: string;
  taluka?: string;
  school_name?: string | null;
}): { appliedGrantsCount: number; unlockedCourses: string[] } {
  const grants = getGrants();
  const allCourses = getStaffCourses();
  const allBooks = getStaffBooks();
  const now = Date.now();

  const activeGrants = grants.filter(
    (g) => g.status === "active" && new Date(g.ends_at || g.endsAt!).getTime() > now
  );

  const studentDistrict = (profile.district || "").trim().toLowerCase();
  const studentTaluka = (profile.taluka || "").trim().toLowerCase();
  const studentSchool = (profile.school_name || "").trim().toLowerCase();
  const studentPhone = profile.phone || "";
  const cleanStudentPhone = normalizePhone(studentPhone);
  const studentName = profile.full_name || "New Student";
  const studentId = profile.id || `stu-signup-${Date.now()}`;

  const unlockedCourses: string[] = [];
  let appliedCount = 0;
  const newPurchases: GrantPurchase[] = [];
  const existingPurchases = getGrantPurchases();

  activeGrants.forEach((grant) => {
    const scopeType = grant.scope_type || grant.scopeType;
    const scopeVal = (grant.scope_value || grant.scopeValue || "").toLowerCase();
    const cleanScopePhone = normalizePhone(scopeVal);

    let matches = false;
    if (scopeType === "all_students") {
      matches = true;
    } else if (scopeType === "district" && studentDistrict && studentDistrict.includes(scopeVal)) {
      matches = true;
    } else if (scopeType === "taluka" && studentTaluka && studentTaluka.includes(scopeVal)) {
      matches = true;
    } else if (scopeType === "school" && studentSchool && studentSchool.includes(scopeVal)) {
      matches = true;
    } else if (
      scopeType === "student" &&
      ((cleanScopePhone && cleanStudentPhone && cleanScopePhone === cleanStudentPhone) ||
        (studentPhone && scopeVal.includes(studentPhone)) ||
        scopeVal.includes(studentName.toLowerCase()))
    ) {
      matches = true;
    }

    if (matches) {
      appliedCount++;
      const isBook = grant.item_type === "book" || grant.itemType === "book" || Boolean(grant.book_id || grant.bookId);
      if (isBook) {
        const bId = grant.book_id || grant.bookId || grant.course_id || grant.courseId;
        const foundB = allBooks.find((b) => b.id === bId);
        if (foundB) {
          unlockedCourses.push(foundB.title);
          newPurchases.push({
            id: `gp-auto-${Date.now()}-${studentId}-${foundB.id}`,
            grant_id: grant.id,
            grantId: grant.id,
            user_id: studentId,
            studentId,
            studentName,
            studentPhone,
            course_id: foundB.id,
            courseId: foundB.id,
            courseCode: foundB.code || "BOOK",
            courseTitle: foundB.title,
            amount: 0,
            amount_paise: 0,
            pricePaise: foundB.pricePaise || 0,
            source: "grant",
            expires_at: grant.ends_at || grant.endsAt!,
            expiresAt: grant.ends_at || grant.endsAt!,
            status: "active",
            created_at: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        const courseScope = grant.course_scope || grant.courseScope;
        let targetCourses: Course[] = [];

        if (courseScope === "all") {
          targetCourses = allCourses;
        } else {
          const cId = grant.course_id || grant.courseId;
          const found = allCourses.find((c) => c.id === cId);
          if (found) targetCourses = [found];
        }

        targetCourses.forEach((c) => {
          unlockedCourses.push(c.title);
          newPurchases.push({
            id: `gp-auto-${Date.now()}-${studentId}-${c.id}`,
            grant_id: grant.id,
            grantId: grant.id,
            user_id: studentId,
            studentId,
            studentName,
            studentPhone,
            course_id: c.id,
            courseId: c.id,
            courseCode: c.code,
            courseTitle: c.title,
            amount: 0,
            amount_paise: 0,
            pricePaise: c.pricePaise || 0,
            source: "grant",
            expires_at: grant.ends_at || grant.endsAt!,
            expiresAt: grant.ends_at || grant.endsAt!,
            status: "active",
            created_at: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          });
        });
      }
    }
  });

  if (newPurchases.length > 0) {
    saveGrantPurchases([...newPurchases, ...existingPurchases]);

    // Update client local storage active purchases
    if (typeof window !== "undefined") {
      try {
        const activePurchases = JSON.parse(
          localStorage.getItem("mindmaster_active_purchases") || "{}"
        );
        newPurchases.forEach((p) => {
          activePurchases[p.course_id || p.courseId!] = p.expires_at || p.expiresAt;
        });
        localStorage.setItem("mindmaster_active_purchases", JSON.stringify(activePurchases));
        window.dispatchEvent(new Event("storage"));
      } catch (e) {}
    }
  }

  // Also query live Supabase course_grants asynchronously if connected
  if (typeof window !== "undefined" && cleanStudentPhone) {
    const supabase = getSupabase();
    if (supabase) {
      supabase
        .from("course_grants")
        .select("*")
        .eq("student_phone", cleanStudentPhone)
        .eq("status", "active")
        .gt("valid_until", new Date().toISOString())
        .then(({ data }: any) => {
          if (data && data.length > 0) {
            const current = JSON.parse(
              localStorage.getItem("mindmaster_active_purchases") || "{}"
            );
            let liveChanged = false;
            data.forEach((row: any) => {
              const id = row.book_id || row.course_id;
              if (id && row.valid_until) {
                current[id] = row.valid_until;
                liveChanged = true;
              }
            });
            if (liveChanged) {
              localStorage.setItem("mindmaster_active_purchases", JSON.stringify(current));
              window.dispatchEvent(new Event("storage"));
            }
          }
        })
        .catch(() => {});
    }
  }

  return {
    appliedGrantsCount: appliedCount,
    unlockedCourses,
  };
}

// Calculate total waived revenue metrics: sum of course price_paise over grant purchases
export function getWaivedRevenue(): {
  totalPaise: number;
  totalRupees: number;
  activePaise: number;
  activeRupees: number;
  activeGrantsCount: number;
  totalStudentsCovered: number;
} {
  const grants = getGrants();
  const purchases = getGrantPurchases();

  const activeGrants = grants.filter((g) => g.status === "active");

  let totalPaise = 0;
  let activePaise = 0;

  purchases.forEach((p) => {
    totalPaise += p.pricePaise || 0;
    const exp = p.expires_at || p.expiresAt;
    if (p.status === "active" && exp && new Date(exp).getTime() > Date.now()) {
      activePaise += p.pricePaise || 0;
    }
  });

  // Unique active students covered
  const activeStudentIds = new Set(
    purchases
      .filter((p) => {
        const exp = p.expires_at || p.expiresAt;
        return p.status === "active" && exp && new Date(exp).getTime() > Date.now();
      })
      .map((p) => p.user_id || p.studentId)
  );

  return {
    totalPaise,
    totalRupees: Math.round(totalPaise / 100),
    activePaise,
    activeRupees: Math.round(activePaise / 100),
    activeGrantsCount: activeGrants.length,
    totalStudentsCovered: activeStudentIds.size,
  };
}

// ----------------------------------------------------
// OFFLINE CASH ADMISSION / DIRECT COURSE GRANT
// ----------------------------------------------------
export interface CashAdmissionParams {
  studentPhone: string;
  studentName?: string;
  courseId: string;
  itemType?: "course" | "book" | "all_courses";
  accessMonths?: number;
  validityDays?: number;
  customExpiryDate?: string;
  paymentMode: "cash" | "upi" | "scholarship";
  upiRef?: string;
  amountPaid: number;
  remarks?: string;
}

export interface CashAdmissionResult {
  success: boolean;
  grantId: string;
  grant: Grant;
  purchase: GrantPurchase;
  whatsappUrl: string;
  receiptText: string;
  expiresAt: string;
  isPendingApproval?: boolean;
  error?: string;
}

export function grantCashAdmission(params: CashAdmissionParams): CashAdmissionResult {
  const currentStaff = getCurrentStaff();
  const cleanPhone = params.studentPhone.replace(/\D/g, "").slice(-10);

  // 1. Strict No-Free Lock for Sub-Admins
  if (currentStaff.role === "sub_admin") {
    if (params.paymentMode === "scholarship" || params.amountPaid <= 0) {
      return {
        success: false,
        grantId: "",
        grant: {} as any,
        purchase: {} as any,
        whatsappUrl: "",
        receiptText: "",
        expiresAt: "",
        error: "Unauthorized: Sub-Admins are strictly locked from issuing ₹0 Free Scholarships. Only Main Admin (Prashant Sir) can grant free scholarships.",
      };
    }
    if (params.paymentMode === "upi" && (!params.upiRef || !params.upiRef.trim())) {
      return {
        success: false,
        grantId: "",
        grant: {} as any,
        purchase: {} as any,
        whatsappUrl: "",
        receiptText: "",
        expiresAt: "",
        error: "Mandatory UPI Reference (UTR) number is required for UPI admissions.",
      };
    }
  }

  const students = getStaffStudents();
  let student = students.find((s) => s.phone.replace(/\D/g, "").slice(-10) === cleanPhone);

  const isAllCourses = params.courseId === "all" || params.itemType === "all_courses";
  const courses = getStaffCourses();
  const books = getStaffBooks();
  const course = !isAllCourses ? courses.find((c) => c.id === params.courseId || c.code === params.courseId) : null;
  const book = !isAllCourses && !course ? books.find((b) => b.id === params.courseId || b.code === params.courseId) : null;
  const isBook = Boolean(book);
  const itemTitle = isAllCourses
    ? "All Academy Courses (सर्व कोर्सेस)"
    : isBook
    ? book!.title
    : course?.title;

  if (!isAllCourses && !course && !book) {
    return {
      success: false,
      grantId: "",
      grant: {} as any,
      purchase: {} as any,
      whatsappUrl: "",
      receiptText: "",
      expiresAt: "",
      error: `Course or Book not found: ${params.courseId}`,
    };
  }

  // Prevent duplicate active grants: Check if student already has active access before granting
  const existingGrants = getGrants();
  const duplicateActiveGrant = existingGrants.find((g) => {
    const gPhone = normalizePhone(g.scope_value || g.scopeValue || g.student_phone || g.studentPhone || "");
    const gCourseId = g.course_id || g.courseId || g.book_id || g.bookId;
    const isSamePhone = gPhone === cleanPhone;
    const isSameItem = isAllCourses
      ? gCourseId === "all" || g.course_scope === "all" || g.courseScope === "all"
      : isBook
      ? gCourseId === book!.id || gCourseId === book!.code
      : gCourseId === course!.id || gCourseId === course!.code;
    const isActive = (g.status === "active" || g.status === "pending_approval") && new Date(g.ends_at || g.endsAt).getTime() > Date.now();
    return isSamePhone && isSameItem && isActive;
  });

  if (duplicateActiveGrant) {
    const expStr = (duplicateActiveGrant.ends_at || duplicateActiveGrant.endsAt).slice(0, 10);
    return {
      success: false,
      grantId: "",
      grant: {} as any,
      purchase: {} as any,
      whatsappUrl: "",
      receiptText: "",
      expiresAt: "",
      error: `Student already has active/pending admission to "${itemTitle}" until ${expStr}. Cannot grant duplicate access.`,
    };
  }

  if (student && student.coursesTaken) {
    const existingActiveEnrollment = student.coursesTaken.find((ct) => {
      const match = isAllCourses
        ? ct.courseId === "all"
        : !isBook && course
        ? ct.courseId === course.id || ct.courseCode === course.code
        : false;
      return match && !ct.isExpired && ct.daysLeft > 0;
    });
    if (existingActiveEnrollment) {
      return {
        success: false,
        grantId: "",
        grant: {} as any,
        purchase: {} as any,
        whatsappUrl: "",
        receiptText: "",
        expiresAt: "",
        error: `Student already has active enrolled access to "${existingActiveEnrollment.courseTitle}" (${existingActiveEnrollment.daysLeft} days left). Cannot grant duplicate access.`,
      };
    }
  }

  const studentName = params.studentName?.trim() || student?.name || "Student";
  const newStudentId = student?.id || `student-${cleanPhone}`;

  // Calculate Expiry
  const now = new Date();
  let endsAt: string;
  let months = params.accessMonths || 6;
  let validityText = "";

  if (params.customExpiryDate) {
    endsAt = new Date(params.customExpiryDate).toISOString();
    months = Math.max(1, Math.round((new Date(params.customExpiryDate).getTime() - now.getTime()) / (30 * 86400000)));
    validityText = `Until ${new Date(params.customExpiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
  } else if (params.validityDays) {
    endsAt = new Date(now.getTime() + params.validityDays * 86400000).toISOString();
    months = Math.max(1, Math.round(params.validityDays / 30));
    validityText = `${params.validityDays} Days`;
  } else if ((params.accessMonths || 0) >= 36) {
    endsAt = new Date(now.getTime() + 3650 * 86400000).toISOString();
    months = 120;
    validityText = "Lifetime Access";
  } else {
    endsAt = new Date(now.getTime() + months * 30 * 86400000).toISOString();
    validityText = `${months} Months`;
  }

  // Maker-Checker Approval Mode Logic:
  // If Sub-Admin has approvalMode enabled, grant status is 'pending_approval'
  const requiresApproval = currentStaff.role === "sub_admin" && Boolean(currentStaff.approvalMode);
  const grantStatus: "active" | "pending_approval" = requiresApproval ? "pending_approval" : "active";
  const settlementStatus: "unsettled" | "settled" = params.paymentMode === "cash" ? "unsettled" : "settled";

  // 1. Create or Update Student Record
  if (!student) {
    const newRecord: StudentRecord = {
      id: newStudentId,
      name: studentName,
      email: `${cleanPhone}@student.mindmaster.internal`,
      phone: cleanPhone,
      district: "Maharashtra",
      school: "Direct Offline Admission",
      enrolledCourseCodes: isAllCourses ? ["ALL"] : isBook ? [] : (course ? [course.code] : []),
      enrolledCourseTitles: [itemTitle || "Admission"],
      completedCourseCodes: [],
      totalPaidPaise: params.amountPaid * 100,
      totalWatchSec: 0,
      completedLessonsCount: 0,
      joinedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      status: "active",
    };
    saveStaffStudent(newRecord);
    student = newRecord;
  } else {
    const existingCodes = student.enrolledCourseCodes || [];
    const codeToAdd = isAllCourses ? "ALL" : !isBook && course ? course.code : null;
    const updatedCodes = codeToAdd && !existingCodes.includes(codeToAdd)
      ? [...existingCodes, codeToAdd]
      : existingCodes;
    saveStaffStudent({
      ...student,
      name: studentName,
      enrolledCourseCodes: updatedCodes,
      totalPaidPaise: (student.totalPaidPaise || 0) + params.amountPaid * 100,
      lastActiveAt: new Date().toISOString(),
    });
  }

  // 2. Create Grant Record
  const grantId = `grant-cash-${Date.now()}`;
  const modeLabel =
    params.paymentMode === "cash"
      ? "Cash"
      : params.paymentMode === "upi"
      ? `Direct UPI (${params.upiRef ? `UTR: ${params.upiRef.trim()}` : "PhonePe/GPay"})`
      : "Scholarship";

  const newGrant: Grant = {
    id: grantId,
    created_by: currentStaff.id,
    createdBy: currentStaff.id,
    createdByName: currentStaff.name,
    scope_type: "student",
    scopeType: "student",
    scope_value: cleanPhone,
    scopeValue: cleanPhone,
    course_scope: isAllCourses ? "all" : "one",
    courseScope: isAllCourses ? "all" : "one",
    item_type: isBook ? "book" : "course",
    itemType: isBook ? "book" : "course",
    book_id: isBook ? book!.id : undefined,
    bookId: isBook ? book!.id : undefined,
    bookTitle: isBook ? book!.title : undefined,
    course_id: isAllCourses ? "all" : isBook ? book!.id : course!.id,
    courseId: isAllCourses ? "all" : isBook ? book!.id : course!.id,
    courseTitle: itemTitle,
    months,
    ends_at: endsAt,
    endsAt: endsAt,
    reason: `Offline Admission [${modeLabel}]: ₹${params.amountPaid}. ${params.remarks || ""}${requiresApproval ? " [Awaiting Main Admin Approval]" : ""}`.trim(),
    status: grantStatus,
    created_at: now.toISOString(),
    createdAt: now.toISOString(),
    affectedStudentsCount: 1,
    payment_mode: params.paymentMode,
    paymentMode: params.paymentMode,
    upi_ref: params.upiRef?.trim() || undefined,
    upiRef: params.upiRef?.trim() || undefined,
    amount_paid: params.amountPaid,
    amountPaid: params.amountPaid,
    settlement_status: settlementStatus,
    settlementStatus: settlementStatus,
    whatsapp_sent: false,
    whatsappSent: false,
    student_phone: cleanPhone,
    studentPhone: cleanPhone,
    student_name: studentName,
    studentName: studentName,
  };

  // 3. Create Grant Purchase Record
  const purchaseId = `gp-cash-${Date.now()}-${cleanPhone}`;
  const newPurchase: GrantPurchase = {
    id: purchaseId,
    grant_id: grantId,
    grantId: grantId,
    user_id: student.id,
    studentId: student.id,
    studentName: studentName,
    studentPhone: cleanPhone,
    course_id: isAllCourses ? "all" : isBook ? book!.id : (course?.id || ""),
    courseId: isAllCourses ? "all" : isBook ? book!.id : (course?.id || ""),
    courseCode: isAllCourses ? "ALL" : isBook ? (book!.code || "BK") : (course?.code || "MM"),
    courseTitle: itemTitle || "Enrolled Item",
    amount: 0,
    amount_paise: 0,
    pricePaise: isBook ? (book!.pricePaise || 49900) : (course?.pricePaise || 99900),
    source: "grant",
    created_at: now.toISOString(),
    createdAt: now.toISOString(),
    expires_at: endsAt,
    expiresAt: endsAt,
    status: grantStatus,
  };

  const grants = getGrants();
  saveGrants([newGrant, ...grants]);

  const purchases = getGrantPurchases();
  saveGrantPurchases([newPurchase, ...purchases]);

  // 4. Update localStorage active purchases ONLY IF status is 'active'
  if (grantStatus === "active" && typeof window !== "undefined") {
    try {
      const activePurchases = JSON.parse(
        localStorage.getItem("mindmaster_active_purchases") || "{}"
      );
      if (isAllCourses) {
        courses.forEach((c) => {
          activePurchases[c.id] = endsAt;
          if (c.code) activePurchases[c.code] = endsAt;
        });
        activePurchases["all"] = endsAt;
      } else if (isBook) {
        activePurchases[book!.id] = endsAt;
        if (book!.code) activePurchases[book!.code] = endsAt;
      } else if (course) {
        activePurchases[course.id] = endsAt;
        if (course.code) activePurchases[course.code] = endsAt;
      }
      localStorage.setItem("mindmaster_active_purchases", JSON.stringify(activePurchases));
      window.dispatchEvent(new Event("storage"));
    } catch (e) {
      console.warn("Could not sync active purchases to client storage", e);
    }
  }

  // 5. Log to Staff Audit Log
  logStaffAction(
    requiresApproval ? "OFFLINE_ADMISSION_PENDING" : "OFFLINE_CASH_ADMISSION",
    "grant",
    grantId,
    itemTitle || "Admission",
    requiresApproval
      ? `Sub-Admin submitted offline admission for ${studentName} (${cleanPhone}) for ${itemTitle}. Mode: ${modeLabel}, Fee: ₹${params.amountPaid}. Status: Pending Main Admin Approval.`
      : `Granted offline admission to ${studentName} (${cleanPhone}) for ${itemTitle}. Mode: ${modeLabel}, Fee Collected: ₹${params.amountPaid}. Valid until: ${endsAt.slice(0, 10)}.`
  );

  const supabase = getSupabase();
  if (supabase) {
    try {
      supabase.from("course_grants").insert({
        student_phone: cleanPhone,
        student_name: studentName,
        course_id: isAllCourses ? "all" : isBook ? book!.id : (course?.id || ""),
        item_type: isAllCourses ? "all_courses" : isBook ? "book" : "course",
        book_id: isBook ? book!.id : null,
        course_title: itemTitle,
        granted_by: currentStaff.staffId || currentStaff.id,
        granted_by_name: currentStaff.name,
        payment_mode: params.paymentMode,
        upi_ref: params.upiRef?.trim() || null,
        amount_paid: params.amountPaid,
        settlement_status: settlementStatus,
        valid_until: endsAt,
        remarks: params.remarks || null,
        status: grantStatus,
        whatsapp_sent: false,
      }).then(({ error }: any) => {
        if (error) console.warn("Supabase course_grants insert error:", error.message);
      });
    } catch {}
  }

  // 6. Send In-App Notification to Student (if active)
  if (grantStatus === "active") {
    try {
      addStudentNotification({
        userId: student.id,
        title: "🎉 Course Admission Confirmed!",
        body: `Prashant Sir has granted you full access to "${itemTitle}". Start learning now!`,
        type: "course",
        actionUrl: isBook ? "/books" : isAllCourses ? "/courses" : `/watch/${course?.id || ""}`,
      });
    } catch (e) {
      console.warn("Notification error:", e);
    }
  }

  // 7. Generate Pre-filled WhatsApp Share Message
  const approvalNotice = requiresApproval ? "\n⏳ Status: Verification Pending by HQ (Will activate shortly)" : "";
  const receiptText = `Hello ${studentName}!\n\nYour admission to "${itemTitle}" at MindMaster Academy is recorded. ✅\n\n💵 Fee Paid: ₹${params.amountPaid} (${modeLabel})${approvalNotice}\n⏱️ Validity: ${validityText}\n📱 Login Mobile: ${cleanPhone}\n\n📲 Access portal in the app:\nhttps://mindmaster.academy/login\n\nAll the best for your studies! 🌟\n— MindMaster Academy`;
  const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(receiptText)}`;

  return {
    success: true,
    grantId,
    grant: newGrant,
    purchase: newPurchase,
    whatsappUrl,
    receiptText,
    expiresAt: endsAt,
    isPendingApproval: requiresApproval,
  };
}

export function setGrantWhatsappSent(grantId: string): boolean {
  const grants = getGrants();
  const grant = grants.find((g) => g.id === grantId);
  if (!grant) return false;

  const updated = grants.map((g) =>
    g.id === grantId ? { ...g, whatsapp_sent: true, whatsappSent: true } : g
  );
  saveGrants(updated);

  const supabase = getSupabase();
  if (supabase) {
    try {
      supabase
        .from("course_grants")
        .update({ whatsapp_sent: true })
        .eq("id", grantId)
        .then(() => {});
    } catch {}
  }

  logStaffAction(
    "GRANT_WHATSAPP_SENT",
    "grant",
    grantId,
    grant.courseTitle || "Grant",
    `Triggered WhatsApp receipt & course link for grant ${grantId} (${grant.scope_value || grant.scopeValue})`
  );

  return true;
}

export interface StaffCollectionSummary {
  staffId: string;
  staffName: string;
  todayCash: number;
  todayUpi: number;
  todayGrantsCount: number;
  weekCash: number;
  weekUpi: number;
  weekGrantsCount: number;
  monthCash: number;
  monthUpi: number;
  monthGrantsCount: number;
  allTimeCash: number;
  allTimeUpi: number;
  allTimeGrantsCount: number;
}

export interface CollectionTallyReport {
  byStaff: StaffCollectionSummary[];
  totals: {
    todayCash: number;
    todayUpi: number;
    todayGrants: number;
    weekCash: number;
    weekUpi: number;
    weekGrants: number;
    monthCash: number;
    monthUpi: number;
    monthGrants: number;
    allTimeCash: number;
    allTimeUpi: number;
    allTimeGrants: number;
  };
}

export function getStaffCollectionTally(customGrants?: Grant[]): CollectionTallyReport {
  const grants = customGrants || getGrants();
  const now = new Date();

  // Midnight today in local time
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const monthStart = now.getTime() - 30 * 24 * 60 * 60 * 1000;

  const staffMap = new Map<string, StaffCollectionSummary>();

  const totals = {
    todayCash: 0,
    todayUpi: 0,
    todayGrants: 0,
    weekCash: 0,
    weekUpi: 0,
    weekGrants: 0,
    monthCash: 0,
    monthUpi: 0,
    monthGrants: 0,
    allTimeCash: 0,
    allTimeUpi: 0,
    allTimeGrants: 0,
  };

  grants.forEach((g) => {
    const sId = g.created_by || g.createdBy || "admin";
    const sName = g.createdByName || "Admin / Staff";

    if (!staffMap.has(sId)) {
      staffMap.set(sId, {
        staffId: sId,
        staffName: sName,
        todayCash: 0,
        todayUpi: 0,
        todayGrantsCount: 0,
        weekCash: 0,
        weekUpi: 0,
        weekGrantsCount: 0,
        monthCash: 0,
        monthUpi: 0,
        monthGrantsCount: 0,
        allTimeCash: 0,
        allTimeUpi: 0,
        allTimeGrantsCount: 0,
      });
    }

    const summary = staffMap.get(sId)!;
    const createdMs = new Date(g.created_at || g.createdAt).getTime();
    const mode = (g.payment_mode ||
      g.paymentMode ||
      (g.reason?.toLowerCase().includes("cash")
        ? "cash"
        : g.reason?.toLowerCase().includes("upi")
        ? "upi"
        : "scholarship")) as "cash" | "upi" | "scholarship";
    const amount = Number(g.amount_paid || g.amountPaid || 0);
    const isFree = mode === "scholarship" || amount === 0;

    // All Time
    if (mode === "cash") {
      summary.allTimeCash += amount;
      totals.allTimeCash += amount;
    } else if (mode === "upi") {
      summary.allTimeUpi += amount;
      totals.allTimeUpi += amount;
    }
    if (isFree) {
      summary.allTimeGrantsCount += 1;
      totals.allTimeGrants += 1;
    }

    // Month
    if (createdMs >= monthStart) {
      if (mode === "cash") {
        summary.monthCash += amount;
        totals.monthCash += amount;
      } else if (mode === "upi") {
        summary.monthUpi += amount;
        totals.monthUpi += amount;
      }
      if (isFree) {
        summary.monthGrantsCount += 1;
        totals.monthGrants += 1;
      }
    }

    // Week
    if (createdMs >= weekStart) {
      if (mode === "cash") {
        summary.weekCash += amount;
        totals.weekCash += amount;
      } else if (mode === "upi") {
        summary.weekUpi += amount;
        totals.weekUpi += amount;
      }
      if (isFree) {
        summary.weekGrantsCount += 1;
        totals.weekGrants += 1;
      }
    }

    // Today
    if (createdMs >= todayStart) {
      if (mode === "cash") {
        summary.todayCash += amount;
        totals.todayCash += amount;
      } else if (mode === "upi") {
        summary.todayUpi += amount;
        totals.todayUpi += amount;
      }
      if (isFree) {
        summary.todayGrantsCount += 1;
        totals.todayGrants += 1;
      }
    }
  });

  return {
    byStaff: Array.from(staffMap.values()).sort(
      (a, b) => b.allTimeCash + b.allTimeUpi - (a.allTimeCash + a.allTimeUpi)
    ),
    totals,
  };
}

export async function extendStudentAccess(params: {
  studentPhone: string;
  studentName?: string;
  itemType: "course" | "book";
  itemId: string;
  itemTitle?: string;
  daysToAdd?: number; // e.g. 7, 15, 30
  customExpiryIso?: string; // custom date ISO
  purchaseId?: string;
  grantId?: string;
}): Promise<{ success: boolean; newExpiry: string; error?: string }> {
  const currentStaff = getCurrentStaff();
  const cleanPhone = normalizePhone(params.studentPhone);

  const now = Date.now();
  let targetEndsAtMs: number;

  if (params.customExpiryIso) {
    targetEndsAtMs = new Date(params.customExpiryIso).getTime();
  } else {
    const days = params.daysToAdd || 30;
    targetEndsAtMs = now + days * 86400000;
  }
  const newEndsAtIso = new Date(targetEndsAtMs).toISOString();

  // 1. Update active purchases in client localStorage
  if (typeof window !== "undefined") {
    try {
      const activePurchases = JSON.parse(
        localStorage.getItem("mindmaster_active_purchases") || "{}"
      );
      activePurchases[params.itemId] = newEndsAtIso;
      localStorage.setItem("mindmaster_active_purchases", JSON.stringify(activePurchases));
      window.dispatchEvent(new Event("storage"));
    } catch {}
  }

  // 2. Update grant / purchase records in local store
  const grants = getGrants();
  let grantFound = false;
  const updatedGrants = grants.map((g) => {
    const matchPhone =
      normalizePhone(g.scope_value || g.scopeValue || g.student_phone || g.studentPhone || "") ===
      cleanPhone;
    const matchItem = (g.course_id || g.courseId || g.book_id || g.bookId) === params.itemId;
    const matchId = params.grantId && g.id === params.grantId;
    if (matchId || (matchPhone && matchItem)) {
      grantFound = true;
      return {
        ...g,
        ends_at: newEndsAtIso,
        endsAt: newEndsAtIso,
        status: "active" as const,
      };
    }
    return g;
  });
  if (grantFound) {
    saveGrants(updatedGrants);
  }

  const purchases = getGrantPurchases();
  let purchaseFound = false;
  const updatedPurchases = purchases.map((p) => {
    const matchPhone = normalizePhone(p.studentPhone || (p as any).student_phone || "") === cleanPhone;
    const matchItem = (p.course_id || p.courseId) === params.itemId;
    const matchId = params.purchaseId && p.id === params.purchaseId;
    if (matchId || (matchPhone && matchItem)) {
      purchaseFound = true;
      return {
        ...p,
        expires_at: newEndsAtIso,
        expiresAt: newEndsAtIso,
        status: "active" as const,
      };
    }
    return p;
  });
  if (purchaseFound) {
    saveGrantPurchases(updatedPurchases);
  }

  // 3. Sync to Supabase
  const supabase = getSupabase();
  if (supabase) {
    try {
      if (params.grantId) {
        await supabase
          .from("course_grants")
          .update({ valid_until: newEndsAtIso, status: "active" })
          .eq("id", params.grantId);
      } else {
        await supabase
          .from("course_grants")
          .update({ valid_until: newEndsAtIso, status: "active" })
          .eq("student_phone", cleanPhone)
          .eq("course_id", params.itemId);
      }

      if (params.purchaseId) {
        await supabase
          .from("purchases")
          .update({ expires_at: newEndsAtIso, status: "active" })
          .eq("id", params.purchaseId);
      }
    } catch (e: any) {
      console.warn("Supabase access extension error:", e?.message);
    }
  }

  // 4. Audit Log
  logStaffAction(
    "STUDENT_VALIDITY_EXTENDED",
    "student",
    cleanPhone,
    params.studentName || cleanPhone,
    `Staff (${currentStaff.role} - ${currentStaff.name}) extended access for ${params.itemType} "${params.itemTitle || params.itemId}" until ${newEndsAtIso.slice(0, 10)}.`
  );

  return { success: true, newExpiry: newEndsAtIso };
}

export async function revokeStudentAccess(params: {
  studentPhone: string;
  studentName?: string;
  itemType: "course" | "book";
  itemId: string;
  itemTitle?: string;
  reason: string; // mandatory
  purchaseId?: string;
  grantId?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!params.reason || !params.reason.trim()) {
    return { success: false, error: "Mandatory revocation reason is required." };
  }

  const currentStaff = getCurrentStaff();
  const cleanPhone = normalizePhone(params.studentPhone);
  const nowIso = new Date().toISOString();

  // 1. Remove from client localStorage active purchases
  if (typeof window !== "undefined") {
    try {
      const activePurchases = JSON.parse(
        localStorage.getItem("mindmaster_active_purchases") || "{}"
      );
      delete activePurchases[params.itemId];
      localStorage.setItem("mindmaster_active_purchases", JSON.stringify(activePurchases));
      window.dispatchEvent(new Event("storage"));
    } catch {}
  }

  // 2. Mark grant as revoked in local store
  const grants = getGrants();
  let grantFound = false;
  const updatedGrants = grants.map((g) => {
    const matchPhone =
      normalizePhone(g.scope_value || g.scopeValue || g.student_phone || g.studentPhone || "") ===
      cleanPhone;
    const matchItem = (g.course_id || g.courseId || g.book_id || g.bookId) === params.itemId;
    const matchId = params.grantId && g.id === params.grantId;
    if (matchId || (matchPhone && matchItem)) {
      grantFound = true;
      return {
        ...g,
        status: "revoked" as const,
        reason: `${g.reason} [REVOKED: ${params.reason.trim()}]`,
      };
    }
    return g;
  });
  if (grantFound) {
    saveGrants(updatedGrants);
  }

  const purchases = getGrantPurchases();
  let purchaseFound = false;
  const updatedPurchases = purchases.map((p) => {
    const matchPhone = normalizePhone(p.studentPhone || (p as any).student_phone || "") === cleanPhone;
    const matchItem = (p.course_id || p.courseId) === params.itemId;
    const matchId = params.purchaseId && p.id === params.purchaseId;
    if (matchId || (matchPhone && matchItem)) {
      purchaseFound = true;
      return {
        ...p,
        status: "revoked" as const,
        expires_at: nowIso,
        expiresAt: nowIso,
      };
    }
    return p;
  });
  if (purchaseFound) {
    saveGrantPurchases(updatedPurchases);
  }

  // 3. Sync to Supabase
  const supabase = getSupabase();
  if (supabase) {
    try {
      if (params.grantId) {
        await supabase
          .from("course_grants")
          .update({ status: "revoked", remarks: `Revoked: ${params.reason.trim()}` })
          .eq("id", params.grantId);
      } else {
        await supabase
          .from("course_grants")
          .update({ status: "revoked", remarks: `Revoked: ${params.reason.trim()}` })
          .eq("student_phone", cleanPhone)
          .eq("course_id", params.itemId);
      }

      if (params.purchaseId) {
        await supabase
          .from("purchases")
          .update({ status: "expired", expires_at: nowIso })
          .eq("id", params.purchaseId);
      }
    } catch (e: any) {
      console.warn("Supabase revocation error:", e?.message);
    }
  }

  // 4. Audit Log (Mandatory Reason Logged)
  logStaffAction(
    "STUDENT_ACCESS_REVOKED",
    "student",
    cleanPhone,
    params.studentName || cleanPhone,
    `Staff (${currentStaff.role} - ${currentStaff.name}) terminated access to ${params.itemType} "${params.itemTitle || params.itemId}". Mandatory Reason: ${params.reason.trim()}`
  );

  return { success: true };
}

// ----------------------------------------------------
// MAKER-CHECKER APPROVAL QUEUE & CASH SETTLEMENT LEDGER
// ----------------------------------------------------

export interface SubAdminCashSummary {
  staffId: string;
  staffName: string;
  totalCashCollected: number;
  unsettledCash: number;
  settledCash: number;
  unsettledGrantsCount: number;
  totalGrantsCount: number;
  lastSettledAt?: string;
}

export function getPendingGrantApprovals(): Grant[] {
  const grants = getGrants();
  return grants.filter((g) => g.status === "pending_approval");
}

export function approveGrant(grantId: string): boolean {
  const currentStaff = getCurrentStaff();
  if (currentStaff.role !== "main_admin") {
    throw new Error("Unauthorized: Only Main Admin can approve pending grants.");
  }
  const grants = getGrants();
  const grant = grants.find((g) => g.id === grantId);
  if (!grant) return false;
  if (grant.status !== "pending_approval") return false;

  const nowIso = new Date().toISOString();
  const updatedGrants = grants.map((g) =>
    g.id === grantId
      ? {
          ...g,
          status: "active" as const,
          approved_at: nowIso,
          approvedAt: nowIso,
          approved_by: currentStaff.id,
          approvedBy: currentStaff.id,
        }
      : g
  );
  saveGrants(updatedGrants);

  // Activate grant purchases
  const purchases = getGrantPurchases();
  const updatedPurchases = purchases.map((p) =>
    p.grant_id === grantId || p.grantId === grantId
      ? { ...p, status: "active" as const }
      : p
  );
  saveGrantPurchases(updatedPurchases);

  // Instant unlock in client localStorage
  if (typeof window !== "undefined") {
    try {
      const activePurchases = JSON.parse(
        localStorage.getItem("mindmaster_active_purchases") || "{}"
      );
      const endsAt = grant.ends_at || grant.endsAt;
      if (grant.course_scope === "all") {
        const courses = getStaffCourses();
        courses.forEach((c) => {
          activePurchases[c.id] = endsAt;
          if (c.code) activePurchases[c.code] = endsAt;
        });
        activePurchases["all"] = endsAt;
      } else if (grant.book_id || grant.bookId) {
        const bId = grant.book_id || grant.bookId!;
        activePurchases[bId] = endsAt;
      } else if (grant.course_id || grant.courseId) {
        const cId = grant.course_id || grant.courseId!;
        activePurchases[cId] = endsAt;
      }
      localStorage.setItem("mindmaster_active_purchases", JSON.stringify(activePurchases));
      window.dispatchEvent(new Event("storage"));
    } catch (e) {}
  }

  // Update Supabase
  const supabase = getSupabase();
  if (supabase) {
    try {
      supabase
        .from("course_grants")
        .update({
          status: "active",
          approved_at: nowIso,
          approved_by: currentStaff.id,
        })
        .eq("id", grantId)
        .then(() => {});
    } catch {}
  }

  logStaffAction(
    "GRANT_APPROVE",
    "grant",
    grantId,
    grant.courseTitle || "Grant",
    `Main Admin approved admission grant ${grantId} for ${grant.student_name || grant.scope_value} (Fee: ₹${grant.amount_paid || 0}).`
  );

  return true;
}

export function rejectGrant(grantId: string, reason?: string): boolean {
  const currentStaff = getCurrentStaff();
  if (currentStaff.role !== "main_admin") {
    throw new Error("Unauthorized: Only Main Admin can reject pending grants.");
  }
  const grants = getGrants();
  const grant = grants.find((g) => g.id === grantId);
  if (!grant) return false;

  const nowIso = new Date().toISOString();
  const updatedGrants = grants.map((g) =>
    g.id === grantId
      ? {
          ...g,
          status: "rejected" as const,
          rejection_reason: reason || "Rejected by Main Admin",
          rejectionReason: reason || "Rejected by Main Admin",
        }
      : g
  );
  saveGrants(updatedGrants);

  const purchases = getGrantPurchases();
  const updatedPurchases = purchases.map((p) =>
    p.grant_id === grantId || p.grantId === grantId
      ? { ...p, status: "rejected" as const }
      : p
  );
  saveGrantPurchases(updatedPurchases);

  const supabase = getSupabase();
  if (supabase) {
    try {
      supabase
        .from("course_grants")
        .update({
          status: "rejected",
          remarks: `Rejected: ${reason || "By Main Admin"}`,
        })
        .eq("id", grantId)
        .then(() => {});
    } catch {}
  }

  logStaffAction(
    "GRANT_REJECT",
    "grant",
    grantId,
    grant.courseTitle || "Grant",
    `Main Admin rejected admission grant ${grantId} for ${grant.student_name || grant.scope_value}. Reason: ${reason || "N/A"}`
  );

  return true;
}

export function getSubAdminCashSettlements(): SubAdminCashSummary[] {
  const grants = getGrants();
  const staffUsers = getStaffUsers();
  const staffMap = new Map<string, SubAdminCashSummary>();

  // Initialize map with all sub-admins
  staffUsers
    .filter((s) => s.role !== "main_admin")
    .forEach((s) => {
      const key = s.id;
      staffMap.set(key, {
        staffId: s.staffId || s.id,
        staffName: s.name,
        totalCashCollected: 0,
        unsettledCash: 0,
        settledCash: 0,
        unsettledGrantsCount: 0,
        totalGrantsCount: 0,
      });
    });

  grants.forEach((g) => {
    const authorId = g.created_by || g.createdBy;
    if (!authorId) return;

    let entry = staffMap.get(authorId);
    if (!entry) {
      const foundKey = Array.from(staffMap.entries()).find(
        ([, v]) => v.staffId === authorId || v.staffName.toLowerCase() === g.createdByName?.toLowerCase()
      );
      if (foundKey) entry = staffMap.get(foundKey[0]);
    }
    if (!entry) return;

    if (g.payment_mode === "cash" || g.paymentMode === "cash") {
      const amt = Number(g.amount_paid || g.amountPaid || 0);
      const isSettled = g.settlement_status === "settled" || g.settlementStatus === "settled";

      entry.totalCashCollected += amt;
      entry.totalGrantsCount += 1;
      if (isSettled) {
        entry.settledCash += amt;
        if (g.settled_at && (!entry.lastSettledAt || g.settled_at > entry.lastSettledAt)) {
          entry.lastSettledAt = g.settled_at;
        }
      } else {
        entry.unsettledCash += amt;
        entry.unsettledGrantsCount += 1;
      }
    }
  });

  return Array.from(staffMap.values());
}

export function settleSubAdminCash(staffIdentifier: string): number {
  const currentStaff = getCurrentStaff();
  if (currentStaff.role !== "main_admin") {
    throw new Error("Unauthorized: Only Main Admin can settle cash.");
  }
  const grants = getGrants();
  const nowIso = new Date().toISOString();
  let settledAmount = 0;
  let settledCount = 0;

  const updatedGrants = grants.map((g) => {
    const isMatchingStaff =
      g.created_by === staffIdentifier ||
      g.createdBy === staffIdentifier ||
      (g as any).granted_by === staffIdentifier ||
      g.createdByName?.toLowerCase() === staffIdentifier.toLowerCase();
    const isCash = g.payment_mode === "cash" || g.paymentMode === "cash";
    const isUnsettled = g.settlement_status !== "settled" && g.settlementStatus !== "settled";

    if (isMatchingStaff && isCash && isUnsettled) {
      const amt = Number(g.amount_paid || g.amountPaid || 0);
      settledAmount += amt;
      settledCount++;
      return {
        ...g,
        settlement_status: "settled" as const,
        settlementStatus: "settled" as const,
        settled_at: nowIso,
        settledAt: nowIso,
        settled_by: currentStaff.id,
        settledBy: currentStaff.id,
        settled_by_name: currentStaff.name,
      };
    }
    return g;
  });

  saveGrants(updatedGrants);

  const supabase = getSupabase();
  if (supabase) {
    try {
      supabase
        .from("course_grants")
        .update({ settlement_status: "settled", settled_at: nowIso, settled_by: currentStaff.id })
        .eq("payment_mode", "cash")
        .eq("settlement_status", "unsettled")
        .or(`granted_by.eq.${staffIdentifier},created_by.eq.${staffIdentifier}`)
        .then(() => {});
    } catch {}
  }

  logStaffAction(
    "CASH_SETTLEMENT",
    "grant",
    staffIdentifier,
    "Cash Settlement",
    `Main Admin settled ₹${settledAmount.toLocaleString("en-IN")} cash collected across ${settledCount} grant(s) for staff ${staffIdentifier}.`
  );

  return settledAmount;
}

export function settleSingleGrant(grantId: string): boolean {
  const currentStaff = getCurrentStaff();
  if (currentStaff.role !== "main_admin") {
    throw new Error("Unauthorized: Only Main Admin can settle cash.");
  }
  const grants = getGrants();
  const grant = grants.find((g) => g.id === grantId);
  if (!grant) return false;
  const nowIso = new Date().toISOString();

  const updatedGrants = grants.map((g) =>
    g.id === grantId
      ? {
          ...g,
          settlement_status: "settled" as const,
          settlementStatus: "settled" as const,
          settled_at: nowIso,
          settledAt: nowIso,
          settled_by: currentStaff.id,
          settledBy: currentStaff.id,
          settled_by_name: currentStaff.name,
        }
      : g
  );
  saveGrants(updatedGrants);

  const supabase = getSupabase();
  if (supabase) {
    try {
      supabase
        .from("course_grants")
        .update({
          settlement_status: "settled",
          settled_at: nowIso,
          settled_by: currentStaff.id,
        })
        .eq("id", grantId)
        .then(() => {});
    } catch {}
  }

  logStaffAction(
    "CASH_SETTLEMENT_SINGLE",
    "grant",
    grantId,
    grant.courseTitle || "Grant",
    `Main Admin marked ₹${grant.amount_paid || 0} cash settled for grant ${grantId}.`
  );

  return true;
}
