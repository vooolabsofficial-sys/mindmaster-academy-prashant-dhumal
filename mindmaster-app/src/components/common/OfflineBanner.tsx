"use client";

import { useState, useEffect } from "react";
import { WifiOff, RefreshCw, CheckCircle2 } from "lucide-react";

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [reconnected, setReconnected] = useState(false);

  useEffect(() => {
    // Initial check
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOffline(true);
    }

    const handleOffline = () => {
      setIsOffline(true);
      setReconnected(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setReconnected(true);
      const timer = setTimeout(() => setReconnected(false), 3500);
      return () => clearTimeout(timer);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOffline && !reconnected) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-50 w-full transition-all duration-300"
    >
      {isOffline ? (
        <div className="bg-amber-500 text-amber-950 px-4 py-2.5 shadow-md flex items-center justify-between gap-3 border-b border-amber-600/30">
          <div className="flex items-center gap-2.5 max-w-4xl mx-auto flex-1 min-w-0">
            <WifiOff className="w-5 h-5 shrink-0 text-amber-950" />
            <div className="text-xs sm:text-sm font-semibold truncate">
              <span>Offline Mode: No internet connection. </span>
              <span className="font-normal hidden sm:inline text-amber-900">
                Saved offline notes and cached handbooks remain accessible.
              </span>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="touch-target-44 px-3 py-1 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
            aria-label="Retry connection"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      ) : (
        <div className="bg-emerald-600 text-white px-4 py-2 shadow-md flex items-center justify-center gap-2 text-xs sm:text-sm font-bold animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>Internet connection restored (Back Online)!</span>
        </div>
      )}
    </div>
  );
}
