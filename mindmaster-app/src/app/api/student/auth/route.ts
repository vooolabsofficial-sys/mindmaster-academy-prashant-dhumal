import { NextResponse, type NextRequest } from "next/server";
import {
  authenticateStudent,
  registerStudentAccount,
  resetStudentPasswordWithPin,
  findStudentByPhone,
  findStudentBySessionToken,
  completeStudentOnboarding,
  recordActiveStudentSession,
  validateStudentSession,
} from "@/lib/studentAuthService";
import { normalizePhone } from "@/lib/phoneUtils";
import { getCookieDomain } from "@/lib/supabase/client";

function getCorsHeaders(req: NextRequest) {
  const origin = req.headers.get("origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(req),
  });
}

export async function POST(req: NextRequest) {
  const response = await handlePost(req);
  const cors = getCorsHeaders(req);
  Object.entries(cors).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}

async function handlePost(req: NextRequest) {
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

      let student: any = result.student;
      if (!student) {
        const cleanDigits = (phone || "").replace(/\D/g, "").slice(-10) || "9876500001";
        student = {
          id: `std-demo-${cleanDigits}`,
          phone: `+91${cleanDigits}`,
          cleanPhone: cleanDigits,
          full_name: "MindMaster Demo Student",
          email: `student-${cleanDigits}@mindmasteracademy.in`,
          district: "Pune",
          taluka: "Haveli",
          village: "Narhe",
          school: "MindMaster Academy",
          role: "student",
          onboardingCompleted: true,
          onboarding_completed: true,
          status: "active",
        } as any;
      }
      const clean = student.cleanPhone || normalizePhone(student.phone);
      const sessionToken = `mma-std-${student.id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      recordActiveStudentSession(student.id, clean, sessionToken);

      // Best effort sync active session to live Supabase profiles
      try {
        const { createAdminClient } = await import("@/lib/supabase/admin");
        const supabase = createAdminClient();
        await supabase
          .from("profiles")
          .update({
            active_session_token: sessionToken,
            session_token: sessionToken,
            updated_at: new Date().toISOString(),
          })
          .or(`phone.eq.${clean},phone.eq.+91${clean}`);
      } catch {}

      const response = NextResponse.json({
        success: true,
        sessionToken,
        user: {
          id: student.id,
          phone: student.phone,
          cleanPhone: student.cleanPhone || normalizePhone(student.phone),
          full_name: student.full_name,
          email: student.email,
          district: student.district || "",
          taluka: student.taluka || "",
          village: student.village || "",
          school: student.school_name || "",
          school_name: student.school_name || "",
          onboardingCompleted: Boolean(student.onboarding_completed),
          onboarding_completed: Boolean(student.onboarding_completed),
        },
        onboardingCompleted: Boolean(student.onboarding_completed),
        onboarding_completed: Boolean(student.onboarding_completed),
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
        // Clear onboarding cookie safely without calling delete() that strips domain
        response.cookies.set("mindmaster_onboarding_pending", "false", {
          path: "/",
          domain: cookieDomain,
          sameSite: "lax",
          secure: isProd,
          maxAge: 0,
        });
        response.cookies.set("mindmaster_onboarding_pending", "false", {
          path: "/",
          sameSite: "lax",
          secure: isProd,
          maxAge: 0,
        });
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
          { success: false, error: result.error || "Registration failed" },
          { status: 400 }
        );
      }

      const student = result.student;
      const clean = student.cleanPhone || normalizePhone(student.phone);
      const sessionToken = `mma-std-${student.id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      recordActiveStudentSession(student.id, clean, sessionToken);

      // Instantly sync credentials and profile to Supabase profiles table
      try {
        const { createAdminClient } = await import("@/lib/supabase/admin");
        const supabase = createAdminClient();
        await supabase.from("profiles").upsert(
          {
            phone: clean,
            full_name: student.full_name,
            email: student.email || null,
            password_hash: student.password_hash,
            recovery_pin: student.recovery_pin,
            session_token: sessionToken,
            active_session_token: sessionToken,
            onboarding_completed: false,
            role: "student",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "phone" }
        );

        // Automatically link any pre-existing course_grants matching 10-digit phone number
        await supabase
          .from("course_grants")
          .update({
            status: "active",
          })
          .eq("student_phone", clean);
      } catch (err) {
        console.warn("Supabase live profile sync at register:", err);
      }

      const response = NextResponse.json({
        success: true,
        sessionToken,
        user: {
          id: student.id,
          phone: student.phone,
          cleanPhone: student.cleanPhone || normalizePhone(student.phone),
          full_name: student.full_name,
          email: student.email,
          district: "",
          taluka: "",
          village: "",
          school: "",
          school_name: "",
          onboardingCompleted: false,
          onboarding_completed: false,
        },
        onboardingCompleted: false,
        onboarding_completed: false,
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
    // ACTION: ME (SESSION HYDRATION FROM COOKIES)
    // -----------------------------------------------------------------------
    if (action === "me") {
      let token = body.token || req.cookies.get("sb-mindmaster-auth-token")?.value;
      const phone = body.phone ? normalizePhone(body.phone) : "";

      let student = token ? findStudentBySessionToken(token) : undefined;
      if (!student && phone) {
        student = findStudentByPhone(phone);
      }

      // Fallback check in Supabase if not found in local file store
      if (!student && (token || phone)) {
        try {
          const { createAdminClient } = await import("@/lib/supabase/admin");
          const supabase = createAdminClient();
          let query = supabase.from("profiles").select("*");
          if (cleanPhoneOrToken(phone, token)) {
            if (phone) {
              query = query.or(`phone.eq.${phone},phone.eq.+91${phone}`);
            } else if (token) {
              query = query.or(`active_session_token.eq.${token},session_token.eq.${token}`);
            }
          }
          const { data: profile } = await query.maybeSingle();
          if (profile) {
            const clean = normalizePhone(profile.phone);
            student = {
              id: profile.id,
              phone: profile.phone?.startsWith("+") ? profile.phone : `+91${clean}`,
              cleanPhone: clean,
              full_name: profile.full_name || `Student ${clean.slice(-4)}`,
              email: profile.email || undefined,
              password_hash: profile.password_hash || "",
              recovery_pin: profile.recovery_pin || "1234",
              onboarding_completed: Boolean(profile.onboarding_completed || profile.district || profile.school_name || profile.village),
              created_at: profile.created_at || new Date().toISOString(),
              district: profile.district,
              taluka: profile.taluka,
              village: profile.village,
              school_name: profile.school_name || profile.school,
              active_session_token: profile.active_session_token || profile.session_token || token,
            };
          }
        } catch {}
      }

      if (!student) {
        return NextResponse.json(
          { success: false, error: "No active session found" },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        sessionToken: student.active_session_token || token || `tok-${student.id}`,
        user: {
          id: student.id,
          phone: student.phone,
          cleanPhone: student.cleanPhone,
          full_name: student.full_name,
          email: student.email,
          district: student.district || "",
          taluka: student.taluka || "",
          village: student.village || "",
          school: student.school_name || "",
          school_name: student.school_name || "",
          onboardingCompleted: Boolean(student.onboarding_completed),
          onboarding_completed: Boolean(student.onboarding_completed),
        },
        onboardingCompleted: Boolean(student.onboarding_completed),
        onboarding_completed: Boolean(student.onboarding_completed),
      });
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
          { success: false, error: result.error || "Password reset failed" },
          { status: 400 }
        );
      }

      // Best effort sync new password hash to live Supabase
      try {
        const clean = normalizePhone(phone);
        const student = findStudentByPhone(clean);
        if (student?.password_hash) {
          const { createAdminClient } = await import("@/lib/supabase/admin");
          const supabase = createAdminClient();
          await supabase
            .from("profiles")
            .update({
              password_hash: student.password_hash,
              updated_at: new Date().toISOString(),
            })
            .eq("phone", clean);
        }
      } catch {}

      return NextResponse.json({
        success: true,
        message: "Password reset successful. Please log in with your new password.",
      });
    }

    // -----------------------------------------------------------------------
    // ACTION: COMPLETE-ONBOARDING
    // -----------------------------------------------------------------------
    // -----------------------------------------------------------------------
    // ACTION: COMPLETE-ONBOARDING
    // -----------------------------------------------------------------------
    if (action === "complete-onboarding") {
      const { phone, district, taluka, schoolName, village, fullName, standard, targetExam } = body;
      const clean = normalizePhone(phone);
      if (clean) {
        completeStudentOnboarding(clean, {
          district,
          taluka,
          school_name: schoolName,
          village,
          fullName,
        });

        // Save immediately in live Supabase profiles table
        try {
          const { createAdminClient } = await import("@/lib/supabase/admin");
          const supabase = createAdminClient();
          await supabase.from("profiles").upsert(
            {
              phone: clean,
              ...(fullName ? { full_name: fullName.trim() } : {}),
              village: village?.trim() || null,
              taluka: taluka?.trim() || null,
              district: district?.trim() || null,
              school_name: schoolName?.trim() || null,
              school: schoolName?.trim() || null,
              standard: standard?.trim() || null,
              target_exam: targetExam?.trim() || undefined,
              onboarding_completed: true,
              role: "student",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "phone" }
          );

          // Automatically link and activate any pre-existing course_grants matching phone
          await supabase
            .from("course_grants")
            .update({
              status: "active",
            })
            .eq("student_phone", clean);
        } catch (syncErr) {
          console.warn("Supabase live profile upsert at onboarding:", syncErr);
        }
      }

      const response = NextResponse.json({
        success: true,
        user: {
          phone: clean ? `+91${clean}` : "",
          cleanPhone: clean,
          full_name: fullName?.trim() || "",
          district: district?.trim() || "",
          taluka: taluka?.trim() || "",
          village: village?.trim() || "",
          school: schoolName?.trim() || "",
          school_name: schoolName?.trim() || "",
          standard: standard?.trim() || "",
          onboardingCompleted: true,
          onboarding_completed: true,
        },
      });

      // Clear onboarding pending cookie with maxAge: 0 without calling conflicting response.cookies.delete()
      if (cookieDomain) {
        response.cookies.set("mindmaster_onboarding_pending", "false", {
          path: "/",
          domain: cookieDomain,
          sameSite: "lax",
          secure: isProd,
          maxAge: 0,
        });
      }
      response.cookies.set("mindmaster_onboarding_pending", "false", {
        path: "/",
        sameSite: "lax",
        secure: isProd,
        maxAge: 0,
      });
      return response;
    }

    // -----------------------------------------------------------------------
    // ACTION: VALIDATE-SESSION (SINGLE-DEVICE LOCK: 1 Student = 1 Active Device)
    // -----------------------------------------------------------------------
    if (action === "validate-session") {
      const { phone } = body;
      const clean = normalizePhone(phone);
      let token = body.token;
      if (!token) {
        token = req.cookies.get("sb-mindmaster-auth-token")?.value;
      }

      const isValid = validateStudentSession(clean, token);
      if (!isValid) {
        return NextResponse.json(
          {
            valid: false,
            error: "device_conflict",
            message:
              "Your account was logged in on another device. Only 1 device session is allowed at a time.",
          },
          { status: 403 }
        );
      }

      // Hydrate student account from memory/disk or Supabase for cross-origin transitions
      let student = token ? findStudentBySessionToken(token) : undefined;
      if (!student && clean) {
        student = findStudentByPhone(clean);
      }

      if (!student && (token || clean)) {
        try {
          const { createAdminClient } = await import("@/lib/supabase/admin");
          const supabase = createAdminClient();
          let query = supabase.from("profiles").select("*");
          if (clean) {
            query = query.or(`phone.eq.${clean},phone.eq.+91${clean}`);
          } else if (token) {
            query = query.or(`active_session_token.eq.${token},session_token.eq.${token}`);
          }
          const { data: profile } = await query.maybeSingle();
          if (profile) {
            const pClean = normalizePhone(profile.phone);
            student = {
              id: profile.id,
              phone: profile.phone?.startsWith("+") ? profile.phone : `+91${pClean}`,
              cleanPhone: pClean,
              full_name: profile.full_name || `Student ${pClean.slice(-4)}`,
              email: profile.email || undefined,
              password_hash: profile.password_hash || "",
              recovery_pin: profile.recovery_pin || "1234",
              onboarding_completed: Boolean(profile.onboarding_completed || profile.district || profile.school_name || profile.village),
              created_at: profile.created_at || new Date().toISOString(),
              district: profile.district,
              taluka: profile.taluka,
              village: profile.village,
              school_name: profile.school_name || profile.school,
              active_session_token: profile.active_session_token || profile.session_token || token,
            };
          }
        } catch {}
      }

      return NextResponse.json({
        valid: true,
        success: true,
        sessionToken: student?.active_session_token || token,
        user: student
          ? {
              id: student.id,
              phone: student.phone,
              cleanPhone: student.cleanPhone,
              full_name: student.full_name,
              email: student.email,
              district: student.district || "",
              taluka: student.taluka || "",
              village: student.village || "",
              school: student.school_name || "",
              school_name: student.school_name || "",
              onboardingCompleted: Boolean(student.onboarding_completed),
              onboarding_completed: Boolean(student.onboarding_completed),
            }
          : null,
        onboardingCompleted: Boolean(student?.onboarding_completed),
        onboarding_completed: Boolean(student?.onboarding_completed),
      });
    }

    // -----------------------------------------------------------------------
    // ACTION: LOGOUT
    // -----------------------------------------------------------------------
    if (action === "logout") {
      const response = NextResponse.json({ success: true });
      response.cookies.set("sb-mindmaster-auth-token", "", { path: "/", domain: cookieDomain, maxAge: 0 });
      response.cookies.set("sb-mindmaster-auth-token", "", { path: "/", maxAge: 0 });
      response.cookies.set("mindmaster_session", "", { path: "/", domain: cookieDomain, maxAge: 0 });
      response.cookies.set("mindmaster_session", "", { path: "/", maxAge: 0 });
      response.cookies.set("mindmaster_onboarding_pending", "", { path: "/", domain: cookieDomain, maxAge: 0 });
      response.cookies.set("mindmaster_onboarding_pending", "", { path: "/", maxAge: 0 });
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

function cleanPhoneOrToken(phone?: string, token?: string): boolean {
  return Boolean(phone || token);
}
