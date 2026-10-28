import { NextRequest, NextResponse } from "next/server";
import { verifyStaffSession, StaffSessionData } from "@/lib/staffSession";
import { StaffPermission } from "@/lib/types";
import { getStaffUsers } from "@/lib/staffStore";

export interface AuthOptions {
  requiredRole?: "main_admin" | "sub_admin";
  requiredPermission?: StaffPermission;
}

export function authenticateStaffRequest(
  req: NextRequest | Request,
  options?: AuthOptions
): { session: StaffSessionData | null; errorResponse: NextResponse | null } {
  let cookieVal: string | undefined;

  if ("cookies" in req && typeof (req as any).cookies?.get === "function") {
    cookieVal = (req as any).cookies.get("mma_staff_session")?.value;
  } else {
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/mma_staff_session=([^;]+)/);
    if (match) cookieVal = decodeURIComponent(match[1]);
  }

  if (!cookieVal) {
    return {
      session: null,
      errorResponse: NextResponse.json(
        { success: false, error: "Unauthorized: Staff authentication required" },
        { status: 401 }
      ),
    };
  }

  const session = verifyStaffSession(cookieVal);
  if (!session) {
    const res = NextResponse.json(
      { success: false, error: "Unauthorized: Invalid or expired staff session" },
      { status: 401 }
    );
    res.cookies.delete("mma_staff_session");
    return { session: null, errorResponse: res };
  }

  // Check frozen or suspended status on session
  if (
    session.status === "frozen" ||
    session.status === "suspended" ||
    (session.status as any) === "inactive"
  ) {
    const res = NextResponse.json(
      { success: false, error: "Forbidden: Staff account is frozen or suspended", isSuspended: true },
      { status: 403 }
    );
    res.cookies.delete("mma_staff_session");
    return { session: null, errorResponse: res };
  }

  // Cross-reference live status from staff store
  try {
    const allStaff = getStaffUsers();
    const liveAccount = allStaff.find(
      (s) =>
        s.id === session.staff_id ||
        (s.staffId && s.staffId.toUpperCase() === (session.staff_id || "").toUpperCase())
    );
    if (
      liveAccount &&
      (liveAccount.status === "suspended" ||
        liveAccount.status === "frozen" ||
        liveAccount.status === "inactive")
    ) {
      const res = NextResponse.json(
        { success: false, error: "Forbidden: Staff account is no longer active", isSuspended: true },
        { status: 403 }
      );
      res.cookies.delete("mma_staff_session");
      return { session: null, errorResponse: res };
    }
  } catch {}

  // Enforce required role (e.g. main_admin only)
  if (options?.requiredRole) {
    if (options.requiredRole === "main_admin" && session.role !== "main_admin") {
      return {
        session: null,
        errorResponse: NextResponse.json(
          { success: false, error: "Forbidden: Action strictly requires main_admin authority" },
          { status: 403 }
        ),
      };
    }
    if (options.requiredRole === "sub_admin" && session.role !== "sub_admin") {
      return {
        session: null,
        errorResponse: NextResponse.json(
          { success: false, error: "Forbidden: Action strictly requires sub_admin authority" },
          { status: 403 }
        ),
      };
    }
  }

  // Enforce permission if user is not main_admin
  if (options?.requiredPermission && session.role !== "main_admin") {
    const userPerms = session.permissions || [];
    if (!userPerms.includes(options.requiredPermission)) {
      return {
        session: null,
        errorResponse: NextResponse.json(
          { success: false, error: `Forbidden: Missing required permission ${options.requiredPermission}` },
          { status: 403 }
        ),
      };
    }
  }

  return { session, errorResponse: null };
}
