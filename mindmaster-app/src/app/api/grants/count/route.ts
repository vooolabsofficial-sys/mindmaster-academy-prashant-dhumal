import { NextRequest, NextResponse } from "next/server";
import { INITIAL_STUDENTS } from "@/lib/mockStaffData";
import { MOCK_COURSES } from "@/lib/mockData";

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
        { success: false, error: "Forbidden: Grants preview requires main_admin authority" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { scopeType, scopeValue, courseScope, courseId } = body;

    const val = (scopeValue || "").trim().toLowerCase();
    const students = INITIAL_STUDENTS;

    let matching = students;
    switch (scopeType) {
      case "all_students":
        matching = students;
        break;
      case "student":
        matching = students.filter(
          (s) =>
            s.id === scopeValue ||
            s.name.toLowerCase().includes(val) ||
            s.phone.includes(val) ||
            s.email.toLowerCase().includes(val)
        );
        break;
      case "district":
        matching = val ? students.filter((s) => s.district && s.district.toLowerCase().includes(val)) : [];
        break;
      case "taluka":
        matching = val ? students.filter((s) => s.taluka && s.taluka.toLowerCase().includes(val)) : [];
        break;
      case "school":
        matching = val ? students.filter((s) => s.school && s.school.toLowerCase().includes(val)) : [];
        break;
      default:
        matching = [];
    }

    const count = matching.length;

    // Calculate waived revenue
    let totalWaivedPaise = 0;
    if (count > 0) {
      if (courseScope === "all") {
        const sumCoursesPaise = MOCK_COURSES.reduce((acc, c) => acc + (c.pricePaise || 0), 0);
        totalWaivedPaise = sumCoursesPaise * count;
      } else {
        const targetCourse = MOCK_COURSES.find((c) => c.id === courseId) || MOCK_COURSES[0];
        totalWaivedPaise = (targetCourse?.pricePaise || 99900) * count;
      }
    }

    return NextResponse.json({
      success: true,
      matchingCount: count,
      matchingSample: matching.slice(0, 5).map((s) => ({
        id: s.id,
        name: s.name,
        district: s.district,
        school: s.school,
      })),
      waivedRevenuePaise: totalWaivedPaise,
      waivedRevenueRupees: Math.round(totalWaivedPaise / 100),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to calculate grant matching count." },
      { status: 500 }
    );
  }
}
