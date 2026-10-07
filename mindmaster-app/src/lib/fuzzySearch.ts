import Fuse from "fuse.js";

/**
 * Creates a fuzzy search instance for student records
 */
export function createStudentFuzzySearch<T extends Record<string, any>>(items: T[]) {
  return new Fuse(items, {
    keys: ["name", "full_name", "phone", "district", "school_name", "school", "id"],
    threshold: 0.35, // 0.0 is perfect match, 1.0 matches anything
    distance: 100,
    minMatchCharLength: 2,
    ignoreLocation: true,
  });
}

/**
 * Creates a fuzzy search instance for course / lesson records
 */
export function createCourseFuzzySearch<T extends Record<string, any>>(items: T[]) {
  return new Fuse(items, {
    keys: ["title", "code", "description", "category", "target_segment"],
    threshold: 0.4,
    ignoreLocation: true,
  });
}
