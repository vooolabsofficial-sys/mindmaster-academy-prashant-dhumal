// Central MindMaster Academy Category Classification & Filtering
// Covers Memory, School, Jr College, Teacher Certification & Scholarship

export const ACADEMY_CATEGORIES = [
  "All Categories",
  "Mind Memory & Vedic Maths",
  "School (1st–10th Std)",
  "Jr. College (11th–12th)",
  "Teacher Certification",
  "Scholarship",
] as const;

export type AcademyCategory = (typeof ACADEMY_CATEGORIES)[number];

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
  targetCategory: AcademyCategory
): boolean {
  if (targetCategory === "All Categories") return true;

  const text = `${item.title || ""} ${item.titleMr || ""} ${item.description || ""} ${item.code || ""} ${item.badge || ""} ${item.badgeText || ""}`.toLowerCase();
  const cat = (item.category || "").toLowerCase();
  const stds = item.standards || [];

  switch (targetCategory) {
    case "Mind Memory & Vedic Maths":
      return (
        cat === "memory" ||
        cat === "vedic" ||
        cat === "calendar" ||
        /memory|vedic|math|गणित|स्मृती|पाढे|mind|speed|calculation|technique/i.test(text)
      );

    case "School (1st–10th Std)":
      return (
        stds.some((s) => s >= 1 && s <= 10) ||
        /1st|2nd|3rd|4th|5th|6th|7th|8th|9th|10th|school|शालेय|इयत्ता|ssc|board/i.test(text)
      );

    case "Jr. College (11th–12th)":
      return (
        stds.some((s) => s === 11 || s === 12) ||
        /11th|12th|hsc|junior college|college|अकरावी|बारावी/i.test(text)
      );

    case "Teacher Certification":
      return (
        cat === "trainer" ||
        cat === "teacher" ||
        /trainer|teacher|certification|शिक्षक|ट्रेनर|प्रशिक्षक/i.test(text)
      );

    case "Scholarship":
      return /scholarship|शिष्यवृत्ती|navodaya|नवोदय|talent|manthan/i.test(text);

    default:
      return true;
  }
}
