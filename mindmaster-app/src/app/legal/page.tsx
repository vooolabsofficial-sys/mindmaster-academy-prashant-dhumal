"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  ShieldCheck, 
  FileText, 
  RotateCcw, 
  ArrowLeft, 
  ChevronRight,
  Building2,
  ExternalLink,
  LifeBuoy,
  Lock,
  Smartphone
} from "lucide-react";
import AppShell from "@/components/navigation/AppShell";

function LegalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");

  useEffect(() => {
    if (tabParam === "privacy") {
      router.replace("/privacy-policy");
    } else if (tabParam === "terms") {
      router.replace("/terms");
    } else if (tabParam === "refund") {
      router.replace("/refund-policy");
    }
  }, [tabParam, router]);

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 pb-20 select-none">
      {/* Top Breadcrumb & Header */}
      <div className="mb-6 flex flex-col gap-2">
        <Link
          href="/home"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to MindMaster App</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Legal, Policies &amp; Compliance Center
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Official policies for MindMaster Academy • Founded &amp; Mentored by Prashant Dhumal Sir
            </p>
          </div>
          <span className="self-start sm:self-auto text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            ● Active • 2026 Edition
          </span>
        </div>
      </div>

      {/* 3 Dedicated Policy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Privacy Policy */}
        <Link
          href="/privacy-policy"
          className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-blue-500 hover:shadow-md transition group flex flex-col justify-between gap-4"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                Data Protection
              </span>
              <h2 className="text-base font-extrabold text-slate-900 mt-2 group-hover:text-blue-600 transition-colors">
                Privacy Policy
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Learn how student personal records, watch time, and Razorpay transactions are safeguarded with PostgreSQL RLS encryption.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-blue-600 pt-2 border-t border-slate-100">
            <span>Read Privacy Policy</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Terms of Service */}
        <Link
          href="/terms"
          className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-amber-500 hover:shadow-md transition group flex flex-col justify-between gap-4"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                Anti-Piracy &amp; DRM
              </span>
              <h2 className="text-base font-extrabold text-slate-900 mt-2 group-hover:text-amber-600 transition-colors">
                Terms &amp; Conditions
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Single-device DRM session lock, dynamic watermarking protection, and Indian Copyright Act compliance.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-amber-600 pt-2 border-t border-slate-100">
            <span>Read Terms</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Refund Policy */}
        <Link
          href="/refund-policy"
          className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-emerald-500 hover:shadow-md transition group flex flex-col justify-between gap-4"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Razorpay Compliance
              </span>
              <h2 className="text-base font-extrabold text-slate-900 mt-2 group-hover:text-emerald-600 transition-colors">
                Refund Policy
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Digital course delivery terms, 100% duplicate charge refunds, and 5-7 working days banking timelines.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-emerald-600 pt-2 border-t border-slate-100">
            <span>Read Refund Policy</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Official Academy Footer Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 text-xs">
              MindMaster Academy • Head Office
            </h4>
            <p className="text-[11px] text-slate-500">
              Near Powai Naka, Satara (415001) | Pune Campus: Zeal Chowk, Narhe, Pune
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/support"
            className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-blue-600 font-bold text-xs transition border border-slate-200 flex items-center gap-1.5"
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Contact Helpdesk</span>
          </Link>
          <Link
            href="/courses"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-xs"
          >
            Browse Courses
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LegalPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <LegalContent />
      </Suspense>
    </AppShell>
  );
}
