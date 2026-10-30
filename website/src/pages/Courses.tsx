import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SyllabusModal, CourseSyllabusData } from '../components/SyllabusModal';
import {
  getAppUrl,
  getAppCourseCheckoutUrl,
  fetchLiveCoursesFromApp,
  LiveDbCourse,
  getWhatsAppPreBookUrl,
} from '../config/appConfig';

const COURSES_DATA: CourseSyllabusData[] = [];
export const Courses: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawCat = searchParams.get('category') || searchParams.get('filter') || 'all';
  const initialCategory = ['all', 'school', 'maths', 'trainer'].includes(rawCat)
    ? (rawCat as 'all' | 'school' | 'maths' | 'trainer')
    : 'all';

  const [selectedCourseForSyllabus, setSelectedCourseForSyllabus] = useState<CourseSyllabusData | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'school' | 'maths' | 'trainer'>(initialCategory);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);
  const [liveDbCourses, setLiveDbCourses] = useState<LiveDbCourse[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetchLiveCoursesFromApp().then((courses) => {
      if (isMounted) setLiveDbCourses(courses);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const cat = searchParams.get('category') || searchParams.get('filter');
    if (cat && ['all', 'school', 'maths', 'trainer'].includes(cat)) {
      setCategoryFilter(cat as any);
    }
  }, [searchParams]);

  // 60-Second Course Finder Wizard State
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [wizardGoal, setWizardGoal] = useState<string>('school');
  const [wizardGrade, setWizardGrade] = useState<string>('school-kid');
  const [wizardFormat, setWizardFormat] = useState<string>('hybrid');

  const coursesToDisplay: CourseSyllabusData[] = liveDbCourses.map((lc) => ({
    id: lc.id || lc.code.toLowerCase(),
    code: lc.code,
    title: lc.title,
    badge: 'CERTIFIED PROGRAM',
    duration: `${lc.accessMonths || 6} Months Access • Online`,
    audience: 'Students & Aspirants',
    description: lc.description || 'MindMaster Academy certified video curriculum by Prashant Dhumal Sir.',
    examFocus: 'Cognitive Skills & Academic Excellence',
    pdfDownloadName: `MindMaster_${lc.code}_Syllabus`,
    includedKits: [
      'Comprehensive HD Video Lectures',
      'Downloadable Study Notes & Practice Material',
      'Dedicated Doubt Resolution Support'
    ],
    curriculum: [
      {
        week: 'Module 1',
        title: 'Core Foundations & Mental Frameworks',
        topics: ['Scientific principles & conceptual grounding', 'Memory anchoring techniques']
      },
      {
        week: 'Module 2',
        title: 'Advanced Applications & Speed Mastery',
        topics: ['Timed recall exercises', 'Exam-hall temperament conditioning']
      }
    ]
  }));

  const filteredCourses = coursesToDisplay.filter((course) => {
    if (categoryFilter === 'all') return true;
    const txt = `${course.title} ${course.description} ${course.code}`.toLowerCase();
    if (categoryFilter === 'school') return /school|grade|विद्यार्थी|शालेय/i.test(txt);
    if (categoryFilter === 'maths') return /math|calculation|गणित/i.test(txt);
    if (categoryFilter === 'trainer') return /trainer|teacher|सर्टिफिकेशन/i.test(txt);
    return true;
  });

  const handleFreeDownload = (resourceName: string, fileName: string) => {
    const webOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://mindmasteracademy.in';
    const textContent = `MINDMASTER ACADEMY — FREE STUDY RESOURCE\n\nTitle: ${resourceName}\nMentor: Prashant Dhumal Sir\nWebsite: ${webOrigin}\nHelpline: +91 84593 44077\n\nEnjoy this high-value cognitive acceleration guide from MindMaster Academy!`;
    const element = document.createElement('a');
    const file = new Blob([textContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${fileName}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    setDownloadToast(`"${resourceName}" downloaded successfully!`);
    setTimeout(() => setDownloadToast(null), 4000);
  };

  // Compute live recommendation for wizard
  const getRecommendation = () => {
    if (wizardGoal === 'trainer') {
      return {
        title: 'Train the Trainer Certification',
        code: 'MM-02',
        duration: '8 Weeks',
        reason: 'Tailored for educators and coaching professionals who want to launch verified memory workshops.',
        courseId: 'mm-02'
      };
    }
    if (wizardGoal === 'calendar') {
      return {
        title: '500-Year Calendar Technique',
        code: 'MM-04',
        duration: '4 Weeks',
        reason: 'Master instant calendar day calculations for any date across 500 years in under 3 seconds.',
        courseId: 'mm-04'
      };
    }
    if (wizardGoal === 'maths') {
      return {
        title: 'Vedic Maths & Speed Arithmetic',
        code: 'MM-05',
        duration: '6 Weeks',
        reason: 'Ideal for eliminating arithmetic calculation time and securing top scores in competitive exams.',
        courseId: 'mm-05'
      };
    }
    return {
      title: 'Memory Technique Seminar',
      code: 'MM-01',
      duration: '4 Weeks',
      reason: 'Perfect for building photographic memory, long-term syllabus retention, and top exam confidence.',
      courseId: 'mm-01'
    };
  };

  const currentRec = getRecommendation();

  return (
    <main className="w-full pt-24 sm:pt-28 bg-background min-h-screen">
      <div className="flex flex-col w-full">
        {/* Hero Section */}
        <section className="w-full relative overflow-hidden bg-surface-bright py-space-2xl md:py-space-3xl border-b border-surface-variant/40">
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[640px] h-[360px] bg-secondary-fixed opacity-40 blur-[130px] rounded-full"></div>
          </div>
          <div className="max-w-container-max mx-auto px-gutter-desktop relative z-10 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-space-xs px-space-md py-1.5 rounded-full bg-surface-container-lowest shadow-xs mb-space-md">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span className="font-label-caps text-xs text-primary-container tracking-wider uppercase font-bold">
                5 VERIFIED PROGRAMMES • AGE 10 TO 80
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg md:text-display-hero text-primary-container max-w-3xl mb-space-md leading-tight">
              Five programmes. One{' '}
              <span className="relative inline-block text-primary-container whitespace-nowrap">
                sharper mind.
                <svg
                  className="absolute -bottom-2 left-0 w-full overflow-visible text-secondary"
                  fill="none"
                  height="12"
                  viewBox="0 0 260 14"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M3 9.5C64.5 2.5 174.5 1.5 257 11" stroke="currentColor" strokeLinecap="round" strokeWidth="4" />
                </svg>
              </span>
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
              Practical memory systems, competitive GK retention, Vedic arithmetic, and certified coach training created by Prashant Dhumal Sir.
            </p>

            {/* Course Category Filter Pills */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center mt-8">
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={`px-4 py-2 rounded-full text-xs font-title-md transition-all cursor-pointer ${
                  categoryFilter === 'all'
                    ? 'bg-secondary text-on-secondary shadow-md font-bold'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                All Programs
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('school')}
                className={`px-4 py-2 rounded-full text-xs font-title-md transition-all cursor-pointer ${
                  categoryFilter === 'school'
                    ? 'bg-secondary text-on-secondary shadow-md font-bold'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                School Students (Grade 4–10)
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('maths')}
                className={`px-4 py-2 rounded-full text-xs font-title-md transition-all cursor-pointer ${
                  categoryFilter === 'maths'
                    ? 'bg-secondary text-on-secondary shadow-md font-bold'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                Speed Maths & Calendar
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('trainer')}
                className={`px-4 py-2 rounded-full text-xs font-title-md transition-all cursor-pointer ${
                  categoryFilter === 'trainer'
                    ? 'bg-secondary text-on-secondary shadow-md font-bold'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                Trainer Certification
              </button>
            </div>
          </div>
        </section>

        {/* Course Cards Grid */}
        <section className="w-full bg-surface-container-low py-space-3xl">
          <div className="max-w-container-max mx-auto px-gutter-desktop">
            {filteredCourses.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-3xl p-8 md:p-12 border border-surface-variant/80 shadow-sm text-center flex flex-col items-center justify-center max-w-2xl mx-auto my-4 animate-fadeIn">
                <div className="w-16 h-16 rounded-3xl bg-blue-100/80 text-secondary flex items-center justify-center mb-4 shadow-inner">
                  <span className="material-symbols-outlined text-3xl">school</span>
                </div>
                <span className="px-3.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wider mb-2">
                  🚀 Batches Launching Soon
                </span>
                <h3 className="text-xl md:text-2xl font-extrabold text-primary-container tracking-tight">
                  New Certified Courses Launching Soon!
                </h3>
                <p className="text-xs md:text-sm text-on-surface-variant max-w-lg mt-2 mb-6 leading-relaxed">
                  Prashant Sir's official training curriculum, video masterclasses, and certified study modules are being uploaded. Contact us to pre-book and receive admission details.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <a
                    href="https://wa.me/918459344077?text=Namaskar%20Prashant%20Sir%2C%20please%20notify%20me%20when%20the%20new%20MindMaster%20batches%20open."
                    target="_blank"
                    rel="noreferrer"
                    className="px-6 py-3 bg-secondary hover:bg-blue-700 text-white font-extrabold text-xs rounded-full shadow-md shadow-blue-500/20 inline-flex items-center gap-2 transition cursor-pointer"
                  >
                    <span>💬</span>
                    <span>Pre-Book on WhatsApp</span>
                  </a>
                  <a
                    href="tel:+918459344077"
                    className="px-5 py-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs rounded-full shadow-2xs inline-flex items-center gap-1.5 transition"
                  >
                    <span>📞 +91 84593 44077</span>
                  </a>
                </div>
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-xl mb-space-xl">
              {filteredCourses.map((course) => {
                const liveMatch = liveDbCourses.find(
                  (lc) => lc.code.toUpperCase() === course.code.toUpperCase() || lc.id === course.id
                );
                const isLive = Boolean(liveMatch);

                let imgPath = '/assets/images/memory_seminar_brain_3d.png';
                let icon = 'psychology';
                if (course.id === 'mm-02') {
                  imgPath = '/assets/images/train_the_trainer_3d.png';
                  icon = 'school';
                } else if (course.id === 'mm-04') {
                  imgPath = '/assets/images/superfast_calendar_3d.png';
                  icon = 'calendar_month';
                } else if (course.id === 'mm-05') {
                  imgPath = '/assets/images/vedic_maths_abacus_3d.png';
                  icon = 'calculate';
                } else if (course.id === 'mm-06') {
                  imgPath = '/assets/images/classroom_students_group.png';
                  icon = 'stars';
                }

                return (
                  <div
                    key={course.id}
                    className="bg-surface-container-lowest rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden group border border-surface-variant/60"
                  >
                    <div className="relative h-48 w-full overflow-hidden">
                      <img
                        src={imgPath}
                        alt={course.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-black/20"></div>
                      <div className="absolute top-3 left-3 w-10 h-10 rounded-full flex items-center justify-center text-primary-container shadow-md backdrop-blur-md bg-white/90">
                        <span className="material-symbols-outlined text-[22px]">{icon}</span>
                      </div>
                      
                      {/* Status / Code Badges */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        {isLive ? (
                          <span className="font-label-caps text-[10px] px-2.5 py-1 bg-emerald-600 text-white rounded-full shadow-md font-extrabold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                            <span>LIVE</span>
                          </span>
                        ) : (
                          <span className="font-label-caps text-[10px] px-2.5 py-1 bg-amber-500 text-slate-950 rounded-full shadow-md font-extrabold flex items-center gap-1">
                            <span>🚀 Coming Soon</span>
                          </span>
                        )}
                        <span className="font-label-caps text-xs px-2.5 py-1 bg-surface-container-lowest/90 text-primary-container rounded-full shadow-md backdrop-blur-md font-bold">
                          {course.code}
                        </span>
                      </div>
                    </div>

                    <div className="p-space-lg flex flex-col flex-grow justify-between space-y-4">
                      <div>
                        <h2 className="font-headline-sm text-xl text-primary-container mb-space-xs group-hover:text-secondary transition-colors font-bold">
                          {course.title}
                        </h2>
                        <p className="font-body-sm text-sm text-on-surface-variant mb-space-md leading-relaxed">
                          {course.description}
                        </p>

                        <div className="flex flex-wrap gap-1.5 mb-space-md">
                          {course.curriculum.slice(0, 3).map((curr, idx) => (
                            <span
                              key={idx}
                              className="font-label-regular text-[11px] px-2.5 py-1 bg-surface-container text-primary-container rounded-full font-medium"
                            >
                              {curr.title}
                            </span>
                          ))}
                        </div>

                        <div className="font-label-regular text-xs text-on-surface-variant bg-surface-bright p-2.5 rounded-xl text-center border border-surface-variant/40">
                          {course.duration}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-space-md border-t border-surface-variant/40">
                        <div className="flex items-center gap-space-xs">
                          <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-title-md text-xs font-bold">
                            PD
                          </div>
                          <span className="font-title-md text-xs font-semibold text-primary-container">
                            Prashant Dhumal Sir
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedCourseForSyllabus(course)}
                            className="px-3 py-1.5 rounded-full font-title-md text-xs text-secondary border border-secondary/40 hover:bg-secondary-fixed/40 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[14px]">description</span>
                            Syllabus
                          </button>

                          {isLive ? (
                            <a
                              href={getAppCourseCheckoutUrl(course.code)}
                              className="font-title-md text-xs text-on-secondary bg-secondary px-3.5 py-1.5 rounded-full hover:bg-secondary-container transition-all shadow-xs flex items-center gap-1 font-bold"
                              title={`Enroll in ${course.title} & Open App`}
                            >
                              <span>Enroll (₹{Math.round((liveMatch?.pricePaise || 99900) / 100)})</span>
                              <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                            </a>
                          ) : (
                            <a
                              href={getWhatsAppPreBookUrl(course.title)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-title-md text-xs text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 rounded-full transition-all shadow-xs flex items-center gap-1 font-bold cursor-pointer active:scale-95"
                              title={`Pre-Book / Notify Me on WhatsApp for ${course.title}`}
                            >
                              <span className="material-symbols-outlined text-[14px]">notifications_active</span>
                              <span>🔔 Notify Me When Batch Starts</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>
        </section>

        {/* Interactive 60-Second Course Finder */}
        <section className="w-full bg-surface-bright py-space-3xl relative border-y border-surface-variant/50">
          <div className="max-w-container-max mx-auto px-gutter-desktop">
            <div className="text-center mb-space-2xl">
              <h2 className="font-headline-lg text-headline-lg md:text-3xl text-primary-container mb-space-xs font-bold">
                Not sure? Find your course in{' '}
                <span className="relative inline-block whitespace-nowrap text-secondary">
                  60 seconds.
                  <svg
                    className="absolute -bottom-1 left-0 w-full overflow-visible text-secondary"
                    fill="none"
                    height="8"
                    viewBox="0 0 160 8"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M2 5.5C40 2.5 110 2 158 6" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
                  </svg>
                </span>
              </h2>
              <p className="text-sm text-on-surface-variant mt-2">
                Answer 3 quick questions and get an instant syllabus match tailored to your goals.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-stretch">
              {/* Wizard Interactive Form */}
              <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl p-space-xl shadow-md flex flex-col justify-between border border-surface-variant/50">
                <div>
                  <div className="flex items-center justify-between mb-space-md">
                    <span className="font-label-caps text-xs text-on-surface-variant font-bold">
                      STEP {wizardStep} OF 3
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-3 h-3 rounded-full ${wizardStep >= 1 ? 'bg-secondary' : 'bg-surface-container-highest'}`}></span>
                      <span className={`w-3 h-3 rounded-full ${wizardStep >= 2 ? 'bg-secondary' : 'bg-surface-container-highest'}`}></span>
                      <span className={`w-3 h-3 rounded-full ${wizardStep >= 3 ? 'bg-secondary' : 'bg-surface-container-highest'}`}></span>
                    </div>
                  </div>

                  {/* Step 1 Content */}
                  {wizardStep === 1 && (
                    <div className="space-y-4 animate-fadeIn">
                      <h3 className="font-headline-md text-xl sm:text-2xl text-primary-container font-bold">
                        1. What is your current academic stage?
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => { setWizardGrade('school-kid'); setWizardGoal('school'); }}
                          className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                            wizardGrade === 'school-kid'
                              ? 'border-2 border-secondary bg-secondary/5 shadow-xs'
                              : 'border-surface-variant bg-surface-container-low hover:bg-surface-container'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-secondary mb-2 shadow-xs">
                            <span className="material-symbols-outlined">school</span>
                          </div>
                          <span className="font-title-md text-sm font-bold text-primary-container block">School Student (Grade 4–10)</span>
                          <span className="text-xs text-on-surface-variant mt-1 block">Scholarship, Board Exams, Olympiad</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => { setWizardGrade('aspirant'); setWizardGoal('calendar'); }}
                          className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                            wizardGrade === 'aspirant'
                              ? 'border-2 border-secondary bg-secondary/5 shadow-xs'
                              : 'border-surface-variant bg-surface-container-low hover:bg-surface-container'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-secondary mb-2 shadow-xs">
                            <span className="material-symbols-outlined">school</span>
                          </div>
                          <span className="font-title-md text-sm font-bold text-primary-container block">College &amp; Degree Student</span>
                          <span className="text-xs text-on-surface-variant mt-1 block">College, MPSC Foundation &amp; Fast Revision</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => { setWizardGrade('maths-seeker'); setWizardGoal('maths'); }}
                          className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                            wizardGrade === 'maths-seeker'
                              ? 'border-2 border-secondary bg-secondary/5 shadow-xs'
                              : 'border-surface-variant bg-surface-container-low hover:bg-surface-container'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-secondary mb-2 shadow-xs">
                            <span className="material-symbols-outlined">calculate</span>
                          </div>
                          <span className="font-title-md text-sm font-bold text-primary-container block">Maths Speed Enquirer</span>
                          <span className="text-xs text-on-surface-variant mt-1 block">Vedic Maths, Mental Calendar, Arithmetic</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => { setWizardGrade('educator'); setWizardGoal('trainer'); }}
                          className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                            wizardGrade === 'educator'
                              ? 'border-2 border-secondary bg-secondary/5 shadow-xs'
                              : 'border-surface-variant bg-surface-container-low hover:bg-surface-container'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-secondary mb-2 shadow-xs">
                            <span className="material-symbols-outlined">co_present</span>
                          </div>
                          <span className="font-title-md text-sm font-bold text-primary-container block">Educator or Career Coach</span>
                          <span className="text-xs text-on-surface-variant mt-1 block">Train the Trainer certification license</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2 Content */}
                  {wizardStep === 2 && (
                    <div className="space-y-4 animate-fadeIn">
                      <h3 className="font-headline-md text-xl sm:text-2xl text-primary-container font-bold">
                        2. What is your primary learning goal?
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setWizardGoal('school')}
                          className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                            wizardGoal === 'school'
                              ? 'border-2 border-secondary bg-secondary/5 shadow-xs'
                              : 'border-surface-variant bg-surface-container-low hover:bg-surface-container'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-secondary mb-2 shadow-xs">
                            <span className="material-symbols-outlined">menu_book</span>
                          </div>
                          <span className="font-title-md text-sm font-bold text-primary-container block">Long-term Memory & High Marks</span>
                          <span className="text-xs text-on-surface-variant mt-1 block">Memorize dates, formulas, answers without stress</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setWizardGoal('calendar')}
                          className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                            wizardGoal === 'calendar'
                              ? 'border-2 border-secondary bg-secondary/5 shadow-xs'
                              : 'border-surface-variant bg-surface-container-low hover:bg-surface-container'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-secondary mb-2 shadow-xs">
                            <span className="material-symbols-outlined">calendar_month</span>
                          </div>
                          <span className="font-title-md text-sm font-bold text-primary-container block">500-Year Superfast Calendar</span>
                          <span className="text-xs text-on-surface-variant mt-1 block">Calculate any day in under 3 seconds</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setWizardGoal('maths')}
                          className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                            wizardGoal === 'maths'
                              ? 'border-2 border-secondary bg-secondary/5 shadow-xs'
                              : 'border-surface-variant bg-surface-container-low hover:bg-surface-container'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-secondary mb-2 shadow-xs">
                            <span className="material-symbols-outlined">speed</span>
                          </div>
                          <span className="font-title-md text-sm font-bold text-primary-container block">Finish Calculations in Seconds</span>
                          <span className="text-xs text-on-surface-variant mt-1 block">Vedic sutras & paperless arithmetic speed</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setWizardGoal('trainer')}
                          className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                            wizardGoal === 'trainer'
                              ? 'border-2 border-secondary bg-secondary/5 shadow-xs'
                              : 'border-surface-variant bg-surface-container-low hover:bg-surface-container'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-secondary mb-2 shadow-xs">
                            <span className="material-symbols-outlined">workspace_premium</span>
                          </div>
                          <span className="font-title-md text-sm font-bold text-primary-container block">Start My Own Memory Institute</span>
                          <span className="text-xs text-on-surface-variant mt-1 block">Become a certified coach with student kits</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3 Content */}
                  {wizardStep === 3 && (
                    <div className="space-y-4 animate-fadeIn">
                      <h3 className="font-headline-md text-xl sm:text-2xl text-primary-container font-bold">
                        3. What is your preferred study format?
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setWizardFormat('hybrid')}
                          className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                            wizardFormat === 'hybrid'
                              ? 'border-2 border-secondary bg-secondary/5 shadow-xs'
                              : 'border-surface-variant bg-surface-container-low hover:bg-surface-container'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-secondary mb-2 shadow-xs">
                            <span className="material-symbols-outlined">devices</span>
                          </div>
                          <span className="font-title-md text-sm font-bold text-primary-container block">Online Live + Recorded Access</span>
                          <span className="text-xs text-on-surface-variant mt-1 block">Learn from home across Maharashtra</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setWizardFormat('classroom')}
                          className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                            wizardFormat === 'classroom'
                              ? 'border-2 border-secondary bg-secondary/5 shadow-xs'
                              : 'border-surface-variant bg-surface-container-low hover:bg-surface-container'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-secondary mb-2 shadow-xs">
                            <span className="material-symbols-outlined">apartment</span>
                          </div>
                          <span className="font-title-md text-sm font-bold text-primary-container block">Satara Flagship HQ or Pune Weekend Hub</span>
                          <span className="text-xs text-on-surface-variant mt-1 block">In-person intense drill batches</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="pt-6 border-t border-surface-variant/40 mt-6">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      disabled={wizardStep === 1}
                      onClick={() => setWizardStep((prev) => Math.max(1, prev - 1))}
                      className={`font-title-md text-xs sm:text-sm py-2 px-4 rounded-lg transition-colors ${
                        wizardStep === 1
                          ? 'text-on-surface-variant/40 cursor-not-allowed'
                          : 'text-primary-container hover:bg-surface-container'
                      }`}
                    >
                      ← Back
                    </button>

                    {wizardStep < 3 ? (
                      <button
                        type="button"
                        onClick={() => setWizardStep((prev) => Math.min(3, prev + 1))}
                        className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-secondary text-on-secondary font-title-md text-xs sm:text-sm hover:bg-secondary-container transition-all shadow-xs cursor-pointer"
                      >
                        <span>Next Step</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        Live Match Computed!
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Live Recommendation Output Box */}
              <div className="lg:col-span-5 bg-gradient-to-br from-secondary/10 via-surface-container-lowest to-surface-container-low rounded-2xl p-space-xl flex flex-col justify-between shadow-md border border-secondary/30 relative overflow-hidden">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-white mb-space-md shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                    <span className="font-label-caps text-[11px] tracking-wider uppercase font-bold">
                      98% MATCH RECOMMENDATION
                    </span>
                  </div>

                  <span className="font-label-caps text-xs text-secondary font-bold block">{currentRec.code}</span>
                  <h4 className="font-headline-sm text-2xl text-primary-container font-bold mb-space-xs mt-1">
                    {currentRec.title}
                  </h4>
                  <p className="font-body-md text-sm text-on-surface-variant mb-space-lg leading-relaxed">
                    {currentRec.reason}
                  </p>

                  <div className="bg-surface-container-lowest/90 rounded-xl p-space-md shadow-xs mb-space-lg space-y-2 font-body-sm text-xs text-primary-container border border-surface-variant/40">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-[16px]">schedule</span>
                      <span><strong>{currentRec.duration}</strong> Structured Track</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-[16px]">group</span>
                      <span><strong>5,000+</strong> Alumni Trained</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-[16px]">event</span>
                      <span>Batch starts <strong>This Upcoming Weekend</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-space-md">
                  <a
                    href={getAppCourseCheckoutUrl(currentRec.courseId)}
                    className="flex-1 inline-flex items-center justify-center px-4 py-3 rounded-full bg-secondary text-on-secondary font-title-md text-xs hover:bg-secondary-container transition-all text-center shadow-xs font-bold"
                  >
                    Enroll in App Portal →
                  </a>
                  <Link
                    to="/contact"
                    className="flex-1 inline-flex items-center justify-center px-4 py-3 rounded-full bg-surface-container-lowest text-primary-container font-title-md text-xs hover:bg-surface-container transition-all text-center shadow-xs border border-surface-variant"
                  >
                    Book Free Demo
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Free Starter Resources */}
        <section className="w-full bg-surface-container-lowest py-space-3xl">
          <div className="max-w-container-max mx-auto px-gutter-desktop">
            <div className="mb-space-2xl text-center md:text-left">
              <h2 className="font-headline-lg text-headline-lg text-primary-container mb-space-xs font-bold">
                Free tools to start today
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Handy cognitive acceleration templates and foundational guides created by Prashant Dhumal Sir.
              </p>
            </div>

            {/* Download Toast */}
            {downloadToast && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center gap-3 animate-fadeIn">
                <span className="material-symbols-outlined text-emerald-600 text-[22px]">cloud_done</span>
                <span>{downloadToast} Check your downloads folder.</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-xl">
              {/* Resource 1 */}
              <div className="bg-surface-bright rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden group border border-surface-variant/50">
                <div className="p-space-lg flex items-center justify-between">
                  <div className="w-10 h-10 rounded-full bg-surface-container-lowest/80 flex items-center justify-center text-primary-container shadow-xs">
                    <span className="material-symbols-outlined text-[22px]">description</span>
                  </div>
                  <span className="font-label-caps text-xs px-2.5 py-0.5 bg-surface-container-lowest/90 text-primary-container rounded-full font-bold">
                    RESOURCE
                  </span>
                </div>
                <div className="p-space-lg flex flex-col flex-grow justify-between space-y-4">
                  <div>
                    <h3 className="font-headline-sm text-lg text-primary-container mb-space-xs group-hover:text-secondary transition-colors font-bold">
                      Memory Starter Kit PDF
                    </h3>
                    <p className="font-body-sm text-xs text-on-surface-variant mb-space-md leading-relaxed">
                      The foundational 20-word peg system to memorize lists in order forwards and backwards in minutes.
                    </p>
                    <span className="font-label-regular text-[11px] px-2.5 py-1 bg-surface-container text-primary-container rounded-full font-medium">
                      PDF • Marathi + English
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleFreeDownload('Memory Starter Kit PDF', 'MindMaster_Memory_Starter_Kit')}
                    className="w-full inline-flex items-center justify-center gap-space-xs px-space-lg py-2.5 rounded-full bg-secondary text-on-secondary font-title-md text-xs hover:bg-secondary-container transition-all shadow-xs cursor-pointer"
                  >
                    <span>Download free ↓</span>
                  </button>
                </div>
              </div>

              {/* Resource 2 */}
              <div className="bg-surface-bright rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden group border border-surface-variant/50">
                <div className="p-space-lg flex items-center justify-between">
                  <div className="w-10 h-10 rounded-full bg-surface-container-lowest/80 flex items-center justify-center text-primary-container shadow-xs">
                    <span className="material-symbols-outlined text-[22px]">date_range</span>
                  </div>
                  <span className="font-label-caps text-xs px-2.5 py-0.5 bg-surface-container-lowest/90 text-primary-container rounded-full font-bold">
                    PLANNER
                  </span>
                </div>
                <div className="p-space-lg flex flex-col flex-grow justify-between space-y-4">
                  <div>
                    <h3 className="font-headline-sm text-lg text-primary-container mb-space-xs group-hover:text-secondary transition-colors font-bold">
                      30-Day Study Planner Template
                    </h3>
                    <p className="font-body-sm text-xs text-on-surface-variant mb-space-md leading-relaxed">
                      Cognitive spaced-repetition timetable designed for high retention during school and competitive exam revision.
                    </p>
                    <span className="font-label-regular text-[11px] px-2.5 py-1 bg-surface-container text-primary-container rounded-full font-medium">
                      PDF • Marathi + English
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleFreeDownload('30-Day Study Planner Template', 'MindMaster_30Day_Planner')}
                    className="w-full inline-flex items-center justify-center gap-space-xs px-space-lg py-2.5 rounded-full bg-secondary text-on-secondary font-title-md text-xs hover:bg-secondary-container transition-all shadow-xs cursor-pointer"
                  >
                    <span>Download free ↓</span>
                  </button>
                </div>
              </div>

              {/* Resource 3 */}
              <div className="bg-surface-bright rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden group border border-surface-variant/50">
                <div className="p-space-lg flex items-center justify-between">
                  <div className="w-10 h-10 rounded-full bg-surface-container-lowest/80 flex items-center justify-center text-primary-container shadow-xs">
                    <span className="material-symbols-outlined text-[22px]">calculate</span>
                  </div>
                  <span className="font-label-caps text-xs px-2.5 py-0.5 bg-surface-container-lowest/90 text-primary-container rounded-full font-bold">
                    CHEATSHEET
                  </span>
                </div>
                <div className="p-space-lg flex flex-col flex-grow justify-between space-y-4">
                  <div>
                    <h3 className="font-headline-sm text-lg text-primary-container mb-space-xs group-hover:text-secondary transition-colors font-bold">
                      Vedic Maths Speed Cheatsheet
                    </h3>
                    <p className="font-body-sm text-xs text-on-surface-variant mb-space-md leading-relaxed">
                      16 sutra shortcuts to multiply 3-digit numbers and square roots mentally in seconds without scratch paper.
                    </p>
                    <span className="font-label-regular text-[11px] px-2.5 py-1 bg-surface-container text-primary-container rounded-full font-medium">
                      PDF • Marathi + English
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleFreeDownload('Vedic Maths Speed Cheatsheet', 'MindMaster_Vedic_Maths_Cheatsheet')}
                    className="w-full inline-flex items-center justify-center gap-space-xs px-space-lg py-2.5 rounded-full bg-secondary text-on-secondary font-title-md text-xs hover:bg-secondary-container transition-all shadow-xs cursor-pointer"
                  >
                    <span>Download free ↓</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Contact Banner */}
        <section className="w-full bg-surface-bright py-space-2xl md:py-space-3xl">
          <div className="max-w-container-max mx-auto px-gutter-desktop">
            <div className="bg-secondary rounded-2xl p-space-2xl md:p-space-3xl relative overflow-hidden shadow-xl text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-space-xl">
              <div className="relative z-10 max-w-xl">
                <h2 className="font-headline-lg text-2xl sm:text-3xl text-on-secondary mb-space-xs font-bold">
                  Still choosing the right programme?
                </h2>
                <p className="font-body-lg text-sm sm:text-base text-on-secondary/90">
                  A senior academic counsellor will evaluate your student goals and map the ideal course in one 10-minute call.
                </p>
              </div>
              <div className="relative z-10 flex flex-col sm:flex-row items-center gap-space-md w-full md:w-auto">
                <a
                  className="w-full sm:w-auto inline-flex items-center justify-center px-space-xl py-3 rounded-full bg-surface-container-lowest text-secondary font-title-md text-xs sm:text-sm hover:bg-surface-bright transition-colors shadow-md"
                  href="https://wa.me/918459344077?text=Hello%20MindMaster%2C%20I%20need%20course%20guidance."
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp us
                </a>
                <a
                  className="w-full sm:w-auto inline-flex items-center justify-center px-space-xl py-3 rounded-full bg-surface-container-lowest/15 border border-white text-on-secondary font-title-md text-xs sm:text-sm hover:bg-surface-container-lowest/25 transition-colors shadow-xs"
                  href="tel:+918459344077"
                >
                  Call +91 84593 44077
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Syllabus Modal */}
      {selectedCourseForSyllabus && (
        <SyllabusModal
          isOpen={!!selectedCourseForSyllabus}
          onClose={() => setSelectedCourseForSyllabus(null)}
          course={selectedCourseForSyllabus}
        />
      )}
    </main>
  );
};
