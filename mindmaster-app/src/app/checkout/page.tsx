"use client";

import { useState, useEffect, Suspense } from "react";
import Script from "next/script";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  ArrowLeft, 
  ShieldCheck, 
  Tag, 
  CheckCircle2, 
  Lock, 
  CreditCard, 
  Smartphone, 
  HelpCircle,
  Clock,
  Sparkles,
  AlertCircle,
  X,
  RefreshCw,
  Award,
  BookOpen,
  Zap,
  Check,
  FileText
} from "lucide-react";
import AppShell from "@/components/navigation/AppShell";
import { COURSE_ID_MAP } from "@/lib/mockData";
import { 
  validateCoupon, 
  createRazorpayOrder, 
  verifyRazorpayPayment,
  getAvailableCoupons,
  CouponValidationResult,
  AvailableCouponChip
} from "@/app/actions/checkout";
import { triggerCourseUnlockConfetti } from "@/lib/celebration";
import { generateFeeReceiptPdf } from "@/lib/pdfGenerator";
import { getStaffStudents, getStaffCourses, getStaffBooks } from "@/lib/staffStore";
import { createClient } from "@/lib/supabase/client";
import { normalizePhone } from "@/lib/phoneUtils";
import { verifyStudentCourseAccess } from "@/app/actions/studentAccess";
import { toast } from "sonner";

