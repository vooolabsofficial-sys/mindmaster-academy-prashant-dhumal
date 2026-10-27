"use client";

import React, { useEffect, useState } from "react";
import { getPlatformSettings } from "@/lib/staffStore";

export default function MaintenanceBanner() {
  const [isMaintenance, setIsMaintenance] = useState(false);

  useEffect(() => {
    let mounted = true;
    const checkMaintenance = async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (mounted && data.settings) {
            setIsMaintenance(Boolean(data.settings.maintenance));
            return;
          }
        }
      } catch {}

      try {
        const settings = getPlatformSettings();
        if (mounted) setIsMaintenance(Boolean(settings?.maintenance));
      } catch {
        if (mounted) setIsMaintenance(false);
      }
    };

    checkMaintenance();
    const interval = setInterval(checkMaintenance, 10000);
    window.addEventListener("mma_settings_changed", checkMaintenance);
    return () => {
      mounted = false;
      clearInterval(interval);
      window.removeEventListener("mma_settings_changed", checkMaintenance);
    };
  }, []);

  if (!isMaintenance) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 px-4 py-2.5 text-xs font-bold flex items-center justify-center border-b border-amber-600 shadow-md sticky top-0 z-50 transition-all">
      <div className="flex items-center gap-2.5 max-w-7xl mx-auto text-center flex-wrap justify-center">
        <span className="text-base animate-pulse">⚠️</span>
        <span className="bg-slate-950 text-amber-400 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
          Maintenance Mode Active
        </span>
        <span className="text-slate-900 font-semibold">
          MindMaster Academy is currently undergoing scheduled platform upgrades. Video player streams remain functional. Payments & new checkouts are temporarily paused.
        </span>
      </div>
    </div>
  );
}
