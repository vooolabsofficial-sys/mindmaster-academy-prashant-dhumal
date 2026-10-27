import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string) || "pdf"; // "pdf" | "cover"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const originalName = file.name || "document.pdf";
    const extension = path.extname(originalName).toLowerCase() || (type === "cover" ? ".png" : ".pdf");
    const baseClean = path.basename(originalName, extension).replace(/[^a-zA-Z0-9_-]/g, "_");
    const safeFilename = `${type}_${Date.now()}_${baseClean}${extension}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const sizeMb = Number((file.size / (1024 * 1024)).toFixed(1));

    let publicUrl: string | null = null;

    // 1. Try Supabase Storage (Bucket: 'books')
    try {
      const adminClient = createAdminClient();
      const contentType = file.type || (type === "cover" ? "image/png" : "application/pdf");

      const { data: uploadData, error: uploadErr } = await adminClient.storage
        .from("books")
        .upload(safeFilename, buffer, {
          contentType,
          upsert: true,
        });

      if (!uploadErr && uploadData) {
        const { data: urlData } = adminClient.storage
          .from("books")
          .getPublicUrl(safeFilename);
        if (urlData?.publicUrl) {
          publicUrl = urlData.publicUrl;
        }
      } else if (uploadErr) {
        console.warn("Supabase Storage bucket upload skipped/error:", uploadErr.message);
      }
    } catch (storageErr: any) {
      console.warn("Supabase Storage connection exception:", storageErr?.message);
    }

    // 2. Fallback to Local Storage ('public/uploads/books/')
    if (!publicUrl) {
      const uploadDir = path.join(process.cwd(), "public", "uploads", "books");
      await fs.mkdir(uploadDir, { recursive: true });
      const diskFilePath = path.join(uploadDir, safeFilename);
      await fs.writeFile(diskFilePath, buffer);
      publicUrl = `/uploads/books/${safeFilename}`;
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: originalName,
      fileSizeMb: sizeMb,
    });
  } catch (err: any) {
    console.error("Book upload handler error:", err);
    return NextResponse.json(
      { error: err?.message || "File upload failed" },
      { status: 500 }
    );
  }
}
