import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { TransformationSlider } from '../components/TransformationSlider';
import { VideoModal, VideoModalProps } from '../components/VideoModal';
import { DottedColorfulBrain } from '../components/DottedColorfulBrain';
import { getAppUrl } from '../config/appConfig';

export const Home: React.FC = () => {
  const [modalData, setModalData] = useState<VideoModalProps | null>(null);

  const openAkashVideo = () => {
    setModalData({
      isOpen: true,
      onClose: () => setModalData(null),
      title: 'Akash M. — Selected, Maharashtra Police Bharti 2025',
      studentName: 'Akash More',
      rankBadge: 'SELECTED • POLICE BHARTI 2025',
      category: 'POLICE BHARTI',
      location: 'Nashik Centre',
      batchYear: 'Batch of 2025',
      quote: 'The physical training calmness under Sagar Sir and rapid GK anchoring gave me 100% written test marks.',
      posterImg: '/assets/images/akash_police_testimonial.png',
      videoDuration: '2:14',
      marksheetScore: '100% Written Test Marks',
      keyTakeaway: 'Cognitive Anchoring for High Endurance & Quick MCQ Recall'
    });
  };

  return (
    <main className="w-full pt-24 sm:pt-28 bg-background min-h-screen">
      <div className="flex flex-col w-full overflow-hidden">
        {/* Hero Section */}
        <section className="relative w-full pt-space-2xl md:pt-space-3xl pb-space-2xl px-gutter-mobile lg:px-gutter-desktop overflow-hidden">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[720px] h-[340px] bg-secondary-fixed/40 blur-[110px] rounded-full pointer-events-none -z-10"></div>
          <div className="absolute top-48 -left-32 w-[380px] h-[380px] bg-tertiary-fixed/45 blur-[120px] rounded-full pointer-events-none -z-10"></div>
          <div className="absolute top-64 -right-28 w-[420px] h-[420px] bg-surface-container-high/60 blur-[100px] rounded-full pointer-events-none -z-10"></div>

          <div className="max-w-container-max mx-auto flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-space-xs px-space-md py-1.5 rounded-full bg-surface-container-low shadow-xs mb-space-lg">
              <span className="w-2 h-2 rounded-full bg-secondary ring-4 ring-secondary-fixed animate-pulse"></span>
              <span className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                Trusted by 5,000+ learners across Maharashtra
              </span>
            </div>

            <h1 className="font-display-hero text-3xl sm:text-5xl md:text-6xl text-primary-container max-w-4xl tracking-tight leading-[1.12] font-extrabold">
              Train Your Mind. <br className="hidden sm:inline" />
              <span className="relative inline-block">Master Your Memory.</span>
              <br />
              <span className="relative inline-block text-secondary mt-1">
                Succeed Anywhere.
                <svg
                  aria-hidden="true"
                  className="absolute -bottom-2.5 left-0 w-full text-secondary opacity-80 overflow-visible"
                  fill="none"
                  height="12"
                  viewBox="0 0 280 12"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M3 9C68 2.5 185 -0.5 277 8.5" stroke="currentColor" strokeLinecap="round" strokeWidth="4.5" />
                </svg>
              </span>
            </h1>

            <p className="font-body-lg text-base md:text-lg text-on-surface-variant max-w-2xl mt-space-lg mb-space-xl">
              Practical memory, concentration and Vedic-maths techniques for students from Grade 4 to UPSC — and anyone aged 10 to 80.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
              {/* Primary App Link: Explore & Enroll */}
              <a
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-secondary text-on-secondary font-title-md text-sm sm:text-base px-6 py-3.5 rounded-full shadow-md hover:bg-secondary-container hover:scale-105 active:scale-95 transition-all"
                href={getAppUrl('/courses')}
              >
                <span>Explore &amp; Enroll</span>
                <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-1">arrow_forward</span>
              </a>

              {/* Student Login Direct Access */}
              <a
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-slate-800 font-title-md text-sm sm:text-base px-5 py-3.5 rounded-full shadow-xs hover:bg-slate-50 hover:text-secondary transition-all border border-slate-300"
                href={getAppUrl('/login?next=/home')}
              >
                <span className="material-symbols-outlined text-lg text-secondary">account_circle</span>
                <span>Student Login</span>
              </a>

              <Link
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-title-md text-sm sm:text-base px-5 py-3.5 rounded-full shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl transition-all group border border-blue-400/30"
                to="/brain-games"
              >
                <span className="material-symbols-outlined text-lg text-cyan-300 group-hover:rotate-12 transition-transform">psychology</span>
                <span>Play Brain Games</span>
              </Link>

              <Link
                className="w-full sm:w-auto inline-flex items-center justify-center bg-surface-container-lowest text-primary-container font-title-md text-sm sm:text-base px-5 py-3.5 rounded-full shadow-xs hover:bg-surface-container-low transition-all border border-surface-variant/60"
                to="/contact"
              >
                Free Demo Class
              </Link>
            </div>

            {/* Hero Showcase: Classroom Photo Card */}
            <div className="w-full max-w-5xl mt-space-2xl relative">
              <div className="absolute inset-0 bg-secondary/5 rounded-3xl blur-xl transform scale-[0.98] translate-y-3"></div>
              <div className="relative bg-surface-container-lowest rounded-2xl md:rounded-3xl p-2 md:p-3 shadow-xl overflow-hidden border border-surface-variant/40">
                <img
                  alt="Indian students studying around a laptop in bright classroom"
                  className="w-full aspect-[16/9] md:aspect-[21/10] object-cover rounded-xl md:rounded-2xl"
                  src="/assets/images/classroom_students_group.png"
                />
                <div className="absolute bottom-6 left-6 hidden md:flex items-center gap-space-sm bg-surface-container-lowest/95 backdrop-blur-md px-space-md py-space-xs rounded-full shadow-sm">
                  <span className="material-symbols-outlined text-secondary text-title-md">psychology</span>
                  <span className="font-body-sm text-xs text-primary-container font-semibold">
                    Live Interactive Cognitive Batches • Satara HQ & Pune Hubs
                  </span>
                </div>
              </div>
            </div>

            {/* NEW: Multi-Platform Access Strip: Laptop Web App vs Phone Mobile App */}
            <div className="w-full max-w-5xl mt-8 pt-6 border-t border-slate-200">
              <div className="text-center mb-6">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-secondary bg-blue-50 px-3 py-1 rounded-full border border-blue-100 inline-block mb-1.5">
                  Universal Cross-Platform Learning
                </span>
                <h2 className="font-headline-sm text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                  Study Anywhere: Web App on Laptop • Install App on Phone
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto mt-1">
                  Access the same unified MindMaster portal across all your devices with a single login.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                {/* Laptop / PC Web App Card */}
                <div className="bg-white rounded-3xl p-6 border-2 border-blue-100 shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between gap-4 group">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="w-11 h-11 rounded-2xl bg-blue-50 text-secondary flex items-center justify-center shadow-xs">
                        <span className="material-symbols-outlined text-[24px]">laptop_mac</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-extrabold border border-slate-200 uppercase tracking-wider">
                        Laptop &amp; Desktop Web
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 group-hover:text-secondary transition-colors">
                      Study on Laptop or PC (Web App)
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Enjoy a wide-screen study experience. Watch HD lectures, write lecture notes live with timestamp bookmarks, and read official PDF course books with zoom.
                    </p>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 text-[10px] font-semibold border border-slate-200">
                        Full-Screen HD Player
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 text-[10px] font-semibold border border-slate-200">
                        In-Lecture Notes Dock
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 text-[10px] font-semibold border border-slate-200">
                        E-Books PDF Reader
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <a
                      href={getAppUrl('/home')}
                      className="flex-1 py-2.5 px-4 rounded-full bg-secondary hover:bg-secondary-container text-white text-xs font-bold transition text-center shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <span>Open Web App</span>
                      <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                    </a>
                    <a
                      href={getAppUrl('/login?next=/home')}
                      className="py-2.5 px-4 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition text-center"
                    >
                      Login
                    </a>
                  </div>
                </div>

                {/* Mobile Phone & Tablet PWA Card */}
                <div className="bg-white rounded-3xl p-6 border-2 border-emerald-100 shadow-sm hover:border-emerald-300 transition-all flex flex-col justify-between gap-4 group">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-xs">
                        <span className="material-symbols-outlined text-[24px]">install_mobile</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-extrabold border border-emerald-200 uppercase tracking-wider">
                        Android &amp; iPhone PWA
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 group-hover:text-emerald-700 transition-colors">
                      Install Student App on Phone
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Add to your home screen with 1 tap. Ultra-fast, lightweight PWA with zero heavy storage downloads, offline caching, and instant mobile notifications.
                    </p>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 text-[10px] font-semibold border border-slate-200">
                        1-Tap Home Screen Install
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 text-[10px] font-semibold border border-slate-200">
                        Zero Storage Bloat
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 text-[10px] font-semibold border border-slate-200">
                        Daily Practice Streaks
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <a
                      href={getAppUrl('/home?install=true')}
                      className="flex-1 py-2.5 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition text-center shadow-xs shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">download</span>
                      <span>Install on Phone</span>
                    </a>
                    <a
                      href={getAppUrl('/courses')}
                      className="py-2.5 px-4 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition text-center"
                    >
                      Courses
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Learners Succeed In (Interactive Deep Links) */}
        <section className="w-full py-space-lg bg-slate-50 border-y border-slate-200/80">
          <div className="max-w-container-max mx-auto px-gutter-mobile lg:px-gutter-desktop text-center">
            <h2 className="font-label-caps text-xs text-slate-500 uppercase tracking-widest mb-space-md font-bold">
              Our Learners Succeed In (Click to explore results)
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <Link
                to="/results?category=mpsc"
                className="px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-800 font-title-md text-xs sm:text-sm hover:border-secondary hover:text-secondary hover:shadow-sm transition-all shadow-2xs flex items-center gap-2 group"
              >
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>MPSC</span>
                <span className="material-symbols-outlined text-[14px] text-slate-400 group-hover:text-secondary group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
              </Link>
              <Link
                to="/results?category=mpsc"
                className="px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-800 font-title-md text-xs sm:text-sm hover:border-secondary hover:text-secondary hover:shadow-sm transition-all shadow-2xs flex items-center gap-2 group"
              >
                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                <span>UPSC</span>
                <span className="material-symbols-outlined text-[14px] text-slate-400 group-hover:text-secondary group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
              </Link>
              <Link
                to="/results?category=police"
                className="px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-800 font-title-md text-xs sm:text-sm hover:border-secondary hover:text-secondary hover:shadow-sm transition-all shadow-2xs flex items-center gap-2 group"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Police Bharti</span>
                <span className="material-symbols-outlined text-[14px] text-slate-400 group-hover:text-secondary group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
              </Link>
              <Link
                to="/results?category=scholarship"
                className="px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-800 font-title-md text-xs sm:text-sm hover:border-secondary hover:text-secondary hover:shadow-sm transition-all shadow-2xs flex items-center gap-2 group"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Scholarship (5th/8th)</span>
                <span className="material-symbols-outlined text-[14px] text-slate-400 group-hover:text-secondary group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
              </Link>
              <Link
                to="/results?category=vedic"
                className="px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-800 font-title-md text-xs sm:text-sm hover:border-secondary hover:text-secondary hover:shadow-sm transition-all shadow-2xs flex items-center gap-2 group"
              >
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>NMMS & Olympiad</span>
                <span className="material-symbols-outlined text-[14px] text-slate-400 group-hover:text-secondary group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
              </Link>
              <Link
                to="/courses?category=maths"
                className="px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-800 font-title-md text-xs sm:text-sm hover:border-secondary hover:text-secondary hover:shadow-sm transition-all shadow-2xs flex items-center gap-2 group"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>MHT-CET Math</span>
                <span className="material-symbols-outlined text-[14px] text-slate-400 group-hover:text-secondary group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Statistics Counters - High-Impact Electric Blue Impact Ribbon */}
        <section className="w-full bg-gradient-to-r from-[#0038B8] via-[#0052FF] to-[#0038B8] py-12 md:py-16 text-white border-y border-blue-400/40 shadow-xl shadow-[#0052FF]/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent_70%)] pointer-events-none"></div>
          <div className="max-w-6xl mx-auto px-gutter-mobile lg:px-gutter-desktop relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 text-center">
              <div className="flex flex-col items-center justify-center p-3">
                <div className="font-['Poppins'] text-3xl sm:text-4xl md:text-5xl text-white tracking-tight font-extrabold drop-shadow-md">
                  5,000+
                </div>
                <div className="font-body-sm text-xs sm:text-sm text-blue-100 mt-1.5 font-semibold uppercase tracking-wider">Students trained</div>
              </div>
              <div className="flex flex-col items-center justify-center p-3 border-l border-white/20">
                <div className="font-['Poppins'] text-3xl sm:text-4xl md:text-5xl text-amber-300 tracking-tight font-extrabold drop-shadow-md">
                  500+
                </div>
                <div className="font-body-sm text-xs sm:text-sm text-blue-100 mt-1.5 font-semibold uppercase tracking-wider">Batches completed</div>
              </div>
              <div className="flex flex-col items-center justify-center p-3 border-l border-white/20">
                <div className="font-['Poppins'] text-3xl sm:text-4xl md:text-5xl text-emerald-300 tracking-tight font-extrabold drop-shadow-md">
                  100%
                </div>
                <div className="font-body-sm text-xs sm:text-sm text-blue-100 mt-1.5 font-semibold uppercase tracking-wider">Police Bharti clearance</div>
              </div>
              <div className="flex flex-col items-center justify-center p-3 border-l border-white/20">
                <div className="font-['Poppins'] text-3xl sm:text-4xl md:text-5xl text-sky-200 tracking-tight font-extrabold drop-shadow-md">
                  10+
                </div>
                <div className="font-body-sm text-xs sm:text-sm text-blue-100 mt-1.5 font-semibold uppercase tracking-wider">Years of excellence</div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Families Choose MindMaster */}
        <section className="w-full bg-slate-50/90 py-20 px-gutter-mobile lg:px-gutter-desktop border-b border-slate-200/80">
          <div className="max-w-container-max mx-auto">
            <div className="text-center mb-14">
              <h2 className="font-heading-bold text-3xl md:text-4xl text-slate-900 tracking-tight font-bold">
                Why families{' '}
                <span className="relative inline-block text-secondary">
                  choose
                  <svg aria-hidden="true" className="absolute -bottom-2 left-0 w-full text-secondary" fill="none" height="8" viewBox="0 0 100 8" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 6C35 2 70 2 98 6" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
                  </svg>
                </span>{' '}
                MindMaster
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-secondary mb-5 shadow-2xs">
                  <span className="material-symbols-outlined text-2xl">psychology</span>
                </div>
                <h3 className="font-heading-bold text-lg font-bold text-slate-900 mb-2">Scientific Memory Systems</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Pegging, story method, and Roman Room memory palace make full-year syllabi stick permanently.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-secondary mb-5 shadow-2xs">
                  <span className="material-symbols-outlined text-2xl">center_focus_strong</span>
                </div>
                <h3 className="font-heading-bold text-lg font-bold text-slate-900 mb-2">Laser Concentration</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Rhythmic focus drills that expand student attention span from 15 minutes to 2-hour uninterrupted blocks.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-secondary mb-5 shadow-2xs">
                  <span className="material-symbols-outlined text-2xl">security</span>
                </div>
                <h3 className="font-heading-bold text-lg font-bold text-slate-900 mb-2">Exam Hall Temperament</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Simulated timed mock tests eliminate exam blankouts, test anxiety, and negative marking errors.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-secondary mb-5 shadow-2xs">
                  <span className="material-symbols-outlined text-2xl">event_note</span>
                </div>
                <h3 className="font-heading-bold text-lg font-bold text-slate-900 mb-2">Lifelong Study Habits</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  1-7-30 Spaced Repetition frameworks and daily goal planning that outlast competitive exams.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Before & After Transformation Slider */}
        <section className="w-full bg-gradient-to-b from-slate-50 to-white py-20 px-gutter-mobile lg:px-gutter-desktop border-b border-slate-200/80">
          <div className="max-w-container-max mx-auto">
            <div className="text-center mb-10">
              <h2 className="font-heading-bold text-3xl md:text-4xl text-slate-900 tracking-tight font-bold">
                Drag to See the{' '}
                <span className="relative inline-block text-secondary">
                  Transformation
                  <svg aria-hidden="true" className="absolute -bottom-2 left-0 w-full text-secondary" fill="none" height="8" viewBox="0 0 190 8" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 6C60 2 130 2 188 6" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
                  </svg>
                </span>
              </h2>
              <p className="text-[#5A6478] text-sm max-w-lg mx-auto mt-2">
                Slide back and forth or use the buttons to compare a student's study confidence before and after MindMaster.
              </p>
            </div>

            {/* Real Interactive Draggable Slider */}
            <TransformationSlider />
          </div>
        </section>

        {/* Real Ranks Testimonials & Video Spotlight */}
        <section className="w-full bg-white py-20 px-gutter-mobile lg:px-gutter-desktop border-t border-surface-variant/40">
          <div className="max-w-container-max mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-heading-bold text-3xl md:text-4xl text-slate-900 tracking-tight font-bold">
                MindMaster helped students build <span className="text-secondary font-extrabold">real ranks</span>, not just marks.
              </h2>
            </div>

            {/* Akash M. Police Bharti Testimonial Video Card (Clickable to open VideoModal) */}
            <div
              onClick={openAkashVideo}
              className="max-w-4xl mx-auto mb-14 bg-white rounded-2xl border border-[#E4E8F8] overflow-hidden shadow-md group cursor-pointer hover:shadow-xl transition-all"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-black/5">
                <img
                  alt="Akash M. Police Bharti Testimonial Video"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  src="/assets/images/akash_police_testimonial.png"
                />
                <div className="absolute inset-0 bg-black/25 group-hover:bg-black/15 transition-colors"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-secondary text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-4xl sm:text-5xl ml-1">play_arrow</span>
                  </div>
                </div>
                <span className="absolute bottom-4 right-4 bg-black/80 text-white text-xs font-semibold px-3 py-1 rounded-md backdrop-blur-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-red-500">videocam</span>
                  Watch Video • 2:14
                </span>
                <span className="absolute top-4 left-4 bg-secondary-fixed text-on-secondary-fixed text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                  POLICE BHARTI 2025 • TOP RANKER
                </span>
              </div>
              <div className="p-4 sm:p-6 flex items-center justify-between gap-4 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-secondary flex items-center justify-center font-bold text-base shadow-xs">
                    AM
                  </div>
                  <div>
                    <h4 className="font-heading-bold text-base sm:text-lg font-bold text-[#0E1B3D]">
                      Akash M. — Selected, Police Bharti 2025
                    </h4>
                    <p className="text-xs sm:text-sm text-[#5A6478]">
                      Watch how cognitive anchoring and GK memory drills secured 100% written marks.
                    </p>
                  </div>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1 text-xs font-title-md text-secondary font-bold">
                  Play Interview <span className="material-symbols-outlined text-[16px]">play_circle</span>
                </span>
              </div>
            </div>

            {/* Testimonial Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-[#E4E8F8] shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-3">
                    <span className="material-symbols-outlined text-lg fill-current">star</span>
                    <span className="material-symbols-outlined text-lg fill-current">star</span>
                    <span className="material-symbols-outlined text-lg fill-current">star</span>
                    <span className="material-symbols-outlined text-lg fill-current">star</span>
                    <span className="material-symbols-outlined text-lg fill-current">star</span>
                  </div>
                  <p className="text-[#5A6478] text-sm leading-relaxed mb-6">
                    “The Peg memory method changed everything for my History and Civics papers. I could recall <span className="font-['Poppins'] font-bold text-slate-800">200</span> exact dates in 2 days.”
                  </p>
                </div>
                <div className="pt-4 border-t border-[#E4E8F8] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#FFE8D6] text-[#0E1B3D] flex items-center justify-center font-bold text-xs">
                    SK
                  </div>
                  <div>
                    <div className="font-heading-bold text-sm font-bold text-[#0E1B3D]">Snehal Kulkarni</div>
                    <div className="text-xs text-secondary font-medium">Scholarship Rank 12 • Satara</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-[#E4E8F8] shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-3">
                    <span className="material-symbols-outlined text-lg fill-current">star</span>
                    <span className="material-symbols-outlined text-lg fill-current">star</span>
                    <span className="material-symbols-outlined text-lg fill-current">star</span>
                    <span className="material-symbols-outlined text-lg fill-current">star</span>
                    <span className="material-symbols-outlined text-lg fill-current">star</span>
                  </div>
                  <p className="text-[#5A6478] text-sm leading-relaxed mb-6">
                    “Learning from Sagar Sir gave me the methodology to teach kids in my town. I have trained <span className="font-['Poppins'] font-bold text-slate-800">400+</span> students with our own academy.”
                  </p>
                </div>
                <div className="pt-4 border-t border-[#E4E8F8] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#DFF7EA] text-[#0E1B3D] flex items-center justify-center font-bold text-xs">
                    SG
                  </div>
                  <div>
                    <div className="font-heading-bold text-sm font-bold text-[#0E1B3D]">Dr. Sunita Gaikwad</div>
                    <div className="text-xs text-secondary font-medium">Train the Trainer • Kolhapur</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-[#E4E8F8] shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-3">
                    <span className="material-symbols-outlined text-lg fill-current">star</span>
                    <span className="material-symbols-outlined text-lg fill-current">star</span>
                    <span className="material-symbols-outlined text-lg fill-current">star</span>
                    <span className="material-symbols-outlined text-lg fill-current">star</span>
                    <span className="material-symbols-outlined text-lg fill-current">star</span>
                  </div>
                  <p className="text-[#5A6478] text-sm leading-relaxed mb-6">
                    “I used to panic during mental arithmetic. Vedic maths cut my calculation time by <span className="font-['Poppins'] font-bold text-slate-800">75%</span> and secured my NMMS merit list position.”
                  </p>
                </div>
                <div className="pt-4 border-t border-[#E4E8F8] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-secondary flex items-center justify-center font-bold text-xs">
                    TP
                  </div>
                  <div>
                    <div className="font-heading-bold text-sm font-bold text-[#0E1B3D]">Tanvi Patil</div>
                    <div className="text-xs text-secondary font-medium">NMMS Qualified • Pune</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-10">
              <Link
                className="inline-flex items-center justify-center gap-2 bg-secondary text-white px-8 py-3.5 rounded-full font-title-md text-sm shadow-md hover:bg-secondary-container transition-all"
                to="/results"
              >
                <span>View All Student Success Stories</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>

        
        {/* Cognitive Speed Arena & Brain Games Showcase Section */}
        <section className="w-full bg-gradient-to-b from-[#0B132B] via-[#0E1A38] to-[#0B132B] py-20 px-gutter-mobile lg:px-gutter-desktop text-white relative overflow-hidden border-y border-blue-900/60 shadow-2xl">
          {/* Subtle Ambient Radial Backdrops */}
          <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute -bottom-32 right-1/4 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />

          <div className="max-w-6xl mx-auto relative z-10">
            {/* Header Badge & Title */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/30 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-4 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <span>MindMaster Cognitive Speed Arena • Human Brain vs Machine</span>
              </div>
              <h2 className="font-heading-bold text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
                Can Your Brain Outpace a <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300">Calculator?</span>
              </h2>
              <p className="text-slate-300 text-sm sm:text-base md:text-lg leading-relaxed">
                Experience how structured sensory memory systems and Vedic mental calculation unlock lightning-fast recall. Test yourself across four speed challenges:
              </p>
            </div>

            {/* Main Interactive Showcase Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Dotted Colorful Brain Visual */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-xl relative overflow-hidden group shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-purple-500/5 pointer-events-none" />
                
                {/* Visual Dotted Colorful Brain */}
                <DottedColorfulBrain size={320} className="my-2" />

                {/* Subtitle Pills */}
                <div className="flex items-center justify-between w-full mt-4 pt-4 border-t border-slate-700/60 text-xs">
                  <div className="flex items-center gap-1.5 text-cyan-300 font-medium">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    <span>Left: Logic & Vedic Math</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-pink-300 font-medium">
                    <span className="w-2 h-2 rounded-full bg-pink-400"></span>
                    <span>Right: Memory & Reflexes</span>
                  </div>
                </div>
              </div>

              {/* Right Column: 4 Game Feature Cards */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Game 1: Calendar */}
                <Link
                  to="/brain-games"
                  className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/70 hover:border-cyan-400/50 hover:bg-slate-800/90 transition-all group flex flex-col justify-between shadow-md"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-cyan-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-2xl">calendar_month</span>
                    </div>
                    <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider font-['Poppins']">
                      MM-04 Superfast Technique
                    </span>
                    <h3 className="font-bold text-white text-base mt-1 mb-1.5 group-hover:text-cyan-300 transition-colors">
                      Calendar Day Calculation
                    </h3>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      Determine the exact day of the week for any date from 1600 to 2100 in less than 2 seconds.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs text-cyan-400 font-semibold">
                    <span>Play Challenge</span>
                    <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </div>
                </Link>

                {/* Game 2: Vedic Math */}
                <Link
                  to="/brain-games"
                  className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/70 hover:border-amber-400/50 hover:bg-slate-800/90 transition-all group flex flex-col justify-between shadow-md"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-2xl">calculate</span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider font-['Poppins']">
                      MM-05 Vedic Foundations
                    </span>
                    <h3 className="font-bold text-white text-base mt-1 mb-1.5 group-hover:text-amber-300 transition-colors">
                      Vedic Lightning Math
                    </h3>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      Multiply large numbers and calculate squares instantly without pencil, paper or calculator.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs text-amber-400 font-semibold">
                    <span>Play Challenge</span>
                    <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </div>
                </Link>

                {/* Game 3: Flash Recall */}
                <Link
                  to="/brain-games"
                  className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/70 hover:border-indigo-400/50 hover:bg-slate-800/90 transition-all group flex flex-col justify-between shadow-md"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-2xl">psychology</span>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider font-['Poppins']">
                      MM-01 Sensory Pegging
                    </span>
                    <h3 className="font-bold text-white text-base mt-1 mb-1.5 group-hover:text-indigo-300 transition-colors">
                      Flash Recall & Memory
                    </h3>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      Memorize grids of objects, historical events and constitution articles in a single 3-second glance.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs text-indigo-400 font-semibold">
                    <span>Play Challenge</span>
                    <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </div>
                </Link>

                {/* Game 4: Neuro Agility */}
                <Link
                  to="/brain-games"
                  className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/70 hover:border-emerald-400/50 hover:bg-slate-800/90 transition-all group flex flex-col justify-between shadow-md"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-2xl">speed</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider font-['Poppins']">
                      MM-06 Cognitive Reflex
                    </span>
                    <h3 className="font-bold text-white text-base mt-1 mb-1.5 group-hover:text-emerald-300 transition-colors">
                      Neuro Agility & Stroop
                    </h3>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      Overcome brain interference and train millisecond decision reflexes under intense pressure.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs text-emerald-400 font-semibold">
                    <span>Play Challenge</span>
                    <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </div>
                </Link>
              </div>
            </div>

            {/* Bottom Call to Action Banner */}
            <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-900/60 via-indigo-900/60 to-purple-900/60 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-400/20 text-cyan-300 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-3xl">sports_esports</span>
                </div>
                <div>
                  <h4 className="font-bold text-white text-base sm:text-lg">
                    Ready to put your cognitive reflexes to the test?
                  </h4>
                  <p className="text-slate-300 text-xs sm:text-sm">
                    100% Free • Works directly in browser • English & मराठी Bilingual Support
                  </p>
                </div>
              </div>
              <Link
                to="/brain-games"
                className="inline-flex items-center justify-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold px-8 py-3.5 rounded-full shadow-lg shadow-cyan-400/25 transition-all text-sm shrink-0 font-['Poppins']"
              >
                <span>Launch Speed Arena</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full px-gutter-mobile lg:px-gutter-desktop py-12">
          <div className="max-w-6xl mx-auto rounded-3xl bg-secondary text-white p-8 md:p-14 relative overflow-hidden text-center shadow-xl">
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="font-heading-bold text-3xl md:text-4xl font-bold tracking-tight text-white mb-3">
                Ready to train your mind?
              </h2>
              <p className="text-white/90 text-base md:text-lg mb-8">
                One technique, a lifetime of cognitive confidence. Join upcoming batches in Satara, Pune or Online.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  className="w-full sm:w-auto inline-flex items-center justify-center bg-white text-secondary font-title-md px-8 py-3.5 rounded-full shadow hover:bg-opacity-95 transition-all text-sm"
                  to="/contact"
                >
                  Book a Free Demo Class
                </Link>
                <a
                  className="w-full sm:w-auto inline-flex items-center justify-center border-2 border-white text-white font-title-md px-8 py-3.5 rounded-full hover:bg-white hover:text-secondary transition-all text-sm"
                  href="tel:+918459344077"
                >
                  Call <span className="font-['Poppins'] ml-1">+91 84593 44077</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Video Modal */}
      {modalData && <VideoModal {...modalData} />}
    </main>
  );
};
