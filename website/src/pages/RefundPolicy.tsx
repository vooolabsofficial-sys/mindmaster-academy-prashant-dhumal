import React from 'react';
import { Link } from 'react-router-dom';
import { getAppLegalUrl } from '../config/appConfig';

export const RefundPolicy: React.FC = () => {
  return (
    <main className="w-full pt-28 pb-20 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-6">
          <Link to="/" className="hover:text-secondary transition-colors">Home</Link>
          <span>/</span>
          <span className="text-slate-900">Refund &amp; Cancellation Policy</span>
        </div>

        {/* Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-secondary text-xs font-bold tracking-wider uppercase mb-3">
            <span className="material-symbols-outlined text-[16px]">sync_saved_locally</span>
            <span>Razorpay &amp; Payment Compliance • MindMaster Academy</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Refund &amp; Cancellation Policy
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed">
            MindMaster Academy (Founded &amp; Mentored by Prashant Dhumal Sir, Satara HQ) provides transparent, compliant policies for all digital course enrollments, online test series, and digital books.
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
            <span><strong>Effective Date:</strong> January 2026</span>
            <span>•</span>
            <span><strong>Last Updated:</strong> October 2026</span>
            <span>•</span>
            <span><strong>Campus HQ:</strong> Satara &amp; Pune, Maharashtra</span>
          </div>
        </div>

        {/* Policy Content Sections */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8 text-sm sm:text-base text-slate-700 leading-relaxed">
          {/* Section 1: Digital Delivery */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-100 text-secondary flex items-center justify-center text-xs font-bold shrink-0">1</span>
              <span>Instant Digital Delivery &amp; Course Access</span>
            </h2>
            <p className="text-slate-600">
              Upon successful payment through our Razorpay checkout, all course videos, test materials, syllabus downloads, and digital study notes are unlocked immediately for the student&apos;s registered account.
            </p>
            <p className="text-slate-600">
              <strong>General Policy:</strong> Because full proprietary access to intellectual video modules and cognitive training anchor materials is granted immediately upon enrollment, <strong>course tuition and digital book purchases are non-refundable once content has been accessed or streamed</strong>.
            </p>
          </section>

          {/* Section 2: Technical Glitches & Duplicate Payments */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-100 text-secondary flex items-center justify-center text-xs font-bold shrink-0">2</span>
              <span>Duplicate or Interrupted Payments (100% Refund)</span>
            </h2>
            <p className="text-slate-600">
              If an accidental duplicate deduction occurs due to payment gateway timeout, bank latency, or connectivity failure:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600">
              <li>The excess duplicate deduction will be <strong>refunded 100%</strong> without any administrative deduction.</li>
              <li>Refunds are initiated back to the original source account (UPI, NetBanking, or Debit/Credit Card) within <strong>5 to 7 working days</strong> as per Reserve Bank of India and payment gateway guidelines.</li>
            </ul>
          </section>

          {/* Section 3: Try Free Demos First */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-100 text-secondary flex items-center justify-center text-xs font-bold shrink-0">3</span>
              <span>Pre-Enrollment Free Demos</span>
            </h2>
            <p className="text-slate-600">
              We strongly advise all parents and competitive exam aspirants to review our free demo sessions and sample lectures available on the website and app prior to completing paid enrollment.
            </p>
          </section>

          {/* Section 4: Contact Support Desk */}
          <section className="space-y-3 pt-4 border-t border-slate-100">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[22px]">support_agent</span>
              <span>Helpdesk &amp; Grievance Redressal</span>
            </h2>
            <p className="text-slate-600">
              For any payment issues, invoice copies, or refund inquiries, please contact our administrative desk:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-500 block mb-1">Helpline &amp; WhatsApp Support:</span>
                <a href="tel:+918459344077" className="text-secondary font-bold hover:underline flex items-center gap-1.5 text-sm">
                  <span className="material-symbols-outlined text-[18px]">call</span>
                  <span>+91 84593 44077</span>
                </a>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-500 block mb-1">Official Grievance Email:</span>
                <a href="mailto:mindmasterdhumal@gmail.com" className="text-secondary font-bold hover:underline flex items-center gap-1.5 text-sm">
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                  <span>mindmasterdhumal@gmail.com</span>
                </a>
              </div>
            </div>
            <div className="pt-3">
              <a
                href={getAppLegalUrl('refund')}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-secondary hover:underline inline-flex items-center gap-1"
              >
                <span>View Live Legal &amp; Policies Center in Web App</span>
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
              </a>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default RefundPolicy;
