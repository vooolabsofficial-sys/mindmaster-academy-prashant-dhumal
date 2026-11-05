// Dynamic MindMaster Academy Category Classification & Filtering
// Synchronized in real-time across Admin, Sub-Admin, and Student Portal

import { getCategories, CategoryItem } from "./categoryStore";

export type AcademyCategory = string;

/**
 * Returns dynamic category filter names created by Admin / Sub-Admin.
 * Always includes "All Categories" as the first tab.
 */
export function getDynamicCategoryList(): string[] {
  const dynamicCats = getCategories();
  const labels = dynamicCats.map((c) => c.label).filter(Boolean);
  return ["All Categories", ...labels];
}

// Fallback constant for backwards compatibility
export const ACADEMY_CATEGORIES = [
  "All Categories",
] as const;

export function matchesAcademyCategory(
  item: {
    title?: string;
    titleMr?: string;
    description?: string;
    category?: string;
    code?: string;
    badge?: string;
    badgeText?: string;
    standards?: number[];
  },
  targetCategory: string
): boolean {
  if (!targetCategory || targetCategory === "All Categories" || targetCategory === "सर्व प्रवर्ग") {
    return true;
  }

  const normalizedTarget = targetCategory.toLowerCase().trim();
  const currentCats = getCategories();
  const matchedCat = currentCats.find(
    (c) =>
      c.label.toLowerCase() === normalizedTarget ||
      c.key.toLowerCase() === normalizedTarget ||
      c.id.toLowerCase() === normalizedTarget ||
      c.badge.toLowerCase() === normalizedTarget ||
      (c.labelMr && c.labelMr.toLowerCase() === normalizedTarget)
  );

  const itemCat = (item.category || "").toLowerCase().trim();
  const itemCode = (item.code || "").toLowerCase().trim();
  const itemTitle = `${item.title || ""} ${item.titleMr || ""}`.toLowerCase();
  const itemDesc = (item.description || "").toLowerCase();

  // 1. Direct match with course category field
  if (itemCat && (itemCat === normalizedTarget || (matchedCat && itemCat === matchedCat.key.toLowerCase()))) {
    return true;
  }

  // 2. Direct match with category ID or key
  if (matchedCat) {
    if (itemCat === matchedCat.id.toLowerCase() || itemCat === matchedCat.key.toLowerCase()) {
      return true;
    }
    // Match standards if defined on dynamic category
    if (matchedCat.standards && matchedCat.standards.length > 0 && item.standards) {
      if (item.standards.some((s) => matchedCat.standards!.includes(s))) {
        return true;
      }
    }
  }

  // 3. Match against title / badge / description
  if (itemTitle.includes(normalizedTarget) || itemDesc.includes(normalizedTarget)) {
    return true;
  }

  // 4. Match against badge
  const itemBadge = `${item.badge || ""} ${item.badgeText || ""}`.toLowerCase();
  if (itemBadge.includes(normalizedTarget)) {
    return true;
  }

  return false;
}
