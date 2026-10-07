import { NextResponse } from "next/server";
import { recordServerAuditLog, getServerAuditLogs } from "@/lib/auditLogger";

export async function GET(req: Request) {
  // Check staff session from cookies or headers
  let staffSession: any = null;
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(/mma_staff_session=([^;]+)/);
  if (match) {
    try {
      staffSession = JSON.parse(decodeURIComponent(match[1]));
    } catch {}
  }

  if (!staffSession || staffSession.role !== "main_admin") {
    return NextResponse.json(
      { error: "Forbidden: Full audit trail requires main_admin authority" },
      { status: 403 }
    );
  }

  const logs = getServerAuditLogs();
  return NextResponse.json({
    success: true,
    logs,
    count: logs.length,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newLogEntry = recordServerAuditLog(body);
    return NextResponse.json({ success: true, log: newLogEntry });
  } catch (err: any) {
    console.error("Audit log API error:", err);
    return NextResponse.json({ error: "Failed to record audit log entry." }, { status: 500 });
  }
}

