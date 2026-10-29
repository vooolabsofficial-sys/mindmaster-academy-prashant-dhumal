import { NextResponse, type NextRequest } from "next/server";
import { recordServerAuditLog } from "@/lib/auditLogger";
import { verifyStaffSession } from "@/lib/staffSession";
import { createAdminClient } from "@/lib/supabase/admin";
import { ASSIGNABLE_PERMISSIONS } from "@/lib/types";
import { getClientIp, checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";

// Permission mapping for /sub/* routes per specifications:
// videos -> videos.manage
// courses -> courses.manage
// coupons -> coupons.manage
// students -> students.view
// reports -> reports.view
// notes/books -> notes.books.manage
// Permission whitelist for /sub/* routes per final authority model:
// /sub -> dashboard (allowed)
// /sub/messages -> messages.manage
// /sub/students -> students.view
// /sub/activity -> allowed (own log only)
// All other /sub/* routes are permanently forbidden (403/404)

function extractEntityFromPath(pathname: string): string {
  if (pathname.includes("course")) return "course";
  if (pathname.includes("video") || pathname.includes("watch")) return "video";
  if (pathname.includes("playlist")) return "playlist";
  if (pathname.includes("coupon")) return "coupon";
  if (pathname.includes("grant")) return "grant";
  if (pathname.includes("student")) return "student";
  if (pathname.includes("message")) return "message";
  if (pathname.includes("sub-admin") || pathname.includes("staff")) return "subadmin";
  if (pathname.includes("setting")) return "settings";
  if (pathname.includes("note") || pathname.includes("book")) return "notes_books";
  return "system";
}

export async function middleware(req: NextRequest | Request) {
  const nextUrl = (req as any).nextUrl || new URL(req.url);
  const pathname = nextUrl.pathname;
  const search = nextUrl.search || "";
  const currentPath = `${pathname}${search}`;
  const method = (req.method || "GET").toUpperCase();
  const isMutating = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  // Redirect obsolete /notes route seamlessly to /books
  if (pathname === "/notes" || pathname.startsWith("/notes/")) {
    const booksUrl = new URL(pathname.replace(/^\/notes/, "/books"), req.url);
    booksUrl.search = search;
    return NextResponse.redirect(booksUrl, 308);
  }

  // IP-based Rate Limiter Middleware for sensitive auth & verification endpoints
  const SENSITIVE_API_ROUTES = [
    "/api/student/auth",
    "/api/staff/login",
    "/api/staff/forgot-password",
    "/api/certificates/verify",
  ];

  if (SENSITIVE_API_ROUTES.some((route) => pathname.startsWith(route))) {
    const ip = getClientIp(req);
    const rl = checkRateLimit(`mw_rate_limit:${ip}`, 10, 60000);
    if (!rl.success) {
      return rateLimitResponse(
        rl.resetInSec,
        `Too many requests to ${pathname}. Please wait ${rl.resetInSec} seconds before retrying.`
      );
    }
  }

  // =========================================================================
  // 1. STUDENT ROUTES (UNCHANGED)
  // =========================================================================
  const isStudentRoute =
    pathname === "/" ||
    pathname.startsWith("/home") ||
    pathname.startsWith("/courses") ||
    pathname.startsWith("/course") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/my-courses") ||
    pathname.startsWith("/watch") ||
    pathname.startsWith("/books") ||
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/support") ||
    pathname.startsWith("/profile");

  if (isStudentRoute) {
    let hasAuthToken = false;
    let onboardingPending = false;

    if ("cookies" in req && (req as any).cookies?.getAll) {
      const allCookies = (req as any).cookies.getAll();
      hasAuthToken =
        allCookies.some(
          (c: any) =>
            c.name.startsWith("sb-") &&
            (c.name.includes("-auth-token") || c.name.includes("access-token")) &&
            c.value &&
            c.value.length > 5
        ) || (req as any).cookies.has("mindmaster_session");
      const onboardingCookie = (req as any).cookies.get("mindmaster_onboarding_pending")?.value;
      onboardingPending = onboardingCookie === "true";
    } else {
      const cookieHeader = req.headers.get("cookie") || "";
      hasAuthToken = cookieHeader.includes("mindmaster_session") || cookieHeader.includes("auth-token");
      onboardingPending = /(?:^|;\s*)mindmaster_onboarding_pending=true(?:\s*;|$)/.test(cookieHeader);
    }

    // Rule 1: No session -> redirect to /login?next=<current path>
    if (!hasAuthToken) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("next", currentPath);
      return NextResponse.redirect(loginUrl);
    }

    // Rule 2: Session exists but profile is explicitly flagged pending -> redirect to /onboarding?next=<current path>
    if (onboardingPending && !pathname.startsWith("/onboarding")) {
      const onboardingUrl = new URL("/onboarding", req.url);
      onboardingUrl.searchParams.set("next", currentPath);
      return NextResponse.redirect(onboardingUrl);
    }

    return NextResponse.next();
  }

  // Parse staff session if present
  let staffSession: any = null;
  let staffCookie: string | undefined = undefined;
  if ("cookies" in req && (req as any).cookies?.get) {
    staffCookie = (req as any).cookies.get("mma_staff_session")?.value;
  } else {
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/mma_staff_session=([^;]+)/);
    if (match) staffCookie = decodeURIComponent(match[1]);
  }

  if (staffCookie) {
    try {
      staffSession = verifyStaffSession(staffCookie);
      // Data migration check: sanitize sub-admin permissions
      if (staffSession && staffSession.role === "sub_admin") {
        staffSession.permissions = (staffSession.permissions || []).filter(
          (p: string) => ASSIGNABLE_PERMISSIONS.includes(p as any)
        );
        // Instant Live DB check: verify account is still active in staff_accounts
        try {
          const supabase = createAdminClient();
          const staffIdentifier = staffSession.staff_id || staffSession.id;
          const { data: dbStaff } = await supabase
            .from("staff_accounts")
            .select("status")
            .or(`id.eq.${staffIdentifier},staff_id.eq.${staffIdentifier}`)
            .maybeSingle();
          if (dbStaff && dbStaff.status !== "active") {
            staffSession.status = "suspended";
          }
        } catch {
          // If network / Supabase temporarily unreachable, rely on signed token status
        }
      }
    } catch {
      // Cookie corrupted
    }
  }

  // =========================================================================
  // 2. AUDIT MIDDLEWARE: Every mutating action by staff writes audit_log row
  // =========================================================================
  if (isMutating && staffSession && !pathname.startsWith("/api/staff/audit")) {
    const entityType = extractEntityFromPath(pathname);
    const actionKey = `${method}_${pathname.slice(1).replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()}`;

    // Direct synchronous recording in server audit log store
    recordServerAuditLog({
      staff_id: staffSession.staff_id || staffSession.id,
      staff_name: staffSession.name,
      staff_role: staffSession.role,
      action: actionKey,
      entity_type: entityType,
      entity_id: nextUrl.searchParams.get("id") || "mutation",
      entity_name: pathname,
      meta: {
        method,
        path: pathname,
        ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
        userAgent: req.headers.get("user-agent") || "MindMaster Staff Agent",
        timestamp: new Date().toISOString(),
      },
    });

    // Also dispatch to persistent audit log API if server is running
    fetch(new URL("/api/staff/audit", req.url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        staff_id: staffSession.staff_id || staffSession.id,
        staff_name: staffSession.name,
        staff_role: staffSession.role,
        action: actionKey,
        entity_type: entityType,
        entity_id: nextUrl.searchParams.get("id") || "mutation",
        entity_name: pathname,
        meta: {
          method,
          path: pathname,
          ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
          userAgent: req.headers.get("user-agent") || "MindMaster Staff Agent",
          timestamp: new Date().toISOString(),
        },
      }),
    }).catch(() => {});
  }

  // =========================================================================
  // 3. API ROUTE SECURITY & AUTHORITY ENFORCEMENT
  // =========================================================================
  if (pathname.startsWith("/api/")) {
    // Suspend check for staff API requests
    if (
      staffSession &&
      (staffSession.status === "frozen" ||
        staffSession.status === "suspended" ||
        staffSession.status === "inactive")
    ) {
      const killRes = NextResponse.json(
        { error: "Staff account is suspended or frozen. Session killed.", isSuspended: true },
        { status: 403 }
      );
      killRes.cookies.delete("mma_staff_session");
      return killRes;
    }

    // Public auth and webhook endpoints allowed
    const isPublicApi =
      pathname.startsWith("/api/staff/login") ||
      pathname.startsWith("/api/staff/logout") ||
      pathname.startsWith("/api/staff/forgot-password") ||
      pathname.startsWith("/api/student/auth") ||
      pathname.startsWith("/api/certificates/verify") ||
      pathname.startsWith("/api/razorpay/webhook");

    if (isPublicApi) {
      return NextResponse.next();
    }

    // RULE: Every DELETE endpoint strictly requires main_admin
    if (method === "DELETE") {
      if (!staffSession || staffSession.role !== "main_admin") {
        return NextResponse.json(
          { error: "Forbidden: All DELETE operations strictly require main_admin authority" },
          { status: 403 }
        );
      }
    }

    // RULE: Watch-stats API requires main_admin
    if (pathname.startsWith("/api/watch-stats") || pathname.includes("watch-stats")) {
      if (!staffSession || staffSession.role !== "main_admin") {
        return NextResponse.json(
          { error: "Forbidden: Watch statistics require main_admin authority" },
          { status: 403 }
        );
      }
    }

    // RULE: Full Audit Log GET requires main_admin
    if (pathname.startsWith("/api/staff/audit") && method === "GET") {
      if (!staffSession || staffSession.role !== "main_admin") {
        return NextResponse.json(
          { error: "Forbidden: Full audit trail requires main_admin authority" },
          { status: 403 }
        );
      }
    }

    // RULE: Settings API requires main_admin
    if (pathname.startsWith("/api/settings")) {
      if (!staffSession || staffSession.role !== "main_admin") {
        return NextResponse.json(
          { error: "Forbidden: Platform settings require main_admin authority" },
          { status: 403 }
        );
      }
    }

    // RULE: Analytics and Reports APIs require main_admin
    if (pathname.startsWith("/api/reports/analytics") || pathname.startsWith("/api/reports/export")) {
      if (!staffSession || staffSession.role !== "main_admin") {
        return NextResponse.json(
          { error: "Forbidden: Analytics Hub requires main_admin authority" },
          { status: 403 }
        );
      }
    }

    // RULE: Course/Video/Coupon/Grant/Book write APIs require main_admin
    const isCatalogMutation =
      isMutating &&
      (pathname.startsWith("/api/courses") ||
        pathname.startsWith("/api/videos") ||
        pathname.startsWith("/api/youtube") ||
        pathname.startsWith("/api/coupons") ||
        pathname.startsWith("/api/grants") ||
        pathname.startsWith("/api/books"));

    if (isCatalogMutation) {
      if (pathname.startsWith("/api/grants")) {
        const canManageGrants =
          staffSession &&
          (staffSession.role === "main_admin" ||
            (staffSession.role === "sub_admin" &&
              (staffSession.permissions || []).includes("freegrant.manage")));
        if (!canManageGrants) {
          return NextResponse.json(
            { error: "Forbidden: Offline grants require freegrant.manage authority" },
            { status: 403 }
          );
        }
      } else {
        if (!staffSession || staffSession.role !== "main_admin") {
          return NextResponse.json(
            { error: "Forbidden: Curriculum and marketing write operations require main_admin authority" },
            { status: 403 }
          );
        }
      }
    }

    return NextResponse.next();
  }

  // =========================================================================
  // 4. STAFF / ADMIN / SUB-ADMIN ROUTE ENFORCEMENT
  // =========================================================================
  const isAdminRoute = pathname.startsWith("/admin");
  const isSubRoute = pathname.startsWith("/sub");

  // Dedicated login pages are public
  if (pathname === "/admin/login" || pathname === "/sub/login") {
    return NextResponse.next();
  }

  if (isAdminRoute || isSubRoute) {
    // A. Must be authenticated as staff
    if (!staffSession) {
      const loginDest = isAdminRoute ? "/admin/login" : "/sub/login";
      const loginUrl = new URL(loginDest, req.url);
      loginUrl.searchParams.set("next", currentPath);
      return NextResponse.redirect(loginUrl);
    }

    // B. Suspend Check on every request with instant session kill
    if (
      staffSession.status === "frozen" ||
      staffSession.status === "suspended" ||
      staffSession.status === "inactive"
    ) {
      const loginDest = isAdminRoute ? "/admin/login" : "/sub/login";
      const killRes = NextResponse.redirect(new URL(`${loginDest}?error=suspended`, req.url));
      killRes.cookies.delete("mma_staff_session");
      return killRes;
    }

    // C. Forced password-change screen on must_change_password
    if (staffSession.must_change_password && !pathname.startsWith("/staff/change-password")) {
      return NextResponse.redirect(new URL("/staff/change-password", req.url));
    }

    // Strict Main Admin Lock on all DELETE operations
    if (staffSession.role === "sub_admin" && req.method === "DELETE") {
      return NextResponse.json(
        { error: "Forbidden: Delete actions are strictly reserved for Main Admin." },
        { status: 403 }
      );
    }

    // D. /admin/* route enforcement
    if (isAdminRoute) {
      if (staffSession.role !== "main_admin") {
        return NextResponse.rewrite(
          new URL("/forbidden?reason=main_admin_required", req.url),
          { status: 403 }
        );
      }
      return NextResponse.next();
    }

    // E. /sub/* whitelist enforcement for sub_admin:
    // Only /sub, /sub/messages, /sub/students, /sub/activity are permitted.
    if (isSubRoute) {
      if (staffSession.role !== "sub_admin") {
        return NextResponse.rewrite(
          new URL("/forbidden?reason=sub_admin_required", req.url),
          { status: 403 }
        );
      }

      // 1. Root /sub (Dashboard)
      if (pathname === "/sub" || pathname === "/sub/") {
        return NextResponse.next();
      }

      // 2. /sub/messages requires messages.manage
      if (pathname.startsWith("/sub/messages")) {
        const userPermissions: string[] = staffSession.permissions || [];
        if (!userPermissions.includes("messages.manage")) {
          return NextResponse.rewrite(
            new URL("/forbidden?perm=messages.manage", req.url),
            { status: 403 }
          );
        }
        return NextResponse.next();
      }

      // 3. /sub/students requires students.view
      if (pathname.startsWith("/sub/students")) {
        const userPermissions: string[] = staffSession.permissions || [];
        if (!userPermissions.includes("students.view")) {
          return NextResponse.rewrite(
            new URL("/forbidden?perm=students.view", req.url),
            { status: 403 }
          );
        }
        return NextResponse.next();
      }

      // 4. /sub/activity (Own personal log only)
      if (pathname.startsWith("/sub/activity")) {
        return NextResponse.next();
      }

      // 5. /sub/grants requires freegrant.manage
      if (pathname.startsWith("/sub/grants")) {
        const userPermissions: string[] = staffSession.permissions || [];
        if (!userPermissions.includes("freegrant.manage")) {
          return NextResponse.rewrite(
            new URL("/forbidden?perm=freegrant.manage", req.url),
            { status: 403 }
          );
        }
        return NextResponse.next();
      }

      // 6. Any other /sub/* route (courses, videos, coupons, books, analytics, etc.)
      // is strictly forbidden per final authority model.
      return NextResponse.rewrite(
        new URL("/forbidden?reason=sub_route_unauthorized", req.url),
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Student protected routes
    "/",
    "/home/:path*",
    "/courses/:path*",
    "/course/:path*",
    "/checkout/:path*",
    "/my-courses/:path*",
    "/watch/:path*",
    "/notes/:path*",
    "/books/:path*",
    "/notifications/:path*",
    "/support/:path*",
    "/profile/:path*",
    // Staff & Admin console routes
    "/admin",
    "/admin/:path*",
    "/sub/:path*",
    "/sub",
    // API routes for audit tracking & suspend validation
    "/api/:path*",
  ],
};
