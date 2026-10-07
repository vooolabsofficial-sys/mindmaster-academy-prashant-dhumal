"use client";

import { useState, useEffect } from "react";
import { Download, X, Smartphone, Sparkles, Share2, PlusSquare } from "lucide-react";

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already in standalone / installed mode
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsStandalone(true);
      return;
    }

    // Check iOS user agent
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Check if user arrived via ?install=true from website
    const urlParams = new URLSearchParams(window.location.search);
    const forceInstall = urlParams.get("install") === "true";

    // Check if user recently dismissed
    const dismissedAt = localStorage.getItem("mindmaster_pwa_dismissed");
    let recentlyDismissed = false;
    if (dismissedAt && !forceInstall) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 5) {
        recentlyDismissed = true;
      }
    }

    if (forceInstall && !isStandalone) {
      setIsVisible(true);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!recentlyDismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    // If on iOS and requested install, show iOS instructions
    if (isIosDevice && forceInstall && !isStandalone) {
      setIsVisible(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, [isStandalone]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } else {
      alert("To install MindMaster App:\n\n• Chrome / Edge: Click the install icon (⊕) on the right side of your address bar.\n• Mobile: Tap the browser menu (⋮) and tap 'Install app' or 'Add to Home screen'.");
      setIsVisible(false);
    }
    localStorage.setItem("mindmaster_pwa_dismissed", Date.now().toString());
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("mindmaster_pwa_dismissed", Date.now().toString());
  };

  if (!isVisible || isStandalone) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-in slide-in-from-bottom-5 fade-in select-none">
      <div className="bg-white text-slate-900 rounded-3xl p-5 border-2 border-blue-200 shadow-[0_20px_50px_rgba(11,87,208,0.2)] flex flex-col gap-3.5 backdrop-blur-md">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0 shadow-md text-white">
              {/* Brain icon SVG */}
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l2.06-2.06C9.13 19.49 10.51 20 12 20c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5a1 1 0 1 1 2 0v2a1 1 0 1 1-2 0V8zm3.5 3a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm1.5 4a1 1 0 1 1 2 0 1 1 0 0 1-2 0zm4 0a1 1 0 1 1 2 0 1 1 0 0 1-2 0z"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  OFFICIAL APP
                </span>
                <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  <Sparkles className="w-3 h-3" /> PWA Fast
                </span>
              </div>
              <h3 className="font-black text-sm text-slate-900 mt-0.5">
                MindMaster Academy App
              </h3>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          Install the official learning app on your phone or laptop home screen for instant access, offline mode, and zero storage lag.
        </p>

        {isIos ? (
          <div className="p-3 bg-blue-50/80 rounded-2xl border border-blue-100 text-[11px] text-blue-900 space-y-1">
            <p className="font-bold flex items-center gap-1">
              <Share2 className="w-3.5 h-3.5 text-blue-600" />
              <span>To install on iPhone / iPad:</span>
            </p>
            <p className="text-slate-700 pl-4">
              1. Tap the <strong>Share [↑]</strong> icon at the bottom of Safari.
            </p>
            <p className="text-slate-700 pl-4 flex items-center gap-1">
              <span>2. Scroll down &amp; tap</span>
              <strong className="inline-flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                <PlusSquare className="w-3 h-3" /> Add to Home Screen
              </strong>
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleInstall}
              className="flex-1 py-2.5 px-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App Now</span>
            </button>

            <button
              onClick={handleDismiss}
              className="py-2.5 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              Later
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
