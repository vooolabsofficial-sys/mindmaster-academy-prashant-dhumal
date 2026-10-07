import { NextRequest, NextResponse } from "next/server";
import { INITIAL_WATCH_STATS } from "@/lib/mockStaffData";

export async function GET(req: NextRequest) {
  try {
    // Check staff session
    const staffCookie = req.cookies.get("mma_staff_session")?.value;
    let staffSession: any = null;
    if (staffCookie) {
      try {
        staffSession = JSON.parse(staffCookie);
      } catch {}
    }

    if (!staffSession || staffSession.role !== "main_admin") {
      return NextResponse.json(
        { error: "Forbidden: Watch statistics require main_admin authority" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      watchStats: INITIAL_WATCH_STATS,
      count: INITIAL_WATCH_STATS.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load watch statistics" },
      { status: 500 }
    );
  }
}
