import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { COURSE_ID_MAP } from "@/lib/mockData";
import { getStaffBooks, getStaffCourses } from "@/lib/staffStore";
import { normalizePhone } from "@/lib/phoneUtils";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature && !webhookSecret.includes("yourRazorpayKeySecret")) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      const a = Buffer.from(expectedSignature, "utf8");
      const b = Buffer.from(signature, "utf8");
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return NextResponse.json(
          { error: "Invalid webhook signature" },
          { status: 400 }
        );
      }
    }

    const event = JSON.parse(rawBody);

    // Process payment.captured or order.paid
    if (event.event === "payment.captured" || event.event === "order.paid") {
      const payment = event.payload?.payment?.entity;
      const order = event.payload?.order?.entity;

      const notes = payment?.notes || order?.notes || {};
      const isBook = notes.itemType === "book" || !!notes.bookId;
      const itemId = (isBook ? notes.bookId : notes.courseId) || (isBook ? "b-wb-01" : "c-mm-01");
      const couponCode = notes.couponCode;
      let finalUserId = notes.userId;

      const supabase = createAdminClient();

      // Resolve student profile UUID by normalized 10-digit phone if provided in notes
      const cleanMobile = normalizePhone(notes.studentMobile);
      if (cleanMobile) {
        try {
          const { data: prof } = await supabase
            .from("profiles")
            .select("id")
            .eq("phone", cleanMobile)
            .maybeSingle();
          if (prof?.id) {
            finalUserId = prof.id;
          } else {
            const { data: newProf } = await supabase
              .from("profiles")
              .insert({
                phone: cleanMobile,
                full_name: notes.studentName?.trim() || `Student ${cleanMobile.slice(-4)}`,
                role: "student",
              })
              .select("id")
              .maybeSingle();
            if (newProf?.id) finalUserId = newProf.id;
          }
        } catch {}
      }
      if (!finalUserId) {
        finalUserId = "22222222-2222-2222-2222-222222222201";
      }

      let dbItemUuid = itemId;
      let accessMonths = isBook ? 6 : 3;
      let defaultPricePaise = 0;

      if (isBook) {
        try {
          const { data } = await supabase
            .from("books")
            .select("id, code, title, access_months, price_paise")
            .or(`id.eq.${itemId},code.eq.${itemId}`)
            .maybeSingle();
          if (data) {
            dbItemUuid = data.id;
            accessMonths = data.access_months || 6;
            defaultPricePaise = Number(data.price_paise) || 0;
          }
        } catch (e) {}

        if (!defaultPricePaise) {
          const staffBooks = getStaffBooks();
          const fallbackBook = staffBooks.find((b) => b.id === itemId || b.code === itemId);
          if (fallbackBook) {
            dbItemUuid = fallbackBook.id;
            accessMonths = fallbackBook.accessMonths || 6;
            defaultPricePaise = fallbackBook.pricePaise || 0;
          }
        }
      } else {
        try {
          const { data } = await supabase
            .from("courses")
            .select("id, code, title, access_months, price_paise")
            .or(`id.eq.${itemId},code.eq.${itemId}`)
            .maybeSingle();
          if (data) {
            dbItemUuid = data.id;
            accessMonths = data.access_months || 3;
            defaultPricePaise = Number(data.price_paise) || 0;
          }
        } catch (e) {}

        if (!defaultPricePaise) {
          const staffCourses = getStaffCourses();
          const fallbackCourse = staffCourses.find((c) => c.id === itemId || c.code === itemId);
          if (fallbackCourse) {
            dbItemUuid = COURSE_ID_MAP[itemId] || fallbackCourse.id;
            accessMonths = fallbackCourse.accessMonths || 3;
            defaultPricePaise = fallbackCourse.pricePaise || 0;
          } else {
            dbItemUuid = COURSE_ID_MAP[itemId] || itemId;
          }
        }
      }

      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + accessMonths);

      const paymentId = payment?.id;
      const orderId = payment?.order_id || order?.id;

      // Idempotency check: If this transaction was already processed as success, return early
      if (paymentId || orderId) {
        try {
          const { data: existing } = await supabase
            .from("purchases")
            .select("id, status")
            .or(`razorpay_payment_id.eq.${paymentId},razorpay_order_id.eq.${orderId}`)
            .in("status", ["success", "active"])
            .maybeSingle();

          if (existing) {
            return NextResponse.json({ status: "ok", message: "Already processed idempotently" });
          }
        } catch (e) {}
      }

      // Handle coupon used_count increment & record redemption
      let couponId: string | null = null;
      if (couponCode) {
        const { data: cp } = await supabase
          .from("coupons")
          .select("id, used_count")
          .ilike("code", couponCode.trim())
          .maybeSingle();

        if (cp) {
          couponId = cp.id;
          await supabase
            .from("coupons")
            .update({ used_count: (cp.used_count || 0) + 1 })
            .eq("id", cp.id);

          try {
            await supabase.from("coupon_redemptions").insert({
              user_id: finalUserId,
              coupon_id: cp.id,
              at: new Date().toISOString(),
              item_type: isBook ? "book" : "course",
              book_id: isBook ? dbItemUuid : null,
            });
          } catch {}
        }
      }

      // Upsert purchase record
      const purchasePayload: any = {
        user_id: finalUserId,
        item_type: isBook ? "book" : "course",
        course_id: isBook ? null : dbItemUuid,
        book_id: isBook ? dbItemUuid : null,
        amount_paise: payment?.amount || order?.amount || defaultPricePaise,
        coupon_id: couponId,
        razorpay_order_id: payment?.order_id || order?.id,
        razorpay_payment_id: payment?.id,
        razorpay_signature: signature || "webhook_verified",
        status: "success",
        purchased_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      };

      const conflictCol = isBook ? "user_id,book_id" : "user_id,course_id";

      await supabase.from("purchases").upsert(
        purchasePayload,
        { onConflict: conflictCol }
      );
    }

    return NextResponse.json({ status: "ok" });
  } catch (error: any) {
    console.error("Razorpay webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed", details: error.message },
      { status: 500 }
    );
  }
}
