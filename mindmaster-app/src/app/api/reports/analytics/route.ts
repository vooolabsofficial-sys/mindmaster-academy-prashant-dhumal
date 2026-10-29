import { NextRequest, NextResponse } from "next/server";
import { computeAnalyticsData, AnalyticsFilter } from "@/lib/analyticsEngine";
import { authenticateStaffRequest } from "@/lib/serverAuthGuard";
import { analyticsFilterSchema, formatZodError } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const { session, errorResponse } = authenticateStaffRequest(req, { requiredRole: "main_admin" });
    if (errorResponse || !session) {
      return errorResponse || NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parsed = analyticsFilterSchema.safeParse({
      range: searchParams.get("range") || "30",
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      district: searchParams.get("district") || "all",
    });

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: formatZodError(parsed.error) }, { status: 400 });
    }

    const filter: AnalyticsFilter = parsed.data as AnalyticsFilter;

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
    const { session, errorResponse } = authenticateStaffRequest(req, { requiredRole: "main_admin" });
    if (errorResponse || !session) {
      return errorResponse || NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = analyticsFilterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: formatZodError(parsed.error) }, { status: 400 });
    }

    const filter: AnalyticsFilter = parsed.data as AnalyticsFilter;

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
