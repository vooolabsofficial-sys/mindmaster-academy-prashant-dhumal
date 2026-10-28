import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DottedColorfulBrain } from '../components/DottedColorfulBrain';

// Web Audio API Sound Synthesizer (Works 100% offline, zero external dependencies)
class SoundEffects {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  playSuccess() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      const now = this.ctx.currentTime;
      osc1.frequency.setValueAtTime(523.25, now);
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.25);

      osc2.frequency.setValueAtTime(261.63, now);
      osc2.frequency.exponentialRampToValueAtTime(392.00, now + 0.25);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.4);
      osc2.stop(now + 0.4);
    } catch {
      // Audio playback fails silently if user has not interacted
    }
  }

  playWrong() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.25);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Silent fail
    }
  }

  playClick() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Silent
    }
  }
}

const sfx = new SoundEffects();

// Helper to choose a non-repeating random index from an array
function getNextRandomIndex(currentIdx: number, total: number): number {
  if (total <= 1) return 0;
  let next = Math.floor(Math.random() * total);
  while (next === currentIdx) {
    next = Math.floor(Math.random() * total);
  }
  return next;
}

// ==========================================
// DAYS BILINGUAL TRANSLATION MAP
// ==========================================
const DAYS_TRANSLATION: Record<string, { en: string; mr: string }> = {
  Monday: { en: 'Monday', mr: 'सोमवार' },
  Tuesday: { en: 'Tuesday', mr: 'मंगळवार' },
  Wednesday: { en: 'Wednesday', mr: 'बुधवार' },
  Thursday: { en: 'Thursday', mr: 'गुरुवार' },
  Friday: { en: 'Friday', mr: 'शुक्रवार' },
  Saturday: { en: 'Saturday', mr: 'शनिवार' },
  Sunday: { en: 'Sunday', mr: 'रविवार' },
};

// ==========================================
// GAME 1: EXPANDED CALENDAR DATA (14 DIVERSE DATES)
// ==========================================
interface CalendarChallenge {
  dateStrEn: string;
  dateStrMr: string;
  significanceEn: string;
  significanceMr: string;
  correctDay: string;
  options: string[];
}

