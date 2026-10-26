"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Lock, ShieldAlert } from "lucide-react";
import { normalizePhone } from "@/lib/phoneUtils";

export interface PiracyShieldProps {
  children: React.ReactNode;
  contentType?: "video" | "notes" | "book" | "general";
  enableWatermark?: boolean;
  className?: string;
}

// 6 Safe positions across the container for dynamic student watermark
const WATERMARK_POSITIONS = [
  { top: "12%", left: "12%" },
  { top: "25%", right: "15%" },
  { bottom: "20%", left: "18%" },
  { bottom: "35%", right: "12%" },
  { top: "50%", left: "32%" },
  { bottom: "65%", right: "25%" },
];

export default function PiracyShield({
  children,
  contentType = "general",
  enableWatermark = true,
  className = "",
}: PiracyShieldProps) {
  const [isBlackedOut, setIsBlackedOut] = useState<boolean>(false);
  const [studentWatermark, setStudentWatermark] = useState<string>("MindMaster • Verified Student");
  const [watermarkIndex, setWatermarkIndex] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Android APK / WebView / Capacitor Hardware Security Hook
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        if ((window as any).Android?.enableSecureScreen) {
          (window as any).Android.enableSecureScreen();
        } else if ((window as any).AndroidBridge?.setFlagSecure) {
          (window as any).AndroidBridge.setFlagSecure(true);
        } else if ((window as any).Capacitor?.Plugins?.PrivacyScreen?.enable) {
          (window as any).Capacitor.Plugins.PrivacyScreen.enable();
        }
      }
    } catch {}
  }, []);

  // 2. Fetch logged-in student info for watermark
  useEffect(() => {
    try {
      const rawProfile = localStorage.getItem("mindmaster_user_profile");
      if (rawProfile) {
        const p = JSON.parse(rawProfile);
        const name = p.full_name || p.name || "Student";
        const phone = p.mobile_number || p.phone || "";
        const clean = normalizePhone(phone);
        if (clean) {
          setStudentWatermark(`${name} • +91 ${clean.slice(0, 5)} ${clean.slice(5)}`);
        } else if (name) {
          setStudentWatermark(`${name} • MindMaster Academy`);
        }
      }
    } catch {}
  }, []);

  // 3. Dynamic Watermark Movement (Smooth transition every 8 seconds)
  useEffect(() => {
    if (!enableWatermark) return;
    const interval = setInterval(() => {
      setWatermarkIndex((prev) => (prev + 1) % WATERMARK_POSITIONS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [enableWatermark]);

  // 4. Trigger Blackout & Dispatch Media Pause
  const triggerBlackout = useCallback((reason: string) => {
    setIsBlackedOut(true);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("mma_pause_media", {
          detail: { reason, timestamp: Date.now() },
        })
      );
    }
  }, []);

  const resumeFromBlackout = useCallback(() => {
    if (typeof document !== "undefined" && document.visibilityState === "visible") {
      setIsBlackedOut(false);
    }
  }, []);

  // 5. Intercept Shortcuts, DevTools, Right-Click, Copy/Cut, Drag
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen (Windows/Linux)
      if (e.key === "PrintScreen" || e.keyCode === 44) {
        e.preventDefault();
        triggerBlackout("screenshot_attempt");
        return;
      }

      // F12 DevTools
      if (e.key === "F12" || e.keyCode === 123) {
        e.preventDefault();
        return;
      }

      // Ctrl+Shift+I / J / C (DevTools & Console)
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        ["I", "i", "J", "j", "C", "c"].includes(e.key)
      ) {
        e.preventDefault();
        return;
      }

      // Ctrl+U (View Source)
      if ((e.ctrlKey || e.metaKey) && (e.key === "u" || e.key === "U")) {
        e.preventDefault();
        return;
      }

      // Ctrl+S (Save Page)
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        return;
      }

      // Ctrl+P (Print Page)
      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        return;
      }

      // macOS Screenshot shortcuts: Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5
      if (e.metaKey && e.shiftKey && ["3", "4", "5"].includes(e.key)) {
        e.preventDefault();
        triggerBlackout("mac_screenshot_attempt");
        return;
      }

      // macOS Inspect: Cmd+Option+I
      if (e.metaKey && e.altKey && (e.key === "i" || e.key === "I")) {
        e.preventDefault();
        return;
      }
    };

    // Focus Loss & Tab Switching Blackout
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        triggerBlackout("tab_hidden");
      }
    };

    const handleWindowBlur = () => {
      triggerBlackout("window_blur");
    };

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("copy", handleCopy);
    window.addEventListener("cut", handleCut);
    window.addEventListener("dragstart", handleDragStart);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("copy", handleCopy);
      window.removeEventListener("cut", handleCut);
      window.removeEventListener("dragstart", handleDragStart);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [triggerBlackout]);

  // 6. Single-Device Heartbeat Session Validation (1 Student = 1 Active Device)
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const validateSession = async () => {
      try {
        const rawProfile = localStorage.getItem("mindmaster_user_profile");
        if (!rawProfile) return;
        const p = JSON.parse(rawProfile);
        const phone = p.mobile_number || p.phone;
        if (!phone) return;

        const res = await fetch("/api/student/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "validate-session",
            phone: normalizePhone(phone),
          }),
        });

        if (res.status === 403 || res.status === 401) {
          const data = await res.json();
          if (data.error === "device_conflict") {
            try {
              localStorage.removeItem("mindmaster_user_profile");
              localStorage.removeItem("mindmaster_active_purchases");
            } catch {}
            const conflictMsg = encodeURIComponent(
              "Your account was logged in on another device. Only 1 device session is allowed at a time."
            );
            window.location.href = `/login?error=device_conflict&msg=${conflictMsg}`;
          }
        }
      } catch {}
    };

    validateSession();
    interval = setInterval(validateSession, 25000);

    return () => clearInterval(interval);
  }, []);

  const currentWatermarkPos = WATERMARK_POSITIONS[watermarkIndex];

  return (
    <div
      ref={containerRef}
      className={`relative select-none ${className}`}
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
    >
      {/* Protected Child Content */}
      {children}

      {/* Dynamic Moving Student Watermark */}
      {enableWatermark && (
        <div
          aria-hidden="true"
          className="pointer-events-none select-none absolute z-40 transition-all duration-1000 ease-in-out opacity-25"
          style={{
            ...currentWatermarkPos,
            textShadow: "0 1px 2px rgba(0,0,0,0.4)",
          }}
        >
          <div className="flex items-center gap-1.5 rounded-full bg-slate-900/30 px-3 py-1 text-[11px] font-bold text-slate-200 backdrop-blur-[1px]">
            <span>{studentWatermark}</span>
          </div>
        </div>
      )}

      {/* Screen-Recording & Screenshot Blackout Overlay */}
      {isBlackedOut && (
        <div
          onClick={resumeFromBlackout}
          role="alert"
          aria-live="assertive"
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/98 p-6 text-center text-white backdrop-blur-md cursor-pointer select-none transition-opacity animate-in fade-in duration-200"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20 mb-4 shadow-lg shadow-amber-500/5">
            <Lock className="h-8 w-8" />
          </div>

          <h3 className="text-lg font-bold text-slate-100 sm:text-xl">
            Screen Protected for Security
          </h3>

          <p className="mt-2 max-w-md text-xs sm:text-sm text-slate-300 leading-relaxed">
            🔒 Screen recording and screenshots are not permitted. All MindMaster Academy course materials are copyright protected.
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            Tap anywhere to resume learning.
          </p>

          <button
            type="button"
            onClick={resumeFromBlackout}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-blue-700 active:scale-95 transition-all"
          >
            Tap to Resume Learning
          </button>
        </div>
      )}
    </div>
  );
}
