import React, { useState } from 'react';

export interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  studentName: string;
  rankBadge: string;
  category: string;
  location: string;
  batchYear: string;
  quote: string;
  posterImg: string;
  videoDuration?: string;
  marksheetScore?: string;
  keyTakeaway?: string;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  isOpen,
  onClose,
  title,
  studentName,
  rankBadge,
  category,
  location,
  batchYear,
  quote,
  posterImg,
  videoDuration = '2:14',
  marksheetScore = '98/100 Written',
  keyTakeaway = 'MindMaster 1-7-30 spaced memory palace method',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden border border-surface-variant animate-scaleUp cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-variant/60 bg-surface-container-low/50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse"></span>
            <span className="font-label-caps text-xs text-secondary font-bold uppercase tracking-wider">
              {category} • Verified Case Study
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary-container hover:bg-surface-container-high transition-colors"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Video Player Box */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
          <img
            src={posterImg}
            alt={title}
            className={`w-full h-full object-cover transition-opacity duration-500 ${isPlaying ? 'opacity-40 blur-xs scale-105' : 'opacity-85'}`}
          />

          {!isPlaying ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 p-6 text-center">
              <button
                onClick={() => setIsPlaying(true)}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-2xl hover:scale-110 hover:bg-secondary-container transition-all cursor-pointer group"
              >
                <span className="material-symbols-outlined text-4xl sm:text-5xl ml-1 text-white">play_arrow</span>
              </button>
              <p className="text-white text-sm font-title-md mt-4 drop-shadow-md">
                Click to play student interview ({videoDuration})
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white/90 text-xs font-label-caps">
                <span className="material-symbols-outlined text-emerald-400 text-[16px]">verified</span>
                Verified Marks & Roll No. on File
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col justify-between p-6 bg-gradient-to-t from-black/90 via-transparent to-black/60">
              <div className="flex justify-between items-center text-white text-xs">
                <span className="px-2.5 py-1 rounded-md bg-secondary text-white font-bold">{rankBadge}</span>
                <span className="text-white/80">HD 1080p • Live Batch Recording</span>
              </div>
              
              <div className="text-center my-auto">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-lowest/20 backdrop-blur-md text-white border border-white/20 mb-3">
                  <span className="material-symbols-outlined text-secondary animate-spin">sync</span>
                  <span className="text-sm font-semibold">Streaming Student Testimonial...</span>
                </div>
                <p className="text-white text-lg font-headline-sm italic max-w-xl mx-auto drop-shadow-md">
                  "{quote}"
                </p>
              </div>

              {/* Player controls bar simulation */}
              <div className="space-y-2">
                <div className="w-full bg-white/30 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full w-2/3 animate-pulse"></div>
                </div>
                <div className="flex items-center justify-between text-white/90 text-xs font-mono">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setIsPlaying(false)} className="hover:text-secondary">
                      <span className="material-symbols-outlined text-[18px]">pause</span>
                    </button>
                    <span>01:14 / {videoDuration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">volume_up</span>
                    <span className="material-symbols-outlined text-[18px]">fullscreen</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content details */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-variant/60">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline-sm text-xl sm:text-2xl text-primary-container font-bold">
                  {studentName}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[11px] font-label-caps font-bold">
                  {rankBadge}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-1 flex items-center gap-2">
                <span>{batchYear}</span> • 
                <span className="inline-flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  {location}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-surface-container-low px-3 py-2 rounded-xl text-center">
                <span className="block text-xs font-label-caps text-on-surface-variant">Verified Score</span>
                <span className="font-title-md text-base text-secondary font-bold">{marksheetScore}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-label-caps text-on-surface-variant uppercase tracking-wider font-semibold">
              Mastery Technique Applied:
            </p>
            <div className="p-3.5 rounded-xl bg-surface-container-low text-primary-container text-sm font-body-md border border-surface-variant/60 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">psychology</span>
              <span>{keyTakeaway}</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <a 
              href="tel:+918459344077"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-surface-container text-primary-container text-xs font-title-md hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">call</span>
              Speak with Mentor Sagar Dhumal
            </a>
            <a
              href="https://wa.me/918459344077?text=Hello%20MindMaster%2C%20I%20saw%20the%20student%20story%20and%20want%20to%20enroll."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-secondary text-on-secondary text-xs font-title-md hover:bg-secondary-container transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">school</span>
              Join Next Upcoming Batch →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
