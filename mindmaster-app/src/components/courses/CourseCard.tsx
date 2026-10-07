import Link from "next/link";
import Image from "next/image";
import { Star, Clock, BookOpen, PlayCircle, ShieldCheck } from "lucide-react";
import { Course } from "@/lib/types";
import Badge from "@/components/ui/Badge";

interface CourseCardProps {
  course: Course;
  progress?: number; // optional: if passed, renders progress bar instead of price
  isEnrolled?: boolean;
}

const TINT_BG: Record<string, string> = {
  mint: "bg-emerald-50/70 border-emerald-100",
  sky: "bg-blue-50/70 border-blue-100",
  peach: "bg-amber-50/70 border-amber-100",
  lavender: "bg-indigo-50/70 border-indigo-100",
  pink: "bg-rose-50/70 border-rose-100",
  locked: "bg-slate-50 border-slate-200",
};

export default function CourseCard({ course, progress, isEnrolled }: CourseCardProps) {
  const priceRupees = Math.round(course.pricePaise / 100);
  const originalPriceRupees = Math.round(course.originalPricePaise / 100);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg hover:border-blue-300 transition-all duration-300 flex flex-col group">
      {/* Tint Header with Artwork & Badges */}
      <div className={`p-4 relative overflow-hidden border-b ${TINT_BG[course.headerTint] || "bg-blue-50/70 border-blue-100"}`}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge tint={course.headerTint}>{course.badgeText}</Badge>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white/90 px-2.5 py-0.5 rounded-full shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>{course.totalDurationHours} hrs</span>
          </div>
        </div>

        {/* Course Visual / 3D Icon */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <span className="text-[11px] font-bold tracking-wider text-blue-600 uppercase">
              {course.code}
            </span>
            <h3 className="font-extrabold text-base text-slate-900 leading-snug line-clamp-2 mt-0.5 group-hover:text-blue-600 transition">
              {course.title}
            </h3>
            <p className="text-xs text-slate-600 line-clamp-1 mt-1 font-medium">
              {course.subtitle}
            </p>
          </div>

          <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-white/80 p-1 shadow-xs border border-white group-hover:scale-105 transition-transform duration-300">
            <Image
              src={course.imageSrc}
              alt={course.title}
              fill
              className="object-contain p-1"
            />
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-4">
        {/* Instructor & Meta */}
        <div>
          <div className="flex items-center justify-between text-xs text-slate-600 mb-3">
            <div className="flex items-center gap-1.5">
              <div className="relative w-5 h-5 rounded-full overflow-hidden shrink-0 ring-1 ring-slate-200">
                <Image
                  src="/assets/images/prashant_dhumal_studio_portrait.png"
                  alt={course.instructorName}
                  fill
                  className="object-cover"
                />
              </div>
              <span className="font-semibold text-slate-900">{course.instructorName}</span>
            </div>

            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-bold text-slate-900">{course.rating}</span>
              <span className="text-[11px] text-slate-500">({course.ratingCount})</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {course.description}
          </p>
        </div>

        {/* Footer: Price or Progress and Action Button */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          {progress !== undefined ? (
            <div className="flex-1">
              <div className="flex justify-between text-xs font-bold text-slate-900 mb-1">
                <span>Progress</span>
                <span className="text-blue-600 font-extrabold">{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div>
              {course.isFree ? (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-extrabold text-emerald-600">Free</span>
                  <span className="text-xs text-slate-400 line-through">₹{originalPriceRupees}</span>
                </div>
              ) : (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-extrabold text-slate-900">₹{priceRupees}</span>
                  <span className="text-xs text-slate-400 line-through">₹{originalPriceRupees}</span>
                </div>
              )}
              <span className="text-[10px] text-slate-500 font-medium block">
                {course.accessMonths} Months Access
              </span>
            </div>
          )}

          <Link
            href={isEnrolled ? `/watch/les-mm01-01` : `/course/${course.id}`}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/25 transition shrink-0 cursor-pointer active:scale-95"
          >
            {isEnrolled ? (
              <>
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Continue</span>
              </>
            ) : course.isFree ? (
              <>
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Watch Free</span>
              </>
            ) : (
              <span>View Course</span>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}
