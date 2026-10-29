import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { DEFAULT_PLATFORM_SETTINGS, fetchDbSettings, savePlatformSettings } from "@/lib/staffStore";
import { verifyStaffSession } from "@/lib/staffAuthService";
import { platformSettingsUpdateSchema, formatZodError } from "@/lib/validations";

const DATA_DIR = path.join(process.cwd(), ".data");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

function writeLocalSettings(data: any) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.warn("Failed to write .data/settings.json:", err);
  }
}

function readLocalSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch {}
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const staffCookie = req.cookies.get("mma_staff_session")?.value;
    const staffSession = staffCookie ? verifyStaffSession(staffCookie) : null;
    const isMainAdmin = staffSession && staffSession.role === "main_admin" && staffSession.status === "active";

    // 1. FULL ACADEMY SYSTEM BACKUP EXPORT
    const isBackup = req.nextUrl.searchParams.get("backup") === "true";
    if (isBackup) {
      if (!isMainAdmin) {
        return NextResponse.json(
          { error: "Forbidden: Full system backup requires main_admin credentials" },
          { status: 403 }
        );
      }

      let profiles: any[] = [];
      let courses: any[] = [];
      let books: any[] = [];
      let grants: any[] = [];
      let coupons: any[] = [];

      try {
        const { createAdminClient } = await import("@/lib/supabase/admin");
        const supabase = createAdminClient();
        const [pRes, cRes, bRes, gRes, cpRes] = await Promise.all([
          supabase.from("profiles").select("*").limit(2000),
          supabase.from("courses").select("*").limit(500),
          supabase.from("books").select("*").limit(500),
          supabase.from("course_grants").select("*").limit(2000),
          supabase.from("coupons").select("*").limit(500),
        ]);
        profiles = pRes.data || [];
        courses = cRes.data || [];
        books = bRes.data || [];
        grants = gRes.data || [];
        coupons = cpRes.data || [];
      } catch (e) {
        console.warn("Supabase backup query fallback to local stores:", e);
      }

      if (!courses.length) courses = (await import("@/lib/staffStore")).getStaffCourses();
      if (!books.length) books = (await import("@/lib/staffStore")).getStaffBooks();
      if (!coupons.length) coupons = (await import("@/lib/staffStore")).getStaffCoupons();
      if (!grants.length) grants = (await import("@/lib/grantStore")).getGrants();
      if (!profiles.length) profiles = (await import("@/lib/staffStore")).getStaffStudents();

      const settings = (await fetchDbSettings()) || readLocalSettings() || DEFAULT_PLATFORM_SETTINGS;

      const backupData = {
        version: "2.0.0",
        system: "MindMaster Academy Platform",
        academy_title: settings.academy_title || "MindMaster Academy",
        exported_at: new Date().toISOString(),
        exported_by: staffSession?.name || "Prashant Dhumal Sir",
        counts: {
          profiles: profiles.length,
          courses: courses.length,
          books: books.length,
          grants: grants.length,
          coupons: coupons.length,
        },
        settings,
        profiles,
        courses,
        books,
        grants,
        coupons,
      };

      const dateStr = new Date().toISOString().split("T")[0];
      return new NextResponse(JSON.stringify(backupData, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="mindmaster-academy-backup-${dateStr}.json"`,
        },
      });
    }

    // 2. NORMAL SETTINGS QUERY
    const dbSettings = await fetchDbSettings();
    const diskSettings = readLocalSettings();
    const data = { ...DEFAULT_PLATFORM_SETTINGS, ...(diskSettings || {}), ...(dbSettings || {}) };

    if (!isMainAdmin) {
      // Public-safe settings for students & visitors
      return NextResponse.json({
        success: true,
        settings: {
          maintenance: Boolean(data.maintenance),
          maintenance_message: data.maintenance_message,
          reminder_template: data.reminder_template,
          support_phone: data.support_phone,
          whatsapp_number: data.whatsapp_number || data.support_phone,
          support_email: data.support_email,
          support_hours: data.support_hours || "10:00 AM – 7:00 PM IST (Mon–Sat)",
          ticket_assignment_notice: data.ticket_assignment_notice || "Tickets are routed to active Sub-Admins in Satara and Pune centers.",
          centre_address: data.centre_address,
          pune_address: data.pune_address,
          academy_title: data.academy_title,
          founder_name: data.founder_name,
          razorpay_key_id: data.razorpay_key_id,
          razorpay_mode: data.razorpay_mode,
          gstin: "",
          gst_enabled: false,
          gst_percent: 0,
          upi_support_id: data.upi_support_id,
          social_youtube: data.social_youtube,
          social_instagram: data.social_instagram,
          social_telegram: data.social_telegram,
          single_device_lock: data.single_device_lock !== undefined ? Boolean(data.single_device_lock) : true,
          watermark_enabled: data.watermark_enabled !== undefined ? Boolean(data.watermark_enabled) : true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      settings: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load platform settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const staffCookie = req.cookies.get("mma_staff_session")?.value;
    const staffSession = staffCookie ? verifyStaffSession(staffCookie) : null;

    if (!staffSession || staffSession.role !== "main_admin" || staffSession.status !== "active") {
      const res = NextResponse.json(
        { error: "Forbidden: Modifying platform settings requires active main_admin authority" },
        { status: 403 }
      );
      if (staffSession && staffSession.status !== "active") {
        res.cookies.delete("mma_staff_session");
      }
      return res;
    }

    const body = await req.json();
    const parsed = platformSettingsUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }
    const current = (await fetchDbSettings()) || readLocalSettings() || DEFAULT_PLATFORM_SETTINGS;
    const updated = { ...current, ...parsed.data };

    // Persist to store & Supabase
    savePlatformSettings(updated);

    // Persist to disk backup
    writeLocalSettings(updated);

    return NextResponse.json({
      success: true,
      settings: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to update platform settings" },
      { status: 500 }
    );
  }
}