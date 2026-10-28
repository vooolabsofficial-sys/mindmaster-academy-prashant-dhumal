import { NextRequest, NextResponse } from "next/server";
import { verifyCertificateByNumber } from "@/lib/certificateEngine";
import { checkRateLimit } from "@/lib/rateLimit";
import { recordServerAuditLog } from "@/lib/auditLogger";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const rate = checkRateLimit(`cert_verify:${ip}`, 10, 60000);
    if (!rate.success) {
      return NextResponse.json(
        { success: false, error: `Too many verification queries. Please wait ${rate.resetInSec} seconds.` },
        { status: 429, headers: CORS_HEADERS }
      );
    }

    const { searchParams } = new URL(req.url);
    const certNo = searchParams.get("cert") || searchParams.get("certificate_no") || searchParams.get("no");

    if (!certNo) {
      return NextResponse.json(
        { success: false, error: "Certificate number is required." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const result = await verifyCertificateByNumber(certNo);

    // Audit log lookup
    recordServerAuditLog({
      staff_id: "PUBLIC_VERIFIER",
      staff_name: "Public Certificate Verifier",
      staff_role: "system",
      action: result.isValid ? "CERTIFICATE_VERIFY_SUCCESS" : "CERTIFICATE_VERIFY_FAILED",
      category: "security",
      severity: result.isValid ? "info" : "warning",
      entity_type: "certificate",
      entity_id: certNo,
      entity_name: result.certificate?.course_title || "Certificate Lookup",
      meta: {
        certificateNo: certNo,
        isValid: result.isValid,
        ip,
      },
    });

    if (!result.isValid || !result.certificate) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Certificate not found.",
        },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      {
        success: true,
        certificate: result.certificate,
      },
      { headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Verification service error." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const rate = checkRateLimit(`cert_verify:${ip}`, 10, 60000);
    if (!rate.success) {
      return NextResponse.json(
        { success: false, error: `Too many verification queries. Please wait ${rate.resetInSec} seconds.` },
        { status: 429, headers: CORS_HEADERS }
      );
    }

    const body = await req.json();
    const certNo = body.certificateNo || body.certificate_no || body.cert;

    if (!certNo) {
      return NextResponse.json(
        { success: false, error: "Certificate number is required." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const result = await verifyCertificateByNumber(certNo);

    if (!result.isValid || !result.certificate) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Certificate not found.",
        },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      {
        success: true,
        certificate: result.certificate,
      },
      { headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Verification service error." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
