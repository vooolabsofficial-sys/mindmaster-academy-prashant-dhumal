import { openDB, IDBPDatabase } from "idb";
import { Book } from "./types";

const DB_NAME = "mindmaster_offline_db";
const DB_VERSION = 2;

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
      },
    });
  }
  return dbPromise;
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
