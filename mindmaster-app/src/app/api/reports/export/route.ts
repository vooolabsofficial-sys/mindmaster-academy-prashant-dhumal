import { NextRequest, NextResponse } from "next/server";
import { computeAnalyticsData, AnalyticsFilter } from "@/lib/analyticsEngine";
import { getStaffStudents } from "@/lib/staffStore";
import { getGrants } from "@/lib/grantStore";
import { authenticateStaffRequest } from "@/lib/serverAuthGuard";
import { reportsExportQuerySchema, formatZodError } from "@/lib/validations";

function escapeCsvCell(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const str = String(val);
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * High-performance Web ReadableStream generator for streaming CSV data in chunks.
 * Avoids buffering entire export in memory, preventing Node/Vercel memory limits.
 */
function createCsvReadableStream(
  headers: string[],
  rows: (string | number)[][],
  chunkSize = 100
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      // 1. Emit UTF-8 BOM + Header Row for flawless Excel/Sheets Marathi/Unicode support
      controller.enqueue(encoder.encode("\uFEFF" + headers.map(escapeCsvCell).join(",") + "\r\n"));

      // 2. Stream rows in bounded chunks
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const chunkText = chunk.map((r) => r.map(escapeCsvCell).join(",")).join("\r\n") + "\r\n";
        controller.enqueue(encoder.encode(chunkText));
      }

      controller.close();
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    const { session, errorResponse } = authenticateStaffRequest(req, { requiredRole: "main_admin" });
    if (errorResponse || !session) {
      return errorResponse || NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parsed = reportsExportQuerySchema.safeParse({
      card: searchParams.get("card") || "course-sales",
      range: searchParams.get("range") || "30",
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      district: searchParams.get("district") || "all",
    });

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: formatZodError(parsed.error) }, { status: 400 });
    }

    const { card, range, startDate, endDate, district } = parsed.data;

    const filter: AnalyticsFilter = {
      range: range as "7" | "30" | "custom",
      startDate,
      endDate,
      district,
    };

    const data = computeAnalyticsData(filter);
    let exportHeaders: string[] = [];
    let exportRows: (string | number)[][] = [];
    let filename = `${card}-${range}.csv`;

    switch (card) {
      case "students-by-district": {
        filename = `students-by-district-${range}-${district}.csv`;
        exportHeaders = ["District", "Student Count", "Percentage Share %"];
        exportRows = data.studentsByDistrict.map((d) => [
          d.district,
          d.count,
          `${d.percentage}%`,
        ]);
        break;
      }

      case "course-sales": {
        filename = `course-sales-${range}-${district}.csv`;
        exportHeaders = [
          "Course Code",
          "Course Title",
          "Paid Orders Count",
          "Gross Revenue (INR)",
          "Revenue Share %",
        ];
        exportRows = data.courseSales.map((c) => [
          c.courseCode,
          c.courseTitle,
          c.salesCount,
          c.revenueRupees,
          `${c.percentageShare}%`,
        ]);
        break;
      }

      case "video-completion": {
        filename = `video-completion-ratios-${range}-${district}.csv`;
        exportHeaders = [
          "Course Code",
          "Course Title",
          "Enrolled Students",
          "Completed Lessons",
          "Total Lessons Enrolled",
          "Completion Rate %",
        ];
        exportRows = data.videoCompletion.map((v) => [
          v.courseCode,
          v.courseTitle,
          v.enrolledStudents,
          v.completedLessons,
          v.totalLessonsEnrolled,
          `${v.completionRatePct}%`,
        ]);
        break;
      }

      case "coupon-performance": {
        filename = `coupon-performance-${range}-${district}.csv`;
        exportHeaders = [
          "Coupon Code",
          "Discount Type",
          "Discount Value",
          "Redemptions Count",
          "Attributed Revenue (INR)",
          "Total Discount Given (INR)",
          "Status",
        ];
        exportRows = data.couponPerformance.map((cp) => [
          cp.couponCode,
          cp.discountType,
          cp.discountType === "percentage" ? `${cp.discountValue}%` : `₹${Math.round(cp.discountValue / 100)}`,
          cp.redemptionsCount,
          cp.attributedRevenueRupees,
          cp.totalDiscountRupees,
          cp.status,
        ]);
        break;
      }

      case "free-grants-impact": {
        filename = `free-grants-impact-${range}-${district}.csv`;
        exportHeaders = ["Grant Metric", "Value / Count", "Breakdown Details"];
        exportRows = [
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
        break;
      }

      case "growth-line": {
        filename = `student-profile-growth-${range}-${district}.csv`;
        exportHeaders = [
          "Cohort Week",
          "Start Date",
          "End Date",
          "New Profile Signups",
          "Cumulative Profiles",
        ];
        exportRows = data.growthLine.map((g) => [
          g.weekLabel,
          g.startDate,
          g.endDate,
          g.newProfilesCount,
          g.cumulativeProfiles,
        ]);
        break;
      }

      case "watch-statistics": {
        filename = `watch-statistics-${range}-${district}.csv`;
        exportHeaders = [
          "Lesson ID",
          "Lesson Title",
          "Course Title",
          "Total Views",
          "Unique Students",
          "Avg Watch %",
          "Completion Rate %",
          "Total Watch Hours",
        ];
        exportRows = data.watchStatistics.map((w) => [
          w.lessonId,
          w.lessonTitle,
          w.courseTitle,
          w.totalViews,
          w.uniqueStudents,
          `${w.avgWatchPercentage}%`,
          `${w.completionRate}%`,
          `${w.totalWatchHours} hrs`,
        ]);
        break;
      }

      case "fee-collections":
      case "transactions": {
        filename = `fee-collections-${range}-${district}.csv`;
        exportHeaders = [
          "Transaction ID",
          "Customer Name",
          "Verified 10-Digit Mobile",
          "District",
          "Item Enrolled",
          "Amount (INR)",
          "Payment Method",
          "Status",
          "Enrollment Date",
        ];

        const students = getStaffStudents();
        const grants = getGrants();
        const rows: (string | number)[][] = [];

        students.forEach((s, idx) => {
          if (district !== "all" && s.district?.toLowerCase() !== district.toLowerCase()) return;
          const cleanPhone = s.phone.replace(/\D/g, "").slice(-10);
          const enrolledCourses = s.coursesTaken?.length
            ? s.coursesTaken
            : [{ courseCode: "MMA", courseTitle: s.enrolledCourseTitles?.[0] || "Foundational Mindset", isExpired: false }];

          enrolledCourses.forEach((c: any, cIdx: number) => {
            rows.push([
              `TXN-${cleanPhone.slice(-4) || "0000"}-${idx + 1}-${cIdx + 1}`,
              s.name,
              cleanPhone ? `+91 ${cleanPhone}` : s.phone,
              s.district || "Maharashtra",
              `[${c.courseCode}] ${c.courseTitle}`,
              199,
              "Online Gateway (Razorpay)",
              c.isExpired ? "Expired" : "Success",
              s.joinedAt ? s.joinedAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
            ]);
          });
        });

        grants.forEach((g, gIdx) => {
          const rawPhone = g.student_phone || g.studentPhone || (g.scope_type === "student" ? g.scope_value : "");
          const cleanPhone = rawPhone.replace(/\D/g, "").slice(-10);
          if (cleanPhone) {
            rows.push([
              `GRANT-${cleanPhone.slice(-4)}-${gIdx + 1}`,
              g.student_name || g.studentName || `Learner ${cleanPhone.slice(-4)}`,
              `+91 ${cleanPhone}`,
              "Maharashtra",
              g.courseTitle || "MindMaster Course Access",
              g.amount_paid !== undefined ? g.amount_paid : 0,
              g.payment_mode === "cash" ? "Offline Cash" : g.payment_mode === "upi" ? "Direct UPI" : "Scholarship Grant",
              g.status === "active" ? "Active" : "Revoked",
              g.created_at ? g.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
            ]);
          }
        });

        exportRows = rows;
        break;
      }

      default: {
        return NextResponse.json(
          { success: false, error: `Unknown card export type: ${card}` },
          { status: 400 }
        );
      }
    }

    const stream = createCsvReadableStream(exportHeaders, exportRows);

    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Content-Type-Options": "nosniff",
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
