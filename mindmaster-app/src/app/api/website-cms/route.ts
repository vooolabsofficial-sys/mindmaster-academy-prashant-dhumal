import { NextRequest, NextResponse } from "next/server";
import {
  readWebsiteCmsSync,
  writeWebsiteCmsSync,
  addLeadSync,
  updateLeadStatusSync,
  deleteLeadSync,
  DEFAULT_WEBSITE_CMS,
  WebsiteCmsData,
} from "@/lib/websiteCmsStore";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}

export async function GET() {
  try {
    const cmsData = readWebsiteCmsSync();
    return NextResponse.json(
      {
        success: true,
        data: cmsData,
      },
      {
        headers: CORS_HEADERS,
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch Website CMS" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Lead submission from marketing website (Public)
    if (body.action === "submit_lead" || (!body.action && body.phone && body.name)) {
      const leadPayload = body.lead || body;
      if (!leadPayload.name || !leadPayload.phone) {
        return NextResponse.json(
          { success: false, error: "Name and phone number are required" },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      const newLead = addLeadSync({
        name: leadPayload.name,
        phone: leadPayload.phone,
        email: leadPayload.email,
        courseInterest: leadPayload.courseInterest || leadPayload.course,
        message: leadPayload.message,
        source: leadPayload.source || "Website Inquiries",
      });

      return NextResponse.json(
        { success: true, message: "Inquiry received successfully!", lead: newLead },
        { status: 201, headers: CORS_HEADERS }
      );
    }

    // 2. Admin: Update lead status
    if (body.action === "update_lead_status") {
      const ok = updateLeadStatusSync(body.leadId, body.status);
      return NextResponse.json(
        { success: ok, leads: readWebsiteCmsSync().leads },
        { headers: CORS_HEADERS }
      );
    }

    // 3. Admin: Delete lead
    if (body.action === "delete_lead") {
      const ok = deleteLeadSync(body.leadId);
      return NextResponse.json(
        { success: ok, leads: readWebsiteCmsSync().leads },
        { headers: CORS_HEADERS }
      );
    }

    // 4. Admin: Reset to default English seed
    if (body.action === "reset_defaults") {
      const resetData = writeWebsiteCmsSync(DEFAULT_WEBSITE_CMS);
      return NextResponse.json(
        { success: true, data: resetData },
        { headers: CORS_HEADERS }
      );
    }

    // 5. Admin: Save full or partial CMS data
    const dataToSave: Partial<WebsiteCmsData> = body.data || body;
    const updated = writeWebsiteCmsSync(dataToSave);

    return NextResponse.json(
      {
        success: true,
        message: "Website CMS updated successfully",
        data: updated,
      },
      {
        headers: CORS_HEADERS,
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to process CMS request" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = writeWebsiteCmsSync(body);
    return NextResponse.json(
      { success: true, data: updated },
      { headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to update Website CMS" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get("leadId");
    if (leadId) {
      const ok = deleteLeadSync(leadId);
      return NextResponse.json(
        { success: ok, leads: readWebsiteCmsSync().leads },
        { headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      { success: false, error: "Missing resource identifier" },
      { status: 400, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to delete" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
