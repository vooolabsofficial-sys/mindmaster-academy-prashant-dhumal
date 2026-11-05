import { Course } from "./types";
import { ExtendedVideoRow, saveLessonToSupabase, deleteLessonFromSupabase, syncCourseLessonCount } from "./playlistStore";
import { saveCourseToSupabase, deleteCourseFromSupabase, getStaffCourses, saveStaffCourse } from "./staffStore";
import { createClient } from "./supabase/client";

export interface CategoryItem {
  id: string;
  key: string;
  label: string;
  labelMr?: string;
  badge: string;
  category?: "all" | "memory" | "vedic" | "trainer" | "calendar" | "free" | "police" | string;
  standards?: number[];
  audienceType?: "all" | "competitive" | "school";
  description?: string;
  isDefault?: boolean;
  order?: number;
  createdAt: string;
}

export interface RecycleBinItem {
  id: string;
  itemType: "course" | "video" | "category";
  itemId: string;
  title: string;
  subtitle?: string;
  deletedAt: string;
  data: any; // Serialized item to restore
}

const STORAGE_KEY_CATEGORIES = "mma_dynamic_categories";
const STORAGE_KEY_RECYCLE_BIN = "mma_recycle_bin";

// Clean Slate: Zero hardcoded dummy categories
export const DEFAULT_CATEGORIES: CategoryItem[] = [];

// Helper: safe localStorage access
function safeGetItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function safeSetItem(key: string, val: any): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

// ============================================================================
// 1. DYNAMIC CATEGORY MANAGEMENT
// ============================================================================

export function getCategories(): CategoryItem[] {
  return safeGetItem<CategoryItem[]>(STORAGE_KEY_CATEGORIES, DEFAULT_CATEGORIES);
}

export function saveCategory(cat: Partial<CategoryItem>): CategoryItem {
  const current = getCategories();
  const id = cat.id || `cat_${Date.now()}`;
  const key = cat.key || cat.label?.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 30) || `cat_${Date.now()}`;
  
  const newItem: CategoryItem = {
    id,
    key,
    label: cat.label?.trim() || "New Category",
    labelMr: cat.labelMr?.trim() || undefined,
    badge: cat.badge?.trim() || cat.label?.trim() || "Category",
    category: cat.category || "memory",
    standards: cat.standards || undefined,
    audienceType: cat.audienceType || "all",
    description: cat.description?.trim() || "",
    isDefault: Boolean(cat.isDefault),
    order: cat.order ?? (cat.id ? current.find((c) => c.id === cat.id)?.order : current.length + 1) ?? 1,
    createdAt: cat.createdAt || new Date().toISOString(),
  };

  const idx = current.findIndex((c) => c.id === id);
  let updated: CategoryItem[];
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = newItem;
  } else {
    updated = [...current, newItem];
  }

  safeSetItem(STORAGE_KEY_CATEGORIES, updated);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("mma_categories_changed"));
    window.dispatchEvent(new Event("mindmaster_categories_updated"));
  }
  return newItem;
}

export function renameCategory(id: string, newLabel: string, newBadge: string, newDesc?: string, newLabelMr?: string): boolean {
  const current = getCategories();
  const target = current.find((c) => c.id === id);
  if (!target) return false;

  target.label = newLabel.trim();
  target.badge = newBadge.trim() || newLabel.trim();
  if (newDesc !== undefined) target.description = newDesc.trim();
  if (newLabelMr !== undefined) target.labelMr = newLabelMr.trim();

  safeSetItem(STORAGE_KEY_CATEGORIES, current);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("mma_categories_changed"));
    window.dispatchEvent(new Event("mindmaster_categories_updated"));
  }
  return true;
}

export function moveCategory(id: string, direction: "up" | "down"): boolean {
  const current = [...getCategories()];
  const idx = current.findIndex((c) => c.id === id);
  if (idx < 0) return false;
  if (direction === "up" && idx === 0) return false;
  if (direction === "down" && idx === current.length - 1) return false;

  const targetIdx = direction === "up" ? idx - 1 : idx + 1;
  const temp = current[idx];
  current[idx] = current[targetIdx];
  current[targetIdx] = temp;

  // Update order property
  current.forEach((cat, index) => {
    cat.order = index + 1;
  });

  safeSetItem(STORAGE_KEY_CATEGORIES, current);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("mma_categories_changed"));
    window.dispatchEvent(new Event("mindmaster_categories_updated"));
  }
  return true;
}

