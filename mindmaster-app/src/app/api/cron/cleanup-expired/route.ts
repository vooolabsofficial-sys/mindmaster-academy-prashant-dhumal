import { NextResponse } from "next/server";
import {
  getStaffCourses,
  saveStaffCourse,
  getStaffStudents,
  getPlatformSettings,
  saveStaffCoupon,
  getStaffCoupons,
} from "@/lib/staffStore";
import { Coupon } from "@/lib/types";
import { addStudentNotification } from "@/lib/studentNotificationStore";

export async function GET(req: Request) {
  return handleCleanup(req);
}

export async function POST(req: Request) {
  return handleCleanup(req);
}

async function handleCleanup(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized: Invalid CRON_SECRET" }, { status: 401 });
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const nowMs = now.getTime();

    let expiredCoursesCount = 0;
    let scheduledToLiveCoursesCount = 0;
    let expiredLessonsCount = 0;
    let remindersCreatedCount = 0;
    const generatedCoupons: { studentId: string; courseCode: string; couponCode: string }[] = [];

    const settings = getPlatformSettings();
    const renewalPercent = settings?.renewal_coupon_percent || 50;
    const defaultCouponDays = settings?.default_coupon_days || 7;
    const template =
      settings?.reminder_template ||
      "Namaskar {name}, your access to {course} will expire in {days} days. Renew today to get {percent}% off!";

    // 1. Scan courses for expiration / scheduling
    const courses = getStaffCourses();
    for (const course of courses) {
      let updated = false;

      // Check removeAt
      if (course.removeAt) {
        const removeMs = new Date(course.removeAt).getTime();
        if (!isNaN(removeMs) && nowMs >= removeMs && course.status !== "removed") {
          course.status = "removed";
          updated = true;
          expiredCoursesCount++;
        }
      }

      // Check publishAt for scheduled courses
      if (course.publishAt && (course.status === "scheduled" || course.status === "upcoming")) {
        const pubMs = new Date(course.publishAt).getTime();
        if (!isNaN(pubMs) && nowMs >= pubMs) {
          course.status = "live";
          updated = true;
          scheduledToLiveCoursesCount++;
        }
      }

      // Scan lessons inside course
      if ((course as any).lessons && Array.isArray((course as any).lessons)) {
        for (const lesson of (course as any).lessons) {
          if (lesson.remove_at) {
            const lRemoveMs = new Date(lesson.remove_at).getTime();
            if (!isNaN(lRemoveMs) && nowMs >= lRemoveMs) {
              expiredLessonsCount++;
            }
          }
        }
      }

      if (updated) {
        saveStaffCourse(course);
      }
    }

    // 2. Scan students for 7-day expiry reminders & auto-create personal renewal coupons
    const students = getStaffStudents();
    const existingCoupons = getStaffCoupons();

    for (const student of students) {
      if (!student.coursesTaken || !Array.isArray(student.coursesTaken)) continue;

      for (const enrolled of student.coursesTaken) {
        const daysLeft = enrolled.daysLeft;

        // Condition: Expiring within 7 days and has not expired yet
        if (daysLeft !== undefined && daysLeft <= 7 && daysLeft > 0) {
          // Generate unique personal coupon code
          const studentShort = (student.id || "STD").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(-5);
          const courseShort = (enrolled.courseCode || "MM").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
          const couponCode = `RENEW${renewalPercent}-${studentShort}-${courseShort}`;

          // Check if coupon already generated today
          const alreadyExists = existingCoupons.some((c) => c.code === couponCode);
          if (!alreadyExists) {
            const startsAt = now.toISOString().slice(0, 10);
            const endsDate = new Date(nowMs + defaultCouponDays * 24 * 60 * 60 * 1000);
            const endsAt = endsDate.toISOString().slice(0, 10);

            const renewalCoupon: Coupon = {
              id: `cpn-renew-${Date.now()}-${student.id}-${enrolled.courseId}`,
              code: couponCode,
              description: `Auto-generated personal ${renewalPercent}% renewal coupon for ${student.name} (${enrolled.courseTitle})`,
              discountType: "percentage",
              discountValue: renewalPercent,
              appliesTo: "selected",
              applies_all: false,
              selectedCourseIds: [enrolled.courseId],
              usageLimitPerUser: "once",
              per_user_usage: "once",
              validityType: "days",
              validDays: defaultCouponDays,
              starts_at: startsAt,
              ends_at: endsAt,
              maxTotalUses: 1,
              status: "active",
              is_active: true,
              totalUsed: 0,
              createdAt: nowIso,
            };

            saveStaffCoupon(renewalCoupon);
            generatedCoupons.push({
              studentId: student.id,
              courseCode: enrolled.courseCode,
              couponCode,
            });

            // Formulate in-app expiry reminder using settings template
            const firstName = student.name ? student.name.split(" ")[0] : "Student";
            const interpolatedBody = template
              .replace("{name}", firstName)
              .replace("{course}", enrolled.courseTitle)
              .replace("{days}", String(daysLeft))
              .replace("{percent}", String(renewalPercent));

            addStudentNotification({
              userId: student.id,
              title: `⏳ ${enrolled.courseTitle} Access Expiring in ${daysLeft} Days`,
              body: interpolatedBody,
              type: "renewal",
              couponCode: couponCode,
              courseCode: enrolled.courseCode,
              courseTitle: enrolled.courseTitle,
              daysLeft: daysLeft,
              actionUrl: `/checkout?courseId=${enrolled.courseId}&coupon=${couponCode}`,
            });

            remindersCreatedCount++;
          }
        }
      }
    }

    // 3. Record immutable audit log entry for this daily job
    try {
      await fetch(new URL("/api/staff/audit", req.url), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staff_id: "SYSTEM_CRON",
          staff_name: "Daily Maintenance Worker",
          staff_role: "main_admin",
          action: "CRON_DAILY_EXPIRED_CLEANUP",
          entity_type: "settings",
          entity_id: "cron-job-daily",
          entity_name: "Platform Auto-Expiration Cleaner",
          meta: {
            timestamp: nowIso,
            expiredCoursesCount,
            scheduledToLiveCoursesCount,
            expiredLessonsCount,
            remindersCreatedCount,
            generatedCoupons,
            status: "SUCCESS",
          },
        }),
      });
    } catch {}

    return NextResponse.json({
      success: true,
      timestamp: nowIso,
      summary: {
        coursesScanned: courses.length,
        studentsScanned: students.length,
        expiredCoursesCount,
        scheduledToLiveCoursesCount,
        expiredLessonsCount,
        remindersCreatedCount,
        renewalCoupons: generatedCoupons,
      },
      message: `Daily cron executed: ${expiredCoursesCount} course(s) expired, ${scheduledToLiveCoursesCount} course(s) went live, ${remindersCreatedCount} 7-day expiry reminder(s) & personal renewal coupon(s) issued.`,
    });
  } catch (err: any) {
    console.error("Cron cleanup error:", err);
    return NextResponse.json(
      { error: "Cron execution encountered an error", details: err.message },
      { status: 500 }
    );
  }
}
