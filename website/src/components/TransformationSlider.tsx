import React, { useState, useRef, useCallback } from 'react';

export const TransformationSlider: React.FC = () => {
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0 - 100
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<boolean>(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percent);
  }, []);

  const onMouseDown = () => {
    isDragging.current = true;
  };

  const onMouseUp = () => {
    isDragging.current = false;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) {
      handleMove(e.clientX);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      {/* Quick toggle pills */}
      <div className="flex items-center gap-2 mb-4 bg-surface-container-low p-1 rounded-full border border-surface-variant">
        <button
          type="button"
          onClick={() => setSliderPos(15)}
          className={`px-4 py-1.5 rounded-full text-xs font-title-md transition-all ${
            sliderPos < 35 
              ? 'bg-[#FFDDE8] text-[#D9383A] shadow-xs font-bold' 
              : 'text-on-surface-variant hover:text-primary-container'
          }`}
        >
          View Before
        </button>
        <button
          type="button"
          onClick={() => setSliderPos(50)}
          className={`px-4 py-1.5 rounded-full text-xs font-title-md transition-all ${
            sliderPos >= 35 && sliderPos <= 65
              ? 'bg-secondary text-white shadow-xs font-bold'
              : 'text-on-surface-variant hover:text-primary-container'
          }`}
        >
          Split 50 / 50
        </button>
        <button
          type="button"
          onClick={() => setSliderPos(85)}
          className={`px-4 py-1.5 rounded-full text-xs font-title-md transition-all ${
            sliderPos > 65 
              ? 'bg-[#DFF7EA] text-[#0F8A4B] shadow-xs font-bold' 
              : 'text-on-surface-variant hover:text-primary-container'
          }`}
        >
          View After (MindMaster)
        </button>
      </div>

      {/* Interactive slider container */}
      <div
        ref={containerRef}
        onMouseMove={onMouseMove}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onTouchMove={onTouchMove}
        className="w-full rounded-[24px] overflow-hidden relative border border-[#E4E8F8] shadow-lg h-[400px] bg-white select-none cursor-ew-resize"
      >
        {/* RIGHT SIDE (After MindMaster) - Background full width */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#E6F8EE] via-[#DFF7EA]/60 to-white p-8 sm:p-10 flex flex-col justify-between">
          <div className="flex justify-end">
            <span className="bg-[#DFF7EA] text-[#0F8A4B] font-bold px-4 py-1 rounded-full text-xs border border-[#A6E8C2] shadow-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0F8A4B]"></span>
              After MindMaster Academy
            </span>
          </div>

          <div className="flex flex-col items-center text-center my-auto">
            <div className="w-24 h-24 rounded-full bg-white/90 flex items-center justify-center text-[#0F8A4B] mb-4 shadow-md ring-4 ring-[#A6E8C2]/40">
              <span className="material-symbols-outlined text-5xl">verified</span>
            </div>
            <h4 className="font-heading-bold text-[#0E1B3D] font-bold text-xl sm:text-2xl">
              Confident 100/100 Clarity
            </h4>
            <p className="text-[#5A6478] text-xs sm:text-sm max-w-sm mt-2 leading-relaxed">
              Instant retrieval of dates, formulas & syllabus. Calm exam composure, speed arithmetic and structured 1-7-30 habits.
            </p>
          </div>

          <div className="text-[12px] text-[#0F8A4B] text-center font-semibold bg-white/60 py-1.5 rounded-full backdrop-blur-xs">
            ★ Rank-winning accuracy • Calibrated mental poise • Zero exam blankouts
          </div>
        </div>

        {/* LEFT SIDE (Before MindMaster) - Clipped by width percentage */}
        <div
          className="absolute inset-y-0 left-0 overflow-hidden bg-gradient-to-br from-[#FFE8EE] via-[#FFDDE8]/70 to-white border-r border-[#F8B4C4]"
          style={{ width: `${sliderPos}%` }}
        >
          {/* Inner container must stay full container width so content does not squash */}
          <div className="w-full h-full min-w-[320px] sm:min-w-[600px] md:min-w-[760px] p-8 sm:p-10 flex flex-col justify-between">
            <div className="flex justify-start">
              <span className="bg-[#FFDDE8] text-[#D9383A] font-bold px-4 py-1 rounded-full text-xs border border-[#F8B4C4] shadow-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#D9383A]"></span>
                Before MindMaster
              </span>
            </div>

            <div className="flex flex-col items-center text-center my-auto">
              <div className="w-24 h-24 rounded-full bg-white/90 flex items-center justify-center text-[#D9383A] mb-4 shadow-md ring-4 ring-[#F8B4C4]/40">
                <span className="material-symbols-outlined text-5xl">sentiment_dissatisfied</span>
              </div>
              <h4 className="font-heading-bold text-[#0E1B3D] font-bold text-xl sm:text-2xl">
                Stressed & Overwhelmed
              </h4>
              <p className="text-[#5A6478] text-xs sm:text-sm max-w-sm mt-2 leading-relaxed">
                Cluttered desk, sleepless revision, exam anxiety, forgetting what was studied yesterday, and maths fear.
              </p>
            </div>

            <div className="text-[12px] text-[#D9383A] text-center font-semibold bg-white/60 py-1.5 rounded-full backdrop-blur-xs">
              Overloaded study hours • Frequent exam fear • Low confidence
            </div>
          </div>
        </div>

        {/* Draggable Divider Handle */}
        <div
          className="absolute inset-y-0 -ml-5 w-10 flex flex-col items-center justify-center pointer-events-none"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="w-1 h-full bg-[#0052FF] shadow-md"></div>
          <div className="absolute w-11 h-11 rounded-full bg-[#0052FF] text-white shadow-xl shadow-[#0052FF]/30 flex items-center justify-center pointer-events-auto hover:scale-110 active:scale-95 transition-transform border-2 border-white">
            <span className="material-symbols-outlined text-[20px]">code</span>
          </div>
          <div className="absolute bottom-3 bg-white text-[#0052FF] text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md border border-[#E4E8F8] whitespace-nowrap">
            Drag {Math.round(sliderPos)}%
          </div>
        </div>
      </div>

      {/* Comparison checklist below slider */}
      <div className="w-full mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-[#F8B4C4]/60 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D9383A]"></span>
            <span className="font-title-md text-xs uppercase font-bold text-[#D9383A]">Previous Struggle</span>
          </div>
          <div className="space-y-3.5">
            <div className="flex items-center gap-3 text-sm text-[#5A6478]">
              <span className="w-5 h-5 rounded-full bg-[#FFDDE8] text-[#D9383A] flex items-center justify-center font-bold text-xs shrink-0">✕</span>
              <span>Forgets 70% of studied material in 48 hours</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#5A6478]">
              <span className="w-5 h-5 rounded-full bg-[#FFDDE8] text-[#D9383A] flex items-center justify-center font-bold text-xs shrink-0">✕</span>
              <span>Attention drifts within 15 minutes of reading</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#5A6478]">
              <span className="w-5 h-5 rounded-full bg-[#FFDDE8] text-[#D9383A] flex items-center justify-center font-bold text-xs shrink-0">✕</span>
              <span>Calculations take minutes and cause exam panic</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#5A6478]">
              <span className="w-5 h-5 rounded-full bg-[#FFDDE8] text-[#D9383A] flex items-center justify-center font-bold text-xs shrink-0">✕</span>
              <span>No structured revision cycle; last-night cramming</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#A6E8C2]/60 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0F8A4B]"></span>
            <span className="font-title-md text-xs uppercase font-bold text-[#0F8A4B]">MindMaster Capability</span>
          </div>
          <div className="space-y-3.5">
            <div className="flex items-center gap-3 text-sm text-[#0E1B3D] font-medium">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0052FF] flex items-center justify-center font-bold text-xs shrink-0">✓</span>
              <span>Recalls full chapters & dates page-by-page effortlessly</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#0E1B3D] font-medium">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0052FF] flex items-center justify-center font-bold text-xs shrink-0">✓</span>
              <span>Deep focus in 2-hour distraction-free blocks</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#0E1B3D] font-medium">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0052FF] flex items-center justify-center font-bold text-xs shrink-0">✓</span>
              <span>Solves complex arithmetic & calendar dates mentally in seconds</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#0E1B3D] font-medium">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0052FF] flex items-center justify-center font-bold text-xs shrink-0">✓</span>
              <span>1-7-30 Spaced Retention blueprint leads to top state merit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
