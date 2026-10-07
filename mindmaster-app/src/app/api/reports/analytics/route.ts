import { NextRequest, NextResponse } from "next/server";
import { computeAnalyticsData, AnalyticsFilter } from "@/lib/analyticsEngine";

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
        { success: false, error: "Forbidden: Analytics Hub requires main_admin authority" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const range = (searchParams.get("range") || "30") as "7" | "30" | "custom";
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const district = searchParams.get("district") || "all";

    const filter: AnalyticsFilter = {
      range,
      startDate,
      endDate,
      district,
    };

    const data = computeAnalyticsData(filter);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Error computing analytics data:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to load analytics" },
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
        { success: false, error: "Forbidden: Analytics Hub requires main_admin authority" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const range = (body.range || "30") as "7" | "30" | "custom";
    const startDate = body.startDate || undefined;
    const endDate = body.endDate || undefined;
    const district = body.district || "all";

    const filter: AnalyticsFilter = {
      range,
      startDate,
      endDate,
      district,
    };

    const data = computeAnalyticsData(filter);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Error computing analytics data:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to load analytics" },
      { status: 500 }
    );
  }
}
