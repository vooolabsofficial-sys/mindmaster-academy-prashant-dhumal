import React from 'react';
import { Link } from 'react-router-dom';

export const Results: React.FC = () => {
  return (
    <main className="w-full pt-24 sm:pt-28 bg-background min-h-screen">
      <div className="flex flex-col w-full">
        {/* Hero Section */}
        <section className="w-full bg-surface-container-lowest py-space-2xl md:py-space-3xl border-b border-surface-variant/40">
          <div className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop">
            <div className="flex flex-col items-start max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-label-caps font-label-caps shadow-xs mb-space-md">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                OFFICIAL ANNOUNCEMENT • BATCH RESULTS
              </div>
              <h1 className="font-headline-lg text-headline-lg md:text-display-hero font-display-hero text-primary-container tracking-tight leading-tight">
                Student Results &amp;{' '}
                <span className="relative inline-block text-secondary">
                  Achievements.
                  <svg
                    className="absolute -bottom-2 left-0 w-full h-3 text-secondary"
                    fill="none"
                    preserveAspectRatio="none"
                    viewBox="0 0 160 12"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 9.5C45 3.5 115 1.5 158 8"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="3.5"
                    />
                  </svg>
                </span>
              </h1>
              <p className="mt-space-md font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
                Results and verified performance records of MindMaster Academy's Memory Techniques, Vedic Maths, and Competitive Exam batches.
              </p>
            </div>
          </div>
        </section>

        {/* Coming Soon Notice Card */}
        <section className="w-full bg-surface-container py-space-xl md:py-space-2xl">
          <div className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop">
            <div className="bg-white rounded-3xl p-8 md:p-12 border border-[#E4E8F8] shadow-sm text-center flex flex-col items-center justify-center max-w-3xl mx-auto">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-secondary flex items-center justify-center mb-5 shadow-xs">
                <span className="material-symbols-outlined text-3xl">workspace_premium</span>
              </div>
              <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider mb-3">
                New Academic Session
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                New Batch Results Announcing Soon!
              </h2>
              <p className="text-sm md:text-base text-slate-600 max-w-xl mt-3 mb-8 leading-relaxed">
                Evaluations for our latest MindMaster Academy cohorts are actively underway. Official scorecards, certificates, and student achievement stories will be published here shortly. For new batch admissions and counseling, connect with us below.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <a
                  href={`https://wa.me/918459344077?text=${encodeURIComponent('Hello Prashant Sir, I would like to inquire about MindMaster Academy results and upcoming batches.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-full shadow-md shadow-emerald-500/20 inline-flex items-center gap-2 transition cursor-pointer active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                  <span>Chat with Prashant Sir on WhatsApp</span>
                </a>
                <a
                  href="tel:+918459344077"
                  className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-sm rounded-full shadow-2xs inline-flex items-center gap-2 transition cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] text-secondary">call</span>
                  <span>+91 84593 44077</span>
                </a>
                <Link
                  to="/courses"
                  className="px-6 py-3.5 bg-secondary text-white font-bold text-sm rounded-full shadow-sm hover:bg-secondary-container transition cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>Explore Courses</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Inside the Academy Visuals */}
        <section className="w-full bg-surface-container-lowest py-space-3xl">
          <div className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop">
            <div className="flex flex-col items-center text-center mb-space-2xl">
              <h2 className="font-headline-lg text-headline-lg font-headline-lg text-primary-container tracking-tight">
                <span className="bg-secondary-fixed text-secondary px-3 py-0.5 rounded-md">Inside</span> the academy
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-2 max-w-xl">
                Authentic moments of learning, discipline, and breakthrough practice captured across our daily batches.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
              <div className="group relative overflow-hidden rounded-2xl bg-surface-container aspect-[4/3] shadow-xs">
                <img
                  alt="Memory drill session inside MindMaster Academy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  src="/assets/images/classroom_memory_drills.png"
                />
                <div className="absolute bottom-4 left-4 bg-surface-container-lowest/90 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-xs">
                  <span className="font-title-md text-xs text-primary-container font-semibold">Memory drill session</span>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl bg-surface-container aspect-[4/3] shadow-xs">
                <img
                  alt="Mind-map whiteboard & study group"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  src="/assets/images/classroom_students_group.png"
                />
                <div className="absolute bottom-4 left-4 bg-surface-container-lowest/90 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-xs">
                  <span className="font-title-md text-xs text-primary-container font-semibold">Mind-map whiteboard &amp; study group</span>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl bg-surface-container aspect-[4/3] shadow-xs">
                <img
                  alt="Vedic speed round calculations"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  src="/assets/images/student_mental_vedic_maths.png"
                />
                <div className="absolute bottom-4 left-4 bg-surface-container-lowest/90 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-xs">
                  <span className="font-title-md text-xs text-primary-container font-semibold">Vedic speed round calculations</span>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl bg-surface-container aspect-[4/3] shadow-xs">
                <img
                  alt="Police Bharti endurance test preparation"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  src="/assets/images/police_bharti_celebration.jpg"
                />
                <div className="absolute bottom-4 left-4 bg-surface-container-lowest/90 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-xs">
                  <span className="font-title-md text-xs text-primary-container font-semibold">Police Bharti celebration cohort</span>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl bg-surface-container aspect-[4/3] shadow-xs">
                <img
                  alt="Trainer certification cohort workshop"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  src="/assets/images/instructor_coaching_adults.png"
                />
                <div className="absolute bottom-4 left-4 bg-surface-container-lowest/90 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-xs">
                  <span className="font-title-md text-xs text-primary-container font-semibold">Trainer certification cohort</span>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl bg-surface-container aspect-[4/3] shadow-xs">
                <img
                  alt="MPSC Study & Merit preparation"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  src="/assets/images/mpsc_merit_topper.jpg"
                />
                <div className="absolute bottom-4 left-4 bg-surface-container-lowest/90 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-xs">
                  <span className="font-title-md text-xs text-primary-container font-semibold">MPSC Merit Library batch</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="w-full bg-surface-container-lowest py-space-2xl md:py-space-3xl">
          <div className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop">
            <div className="w-full bg-secondary rounded-2xl p-space-xl md:p-space-3xl text-center flex flex-col items-center justify-center shadow-xl relative overflow-hidden">
              <div className="absolute -top-24 -left-24 w-72 h-72 bg-secondary-fixed opacity-15 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-secondary-container opacity-20 rounded-full blur-3xl pointer-events-none"></div>
              <span className="font-label-caps text-label-caps text-secondary-fixed uppercase tracking-widest mb-2 relative z-10">
                Start Your Ascent
              </span>
              <h2 className="font-display-hero text-headline-lg md:text-display-hero font-display-hero text-on-secondary tracking-tight max-w-2xl relative z-10">
                Your story could be next.
              </h2>
              <p className="font-body-lg text-body-lg text-secondary-fixed max-w-xl mt-space-sm mb-space-xl relative z-10">
                Join our upcoming batch and experience the verified MindMaster transformation under personal faculty mentorship.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-space-md w-full sm:w-auto relative z-10">
                <Link
                  className="w-full sm:w-auto inline-flex items-center justify-center h-12 px-space-2xl rounded-full bg-surface-container-lowest text-secondary font-title-md text-title-md hover:bg-surface-container-low transition-colors shadow-md"
                  to="/contact"
                >
                  Book a Free Demo Class <span className="material-symbols-outlined ml-2 text-[18px]">arrow_forward</span>
                </Link>
                <a
                  className="w-full sm:w-auto inline-flex items-center justify-center h-12 px-space-2xl rounded-full bg-transparent border border-surface-container-lowest/30 text-on-secondary font-title-md text-title-md hover:bg-surface-container-lowest/10 transition-colors"
                  href="tel:+918459344077"
                >
                  <span className="material-symbols-outlined mr-2 text-[18px]">call</span> Call +91 84593 44077
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};
