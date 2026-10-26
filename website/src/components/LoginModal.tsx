import React, { useState } from 'react';
import { getAppUrl } from '../config/appConfig';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [recoveryPin, setRecoveryPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const appBaseUrl = getAppUrl('');

  const handleGoogleLogin = () => {
    window.location.href = `${appBaseUrl}/login?google=1`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }

    if (tab === 'signup' && !fullName.trim()) {
      setErrorMessage('Please enter your full name');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${appBaseUrl}/api/student/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: tab === 'signin' ? 'login' : 'register',
          phone: cleanPhone,
          password,
          fullName: fullName.trim(),
          recoveryPin: recoveryPin || '1234',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed. Please check credentials.');
      }

      // Persist profile to localStorage
      const profile = data.user || {
        phone: cleanPhone,
        full_name: fullName || 'Student',
        role: 'student',
        onboardingCompleted: data.onboardingCompleted ?? false,
      };

      try {
        localStorage.setItem('mindmaster_session_token', data.sessionToken || `tok-${cleanPhone}`);
        localStorage.setItem('mindmaster_verified_phone', cleanPhone);
        localStorage.setItem('mindmaster_user_profile', JSON.stringify(profile));
      } catch {}

      setSuccessMessage(tab === 'signin' ? 'Sign in successful! Opening portal...' : 'Account created successfully! Starting portal...');

      setTimeout(() => {
        const dest = data.redirect || (data.onboardingCompleted ? '/home' : '/onboarding');
        window.location.href = `${appBaseUrl}${dest}`;
      }, 400);
    } catch (err: any) {
      setErrorMessage(err.message || 'Connection error. Please open the Student Portal directly.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xl animate-fadeIn">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Apple Liquid Glass Container */}
      <div className="relative w-full max-w-[420px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl border border-white/60 dark:border-white/15 rounded-3xl p-6 sm:p-8 shadow-[0_20px_70px_rgba(0,82,255,0.2)] text-slate-800 dark:text-slate-100 z-10 overflow-hidden">
        
        {/* Subtle glass liquid reflection gradient overlay */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-sky-400/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Bar: Brand + Close button */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#0052FF] text-white flex items-center justify-center shadow-md shadow-blue-500/25">
              <span className="material-symbols-outlined text-[20px]">school</span>
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight block leading-tight">
                MindMaster <span className="text-[#0052FF]">Academy</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                Prashant Dhumal Sir
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Header Title */}
        <div className="mb-5 text-center">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {tab === 'signin' ? 'Student Sign In' : 'Create New Account'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {tab === 'signin'
              ? 'Sign in with your 10-digit mobile number'
              : 'Create a free account to start learning'}
          </p>
        </div>

        {/* Official Google 1-Click Button (Google Brand Guidelines) */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full py-2.5 sm:py-3 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3 text-xs sm:text-sm cursor-pointer"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Minimal Divider */}
        <div className="relative my-4 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <span className="relative px-3 bg-white/90 dark:bg-slate-900/90 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Or with Phone
          </span>
        </div>

        {/* Tab Switcher: Apple Segmented Pill */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl mb-4 border border-slate-200/60 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => {
              setTab('signin');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`flex-1 py-1.5 sm:py-2 text-xs font-bold rounded-xl transition-all ${
              tab === 'signin'
                ? 'bg-white dark:bg-slate-900 text-[#0052FF] shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('signup');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`flex-1 py-1.5 sm:py-2 text-xs font-bold rounded-xl transition-all ${
              tab === 'signup'
                ? 'bg-white dark:bg-slate-900 text-[#0052FF] shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="mb-3.5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 text-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-red-500 shrink-0">error</span>
              <span>{errorMessage}</span>
            </div>
            <div className="mt-2 pt-2 border-t border-red-200/60 dark:border-red-800/40">
              <a
                href={`${appBaseUrl}/login`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0052FF] hover:underline"
              >
                <span>Open Student Portal Login Page directly</span>
                <span className="material-symbols-outlined text-[13px]">open_in_new</span>
              </a>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-3.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-emerald-500 shrink-0">check_circle</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {tab === 'signup' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[18px]">
                  person
                </span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe / Rahul Patil"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30 focus:border-[#0052FF]"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mobile Number
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                +91
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="98XXXXXXXX"
                className="w-full pl-12 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30 focus:border-[#0052FF] font-mono"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              {tab === 'signin' && (
                <a
                  href={`${appBaseUrl}/forgot-password`}
                  className="text-[10px] text-[#0052FF] font-semibold hover:underline"
                >
                  Forgot Password?
                </a>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[18px]">
                lock
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30 focus:border-[#0052FF]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {tab === 'signup' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                4-Digit Security PIN (Used for quick password recovery)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[18px]">
                  pin
                </span>
                <input
                  type="password"
                  maxLength={4}
                  value={recoveryPin}
                  onChange={(e) => setRecoveryPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="1234"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30 focus:border-[#0052FF] font-mono tracking-widest"
                />
              </div>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-[#0052FF] hover:bg-[#0047E0] text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition-all text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Please wait...</span>
              </>
            ) : (
              <>
                <span>{tab === 'signin' ? 'Sign In & Start Learning' : 'Create Account'}</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        {/* Bottom Switch Link + Full App Link */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <button
            type="button"
            onClick={onClose}
            className="hover:text-slate-800 dark:hover:text-white flex items-center gap-1 font-medium cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            <span>Back to Website</span>
          </button>

          <a
            href={`${appBaseUrl}/login?next=/home`}
            className="text-[#0052FF] hover:underline font-semibold flex items-center gap-0.5"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>Open in Full Tab</span>
            <span className="material-symbols-outlined text-[13px]">open_in_new</span>
          </a>
        </div>
      </div>
    </div>
  );
};
