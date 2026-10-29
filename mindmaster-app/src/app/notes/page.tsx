"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { 
  FileText, 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ExternalLink, 
  Play, 
  Save, 
  Search, 
  AlertCircle,
  Video,
  ArrowRight,
  Download,
  ZoomIn,
  ZoomOut,
  X
} from "lucide-react";
import AppShell from "@/components/navigation/AppShell";
import PiracyShield from "@/components/common/PiracyShield";
import { MOCK_COURSES, MOCK_LESSONS, MOCK_BOOKS } from "@/lib/mockData";
import { Note, Book, calculateAllowedWords } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { saveNoteOffline, getNotesOffline, deleteNoteOffline } from "@/lib/offlineStorage";

export default function NotesWorkspacePage() {
  const [activeTab, setActiveTab] = useState<"notes" | "books">("notes");
  const [notesList, setNotesList] = useState<Note[]>([]);
  const [booksList, setBooksList] = useState<Book[]>(MOCK_BOOKS);
  const [readingBook, setReadingBook] = useState<Book | null>(null);
  const [pdfZoom, setPdfZoom] = useState<number>(100);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState("all");

  // Editor State
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState<string>("");
  const [noteBody, setNoteBody] = useState<string>("");
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>("MM-01");
  const [selectedLessonId, setSelectedLessonId] = useState<string>("les-101");
  const [timestampSec, setTimestampSec] = useState<number>(0);

  // Autosave status
  const [saveStatus, setSaveStatus] = useState<"idle" | "typing" | "saving" | "saved">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [savedTimeLabel, setSavedTimeLabel] = useState<string>("All changes saved");

  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  // Available lessons based on selected course
  const currentLessons = MOCK_LESSONS.filter(
    (l) => {
      const course = MOCK_COURSES.find((c) => c.code === selectedCourseCode);
      return course ? l.courseId === course.id : true;
    }
  );

  // Current lesson selected in editor
  const activeLesson = MOCK_LESSONS.find((l) => l.id === selectedLessonId) || currentLessons[0] || MOCK_LESSONS[0];
  const maxWordsAllowed = calculateAllowedWords(activeLesson?.durationSec || 720);

  // Calculate live word count of editor body
  const currentWordCount = noteBody.trim() ? noteBody.trim().split(/\s+/).length : 0;
  const isNearLimit = currentWordCount >= maxWordsAllowed - 25;
  const isOverLimit = currentWordCount >= maxWordsAllowed;

  // Format seconds to mm:ss
  const formatTime = (sec?: number) => {
    if (sec === undefined || sec === null) return "00:00";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Helper to compute human-friendly relative saved time
  const updateSavedTimeLabel = useCallback((date: Date | null) => {
    if (!date) {
      setSavedTimeLabel("Unsaved");
      return;
    }
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSec < 10) {
      setSavedTimeLabel("Saved just now");
    } else if (diffSec < 60) {
      setSavedTimeLabel(`Saved ${diffSec}s ago`);
    } else {
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin === 1) {
        setSavedTimeLabel("Saved 1 min ago");
      } else if (diffMin < 60) {
        setSavedTimeLabel(`Saved ${diffMin} min ago`);
      } else {
        const diffHours = Math.floor(diffMin / 60);
        setSavedTimeLabel(`Saved ${diffHours}h ago`);
      }
    }
  }, []);

  // Periodic ticker for "Saved x min ago"
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastSavedAt) {
        updateSavedTimeLabel(lastSavedAt);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [lastSavedAt, updateSavedTimeLabel]);

  // Load user notes from localStorage and Supabase on mount
  useEffect(() => {
    async function loadUserNotes() {
      // 1. Check IndexedDB / local storage first (instant offline responsiveness)
      try {
        const idbNotes = await getNotesOffline();
        if (idbNotes && idbNotes.length > 0) {
          setNotesList(idbNotes);
        } else {
          const stored = localStorage.getItem("mindmaster_user_notes");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setNotesList(parsed);
            }
          }
        }
      } catch (e) {}

      // 2. Check Supabase
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data, error } = await supabase
            .from("notes")
            .select("*")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false });

          if (!error && data && data.length > 0) {
            const loaded: Note[] = data.map((n: any) => ({
              id: n.id,
              userId: n.user_id,
              courseId: n.course_id,
              courseCode: n.course_code || "MM-01",
              courseTitle: n.course_title || "Memory Science",
              lessonId: n.lesson_id || "les-101",
              lessonTitle: n.lesson_title || "Lecture Lesson",
              timestampSec: n.timestamp_sec || 0,
              title: n.title,
              body: n.body,
              wordCount: n.word_count || (n.body ? n.body.trim().split(/\s+/).length : 0),
              maxWordsAllowed: n.max_words_allowed || 300,
              updatedAt: new Date(n.updated_at).toLocaleDateString("en-IN"),
            }));

            // Merge with local storage notes
            setNotesList((prev) => {
              const combined = [...loaded];
              prev.forEach((p) => {
                if (!combined.some((c) => c.id === p.id)) {
                  combined.push(p);
                }
              });
              return combined;
            });
          }
        }
      } catch (err) {
        // Fallback to local storage
      }
    }

    loadUserNotes();
  }, []);

  // Handle controlled textarea input with strict word count capping
  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const words = text.trim().split(/\s+/).filter(Boolean);

    if (words.length > maxWordsAllowed) {
      // Clamp text to max allowed words to prevent hanging the system
      const allowedText = words.slice(0, maxWordsAllowed).join(" ");
      setNoteBody(allowedText);
    } else {
      setNoteBody(text);
    }
  };

  // Persist note to State, LocalStorage, and Supabase
  const persistNote = useCallback(
    async (titleToSave: string, bodyToSave: string, idToSave?: string | null) => {
      if (!titleToSave.trim() && !bodyToSave.trim()) return;

      setSaveStatus("saving");
      const targetId = idToSave || editingNoteId || `note-${Date.now()}`;
      const now = new Date();

      const words = bodyToSave.trim().split(/\s+/).filter(Boolean);
      const safeBody = words.slice(0, maxWordsAllowed).join(" ");
      const wordsCount = words.length;

      const courseObj = MOCK_COURSES.find((c) => c.code === selectedCourseCode);
      const lessonObj = MOCK_LESSONS.find((l) => l.id === selectedLessonId);

      const updatedNoteItem: Note = {
        id: targetId,
        userId: "user-current",
        courseCode: selectedCourseCode,
        courseTitle: courseObj?.title || "Memory Science",
        lessonId: selectedLessonId,
        lessonTitle: lessonObj?.title || "Lecture Lesson",
        timestampSec: timestampSec,
        title: titleToSave.trim() || "Untitled Lecture Note",
        body: safeBody,
        wordCount: wordsCount,
        maxWordsAllowed: maxWordsAllowed,
        updatedAt: "Just now",
      };

      // 1. Update React state
      setNotesList((prevNotes) => {
        const exists = prevNotes.some((n) => n.id === targetId);
        let nextNotes: Note[];
        if (exists) {
          nextNotes = prevNotes.map((n) => (n.id === targetId ? updatedNoteItem : n));
        } else {
          nextNotes = [updatedNoteItem, ...prevNotes];
        }
        // Save to localStorage and IndexedDB
        localStorage.setItem("mindmaster_user_notes", JSON.stringify(nextNotes));
        saveNoteOffline(updatedNoteItem).catch(() => {});
        return nextNotes;
      });

      if (!editingNoteId) {
        setEditingNoteId(targetId);
      }

      // 2. Persist to Supabase if authenticated
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("notes").upsert({
            id: targetId.startsWith("note-") ? undefined : targetId,
            user_id: user.id,
            title: updatedNoteItem.title,
            body: updatedNoteItem.body,
            course_title: updatedNoteItem.courseTitle,
            updated_at: now.toISOString(),
          });
        }
      } catch (err) {}

      setLastSavedAt(now);
      setSaveStatus("saved");
      updateSavedTimeLabel(now);
    },
    [editingNoteId, maxWordsAllowed, selectedCourseCode, selectedLessonId, timestampSec, updateSavedTimeLabel]
  );

  // 2-Second Debounce Autosave Effect
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!noteTitle && !noteBody) return;

    setSaveStatus("typing");

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      persistNote(noteTitle, noteBody);
    }, 2000);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        // Flush pending note immediately on unmount so no input is lost
        persistNote(noteTitle, noteBody);
      }
    };
  }, [noteTitle, noteBody, persistNote]);

  // Prevent data loss if browser or tab is closed while typing
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (noteTitle.trim() || noteBody.trim()) {
        persistNote(noteTitle, noteBody);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [noteTitle, noteBody, persistNote]);

  // Manual save
  const handleManualSave = () => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    persistNote(noteTitle, noteBody);
    toast.success("αñàαñ¡αÑìαñ»αñ╛αñ╕ αñƒαÑÇαñ¬ αñ╕αÑçαñ╡αÑìαñ╣ αñ¥αñ╛αñ▓αÑÇ (Note saved offline!)", { id: "note-save-toast" });
  };

  // Reset editor for a new note
  const handleStartNewNote = () => {
    setEditingNoteId(null);
    setNoteTitle("");
    setNoteBody("");
    setTimestampSec(0);
    setSaveStatus("idle");
    setLastSavedAt(null);
    setSavedTimeLabel("New Note (Unsaved)");
  };

  // Edit existing note
  const handleEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setNoteTitle(note.title);
    setNoteBody(note.body);
    if (note.courseCode) setSelectedCourseCode(note.courseCode);
    if (note.lessonId) setSelectedLessonId(note.lessonId);
    if (note.timestampSec !== undefined) setTimestampSec(note.timestampSec);
    setSaveStatus("saved");
    setLastSavedAt(new Date());
    setSavedTimeLabel("Editing Note");

    window.scrollTo({ top: 80, behavior: "smooth" });
  };

  // Delete note
  const handleDeleteNote = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this note?")) {
      setNotesList((prev) => {
        const next = prev.filter((n) => n.id !== id);
        localStorage.setItem("mindmaster_user_notes", JSON.stringify(next));
        deleteNoteOffline(id).catch(() => {});
        toast.info("αñƒαÑÇαñ¬ αñ╣αñƒαñ╡αñ▓αÑÇ (Note removed)", { id: "note-delete" });
        return next;
      });

      if (editingNoteId === id) {
        handleStartNewNote();
      }

      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user && !id.startsWith("note-")) {
          await supabase.from("notes").delete().eq("id", id).eq("user_id", user.id);
        }
      } catch (e) {}
    }
  };

  // Filtered notes
  const filteredNotes = notesList.filter((note) => {
    const matchesCourse = 
      selectedCourseFilter === "all" || 
      note.courseCode === selectedCourseFilter ||
      (selectedCourseFilter === "MM-01" && !note.courseCode);

    const matchesSearch = 
      !searchQuery.trim() ||
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.lessonTitle && note.lessonTitle.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCourse && matchesSearch;
  });

  return (
    <AppShell>
      <PiracyShield contentType="notes">
        <title>My Lecture Notes | MindMaster Academy</title>
        <meta 
          name="description" 
          content="Personal lecture study notes recorded during video sessions. Prashant Dhumal MindMaster Academy." 
        />

        <div className="flex flex-col gap-6 max-w-7xl mx-auto select-none">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Lecture Study Notes
              </span>
              <span className="text-xs text-slate-400 font-semibold">ΓÇó</span>
              <span className="text-xs text-slate-600 font-bold">{notesList.length} Total Notes Saved</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              My Lecture Notes &amp; Insights
            </h1>
            <p className="text-xs md:text-sm text-slate-600 font-medium mt-1">
              Notes taken live while watching lectures are automatically synced here with video timestamps and word count protections.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("notes")}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === "notes"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Personal Notes</span>
            </button>

            <button
              onClick={() => setActiveTab("books")}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === "books"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Course Books &amp; PDFs</span>
            </button>

            {activeTab === "notes" && (
              <button
                onClick={handleStartNewNote}
                className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Note</span>
              </button>
            )}
          </div>
        </div>

        {activeTab === "notes" ? (
          <>
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Course Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: "all", label: "All Notes" },
              { id: "MM-01", label: "Memory Science (MM-01)" },
              { id: "MM-02", label: "Train Trainer (MM-02)" },
              { id: "MM-03", label: "Police Bharti (MM-03)" },
              { id: "MM-04", label: "500-Yr Calendar (MM-04)" },
              { id: "MM-05", label: "Vedic Maths (MM-05)" },
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => setSelectedCourseFilter(chip.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedCourseFilter === chip.id
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search keyword, formula..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
            />
          </div>
        </div>

        {/* Workspace Grid: Left Editor + Right Notes List */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Interactive Live Note Editor (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4 sticky top-24">
            <div className="bg-white rounded-3xl p-6 border-2 border-blue-100 shadow-xs flex flex-col gap-4">
              {/* Editor Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">
                      {editingNoteId ? "Edit Lecture Note" : "Write Study Note"}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Protected with dynamic word limits
                    </p>
                  </div>
                </div>

                {/* Autosave Status */}
                <div className="text-[11px] font-bold">
                  {saveStatus === "typing" && (
                    <span className="text-amber-600 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      Typing...
                    </span>
                  )}
                  {saveStatus === "saving" && (
                    <span className="text-blue-600 flex items-center gap-1">
                      <Clock className="w-3 h-3 animate-spin" />
                      Saving...
                    </span>
                  )}
                  {saveStatus === "saved" && (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {savedTimeLabel}
                    </span>
                  )}
                  {saveStatus === "idle" && (
                    <span className="text-slate-400">{savedTimeLabel}</span>
                  )}
                </div>
              </div>

              {/* Course & Lesson Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Course Code
                  </label>
                  <select
                    value={selectedCourseCode}
                    onChange={(e) => {
                      setSelectedCourseCode(e.target.value);
                      const course = MOCK_COURSES.find((c) => c.code === e.target.value);
                      const firstLes = MOCK_LESSONS.find((l) => course && l.courseId === course.id);
                      if (firstLes) setSelectedLessonId(firstLes.id);
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="MM-01">MM-01 Memory Science</option>
                    <option value="MM-02">MM-02 Train the Trainer</option>
                    <option value="MM-03">MM-03 Police Bharti</option>
                    <option value="MM-04">MM-04 500-Yr Calendar</option>
                    <option value="MM-05">MM-05 Vedic Maths</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Video Lesson Reference
                  </label>
                  <select
                    value={selectedLessonId}
                    onChange={(e) => setSelectedLessonId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 truncate"
                  >
                    {currentLessons.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title} ({Math.round(l.durationSec / 60)} min)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Note Title Input */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Note Title
                </label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="e.g. Major Memory System: 1-10 Pegs..."
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Note Content Textarea with Dynamic Word Limit Enforcement */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-700">
                    Lecture Notes &amp; Rules
                  </label>
                  {/* Dynamic Word Limit Badge */}
                  <div
                    className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                      isOverLimit
                        ? "bg-red-50 text-red-700 border-red-200"
                        : isNearLimit
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}
                  >
                    <span>
                      {currentWordCount} / {maxWordsAllowed} Words
                    </span>
                    {isOverLimit && <AlertCircle className="w-3 h-3 text-red-600" />}
                  </div>
                </div>

                <textarea
                  value={noteBody}
                  onChange={handleBodyChange}
                  placeholder={`Write your lecture notes here. Maximum ${maxWordsAllowed} words allowed based on lesson duration to maintain app speed...`}
                  rows={8}
                  className={`w-full p-3.5 rounded-2xl bg-slate-50 border text-xs text-slate-800 leading-relaxed placeholder-slate-400 focus:outline-none ${
                    isOverLimit
                      ? "border-red-400 focus:border-red-500 bg-red-50/20"
                      : "border-slate-200 focus:border-blue-500"
                  }`}
                />

                {/* Progress bar visualizer */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-200 ${
                      isOverLimit
                        ? "bg-red-500"
                        : isNearLimit
                        ? "bg-amber-500"
                        : "bg-blue-600"
                    }`}
                    style={{
                      width: `${Math.min(100, (currentWordCount / maxWordsAllowed) * 100)}%`,
                    }}
                  />
                </div>

                <p className="text-[10px] text-slate-500 mt-1 font-medium">
                  * Limit is calibrated to lesson duration ({Math.round(activeLesson?.durationSec / 60)} min video) to keep the app lightning fast.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                {editingNoteId ? (
                  <button
                    onClick={handleStartNewNote}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 transition cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400 font-medium">
                    Autosaves every 2 seconds
                  </span>
                )}

                <button
                  onClick={handleManualSave}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer ml-auto"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Note</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Synced Lecture Notes List (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  Notes List ({filteredNotes.length})
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Click any note to edit or jump to the exact video lecture timestamp
                </p>
              </div>

              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                {filteredNotes.length} Found
              </span>
            </div>

            {filteredNotes.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center flex flex-col items-center justify-center gap-3 shadow-2xs">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <FileText className="w-6 h-6" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-900">No notes found</h4>
                <p className="text-xs text-slate-500 max-w-sm">
                  {searchQuery 
                    ? `No notes match "${searchQuery}". Try changing your search query or filter.` 
                    : "No lecture notes created yet. You can write notes while watching lectures in the video player or right here in this editor."}
                </p>
                <button
                  onClick={handleStartNewNote}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-xs hover:bg-blue-700 transition"
                >
                  Write First Note
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3.5">
                {filteredNotes.map((note) => {
                  const isEditing = editingNoteId === note.id;
                  const wordCount = note.wordCount || (note.body ? note.body.trim().split(/\s+/).length : 0);
                  const maxLimit = note.maxWordsAllowed || 300;

                  return (
                    <div
                      key={note.id}
                      className={`p-5 rounded-3xl border transition flex flex-col gap-3 shadow-xs ${
                        isEditing
                          ? "bg-blue-50/50 border-blue-400 ring-2 ring-blue-500/20"
                          : "bg-white border-slate-200 hover:border-blue-300"
                      }`}
                    >
                      {/* Note Top Bar: Course Badge, Lesson Badge, Timestamp & Word Count */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {note.courseCode && (
                            <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                              {note.courseCode}
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200 truncate max-w-[200px]">
                            {note.lessonTitle || note.courseTitle}
                          </span>
                          {note.timestampSec !== undefined && note.timestampSec > 0 && (
                            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              at {formatTime(note.timestampSec)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Word count badge */}
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                            {wordCount} / {maxLimit} words
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {note.updatedAt}
                          </span>
                        </div>
                      </div>

                      {/* Note Title & Content */}
                      <div>
                        <h4 className="font-extrabold text-sm md:text-base text-slate-900 mb-1">
                          {note.title}
                        </h4>
                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-normal">
                          {note.body}
                        </p>
                      </div>

                      {/* Bottom Action Row: Jump to Video Lecture + Edit + Delete */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-1">
                        {/* Video Lecture Deep Link */}
                        {note.lessonId ? (
                          <Link
                            href={`/watch/${note.lessonId}${note.timestampSec ? `?t=${note.timestampSec}` : ""}`}
                            className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition inline-flex items-center gap-1.5 shadow-2xs"
                          >
                            <Play className="w-3 h-3 fill-blue-700 text-blue-700" />
                            <span>
                              Jump to Video Lecture {note.timestampSec ? `(${formatTime(note.timestampSec)})` : ""}
                            </span>
                          </Link>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">
                            Course Reference Note
                          </span>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditNote(note)}
                            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3 text-blue-600" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1.5 rounded-xl text-red-500 hover:bg-red-50 transition cursor-pointer"
                            title="Delete note"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </>
    ) : (
      /* Books & PDFs Tab */
      <div className="flex flex-col gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Official Course Handbooks &amp; PDF Library
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Read online in high resolution or download study materials for offline revision.
            </p>
          </div>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-full shadow-2xs">
            {booksList.length} Verified Books Available
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {booksList.map((book) => (
            <div
              key={book.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between gap-4"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                    {book.courseTitle}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {book.pages} Pages
                  </span>
                </div>
                <h3 className="font-extrabold text-base text-slate-900 line-clamp-2 mt-1">
                  {book.title}
                </h3>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    setReadingBook(book);
                    setPdfZoom(100);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-blue-500/20"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Read PDF</span>
                </button>

                <a
                  href={book.filePath}
                  download
                  className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                  title="Download PDF"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* PDF Reader Modal */}
    {readingBook && (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-6 animate-fade-in">
        <div className="bg-white rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
          {/* Modal Top Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-sm text-slate-900 truncate">
                  {readingBook.title}
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  {readingBook.courseTitle} ΓÇó {readingBook.pages} Pages
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPdfZoom((prev) => Math.max(60, prev - 15))}
                className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold text-slate-600 px-1">
                {pdfZoom}%
              </span>
              <button
                onClick={() => setPdfZoom((prev) => Math.min(180, prev + 15))}
                className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <a
                href={readingBook.filePath}
                download
                className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition ml-2 cursor-pointer"
                title="Download PDF"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                onClick={() => setReadingBook(null)}
                className="p-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition ml-1 cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* PDF Viewer Body */}
          <div className="flex-1 bg-slate-100 overflow-auto flex items-center justify-center p-4">
            <iframe
              src={`${readingBook.filePath}#zoom=${pdfZoom}`}
              className="w-full h-full rounded-xl border border-slate-300 shadow-inner bg-white"
              title={readingBook.title}
            />
          </div>
        </div>
      </div>
    )}
  </div>
  </PiracyShield>
</AppShell>
  );
}
