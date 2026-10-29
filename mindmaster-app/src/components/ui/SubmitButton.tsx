import React from "react";
import Spinner from "./Spinner";

export interface SubmitButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  variant?: "primary" | "secondary" | "danger" | "outline" | "ghost" | "emerald";
  icon?: React.ReactNode;
}

export default function SubmitButton({
  children,
  loading = false,
  loadingText,
  disabled,
  className = "",
  variant = "primary",
  icon,
  ...props
}: SubmitButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center font-bold rounded-2xl transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none select-none cursor-pointer";

  const variantClasses = {
    primary:
      "bg-[#0B57D0] hover:bg-[#0842A0] text-white focus:ring-[#0B57D0]/40 shadow-md shadow-blue-500/20",
    secondary:
      "bg-slate-800 hover:bg-slate-900 text-white focus:ring-slate-500 shadow-xs",
    emerald:
      "bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500 shadow-md shadow-emerald-500/20",
    danger:
      "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-md shadow-red-500/20",
    outline:
      "border border-slate-200 hover:bg-slate-50 text-slate-700 focus:ring-slate-400 bg-white shadow-xs",
    ghost:
      "hover:bg-slate-100 text-slate-700 focus:ring-slate-300",
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <Spinner size="sm" />
          <span>{loadingText || children}</span>
        </span>
      ) : (
        <span className="flex items-center gap-2">
          {icon && <span className="shrink-0">{icon}</span>}
          <span>{children}</span>
        </span>
      )}
    </button>
  );
}
