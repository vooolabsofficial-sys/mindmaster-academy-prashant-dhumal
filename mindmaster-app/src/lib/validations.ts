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

/**
 * Format Zod validation errors into a single readable string
 */
export function formatZodError(error: z.ZodError): string {
  return error.issues.map((i) => `${i.path.join(".") || "field"}: ${i.message}`).join(", ");
}
