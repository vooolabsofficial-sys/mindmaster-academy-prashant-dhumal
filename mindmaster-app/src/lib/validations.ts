import { z } from "zod";

/**
 * Common Phone Number Validator
 * Accepts 10-digit Indian numbers, optional +91 prefix, spaces, or dashes.
 */
export const phoneSchema = z
  .string()
  .trim()
  .refine(
    (val) => {
      const digits = val.replace(/\D/g, "");
      return digits.length >= 10 && digits.length <= 13;
    },
    { message: "Invalid mobile number. Must contain at least 10 digits." }
  );

/**
 * Password Schema
 */
export const passwordSchema = z
  .string()
  .min(4, "Password must be at least 4 characters long");

export const strongPasswordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters long");

/**
 * 4-digit PIN Schema
 */
export const recoveryPinSchema = z
  .string()
  .trim()
  .regex(/^\d{4}$/, "PIN must be exactly 4 digits");

/**
 * Optional Clean String Schema
 */
const optionalString = z.string().trim().optional().or(z.literal(""));

// ============================================================================
// STUDENT AUTH SCHEMAS
// ============================================================================

export const studentLoginSchema = z.object({
  action: z.literal("login"),
  phone: phoneSchema,
  password: z.string().min(1, "Password is required"),
});

export const studentRegisterSchema = z.object({
  action: z.literal("register"),
  phone: phoneSchema,
  password: passwordSchema,
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email address").optional().or(z.literal("")).or(z.null()),
  recoveryPin: recoveryPinSchema,
});

export const studentForgotPasswordSchema = z.object({
  action: z.literal("forgot-password"),
  phone: phoneSchema,
  recoveryPin: recoveryPinSchema,
  newPassword: passwordSchema,
});

export const studentOnboardingSchema = z.object({
  action: z.literal("complete-onboarding"),
  phone: phoneSchema,
  district: z.string().trim().min(1, "District is required"),
  taluka: z.string().trim().min(1, "Taluka is required"),
  schoolName: z.string().trim().min(1, "School name is required"),
  village: optionalString,
  fullName: optionalString,
  standard: optionalString,
  targetExam: optionalString,
});

export const studentUpdateProfileSchema = z.object({
  action: z.literal("update-profile"),
  phone: phoneSchema,
  fullName: optionalString,
  standard: optionalString,
  targetExam: optionalString,
  schoolName: optionalString,
  village: optionalString,
  taluka: optionalString,
  district: optionalString,
  newPassword: z.string().min(4).optional().or(z.literal("")),
  recoveryPin: z.string().regex(/^\d{4}$/).optional().or(z.literal("")),
});

export const studentValidateSessionSchema = z.object({
  action: z.literal("validate-session"),
  phone: optionalString,
  token: optionalString,
});

export const studentAdminResetPasswordSchema = z.object({
  action: z.literal("admin-reset-password"),
  phone: phoneSchema,
  newPassword: strongPasswordSchema,
});

export const studentAdminResetSessionSchema = z.object({
  action: z.literal("admin-reset-session"),
  phone: phoneSchema,
});

// ============================================================================
// STAFF AUTH SCHEMAS
// ============================================================================

export const staffLoginSchema = z.object({
  staff_id: z.string().trim().min(1, "Staff ID or phone is required"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["main_admin", "sub_admin", "teacher", "support"]).optional(),
});

export const staffForgotOtpRequestSchema = z.object({
  action: z.literal("request_otp"),
  staff_id: z.string().trim().min(1, "Staff ID or phone is required"),
});

export const staffForgotVerifySchema = z.object({
  action: z.literal("verify_reset"),
  staff_id: z.string().trim().min(1, "Staff ID or phone is required"),
  otp: z.string().trim().min(4, "OTP must be at least 4 digits"),
  new_password: strongPasswordSchema,
});

export const staffChangePasswordSchema = z.object({
  staff_id: z.string().trim().min(1, "Staff ID is required"),
  temp_password: z.string().min(1, "Current password is required"),
  new_password: strongPasswordSchema,
});

// ============================================================================
// CERTIFICATE SCHEMAS
// ============================================================================

export const certificateVerifySchema = z.object({
  certificateNo: z
    .string()
    .trim()
    .min(3, "Certificate number must be at least 3 characters")
    .max(64, "Certificate number is too long"),
});

export const certificateClaimSchema = z.object({
  studentId: z.string().trim().min(1, "Student ID is required"),
  studentName: z.string().trim().min(2, "Student name is required"),
  studentPhone: phoneSchema,
  courseId: z.string().trim().min(1, "Course ID is required"),
});

// ============================================================================
// COURSE & GRANT SCHEMAS
// ============================================================================

export const grantCourseSchema = z.object({
  student_phone: phoneSchema,
  course_id: z.string().trim().min(1, "Course ID is required"),
  granted_by: optionalString,
  reason: optionalString,
  expiry_days: z.number().int().positive().optional(),
});

export const grantCountPreviewSchema = z.object({
  scopeType: z.enum(["student", "all_students", "district", "taluka", "school"]),
  scopeValue: optionalString,
  courseScope: z.enum(["one", "all"]),
  courseId: optionalString,
});

// ============================================================================
// CHECKOUT & PAYMENT ACTION SCHEMAS
// ============================================================================

