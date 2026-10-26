import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Supabase Free Tier Auto-Keep-Alive
 * Executes a lightweight read and timestamp update against the live Supabase
 * 'settings' table (where id = 1). This ensures Supabase records daily active
 * database traffic and never auto-pauses after 7 days.
 */
async function pingSupabaseKeepAlive() {
  const startTime = Date.now();
  const now = new Date().toISOString();

  try {
    const supabase = createAdminClient();

    // 1. Lightweight read
    const { data: readData, error: readError } = await supabase
      .from("settings")
      .select("id, updated_at")
      .eq("id", 1)
      .maybeSingle();

    if (readError) {
      console.warn("[Keep-Alive] Warning on settings select:", readError.message);
    }

    // 2. Lightweight timestamp update to register active write traffic
    const { data: updateData, error: updateError } = await supabase
      .from("settings")
      .update({ updated_at: now })
      .eq("id", 1)
      .select("id, updated_at");

    if (updateError) {
      throw updateError;
    }

    const elapsedMs = Date.now() - startTime;

    return {
      success: true,
      timestamp: now,
      elapsedMs,
      message: "Supabase keep-alive ping successful (active read+write recorded)",
      settings: updateData?.[0] || readData || null,
    };
  } catch (err: any) {
    console.error("[Keep-Alive] Supabase ping failed:", err);
    return {
      success: false,
      timestamp: now,
      error: err.message || "Failed to ping Supabase settings table",
    };
  }
}

export async function GET(req: NextRequest) {
  const result = await pingSupabaseKeepAlive();
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}

export async function POST(req: NextRequest) {
  const result = await pingSupabaseKeepAlive();
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
