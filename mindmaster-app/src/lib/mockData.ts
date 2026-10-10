import { Course, Lesson, Book, Note } from "./types";

export const MOCK_COURSES: Course[] = [
  {
    id: "c-mm-01",
    code: "MM-01",
    title: "Memory Technique Seminar",
    titleMr: "Memory Science & Brain Mastery",
    subtitle: "World-class techniques to remember data, figures, and textbooks in one reading",
    description: "20+ years of research by Prashant Dhumal Sir! Boost memory 10x, eliminate forgetfulness permanently. Highly practical video course for school students, competitive aspirants, and professionals.",
    headerTint: "sky",
    pricePaise: 99900, // ₹999
    originalPricePaise: 299900, // ₹2,999
    isFree: false,
    accessMonths: 3,
    status: "live",
    badgeText: "Most Popular",
    badgeType: "bestseller",
    imageSrc: "/assets/images/memory_seminar_brain_3d.png",
    instructorName: "Prashant Dhumal Sir",
    instructorTitle: "International Memory Trainer & Author",
    totalStudents: 14250,
    rating: 4.9,
    ratingCount: 2310,
    lessonsCount: 18,
    totalDurationHours: 12.5,
    category: "memory",
    features: [
      "18 High-Definition Practical Video Lectures",
      "Complete Digital Memory Handbook & Mind Maps (PDF)",
      "Self-Practice Quizzes After Every Lesson",
      "3 Months Unlimited Access & Mobile App Support",
      "Official E-Certificate of Completion"
    ],
    standards: [5, 6, 7, 8, 9, 10, 11, 12]
  },
  {
    id: "c-mm-02",
    code: "MM-02",
    title: "Train the Trainer",
    titleMr: "Train the Trainer Certification",
    subtitle: "Professional training to become a certified memory coach and launch your own workshops",
    description: "Learn the art of memory coaching directly from Prashant Dhumal Sir. Complete guidance on conducting seminars, stage speaking, student psychology, and building a coaching career.",
    headerTint: "pink",
    pricePaise: 499900, // ₹4,999
    originalPricePaise: 999900, // ₹9,999
    isFree: false,
    accessMonths: 3,
    status: "live",
    badgeText: "Certification Batch",
    badgeType: "bestseller",
    imageSrc: "/assets/images/train_the_trainer_3d.png",
    instructorName: "Prashant Dhumal Sir",
    instructorTitle: "Founder, MindMaster Academy",
    totalStudents: 3200,
    rating: 5.0,
    ratingCount: 890,
    lessonsCount: 20,
    totalDurationHours: 18.0,
    category: "memory",
    features: [
      "20 Comprehensive Professional Video Lectures",
      "Trainer Toolkit, Presentation Slides & Study Materials",
      "Live Q&A Sessions & Business Model Blueprints",
      "Official Train the Trainer E-Certification"
    ]
  },
  {
    id: "c-mm-03",
    code: "MM-03",
    title: "Police Bharti 100% Prep",
    titleMr: "Police Bharti 100% Prep: Maths & Reasoning",
    subtitle: "High-scoring shortcut tricks and 10-year question bank analysis",
    description: "Arithmetic, mental ability, and general knowledge simplified for Maharashtra Police Bharti, Talathi, and Saralseva exams. Formula-free problem solving under exam time constraints.",
    headerTint: "peach",
    pricePaise: 129900, // ₹1,299
    originalPricePaise: 399900, // ₹3,999
    isFree: false,
    accessMonths: 3,
    status: "live",
    badgeText: "Recruitment Special",
    badgeType: "bestseller",
    imageSrc: "/assets/images/police_bharti_prep_3d.png",
    instructorName: "Prashant Dhumal Sir",
    instructorTitle: "Competitive Exam Mentor",
    totalStudents: 19800,
    rating: 5.0,
    ratingCount: 3420,
    lessonsCount: 24,
    totalDurationHours: 20.0,
    category: "police",
    features: [
      "24 In-Depth Video Lectures (Maths + Reasoning)",
      "20 Practice Question Papers with Detailed Explanations (PDF)",
      "Previous 10 Years Police Bharti Paper Trend Analysis",
      "3 Months Unlimited Viewing Access"
    ]
  },
  {
    id: "c-mm-04",
    code: "MM-04",
    title: "Superfast Calendar Technique",
    titleMr: "500-Year Calendar Technique in 2 Seconds",
    subtitle: "Tell the day of the week for any date in history instantly in your head",
    description: "Learn the amazing mental math technique to calculate any day from 1600 to 2100 in 2 seconds without looking at a calendar. Build stage confidence and conquer math anxiety!",
    headerTint: "lavender",
    pricePaise: 49900, // ₹499
    originalPricePaise: 149900, // ₹1,499
    isFree: false,
    accessMonths: 3,
    status: "live",
    badgeText: "Speed Trick",
    badgeType: "popular",
    imageSrc: "/assets/images/superfast_calendar_3d.png",
    instructorName: "Prashant Dhumal Sir",
    instructorTitle: "Memory Record Holder",
    totalStudents: 8900,
    rating: 4.8,
    ratingCount: 1140,
    lessonsCount: 10,
    totalDurationHours: 6.0,
    category: "calendar",
    features: [
      "10 Easy Step-by-Step Video Lessons",
      "Century and Month Code Formula Cheatsheets",
      "Live Drill Practice Session Recordings",
      "3 Months Unlimited Access"
    ],
    standards: [5, 6, 7, 8, 9, 10, 11, 12]
  },
  {
    id: "c-mm-05",
    code: "MM-05",
    title: "Vedic Maths",
    titleMr: "Vedic Maths: Faster Than a Calculator",
    subtitle: "Master 16 ancient sutras for lightning-fast multiplication, division, and roots",
    description: "Save critical time in board exams, scholarships, and competitive aptitude tests. Learn to multiply and divide large numbers mentally without using pencil and paper.",
    headerTint: "mint",
    pricePaise: 79900, // ₹799
    originalPricePaise: 249900, // ₹2,499
    isFree: false,
    accessMonths: 3,
    status: "live",
    badgeText: "Student Special",
    badgeType: "popular",
    imageSrc: "/assets/images/vedic_maths_abacus_3d.png",
    instructorName: "Sagar Dhumal Sir",
    instructorTitle: "Vedic Maths Specialist",
    totalStudents: 11200,
    rating: 4.9,
    ratingCount: 1850,
    lessonsCount: 16,
    totalDurationHours: 11.0,
    category: "vedic",
    features: [
      "Practical Application of 16 Ancient Vedic Sutras",
      "Workbooks & 200+ Solved Practice Problems (PDF)",
      "Speed Calculation Shortcuts & Mental Proofs",
      "3 Months Validity"
    ],
    standards: [5, 6, 7, 8, 9, 10, 11, 12]
  }
];

