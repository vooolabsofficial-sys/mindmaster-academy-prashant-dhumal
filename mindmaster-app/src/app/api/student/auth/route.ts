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
  updateStudentProfileFields,
} from "@/lib/studentAuthService";
import { normalizePhone } from "@/lib/phoneUtils";
import { getCookieDomain } from "@/lib/supabase/client";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rateLimit";
import {
  studentLoginSchema,
  studentRegisterSchema,
  studentForgotPasswordSchema,
  studentOnboardingSchema,
  studentUpdateProfileSchema,
  studentValidateSessionSchema,
  studentAdminResetPasswordSchema,
  studentAdminResetSessionSchema,
  formatZodError,
} from "@/lib/validations";

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

    const host = req.headers.get("host") || "";
    const cookieDomain = getCookieDomain(host);
    const isProd = process.env.NODE_ENV === "production";
    const ip = getClientIp(req);

    if (
      action === "login" ||
      action === "register" ||
      action === "forgot-password" ||
      action === "reset_password"
    ) {
      // 1. IP-based Rate Limiter (5 attempts / min)
      const rate = checkRateLimit(`student_auth:${ip}`, 5, 60000);
      if (!rate.success) {
        return rateLimitResponse(
          rate.resetInSec,
          `Too many authentication attempts. Please wait ${rate.resetInSec} seconds.`
        );
      }

      // 2. Phone-based Rate Limiter (5 attempts / min per mobile number)
      if (body.phone) {
        const cleanPhone = normalizePhone(body.phone);
        if (cleanPhone) {
          const ratePhone = checkRateLimit(`student_auth_phone:${cleanPhone}`, 5, 60000);
          if (!ratePhone.success) {
            return rateLimitResponse(
              ratePhone.resetInSec,
              `Too many authentication attempts for this mobile number. Please wait ${ratePhone.resetInSec} seconds.`
            );
          }
        }
      }
    }

    // -----------------------------------------------------------------------
    // ACTION: LOGIN
    // -----------------------------------------------------------------------
    if (action === "login") {
      const parsed = studentLoginSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: formatZodError(parsed.error) },
          { status: 400 }
        );
      }
      const { phone, password } = parsed.data;
      const result = await authenticateStudent(phone, password);

      if (!result.success || !result.student) {
        return NextResponse.json(
          {
            success: false,
            code: result.code || "AUTH_FAILED",
            error: result.error || "Invalid mobile number or password.",
          },
          { status: 401 }
        );
      }

      const student = result.student;
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
      const parsed = studentRegisterSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: formatZodError(parsed.error) },
          { status: 400 }
        );
      }
      const { phone, password, fullName, email, recoveryPin } = parsed.data;
      const result = await registerStudentAccount({
        phone,
        password,
        fullName,
        email: email || undefined,
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
      const parsed = studentForgotPasswordSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: formatZodError(parsed.error) },
          { status: 400 }
        );
      }
      const { phone, recoveryPin, newPassword } = parsed.data;
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
    if (action === "complete-onboarding") {
      const parsed = studentOnboardingSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: formatZodError(parsed.error) },
          { status: 400 }
        );
      }
      const { phone, district, taluka, schoolName, village, fullName, standard, targetExam } = parsed.data;
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
    // ACTION: UPDATE-PROFILE (Phone-Style Settings /profile)
    // -----------------------------------------------------------------------
    if (action === "update-profile") {
      const parsed = studentUpdateProfileSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: formatZodError(parsed.error) },
          { status: 400 }
        );
      }
      const {
        phone,
        fullName,
        standard,
        targetExam,
        schoolName,
        village,
        taluka,
        district,
        newPassword,
        recoveryPin,
      } = parsed.data;
      const clean = normalizePhone(phone);
      if (!clean) {
        return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
      }

      let passwordHash: string | undefined;
      if (newPassword && newPassword.trim().length >= 4) {
        const { hashArgon2 } = await import("@/lib/argon2");
        passwordHash = await hashArgon2(newPassword.trim());
      }

      // Update in live Supabase profiles table
      try {
        const { createAdminClient } = await import("@/lib/supabase/admin");
        const supabase = createAdminClient();
        const updatePayload: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (fullName) updatePayload.full_name = fullName.trim();
        if (standard) updatePayload.standard = standard.trim();
        if (targetExam) updatePayload.target_exam = targetExam.trim();
        if (schoolName) {
          updatePayload.school_name = schoolName.trim();
          updatePayload.school = schoolName.trim();
        }
        if (village) updatePayload.village = village.trim();
        if (taluka) updatePayload.taluka = taluka.trim();
        if (district) updatePayload.district = district.trim();
        if (recoveryPin) updatePayload.recovery_pin = recoveryPin.trim();
        if (passwordHash) updatePayload.password_hash = passwordHash;

        await supabase
          .from("profiles")
          .update(updatePayload)
          .or(`phone.eq.${clean},phone.eq.+91${clean}`);
      } catch (err) {
        console.warn("Supabase profile update warning:", err);
      }

      // Also update in registered accounts memory/local store
      try {
        updateStudentProfileFields(clean, {
          fullName,
          standard,
          targetExam,
          schoolName,
          village,
          taluka,
          district,
          recoveryPin,
          passwordHash,
        });
      } catch {}

      return NextResponse.json({
        success: true,
        message: "Profile updated successfully.",
        user: {
          cleanPhone: clean,
          phone: `+91${clean}`,
          full_name: fullName,
          standard,
          target_exam: targetExam,
          school_name: schoolName,
          village,
          taluka,
          district,
        },
      });
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
      // Release active session in database and in-memory single-device lock if phone provided
      const rawPhone = body.phone || body.cleanPhone;
      if (rawPhone) {
        const clean = normalizePhone(rawPhone);
        if (clean) {
          try {
            const { resetStudentDeviceSessionLock } = await import("@/lib/studentAuthService");
            resetStudentDeviceSessionLock(clean);
            const { createAdminClient } = await import("@/lib/supabase/admin");
            const supabase = createAdminClient();
            await supabase
              .from("profiles")
              .update({
                active_session_token: null,
                session_token: null,
                updated_at: new Date().toISOString(),
              })
              .or(`phone.eq.${clean},phone.eq.+91${clean}`);
          } catch {}
        }
      }

      const response = NextResponse.json({ success: true, message: "Logged out successfully." });
      response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      response.headers.set("Pragma", "no-cache");
      response.headers.set("Expires", "0");

      response.cookies.set("sb-mindmaster-auth-token", "", { path: "/", domain: cookieDomain, maxAge: 0 });
      response.cookies.set("sb-mindmaster-auth-token", "", { path: "/", maxAge: 0 });
      response.cookies.set("mindmaster_session", "", { path: "/", domain: cookieDomain, maxAge: 0 });
      response.cookies.set("mindmaster_session", "", { path: "/", maxAge: 0 });
      response.cookies.set("mindmaster_onboarding_pending", "", { path: "/", domain: cookieDomain, maxAge: 0 });
      response.cookies.set("mindmaster_onboarding_pending", "", { path: "/", maxAge: 0 });
      return response;
    }

    // -----------------------------------------------------------------------
    // ACTION: RESET DEVICE SESSION (STUDENT SELF-SERVICE)
    // -----------------------------------------------------------------------
    if (action === "reset-device" || action === "reset-my-session") {
      const rawPhone = body.phone || body.cleanPhone;
      if (!rawPhone) {
        return NextResponse.json(
          { success: false, error: "Mobile number is required to reset device session." },
          { status: 400 }
        );
      }
      const clean = normalizePhone(rawPhone);
      if (clean) {
        const { resetStudentDeviceSessionLock } = await import("@/lib/studentAuthService");
        resetStudentDeviceSessionLock(clean);
        try {
          const { createAdminClient } = await import("@/lib/supabase/admin");
          const supabase = createAdminClient();
          await supabase
            .from("profiles")
            .update({
              active_session_token: null,
              session_token: null,
              updated_at: new Date().toISOString(),
            })
            .or(`phone.eq.${clean},phone.eq.+91${clean}`);
        } catch {}
      }
      return NextResponse.json({
        success: true,
        message: "Active device session reset successfully. You can now sign in on your new device.",
      });
    }

    // -----------------------------------------------------------------------
    // ACTION: ADMIN RESET PASSWORD (ARGON2ID HASHED)
    // -----------------------------------------------------------------------
    if (action === "admin-reset-password") {
      const parsed = studentAdminResetPasswordSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: formatZodError(parsed.error) },
          { status: 400 }
        );
      }
      const { phone, newPassword } = parsed.data;
      const clean = normalizePhone(phone);

      try {
        const { hashArgon2 } = await import("@/lib/argon2");
        const newHash = await hashArgon2(newPassword);

        // Update server-side in-memory / disk student accounts
        const { getStudentAccounts, saveStudentAccounts } = await import("@/lib/studentAuthService");
        const accounts = getStudentAccounts();
        const student = accounts.find((a) => a.cleanPhone === clean || a.phone.endsWith(clean));
        if (student) {
          student.password_hash = newHash;
          const all = accounts.map((acc) => (acc.cleanPhone === clean ? student : acc));
          saveStudentAccounts(all);
        }

        // Sync directly to Supabase profiles table
        const { createAdminClient } = await import("@/lib/supabase/admin");
        const supabase = createAdminClient();
        await supabase
          .from("profiles")
          .update({
            password_hash: newHash,
            updated_at: new Date().toISOString(),
          })
          .or(`phone.eq.${clean},phone.eq.+91${clean}`);

        return NextResponse.json({ success: true, message: "Password updated successfully." });
      } catch (err: any) {
        console.error("admin-reset-password API error:", err);
        return NextResponse.json(
          { success: false, error: err?.message || "Failed to update password on server." },
          { status: 500 }
        );
      }
    }

    // -----------------------------------------------------------------------
    // ACTION: ADMIN RESET SESSION LOCK
    // -----------------------------------------------------------------------
    if (action === "admin-reset-session") {
      const parsed = studentAdminResetSessionSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: formatZodError(parsed.error) },
          { status: 400 }
        );
      }
      const { phone } = parsed.data;
      const clean = normalizePhone(phone);
      if (clean) {
        const { resetStudentDeviceSessionLock } = await import("@/lib/studentAuthService");
        resetStudentDeviceSessionLock(clean);
        try {
          const { createAdminClient } = await import("@/lib/supabase/admin");
          const supabase = createAdminClient();
          await supabase
            .from("profiles")
            .update({
              active_session_token: null,
              session_token: null,
              updated_at: new Date().toISOString(),
            })
            .or(`phone.eq.${clean},phone.eq.+91${clean}`);
        } catch {}
      }
      return NextResponse.json({ success: true, message: "Session lock reset." });
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
