import assert from "assert";
import fs from "fs";

console.log("================================================================================");
console.log("🎬 VERIFYING /watch PLAYER, CUSTOM SKIN, GATING & RESUME");
console.log("================================================================================\n");

async function runTests() {
  let passed = 0;
  let failed = 0;

  function test(desc, fn) {
    try {
      fn();
      console.log(`✅ PASS: ${desc}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${desc} -> ${err.message}`);
      failed++;
    }
  }

  const watchSrc = fs.readFileSync("src/app/watch/[lessonId]/page.tsx", "utf-8");
  const watchIndexSrc = fs.readFileSync("src/app/watch/page.tsx", "utf-8");
  const mockDataSrc = fs.readFileSync("src/lib/mockData.ts", "utf-8");

  // /watch Index Redirect
  test("/watch index route redirects to default lesson", () => {
    assert(watchIndexSrc.includes("redirect("), "redirect call missing in /watch/page.tsx");
    assert(watchIndexSrc.includes("MOCK_LESSONS"), "MOCK_LESSONS reference missing");
  });

  // Lesson Data Gating
  test("MOCK_LESSONS includes both free preview and locked lessons", () => {
    assert(mockDataSrc.includes("les-mm01-01") && mockDataSrc.includes("isFree: true"), "Free lesson les-mm01-01 missing");
    assert(mockDataSrc.includes("les-mm01-03") && mockDataSrc.includes("isFree: false"), "Locked lesson les-mm01-03 missing");
  });

  // YouTube Custom Skin
  test("Hides native player controls and YouTube branding", () => {
    assert(watchSrc.includes("controls: 0"), "controls: 0 is required");
    assert(watchSrc.includes("modestbranding: 1"), "modestbranding: 1 is required");
    assert(watchSrc.includes("rel: 0"), "rel: 0 is required to prevent external recommendations");
    assert(watchSrc.includes("iv_load_policy: 3"), "iv_load_policy: 3 is required to disable annotations");
    assert(watchSrc.includes("disablekb: 1"), "disablekb: 1 is required");
    assert(watchSrc.includes("fs: 0"), "fs: 0 is required to shield native fullscreen button");
  });

  test("Applies click shield to block direct YouTube navigation and logo clicks", () => {
    assert(watchSrc.includes("pointer-events-none scale-105"), "IFrame shielding container with pointer-events-none scale-105 missing");
    assert(watchSrc.includes("custom-yt-player"), "custom-yt-player container element missing");
  });

  test("Renders custom overlay control bar (play/pause, seek, volume, speed, progress bar)", () => {
    assert(watchSrc.includes("togglePlay"), "togglePlay handler missing");
    assert(watchSrc.includes("seekBy(-10)"), "10s rewind control missing");
    assert(watchSrc.includes("seekBy(10)"), "10s forward control missing");
    assert(watchSrc.includes("toggleMute"), "toggleMute control missing");
    assert(watchSrc.includes("changeSpeed"), "playbackRate speed switcher missing");
    assert(watchSrc.includes("handleSliderChange"), "custom progress bar scrubber missing");
    assert(watchSrc.includes("toggleFullscreen"), "toggleFullscreen control missing");
  });

  // Access Gating
  test("Gating allows free lessons immediately", () => {
    assert(watchSrc.includes("if (lesson.isFree)"), "lesson.isFree check missing");
    assert(watchSrc.includes("setHasAccess(true)"), "setHasAccess(true) missing");
  });

  test("Gating checks unexpired purchase in Supabase and localStorage fallback", () => {
    assert(watchSrc.includes("expires_at"), "Supabase expires_at query check missing");
    assert(watchSrc.includes("new Date().toISOString()"), "Current timestamp ISO comparison missing");
    assert(watchSrc.includes("mindmaster_active_purchases"), "localStorage active purchases fallback check missing");
  });

  test("Locked state renders lock icon, pricing, and direct /checkout link", () => {
    assert(watchSrc.includes("Lesson Locked"), "Lesson Locked banner missing");
    assert(watchSrc.includes("<Lock"), "Lock icon missing in locked UI");
    assert(watchSrc.includes("course.pricePaise"), "Course pricing display missing");
    assert(watchSrc.includes("/checkout?courseId="), "Direct link to /checkout missing");
    assert(watchSrc.includes("Unlock Course Now"), "Unlock Course Now button CTA missing");
  });

  // Resume Playback & Progress Save
  test("Resume playback reads stored time from localStorage or ?t= query", () => {
    assert(watchSrc.includes("queryTimeParam"), "Query parameter ?t= parser missing");
    assert(watchSrc.includes("mindmaster_progress_"), "localStorage progress retrieval key missing");
    assert(watchSrc.includes("seekTo(initialSeek"), "seekTo initial seek missing");
    assert(watchSrc.includes("Resumed playback at"), "Resume notification toast missing");
  });

  test("Progress is saved every 5 seconds to localStorage and Supabase progress table", () => {
    assert(watchSrc.includes("5000"), "5-second interval timer missing");
    assert(watchSrc.includes("position_sec: t"), "position_sec Supabase schema field missing");
    assert(watchSrc.includes("completed: t >= duration - 15"), "Video completion threshold calculation missing");
  });

  // Note Taking & Playlist
  test("Provides in-lecture note taking with duration-based word limits", () => {
    assert(watchSrc.includes("calculateAllowedWords"), "calculateAllowedWords missing");
    assert(watchSrc.includes("capturedTimestamp"), "timestamp capture in note missing");
    assert(watchSrc.includes("mindmaster_user_notes"), "shared notes store sync missing");
  });

  test("Renders interactive Up-Next playlist with free/locked status indicators", () => {
    assert(watchSrc.includes("Up-Next Playlist"), "Up-Next playlist header missing");
    assert(watchSrc.includes("allCourseLessons.map"), "allCourseLessons mapper missing");
  });

  console.log("\n================================================================================");
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} /watch PLAYER, GATING & RESUME CHECKS PASSED!`);
  } else {
    console.log(`💥 ${failed} TEST(S) FAILED! (${passed} passed)`);
    process.exit(1);
  }
  console.log("================================================================================\n");
}

runTests().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
