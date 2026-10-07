"use client";

import Link from "next/link";
import { LucideIcon, Sparkles } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon: Icon = Sparkles,
  title,
  description,
  actionText,
  actionHref,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`pro-card p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto my-6 border border-slate-200 shadow-sm ${className}`}
    >
      <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center mb-4 shadow-sm">
        <Icon className="w-8 h-8 stroke-[1.8]" />
      </div>

      <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mb-2">
        {title}
      </h3>

      <p className="text-sm text-slate-600 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 w-full">
        {actionText && actionHref && (
          <Link
            href={actionHref}
            className="pro-btn-primary touch-target-44 w-full sm:w-auto px-6 py-2.5 text-sm font-semibold rounded-full shadow-sm hover:shadow active:scale-98 transition"
          >
            {actionText}
          </Link>
        )}

        {actionText && !actionHref && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="pro-btn-primary touch-target-44 w-full sm:w-auto px-6 py-2.5 text-sm font-semibold rounded-full shadow-sm hover:shadow active:scale-98 transition cursor-pointer"
          >
            {actionText}
          </button>
        )}

        {secondaryActionText && onSecondaryAction && (
          <button
            type="button"
            onClick={onSecondaryAction}
            className="pro-btn-secondary touch-target-44 w-full sm:w-auto px-5 py-2.5 text-sm font-semibold rounded-full hover:bg-slate-50 active:scale-98 transition cursor-pointer"
          >
            {secondaryActionText}
          </button>
        )}
      </div>
    </div>
  );
}
