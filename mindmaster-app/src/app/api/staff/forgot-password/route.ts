import { NextResponse } from "next/server";
import { generateSmsOtp, verifyOtpAndResetPassword } from "@/lib/staffAuthService";
import { logStaffAction } from "@/lib/staffStore";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rateLimit";
import {
  staffForgotOtpRequestSchema,
  staffForgotVerifySchema,
  formatZodError,
} from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(`staff_forgot:${ip}`, 5, 60000);
    if (!rateCheck.success) {
      return rateLimitResponse(
        rateCheck.resetInSec,
        `Too many password reset requests. Please wait ${rateCheck.resetInSec} seconds before trying again.`
      );
    }

    const body = await req.json();
    const { action } = body;

    // Action 1: Request SMS OTP
    if (action === "request_otp") {
      const parsed = staffForgotOtpRequestSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
      }

      const { staff_id } = parsed.data;
      const result = generateSmsOtp(staff_id);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: `OTP sent via SMS to registered phone ending in ${result.phone?.slice(-4)}`,
        phoneMasked: result.phone ? `${result.phone.slice(0, 5)}••••${result.phone.slice(-3)}` : "",
      });
    }

    // Action 2: Verify OTP and Reset Password with Argon2
    if (action === "verify_reset") {
      const parsed = staffForgotVerifySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
      }

      const { staff_id, otp, new_password } = parsed.data;
      const resetResult = await verifyOtpAndResetPassword(staff_id, otp, new_password);
      if (!resetResult.success) {
        return NextResponse.json({ error: resetResult.error }, { status: 400 });
      }

      logStaffAction(
        "PASSWORD_RESET_SMS",
        "subadmin",
        staff_id,
        staff_id,
        "Staff member successfully reset password via verified SMS OTP"
      );

      return NextResponse.json({
        success: true,
        message: "Password reset successfully with Argon2! You may now sign in.",
      });
    }

    return NextResponse.json({ error: "Invalid action requested." }, { status: 400 });
  } catch (err: any) {
    console.error("Forgot password API error:", err);
    return NextResponse.json({ error: "Failed to process SMS OTP reset." }, { status: 500 });
  }
}
