import { openDB, IDBPDatabase } from "idb";
import { Note } from "./types";

const DB_NAME = "mindmaster_offline_db";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB is only available in browser"));
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("notes")) {
          db.createObjectStore("notes", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("playback")) {
          db.createObjectStore("playback", { keyPath: "lessonId" });
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Saves a student study note to IndexedDB with localStorage fallback
 */
export async function saveNoteOffline(note: Note): Promise<void> {
  try {
    const db = await getDb();
    await db.put("notes", note);
  } catch (err) {
    // Graceful fallback to localStorage
    try {
      const stored = JSON.parse(localStorage.getItem("mindmaster_user_notes") || "[]");
      const filtered = stored.filter((n: Note) => n.id !== note.id);
      localStorage.setItem("mindmaster_user_notes", JSON.stringify([note, ...filtered]));
    } catch {}
  }
}

/**
 * Retrieves all offline study notes from IndexedDB with localStorage fallback
 */
export async function getNotesOffline(): Promise<Note[]> {
  try {
    const db = await getDb();
    const notes = await db.getAll("notes");
    if (notes && notes.length > 0) {
      return notes;
    }
  } catch {}

  // Fallback to localStorage
  try {
    const stored = JSON.parse(localStorage.getItem("mindmaster_user_notes") || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

/**
 * Deletes a note from IndexedDB
 */
export async function deleteNoteOffline(noteId: string): Promise<void> {
  try {
    const db = await getDb();
    await db.delete("notes", noteId);
  } catch (err) {
    try {
      const stored = JSON.parse(localStorage.getItem("mindmaster_user_notes") || "[]");
      const filtered = stored.filter((n: Note) => n.id !== noteId);
      localStorage.setItem("mindmaster_user_notes", JSON.stringify(filtered));
    } catch {}
  }
}

/**
 * Saves playback timestamp offline so learners in rural areas never lose their place
 */
export async function savePlaybackOffline(lessonId: string, timestampSec: number): Promise<void> {
  try {
    const db = await getDb();
    await db.put("playback", { lessonId, timestampSec, updatedAt: Date.now() });
  } catch {
    try {
      localStorage.setItem(`mma_playback_${lessonId}`, timestampSec.toString());
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
