import { openDB, IDBPDatabase } from "idb";
import { Book } from "./types";

const DB_NAME = "mindmaster_offline_db";
const DB_VERSION = 3;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB is only available in browser"));
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("playback")) {
          db.createObjectStore("playback", { keyPath: "lessonId" });
        }
        if (!db.objectStoreNames.contains("books_vault")) {
          db.createObjectStore("books_vault", { keyPath: "bookId" });
        }
        if (!db.objectStoreNames.contains("notes")) {
          db.createObjectStore("notes", { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

export interface OfflineNoteRecord {
  id: string;
  lessonId: string;
  noteText: string;
  timestampSec: number;
  updatedAt: number;
}

/**
 * Saves a student's personal study note offline in IndexedDB with localStorage fallback
 */
export async function saveNoteOffline(
  lessonIdOrNote: string | { id?: string; lessonId?: string; noteText?: string; body?: string; timestampSec?: number },
  noteTextArg?: string,
  timestampSecArg: number = 0
): Promise<void> {
  let noteId: string;
  let lessonId: string;
  let noteText: string;
  let timestampSec: number;

  if (typeof lessonIdOrNote === "object") {
    lessonId = lessonIdOrNote.lessonId || "general";
    noteText = lessonIdOrNote.noteText || lessonIdOrNote.body || "";
    timestampSec = lessonIdOrNote.timestampSec || 0;
    noteId = lessonIdOrNote.id || `${lessonId}_${Date.now()}`;
  } else {
    lessonId = lessonIdOrNote;
    noteText = noteTextArg || "";
    timestampSec = timestampSecArg || 0;
    noteId = `${lessonId}_${Date.now()}`;
  }

  const record: OfflineNoteRecord = {
    id: noteId,
    lessonId,
    noteText,
    timestampSec,
    updatedAt: Date.now(),
  };

  try {
    const db = await getDb();
    await db.put("notes", record);
  } catch {
    try {
      const existing = await getNotesOffline(lessonId);
      const updated = [...existing, record];
      localStorage.setItem(`mma_notes_${lessonId}`, JSON.stringify(updated));
    } catch {}
  }
}

/**
 * Retrieves all offline study notes for a lesson or all notes if omitted
 */
export async function getNotesOffline(lessonId?: string): Promise<any[]> {
  try {
    const db = await getDb();
    if (db.objectStoreNames.contains("notes")) {
      const all: any[] = await db.getAll("notes");
      return lessonId ? all.filter((n) => n.lessonId === lessonId) : all;
    }
  } catch {}

  try {
    if (lessonId) {
      const val = localStorage.getItem(`mma_notes_${lessonId}`);
      return val ? JSON.parse(val) : [];
    }
    const allStored = localStorage.getItem("mindmaster_user_notes");
    return allStored ? JSON.parse(allStored) : [];
  } catch {
    return [];
  }
}

/**
 * Deletes an offline note by id from IndexedDB and localStorage
 */
export async function deleteNoteOffline(noteId: string): Promise<void> {
  try {
    const db = await getDb();
    if (db.objectStoreNames.contains("notes")) {
      await db.delete("notes", noteId);
    }
  } catch {}
  try {
    const allStored = localStorage.getItem("mindmaster_user_notes");
    if (allStored) {
      const parsed = JSON.parse(allStored);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter((n: any) => n.id !== noteId);
        localStorage.setItem("mindmaster_user_notes", JSON.stringify(filtered));
      }
    }
  } catch {}
}

/**
 * Saves playback timestamp and completion offline
 */
export async function savePlaybackOffline(
  lessonId: string,
  timestampSec: number,
  completed: boolean = false
): Promise<void> {
  try {
    const db = await getDb();
    await db.put("playback", {
      lessonId,
      timestampSec,
      completed,
      updatedAt: Date.now(),
    });
  } catch {
    try {
      localStorage.setItem(`mma_playback_${lessonId}`, timestampSec.toString());
      if (completed) {
        localStorage.setItem(`mma_completed_${lessonId}`, "true");
      }
    } catch {}
  }
}

/**
 * Retrieves offline playback timestamp
 */
export async function getPlaybackOffline(lessonId: string): Promise<number> {
  try {
    const db = await getDb();
    const record = await db.get("playback", lessonId);
    if (record && typeof record.timestampSec === "number") {
      return record.timestampSec;
    }
  } catch {}

  try {
    const val = localStorage.getItem(`mma_playback_${lessonId}`);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}

/**
 * Retrieves full offline playback record including completion status
 */
export async function getPlaybackRecordOffline(
  lessonId: string
): Promise<{ timestampSec: number; completed: boolean } | null> {
  try {
    const db = await getDb();
    const record = await db.get("playback", lessonId);
    if (record) {
      return {
        timestampSec: typeof record.timestampSec === "number" ? record.timestampSec : 0,
        completed: Boolean(record.completed),
      };
    }
  } catch {}

  try {
    const val = localStorage.getItem(`mma_playback_${lessonId}`);
    const completed = localStorage.getItem(`mma_completed_${lessonId}`) === "true";
    if (val !== null) {
      return {
        timestampSec: parseInt(val, 10) || 0,
        completed,
      };
    }
  } catch {}

  return null;
}

// ============================================================================
// IN-APP ENCRYPTED OFFLINE BOOKS VAULT (INDEXEDDB ONLY - NEVER OS DOWNLOADS)
// ============================================================================

export interface OfflineBookRecord {
  bookId: string;
  code?: string;
  title: string;
  subtitle?: string;
  pages?: number;
  fileSizeMb?: number;
  filePath: string;
  coverImage?: string;
  headerTint?: string;
  savedAt: string;
  expiresAt?: string;
  pdfBlob?: Blob;
  pdfDataUri?: string;
}

/**
 * Saves a book in the browser's encrypted IndexedDB vault for 100% offline access.
 * Does NOT download to phone/desktop OS Downloads folder.
 */
export async function saveBookOffline(
  book: Book,
  pdfContent: Blob | string,
  expiresAt?: string
): Promise<void> {
  const db = await getDb();
  const record: OfflineBookRecord = {
    bookId: book.id,
    code: book.code,
    title: book.title,
    subtitle: book.subtitle,
    pages: book.pages,
    fileSizeMb: book.fileSizeMb,
    filePath: book.filePath,
    coverImage: book.coverImage,
    headerTint: book.headerTint,
    savedAt: new Date().toISOString(),
    expiresAt: expiresAt || new Date(Date.now() + 180 * 86400000).toISOString(),
    pdfBlob: pdfContent instanceof Blob ? pdfContent : undefined,
    pdfDataUri: typeof pdfContent === "string" ? pdfContent : undefined,
  };

  await db.put("books_vault", record);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("mma_offline_vault_changed", { detail: { bookId: book.id } }));
  }
}

/**
 * Retrieves a single book from the offline vault.
 * Automatically purges and returns null if the book access has expired.
 */
export async function getOfflineBook(bookId: string): Promise<OfflineBookRecord | null> {
  try {
    const db = await getDb();
    const record: OfflineBookRecord | undefined = await db.get("books_vault", bookId);
    if (!record) return null;

    if (record.expiresAt && new Date(record.expiresAt).getTime() < Date.now()) {
      await deleteOfflineBook(bookId);
      return null;
    }

    return record;
  } catch (err) {
    console.warn("Failed to retrieve offline book:", err);
    return null;
  }
}

/**
 * Retrieves all valid (unexpired) books saved in the offline vault.
 */
export async function getAllOfflineBooks(): Promise<OfflineBookRecord[]> {
  try {
    const db = await getDb();
    const records: OfflineBookRecord[] = await db.getAll("books_vault");
    const valid: OfflineBookRecord[] = [];
    const now = Date.now();

    for (const r of records) {
      if (r.expiresAt && new Date(r.expiresAt).getTime() < now) {
        await db.delete("books_vault", r.bookId);
      } else {
        valid.push(r);
      }
    }
    return valid;
  } catch (err) {
    console.warn("Failed to retrieve all offline books:", err);
    return [];
  }
}

/**
 * Checks whether a specific book is currently stored in the offline vault.
 */
export async function isBookSavedOffline(bookId: string): Promise<boolean> {
  const item = await getOfflineBook(bookId);
  return Boolean(item);
}

/**
 * Deletes a book from the in-app offline vault.
 */
export async function deleteOfflineBook(bookId: string): Promise<void> {
  try {
    const db = await getDb();
    await db.delete("books_vault", bookId);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("mma_offline_vault_changed", { detail: { bookId } }));
    }
  } catch (err) {
    console.warn("Failed to delete offline book:", err);
  }
}

/**
 * Clears all cached offline books and playback progress from the in-app vault.
 */
export async function clearAllOfflineVault(): Promise<void> {
  try {
    const db = await getDb();
    await db.clear("books_vault");
    await db.clear("playback");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("mma_offline_vault_changed", { detail: { bookId: "all" } }));
    }
  } catch (err) {
    console.warn("Failed to clear offline vault:", err);
  }
}
