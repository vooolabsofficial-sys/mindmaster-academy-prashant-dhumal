export type HeaderTint = "mint" | "sky" | "peach" | "lavender" | "pink" | "locked";

export type TargetSegment = "school" | "police" | "maths" | "general";

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  durationSec: number;
  isFree: boolean;
  videoType: "youtube" | "custom";
  videoId: string; // YouTube Video ID or custom stream URL
  liveDays?: number;
  position: number;
  description?: string;
  publishAt?: string;
  removeAt?: string | null;
  status?: "active" | "expiring_soon" | "expired";
  views?: number;
  avgWatchPercent?: number;
  partNumber?: number;
  totalParts?: number;
  seriesTitle?: string;
  likesCount?: number;
}

export interface TargetSegmentConfig {
  type: "all" | "district" | "taluka" | "school" | "owners_of_course";
  district?: string;
  taluka?: string;
  school?: string;
  courseId?: string;
  courseCode?: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  titleMr: string;
  subtitle: string;
  description: string;
  headerTint: HeaderTint;
  pricePaise: number; // in paise: 99900 = ₹999
  originalPricePaise: number; // e.g. 299900 = ₹2,999
  isFree: boolean;
  accessMonths: number;
  status: "live" | "upcoming" | "scheduled" | "closed" | "removed" | "archived" | "draft";
  badgeText: string;
  badgeType: "bestseller" | "popular" | "free" | "new";
  imageSrc: string;
  instructorName: string;
  instructorTitle: string;
  totalStudents: number;
  rating: number;
  ratingCount: number;
  lessonsCount: number;
  totalDurationHours: number;
  category: "all" | "memory" | "vedic" | "police" | "calendar" | "free";
  features: string[];
  targetSegment?: TargetSegment;
  targetSegmentConfig?: TargetSegmentConfig;
  publishAt?: string; // ISO string
  removeAt?: string | null; // ISO string
  standards?: number[]; // e.g. [5,6,7]; empty/undefined = for all (other courses)
  audienceType?: "all" | "competitive" | "school";
  likesCount?: number;
}

export interface Note {
  id: string;
  userId: string;
  courseId?: string;
  courseTitle?: string;
  courseCode?: string;
  lessonId?: string;
  lessonTitle?: string;
  wordCount?: number;
  maxWordsAllowed?: number; // e.g. 200, 300 based on video length
  timestampSec?: number;
  title: string;
  body: string;
  updatedAt: string;
}

// Calculate allowed words dynamically based on video duration:
// Prevents system hang from oversized text dumps.
export function calculateAllowedWords(durationSec: number): number {
  const minutes = Math.max(1, Math.ceil(durationSec / 60));
  if (minutes <= 8) return 200;      // short drills: 200 words max
  if (minutes <= 18) return 300;     // standard lessons: 300 words max
  if (minutes <= 30) return 450;     // medium-long lessons: 450 words max
  return 600;                        // deep-dive masterclasses: 600 words max
}

export interface Book {
  id: string;
  code?: string;
  courseId?: string | null;
  courseTitle?: string;
  title: string;
  subtitle?: string;
  description?: string;
  filePath: string;
  pages: number;
  fileSizeMb: number;
  coverImage?: string;
  isFree?: boolean;
  pricePaise?: number; // in paise: e.g. 19900 = ₹199
  originalPricePaise?: number; // e.g. 49900 = ₹499
  accessMonths?: number;
  status?: "live" | "draft" | "archived";
  headerTint?: HeaderTint;
  badgeText?: string;
  createdAt?: string;
}

export interface UserProgress {
  lessonId: string;
  courseId: string;
  positionSec: number;
  completed: boolean;
  updatedAt: string;
}

export interface Purchase {
  id: string;
  userId: string;
  courseId?: string | null;
  bookId?: string | null;
  itemType?: "course" | "book";
  amountPaise: number;
  purchasedAt: string;
  expiresAt: string;
  status: "active" | "expired" | "pending" | "refunded" | "success";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  couponId?: string | null;
}

// ==========================================
// PHASE-2: STAFF & RBAC ARCHITECTURE TYPES
// ==========================================

export type StaffRole = "main_admin" | "sub_admin";

// Sub-Admin Assignable Permissions: Strictly limited to Messages and Student Finder
export type SubAdminPermission = "messages.manage" | "students.view";

export const ASSIGNABLE_PERMISSIONS: SubAdminPermission[] = [
  "messages.manage",
  "students.view",
];

// All staff permissions (Admin-only permissions are never assignable to sub-admin)
export type StaffPermission =
  | "messages.manage"
  | "students.view"
  | "videos.manage"
  | "courses.manage"
  | "coupons.manage"
  | "reports.view"
  | "notes.books.manage"
  | "freegrant.manage";

