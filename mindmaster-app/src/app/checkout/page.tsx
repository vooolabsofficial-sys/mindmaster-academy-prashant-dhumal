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
import { MOCK_COURSES, MOCK_LESSONS, COURSE_ID_MAP } from "@/lib/mockData";
import { 
  validateCoupon, 
  createRazorpayOrder, 
  verifyRazorpayPayment,
  CouponValidationResult 
} from "@/app/actions/checkout";
import { triggerCourseUnlockConfetti } from "@/lib/celebration";
import { generateFeeReceiptPdf } from "@/lib/pdfGenerator";
import { toast } from "sonner";

declare global {
  interface Window {
    Razorpay: any;
  }
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawCourseId = searchParams.get("courseId") || "c-mm-01";

  const course =
    MOCK_COURSES.find(
      (c) =>
        c.id.toLowerCase() === rawCourseId.toLowerCase() ||
        c.code.toLowerCase() === rawCourseId.toLowerCase()
    ) || MOCK_COURSES[0];

  const firstLesson = MOCK_LESSONS.find((l) => l.courseId === course.id) || MOCK_LESSONS[0];

  // Student verification form state
  const [studentName, setStudentName] = useState("Student");
  const [studentMobile, setStudentMobile] = useState("98XXXXXXXX");
  const [district, setDistrict] = useState("Pune");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("mindmaster_user_profile");
      if (raw) {
        const p = JSON.parse(raw);
        if (p.full_name) setStudentName(p.full_name);
        if (p.phone) setStudentMobile(p.phone.replace(/\D/g, "").slice(-10));
        if (p.district) setDistrict(p.district);
      }
      const verifiedPhone = localStorage.getItem("mindmaster_verified_phone");
      if (verifiedPhone) setStudentMobile(verifiedPhone.replace(/\D/g, "").slice(-10));
    } catch {}
  }, []);

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

  // Compute pricing in Rupees and Paise
  const basePriceRupees = Math.round(course.pricePaise / 100);
  const originalPriceRupees = Math.round(course.originalPricePaise / 100);
  const discountRupees = appliedCoupon ? Math.round(appliedCoupon.discountAmountPaise / 100) : 0;
  const finalPriceRupees = Math.max(1, basePriceRupees - discountRupees);
  const totalSavingsRupees = (originalPriceRupees - basePriceRupees) + discountRupees;

  // 1. Coupon validation handler calling server action
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
      const result = await validateCoupon(codeToValidate, course.id);
      if (result.success && result.coupon) {
        setAppliedCoupon(result.coupon);
        setCouponInput(result.coupon.code);
        setCouponFeedback({
          type: "success",
          message: result.message || "Coupon code successfully applied!",
        });
        toast.success(`कूपन लागू झाले: ${result.coupon.code} (Coupon applied!)`);
      } else {
        setAppliedCoupon(null);
        setCouponFeedback({
          type: "error",
          message: result.error || "Invalid or expired coupon code.",
        });
        toast.error(result.error || "अवैध कूपन कोड (Invalid coupon)");
      }
    } catch (err: any) {
      setCouponFeedback({
        type: "error",
        message: "Error during coupon validation. Please try again.",
      });
      toast.error("कूपन तपासताना त्रुटी आली");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponFeedback(null);
    toast.info("कूपन काढले (Coupon removed)");
  };

  // 2. Razorpay payment execution
  const handleInitiatePayment = async () => {
    setIsProcessingPayment(true);
    setFailureReason("");

    try {
      // Step A: Create order server-side
      const orderResult = await createRazorpayOrder({
        courseId: course.id,
        couponCode: appliedCoupon?.code,
        studentMobile,
        studentName,
      });

      if (!orderResult.success || !orderResult.orderId) {
        throw new Error(orderResult.error || "Could not generate order ID.");
      }

      // If Razorpay SDK is not available or mock mode is active
      if (typeof window === "undefined" || !window.Razorpay) {
        // Fallback simulation for offline/preview mode
        setTimeout(async () => {
          const verification = await verifyRazorpayPayment({
            razorpay_order_id: orderResult.orderId!,
            razorpay_payment_id: `pay_mock_${Date.now()}`,
            razorpay_signature: "mock_signature_approved",
            courseId: course.id,
            couponCode: appliedCoupon?.code,
            amountPaise: orderResult.amountPaise || course.pricePaise,
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

      // Step B: Launch real Razorpay modal
      const options = {
        key: orderResult.keyId,
        amount: orderResult.amountPaise,
        currency: orderResult.currency || "INR",
        name: "MindMaster Academy",
        description: `${course.code} - ${course.title}`,
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
            // Step C: Verify signature server-side
            const verifyResult = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              courseId: course.id,
              couponCode: appliedCoupon?.code,
              amountPaise: orderResult.amountPaise || course.pricePaise,
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

    // Unlock access in local storage instantly so /watch/[lessonId] and /my-courses immediately show active access
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
    return (
      <div className="max-w-2xl mx-auto py-6 px-4 select-none">
        <div className="bg-white rounded-3xl p-8 md:p-10 border-2 border-[#0A8554]/30 shadow-[0_20px_50px_rgba(10,133,84,0.12)] text-center flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl bg-[#E8F8F2] border border-[#C6ECD9] text-[#0A8554] flex items-center justify-center mb-5 shadow-sm animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0A8554] bg-[#E8F8F2] px-3.5 py-1 rounded-full mb-3">
            Payment Successful • Instant Access Unlocked
          </span>

          <h1 className="text-2xl md:text-3xl font-black text-[#0E1B3D]">
            Congratulations, {studentName}! 🎉
          </h1>

          <p className="text-xs md:text-sm text-[#5A6478] mt-2 max-w-md leading-relaxed">
            Your course <strong className="text-[#0E1B3D]">{course.title}</strong> has been successfully activated. You can now access all premium lectures and study materials right away.
          </p>

          {/* Transaction Summary Card */}
          <div className="w-full mt-6 p-5 rounded-2xl bg-[#F5F7FF] border border-[#E4E8F8] text-left text-xs flex flex-col gap-2.5">
            <div className="flex justify-between items-center py-1 border-b border-[#E4E8F8]">
              <span className="text-[#5A6478]">Course Code:</span>
              <span className="font-extrabold text-[#0E1B3D]">{course.code}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[#E4E8F8]">
              <span className="text-[#5A6478]">Amount Paid:</span>
              <span className="font-black text-[#0B57D0] text-sm">₹{finalPriceRupees}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[#E4E8F8]">
              <span className="text-[#5A6478]">Order ID:</span>
              <span className="font-mono text-[10px] text-[#5A6478] truncate max-w-[200px]">
                {paymentDetails?.orderId}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-[#5A6478]">Access Validity:</span>
              <span className="font-bold text-[#D85A12] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {course.accessMonths} Months (
                {paymentDetails?.expiresAt
                  ? new Date(paymentDetails.expiresAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "3 Months"}
                )
              </span>
            </div>
          </div>

          {/* Download Official Admission Receipt Button */}
          <button
            type="button"
            onClick={() =>
              generateFeeReceiptPdf({
                receiptNo: `REC-${paymentDetails?.paymentId ? paymentDetails.paymentId.slice(-6).toUpperCase() : Date.now().toString().slice(-6)}`,
                date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
                studentName: studentName || "Verified Student",
                studentPhone: studentMobile || "+91 98XXXXXXXX",
                district: "Maharashtra",
                courseCode: course.code,
                courseTitle: course.title,
                amountPaise: finalPriceRupees * 100,
                paymentId: paymentDetails?.paymentId || "pay_verified_gateway",
                accessMonths: course.accessMonths,
                expiryDate: paymentDetails?.expiresAt
                  ? new Date(paymentDetails.expiresAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "90 Days",
              })
            }
            className="w-full mt-6 py-3 px-6 rounded-2xl bg-[#E8F8F2] hover:bg-[#D5F2E6] text-[#0A8554] border border-[#C6ECD9] text-xs font-black transition inline-flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-2xs"
          >
            <FileText className="w-4 h-4" />
            <span>Download Official Admission Receipt (फी पावती)</span>
          </button>

          {/* Action CTAs */}
          <div className="w-full mt-4 flex flex-col sm:flex-row gap-3">
            <Link
              href={`/watch/${firstLesson.id}`}
              className="flex-1 py-3.5 px-6 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs md:text-sm font-extrabold shadow-lg shadow-[#0B57D0]/30 transition inline-flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>Start Learning Now</span>
            </Link>

            <Link
              href="/my-courses"
              className="flex-1 py-3.5 px-6 rounded-full bg-white hover:bg-[#F5F7FF] text-[#0E1B3D] border border-[#E4E8F8] text-xs md:text-sm font-extrabold transition inline-flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-[#0B57D0]" />
              <span>View My Courses</span>
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

          {/* Action CTAs */}
          <div className="w-full mt-8 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRetry}
              className="flex-1 py-3.5 px-6 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs md:text-sm font-extrabold shadow-lg shadow-[#0B57D0]/30 transition inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>

            <a
              href="tel:+919922000000"
              className="flex-1 py-3.5 px-6 rounded-full bg-[#E8F8F2] hover:bg-[#D4F3E5] text-[#0A8554] border border-[#C6ECD9] text-xs md:text-sm font-extrabold transition inline-flex items-center justify-center gap-2"
            >
              <Smartphone className="w-4 h-4" />
              <span>Call Support Helpline</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MAIN CHECKOUT FORM & SUMMARY
  // =========================================================================
  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto select-none">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <title>{`Secure Checkout - ${course.title} | MindMaster Academy`}</title>
      <meta name="description" content="MindMaster Academy 100% Secure Razorpay Payment Gateway - UPI, Cards & NetBanking supported." />

      {/* Navigation */}
      <Link
        href={`/course/${course.id}`}
        className="inline-flex items-center gap-2 text-xs font-bold text-[#5A6478] hover:text-[#0B57D0] transition w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to {course.title}</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ================= LEFT COLUMN: STUDENT DETAILS & PAYMENT (7 cols) ================= */}
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
                  Student Full Name (for certificate)
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
                  <div className="w-4 h-4 rounded-full border-4 border-[#0B57D0] bg-white" />
                </div>
                <div>
                  <span className="text-xs font-black text-[#0E1B3D] block">
                    All UPI Apps
                  </span>
                  <span className="text-[10px] text-[#5A6478]">
                    GPay, PhonePe, Paytm
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-[#E4E8F8] bg-[#F5F7FF]/50 flex flex-col justify-between gap-3 opacity-70">
                <div className="flex items-center justify-between">
                  <CreditCard className="w-5 h-5 text-[#5A6478]" />
                  <div className="w-4 h-4 rounded-full border border-[#94A3B8] bg-white" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#0E1B3D] block">
                    Debit / Credit Card
                  </span>
                  <span className="text-[10px] text-[#5A6478]">
                    Visa, RuPay, Master
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-[#E4E8F8] bg-[#F5F7FF]/50 flex flex-col justify-between gap-3 opacity-70">
                <div className="flex items-center justify-between">
                  <Lock className="w-5 h-5 text-[#5A6478]" />
                  <div className="w-4 h-4 rounded-full border border-[#94A3B8] bg-white" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#0E1B3D] block">
                    Net Banking
                  </span>
                  <span className="text-[10px] text-[#5A6478]">
                    SBI, HDFC, ICICI, etc.
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 p-3.5 rounded-2xl bg-[#E8F8F2] border border-[#C6ECD9] flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#0A8554] shrink-0" />
              <div className="text-[11px] text-[#0A8554] leading-tight">
                <strong className="font-extrabold">256-Bit Encrypted Secure Payment:</strong>{" "}
                Transactions processed securely through authorized Razorpay payment gateway. No card information is stored.
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: ORDER SUMMARY & COUPON (5 cols) ================= */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Order Summary Card */}
          <div className="bg-white rounded-3xl p-6 md:p-7 border border-[#E4E8F8] shadow-xs flex flex-col gap-5">
            <div className="flex items-center justify-between pb-4 border-b border-[#F1F3F9]">
              <h3 className="font-black text-base text-[#0E1B3D]">
                Order Summary
              </h3>
              <span className="text-[10px] font-extrabold text-[#0B57D0] bg-[#E8F1FD] px-2.5 py-1 rounded-full">
                {course.code}
              </span>
            </div>

            {/* Course mini item */}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#E8F1FD] border border-[#C7DEFB] text-[#0B57D0] flex items-center justify-center shrink-0 shadow-2xs font-extrabold text-sm">
                MM
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-extrabold text-[#0E1B3D] truncate">
                  {course.title}
                </span>
                <span className="text-[11px] text-[#5A6478]">
                  {course.accessMonths} Months Unlimited Access
                </span>
                <span className="text-[10px] font-bold text-[#0A8554]">
                  ✓ All Video Lessons + Notes + Certificate
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

              {/* Quick Coupon Chips */}
              {!appliedCoupon && (
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-[#5A6478]">Available Coupons:</span>
                  <button
                    type="button"
                    onClick={() => handleApplyCoupon(undefined, "PRASHANT50")}
                    className="text-[10px] font-bold text-[#0B57D0] bg-[#E8F1FD] px-2.5 py-0.5 rounded-full hover:bg-[#D4E4FA] transition border border-[#C7DEFB] cursor-pointer"
                  >
                    PRASHANT50 (-₹200)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyCoupon(undefined, "FIRST100")}
                    className="text-[10px] font-bold text-[#0B57D0] bg-[#E8F1FD] px-2.5 py-0.5 rounded-full hover:bg-[#D4E4FA] transition border border-[#C7DEFB] cursor-pointer"
                  >
                    FIRST100 (-₹100)
                  </button>
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
                <span>Course Offer Price:</span>
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
                    (Inclusive of all taxes & GST)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-[#0B57D0]">
                    ₹{finalPriceRupees}
                  </span>
                </div>
              </div>
            </div>

            {/* Primary Pay Button */}
            <button
              onClick={handleInitiatePayment}
              disabled={isProcessingPayment}
              className="w-full py-4 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] disabled:bg-[#94A3B8] text-white text-sm font-black shadow-lg shadow-[#0B57D0]/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              {isProcessingPayment ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Secure Payment...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Pay Securely Now (₹{finalPriceRupees})</span>
                </>
              )}
            </button>

            <div className="text-center text-[10px] text-[#94A3B8]">
              By clicking pay, you agree to MindMaster Academy&apos;s terms &amp; conditions.
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