export function reorderCategories(orderedIds: string[]): CategoryItem[] {
  const current = getCategories();
  const map = new Map(current.map((c) => [c.id, c]));
  const reordered: CategoryItem[] = [];

  orderedIds.forEach((id, idx) => {
    const item = map.get(id);
    if (item) {
      item.order = idx + 1;
      reordered.push(item);
      map.delete(id);
    }
  });

  // Append any unmentioned categories at the end
  map.forEach((item) => {
    item.order = reordered.length + 1;
    reordered.push(item);
  });

  safeSetItem(STORAGE_KEY_CATEGORIES, reordered);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("mma_categories_changed"));
    window.dispatchEvent(new Event("mindmaster_categories_updated"));
  }
  return reordered;
}

export function deleteCategory(id: string): { success: boolean; deleted: CategoryItem | null } {
  const current = getCategories();
  const target = current.find((c) => c.id === id);
  if (!target) return { success: false, deleted: null };

  const updated = current.filter((c) => c.id !== id);
  safeSetItem(STORAGE_KEY_CATEGORIES, updated);

  // Send to Recycle Bin so Admin can Undo!
  addToRecycleBin({
    itemType: "category",
    itemId: target.id,
    title: target.label,
    subtitle: `प्रवर्ग (${target.badge})`,
    data: target,
  });

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("mma_categories_changed"));
    window.dispatchEvent(new Event("mindmaster_categories_updated"));
  }
  return { success: true, deleted: target };
}

// ============================================================================
// 2. RECYCLE BIN (कचरापेटी / TRASH & UNDO LIFECYCLE)
// ============================================================================

export function getRecycleBinItems(): RecycleBinItem[] {
  return safeGetItem<RecycleBinItem[]>(STORAGE_KEY_RECYCLE_BIN, []);
}

export function addToRecycleBin(item: Omit<RecycleBinItem, "id" | "deletedAt">): RecycleBinItem {
  const current = getRecycleBinItems();
  const newEntry: RecycleBinItem = {
    id: `rb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    itemType: item.itemType,
    itemId: item.itemId,
    title: item.title,
    subtitle: item.subtitle,
    deletedAt: new Date().toISOString(),
    data: item.data,
  };

  const updated = [newEntry, ...current];
  safeSetItem(STORAGE_KEY_RECYCLE_BIN, updated);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("mma_recycle_bin_changed"));
  }
  return newEntry;
}

/**
 * Undo / Restore item from Recycle Bin back into active circulation
 */
export async function restoreFromRecycleBin(recycleBinId: string): Promise<{ success: boolean; item: RecycleBinItem | null }> {
  const current = getRecycleBinItems();
  const target = current.find((i) => i.id === recycleBinId);
  if (!target) return { success: false, item: null };

  try {
    if (target.itemType === "course") {
      const course: Course = target.data;
      const restoredCourse: Course = {
        ...course,
        status: "live",
      };
      await saveCourseToSupabase(restoredCourse);
    } else if (target.itemType === "video") {
      const video: ExtendedVideoRow = target.data;
      await saveLessonToSupabase({
        ...video,
        status: "active",
      });
      if (video.courseId) {
        await syncCourseLessonCount(video.courseId);
      }
    } else if (target.itemType === "category") {
      const cat: CategoryItem = target.data;
      const cats = getCategories();
      if (!cats.some((c) => c.id === cat.id)) {
        safeSetItem(STORAGE_KEY_CATEGORIES, [...cats, cat]);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("mma_categories_changed"));
        }
      }
    }

    // Remove from Recycle Bin
    const updated = current.filter((i) => i.id !== recycleBinId);
    safeSetItem(STORAGE_KEY_RECYCLE_BIN, updated);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("mma_recycle_bin_changed"));
    }

    return { success: true, item: target };
  } catch (err) {
    console.error("Failed to restore from recycle bin:", err);
    return { success: false, item: target };
  }
}

/**
 * Permanently delete item from database
 */
export async function permanentlyDeleteFromRecycleBin(recycleBinId: string): Promise<boolean> {
  const current = getRecycleBinItems();
  const target = current.find((i) => i.id === recycleBinId);
  if (!target) return false;

  try {
    if (target.itemType === "course") {
      await deleteCourseFromSupabase(target.itemId);
    } else if (target.itemType === "video") {
      await deleteLessonFromSupabase(target.itemId, target.data?.courseId || "");
      if (target.data?.courseId) {
        await syncCourseLessonCount(target.data.courseId);
      }
    }

    const updated = current.filter((i) => i.id !== recycleBinId);
    safeSetItem(STORAGE_KEY_RECYCLE_BIN, updated);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("mma_recycle_bin_changed"));
    }
    return true;
  } catch (err) {
    console.error("Permanent delete failed:", err);
    return false;
  }
}

export function clearRecycleBin(): void {
  safeSetItem(STORAGE_KEY_RECYCLE_BIN, []);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("mma_recycle_bin_changed"));
  }
}
