import { Course, StudentRecord } from "./types";
import { getStaffStudents, getStaffCourses, getCurrentStaff, logStaffAction } from "./staffStore";

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
  course_id?: string;
  courseId?: string;
  courseTitle?: string;
  months: number;
  ends_at: string;
  endsAt: string;
  reason: string;
  status: "active" | "revoked";
  created_at: string;
  createdAt: string;
  affectedStudentsCount: number;
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
  status: "active" | "revoked";
  created_at: string;
  createdAt: string;
}

const STORAGE_KEY_GRANTS = "mma_grants";
const STORAGE_KEY_GRANT_PURCHASES = "mma_grant_purchases";

// Initial seed grants matching schema
const SEEDED_GRANTS: Grant[] = [
  {
    id: "grant-001",
    created_by: "staff-mma-000",
    createdBy: "staff-mma-000",
    createdByName: "Prashant Dhumal",
    scope_type: "district",
    scopeType: "district",
    scope_value: "Pune",
    scopeValue: "Pune",
    course_scope: "one",
    courseScope: "one",
    course_id: "c-mm-01",
    courseId: "c-mm-01",
    courseTitle: "Memory Technique Seminar",
    months: 3,
    ends_at: "2026-12-10T18:30:00.000Z",
    endsAt: "2026-12-10T18:30:00.000Z",
    reason: "Pune District ZP Merit Scholarship 2026 Batch",
    status: "active",
    created_at: "2026-09-01T10:00:00.000Z",
    createdAt: "2026-09-01T10:00:00.000Z",
    affectedStudentsCount: 6,
  },
  {
    id: "grant-002",
    created_by: "staff-3",
    createdBy: "staff-3",
    createdByName: "Sneha Patil (Coupons & Students)",
    scope_type: "school",
    scopeType: "school",
    scope_value: "Narhe Model High School",
    scopeValue: "Narhe Model High School",
    course_scope: "one",
    courseScope: "one",
    course_id: "c-mm-05",
    courseId: "c-mm-05",
    courseTitle: "Vedic Maths",
    months: 6,
    ends_at: "2027-03-01T18:30:00.000Z",
    endsAt: "2027-03-01T18:30:00.000Z",
    reason: "Narhe High School Annual Science & Math Olympiad Winners",
    status: "active",
    created_at: "2026-09-05T14:30:00.000Z",
    createdAt: "2026-09-05T14:30:00.000Z",
    affectedStudentsCount: 3,
  },
];

const SEEDED_PURCHASES: GrantPurchase[] = [
  {
    id: "gp-001",
    grant_id: "grant-001",
    grantId: "grant-001",
    user_id: "stu-1",
    studentId: "stu-1",
    studentName: "Rahul Shinde",
    studentPhone: "+91 98231 11223",
    course_id: "c-mm-01",
    courseId: "c-mm-01",
    courseCode: "MM-01",
    courseTitle: "Memory Technique Seminar",
    amount: 0,
    amount_paise: 0,
    pricePaise: 99900,
    source: "grant",
    expires_at: "2026-12-10T18:30:00.000Z",
    expiresAt: "2026-12-10T18:30:00.000Z",
    status: "active",
    created_at: "2026-09-01T10:00:00.000Z",
    createdAt: "2026-09-01T10:00:00.000Z",
  },
  {
    id: "gp-002",
    grant_id: "grant-001",
    grantId: "grant-001",
    user_id: "stu-2",
    studentId: "stu-2",
    studentName: "Pooja Deshmukh",
    studentPhone: "+91 94220 22334",
    course_id: "c-mm-01",
    courseId: "c-mm-01",
    courseCode: "MM-01",
    courseTitle: "Memory Technique Seminar",
    amount: 0,
    amount_paise: 0,
    pricePaise: 99900,
    source: "grant",
    expires_at: "2026-12-10T18:30:00.000Z",
    expiresAt: "2026-12-10T18:30:00.000Z",
    status: "active",
    created_at: "2026-09-01T10:00:00.000Z",
    createdAt: "2026-09-01T10:00:00.000Z",
  },
  {
    id: "gp-003",
    grant_id: "grant-002",
    grantId: "grant-002",
    user_id: "stu-3",
    studentId: "stu-3",
    studentName: "Amit Kadam",
    studentPhone: "+91 97650 33445",
    course_id: "c-mm-05",
    courseId: "c-mm-05",
    courseCode: "MM-05",
    courseTitle: "Vedic Maths",
    amount: 0,
    amount_paise: 0,
    pricePaise: 79900,
    source: "grant",
    expires_at: "2027-03-01T18:30:00.000Z",
    expiresAt: "2027-03-01T18:30:00.000Z",
    status: "active",
    created_at: "2026-09-05T14:30:00.000Z",
    createdAt: "2026-09-05T14:30:00.000Z",
  },
];

