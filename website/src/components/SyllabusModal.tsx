import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getAppCourseCheckoutUrl } from '../config/appConfig';

export interface CourseSyllabusData {
  id: string;
  code: string;
  title: string;
  badge: string;
  duration: string;
  audience: string;
  description: string;
  curriculum: {
    week: string;
    title: string;
    topics: string[];
  }[];
  includedKits: string[];
  examFocus: string;
  pdfDownloadName: string;
}

export interface SyllabusModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: CourseSyllabusData | null;
}

export const SyllabusModal: React.FC<SyllabusModalProps> = ({
  isOpen,
  onClose,
  course,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen || !course) return null;

  const handleDownload = () => {
    setDownloadSuccess(true);
    // Simulate real file download
    const element = document.createElement('a');
    const file = new Blob([
      `MINDMASTER ACADEMY — OFFICIAL CURRICULUM SYLLABUS\n\nCourse: ${course.title} (${course.code})\nInstructor: Prashant Dhumal\nDuration: ${course.duration}\nAudience: ${course.audience}\n\nWEEK-BY-WEEK MODULES:\n` +
      course.curriculum.map((c) => `${c.week}: ${c.title}\n${c.topics.map((t) => `  - ${t}`).join('\n')}`).join('\n\n') +
      `\n\nINCLUDED KITS & KITS:\n${course.includedKits.map((k) => `* ${k}`).join('\n')}\n\nHelpline: +91 84593 44077\nSatara Flagship HQ: Near Powai Naka, Sadar Bazar, Satara 415001`
    ], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${course.pdfDownloadName}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    setTimeout(() => {
      setDownloadSuccess(false);
    }, 4000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden border border-surface-variant max-h-[90vh] flex flex-col animate-scaleUp cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-variant/60 bg-surface-container-low">
          <div className="flex items-center gap-2.5">
            <span className="font-label-caps text-xs px-2.5 py-0.5 rounded-full bg-secondary text-white font-bold">
              {course.code}
            </span>
            <h3 className="font-headline-sm text-lg sm:text-xl text-primary-container font-bold">
              {course.title} Syllabus
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary-container hover:bg-surface-container-high transition-colors"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content body scrollable */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Metadata bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-surface-container-low p-3 rounded-xl">
              <span className="text-[11px] font-label-caps text-on-surface-variant block uppercase">Batch Duration</span>
              <span className="text-sm font-title-md font-bold text-primary-container">{course.duration}</span>
            </div>
            <div className="bg-surface-container-low p-3 rounded-xl">
              <span className="text-[11px] font-label-caps text-on-surface-variant block uppercase">Target Audience</span>
              <span className="text-sm font-title-md font-bold text-primary-container">{course.audience}</span>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-surface-container-low p-3 rounded-xl">
              <span className="text-[11px] font-label-caps text-on-surface-variant block uppercase">Certification</span>
              <span className="text-sm font-title-md font-bold text-secondary">Verified Diploma</span>
            </div>
          </div>

          <div>
            <p className="text-sm font-body-md text-on-surface-variant leading-relaxed">
              {course.description}
            </p>
          </div>

          {/* Curriculum breakdown */}
          <div className="space-y-3">
            <h4 className="font-title-md text-sm font-bold text-primary-container uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-[18px]">menu_book</span>
              Weekly Curriculum & Practical Drills
            </h4>

            <div className="space-y-3">
              {course.curriculum.map((curr, idx) => (
                <div 
                  key={idx}
                  className="p-3.5 rounded-xl bg-surface-container-low/60 border border-surface-variant/70 hover:border-secondary/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-title-md text-xs text-secondary font-bold">
                      {curr.week}
                    </span>
                    <span className="text-[11px] font-semibold text-primary-container">
                      {curr.title}
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {curr.topics.map((t, tIdx) => (
                      <li key={tIdx} className="text-xs text-on-surface-variant flex items-start gap-1.5">
                        <span className="text-secondary font-bold">•</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Study materials and kits */}
          <div className="p-4 rounded-xl bg-secondary-fixed/30 border border-secondary-fixed space-y-2">
            <h5 className="text-xs font-title-md font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">inventory_2</span>
              Materials & Kits Included in Course:
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {course.includedKits.map((kit, kIdx) => (
                <div key={kIdx} className="text-xs font-medium text-on-surface-variant flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-emerald-600 text-[14px]">check_circle</span>
                  <span>{kit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Download feedback toast */}
          {downloadSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 animate-fadeIn">
              <span className="material-symbols-outlined text-emerald-600 text-[18px]">cloud_done</span>
              <span><strong>Syllabus Downloaded!</strong> The full curriculum PDF has been saved to your device.</span>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-6 border-t border-surface-variant/60 bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleDownload}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-secondary text-secondary hover:bg-secondary-fixed/40 text-xs font-title-md transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            Download Syllabus PDF ↓
          </button>

          <a
            href={getAppCourseCheckoutUrl(course.id)}
            onClick={onClose}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-secondary text-on-secondary hover:bg-secondary-container text-xs font-title-md transition-all shadow-sm font-bold"
          >
            <span>Enroll in App Portal</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </a>
        </div>
      </div>
    </div>
  );
};
