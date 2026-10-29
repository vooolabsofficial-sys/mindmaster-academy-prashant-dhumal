import { NextResponse } from "next/server";

function createLogoutResponse() {
  const res = NextResponse.json({
    success: true,
    message: "Staff logged out successfully.",
  });

  // Explicitly invalidate session cookie across all path variations
  res.cookies.set("mma_staff_session", "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  res.cookies.delete("mma_staff_session");

  // Prevent browser caching of authenticated responses
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");

  return res;
}

export async function POST() {
  return createLogoutResponse();
}

export async function GET() {
  return createLogoutResponse();
}
