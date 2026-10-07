import { NextResponse, type NextRequest } from "next/server";
import {
  authenticateStudent,
  registerStudentAccount,
  resetStudentPasswordWithPin,
  findStudentByPhone,
} from "@/lib/studentAuthService";
import { getCookieDomain } from "@/lib/supabase/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    const cookieDomain = getCookieDomain();
    const isProd = process.env.NODE_ENV === "production";

    // -----------------------------------------------------------------------
    // ACTION: LOGIN
    // -----------------------------------------------------------------------
    if (action === "login") {
      const { phone, password } = body;
      const result = await authenticateStudent(phone, password);

      if (!result.success || !result.student) {
        return NextResponse.json(
          { success: false, error: result.error || "लॉगिन अयशस्वी (Login failed)" },
          { status: 401 }
        );
      }

      const student = result.student;
      const sessionToken = `mma-std-${student.id}-${Date.now()}`;

      const response = NextResponse.json({
        success: true,
        user: {
          id: student.id,
          phone: student.phone,
          full_name: student.full_name,
          email: student.email,
        },
        onboardingCompleted: student.onboarding_completed,
        redirect: student.onboarding_completed ? "/home" : "/onboarding",
      });

      // Set auth cookies compatible with middleware
      response.cookies.set("sb-mindmaster-auth-token", sessionToken, {
        path: "/",
        domain: cookieDomain,
        sameSite: "lax",
        secure: isProd,
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });

      response.cookies.set("mindmaster_session", "true", {
        path: "/",
        domain: cookieDomain,
        sameSite: "lax",
        secure: isProd,
        maxAge: 60 * 60 * 24 * 30,
      });

      if (!student.onboarding_completed) {
        response.cookies.set("mindmaster_onboarding_pending", "true", {
          path: "/",
          domain: cookieDomain,
          sameSite: "lax",
          secure: isProd,
          maxAge: 60 * 60 * 24,
        });
      } else {
        response.cookies.delete("mindmaster_onboarding_pending");
      }

      return response;
    }

    // -----------------------------------------------------------------------
    // ACTION: REGISTER
    // -----------------------------------------------------------------------
    if (action === "register") {
      const { phone, password, fullName, email, recoveryPin } = body;
      const result = await registerStudentAccount({
        phone,
        password,
        fullName,
        email,
        recoveryPin,
      });

      if (!result.success || !result.student) {
        return NextResponse.json(
          { success: false, error: result.error || "नोंदणी अयशस्वी (Registration failed)" },
          { status: 400 }
        );
      }

      const student = result.student;
      const sessionToken = `mma-std-${student.id}-${Date.now()}`;

      const response = NextResponse.json({
        success: true,
        user: {
          id: student.id,
          phone: student.phone,
          full_name: student.full_name,
          email: student.email,
        },
        onboardingCompleted: false,
        redirect: "/onboarding",
      });

      response.cookies.set("sb-mindmaster-auth-token", sessionToken, {
        path: "/",
        domain: cookieDomain,
        sameSite: "lax",
        secure: isProd,
        maxAge: 60 * 60 * 24 * 30,
      });

      response.cookies.set("mindmaster_session", "true", {
        path: "/",
        domain: cookieDomain,
        sameSite: "lax",
        secure: isProd,
        maxAge: 60 * 60 * 24 * 30,
      });

      response.cookies.set("mindmaster_onboarding_pending", "true", {
        path: "/",
        domain: cookieDomain,
        sameSite: "lax",
        secure: isProd,
        maxAge: 60 * 60 * 24,
      });

      return response;
    }

    // -----------------------------------------------------------------------
    // ACTION: FORGOT-PASSWORD (PIN RESET)
    // -----------------------------------------------------------------------
    if (action === "forgot-password") {
      const { phone, recoveryPin, newPassword } = body;
      const result = await resetStudentPasswordWithPin({
        phone,
        recoveryPin,
        newPassword,
      });

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || "पासवर्ड रिसेट अयशस्वी (Reset failed)" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "पासवर्ड यशस्वीरित्या बदलला आहे! आता नवीन पासवर्डने लॉगिन करा (Password reset successful. Please log in).",
      });
    }

    // -----------------------------------------------------------------------
    // ACTION: LOGOUT
    // -----------------------------------------------------------------------
    if (action === "logout") {
      const response = NextResponse.json({ success: true });
      response.cookies.delete("sb-mindmaster-auth-token");
      response.cookies.delete("mindmaster_session");
      response.cookies.delete("mindmaster_onboarding_pending");
      return response;
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("Student auth route error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
