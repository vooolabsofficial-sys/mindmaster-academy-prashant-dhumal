import { NextRequest, NextResponse } from "next/server";
import { computeAnalyticsData, AnalyticsFilter } from "@/lib/analyticsEngine";

function escapeCsvCell(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const str = String(val);
  return `"${str.replace(/"/g, '""')}"`;
}

function buildCsv(headers: string[], rows: (string | number)[][]): string {
  const headerLine = headers.map(escapeCsvCell).join(",");
  const rowLines = rows.map((r) => r.map(escapeCsvCell).join(","));
  return [headerLine, ...rowLines].join("\r\n");
}

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
        { success: false, error: "Forbidden: CSV exports require main_admin authority" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const card = searchParams.get("card") || "course-sales";
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
    let csvContent = "";
    let filename = `${card}-${range}.csv`;

    switch (card) {
      case "students-by-district": {
        filename = `students-by-district-${range}-${district}.csv`;
        const headers = ["District", "Student Count", "Percentage Share %"];
        const rows = data.studentsByDistrict.map((d) => [
          d.district,
          d.count,
          `${d.percentage}%`,
        ]);
        csvContent = buildCsv(headers, rows);
        break;
      }

      case "course-sales": {
        filename = `course-sales-${range}-${district}.csv`;
        const headers = [
          "Course Code",
          "Course Title",
          "Paid Orders Count",
          "Gross Revenue (INR)",
          "Revenue Share %",
        ];
        const rows = data.courseSales.map((c) => [
          c.courseCode,
          c.courseTitle,
          c.salesCount,
          c.revenueRupees,
          `${c.percentageShare}%`,
        ]);
        csvContent = buildCsv(headers, rows);
        break;
      }

      case "video-completion": {
        filename = `video-completion-ratios-${range}-${district}.csv`;
        const headers = [
          "Course Code",
          "Course Title",
          "Enrolled Students",
          "Completed Lessons",
          "Total Lessons Enrolled",
          "Completion Rate %",
        ];
        const rows = data.videoCompletion.map((v) => [
          v.courseCode,
          v.courseTitle,
          v.enrolledStudents,
          v.completedLessons,
          v.totalLessonsEnrolled,
          `${v.completionRatePct}%`,
        ]);
        csvContent = buildCsv(headers, rows);
        break;
      }

      case "coupon-performance": {
        filename = `coupon-performance-${range}-${district}.csv`;
        const headers = [
          "Coupon Code",
          "Discount Type",
          "Discount Value",
          "Redemptions Count",
          "Attributed Revenue (INR)",
          "Total Discount Given (INR)",
          "Status",
        ];
        const rows = data.couponPerformance.map((cp) => [
          cp.couponCode,
          cp.discountType,
          cp.discountType === "percentage" ? `${cp.discountValue}%` : `₹${Math.round(cp.discountValue / 100)}`,
          cp.redemptionsCount,
          cp.attributedRevenueRupees,
          cp.totalDiscountRupees,
          cp.status,
        ]);
        csvContent = buildCsv(headers, rows);
        break;
      }

      case "free-grants-impact": {
        filename = `free-grants-impact-${range}-${district}.csv`;
        const headers = ["Grant Metric", "Value / Count", "Breakdown Details"];
        const rows: (string | number)[][] = [
          ["Total Grants Created", data.freeGrantsImpact.totalGrants, "Across all scopes"],
          ["Active Live Grants", data.freeGrantsImpact.activeGrants, "Currently valid"],
          ["Unique Students Covered", data.freeGrantsImpact.studentsCovered, "Unlocked subsidized curriculum"],
          ["Total Waived Fees (INR)", data.freeGrantsImpact.totalWaivedRupees, "Cumulative curriculum waiver"],
          ["Active Waived Fees (INR)", data.freeGrantsImpact.activeWaivedRupees, "Live active grants waiver"],
          ["Scope: Individual Student", data.freeGrantsImpact.byScope.student, "Student specific grants"],
          ["Scope: District Wide", data.freeGrantsImpact.byScope.district, "District specific grants"],
          ["Scope: Taluka Wide", data.freeGrantsImpact.byScope.taluka, "Taluka specific grants"],
          ["Scope: School Wide", data.freeGrantsImpact.byScope.school, "School specific grants"],
          ["Scope: All Academy Students", data.freeGrantsImpact.byScope.all_students, "Universal grants"],
        ];
        csvContent = buildCsv(headers, rows);
        break;
      }

      case "growth-line": {
        filename = `student-profile-growth-${range}-${district}.csv`;
        const headers = [
          "Cohort Week",
          "Start Date",
          "End Date",
          "New Profile Signups",
          "Cumulative Profiles",
        ];
        const rows = data.growthLine.map((g) => [
          g.weekLabel,
          g.startDate,
          g.endDate,
          g.newProfilesCount,
          g.cumulativeProfiles,
        ]);
        csvContent = buildCsv(headers, rows);
        break;
      }

      case "watch-statistics": {
        filename = `watch-statistics-${range}-${district}.csv`;
        const headers = [
          "Lesson ID",
          "Lesson Title",
          "Course Title",
          "Total Views",
          "Unique Students",
          "Avg Watch %",
          "Completion Rate %",
          "Total Watch Hours",
        ];
        const rows = data.watchStatistics.map((w) => [
          w.lessonId,
          w.lessonTitle,
          w.courseTitle,
          w.totalViews,
          w.uniqueStudents,
          `${w.avgWatchPercentage}%`,
          `${w.completionRate}%`,
          `${w.totalWatchHours} hrs`,
        ]);
        csvContent = buildCsv(headers, rows);
        break;
      }

      default: {
        return NextResponse.json(
          { success: false, error: `Unknown card export type: ${card}` },
          { status: 400 }
        );
      }
    }

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err: any) {
    console.error("CSV Export error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to generate CSV export" },
      { status: 500 }
    );
  }
}