const SERVER_MEM_STORE = new Map<string, any>();

export function getGrants(): Grant[] {
  if (typeof window === "undefined") {
    return SERVER_MEM_STORE.has(STORAGE_KEY_GRANTS) ? SERVER_MEM_STORE.get(STORAGE_KEY_GRANTS) : SEEDED_GRANTS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GRANTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_GRANTS, JSON.stringify(SEEDED_GRANTS));
      return SEEDED_GRANTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return SEEDED_GRANTS;
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
    return SERVER_MEM_STORE.has(STORAGE_KEY_GRANT_PURCHASES) ? SERVER_MEM_STORE.get(STORAGE_KEY_GRANT_PURCHASES) : SEEDED_PURCHASES;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GRANT_PURCHASES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_GRANT_PURCHASES, JSON.stringify(SEEDED_PURCHASES));
      return SEEDED_PURCHASES;
    }
    return JSON.parse(raw);
  } catch (e) {
    return SEEDED_PURCHASES;
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
  months: number;
  reason: string;
}): Grant {
  const currentStaff = getCurrentStaff();
  const allCourses = getStaffCourses();
  const matchingStudents = getMatchingStudents(params.scopeType, params.scopeValue);

  if (matchingStudents.length === 0) {
    throw new Error("No students match the specified scope. Please adjust your criteria.");
  }

  // Determine target courses
  let targetCourses: Course[] = [];
  if (params.courseScope === "all") {
    targetCourses = allCourses.filter((c) => c.status !== "removed" && c.status !== "archived");
  } else {
    const single = allCourses.find((c) => c.id === params.courseId);
    if (!single) throw new Error("Please select a valid course.");
    targetCourses = [single];
  }

  const now = new Date();
  const endsAt = new Date(now.getTime() + params.months * 30 * 24 * 60 * 60 * 1000).toISOString();
  const grantId = `grant-${Date.now()}`;

  const courseTitle =
    params.courseScope === "all"
      ? "All Academy Courses"
      : targetCourses[0]?.title || "Specific Course";

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
    course_id: params.courseScope === "one" ? targetCourses[0]?.id : undefined,
    courseId: params.courseScope === "one" ? targetCourses[0]?.id : undefined,
    courseTitle,
    months: params.months,
    ends_at: endsAt,
    endsAt,
    reason: params.reason.trim(),
    status: "active",
    created_at: now.toISOString(),
    createdAt: now.toISOString(),
    affectedStudentsCount: matchingStudents.length,
  };

  // Materialize purchases for each student and each course
  // Schema: amount: 0, source: 'grant', expires_at: now + months
  const existingPurchases = getGrantPurchases();
  const newPurchases: GrantPurchase[] = [];

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
      targetCourses.forEach((c) => {
        activePurchases[c.id] = endsAt;
      });
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
    `Created free access grant ${grantId} (${params.months}m) for ${matchingStudents.length} student(s) on ${targetCourses.length} course(s). Reason: ${params.reason}`
  );

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
  full_name: string;
  district?: string;
  taluka?: string;
  school_name?: string | null;
}): { appliedGrantsCount: number; unlockedCourses: string[] } {
  const grants = getGrants();
  const allCourses = getStaffCourses();
  const now = Date.now();

  const activeGrants = grants.filter(
    (g) => g.status === "active" && new Date(g.ends_at || g.endsAt!).getTime() > now
  );

  const studentDistrict = (profile.district || "").trim().toLowerCase();
  const studentTaluka = (profile.taluka || "").trim().toLowerCase();
  const studentSchool = (profile.school_name || "").trim().toLowerCase();
  const studentPhone = profile.phone || "";
  const studentName = profile.full_name || "New Student";
  const studentId = profile.id || `stu-signup-${Date.now()}`;

  const unlockedCourses: string[] = [];
  let appliedCount = 0;
  const newPurchases: GrantPurchase[] = [];
  const existingPurchases = getGrantPurchases();

  activeGrants.forEach((grant) => {
    const scopeType = grant.scope_type || grant.scopeType;
    const scopeVal = (grant.scope_value || grant.scopeValue || "").toLowerCase();

    let matches = false;
    if (scopeType === "all_students") {
      matches = true;
    } else if (scopeType === "district" && studentDistrict && studentDistrict.includes(scopeVal)) {
      matches = true;
    } else if (scopeType === "taluka" && studentTaluka && studentTaluka.includes(scopeVal)) {
      matches = true;
    } else if (scopeType === "school" && studentSchool && studentSchool.includes(scopeVal)) {
      matches = true;
    } else if (scopeType === "student" && (scopeVal.includes(studentPhone) || scopeVal.includes(studentName.toLowerCase()))) {
      matches = true;
    }

    if (matches) {
      appliedCount++;
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