export const validateCouponSchema = z.object({
  couponCode: z.string().trim().min(1, "Coupon code is required").max(50),
  courseId: z.string().trim().min(1, "Course or book ID is required"),
  userId: optionalString,
  studentSchool: optionalString,
  itemType: z.enum(["course", "book"]).optional().default("course"),
  studentMobile: optionalString,
});

export const getAvailableCouponsSchema = z.object({
  itemId: z.string().trim().min(1, "Item ID is required"),
  itemType: z.enum(["course", "book"]).optional().default("course"),
  studentMobile: optionalString,
  studentSchool: optionalString,
});

export const createRazorpayOrderSchema = z.object({
  courseId: optionalString,
  bookId: optionalString,
  itemType: z.enum(["course", "book"]).optional().default("course"),
  couponCode: optionalString,
  studentMobile: phoneSchema,
  studentName: z.string().trim().min(1, "Student name is required"),
  userId: optionalString,
  studentSchool: optionalString,
});

export const verifyRazorpayPaymentSchema = z.object({
  razorpay_order_id: z.string().trim().min(1, "Razorpay Order ID is required"),
  razorpay_payment_id: z.string().trim().min(1, "Razorpay Payment ID is required"),
  razorpay_signature: z.string().trim().min(1, "Razorpay signature is required"),
  courseId: optionalString,
  bookId: optionalString,
  itemType: z.enum(["course", "book"]).optional().default("course"),
  couponCode: optionalString,
  amountPaise: z.number().nonnegative(),
  userId: optionalString,
  studentName: optionalString,
  studentMobile: optionalString,
});

// ============================================================================
// STUDENT ACCESS SERVER ACTION SCHEMAS
// ============================================================================

export const verifyStudentCourseAccessSchema = z.object({
  courseId: z.string().trim().min(1, "Course ID is required"),
  userPhone: optionalString,
  userId: optionalString,
});

export const getStudentActiveEnrollmentsSchema = z.object({
  userPhone: optionalString,
  userId: optionalString,
});

export const verifyStudentBookAccessSchema = z.object({
  bookId: z.string().trim().min(1, "Book ID is required"),
  userPhone: optionalString,
  userId: optionalString,
});

// ============================================================================
// RAZORPAY WEBHOOK SCHEMA
// ============================================================================

export const razorpayWebhookSchema = z.object({
  entity: z.string().optional(),
  account_id: z.string().optional(),
  event: z.string().min(1, "Webhook event name is required"),
  contains: z.array(z.string()).optional(),
  payload: z.record(z.string(), z.any()).optional(),
  created_at: z.number().optional(),
});

// ============================================================================
// REPORTS & ANALYTICS SCHEMAS
// ============================================================================

export const analyticsFilterSchema = z.object({
  range: z.enum(["7", "30", "custom"]).optional().default("30"),
  startDate: optionalString,
  endDate: optionalString,
  district: z.string().trim().optional().default("all"),
});

export const reportsExportQuerySchema = z.object({
  card: z.string().trim().optional().default("course-sales"),
  range: z.enum(["7", "30", "custom"]).optional().default("30"),
  startDate: optionalString,
  endDate: optionalString,
  district: z.string().trim().optional().default("all"),
});

// ============================================================================
// SETTINGS & AUDIT SCHEMAS
// ============================================================================

export const platformSettingsUpdateSchema = z.record(z.string(), z.any());

export const serverAuditLogInputSchema = z.object({
  staff_id: z.string().trim().min(1, "Staff ID is required"),
  staff_name: optionalString,
  staff_role: optionalString,
  action: z.string().trim().min(1, "Action name is required"),
  category: z.enum(["admissions", "settlements", "catalog", "security", "system"]).optional(),
  severity: z.enum(["info", "warning", "critical"]).optional(),
  entity_type: z.string().trim().min(1, "Entity type is required"),
  entity_id: optionalString,
  entity_name: optionalString,
  target_student_phone: optionalString,
  target_student_name: optionalString,
  diff: z.any().optional(),
  meta: z.any().optional(),
});

// ============================================================================
// WATCH STATS SCHEMAS
// ============================================================================

export const watchStatsGetQuerySchema = z.object({
  lesson_id: optionalString,
  user_id: optionalString,
});

export const watchStatsPostBodySchema = z.object({
  lesson_id: z.string().trim().min(1, "Lesson ID is required"),
  position_sec: z.number().nonnegative(),
  completed: z.boolean().optional().default(false),
});

// ============================================================================
// WEBSITE CMS SCHEMAS
// ============================================================================

export const websiteLeadSubmissionSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: phoneSchema,
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  courseInterest: optionalString,
  course: optionalString,
  message: optionalString,
  source: optionalString,
});

// ============================================================================
// YOUTUBE PLAYLIST IMPORT SCHEMA
// ============================================================================

export const youtubePlaylistImportSchema = z.object({
  url: optionalString,
  playlistUrl: optionalString,
  videoUrl: optionalString,
  apiKey: optionalString,
}).refine(
  (data) => Boolean(data.url || data.playlistUrl || data.videoUrl),
  { message: "YouTube URL is required" }
);

/**
 * Format Zod validation errors into a single readable string
 */
export function formatZodError(error: z.ZodError): string {
  return error.issues.map((i) => `${i.path.join(".") || "field"}: ${i.message}`).join(", ");
}
