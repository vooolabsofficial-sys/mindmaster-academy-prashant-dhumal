import React from "react";
import { HeaderTint } from "@/lib/types";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  tint?: HeaderTint;
  children: React.ReactNode;
  interactive?: boolean;
}

const TINT_CLASSES: Record<HeaderTint, string> = {
  mint: "bg-[#E8F8F2] border-[#C6ECD9]",
  sky: "bg-[#E8F1FD] border-[#C7DEFB]",
  peach: "bg-[#FFF1E8] border-[#FED7BE]",
  lavender: "bg-[#F0EEFD] border-[#DDD8FB]",
  pink: "bg-[#FDE8F1] border-[#F9CADF]",
  locked: "bg-[#F1F3F9] border-[#E2E8F0]",
};

export default function Card({
  tint,
  children,
  interactive = false,
  className = "",
  ...props
}: CardProps) {
  const baseClasses =
    "bg-white rounded-2xl border border-[#E4E8F8] shadow-[0_12px_32px_rgba(16,20,38,0.06)] overflow-hidden transition-all duration-300";
  const interactiveClasses = interactive
    ? "hover:shadow-[0_16px_40px_rgba(11,87,208,0.12)] hover:border-[#0B57D0]/40 hover:-translate-y-0.5"
    : "";
  const tintClass = tint ? TINT_CLASSES[tint] : "";

  return (
    <div
      className={`${baseClasses} ${interactiveClasses} ${tintClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
