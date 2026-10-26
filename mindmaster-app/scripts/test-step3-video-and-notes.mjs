// scripts/test-step3-video-and-notes.mjs
import fs from "fs";
import path from "path";
import assert from "assert";

console.log("🚀 Running Step 3 Verification Suite: Protected Video Player, Low-Data Audio Mode, Speed Controls & Smart Auto-Resume...\n");

const watchPagePath = path.resolve("src/app/watch/[lessonId]/page.tsx");
const watchStatsRoutePath = path.resolve("src/app/api/watch-stats/route.ts");
const notesPagePath = path.resolve("src/app/notes/page.tsx");

assert(fs.existsSync(watchPagePath), "Watch page must exist at src/app/watch/[lessonId]/page.tsx");
assert(fs.existsSync(watchStatsRoutePath), "Watch stats API must exist at src/app/api/watch-stats/route.ts");
assert(fs.existsSync(notesPagePath), "Notes page must exist at src/app/notes/page.tsx");

const watchContent = fs.readFileSync(watchPagePath, "utf-8");
const statsContent = fs.readFileSync(watchStatsRoutePath, "utf-8");
const notesContent = fs.readFileSync(notesPagePath, "utf-8");

let passedTests = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     ${err.message}`);
    process.exit(1);
  }
}

// 1. YouTube / Video Iframe Link Masking
test("1.1 YouTube embed parameters contain modestbranding=1, rel=0, iv_load_policy=3, disablekb=1", () => {
  assert(watchContent.includes("modestbranding: 1"), "Must set modestbranding: 1");
  assert(watchContent.includes("rel: 0"), "Must set rel: 0");
  assert(watchContent.includes("iv_load_policy: 3"), "Must set iv_load_policy: 3");
  assert(watchContent.includes("disablekb: 1"), "Must set disablekb: 1");
});

test("1.2 Transparent pointer-blocking shield overlays protect top title and bottom-right YouTube logo", () => {
  assert(
    watchContent.includes("top-0 left-0 right-0 h-16 pointer-events-auto z-20"),
    "Must have top shield overlay with pointer-events-auto and z-20"
  );
  assert(
    watchContent.includes("bottom-0 right-0 w-44 h-16 pointer-events-auto z-20") ||
    watchContent.includes("bottom-0 right-0 w-48 h-16 pointer-events-auto z-20"),
    "Must have bottom-right YouTube logo shield overlay with pointer-events-auto and z-20"
  );
});

// 2. Rural-Friendly Playback Controls & Low-Data Audio Mode
test("2.1 Seek buttons ⏪ -10s and +10s ⏩ are provided below video container", () => {
  assert(watchContent.includes("⏪ -10s"), "Must contain -10s seek button label");
  assert(watchContent.includes("+10s ⏩"), "Must contain +10s seek button label");
  assert(watchContent.includes("seekBy(-10)"), "Must call seekBy(-10)");
  assert(watchContent.includes("seekBy(10)"), "Must call seekBy(10)");
});

test("2.2 Speed selector buttons 1x, 1.25x, 1.5x, 2x are provided", () => {
  assert(watchContent.includes("[1, 1.25, 1.5, 2]"), "Must include 1x, 1.25x, 1.5x, 2x speeds");
  assert(watchContent.includes("setSpeedDirect"), "Must have setSpeedDirect handler");
});

test("2.3 Low-Data Audio-Only Mode toggle and visual cover card", () => {
  assert(watchContent.includes("🎧 फक्त ऑडिओ मोड - डेटा वाचवा"), "Must provide audio-only mode button text");
  assert(watchContent.includes("toggleAudioOnlyMode"), "Must have toggleAudioOnlyMode function");
  assert(watchContent.includes("setPlaybackQuality"), "Must call setPlaybackQuality('small')");
  assert(watchContent.includes("🎧 ऑडिओ रिविजन मोड चालू आहे (डेटा बचत मोड)"), "Must show Marathi audio revision banner in cover card");
});

// 3. Debounced Auto-Resume & Progress Sync
test("3.1 Watch stats API GET supports student progress query by lesson_id", () => {
  assert(statsContent.includes("searchParams.get(\"lesson_id\")"), "GET /api/watch-stats must parse lesson_id query param");
  assert(statsContent.includes("user_id"), "GET /api/watch-stats must support student user_id");
  assert(statsContent.includes("progress: prog"), "GET /api/watch-stats must return progress object");
});

test("3.2 Watch page queries cloud progress and auto-resumes playback", () => {
  assert(watchContent.includes("/api/watch-stats?lesson_id="), "Watch page must query /api/watch-stats on load for auto-resume");
  assert(watchContent.includes("event.target.seekTo(initialSeek"), "Player onReady must seekTo initialSeek");
  assert(watchContent.includes("Resumed playback at"), "Must display resume notification");
});

test("3.3 Progress updates are debounced to 15s and immediately saved on pause/end", () => {
  assert(watchContent.includes("15000"), "Must throttle remote saves to 15 seconds");
  assert(watchContent.includes("flushProgress(t)"), "Must flush progress on pause");
  assert(watchContent.includes("flushProgress(dur, true)"), "Must flush progress on video end with completed = true");
});

// 4. Timestamped Quick Notes Integration
test("4.1 Saving note automatically captures current playback time into timestampSec", () => {
  assert(watchContent.includes("timestampSec: stamp"), "Must capture currentTime as timestampSec");
  assert(watchContent.includes("handleSaveQuickNote"), "Must have handleSaveQuickNote function");
  assert(watchContent.includes("Live Stamp:"), "Must display live timestamp indicator");
});

test("4.2 Clicking saved timestamp badge seeks player to exact second", () => {
  assert(watchContent.includes("handleSeekToTimestamp"), "Watch page must have handleSeekToTimestamp function");
  assert(watchContent.includes("playerRef.current.seekTo(sec, true)"), "handleSeekToTimestamp must call playerRef.current.seekTo");
  assert(notesContent.includes("/watch/${note.lessonId}?t="), "Notes page timestamp badge must link to /watch/[lessonId]?t=[sec]");
  assert(watchContent.includes("queryTimeParam"), "Watch page must read and seek to ?t= query param");
});

console.log(`\n🎉 All ${passedTests} Step 3 tests passed cleanly!`);
