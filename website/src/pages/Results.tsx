import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { VideoModal, VideoModalProps } from '../components/VideoModal';
import {
  fetchLiveWebsiteCms,
  WebsiteCmsData,
  DEFAULT_WEBSITE_CMS,
} from '../config/appConfig';

interface TestimonialItem {
  id: string;
  name: string;
  category: 'scholarship' | 'police' | 'mpsc' | 'vedic' | 'trainer';
  badge: string;
  quote: string;
  batch: string;
  location: string;
  image: string;
  scoreHighlight: string;
  fullStory: string;
  videoDuration?: string;
  keyTechnique: string;
}

const TESTIMONIALS: TestimonialItem[] = [
  {
    id: 'pooja-deshmukh',
    name: 'Pooja Deshmukh',
    category: 'mpsc',
    badge: 'MPSC STATE RANK 12',
    quote: 'MindMaster\'s memory palace and 1-7-30 spaced recall routine transformed my 6-hour revision into 45 minutes. What felt impossible in MPSC became second nature.',
    batch: 'Batch of 2024',
    location: 'Nashik Centre',
    image: '/assets/images/mpsc_merit_topper.jpg',
    scoreHighlight: 'Rank 12 State Merit • 96% Written Score',
    fullStory: 'Cleared MPSC Prelims and Mains with state merit. Memorized Indian Polity articles, history timelines, and Maharashtra geography data without confusion.',
    videoDuration: '1:48',
    keyTechnique: '3D Memory Palace for Constitution Articles & Spaced Revision'
  },
  {
    id: 'akash-more',
    name: 'Akash More',
    category: 'police',
    badge: 'SELECTED • POLICE BHARTI 2025',
    quote: 'The physical training calmness under Prashant Sir and rapid GK anchoring gave me 100% written test marks in Maharashtra Police Bharti.',
    batch: 'Batch of 2025',
    location: 'Nashik Centre',
    image: '/assets/images/akash_police_testimonial.png',
    scoreHighlight: '100% Written Test Marks • 1st In District',
    fullStory: 'Secured top rank in Nashik police recruitment. The mental conditioning kept heart rate steady during high-pressure physical endurance rounds.',
    videoDuration: '2:14',
    keyTechnique: 'Pegging System for Maharashtra IPC Codes & Current Affairs'
  },
  {
    id: 'snehal-kulkarni',
    name: 'Snehal Kulkarni',
    category: 'scholarship',
    badge: 'SCHOLARSHIP RANK 12',
    quote: 'I memorized 200 history dates and geographical charts in 2 days without any stress. My exam fear disappeared after week 2 of the seminar.',
    batch: 'Batch of 2024',
    location: 'Satara Centre',
    image: '/assets/images/student_mindmaps_notebook.png',
    scoreHighlight: '98.4% Marks • State Scholarship Holder',
    fullStory: 'Awarded Maharashtra State Government Scholarship in Grade 8. Uses color-coded associative mind maps for high school sciences.',
    videoDuration: '2:05',
    keyTechnique: 'Associative Pegging & Visual Journey Method'
  },
  {
    id: 'tanvi-patil',
    name: 'Tanvi Patil',
    category: 'vedic',
    badge: 'NMMS QUALIFIED & GOLD',
    quote: 'Vedic Maths tricks helped me finish the mathematics section 25 minutes before time. I double checked all questions while others were still calculating.',
    batch: 'Batch of 2025',
    location: 'Pune Centre',
    image: '/assets/images/student_mental_vedic_maths.png',
    scoreHighlight: 'NMMS State Merit • Math Speed Gold Medal',
    fullStory: 'Cracked NMMS competitive scholarship test with exceptional score in mental arithmetic. Multiplies 3-digit numbers mentally in 3 seconds.',
    videoDuration: '1:35',
    keyTechnique: 'Vedic Urdhva Tiryagbhyam Sutra & Mental Abacus'
  },
  {
    id: 'swapnali-patil',
    name: 'Swapnali Patil',
    category: 'police',
    badge: 'POLICE BHARTI MERIT 2024',
    quote: 'As a female aspirant from rural Maharashtra, mental calmness was key. Prashant Sir\'s memory anchoring made GK formulas stick effortlessly.',
    batch: 'Batch of 2024',
    location: 'Kolhapur Centre',
    image: '/assets/images/police_bharti_celebration.jpg',
    scoreHighlight: 'Selected in 1st Attempt • 94/100 Marks',
    fullStory: 'Joined the 12-week Police Bharti preparation track. Cleared written and physical test with outstanding scores.',
    videoDuration: '2:22',
    keyTechnique: 'Sensory Anchoring for High Endurance & Quick MCQ Recall'
  },
  {
    id: 'rohan-jadhav',
    name: 'Rohan Jadhav',
    category: 'mpsc',
    badge: 'MPSC MAINS CLEARED',
    quote: 'The 1-7-30 spaced repetition framework eliminated exam blankouts completely. I could reproduce exact historical dates and acts in Mains answer papers.',
    batch: 'Batch of 2024',
    location: 'Nashik Centre',
    image: '/assets/images/police_bharti_aspirant.png',
    scoreHighlight: 'Top 5% State Merit • Mains Qualifier',
    fullStory: 'Overcame multiple exam blankouts in previous attempts. After MindMaster training, scored record marks in General Studies Papers 1 & 2.',
    videoDuration: '1:55',
    keyTechnique: 'Loci Method for 200+ Maharashtra Legislative Acts'
  },
  {
    id: 'sunita-gaikwad',
    name: 'Dr. Sunita Gaikwad',
    category: 'trainer',
    badge: 'CERTIFIED MASTER TRAINER',
    quote: 'Graduated from Train the Trainer and now running memory workshops for 400+ school students. Prashant Sir taught us pedagogy, student psychology and business execution.',
    batch: 'Batch of 2023',
    location: 'Kolhapur Centre',
    image: '/assets/images/instructor_coaching_adults.png',
    scoreHighlight: '400+ Students Mentored • Active Coaching Academy',
    fullStory: 'Educator and school principal who transitioned into certified cognitive coach. Conducts school seminars across Sangli and Kolhapur districts.',
    videoDuration: '3:10',
    keyTechnique: 'Pedagogical Transmission & Classroom Accelerated Learning'
  },
  {
    id: 'pranav-shinde',
    name: 'Pranav Shinde',
    category: 'vedic',
    badge: 'STATE OLYMPIAD TOP 50',
    quote: 'Superfast calendar calculations earned me gold in state mental arithmetic competition. Give me any date between 1900 and 2100 and I answer the day in 2 seconds.',
    batch: 'Batch of 2025',
    location: 'Sangli Centre',
    image: '/assets/images/student_calendar_maths.png',
    scoreHighlight: 'Olympiad Gold • 2-Sec Calendar Master',
    fullStory: 'Grade 7 student who memorized century codes and leap year formulas. Often demonstrates lightning-fast calculations in live academy seminars.',
    videoDuration: '1:40',
    keyTechnique: 'Mental Doomsday Formula & Chronology Anchoring'
  }
];

