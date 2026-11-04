import React from 'react';
import { Link } from 'react-router-dom';
import { getAppUrl } from '../config/appConfig';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-slate-50 text-slate-700 border-t border-slate-200">
      {/* Consultation Banner — Sleek & Uncluttered */}
      <div className="w-full bg-white border-b border-slate-200/80 py-8 px-gutter-mobile lg:px-gutter-desktop">
        <div className="max-w-container-max mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Ready to accelerate your child’s learning?
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-xl">
              Connect directly with Prashant Dhumal Sir’s team for course guidance, demo scheduling, or campus visits.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <a
              href="https://wa.me/918459344077?text=Hello%20Prashant%20Sir%2C%20I%20would%20like%20guidance%20regarding%20MindMaster%20courses."
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat with Prashant Sir on WhatsApp"
              className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs tracking-wide shadow-sm transition-all"
            >
              <span>Chat on WhatsApp</span>
            </a>
            <a
              href="tel:+918459344077"
              aria-label="Call MindMaster Academy helpline at +91 84593 44077"
              className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs tracking-wide shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">call</span>
              <span>+91 84593 44077</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main 4-Column Grid */}
      <div className="max-w-container-max mx-auto px-gutter-mobile lg:px-gutter-desktop py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12">
          {/* Column 1: Brand & Overview (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0052FF] flex items-center justify-center text-white shadow-sm shrink-0">
                <span className="material-symbols-outlined text-[22px]">psychology</span>
              </div>
              <div>
                <span className="font-bold text-lg text-slate-900 block leading-tight tracking-tight">
                  MindMaster Academy
                </span>
                <span className="text-[11px] text-[#0052FF] font-semibold tracking-wider uppercase">
                  Cognitive Science &amp; Vedic Maths
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed max-w-sm">
              Maharashtra’s premier cognitive development institute founded by International Memory Trainer <strong>Prashant Dhumal</strong>. ISO 9001:2015 certified pedagogy with over 50,000 students empowered.
            </p>

            {/* Clean Social Links */}
            <div className="flex items-center gap-2 pt-2">
              <a
                href="https://www.youtube.com/@mindmasteracademy"
                target="_blank"
                rel="noopener noreferrer"
                title="MindMaster on YouTube"
                aria-label="YouTube"
                className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-red-600 hover:border-slate-300 transition-colors flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>

              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                title="MindMaster on Instagram"
                aria-label="Instagram"
                className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-pink-600 hover:border-slate-300 transition-colors flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>

              <a
                href="https://wa.me/918459344077"
                target="_blank"
                rel="noopener noreferrer"
                title="MindMaster on WhatsApp"
                aria-label="WhatsApp"
                className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-emerald-700 hover:border-slate-300 transition-colors flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Academic Programs (2.5 Cols) */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Academic Programs
            </h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>
                <Link to="/courses" className="hover:text-[#0052FF] transition-colors block py-0.5">
                  Vedic Mathematics
                </Link>
              </li>
              <li>
                <Link to="/courses" className="hover:text-[#0052FF] transition-colors block py-0.5">
                  Photographic Memory Mastery
                </Link>
              </li>
              <li>
                <Link to="/courses" className="hover:text-[#0052FF] transition-colors block py-0.5">
                  500-Year Calendar Speed Tricks
                </Link>
              </li>
              <li>
                <Link to="/courses" className="hover:text-[#0052FF] transition-colors block py-0.5">
                  Speed Math &amp; Calculation Drills
                </Link>
              </li>
              <li>
                <Link to="/courses" className="hover:text-[#0052FF] transition-colors block py-0.5">
                  Certified Teacher Training (TTT)
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Navigation & Verification (2.5 Cols) */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Explore &amp; Verify
            </h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>
                <Link to="/about" className="hover:text-[#0052FF] transition-colors block py-0.5">
                  About Prashant Sir
                </Link>
              </li>
              <li>
                <Link to="/demo" className="hover:text-[#0052FF] transition-colors block py-0.5">
                  Free Demo Hub
                </Link>
              </li>
              <li>
                <Link to="/brain-games" className="hover:text-[#0052FF] transition-colors block py-0.5">
                  Brain Games &amp; Exercises
                </Link>
              </li>
              <li>
                <Link to="/results" className="hover:text-[#0052FF] transition-colors block py-0.5">
                  Student Success Stories
                </Link>
              </li>
              <li>
                <Link to="/verify-certificate" className="inline-flex items-center gap-1.5 text-emerald-800 hover:text-emerald-950 font-bold transition-colors py-0.5">
                  <span className="material-symbols-outlined text-[15px] text-emerald-600">verified</span>
                  <span>Verify Certificate &amp; Marksheet</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Satara Campus & Direct Support (3 Cols) */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Satara Flagship Campus
            </h3>
            <div className="space-y-3 text-sm text-slate-600">
              <p className="leading-snug">
                Near Powai Naka, Satara City<br />
                Taluka: Satara, Dist: Satara<br />
                Maharashtra, PIN: 415001
              </p>

              <div className="pt-2 flex flex-col gap-2">
                <a
                  href="tel:+918459344077"
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-900 hover:text-[#0052FF] transition-colors py-1 min-h-[44px]"
                  aria-label="Call Satara Campus: +91 84593 44077"
                >
                  <span className="material-symbols-outlined text-[#0052FF] text-[18px]">call</span>
                  <span>+91 84593 44077</span>
                </a>
                <a
                  href="mailto:mindmasterdhumal@gmail.com"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-[#0052FF] transition-colors py-1 min-h-[44px] truncate"
                  aria-label="Email MindMaster Academy: mindmasterdhumal@gmail.com"
                >
                  <span className="material-symbols-outlined text-[#0052FF] text-[18px]">mail</span>
                  <span>mindmasterdhumal@gmail.com</span>
                </a>
              </div>

              <div className="pt-2">
                <a
                  href={getAppUrl('/login')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-full bg-slate-900 hover:bg-[#0052FF] text-white text-xs font-bold transition-all shadow-sm"
                >
                  <span>Student Portal Login</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Clean Legal & Copyright Bar */}
        <div className="border-t border-slate-200 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <p className="text-center md:text-left">
            © 2026 MindMaster Academy. Founded &amp; mentored by <strong>Prashant Dhumal</strong>. Satara, Maharashtra.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-5 font-semibold text-slate-700">
            <Link to="/privacy" className="hover:text-[#0052FF] transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-[#0052FF] transition-colors">
              Terms of Service
            </Link>
            <span>•</span>
            <Link to="/refund" className="hover:text-[#0052FF] transition-colors">
              Refund Policy
            </Link>
            <span>•</span>
            <a
              href={getAppUrl('/staff/login')}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-700 hover:text-slate-900 font-semibold transition-colors"
              title="Faculty &amp; Staff Login"
            >
              Staff Portal
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
