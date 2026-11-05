"use client";

import React, { useMemo } from "react";
import {
  getCanonicalStates,
  getDistrictsByState,
  getTalukasByDistrict,
  StateItem,
  DistrictItem,
  TalukaItem,
} from "@/lib/locations";
import { MapPin, Building, Globe } from "lucide-react";

export interface LocationCascadeSelectProps {
  selectedState?: string;
  selectedDistrict?: string;
  selectedTaluka?: string;
  onStateChange: (stateId: string, stateName: string) => void;
  onDistrictChange: (districtId: string, districtName: string) => void;
  onTalukaChange: (talukaId: string, talukaName: string) => void;
  disabled?: boolean;
  showState?: boolean;
  allowAll?: boolean;
  stateLabel?: string;
  districtLabel?: string;
  talukaLabel?: string;
  layout?: "grid" | "vertical" | "inline";
  className?: string;
  size?: "sm" | "md";
}

export default function LocationCascadeSelect({
  selectedState = "maharashtra",
  selectedDistrict = "",
  selectedTaluka = "",
  onStateChange,
  onDistrictChange,
  onTalukaChange,
  disabled = false,
  showState = true,
  allowAll = false,
  stateLabel = "State",
  districtLabel = "District",
  talukaLabel = "Taluka / Tehsil",
  layout = "grid",
  className = "",
  size = "md",
}: LocationCascadeSelectProps) {
  const states: StateItem[] = useMemo(() => getCanonicalStates(), []);

  const districts: DistrictItem[] = useMemo(() => {
    return getDistrictsByState(selectedState || "maharashtra");
  }, [selectedState]);

  const talukas: TalukaItem[] = useMemo(() => {
    if (!selectedDistrict || selectedDistrict === "all") return [];
    return getTalukasByDistrict(selectedDistrict, selectedState || "maharashtra");
  }, [selectedDistrict, selectedState]);

  const handleStateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const found = states.find((s) => s.id === val || s.name.toLowerCase() === val.toLowerCase());
    const stateName = found ? found.name : val;
    onStateChange(val, stateName);
    onDistrictChange(allowAll ? "all" : "", allowAll ? "All Districts" : "");
    onTalukaChange(allowAll ? "all" : "", allowAll ? "All Talukas" : "");
  };

  const handleDistrictSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const found = districts.find((d) => d.id === val || d.name.toLowerCase() === val.toLowerCase());
    const districtName = found ? found.name : val;
    onDistrictChange(val, districtName);
    onTalukaChange(allowAll ? "all" : "", allowAll ? "All Talukas" : "");
  };

  const handleTalukaSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const found = talukas.find((t) => t.id === val || t.name.toLowerCase() === val.toLowerCase());
    const talukaName = found ? found.name : val;
    onTalukaChange(val, talukaName);
  };

  const containerClasses =
    layout === "grid"
      ? `grid grid-cols-1 ${showState ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-3`
      : layout === "inline"
      ? "flex flex-wrap items-center gap-3"
      : "space-y-3";

  const inputSizeClasses =
    size === "sm"
      ? "px-2.5 py-1.5 text-xs rounded-lg"
      : "px-3.5 py-2.5 text-sm rounded-xl";

  const labelClasses = "block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5";

  return (
    <div className={`${containerClasses} ${className}`}>
      {/* State Selector */}
      {showState && (
        <div className="w-full">
          <label className={labelClasses}>
            <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{stateLabel}</span>
          </label>
          <div className="relative">
            <select
              value={selectedState}
              onChange={handleStateSelect}
              disabled={disabled}
              className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800 ${inputSizeClasses}`}
            >
              {allowAll && <option value="all">All States</option>}
              {states.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} {st.code ? `(${st.code})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* District Selector */}
      <div className="w-full">
        <label className={labelClasses}>
          <Building className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>{districtLabel}</span>
        </label>
        <div className="relative">
          <select
            value={selectedDistrict}
            onChange={handleDistrictSelect}
            disabled={disabled || (!allowAll && !selectedState)}
            className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800 ${inputSizeClasses}`}
          >
            <option value={allowAll ? "all" : ""}>
              {allowAll ? "All Districts" : "-- Select District --"}
            </option>
            {districts.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name} {d.nameMr ? `(${d.nameMr})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Taluka Selector */}
      <div className="w-full">
        <label className={labelClasses}>
          <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>{talukaLabel}</span>
        </label>
        <div className="relative">
          <select
            value={selectedTaluka}
            onChange={handleTalukaSelect}
            disabled={disabled || !selectedDistrict || selectedDistrict === "all"}
            className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800 ${inputSizeClasses}`}
          >
            <option value={allowAll ? "all" : ""}>
              {allowAll ? "All Talukas" : "-- Select Taluka / Tehsil --"}
            </option>
            {talukas.map((t) => (
              <option key={t.id} value={t.name}>
                {t.name} {t.nameMr ? `(${t.nameMr})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
