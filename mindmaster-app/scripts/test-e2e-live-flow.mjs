import assert from "assert";

const BASE_URL = "http://localhost:3000";

async function runE2E() {
  console.log("================================================================================");
  console.log("🚀 TESTING END-TO-END STUDENT AUTH LIFECYCLE (HTTP LIVE)");
  console.log("================================================================================\n");

  const phone = "98" + Date.now().toString().slice(-8);
  const password = "SafePassword@2026";
  const fullName = "Tukaram Patil";
  const recoveryPin = "5566";

  let cookieJar = new Map();

  function updateCookies(res) {
    // Collect set-cookie headers
    const raw = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get("set-cookie") || ""];
    for (const c of raw) {
      if (!c) continue;
      const parts = c.split(";")[0].split("=");
      const name = parts[0].trim();
      const val = parts.slice(1).join("=");
      if (c.includes("Max-Age=0") || c.includes("max-age=0")) {
        cookieJar.delete(name);
      } else {
        cookieJar.set(name, val);
      }
    }
  }

  function getCookieHeader() {
    return Array.from(cookieJar.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  }

  // ---------------------------------------------------------------------------
  // Step 1: Sign Up
  // ---------------------------------------------------------------------------
  console.log(`1. Registering student account for phone: ${phone}...`);
  const regRes = await fetch(`${BASE_URL}/api/student/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "register",
      phone,
      password,
      fullName,
      recoveryPin,
    }),
  });
  assert.strictEqual(regRes.status, 200, "Registration failed status");
  const regData = await regRes.json();
  assert.strictEqual(regData.success, true, "Registration success flag false");
  updateCookies(regRes);
  console.log("   ✅ Registration successful. Cookies set:", Array.from(cookieJar.keys()).join(", "));
  assert(cookieJar.has("sb-mindmaster-auth-token"), "Auth token missing");
  assert(cookieJar.has("mindmaster_onboarding_pending"), "Onboarding pending flag missing");

  // ---------------------------------------------------------------------------
  // Step 2: Attempt /home before onboarding -> should redirect to /onboarding
  // ---------------------------------------------------------------------------
  console.log("\n2. Checking middleware route guard before onboarding (/home)...");
  const homePreRes = await fetch(`${BASE_URL}/home`, {
    headers: { Cookie: getCookieHeader() },
    redirect: "manual",
  });
  console.log(`   Response status: ${homePreRes.status}, Location: ${homePreRes.headers.get("location")}`);
  assert.strictEqual(homePreRes.status, 307, "Expected redirect to onboarding");
  assert(homePreRes.headers.get("location")?.includes("/onboarding"), "Did not redirect to /onboarding");
  console.log("   ✅ Correctly redirected to /onboarding");

  // ---------------------------------------------------------------------------
  // Step 3: Complete Onboarding
  // ---------------------------------------------------------------------------
  console.log("\n3. Completing onboarding profile...");
  const onboardRes = await fetch(`${BASE_URL}/api/student/auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: getCookieHeader(),
    },
    body: JSON.stringify({
      action: "complete-onboarding",
      phone,
      district: "Kolhapur",
      taluka: "Karveer",
      village: "Gandhinagar",
      schoolName: "Shivaji High School",
      fullName,
    }),
  });
  assert.strictEqual(onboardRes.status, 200, "Onboarding API failed");
  const onboardData = await onboardRes.json();
  assert.strictEqual(onboardData.success, true, "Onboarding success flag false");
  updateCookies(onboardRes);
  console.log("   ✅ Onboarding completed. Pending cookie removed:", !cookieJar.has("mindmaster_onboarding_pending"));
  assert(!cookieJar.has("mindmaster_onboarding_pending"), "Onboarding pending flag was not cleared");

  // ---------------------------------------------------------------------------
  // Step 4: Validate Profile Hydration (action: "me")
  // ---------------------------------------------------------------------------
  console.log("\n4. Hydrating session via /api/student/auth (action: 'me')...");
  const meRes = await fetch(`${BASE_URL}/api/student/auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: getCookieHeader(),
    },
    body: JSON.stringify({ action: "me" }),
  });
  assert.strictEqual(meRes.status, 200, "Session me call failed");
  const meData = await meRes.json();
  assert.strictEqual(meData.success, true, "Session me success flag false");
  assert.strictEqual(meData.user.district, "Kolhapur", "District mismatch");
  assert.strictEqual(meData.user.village, "Gandhinagar", "Village mismatch");
  assert.strictEqual(meData.user.school_name, "Shivaji High School", "School mismatch");
  assert.strictEqual(meData.user.onboarding_completed, true, "Onboarding completed flag false");
  console.log("   ✅ Profile hydrated successfully:", meData.user.full_name, "-", meData.user.district);

  // ---------------------------------------------------------------------------
  // Step 5: Access /home after onboarding -> must be 200 OK
  // ---------------------------------------------------------------------------
  console.log("\n5. Accessing /home after onboarding...");
  const homePostRes = await fetch(`${BASE_URL}/home`, {
    headers: { Cookie: getCookieHeader() },
    redirect: "manual",
  });
  console.log(`   Response status: ${homePostRes.status}`);
  assert.strictEqual(homePostRes.status, 200, "Expected 200 OK on /home");
  console.log("   ✅ /home accessed directly without redirect loops!");

  // ---------------------------------------------------------------------------
  // Step 6: Logout
  // ---------------------------------------------------------------------------
  console.log("\n6. Logging out student...");
  const logoutRes = await fetch(`${BASE_URL}/api/student/auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: getCookieHeader(),
    },
    body: JSON.stringify({ action: "logout" }),
  });
  assert.strictEqual(logoutRes.status, 200, "Logout call failed");
  updateCookies(logoutRes);
  console.log("   ✅ Logout successful. Cookies remaining:", Array.from(cookieJar.keys()).join(", ") || "(none)");

  const homeAfterLogout = await fetch(`${BASE_URL}/home`, {
    headers: { Cookie: getCookieHeader() },
    redirect: "manual",
  });
  assert.strictEqual(homeAfterLogout.status, 307, "Expected redirect to /login after logout");
  assert(homeAfterLogout.headers.get("location")?.includes("/login"), "Did not redirect to /login");
  console.log("   ✅ /home correctly redirects to /login after logout");

  // ---------------------------------------------------------------------------
  // Step 7: Sign In again with the same credentials
  // ---------------------------------------------------------------------------
  console.log("\n7. Signing in again with the persisted credentials...");
  const loginRes = await fetch(`${BASE_URL}/api/student/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "login",
      phone,
      password,
    }),
  });
  assert.strictEqual(loginRes.status, 200, "Login failed");
  const loginData = await loginRes.json();
  assert.strictEqual(loginData.success, true, "Login success flag false");
  assert.strictEqual(loginData.user.onboarding_completed, true, "Onboarding should already be complete");
  updateCookies(loginRes);
  assert(!cookieJar.has("mindmaster_onboarding_pending"), "Onboarding pending should NOT be set on completed student");
  console.log("   ✅ Logged in successfully. Onboarding completed = true, no pending flag.");

  // ---------------------------------------------------------------------------
  // Step 8: Land directly on /home
  // ---------------------------------------------------------------------------
  console.log("\n8. Navigating to /home as returning student...");
  const returningHomeRes = await fetch(`${BASE_URL}/home`, {
    headers: { Cookie: getCookieHeader() },
    redirect: "manual",
  });
  console.log(`   Response status: ${returningHomeRes.status}`);
  assert.strictEqual(returningHomeRes.status, 200, "Expected 200 OK on /home for returning student");
  console.log("   ✅ Returning student lands directly on /home without any onboarding or login loop!");

  console.log("\n================================================================================");
  console.log("🎉 ALL END-TO-END FLOW CHECKS PASSED WITH 100% RELIABILITY!");
  console.log("================================================================================\n");
}

runE2E().catch((err) => {
  console.error("❌ E2E Flow Failed:", err);
  process.exit(1);
});