export const COURSE_ID_MAP: Record<string, string> = {
  "c-mm-01": "11111111-1111-1111-1111-111111111101",
  "c-mm-02": "11111111-1111-1111-1111-111111111102",
  "c-mm-03": "11111111-1111-1111-1111-111111111103",
  "c-mm-04": "11111111-1111-1111-1111-111111111104",
  "c-mm-05": "11111111-1111-1111-1111-111111111105",
};

export const MOCK_LESSONS: Lesson[] = [
  // MM-01 (2 Free + 1 Locked)
  {
    id: "les-mm01-01",
    courseId: "c-mm-01",
    title: "01. Introduction to Memory Science & Core Principles",
    durationSec: 1260,
    isFree: true,
    videoType: "youtube",
    videoId: "M7lc1UVf-VE",
    position: 1,
    description: "Left brain vs. right brain dynamics, power of creative imagination, and sensory visualization."
  },
  {
    id: "les-mm01-02",
    courseId: "c-mm-01",
    title: "02. The Association Method & Imagination Techniques",
    durationSec: 1480,
    isFree: true,
    videoType: "youtube",
    videoId: "kJQP7kiw5Fk",
    position: 2,
    description: "Connecting two unfamiliar objects with humorous mental anchors for permanent recall."
  },
  {
    id: "les-mm01-03",
    courseId: "c-mm-01",
    title: "03. Chaining Method & Memorizing Long Serial Lists",
    durationSec: 1650,
    isFree: false,
    videoType: "youtube",
    videoId: "9bZkp7q19f0",
    position: 3,
    description: "Memorizing lists of 50+ words forwards and backwards with zero hesitation."
  },

  // MM-02 (2 Free + 1 Locked)
  {
    id: "les-mm02-01",
    courseId: "c-mm-02",
    title: "01. Foundations of a Trainer & Stage Confidence",
    durationSec: 1500,
    isFree: true,
    videoType: "youtube",
    videoId: "M7lc1UVf-VE",
    position: 1,
    description: "Overcoming stage fright, voice projection, and commanding audience engagement."
  },
  {
    id: "les-mm02-02",
    courseId: "c-mm-02",
    title: "02. Pedagogy: Teaching Memory to Young Students",
    durationSec: 1800,
    isFree: true,
    videoType: "youtube",
    videoId: "kJQP7kiw5Fk",
    position: 2,
    description: "Tailoring memory games and techniques for school children vs. competitive exam aspirants."
  },
  {
    id: "les-mm02-03",
    courseId: "c-mm-02",
    title: "03. Organizing Professional Seminars & Business Models",
    durationSec: 2100,
    isFree: false,
    videoType: "youtube",
    videoId: "9bZkp7q19f0",
    position: 3,
    description: "Marketing workshops, hall bookings, school outreach, and enrollment conversion."
  },

  // MM-03 (2 Free + 1 Locked)
  {
    id: "les-mm03-01",
    courseId: "c-mm-03",
    title: "01. Police Bharti Paper Pattern & Arithmetic Weightage",
    durationSec: 1320,
    isFree: true,
    videoType: "youtube",
    videoId: "M7lc1UVf-VE",
    position: 1,
    description: "Analysis of past question papers and high-yield scoring topics for recruitment."
  },
  {
    id: "les-mm03-02",
    courseId: "c-mm-03",
    title: "02. Number Classification & Rapid Multiplication",
    durationSec: 1600,
    isFree: true,
    videoType: "youtube",
    videoId: "kJQP7kiw5Fk",
    position: 2,
    description: "Prime, twin prime, triangular numbers, and instant calculation tricks."
  },
  {
    id: "les-mm03-03",
    courseId: "c-mm-03",
    title: "03. Age, Ratio & Proportion Shortcut Formulas",
    durationSec: 1750,
    isFree: false,
    videoType: "youtube",
    videoId: "9bZkp7q19f0",
    position: 3,
    description: "Solving complex age word problems mentally without writing long equations."
  },

  // MM-04 (2 Free + 1 Locked)
  {
    id: "les-mm04-01",
    courseId: "c-mm-04",
    title: "01. Memorizing Century Codes in 1 Minute",
    durationSec: 980,
    isFree: true,
    videoType: "youtube",
    videoId: "M7lc1UVf-VE",
    position: 1,
    description: "Learn the code pegs for years 1600 through 2100 using a fun mnemonic rhyme."
  },
  {
    id: "les-mm04-02",
    courseId: "c-mm-04",
    title: "02. 12 Month Codes & The Musical Rhythm",
    durationSec: 1120,
    isFree: true,
    videoType: "youtube",
    videoId: "kJQP7kiw5Fk",
    position: 2,
    description: "Memorize January to December numeric codes using an easy rhythmic jingle."
  },
  {
    id: "les-mm04-03",
    courseId: "c-mm-04",
    title: "03. Calculating Any Day of the Week in 2 Seconds",
    durationSec: 1400,
    isFree: false,
    videoType: "youtube",
    videoId: "9bZkp7q19f0",
    position: 3,
    description: "Final combined formula, leap year adjustments, and rapid stage demonstration."
  },

  // MM-05 (2 Free + 1 Locked)
  {
    id: "les-mm05-01",
    courseId: "c-mm-05",
    title: "01. Ekadhikena Purvena Sutra (Square Tricks)",
    durationSec: 1150,
    isFree: true,
    videoType: "youtube",
    videoId: "M7lc1UVf-VE",
    position: 1,
    description: "Square numbers ending in 5 mentally in under 2 seconds."
  },
  {
    id: "les-mm05-02",
    courseId: "c-mm-05",
    title: "02. Nikhilam Navatashcaramam - Base Multiplication",
    durationSec: 1380,
    isFree: true,
    videoType: "youtube",
    videoId: "kJQP7kiw5Fk",
    position: 2,
    description: "Multiplying large numbers close to 10, 100, and 1000 in a single step."
  },
  {
    id: "les-mm05-03",
    courseId: "c-mm-05",
    title: "03. Urdhva Tiryagbhyam - 2 & 3 Digit Cross-Math",
    durationSec: 1540,
    isFree: false,
    videoType: "youtube",
    videoId: "9bZkp7q19f0",
    position: 3,
    description: "Crosswise multiplication for any 2-digit or 3-digit numbers in one line."
  }
];

