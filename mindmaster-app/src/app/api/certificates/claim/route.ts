import { NextRequest, NextResponse } from "next/server";
import { issueCertificate } from "@/lib/certificateEngine";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveCourse } from "@/app/actions/checkout";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, studentName, studentPhone, courseId } = body;

    if (!studentId || !studentName || !studentPhone || !courseId) {
      return NextResponse.json(
        { success: false, error: "Missing required certificate claim fields." },
        { status: 400 }
      );
    }

    const course = await resolveCourse(courseId);
    const courseTitle = course?.title || "Master Training Course";
    const courseCode = course?.code || "MMA-01";

    // Issue or retrieve existing certificate
    const cert = await issueCertificate({
      studentId,
      studentName,
      studentPhone,
      courseId,
      courseTitle,
      courseCode,
      category: "Vedic Maths & Mind Memory",
    });

    return NextResponse.json({
      success: true,
      certificate: cert,
    });
  } catch (err: any) {
    console.error("Certificate claim error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to issue certificate." },
      { status: 500 }
    );
  }
}
