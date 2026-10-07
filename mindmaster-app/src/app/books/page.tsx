"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  BookOpen, 
  Download, 
  Sparkles, 
  Search, 
  FileText, 
  CheckCircle2, 
  Clock, 
  X, 
  ZoomIn, 
  ZoomOut, 
  ArrowRight,
  ShieldCheck,
  Award
} from "lucide-react";
import AppShell from "@/components/navigation/AppShell";
import { MOCK_BOOKS } from "@/lib/mockData";
import { Book } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

type FilterType = "All" | "Memory" | "Vedic Maths" | "Police Bharti" | "Calendar";

const FILTER_OPTIONS: { label: string; value: FilterType }[] = [
  { label: "All Books", value: "All" },
  { label: "Memory Science", value: "Memory" },
  { label: "Vedic Maths", value: "Vedic Maths" },
  { label: "Calendar Mastery", value: "Calendar" },
  { label: "Police Bharti", value: "Police Bharti" },
];

export default function CourseBooksPage() {
  const [books, setBooks] = useState<Book[]>(MOCK_BOOKS);
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [readingBook, setReadingBook] = useState<Book | null>(null);
  const [pdfZoom, setPdfZoom] = useState<number>(100);

  // Load books from Supabase if available
  useEffect(() => {
    async function loadBooks() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("books")
          .select("id, course_id, title, file_path, pages, courses(title)");

        if (!error && data && data.length > 0) {
          const mapped: Book[] = data.map((b: any) => ({
            id: b.id,
            courseId: b.course_id,
            courseTitle: b.courses?.title || "Memory Science",
            title: b.title,
            filePath: b.file_path,
            pages: b.pages || 50,
            fileSizeMb: 12.0,
            coverImage: "/assets/images/student_mindmaps_notebook.png",
          }));
          setBooks(mapped);
        }
      } catch (err) {
        // Fallback to MOCK_BOOKS
      }
    }
    loadBooks();
  }, []);

  const filteredBooks = books.filter((book) => {
    const matchesFilter =
      activeFilter === "All" ||
      book.courseTitle.toLowerCase().includes(activeFilter.toLowerCase()) ||
      book.title.toLowerCase().includes(activeFilter.toLowerCase());

    const matchesSearch =
      !searchQuery.trim() ||
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.courseTitle.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <AppShell>
      <title>Official Course Books & PDF Library | MindMaster Academy</title>
      <meta
        name="description"
        content="Official curriculum handbooks, Vedic Maths workbooks, and Maharashtra Police Bharti question banks curated by Prashant Dhumal Sir."
      />
      <div className="flex flex-col gap-6 max-w-6xl mx-auto select-none">

        {/* Top Header Banner */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>ACADEMY LIBRARY • OFFICIAL E-BOOKS</span>
            </span>

            <span className="text-xs text-slate-500 font-semibold">
              {filteredBooks.length} Official Books Available
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Course Books & Study Material
          </h1>
          <p className="text-xs md:text-sm text-slate-600 max-w-2xl leading-relaxed">
            Download verified formula handbooks, solved practice drills, and speed mnemonics guides compiled for state board and recruitment exams.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {FILTER_OPTIONS.map((opt) => {
              const isActive = activeFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setActiveFilter(opt.value)}
                  className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all duration-200 border cursor-pointer ${
                    isActive
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/25"
                      : "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search books..."
              className="w-full pl-9 pr-3 py-2 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
            />
          </div>
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-lg hover:border-blue-300 transition-all flex flex-col sm:flex-row gap-5 items-start group"
            >
              {/* Cover Artwork */}
              <div className="relative w-full sm:w-32 h-44 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 group-hover:scale-102 transition-transform duration-300">
                <Image
                  src={book.coverImage}
                  alt={book.title}
                  fill
                  className="object-cover"
                />
                <span className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                  PDF
                </span>
              </div>

              {/* Book Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-between h-full w-full">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full inline-block mb-1.5 shadow-2xs">
                    {book.courseTitle}
                  </span>
                  <h3 className="font-extrabold text-sm md:text-base text-slate-900 leading-snug group-hover:text-blue-600 transition">
                    {book.title}
                  </h3>
                  
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-2 font-medium">
                    <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md font-semibold">
                      {book.pages} Pages
                    </span>
                    <span>•</span>
                    <span>{book.fileSizeMb} MB</span>
                    <span>•</span>
                    <span className="text-emerald-600 font-bold">Verified</span>
                  </div>
                </div>

                {/* Actions: Read PDF & Download */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setReadingBook(book)}
                    className="flex-1 py-2.5 px-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition inline-flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/25 cursor-pointer active:scale-95"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Read Online</span>
                  </button>

                  <a
                    href={book.filePath}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-full bg-slate-50 hover:bg-blue-50 text-blue-600 border border-slate-200 hover:border-blue-300 text-xs font-bold transition inline-flex items-center justify-center cursor-pointer shadow-2xs"
                    title="Download PDF"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ================= PDF VIEWER MODAL ================= */}
        {readingBook && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
              {/* Modal Header */}
              <div className="p-4 px-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-amber-300" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-sm truncate">
                      {readingBook.title}
                    </h3>
                    <span className="text-[11px] text-slate-300 block">
                      {readingBook.courseTitle} • {readingBook.pages} Pages
                    </span>
                  </div>
                </div>

                {/* Controls: Zoom, Download, Close */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPdfZoom((z) => Math.max(75, z - 15))}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] font-mono font-bold">{pdfZoom}%</span>
                  <button
                    onClick={() => setPdfZoom((z) => Math.min(150, z + 15))}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>

                  <a
                    href={readingBook.filePath}
                    download
                    className="ml-2 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Download</span>
                  </a>

                  <button
                    onClick={() => setReadingBook(null)}
                    className="ml-1 p-1.5 rounded-lg bg-white/10 hover:bg-red-500/80 transition cursor-pointer"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Body: PDF Viewer Preview */}
              <div className="flex-1 bg-slate-100 p-4 sm:p-6 overflow-auto flex flex-col items-center justify-center">
                <div
                  className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-3xl min-h-[550px] p-8 flex flex-col justify-between transition-all"
                  style={{ transform: `scale(${pdfZoom / 100})`, transformOrigin: "top center" }}
                >
                  {/* Document Header Page */}
                  <div className="text-center border-b pb-6 border-slate-100">
                    <div className="inline-block px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-extrabold mb-2">
                      MindMaster Academy • Official E-Book Material
                    </div>
                    <h1 className="text-xl md:text-2xl font-black text-slate-900 mt-1">
                      {readingBook.title}
                    </h1>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      Curated &amp; Certified by: International Memory Trainer Prashant Dhumal Sir
                    </p>
                  </div>

                  {/* Document Body Sample Content */}
                  <div className="my-6 space-y-4 text-xs text-slate-800 leading-relaxed">
                    <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                      <h4 className="font-extrabold text-sm text-blue-700 mb-1">
                        Chapter 1: Natural Laws of Human Memory
                      </h4>
                      <p className="text-slate-600">
                        The human brain retains concepts primarily through vivid 3D sensory images rather than abstract symbols. When you anchor formulas to emotional associations, recall in board examinations becomes effortless.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                      <h4 className="font-extrabold text-sm text-emerald-700 mb-1">
                        Chapter 2: Peg System &amp; Spatial Anchor Techniques
                      </h4>
                      <p className="text-slate-600">
                        Memorize long chronological lists and classification charts by converting numbers into visual pegs (1 = Sun, 2 = Shoe, 3 = Tree). Connect facts using dynamic narrative stories.
                      </p>
                    </div>
                  </div>

                  {/* Document Footer */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-semibold">
                    <span>Page 1 / {readingBook.pages}</span>
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Student Digital Copy
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