export const MOCK_BOOKS: Book[] = [
  {
    id: "bk-01",
    courseId: "c-mm-01",
    courseTitle: "Memory Science & Brain Mastery",
    title: "MindMaster Complete Memory Handbook & Practice Notes (PDF)",
    filePath: "/assets/docs/memory_handbook_marathi.pdf",
    pages: 128,
    fileSizeMb: 14.5,
    coverImage: "/assets/images/student_mindmaps_notebook.png"
  },
  {
    id: "bk-02",
    courseId: "c-mm-04",
    courseTitle: "Calendar Masterclass",
    title: "500-Year Calendar Formula Booklet & Charts (PDF)",
    filePath: "/assets/docs/calendar_formula_booklet.pdf",
    pages: 42,
    fileSizeMb: 5.2,
    coverImage: "/assets/images/student_calendar_maths.png"
  },
  {
    id: "bk-03",
    courseId: "c-mm-05",
    courseTitle: "Vedic Maths",
    title: "Vedic Maths 16 Sutras & 200+ Solved Examples (PDF)",
    filePath: "/assets/docs/vedic_maths_workbook.pdf",
    pages: 184,
    fileSizeMb: 22.0,
    coverImage: "/assets/images/student_mental_vedic_maths.png"
  },
  {
    id: "bk-04",
    courseId: "c-mm-03",
    courseTitle: "Police Bharti Special Batch",
    title: "Police Bharti 10-Year Question Bank & Shortcut Guides (PDF)",
    filePath: "/assets/docs/police_bharti_question_bank.pdf",
    pages: 256,
    fileSizeMb: 35.8,
    coverImage: "/assets/images/police_bharti_aspirant.png"
  }
];

