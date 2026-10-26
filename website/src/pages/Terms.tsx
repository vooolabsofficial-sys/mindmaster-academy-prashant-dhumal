import React from 'react';
import { Link } from 'react-router-dom';

export const Terms: React.FC = () => {
  return (
    <main className="w-full pt-28 pb-20 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-6">
          <Link to="/" className="hover:text-secondary transition-colors">Home</Link>
          <span>/</span>
          <span className="text-slate-900">Terms & Conditions</span>
        </div>

        {/* Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-secondary text-xs font-bold tracking-wider uppercase mb-3">
            <span className="material-symbols-outlined text-[16px]">gavel</span>
            <span>Terms of Service • MindMaster Academy</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Terms & Conditions
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed">
            Welcome to MindMaster Academy. These terms govern your enrollment in our cognitive training programs, seminars, online masterclasses, and use of our official website.
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
            <span><strong>Effective Date:</strong> January 1, 2025</span>
            <span>•</span>
            <span><strong>Last Updated:</strong> March 2026</span>
            <span>•</span>
            <span><strong>Jurisdiction:</strong> Satara, Maharashtra, India</span>
          </div>
        </div>

        {/* Terms Content Sections */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8 text-sm sm:text-base text-slate-700 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-100 text-secondary flex items-center justify-center text-xs font-bold shrink-0">1</span>
              <span>Course Enrollment & Academic Admission</span>
            </h2>
            <p className="text-slate-600">
              Admission into MindMaster Academy’s flagship courses (including MM-01 Memory Technique, MM-02 Train the Trainer, MM-03 Police Bharti 100% Prep, and MM-05 Vedic Mathematics) is confirmed upon submission of complete student credentials and payment of requisite course fee.
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-slate-600 text-sm">
              <li>Students must ensure that all contact numbers provided (especially WhatsApp) are active for timely dissemination of class links and study schedules.</li>
              <li>Batch timings are assigned based on student profile (School, College, or Competitive Aspirant) and campus seat availability in Satara and regional hubs.</li>
            </ul>
          </section>

          <hr className="border-slate-100" />

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-100 text-secondary flex items-center justify-center text-xs font-bold shrink-0">2</span>
              <span>Proprietary Intellectual Property & Memory Methods</span>
            </h2>
            <p className="text-slate-600">
              All cognitive formulas, mnemonic associations, rapid calendar calculation matrices, and GK memory peg lists developed by <strong>Sagar (Prashant) Dhumal</strong> are the exclusive intellectual property of MindMaster Academy.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs sm:text-sm text-slate-700 space-y-1.5">
              <p><strong>Strict Restriction:</strong> Course handbooks, workbook PDFs, and audio-visual recordings are licensed exclusively for the enrolled student’s personal academic use.</p>
              <p className="text-red-700 font-semibold">Any unauthorized commercial resale, publishing, or unauthorized teaching of these techniques without certified "Train the Trainer (TTT)" authorization is strictly prohibited under applicable Copyright and Intellectual Property laws.</p>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-100 text-secondary flex items-center justify-center text-xs font-bold shrink-0">3</span>
              <span>Student Discipline & Code of Conduct</span>
            </h2>
            <p className="text-slate-600">
              MindMaster Academy fosters a focused, disciplined, and supportive environment across physical classrooms and online batches:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-slate-600 text-sm">
              <li>Students are expected to maintain minimum 80% attendance to qualify for the full benefit of cognitive memory anchoring.</li>
              <li>Mutual respect toward fellow students, faculty, and physical campus infrastructure in Satara is strictly enforced.</li>
              <li>Any disruptive or unprofessional conduct may lead to suspension of academy access without entitlement to refund.</li>
            </ul>
          </section>

          <hr className="border-slate-100" />

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-100 text-secondary flex items-center justify-center text-xs font-bold shrink-0">4</span>
              <span>Fee Structure, Rescheduling & Refund Policy</span>
            </h2>
            <p className="text-slate-600">
              We maintain absolute transparency regarding all course charges:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-slate-600 text-sm">
              <li><strong>Free Demos:</strong> All introductory demo classes and initial cognitive consultations are completely free of charge.</li>
              <li><strong>Batch Rescheduling:</strong> If a student faces health or official competitive examination date clashes, written notice submitted to our Satara office allows a one-time batch transfer to the subsequent month without penalty.</li>
              <li><strong>Refund Guidelines:</strong> Fee refunds are evaluated within 7 calendar days of batch commencement upon valid academic review. After course materials and mnemonic anchor kits are issued, tuition fees are non-refundable.</li>
            </ul>
          </section>

          <hr className="border-slate-100" />

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-100 text-secondary flex items-center justify-center text-xs font-bold shrink-0">5</span>
              <span>Certificates & Trainer Accreditation</span>
            </h2>
            <p className="text-slate-600 text-sm">
              Certificates of Mastery and "Train the Trainer" (TTT) licenses are awarded strictly upon passing the practical speed recall and live demonstration evaluations conducted by Sagar Dhumal Sir. An enrollment does not automatically guarantee accreditation without demonstrated competence.
            </p>
          </section>

          <hr className="border-slate-100" />

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-100 text-secondary flex items-center justify-center text-xs font-bold shrink-0">6</span>
              <span>Governing Law & Legal Jurisdiction</span>
            </h2>
            <p className="text-slate-600 text-sm">
              These Terms & Conditions shall be governed by and construed in accordance with the Laws of India. Any disputes or claims arising out of or related to MindMaster Academy shall be subject to the exclusive jurisdiction of the competent courts in <strong>Satara, Maharashtra</strong>.
            </p>
          </section>

          <hr className="border-slate-100" />

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-100 text-secondary flex items-center justify-center text-xs font-bold shrink-0">7</span>
              <span>Contact & Academy Address</span>
            </h2>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2 text-xs sm:text-sm">
              <p className="font-bold text-slate-900">MindMaster Academy Head Office</p>
              <p className="text-slate-600">Near Powai Naka, Sadar Bazar, Satara, Maharashtra - 415001</p>
              <p className="text-slate-600"><strong>Direct Helpline / WhatsApp:</strong> +91 84593 44077</p>
              <p className="text-slate-600"><strong>Official Email:</strong> mindmasterdhumal@gmail.com</p>
            </div>
          </section>
        </div>

        {/* Back Link */}
        <div className="text-center mt-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-secondary text-white font-bold text-sm hover:bg-secondary-container transition-all shadow-md"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Back to Homepage</span>
          </Link>
        </div>
      </div>
    </main>
  );
};
export default Terms;
