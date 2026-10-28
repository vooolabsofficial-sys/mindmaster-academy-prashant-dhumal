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
    const rateCheck = checkRateLimit(`staff_login:${ip}`, 5, 60000);
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

    const { staff_id, password, role: expectedRole } = parsed.data;
    const cleanStaffId = staff_id.trim();

    // 1. Lockout Check (Lock out after 5 failures for 15 minutes)
    const lockout = getLockoutStatus(cleanStaffId);
    if (lockout.isLocked) {
      const minutesLeft = Math.ceil(lockout.remainingSec / 60);
      return NextResponse.json(
        {
          error: `Account locked due to 5 consecutive failed attempts. Try again in ${minutesLeft} minute(s) or reset password via SMS OTP.`,
          isLocked: true,
          remainingSec: lockout.remainingSec,
        },
        { status: 423 } // 423 Locked
      );
    }

    // 2. Locate Staff Account (Supabase live DB first, fallback to store)
    let staff = findStaffAccount(cleanStaffId);
    try {
      const { createAdminClient } = require("@/lib/supabase/admin");
      const supabase = createAdminClient();
      const normPhone = normalizePhone(cleanStaffId);
      const orFilter = normPhone && normPhone.length === 10
        ? `staff_id.ilike.${cleanStaffId},phone.eq.${cleanStaffId},phone.eq.${normPhone},phone.eq.+91${normPhone}`
        : `staff_id.ilike.${cleanStaffId},phone.eq.${cleanStaffId}`;
      const { data: dbStaff } = await supabase
        .from("staff_accounts")
        .select("*, staff_permissions(permission_key)")
        .or(orFilter)
        .maybeSingle();

      if (dbStaff) {
        staff = {
          id: dbStaff.id,
          staffId: dbStaff.staff_id,
          name: dbStaff.full_name,
          email: dbStaff.email || `${(dbStaff.staff_id || "staff").toLowerCase()}@mindmasteracademy.in`,
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
    } catch {}

    if (!staff) {
      return NextResponse.json(
        { error: "No staff account found with this ID or Phone." },
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

    // 3b. Role Mode Strict Separation
    if (expectedRole === "main_admin" && staff.role !== "main_admin") {
      return NextResponse.json(
        { error: "Access denied: This login window is strictly for Main Admin (Prashant Sir). Please use Sub-Admin Login." },
        { status: 403 }
      );
    }

    if (expectedRole === "sub_admin" && staff.role !== "sub_admin") {
      return NextResponse.json(
        { error: "Access denied: This login window is strictly for Sub-Admin staff. Please use Main Admin Login." },
        { status: 403 }
      );
    }

    // 4. Verify Password (Argon2 hash or configured stored password)
    const isValid = staff.password
      ? ((await verifyArgon2(password, staff.password)) || password === staff.password)
      : false;

    if (!isValid) {
      const { locked, attemptsLeft } = recordFailedAttempt(cleanStaffId);
      return NextResponse.json(
        {
          error: locked
            ? "Account locked after 5 consecutive failed attempts. Reset via SMS OTP."
            : `Incorrect password. ${attemptsLeft} attempt(s) remaining before lockout.`,
          attemptsLeft,
          isLocked: locked,
        },
        { status: 401 }
      );
    }

    // 5. Successful Verification -> Clear Lockout Counters
    clearFailedAttempts(cleanStaffId);

    // Prepare Session Data
    const sessionData: StaffSessionData = {
      staff_id: staff.staffId || staff.id,
      name: staff.name,
      phone: staff.phone,
      role: staff.role,
      permissions: staff.permissions,
      status: staff.status,
      must_change_password: staff.mustChangePassword || false,
      logged_at: Date.now(),
    };

    const res = NextResponse.json({
      success: true,
      staff: sessionData,
      must_change_password: staff.mustChangePassword || false,
      role: staff.role,
      redirect_url: staff.mustChangePassword
        ? "/staff/change-password"
        : staff.role === "main_admin"
        ? "/admin"
        : "/sub",
    });

    // Set secure HTTP session cookie
    const signedToken = signStaffSession(sessionData);
    res.cookies.set("mma_staff_session", signedToken, {
      httpOnly: false, // accessible to client auth store
      secure: process.env.NODE_ENV === "production",
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
