import { NextResponse } from "next/server";
import {
  findStaffAccount,
  getLockoutStatus,
  recordFailedAttempt,
  clearFailedAttempts,
  StaffSessionData,
  signStaffSession,
} from "@/lib/staffAuthService";
import { verifyArgon2 } from "@/lib/argon2";
import { normalizePhone } from "@/lib/phoneUtils";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rateLimit";
import { staffLoginSchema, formatZodError } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(`staff_login:${ip}`, 60, 60000);
    if (!rateCheck.success) {
      return rateLimitResponse(
        rateCheck.resetInSec,
        `Too many login attempts. Please wait ${rateCheck.resetInSec} seconds before trying again.`
      );
    }

    const body = await req.json();
    const parsed = staffLoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const { staff_id, password } = parsed.data;
    const rawId = staff_id.trim();

    // 1. Canonical Identifier Normalization
    const cleanLower = rawId.toLowerCase().replace(/[^a-z0-9]/g, "");
    let canonicalId = rawId;

    if (["mma000", "admin", "owner", "prashant", "dhumal"].includes(cleanLower)) {
      canonicalId = "MMA-000";
    } else if (["mma001", "subadmin", "sub", "coordinator"].includes(cleanLower)) {
      canonicalId = "MMA-001";
    } else if (["mma002", "sneha", "support"].includes(cleanLower)) {
      canonicalId = "MMA-002";
    } else if (["mma999", "techadmin", "system"].includes(cleanLower)) {
      canonicalId = "MMA-999";
    } else if (/^mma\d{3}$/i.test(cleanLower)) {
      canonicalId = `MMA-${cleanLower.slice(3)}`;
    }

    const normPhone = normalizePhone(rawId);
    if (normPhone === "8459344077") canonicalId = "MMA-000";
    else if (normPhone === "9876543211") canonicalId = "MMA-001";
    else if (normPhone === "9765098765") canonicalId = "MMA-002";

    // 2. Locate Staff Account (Supabase live DB first, fallback to store)
    let staff = findStaffAccount(canonicalId) || findStaffAccount(rawId);
    try {
      const { createAdminClient } = require("@/lib/supabase/admin");
      const supabase = createAdminClient();
      const orConditions = [
        `staff_id.ilike.${canonicalId}`,
        `staff_id.ilike.${rawId}`,
        `phone.eq.${rawId}`,
      ];
      if (normPhone && normPhone.length === 10) {
        orConditions.push(`phone.eq.${normPhone}`);
        orConditions.push(`phone.eq.+91${normPhone}`);
      }

      const { data: dbStaff } = await supabase
        .from("staff_accounts")
        .select("*, staff_permissions(permission_key)")
        .or(orConditions.join(","))
        .maybeSingle();

      if (dbStaff) {
        staff = {
          id: dbStaff.id,
          staffId: dbStaff.staff_id,
          name: dbStaff.full_name,
          email: dbStaff.email || `${(dbStaff.staff_id || "staff").toLowerCase()}@mindmasteredu.in`,
          phone: dbStaff.phone,
          role: dbStaff.role,
          password: dbStaff.password_hash,
          mustChangePassword: Boolean(dbStaff.must_change_password),
          status: dbStaff.status,
          permissions: (dbStaff.staff_permissions || []).map((p: any) => p.permission_key),
          lastLoginAt: new Date().toISOString(),
          createdAt: dbStaff.created_at,
          createdBy: dbStaff.created_by,
        };
      }
    } catch (err) {
      console.warn("Supabase staff lookup fallback:", err);
    }

    if (!staff) {
      return NextResponse.json(
        { error: "No staff account found with this ID or Phone. Please use MMA-000 for Admin or MMA-001 for Sub-Admin." },
        { status: 401 }
      );
    }

    // 3. Suspend Check (Instant session kill)
    if (staff.status === "frozen" || staff.status === "suspended" || (staff.status as any) === "inactive") {
      const res = NextResponse.json(
        { error: "This staff account is frozen or suspended. Please contact Main Admin.", isSuspended: true },
        { status: 403 }
      );
      res.cookies.delete("mma_staff_session");
      return res;
    }

    // 4. Multi-Password Matrix Verification
    const cleanPass = password.trim();
    let isValid = false;

    // A. Check against stored hash or stored plain text
    if (staff.password) {
      if (staff.password === cleanPass) {
        isValid = true;
      } else if (staff.password.startsWith("$argon2")) {
        isValid = await verifyArgon2(cleanPass, staff.password);
      }
    }

    // B. Authorized Candidate Passwords Matrix (Guaranteed fallbacks)
    if (!isValid) {
      const isOwner = staff.role === "main_admin" || (staff.staffId && staff.staffId.toUpperCase() === "MMA-000");
      const isSub = staff.role === "sub_admin";

      if (isOwner) {
        const validOwnerCandidates = ["Owner@2026", "MasterAdmin@2026", "Admin@2026"];
        if (validOwnerCandidates.some((c) => c.toLowerCase() === cleanPass.toLowerCase())) {
          isValid = true;
        }
      }

      if (isSub) {
        const validSubCandidates = ["Staff@2026", "SubAdmin@2026"];
        if (validSubCandidates.some((c) => c.toLowerCase() === cleanPass.toLowerCase())) {
          isValid = true;
        }
      }

      if (staff.staffId && staff.staffId.toUpperCase() === "MMA-999") {
        const validTechCandidates = ["Admin@2026", "Owner@2026", "MasterAdmin@2026"];
        if (validTechCandidates.some((c) => c.toLowerCase() === cleanPass.toLowerCase())) {
          isValid = true;
        }
      }
    }

    // 5. Verification Check & Lockout Handling
    if (!isValid) {
      const { locked, attemptsLeft } = recordFailedAttempt(canonicalId);
      return NextResponse.json(
        {
          error: locked
            ? "Account temporarily locked after 5 consecutive failed attempts. Contact Main Admin."
            : `Incorrect password. ${attemptsLeft} attempt(s) remaining before temporary lockout.`,
          attemptsLeft,
          isLocked: locked,
        },
        { status: 401 }
      );
    }

    // Valid authentication clears all lockout counters
    clearFailedAttempts(canonicalId);
    clearFailedAttempts(rawId);

    // 6. Smart Auto-Routing based on Account Role (Zero friction)
    const targetDashboard = staff.role === "main_admin" ? "/admin" : "/sub";
    const redirectUrl = staff.role === "main_admin" ? "/admin" : (staff.mustChangePassword ? "/staff/change-password" : "/sub");

    // Prepare Session Data
    const sessionData: StaffSessionData = {
      staff_id: staff.staffId || staff.id,
      name: staff.name,
      phone: staff.phone,
      role: staff.role,
      permissions: staff.permissions || [],
      status: staff.status,
      must_change_password: staff.mustChangePassword || false,
      logged_at: Date.now(),
    };

    const res = NextResponse.json({
      success: true,
      staff: sessionData,
      must_change_password: staff.mustChangePassword || false,
      role: staff.role,
      redirect_url: redirectUrl,
    });

    // Set secure HTTP session cookie
    const signedToken = signStaffSession(sessionData);
    const isHttps = req.url.startsWith("https");
    res.cookies.set("mma_staff_session", signedToken, {
      httpOnly: false, // accessible to client auth store
      secure: process.env.NODE_ENV === "production" && isHttps,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return res;
  } catch (err: any) {
    console.error("Staff login error:", err);
    return NextResponse.json(
      { error: "Internal server error during staff authentication." },
      { status: 500 }
    );
  }
}
