"use client";

import React from "react";

export type FilterCategory = "all" | "free" | "memory" | "vedic" | "police" | "calendar";

interface FilterChipsProps {
  activeCategory: FilterCategory;
  onSelect: (cat: FilterCategory) => void;
}

const CHIPS: { id: FilterCategory; label: string }[] = [
  { id: "all", label: "All Courses" },
  { id: "free", label: "Free Demo" },
  { id: "memory", label: "Memory Science" },
  { id: "vedic", label: "Vedic Maths" },
  { id: "police", label: "Police Bharti / MPSC" },
  { id: "calendar", label: "Calendar Tricks" },
];

export default function FilterChips({ activeCategory, onSelect }: FilterChipsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
      {CHIPS.map((chip) => {
        const isActive = activeCategory === chip.id;
        return (
          <button
            key={chip.id}
            onClick={() => onSelect(chip.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all duration-200 border ${
              isActive
                ? "bg-[#0B57D0] text-white border-[#0B57D0] shadow-sm shadow-[#0B57D0]/30 scale-105"
                : "bg-white text-[#5A6478] border-[#E4E8F8] hover:border-[#0B57D0]/40 hover:text-[#0E1B3D]"
            }`}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
