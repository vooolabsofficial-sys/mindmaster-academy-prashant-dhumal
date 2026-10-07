import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getAppUrl } from '../config/appConfig';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Courses', path: '/courses' },
    { name: 'About', path: '/about' },
    { name: 'Results', path: '/results' },
    { name: 'Contact', path: '/contact' },
    { name: 'Brain Games', path: '/brain-games', isGame: true },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="fixed top-3 sm:top-5 left-0 right-0 z-50 px-3 sm:px-6 pointer-events-none transition-all duration-300">
      <div
        className={`max-w-5xl mx-auto pointer-events-auto transition-all duration-300 ${
          scrolled ? 'scale-[0.98]' : 'scale-100'
        }`}
      >
        {/* The Floating Island Capsule (Detached, Pill-shaped) */}
        <div className="bg-[#0052FF]/95 backdrop-blur-xl border border-white/30 rounded-full px-3.5 sm:px-6 py-2 sm:py-2.5 shadow-[0_12px_40px_rgba(0,82,255,0.35)] flex items-center justify-between gap-2 sm:gap-4 transition-all">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group focus:outline-none shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white text-[#0052FF] flex items-center justify-center shadow-md ring-2 ring-white/40 transition-transform duration-200 group-hover:scale-105">
              <svg aria-hidden="true" className="w-4 h-4 sm:w-5 sm:h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 3a4.5 4.5 0 0 0-4.3 3.19A4.5 4.5 0 0 0 4.5 10.5c0 .64.13 1.25.37 1.8A4.48 4.48 0 0 0 4 15a4.5 4.5 0 0 0 4.19 4.48A4.5 4.5 0 0 0 12 21a4.5 4.5 0 0 0 3.81-1.52A4.5 4.5 0 0 0 20 15c0-.98-.31-1.89-.87-2.7.24-.55.37-1.16.37-1.8a4.5 4.5 0 0 0-3.2-4.31A4.5 4.5 0 0 0 12 3zm-.75 2.05c1.47 0 2.68 1.1 2.74 2.56L14 8h-2.75V5.05zm1.5 0V8H15.5c1.42 0 2.58.98 2.72 2.37L16 11h-2.25v2H17c1.38 0 2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5h-1.25v-2H13v3.85c1.23-.23 2.18-1.22 2.25-2.43V17h-2.5v1.95A2.75 2.75 0 0 1 10 16.2V15h2.25v-2H10V9.8c0-1.47 1.13-2.67 2.59-2.74L13 7V5.05z"></path>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-title-lg text-sm sm:text-base font-extrabold text-white tracking-tight leading-tight flex items-center gap-1">
                MindMaster <span className="text-sky-200 font-semibold hidden sm:inline">Academy</span>
              </span>
              <span className="text-[9px] text-white/80 font-label-caps tracking-widest hidden md:block">
                SATARA FLAGSHIP HQ
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links - Floating Pill Segments */}
          <nav className="hidden md:flex items-center gap-1 bg-white/10 p-1 rounded-full border border-white/15 backdrop-blur-md">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-title-md transition-all flex items-center gap-1.5 ${
                    active
                      ? 'bg-white text-[#0052FF] font-extrabold shadow-xs scale-105'
                      : link.isGame
                      ? 'bg-amber-400 text-slate-900 font-extrabold hover:bg-amber-300 shadow-xs ring-1 ring-amber-300/80'
                      : 'text-white/90 hover:text-white hover:bg-white/15'
                  }`}
                >
                  {link.isGame && (
                    <span className="material-symbols-outlined text-[15px]">sports_esports</span>
                  )}
                  <span>{link.name}</span>
                  {link.isGame && (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right CTA Actions */}
          <div className="flex items-center gap-2">
            {/* Student Login Button */}
            <a
              href={getAppUrl('/login?next=/home')}
              className="inline-flex items-center justify-center bg-white/15 hover:bg-white/25 text-white font-title-md text-xs sm:text-sm font-bold px-3 sm:px-4 py-2 rounded-full border border-white/30 backdrop-blur-sm transition-all shrink-0 gap-1.5"
              title="Student Login / Web Portal (Laptop & Mobile)"
            >
              <span className="material-symbols-outlined text-[17px]">account_circle</span>
              <span>Login</span>
            </a>

            {/* Enroll Now -> Links directly to App Courses */}
            <a
              href={getAppUrl('/courses')}
              className="inline-flex items-center justify-center bg-white text-[#0052FF] font-title-md text-xs sm:text-sm font-extrabold px-3.5 sm:px-5 py-2 rounded-full shadow-md hover:bg-sky-50 hover:scale-105 active:scale-95 transition-all ring-2 ring-white/40 shrink-0"
              title="Enroll in Courses & Open App"
            >
              <span>Enroll Now</span>
              <span className="material-symbols-outlined text-[15px] ml-1">arrow_forward</span>
            </a>

            <a
              href="tel:+918459344077"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 border border-white/35 hover:bg-white/30 hidden sm:flex items-center justify-center text-white transition-all shadow-inner"
              title="Call Satara HQ: +91 84593 44077"
            >
              <span className="material-symbols-outlined text-[16px]">call</span>
            </a>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white focus:outline-none hover:bg-white/30 transition-colors"
              aria-label="Toggle Menu"
            >
              <span className="material-symbols-outlined text-[20px]">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Dynamic Island Expansion Drawer for Mobile */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 bg-[#0047E0]/95 backdrop-blur-2xl border border-white/25 rounded-3xl p-4 shadow-2xl space-y-1.5 animate-fadeIn">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-2.5 rounded-2xl text-sm font-title-md transition-all ${
                  isActive(link.path)
                    ? 'bg-white text-[#0052FF] font-bold shadow-xs'
                    : link.isGame
                    ? 'bg-amber-400 text-slate-900 font-extrabold shadow-sm'
                    : 'text-white/90 hover:bg-white/15'
                }`}
              >
                <span className="flex items-center gap-2">
                  {link.isGame && <span className="material-symbols-outlined text-[18px]">sports_esports</span>}
                  <span>{link.name}</span>
                </span>
                {link.isGame && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-900 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                    Play Now
                  </span>
                )}
              </Link>
            ))}

            {/* Mobile Actions: Login, Enroll & Install App */}
            <div className="pt-2 border-t border-white/20 flex flex-col gap-2">
              <div className="flex gap-2">
                <a
                  href={getAppUrl('/login?next=/home')}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white/20 hover:bg-white/30 text-white font-title-md text-xs py-2.5 rounded-full border border-white/30 font-bold transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">account_circle</span>
                  <span>Student Login</span>
                </a>
                <a
                  href={getAppUrl('/courses')}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 inline-flex items-center justify-center bg-white text-[#0052FF] font-title-md text-xs py-2.5 rounded-full shadow-md font-extrabold"
                >
                  <span>Enroll Now</span>
                  <span className="material-symbols-outlined text-[15px] ml-1">arrow_forward</span>
                </a>
              </div>

              <a
                href={getAppUrl('/home?install=true')}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-title-md text-xs py-2.5 rounded-full font-bold shadow-md shadow-emerald-900/20 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">install_mobile</span>
                <span>Install MindMaster App (Phone / PWA)</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
