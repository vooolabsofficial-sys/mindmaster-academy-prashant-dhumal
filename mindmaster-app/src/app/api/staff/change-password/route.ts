import { NextResponse } from "next/server";
import { findStaffAccount, StaffSessionData } from "@/lib/staffAuthService";
import { hashArgon2, verifyArgon2 } from "@/lib/argon2";
import { logStaffAction, saveStaffUser } from "@/lib/staffStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { staff_id, temp_password, new_password } = body;

    if (!staff_id || !temp_password || !new_password) {
      return NextResponse.json(
        { error: "Staff ID, current password, and new password are required." },
        { status: 400 }
      );
    }

    const staff = findStaffAccount(staff_id);
    if (!staff) {
      return NextResponse.json({ error: "Staff account not found." }, { status: 404 });
    }

    const isMatch = await verifyArgon2(temp_password, staff.password || "");
    if (!isMatch) {
      return NextResponse.json({ error: "Current/temporary password does not match." }, { status: 401 });
    }

    // Hash new password using Argon2
    const newHashedPassword = await hashArgon2(new_password);
    staff.password = newHashedPassword;
    staff.mustChangePassword = false;

    saveStaffUser(staff);

    logStaffAction(
      "STAFF_PASSWORD_CHANGE_MANDATORY",
      "subadmin",
      staff.id,
      staff.name,
      "Staff completed forced first-time password change via Argon2 hash"
    );

    // Update Session Cookie
    const sessionData: StaffSessionData = {
      staff_id: staff.staffId || staff.id,
      name: staff.name,
      phone: staff.phone,
      role: staff.role,
      permissions: staff.permissions,
      status: staff.status,
      must_change_password: false,
      logged_at: Date.now(),
    };

    const res = NextResponse.json({
      success: true,
      message: "Password updated successfully with Argon2!",
      redirect_url: staff.role === "main_admin" ? "/admin" : "/sub/videos",
    });

    res.cookies.set("mma_staff_session", JSON.stringify(sessionData), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (err: any) {
    console.error("Change password API error:", err);
    return NextResponse.json({ error: "Internal server error during password reset." }, { status: 500 });
  }
}
