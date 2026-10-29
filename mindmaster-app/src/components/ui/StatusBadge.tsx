import React from "react";
import { CheckCircle2, Clock, XCircle, AlertCircle, ShieldCheck, Zap } from "lucide-react";

export type StatusVariant =
  | "active"
  | "live"
  | "completed"
  | "verified"
  | "pending"
  | "upcoming"
  | "draft"
  | "paused"
  | "expired"
  | "inactive"
  | "failed"
  | "admin"
  | "free";

export interface StatusBadgeProps {
  status: StatusVariant | string;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

export default function StatusBadge({
  status,
  label,
  size = "md",
  className = "",
}: StatusBadgeProps) {
  const norm = (status || "").toLowerCase().trim();

  let icon = <CheckCircle2 className="w-3.5 h-3.5" />;
  let colorStyles = "bg-emerald-50 text-emerald-700 border-emerald-200/80";
  let defaultLabel = "Active";

  if (["active", "live", "online", "success", "paid"].includes(norm)) {
    icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
    colorStyles = "bg-emerald-50 text-emerald-700 border-emerald-200/80";
    defaultLabel = norm === "live" ? "Live" : "Active";
  } else if (["verified", "completed"].includes(norm)) {
    icon = <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
    colorStyles = "bg-blue-50 text-blue-700 border-blue-200/80";
    defaultLabel = "Verified";
  } else if (["pending", "upcoming", "draft", "paused"].includes(norm)) {
    icon = <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
    colorStyles = "bg-amber-50 text-amber-700 border-amber-200/80";
    defaultLabel = norm === "draft" ? "Draft" : norm === "paused" ? "Paused" : "Upcoming";
  } else if (["expired", "inactive", "failed", "closed", "revoked", "suspended"].includes(norm)) {
    icon = <XCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
    colorStyles = "bg-slate-50 text-slate-600 border-slate-200";
    defaultLabel = norm.charAt(0).toUpperCase() + norm.slice(1);
  } else if (["admin", "owner"].includes(norm)) {
    icon = <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />;
    colorStyles = "bg-purple-50 text-purple-700 border-purple-200/80";
    defaultLabel = norm === "owner" ? "Owner" : "Admin";
  } else if (norm === "free") {
    icon = <Zap className="w-3.5 h-3.5 text-teal-600 shrink-0" />;
    colorStyles = "bg-teal-50 text-teal-700 border-teal-200/80";
    defaultLabel = "Free";
  } else {
    icon = <AlertCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
    colorStyles = "bg-slate-50 text-slate-700 border-slate-200";
    defaultLabel = status;
  }

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${sizeClasses} ${colorStyles} shadow-2xs select-none ${className}`}
    >
      {icon}
      <span>{label || defaultLabel}</span>
    </span>
  );
}
