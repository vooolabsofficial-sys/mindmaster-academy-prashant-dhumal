import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { MOCK_COURSES, COURSE_ID_MAP } from "@/lib/mockData";

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
      const courseId = notes.courseId || "c-mm-01";
      const couponCode = notes.couponCode;
      const userId = notes.userId || "22222222-2222-2222-2222-222222222201";

      const course = MOCK_COURSES.find((c) => c.id === courseId) || MOCK_COURSES[0];
      const dbCourseUuid = COURSE_ID_MAP[course.id] || course.id;
      const accessMonths = course.accessMonths || 3;

      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + accessMonths);

      const supabase = createAdminClient();

      // Handle coupon used_count increment
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
        }
      }

      // Upsert purchase record
      await supabase.from("purchases").upsert(
        {
          user_id: userId,
          course_id: dbCourseUuid,
          amount_paise: payment?.amount || order?.amount || course.pricePaise,
          coupon_id: couponId,
          razorpay_order_id: payment?.order_id || order?.id,
          razorpay_payment_id: payment?.id,
          razorpay_signature: signature || "webhook_verified",
          status: "success",
          purchased_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        },
        { onConflict: "user_id,course_id" }
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