export const MOCK_NOTES: Note[] = [
  {
    id: "note-01",
    userId: "user-1",
    courseId: "c-mm-01",
    courseCode: "MM-01",
    courseTitle: "Memory Science & Brain Mastery",
    lessonId: "les-mm01-01",
    lessonTitle: "01. Introduction to Memory Science & Core Principles",
    wordCount: 42,
    maxWordsAllowed: 300,
    timestampSec: 200,
    title: "Left Brain vs Right Brain Synergy",
    body: "Left brain handles logic and words, right brain captures spatial pictures and vivid colors. When we associate facts with funny 3D pictures and dynamic emotions, memory retention becomes effortless and permanent.",
    updatedAt: "2 hours ago"
  },
  {
    id: "note-02",
    userId: "user-1",
    courseId: "c-mm-01",
    courseCode: "MM-01",
    courseTitle: "Memory Science & Brain Mastery",
    lessonId: "les-mm01-02",
    lessonTitle: "02. The Association Method & Imagination Techniques",
    wordCount: 35,
    maxWordsAllowed: 300,
    timestampSec: 360,
    title: "Peg System Anchors 1 to 10",
    body: "1 = Sun, 2 = Shoe, 3 = Tree, 4 = Door, 5 = Knife. Linked 10 key biology classifications to these visual pegs for rapid recall during board exam revision.",
    updatedAt: "Today"
  },
  {
    id: "note-03",
    userId: "user-1",
    courseId: "c-mm-05",
    courseCode: "MM-05",
    courseTitle: "High-Scoring Mathematics & Vedic Maths",
    lessonId: "les-mm05-01",
    lessonTitle: "01. Ekadhikena Purvena Sutra (Square Tricks)",
    wordCount: 48,
    maxWordsAllowed: 300,
    timestampSec: 240,
    title: "Ekadhikena Purvena: Instant Squaring",
    body: "For numbers ending in 5: To calculate 65², take 6 and multiply by the next integer 7 = 42. Append 25 at the end = 4225! Works in 1 second for 15, 25, 35, 45, 75, 85, 95, 105.",
    updatedAt: "Yesterday"
  },
  {
    id: "note-04",
    userId: "user-1",
    courseId: "c-mm-05",
    courseCode: "MM-05",
    courseTitle: "High-Scoring Mathematics & Vedic Maths",
    lessonId: "les-mm05-02",
    lessonTitle: "02. Nikhilam Navatashcaramam - Base Multiplication",
    wordCount: 44,
    maxWordsAllowed: 300,
    timestampSec: 300,
    title: "Nikhilam Base 100 Multiplication",
    body: "Multiplying 98 x 97: Deficits from 100 are -2 and -3. Cross-subtract: 98 - 3 = 95. Multiply deficits: (-2) x (-3) = 06. Answer is 9506 in one simple mental step without paper!",
    updatedAt: "2 days ago"
  },
  {
    id: "note-05",
    userId: "user-1",
    courseId: "c-mm-04",
    courseCode: "MM-04",
    courseTitle: "Master The Calendar Technique",
    lessonId: "les-mm04-01",
    lessonTitle: "01. The Magic of Dates: Core Mechanism & Demo",
    wordCount: 38,
    maxWordsAllowed: 200,
    timestampSec: 180,
    title: "Century Codes 400-Year Cycle",
    body: "1600s = 6, 1700s = 4, 1800s = 2, 1900s = 0, 2000s = 6. Code sequence is always 6, 4, 2, 0. Mastered the 2000 century dates in under 2 seconds during drill practice!",
    updatedAt: "3 days ago"
  }
];
