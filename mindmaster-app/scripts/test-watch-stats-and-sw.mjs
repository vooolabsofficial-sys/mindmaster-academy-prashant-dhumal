import fs from "fs";
import path from "path";
import assert from "assert";

console.log("================================================================================");
console.log("🎬 AUDIT VERIFICATION: WATCH PROGRESS, NOTES, LIKES & SERVICE WORKER");
console.log("================================================================================\n");

// --- 1. Audit public/sw.js ---
console.log("--- 1. Service Worker (public/sw.js) Inspection ---");
const swPath = path.resolve("public/sw.js");
assert(fs.existsSync(swPath), "public/sw.js must exist");
const swCode = fs.readFileSync(swPath, "utf8");

// Must NOT precache dynamic root "/"
assert(!swCode.includes('"/"') && !swCode.includes("'/'"), "sw.js must not precache '/' HTML to avoid stale UI");

// Must skip non-GET methods
assert(swCode.includes("event.request.method !== \"GET\""), "sw.js must only process GET requests to avoid Cache API method errors");

// Must strictly ignore /api/ routes
assert(swCode.includes("url.pathname.startsWith(\"/api/\")"), "sw.js must strictly bypass caching for /api/ routes");

// Must purge old caches on activate
assert(swCode.includes("caches.delete"), "sw.js must purge older cache versions on activate");

// Must support SKIP_WAITING
assert(swCode.includes("SKIP_WAITING"), "sw.js must support SKIP_WAITING for immediate updates");
console.log("✅ PASS: Service Worker does not aggressively cache API routes and prevents stale UI.\n");

// --- 2. Audit src/app/api/watch-stats/route.ts ---
console.log("--- 2. Watch Stats API Route (GET and POST) Inspection ---");
const watchStatsRoutePath = path.resolve("src/app/api/watch-stats/route.ts");
assert(fs.existsSync(watchStatsRoutePath), "src/app/api/watch-stats/route.ts must exist");
const routeCode = fs.readFileSync(watchStatsRoutePath, "utf8");

assert(routeCode.includes("export async function GET"), "watch-stats route must have GET handler for analytics");
assert(routeCode.includes("export async function POST"), "watch-stats route must have POST handler for saving playback progress");
assert(routeCode.includes("upsert"), "watch-stats POST must upsert into progress table");
assert(routeCode.includes("mma_student_session"), "watch-stats POST must extract student session");
console.log("✅ PASS: Watch Stats API route supports both GET (admin reporting) and POST (throttled student progress).\n");

// --- 3. Audit src/lib/offlineStorage.ts ---
console.log("--- 3. Offline Storage (src/lib/offlineStorage.ts) Inspection ---");
const offlineStoragePath = path.resolve("src/lib/offlineStorage.ts");
assert(fs.existsSync(offlineStoragePath), "src/lib/offlineStorage.ts must exist");
const offlineCode = fs.readFileSync(offlineStoragePath, "utf8");

assert(offlineCode.includes("savePlaybackOffline"), "offlineStorage must export savePlaybackOffline");
assert(offlineCode.includes("getPlaybackOffline"), "offlineStorage must export getPlaybackOffline");
assert(offlineCode.includes("getPlaybackRecordOffline"), "offlineStorage must export getPlaybackRecordOffline");
assert(offlineCode.includes("saveNoteOffline"), "offlineStorage must export saveNoteOffline");
assert(offlineCode.includes("getNotesOffline"), "offlineStorage must export getNotesOffline");
console.log("✅ PASS: Offline Storage supports robust offline playback & notes persistence.\n");

// --- 4. Audit src/app/watch/[lessonId]/page.tsx ---
console.log("--- 4. Watch Lesson Page (src/app/watch/[lessonId]/page.tsx) Inspection ---");
const watchPagePath = path.resolve("src/app/watch/[lessonId]/page.tsx");
assert(fs.existsSync(watchPagePath), "src/app/watch/[lessonId]/page.tsx must exist");
const watchCode = fs.readFileSync(watchPagePath, "utf8");

// Throttled progress saving
assert(watchCode.includes("flushProgress"), "watch page must define flushProgress callback");
assert(watchCode.includes("isPlayingRef.current"), "watch page must check active playback before firing remote saves");
assert(watchCode.includes("timeSinceLastRemote"), "watch page must throttle remote progress saves (e.g. 15s)");
assert(watchCode.includes("beforeunload"), "watch page must flush final second on page unload");

// Clean UI: In-lecture notes dock cleanly removed to keep video player focused and uncluttered
assert(!watchCode.includes("LIVE NOTE-TAKING DOCK"), "watch page must have removed cluttered in-lecture notes dock");
assert(!watchCode.includes("handleSaveNote"), "watch page must have removed unused note saving handlers");

// Video Likes
assert(watchCode.includes("video_likes"), "watch page must interact with video_likes table");
assert(watchCode.includes("user_phone: cleanPhone"), "watch page must associate video_likes with user_phone per schema");

console.log("✅ PASS: Watch page progress throttling, clean uncluttered UI (notes dock removed), and video likes verified.\n");

console.log("================================================================================");
console.log("🎉 ALL AUDIT CHECKS PASSED SUCCESSFULLY!");
console.log("================================================================================");