const CALENDAR_CHALLENGES: CalendarChallenge[] = [
  {
    dateStrEn: '15 August 1947',
    dateStrMr: '१५ ऑगस्ट १९४७',
    significanceEn: 'Indian Independence Day',
    significanceMr: 'भारतीय स्वातंत्र्य दिन',
    correctDay: 'Friday',
    options: ['Wednesday', 'Thursday', 'Friday', 'Saturday'],
  },
  {
    dateStrEn: '26 January 1950',
    dateStrMr: '२६ जानेवारी १९५०',
    significanceEn: 'Constitution of India Enacted',
    significanceMr: 'भारतीय प्रजासत्ताक दिन',
    correctDay: 'Thursday',
    options: ['Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  },
  {
    dateStrEn: '19 February 1630',
    dateStrMr: '१९ फेब्रुवारी १६३०',
    significanceEn: 'Chhatrapati Shivaji Maharaj Birth Anniversary',
    significanceMr: 'छत्रपती शिवाजी महाराज जयंती',
    correctDay: 'Friday',
    options: ['Monday', 'Wednesday', 'Friday', 'Sunday'],
  },
  {
    dateStrEn: '1 May 1960',
    dateStrMr: '१ मे १९६०',
    significanceEn: 'Maharashtra State Formation Day',
    significanceMr: 'महाराष्ट्र राज्य स्थापना दिन',
    correctDay: 'Sunday',
    options: ['Friday', 'Saturday', 'Sunday', 'Monday'],
  },
  {
    dateStrEn: '14 April 1891',
    dateStrMr: '१४ एप्रिल १८९१',
    significanceEn: 'Dr. B. R. Ambedkar Birth Anniversary',
    significanceMr: 'डॉ. बाबासाहेब आंबेडकर जयंती',
    correctDay: 'Tuesday',
    options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
  },
  {
    dateStrEn: '25 June 1983',
    dateStrMr: '२५ जून १९८३',
    significanceEn: 'India First Cricket World Cup Victory',
    significanceMr: 'भारताचा पहिला क्रिकेट विश्वचषक विजय',
    correctDay: 'Saturday',
    options: ['Thursday', 'Friday', 'Saturday', 'Sunday'],
  },
  {
    dateStrEn: '2 April 2011',
    dateStrMr: '२ एप्रिल २०११',
    significanceEn: 'India ICC World Cup Victory at Wankhede',
    significanceMr: 'भारताचा २०११ वानखेडे विश्वचषक विजय',
    correctDay: 'Saturday',
    options: ['Friday', 'Saturday', 'Sunday', 'Monday'],
  },
  {
    dateStrEn: '23 August 2023',
    dateStrMr: '२३ ऑगस्ट २०२३',
    significanceEn: 'Chandrayaan-3 Historic Moon Landing',
    significanceMr: 'चांद्रयान-३ ऐतिहासिक चंद्र मोहीम',
    correctDay: 'Wednesday',
    options: ['Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  },
  {
    dateStrEn: '26 July 1999',
    dateStrMr: '२६ जुलै १९९९',
    significanceEn: 'Kargil Vijay Diwas',
    significanceMr: 'कारगिल विजय दिवस',
    correctDay: 'Monday',
    options: ['Sunday', 'Monday', 'Tuesday', 'Wednesday'],
  },
  {
    dateStrEn: '2 October 1869',
    dateStrMr: '२ ऑक्टोबर १८६९',
    significanceEn: 'Mahatma Gandhi Birth Anniversary',
    significanceMr: 'महात्मा गांधी जयंती',
    correctDay: 'Saturday',
    options: ['Wednesday', 'Thursday', 'Friday', 'Saturday'],
  },
  {
    dateStrEn: '15 January 1949',
    dateStrMr: '१५ जानेवारी १९४९',
    significanceEn: 'Indian Army Day (Field Marshal Cariappa)',
    significanceMr: 'भारतीय सेना दिवस',
    correctDay: 'Saturday',
    options: ['Thursday', 'Friday', 'Saturday', 'Sunday'],
  },
  {
    dateStrEn: '16 December 1971',
    dateStrMr: '१६ डिसेंबर १९७१',
    significanceEn: 'Vijay Diwas Historic Victory',
    significanceMr: 'विजय दिवस ऐतिहासिक विजय',
    correctDay: 'Thursday',
    options: ['Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  },
  {
    dateStrEn: '15 August 2030',
    dateStrMr: '१५ ऑगस्ट २०३०',
    significanceEn: 'Future Independence Day 2030',
    significanceMr: 'भविष्यकालीन स्वातंत्र्य दिन २०३०',
    correctDay: 'Thursday',
    options: ['Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  },
  {
    dateStrEn: '26 January 2035',
    dateStrMr: '२६ जानेवारी २०३५',
    significanceEn: 'Future Republic Day 2035',
    significanceMr: 'भविष्यकालीन प्रजासत्ताक दिन २०३५',
    correctDay: 'Friday',
    options: ['Wednesday', 'Thursday', 'Friday', 'Saturday'],
  }
];

// ==========================================
// GAME 2: EXPANDED VEDIC MATH DATA (20 PROBLEMS)
// ==========================================
interface VedicChallenge {
  titleEn: string;
  titleMr: string;
  problem: string;
  answer: number;
  options: number[];
  sutraNameEn: string;
  sutraNameMr: string;
}

const VEDIC_CHALLENGES: VedicChallenge[] = [
  // Squares ending in 5
  {
    titleEn: 'Squares Ending in 5',
    titleMr: 'शेवटी ५ असणाऱ्या संख्यांचा वर्ग',
    problem: '25 × 25',
    answer: 625,
    options: [525, 625, 725, 675],
    sutraNameEn: 'Ekadhikena Purvena Formula (2 × 3 = 6, append 25)',
    sutraNameMr: 'एकाधिकेन पूर्वेण सूत्र (२ × ३ = ६, पुढे २५)',
  },
  {
    titleEn: 'Squares Ending in 5',
    titleMr: 'शेवटी ५ असणाऱ्या संख्यांचा वर्ग',
    problem: '35 × 35',
    answer: 1225,
    options: [1125, 1225, 1325, 1425],
    sutraNameEn: 'Ekadhikena Purvena Formula (3 × 4 = 12, append 25)',
    sutraNameMr: 'एकाधिकेन पूर्वेण सूत्र (३ × ४ = १२, पुढे २५)',
  },
  {
    titleEn: 'Squares Ending in 5',
    titleMr: 'शेवटी ५ असणाऱ्या संख्यांचा वर्ग',
    problem: '45 × 45',
    answer: 2025,
    options: [1925, 2025, 2125, 2225],
    sutraNameEn: 'Ekadhikena Purvena Formula (4 × 5 = 20, append 25)',
    sutraNameMr: 'एकाधिकेन पूर्वेण सूत्र (४ × ५ = २०, पुढे २५)',
  },
  {
    titleEn: 'Squares Ending in 5',
    titleMr: 'शेवटी ५ असणाऱ्या संख्यांचा वर्ग',
    problem: '65 × 65',
    answer: 4225,
    options: [4125, 4225, 4325, 4425],
    sutraNameEn: 'Ekadhikena Purvena Formula (6 × 7 = 42, append 25)',
    sutraNameMr: 'एकाधिकेन पूर्वेण सूत्र (६ × ७ = ४२, पुढे २५)',
  },
  {
    titleEn: 'Squares Ending in 5',
    titleMr: 'शेवटी ५ असणाऱ्या संख्यांचा वर्ग',
    problem: '75 × 75',
    answer: 5625,
    options: [5425, 5625, 5825, 6225],
    sutraNameEn: 'Ekadhikena Purvena Formula (7 × 8 = 56, append 25)',
    sutraNameMr: 'एकाधिकेन पूर्वेण सूत्र (७ × ८ = ५६, पुढे २५)',
  },
  {
    titleEn: 'Squares Ending in 5',
    titleMr: 'शेवटी ५ असणाऱ्या संख्यांचा वर्ग',
    problem: '85 × 85',
    answer: 7225,
    options: [7025, 7125, 7225, 7425],
    sutraNameEn: 'Ekadhikena Purvena Formula (8 × 9 = 72, append 25)',
    sutraNameMr: 'एकाधिकेन पूर्वेण सूत्र (८ × ९ = ७२, पुढे २५)',
  },
  {
    titleEn: 'Squares Ending in 5',
    titleMr: 'शेवटी ५ असणाऱ्या संख्यांचा वर्ग',
    problem: '95 × 95',
    answer: 9025,
    options: [8925, 9025, 9125, 9225],
    sutraNameEn: 'Ekadhikena Purvena Formula (9 × 10 = 90, append 25)',
    sutraNameMr: 'एकाधिकेन पूर्वेण सूत्र (९ × १० = ९०, पुढे २५)',
  },
  {
    titleEn: 'Squares Ending in 5',
    titleMr: 'शेवटी ५ असणाऱ्या संख्यांचा वर्ग',
    problem: '105 × 105',
    answer: 11025,
    options: [10825, 11025, 11225, 11425],
    sutraNameEn: 'Ekadhikena Purvena Formula (10 × 11 = 110, append 25)',
    sutraNameMr: 'एकाधिकेन पूर्वेण सूत्र (१० × ११ = ११०, पुढे २५)',
  },
  // Multiply by 11
  {
    titleEn: 'Lightning 11 Multiplication',
    titleMr: '११ ने जलद गुणाकार',
    problem: '24 × 11',
    answer: 264,
    options: [244, 264, 284, 254],
    sutraNameEn: 'Sandwich Addition Method (2, 2+4=6, 4)',
    sutraNameMr: 'सँडविच बेरीज पद्धत (२, २+४=६, ४)',
  },
  {
    titleEn: 'Lightning 11 Multiplication',
    titleMr: '११ ने जलद गुणाकार',
    problem: '35 × 11',
    answer: 385,
    options: [375, 385, 395, 415],
    sutraNameEn: 'Sandwich Addition Method (3, 3+5=8, 5)',
    sutraNameMr: 'सँडविच बेरीज पद्धत (३, ३+५=८, ५)',
  },
  {
    titleEn: 'Lightning 11 Multiplication',
    titleMr: '११ ने जलद गुणाकार',
    problem: '43 × 11',
    answer: 473,
    options: [463, 473, 483, 493],
    sutraNameEn: 'Sandwich Addition Method (4, 4+3=7, 3)',
    sutraNameMr: 'सँडविच बेरीज पद्धत (४, ४+३=७, ३)',
  },
  {
    titleEn: 'Lightning 11 Multiplication',
    titleMr: '११ ने जलद गुणाकार',
    problem: '52 × 11',
    answer: 572,
    options: [562, 572, 582, 592],
    sutraNameEn: 'Sandwich Addition Method (5, 5+2=7, 2)',
    sutraNameMr: 'सँडविच बेरीज पद्धत (५, ५+२=७, २)',
  },
  {
    titleEn: 'Lightning 11 Multiplication',
    titleMr: '११ ने जलद गुणाकार',
    problem: '63 × 11',
    answer: 693,
    options: [683, 693, 703, 713],
    sutraNameEn: 'Sandwich Addition Method (6, 6+3=9, 3)',
    sutraNameMr: 'सँडविच बेरीज पद्धत (६, ६+३=९, ३)',
  },
  {
    titleEn: 'Lightning 11 Multiplication',
    titleMr: '११ ने जलद गुणाकार',
    problem: '72 × 11',
    answer: 792,
    options: [782, 792, 802, 812],
    sutraNameEn: 'Sandwich Addition Method (7, 7+2=9, 2)',
    sutraNameMr: 'सँडविच बेरीज पद्धत (७, ७+२=९, २)',
  },
  // Base 100 Multiplication
  {
    titleEn: 'Base 100 Multiplication',
    titleMr: 'पाया १०० गुणाकार',
    problem: '102 × 103',
    answer: 10506,
    options: [10506, 10606, 10406, 10706],
    sutraNameEn: 'Nikhilam Sutra (+2, +3: 102+3=105, 2×3=06)',
    sutraNameMr: 'निखिलं सूत्र (+२, +३: १०२+३=१०५, २×३=०६)',
  },
  {
    titleEn: 'Base 100 Multiplication',
    titleMr: 'पाया १०० गुणाकार',
    problem: '104 × 107',
    answer: 11128,
    options: [11028, 11128, 11228, 11328],
    sutraNameEn: 'Nikhilam Sutra (+4, +7: 104+7=111, 4×7=28)',
    sutraNameMr: 'निखिलं सूत्र (+४, +७: १०४+७=१११, ४×७=२८)',
  },
  {
    titleEn: 'Base 100 Multiplication',
    titleMr: 'पाया १०० गुणाकार',
    problem: '103 × 108',
    answer: 11124,
    options: [11024, 11124, 11224, 11324],
    sutraNameEn: 'Nikhilam Sutra (+3, +8: 103+8=111, 3×8=24)',
    sutraNameMr: 'निखिलं सूत्र (+३, +८: १०३+८=१११, ३×८=२४)',
  },
  {
    titleEn: 'Base 100 Multiplication',
    titleMr: 'पाया १०० गुणाकार',
    problem: '105 × 106',
    answer: 11130,
    options: [11030, 11130, 11230, 11330],
    sutraNameEn: 'Nikhilam Sutra (+5, +6: 105+6=111, 5×6=30)',
    sutraNameMr: 'निखिलं सूत्र (+५, +६: १०५+६=१११, ५×६=३०)',
  },
  {
    titleEn: 'Base 100 Subtraction',
    titleMr: 'पाया १०० गुणाकार (१०० पेक्षा कमी)',
    problem: '96 × 97',
    answer: 9312,
    options: [9212, 9312, 9412, 9512],
    sutraNameEn: 'Nikhilam Sutra (-4, -3: 96-3=93, 4×3=12)',
    sutraNameMr: 'निखिलं सूत्र (-४, -३: ९६-३=९३, ४×३=१२)',
  },
  {
    titleEn: 'Base 100 Subtraction',
    titleMr: 'पाया १०० गुणाकार (१०० पेक्षा कमी)',
    problem: '94 × 98',
    answer: 9212,
    options: [9112, 9212, 9312, 9412],
    sutraNameEn: 'Nikhilam Sutra (-6, -2: 94-2=92, 6×2=12)',
    sutraNameMr: 'निखिलं सूत्र (-६, -२: ९४-२=९२, ६×२=१२)',
  }
];

// ==========================================
// GAME 3: MEMORY FLASH DATA
// ==========================================
interface MemoryCard {
  id: number;
  icon: string;
  titleEn: string;
  titleMr: string;
  factEn: string;
  factMr: string;
}

const MEMORY_ITEMS_POOL: MemoryCard[] = [
  {
    id: 1,
    icon: 'shield',
    titleEn: 'Article 32',
    titleMr: 'कलम ३२',
    factEn: 'Heart of Indian Constitution',
    factMr: 'भारतीय राज्यघटनेचा आत्मा'
  },
  {
    id: 2,
    icon: 'fort',
    titleEn: 'Raigad Fort',
    titleMr: 'रायगड किल्ला',
    factEn: 'Coronation Capital of Swarajya',
    factMr: 'स्वराज्याची राजधानी'
  },
  {
    id: 3,
    icon: 'military_tech',
    titleEn: 'Police Sub-Inspector',
    titleMr: 'पोलीस उपनिरीक्षक (PSI)',
    factEn: 'Two Stars on Shoulder',
    factMr: 'खांद्यावर दोन स्टार'
  },
  {
    id: 4,
    icon: 'rocket_launch',
    titleEn: 'Chandrayaan-3',
    titleMr: 'चंद्रयान-३',
    factEn: 'Landed on Moon South Pole',
    factMr: 'चंद्राच्या दक्षिण ध्रुवावर लँडिंग'
  },
  {
    id: 5,
    icon: 'calculate',
    titleEn: 'Ramanujan 1729',
    titleMr: 'रामानुजन १७२९',
    factEn: 'Hardy-Ramanujan Magic Number',
    factMr: 'हार्डी-रामानुजन जादुई संख्या'
  },
  {
    id: 6,
    icon: 'water_drop',
    titleEn: 'Koyna Dam',
    titleMr: 'कोयना धरण',
    factEn: 'Lifeline of Maharashtra (Satara)',
    factMr: 'महाराष्ट्राची भाग्यरेषा (सातारा)'
  }
];

// ==========================================
// GAME 4: NEURO AGILITY (STROOP EFFECT)
// ==========================================
interface StroopColor {
  id: string;
  nameEn: string;
  nameMr: string;
  hex: string;
}

const STROOP_COLORS: StroopColor[] = [
  { id: 'red', nameEn: 'RED', nameMr: 'लाल', hex: '#EF4444' },
  { id: 'blue', nameEn: 'BLUE', nameMr: 'निळा', hex: '#0052FF' },
  { id: 'green', nameEn: 'GREEN', nameMr: 'हिरवा', hex: '#10B981' },
  { id: 'yellow', nameEn: 'YELLOW', nameMr: 'पिवळा', hex: '#EAB308' },
  { id: 'purple', nameEn: 'PURPLE', nameMr: 'जांभळा', hex: '#8B5CF6' }
];

interface StroopChallenge {
  wordEn: string;
  wordMr: string;
  colorId: string;
  colorHex: string;
}

// ==========================================
// LANGUAGE STRINGS (100% PURE, NO EMOJIS)
// ==========================================
const LANG = {
  en: {
    langLabel: 'मराठी',
    badge: 'Cognitive Speed Arena • Brain vs Machine',
    title: 'Brain Games & Speed Challenge',
    subtitle: 'The computer solves in milliseconds — but with structured memory techniques, the human mind outpaces any calculator. Test yourself:',
    tab1: 'Calendar Speed',
    tab2: 'Vedic Math',
    tab3: 'Flash Recall',
    tab4: 'Neuro Agility',
    tabStats: 'Performance',
    correctCal: (t: string) => `Correct weekday verified in ${t}s!`,
    wrongCal: (d: string) => `Incorrect. The correct day is "${d}".`,
    nextDate: 'Next Date',
    correctVedic: (t: string) => `Correct answer computed in ${t}s!`,
    wrongVedic: (a: string) => `Incorrect. The correct answer is "${a}".`,
    nextMath: 'Next Math Problem',
    memInstruct: 'Memorize these 6 items and their numbered slot in 5 seconds:',
    memQuestion: (n: number) => `Which item was placed at Slot #${n}?`,
    memCorrect: (n: number, t: string) => `Exact recall! Slot #${n} was "${t}".`,
    memWrong: (n: number, t: string) => `Incorrect. Slot #${n} was "${t}".`,
    playAgain: 'Next Round',
    memorizeTimer: (s: number) => `Time remaining: ${s}s`,
    iMemorized: 'I Have Memorized! Test Me',
    stroopRule: 'Cognitive Rule: Do NOT read the text — identify the INK COLOR!',
    stroopCorrect: (t: string) => `Reflex verified! Reaction time: ${t}s.`,
    stroopWrong: (c: string) => `Distracted by text! The ink color was "${c}".`,
    nextReflex: 'Next Reflex Challenge',
    ctaTitle: 'Ready to train your mind into a calculation engine?',
    ctaDesc: 'Master rapid mental calculation and memory indexing under Prashant Dhumal Sir. Register for an orientation session today.',
    ctaBtn: 'Book Orientation Session',
    whatsapp: 'WhatsApp: +91 84593 44077',
    starsLabel: 'Performance Rating',
    wantToLearn: 'Master the underlying technique',
    startChallenge: 'Start Challenge',
    startMemory: 'Start Memory Test',
    restart: 'Restart',
    pause: 'Pause',
    resume: 'Resume',
    tryAgain: 'Try Again',
    gamePaused: 'Session Paused',
    timeUp: 'Time Expired!',
    timeLimit: 'Limit:',
    questionPromptCal: 'Identify the day of the week:',
    questionPromptVedic: 'Calculate mentally without writing:',
    questionPromptStroop: 'Select the actual ink color below:',
    courseCalBadge: 'Course: MM-04 Superfast Calendar Technique',
    courseCalTitle: 'Calendar Day Calculation vs Supercomputer',
    courseVedicBadge: 'Course: MM-05 Vedic Mathematics Foundation',
    courseVedicTitle: 'Vedic Lightning Math vs Calculator',
    courseMemBadge: 'Course: MM-01 Memory & MM-03 Police Bharti Written Prep',
    courseMemTitle: 'Visual Memory Flash & Recall Assessment',
    courseStroopBadge: 'Neuro Reflex & Cognitive Conflict',
    courseStroopTitle: 'Stroop Effect Reflex Speed',
    bookDemo: 'Book Demo',
    contactNow: 'Contact Academy',
    askWhatsApp: 'WhatsApp Query',
  },
  mr: {
    langLabel: 'English',
    badge: 'कॉग्निटिव्ह अरेना • कॉम्प्युटर vs मानवी मेंदू',
    title: 'ब्रेन गेम्स आणि स्पीड चॅलेंज',
    subtitle: 'कॉम्प्युटर मिलिसेकंदात उत्तर देतो — पण अचूक वैज्ञानिक सूत्रांनी मानवी मेंदू कॅल्क्युलेटरपेक्षा वेगाने उत्तर देऊ शकतो! स्वतःची क्षमता तपासा:',
    tab1: 'कॅलेंडर स्पीड',
    tab2: 'वैदिक गणित',
    tab3: 'फ्लॅश रिकॉल',
    tab4: 'न्यूरो अॅजिलिटी',
    tabStats: 'प्रगती अहवाल',
    correctCal: (t: string) => `अचूक वार! ${t} सेकंदात उत्तर नोंदवले.`,
    wrongCal: (d: string) => `उत्तर चुकले. योग्य वार "${d}" आहे.`,
    nextDate: 'पुढील तारीख',
    correctVedic: (t: string) => `अचूक गणना! ${t} सेकंदात सोडवले.`,
    wrongVedic: (a: string) => `उत्तर चुकले. योग्य उत्तर "${a}" आहे.`,
    nextMath: 'पुढील गणित',
    memInstruct: 'खालील ६ बाबी आणि त्यांचा क्रमांक ५ सेकंदात लक्षात ठेवा:',
    memQuestion: (n: number) => `क्रमांक #${n} वर कोणते घटक कार्ड होते?`,
    memCorrect: (n: number, t: string) => `उत्कृष्ट स्मरण! क्रमांक #${n} वर "${t}" होते.`,
    memWrong: (n: number, t: string) => `उत्तर चुकले. क्रमांक #${n} वर "${t}" होते.`,
    playAgain: 'पुढील फेरी',
    memorizeTimer: (s: number) => `शिल्लक वेळ: ${s} सेकंद`,
    iMemorized: 'मला आठवले! प्रश्न विचारा',
    stroopRule: 'नियम: शब्द वाचू नका — केवळ शब्दाचा शाईचा रंग ओळखा!',
    stroopCorrect: (t: string) => `उत्कृष्ट रिफ्लेक्स! रिएक्शन वेळ: ${t} सेकंद.`,
    stroopWrong: (c: string) => `लक्ष विचलित झाले! शाईचा खरा रंग "${c}" होता.`,
    nextReflex: 'पुढील रिफ्लेक्स',
    ctaTitle: 'मेंदूला सुपरकॉम्प्युटर बनवण्याचे तंत्र शिकायचे आहे का?',
    ctaDesc: 'सातारा मुख्य केंद्र अथवा ऑनलाईन बॅचेसमध्ये सागर (प्रशांत) धुमाळ सरांकडून थेट प्रशिक्षण घ्या. मोफत डेमो क्लाससाठी आजच नोंदणी करा.',
    ctaBtn: 'मोफत डेमो बुक करा',
    whatsapp: 'WhatsApp: +91 84593 44077',
    starsLabel: 'कामगिरी मूल्यमापन',
    wantToLearn: 'हे शास्त्रशुद्ध तंत्र शिका',
    startChallenge: 'सुरू करा',
    startMemory: 'मेमरी टेस्ट सुरू करा',
    restart: 'रीस्टार्ट',
    pause: 'थांबवा',
    resume: 'पुढे सुरू करा',
    tryAgain: 'पुन्हा प्रयत्न करा',
    gamePaused: 'गेम थांबवला आहे',
    timeUp: 'वेळ संपली!',
    timeLimit: 'मर्यादा:',
    questionPromptCal: 'दिलेल्या तारखेचा योग्य वार निवडा:',
    questionPromptVedic: 'कागद-पेन न वापरता मनात गणना करा:',
    questionPromptStroop: 'शब्दाच्या शाईचा खरा रंग ओळखा:',
    courseCalBadge: 'कोर्स: MM-04 सुपरफास्ट कॅलेंडर तंत्रज्ञान',
    courseCalTitle: 'कॅलेंडर स्पीड चॅलेंज vs कॉम्प्युटर',
    courseVedicBadge: 'कोर्स: MM-05 वैदिक मॅथेमॅटिक्स फाउंडेशन',
    courseVedicTitle: 'वैदिक गणित vs कॅल्क्युलेटर',
    courseMemBadge: 'कोर्स: MM-01 मेमरी तंत्र & MM-03 पोलीस भरती लेखी',
    courseMemTitle: 'व्हिज्युअल मेमरी फ्लॅश & रिकॉल चॅलेंज',
    courseStroopBadge: 'माइंड ॲजिलिटी आणि संज्ञानात्मक रिफ्लेक्स',
    courseStroopTitle: 'न्यूरो रिफ्लेक्स स्पीड (Stroop Effect)',
    bookDemo: 'डेमो बुक करा',
    contactNow: 'अकादमीशी संपर्क करा',
    askWhatsApp: 'WhatsApp वर विचारा',
  }
};

// ==========================================
// STAR RATING COMPONENT (CLEAN SVG STARS, NO EMOJIS)
// ==========================================
const StarRating: React.FC<{ stars: number; label: string }> = ({ stars, label }) => (
  <div className="flex flex-col items-center gap-1.5 py-4">
    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`w-6 h-6 transition-all duration-300 ${
            i <= stars ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)] scale-110' : 'text-slate-200 fill-slate-200'
          }`}
          viewBox="0 0 24 24"
        >
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
    </div>
  </div>
);

const getTimeStars = (elapsed: number, limit: number = 10): number => {
  const pctUsed = elapsed / limit;
  if (pctUsed <= 0.25) return 5;
  if (pctUsed <= 0.45) return 4;
  if (pctUsed <= 0.65) return 3;
  if (pctUsed <= 0.85) return 2;
  return 1;
};

// ==========================================
// REAL LIQUID WAVE TANK FILL COMPONENT
// Dual animated horizontal sine waves rising from bottom to top
// ==========================================
interface RealLiquidWaveFillProps {
  fillPct: number;
  remaining: number;
  elapsed: number;
  limit: number;
  running: boolean;
  paused?: boolean;
  isUrgent: boolean;
  isWarning: boolean;
  isAnswered: boolean;
  isTimeout: boolean;
  theme?: 'blue' | 'amber' | 'cyan';
  lang?: 'en' | 'mr';
}

const RealLiquidWaveFill: React.FC<RealLiquidWaveFillProps> = ({
  fillPct,
  remaining,
  elapsed,
  limit,
  running,
  paused = false,
  isUrgent,
  isWarning,
  isAnswered,
  isTimeout,
  theme = 'blue',
  lang = 'en',
}) => {
  const palette = isUrgent
    ? {
        liquidGrad: 'linear-gradient(180deg, rgba(239, 68, 68, 0.38) 0%, rgba(220, 38, 38, 0.22) 50%, rgba(185, 28, 28, 0.30) 100%)',
        waveFront: '#EF4444',
        waveBack: '#F87171',
        hudText: 'text-red-400',
        ledBg: 'bg-red-500 animate-ping',
      }
    : isWarning
    ? {
        liquidGrad: 'linear-gradient(180deg, rgba(245, 158, 11, 0.35) 0%, rgba(217, 119, 6, 0.20) 50%, rgba(180, 83, 9, 0.28) 100%)',
        waveFront: '#F59E0B',
        waveBack: '#FBBF24',
        hudText: 'text-amber-300',
        ledBg: 'bg-amber-400 animate-pulse',
      }
    : theme === 'amber'
    ? {
        liquidGrad: 'linear-gradient(180deg, rgba(245, 158, 11, 0.30) 0%, rgba(217, 119, 6, 0.18) 50%, rgba(180, 83, 9, 0.25) 100%)',
        waveFront: '#F59E0B',
        waveBack: '#FCD34D',
        hudText: 'text-amber-300',
        ledBg: 'bg-amber-400 animate-pulse',
      }
    : theme === 'cyan'
    ? {
        liquidGrad: 'linear-gradient(180deg, rgba(6, 182, 212, 0.32) 0%, rgba(8, 145, 178, 0.20) 50%, rgba(14, 116, 144, 0.28) 100%)',
        waveFront: '#06B6D4',
        waveBack: '#67E8F9',
        hudText: 'text-cyan-300',
        ledBg: 'bg-cyan-400 animate-pulse',
      }
    : {
        liquidGrad: 'linear-gradient(180deg, rgba(0, 140, 255, 0.30) 0%, rgba(0, 82, 255, 0.18) 50%, rgba(30, 64, 175, 0.25) 100%)',
        waveFront: '#0084FF',
        waveBack: '#60A5FA',
        hudText: 'text-sky-300',
        ledBg: 'bg-sky-400 animate-pulse',
      };

  return (
    <>
      {/* 1. RISING LIQUID TANK BODY */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl z-0">
        <div
          className="absolute inset-x-0 bottom-0 transition-all duration-100 ease-linear overflow-visible"
          style={{ height: `${fillPct}%` }}
        >
          {/* Animated Wave Crest on top of liquid waterline */}
          {fillPct > 0 && (
            <div className="absolute top-0 left-0 -translate-y-[85%] w-[200%] h-8 sm:h-10 overflow-visible pointer-events-none">
              {/* Back Wave */}
              <div
                className="absolute inset-0 w-full h-full opacity-35"
                style={{
                  animation: running && !paused ? 'waveFlowHorizontalReverse 4.5s linear infinite' : 'none',
                }}
              >
                <svg viewBox="0 0 1000 80" preserveAspectRatio="none" className="w-full h-full">
                  <path
                    d="M 0 40 Q 125 75, 250 40 T 500 40 T 750 40 T 1000 40 L 1000 80 L 0 80 Z"
                    fill={palette.waveBack}
                  />
                </svg>
              </div>

              {/* Front Wave */}
              <div
                className="absolute inset-0 w-full h-full opacity-85"
                style={{
                  animation: running && !paused ? 'waveFlowHorizontal 3s linear infinite' : 'none',
                  filter: `drop-shadow(0 2px 6px ${palette.waveFront})`,
                }}
              >
                <svg viewBox="0 0 1000 80" preserveAspectRatio="none" className="w-full h-full">
                  <path
                    d="M 0 40 Q 125 5, 250 40 T 500 40 T 750 40 T 1000 40 L 1000 80 L 0 80 Z"
                    fill={palette.waveFront}
                  />
                </svg>
              </div>
            </div>
          )}

          {/* Liquid Body */}
          <div
            className="w-full h-full"
            style={{
              background: palette.liquidGrad,
              boxShadow: 'inset 0 4px 15px rgba(255,255,255,0.20)',
            }}
          />
        </div>
      </div>

      {/* 2. DIGITAL STOPWATCH HUD PILL (POPPINS FONT NUMBERS) */}
      <div className={`absolute bottom-3.5 right-4 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-md text-xs shadow-lg transition-all ${
        theme === 'cyan'
          ? 'bg-slate-950/90 text-white border border-cyan-500/40 shadow-cyan-500/20'
          : 'bg-slate-900/90 text-white border border-slate-700/80 shadow-slate-900/30'
      }`}>
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            paused ? 'bg-amber-400' : running ? palette.ledBg : 'bg-slate-500'
          }`}
        />
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-['Poppins']">
          {paused ? (lang === 'mr' ? 'थांबवले' : 'PAUSED') : (lang === 'mr' ? 'वेळ' : 'TIME')}
        </span>
        <span
          className={`font-black tracking-wider font-['Poppins'] ${
            isTimeout
              ? 'text-red-400 animate-bounce'
              : isAnswered
              ? 'text-emerald-400 font-extrabold'
              : palette.hudText
          }`}
        >
          {isTimeout
            ? '00.0s'
            : isAnswered
            ? `✓ ${elapsed.toFixed(2)}s`
            : `${remaining.toFixed(1)}s / ${limit}s`}
        </span>
      </div>
    </>
  );
};

export const BrainGames: React.FC = () => {
  // Default language is English as requested by user
  const [lang, setLang] = useState<'en' | 'mr'>('en');
  const t = LANG[lang];

  // Fonts: Mukta & Noto Sans Devanagari for clean Marathi jodshabd, Poppins for clean digits
  const textFont = lang === 'mr' ? { fontFamily: "'Mukta', 'Noto Sans Devanagari', sans-serif" } : {};
  const numFont = { fontFamily: "'Poppins', sans-serif" };

  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'calendar' | 'vedic' | 'memory' | 'neuro' | 'stats'>('calendar');

  // Deep-link game selection from Home or URL
  useEffect(() => {
    const g = searchParams.get('game') || searchParams.get('tab');
    if (g) {
      const map: Record<string, 'calendar' | 'vedic' | 'memory' | 'neuro' | 'stats'> = {
        calendar: 'calendar',
        cal: 'calendar',
        vedic: 'vedic',
        maths: 'vedic',
        math: 'vedic',
        memory: 'memory',
        flash: 'memory',
        neuro: 'neuro',
        agility: 'neuro',
        stroop: 'neuro',
        stats: 'stats',
      };
      const targetTab = map[g.toLowerCase()];
      if (targetTab) {
        setActiveTab(targetTab);
      }
    }
  }, [searchParams]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalPlayed, setTotalPlayed] = useState(0);

  // Persistent metrics
  const [xp, setXP] = useState<number>(() => {
    try { return parseInt(localStorage.getItem('mm_xp') || '0', 10); } catch { return 0; }
  });
  const [gameCount, setGameCount] = useState<number>(() => {
    try { return parseInt(localStorage.getItem('mm_gameCount') || '0', 10); } catch { return 0; }
  });
  const [bestTime, setBestTime] = useState<number>(() => {
    try { return parseFloat(localStorage.getItem('mm_bestTime') || '9999'); } catch { return 9999; }
  });

  const timerLimit = 10;

  const updateStreak = (correct: boolean, timeTaken: number) => {
    setTotalPlayed((prev) => prev + 1);
    const newCount = gameCount + 1;
    setGameCount(newCount);
    try { localStorage.setItem('mm_gameCount', String(newCount)); } catch { /* ok */ }

    if (correct) {
      sfx.playSuccess();
      const newStreak = streak + 1;
      setStreak(newStreak);
      setTotalCorrect((prev) => prev + 1);
      if (newStreak > bestStreak) setBestStreak(newStreak);
      if (timeTaken > 0 && timeTaken < bestTime) {
        setBestTime(timeTaken);
        try { localStorage.setItem('mm_bestTime', String(timeTaken)); } catch { /* ok */ }
      }
      const newXP = xp + 20;
      setXP(newXP);
      try { localStorage.setItem('mm_xp', String(newXP)); } catch { /* ok */ }
    } else {
      sfx.playWrong();
      setStreak(0);
    }
  };

  // ----------------------------------------------------
  // GAME 1 LOGIC: CALENDAR SPEED (MM-04)
  // ----------------------------------------------------
  const [calStarted, setCalStarted] = useState(false);
  const [calPaused, setCalPaused] = useState(false);
  const [calIndex, setCalIndex] = useState(0);
  const [calSelected, setCalSelected] = useState<string | null>(null);
  const [calStartTime, setCalStartTime] = useState<number>(Date.now());
  const [calElapsed, setCalElapsed] = useState<number>(0);
  const [calTimerRunning, setCalTimerRunning] = useState(false);
  const calTimerRef = useRef<number | null>(null);

  const calRemaining = Math.max(timerLimit - calElapsed, 0);
  const calFillPct = Math.min(Math.max((calElapsed / timerLimit) * 100, 0), 100);
  const isCalUrgent = calRemaining <= 2.5 && calTimerRunning;
  const isCalWarning = calRemaining <= 4.5 && calTimerRunning;

  const currentCal = CALENDAR_CHALLENGES[calIndex % CALENDAR_CHALLENGES.length];

  const startCalGame = () => {
    sfx.playClick();
    setCalStarted(true);
    setCalPaused(false);
    setCalStartTime(Date.now());
    setCalElapsed(0);
    setCalSelected(null);
    setCalTimerRunning(true);
  };

  const restartCalGame = () => {
    sfx.playClick();
    setCalStarted(true);
    setCalPaused(false);
    setCalStartTime(Date.now());
    setCalElapsed(0);
    setCalSelected(null);
    setCalTimerRunning(true);
  };

  const toggleCalPause = () => {
    sfx.playClick();
    if (!calStarted || calSelected !== null) return;
    if (calPaused) {
      setCalStartTime(Date.now() - calElapsed * 1000);
      setCalPaused(false);
      setCalTimerRunning(true);
    } else {
      setCalPaused(true);
      setCalTimerRunning(false);
    }
  };

  const nextCalQuestion = () => {
    sfx.playClick();
    // Non-repeating random index
    const nextIdx = getNextRandomIndex(calIndex, CALENDAR_CHALLENGES.length);
    setCalIndex(nextIdx);
    setCalStartTime(Date.now());
    setCalElapsed(0);
    setCalSelected(null);
    setCalTimerRunning(true);
    setCalPaused(false);
  };

  useEffect(() => {
    if (calStarted && calTimerRunning && !calPaused) {
      calTimerRef.current = window.setInterval(() => {
        setCalElapsed((Date.now() - calStartTime) / 1000);
      }, 50);
    } else {
      if (calTimerRef.current) clearInterval(calTimerRef.current);
    }
    return () => {
      if (calTimerRef.current) clearInterval(calTimerRef.current);
    };
  }, [calStarted, calTimerRunning, calPaused, calStartTime]);

  const handleCalAnswer = (dayKey: string) => {
    if (calSelected !== null || calPaused) return;
    setCalSelected(dayKey);
    setCalTimerRunning(false);
    const isCorrect = dayKey === currentCal.correctDay;
    updateStreak(isCorrect, calElapsed);
  };

  useEffect(() => {
    if (calStarted && calTimerRunning && calElapsed >= timerLimit && calSelected === null) {
      setCalSelected('__TIMEOUT__');
      setCalTimerRunning(false);
      updateStreak(false, calElapsed);
    }
  }, [calStarted, calElapsed, calTimerRunning, timerLimit, calSelected]);

  // ----------------------------------------------------
  // GAME 2 LOGIC: VEDIC MATH (MM-05)
  // ----------------------------------------------------
  const [vedicStarted, setVedicStarted] = useState(false);
  const [vedicPaused, setVedicPaused] = useState(false);
  const [vedicIndex, setVedicIndex] = useState(0);
  const [vedicSelected, setVedicSelected] = useState<number | null>(null);
  const [vedicStartTime, setVedicStartTime] = useState<number>(Date.now());
  const [vedicElapsed, setVedicElapsed] = useState<number>(0);
  const [vedicTimerRunning, setVedicTimerRunning] = useState(false);
  const vedicTimerRef = useRef<number | null>(null);

  const vedicRemaining = Math.max(timerLimit - vedicElapsed, 0);
  const vedicFillPct = Math.min(Math.max((vedicElapsed / timerLimit) * 100, 0), 100);
  const isVedicUrgent = vedicRemaining <= 2.5 && vedicTimerRunning;
  const isVedicWarning = vedicRemaining <= 4.5 && vedicTimerRunning;

  const currentVedic = VEDIC_CHALLENGES[vedicIndex % VEDIC_CHALLENGES.length];

  const startVedicGame = () => {
    sfx.playClick();
    setVedicStarted(true);
    setVedicPaused(false);
    setVedicStartTime(Date.now());
    setVedicElapsed(0);
    setVedicSelected(null);
    setVedicTimerRunning(true);
  };

  const restartVedicGame = () => {
    sfx.playClick();
    setVedicStarted(true);
    setVedicPaused(false);
    setVedicStartTime(Date.now());
    setVedicElapsed(0);
    setVedicSelected(null);
    setVedicTimerRunning(true);
  };

  const toggleVedicPause = () => {
    sfx.playClick();
    if (!vedicStarted || vedicSelected !== null) return;
    if (vedicPaused) {
      setVedicStartTime(Date.now() - vedicElapsed * 1000);
      setVedicPaused(false);
      setVedicTimerRunning(true);
    } else {
      setVedicPaused(true);
      setVedicTimerRunning(false);
    }
  };

  const nextVedicQuestion = () => {
    sfx.playClick();
    // Non-repeating random index
    const nextIdx = getNextRandomIndex(vedicIndex, VEDIC_CHALLENGES.length);
    setVedicIndex(nextIdx);
    setVedicStartTime(Date.now());
    setVedicElapsed(0);
    setVedicSelected(null);
    setVedicTimerRunning(true);
    setVedicPaused(false);
  };

  useEffect(() => {
    if (vedicStarted && vedicTimerRunning && !vedicPaused) {
      vedicTimerRef.current = window.setInterval(() => {
        setVedicElapsed((Date.now() - vedicStartTime) / 1000);
      }, 50);
    } else {
      if (vedicTimerRef.current) clearInterval(vedicTimerRef.current);
    }
    return () => {
      if (vedicTimerRef.current) clearInterval(vedicTimerRef.current);
    };
  }, [vedicStarted, vedicTimerRunning, vedicPaused, vedicStartTime]);

  const handleVedicAnswer = (ans: number) => {
    if (vedicSelected !== null || vedicPaused) return;
    setVedicSelected(ans);
    setVedicTimerRunning(false);
    const isCorrect = ans === currentVedic.answer;
    updateStreak(isCorrect, vedicElapsed);
  };

  useEffect(() => {
    if (vedicStarted && vedicTimerRunning && vedicElapsed >= timerLimit && vedicSelected === null) {
      setVedicSelected(-999);
      setVedicTimerRunning(false);
      updateStreak(false, vedicElapsed);
    }
  }, [vedicStarted, vedicElapsed, vedicTimerRunning, timerLimit, vedicSelected]);

  // ----------------------------------------------------
  // GAME 3 LOGIC: MEMORY FLASH RECALL (MM-01 & MM-03)
  // ----------------------------------------------------
  const [memStarted, setMemStarted] = useState(false);
  const [memState, setMemState] = useState<'memorize' | 'recall' | 'result'>('memorize');
  const [memCountdown, setMemCountdown] = useState(5);
  const [memQuestionPos, setMemQuestionPos] = useState(3);
  const [memSelectedCard, setMemSelectedCard] = useState<number | null>(null);
  const memTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (memTimerRef.current) clearInterval(memTimerRef.current);
    };
  }, []);

  const startMemoryGame = () => {
    sfx.playClick();
    setMemStarted(true);
    setMemState('memorize');
    setMemCountdown(5);
    setMemSelectedCard(null);
    const nextPos = Math.floor(Math.random() * MEMORY_ITEMS_POOL.length) + 1;
    setMemQuestionPos(nextPos);

    if (memTimerRef.current) clearInterval(memTimerRef.current);
    memTimerRef.current = window.setInterval(() => {
      setMemCountdown((prev) => {
        if (prev <= 1) {
          if (memTimerRef.current) clearInterval(memTimerRef.current);
          setMemState('recall');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const skipToRecall = () => {
    sfx.playClick();
    if (memTimerRef.current) clearInterval(memTimerRef.current);
    setMemState('recall');
  };

  const handleMemoryPick = (cardId: number) => {
    if (memSelectedCard !== null) return;
    setMemSelectedCard(cardId);
    setMemState('result');
    const correctItem = MEMORY_ITEMS_POOL[memQuestionPos - 1];
    const isCorrect = cardId === correctItem.id;
    updateStreak(isCorrect, 0);
  };

  const restartMemoryGame = () => {
    startMemoryGame();
  };

  // ----------------------------------------------------
  // GAME 4 LOGIC: NEURO AGILITY (STROOP)
  // ----------------------------------------------------
  const [stroopStarted, setStroopStarted] = useState(false);
  const [stroopPaused, setStroopPaused] = useState(false);
  const [stroopChallenge, setStroopChallenge] = useState<StroopChallenge>({
    wordEn: 'RED',
    wordMr: 'लाल',
    colorId: 'blue',
    colorHex: '#0052FF'
  });
  const [stroopStartTime, setStroopStartTime] = useState(Date.now());
  const [stroopReactionTime, setStroopReactionTime] = useState<number | null>(null);
  const [stroopResult, setStroopResult] = useState<'correct' | 'wrong' | 'timeout' | null>(null);

  const [stroopElapsed, setStroopElapsed] = useState(0);
  const [stroopTimerRunning, setStroopTimerRunning] = useState(false);
  const stroopTimerRef = useRef<number | null>(null);

  const stroopRemaining = Math.max(timerLimit - stroopElapsed, 0);
  const stroopFillPct = Math.min(Math.max((stroopElapsed / timerLimit) * 100, 0), 100);
  const isStroopUrgent = stroopRemaining <= 2.5 && stroopTimerRunning;
  const isStroopWarning = stroopRemaining <= 4.5 && stroopTimerRunning;

  // Non-repeating randomized Stroop generator
  const generateStroop = () => {
    setStroopChallenge((prev) => {
      let wordObj = STROOP_COLORS[Math.floor(Math.random() * STROOP_COLORS.length)];
      while (wordObj.id === prev.colorId || wordObj.nameEn === prev.wordEn) {
        wordObj = STROOP_COLORS[Math.floor(Math.random() * STROOP_COLORS.length)];
      }

      let inkObj = STROOP_COLORS[Math.floor(Math.random() * STROOP_COLORS.length)];
      while (inkObj.id === wordObj.id || inkObj.id === prev.colorId) {
        inkObj = STROOP_COLORS[Math.floor(Math.random() * STROOP_COLORS.length)];
      }

      return {
        wordEn: wordObj.nameEn,
        wordMr: wordObj.nameMr,
        colorId: inkObj.id,
        colorHex: inkObj.hex
      };
    });
  };

  const startStroopGame = () => {
    sfx.playClick();
    generateStroop();
    setStroopStarted(true);
    setStroopPaused(false);
    setStroopStartTime(Date.now());
    setStroopReactionTime(null);
    setStroopResult(null);
    setStroopElapsed(0);
    setStroopTimerRunning(true);
  };

  const restartStroopGame = () => {
    sfx.playClick();
    generateStroop();
    setStroopStarted(true);
    setStroopPaused(false);
    setStroopStartTime(Date.now());
    setStroopReactionTime(null);
    setStroopResult(null);
    setStroopElapsed(0);
    setStroopTimerRunning(true);
  };

  const toggleStroopPause = () => {
    sfx.playClick();
    if (!stroopStarted || stroopResult !== null) return;
    if (stroopPaused) {
      setStroopStartTime(Date.now() - stroopElapsed * 1000);
      setStroopPaused(false);
      setStroopTimerRunning(true);
    } else {
      setStroopPaused(true);
      setStroopTimerRunning(false);
    }
  };

  const nextStroopQuestion = () => {
    sfx.playClick();
    generateStroop();
    setStroopStartTime(Date.now());
    setStroopReactionTime(null);
    setStroopResult(null);
    setStroopElapsed(0);
    setStroopTimerRunning(true);
    setStroopPaused(false);
  };

  useEffect(() => {
    if (stroopStarted && stroopTimerRunning && !stroopPaused) {
      stroopTimerRef.current = window.setInterval(() => {
        setStroopElapsed((Date.now() - stroopStartTime) / 1000);
      }, 50);
    } else {
      if (stroopTimerRef.current) clearInterval(stroopTimerRef.current);
    }
    return () => {
      if (stroopTimerRef.current) clearInterval(stroopTimerRef.current);
    };
  }, [stroopStarted, stroopTimerRunning, stroopPaused, stroopStartTime]);

  const handleStroopAnswer = (chosenColorId: string) => {
    if (stroopResult !== null || stroopPaused) return;
    const timeTaken = (Date.now() - stroopStartTime) / 1000;
    setStroopReactionTime(timeTaken);
    setStroopTimerRunning(false);
    const isCorrect = chosenColorId === stroopChallenge.colorId;
    setStroopResult(isCorrect ? 'correct' : 'wrong');
    updateStreak(isCorrect, timeTaken);
  };

  useEffect(() => {
    if (stroopStarted && stroopTimerRunning && stroopElapsed >= timerLimit && stroopResult === null) {
      setStroopResult('timeout');
      setStroopReactionTime(timerLimit);
      setStroopTimerRunning(false);
      updateStreak(false, timerLimit);
    }
  }, [stroopStarted, stroopElapsed, stroopTimerRunning, timerLimit, stroopResult]);

  return (
    <main className="w-full pt-28 pb-20 bg-background min-h-screen relative overflow-hidden">
      {/* Clean Background Glow */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[340px] bg-secondary-fixed/30 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* TOP BAR: Clean Controls, Zero Emojis */}
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider" style={textFont}>
              {t.badge}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Sound Toggle */}
            <button
              onClick={() => {
                sfx.playClick();
                const next = !soundEnabled;
                setSoundEnabled(next);
                sfx.enabled = next;
              }}
              className="px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              title={soundEnabled ? 'Mute' : 'Unmute'}
            >
              <span className="material-symbols-outlined text-[16px]">
                {soundEnabled ? 'volume_up' : 'volume_off'}
              </span>
              <span style={textFont}>{soundEnabled ? (lang === 'mr' ? 'आवाज' : 'Sound') : (lang === 'mr' ? 'म्युट' : 'Muted')}</span>
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => {
                sfx.playClick();
                setLang(lang === 'mr' ? 'en' : 'mr');
              }}
              className="px-4 py-1.5 rounded-full bg-secondary text-white text-xs font-bold hover:bg-secondary-container transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">translate</span>
              <span>{t.langLabel}</span>
            </button>
          </div>
        </div>

        {/* HERO TITLE & DOTTED COLORFUL BRAIN INTEGRATION */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 text-center md:text-left bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/60 p-6 sm:p-8 rounded-3xl border border-blue-100/90 shadow-sm relative overflow-hidden">
          <div className="space-y-2.5 max-w-2xl z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-100/80 border border-blue-200/80 text-secondary text-xs font-bold font-['Poppins']">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span>{lang === 'mr' ? 'न्यूरल कॉग्निटिव्ह इंजिन • मानवी मेंदू vs सुपरकॉम्प्युटर' : 'NEURAL COGNITION ARENA • BRAIN VS MACHINE'}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight" style={textFont}>
              {t.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl" style={textFont}>
              {t.subtitle}
            </p>
          </div>

          <div className="shrink-0 relative z-10 flex items-center justify-center">
            <DottedColorfulBrain size={180} />
          </div>
        </div>

        {/* GAME SELECTION TABS (SVG ICONS, NO EMOJIS) */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
          {[
            { id: 'calendar', label: t.tab1, icon: 'calendar_today' },
            { id: 'vedic',    label: t.tab2, icon: 'calculate' },
            { id: 'memory',   label: t.tab3, icon: 'psychology' },
            { id: 'neuro',    label: t.tab4, icon: 'speed' },
            { id: 'stats',    label: t.tabStats, icon: 'insights' },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  sfx.playClick();
                  setActiveTab(tab.id as any);
                }}
                className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-secondary text-white shadow-md shadow-secondary/20 scale-102'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
                style={textFont}
              >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ============================================================ */}
        {/* GAME 1: CALENDAR SPEED (MM-04) */}
        {/* ============================================================ */}
        {activeTab === 'calendar' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 animate-fadeIn">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-secondary uppercase tracking-wider" style={textFont}>
                  {t.courseCalBadge}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5" style={textFont}>
                  {t.courseCalTitle}
                </h3>
              </div>

              {calStarted && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={restartCalGame}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200 shadow-2xs"
                    style={textFont}
                  >
                    <span className="material-symbols-outlined text-[16px]">replay</span>
                    <span>{t.restart}</span>
                  </button>

                  <button
                    onClick={toggleCalPause}
                    disabled={calSelected !== null}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                      calPaused
                        ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200 animate-pulse'
                        : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'
                    } ${calSelected !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={textFont}
                  >
                    <span className="material-symbols-outlined text-[16px]">{calPaused ? 'play_arrow' : 'pause'}</span>
                    <span>{calPaused ? t.resume : t.pause}</span>
                  </button>

                  <span className="px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-secondary flex items-center gap-1.5 font-['Poppins']">
                    <span className="material-symbols-outlined text-[16px]">timer</span>
                    <span>{t.timeLimit} {timerLimit}s</span>
                  </span>
                </div>
              )}
            </div>

            {/* PRE-GAME WELCOME SCREEN */}
            {!calStarted ? (
              <div className="relative overflow-hidden rounded-3xl p-8 sm:p-14 text-center border-2 border-blue-200/80 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/50 shadow-sm space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-secondary text-xs font-bold">
                  <span className="material-symbols-outlined text-[16px]">bolt</span>
                  <span style={textFont}>{lang === 'mr' ? '१० सेकंद स्पीड चॅलेंज' : '10s Speed Challenge'}</span>
                </div>

                <div>
                  <h4 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight" style={textFont}>
                    {lang === 'mr' ? 'कॅलेंडर स्पीड चॅलेंज' : 'Calendar Speed Challenge'}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto mt-2" style={textFont}>
                    {lang === 'mr'
                      ? 'कोणत्याही ऐतिहासिक किंवा भविष्यातील तारखेचा अचूक वार १० सेकंदांत सांगा. कागद-पेन न वापरता मनात गणना करा!'
                      : 'Calculate the correct weekday of any historical or future date within 10 seconds without paper or pen!'}
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-2.5 text-xs text-slate-700 font-bold">
                  <span className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-1.5" style={textFont}>
                    <span className="material-symbols-outlined text-[16px] text-blue-600">timer</span>
                    <span>{lang === 'mr' ? '१० सेकंद मर्यादा' : '10s Time Limit'}</span>
                  </span>
                  <span className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-1.5" style={textFont}>
                    <span className="material-symbols-outlined text-[16px] text-blue-600">tune</span>
                    <span>{lang === 'mr' ? '४ वार पर्याय' : '4 Day Options'}</span>
                  </span>
                  <span className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-1.5" style={textFont}>
                    <span className="material-symbols-outlined text-[16px] text-blue-600">psychology</span>
                    <span>{lang === 'mr' ? 'मानवी मेंदू vs कॉम्प्युटर' : 'Human Brain vs Computer'}</span>
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    onClick={startCalGame}
                    className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-base sm:text-lg shadow-xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2.5 mx-auto ring-4 ring-blue-100"
                    style={textFont}
                  >
                    <span className="material-symbols-outlined text-[24px]">play_arrow</span>
                    <span>{t.startChallenge}</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* ACTIVE QUESTION CARD: WITH REAL LIQUID WAVE TANK FILL */}
                <div className={`relative overflow-hidden rounded-3xl p-8 sm:p-14 text-center border-2 transition-all duration-300 shadow-sm ${
                  calSelected === '__TIMEOUT__'
                    ? 'border-red-400 bg-red-50/40 animate-shake ring-2 ring-red-400/40'
                    : calSelected === currentCal.correctDay
                    ? 'border-emerald-400 bg-emerald-50/20'
                    : isCalUrgent
                    ? 'border-red-300 ring-2 ring-red-400/50 shadow-[0_0_25px_rgba(239,68,68,0.2)] bg-white'
                    : 'border-blue-200/90 bg-white'
                }`}>
                  {/* Real Liquid Wave Fill */}
                  <RealLiquidWaveFill
                    fillPct={calFillPct}
                    remaining={calRemaining}
                    elapsed={calElapsed}
                    limit={timerLimit}
                    running={calTimerRunning}
                    paused={calPaused}
                    isUrgent={isCalUrgent}
                    isWarning={isCalWarning}
                    isAnswered={calSelected !== null}
                    isTimeout={calSelected === '__TIMEOUT__'}
                    theme="blue"
                    lang={lang}
                  />

                  {/* Paused Overlay */}
                  {calPaused && (
                    <div className="absolute inset-0 z-30 bg-slate-900/40 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center gap-3 animate-fadeIn">
                      <div className="px-4 py-2 rounded-2xl bg-white shadow-lg flex items-center gap-2 text-slate-800 font-bold text-sm">
                        <span className="material-symbols-outlined text-amber-500 text-[22px]">pause_circle</span>
                        <span style={textFont}>{t.gamePaused}</span>
                      </div>
                      <button
                        onClick={toggleCalPause}
                        className="px-5 py-2.5 rounded-full bg-secondary text-white font-bold text-xs shadow-md hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer"
                        style={textFont}
                      >
                        <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                        <span>{t.resume}</span>
                      </button>
                    </div>
                  )}

                  <div className="relative z-10">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2" style={textFont}>
                      {t.questionPromptCal}
                    </span>
                    <div className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight my-3 font-['Poppins']">
                      {lang === 'mr' ? currentCal.dateStrMr : currentCal.dateStrEn}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium" style={textFont}>
                      {lang === 'mr' ? currentCal.significanceMr : currentCal.significanceEn}
                    </p>
                  </div>
                </div>

                {/* 4 Day Option Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {currentCal.options.map((dayKey) => {
                    const dayLabel = lang === 'mr' ? DAYS_TRANSLATION[dayKey].mr : DAYS_TRANSLATION[dayKey].en;
                    let btnStyle = 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 hover:border-secondary';
                    if (calSelected) {
                      if (dayKey === currentCal.correctDay) {
                        btnStyle = 'bg-emerald-500 text-white border-emerald-600 font-extrabold shadow-md scale-102 ring-4 ring-emerald-100';
                      } else if (dayKey === calSelected) {
                        btnStyle = 'bg-red-500 text-white border-red-600 font-bold';
                      } else {
                        btnStyle = 'bg-slate-50 text-slate-400 border-slate-200 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={dayKey}
                        onClick={() => handleCalAnswer(dayKey)}
                        disabled={calSelected !== null || calPaused}
                        className={`py-4 px-3 rounded-2xl border text-sm sm:text-base font-bold transition-all cursor-pointer shadow-xs ${btnStyle} ${
                          calPaused ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        style={textFont}
                      >
                        {dayLabel}
                      </button>
                    );
                  })}
                </div>

                {/* Result Banner (No Auto-Advance, Full User Control) */}
                {calSelected && (
                  <div className="mt-6 space-y-4 pt-4 border-t border-slate-200 animate-fadeIn">
                    {(() => {
                      const correctLabel = lang === 'mr' ? DAYS_TRANSLATION[currentCal.correctDay].mr : DAYS_TRANSLATION[currentCal.correctDay].en;
                      const isCorrect = calSelected === currentCal.correctDay;
                      return (
                        <div className={`p-4 rounded-2xl border flex items-center justify-between flex-wrap gap-3 ${
                          isCorrect
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                            : 'bg-red-50 border-red-200 text-red-950 animate-shake'
                        }`}>
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[24px]">
                              {isCorrect ? 'check_circle' : 'cancel'}
                            </span>
                            <div>
                              <span className="text-sm font-bold block" style={textFont}>
                                {calSelected === '__TIMEOUT__'
                                  ? (lang === 'mr' ? `वेळ संपली! अचूक वार "${correctLabel}" होता.` : `Time Expired! The correct day was "${correctLabel}".`)
                                  : isCorrect
                                  ? t.correctCal(calElapsed.toFixed(2))
                                  : t.wrongCal(correctLabel)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={nextCalQuestion}
                              className="px-5 py-2.5 rounded-full bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                              style={textFont}
                            >
                              <span>{t.nextDate}</span>
                              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                            </button>
                            <button
                              onClick={restartCalGame}
                              className="px-4 py-2.5 rounded-full bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                              style={textFont}
                            >
                              <span className="material-symbols-outlined text-[16px]">replay</span>
                              <span>{t.tryAgain}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Star Rating */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200">
                      <StarRating
                        stars={calSelected === currentCal.correctDay ? getTimeStars(calElapsed, timerLimit) : 0}
                        label={t.starsLabel}
                      />
                    </div>
                  </div>
                )}

                {/* Course CTA */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 sm:p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-sky-200" style={textFont}>
                      {t.wantToLearn}
                    </span>
                    <h4 className="text-base sm:text-lg font-bold mt-0.5" style={textFont}>
                      {lang === 'mr' ? 'MM-04: सुपरफास्ट कॅलेंडर तंत्रज्ञान' : 'MM-04: Superfast Calendar Technique'}
                    </h4>
                    <p className="text-xs text-sky-100 mt-1" style={textFont}>
                      {lang === 'mr' ? 'फक्त २ तासांच्या कार्यशाळेत कोणत्याही तारखेचा वार सेकंदात सांगायला शिका.' : 'Learn to compute the day of any date in 2 seconds in a dedicated workshop.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href="https://wa.me/918459344077?text=Hello%20Prashant%20Sir%2C%20I%20played%20the%20Calendar%20Game%20and%20want%20to%20learn%20MM-04%20course."
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">chat</span>
                      <span style={textFont}>{t.askWhatsApp}</span>
                    </a>
                    <Link
                      to="/contact"
                      className="px-4 py-2.5 rounded-full bg-white hover:bg-sky-50 text-secondary font-bold text-xs shadow-sm transition-all"
                      style={textFont}
                    >
                      {t.bookDemo}
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* GAME 2: VEDIC LIGHTNING MATH (MM-05) */}
        {/* ============================================================ */}
        {activeTab === 'vedic' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 animate-fadeIn">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider" style={textFont}>
                  {t.courseVedicBadge}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5" style={textFont}>
                  {t.courseVedicTitle}
                </h3>
              </div>

              {vedicStarted && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={restartVedicGame}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200 shadow-2xs"
                    style={textFont}
                  >
                    <span className="material-symbols-outlined text-[16px]">replay</span>
                    <span>{t.restart}</span>
                  </button>

                  <button
                    onClick={toggleVedicPause}
                    disabled={vedicSelected !== null}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                      vedicPaused
                        ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200 animate-pulse'
                        : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'
                    } ${vedicSelected !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={textFont}
                  >
                    <span className="material-symbols-outlined text-[16px]">{vedicPaused ? 'play_arrow' : 'pause'}</span>
                    <span>{vedicPaused ? t.resume : t.pause}</span>
                  </button>

                  <span className="px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800 flex items-center gap-1.5 font-['Poppins']">
                    <span className="material-symbols-outlined text-[16px]">timer</span>
                    <span>{t.timeLimit} {timerLimit}s</span>
                  </span>
                </div>
              )}
            </div>

            {/* PRE-GAME WELCOME SCREEN */}
            {!vedicStarted ? (
              <div className="relative overflow-hidden rounded-3xl p-8 sm:p-14 text-center border-2 border-amber-200/80 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/50 shadow-sm space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold">
                  <span className="material-symbols-outlined text-[16px]">bolt</span>
                  <span style={textFont}>{lang === 'mr' ? '१० सेकंद वैदिक चॅलेंज' : '10s Vedic Challenge'}</span>
                </div>

                <div>
                  <h4 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight" style={textFont}>
                    {lang === 'mr' ? 'वैदिक गणित स्पीड चॅलेंज' : 'Vedic Math Speed Challenge'}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto mt-2" style={textFont}>
                    {lang === 'mr'
                      ? 'कागद-पेन न वापरता मनात १ सेकंदात उत्तर द्या! वैदिक सूत्रांनी कॅल्क्युलेटरपेक्षा वेगाने सोडवा.'
                      : 'Calculate in seconds without pen and paper! Outpace the calculator with Vedic mental sutras.'}
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-2.5 text-xs text-slate-700 font-bold">
                  <span className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-1.5" style={textFont}>
                    <span className="material-symbols-outlined text-[16px] text-amber-600">timer</span>
                    <span>{lang === 'mr' ? '१० सेकंद मर्यादा' : '10s Time Limit'}</span>
                  </span>
                  <span className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-1.5" style={textFont}>
                    <span className="material-symbols-outlined text-[16px] text-amber-600">speed</span>
                    <span>{lang === 'mr' ? '४००% वेगवान गणना' : '400% Speed Boost'}</span>
                  </span>
                  <span className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-1.5" style={textFont}>
                    <span className="material-symbols-outlined text-[16px] text-amber-600">functions</span>
                    <span>{lang === 'mr' ? 'एकाधिकेन पूर्वेण सूत्र' : 'Ekadhikena Purvena'}</span>
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    onClick={startVedicGame}
                    className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700 hover:from-amber-500 hover:to-orange-500 text-white font-black text-base sm:text-lg shadow-xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2.5 mx-auto ring-4 ring-amber-100"
                    style={textFont}
                  >
                    <span className="material-symbols-outlined text-[24px]">play_arrow</span>
                    <span>{t.startChallenge}</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* ACTIVE PROBLEM CARD: WITH REAL LIQUID WAVE TANK FILL */}
                <div className={`relative overflow-hidden rounded-3xl p-8 sm:p-14 text-center border-2 transition-all duration-300 shadow-sm ${
                  vedicSelected === -999
                    ? 'border-red-400 bg-red-50/40 animate-shake ring-2 ring-red-400/40'
                    : vedicSelected === currentVedic.answer
                    ? 'border-emerald-400 bg-emerald-50/20'
                    : isVedicUrgent
                    ? 'border-red-300 ring-2 ring-red-400/50 shadow-[0_0_25px_rgba(239,68,68,0.2)] bg-white'
                    : 'border-amber-200/90 bg-white'
                }`}>
                  {/* Real Liquid Wave Fill */}
                  <RealLiquidWaveFill
                    fillPct={vedicFillPct}
                    remaining={vedicRemaining}
                    elapsed={vedicElapsed}
                    limit={timerLimit}
                    running={vedicTimerRunning}
                    paused={vedicPaused}
                    isUrgent={isVedicUrgent}
                    isWarning={isVedicWarning}
                    isAnswered={vedicSelected !== null}
                    isTimeout={vedicSelected === -999}
                    theme="amber"
                    lang={lang}
                  />

                  {/* Paused Overlay */}
                  {vedicPaused && (
                    <div className="absolute inset-0 z-30 bg-slate-900/40 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center gap-3 animate-fadeIn">
                      <div className="px-4 py-2 rounded-2xl bg-white shadow-lg flex items-center gap-2 text-slate-800 font-bold text-sm">
                        <span className="material-symbols-outlined text-amber-500 text-[22px]">pause_circle</span>
                        <span style={textFont}>{t.gamePaused}</span>
                      </div>
                      <button
                        onClick={toggleVedicPause}
                        className="px-5 py-2.5 rounded-full bg-amber-600 text-white font-bold text-xs shadow-md hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer"
                        style={textFont}
                      >
                        <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                        <span>{t.resume}</span>
                      </button>
                    </div>
                  )}

                  <div className="relative z-10">
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-widest block mb-2" style={textFont}>
                      {lang === 'mr' ? currentVedic.titleMr : currentVedic.titleEn}
                    </span>
                    <div className="text-4xl sm:text-7xl font-black text-slate-900 tracking-tight my-3 font-['Poppins']">
                      {currentVedic.problem} = ?
                    </div>
                    <p className="text-xs text-slate-500 font-medium" style={textFont}>
                      {lang === 'mr' ? currentVedic.sutraNameMr : currentVedic.sutraNameEn}
                    </p>
                  </div>
                </div>

                {/* 4 Numeric Option Buttons (Clean Poppins Digits) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {currentVedic.options.map((ans) => {
                    let btnStyle = 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 hover:border-amber-500';
                    if (vedicSelected !== null) {
                      if (ans === currentVedic.answer) {
                        btnStyle = 'bg-emerald-500 text-white border-emerald-600 font-extrabold shadow-md scale-102 ring-4 ring-emerald-100';
                      } else if (ans === vedicSelected) {
                        btnStyle = 'bg-red-500 text-white border-red-600 font-bold';
                      } else {
                        btnStyle = 'bg-slate-50 text-slate-400 border-slate-200 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={ans}
                        onClick={() => handleVedicAnswer(ans)}
                        disabled={vedicSelected !== null || vedicPaused}
                        className={`py-4 px-3 rounded-2xl border text-base sm:text-xl font-bold font-['Poppins'] transition-all cursor-pointer shadow-xs ${btnStyle} ${
                          vedicPaused ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {ans}
                      </button>
                    );
                  })}
                </div>

                {/* Result Banner (No Auto-Advance) */}
                {vedicSelected !== null && (
                  <div className="mt-6 space-y-4 pt-4 border-t border-slate-200 animate-fadeIn">
                    <div className={`p-4 rounded-2xl border flex items-center justify-between flex-wrap gap-3 ${
                      vedicSelected === currentVedic.answer
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                        : 'bg-red-50 border-red-200 text-red-950 animate-shake'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[24px]">
                          {vedicSelected === currentVedic.answer ? 'check_circle' : 'cancel'}
                        </span>
                        <div>
                          <span className="text-sm font-bold block" style={textFont}>
                            {vedicSelected === -999
                              ? (lang === 'mr' ? `वेळ संपली! योग्य उत्तर "${currentVedic.answer}" होते.` : `Time Expired! The correct answer was "${currentVedic.answer}".`)
                              : vedicSelected === currentVedic.answer
                              ? t.correctVedic(vedicElapsed.toFixed(2))
                              : t.wrongVedic(String(currentVedic.answer))}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={nextVedicQuestion}
                          className="px-5 py-2.5 rounded-full bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                          style={textFont}
                        >
                          <span>{t.nextMath}</span>
                          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        </button>
                        <button
                          onClick={restartVedicGame}
                          className="px-4 py-2.5 rounded-full bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                          style={textFont}
                        >
                          <span className="material-symbols-outlined text-[16px]">replay</span>
                          <span>{t.tryAgain}</span>
                        </button>
                      </div>
                    </div>

                    {/* Star Rating */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200">
                      <StarRating
                        stars={vedicSelected === currentVedic.answer ? getTimeStars(vedicElapsed, timerLimit) : 0}
                        label={t.starsLabel}
                      />
                    </div>
                  </div>
                )}

                {/* Course CTA */}
                <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 rounded-2xl p-5 sm:p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-200" style={textFont}>
                      {t.wantToLearn}
                    </span>
                    <h4 className="text-base sm:text-lg font-bold mt-0.5" style={textFont}>
                      {lang === 'mr' ? 'MM-05: वैदिक मॅथेमॅटिक्स फाउंडेशन' : 'MM-05: Vedic Mathematics Foundation'}
                    </h4>
                    <p className="text-xs text-amber-100 mt-1" style={textFont}>
                      {lang === 'mr' ? 'पोलीस भरती, MPSC, स्कॉलरशिप गणितात ४००% वेग वाढवा.' : 'Boost your computation velocity by 400% for competitive examinations.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href="https://wa.me/918459344077?text=Hello%20Prashant%20Sir%2C%20I%20want%20to%20learn%20MM-05%20Vedic%20Maths."
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">chat</span>
                      <span style={textFont}>{t.askWhatsApp}</span>
                    </a>
                    <Link
                      to="/contact"
                      className="px-4 py-2.5 rounded-full bg-white hover:bg-amber-50 text-slate-900 font-bold text-xs shadow-sm transition-all"
                      style={textFont}
                    >
                      {t.contactNow}
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* GAME 3: VISUAL MEMORY FLASH RECALL (MM-01 & MM-03) */}
        {/* ============================================================ */}
        {activeTab === 'memory' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-secondary uppercase tracking-wider" style={textFont}>
                  {t.courseMemBadge}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5" style={textFont}>
                  {t.courseMemTitle}
                </h3>
              </div>

              {memStarted && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={restartMemoryGame}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200 shadow-2xs"
                    style={textFont}
                  >
                    <span className="material-symbols-outlined text-[16px]">replay</span>
                    <span>{t.restart}</span>
                  </button>

                  {memState === 'memorize' && (
                    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-secondary text-xs font-bold animate-pulse font-['Poppins']">
                      <span className="material-symbols-outlined text-[18px]">timer</span>
                      <span>{t.memorizeTimer(memCountdown)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* PRE-GAME WELCOME SCREEN */}
            {!memStarted ? (
              <div className="relative overflow-hidden rounded-3xl p-8 sm:p-14 text-center border-2 border-indigo-200/80 bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/50 shadow-sm space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-900 text-xs font-bold">
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  <span style={textFont}>{lang === 'mr' ? '५ सेकंद व्हिज्युअल फ्लॅश' : '5s Visual Flash Assessment'}</span>
                </div>

                <div>
                  <h4 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight" style={textFont}>
                    {lang === 'mr' ? 'व्हिज्युअल मेमरी फ्लॅश चॅलेंज' : 'Visual Memory Flash Challenge'}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto mt-2" style={textFont}>
                    {lang === 'mr'
                      ? 'स्क्रीनवर ६ घटक फक्त ५ सेकंदांसाठी दाखवले जातील. प्रत्येक घटकाचा क्रमांक नीट लक्षात ठेवा. त्यानंतर कार्ड्स उलटी होतील आणि विचारलेल्या क्रमांकाचे कार्ड ओळखायचे आहे!'
                      : 'Six item cards will be visible for 5 seconds. Memorize each item with its slot number. The cards will flip and you will recall the target slot!'}
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-2.5 text-xs text-slate-700 font-bold">
                  <span className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-1.5" style={textFont}>
                    <span className="material-symbols-outlined text-[16px] text-indigo-600">timer</span>
                    <span>{lang === 'mr' ? '५ सेकंद स्मरण वेळ' : '5s Memorize Interval'}</span>
                  </span>
                  <span className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-1.5" style={textFont}>
                    <span className="material-symbols-outlined text-[16px] text-indigo-600">grid_view</span>
                    <span>{lang === 'mr' ? '६ स्मरण कार्डे' : '6 Index Cards'}</span>
                  </span>
                  <span className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-1.5" style={textFont}>
                    <span className="material-symbols-outlined text-[16px] text-indigo-600">military_tech</span>
                    <span>{lang === 'mr' ? 'पोलीस भरती मेमरी सूत्रे' : 'Police Bharti Memory Pegs'}</span>
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    onClick={startMemoryGame}
                    className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-base sm:text-lg shadow-xl shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2.5 mx-auto ring-4 ring-indigo-100"
                    style={textFont}
                  >
                    <span className="material-symbols-outlined text-[24px]">play_arrow</span>
                    <span>{t.startMemory}</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* 1. MEMORIZE PHASE */}
                {memState === 'memorize' && (
                  <div className="space-y-6">
                    <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-center">
                      <p className="text-xs sm:text-sm text-slate-700 font-bold" style={textFont}>
                        {t.memInstruct}
                      </p>
                    </div>

                    {/* 6 Visible Memory Items */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                      {MEMORY_ITEMS_POOL.map((item, idx) => (
                        <div
                          key={item.id}
                          className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/90 to-indigo-50/60 border border-blue-200/80 flex items-start gap-3 shadow-xs transition-all hover:scale-102"
                        >
                          <div className="w-9 h-9 rounded-xl bg-secondary text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs font-['Poppins']">
                            #{idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-secondary text-[18px]">{item.icon}</span>
                              <p className="font-bold text-slate-900 text-xs sm:text-sm" style={textFont}>
                                {lang === 'mr' ? item.titleMr : item.titleEn}
                              </p>
                            </div>
                            <p className="text-[11px] text-slate-600 line-clamp-2 mt-1" style={textFont}>
                              {lang === 'mr' ? item.factMr : item.factEn}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Fast Skip to Recall Button */}
                    <div className="text-center pt-2">
                      <button
                        onClick={skipToRecall}
                        className="px-6 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer inline-flex items-center gap-2 hover:scale-105"
                        style={textFont}
                      >
                        <span className="material-symbols-outlined text-[18px]">check</span>
                        <span>{t.iMemorized}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. RECALL PHASE */}
                {memState === 'recall' && (
                  <div className="space-y-6 text-center py-2">
                    {/* Flipped Mystery Cards */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 max-w-2xl mx-auto">
                      {[1, 2, 3, 4, 5, 6].map((num) => {
                        const isTarget = num === memQuestionPos;
                        return (
                          <div
                            key={num}
                            className={`p-3 rounded-2xl border-2 text-center transition-all ${
                              isTarget
                                ? 'bg-amber-100 border-amber-400 text-amber-900 shadow-md ring-4 ring-amber-200 scale-105 animate-pulse'
                                : 'bg-slate-100 border-slate-200 text-slate-400'
                            }`}
                          >
                            <span className="text-xs font-black block font-['Poppins']">#{num}</span>
                            <span className="material-symbols-outlined text-2xl my-1">
                              {isTarget ? 'help' : 'lock'}
                            </span>
                            <span className="text-[10px] font-bold block" style={textFont}>
                              {isTarget ? (lang === 'mr' ? 'हे ओळखा' : 'Target') : '?'}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Question Prompt */}
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 inline-block max-w-md shadow-xs">
                      <span className="text-xs font-bold text-amber-900 uppercase tracking-wide" style={textFont}>
                        {lang === 'mr' ? 'प्रश्न — अचूक कार्ड निवडा:' : 'Question — Recall the Card:'}
                      </span>
                      <p className="text-lg sm:text-2xl font-black text-slate-900 mt-1" style={textFont}>
                        {t.memQuestion(memQuestionPos)}
                      </p>
                    </div>

                    {/* 6 Choice Buttons */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
                      {MEMORY_ITEMS_POOL.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleMemoryPick(item.id)}
                          className="p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-secondary transition-all shadow-xs cursor-pointer flex items-center gap-3 group hover:scale-102"
                        >
                          <span className="material-symbols-outlined text-secondary text-[24px] group-hover:scale-110 transition-transform shrink-0">
                            {item.icon}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 text-xs sm:text-sm block" style={textFont}>
                              {lang === 'mr' ? item.titleMr : item.titleEn}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. RESULT PHASE */}
                {memState === 'result' && (
                  <div className="space-y-4 animate-fadeIn">
                    {(() => {
                      const correctItem = MEMORY_ITEMS_POOL[memQuestionPos - 1];
                      const correctTitle = lang === 'mr' ? correctItem.titleMr : correctItem.titleEn;
                      const isWon = memSelectedCard === correctItem.id;
                      return (
                        <>
                          <div className={`p-4 rounded-2xl border flex items-center justify-between flex-wrap gap-3 ${
                            isWon ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-red-50 border-red-200 text-red-950 animate-shake'
                          }`}>
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[24px]">
                                {isWon ? 'check_circle' : 'cancel'}
                              </span>
                              <span className="text-sm font-bold" style={textFont}>
                                {isWon
                                  ? t.memCorrect(memQuestionPos, correctTitle)
                                  : t.memWrong(memQuestionPos, correctTitle)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                onClick={startMemoryGame}
                                className="px-5 py-2.5 rounded-full bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                                style={textFont}
                              >
                                <span>{t.playAgain}</span>
                                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                              </button>
                              <button
                                onClick={restartMemoryGame}
                                className="px-4 py-2.5 rounded-full bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                                style={textFont}
                              >
                                <span className="material-symbols-outlined text-[16px]">replay</span>
                                <span>{t.tryAgain}</span>
                              </button>
                            </div>
                          </div>

                          {/* Star Rating */}
                          <div className="bg-slate-50 rounded-2xl border border-slate-200">
                            <StarRating stars={isWon ? 5 : 1} label={t.starsLabel} />
                          </div>

                          {/* Course CTA */}
                          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 sm:p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
                            <div>
                              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-200" style={textFont}>
                                {t.wantToLearn}
                              </span>
                              <h4 className="text-base sm:text-lg font-bold mt-0.5" style={textFont}>
                                {lang === 'mr' ? 'MM-03: पोलीस भरती १००% लेखी परीक्षा तयारी' : 'MM-03: Police Bharti 100% Written Test Preparation'}
                              </h4>
                              <p className="text-xs text-sky-100 mt-1" style={textFont}>
                                {lang === 'mr' ? 'प्रशांत सरांच्या मार्गदर्शनाखाली आकाश मोरे सरांसारखे १००/१०० गुण मिळवा.' : "Score 100/100 in Police Bharti Written Test under Prashant Sir's guidance."}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <a
                                href="https://wa.me/918459344077?text=Hello%20Prashant%20Sir%2C%20I%20want%20information%20about%20Police%20Bharti%20Memory%20Course."
                                target="_blank"
                                rel="noreferrer"
                                className="px-4 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
                              >
                                <span className="material-symbols-outlined text-[16px]">chat</span>
                                <span style={textFont}>{t.askWhatsApp}</span>
                              </a>
                              <Link
                                to="/contact"
                                className="px-4 py-2.5 rounded-full bg-white hover:bg-sky-50 text-secondary font-bold text-xs shadow-sm transition-all"
                                style={textFont}
                              >
                                {t.contactNow}
                              </Link>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* GAME 4: NEURO AGILITY / STROOP EFFECT */}
        {/* ============================================================ */}
        {activeTab === 'neuro' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider" style={textFont}>
                  {t.courseStroopBadge}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5" style={textFont}>
                  {t.courseStroopTitle}
                </h3>
              </div>

              {stroopStarted ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={restartStroopGame}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200 shadow-2xs"
                    style={textFont}
                  >
                    <span className="material-symbols-outlined text-[16px]">replay</span>
                    <span>{t.restart}</span>
                  </button>

                  <button
                    onClick={toggleStroopPause}
                    disabled={stroopResult !== null}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                      stroopPaused
                        ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200 animate-pulse'
                        : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'
                    } ${stroopResult !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={textFont}
                  >
                    <span className="material-symbols-outlined text-[16px]">{stroopPaused ? 'play_arrow' : 'pause'}</span>
                    <span>{stroopPaused ? t.resume : t.pause}</span>
                  </button>

                  <span className="px-3 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 text-xs font-bold text-cyan-800 flex items-center gap-1.5 font-['Poppins']">
                    <span className="material-symbols-outlined text-[16px]">timer</span>
                    <span>{t.timeLimit} {timerLimit}s</span>
                  </span>
                </div>
              ) : (
                <div className="text-xs text-slate-500 font-medium" style={textFont}>
                  {t.stroopRule}
                </div>
              )}
            </div>

            {/* PRE-GAME WELCOME SCREEN */}
            {!stroopStarted ? (
              <div className="relative overflow-hidden rounded-3xl p-8 sm:p-14 text-center border-2 border-slate-700 bg-slate-950 text-white shadow-xl space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-bold">
                  <span className="material-symbols-outlined text-[16px]">speed</span>
                  <span style={textFont}>{lang === 'mr' ? '१० सेकंद न्यूरो रिफ्लेक्स' : '10s Neuro Reflex Challenge'}</span>
                </div>

                <div>
                  <h4 className="text-2xl sm:text-4xl font-black text-white tracking-tight" style={textFont}>
                    {lang === 'mr' ? 'न्यूरो रिफ्लेक्स चॅलेंज' : 'Neuro Reflex Challenge'}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto mt-2" style={textFont}>
                    {lang === 'mr'
                      ? 'नियम: शब्द वाचू नका — केवळ शब्दाचा शाईचा रंग ओळखून १० सेकंदांत अचूक बटण निवडा!'
                      : 'Rule: Do NOT read the text! Identify the actual INK COLOR and click the matching button within 10 seconds!'}
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-2.5 text-xs text-slate-200 font-bold">
                  <span className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 shadow-2xs flex items-center gap-1.5" style={textFont}>
                    <span className="material-symbols-outlined text-[16px] text-cyan-400">psychology_alt</span>
                    <span>{lang === 'mr' ? 'संज्ञानात्मक संघर्ष' : 'Cognitive Agility'}</span>
                  </span>
                  <span className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 shadow-2xs flex items-center gap-1.5" style={textFont}>
                    <span className="material-symbols-outlined text-[16px] text-cyan-400">timer</span>
                    <span>{lang === 'mr' ? '१० सेकंद मर्यादा' : '10s Time Limit'}</span>
                  </span>
                  <span className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 shadow-2xs flex items-center gap-1.5" style={textFont}>
                    <span className="material-symbols-outlined text-[16px] text-cyan-400">palette</span>
                    <span>{lang === 'mr' ? '५ रंग पर्याय' : '5 Color Swatches'}</span>
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    onClick={startStroopGame}
                    className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-base sm:text-lg shadow-xl shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2.5 mx-auto ring-4 ring-cyan-500/30"
                    style={textFont}
                  >
                    <span className="material-symbols-outlined text-[24px]">play_arrow</span>
                    <span>{t.startChallenge}</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* ACTIVE CHALLENGE CARD: WITH REAL LIQUID WAVE TANK FILL */}
                <div className={`relative overflow-hidden rounded-3xl p-8 sm:p-14 text-center border-2 transition-all duration-300 shadow-xl ${
                  stroopResult === 'timeout' || stroopResult === 'wrong'
                    ? 'border-red-500 bg-slate-900 animate-shake ring-2 ring-red-500/40'
                    : stroopResult === 'correct'
                    ? 'border-emerald-500 bg-slate-900'
                    : isStroopUrgent
                    ? 'border-red-400 ring-2 ring-red-400/50 shadow-[0_0_25px_rgba(239,68,68,0.3)] bg-slate-900'
                    : 'border-slate-700 bg-slate-900'
                }`}>
                  {/* Real Liquid Wave Fill */}
                  <RealLiquidWaveFill
                    fillPct={stroopFillPct}
                    remaining={stroopRemaining}
                    elapsed={stroopElapsed}
                    limit={timerLimit}
                    running={stroopTimerRunning}
                    paused={stroopPaused}
                    isUrgent={isStroopUrgent}
                    isWarning={isStroopWarning}
                    isAnswered={stroopResult !== null}
                    isTimeout={stroopResult === 'timeout'}
                    theme="cyan"
                    lang={lang}
                  />

                  {/* Paused Overlay */}
                  {stroopPaused && (
                    <div className="absolute inset-0 z-30 bg-slate-950/70 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center gap-3 animate-fadeIn">
                      <div className="px-4 py-2 rounded-2xl bg-slate-900 border border-slate-700 shadow-lg flex items-center gap-2 text-white font-bold text-sm">
                        <span className="material-symbols-outlined text-amber-400 text-[22px]">pause_circle</span>
                        <span style={textFont}>{t.gamePaused}</span>
                      </div>
                      <button
                        onClick={toggleStroopPause}
                        className="px-5 py-2.5 rounded-full bg-cyan-500 text-slate-950 font-bold text-xs shadow-md hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer"
                        style={textFont}
                      >
                        <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                        <span>{t.resume}</span>
                      </button>
                    </div>
                  )}

                  <div className="relative z-10">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2" style={textFont}>
                      {t.questionPromptStroop}
                    </span>
                    <div
                      className="text-5xl sm:text-7xl font-black tracking-wider transition-all transform scale-105 select-none my-3 drop-shadow-md"
                      style={{ color: stroopChallenge.colorHex, ...textFont }}
                    >
                      {lang === 'mr' ? stroopChallenge.wordMr : stroopChallenge.wordEn}
                    </div>
                  </div>
                </div>

                {/* 5 Color Buttons (Clean Circular Swatches, No Emojis) */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {STROOP_COLORS.map((c) => {
                    const label = lang === 'mr' ? c.nameMr : c.nameEn;
                    let btnStyle = 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200';
                    if (stroopResult !== null) {
                      if (c.id === stroopChallenge.colorId) {
                        btnStyle = 'bg-emerald-500 text-white border-emerald-600 font-extrabold shadow-md scale-102';
                      } else {
                        btnStyle = 'bg-slate-50 text-slate-400 border-slate-200 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={c.id}
                        onClick={() => handleStroopAnswer(c.id)}
                        disabled={stroopResult !== null || stroopPaused}
                        className={`py-3.5 px-3 rounded-2xl border text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2 ${btnStyle} ${
                          stroopPaused ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        style={textFont}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs shrink-0"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Result Banner (No Auto-Advance) */}
                {stroopResult !== null && (
                  <div className="mt-6 space-y-4 pt-4 border-t border-slate-200 animate-fadeIn">
                    {(() => {
                      const correctColorObj = STROOP_COLORS.find(c => c.id === stroopChallenge.colorId);
                      const correctColorName = correctColorObj ? (lang === 'mr' ? correctColorObj.nameMr : correctColorObj.nameEn) : '';
                      return (
                        <div className={`p-4 rounded-2xl border flex items-center justify-between flex-wrap gap-3 ${
                          stroopResult === 'correct'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                            : 'bg-red-50 border-red-200 text-red-950 animate-shake'
                        }`}>
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[24px]">
                              {stroopResult === 'correct' ? 'check_circle' : 'cancel'}
                            </span>
                            <div>
                              <span className="text-sm font-bold block" style={textFont}>
                                {stroopResult === 'timeout'
                                  ? (lang === 'mr' ? `वेळ संपली! शाईचा खरा रंग "${correctColorName}" होता.` : `Time Expired! The ink color was "${correctColorName}".`)
                                  : stroopResult === 'correct'
                                  ? t.stroopCorrect((stroopReactionTime || 0).toFixed(2))
                                  : t.stroopWrong(correctColorName)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={nextStroopQuestion}
                              className="px-5 py-2.5 rounded-full bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                              style={textFont}
                            >
                              <span>{t.nextReflex}</span>
                              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                            </button>
                            <button
                              onClick={restartStroopGame}
                              className="px-4 py-2.5 rounded-full bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                              style={textFont}
                            >
                              <span className="material-symbols-outlined text-[16px]">replay</span>
                              <span>{t.tryAgain}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Star Rating */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200">
                      <StarRating
                        stars={stroopResult === 'correct' ? getTimeStars((stroopReactionTime || 99), timerLimit) : 0}
                        label={t.starsLabel}
                      />
                    </div>
                  </div>
                )}

                {/* Course CTA */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 sm:p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-sky-200" style={textFont}>
                      {t.wantToLearn}
                    </span>
                    <h4 className="text-base sm:text-lg font-bold mt-0.5" style={textFont}>
                      {lang === 'mr' ? 'MM-01: फोकस आणि न्यूरो ॲजिलिटी तंत्र' : 'MM-01: Executive Focus & Memory Architecture'}
                    </h4>
                    <p className="text-xs text-sky-100 mt-1" style={textFont}>
                      {lang === 'mr' ? 'अभ्यासातील विचलितता घालवा आणि परीक्षेतील निगेटिव्ह मार्किंग टाळा.' : 'Eliminate cognitive distraction and eliminate negative marking in exams.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href="https://wa.me/918459344077?text=Hello%20Prashant%20Sir%2C%20I%20want%20to%20learn%20Focus%20and%20Memory%20Techniques."
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">chat</span>
                      <span style={textFont}>{t.askWhatsApp}</span>
                    </a>
                    <Link
                      to="/contact"
                      className="px-4 py-2.5 rounded-full bg-white hover:bg-sky-50 text-secondary font-bold text-xs shadow-sm transition-all"
                      style={textFont}
                    >
                      {t.contactNow}
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* STATS DASHBOARD (CLEAN & PROFESSIONAL, NO EMOJIS) */}
        {/* ============================================================ */}
        {activeTab === 'stats' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 animate-fadeIn">
            <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider" style={textFont}>
                  {lang === 'mr' ? 'वैयक्तिक प्रगती' : 'Performance Analytics'}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5" style={textFont}>
                  {lang === 'mr' ? 'तुमची कामगिरी — प्रगती अहवाल' : 'Your Assessment Summary'}
                </h3>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: lang === 'mr' ? 'एकूण XP' : 'Total XP', value: String(xp), icon: 'bolt', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { label: lang === 'mr' ? 'अचूकता' : 'Accuracy', value: `${totalPlayed > 0 ? Math.round((totalCorrect / totalPlayed) * 100) : 0}%`, icon: 'task_alt', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: lang === 'mr' ? 'सर्वोत्तम स्ट्रीक' : 'Best Streak', value: String(bestStreak), icon: 'local_fire_department', color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: lang === 'mr' ? 'सर्वोत्तम वेळ' : 'Best Reaction Time', value: bestTime < 9999 ? `${bestTime.toFixed(2)}s` : '—', icon: 'timer', color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: lang === 'mr' ? 'एकूण प्रश्न' : 'Attempts', value: String(gameCount), icon: 'quiz', color: 'text-purple-600', bg: 'bg-purple-50' },
                { label: lang === 'mr' ? 'अचूक उत्तरे' : 'Verified Answers', value: String(totalCorrect), icon: 'check_circle', color: 'text-emerald-600', bg: 'bg-emerald-50' },
              ].map((s, i) => (
                <div key={i} className={`${s.bg} rounded-2xl p-4 border border-slate-100 text-center`}>
                  <span className="material-symbols-outlined text-2xl block mb-1 text-slate-700">{s.icon}</span>
                  <p className={`text-xl font-bold font-['Poppins'] ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5" style={textFont}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Reset Button */}
            <div className="flex justify-center pt-2">
              <button
                onClick={() => {
                  if (confirm(lang === 'mr' ? 'सर्व प्रगती रिसेट करायची का?' : 'Reset all session progress?')) {
                    setXP(0); setGameCount(0); setBestTime(9999); setStreak(0); setBestStreak(0);
                    try { localStorage.removeItem('mm_xp'); localStorage.removeItem('mm_gameCount'); localStorage.removeItem('mm_bestTime'); } catch { /* ok */ }
                  }
                }}
                className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border border-slate-200"
                style={textFont}
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                <span>{lang === 'mr' ? 'प्रोग्रेस रिसेट करा' : 'Reset Progress'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Global Bottom Consultation & Contact Banner */}
        <div className="mt-12 bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm text-center">
          <div className="w-12 h-12 rounded-2xl bg-secondary text-white flex items-center justify-center mx-auto mb-4 shadow-md">
            <span className="material-symbols-outlined text-2xl">school</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight" style={textFont}>
            {t.ctaTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto mt-2 leading-relaxed" style={textFont}>
            {t.ctaDesc}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <Link
              to="/contact"
              className="px-6 py-3.5 rounded-full bg-secondary text-white font-bold text-xs sm:text-sm hover:bg-secondary-container transition-all shadow-md flex items-center gap-2"
              style={textFont}
            >
              <span>{t.ctaBtn}</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
            <a
              href="https://wa.me/918459344077?text=Hello%20Prashant%20Sir%2C%20I%20want%20to%20know%20more%20about%20your%20courses."
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 font-bold text-xs sm:text-sm transition-all shadow-2xs flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-emerald-600 text-[18px]">chat</span>
              <span>{t.whatsapp}</span>
            </a>
          </div>
        </div>

      </div>
    </main>
  );
};

export default BrainGames;
