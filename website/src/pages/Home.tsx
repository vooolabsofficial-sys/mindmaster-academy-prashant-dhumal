import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TransformationSlider } from '../components/TransformationSlider';
import { VideoModal, VideoModalProps } from '../components/VideoModal';
import { DottedColorfulBrain } from '../components/DottedColorfulBrain';
import {
  getAppUrl,
  getAppCourseCheckoutUrl,
  fetchLiveCoursesFromApp,
  LiveDbCourse,
  getWhatsAppPreBookUrl,
  fetchLiveWebsiteCms,
  WebsiteCmsData,
  DEFAULT_WEBSITE_CMS,
} from '../config/appConfig';

export const Home: React.FC = () => {
  const [modalData, setModalData] = useState<VideoModalProps | null>(null);
  const [liveDbCourses, setLiveDbCourses] = useState<LiveDbCourse[]>([]);
  const [cms, setCms] = useState<WebsiteCmsData>(DEFAULT_WEBSITE_CMS);
  const [showPromoPopup, setShowPromoPopup] = useState(false);

  useEffect(() => {
    fetchLiveCoursesFromApp().then((courses) => {
      setLiveDbCourses(courses);
    });
    fetchLiveWebsiteCms().then((data) => {
      setCms(data);
      if (data.sectionVisibility?.promoPopup && data.promoPopup?.enabled) {
        const timer = setTimeout(() => setShowPromoPopup(true), 2500);
        return () => clearTimeout(timer);
      }
    });
  }, []);

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
                {cms.hero?.trustBadge || 'Trusted by 5,000+ learners across Maharashtra'}
              </span>
            </div>

            <h1 className="font-display-hero text-3xl sm:text-5xl md:text-6xl text-primary-container max-w-4xl tracking-tight leading-[1.12] font-extrabold">
              {cms.hero?.headline ? (
                <span>{cms.hero.headline}</span>
              ) : (
                <>
                  Train Your Mind. <br className="hidden sm:inline" />
                  <span className="relative inline-block">Master Your Memory.</span>
                  <br />
                  <span className="relative inline-block text-secondary mt-1">Succeed Anywhere.</span>
                </>
              )}
            </h1>

            <p className="font-body-lg text-base md:text-lg text-on-surface-variant max-w-2xl mt-space-lg mb-space-xl">
              {cms.hero?.subtitle ||
                'Practical memory, concentration and Vedic-maths techniques for students from Grade 4 to UPSC — and anyone aged 10 to 80.'}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
              {/* Primary Action: Explore & Enroll */}
              <a
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#0052FF] text-white font-title-md text-sm sm:text-base px-8 py-3.5 rounded-full shadow-lg shadow-[#0052FF]/25 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all group"
                href={
                  cms.hero?.primaryCtaUrl?.startsWith('http')
                    ? cms.hero.primaryCtaUrl
                    : getAppUrl(cms.hero?.primaryCtaUrl || '/courses')
                }
              >
                <span>{cms.hero?.primaryCtaText || 'Explore & Enroll'}</span>
                <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-1">
                  arrow_forward
                </span>
              </a>

              {/* Secondary Action */}
              <a
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-slate-800 font-title-md text-sm sm:text-base px-6 py-3.5 rounded-full shadow-2xs hover:bg-slate-50 hover:text-[#0052FF] transition-all border border-slate-200"
                href={
                  cms.hero?.secondaryCtaUrl?.startsWith('http')
                    ? cms.hero.secondaryCtaUrl
                    : cms.hero?.secondaryCtaUrl || '/demo'
                }
              >
                <span className="material-symbols-outlined text-lg text-[#0052FF]">play_circle</span>
                <span>{cms.hero?.secondaryCtaText || 'Free Demo Hub'}</span>
              </a>

              {/* Clean Student Portal Login */}
              <a
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-100 text-slate-700 font-title-md text-sm sm:text-base px-6 py-3.5 rounded-full shadow-2xs hover:bg-slate-200 transition-all border border-slate-300"
                href={getAppUrl('/login?next=/home')}
              >
                <span className="material-symbols-outlined text-lg text-[#0052FF]">account_circle</span>
                <span>Student Login</span>
              </a>
            </div>

            {/* Hero Showcase: Classroom Photo Card */}
            <div className="w-full max-w-5xl mt-space-2xl relative">
              <div className="absolute inset-0 bg-secondary/5 rounded-3xl blur-xl transform scale-[0.98] translate-y-3"></div>
              <div className="relative bg-surface-container-lowest rounded-2xl md:rounded-3xl p-2 md:p-3 shadow-xl overflow-hidden border border-surface-variant/40">
                <img
                  alt="Indian students studying around a laptop in bright classroom"
                  className="w-full aspect-[16/9] md:aspect-[21/10] object-cover rounded-xl md:rounded-2xl"
                  src={cms.hero?.bannerImages?.[0] || '/assets/images/classroom_students_group.png'}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/images/classroom_students_group.png';
                  }}
                />
                <div className="absolute bottom-6 left-6 hidden md:flex items-center gap-space-sm bg-surface-container-lowest/95 backdrop-blur-md px-space-md py-space-xs rounded-full shadow-sm">
                  <span className="material-symbols-outlined text-secondary text-title-md">psychology</span>
                  <span className="font-body-sm text-xs text-primary-container font-semibold">
                    Live Interactive Cognitive Batches • Satara HQ & Pune Hubs
                  </span>
                </div>
              </div>
            </div>

            {/* Single Unified Professional Student Portal Showcase Card */}
            <div className="w-full max-w-4xl mt-10">
              <div className="relative rounded-3xl p-6 sm:p-8 bg-white/95 backdrop-blur-2xl border border-blue-100 shadow-[0_16px_40px_rgba(0,82,255,0.06)] flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
                <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-blue-100/40 via-indigo-50/20 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

                <div className="flex items-start gap-4 text-left">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-[#0052FF] flex items-center justify-center shrink-0 shadow-2xs">
                    <span className="material-symbols-outlined text-[26px]">school</span>
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200/60 text-[11px] font-bold text-[#0052FF] mb-1.5">
                      <span>Unified Learning Hub</span>
                      <span>•</span>
                      <span>Web &amp; Mobile</span>
                    </div>
                    <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight">
                      MindMaster Digital Student Portal
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
                      Single login access for all your lectures, practice drills, and official study material across laptop, tablet, or phone.
                    </p>
                  </div>
                </div>

                <div className="shrink-0 w-full md:w-auto">
                  <a
                    href={getAppUrl('/login?next=/home')}
                    className="w-full md:w-auto px-7 py-3.5 rounded-full bg-[#0052FF] hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span>Enter Student Portal</span>
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </a>
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
        {cms.sectionVisibility?.heroStats !== false && (
          <section className="w-full bg-gradient-to-r from-[#0038B8] via-[#0052FF] to-[#0038B8] py-12 md:py-16 text-white border-y border-blue-400/40 shadow-xl shadow-[#0052FF]/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent_70%)] pointer-events-none"></div>
            <div className="max-w-6xl mx-auto px-gutter-mobile lg:px-gutter-desktop relative z-10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 text-center">
                {(cms.counters || []).map((c, idx) => (
                  <div
                    key={c.id}
                    className={`flex flex-col items-center justify-center p-3 ${
                      idx > 0 ? 'border-l border-white/20' : ''
                    }`}
                  >
                    <div className="font-['Poppins'] text-3xl sm:text-4xl md:text-5xl text-white tracking-tight font-extrabold drop-shadow-md">
                      {c.value}
                      {c.suffix}
                    </div>
                    <div className="font-body-sm text-xs sm:text-sm text-blue-100 mt-1.5 font-semibold uppercase tracking-wider">
                      {c.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Dynamic Flagship Courses & Upcoming Curriculum Section */}
        <section className="w-full bg-slate-50/80 py-20 px-gutter-mobile lg:px-gutter-desktop border-b border-slate-200/80">
          <div className="max-w-container-max mx-auto">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs font-bold mb-3">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span>Flagship Curriculum &amp; Upcoming Batches</span>
              </div>
              <h2 className="font-heading-bold text-3xl md:text-4xl text-slate-900 tracking-tight font-bold">
                Proven Programs Built for{' '}
                <span className="relative inline-block text-secondary">
                  Peak Performance
                  <svg aria-hidden="true" className="absolute -bottom-2 left-0 w-full text-secondary" fill="none" height="8" viewBox="0 0 160 8" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 6C45 2 110 2 158 6" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
                  </svg>
                </span>
              </h2>
              <p className="text-slate-600 text-sm max-w-xl mx-auto mt-2">
                Online digital courses, weekend offline workshops, and personalized coaching designed by Prashant Dhumal Sir.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {[
                {
                  code: 'MM-01',
                  title: 'Memory Technique Seminar',
                  subtitle: 'Cognitive Memory Techniques',
                  category: 'Memory Mastery',
                  duration: '4 Weeks • Online + Live',
                  target: 'Grade 4 to College Students',
                  desc: 'Peg systems, Story method & Roman Room (Memory Palace) for rapid formula, history, and syllabus memorization.',
                  imgPath: '/assets/images/memory_seminar_brain_3d.png',
                  icon: 'psychology',
                  topics: ['Loci Palace Method', 'Formula to Story Coding', 'Spaced Recall 1-7-30'],
                },
                {
                  code: 'MM-05',
                  title: 'Vedic Lightning Maths',
                  subtitle: 'Mental Speed Arithmetic',
                  category: 'Vedic Maths',
                  duration: '6 Weeks • Online + Live',
                  target: 'Grade 5 to UPSC CSAT Aspirants',
                  desc: '16 Vedic Sutras for fast mental multiplication, square roots, and calculation without scratch paper or calculators.',
                  imgPath: '/assets/images/vedic_maths_abacus_3d.png',
                  icon: 'calculate',
                  topics: ['Base Multiplication', 'Square Roots in 1 Sec', 'Mental Ratio & Percent'],
                },
                {
                  code: 'MM-03',
                  title: 'Police Bharti Fast Track',
                  subtitle: '100% Written Success Batch',
                  category: 'Competitive Exams',
                  duration: '12 Weeks • Comprehensive',
                  target: 'Maharashtra Police Aspirants (18-28)',
                  desc: 'Targeted Maharashtra GK memory pegs, IPC & CrPC important sections, and exam hall psychological composure.',
                  imgPath: '/assets/images/police_bharti_prep_3d.png',
                  icon: 'verified_user',
                  topics: ['Maharashtra Geography Pegs', 'IPC Section Matrices', 'Timed Mock Drills'],
                },
                {
                  code: 'MM-04',
                  title: '500-Year Calendar Technique',
                  subtitle: 'Mental Calendar Prodigy',
                  category: 'Speed Arithmetic',
                  duration: '2 Weeks • Prodigy',
                  target: 'All Ages (10 to 80 Years)',
                  desc: 'Determine the exact day of the week for any date from 1600 to 2100 in under 2 seconds mentally.',
                  imgPath: '/assets/images/superfast_calendar_3d.png',
                  icon: 'calendar_month',
                  topics: ['Century Modulo Codes', 'Leap Year Shortcut', 'Mental Day Extraction'],
                },
                {
                  code: 'MM-06',
                  title: 'School Foundation & Scholarship',
                  subtitle: 'Scholarship & NMMS Foundation',
                  category: 'School Foundation',
                  duration: '8 Weeks • Foundation',
                  target: '5th & 8th Scholarship, NMMS',
                  desc: 'Intelligence test pattern solving, Marathi/English vocabulary memory tools, and OMR speed time-budgeting.',
                  imgPath: '/assets/images/classroom_students_group.png',
                  icon: 'stars',
                  topics: ['Scholarship Buddhimatta', 'Language Peg Systems', 'OMR Speed Training'],
                },
              ].map((item) => {
                const liveMatch = liveDbCourses.find(
                  (c) => c.code.toUpperCase() === item.code.toUpperCase()
                );
                const isLive = Boolean(liveMatch);

                return (
                  <div
                    key={item.code}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                  >
                    <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                      <img
                        src={item.imgPath}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />
                      <div className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/95 text-secondary flex items-center justify-center shadow-md backdrop-blur-md">
                        <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                      </div>

                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        {isLive ? (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold shadow-sm flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            <span>LIVE</span>
                          </span>
                        ) : (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-extrabold shadow-sm">
                            🚀 Coming Soon
                          </span>
                        )}
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/90 text-slate-800 font-bold">
                          {item.code}
                        </span>
                      </div>

                      <div className="absolute bottom-2.5 left-3 right-3 flex justify-between items-end">
                        <span className="text-[11px] font-semibold text-sky-200 drop-shadow-sm">
                          {item.target}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/20 text-white backdrop-blur-md border border-white/30">
                          {item.duration}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold mb-1">
                          <span className="text-secondary font-bold uppercase tracking-wider">{item.category}</span>
                          <span>{item.subtitle}</span>
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900 group-hover:text-secondary transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                          {item.desc}
                        </p>

                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {item.topics.map((t, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <Link
                          to="/courses"
                          className="text-xs text-slate-600 hover:text-secondary font-bold flex items-center gap-1"
                        >
                          <span>Syllabus</span>
                          <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                        </Link>

                        {isLive ? (
                          <a
                            href={getAppCourseCheckoutUrl(item.code)}
                            className="px-4 py-2 rounded-full bg-secondary hover:bg-secondary-container text-white text-xs font-bold transition shadow-xs flex items-center gap-1"
                          >
                            <span>Enroll Now (₹{Math.round((liveMatch?.pricePaise || 99900) / 100)})</span>
                            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                          </a>
                        ) : (
                          <a
                            href={getWhatsAppPreBookUrl(item.title)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1 cursor-pointer active:scale-95"
                            title={`Pre-Book / Notify Me on WhatsApp for ${item.title}`}
                          >
                            <span className="material-symbols-outlined text-[14px]">notifications_active</span>
                            <span>🔔 Notify Me When Batch Starts</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center">
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-slate-50 text-slate-800 font-title-md text-xs sm:text-sm font-bold border border-slate-300 shadow-sm transition-all hover:border-secondary hover:text-secondary"
              >
                <span>View Full Syllabus for All Programs</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Founder Spotlight: Prashant Dhumal Sir */}
        <section className="w-full bg-white py-20 px-gutter-mobile lg:px-gutter-desktop border-b border-slate-200/80 overflow-hidden relative">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Executive Portrait Card */}
              <div className="lg:col-span-5 relative">
                <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600/20 via-secondary/15 to-amber-500/15 rounded-3xl blur-2xl transform -rotate-1 pointer-events-none" />
                <div className="relative rounded-3xl overflow-hidden border-2 border-slate-200/90 shadow-2xl bg-slate-900 group">
                  <img
                    src="/assets/images/prashant_dhumal_executive_portrait.png"
                    alt="Prashant Dhumal Sir — Founder & Memory Master, MindMaster Academy"
                    className="w-full aspect-[4/5] object-cover object-top group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  
                  <div className="absolute bottom-5 left-5 right-5 text-white">
                    <span className="px-3 py-1 rounded-full bg-secondary/90 text-white text-[10px] font-extrabold uppercase tracking-widest inline-block mb-1.5 backdrop-blur-md">
                      Founder &amp; Chief Coach
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      Prashant Dhumal Sir
                    </h3>
                    <p className="text-xs text-sky-200 font-medium">
                      International Memory Trainer, Vedic Maths Master &amp; Author
                    </p>
                  </div>
                </div>
              </div>

              {/* Bio & Credentials */}
              <div className="lg:col-span-7 flex flex-col gap-5">
                <div>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-secondary text-xs font-bold mb-3">
                    <span className="material-symbols-outlined text-sm">verified</span>
                    <span>10+ Years of Demonstrated Cognitive Mastery</span>
                  </div>
                  <h2 className="font-heading-bold text-3xl sm:text-4xl text-slate-900 font-black tracking-tight leading-tight">
                    "Any mind can be trained for extraordinary recall."
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
                    Prashant Dhumal Sir has dedicated over a decade to decoding how the human brain retains complex data. Rather than burdening students with tedious rote-learning, he equips them with scientific visual association pegs, Roman Room palaces, and 16 Vedic mathematical sutras.
                  </p>
                </div>

                {/* 3 Metric Badges */}
                <div className="grid grid-cols-3 gap-3 py-2 border-y border-slate-200/80">
                  <div className="text-center p-2.5 bg-slate-50 rounded-2xl border border-slate-200/60">
                    <div className="font-['Poppins'] text-2xl font-extrabold text-secondary">5,000+</div>
                    <div className="text-[11px] text-slate-600 font-semibold mt-0.5">Students Trained</div>
                  </div>
                  <div className="text-center p-2.5 bg-slate-50 rounded-2xl border border-slate-200/60">
                    <div className="font-['Poppins'] text-2xl font-extrabold text-amber-600">500+</div>
                    <div className="text-[11px] text-slate-600 font-semibold mt-0.5">Batches in Satara &amp; Pune</div>
                  </div>
                  <div className="text-center p-2.5 bg-slate-50 rounded-2xl border border-slate-200/60">
                    <div className="font-['Poppins'] text-2xl font-extrabold text-emerald-600">100%</div>
                    <div className="text-[11px] text-slate-600 font-semibold mt-0.5">Police Bharti Written</div>
                  </div>
                </div>

                <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 text-xs text-slate-700 leading-relaxed italic">
                  "Our mission is simple: eliminate academic stress, overcome exam blankouts, and empower Maharashtra's rural and urban students to top competitive merit lists with unwavering mental composure."
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href="https://wa.me/918459344077?text=Namaskar%20Prashant%20Sir%2C%20I%20would%20like%20to%20consult%20regarding%20MindMaster%20Academy%20batches."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <span>💬</span>
                    <span>Chat Directly with Prashant Sir on WhatsApp</span>
                  </a>
                  <Link
                    to="/about"
                    className="inline-flex items-center gap-1.5 px-5 py-3 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-300 transition-all"
                  >
                    <span>Read Full Founder Journey</span>
                    <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Real Results & Offline Centres Showcase */}
        <section className="w-full bg-gradient-to-b from-slate-50 to-white py-20 px-gutter-mobile lg:px-gutter-desktop border-b border-slate-200/80">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-secondary bg-blue-50 px-3 py-1 rounded-full border border-blue-100 inline-block mb-2">
                Unmatched Real Results Across Maharashtra
              </span>
              <h2 className="font-heading-bold text-3xl md:text-4xl text-slate-900 tracking-tight font-black">
                Proven Success in{' '}
                <span className="text-secondary">Police Bharti, MPSC &amp; Scholarships</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto mt-2">
                Live batch celebrations and merit ranks from our Satara Flagship HQ and Pune Hubs.
              </p>
            </div>

            {/* Results Photo Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {/* Photo 1: Police Bharti */}
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all group">
                <div className="relative h-64 sm:h-72 w-full overflow-hidden">
                  <img
                    src="/assets/images/police_bharti_celebration.jpg"
                    alt="Maharashtra Police Bharti written clearance celebration at MindMaster Academy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  <span className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-emerald-600 text-white font-extrabold text-[11px] shadow-md uppercase tracking-wider">
                    100% Written Clearance
                  </span>
                  {/* Interactive Play Button */}
                  <button
                    type="button"
                    onClick={() =>
                      setModalData({
                        isOpen: true,
                        title: 'Police Bharti Selection Celebration Interview',
                        studentName: 'Akash More & Cadets',
                        rankBadge: 'SELECTED • 100% WRITTEN SCORE',
                        category: 'Police Bharti',
                        location: 'Satara / Nashik Centre',
                        batchYear: 'Batch of 2025',
                        quote:
                          'The physical training calmness under Sagar Sir and rapid GK anchoring gave me 100% written test marks in Maharashtra Police Bharti.',
                        posterImg: '/assets/images/police_bharti_celebration.jpg',
                        videoDuration: '2:14',
                        marksheetScore: '100% Written Test Marks • 1st In District',
                        keyTakeaway: 'Pegging System for Maharashtra IPC Codes & Current Affairs',
                        onClose: () => setModalData(null),
                      })
                    }
                    className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-white/90 hover:bg-white text-secondary flex items-center justify-center shadow-xl backdrop-blur-md hover:scale-110 active:scale-95 transition-all cursor-pointer z-10"
                    title="Watch Police Bharti Celebration Video"
                    aria-label="Play Police Bharti Celebration Video"
                  >
                    <span className="material-symbols-outlined text-3xl ml-1 text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
                      play_arrow
                    </span>
                  </button>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-1.5 group-hover:text-secondary transition-colors">
                    Maharashtra Police Bharti Selection Celebration
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    MindMaster cadets securing postings across Pune, Satara, Mumbai, and Kolhapur Police after mastering high-speed General Knowledge recall and IPC section matrices.
                  </p>
                  <div className="flex items-center justify-between">
                    <Link
                      to="/results?category=police"
                      className="text-xs font-bold text-secondary flex items-center gap-1 hover:underline"
                    >
                      <span>View all Police Bharti rankers &amp; marks</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() =>
                        setModalData({
                          isOpen: true,
                          title: 'Police Bharti Selection Celebration Interview',
                          studentName: 'Akash More & Cadets',
                          rankBadge: 'SELECTED • 100% WRITTEN SCORE',
                          category: 'Police Bharti',
                          location: 'Satara / Nashik Centre',
                          batchYear: 'Batch of 2025',
                          quote:
                            'The physical training calmness under Sagar Sir and rapid GK anchoring gave me 100% written test marks in Maharashtra Police Bharti.',
                          posterImg: '/assets/images/police_bharti_celebration.jpg',
                          videoDuration: '2:14',
                          marksheetScore: '100% Written Test Marks • 1st In District',
                          keyTakeaway: 'Pegging System for Maharashtra IPC Codes & Current Affairs',
                          onClose: () => setModalData(null),
                        })
                      }
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">play_circle</span>
                      <span>Watch Story</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Photo 2: MPSC & State Scholarship */}
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all group">
                <div className="relative h-64 sm:h-72 w-full overflow-hidden">
                  <img
                    src="/assets/images/mpsc_merit_topper.jpg"
                    alt="MPSC and State Scholarship Merit Rankers trained by Prashant Dhumal Sir"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  <span className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-blue-600 text-white font-extrabold text-[11px] shadow-md uppercase tracking-wider">
                    State Merit Rankers
                  </span>
                  {/* Interactive Play Button */}
                  <button
                    type="button"
                    onClick={() =>
                      setModalData({
                        isOpen: true,
                        title: 'MPSC State Rank 12 Merit Interview',
                        studentName: 'Pooja Deshmukh',
                        rankBadge: 'MPSC STATE RANK 12',
                        category: 'MPSC & State Services',
                        location: 'Nashik Centre',
                        batchYear: 'Batch of 2024',
                        quote:
                          "MindMaster's memory palace and 1-7-30 spaced recall routine transformed my 6-hour revision into 45 minutes. What felt impossible in MPSC became second nature.",
                        posterImg: '/assets/images/mpsc_merit_topper.jpg',
                        videoDuration: '1:48',
                        marksheetScore: 'Rank 12 State Merit • 96% Written Score',
                        keyTakeaway: '3D Memory Palace for Constitution Articles & Spaced Revision',
                        onClose: () => setModalData(null),
                      })
                    }
                    className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-white/90 hover:bg-white text-secondary flex items-center justify-center shadow-xl backdrop-blur-md hover:scale-110 active:scale-95 transition-all cursor-pointer z-10"
                    title="Watch Pooja Deshmukh's Story"
                    aria-label="Play MPSC Ranker Story Video"
                  >
                    <span className="material-symbols-outlined text-3xl ml-1 text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
                      play_arrow
                    </span>
                  </button>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-1.5 group-hover:text-secondary transition-colors">
                    MPSC, NTSE &amp; 5th/8th State Scholarship Toppers
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    School and competitive examination toppers achieving 90%+ percentile through associative pegging, Vedic calculations, and timed mock tests.
                  </p>
                  <div className="flex items-center justify-between">
                    <Link
                      to="/results?category=mpsc"
                      className="text-xs font-bold text-secondary flex items-center gap-1 hover:underline"
                    >
                      <span>Explore State Scholarship &amp; MPSC results</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() =>
                        setModalData({
                          isOpen: true,
                          title: 'MPSC State Rank 12 Merit Interview',
                          studentName: 'Pooja Deshmukh',
                          rankBadge: 'MPSC STATE RANK 12',
                          category: 'MPSC & State Services',
                          location: 'Nashik Centre',
                          batchYear: 'Batch of 2024',
                          quote:
                            "MindMaster's memory palace and 1-7-30 spaced recall routine transformed my 6-hour revision into 45 minutes. What felt impossible in MPSC became second nature.",
                          posterImg: '/assets/images/mpsc_merit_topper.jpg',
                          videoDuration: '1:48',
                          marksheetScore: 'Rank 12 State Merit • 96% Written Score',
                          keyTakeaway: '3D Memory Palace for Constitution Articles & Spaced Revision',
                          onClose: () => setModalData(null),
                        })
                      }
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">play_circle</span>
                      <span>Watch Story</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Offline Centres Strip: Satara & Pune */}
            <div className="bg-white rounded-3xl border-2 border-blue-100 p-6 sm:p-8 shadow-sm">
              <div className="text-center max-w-xl mx-auto mb-6">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-secondary bg-blue-50 px-3 py-1 rounded-full border border-blue-100 inline-block mb-1.5">
                  Classroom Offline Centres
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Join In-Person Classroom Batches in Satara &amp; Pune
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Experience live interactive drills, hands-on memory assessment, and one-on-one feedback with Prashant Sir.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-extrabold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                        FLAGSHIP HQ
                      </span>
                      <span className="text-[11px] text-slate-500 font-semibold">Satara Center</span>
                    </div>
                    <h4 className="font-bold text-base text-slate-900">Satara Academy HQ</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Powai Naka, Near Radhika Road, Satara, Maharashtra 415001.
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Weekend intensive batches • Grade 4 to UPSC aspirants.
                    </p>
                  </div>
                  <a
                    href="https://wa.me/918459344077?text=Namaskar%20Prashant%20Sir%2C%20I%20would%20like%20to%20visit%20the%20Satara%20HQ%20centre."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-secondary hover:underline flex items-center gap-1"
                  >
                    <span>Visit Satara Centre / Book Free Demo</span>
                    <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                  </a>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-extrabold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                        COACHING HUB
                      </span>
                      <span className="text-[11px] text-slate-500 font-semibold">Pune Center</span>
                    </div>
                    <h4 className="font-bold text-base text-slate-900">Pune Coaching Hub</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Narayan Peth / FC Road Area, Pune, Maharashtra 411030.
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Special Police Bharti &amp; Competitive Exam sprint batches.
                    </p>
                  </div>
                  <a
                    href="https://wa.me/918459344077?text=Namaskar%20Prashant%20Sir%2C%20I%20would%20like%20to%20inquire%20about%20the%20Pune%20batches."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-secondary hover:underline flex items-center gap-1"
                  >
                    <span>Inquire for Pune Batches</span>
                    <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                  </a>
                </div>
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
                  to="/brain-games?game=calendar"
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
                  to="/brain-games?game=vedic"
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
                  to="/brain-games?game=memory"
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
                  to="/brain-games?game=agility"
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
                    100% Free • Works directly in browser • English & Marathi Bilingual Support
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

        {/* Dynamic FAQs Section */}
        {cms.sectionVisibility?.faqSection !== false && (cms.faqs || []).length > 0 && (
          <section className="w-full bg-slate-50 py-16 px-gutter-mobile lg:px-gutter-desktop border-b border-slate-200">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-10">
                <span className="font-label-caps text-xs text-secondary font-bold uppercase tracking-widest block mb-1">
                  FREQUENTLY ASKED QUESTIONS
                </span>
                <h2 className="font-headline-lg text-2xl sm:text-3xl text-slate-900 font-extrabold">
                  Everything You Need to Know
                </h2>
              </div>
              <div className="space-y-3.5">
                {cms.faqs.map((faq) => (
                  <details
                    key={faq.id}
                    className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs open:border-blue-400 transition-all cursor-pointer"
                  >
                    <summary className="flex items-center justify-between font-bold text-slate-900 text-sm list-none select-none">
                      <span className="flex items-center gap-2">
                        <span className="text-[#0052FF]">Q.</span>
                        <span>{faq.question}</span>
                      </span>
                      <span className="material-symbols-outlined text-slate-400 group-open:rotate-180 transition-transform">
                        expand_more
                      </span>
                    </summary>
                    <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed pl-6 border-l-2 border-blue-100">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        )}

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

      {/* Promotional Entry & Admissions Popup Modal */}
      {showPromoPopup && cms.promoPopup?.enabled && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="relative bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            <button
              onClick={() => setShowPromoPopup(false)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-700 flex items-center justify-center font-bold text-sm shadow-md"
              aria-label="Close popup"
            >
              ✕
            </button>
            {cms.promoPopup.imageUrl && (
              <div className="w-full h-44 bg-gradient-to-r from-blue-600 to-indigo-700 overflow-hidden relative">
                <img
                  src={cms.promoPopup.imageUrl}
                  alt={cms.promoPopup.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/images/police_bharti_prep_3d.png';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <span className="absolute bottom-3 left-4 px-2.5 py-0.5 rounded-full bg-amber-400 text-black text-[10px] font-black uppercase tracking-wider">
                  Special Admissions
                </span>
              </div>
            )}
            <div className="p-6 text-center space-y-3">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                {cms.promoPopup.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {cms.promoPopup.subtitle}
              </p>
              <div className="pt-2 flex flex-col gap-2">
                <a
                  href={cms.promoPopup.ctaUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setShowPromoPopup(false)}
                  className="w-full py-3 px-5 rounded-2xl bg-[#0052FF] hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <span>💬</span>
                  <span>{cms.promoPopup.ctaText || 'Reserve Seat on WhatsApp'}</span>
                </a>
                <button
                  type="button"
                  onClick={() => setShowPromoPopup(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-semibold py-1"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {modalData && <VideoModal {...modalData} />}
    </main>
  );
};
