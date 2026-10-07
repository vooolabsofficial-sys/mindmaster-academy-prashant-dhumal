import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true, message: "Staff logged out successfully." });
  res.cookies.delete("mma_staff_session");
  return res;
}

export async function GET() {
  const res = NextResponse.json({ success: true, message: "Staff logged out successfully." });
  res.cookies.delete("mma_staff_session");
  return res;
}
