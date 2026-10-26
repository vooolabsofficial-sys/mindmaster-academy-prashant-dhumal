"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import AdminShell from "@/components/admin/AdminShell";
import PermissionGuard from "@/components/admin/PermissionGuard";
import { Book, StaffUser, HeaderTint, Course } from "@/lib/types";
import {
  getCurrentStaff,
  getStaffBooks,
  saveStaffBook,
  deleteStaffBook,
  toggleBookStatus,
  toggleBookPricing,
  getStaffCourses,
  logStaffAction,
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
  Tag,
  Eye,
  EyeOff,
  DollarSign,
  Gift,
  Layers,
  Sparkles,
  Download,
  CheckCircle2,
  X,
  FileCheck,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";

const PASTEL_TINTS: { key: HeaderTint; label: string; bg: string; border: string; dot: string }[] = [
  { key: "mint", label: "Mint", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-400" },
  { key: "sky", label: "Sky", bg: "bg-sky-50", border: "border-sky-200", dot: "bg-sky-400" },
  { key: "peach", label: "Peach", bg: "bg-orange-50", border: "border-orange-200", dot: "bg-orange-400" },
  { key: "lavender", label: "Lavender", bg: "bg-purple-50", border: "border-purple-200", dot: "bg-purple-400" },
  { key: "pink", label: "Pink", bg: "bg-pink-50", border: "border-pink-200", dot: "bg-pink-400" },
];

const COVER_PRESETS = [
  { label: "Vedic Abacus", url: "/assets/images/vedic_maths_abacus_3d.png" },
  { label: "MindMaps Notebook", url: "/assets/images/student_mindmaps_notebook.png" },
  { label: "Mental Math", url: "/assets/images/student_mental_vedic_maths.png" },
  { label: "Exam Hall Police", url: "/assets/images/police_bharti_exam_hall.png" },
  { label: "Aspirant Guide", url: "/assets/images/police_bharti_aspirant.png" },
  { label: "Calendar Mastery", url: "/assets/images/student_calendar_maths.png" },
];

const PDF_PRESETS = [
  { label: "Vedic Maths Workbook", url: "/assets/docs/vedic_maths_workbook.pdf" },
  { label: "Memory Handbook (Marathi)", url: "/assets/docs/memory_handbook_marathi.pdf" },
  { label: "Calendar Formula Booklet", url: "/assets/docs/calendar_formula_booklet.pdf" },
  { label: "Police Question Bank", url: "/assets/docs/police_bharti_question_bank.pdf" },
];

export default function NotesAndBooksManagerPage() {
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

  // Form Fields State
  const [accessMode, setAccessMode] = useState<"free" | "paid" | "course">("free");
  const [formCode, setFormCode] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formSubtitle, setFormSubtitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCourseId, setFormCourseId] = useState<string>("");
  const [formPrice, setFormPrice] = useState<number>(99);
  const [formOriginalPrice, setFormOriginalPrice] = useState<number>(299);
  const [formAccessMonths, setFormAccessMonths] = useState<number>(6);
  const [formPages, setFormPages] = useState<number>(24);
  const [formFileSizeMb, setFormFileSizeMb] = useState<number>(4.5);
  const [formCoverImage, setFormCoverImage] = useState<string>("/assets/images/vedic_maths_abacus_3d.png");
  const [formFilePath, setFormFilePath] = useState<string>("/assets/docs/vedic_maths_workbook.pdf");
  const [formStatus, setFormStatus] = useState<"live" | "draft" | "archived">("live");
  const [formTint, setFormTint] = useState<HeaderTint>("sky");
  const [formBadgeText, setFormBadgeText] = useState<string>("Bestseller Sutras");

  // Delete Confirmation Modal State
  const [deleteModalBook, setDeleteModalBook] = useState<Book | null>(null);

  const reload = () => {
    setStaff(getCurrentStaff());
    setCourses(getStaffCourses());
    setBooks(getStaffBooks());
    setIsLoading(false);
  };

  useEffect(() => {
    reload();

    async function fetchSupabaseBooks() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("books")
          .select("*, courses(title)")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
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
        } else if (!error && data && data.length === 0) {
          setBooks([]);
        }
      } catch (err) {
        console.warn("Could not load books from Supabase, using local store:", err);
      }
    }

    fetchSupabaseBooks();

    window.addEventListener("mma_staff_changed", reload);
    window.addEventListener("mma_books_changed", reload);
    return () => {
      window.removeEventListener("mma_staff_changed", reload);
      window.removeEventListener("mma_books_changed", reload);
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
    setFormCode(`BK-0${books.length + 1}`);
    setFormTitle("");
    setFormSubtitle("");
    setFormDescription("");
    setFormCourseId(courses[0]?.id || "");
    setFormPrice(99);
    setFormOriginalPrice(299);
    setFormAccessMonths(6);
    setFormPages(24);
    setFormFileSizeMb(4.5);
    setFormCoverImage("/assets/images/vedic_maths_abacus_3d.png");
    setFormFilePath("/assets/docs/vedic_maths_workbook.pdf");
    setFormStatus("live");
    setFormTint("mint");
    setFormBadgeText("Free Master Edition");
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

    setFormCode(book.code || `BK-${book.id.slice(0, 4)}`);
    setFormTitle(book.title);
    setFormSubtitle(book.subtitle || "");
    setFormDescription(book.description || "");
    setFormCourseId(book.courseId || courses[0]?.id || "");
    setFormPrice(book.pricePaise ? Math.round(book.pricePaise / 100) : 99);
    setFormOriginalPrice(book.originalPricePaise ? Math.round(book.originalPricePaise / 100) : 299);
    setFormAccessMonths(book.accessMonths || 6);
    setFormPages(book.pages || 24);
    setFormFileSizeMb(book.fileSizeMb || 4.5);
    setFormCoverImage(book.coverImage || "/assets/images/vedic_maths_abacus_3d.png");
    setFormFilePath(book.filePath);
    setFormStatus(book.status || "live");
    setFormTint(book.headerTint || "sky");
    setFormBadgeText(book.badgeText || "");
    setIsModalOpen(true);
  };

  const handleSaveBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error("Please enter a book title.");
      return;
    }

    const isFree = accessMode === "free";
    const courseId = accessMode === "course" ? formCourseId || null : null;
    const selectedCourse = courses.find((c) => c.id === courseId);

    const bookData: Book = {
      id: editingBook ? editingBook.id : `bk-${Date.now()}`,
      code: formCode.trim().toUpperCase() || `BK-${Date.now().toString().slice(-4)}`,
      courseId: courseId,
      courseTitle: selectedCourse ? selectedCourse.title : courseId ? "Associated Course" : "Standalone Digital Book",
      title: formTitle.trim(),
      subtitle: formSubtitle.trim() || undefined,
      description: formDescription.trim() || undefined,
      filePath: formFilePath.trim() || "/assets/docs/vedic_maths_workbook.pdf",
      pages: Number(formPages) || 1,
      fileSizeMb: Number(formFileSizeMb) || 4.5,
      coverImage: formCoverImage.trim() || "/assets/images/vedic_maths_abacus_3d.png",
      isFree,
      pricePaise: isFree ? 0 : formPrice * 100,
      originalPricePaise: isFree ? 0 : formOriginalPrice * 100,
      accessMonths: Number(formAccessMonths) || 6,
      status: formStatus,
      headerTint: formTint,
      badgeText: formBadgeText.trim() || (isFree ? "Free Edition" : "Premium Notes"),
      createdAt: editingBook?.createdAt || new Date().toISOString(),
    };

    saveStaffBook(bookData);
    setIsModalOpen(false);
    toast.success(editingBook ? "Book updated successfully!" : "New Book published successfully!");
    reload();
  };

  const handleDeleteConfirm = () => {
    if (!deleteModalBook) return;
    deleteStaffBook(deleteModalBook.id);
    toast.success(`Book "${deleteModalBook.title}" permanently deleted.`);
    setDeleteModalBook(null);
    reload();
  };

  // Filtered list
  const filteredBooks = books.filter((b) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      b.title.toLowerCase().includes(q) ||
      (b.subtitle && b.subtitle.toLowerCase().includes(q)) ||
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
                  Digital Books & Notes Hub
                </span>
                <span className="text-xs text-slate-400 font-semibold">• {books.length} Books Available</span>
              </div>
              <h2 className="text-2xl font-extrabold text-[#0E1B3D] font-heading">
                Digital Books &amp; Handbooks Manager
              </h2>
              <p className="text-xs text-[#5A6478] mt-1">
                Manage official MindMaster workbooks, formula booklets, standalone paid ebooks, and course study materials.
              </p>
            </div>

            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-bold rounded-full shadow-md transition-all shrink-0"
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
                placeholder="Search books by title, code (BK-01), course, or topic..."
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
              const tint = PASTEL_TINTS.find((t) => t.key === book.headerTint) || PASTEL_TINTS[1];
              const isFree = Boolean(book.isFree || book.pricePaise === 0);
              const isDraft = book.status === "draft";

              return (
                <div
                  key={book.id}
                  className={`bg-white rounded-3xl border transition-all duration-200 hover:shadow-lg flex flex-col justify-between overflow-hidden ${
                    isDraft ? "border-dashed border-amber-300" : "border-[#E4E8F8]"
                  }`}
                >
                  {/* Top Tint Header Strip */}
                  <div className={`p-4 ${tint.bg} border-b ${tint.border} flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${tint.dot}`} />
                      <span className="text-xs font-mono font-bold text-[#0E1B3D]">{book.code || "BK"}</span>
                      {book.badgeText && (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-white/80 text-[#0E1B3D] border border-black/5 shadow-xs">
                          {book.badgeText}
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
                      <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-sm">
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
                        {book.subtitle && (
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{book.subtitle}</p>
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

                      <a
                        href={book.filePath}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-[#0B57D0] hover:underline inline-flex items-center gap-1"
                      >
                        Preview PDF <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1">
                      {/* Toggle Free/Paid */}
                      <button
                        onClick={() => toggleBookPricing(book.id)}
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
                        onClick={() => toggleBookStatus(book.id)}
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

          {/* CREATE / EDIT BOOK PROPER WINDOW MODAL */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-[#E4E8F8] my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-blue-50 text-[#0B57D0]">
                      <BookOpen className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="text-lg font-bold text-[#0E1B3D]">
                        {editingBook ? "Edit Digital Book / Study Material" : "Publish New Digital Book"}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Configure pricing, course linkage, access validity, and PDF file source.
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
                          <span>1. Free for All</span>
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
                          <span>2. Paid Standalone</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          Sold separately with Razorpay checkout &amp; coupons.
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
                          <span>3. Course Included</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          Unlocked exclusively for enrolled course students.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Inputs (Visible when accessMode === 'paid') */}
                  {accessMode === "paid" && (
                    <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-3">
                      <div className="font-bold text-[#0B57D0] text-xs flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4" /> Paid Pricing &amp; Validity
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Selling Price (₹)</label>
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
                          <label className="block font-semibold text-slate-700 mb-1">Original Price (₹)</label>
                          <input
                            type="number"
                            min="1"
                            value={formOriginalPrice}
                            onChange={(e) => setFormOriginalPrice(Number(e.target.value))}
                            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Access Duration</label>
                          <select
                            value={formAccessMonths}
                            onChange={(e) => setFormAccessMonths(Number(e.target.value))}
                            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold"
                          >
                            <option value={3}>3 Months</option>
                            <option value={6}>6 Months (Recommended)</option>
                            <option value={12}>12 Months (1 Year)</option>
                            <option value={24}>24 Months (2 Years)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Course Dropdown (Visible when accessMode === 'course') */}
                  {accessMode === "course" && (
                    <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-200 space-y-3">
                      <div className="font-bold text-purple-900 text-xs flex items-center gap-1.5">
                        <Layers className="w-4 h-4" /> Link to Curriculum Course
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Select Associated Course *</label>
                        <select
                          value={formCourseId}
                          onChange={(e) => setFormCourseId(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-xs"
                          required
                        >
                          {courses.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.code} - {c.title} ({c.titleMr || ""})
                            </option>
                          ))}
                        </select>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Any student who buys or is granted this course will automatically have free access to read this book.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Basic Info: Code, Title, Subtitle */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-1">
                      <label className="block font-bold text-slate-700 mb-1">Book Code *</label>
                      <input
                        type="text"
                        required
                        placeholder="BK-01"
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-mono uppercase"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block font-bold text-slate-700 mb-1">Book Title (English / Marathi) *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Vedic Maths 16 Sutras Handbook"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Subtitle / Highlight</label>
                    <input
                      type="text"
                      placeholder="e.g. Complete Formula Guide & Shortcuts"
                      value={formSubtitle}
                      onChange={(e) => setFormSubtitle(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Description</label>
                    <textarea
                      rows={2}
                      placeholder="Detailed notes summary, target audience, and syllabus coverage..."
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl"
                    />
                  </div>

                  {/* Pages & Size */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Total Pages</label>
                      <input
                        type="number"
                        min="1"
                        value={formPages}
                        onChange={(e) => setFormPages(Number(e.target.value))}
                        className="w-full p-2.5 border border-slate-300 rounded-xl"
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
                        className="w-full p-2.5 border border-slate-300 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* PDF File Source */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">PDF File URL / Path *</label>
                    <input
                      type="text"
                      required
                      value={formFilePath}
                      onChange={(e) => setFormFilePath(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs"
                      placeholder="/assets/docs/vedic_maths_workbook.pdf"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="text-[10px] text-slate-400 font-bold self-center">Presets:</span>
                      {PDF_PRESETS.map((p) => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => setFormFilePath(p.url)}
                          className="text-[10px] px-2 py-0.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cover Image & Presets */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Cover Image URL</label>
                    <input
                      type="text"
                      value={formCoverImage}
                      onChange={(e) => setFormCoverImage(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="text-[10px] text-slate-400 font-bold self-center">Cover Presets:</span>
                      {COVER_PRESETS.map((cp) => (
                        <button
                          key={cp.label}
                          type="button"
                          onClick={() => setFormCoverImage(cp.url)}
                          className="text-[10px] px-2 py-0.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium"
                        >
                          {cp.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Header Tint & Status & Badge */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Header Tint</label>
                      <select
                        value={formTint}
                        onChange={(e) => setFormTint(e.target.value as HeaderTint)}
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                      >
                        {PASTEL_TINTS.map((t) => (
                          <option key={t.key} value={t.key}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Status</label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as any)}
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                      >
                        <option value="live">Live (Visible)</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Badge Text</label>
                      <input
                        type="text"
                        placeholder="e.g. Bestseller Sutras"
                        value={formBadgeText}
                        onChange={(e) => setFormBadgeText(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Modal Footer Actions */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-[#0B57D0] hover:bg-[#0842A0] text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{editingBook ? "Save Changes" : "Publish Book"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* DELETE CONFIRMATION MODAL */}
          {deleteModalBook && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0E1B3D]">Delete Digital Book?</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Are you sure you want to permanently delete &quot;{deleteModalBook.title}&quot;? This cannot be undone.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDeleteModalBook(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md"
                  >
                    Yes, Delete
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
