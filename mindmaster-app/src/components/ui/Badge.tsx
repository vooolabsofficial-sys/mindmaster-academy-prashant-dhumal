import React from "react";
import { HeaderTint } from "@/lib/types";

interface BadgeProps {
  tint?: HeaderTint;
  children: React.ReactNode;
  className?: string;
}

const TINT_STYLES: Record<HeaderTint, string> = {
  mint: "bg-[#E8F8F2] text-[#0A8554] border-[#C6ECD9]",
  sky: "bg-[#E8F1FD] text-[#0B57D0] border-[#C7DEFB]",
  peach: "bg-[#FFF1E8] text-[#D85A12] border-[#FED7BE]",
  lavender: "bg-[#F0EEFD] text-[#6352D0] border-[#DDD8FB]",
  pink: "bg-[#FDE8F1] text-[#D02B6D] border-[#F9CADF]",
  locked: "bg-[#F1F3F9] text-[#717D96] border-[#E2E8F0]",
};

export default function Badge({ tint = "sky", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${TINT_STYLES[tint]} ${className}`}
    >
      {children}
    </span>
  );
}
