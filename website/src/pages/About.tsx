import React from 'react';
import { Link } from 'react-router-dom'; export const About: React.FC = () => { return ( <main className="w-full pt-24 sm:pt-28 bg-background min-h-screen"> <div className="flex flex-col w-full"> <div className="relative w-full overflow-hidden">
<div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-secondary-fixed/40 rounded-full blur-3xl pointer-events-none -z-10"></div> <section className="w-full max-w-container-max mx-auto px-gutter-desktop pt-space-3xl pb-space-2xl text-center flex flex-col items-center"> <div className="inline-flex items-center gap-space-xs px-space-md py-1.5 rounded-full bg-secondary-fixed/50 mb-space-lg shadow-sm">
<span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
<span className="font-label-caps text-label-caps text-secondary tracking-widest">SINCE 2015</span>
</div> <h1 className="font-display-hero text-display-hero text-primary-container max-w-3xl mb-space-md tracking-tight"> We exist to make minds <span className="relative inline-block text-secondary"> powerful. <svg className="absolute -bottom-2.5 left-0 w-full overflow-visible" fill="none" height="14" viewBox="0 0 240 14" xmlns="http://www.w3.org/2000/svg">
<path className="text-secondary/75" d="M3 10.5C48 3.5 142 -2 237 9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.5" />
</svg>
</span>
</h1> <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed"> From a single Satara classroom to 5,000+ learners across Maharashtra — one mission has never changed. </p> <div className="mt-space-2xl grid grid-cols-2 sm:grid-cols-4 gap-space-md w-full max-w-4xl pt-space-lg">
<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col items-center">
<span className="font-headline-lg text-headline-lg text-secondary">10+</span>
<span className="font-label-caps text-label-caps text-on-surface-variant mt-1">Years of Rigor</span>
</div>
<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col items-center">
<span className="font-headline-lg text-headline-lg text-primary-container">5,000+</span>
<span className="font-label-caps text-label-caps text-on-surface-variant mt-1">Students Coached</span>
</div>
<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col items-center">
<span className="font-headline-lg text-headline-lg text-secondary">100%</span>
<span className="font-label-caps text-label-caps text-on-surface-variant mt-1">Pass Milestone</span>
</div>
<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col items-center">
<span className="font-headline-lg text-headline-lg text-primary-container">120+</span>
<span className="font-label-caps text-label-caps text-on-surface-variant mt-1">Certified Mentors</span>
</div>
</div>
</section>
</div> <section className="w-full bg-surface-container-lowest py-space-3xl">
<div className="max-w-container-max mx-auto px-gutter-desktop">
<div className="bg-secondary-fixed/30 rounded-[28px] p-space-lg md:p-space-2xl shadow-sm">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-2xl items-center"> <div className="lg:col-span-5 relative flex justify-center">
<div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-md bg-surface-container">
<img alt="Sagar Dhumal — Founder & Memory Coach" className="w-full h-[460px] object-cover object-top transition-transform duration-500 hover:scale-105" data-alt="Professional modern executive portrait of Sagar Dhumal, educator and founder of MindMaster Academy, in dark navy business suit and tie." src="/assets/images/prashant_dhumal_executive_portrait.png" />
<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary-container/85 via-primary-container/30 to-transparent p-space-lg flex items-end">
<div className="bg-surface-container-lowest/95 backdrop-blur-md px-space-md py-space-xs rounded-full shadow-md flex items-center gap-space-xs">
<span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "\'FILL\' 1" }}>verified</span>
<span className="font-title-md text-title-md text-primary-container text-xs sm:text-sm">Sagar Dhumal — Founder & Memory Coach</span>
</div>
</div>
</div>
</div> <div className="lg:col-span-7 flex flex-col items-start space-y-space-md">
<div className="inline-flex items-center gap-2">
<span className="h-2 w-2 rounded-full bg-secondary"></span>
<span className="font-label-caps text-label-caps text-secondary tracking-wider">OUR MISSION</span>
</div>
<h2 className="font-headline-lg text-headline-lg text-primary-container tracking-tight"> One mission: an empowered generation. </h2>
<p className="font-body-md text-body-md text-on-surface-variant leading-relaxed"> We take the ordinary student of the smallest village and build knowledge, concentration, a study plan, a goal and a permanent memory — until any exam, from Class-One services to scholarship tests, feels simple. </p> <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md w-full pt-space-xs">
<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center gap-space-sm hover:shadow-md transition-shadow">
<div className="w-9 h-9 rounded-full bg-secondary-fixed flex items-center justify-center shrink-0">
<span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "\'FILL\' 1" }}>check_circle</span>
</div>
<span className="font-title-md text-body-md text-primary-container">Concentration & study technique</span>
</div>
<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center gap-space-sm hover:shadow-md transition-shadow">
<div className="w-9 h-9 rounded-full bg-secondary-fixed flex items-center justify-center shrink-0">
<span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "\'FILL\' 1" }}>check_circle</span>
</div>
<span className="font-title-md text-body-md text-primary-container">Timetable & goal planning</span>
</div>
<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center gap-space-sm hover:shadow-md transition-shadow">
<div className="w-9 h-9 rounded-full bg-secondary-fixed flex items-center justify-center shrink-0">
<span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "\'FILL\' 1" }}>check_circle</span>
</div>
<span className="font-title-md text-body-md text-primary-container">Permanent retention systems</span>
</div>
<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center gap-space-sm hover:shadow-md transition-shadow">
<div className="w-9 h-9 rounded-full bg-secondary-fixed flex items-center justify-center shrink-0">
<span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "\'FILL\' 1" }}>check_circle</span>
</div>
<span className="font-title-md text-body-md text-primary-container">Confidence under exam pressure</span>
</div>
</div> <div className="pt-space-md flex flex-col items-start">
<span className="font-headline-md text-headline-md italic font-serif text-secondary tracking-wide select-none" > Sagar Dhumal </span>
<span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest mt-1">Founder & Lead Coach</span>
</div>
</div>
</div>
</div>
</div>
</section> <section className="w-full py-space-3xl bg-surface">
<div className="max-w-container-max mx-auto px-gutter-desktop"> <div className="text-center max-w-2xl mx-auto mb-space-2xl">
<h2 className="font-headline-lg text-headline-lg text-primary-container mb-space-xs"> The <span className="relative inline-block text-secondary"> journey <svg className="absolute -bottom-2 left-0 w-full overflow-visible" fill="none" height="10" viewBox="0 0 160 10" xmlns="http://www.w3.org/2000/svg">
<path className="text-secondary/75" d="M2 7C40 2 110 1 158 6" stroke="currentColor" strokeLinecap="round" strokeWidth="3.5" />
</svg>
</span> so far </h2>
<p className="font-body-md text-body-md text-on-surface-variant"> A decade of transforming learning mindsets, one batch at a time. </p>
</div> <div className="relative"> <div className="hidden lg:block absolute top-12 left-12 right-12 h-0.5 bg-surface-variant -z-0"></div>
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-lg relative z-10"> <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col group">
<div className="flex items-center justify-between mb-space-md">
<span className="inline-block px-3 py-1 rounded-full bg-secondary-fixed text-secondary font-label-caps text-label-caps tracking-wider"> 2015 </span>
<div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
<span className="material-symbols-outlined text-[20px]">school</span>
</div>
</div>
<h3 className="font-title-lg text-title-lg text-primary-container mb-space-xs">Pioneering Batch</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant"> First memory workshop conducted in a modest Satara classroom with 18 eager students. </p>
</div> <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col group">
<div className="flex items-center justify-between mb-space-md">
<span className="inline-block px-3 py-1 rounded-full bg-secondary-fixed text-secondary font-label-caps text-label-caps tracking-wider"> 2018 </span>
<div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
<span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "\'FILL\' 1" }}>military_tech</span>
</div>
</div>
<h3 className="font-title-lg text-title-lg text-primary-container mb-space-xs">Police Bharti Triumph</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant"> Complete cohort achieved 100% written test qualification across Maharashtra police recruitment. </p>
</div> <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col group">
<div className="flex items-center justify-between mb-space-md">
<span className="inline-block px-3 py-1 rounded-full bg-secondary-fixed text-secondary font-label-caps text-label-caps tracking-wider"> 2022 </span>
<div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
<span className="material-symbols-outlined text-[20px]">workspace_premium</span>
</div>
</div>
<h3 className="font-title-lg text-title-lg text-primary-container mb-space-xs">Train The Trainer</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant"> Launched pedagogical certification curriculum, graduating 120 certified memory educators statewide. </p>
</div> <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col group">
<div className="flex items-center justify-between mb-space-md">
<span className="inline-block px-3 py-1 rounded-full bg-secondary text-on-secondary font-label-caps text-label-caps tracking-wider"> 2026 </span>
<div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
<span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "\'FILL\' 1" }}>star</span>
</div>
</div>
<h3 className="font-title-lg text-title-lg text-primary-container mb-space-xs">5,000+ Strong</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant"> Statewide educational movement originating from Satara and spanning Pune, Nashik, and rural learning circles. </p>
</div>
</div>
</div>
</div>
</section> <section className="w-full py-space-3xl bg-surface-container-lowest">
<div className="max-w-container-max mx-auto px-gutter-desktop">
<div className="text-center max-w-xl mx-auto mb-space-2xl">
<h2 className="font-headline-lg text-headline-lg text-primary-container mb-space-xs">Our Core Principles</h2>
<p className="font-body-md text-body-md text-on-surface-variant">The bedrock of every curriculum we design.</p>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg"> <div className="bg-surface p-space-xl rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col items-start">
<div className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary font-title-lg text-title-lg font-bold mb-space-lg"> 01 </div>
<h3 className="font-headline-sm text-headline-sm text-primary-container mb-space-xs">Clarity</h3>
<p className="font-body-md text-body-md text-on-surface-variant leading-relaxed"> Every technique is explained in plain language first. No pseudo-intellectual jargon — just actionable mental levers that click immediately. </p>
</div> <div className="bg-surface p-space-xl rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col items-start">
<div className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary font-title-lg text-title-lg font-bold mb-space-lg"> 02 </div>
<h3 className="font-headline-sm text-headline-sm text-primary-container mb-space-xs">Practice</h3>
<p className="font-body-md text-body-md text-on-surface-variant leading-relaxed"> Drills repeat until speed becomes habit. Theory is only as valuable as the neural reflexes formed under rigorous timed conditions. </p>
</div> <div className="bg-surface p-space-xl rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col items-start">
<div className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary font-title-lg text-title-lg font-bold mb-space-lg"> 03 </div>
<h3 className="font-headline-sm text-headline-sm text-primary-container mb-space-xs">Confidence</h3>
<p className="font-body-md text-body-md text-on-surface-variant leading-relaxed"> Mock exams turn fear into routine. When the mind has solved the pattern dozens of times, the real examination hall becomes familiar territory. </p>
</div>
</div>
</div>
</section> <section className="w-full py-space-3xl bg-surface">
<div className="max-w-container-max mx-auto px-gutter-desktop">
<div className="text-center max-w-xl mx-auto mb-space-2xl">
<h2 className="font-headline-lg text-headline-lg text-primary-container mb-space-xs"> The MindMaster <span className="relative inline-block text-secondary"> Method <svg className="absolute -bottom-2 left-0 w-full overflow-visible" fill="none" height="10" viewBox="0 0 160 10" xmlns="http://www.w3.org/2000/svg">
<path className="text-secondary/75" d="M2 7C45 2 110 2 158 6" stroke="currentColor" strokeLinecap="round" strokeWidth="3.5" />
</svg>
</span>
</h2>
<p className="font-body-md text-body-md text-on-surface-variant">A 4-stage cognitive architecture engineered for academic excellence.</p>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg"> <div className="bg-surface-container-lowest p-space-xl rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-space-lg">
<span className="font-display-hero text-headline-lg text-secondary/30 select-none">01</span>
<div className="w-11 h-11 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary">
<span className="material-symbols-outlined text-[24px]">psychology_alt</span>
</div>
</div>
<h3 className="font-headline-sm text-headline-sm text-primary-container mb-space-xs">Encode</h3>
<p className="font-body-md text-body-md text-on-surface-variant mb-space-lg"> Transforming abstract academic facts, historical dates, and numerical formulas into high-vividness visual architectures. </p>
</div>
<div className="flex flex-wrap gap-space-xs pt-space-xs">
<span className="px-3 py-1.5 rounded-full bg-surface-container font-label-caps text-label-caps text-primary-container">Link method</span>
<span className="px-3 py-1.5 rounded-full bg-surface-container font-label-caps text-label-caps text-primary-container">Story chains</span>
<span className="px-3 py-1.5 rounded-full bg-surface-container font-label-caps text-label-caps text-primary-container">Memory palace</span>
</div>
</div> <div className="bg-surface-container-lowest p-space-xl rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-space-lg">
<span className="font-display-hero text-headline-lg text-secondary/30 select-none">02</span>
<div className="w-11 h-11 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary">
<span className="material-symbols-outlined text-[24px]">center_focus_strong</span>
</div>
</div>
<h3 className="font-headline-sm text-headline-sm text-primary-container mb-space-xs">Focus</h3>
<p className="font-body-md text-body-md text-on-surface-variant mb-space-lg"> Cultivating unbroken cognitive flow states that eliminate smartphone fatigue, wandering thoughts, and study friction. </p>
</div>
<div className="flex flex-wrap gap-space-xs pt-space-xs">
<span className="px-3 py-1.5 rounded-full bg-surface-container font-label-caps text-label-caps text-primary-container">Breath reset</span>
<span className="px-3 py-1.5 rounded-full bg-surface-container font-label-caps text-label-caps text-primary-container">Single-task timers</span>
<span className="px-3 py-1.5 rounded-full bg-surface-container font-label-caps text-label-caps text-primary-container">Distraction logs</span>
</div>
</div> <div className="bg-surface-container-lowest p-space-xl rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-space-lg">
<span className="font-display-hero text-headline-lg text-secondary/30 select-none">03</span>
<div className="w-11 h-11 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary">
<span className="material-symbols-outlined text-[24px]">history_edu</span>
</div>
</div>
<h3 className="font-headline-sm text-headline-sm text-primary-container mb-space-xs">Recall</h3>
<p className="font-body-md text-body-md text-on-surface-variant mb-space-lg"> Replacing passive re-reading with active spaced retrieval intervals that permanently consolidate neural traces. </p>
</div>
<div className="flex flex-wrap gap-space-xs pt-space-xs">
<span className="px-3 py-1.5 rounded-full bg-surface-container font-label-caps text-label-caps text-primary-container">1-7-30 revision</span>
<span className="px-3 py-1.5 rounded-full bg-surface-container font-label-caps text-label-caps text-primary-container">Blank-page recall</span>
<span className="px-3 py-1.5 rounded-full bg-surface-container font-label-caps text-label-caps text-primary-container">Self-quizzing</span>
</div>
</div> <div className="bg-surface-container-lowest p-space-xl rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-space-lg">
<span className="font-display-hero text-headline-lg text-secondary/30 select-none">04</span>
<div className="w-11 h-11 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary">
<span className="material-symbols-outlined text-[24px]">trophy</span>
</div>
</div>
<h3 className="font-headline-sm text-headline-sm text-primary-container mb-space-xs">Perform</h3>
<p className="font-body-md text-body-md text-on-surface-variant mb-space-lg"> Real-time physiological conditioning and time budgeting to ensure peak test execution without mental blankouts. </p>
</div>
<div className="flex flex-wrap gap-space-xs pt-space-xs">
<span className="px-3 py-1.5 rounded-full bg-surface-container font-label-caps text-label-caps text-primary-container">Timed papers</span>
<span className="px-3 py-1.5 rounded-full bg-surface-container font-label-caps text-label-caps text-primary-container">Error journals</span>
<span className="px-3 py-1.5 rounded-full bg-surface-container font-label-caps text-label-caps text-primary-container">Exam-day rituals</span>
</div>
</div>
</div>
</div>
</section> <section className="w-full py-space-2xl bg-surface-container-lowest overflow-hidden">
<div className="max-w-container-max mx-auto px-gutter-desktop">
<div className="flex flex-col md:flex-row md:items-end justify-between mb-space-xl gap-space-md">
<div>
<span className="font-label-caps text-label-caps text-secondary tracking-widest block mb-1">REAL CLASSROOMS, REAL BREAKTHROUGHS</span>
<h2 className="font-headline-md text-headline-md text-primary-container">Life inside the Academy</h2>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant max-w-md"> Step into our high-energy training hubs where memory techniques transition into lifelong academic autonomy. </p>
</div>
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-lg">
<div className="group relative rounded-2xl overflow-hidden shadow-sm aspect-[4/3] bg-surface-container">
<img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" data-alt="Young Indian students actively participating in a bright modern lecture hall at MindMaster Academy, drawing memory diagrams on whiteboards with colorful markers, smiling with confidence." src="/assets/images/classroom_memory_drills.png" />
<div className="absolute inset-0 bg-gradient-to-t from-primary-container/80 via-transparent to-transparent flex items-end p-space-md">
<span className="text-on-primary font-title-md text-title-md">Interactive Mnemonic Workshops</span>
</div>
</div>
<div className="group relative rounded-2xl overflow-hidden shadow-sm aspect-[4/3] bg-surface-container">
<img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" data-alt="Close up shot of focused high school girl with notebook solving rapid Vedic mathematics problems under warm library lamp illumination, looking clear-headed and triumphant." src="/assets/images/student_mental_vedic_maths.png" />
<div className="absolute inset-0 bg-gradient-to-t from-primary-container/80 via-transparent to-transparent flex items-end p-space-md">
<span className="text-on-primary font-title-md text-title-md">Speed Calculation Drills</span>
</div>
</div>
<div className="group relative rounded-2xl overflow-hidden shadow-sm aspect-[4/3] bg-surface-container sm:col-span-2 lg:col-span-1">
<img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" data-alt="Coach Sagar Dhumal mentoring a small group of competitive examination aspirants around an oak study table in Maharashtra academy, sharing strategic timetable notes." src="/assets/images/instructor_coaching_adults.png" />
<div className="absolute inset-0 bg-gradient-to-t from-primary-container/80 via-transparent to-transparent flex items-end p-space-md">
<span className="text-on-primary font-title-md text-title-md">Mentorship & Goal Alignment</span>
</div>
</div>
</div>
</div>
</section> <section className="w-full py-space-3xl bg-surface">
<div className="max-w-container-max mx-auto px-gutter-desktop">
<div className="relative bg-secondary text-on-secondary rounded-[28px] p-space-xl md:p-space-3xl overflow-hidden shadow-xl"> <svg className="absolute -right-16 -top-16 w-96 h-96 opacity-15 pointer-events-none text-on-secondary" fill="none" stroke="currentColor" viewBox="0 0 200 200">
<circle cx="100" cy="100" r="40" strokeDasharray="4 4" strokeWidth="2" />
<circle cx="100" cy="100" r="70" strokeWidth="2" />
<circle cx="100" cy="100" r="100" strokeDasharray="6 6" strokeWidth="2" />
<circle cx="100" cy="100" r="130" strokeWidth="1.5" />
<path d="M30 100 Q 100 20 170 100 T 30 100" strokeWidth="2" />
</svg>
<div className="relative z-10 max-w-2xl">
<span className="inline-block px-3 py-1 rounded-full bg-on-secondary/15 font-label-caps text-label-caps text-on-secondary uppercase tracking-widest mb-space-md"> START YOUR JOURNEY </span>
<h2 className="font-display-hero text-headline-lg md:text-display-hero text-on-secondary tracking-tight mb-space-sm leading-tight"> Meet the team behind the method. </h2>
<p className="font-body-lg text-body-lg text-secondary-fixed opacity-95 mb-space-2xl max-w-xl"> Experience our cognitive training first-hand with a live 45-minute orientation. </p>
<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-space-md">
<Link className="inline-flex items-center justify-center gap-space-xs h-12 px-space-xl rounded-full bg-surface-container-lowest text-secondary font-title-md text-title-md hover:bg-secondary-fixed transition-colors shadow-md group" data-path="enroll-now" to="/contact">
<span className="">Book a Free Demo Class</span>
<span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1">arrow_forward</span>
</Link>
<a className="inline-flex items-center justify-center gap-space-xs h-12 px-space-xl rounded-full bg-on-secondary/10 hover:bg-on-secondary/20 text-on-secondary font-title-md text-title-md transition-colors" href="tel:+918459344077">
<span className="material-symbols-outlined text-[18px]">call</span>
<span className="">Call +91 84593 44077</span>
</a>
</div>
</div>
</div>
</div>
</section>
</div> </main> );
};
