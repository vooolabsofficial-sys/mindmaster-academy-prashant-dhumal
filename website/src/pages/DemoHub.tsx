import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { submitWebsiteLead } from '../config/appConfig';

export const DemoHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'enquiry' | 'call'>('enquiry');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    location: 'satara-hq',
    program: 'mm-03',
    notes: ''
  });

  // Weekend Demo Booking Form State
  const [attendee, setAttendee] = useState<'grade-3-7' | 'grade-8-12' | 'police' | 'teacher'>('grade-8-12');
  const [demoDate, setDemoDate] = useState<'sat' | 'sun' | 'next-sun'>('sun');
  const [timeSlot, setTimeSlot] = useState<'morning' | 'evening'>('morning');
  const [demoName, setDemoName] = useState('');
  const [demoPhone, setDemoPhone] = useState('');
  const [demoBooked, setDemoBooked] = useState(false);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    await submitWebsiteLead({
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      courseInterest: formData.program,
      message: `Location: ${formData.location}. Notes: ${formData.notes}`,
      source: 'DemoHub Enquiry Tab',
    });
    setTimeout(() => {
      setFormSubmitted(false);
    }, 6000);
  };

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDemoBooked(true);
    await submitWebsiteLead({
      name: demoName,
      phone: demoPhone,
      courseInterest: `Free Demo: ${attendee} (${demoDate}, ${timeSlot})`,
      message: `Weekend demo booking for ${attendee} on ${demoDate} (${timeSlot})`,
      source: 'DemoHub Weekend Booking',
    });
    setTimeout(() => {
      setDemoBooked(false);
      setDemoName('');
      setDemoPhone('');
    }, 6000);
  };

  const faqs = [
    {
      q: "Which course suits my child's grade or competitive goal?",
      a: "• Grades 4 to 8: Start with Memory Technique Seminar (MM-01) and Vedic Maths Foundation (MM-05) for rapid retention and speed arithmetic.\n• Grades 9 to 12 & Board Exams: The Memory Palace framework (MM-01) and Superfast Calendar (MM-04) eliminate syllabus cramming.\n• Police Bharti & MPSC: Enroll into MM-03 for 100% written GK retention, law articles, and physical composure."
    },
    {
      q: "What happens in the 90-minute Free Demo Session?",
      a: "The demo features a live, interactive 40-item rapid memory challenge where the audience gives random words and numbers and Prashant Sir recalls them instantly. Students learn their first 20-word peg system during the session itself."
    },
    {
      q: "Are classes available in Marathi or English?",
      a: "All concepts, mnemonic peg charts, and curriculum workbooks are bilingual in Marathi and simple English. Prashant Dhumal conducts interactive explanations primarily in fluent Marathi for relatable learning."
    },
    {
      q: "Can outstation students attend online from any district in Maharashtra?",
      a: "Yes! Over 60% of our 5,000+ students attend via high-definition two-way interactive virtual batches with dedicated study material kits delivered to their doorstep."
    }
  ];

  return (
    <main className="w-full pt-24 sm:pt-28 bg-background min-h-screen">
      {/* Top Header Section */}
      <section className="relative w-full py-12 lg:py-16 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-surface-container-lowest via-surface-container-low/40 to-background">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[720px] h-[340px] bg-secondary-fixed/40 rounded-full blur-3xl pointer-events-none -z-10"></div>
        <div className="max-w-container-max mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-secondary font-label-caps text-[11px] tracking-wider uppercase shadow-xs mb-4">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              ADMISSIONS & ENQUIRIES • 2026 BATCHES OPEN
            </div>
            <h1 className="font-headline-lg text-3xl sm:text-4xl lg:text-[46px] text-primary-container leading-tight tracking-tight font-extrabold">
              Connect with Maharashtra’s Premier <br className="hidden sm:block" />
              <span className="relative inline-block text-secondary font-headline-lg italic">
                Mind & Memory
                <svg className="absolute left-0 -bottom-2 w-full h-3 text-secondary/70" fill="none" preserveAspectRatio="none" viewBox="0 0 160 12">
                  <path d="M3 9C45 2 110 1 157 8" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
                </svg>
              </span>{' '}
              Academy
            </h1>
            <p className="font-body-lg text-sm sm:text-base text-on-surface-variant mt-4 leading-relaxed">
              Directly access academic counsellors, verify physical centre schedules in Satara HQ, Pune & Nashik, or reserve an executive consultation with Founder Prashant Dhumal.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Founder Hotline & Campus Hubs */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Founder Hotline Card */}
              <div className="bg-gradient-to-r from-primary-container to-[#1a2d5e] text-white p-5 rounded-2xl shadow-sm relative overflow-hidden flex items-center gap-4">
                <div className="relative shrink-0">
                  <img
                    alt="Prashant Dhumal"
                    className="w-16 h-16 rounded-full object-cover object-top border-2 border-secondary-fixed shadow-md"
                    src="/assets/images/prashant_dhumal_studio_portrait.png"
                  />
                  <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-primary-container" title="Online for Advisory"></span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-secondary-fixed text-[11px] font-label-caps uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    <span>Founder Direct Academic Hotline</span>
                  </div>
                  <h4 className="font-title-md text-[17px] font-bold text-white tracking-tight mt-0.5">
                    Prashant Dhumal & Senior Faculty
                  </h4>
                  <p className="text-white/80 text-[12px] font-body-sm leading-snug mt-0.5">
                    Rapid guidance on competitive exams, memory bottlenecks, & batch placements.
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <a className="inline-flex items-center gap-1.5 text-[12px] font-bold text-secondary-fixed hover:text-white transition-colors" href="tel:+918459344077">
                      <span className="material-symbols-outlined text-[15px]">call</span> +91 84593 44077
                    </a>
                    <span className="text-white/40">•</span>
                    <a
                      className="inline-flex items-center gap-1.5 text-[12px] font-bold text-emerald-300 hover:text-emerald-200 transition-colors"
                      href="https://wa.me/918459344077?text=Hi%20Prashant%20Sir%2C%20I%20want%20to%20inquire%20about%20MindMaster%20courses"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span>WhatsApp Chat</span> →
                    </a>
                  </div>
                </div>
              </div>

              {/* Physical Learning Hubs */}
              <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-surface-variant/60">
                <div className="flex items-center justify-between pb-4 border-b border-surface-variant/60">
                  <div>
                    <h3 className="font-headline-sm text-xl text-primary-container font-bold">Statewide Learning Hubs</h3>
                    <p className="font-body-sm text-[13px] text-on-surface-variant">Classroom coaching, workshops & diagnostic labs</p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-label-caps font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Open Today
                  </span>
                </div>

                {/* Satara HQ Campus */}
                <div className="mt-4 p-4 rounded-2xl bg-surface-container-low/70 border border-secondary/20 hover:border-secondary transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                      <h4 className="font-title-md text-[15px] font-bold text-primary-container">Satara Flagship Campus (HQ)</h4>
                    </div>
                    <span className="text-[10px] font-label-caps px-2 py-0.5 rounded-md bg-secondary text-white font-semibold">Headquarters</span>
                  </div>
                  <p className="font-body-sm text-[12px] text-on-surface-variant mt-1.5 pl-4.5">
                    Near Powai Naka, Sadar Bazar, Satara, Maharashtra 415001
                  </p>
                  <div className="flex items-center gap-4 mt-2.5 pl-4.5 text-[12px] text-on-surface-variant">
                    <span className="flex items-center gap-1 text-emerald-700 font-medium">
                      <span className="material-symbols-outlined text-[14px]">schedule</span> 9:00 AM – 8:00 PM IST
                    </span>
                    <span className="text-on-surface-variant/40">|</span>
                    <span className="flex items-center gap-1 text-secondary font-medium">
                      <span className="material-symbols-outlined text-[14px]">bolt</span> Response: &lt; 15 mins
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-variant/50">
                    <a className="flex-1 py-1.5 px-3 rounded-lg bg-surface-container-lowest hover:bg-secondary-fixed/50 text-on-surface text-[12px] font-title-md text-center border border-surface-variant transition-colors flex items-center justify-center gap-1" href="tel:+918459344077">
                      <span className="material-symbols-outlined text-[15px] text-secondary">call</span> Call Desk
                    </a>
                    <a className="flex-1 py-1.5 px-3 rounded-lg bg-surface-container-lowest hover:bg-secondary-fixed/50 text-on-surface text-[12px] font-title-md text-center border border-surface-variant transition-colors flex items-center justify-center gap-1" href="https://maps.google.com/?q=Satara+Maharashtra" target="_blank" rel="noreferrer">
                      <span className="material-symbols-outlined text-[15px] text-secondary">directions</span> Directions
                    </a>
                  </div>
                </div>

                {/* Pune Hub */}
                <div className="mt-3 p-3.5 rounded-xl bg-surface-container-lowest border border-surface-variant hover:border-surface-tint transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-secondary"></span>
                      <h4 className="font-title-md text-[14px] text-on-surface font-bold">Pune University Corridor Centre</h4>
                    </div>
                    <span className="text-[11px] font-label-caps text-on-surface-variant font-semibold">FC Road / Shivajinagar</span>
                  </div>
                  <p className="font-body-sm text-[12px] text-on-surface-variant mt-1">Weekend Intensive Masterclasses & MPSC Mentorship</p>
                </div>
              </div>
            </div>

            {/* Right Column: Fast-Track Admissions & Consultation Form */}
            <div className="lg:col-span-7">
              <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 lg:p-10 shadow-lg border border-surface-variant/60 relative">
                <div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b border-surface-variant/60">
                  <div>
                    <h3 className="font-headline-sm text-2xl sm:text-3xl text-primary-container font-bold">
                      Fast-Track Admissions Form
                    </h3>
                    <p className="font-body-md text-sm text-on-surface-variant mt-1">
                      Get personalised program recommendations within 2 working hours.
                    </p>
                  </div>
                  {/* Interactive Switcher: Quick Enquiry vs Book Call Slot */}
                  <div className="inline-flex p-1 bg-surface-container-low rounded-xl border border-surface-variant">
                    <button
                      type="button"
                      onClick={() => setActiveTab('enquiry')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-title-md transition-all cursor-pointer ${
                        activeTab === 'enquiry'
                          ? 'bg-secondary text-white font-bold shadow-xs'
                          : 'text-on-surface-variant hover:text-primary'
                      }`}
                    >
                      Quick Enquiry
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('call')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-title-md transition-all cursor-pointer ${
                        activeTab === 'call'
                          ? 'bg-secondary text-white font-bold shadow-xs'
                          : 'text-on-surface-variant hover:text-primary'
                      }`}
                    >
                      Book Call Slot
                    </button>
                  </div>
                </div>

                {/* Form Submitted Success Toast */}
                {formSubmitted ? (
                  <div className="my-6 p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 animate-fadeIn">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-emerald-600 text-4xl">check_circle</span>
                      <div>
                        <h4 className="font-bold text-base text-emerald-900">Academic Enquiry Received!</h4>
                        <p className="text-xs text-emerald-800 mt-0.5">
                          Our senior counsellor will ring {formData.phone || 'your phone'} within 2 working hours with the syllabus kit and batch schedules.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-emerald-200/60 flex items-center justify-between">
                      <span className="text-xs text-emerald-700">Need immediate confirmation?</span>
                      <a
                        href={`https://wa.me/918459344077?text=Hi%2C%20I%20just%20submitted%20an%20admissions%20enquiry%20for%20${formData.name}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:underline"
                      >
                        Ping on WhatsApp →
                      </a>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleEnquirySubmit} className="mt-6 space-y-5" id="admissionForm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="font-title-md text-xs font-semibold text-on-surface uppercase tracking-wider flex items-center justify-between" htmlFor="applicantName">
                          <span>Full Name <span className="text-error">*</span></span>
                          <span className="text-[11px] text-on-surface-variant/60 font-normal">Student or Parent</span>
                        </label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[18px]">person</span>
                          <input
                            className="w-full h-12 pl-10 pr-4 rounded-xl bg-surface-container-low/40 border border-surface-variant focus:border-secondary focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/20 text-on-surface font-body-md text-[15px] placeholder:text-on-surface-variant/50 transition-all"
                            id="applicantName"
                            placeholder="e.g. Aniket Deshmukh"
                            required
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="font-title-md text-xs font-semibold text-on-surface uppercase tracking-wider flex items-center justify-between" htmlFor="applicantPhone">
                          <span>WhatsApp Number <span className="text-error">*</span></span>
                          <span className="text-[11px] text-emerald-600 font-bold">SMS / WA updates</span>
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-3.5 text-xs font-bold text-on-surface-variant select-none border-r border-surface-variant pr-2">+91</span>
                          <input
                            className="w-full h-12 pl-14 pr-4 rounded-xl bg-surface-container-low/40 border border-surface-variant focus:border-secondary focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/20 text-on-surface font-body-md text-[15px] placeholder:text-on-surface-variant/50 transition-all"
                            id="applicantPhone"
                            pattern="[0-9]{10}"
                            placeholder="98765 43210"
                            required
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="font-title-md text-xs font-semibold text-on-surface uppercase tracking-wider" htmlFor="applicantEmail">
                          Email Address
                        </label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[18px]">mail</span>
                          <input
                            className="w-full h-12 pl-10 pr-4 rounded-xl bg-surface-container-low/40 border border-surface-variant focus:border-secondary focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/20 text-on-surface font-body-md text-[15px] placeholder:text-on-surface-variant/50 transition-all"
                            id="applicantEmail"
                            placeholder="name@example.com"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="font-title-md text-xs font-semibold text-on-surface uppercase tracking-wider" htmlFor="applicantLocation">
                          Preferred Mode / Hub
                        </label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[18px]">location_city</span>
                          <select
                            className="w-full h-12 pl-10 pr-10 rounded-xl bg-surface-container-low/40 border border-surface-variant focus:border-secondary focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/20 text-on-surface font-body-md text-[14px] appearance-none transition-all cursor-pointer"
                            id="applicantLocation"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          >
                            <option value="satara-hq">Satara Campus (Powai Naka Flagship HQ)</option>
                            <option value="pune-fc">Pune Learning Hub (FC Road / Shivajinagar)</option>
                            <option value="nashik-rc">Nashik Regional Centre</option>
                            <option value="digital-live">Online Interactive Live (Anywhere in MH)</option>
                            <option value="mumbai">Mumbai / Navi Mumbai Weekend Masterclass</option>
                          </select>
                          <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[20px]">expand_more</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="font-title-md text-xs font-semibold text-on-surface uppercase tracking-wider flex items-center justify-between" htmlFor="courseProgram">
                        <span>Target Academic Program</span>
                        <span className="text-[11px] font-label-caps text-secondary font-bold">5 Specialisations</span>
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[18px]">school</span>
                        <select
                          className="w-full h-12 pl-10 pr-10 rounded-xl bg-surface-container-low/40 border border-surface-variant focus:border-secondary focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/20 text-on-surface font-body-md text-[14px] appearance-none transition-all cursor-pointer"
                          id="courseProgram"
                          value={formData.program}
                          onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                        >
                          <option value="mm-01">MM-01: Rapid Memory Technique & Board Exam Mastery</option>
                          <option value="mm-03">MM-03: Maharashtra Police Bharti 100% Prep Track</option>
                          <option value="mm-05">MM-05: Vedic Mathematics Foundation (Calculations 10x Faster)</option>
                          <option value="mm-04">MM-04: Superfast Calendar & Chronology Technique</option>
                          <option value="mm-02">MM-02: Train The Trainer (TTT) Certified Coach License</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[20px]">expand_more</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-title-md text-xs font-semibold text-on-surface uppercase tracking-wider" htmlFor="userNotes">
                        Notes or Specific Challenges
                      </label>
                      <textarea
                        className="w-full p-3.5 rounded-xl bg-surface-container-low/40 border border-surface-variant focus:border-secondary focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/20 text-on-surface font-body-md text-[14px] placeholder:text-on-surface-variant/50 resize-none transition-all"
                        id="userNotes"
                        placeholder="Tell us about the student's grade, upcoming exam dates (e.g. Police Bharti 2026, 10th SSC), or specific memory blockers..."
                        rows={3}
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      ></textarea>
                    </div>

                    <div className="pt-2">
                      <button
                        className="w-full h-13 rounded-2xl bg-secondary hover:bg-on-secondary-fixed-variant text-on-secondary font-title-md text-[16px] font-bold transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99]"
                        type="submit"
                      >
                        <span>{activeTab === 'enquiry' ? 'Submit Academic Inquiry' : 'Book Callback Slot'}</span>
                        <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Signature 90-Minute Complimentary Demo Section */}
      <section className="w-full py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-surface-container-low/60 border-y border-surface-variant/60" id="demo-studio">
        <div className="max-w-container-max mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-surface-container-lowest border border-surface-variant text-secondary font-label-caps text-[11px] tracking-wider uppercase shadow-xs mb-3">
              <span className="material-symbols-outlined text-[15px]">smart_display</span> LIVE COGNITIVE PROVING GROUND
            </div>
            <h2 className="font-headline-lg text-3xl sm:text-4xl lg:text-[42px] text-primary-container leading-tight font-extrabold">
              See the{' '}
              <span className="relative inline-block text-secondary italic">
                method
                <svg className="absolute left-0 -bottom-1.5 w-full h-2.5 text-secondary" fill="none" viewBox="0 0 120 10">
                  <path d="M2 7C35 2 85 1 118 6" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" />
                </svg>
              </span>{' '}
              in action before you invest.
            </h2>
            <p className="font-body-lg text-sm sm:text-base text-on-surface-variant mt-3">
              Join our signature 90-minute complimentary demo session. Experience the legendary live 40-item instant recall demonstration and witness real cognitive transformation.
            </p>
          </div>

          <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-10 shadow-xl border border-surface-variant grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Col: Demo Highlights */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="space-y-4">
                <span className="text-xs font-label-caps tracking-widest text-secondary font-bold uppercase">
                  What You Will Witness Live:
                </span>
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-surface-container-low/60 border border-surface-variant/60">
                  <div className="w-10 h-10 rounded-xl bg-secondary text-on-secondary flex items-center justify-center shrink-0 shadow-xs">
                    <span className="material-symbols-outlined text-[20px]">bolt</span>
                  </div>
                  <div>
                    <h4 className="font-title-md text-[15px] text-primary-container font-bold">The 40-Item Live Recall Challenge</h4>
                    <p className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">
                      Audience throws 40 random words & 8-digit numbers. Prashant Sir reproduces them forwards and backwards immediately.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-surface-container-low/60 border border-surface-variant/60">
                  <div className="w-10 h-10 rounded-xl bg-primary-container text-white flex items-center justify-center shrink-0 shadow-xs">
                    <span className="material-symbols-outlined text-[20px]">calculate</span>
                  </div>
                  <div>
                    <h4 className="font-title-md text-[15px] text-primary-container font-bold">1-Second Mental Calendar Hack</h4>
                    <p className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">
                      Learn how any student can identify the weekday for any calendar date between 1900 and 2100 in 2 seconds.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Interactive Weekend Batch Reservation */}
            <div className="lg:col-span-7 bg-surface-container-low/40 rounded-2xl p-6 sm:p-8 border border-surface-variant">
              <div className="flex items-center justify-between pb-4 border-b border-surface-variant">
                <div>
                  <span className="text-xs font-label-caps uppercase text-secondary font-bold tracking-wider">
                    Fast Seat Reservation
                  </span>
                  <h3 className="font-headline-sm text-xl sm:text-2xl text-primary-container font-bold">
                    Select Your Weekend Batch
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-error-container text-on-error-container text-[11px] font-label-caps font-bold">
                  Only 6 Seats Left
                </span>
              </div>

              {demoBooked ? (
                <div className="my-6 p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 animate-fadeIn text-center">
                  <span className="material-symbols-outlined text-emerald-600 text-5xl mb-2">event_available</span>
                  <h4 className="font-bold text-lg text-emerald-900">Seat Reserved Successfully!</h4>
                  <p className="text-xs text-emerald-800 mt-1 max-w-md mx-auto">
                    We have reserved your complimentary seat for the upcoming weekend batch ({demoDate === 'sat' ? 'Saturday' : 'Sunday'} • {timeSlot === 'morning' ? '10:00 AM' : '04:00 PM'}).
                    Zoom invite and classroom directions have been dispatched to your WhatsApp.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleDemoSubmit}>
                  {/* Attendee Pills */}
                  <div className="mt-5">
                    <label className="block text-xs font-title-md font-semibold text-on-surface uppercase tracking-wider mb-2">
                      1. Who is attending this session?
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => setAttendee('grade-3-7')}
                        className={`py-2 px-3 rounded-xl text-xs font-title-md text-center transition-all cursor-pointer ${
                          attendee === 'grade-3-7'
                            ? 'border-2 border-secondary bg-secondary text-white shadow-xs font-bold'
                            : 'border border-surface-variant bg-surface-container-lowest text-on-surface-variant hover:border-secondary'
                        }`}
                      >
                        Grade 3–7
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttendee('grade-8-12')}
                        className={`py-2 px-3 rounded-xl text-xs font-title-md text-center transition-all cursor-pointer ${
                          attendee === 'grade-8-12'
                            ? 'border-2 border-secondary bg-secondary text-white shadow-xs font-bold'
                            : 'border border-surface-variant bg-surface-container-lowest text-on-surface-variant hover:border-secondary'
                        }`}
                      >
                        Grade 8–12
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttendee('police')}
                        className={`py-2 px-3 rounded-xl text-xs font-title-md text-center transition-all cursor-pointer ${
                          attendee === 'police'
                            ? 'border-2 border-secondary bg-secondary text-white shadow-xs font-bold'
                            : 'border border-surface-variant bg-surface-container-lowest text-on-surface-variant hover:border-secondary'
                        }`}
                      >
                        Police / MPSC
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttendee('teacher')}
                        className={`py-2 px-3 rounded-xl text-xs font-title-md text-center transition-all cursor-pointer ${
                          attendee === 'teacher'
                            ? 'border-2 border-secondary bg-secondary text-white shadow-xs font-bold'
                            : 'border border-surface-variant bg-surface-container-lowest text-on-surface-variant hover:border-secondary'
                        }`}
                      >
                        Teacher / Adult
                      </button>
                    </div>
                  </div>

                  {/* Date Selection Cards */}
                  <div className="mt-5">
                    <label className="block text-xs font-title-md font-semibold text-on-surface uppercase tracking-wider mb-2">
                      2. Choose Upcoming Demo Date
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setDemoDate('sat')}
                        className={`p-3 rounded-xl text-center transition-all cursor-pointer ${
                          demoDate === 'sat'
                            ? 'border-2 border-secondary bg-secondary/10 shadow-xs'
                            : 'border border-surface-variant bg-surface-container-lowest hover:border-secondary'
                        }`}
                      >
                        <span className="text-[11px] font-label-caps text-on-surface-variant uppercase block">Saturday</span>
                        <span className="font-headline-sm text-sm sm:text-base font-bold text-primary-container block">Upcoming Sat</span>
                        <span className="inline-block mt-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          Fast Filling
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDemoDate('sun')}
                        className={`p-3 rounded-xl text-center transition-all cursor-pointer ${
                          demoDate === 'sun'
                            ? 'border-2 border-secondary bg-secondary/10 shadow-xs ring-2 ring-secondary/20'
                            : 'border border-surface-variant bg-surface-container-lowest hover:border-secondary'
                        }`}
                      >
                        <span className="text-[11px] font-label-caps text-secondary uppercase font-bold block">Sunday (Featured)</span>
                        <span className="font-headline-sm text-sm sm:text-base font-bold text-secondary block">Upcoming Sun</span>
                        <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Prashant Sir Live
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDemoDate('next-sun')}
                        className={`p-3 rounded-xl text-center transition-all cursor-pointer ${
                          demoDate === 'next-sun'
                            ? 'border-2 border-secondary bg-secondary/10 shadow-xs'
                            : 'border border-surface-variant bg-surface-container-lowest hover:border-secondary'
                        }`}
                      >
                        <span className="text-[11px] font-label-caps text-on-surface-variant uppercase block">Next Weekend</span>
                        <span className="font-headline-sm text-sm sm:text-base font-bold text-primary-container block">Next Sun</span>
                        <span className="inline-block mt-1 text-[10px] font-semibold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                          Open
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div className="mt-5">
                    <label className="block text-xs font-title-md font-semibold text-on-surface uppercase tracking-wider mb-2">
                      3. Preferred Time Slot
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setTimeSlot('morning')}
                        className={`p-3 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
                          timeSlot === 'morning'
                            ? 'border-2 border-secondary bg-secondary-fixed/40 text-secondary'
                            : 'border border-surface-variant bg-surface-container-lowest text-on-surface-variant hover:border-secondary'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                            <span className="material-symbols-outlined text-[16px]">wb_sunny</span> Morning: 10:00 AM – 11:30 AM
                          </div>
                          <span className="text-[11px] text-on-surface-variant block mt-0.5">Live Interactive Zoom or Satara HQ</span>
                        </div>
                        <span className={`material-symbols-outlined text-[20px] ${timeSlot === 'morning' ? 'text-secondary' : 'opacity-0'}`}>
                          check_circle
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTimeSlot('evening')}
                        className={`p-3 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
                          timeSlot === 'evening'
                            ? 'border-2 border-secondary bg-secondary-fixed/40 text-secondary'
                            : 'border border-surface-variant bg-surface-container-lowest text-on-surface-variant hover:border-secondary'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                            <span className="material-symbols-outlined text-[16px]">nights_stay</span> Evening: 04:00 PM – 05:30 PM
                          </div>
                          <span className="text-[11px] text-on-surface-variant block mt-0.5">Live Interactive Zoom only</span>
                        </div>
                        <span className={`material-symbols-outlined text-[20px] ${timeSlot === 'evening' ? 'text-secondary' : 'opacity-0'}`}>
                          check_circle
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Attendee Input Details */}
                  <div className="mt-6 space-y-3 pt-4 border-t border-surface-variant">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        className="h-11 px-3.5 rounded-xl bg-surface-container-lowest border border-surface-variant text-xs focus:border-secondary focus:outline-none"
                        placeholder="Parent or Student Name"
                        required
                        type="text"
                        value={demoName}
                        onChange={(e) => setDemoName(e.target.value)}
                      />
                      <input
                        className="h-11 px-3.5 rounded-xl bg-surface-container-lowest border border-surface-variant text-xs focus:border-secondary focus:outline-none"
                        placeholder="WhatsApp Number for Link"
                        required
                        type="tel"
                        value={demoPhone}
                        onChange={(e) => setDemoPhone(e.target.value)}
                      />
                    </div>
                    <button
                      className="w-full h-12 rounded-xl bg-secondary hover:bg-on-secondary-fixed-variant text-on-secondary font-title-md text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      type="submit"
                    >
                      <span>Reserve Free Demo Seat (₹0)</span>
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                    </button>
                    <p className="text-center text-[11px] text-on-surface-variant font-label-caps">
                      Zero spam • 100% Free • Interactive link dispatched via WhatsApp & SMS
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="w-full py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-surface-container-lowest">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-fixed/50 text-secondary font-label-caps text-[11px] tracking-wider uppercase mb-3 font-bold">
              <span className="material-symbols-outlined text-[15px]">help</span> CLEAR CLARITY
            </div>
            <h2 className="font-headline-lg text-3xl sm:text-4xl text-primary-container font-bold">
              Questions, answered <span className="relative inline-block text-secondary italic">plainly.</span>
            </h2>
            <p className="font-body-lg text-sm sm:text-base text-on-surface-variant mt-2">
              Everything you need to know about batch sizes, Prashant Sir's methodology, offline campuses, and results guarantee.
            </p>
          </div>

          <div className="space-y-4" id="faqAccordionContainer">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className={`rounded-2xl border transition-all ${
                    isOpen ? 'border-secondary bg-surface-container-low/40 p-5 shadow-xs' : 'border-surface-variant bg-surface-container-lowest p-5'
                  }`}
                >
                  <button
                    className="w-full flex items-center justify-between text-left font-title-lg text-base sm:text-lg text-primary-container font-bold focus:outline-none cursor-pointer"
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-secondary text-white text-xs flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      {faq.q}
                    </span>
                    <span className={`material-symbols-outlined text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                      expand_circle_down
                    </span>
                  </button>
                  {isOpen && (
                    <div className="mt-3 pt-3 border-t border-surface-variant/60 font-body-md text-xs sm:text-sm text-on-surface-variant leading-relaxed animate-fadeIn whitespace-pre-line">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
};
