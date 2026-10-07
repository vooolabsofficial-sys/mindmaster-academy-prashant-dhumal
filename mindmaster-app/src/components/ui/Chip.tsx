import React from "react";
import { HeaderTint } from "@/lib/types";

export interface ChipProps extends React.HTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  tint?: HeaderTint;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

const TINT_STYLES: Record<HeaderTint, string> = {
  mint: "bg-[#E8F8F2] text-[#0A8554] border-[#C6ECD9]",
  sky: "bg-[#E8F1FD] text-[#0B57D0] border-[#C7DEFB]",
  peach: "bg-[#FFF1E8] text-[#D85A12] border-[#FED7BE]",
  lavender: "bg-[#F0EEFD] text-[#6352D0] border-[#DDD8FB]",
  pink: "bg-[#FDE8F1] text-[#D02B6D] border-[#F9CADF]",
  locked: "bg-[#F1F3F9] text-[#717D96] border-[#E2E8F0]",
};

export default function Chip({
  active = false,
  tint,
  children,
  icon,
  className = "",
  ...props
}: ChipProps) {
  const baseClasses =
    "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 select-none border";

  const stateClasses = active
    ? "bg-[#0B57D0] text-white border-[#0B57D0] shadow-sm shadow-[#0B57D0]/30"
    : tint
    ? TINT_STYLES[tint]
    : "bg-white text-[#5A6478] border-[#E4E8F8] hover:border-[#0B57D0]/40 hover:text-[#0E1B3D]";

  return (
    <button
      className={`${baseClasses} ${stateClasses} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}
