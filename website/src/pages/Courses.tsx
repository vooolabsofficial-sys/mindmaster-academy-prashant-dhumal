import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SyllabusModal, CourseSyllabusData } from '../components/SyllabusModal';
import { getAppUrl, getAppCourseCheckoutUrl } from '../config/appConfig';

const COURSES_DATA: CourseSyllabusData[] = [
  {
    id: 'mm-01',
    code: 'MM-01',
    title: 'Memory Technique Seminar',
    badge: 'FLAGSHIP SEMINAR',
    duration: '4 Weeks • Online + Classroom',
    audience: 'Students Grade 4–10',
    description: 'Master mnemonics, speed recall & associative pegging techniques for rapid syllabus mastery and complete exam confidence.',
    examFocus: 'School Exams, 5th & 8th Scholarship, NMMS, NTSE',
    pdfDownloadName: 'MindMaster_MM01_Memory_Technique_Syllabus',
    includedKits: [
      'MindMaster 100-Word Associative Peg Chart',
      'Visual Journey Method Flashcards (Set of 50)',
      '1-7-30 Spaced Repetition Study Planner Diary',
      'Audio Recall Drill Pack (Marathi + English)'
    ],
    curriculum: [
      {
        week: 'Week 1',
        title: 'Foundations of Visual Indexing',
        topics: [
          'Right-brain visual associations vs rote memorization',
          'The 20-Number Rhyme System for sequential recall',
          'Eliminating exam anxiety through rhythmic anchoring'
        ]
      },
      {
        week: 'Week 2',
        title: 'The Roman Room (Memory Palace) Architecture',
        topics: [
          'Constructing your first 25-point personal memory palace',
          'Storing history dates, geographical maps, and science diagrams',
          'Speed recall tests: Reproducing 30 items backwards and forwards'
        ]
      },
      {
        week: 'Week 3',
        title: 'Formula & Nomenclature Mastery',
        topics: [
          'Converting abstract algebraic formulas into vivid stories',
          'Chemistry periodic table and biology classifications',
          'Mind mapping chapter summaries on one single page'
        ]
      },
      {
        week: 'Week 4',
        title: 'Exam Hall Temperament & Timed Recall',
        topics: [
          '1-7-30 Spaced revision protocol for lifelong retention',
          'Simulated 60-minute mock examination under pressure',
          'Graduation ceremony and personal student cognitive profile report'
        ]
      }
    ]
  },
  {
    id: 'mm-02',
    code: 'MM-02',
    title: 'Train the Trainer',
    badge: 'EDUCATOR DIPLOMA',
    duration: '8 Weeks • Online + Classroom',
    audience: 'Educators, Coaches & Aspirant Trainers',
    description: 'Comprehensive pedagogical certification to teach cognitive acceleration, memory systems, and mental math workshops professionally.',
    examFocus: 'Educators, Academy Founders, School Teachers',
    pdfDownloadName: 'MindMaster_MM02_Train_The_Trainer_Syllabus',
    includedKits: [
      'Complete 40-Hour Classroom Teaching Slide Decks',
      'Student Assessment & Diagnostic Score Software License',
      'Authorized MindMaster Academy Trainer Certificate',
      'Marketing & School Seminar Outreach Blueprint'
    ],
    curriculum: [
      {
        week: 'Weeks 1–2',
        title: 'Advanced Cognitive Psychology & Neuroplasticity',
        topics: [
          'Understanding learning modalities in children and adult aspirants',
          'Mastering complex peg systems up to 1,000 items',
          'Diagnostic evaluation of student memory bottlenecks'
        ]
      },
      {
        week: 'Weeks 3–4',
        title: 'Classroom Delivery & Demonstration Excellence',
        topics: [
          'Executing the signature 40-item live recall challenge onstage',
          'Interactive student engagement and gamified memory drills',
          'Handling parent consultations and academic queries'
        ]
      },
      {
        week: 'Weeks 5–6',
        title: 'Curriculum Management & Teaching Kits',
        topics: [
          'Structuring 4-week, 8-week, and weekend intensive batches',
          'Evaluating student progress sheets and error logs',
          'Conducting teacher-parent review conferences'
        ]
      },
      {
        week: 'Weeks 7–8',
        title: 'Business Execution & Academy Setup',
        topics: [
          'Hosting high-converting school demo workshops',
          'Practical teaching practicum supervised by Sagar Dhumal',
          'Final written viva, live demo exam, and convocation ceremony'
        ]
      }
    ]
  },
  {
    id: 'mm-03',
    code: 'MM-03',
    title: 'Police Bharti 100% Prep',
    badge: '100% WRITTEN SUCCESS',
    duration: '12 Weeks • Online + Classroom',
    audience: 'Aspirants Age 18–28',
    description: 'Specialized memory routines for high-speed syllabus recall, Maharashtra GK memorization, IPC codes, and physical exam calmness.',
    examFocus: 'Maharashtra Police Constable, SRPF, Driver & Jail Sipahi',
    pdfDownloadName: 'MindMaster_MM03_Police_Bharti_Prep_Syllabus',
    includedKits: [
      'Complete Maharashtra GK & History Memory Codes Book',
      '500 IPC & CrPC Important Sections Pegging Matrix',
      'Mental Composure Audio Drills for Physical Ground Rounds',
      '15 Full-Length Timed Mock Question Paper Sets'
    ],
    curriculum: [
      {
        week: 'Weeks 1–3',
        title: 'Maharashtra GK & Administrative Geography',
        topics: [
          'District-wise rivers, dams, sanctuaries and historical forts',
          'Maharashtra administrative divisions & cabinet portfolios',
          'Speed MCQ anchoring: answering 100 questions in 50 minutes'
        ]
      },
      {
        week: 'Weeks 4–6',
        title: 'Police Administration & Law Sections',
        topics: [
          'Essential Indian Penal Code & Police Act memorization',
          'Constitution of India basic rights and state executive powers',
          'Current affairs calendar: 12 months in 12 mental rooms'
        ]
      },
      {
        week: 'Weeks 7–9',
        title: 'Mathematical Reasoning & Marathi Grammar Shortcuts',
        topics: [
          'Vedic arithmetic shortcuts for quick ratio, percentage & time-distance',
          'Marathi Vyakaran rules, Samas, and Sandhi memory pegs',
          'Error analysis and negative marking reduction strategies'
        ]
      },
      {
        week: 'Weeks 10–12',
        title: 'Ground Composure & Final Exam Simulation',
        topics: [
          'Synchronizing physical stamina with psychological calm',
          '5 full-length real-time simulated exams under strict exam timers',
          'One-on-one personal interview and physical exam briefing with Sagar Sir'
        ]
      }
    ]
  },
  {
    id: 'mm-04',
    code: 'MM-04',
    title: 'Superfast Calendar Technique',
    badge: 'MENTAL CALENDAR PRODIGY',
    duration: '2 Weeks • Online + Classroom',
    audience: 'All Ages 10–80',
    description: 'Calculate the day of the week for any date in past or future history between 1900 and 2100 in under 3 seconds mentally.',
    examFocus: 'Mental Arithmetic, CSAT, Banking Aptitude, Olympiads',
    pdfDownloadName: 'MindMaster_MM04_Superfast_Calendar_Syllabus',
    includedKits: [
      'Century Code & Month Index Pocket Reference Card',
      'Leap Year Fast-Calculation Dial',
      'Mental Speed Drills Audio Workbook'
    ],
    curriculum: [
      {
        week: 'Week 1',
        title: 'Century & Month Numerical Anchoring',
        topics: [
          'The 7-Day modular arithmetic system explained simply',
          'Remembering century codes (1900s, 2000s, 2100s) with story pegs',
          'Leap year exceptions: February 29 calculation shortcuts'
        ]
      },
      {
        week: 'Week 2',
        title: 'The 3-Second Mental Calculation Protocol',
        topics: [
          'Combining date, month code, and year remainder in 2 seconds',
          'Live speed-drill challenge: answering 20 random dates in 60 seconds',
          'Applications in competitive exam reasoning sections'
        ]
      }
    ]
  },
  {
    id: 'mm-05',
    code: 'MM-05',
    title: 'Vedic Maths',
    badge: 'SPEED ARITHMETIC',
    duration: '6 Weeks • Online + Classroom',
    audience: 'Grade 5 to UPSC Aspirants',
    description: 'Lightning-fast mental arithmetic shortcuts without scratch paper for school syllabus calculations and competitive exams.',
    examFocus: 'Scholarship, NTSE, MHT-CET, MPSC, UPSC CSAT, Banking',
    pdfDownloadName: 'MindMaster_MM05_Vedic_Maths_Syllabus',
    includedKits: [
      '16 Vedic Sutras & 13 Sub-Sutras Illustrated Handbook',
      'Mental Multiplication & Square Root Fast Tables',
      '500 Practical Practice Worksheets with Answer Key'
    ],
    curriculum: [
      {
        week: 'Weeks 1–2',
        title: 'Base Multiplication & Complement Sutras',
        topics: [
          'Nikhilam Navatashcaramam Dashatah (All from 9, last from 10)',
          'Multiplying numbers close to base 10, 100, 1000 in 2 seconds',
          'Instant subtraction from 10,000 without borrowing steps'
        ]
      },
      {
        week: 'Weeks 3–4',
        title: 'Universal Multiplication & Squaring',
        topics: [
          'Urdhva Tiryagbhyam (Vertically & Crosswise) for any 2x2 and 3x3 numbers',
          'Finding squares of numbers ending in 5 in 1 second',
          'Fast mental cubing and percentage calculations'
        ]
      },
      {
        week: 'Weeks 5–6',
        title: 'Square Roots, Cube Roots & Algebraic Shortcuts',
        topics: [
          'Instant mental extraction of perfect cube roots in 1 second',
          'Square roots of non-perfect squares to two decimal places',
          'Solving linear equations mentally and competitive time-saving strategies'
        ]
      }
    ]
  }
];

