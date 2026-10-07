import React from "react";

interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: string;
  className?: string;
  showText?: boolean;
}

export default function ProgressBar({
  progress,
  color = "bg-[#0B57D0]",
  className = "",
  showText = false,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div className={`w-full ${className}`}>
      {showText && (
        <div className="flex justify-between items-center text-xs font-semibold text-[#5A6478] mb-1.5">
          <span>Course Progress</span>
          <span className="text-[#0B57D0]">{clamped}%</span>
        </div>
      )}
      <div className="w-full bg-[#E4E8F8] rounded-full h-2 overflow-hidden">
        <div
          className={`${color} h-full rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
