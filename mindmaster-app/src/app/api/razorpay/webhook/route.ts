import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { COURSE_ID_MAP } from "@/lib/mockData";
import { getStaffBooks, getStaffCourses } from "@/lib/staffStore";
import { normalizePhone } from "@/lib/phoneUtils";
import { recordServerAuditLog } from "@/lib/auditLogger";
import { razorpayWebhookSchema, formatZodError } from "@/lib/validations";

// Global cache to track recently processed Razorpay event IDs (capped at 5,000 entries)
declare global {
  // eslint-disable-next-line no-var
  var _mma_processed_webhook_events: Set<string> | undefined;
}

if (!globalThis._mma_processed_webhook_events) {
  globalThis._mma_processed_webhook_events = new Set<string>();
}

const processedEvents = globalThis._mma_processed_webhook_events;

function markEventProcessed(eventId?: string, eventType?: string) {
  if (!eventId) return;
  if (processedEvents.size >= 5000) {
    // Clear oldest 1,000 items
    const iterator = processedEvents.values();
    for (let i = 0; i < 1000; i++) {
      const next = iterator.next();
      if (next.done) break;
      processedEvents.delete(next.value);
    }
  }
  processedEvents.add(eventId);

  // Persist to processed_webhook_events table in Supabase
  try {
    const admin = createAdminClient();
    Promise.resolve(
      admin.from("processed_webhook_events").insert({ event_id: eventId, event_type: eventType || "payment" })
    ).catch(() => {});
  } catch {}
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const eventIdHeader = req.headers.get("x-razorpay-event-id");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

    // 1. Verify webhook signature cryptographically if secret is configured
    if (webhookSecret && signature && !webhookSecret.includes("yourRazorpayKeySecret")) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      const a = Buffer.from(expectedSignature, "utf8");
      const b = Buffer.from(signature, "utf8");
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        recordServerAuditLog({
          staff_id: "SYSTEM_WEBHOOK",
          staff_name: "Razorpay Webhook Guard",
          action: "WEBHOOK_SIGNATURE_MISMATCH",
          category: "security",
          severity: "critical",
          entity_type: "payment",
          meta: {
            eventId: eventIdHeader,
            signatureProvided: signature.slice(0, 8) + "...",
          },
        });

        return NextResponse.json(
          { error: "Invalid webhook signature" },
          { status: 400 }
        );
      }
    }

    let rawJson: any;
    try {
      rawJson = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const parsed = razorpayWebhookSchema.safeParse(rawJson);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Malformed webhook payload", details: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const event = parsed.data;
    const eventId = eventIdHeader || (event as any).id || (event.payload?.payment?.entity?.id ? `evt_${event.payload.payment.entity.id}` : undefined);
    const supabase = createAdminClient();

    // 2. Strict Event ID Idempotency Check
    if (eventId) {
      if (processedEvents.has(eventId)) {
        return NextResponse.json({ status: "ok", message: "Already processed idempotently" });
      }
      try {
        const { data: alreadyProcessed } = await supabase
          .from("processed_webhook_events")
          .select("event_id")
          .eq("event_id", eventId)
          .maybeSingle();
        if (alreadyProcessed) {
          processedEvents.add(eventId);
          return NextResponse.json({ status: "ok", message: "Already processed idempotently" });
        }
      } catch {}
    }

    // 3. Handle payment.failed event for audit tracking
    if (event.event === "payment.failed") {
      const failedPayment = event.payload?.payment?.entity;
      const failedNotes = failedPayment?.notes || {};
      recordServerAuditLog({
        staff_id: "SYSTEM_WEBHOOK",
        staff_name: "Razorpay Payment Observer",
        action: "PAYMENT_FAILED",
        category: "settlements",
        severity: "warning",
        entity_type: "payment",
        entity_id: failedPayment?.id,
        target_student_phone: failedNotes.studentMobile,
        target_student_name: failedNotes.studentName,
        meta: {
          errorCode: failedPayment?.error_code,
          errorDescription: failedPayment?.error_description,
          orderId: failedPayment?.order_id,
          amount: failedPayment?.amount,
        },
      });

      markEventProcessed(eventId);
      return NextResponse.json({ status: "ok", message: "Payment failure recorded" });
    }

    // 4. Process payment.captured or order.paid
    if (event.event === "payment.captured" || event.event === "order.paid") {
      const payment = event.payload?.payment?.entity;
      const order = event.payload?.order?.entity;

      const notes = payment?.notes || order?.notes || {};
      const isBook = notes.itemType === "book" || !!notes.bookId;
      const itemId = (isBook ? notes.bookId : notes.courseId) || (isBook ? "b-wb-01" : "c-mm-01");
      const couponCode = notes.couponCode;
      let finalUserId = notes.userId;

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
            markEventProcessed(eventId);
            return NextResponse.json({ status: "ok", message: "Already processed idempotently" });
          }
        } catch (e) {}
      }

      let couponId: string | null = null;
      if (couponCode) {
        try {
          const { data: cp } = await supabase
            .from("coupons")
            .select("id, used_count")
            .ilike("code", couponCode.trim())
            .maybeSingle();

          if (cp) {
            couponId = cp.id;
          }
        } catch {}
      }

      // Upsert purchase record first (Atomic grant)
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

      const { data: purchaseData, error: purchaseError } = await supabase.from("purchases").upsert(
        purchasePayload,
        { onConflict: conflictCol }
      )
        .select("id")
        .single();

      if (purchaseError) {
        recordServerAuditLog({
          staff_id: "SYSTEM_WEBHOOK",
          staff_name: "Razorpay Webhook Guard",
          action: "WEBHOOK_PURCHASE_FAILED",
          category: "settlements",
          severity: "critical",
          entity_type: "purchase",
          entity_id: paymentId || orderId,
          meta: { error: purchaseError.message, paymentId, orderId },
        });
        throw purchaseError;
      }

      // Increment coupon and record redemption only after purchase is committed
      if (couponId) {
        try {
          const { data: cp } = await supabase
            .from("coupons")
            .select("used_count")
            .eq("id", couponId)
            .maybeSingle();

          await supabase
            .from("coupons")
            .update({ used_count: (cp?.used_count || 0) + 1 })
            .eq("id", couponId);

          await supabase.from("coupon_redemptions").insert({
            user_id: finalUserId,
            coupon_id: couponId,
            at: new Date().toISOString(),
            item_type: isBook ? "book" : "course",
            book_id: isBook ? dbItemUuid : null,
          });
        } catch (cpnErr) {
          console.warn("Webhook coupon redemption warning:", cpnErr);
        }
      }

      markEventProcessed(eventId);

      recordServerAuditLog({
        staff_id: "SYSTEM_WEBHOOK",
        staff_name: "Razorpay Webhook Guard",
        action: "WEBHOOK_PURCHASE_FULFILLED",
        category: "settlements",
        severity: "info",
        entity_type: "purchase",
        entity_id: purchaseData?.id || paymentId || orderId,
        target_student_phone: notes.studentMobile,
        target_student_name: notes.studentName,
        meta: {
          itemType: isBook ? "book" : "course",
          itemId,
          amountPaise: purchasePayload.amount_paise,
          paymentId,
          orderId,
          eventId,
        },
      });
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
