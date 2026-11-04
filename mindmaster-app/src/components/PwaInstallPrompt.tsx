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

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Store on window so Settings page can trigger native prompt
      (window as any).__mma_deferred_install_prompt = e;
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Only open if explicitly requested from Settings or manual event
    const handleExplicitTrigger = () => {
      setIsVisible(true);
    };
    window.addEventListener("mma_open_install_modal", handleExplicitTrigger);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("mma_open_install_modal", handleExplicitTrigger);
    };
  }, [isStandalone]);

  const handleInstall = async () => {
    const promptToUse = deferredPrompt || (window as any).__mma_deferred_install_prompt;
    if (promptToUse) {
      promptToUse.prompt();
      const { outcome } = await promptToUse.userChoice;
      if (outcome === "accepted") {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
      (window as any).__mma_deferred_install_prompt = null;
    } else if (isIos) {
      // Keep iOS instructions visible
    } else {
      setIsVisible(false);
    }
  };

  if (!isVisible || isStandalone) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white dark:bg-[#1E293B] rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center">
        {/* Close Button */}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition"
          aria-label="Close install prompt"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
          <Smartphone className="w-8 h-8" />
        </div>

        {/* Content */}
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
          Install MindMaster App
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          Get ultra-fast launch, offline study vault access, and full-screen masterclass video experience on your phone.
        </p>

        {/* Instructions based on OS */}
        {isIos ? (
          <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 text-left text-xs space-y-2 mb-6 border border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
              <Share2 className="w-4 h-4 text-blue-600" />
              <span>1. Tap Share in Safari browser bar</span>
            </div>
            <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
              <PlusSquare className="w-4 h-4 text-blue-600" />
              <span>2. Scroll down &amp; tap &quot;Add to Home Screen&quot;</span>
            </div>
          </div>
        ) : (
          <button
            onClick={handleInstall}
            className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer mb-3"
          >
            <Download className="w-4 h-4" />
            <span>Install MindMaster App</span>
          </button>
        )}

        <button
          onClick={() => setIsVisible(false)}
          className="w-full py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