export const Results: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';

  const [activeFilter, setActiveFilter] = useState<string>(initialCategory);
  const [modalData, setModalData] = useState<VideoModalProps | null>(null);
  const [cms, setCms] = useState<WebsiteCmsData>(DEFAULT_WEBSITE_CMS);

  useEffect(() => {
    let isMounted = true;
    fetchLiveWebsiteCms().then((data) => {
      if (isMounted) setCms(data);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync state if URL query param changes
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setActiveFilter(categoryParam);
    }
  }, [searchParams]);

  const handleFilterClick = (filter: string) => {
    setActiveFilter(filter);
    if (filter === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ category: filter });
    }
  };

  const liveToppersAsTestimonials: TestimonialItem[] = (cms.toppers || []).map((t) => {
    const cat = (t.examCategory || '').toLowerCase();
    const resolvedCat: TestimonialItem['category'] = cat.includes('police')
      ? 'police'
      : cat.includes('mpsc')
      ? 'mpsc'
      : cat.includes('vedic') || cat.includes('math')
      ? 'vedic'
      : 'scholarship';
    return {
      id: t.id,
      name: t.name,
      category: resolvedCat,
      badge: t.scoreOrRank.toUpperCase(),
      quote: t.quote || "MindMaster's cognitive methods made studying effortless and enjoyable.",
      batch: `Batch of ${t.batchYear || '2024'}`,
      location: 'Satara & Pune Flagship',
      image: t.photoUrl || '/assets/images/akash_police_testimonial.png',
      scoreHighlight: t.scoreOrRank,
      fullStory: `${t.name} secured ${t.scoreOrRank} in ${t.examCategory}. Mastered photographic memory retention with Prashant Sir.`,
      videoDuration: t.testimonialVideoUrl ? '2:15' : undefined,
      keyTechnique: `${t.examCategory} High-Speed Mnemonic Mastery`,
    };
  });

  const combinedTestimonials = [
    ...liveToppersAsTestimonials,
    ...TESTIMONIALS.filter(
      (t) => !liveToppersAsTestimonials.some((lt) => lt.name.toLowerCase() === t.name.toLowerCase())
    ),
  ];

  // Filter items based on activeFilter
  const filteredStories =
    activeFilter === 'all'
      ? combinedTestimonials
      : combinedTestimonials.filter((item) => item.category === activeFilter);

  // Dynamic Featured Spotlight based on filter
  const featuredItem = filteredStories[0] || combinedTestimonials[0];

  const openVideoModal = (item: TestimonialItem) => {
    setModalData({
      isOpen: true,
      onClose: () => setModalData(null),
      title: `${item.name} — ${item.badge}`,
      studentName: item.name,
      rankBadge: item.badge,
      category: item.category.toUpperCase(),
      location: item.location,
      batchYear: item.batch,
      quote: item.quote,
      posterImg: item.image,
      videoDuration: item.videoDuration || '2:14',
      marksheetScore: item.scoreHighlight,
      keyTakeaway: item.keyTechnique
    });
  };

  const getCategoryCount = (category: string) => {
    if (category === 'all') return TESTIMONIALS.length;
    return TESTIMONIALS.filter(t => t.category === category).length;
  };

  return (
    <main className="w-full pt-24 sm:pt-28 bg-background min-h-screen">
      <div className="flex flex-col w-full">
        {/* Hero Section */}
        <section className="w-full bg-surface-container-lowest py-space-2xl md:py-space-3xl border-b border-surface-variant/40">
          <div className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop">
            <div className="flex flex-col items-start max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-label-caps font-label-caps shadow-xs mb-space-md">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                VERIFIED PROOF • 5,000+ LEARNERS
              </div>
              <h1 className="font-headline-lg text-headline-lg md:text-display-hero font-display-hero text-primary-container tracking-tight leading-tight">
                Every rank tells a{' '}
                <span className="relative inline-block text-secondary">
                  story.
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
                Real marks, verified state certificates, and authentic breakthroughs from memory, police-bharti, and Vedic-maths batches across Maharashtra.
              </p>
            </div>
          </div>
        </section>

        {/* Dynamic Filter Section */}
        <section className="w-full bg-surface-container py-space-xl md:py-space-2xl">
          <div className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop flex flex-col gap-space-xl">
            {/* Filter Bar with clickable buttons */}
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-3 scrollbar-none" id="filter-bar">
              <button
                type="button"
                onClick={() => handleFilterClick('all')}
                className={`filter-btn whitespace-nowrap px-space-lg py-2.5 rounded-full font-title-md text-xs sm:text-body-sm shadow-xs transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-secondary text-on-secondary shadow-md scale-105 font-bold'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <span>All Stories</span>
                <span className={`text-[11px] px-2 py-0.2 rounded-full ${activeFilter === 'all' ? 'bg-white/20 text-white' : 'bg-surface-container text-on-surface-variant'}`}>
                  {getCategoryCount('all')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleFilterClick('scholarship')}
                className={`filter-btn whitespace-nowrap px-space-lg py-2.5 rounded-full font-title-md text-xs sm:text-body-sm shadow-xs transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  activeFilter === 'scholarship'
                    ? 'bg-secondary text-on-secondary shadow-md scale-105 font-bold'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <span>Scholarship (5th/8th)</span>
                <span className={`text-[11px] px-2 py-0.2 rounded-full ${activeFilter === 'scholarship' ? 'bg-white/20 text-white' : 'bg-surface-container text-on-surface-variant'}`}>
                  {getCategoryCount('scholarship')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleFilterClick('police')}
                className={`filter-btn whitespace-nowrap px-space-lg py-2.5 rounded-full font-title-md text-xs sm:text-body-sm shadow-xs transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  activeFilter === 'police'
                    ? 'bg-secondary text-on-secondary shadow-md scale-105 font-bold'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <span>Police Bharti</span>
                <span className={`text-[11px] px-2 py-0.2 rounded-full ${activeFilter === 'police' ? 'bg-white/20 text-white' : 'bg-surface-container text-on-surface-variant'}`}>
                  {getCategoryCount('police')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleFilterClick('mpsc')}
                className={`filter-btn whitespace-nowrap px-space-lg py-2.5 rounded-full font-title-md text-xs sm:text-body-sm shadow-xs transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  activeFilter === 'mpsc'
                    ? 'bg-secondary text-on-secondary shadow-md scale-105 font-bold'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <span>MPSC / UPSC</span>
                <span className={`text-[11px] px-2 py-0.2 rounded-full ${activeFilter === 'mpsc' ? 'bg-white/20 text-white' : 'bg-surface-container text-on-surface-variant'}`}>
                  {getCategoryCount('mpsc')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleFilterClick('vedic')}
                className={`filter-btn whitespace-nowrap px-space-lg py-2.5 rounded-full font-title-md text-xs sm:text-body-sm shadow-xs transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  activeFilter === 'vedic'
                    ? 'bg-secondary text-on-secondary shadow-md scale-105 font-bold'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <span>Vedic Maths & Calendar</span>
                <span className={`text-[11px] px-2 py-0.2 rounded-full ${activeFilter === 'vedic' ? 'bg-white/20 text-white' : 'bg-surface-container text-on-surface-variant'}`}>
                  {getCategoryCount('vedic')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleFilterClick('trainer')}
                className={`filter-btn whitespace-nowrap px-space-lg py-2.5 rounded-full font-title-md text-xs sm:text-body-sm shadow-xs transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  activeFilter === 'trainer'
                    ? 'bg-secondary text-on-secondary shadow-md scale-105 font-bold'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <span>Train the Trainer</span>
                <span className={`text-[11px] px-2 py-0.2 rounded-full ${activeFilter === 'trainer' ? 'bg-white/20 text-white' : 'bg-surface-container text-on-surface-variant'}`}>
                  {getCategoryCount('trainer')}
                </span>
              </button>
            </div>

            {/* Dynamic Featured Spotlight Card */}
            <div className="w-full bg-surface-container-lowest rounded-2xl p-space-lg md:p-space-2xl shadow-md flex flex-col lg:flex-row items-center gap-space-xl border border-surface-variant/50 transition-all duration-300">
              <div className="w-full lg:w-5/12 relative flex-shrink-0">
                <div className="relative overflow-hidden rounded-xl aspect-[4/3] bg-surface-container shadow-sm group">
                  <img
                    alt={featuredItem.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    src={featuredItem.image}
                  />
                  <div className="absolute top-4 left-4 bg-surface-container-lowest/95 backdrop-blur-md px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-md">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    <span className="font-label-caps text-xs text-primary-container font-bold uppercase">
                      {featuredItem.badge}
                    </span>
                  </div>

                  <button
                    onClick={() => openVideoModal(featuredItem)}
                    className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-secondary/90 text-white flex items-center justify-center shadow-xl hover:scale-110 hover:bg-secondary transition-all cursor-pointer"
                    aria-label="Play testimonial video"
                  >
                    <span className="material-symbols-outlined text-3xl ml-0.5">play_arrow</span>
                  </button>
                </div>
              </div>

              <div className="w-full lg:w-7/12 flex flex-col justify-between h-full space-y-space-md">
                <div>
                  <div className="inline-flex items-center gap-2 text-secondary font-label-caps text-label-caps font-bold">
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    FEATURED SPOTLIGHT • {featuredItem.category.toUpperCase()}
                  </div>
                  <blockquote className="mt-2 font-headline-sm text-headline-sm md:text-headline-md font-headline-md text-primary-container leading-relaxed">
                    “{featuredItem.quote}”
                  </blockquote>
                </div>

                <div className="grid grid-cols-3 gap-space-sm pt-space-xs">
                  <div className="bg-surface-container-low rounded-xl p-space-sm flex flex-col">
                    <span className="font-headline-sm text-lg sm:text-headline-sm text-secondary font-bold">
                      {featuredItem.scoreHighlight.split('•')[0] || 'Rank 12'}
                    </span>
                    <span className="font-label-caps text-[10px] sm:text-label-caps text-on-surface-variant uppercase mt-1">
                      Achievement
                    </span>
                  </div>
                  <div className="bg-surface-container-low rounded-xl p-space-sm flex flex-col">
                    <span className="font-headline-sm text-lg sm:text-headline-sm text-secondary font-bold">
                      100%
                    </span>
                    <span className="font-label-caps text-[10px] sm:text-label-caps text-on-surface-variant uppercase mt-1">
                      Retention Metric
                    </span>
                  </div>
                  <div className="bg-surface-container-low rounded-xl p-space-sm flex flex-col">
                    <span className="font-headline-sm text-lg sm:text-headline-sm text-secondary font-bold">
                      {featuredItem.batch.replace('Batch of ', '')}
                    </span>
                    <span className="font-label-caps text-[10px] sm:text-label-caps text-on-surface-variant uppercase mt-1">
                      Certified Batch
                    </span>
                  </div>
                </div>

                <div className="pt-space-md flex flex-wrap items-center justify-between gap-space-md border-t border-surface-variant/40">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => openVideoModal(featuredItem)}
                      className="inline-flex items-center gap-2 px-space-lg py-2.5 rounded-full bg-secondary text-on-secondary font-title-md text-xs sm:text-body-sm shadow-sm hover:bg-secondary-container transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">play_circle</span>
                      Watch interview — {featuredItem.videoDuration}
                    </button>
                    <Link
                      to="/contact"
                      className="font-title-md text-body-sm text-secondary hover:underline inline-flex items-center gap-1"
                    >
                      Join similar batch <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                  </div>
                  <div className="text-right">
                    <p className="font-title-md text-body-md text-primary-container font-semibold">
                      {featuredItem.name}
                    </p>
                    <p className="font-body-sm text-xs text-on-surface-variant">
                      {featuredItem.batch} • {featuredItem.location}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Filtered Stories Grid */}
        <section className="w-full bg-surface-container-lowest py-space-3xl">
          <div className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-space-2xl">
              <div>
                <span className="text-secondary font-label-caps text-label-caps uppercase font-bold">
                  Documented Outcomes ({filteredStories.length} Profiles)
                </span>
                <h2 className="font-headline-lg text-headline-lg font-headline-lg text-primary-container tracking-tight mt-1">
                  {activeFilter === 'all' && 'Proven results across disciplines.'}
                  {activeFilter === 'scholarship' && 'Scholarship & Foundation Merit Holders.'}
                  {activeFilter === 'police' && 'Police Bharti 100% Written Selections.'}
                  {activeFilter === 'mpsc' && 'MPSC & UPSC Memory Palace Masters.'}
                  {activeFilter === 'vedic' && 'Vedic Maths & Lightning Arithmetic Champs.'}
                  {activeFilter === 'trainer' && 'Certified Memory Educators & Coaches.'}
                </h2>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-md mt-2 md:mt-0">
                Each aspirant practiced the exact MindMaster memory systems developed by Prashant Dhumal in Satara.
              </p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg" id="stories-grid">
              {filteredStories.map((story) => (
                <article
                  key={story.id}
                  className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full border border-surface-variant/60 group"
                >
                  <div className="relative w-full aspect-[16/10] bg-surface-container overflow-hidden">
                    <img
                      alt={story.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={story.image}
                    />
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-caps text-[11px] font-bold shadow-xs">
                      {story.badge}
                    </div>

                    <button
                      type="button"
                      onClick={() => openVideoModal(story)}
                      className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-xs font-title-md flex items-center gap-1 hover:bg-secondary transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">play_circle</span>
                      <span>{story.videoDuration}</span>
                    </button>
                  </div>

                  <div className="p-space-lg flex flex-col flex-grow justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-title-lg text-title-lg text-primary-container font-bold">
                          {story.name}
                        </h3>
                        <span className="text-xs font-semibold text-secondary">
                          {story.scoreHighlight.split('•')[0]}
                        </span>
                      </div>
                      <p className="font-body-md text-body-md text-on-surface-variant italic leading-relaxed">
                        “{story.quote}”
                      </p>
                    </div>

                    <div className="pt-3 border-t border-surface-variant/50 space-y-3">
                      <div className="text-[12px] text-primary-container bg-surface-container-low p-2.5 rounded-lg flex items-start gap-1.5">
                        <span className="material-symbols-outlined text-secondary text-[16px] shrink-0 mt-0.5">psychology</span>
                        <span className="line-clamp-2">{story.keyTechnique}</span>
                      </div>

                      <div className="flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant">
                        <span className="font-medium">{story.batch}</span>
                        <span className="inline-flex items-center gap-1 font-medium">
                          <span className="material-symbols-outlined text-[15px] text-secondary">location_on</span>
                          {story.location}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Metrics Banner */}
        <section className="w-full bg-surface-container py-space-3xl border-y border-surface-variant/50">
          <div className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-space-lg md:gap-space-xl text-center">
              <div className="flex flex-col items-center p-space-lg bg-surface-container-lowest rounded-2xl shadow-xs border border-surface-variant/40">
                <span className="font-headline-lg text-headline-lg font-headline-lg text-secondary font-bold">100%</span>
                <span className="mt-2 font-label-caps text-label-caps text-on-surface-variant tracking-wider uppercase max-w-[160px]">
                  Written-Exam Clearance, Police Bharti
                </span>
              </div>
              <div className="flex flex-col items-center p-space-lg bg-surface-container-lowest rounded-2xl shadow-xs border border-surface-variant/40">
                <span className="font-headline-lg text-headline-lg font-headline-lg text-secondary font-bold">120+</span>
                <span className="mt-2 font-label-caps text-label-caps text-on-surface-variant tracking-wider uppercase max-w-[160px]">
                  Certified Trainers Across Maharashtra
                </span>
              </div>
              <div className="flex flex-col items-center p-space-lg bg-surface-container-lowest rounded-2xl shadow-xs border border-surface-variant/40">
                <span className="font-headline-lg text-headline-lg font-headline-lg text-secondary font-bold">37</span>
                <span className="mt-2 font-label-caps text-label-caps text-on-surface-variant tracking-wider uppercase max-w-[160px]">
                  Scholarship Merit Holders Since 2019
                </span>
              </div>
              <div className="flex flex-col items-center p-space-lg bg-surface-container-lowest rounded-2xl shadow-xs border border-surface-variant/40">
                <span className="font-headline-lg text-headline-lg font-headline-lg text-secondary font-bold">4.9/5</span>
                <span className="mt-2 font-label-caps text-label-caps text-on-surface-variant tracking-wider uppercase max-w-[160px]">
                  Average Parent & Aspirant Rating
                </span>
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
                Authentic moments of learning, discipline, and breakthrough results captured across our daily practice batches.
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
                  <span className="font-title-md text-xs text-primary-container font-semibold">Mind-map whiteboard & study group</span>
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

      {/* Video / Interview Modal */}
      {modalData && <VideoModal {...modalData} />}
    </main>
  );
};
