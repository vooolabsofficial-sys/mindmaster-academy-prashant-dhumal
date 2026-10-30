import React from 'react';
import { Link } from 'react-router-dom';

export const PrivacyPolicy: React.FC = () => {
  return (
    <main className="w-full pt-28 pb-20 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-6">
          <Link to="/" className="hover:text-secondary transition-colors">Home</Link>
          <span>/</span>
          <span className="text-slate-900">Privacy Policy</span>
        </div>

        {/* Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-secondary text-xs font-bold tracking-wider uppercase mb-3">
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
            <span>Official Policy • MindMaster Academy</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Privacy Policy & Data Protection
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed">
            MindMaster Academy (Mentored by Prashant Dhumal, Satara HQ) is deeply committed to safeguarding the privacy and confidential information of all students, parents, and website visitors.
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
            <span><strong>Effective Date:</strong> January 1, 2025</span>
            <span>•</span>
            <span><strong>Last Updated:</strong> March 2026</span>
            <span>•</span>
            <span><strong>Location:</strong> Satara, Maharashtra, India</span>
          </div>
        </div>

        {/* Policy Content Sections */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8 text-sm sm:text-base text-slate-700 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-100 text-secondary flex items-center justify-center text-xs font-bold shrink-0">1</span>
              <span>Information We Collect</span>
            </h2>
            <p className="text-slate-600">
              When you enroll in our courses, register for free demo sessions, or contact us via WhatsApp/phone, we collect only necessary personal data:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-slate-600 text-sm">
              <li><strong>Student & Parent Information:</strong> Full name, WhatsApp mobile number, email address, city/district, and standard/academic stream (e.g. Memory Science, MPSC, 5th/8th Scholarship, Vedic Maths).</li>
              <li><strong>Academic Progress & Test Scores:</strong> Written exam mock scores, recall speed timings, and syllabus completion records necessary for personalized coaching.</li>
              <li><strong>Communication Records:</strong> Queries submitted through inquiry forms, callback requests, and counselling interactions.</li>
            </ul>
          </section>

          <hr className="border-slate-100" />

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-100 text-secondary flex items-center justify-center text-xs font-bold shrink-0">2</span>
              <span>How We Use Your Data</span>
            </h2>
            <p className="text-slate-600">
              MindMaster Academy uses student information solely for academic and communication purposes:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-slate-600 text-sm">
              <li>Scheduling physical and online batch sessions, masterclasses, and weekend workshops in Satara and regional centres.</li>
              <li>Sending essential reminders about test series, batch timings, and study materials via WhatsApp and SMS.</li>
              <li>Providing 1-on-1 mentorship feedback by Prashant Dhumal Sir and certified memory instructors.</li>
              <li>Issuing verified Course Completion & Trainer Certification credentials.</li>
            </ul>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs sm:text-sm text-amber-900">
              <strong>Zero Spam Guarantee:</strong> We never sell, rent, trade, or distribute student phone numbers or personal information to third-party marketing firms or advertising agencies.
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-100 text-secondary flex items-center justify-center text-xs font-bold shrink-0">3</span>
              <span>Student Success Stories & Media Consent</span>
            </h2>
            <p className="text-slate-600">
              We proudly celebrate the achievements of our rank holders in State Memory Championships, MPSC examinations, and State Scholarship merit lists.
            </p>
            <p className="text-slate-600 text-sm">
              Photographs, marksheet extracts, and video testimonials are published on our official website and social platforms (YouTube, Instagram, Facebook) only with the explicit consent of the candidate or their parents/guardians. If you wish to update or remove your testimonial, you may notify us anytime at our Satara office.
            </p>
          </section>

          <hr className="border-slate-100" />

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-100 text-secondary flex items-center justify-center text-xs font-bold shrink-0">4</span>
              <span>Security & Confidentiality</span>
            </h2>
            <p className="text-slate-600 text-sm">
              All electronic communications and databases are protected by industry-standard encryption and access controls. Physical registration documents are safely maintained at our Satara Headquarters and accessible only to authorized admissions staff.
            </p>
          </section>

          <hr className="border-slate-100" />

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-100 text-secondary flex items-center justify-center text-xs font-bold shrink-0">5</span>
              <span>Contact for Privacy Inquiries & Grievances</span>
            </h2>
            <p className="text-slate-600 text-sm">
              If you have any questions, corrections, or concerns regarding our privacy practices, please contact our administrative desk:
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2 text-xs sm:text-sm">
              <p className="font-bold text-slate-900">MindMaster Academy (HQ)</p>
              <p className="text-slate-600">Near Powai Naka, Sadar Bazar, Satara, Maharashtra - 415001</p>
              <p className="text-slate-600"><strong>Mentor & Director:</strong> Prashant Dhumal</p>
              <p className="text-slate-600"><strong>Phone / WhatsApp:</strong> +91 84593 44077</p>
              <p className="text-slate-600"><strong>Email:</strong> mindmasterdhumal@gmail.com</p>
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
export default PrivacyPolicy;
