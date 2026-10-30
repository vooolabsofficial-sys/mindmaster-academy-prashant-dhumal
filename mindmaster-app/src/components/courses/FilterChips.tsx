"use client";

import React from "react";

export type StandardFilter = "all" | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | "other";

export interface FilterChipItem {
  id: StandardFilter;
  label: string;
}

export const STANDARD_CHIPS: FilterChipItem[] = [
  { id: "all", label: "All" },
  { id: 5, label: "5th" },
  { id: 6, label: "6th" },
  { id: 7, label: "7th" },
  { id: 8, label: "8th" },
  { id: 9, label: "9th" },
  { id: 10, label: "10th" },
  { id: 11, label: "11th" },
  { id: 12, label: "12th" },
  { id: "other", label: "Other Courses" },
];

export interface FilterChipsProps {
  activeStandard?: StandardFilter;
  activeCategory?: any; // Backwards compatibility
  onSelect: (val: any) => void;
  chips?: FilterChipItem[];
  className?: string;
}

export default function FilterChips({
  activeStandard,
  activeCategory,
  onSelect,
  chips = STANDARD_CHIPS,
  className = "",
}: FilterChipsProps) {
  const currentActive = activeStandard !== undefined ? activeStandard : (activeCategory ?? "all");

  return (
    <div
      className={`flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none no-scrollbar touch-pan-x ${className}`}
      role="tablist"
      aria-label="Course standard filters"
    >
      {chips.map((chip) => {
        const isActive = currentActive === chip.id;
        return (
          <button
            key={String(chip.id)}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(chip.id)}
            className={`min-h-[40px] px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition-all duration-150 border cursor-pointer active:scale-95 touch-manipulation flex items-center justify-center ${
              isActive
                ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/25 font-bold"
                : "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}

// Backwards-compatible export
export type FilterCategory = "all" | "free" | "memory" | "vedic" | "calendar" | "trainer" | "police";
