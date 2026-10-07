import { Course } from "./types";

export interface StudentProfileForTargeting {
  id?: string;
  district?: string;
  taluka?: string;
  school?: string;
  ownedCourseIds?: string[];
}

/**
 * Enforces student course visibility per business rules:
 * - course.status MUST be 'live'
 * - Current time must be >= publish_at (if set)
 * - Current time must be < remove_at (if set)
 * - Target segment must match the student's profile (All students, District, Taluka, School, or Owners-of-course)
 */
export function isCourseVisibleToStudent(
  course: Course,
  student?: StudentProfileForTargeting | null,
  nowTimestamp: number = Date.now()
): boolean {
  // 1. Must be live
  if (course.status !== "live") {
    return false;
  }

  // 2. Publish date check (now >= publishAt)
  if (course.publishAt) {
    const pubTime = new Date(course.publishAt).getTime();
    if (!isNaN(pubTime) && nowTimestamp < pubTime) {
      return false;
    }
  }

  // 3. Remove date check (now < removeAt)
  if (course.removeAt) {
    const remTime = new Date(course.removeAt).getTime();
    if (!isNaN(remTime) && nowTimestamp >= remTime) {
      return false;
    }
  }

  // 4. Granular target segment check
  if (course.targetSegmentConfig) {
    const cfg = course.targetSegmentConfig;
    if (cfg.type === "all") {
      return true;
    }
    if (!student) {
      return false;
    }
    if (cfg.type === "district" && cfg.district) {
      if (!student.district || student.district.trim().toLowerCase() !== cfg.district.trim().toLowerCase()) {
        return false;
      }
    }
    if (cfg.type === "taluka" && cfg.taluka) {
      if (!student.taluka || student.taluka.trim().toLowerCase() !== cfg.taluka.trim().toLowerCase()) {
        return false;
      }
    }
    if (cfg.type === "school" && cfg.school) {
      if (!student.school || !student.school.toLowerCase().includes(cfg.school.trim().toLowerCase())) {
        return false;
      }
    }
    if (cfg.type === "owners_of_course" && (cfg.courseId || cfg.courseCode)) {
      const owned = student.ownedCourseIds || [];
      const matches = owned.some(
        (cid) => cid === cfg.courseId || (cfg.courseCode && cid.includes(cfg.courseCode))
      );
      if (!matches) {
        return false;
      }
    }
  }

  return true;
}
