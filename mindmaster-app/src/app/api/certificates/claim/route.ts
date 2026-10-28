import { NextRequest, NextResponse } from "next/server";
import { issueCertificate } from "@/lib/certificateEngine";
import { resolveCourse } from "@/app/actions/checkout";
import { certificateClaimSchema, formatZodError } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = certificateClaimSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const { studentId, studentName, studentPhone, courseId } = parsed.data;

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
