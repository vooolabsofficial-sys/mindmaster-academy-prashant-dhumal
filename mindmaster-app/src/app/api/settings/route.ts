import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_PLATFORM_SETTINGS } from "@/lib/staffStore";

export async function GET(req: NextRequest) {
  try {
    const staffCookie = req.cookies.get("mma_staff_session")?.value;
    let staffSession: any = null;
    if (staffCookie) {
      try {
        staffSession = JSON.parse(staffCookie);
      } catch {}
    }

    if (!staffSession || staffSession.role !== "main_admin") {
      return NextResponse.json(
        { error: "Forbidden: Platform settings require main_admin authority" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: DEFAULT_PLATFORM_SETTINGS,
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
    let staffSession: any = null;
    if (staffCookie) {
      try {
        staffSession = JSON.parse(staffCookie);
      } catch {}
    }

    if (!staffSession || staffSession.role !== "main_admin") {
      return NextResponse.json(
        { error: "Forbidden: Modifying platform settings requires main_admin authority" },
        { status: 403 }
      );
    }

    const body = await req.json();
    return NextResponse.json({
      success: true,
      settings: { ...DEFAULT_PLATFORM_SETTINGS, ...body },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to update platform settings" },
      { status: 500 }
    );
  }
}