export interface StaffUser {
  id: string;
  staffId?: string;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  permissions: StaffPermission[];
  status: "active" | "suspended" | "inactive";
  lastLoginAt: string;
  mustChangePassword?: boolean;
  password?: string;
  createdAt?: string;
  createdBy?: string;
}

export function hasStaffPermission(staff: StaffUser | null | undefined, permission: StaffPermission): boolean {
  if (!staff) return false;
  if (staff.role === "main_admin") return true;
  return staff.permissions.includes(permission);
}

export interface AuditLogEntry {
  id: string;
  staffId: string;
  staffName: string;
  staffRole: StaffRole;
  action: string;
  entityType: "course" | "video" | "coupon" | "subadmin" | "settings" | "student" | "message" | "grant" | "playlist";
  entityId: string;
  entityName: string;
  details: string;
  timestamp: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  school?: string; // school name; if set, only students whose profile school matches can use this coupon
  discountType: "percentage" | "flat" | "percent";
  discountValue: number; // percentage (e.g. 25) or paise (e.g. 50000 = ₹500)
  minOrderValuePaise?: number; // minimum course price required in paise (e.g. 99900 = ₹999)
  appliesTo: "all" | "selected";
  applies_all?: boolean;
  selectedCourseIds: string[];
  selectedBookIds?: string[];
  usageLimitPerUser: "once" | "multiple";
  per_user_usage?: "once" | "multiple";
  validityType: "days" | "date_range";
  validDays?: number; // e.g. 14
  validFrom?: string; // ISO
  validUntil?: string; // ISO
  starts_at?: string; // ISO
  ends_at?: string | null; // ISO
  maxTotalUses: number;
  usage_limit?: number;
  totalUsed: number;
  used_count?: number;
  status: "active" | "expired" | "scheduled" | "disabled" | "paused";
  is_active?: boolean;
  createdAt: string;
}

export interface CouponRedemptionRecord {
  id: string;
  userId: string;
  couponId: string;
  couponCode: string;
  at: string;
  studentName?: string;
  studentMobile?: string;
  courseId?: string;
  courseTitle?: string;
  itemType?: "course" | "book";
  bookId?: string;
  bookTitle?: string;
  originalPricePaise?: number;
  discountPaise?: number;
  paidPaise?: number;
}

export interface LessonWatchStat {
  lessonId: string;
  lessonTitle: string;
  courseId: string;
  courseTitle: string;
  durationSec: number;
  totalViews: number;
  uniqueStudents: number;
  avgWatchPercentage: number;
  completionRate: number;
  totalWatchHours: number;
  recentWatches: {
    studentName: string;
    studentPhone: string;
    watchedSec: number;
    completionPct: number;
    lastWatchedAt: string;
  }[];
}

export interface StudentCourseEnrollment {
  courseId: string;
  courseCode: string;
  courseTitle: string;
  purchasedAt: string;
  expiresAt: string;
  daysLeft: number;
  progressPct: number;
  completedLessons: number;
  totalLessons: number;
  isExpired: boolean;
  itemType?: "course" | "book";
  bookId?: string;
  purchaseId?: string;
  grantId?: string;
}

export interface EnrolledBookItem {
  id: string;
  title: string;
  code?: string;
  enrolledAt: string;
  expiresAt: string;
  daysLeft: number;
  isExpired: boolean;
  purchaseId?: string;
  grantId?: string;
}

export interface StudentLessonWatchDetail {
  lessonId: string;
  lessonTitle: string;
  courseCode: string;
  watchedSec: number;
  durationSec: number;
  completionPct: number;
  lastWatchedAt: string;
  isCompleted: boolean;
}

export interface StudentActivityItem {
  id: string;
  action: string;
  description: string;
  timestamp: string;
}

export interface StudentRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  district: string;
  taluka?: string;
  school?: string;
  standard?: string;
  enrolledCourseCodes: string[];
  enrolledCourseTitles: string[];
  completedCourseCodes?: string[];
  totalPaidPaise?: number;
  progressPercentage?: number;
  lastActive?: string;
  totalWatchSec: number;
  completedLessonsCount: number;
  totalLessonsCount?: number;
  joinedAt: string;
  registeredAt?: string;
  lastActiveAt: string;
  status: "active" | "inactive";
  coursesTaken?: StudentCourseEnrollment[];
  enrolledBooks?: EnrolledBookItem[];
  lessonWatches?: StudentLessonWatchDetail[];
  recentActivity?: StudentActivityItem[];
}

