import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_PLATFORM_SETTINGS, fetchDbSettings, savePlatformSettings } from "@/lib/staffStore";
import { verifyStaffSession } from "@/lib/staffAuthService";

export async function GET(req: NextRequest) {
  try {
    const staffCookie = req.cookies.get("mma_staff_session")?.value;
    const staffSession = staffCookie ? verifyStaffSession(staffCookie) : null;
    const isMainAdmin = staffSession && staffSession.role === "main_admin" && staffSession.status === "active";

    const settings = await fetchDbSettings();
    const data = settings || DEFAULT_PLATFORM_SETTINGS;

    if (!isMainAdmin) {
      // Public-safe settings for students & visitors
      return NextResponse.json({
        success: true,
        settings: {
          maintenance: Boolean(data.maintenance),
          reminder_template: data.reminder_template,
          support_phone: data.support_phone,
          support_email: data.support_email,
          centre_address: data.centre_address,
          academy_title: data.academy_title,
          founder_name: data.founder_name,
          razorpay_key_id: data.razorpay_key_id,
          razorpay_mode: data.razorpay_mode,
        },
      });
    }

    return NextResponse.json({
      success: true,
      settings: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load platform settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const staffCookie = req.cookies.get("mma_staff_session")?.value;
    const staffSession = staffCookie ? verifyStaffSession(staffCookie) : null;

    if (!staffSession || staffSession.role !== "main_admin" || staffSession.status !== "active") {
      const res = NextResponse.json(
        { error: "Forbidden: Modifying platform settings requires active main_admin authority" },
        { status: 403 }
      );
      if (staffSession && staffSession.status !== "active") {
        res.cookies.delete("mma_staff_session");
      }
      return res;
    }

    const body = await req.json();
    const current = await fetchDbSettings();
    const updated = { ...current, ...body };
    savePlatformSettings(updated);

    return NextResponse.json({
      success: true,
      settings: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to update platform settings" },
      { status: 500 }
    );
  }
}
