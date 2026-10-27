"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import AdminShell from "@/components/admin/AdminShell";
import PermissionGuard from "@/components/admin/PermissionGuard";
import { Book, StaffUser, Course } from "@/lib/types";
import {
  getCurrentStaff,
  getStaffBooks,
  saveBookToSupabase,
  deleteBookFromSupabase,
  toggleBookStatus,
  toggleBookPricing,
  getStaffCourses,
} from "@/lib/staffStore";
import { createClient } from "@/lib/supabase/client";
import {
  BookOpen,
  FileText,
  Plus,
  Search,
  Edit3,
  Trash2,
  ExternalLink,
  DollarSign,
  Gift,
  Layers,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  Upload,
  FileUp,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

// Validity Presets for Standalone Paid Books
const VALIDITY_PRESETS = [
  { id: "1_month", label: "1 Month (30 Days)", months: 1 },
  { id: "3_months", label: "3 Months (90 Days)", months: 3 },
  { id: "6_months", label: "6 Months (180 Days)", months: 6 },
  { id: "12_months", label: "12 Months (1 Year)", months: 12 },
  { id: "lifetime", label: "Lifetime Access", months: 120 },
];

function generateNextBookCode(existingBooks: Book[]): string {
  let maxNum = 0;
  for (const b of existingBooks) {
    const m = (b.code || "").match(/^BK-(\d+)$/i);
    if (m) {
      const num = parseInt(m[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  return `BK-${String(maxNum + 1).padStart(2, "0")}`;
}

export default function DigitalBooksManagerPage() {
  const [staff, setStaff] = useState<StaffUser>(getCurrentStaff());
  const [books, setBooks] = useState<Book[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "free" | "paid" | "linked" | "live" | "draft">("all");

  // Modal / Drawer State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields State (Cleaned & Focused)
  const [accessMode, setAccessMode] = useState<"free" | "paid" | "course">("free");
  const [formCode, setFormCode] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCourseId, setFormCourseId] = useState<string>("");
  const [formPrice, setFormPrice] = useState<number>(99);
  const [formOriginalPrice, setFormOriginalPrice] = useState<number>(299);
  const [formAccessMonths, setFormAccessMonths] = useState<number>(6);
  const [formPages, setFormPages] = useState<number>(24);
  const [formFileSizeMb, setFormFileSizeMb] = useState<number>(4.5);
  const [formCoverImage, setFormCoverImage] = useState<string>("/assets/images/vedic_maths_abacus_3d.png");
  const [formFilePath, setFormFilePath] = useState<string>("/assets/docs/vedic_maths_workbook.pdf");
  const [formStatus, setFormStatus] = useState<"live" | "draft">("live");

  // Upload States
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [showDirectPdfUrl, setShowDirectPdfUrl] = useState(false);
  const [showDirectCoverUrl, setShowDirectCoverUrl] = useState(false);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Delete Confirmation Modal State
  const [deleteModalBook, setDeleteModalBook] = useState<Book | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const reload = async () => {
    setIsLoading(true);
    setStaff(getCurrentStaff());
    setCourses(getStaffCourses());

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("books")
        .select("*, courses(title)")
        .order("created_at", { ascending: false });

      if (!error && data) {
        const dbBooks: Book[] = data.map((b: any) => ({
          id: b.id,
          code: b.code || `BK-${b.id.slice(0, 4)}`,
          courseId: b.course_id || null,
          courseTitle: b.courses?.title || (b.course_id ? "Associated Course" : "Standalone Digital Book"),
          title: b.title,
          subtitle: b.subtitle || "",
          description: b.description || "",
          filePath: b.file_path,
          pages: b.pages || 24,
          fileSizeMb: Number(b.file_size_mb) || 4.5,
          coverImage: b.cover_image || "/assets/images/vedic_maths_abacus_3d.png",
          isFree: Boolean(b.is_free),
          pricePaise: Number(b.price_paise) || 0,
          originalPricePaise: Number(b.original_price_paise) || 0,
          accessMonths: b.access_months || 6,
          status: b.status || "live",
          headerTint: b.header_tint || "sky",
          badgeText: b.badge_text || "",
          createdAt: b.created_at,
        }));
        setBooks(dbBooks);
      } else {
        setBooks(getStaffBooks());
      }
    } catch (err) {
      console.warn("Could not load books from Supabase, using local store:", err);
      setBooks(getStaffBooks());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    reload();

    const handleSync = () => reload();
    window.addEventListener("mma_staff_changed", handleSync);
    window.addEventListener("mma_books_changed", handleSync);
    return () => {
      window.removeEventListener("mma_staff_changed", handleSync);
      window.removeEventListener("mma_books_changed", handleSync);
    };
  }, []);

  const isMainAdmin = staff.role === "main_admin";

  // Summary Metrics
  const totalBooksCount = books.length;
  const freeBooksCount = books.filter((b) => b.isFree || b.pricePaise === 0).length;
  const paidBooksCount = books.filter((b) => !b.isFree && (b.pricePaise || 0) > 0).length;
  const courseLinkedCount = books.filter((b) => Boolean(b.courseId)).length;

  // Open Create Window
  const handleOpenCreate = () => {
    setEditingBook(null);
    setAccessMode("free");
    const nextCode = generateNextBookCode(books);
    setFormCode(nextCode);
    setFormTitle("");
    setFormDescription("");
    setFormCourseId(courses[0]?.id || "");
    setFormPrice(99);
    setFormOriginalPrice(299);
    setFormAccessMonths(6);
    setFormPages(24);
    setFormFileSizeMb(4.5);
    setFormCoverImage("/assets/images/vedic_maths_abacus_3d.png");
    setFormFilePath("");
    setFormStatus("live");
    setShowDirectPdfUrl(false);
    setShowDirectCoverUrl(false);
    setIsModalOpen(true);
  };

  // Open Edit Window
  const handleOpenEdit = (book: Book) => {
    setEditingBook(book);
    if (book.isFree) {
      setAccessMode("free");
    } else if (book.courseId) {
      setAccessMode("course");
    } else {
      setAccessMode("paid");
    }

    setFormCode(book.code || generateNextBookCode(books));
    setFormTitle(book.title);
    setFormDescription(book.description || "");
    setFormCourseId(book.courseId || courses[0]?.id || "");
    setFormPrice(book.pricePaise ? Math.round(book.pricePaise / 100) : 99);
    setFormOriginalPrice(book.originalPricePaise ? Math.round(book.originalPricePaise / 100) : 299);
    setFormAccessMonths(book.accessMonths || 6);
    setFormPages(book.pages || 24);
    setFormFileSizeMb(book.fileSizeMb || 4.5);
    setFormCoverImage(book.coverImage || "/assets/images/vedic_maths_abacus_3d.png");
    setFormFilePath(book.filePath);
    setFormStatus(book.status === "draft" ? "draft" : "live");
    setShowDirectPdfUrl(Boolean(book.filePath && !book.filePath.startsWith("/uploads/")));
    setShowDirectCoverUrl(Boolean(book.coverImage && !book.coverImage.startsWith("/uploads/")));
    setIsModalOpen(true);
  };

  // Handle PDF File Selection & Auto-Detection
  const handlePdfFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Auto-calculate file_size_mb
    const sizeMb = Number((file.size / (1024 * 1024)).toFixed(1));
    setFormFileSizeMb(sizeMb);

    // 2. Auto-fill Book title from filename if empty
    if (!formTitle.trim()) {
      const rawName = file.name.replace(/\.[^/.]+$/, "");
      const cleanTitle = rawName
        .replace(/[_-]+/g, " ")
        .trim()
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      setFormTitle(cleanTitle);
    }

    // 3. Auto-generate next BK-XX code in background if empty
    if (!formCode || formCode === "BK-01") {
      setFormCode(generateNextBookCode(books));
    }

    // 4. Upload file to server
    setIsUploadingPdf(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "pdf");

      const res = await fetch("/api/upload/book", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setFormFilePath(data.url);
        toast.success(`PDF "${file.name}" यशस्वीपणे अपलोड झाली!`);
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (err: any) {
      console.error("PDF upload error:", err);
      toast.error(`PDF अपलोड करताना त्रुटी: ${err.message}`);
    } finally {
      setIsUploadingPdf(false);
    }
  };

  // Handle Cover Thumbnail File Selection
  const handleCoverFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "cover");

      const res = await fetch("/api/upload/book", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setFormCoverImage(data.url);
        toast.success("कव्हर फोटो यशस्वीपणे अपलोड झाला!");
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (err: any) {
      console.error("Cover upload error:", err);
      toast.error(`कव्हर फोटो अपलोड करताना त्रुटी: ${err.message}`);
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Save Book (100% Live Supabase Sync)
  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error("कृपया पुस्तकाचे नाव (Book Title) प्रविष्ट करा.");
      return;
    }
    if (!formFilePath.trim()) {
      toast.error("कृपया PDF फाईल अपलोड करा किंवा URL टाका.");
      return;
    }

    setIsSaving(true);
    try {
      const isFree = accessMode === "free";
      const courseId = accessMode === "course" ? formCourseId || null : null;
      const selectedCourse = courses.find((c) => c.id === courseId);
      const bookCode = formCode.trim().toUpperCase() || generateNextBookCode(books);

      const bookData: Book = {
        id: editingBook ? editingBook.id : `bk-${Date.now()}`,
        code: bookCode,
        courseId: courseId,
        courseTitle: selectedCourse ? selectedCourse.title : courseId ? "Associated Course" : "Standalone Digital Book",
        title: formTitle.trim(),
        subtitle: undefined,
        description: formDescription.trim() || undefined,
        filePath: formFilePath.trim(),
        pages: Number(formPages) || 1,
        fileSizeMb: Number(formFileSizeMb) || 4.5,
        coverImage: formCoverImage.trim() || "/assets/images/vedic_maths_abacus_3d.png",
        isFree,
        pricePaise: isFree ? 0 : formPrice * 100,
        originalPricePaise: isFree ? 0 : formOriginalPrice * 100,
        accessMonths: Number(formAccessMonths) || 6,
        status: formStatus,
        headerTint: "sky",
        badgeText: isFree ? "Free Edition" : courseId ? "Course Included" : "Premium E-Book",
        createdAt: editingBook?.createdAt || new Date().toISOString(),
      };

      await saveBookToSupabase(bookData);
      setIsModalOpen(false);
      toast.success(editingBook ? "डिजिटल पुस्तक अद्ययावत केले!" : "नवीन डिजिटल पुस्तक प्रकाशित केले!");
      await reload();
    } catch (err: any) {
      console.error("Save book error:", err);
      toast.error(`पुस्तक सेव्ह करताना त्रुटी आली: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Book (100% Live Supabase Sync)
  const handleDeleteConfirm = async () => {
    if (!deleteModalBook) return;
    setIsDeleting(true);
    try {
      await deleteBookFromSupabase(deleteModalBook.id);
      toast.success(`पुस्तक "${deleteModalBook.title}" कायमचे हटवले.`);
      setDeleteModalBook(null);
      await reload();
    } catch (err: any) {
      toast.error(`पुस्तक हटवताना त्रुटी: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle Pricing (100% Live Supabase Sync)
  const handleTogglePricing = async (book: Book) => {
    await toggleBookPricing(book.id);
    await reload();
  };

  // Toggle Status (100% Live Supabase Sync)
  const handleToggleStatus = async (book: Book) => {
    await toggleBookStatus(book.id);
    await reload();
  };

  // Filtered list
  const filteredBooks = books.filter((b) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      b.title.toLowerCase().includes(q) ||
      (b.code && b.code.toLowerCase().includes(q)) ||
      (b.courseTitle && b.courseTitle.toLowerCase().includes(q));

    let matchesFilter = true;
    if (filterType === "free") matchesFilter = Boolean(b.isFree || b.pricePaise === 0);
    else if (filterType === "paid") matchesFilter = !b.isFree && (b.pricePaise || 0) > 0;
    else if (filterType === "linked") matchesFilter = Boolean(b.courseId);
    else if (filterType === "live") matchesFilter = b.status === "live";
    else if (filterType === "draft") matchesFilter = b.status === "draft";

    return matchesSearch && matchesFilter;
  });

  return (
    <PermissionGuard permission="notes.books.manage">
      <AdminShell>
        <div className="space-y-6 font-sans">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E4E8F8] shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-[#0B57D0] border border-blue-200">
                  Digital Books Hub
                </span>
                <span className="text-xs text-slate-400 font-semibold">• {books.length} Books Available</span>
              </div>
              <h2 className="text-2xl font-extrabold text-[#0E1B3D] font-heading">
                Digital Books Manager
              </h2>
              <p className="text-xs text-[#5A6478] mt-1">
                Manage official MindMaster workbooks, formula booklets, standalone paid ebooks, and course study materials.
              </p>
            </div>

            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-bold rounded-2xl shadow-md transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Digital Book</span>
            </button>
          </div>

          {/* Top 4 Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#E4E8F8] shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Books</p>
                <p className="text-2xl font-black text-[#0E1B3D] mt-1">{totalBooksCount}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Across all curriculums</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0B57D0] flex items-center justify-center font-bold">
                <BookOpen className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E4E8F8] shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Free Books</p>
                <p className="text-2xl font-black text-emerald-700 mt-1">{freeBooksCount}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">100% Free for all students</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Gift className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E4E8F8] shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Paid Books</p>
                <p className="text-2xl font-black text-indigo-700 mt-1">{paidBooksCount}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Standalone paid ebooks</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E4E8F8] shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Course-Linked</p>
                <p className="text-2xl font-black text-purple-700 mt-1">{courseLinkedCount}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Bundled with video courses</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Layers className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-3xl border border-[#E4E8F8] shadow-sm space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search books by title, code (BK-01), or course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-[#E4E8F8] focus:outline-none focus:border-[#0B57D0] focus:ring-1 focus:ring-[#0B57D0]"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 mr-1">Filter by:</span>
              {[
                { key: "all", label: `All Books (${totalBooksCount})` },
                { key: "free", label: `Free for All (${freeBooksCount})` },
                { key: "paid", label: `Paid Standalone (${paidBooksCount})` },
                { key: "linked", label: `Course-Linked (${courseLinkedCount})` },
                { key: "live", label: "Live Only" },
                { key: "draft", label: "Drafts Only" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilterType(f.key as any)}
                  className={`text-xs px-3 py-1.5 rounded-full font-bold transition-all ${
                    filterType === f.key
                      ? "bg-[#0B57D0] text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Books Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBooks.map((book) => {
              const isFree = Boolean(book.isFree || book.pricePaise === 0);
              const isDraft = book.status === "draft";

              return (
                <div
                  key={book.id}
                  className={`bg-white rounded-3xl border transition-all duration-200 hover:shadow-lg flex flex-col justify-between overflow-hidden ${
                    isDraft ? "border-dashed border-amber-300" : "border-[#E4E8F8]"
                  }`}
                >
                  {/* Clean Top Header Strip (No Pastel Tints) */}
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-extrabold text-[#0B57D0] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                        {book.code || "BK"}
                      </span>
                      {isFree ? (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                          100% Free
                        </span>
                      ) : book.courseId ? (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                          Course Included
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-50 text-[#0B57D0] border border-blue-200">
                          ₹{Math.round((book.pricePaise || 0) / 100)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isDraft ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                          <EyeOff className="w-3 h-3" /> Draft
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <Eye className="w-3 h-3" /> Live
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div className="flex gap-4 items-start">
                      {/* Book Cover Thumbnail */}
                      <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-xs">
                        {book.coverImage ? (
                          <Image
                            src={book.coverImage}
                            alt={book.title}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <BookOpen className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      {/* Title & Metadata */}
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold text-[#0B57D0] truncate mb-0.5">
                          {book.courseId ? `Linked: ${book.courseTitle}` : "Standalone Digital E-Book"}
                        </div>
                        <h3 className="font-extrabold text-[#0E1B3D] text-sm leading-snug line-clamp-2">
                          {book.title}
                        </h3>
                        {book.description && (
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{book.description}</p>
                        )}

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium mt-2">
                          <span>📄 {book.pages} Pages</span>
                          <span>•</span>
                          <span>💾 {book.fileSizeMb} MB</span>
                        </div>
                      </div>
                    </div>

                    {/* Price & Access Row */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        {isFree ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 font-extrabold text-sm">
                            <Gift className="w-4 h-4" />
                            <span>100% FREE</span>
                          </div>
                        ) : (
                          <div className="flex items-baseline gap-2">
                            <span className="text-base font-black text-[#0E1B3D]">
                              ₹{Math.round((book.pricePaise || 0) / 100)}
                            </span>
                            {Boolean(book.originalPricePaise && book.originalPricePaise > (book.pricePaise || 0)) && (
                              <span className="text-xs text-slate-400 line-through">
                                ₹{Math.round((book.originalPricePaise || 0) / 100)}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-500 font-semibold">
                              ({book.accessMonths || 6} Months)
                            </span>
                          </div>
                        )}
                      </div>

                      {book.filePath && (
                        <a
                          href={book.filePath}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-bold text-[#0B57D0] hover:underline inline-flex items-center gap-1"
                        >
                          Preview PDF <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1">
                      {/* Toggle Free/Paid */}
                      <button
                        onClick={() => handleTogglePricing(book)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                          isFree
                            ? "bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                            : "bg-white text-indigo-700 border-indigo-300 hover:bg-indigo-50"
                        }`}
                        title="Click to toggle Free or Paid pricing"
                      >
                        {isFree ? "Make Paid" : "Make Free"}
                      </button>

                      {/* Toggle Live/Draft */}
                      <button
                        onClick={() => handleToggleStatus(book)}
                        className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-all"
                        title="Toggle Live / Draft"
                      >
                        {isDraft ? "Publish Live" : "Unpublish Draft"}
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Edit Button */}
                      <button
                        onClick={() => handleOpenEdit(book)}
                        className="p-1.5 rounded-lg text-[#0B57D0] hover:bg-blue-100 transition-all"
                        title="Edit Book Details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Delete Button (Main Admin Only) */}
                      {isMainAdmin && (
                        <button
                          onClick={() => setDeleteModalBook(book)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100 transition-all"
                          title="Delete Book"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredBooks.length === 0 && (
            <div className="bg-white rounded-3xl border border-[#E4E8F8] p-12 text-center">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#0E1B3D]">No Digital Books Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                No books match your current filter or search query. Click "+ Add Digital Book" to publish your first study handbook.
              </p>
              <button
                onClick={handleOpenCreate}
                className="mt-4 px-4 py-2 bg-[#0B57D0] text-white text-xs font-bold rounded-xl shadow"
              >
                + Add Digital Book Now
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CREATE / EDIT BOOK PROPER WINDOW MODAL (Clean, Fast & Focused) */}
          {/* ========================================================================= */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-[#E4E8F8] my-8 max-h-[92vh] overflow-y-auto font-sans">
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2.5 rounded-2xl bg-blue-50 text-[#0B57D0]">
                      <BookOpen className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="text-lg font-extrabold text-[#0E1B3D]">
                        {editingBook ? "Edit Digital Book" : "Publish New Digital Book"}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Upload PDF, cover thumbnail, and configure access pricing.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveBook} className="space-y-5 text-xs">
                  {/* 1. ACCESS MODE SELECTOR */}
                  <div>
                    <label className="block font-bold text-[#0E1B3D] mb-2 text-xs">
                      Access &amp; Pricing Model *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div
                        onClick={() => setAccessMode("free")}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          accessMode === "free"
                            ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400/30 text-emerald-900"
                            : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold text-xs mb-1">
                          <Gift className="w-4 h-4 text-emerald-600" />
                          <span>100% Free for All</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          No payment needed. Open to every registered student.
                        </p>
                      </div>

                      <div
                        onClick={() => setAccessMode("paid")}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          accessMode === "paid"
                            ? "bg-blue-50 border-[#0B57D0] ring-2 ring-blue-400/30 text-blue-950"
                            : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold text-xs mb-1">
                          <DollarSign className="w-4 h-4 text-[#0B57D0]" />
                          <span>Paid Standalone</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          Sold separately with Razorpay checkout &amp; validity.
                        </p>
                      </div>

                      <div
                        onClick={() => setAccessMode("course")}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          accessMode === "course"
                            ? "bg-purple-50 border-purple-500 ring-2 ring-purple-400/30 text-purple-950"
                            : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold text-xs mb-1">
                          <Layers className="w-4 h-4 text-purple-600" />
                          <span>Course Included</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          Included automatically with a specific course.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 2. COURSE SELECTOR (Visible only when accessMode === 'course') */}
                  {accessMode === "course" && (
                    <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-200 space-y-2">
                      <div className="font-bold text-purple-900 text-xs flex items-center gap-1.5">
                        <Layers className="w-4 h-4" /> Link to Specific Course
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Select Associated Course *</label>
                        <select
                          value={formCourseId}
                          onChange={(e) => setFormCourseId(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-xs focus:outline-none focus:border-purple-500"
                          required
                        >
                          {courses.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.code} - {c.title} ({c.titleMr || ""})
                            </option>
                          ))}
                        </select>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Any student who enrolls in this course gets instant reading access to this book.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 3. PRICING & VALIDITY (Visible only when accessMode === 'paid') */}
                  {accessMode === "paid" && (
                    <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-3">
                      <div className="font-bold text-[#0B57D0] text-xs flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4" /> Paid Pricing &amp; Validity
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Selling Price (₹) *</label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={formPrice}
                            onChange={(e) => setFormPrice(Number(e.target.value))}
                            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Original Price (₹) (Strike-through)</label>
                          <input
                            type="number"
                            min="1"
                            value={formOriginalPrice}
                            onChange={(e) => setFormOriginalPrice(Number(e.target.value))}
                            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1.5">Access Validity Presets</label>
                        <div className="flex flex-wrap gap-2">
                          {VALIDITY_PRESETS.map((vp) => (
                            <button
                              key={vp.id}
                              type="button"
                              onClick={() => setFormAccessMonths(vp.months)}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition border ${
                                formAccessMonths === vp.months
                                  ? "bg-[#0B57D0] text-white border-[#0B57D0] shadow-xs"
                                  : "bg-white text-slate-700 border-slate-300 hover:border-blue-400"
                              }`}
                            >
                              {vp.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4. PDF FILE UPLOAD & DIRECT URL */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-[#0B57D0]" />
                        <span>PDF Book File (.pdf) *</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowDirectPdfUrl(!showDirectPdfUrl)}
                        className="text-[11px] font-bold text-blue-600 hover:underline"
                      >
                        {showDirectPdfUrl ? "Hide URL Input" : "Or Direct URL"}
                      </button>
                    </div>

                    {/* Hidden Native File Input */}
                    <input
                      ref={pdfInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handlePdfFileSelect}
                      className="hidden"
                    />

                    {/* Upload Drop Zone / Box */}
                    <div
                      onClick={() => !isUploadingPdf && pdfInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                        formFilePath
                          ? "border-emerald-300 bg-emerald-50/50"
                          : "border-slate-300 hover:border-blue-500 bg-white"
                      }`}
                    >
                      {isUploadingPdf ? (
                        <div className="py-2 flex flex-col items-center gap-2 text-[#0B57D0]">
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span className="font-bold text-xs">PDF अपलोड होत आहे... कृपया थांबा</span>
                        </div>
                      ) : formFilePath ? (
                        <div className="flex items-center gap-3 w-full justify-between px-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                              <CheckCircle2 className="w-5 h-5" />
                            </span>
                            <div className="text-left min-w-0">
                              <p className="font-extrabold text-[#0E1B3D] truncate text-xs">
                                {formFilePath.split("/").pop()}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                💾 {formFileSizeMb} MB • Ready
                              </p>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-[#0B57D0] bg-white border border-blue-200 px-2.5 py-1 rounded-lg">
                            Change File
                          </span>
                        </div>
                      ) : (
                        <div className="py-3 flex flex-col items-center gap-1.5">
                          <Upload className="w-6 h-6 text-slate-400" />
                          <p className="font-bold text-slate-700 text-xs">
                            PDF फाईल निवडण्यासाठी येथे क्लिक करा
                          </p>
                          <p className="text-[10px] text-slate-400">
                            (फाईलचा आकार आणि नाव आपोआप डिटेक्ट केले जाईल)
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Direct URL Input (Toggled) */}
                    {showDirectPdfUrl && (
                      <div className="pt-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Direct PDF URL / Path
                        </label>
                        <input
                          type="text"
                          value={formFilePath}
                          onChange={(e) => setFormFilePath(e.target.value)}
                          placeholder="https://... किंवा /assets/docs/sample.pdf"
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-xs"
                        />
                      </div>
                    )}
                  </div>

                  {/* 5. COVER THUMBNAIL UPLOAD & DIRECT URL */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-purple-600" />
                        <span>Book Cover Thumbnail (.png, .jpg, .webp)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowDirectCoverUrl(!showDirectCoverUrl)}
                        className="text-[11px] font-bold text-blue-600 hover:underline"
                      >
                        {showDirectCoverUrl ? "Hide URL Input" : "Or Direct Image URL"}
                      </button>
                    </div>

                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/jpg"
                      onChange={handleCoverFileSelect}
                      className="hidden"
                    />

                    <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200">
                      {/* Thumbnail Preview */}
                      <div className="relative w-14 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        {formCoverImage ? (
                          <Image
                            src={formCoverImage}
                            alt="Cover Preview"
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#0E1B3D] text-xs">
                          {isUploadingCover ? "कव्हर फोटो अपलोड होत आहे..." : "पुस्तकाचा कव्हर फोटो"}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {formCoverImage || "कोणताही फोटो निवडलेला नाही"}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={isUploadingCover}
                        onClick={() => coverInputRef.current?.click()}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shrink-0"
                      >
                        {isUploadingCover ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        <span>Upload Photo</span>
                      </button>
                    </div>

                    {showDirectCoverUrl && (
                      <div className="pt-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Direct Cover Image URL
                        </label>
                        <input
                          type="text"
                          value={formCoverImage}
                          onChange={(e) => setFormCoverImage(e.target.value)}
                          placeholder="/assets/images/sample.png किंवा https://..."
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-xs"
                        />
                      </div>
                    )}
                  </div>

                  {/* 6. BOOK TITLE & DESCRIPTION */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-700">Book Title (नाव) *</label>
                        <span className="text-[11px] font-mono text-[#0B57D0] font-extrabold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          {formCode || "BK-01"}
                        </span>
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="उदा. वैदिक गणित १६ सूत्रे परिपूर्ण मार्गदर्शिका"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Short Description (वर्णन)</label>
                      <textarea
                        rows={2}
                        placeholder="विद्यार्थी या पुस्तकात काय शिकतील त्याचे संक्षिप्त वर्णन..."
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Total Pages (पृष्ठे)</label>
                        <input
                          type="number"
                          min="1"
                          value={formPages}
                          onChange={(e) => setFormPages(Number(e.target.value))}
                          className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">File Size (MB)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={formFileSizeMb}
                          onChange={(e) => setFormFileSizeMb(Number(e.target.value))}
                          className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 7. PUBLISH STATUS TOGGLE */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800 text-xs">Publish Status</p>
                      <p className="text-[11px] text-slate-500">Live पुस्तके लगेच विद्यार्थ्यांना उपलब्ध होतात.</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFormStatus("live")}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                          formStatus === "live"
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-white text-slate-600 border border-slate-200"
                        }`}
                      >
                        ✓ Live
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormStatus("draft")}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                          formStatus === "draft"
                            ? "bg-amber-600 text-white shadow-xs"
                            : "bg-white text-slate-600 border border-slate-200"
                        }`}
                      >
                        Draft
                      </button>
                    </div>
                  </div>

                  {/* Modal Footer Actions */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => setIsModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition"
                    >
                      रद्द करा (Cancel)
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving || isUploadingPdf || isUploadingCover}
                      className="px-6 py-2.5 bg-[#0B57D0] hover:bg-[#0842A0] disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>सेव्ह करत आहे...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{editingBook ? "बदल सेव्ह करा" : "पुस्तक प्रकाशित करा"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteModalBook && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-sans">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-red-200 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-[#0E1B3D]">
                    हे पुस्तक कायमचे हटवायचे आहे का?
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    <strong>{deleteModalBook.title}</strong> ({deleteModalBook.code}) हे पुस्तक डेटाबेसमधून कायमचे काढून टाकले जाईल.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    disabled={isDeleting}
                    onClick={() => setDeleteModalBook(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    रद्द करा (Cancel)
                  </button>
                  <button
                    disabled={isDeleting}
                    onClick={handleDeleteConfirm}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
                  >
                    {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    <span>हटवा (Delete)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminShell>
    </PermissionGuard>
  );
}
