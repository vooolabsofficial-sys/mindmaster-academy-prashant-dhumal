import { NextResponse } from "next/server";
import { recordServerAuditLog, fetchDbAuditLogs } from "@/lib/auditLogger";
import { verifyStaffSession } from "@/lib/staffAuthService";
import { serverAuditLogInputSchema, formatZodError } from "@/lib/validations";

export async function GET(req: Request) {
  // Check staff session from cookies or headers
  let staffSession: any = null;
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(/mma_staff_session=([^;]+)/);
  if (match) {
    staffSession = verifyStaffSession(decodeURIComponent(match[1]));
  }

  if (!staffSession || staffSession.role !== "main_admin" || staffSession.status !== "active") {
    return NextResponse.json(
      { error: "Forbidden: Full audit trail requires active main_admin authority" },
      { status: 403 }
    );
  }

  const logs = await fetchDbAuditLogs();
  return NextResponse.json({
    success: true,
    logs,
    count: logs.length,
  });
}

export async function POST(req: Request) {
  try {
    let staffSession: any = null;
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/mma_staff_session=([^;]+)/);
    if (match) {
      staffSession = verifyStaffSession(decodeURIComponent(match[1]));
    }
    if (staffSession && staffSession.status !== "active") {
      const res = NextResponse.json({ error: "Forbidden: Account is suspended" }, { status: 403 });
      res.cookies.delete("mma_staff_session");
      return res;
    }

    const body = await req.json();
    const parsed = serverAuditLogInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }
    const newLogEntry = recordServerAuditLog(parsed.data as any);
    return NextResponse.json({ success: true, log: newLogEntry });
  } catch (err: any) {
    console.error("Audit log API error:", err);
    return NextResponse.json({ error: "Failed to record audit log entry." }, { status: 500 });
  }
}

