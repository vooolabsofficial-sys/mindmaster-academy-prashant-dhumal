import { NextResponse } from "next/server";
import { generateSmsOtp, verifyOtpAndResetPassword } from "@/lib/staffAuthService";
import { logStaffAction } from "@/lib/staffStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, staff_id, otp, new_password } = body;

    // Action 1: Request SMS OTP
    if (action === "request_otp") {
      if (!staff_id) {
        return NextResponse.json({ error: "Staff ID or Phone is required." }, { status: 400 });
      }

      const result = generateSmsOtp(staff_id);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }

      // In development/test mode, otpDebug is returned to allow test automation
      return NextResponse.json({
        success: true,
        message: `OTP sent via SMS to registered phone ending in ${result.phone?.slice(-4)}`,
        phoneMasked: result.phone ? `${result.phone.slice(0, 5)}••••${result.phone.slice(-3)}` : "",
        otpDebug: result.otpDebug,
      });
    }

    // Action 2: Verify OTP and Reset Password with Argon2
    if (action === "verify_reset") {
      if (!staff_id || !otp || !new_password) {
        return NextResponse.json(
          { error: "Staff ID, OTP, and new password are required." },
          { status: 400 }
        );
      }

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
