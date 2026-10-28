import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getAppUrl,
  fetchLiveWebsiteCms,
  submitWebsiteLead,
  WebsiteCmsData,
  DEFAULT_WEBSITE_CMS,
} from '../config/appConfig';

export const Footer: React.FC = () => {
  const [callbackPhone, setCallbackPhone] = useState('');
  const [callbackSent, setCallbackSent] = useState(false);
  const [callbackError, setCallbackError] = useState('');
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

  const handleCallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = callbackPhone.replace(/\D/g, '');
    if (clean.length < 10) {
      setCallbackError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setCallbackError('');
    setCallbackSent(true);
    await submitWebsiteLead({
      name: 'Quick Callback Request',
      phone: clean,
      courseInterest: 'General Consultation',
      message: 'Parent requested urgent callback within 2 hours from website footer.',
      source: 'Footer Callback Widget',
    });
  };

  return (
    <footer className="w-full bg-slate-50 text-slate-700 border-t border-slate-200/80">
      {/* Top Credibility & Trust Strip */}
      <div className="w-full bg-white border-b border-slate-200/70 py-4 px-gutter-mobile lg:px-gutter-desktop">
        <div className="max-w-container-max mx-auto flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[18px]">verified</span>
            <span>ISO 9001:2015 Certified Memory Pedagogy</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[18px]">school</span>
            <span>5,000+ Successful Alumni in Maharashtra</span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[18px]">military_tech</span>
            <span>100% Written-Exam Record • Police Bharti</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[18px]">location_on</span>
            <span>Satara Flagship Campus • Near Powai Naka</span>
          </div>
        </div>
      </div>

      {/* Quick Callback Request Box */}
      <div className="max-w-container-max mx-auto px-gutter-mobile lg:px-gutter-desktop pt-8">
        <div className="bg-gradient-to-r from-secondary/10 via-white to-secondary/10 rounded-3xl p-6 md:p-8 border border-secondary/25 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 text-center md:text-left">
            <span className="text-[11px] font-black uppercase tracking-wider text-secondary bg-white px-3 py-1 rounded-full border border-secondary/20 shadow-2xs inline-block mb-2">
              ⚡ Quick Callback Support
            </span>
            <h3 className="text-lg md:text-xl font-bold text-slate-900">
              Free Counseling Callback for Parents (Within 2 Hours)
            </h3>
            <p className="text-xs md:text-sm text-slate-600 mt-1">
              Enter your mobile number to get personalized course guidance for your child. Prashant Sir or a senior mentor will call you back directly.
            </p>
          </div>

          <div className="w-full md:w-auto shrink-0">
            {callbackSent ? (
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-5 py-3 rounded-2xl flex items-center gap-2 text-xs font-bold">
                <span className="material-symbols-outlined text-emerald-600 text-[20px]">check_circle</span>
                <span>Thank you! Your callback request is registered. We will call you within 2 hours.</span>
              </div>
            ) : (
              <form onSubmit={handleCallbackSubmit} className="flex flex-col sm:flex-row items-center gap-2.5 w-full">
                <div className="relative w-full sm:w-64">
                  <input
                    type="tel"
                    value={callbackPhone}
                    onChange={(e) => {
                      setCallbackPhone(e.target.value);
                      if (callbackError) setCallbackError('');
                    }}
                    placeholder="10-digit mobile number (e.g. 9876543210)"
                    className="w-full pl-3.5 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/15 transition shadow-2xs"
                  />
                  {callbackError && (
                    <span className="absolute -bottom-5 left-1 text-[10px] text-red-600 font-bold whitespace-nowrap">
                      {callbackError}
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/90 text-white text-xs font-bold shadow-md shadow-secondary/20 transition active:scale-95 cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">call</span>
                  <span>Request Callback</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-container-max mx-auto px-gutter-mobile lg:px-gutter-desktop pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 mb-12">
          {/* Col 1: Brand & Social Channels (3 cols) */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center text-white shadow-md">
                <span className="material-symbols-outlined text-[22px]">psychology</span>
              </div>
              <div>
                <span className="font-title-lg text-lg sm:text-xl text-slate-900 font-bold block leading-tight tracking-tight">
                  MindMaster Academy
                </span>
                <span className="text-[10px] text-secondary font-label-caps font-bold tracking-wider">
                  TRAIN YOUR MIND • MASTER YOUR MEMORY
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Maharashtra’s premier institute for scientific memory systems, Maharashtra Police Bharti 100% written test preparation, and Vedic mathematics. Founded and mentored by <strong>Prashant Dhumal</strong> in Satara.
            </p>

            {/* Official Social Media Buttons */}
            <div className="pt-2">
              <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                Connect With Us
              </p>
              <div className="flex items-center flex-wrap gap-2.5">
                {/* Instagram */}
                <a
                  href={cms.seoAndSocial?.instagramUrl || "https://www.instagram.com"}
                  target="_blank"
                  rel="noreferrer"
                  title="Follow MindMaster Academy on Instagram"
                  aria-label="Instagram"
                  className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-white hover:bg-gradient-to-tr hover:from-amber-500 hover:via-pink-500 hover:to-purple-600 hover:border-transparent transition-all shadow-xs flex items-center justify-center group"
                >
                  <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>

                {/* YouTube */}
                <a
                  href={cms.seoAndSocial?.youtubeUrl || "https://www.youtube.com/@mindmasteracademy"}
                  target="_blank"
                  rel="noreferrer"
                  title="Subscribe to MindMaster Academy on YouTube"
                  aria-label="YouTube"
                  className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-white hover:bg-[#FF0000] hover:border-transparent transition-all shadow-xs flex items-center justify-center group"
                >
                  <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>

                {/* Telegram */}
                {cms.seoAndSocial?.telegramUrl && (
                  <a
                    href={cms.seoAndSocial.telegramUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="Join MindMaster Academy Telegram"
                    aria-label="Telegram"
                    className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-white hover:bg-[#229ED9] hover:border-transparent transition-all shadow-xs flex items-center justify-center group"
                  >
                    <span className="material-symbols-outlined text-[20px] transition-transform group-hover:scale-110">send</span>
                  </a>
                )}

                {/* WhatsApp */}
                <a
                  href={`https://wa.me/${(cms.seoAndSocial?.whatsappNumber || "918459344077").replace(/\D/g, "")}?text=Hello%20MindMaster%20Academy%2C%20I%20want%20information%20about%20your%20courses.`}
                  target="_blank"
                  rel="noreferrer"
                  title="Chat directly on WhatsApp"
                  aria-label="WhatsApp"
                  className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-white hover:bg-[#25D366] hover:border-transparent transition-all shadow-xs flex items-center justify-center group"
                >
                  <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Col 2: Flagship Courses (2 cols) */}
          <div className="lg:col-span-2">
            <h3 className="font-title-md text-xs sm:text-sm text-slate-900 font-bold uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-[18px]">menu_book</span>
              Programmes
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600">
              <li>
                <Link className="hover:text-secondary transition-colors flex items-center gap-1.5 group" to="/courses?category=school">
                  <span className="text-secondary text-xs group-hover:translate-x-0.5 transition-transform">▸</span>
                  <span>Memory Technique</span>
                </Link>
              </li>
              <li>
                <Link className="hover:text-secondary transition-colors flex items-center gap-1.5 group" to="/courses?category=trainer">
                  <span className="text-secondary text-xs group-hover:translate-x-0.5 transition-transform">▸</span>
                  <span>Train Trainer (TTT)</span>
                </Link>
              </li>
              <li>
                <Link className="hover:text-secondary transition-colors flex items-center gap-1.5 group" to="/courses?category=police">
                  <span className="text-secondary text-xs group-hover:translate-x-0.5 transition-transform">▸</span>
                  <span>Police Bharti 100%</span>
                </Link>
              </li>
              <li>
                <Link className="hover:text-secondary transition-colors flex items-center gap-1.5 group" to="/courses?category=maths">
                  <span className="text-secondary text-xs group-hover:translate-x-0.5 transition-transform">▸</span>
                  <span>500-Yr Calendar</span>
                </Link>
              </li>
              <li>
                <Link className="hover:text-secondary transition-colors flex items-center gap-1.5 group" to="/courses?category=maths">
                  <span className="text-secondary text-xs group-hover:translate-x-0.5 transition-transform">▸</span>
                  <span>Vedic Maths</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: NEW Dedicated Student App & Web Portal (3 cols) */}
          <div className="lg:col-span-3">
            <h3 className="font-title-md text-xs sm:text-sm text-slate-900 font-bold uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-[18px]">devices</span>
              Student App &amp; Web Portal
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600">
              <li>
                <a 
                  className="hover:text-secondary transition-colors flex items-center gap-1.5 group font-bold text-slate-900" 
                  href={getAppUrl('/login?next=/home')}
                >
                  <span className="material-symbols-outlined text-secondary text-[16px]">account_circle</span>
                  <span>Student Login (Web Portal)</span>
                </a>
              </li>
              <li>
                <a 
                  className="hover:text-secondary transition-colors flex items-center gap-1.5 group font-semibold text-slate-800" 
                  href={getAppUrl('/my-courses')}
                >
                  <span className="material-symbols-outlined text-secondary text-[16px]">play_circle</span>
                  <span>My Enrolled Courses</span>
                </a>
              </li>
              <li>
                <a 
                  className="hover:text-secondary transition-colors flex items-center gap-1.5 group" 
                  href={getAppUrl('/books')}
                >
                  <span className="material-symbols-outlined text-secondary text-[16px]">book</span>
                  <span>Course Books &amp; Free PDFs</span>
                </a>
              </li>
              <li>
                <a 
                  className="hover:text-secondary transition-colors flex items-center gap-1.5 group" 
                  href={getAppUrl('/notes')}
                >
                  <span className="material-symbols-outlined text-secondary text-[16px]">edit_note</span>
                  <span>Lecture Study Notes</span>
                </a>
              </li>
              <li className="pt-2">
                <a 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-all shadow-2xs" 
                  href={getAppUrl('/home?install=true')}
                >
                  <span className="material-symbols-outlined text-emerald-700 text-[16px]">install_mobile</span>
                  <span>Install Mobile App (PWA)</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Navigation & Legal Policies (2 cols) */}
          <div className="lg:col-span-2">
            <h3 className="font-title-md text-xs sm:text-sm text-slate-900 font-bold uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-[18px]">policy</span>
              Important Links
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600">
              <li>
                <Link className="hover:text-secondary transition-colors flex items-center gap-1.5 group" to="/about">
                  <span className="text-secondary text-xs group-hover:translate-x-0.5 transition-transform">▸</span>
                  <span>About Prashant Sir</span>
                </Link>
              </li>
              <li>
                <Link className="hover:text-secondary transition-colors flex items-center gap-1.5 group" to="/results">
                  <span className="text-secondary text-xs group-hover:translate-x-0.5 transition-transform">▸</span>
                  <span>Success Stories (All)</span>
                </Link>
              </li>
              <li>
                <Link className="hover:text-secondary transition-colors flex items-center gap-1.5 group text-slate-600" to="/results?category=police">
                  <span className="text-secondary text-[10px] group-hover:translate-x-0.5 transition-transform">▸</span>
                  <span>Police Bharti Merit</span>
                </Link>
              </li>
              <li>
                <Link className="hover:text-secondary transition-colors flex items-center gap-1.5 group text-slate-600" to="/results?category=mpsc">
                  <span className="text-secondary text-[10px] group-hover:translate-x-0.5 transition-transform">▸</span>
                  <span>MPSC State Rankers</span>
                </Link>
              </li>
              <li>
                <Link className="hover:text-secondary transition-colors flex items-center gap-1.5 group font-semibold text-slate-800" to="/brain-games">
                  <span className="material-symbols-outlined text-amber-500 text-[16px]">sports_esports</span>
                  <span>🎮 Brain Games</span>
                </Link>
              </li>
              <li>
                <Link className="font-bold text-emerald-700 hover:text-emerald-800 transition-colors flex items-center gap-1.5" to="/verify-certificate">
                  <span className="material-symbols-outlined text-emerald-600 text-[16px]">verified</span>
                  <span>🛡️ Verify Certificate</span>
                </Link>
              </li>
              <li className="pt-2 border-t border-slate-200">
                <Link className="font-bold text-slate-900 hover:text-secondary transition-colors flex items-center gap-1.5" to="/privacy">
                  <span className="material-symbols-outlined text-secondary text-[15px]">verified_user</span>
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link className="font-bold text-slate-900 hover:text-secondary transition-colors flex items-center gap-1.5" to="/terms">
                  <span className="material-symbols-outlined text-secondary text-[15px]">gavel</span>
                  <span>Terms &amp; Conditions</span>
                </Link>
              </li>
              <li>
                <Link className="font-bold text-slate-900 hover:text-secondary transition-colors flex items-center gap-1.5" to="/refund">
                  <span className="material-symbols-outlined text-secondary text-[15px]">sync_saved_locally</span>
                  <span>Refund &amp; Cancellation</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 5: Satara HQ Campus & Direct Helpline (2 cols) */}
          <div className="lg:col-span-2">
            <h3 className="font-title-md text-xs sm:text-sm text-slate-900 font-bold uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-[18px]">apartment</span>
              Campuses &amp; Centres
            </h3>
            <div className="space-y-3 text-xs sm:text-sm text-slate-600">
              <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <p className="font-bold text-slate-900 text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Satara Main Campus (HQ)
                </p>
                <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                  Near Powai Naka, Satara - 415001
                </p>
                <p className="text-[10px] text-slate-500 mt-1 border-t border-slate-100 pt-1">
                  Centres: Pune FC Road • Nashik
                </p>
              </div>

              <div className="flex flex-col gap-1.5 pt-1">
                <a
                  href="tel:+918459344077"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-secondary transition-colors"
                >
                  <span className="material-symbols-outlined text-secondary text-[16px]">call</span>
                  <span>+91 84593 44077</span>
                </a>
                <a
                  href="mailto:mindmasterdhumal@gmail.com"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-secondary transition-colors truncate"
                >
                  <span className="material-symbols-outlined text-secondary text-[16px]">mail</span>
                  <span>mindmasterdhumal@gmail.com</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legal Copyright Bar */}
        <div className="border-t border-slate-200 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left text-xs text-slate-500">
          <p>
            © 2026 MindMaster Academy • Founded & Mentored by <strong>Prashant Dhumal</strong> • Satara, Maharashtra.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-600">
            <Link to="/privacy" className="hover:text-secondary transition-colors underline-offset-4 hover:underline">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-secondary transition-colors underline-offset-4 hover:underline">
              Terms & Conditions
            </Link>
            <span>•</span>
            <Link to="/refund" className="hover:text-secondary transition-colors underline-offset-4 hover:underline">
              Refund Policy
            </Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-secondary transition-colors">
              Satara Campus
            </Link>
            <span>•</span>
            <a
              href={getAppUrl('/staff/login')}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-600 transition-colors"
              title="Restricted Staff & Admin Portal"
            >
              Staff Portal
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

