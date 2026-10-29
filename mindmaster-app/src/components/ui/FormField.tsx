import React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  isValid?: boolean;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  containerClassName?: string;
}

export default function FormField({
  label,
  error,
  isValid = false,
  helperText,
  leftIcon,
  rightElement,
  containerClassName = "",
  className = "",
  disabled,
  id,
  required,
  ...inputProps
}: FormFieldProps) {
  const generatedId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  const hasError = Boolean(error);

  const borderAndBg = hasError
    ? "border-red-500 bg-red-50/30 focus-within:ring-2 focus-within:ring-red-500/20 focus-within:border-red-500 animate-shake"
    : isValid
    ? "border-emerald-300 bg-emerald-50/20 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20"
    : "border-slate-200 bg-slate-50/70 focus-within:bg-white focus-within:border-[#0B57D0] focus-within:ring-2 focus-within:ring-blue-500/15";

  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label
          htmlFor={generatedId}
          className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between"
        >
          <span>
            {label} {required && <span className="text-red-500">*</span>}
          </span>
          {isValid && !hasError && (
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Valid</span>
            </span>
          )}
        </label>
      )}

      <div
        className={`relative flex items-center w-full rounded-2xl border transition-all ${borderAndBg} ${
          disabled ? "opacity-60 cursor-not-allowed bg-slate-100" : ""
        }`}
      >
        {leftIcon && <div className="pl-3.5 flex items-center pointer-events-none">{leftIcon}</div>}

        <input
          id={generatedId}
          disabled={disabled}
          required={required}
          className={`w-full py-2.5 px-3.5 bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed ${className}`}
          {...inputProps}
        />

        <div className="pr-3 flex items-center gap-1.5">
          {hasError && <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />}
          {isValid && !hasError && !rightElement && (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          )}
          {rightElement}
        </div>
      </div>

      {hasError ? (
        <p className="mt-1 text-xs font-medium text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="mt-1 text-[11px] text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}