declare global {
  interface Window {
    Razorpay: any;
  }
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawBookId = searchParams.get("bookId") || searchParams.get("book") || "";
  const rawCourseId = searchParams.get("courseId") || searchParams.get("course") || "";
  const isBookCheckout = Boolean(rawBookId);

  const [dbFetchedItem, setDbFetchedItem] = useState<any>(null);

  const staffBooks = typeof window !== "undefined" ? getStaffBooks() : [];
  const book = isBookCheckout && rawBookId
    ? staffBooks.find(
        (b) =>
          b.id.toLowerCase() === rawBookId.toLowerCase() ||
          (b.code && b.code.toLowerCase() === rawBookId.toLowerCase())
      ) || (dbFetchedItem?.isBook ? dbFetchedItem : null)
    : null;

  const staffCourses = typeof window !== "undefined" ? getStaffCourses() : [];
  const course = !isBookCheckout && rawCourseId
    ? staffCourses.find(
        (c) =>
          c.id.toLowerCase() === rawCourseId.toLowerCase() ||
          c.code.toLowerCase() === rawCourseId.toLowerCase() ||
          (COURSE_ID_MAP[rawCourseId.toLowerCase()] && (c.id === COURSE_ID_MAP[rawCourseId.toLowerCase()] || c.code.toLowerCase() === rawCourseId.toLowerCase()))
      ) || (!dbFetchedItem?.isBook ? dbFetchedItem : null)
    : null;

  // Student verification form state
  const [studentName, setStudentName] = useState("");
  const [studentMobile, setStudentMobile] = useState("");
  const [district, setDistrict] = useState("Pune");
  const [studentSchool, setStudentSchool] = useState("");
  const [availableCoupons, setAvailableCoupons] = useState<AvailableCouponChip[]>([]);

  // Ownership state to prevent duplicate purchases
  const [alreadyOwned, setAlreadyOwned] = useState<boolean>(false);
  const [alreadyOwnedExpiresAt, setAlreadyOwnedExpiresAt] = useState<string>("");

  useEffect(() => {
    try {
      let schoolVal = "";
      const raw = localStorage.getItem("mindmaster_user_profile");
      if (raw) {
        const p = JSON.parse(raw);
        if (p.full_name) setStudentName(p.full_name);
        if (p.phone) setStudentMobile(normalizePhone(p.phone));
        if (p.district) setDistrict(p.district);
        schoolVal = p.school_name || p.school || "";
      }
      const verifiedPhone = localStorage.getItem("mindmaster_verified_phone");
      if (verifiedPhone) setStudentMobile(normalizePhone(verifiedPhone));

      if (!schoolVal) {
        const students = getStaffStudents();
        const cleanPhone = normalizePhone(verifiedPhone);
        const matched = students.find(
          (s) => s.phone && cleanPhone && normalizePhone(s.phone).includes(cleanPhone)
        );
        if (matched?.school) schoolVal = matched.school;
      }
      if (schoolVal) setStudentSchool(schoolVal);

      // Local storage active purchase check
      if (isBookCheckout && book) {
        const rawBookPurchases = localStorage.getItem("mindmaster_active_book_purchases");
        if (rawBookPurchases) {
          const parsed = JSON.parse(rawBookPurchases);
          const exp = parsed[book.id] || (book.code && parsed[book.code]);
          if (exp && new Date(exp) > new Date()) {
            setAlreadyOwned(true);
            setAlreadyOwnedExpiresAt(exp);
          }
        }
      } else if (course) {
        const rawPurchases = localStorage.getItem("mindmaster_active_purchases");
        if (rawPurchases) {
          const parsed = JSON.parse(rawPurchases);
          const exp =
            parsed[course.id] ||
            parsed[course.code] ||
            (COURSE_ID_MAP[course.id] && parsed[COURSE_ID_MAP[course.id]]);
          if (exp && new Date(exp) > new Date()) {
            setAlreadyOwned(true);
            setAlreadyOwnedExpiresAt(exp);
          }
        }
      }
    } catch {}

    async function loadSupabaseUser() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, phone, school_name, district")
            .eq("id", user.id)
            .maybeSingle();
          if (profile) {
            if (profile.full_name) setStudentName(profile.full_name);
            if (profile.phone) setStudentMobile(normalizePhone(profile.phone));
            if (profile.district) setDistrict(profile.district);
            if (profile.school_name) setStudentSchool(profile.school_name);
          }

          // Check active purchases in database
          if (isBookCheckout && book) {
            const { data: dbPurchase } = await supabase
              .from("purchases")
              .select("id, expires_at, status")
              .eq("user_id", user.id)
              .eq("book_id", book.id)
              .in("status", ["success", "active"])
              .gt("expires_at", new Date().toISOString())
              .maybeSingle();

            if (dbPurchase) {
              setAlreadyOwned(true);
              setAlreadyOwnedExpiresAt(dbPurchase.expires_at);
            }
          } else if (course) {
            const dbCourseUuid = COURSE_ID_MAP[course.id] || course.id;
            const { data: dbPurchase } = await supabase
              .from("purchases")
              .select("id, expires_at, status")
              .eq("user_id", user.id)
              .in("course_id", [course.id, dbCourseUuid])
              .in("status", ["success", "active"])
              .gt("expires_at", new Date().toISOString())
              .maybeSingle();

            if (dbPurchase) {
              setAlreadyOwned(true);
              setAlreadyOwnedExpiresAt(dbPurchase.expires_at);
            }
          }
        }

        if (!isBookCheckout && course) {
          const verifiedPhone = localStorage.getItem("mindmaster_verified_phone") || "";
          const cleanPhone = normalizePhone(studentMobile || verifiedPhone);

          const accessCheck = await verifyStudentCourseAccess({
            courseId: course.id,
            userPhone: cleanPhone,
            userId: user?.id,
          });

          if (accessCheck.hasAccess) {
            setAlreadyOwned(true);
            if (accessCheck.expiresAt) {
              setAlreadyOwnedExpiresAt(accessCheck.expiresAt);
            }
          }
        }
      } catch (e) {}
    }
    loadSupabaseUser();

    async function fetchItemFromDb() {
      try {
        const supabase = createClient();
        if (isBookCheckout && rawBookId) {
          const isBookUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawBookId);
          let bQuery = supabase.from("books").select("*");
          if (isBookUuid) {
            bQuery = bQuery.or(`id.eq.${rawBookId},code.ilike.${rawBookId}`);
          } else {
            bQuery = bQuery.or(`code.ilike.${rawBookId},code.eq.${rawBookId.toUpperCase()}`);
          }
          const { data: bData } = await bQuery.maybeSingle();
          if (bData) {
            setDbFetchedItem({
              id: bData.id,
              code: bData.code || "BOOK",
              title: bData.title,
              subtitle: bData.subtitle || "",
              description: bData.description || "",
              pricePaise: Number(bData.price_paise) || 0,
              originalPricePaise: Number(bData.original_price_paise) || 0,
              accessMonths: bData.access_months || 6,
              pages: bData.pages || 50,
              fileSizeMb: Number(bData.file_size_mb) || 8.5,
              headerTint: bData.header_tint || "sky",
              badgeText: bData.badge_text || undefined,
              isBook: true,
            });
          }
        } else if (!isBookCheckout && rawCourseId) {
          const isCourseUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawCourseId);
          let cQuery = supabase.from("courses").select("*");
          if (isCourseUuid) {
            cQuery = cQuery.or(`id.eq.${rawCourseId},code.ilike.${rawCourseId}`);
          } else {
            const mappedUuid = COURSE_ID_MAP[rawCourseId.toLowerCase()];
            if (mappedUuid) {
              cQuery = cQuery.or(`id.eq.${mappedUuid},code.ilike.${rawCourseId}`);
            } else {
              cQuery = cQuery.or(`code.ilike.${rawCourseId},code.eq.${rawCourseId.toUpperCase()}`);
            }
          }
          const { data: cData } = await cQuery.maybeSingle();
          if (cData) {
            setDbFetchedItem({
              id: cData.id,
              code: cData.code,
              title: cData.title,
              description: cData.description,
              pricePaise: Number(cData.price_paise) || 0,
              originalPricePaise: Number(cData.original_price_paise) || 0,
              accessMonths: cData.access_months || 3,
              badgeText: cData.badge_text,
              isBook: false,
            });
          }
        }
      } catch {}
    }
    fetchItemFromDb();

    // Fetch active available coupon chips for this item
    const currentItemId = isBookCheckout ? (rawBookId || book?.id) : (rawCourseId || course?.id);
    if (currentItemId) {
      getAvailableCoupons({
        itemId: currentItemId,
        itemType: isBookCheckout ? "book" : "course",
        studentMobile,
        studentSchool,
      }).then((chips) => {
        if (chips && Array.isArray(chips)) {
          setAvailableCoupons(chips);
        }
      }).catch(() => {});
    }
  }, [isBookCheckout, rawBookId, rawCourseId, book?.id, book?.code, course?.id, course?.code, studentMobile, studentSchool]);

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResult["coupon"] | null>(null);
  const [couponFeedback, setCouponFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Payment flow state
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "success" | "failed">("idle");
  const [failureReason, setFailureReason] = useState<string>("");
  const [paymentDetails, setPaymentDetails] = useState<{
    orderId: string;
    paymentId: string;
    expiresAt: string;
  } | null>(null);

  // Load Razorpay checkout script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  if (isBookCheckout && !book) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center select-none">
        <div className="bg-white rounded-3xl p-8 border border-[#E4E8F8] shadow-xs">
          <div className="w-16 h-16 bg-[#EBF3FE] text-[#0B57D0] rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
            📖
          </div>
          <h2 className="text-xl font-black text-[#0E1B3D]">Book Currently Unavailable</h2>
          <p className="text-xs text-[#5A6478] mt-2 mb-6">Please browse our other publications or try again later.</p>
          <Link href="/books" className="px-6 py-2.5 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-bold shadow-sm transition">
            View Books Catalog
          </Link>
        </div>
      </div>
    );
  }

  if (!isBookCheckout && !course) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center select-none">
        <div className="bg-white rounded-3xl p-8 border border-[#E4E8F8] shadow-xs">
          <div className="w-16 h-16 bg-[#EBF3FE] text-[#0B57D0] rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
            🎓
          </div>
          <h2 className="text-xl font-black text-[#0E1B3D]">Course Currently Unavailable</h2>
          <p className="text-xs text-[#5A6478] mt-2 mb-6">Please check our catalog of available courses.</p>
          <Link href="/courses" className="px-6 py-2.5 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-bold shadow-sm transition">
            View Courses
          </Link>
        </div>
      </div>
    );
  }

  // Compute pricing
  const activePricePaise = isBookCheckout ? (book?.pricePaise || 0) : (course?.pricePaise || 0);
  const activeOriginalPricePaise = isBookCheckout ? (book?.originalPricePaise || 0) : (course?.originalPricePaise || 0);
  const basePriceRupees = Math.round(activePricePaise / 100);
  const originalPriceRupees = Math.round(activeOriginalPricePaise / 100);
  const discountRupees = appliedCoupon ? Math.round(appliedCoupon.discountAmountPaise / 100) : 0;
  const finalPriceRupees = Math.max(0, basePriceRupees - discountRupees);
  const totalSavingsRupees = Math.max(0, originalPriceRupees - basePriceRupees) + discountRupees;

  // Coupon validation
  const handleApplyCoupon = async (e?: React.FormEvent, directCode?: string) => {
    if (e) e.preventDefault();
    const codeToValidate = (directCode || couponInput).trim();
    if (!codeToValidate) {
      setCouponFeedback({
        type: "error",
        message: "Please enter a coupon code.",
      });
      return;
    }

    setIsValidatingCoupon(true);
    setCouponFeedback(null);

    try {
      let currentSchool = studentSchool;
      if (!currentSchool) {
        try {
          const raw = localStorage.getItem("mindmaster_user_profile");
          if (raw) {
            const p = JSON.parse(raw);
            currentSchool = p.school_name || p.school || "";
          }
          if (!currentSchool) {
            const students = getStaffStudents();
            const cleanPhone = normalizePhone(studentMobile);
            const matched = students.find(
              (s) => s.phone && cleanPhone && normalizePhone(s.phone).includes(cleanPhone)
            );
            if (matched?.school) currentSchool = matched.school;
          }
        } catch {}
      }

      const result = await validateCoupon(
        codeToValidate,
        isBookCheckout ? book!.id : course.id,
        undefined,
        currentSchool,
        isBookCheckout ? "book" : "course",
        studentMobile
      );
      if (result.success && result.coupon) {
        setAppliedCoupon(result.coupon);
        setCouponInput(result.coupon.code);
        setCouponFeedback({
          type: "success",
          message: result.message || "Coupon code successfully applied!",
        });
        toast.success(`Coupon applied: ${result.coupon.code}`);
      } else {
        setAppliedCoupon(null);
        setCouponFeedback({
          type: "error",
          message: result.error || "Invalid or expired coupon code.",
        });
        toast.error(result.error || "Invalid coupon code");
      }
    } catch (err: any) {
      setCouponFeedback({
        type: "error",
        message: "Error during coupon validation. Please try again.",
      });
      toast.error("Error validating coupon");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponFeedback(null);
    toast.info("Coupon removed");
  };

  // Payment execution
  const handleInitiatePayment = async () => {
    if (alreadyOwned) {
      toast.info(isBookCheckout ? "You already have active access to this book!" : "You already have active access to this course!");
      router.push(isBookCheckout ? "/books" : "/my-courses");
      return;
    }

    setIsProcessingPayment(true);
    setFailureReason("");

    try {
      const orderResult = await createRazorpayOrder({
        courseId: isBookCheckout ? undefined : course.id,
        bookId: isBookCheckout ? book!.id : undefined,
        itemType: isBookCheckout ? "book" : "course",
        couponCode: appliedCoupon?.code,
        studentMobile,
        studentName,
        studentSchool,
      });

      if (!orderResult.success || !orderResult.orderId) {
        throw new Error(orderResult.error || "Could not generate order ID.");
      }

      // 100% Free / Full Scholarship instant enrollment
      if (orderResult.amountPaise === 0 || orderResult.orderId.startsWith("free_")) {
        const freeVerification = await verifyRazorpayPayment({
          razorpay_order_id: orderResult.orderId,
          razorpay_payment_id: `pay_free_${Date.now()}`,
          razorpay_signature: "free_scholarship_approved",
          courseId: isBookCheckout ? undefined : course.id,
          bookId: isBookCheckout ? book!.id : undefined,
          itemType: isBookCheckout ? "book" : "course",
          couponCode: appliedCoupon?.code,
          amountPaise: 0,
          studentName: studentName || "MindMaster Student",
          studentMobile,
        });

        if (freeVerification.success) {
          handlePaymentSuccess(
            orderResult.orderId,
            `pay_free_${Date.now()}`,
            freeVerification.expiresAt || new Date(Date.now() + 180 * 86400000).toISOString()
          );
        } else {
          handlePaymentFailure(freeVerification.error || "Enrollment processing failed.");
        }
        return;
      }

      // Offline / Mock fallback
      if (typeof window === "undefined" || !window.Razorpay) {
        setTimeout(async () => {
          const verification = await verifyRazorpayPayment({
            razorpay_order_id: orderResult.orderId!,
            razorpay_payment_id: `pay_mock_${Date.now()}`,
            razorpay_signature: "mock_signature_approved",
            courseId: isBookCheckout ? undefined : course.id,
            bookId: isBookCheckout ? book!.id : undefined,
            itemType: isBookCheckout ? "book" : "course",
            couponCode: appliedCoupon?.code,
            amountPaise: orderResult.amountPaise || activePricePaise,
            studentName,
            studentMobile,
          });

          if (verification.success) {
            handlePaymentSuccess(
              orderResult.orderId!,
              `pay_mock_${Date.now()}`,
              verification.expiresAt!
            );
          } else {
            handlePaymentFailure(verification.error || "Payment verification failed.");
          }
        }, 1200);
        return;
      }

      const itemTitle = isBookCheckout ? book!.title : course.title;
      const itemCode = isBookCheckout ? (book!.code || "BOOK") : course.code;

      const options = {
        key: orderResult.keyId,
        amount: orderResult.amountPaise,
        currency: orderResult.currency || "INR",
        name: "MindMaster Academy",
        description: `${itemCode} - ${itemTitle}`,
        image: "/icons/icon-192.png",
        order_id: orderResult.orderId,
        prefill: {
          name: studentName,
          contact: studentMobile,
          email: "student@mindmasteracademy.com",
        },
        theme: {
          color: "#0B57D0",
        },
        handler: async function (response: any) {
          try {
            const verifyResult = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              courseId: isBookCheckout ? undefined : course.id,
              bookId: isBookCheckout ? book!.id : undefined,
              itemType: isBookCheckout ? "book" : "course",
              couponCode: appliedCoupon?.code,
              amountPaise: orderResult.amountPaise || activePricePaise,
              studentName,
              studentMobile,
            });

            if (verifyResult.success) {
              handlePaymentSuccess(
                response.razorpay_order_id,
                response.razorpay_payment_id,
                verifyResult.expiresAt!
              );
            } else {
              handlePaymentFailure(
                verifyResult.error || "Error in payment signature verification."
              );
            }
          } catch (err: any) {
            handlePaymentFailure(err.message || "Server verification failed.");
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
          },
        },
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on("payment.failed", function (resp: any) {
        handlePaymentFailure(
          resp.error?.description || "Payment declined by bank. Please try again."
        );
      });
      rzpInstance.open();
    } catch (err: any) {
      handlePaymentFailure(err.message || "Error initiating payment.");
    }
  };

  const handlePaymentSuccess = (orderId: string, paymentId: string, expiresAt: string) => {
    setIsProcessingPayment(false);
    setPaymentDetails({ orderId, paymentId, expiresAt });
    setPaymentStatus("success");
    triggerCourseUnlockConfetti();

    if (isBookCheckout && book) {
      try {
        const activeBookPurchases = JSON.parse(
          localStorage.getItem("mindmaster_active_book_purchases") || "{}"
        );
        activeBookPurchases[book.id] = expiresAt;
        if (book.code) activeBookPurchases[book.code] = expiresAt;
        localStorage.setItem("mindmaster_active_book_purchases", JSON.stringify(activeBookPurchases));
        window.dispatchEvent(new Event("mma_books_unlocked"));
      } catch (e) {}
    } else {
      try {
        const activePurchases = JSON.parse(
          localStorage.getItem("mindmaster_active_purchases") || "{}"
        );
        activePurchases[course.id] = expiresAt;
        activePurchases[course.code] = expiresAt;
        const dbUuid = COURSE_ID_MAP[course.id];
        if (dbUuid) activePurchases[dbUuid] = expiresAt;
        localStorage.setItem("mindmaster_active_purchases", JSON.stringify(activePurchases));
      } catch (e) {}
    }
  };

  const handlePaymentFailure = (reason: string) => {
    setIsProcessingPayment(false);
    setFailureReason(reason);
    setPaymentStatus("failed");
  };

  const handleRetry = () => {
    setPaymentStatus("idle");
    setFailureReason("");
  };

  // =========================================================================
  // SUCCESS SCREEN
  // =========================================================================
  if (paymentStatus === "success") {
    const itemTitle = isBookCheckout ? book!.title : course.title;
    const itemCode = isBookCheckout ? (book!.code || "BOOK") : course.code;

    return (
      <div className="max-w-2xl mx-auto py-6 px-4 select-none">
        <div className="bg-white rounded-3xl p-8 md:p-10 border-2 border-[#0A8554]/30 shadow-[0_20px_50px_rgba(10,133,84,0.12)] text-center flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl bg-[#E8F8F2] border border-[#C6ECD9] text-[#0A8554] flex items-center justify-center mb-5 shadow-sm animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0A8554] bg-[#E8F8F2] px-3.5 py-1 rounded-full mb-3">
            {finalPriceRupees === 0
              ? "🎉 100% Scholarship Enrollment Approved • Instant Access Unlocked"
              : "Payment Successful • Instant Access Unlocked"}
          </span>

          <h1 className="text-2xl md:text-3xl font-black text-[#0E1B3D]">
            Congratulations, {studentName || "Student"}! 🎉
          </h1>

          <p className="text-xs md:text-sm text-[#5A6478] mt-2 max-w-md leading-relaxed">
            Your {isBookCheckout ? "Digital Book" : "course"}{" "}
            <strong className="text-[#0E1B3D]">{itemTitle}</strong> has been successfully activated.
            {isBookCheckout
              ? " You can now read it directly inside the app and save it in your encrypted offline vault."
              : " You can now access all premium lectures and study materials right away."}
          </p>

          {/* Transaction Summary Card */}
          <div className="w-full mt-6 p-5 rounded-2xl bg-[#F5F7FF] border border-[#E4E8F8] text-left text-xs flex flex-col gap-2.5">
            <div className="flex justify-between items-center py-1 border-b border-[#E4E8F8]">
              <span className="text-[#5A6478]">{isBookCheckout ? "Book Code:" : "Course Code:"}</span>
              <span className="font-extrabold text-[#0E1B3D]">{itemCode}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[#E4E8F8]">
              <span className="text-[#5A6478]">Order ID:</span>
              <span className="font-mono text-[#0E1B3D]">{paymentDetails?.orderId}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[#E4E8F8]">
              <span className="text-[#5A6478]">Payment ID:</span>
              <span className="font-mono text-[#0A8554] font-bold">{paymentDetails?.paymentId}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[#E4E8F8]">
              <span className="text-[#5A6478]">Amount Paid:</span>
              <span className="font-extrabold text-[#0E1B3D]">
                {finalPriceRupees === 0 ? "₹0 (100% Free Scholarship)" : `₹${finalPriceRupees}`}
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-[#5A6478]">Access Valid Until:</span>
              <span className="font-bold text-[#0B57D0]">
                {paymentDetails?.expiresAt
                  ? new Date(paymentDetails.expiresAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "Active"}
              </span>
            </div>
          </div>

          {/* Download Official Receipt Button */}
          <button
            type="button"
            onClick={() =>
              generateFeeReceiptPdf({
                receiptNo: `REC-${paymentDetails?.paymentId ? paymentDetails.paymentId.slice(-6).toUpperCase() : Date.now().toString().slice(-6)}`,
                date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
                studentName: studentName || "Verified Student",
                studentPhone: studentMobile || (typeof window !== "undefined" ? JSON.parse(localStorage.getItem("mma_student_session") || "{}")?.phone || "Verified Mobile" : "Verified Mobile"),
                district: "Maharashtra",
                courseCode: itemCode,
                courseTitle: itemTitle,
                amountPaise: finalPriceRupees * 100,
                paymentId: paymentDetails?.paymentId || "pay_verified_gateway",
                accessMonths: isBookCheckout ? (book?.accessMonths || 6) : course.accessMonths,
                expiryDate: paymentDetails?.expiresAt
                  ? new Date(paymentDetails.expiresAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "180 Days",
              })
            }
            className="w-full mt-6 py-3 px-6 rounded-2xl bg-[#E8F8F2] hover:bg-[#D5F2E6] text-[#0A8554] border border-[#C6ECD9] text-xs font-black transition inline-flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-2xs"
          >
            <FileText className="w-4 h-4" />
            <span>📄 Download Official GST Fee Receipt (PDF)</span>
          </button>

          {/* Action CTAs */}
          <div className="w-full mt-4 flex flex-col sm:flex-row gap-3">
            {isBookCheckout ? (
              <Link
                href={`/books?open=${book!.id}`}
                className="flex-1 py-3.5 px-6 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs md:text-sm font-extrabold shadow-lg shadow-[#0B57D0]/30 transition inline-flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                <span>▶️ Start Reading Book Now</span>
              </Link>
            ) : (
              <Link
                href={course ? `/course/${course.id}` : "/courses"}
                className="flex-1 py-3.5 px-6 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs md:text-sm font-extrabold shadow-lg shadow-[#0B57D0]/30 transition inline-flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                <span>▶️ Start Learning Now</span>
              </Link>
            )}

            <Link
              href={isBookCheckout ? "/books" : "/my-courses"}
              className="flex-1 py-3.5 px-6 rounded-full bg-white hover:bg-[#F5F7FF] text-[#0E1B3D] border border-[#E4E8F8] text-xs md:text-sm font-extrabold transition inline-flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-[#0B57D0]" />
              <span>{isBookCheckout ? "View All Books" : "View My Courses"}</span>
            </Link>
          </div>

          <p className="text-[11px] text-[#94A3B8] mt-4 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0A8554]" />
            Payment receipt and invoice details have been recorded.
          </p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // FAILURE SCREEN
  // =========================================================================
  if (paymentStatus === "failed") {
    return (
      <div className="max-w-2xl mx-auto py-6 px-4 select-none">
        <div className="bg-white rounded-3xl p-8 md:p-10 border-2 border-red-200 shadow-[0_20px_50px_rgba(239,68,68,0.1)] text-center flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl bg-[#FEECEB] border border-[#FCD3CF] text-red-600 flex items-center justify-center mb-5 shadow-sm">
            <AlertCircle className="w-10 h-10" />
          </div>

          <span className="text-[11px] font-extrabold uppercase tracking-wider text-red-600 bg-[#FEECEB] px-3.5 py-1 rounded-full mb-3">
            Payment Incomplete
          </span>

          <h1 className="text-2xl md:text-3xl font-black text-[#0E1B3D]">
            Payment Could Not Be Completed
          </h1>

          <p className="text-xs md:text-sm text-[#5A6478] mt-2 max-w-md leading-relaxed">
            {failureReason ||
              "The transaction could not be finished due to a bank or connectivity issue. Don't worry, if any money was deducted from your account, it will be refunded within 24 hours."}
          </p>

          <div className="w-full mt-6 p-4 rounded-2xl bg-[#FFF5F5] border border-red-100 text-xs text-red-700 text-left">
            <p className="font-bold flex items-center gap-1.5 mb-1">
              <AlertCircle className="w-4 h-4" /> What should you do?
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[11px] text-red-600">
              <li>Check your account balance or daily UPI transaction limits.</li>
              <li>Try using another UPI app (e.g. PhonePe, Google Pay, Paytm) or card.</li>
              <li>Reach out to our campus helpline if you require assistance.</li>
            </ul>
          </div>

          {/* Payment Interrupted / Debited WhatsApp Recovery Card */}
          <div className="w-full mt-4 p-4 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#166534] text-left space-y-2">
            <p className="font-extrabold flex items-center gap-1.5 text-[#15803D]">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              <span>पैसे कट झाले असल्यास काळजी करू नका (100% Safe &amp; Verified)</span>
            </p>
            <p className="text-[11px] text-[#166534] leading-relaxed">
              तांत्रिक अडचणीमुळे किंवा UPI ॲप कनेक्शन तुटल्यामुळे खात्यातून पैसे वजा झाले असल्यास आणि ॲक्सेस अनलॉक झाला नसल्यास, त्वरित खालील बटनावर क्लिक करून प्रशांत धुमाळ सरांच्या अकॅडमी हेल्पडेस्कवर WhatsApp स्क्रीनशॉट पाठवा:
            </p>
            <a
              href={`https://wa.me/918459344077?text=${encodeURIComponent(
                `Namaskar MindMaster Academy Desk, My payment was debited/interrupted during enrollment for "${isBookCheckout ? (book?.title || 'Digital Book') : (course?.title || 'Video Course')}".\nStudent Name: ${studentName || 'Student'}\nMobile: ${studentMobile || 'Not provided'}\nPlease verify and activate my access.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full mt-1 py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs font-black transition inline-flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
            >
              <span className="text-base">📲</span>
              <span>पैसे कट झाले असल्यास WhatsApp वर स्क्रीनशॉट पाठवा (Contact Support Desk)</span>
            </a>
          </div>

          <div className="w-full mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRetry}
              className="flex-1 py-3.5 px-6 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs md:text-sm font-extrabold shadow-lg shadow-[#0B57D0]/30 transition inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>

            <a
              href="tel:+918459344077"
              className="flex-1 py-3.5 px-6 rounded-full bg-[#E8F8F2] hover:bg-[#D4F3E5] text-[#0A8554] border border-[#C6ECD9] text-xs md:text-sm font-extrabold transition inline-flex items-center justify-center gap-2"
            >
              <Smartphone className="w-4 h-4" />
              <span>Call Support: +91 84593 44077</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MAIN CHECKOUT FORM & SUMMARY
  // =========================================================================
  if ((isBookCheckout && !book) || (!isBookCheckout && !course)) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 select-none text-center">
        <div className="bg-white rounded-3xl p-8 md:p-10 border border-[#E4E8F8] shadow-xs flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-[#F5F7FF] border border-[#E4E8F8] text-[#5A6478] flex items-center justify-center mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#0E1B3D] mb-2">
            Item Not Found
          </h2>
          <p className="text-xs md:text-sm text-[#5A6478] max-w-md mb-6">
            The selected course or book could not be found. Please check our course and book catalog.
          </p>
          <div className="flex gap-3">
            <Link
              href="/courses"
              className="px-5 py-2.5 rounded-full bg-[#0B57D0] text-white text-xs font-bold hover:bg-[#0842A0] transition shadow"
            >
              View Courses
            </Link>
            <Link
              href="/books"
              className="px-5 py-2.5 rounded-full bg-white border border-[#E4E8F8] text-[#0E1B3D] text-xs font-bold hover:bg-[#F5F7FF] transition"
            >
              View Books
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const itemTitle = isBookCheckout ? book!.title : course!.title;
  const itemSubtitle = isBookCheckout ? book!.subtitle : (course!.description?.slice(0, 70) || "");
  const itemCode = isBookCheckout ? (book!.code || "BOOK") : course!.code;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto select-none">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <title>{`Secure Checkout - ${itemTitle} | MindMaster Academy`}</title>
      <meta name="description" content="MindMaster Academy 100% Secure Razorpay Payment Gateway - UPI, Cards & NetBanking supported." />

      {/* Navigation */}
      <Link
        href={isBookCheckout ? "/books" : `/course/${course!.id}`}
        className="inline-flex items-center gap-2 text-xs font-bold text-[#5A6478] hover:text-[#0B57D0] transition w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to {isBookCheckout ? "Books & Notes" : course!.title}</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: STUDENT DETAILS & PAYMENT */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Step 1: Student Verification Card */}
          <div className="bg-white rounded-3xl p-6 md:p-7 border border-[#E4E8F8] shadow-xs">
            <h2 className="text-base font-extrabold text-[#0E1B3D] mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#0B57D0] text-white text-xs flex items-center justify-center font-bold">
                  1
                </span>
                <span>Student Registration Details</span>
              </span>
              <span className="text-[11px] font-bold text-[#0A8554] bg-[#E8F8F2] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" /> Mobile Verified
              </span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-[#0E1B3D] block mb-1.5">
                  Student Full Name (for certificate/receipt)
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Vishal Patil"
                  className="w-full p-3 rounded-2xl bg-[#F5F7FF] border border-[#E4E8F8] text-[#0E1B3D] font-semibold focus:outline-none focus:border-[#0B57D0]"
                />
              </div>

              <div>
                <label className="font-bold text-[#0E1B3D] block mb-1.5">
                  Registered Mobile Number (SMS Enabled)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6478] font-bold">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={studentMobile}
                    onChange={(e) => setStudentMobile(e.target.value.replace(/\D/g, ""))}
                    maxLength={10}
                    className="w-full pl-12 pr-3 py-3 rounded-2xl bg-[#F5F7FF] border border-[#E4E8F8] text-[#0E1B3D] font-mono font-semibold focus:outline-none focus:border-[#0B57D0]"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-[#0E1B3D] block mb-1.5">
                  District (Maharashtra State)
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-[#F5F7FF] border border-[#E4E8F8] text-[#0E1B3D] font-semibold focus:outline-none focus:border-[#0B57D0]"
                >
                  {["Pune", "Mumbai", "Thane", "Nashik", "Chhatrapati Sambhajinagar", "Nagpur", "Satara", "Kolhapur", "Solapur", "Ahmednagar", "Sangli", "Jalgaon", "Latur", "Nanded"].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Step 2: Payment Gateway Selection */}
          <div className="bg-white rounded-3xl p-6 md:p-7 border border-[#E4E8F8] shadow-xs">
            <h2 className="text-base font-extrabold text-[#0E1B3D] mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#0B57D0] text-white text-xs flex items-center justify-center font-bold">
                2
              </span>
              <span>Select Secure Payment Method</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl border-2 border-[#0B57D0] bg-[#E8F1FD]/40 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <Smartphone className="w-5 h-5 text-[#0B57D0]" />
                  <span className="w-3 h-3 rounded-full bg-[#0B57D0]" />
                </div>
                <div>
                  <span className="text-xs font-black text-[#0E1B3D] block">Instant UPI</span>
                  <span className="text-[10px] text-[#5A6478]">GPay, PhonePe, Paytm, BHIM</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-[#E4E8F8] bg-[#F5F7FF] flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <CreditCard className="w-5 h-5 text-[#5A6478]" />
                  <span className="w-3 h-3 rounded-full border border-[#CBD5E1]" />
                </div>
                <div>
                  <span className="text-xs font-black text-[#0E1B3D] block">Cards &amp; NetBanking</span>
                  <span className="text-[10px] text-[#5A6478]">Visa, MasterCard, Rupay</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-[#E4E8F8] bg-[#F5F7FF] flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <ShieldCheck className="w-5 h-5 text-[#0A8554]" />
                  <span className="w-3 h-3 rounded-full border border-[#CBD5E1]" />
                </div>
                <div>
                  <span className="text-xs font-black text-[#0E1B3D] block">256-Bit SSL Encrypted</span>
                  <span className="text-[10px] text-[#5A6478]">Verified Razorpay Gateway</span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-2xl bg-[#F5F7FF] border border-[#E4E8F8] flex items-center gap-2.5 text-xs text-[#5A6478]">
              <Lock className="w-4 h-4 text-[#0A8554] shrink-0" />
              <span>
                Transactions processed securely through authorized Razorpay payment gateway. No card information is stored.
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ORDER SUMMARY & COUPON */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 md:p-7 border border-[#E4E8F8] shadow-xs flex flex-col gap-5">
            <div className="flex items-center justify-between pb-4 border-b border-[#F1F3F9]">
              <h3 className="font-black text-base text-[#0E1B3D]">
                Order Summary
              </h3>
              <span className="text-[10px] font-extrabold text-[#0B57D0] bg-[#E8F1FD] px-2.5 py-1 rounded-full">
                {itemCode}
              </span>
            </div>

            {/* Item Mini Card */}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#E8F1FD] border border-[#C7DEFB] text-[#0B57D0] flex items-center justify-center shrink-0 shadow-2xs font-extrabold text-sm">
                {isBookCheckout ? "📚" : "MM"}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-extrabold text-[#0E1B3D] truncate">
                  {itemTitle}
                </span>
                <span className="text-[11px] text-[#5A6478]">
                  {isBookCheckout
                    ? `${book?.pages || 80} Pages • ${book?.fileSizeMb || 8} MB • ${book?.accessMonths || 6} Mo Access`
                    : `${course.accessMonths} Months Unlimited Access`}
                </span>
                <span className="text-[10px] font-bold text-[#0A8554]">
                  {isBookCheckout
                    ? "✓ In-App Secure Reader + Encrypted Offline Vault"
                    : "✓ All Video Lessons + Notes + Certificate"}
                </span>
              </div>
            </div>

            {/* Coupon Input Box */}
            <div className="pt-2">
              <label className="text-xs font-extrabold text-[#0E1B3D] block mb-2 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#0B57D0]" />
                <span>Discount Coupon Code</span>
              </label>

              {!appliedCoupon ? (
                <form onSubmit={(e) => handleApplyCoupon(e)} className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="e.g. PRASHANT50"
                    disabled={isValidatingCoupon}
                    className="flex-1 p-2.5 rounded-2xl bg-[#F5F7FF] border border-[#E4E8F8] text-xs font-bold text-[#0E1B3D] uppercase placeholder-[#94A3B8] focus:outline-none focus:border-[#0B57D0]"
                  />
                  <button
                    type="submit"
                    disabled={isValidatingCoupon || !couponInput.trim()}
                    className="px-4 py-2.5 rounded-2xl bg-[#0B57D0] hover:bg-[#0842A0] disabled:bg-[#94A3B8] text-white text-xs font-extrabold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {isValidatingCoupon ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span>Apply</span>
                    )}
                  </button>
                </form>
              ) : null}

              {/* Coupon Success Row */}
              {appliedCoupon && (
                <div className="p-3 rounded-2xl bg-[#E8F8F2] border border-[#C6ECD9] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0A8554] shrink-0" />
                    <div>
                      <span className="text-xs font-extrabold text-[#0A8554] block">
                        Coupon {appliedCoupon.code} Applied!
                      </span>
                      <span className="text-[10px] text-[#0A8554]/80">
                        {appliedCoupon.discountType === "percent"
                          ? `${appliedCoupon.value}% discount saved`
                          : `₹${Math.round(appliedCoupon.discountAmountPaise / 100)} discount deducted`}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="p-1 rounded-lg hover:bg-white text-[#0A8554] transition cursor-pointer"
                    title="Remove coupon"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Coupon Error Row */}
              {couponFeedback && couponFeedback.type === "error" && (
                <div className="mt-2 p-2.5 rounded-2xl bg-[#FEECEB] border border-[#FCD3CF] text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{couponFeedback.message}</span>
                </div>
              )}

              {/* 1-Click Available Coupon Chips */}
              {!appliedCoupon && availableCoupons.length > 0 && (
                <div className="mt-3">
                  <div className="text-[11px] font-bold text-[#5A6478] mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#0B57D0]" />
                    <span>Available Offers &amp; Scholarships (Tap to Apply):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {availableCoupons.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleApplyCoupon(undefined, c.code)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#EEF4FF] hover:bg-[#DCE8FE] border border-[#CCDDFE] text-[#0B57D0] text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs"
                        title={c.description}
                      >
                        <Tag className="w-3 h-3" />
                        <span className="font-mono font-black">{c.code}</span>
                        <span className="text-[10px] bg-white px-1.5 py-0.5 rounded-md font-extrabold text-[#0B57D0] border border-[#CCDDFE]/60">
                          {c.badgeText}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="pt-4 border-t border-[#F1F3F9] flex flex-col gap-2.5 text-xs">
              <div className="flex justify-between text-[#5A6478]">
                <span>Original Price (MRP):</span>
                <span className="line-through">₹{originalPriceRupees}</span>
              </div>

              <div className="flex justify-between text-[#5A6478]">
                <span>Special Offer Price:</span>
                <span className="font-semibold text-[#0E1B3D]">₹{basePriceRupees}</span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between text-[#0A8554] font-bold">
                  <span>Coupon Discount ({appliedCoupon.code}):</span>
                  <span>-₹{discountRupees}</span>
                </div>
              )}

              <div className="flex justify-between text-[#0A8554] font-medium text-[11px]">
                <span>Total Savings:</span>
                <span>₹{totalSavingsRupees}</span>
              </div>

              <div className="pt-3 border-t border-[#E4E8F8] flex justify-between items-baseline">
                <div>
                  <span className="text-sm font-black text-[#0E1B3D] block">
                    Total Payable Amount:
                  </span>
                  <span className="text-[10px] text-[#5A6478]">
                    (Inclusive of all taxes &amp; GST)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-[#0B57D0]">
                    ₹{finalPriceRupees}
                  </span>
                </div>
              </div>
            </div>

            {/* Already Owned Warning */}
            {alreadyOwned && (
              <div className="p-4 rounded-2xl bg-[#E8F8F2] border border-[#A6E1C7] text-left">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-5 h-5 text-[#0A8554] shrink-0" />
                  <span className="text-xs font-black text-[#0A8554]">
                    You already have active access to this {isBookCheckout ? "book" : "course"}!
                  </span>
                </div>
                <p className="text-[11px] text-[#5A6478] mb-3">
                  Your access is valid until {alreadyOwnedExpiresAt ? new Date(alreadyOwnedExpiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "expiry"}. You do not need to pay again.
                </p>
                <Link
                  href={isBookCheckout ? "/books" : "/my-courses"}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A8554] hover:bg-[#086C44] text-white text-xs font-bold transition"
                >
                  <span>{isBookCheckout ? "Go to Books" : "Go to My Courses"}</span>
                  <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                </Link>
              </div>
            )}

            {/* Primary Pay Button */}
            <button
              onClick={handleInitiatePayment}
              disabled={isProcessingPayment || alreadyOwned}
              className="w-full py-4 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] disabled:bg-[#94A3B8] text-white text-sm font-black shadow-lg shadow-[#0B57D0]/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              {alreadyOwned ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Already Unlocked</span>
                </>
              ) : isProcessingPayment ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Secure Payment...</span>
                </>
              ) : (
                <>
                  {finalPriceRupees === 0 ? (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                      <span>Complete 100% Free Enrollment (₹0)</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Pay Securely Now (₹{finalPriceRupees})</span>
                    </>
                  )}
                </>
              )}
            </button>

            <div className="text-center text-[10px] text-[#5A6478] leading-relaxed pt-2">
              By proceeding, you agree to MindMaster Academy&apos;s{" "}
              <Link href="/legal?tab=terms" target="_blank" className="text-[#0B57D0] underline hover:text-[#0842A0] font-bold">Terms of Service</Link>,{" "}
              <Link href="/legal?tab=privacy" target="_blank" className="text-[#0B57D0] underline hover:text-[#0842A0] font-bold">Privacy Policy</Link>, and{" "}
              <Link href="/legal?tab=refund" target="_blank" className="text-[#0B57D0] underline hover:text-[#0842A0] font-bold">Cancellation &amp; Refund Policy</Link>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-[#0B57D0] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold text-[#5A6478]">Loading checkout...</p>
            </div>
          </div>
        }
      >
        <CheckoutContent />
      </Suspense>
    </AppShell>
  );
}
