import { NextRequest, NextResponse } from "next/server";
import { verifyCertificateByNumber } from "@/lib/certificateEngine";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rateLimit";
import { recordServerAuditLog } from "@/lib/auditLogger";
import { certificateVerifySchema, formatZodError } from "@/lib/validations";

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
    const ip = getClientIp(req);
    const rate = checkRateLimit(`cert_verify:${ip}`, 10, 60000);
    if (!rate.success) {
      return rateLimitResponse(
        rate.resetInSec,
        `Too many verification queries. Please wait ${rate.resetInSec} seconds.`,
        CORS_HEADERS
      );
    }

    const { searchParams } = new URL(req.url);
    const rawCertNo = searchParams.get("cert") || searchParams.get("certificate_no") || searchParams.get("no");

    const parsed = certificateVerifySchema.safeParse({ certificateNo: rawCertNo || "" });
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Certificate number is required and must be valid." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const certNo = parsed.data.certificateNo;
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
    const ip = getClientIp(req);
    const rate = checkRateLimit(`cert_verify:${ip}`, 10, 60000);
    if (!rate.success) {
      return rateLimitResponse(
        rate.resetInSec,
        `Too many verification queries. Please wait ${rate.resetInSec} seconds.`,
        CORS_HEADERS
      );
    }

    const body = await req.json();
    const rawCertNo = body.certificateNo || body.certificate_no || body.cert;

    const parsed = certificateVerifySchema.safeParse({ certificateNo: rawCertNo || "" });
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Certificate number is required and must be valid." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const certNo = parsed.data.certificateNo;
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
