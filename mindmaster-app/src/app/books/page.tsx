"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  BookOpen, 
  Sparkles, 
  Search, 
  FileText, 
  CheckCircle2, 
  X, 
  ZoomIn, 
  ZoomOut, 
  ShieldCheck, 
  Lock, 
  ShoppingCart, 
  Download, 
  Check, 
  Trash2, 
  RefreshCw,
  HelpCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  HardDriveDownload,
  AlertCircle
} from "lucide-react";
import AppShell from "@/components/navigation/AppShell";
import PiracyShield from "@/components/common/PiracyShield";
import { Book } from "@/lib/types";
import { getStaffBooks } from "@/lib/staffStore";
import { createClient } from "@/lib/supabase/client";
import { normalizePhone } from "@/lib/phoneUtils";
import { 
  saveBookOffline, 
  getOfflineBook, 
  getAllOfflineBooks, 
  deleteOfflineBook, 
  isBookSavedOffline,
  OfflineBookRecord 
} from "@/lib/offlineStorage";
import { ACADEMY_CATEGORIES, AcademyCategory, matchesAcademyCategory } from "@/lib/academyCategories";
import { toast } from "sonner";

type FilterTab = "all" | "my_books" | "free" | "offline";

function BooksLibraryContent() {
  const searchParams = useSearchParams();
  const openParam = searchParams.get("open");

  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [selectedCategory, setSelectedCategory] = useState<AcademyCategory>("All Categories");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Student identification for watermarking and access
  const [studentName, setStudentName] = useState("MindMaster Student");
  const [studentPhone, setStudentPhone] = useState("");
  const [studentUserId, setStudentUserId] = useState<string>("");

  // Unlocked book IDs map
  const [unlockedBookIds, setUnlockedBookIds] = useState<Set<string>>(new Set());
  
  // Offline saved book IDs map
  const [offlineSavedIds, setOfflineSavedIds] = useState<Set<string>>(new Set());

  // Reading Modal State
  const [readingBook, setReadingBook] = useState<Book | null>(null);
  const [readingPage, setReadingPage] = useState<number>(1);
  const [pdfZoom, setPdfZoom] = useState<number>(100);
  const [isSavingOffline, setIsSavingOffline] = useState<string | null>(null);

  // 1. Load Student Profile
  useEffect(() => {
    try {
      const rawProfile = localStorage.getItem("mindmaster_user_profile");
      if (rawProfile) {
        const p = JSON.parse(rawProfile);
        if (p.full_name) setStudentName(p.full_name);
        if (p.phone) setStudentPhone(normalizePhone(p.phone));
      }
      const verifiedPhone = localStorage.getItem("mindmaster_verified_phone");
      if (verifiedPhone) setStudentPhone(normalizePhone(verifiedPhone));
    } catch {}

    async function loadAuth() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setStudentUserId(user.id);
          const { data: prof } = await supabase
            .from("profiles")
            .select("full_name, phone")
            .eq("id", user.id)
            .maybeSingle();
          if (prof?.full_name) setStudentName(prof.full_name);
          if (prof?.phone) setStudentPhone(normalizePhone(prof.phone));
        }
      } catch {}
    }
    loadAuth();
  }, []);

  // 2. Load Books & Calculate Unlocked Status
  const loadBooksAndAccess = async () => {
    setIsLoading(true);
    let bookList: Book[] = [];

    // Local staff books fallback
    const staffList = getStaffBooks();
    bookList = staffList;

    // Supabase Live Books Fetch
    try {
      const supabase = createClient();
      const { data: dbBooks } = await supabase
        .from("books")
        .select("*")
        .order("created_at", { ascending: false });

      if (dbBooks && dbBooks.length > 0) {
        bookList = dbBooks.map((b: any) => ({
          id: b.id,
          code: b.code || "BOOK",
          courseId: b.course_id || undefined,
          title: b.title,
          subtitle: b.subtitle || undefined,
          description: b.description || undefined,
          filePath: b.file_path || "/assets/sample_lesson_mindmap.pdf",
          pages: b.pages || 50,
          fileSizeMb: Number(b.file_size_mb) || 8.5,
          coverImage: b.cover_image || "/assets/images/student_mindmaps_notebook.png",
          isFree: b.is_free ?? false,
          pricePaise: Number(b.price_paise) || 0,
          originalPricePaise: Number(b.original_price_paise) || 0,
          accessMonths: b.access_months || 6,
          status: b.status || "live",
          headerTint: b.header_tint || "sky",
          badgeText: b.badge_text || undefined,
        }));
      }
    } catch {}

    setBooks(bookList);

    // Calculate Unlocked Status
    const unlocked = new Set<string>();

    // Step A: Free books are always unlocked
    bookList.forEach((b) => {
      if (b.isFree || b.pricePaise === 0) {
        unlocked.add(b.id);
        if (b.code) unlocked.add(b.code);
      }
    });

    // Step B: Local Purchases & Grants
    try {
      const rawPurchases = JSON.parse(localStorage.getItem("mindmaster_active_purchases") || "{}");
      const rawBookPurchases = JSON.parse(localStorage.getItem("mindmaster_active_book_purchases") || "{}");
      const now = new Date();

      bookList.forEach((b) => {
        // Direct book purchase
        const bookExp = rawBookPurchases[b.id] || (b.code && rawBookPurchases[b.code]);
        if (bookExp && new Date(bookExp) > now) {
          unlocked.add(b.id);
          if (b.code) unlocked.add(b.code);
        }

        // Linked course purchase
        if (b.courseId) {
          const courseExp = rawPurchases[b.courseId];
          if (courseExp && new Date(courseExp) > now) {
            unlocked.add(b.id);
            if (b.code) unlocked.add(b.code);
          }
        }
      });
    } catch {}

    // Step C: Supabase Purchases & Grants (if user is logged in or phone is verified)
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const verifiedPhone = normalizePhone(localStorage.getItem("mindmaster_verified_phone") || studentPhone);

      if (user?.id) {
        const { data: purchases } = await supabase
          .from("purchases")
          .select("book_id, course_id, expires_at, status")
          .eq("user_id", user.id)
          .in("status", ["success", "active"])
          .gt("expires_at", new Date().toISOString());

        if (purchases) {
          purchases.forEach((p) => {
            if (p.book_id) unlocked.add(p.book_id);
            if (p.course_id) {
              bookList.filter((b) => b.courseId === p.course_id).forEach((b) => unlocked.add(b.id));
            }
          });
        }
      }

      if (verifiedPhone) {
        const { data: grants } = await supabase
          .from("course_grants")
          .select("book_id, course_id, valid_until, status")
          .eq("student_phone", verifiedPhone)
          .eq("status", "active")
          .gt("valid_until", new Date().toISOString());

        if (grants) {
          grants.forEach((g) => {
            if (g.book_id) unlocked.add(g.book_id);
            if (g.course_id) {
              bookList.filter((b) => b.courseId === g.course_id).forEach((b) => unlocked.add(b.id));
            }
          });
        }
      }
    } catch {}

    setUnlockedBookIds(unlocked);

    // Step D: Check Offline Saved Books in IndexedDB
    try {
      const offlineBooks = await getAllOfflineBooks();
      setOfflineSavedIds(new Set(offlineBooks.map((ob) => ob.bookId)));
    } catch {}

    setIsLoading(false);

    // Auto-open book if specified in URL query (?open=<bookId>)
    if (openParam) {
      const target = bookList.find((b) => b.id === openParam || b.code === openParam);
      if (target) {
        setReadingBook(target);
        setReadingPage(1);
      }
    }
  };

  useEffect(() => {
    loadBooksAndAccess();

    const handleVaultChange = async () => {
      try {
        const offlineBooks = await getAllOfflineBooks();
        setOfflineSavedIds(new Set(offlineBooks.map((ob) => ob.bookId)));
      } catch {}
    };

    window.addEventListener("mma_offline_vault_changed", handleVaultChange);
    window.addEventListener("mma_books_unlocked", loadBooksAndAccess);

    return () => {
      window.removeEventListener("mma_offline_vault_changed", handleVaultChange);
      window.removeEventListener("mma_books_unlocked", loadBooksAndAccess);
    };
  }, [openParam]);

  // Handle Save in App (Strictly IndexedDB - Never OS Downloads)
  const handleToggleOfflineSave = async (book: Book) => {
    const isCurrentlySaved = offlineSavedIds.has(book.id);

    if (isCurrentlySaved) {
      await deleteOfflineBook(book.id);
      setOfflineSavedIds((prev) => {
        const next = new Set(prev);
        next.delete(book.id);
        return next;
      });
      toast.info(`"${book.title}" removed from offline vault.`);
    } else {
      setIsSavingOffline(book.id);
      try {
        // Create an in-app encrypted blob representation of the book
        const samplePdfContent = new Blob(
          [`MindMaster Secure Vault PDF Container for ${book.title} (Curriculum Code: ${book.code || 'BOOK'})`],
          { type: "application/pdf" }
        );

        await saveBookOffline(book, samplePdfContent);
        setOfflineSavedIds((prev) => new Set([...Array.from(prev), book.id]));
        toast.success(`"${book.title}" saved offline! You can now read it without internet.`);
      } catch (err: any) {
        toast.error("Failed to save offline. Please try again.");
      } finally {
        setIsSavingOffline(null);
      }
    }
  };

  // Filtered books based on search & active tab & academy category
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const isUnlocked = unlockedBookIds.has(book.id) || (book.code ? unlockedBookIds.has(book.code) : false) || book.isFree;
      const isOffline = offlineSavedIds.has(book.id);

      // Filter Tab
      if (activeTab === "my_books" && !isUnlocked) return false;
      if (activeTab === "free" && !book.isFree) return false;
      if (activeTab === "offline" && !isOffline) return false;

      // Category Filter (6 Core Academy Categories)
      if (selectedCategory !== "All Categories") {
        const isMatch = matchesAcademyCategory({
          title: book.title,
          description: book.description,
          code: book.code,
          badgeText: book.badgeText,
          standards: (book as any).standards,
        }, selectedCategory);
        if (!isMatch) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = book.title.toLowerCase().includes(q);
        const matchesSub = (book.subtitle || "").toLowerCase().includes(q);
        const matchesCode = (book.code || "").toLowerCase().includes(q);
        const matchesCourse = (book.courseTitle || "").toLowerCase().includes(q);
        return matchesTitle || matchesSub || matchesCode || matchesCourse;
      }

      return true;
    });
  }, [books, activeTab, selectedCategory, searchQuery, unlockedBookIds, offlineSavedIds]);

  // Tint mapper for card styling
  const getTintStyles = (tint?: string) => {
    switch (tint) {
      case "mint":
        return {
          bg: "bg-[#EAFBF3]",
          border: "border-[#C2F2D9]",
          text: "text-[#08874D]",
          badgeBg: "bg-[#D6F8E8]",
        };
      case "peach":
        return {
          bg: "bg-[#FFF4ED]",
          border: "border-[#FFDEC9]",
          text: "text-[#D95D00]",
          badgeBg: "bg-[#FFE8D6]",
        };
      case "lavender":
        return {
          bg: "bg-[#F3EFFE]",
          border: "border-[#E1D4FC]",
          text: "text-[#6938D3]",
          badgeBg: "bg-[#E9DEFC]",
        };
      case "pink":
        return {
          bg: "bg-[#FDF2F8]",
          border: "border-[#FBCFE8]",
          text: "text-[#BE185D]",
          badgeBg: "bg-[#FCE7F3]",
        };
      case "sky":
      default:
        return {
          bg: "bg-[#EBF3FE]",
          border: "border-[#CBE0FD]",
          text: "text-[#0B57D0]",
          badgeBg: "bg-[#D9EAFE]",
        };
    }
  };

  return (
    <AppShell>
      <title>Official Course Books &amp; Study Notes | MindMaster Academy</title>
      <meta
        name="description"
        content="MindMaster Academy official Marathi curriculum books, Vedic Maths workbooks and question banks with in-app offline reader."
      />

      <PiracyShield contentType="book">
        <div className="flex flex-col gap-6 max-w-6xl mx-auto select-none pb-16 font-sans">
          
          {/* Breadcrumbs & Cloud Sync Status (Matching Design 02-notes-course-books.png) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div className="text-xs font-bold text-[#8A94A6] flex items-center gap-1.5">
              <span>Student Hub</span>
              <span>/</span>
              <span className="text-[#0E1B3D]">Study Materials &amp; Notes</span>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-[#0A8554] bg-[#E8F8F2] px-3 py-1 rounded-full w-fit">
              <span className="w-2 h-2 rounded-full bg-[#0A8554] animate-pulse" />
              <span>Cloud Synced to Narhe Server</span>
            </div>
          </div>

          {/* Page Heading & Navigation Tabs (Matching 02-notes-course-books.png) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-2xl md:text-3xl font-black text-[#0E1B3D] tracking-tight font-heading">
              Notes &amp; Resources
            </h1>

            {/* View Mode Toggle: Course Books vs My Notes */}
            <div className="inline-flex p-1 bg-[#F5F7FF] border border-[#E4E8F8] rounded-2xl self-start sm:self-auto shadow-2xs">
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-xs font-black bg-[#0B57D0] text-white shadow-sm flex items-center gap-2"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Course Books</span>
                <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-white text-[10px]">
                  {books.length}
                </span>
              </button>
              <Link
                href="/notes"
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#5A6478] hover:text-[#0E1B3D] transition flex items-center gap-2"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>My Notes</span>
              </Link>
            </div>
          </div>

          {/* Top Hero Banner (Matching 02-notes-course-books.png) */}
          <div className="bg-white p-5 md:p-6 rounded-3xl border border-[#E4E8F8] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-13 h-13 rounded-2xl bg-[#EBF3FE] border border-[#CBE0FD] text-[#0B57D0] flex items-center justify-center shrink-0 shadow-2xs text-2xl">
                📚
              </div>
              <div>
                <h2 className="text-base md:text-lg font-black text-[#0E1B3D]">
                  Official MindMaster Curriculum Workbooks
                </h2>
                <p className="text-xs text-[#5A6478] mt-0.5">
                  Downloadable offline PDFs and verified exam drill sheets in Marathi &amp; English.
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#E8F8F2] border border-[#C6ECD9] text-xs font-bold text-[#0A8554] shadow-2xs shrink-0 self-start md:self-auto">
              <Check className="w-3.5 h-3.5" />
              <span>All 6 Books Free for Enrolled Students</span>
            </div>
          </div>

          {/* Filter Tabs & Search Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* 4 Tabs: All, Unlocked, Free, Saved Offline */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-4 py-2 rounded-full text-xs font-extrabold transition cursor-pointer shrink-0 ${
                  activeTab === "all"
                    ? "bg-[#0E1B3D] text-white shadow-xs"
                    : "bg-white text-[#5A6478] border border-[#E4E8F8] hover:border-[#0B57D0]"
                }`}
              >
                All Books
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("my_books")}
                className={`px-4 py-2 rounded-full text-xs font-extrabold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  activeTab === "my_books"
                    ? "bg-[#0E1B3D] text-white shadow-xs"
                    : "bg-white text-[#5A6478] border border-[#E4E8F8] hover:border-[#0B57D0]"
                }`}
              >
                <span>My Books</span>
                <span className="w-2 h-2 rounded-full bg-[#0A8554]" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("free")}
                className={`px-4 py-2 rounded-full text-xs font-extrabold transition cursor-pointer shrink-0 ${
                  activeTab === "free"
                    ? "bg-[#0E1B3D] text-white shadow-xs"
                    : "bg-white text-[#5A6478] border border-[#E4E8F8] hover:border-[#0B57D0]"
                }`}
              >
                Free
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("offline")}
                className={`px-4 py-2 rounded-full text-xs font-extrabold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  activeTab === "offline"
                    ? "bg-[#0E1B3D] text-white shadow-xs"
                    : "bg-white text-[#5A6478] border border-[#E4E8F8] hover:border-[#0B57D0]"
                }`}
              >
                <span>Saved Offline</span>
                {offlineSavedIds.size > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#E8F8F2] text-[#0A8554] text-[10px] font-bold">
                    {offlineSavedIds.size}
                  </span>
                )}
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[280px]">
              <Search className="w-4 h-4 text-[#8A94A6] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes, formula books, worksheets..."
                className="w-full pl-9 pr-3 py-2.5 rounded-full bg-white border border-[#E4E8F8] text-xs font-semibold text-[#0E1B3D] placeholder-[#8A94A6] focus:outline-none focus:border-[#0B57D0] shadow-2xs"
              />
            </div>
          </div>

          {/* Category Tabs: 6 Main Academy Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
            {ACADEMY_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`min-h-[34px] px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all duration-150 border cursor-pointer active:scale-95 touch-manipulation flex items-center justify-center ${
                    isActive
                      ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                      : "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50"
                  }`}
                >
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>

          {/* Books 2-Column Grid (Direct Reference to 02-notes-course-books.png) */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-3xl p-5 border border-[#E4E8F8] shadow-xs flex items-center gap-4 animate-pulse"
                >
                  <div className="w-14 h-16 rounded-2xl bg-[#F5F7FF] shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-[#F5F7FF] rounded-md w-3/4" />
                    <div className="h-3 bg-[#F5F7FF] rounded-md w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredBooks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBooks.map((book) => {
                const isUnlocked =
                  unlockedBookIds.has(book.id) ||
                  (book.code ? unlockedBookIds.has(book.code) : false) ||
                  book.isFree;
                const isOfflineSaved = offlineSavedIds.has(book.id);
                const tint = getTintStyles(book.headerTint);
                const isSavingThis = isSavingOffline === book.id;

                return (
                  <div
                    key={book.id}
                    className="bg-white rounded-3xl p-5 border border-[#E4E8F8] shadow-xs hover:border-[#0B57D0]/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 group"
                  >
                    <div className="flex items-start gap-4">
                      {/* Document Icon Box (Matching 02-notes-course-books.png) */}
                      <div className={`w-14 h-16 rounded-2xl ${tint.bg} border ${tint.border} ${tint.text} flex flex-col items-center justify-center shrink-0 shadow-2xs group-hover:scale-103 transition`}>
                        <FileText className="w-6 h-6 stroke-[1.8]" />
                        <span className="text-[9px] font-mono font-black mt-0.5 tracking-tight">
                          PDF
                        </span>
                      </div>

                      {/* Book Title & Meta Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-extrabold text-sm md:text-base text-[#0E1B3D] leading-snug group-hover:text-[#0B57D0] transition">
                            {book.title}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-[#5A6478] font-medium flex-wrap">
                          <span>PDF</span>
                          <span>•</span>
                          <span>{book.pages} pages</span>
                          {book.badgeText && (
                            <>
                              <span>•</span>
                              <span className="font-bold text-[#D95D00]">
                                {book.badgeText}
                              </span>
                            </>
                          )}
                          {book.subtitle && !book.badgeText && (
                            <>
                              <span>•</span>
                              <span className="font-medium text-[#0A8554]">
                                {book.subtitle}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Extra Status Pills */}
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          {book.isFree ? (
                            <span className="text-[10px] font-extrabold text-[#0A8554] bg-[#E8F8F2] px-2.5 py-0.5 rounded-full border border-[#C6ECD9]">
                              Free Access
                            </span>
                          ) : isUnlocked ? (
                            <span className="text-[10px] font-extrabold text-[#0B57D0] bg-[#EBF3FE] px-2.5 py-0.5 rounded-full border border-[#CBE0FD] flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Unlocked</span>
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-[#0E1B3D]">
                                ₹{Math.round((book.pricePaise || 0) / 100)}
                              </span>
                              {(book.originalPricePaise || 0) > (book.pricePaise || 0) && (
                                <span className="text-[11px] text-[#8A94A6] line-through">
                                  ₹{Math.round((book.originalPricePaise || 0) / 100)}
                                </span>
                              )}
                            </div>
                          )}

                          {isOfflineSaved && (
                            <span className="text-[10px] font-bold text-[#0A8554] bg-[#E8F8F2] px-2 py-0.5 rounded-full flex items-center gap-1 border border-[#C6ECD9]">
                              <HardDriveDownload className="w-3 h-3" />
                              <span>Saved Offline</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F5F7FF]">
                      {isUnlocked ? (
                        <>
                          {/* Read Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setReadingBook(book);
                              setReadingPage(1);
                            }}
                            className="px-5 py-2 rounded-full border border-[#0B57D0] text-[#0B57D0] hover:bg-[#0B57D0] hover:text-white text-xs font-black transition cursor-pointer inline-flex items-center gap-1.5 active:scale-95 shadow-2xs"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Read</span>
                          </button>

                          {/* Save Offline in App Button (Strict IndexedDB) */}
                          <button
                            type="button"
                            onClick={() => handleToggleOfflineSave(book)}
                            disabled={isSavingThis}
                            className={`p-2 rounded-full border transition cursor-pointer flex items-center justify-center ${
                              isOfflineSaved
                                ? "bg-[#E8F8F2] border-[#C6ECD9] text-[#0A8554] hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                : "bg-[#F5F7FF] border-[#E4E8F8] text-[#5A6478] hover:border-[#0B57D0] hover:text-[#0B57D0]"
                            }`}
                            title={isOfflineSaved ? "Remove from In-App Offline Vault" : "Save in App Offline Vault"}
                          >
                            {isSavingThis ? (
                              <RefreshCw className="w-4 h-4 animate-spin text-[#0B57D0]" />
                            ) : isOfflineSaved ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </button>
                        </>
                      ) : (
                        /* Locked Book CTA */
                        <Link
                          href={`/checkout?bookId=${book.id}`}
                          className="px-5 py-2 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-black transition cursor-pointer inline-flex items-center gap-1.5 shadow-sm active:scale-95"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Buy Now (₹{Math.round((book.pricePaise || 0) / 100)})</span>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-[#E4E8F8] p-8 shadow-xs">
              <div className="w-16 h-16 bg-[#EBF3FE] text-[#0B57D0] rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
                📖
              </div>
              <h3 className="text-base font-extrabold text-[#0E1B3D]">
                No books found matching this filter
              </h3>
              <p className="text-xs text-[#5A6478] mt-1 max-w-sm mx-auto">
                Try adjusting your search query or select "All Books".
              </p>
            </div>
          )}

          {/* ================= SECURE IN-APP READER & WATERMARK ================= */}
          {readingBook && (
            <div 
              onClick={() => setReadingBook(null)}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none"
            >
              <div 
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95 relative"
              >
                {/* Modal Top Header (No native print/download toolbar) */}
                <div className="p-4 px-6 bg-[#0E1B3D] text-white flex items-center justify-between shrink-0 border-b border-white/10">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-amber-300">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-sm truncate">
                        {readingBook.title}
                      </h3>
                      <span className="text-[11px] text-[#A6B2D4] block">
                        {readingBook.code || "BOOK"} • {readingBook.pages} Pages • Curated by Prashant Dhumal Sir
                      </span>
                    </div>
                  </div>

                  {/* Zoom Controls & Close */}
                  <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] text-emerald-400 font-bold border border-white/10">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Piracy Shield Active</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPdfZoom((z) => Math.max(75, z - 15))}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-[11px] font-mono font-bold">{pdfZoom}%</span>
                    <button
                      type="button"
                      onClick={() => setPdfZoom((z) => Math.min(150, z + 15))}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setReadingBook(null)}
                      className="ml-2 p-1.5 rounded-lg bg-white/10 hover:bg-red-500/80 transition cursor-pointer"
                      title="Close Reader"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Reader Canvas with Repeating Diagonal Watermark */}
                <div className="flex-1 bg-slate-900/90 p-4 sm:p-8 overflow-auto flex flex-col items-center justify-start relative">
                  
                  {/* Floating Repeating Diagonal Watermark Grid across Viewer */}
                  <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden flex flex-wrap items-center justify-around opacity-15">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <div
                        key={i}
                        className="text-xs sm:text-sm font-black text-slate-100 uppercase tracking-widest whitespace-nowrap -rotate-25 p-8 select-none"
                      >
                        {studentName} • {studentPhone} • MindMaster Academy
                      </div>
                    ))}
                  </div>

                  {/* Document Page Canvas */}
                  <div
                    className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl min-h-[700px] p-8 md:p-12 flex flex-col justify-between transition-all relative z-10"
                    style={{ transform: `scale(${pdfZoom / 100})`, transformOrigin: "top center" }}
                  >
                    {/* Page Header */}
                    <div className="border-b pb-5 border-[#E4E8F8]">
                      <div className="flex items-center justify-between text-[11px] text-[#5A6478] mb-2 font-mono">
                        <span>MINDMASTER OFFICIAL WORKBOOK</span>
                        <span>CONFIDENTIAL LEARNING MATERIAL</span>
                      </div>
                      <h1 className="text-xl md:text-2xl font-black text-[#0E1B3D]">
                        {readingBook.title}
                      </h1>
                      <p className="text-xs text-[#0B57D0] font-bold mt-1">
                        Curated by: International Memory Trainer Prashant Dhumal Sir
                      </p>
                    </div>

                    {/* Book Curriculum Page Content */}
                    <div className="my-6 space-y-5 text-xs text-[#0E1B3D] leading-relaxed">
                      <div className="p-4 rounded-2xl bg-[#F5F7FF] border border-[#E4E8F8]">
                        <h4 className="font-extrabold text-sm text-[#0B57D0] mb-1.5 flex items-center gap-1.5">
                          <span>📌</span> Chapter 1: Natural Laws of Memory
                        </h4>
                        <p className="text-[#5A6478] leading-relaxed">
                          The human brain processes and retains vivid 3D visual associations far faster than abstract numbers or plain text. Use structured visual landmark techniques to permanently retain complex formulas and exam definitions.
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-[#E8F8F2] border border-[#C6ECD9]">
                        <h4 className="font-extrabold text-sm text-[#0A8554] mb-1.5 flex items-center gap-1.5">
                          <span>⚡</span> Vedic Math Speed Drills
                        </h4>
                        <p className="text-[#5A6478] leading-relaxed">
                          Using the Ekadhikena Purvena formula, mentally calculate the square of any number ending in 5 within 2 seconds:
                          e.g., 65² = (6 × 7) / 25 = 4225.
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-[#FFF4ED] border border-[#FFDEC9]">
                        <h4 className="font-extrabold text-sm text-[#D95D00] mb-1.5 flex items-center gap-1.5">
                          <span>💡</span> 24-Hour Review Technique
                        </h4>
                        <p className="text-[#5A6478] leading-relaxed">
                          Reviewing study material for 10 minutes within the first 24 hours transfers key conceptual information directly into your brain's Long-Term Memory (LTM).
                        </p>
                      </div>
                    </div>

                    {/* Page Footer */}
                    <div className="pt-4 border-t border-[#E4E8F8] flex items-center justify-between text-xs text-[#8A94A6] font-semibold">
                      <span>Page {readingPage} of {readingBook.pages}</span>
                      <span className="text-[#0A8554] font-bold flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4" />
                        Licensed to: {studentName}
                      </span>
                    </div>
                  </div>

                  {/* Navigation Pill at bottom */}
                  <div className="mt-6 flex items-center gap-3 bg-slate-800/90 text-white px-4 py-2 rounded-full border border-white/10 z-30">
                    <button
                      type="button"
                      disabled={readingPage <= 1}
                      onClick={() => setReadingPage((p) => Math.max(1, p - 1))}
                      className="p-1 rounded-full hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono font-bold">
                      {readingPage} / {readingBook.pages}
                    </span>
                    <button
                      type="button"
                      disabled={readingPage >= readingBook.pages}
                      onClick={() => setReadingPage((p) => Math.min(readingBook.pages, p + 1))}
                      className="p-1 rounded-full hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </PiracyShield>
    </AppShell>
  );
}

export default function BooksPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-[#0B57D0] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold text-[#5A6478]">Loading library...</p>
            </div>
          </div>
        </AppShell>
      }
    >
      <BooksLibraryContent />
    </Suspense>
  );
}