export const Courses: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawCat = searchParams.get('category') || searchParams.get('filter') || 'all';
  const initialCategory = ['all', 'school', 'police', 'maths', 'trainer'].includes(rawCat)
    ? (rawCat as 'all' | 'school' | 'police' | 'maths' | 'trainer')
    : 'all';

  const [selectedCourseForSyllabus, setSelectedCourseForSyllabus] = useState<CourseSyllabusData | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'school' | 'police' | 'maths' | 'trainer'>(initialCategory);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  useEffect(() => {
    const cat = searchParams.get('category') || searchParams.get('filter');
    if (cat && ['all', 'school', 'police', 'maths', 'trainer'].includes(cat)) {
      setCategoryFilter(cat as any);
    }
  }, [searchParams]);

  // 60-Second Course Finder Wizard State
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [wizardGoal, setWizardGoal] = useState<string>('school');
  const [wizardGrade, setWizardGrade] = useState<string>('school-kid');
  const [wizardFormat, setWizardFormat] = useState<string>('hybrid');

  const filteredCourses = COURSES_DATA.filter((course) => {
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'school') return course.id === 'mm-01' || course.id === 'mm-05';
    if (categoryFilter === 'police') return course.id === 'mm-03';
    if (categoryFilter === 'maths') return course.id === 'mm-04' || course.id === 'mm-05';
    if (categoryFilter === 'trainer') return course.id === 'mm-02';
    return true;
  });

  const handleFreeDownload = (resourceName: string, fileName: string) => {
    const textContent = `MINDMASTER ACADEMY — FREE STUDY RESOURCE\n\nTitle: ${resourceName}\nAuthor: Sagar Dhumal\nWebsite: http://localhost:3000\nHelpline: +91 84593 44077\n\nEnjoy this high-value cognitive acceleration guide from MindMaster Academy!`;
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
    if (wizardGoal === 'police') {
      return {
        title: 'Police Bharti 100% Prep',
        code: 'MM-03',
        duration: '12 Weeks',
        reason: 'Specialized for high-yield GK retention, law sections, and physical endurance mental composure.',
        courseId: 'mm-03'
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
              Practical memory systems, competitive GK retention, Vedic arithmetic, and certified coach training created by Sagar Dhumal.
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
                All 5 Programmes
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
                onClick={() => setCategoryFilter('police')}
                className={`px-4 py-2 rounded-full text-xs font-title-md transition-all cursor-pointer ${
                  categoryFilter === 'police'
                    ? 'bg-secondary text-on-secondary shadow-md font-bold'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                Police Bharti & Competitive
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-xl mb-space-xl">
              {filteredCourses.map((course) => {
                let imgPath = '/assets/images/memory_seminar_brain_3d.png';
                let icon = 'psychology';
                if (course.id === 'mm-02') {
                  imgPath = '/assets/images/train_the_trainer_3d.png';
                  icon = 'school';
                } else if (course.id === 'mm-03') {
                  imgPath = '/assets/images/police_bharti_prep_3d.png';
                  icon = 'verified_user';
                } else if (course.id === 'mm-04') {
                  imgPath = '/assets/images/superfast_calendar_3d.png';
                  icon = 'calendar_month';
                } else if (course.id === 'mm-05') {
                  imgPath = '/assets/images/vedic_maths_abacus_3d.png';
                  icon = 'calculate';
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
                      <span className="absolute top-3 right-3 font-label-caps text-xs px-space-sm py-1 bg-surface-container-lowest/90 text-primary-container rounded-full shadow-md backdrop-blur-md font-bold">
                        {course.code}
                      </span>
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
                            SD
                          </div>
                          <span className="font-title-md text-xs font-semibold text-primary-container">
                            Sagar Dhumal
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedCourseForSyllabus(course)}
                            className="px-3 py-1.5 rounded-full font-title-md text-xs text-secondary border border-secondary/40 hover:bg-secondary-fixed/40 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[14px]">description</span>
                            Syllabus PDF
                          </button>
                          <a
                            href={getAppCourseCheckoutUrl(course.id)}
                            className="font-title-md text-xs text-on-secondary bg-secondary px-3.5 py-1.5 rounded-full hover:bg-secondary-container transition-all shadow-xs flex items-center gap-1 font-bold"
                            title={`Enroll in ${course.title} & Open App`}
                          >
                            <span>Enroll</span>
                            <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
                          onClick={() => { setWizardGrade('aspirant'); setWizardGoal('police'); }}
                          className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                            wizardGrade === 'aspirant'
                              ? 'border-2 border-secondary bg-secondary/5 shadow-xs'
                              : 'border-surface-variant bg-surface-container-low hover:bg-surface-container'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-secondary mb-2 shadow-xs">
                            <span className="material-symbols-outlined">local_police</span>
                          </div>
                          <span className="font-title-md text-sm font-bold text-primary-container block">Competitive Aspirant (18–28)</span>
                          <span className="text-xs text-on-surface-variant mt-1 block">Police Bharti, MPSC, Banking GK</span>
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
                          onClick={() => setWizardGoal('police')}
                          className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                            wizardGoal === 'police'
                              ? 'border-2 border-secondary bg-secondary/5 shadow-xs'
                              : 'border-surface-variant bg-surface-container-low hover:bg-surface-container'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-secondary mb-2 shadow-xs">
                            <span className="material-symbols-outlined">military_tech</span>
                          </div>
                          <span className="font-title-md text-sm font-bold text-primary-container block">Crack Competitive Recruitment</span>
                          <span className="text-xs text-on-surface-variant mt-1 block">100% written clearance in Police / MPSC</span>
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
                Handy cognitive acceleration templates and foundational guides created by Sagar Dhumal.
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
