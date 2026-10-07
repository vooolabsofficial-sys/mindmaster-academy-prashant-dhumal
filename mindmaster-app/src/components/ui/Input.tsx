import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export default function Input({
  label,
  error,
  icon,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-bold text-[#0E1B3D]">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {icon && (
          <span className="absolute left-3.5 text-[#94A3B8] pointer-events-none shrink-0">
            {icon}
          </span>
        )}

        <input
          id={inputId}
          className={`w-full py-2.5 rounded-2xl bg-white border ${
            error ? "border-[#D02B6D]" : "border-[#E4E8F8]"
          } text-xs font-medium text-[#0E1B3D] placeholder-[#94A3B8] focus:outline-none focus:border-[#0B57D0] focus:ring-2 focus:ring-[#0B57D0]/20 shadow-xs transition-all ${
            icon ? "pl-10 pr-4" : "px-4"
          } ${className}`}
          {...props}
        />
      </div>

      {error && <span className="text-[11px] font-bold text-[#D02B6D]">{error}</span>}
    </div>
  );
}
