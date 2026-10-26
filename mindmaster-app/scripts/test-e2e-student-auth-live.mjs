import assert from "assert";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

function getEnvConfig() {
  const envPath = path.join(process.cwd(), ".env.local");
  const config = {};
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        config[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
      }
    }
  }
  return config;
}

const envConfig = getEnvConfig();
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const SUPABASE_URL = process.env.SUPABASE_URL || envConfig.SUPABASE_URL || "https://xyycqnpqnrtumoemlels.supabase.co";
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || envConfig.SUPABASE_SECRET_KEY || envConfig.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

console.log("================================================================================");
console.log("🧪 RUNNING E2E LIVE STUDENT AUTH + ONBOARDING + PERSISTENCE VERIFICATION");
console.log("================================================================================\n");

async function runTest() {
  const testPhone = "97" + Date.now().toString().slice(-8);
  const testPassword = "TestPassword@2026";
  const testPin = "7890";
  const testFullName = "E2E Test Student Live";

  console.log(`📱 Generated Unique Test Student Mobile: ${testPhone}`);

  let sessionToken = "";
  let cookieHeader = "";

  // ---------------------------------------------------------------------------
  // Step 1: Register Student Account
  // ---------------------------------------------------------------------------
  console.log("\n[Step 1] Registering student via /api/student/auth (action: 'register')...");
  const regRes = await fetch(`${BASE_URL}/api/student/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "register",
      phone: testPhone,
      password: testPassword,
      fullName: testFullName,
      recoveryPin: testPin,
    }),
  });

  const regData = await regRes.json();
  console.log("Registration response status:", regRes.status);
  console.log("Registration response body:", regData);

  assert.strictEqual(regRes.status, 200, "Registration response status should be 200");
  assert.strictEqual(regData.success, true, "Registration should succeed");
  assert.strictEqual(regData.onboardingCompleted, false, "Onboarding should be pending after registration");
  assert(regData.sessionToken, "sessionToken should be returned");
  sessionToken = regData.sessionToken;

  const rawSetCookie = regRes.headers.get("set-cookie") || "";
  console.log("Registration cookies set:", rawSetCookie.split(",").map(c => c.split(";")[0].trim()));
  assert(rawSetCookie.includes("sb-mindmaster-auth-token"), "Cookie sb-mindmaster-auth-token should be set");
  assert(rawSetCookie.includes("mindmaster_session"), "Cookie mindmaster_session should be set");

  cookieHeader = `sb-mindmaster-auth-token=${sessionToken}; mindmaster_session=true`;

  // ---------------------------------------------------------------------------
  // Step 2: Complete Onboarding
  // ---------------------------------------------------------------------------
  console.log("\n[Step 2] Completing onboarding via /api/student/auth (action: 'complete-onboarding')...");
  const onbRes = await fetch(`${BASE_URL}/api/student/auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      action: "complete-onboarding",
      phone: testPhone,
      fullName: testFullName,
      district: "Pune",
      taluka: "Haveli",
      village: "Narhe",
      schoolName: "MindMaster High School",
      standard: "10th",
      targetExam: "Maharashtra Police Bharti 2026",
    }),
  });

  const onbData = await onbRes.json();
  console.log("Onboarding response status:", onbRes.status);
  console.log("Onboarding response body:", onbData);

  assert.strictEqual(onbRes.status, 200, "Onboarding response status should be 200");
  assert.strictEqual(onbData.success, true, "Onboarding should succeed");

  // ---------------------------------------------------------------------------
  // Step 3: Validate Session Hydration
  // ---------------------------------------------------------------------------
  console.log("\n[Step 3] Validating session and hydrating client profile via /api/student/auth...");
  const valRes = await fetch(`${BASE_URL}/api/student/auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      action: "validate-session",
      phone: testPhone,
      token: sessionToken,
    }),
  });

  const valData = await valRes.json();
  console.log("Validate-session response:", valData);
  assert.strictEqual(valRes.status, 200, "Validate-session status should be 200");
  assert.strictEqual(valData.valid, true, "Session should be valid");
  assert.strictEqual(valData.onboardingCompleted, true, "Onboarding should now be complete");
  assert(valData.user, "User profile should be returned for localStorage hydration");
  assert.strictEqual(valData.user.district, "Pune", "User district should be hydrated as Pune");

  // ---------------------------------------------------------------------------
  // Step 4: Logout
  // ---------------------------------------------------------------------------
  console.log("\n[Step 4] Logging out via /api/student/auth (action: 'logout')...");
  const logoutRes = await fetch(`${BASE_URL}/api/student/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "logout" }),
  });

  assert.strictEqual(logoutRes.status, 200, "Logout should succeed");
  const logoutCookies = logoutRes.headers.get("set-cookie") || "";
  console.log("Logout cookies cleared:", logoutCookies.split(",").map(c => c.split(";")[0].trim()));

  // ---------------------------------------------------------------------------
  // Step 5: Login Again with Same Phone & Password
  // ---------------------------------------------------------------------------
  console.log("\n[Step 5] Logging back in with same credentials...");
  const loginRes = await fetch(`${BASE_URL}/api/student/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "login",
      phone: testPhone,
      password: testPassword,
    }),
  });

  const loginData = await loginRes.json();
  console.log("Login response status:", loginRes.status);
  console.log("Login response body:", loginData);

  assert.strictEqual(loginRes.status, 200, "Login response status should be 200");
  assert.strictEqual(loginData.success, true, "Login should succeed with stored credentials");
  assert.strictEqual(loginData.onboardingCompleted, true, "Student onboarding state should be preserved as true");
  assert.strictEqual(loginData.user.full_name, testFullName, "Full name should match");
  assert.strictEqual(loginData.user.district, "Pune", "District should match onboarding value");
  assert(loginData.sessionToken, "New session token should be issued");

  // ---------------------------------------------------------------------------
  // Step 6: Verify Record Exists Directly in Live Supabase `profiles` Table
  // ---------------------------------------------------------------------------
  console.log("\n[Step 6] Directly querying live Supabase profiles table for record...");
  const { data: dbProfiles, error: dbError } = await supabase
    .from("profiles")
    .select("*")
    .or(`phone.eq.${testPhone},phone.eq.+91${testPhone}`);

  if (dbError) {
    throw new Error(`Failed to query Supabase profiles: ${dbError.message}`);
  }

  console.log("Found Supabase profiles:", dbProfiles);
  assert(dbProfiles && dbProfiles.length > 0, "Student profile must exist in live Supabase profiles table");
  const profile = dbProfiles[0];

  assert.strictEqual(profile.full_name, testFullName, "Supabase profile full_name should match");
  assert.strictEqual(profile.district, "Pune", "Supabase profile district should match");
  assert.strictEqual(profile.taluka, "Haveli", "Supabase profile taluka should match");
  assert.strictEqual(profile.school_name, "MindMaster High School", "Supabase profile school_name should match");
  assert.strictEqual(profile.onboarding_completed, true, "Supabase onboarding_completed should be true");
  assert(profile.password_hash, "Supabase profile must have password_hash persisted");
  assert.strictEqual(profile.recovery_pin, testPin, "Supabase profile must have recovery_pin persisted");
  assert(profile.session_token, "Supabase profile must have session_token persisted");

  console.log("\n✅ LIVE SUPABASE PROFILES TABLE VERIFICATION CONFIRMED:");
  console.log("  • ID:", profile.id);
  console.log("  • Phone:", profile.phone);
  console.log("  • Full Name:", profile.full_name);
  console.log("  • District / Taluka:", profile.district, "/", profile.taluka);
  console.log("  • School:", profile.school_name);
  console.log("  • Onboarding Completed:", profile.onboarding_completed);
  console.log("  • Has Password Hash:", Boolean(profile.password_hash));
  console.log("  • Recovery PIN:", profile.recovery_pin);
  console.log("  • Session Token:", profile.session_token ? "Present (" + profile.session_token.slice(0, 15) + "...)" : "Missing");

  // ---------------------------------------------------------------------------
  // Cleanup test record
  // ---------------------------------------------------------------------------
  console.log("\n[Cleanup] Cleaning up test profile from live Supabase and local store...");
  await supabase.from("profiles").delete().or(`phone.eq.${testPhone},phone.eq.+91${testPhone}`);

  try {
    const storePath = path.join(process.cwd(), ".data", "students-store.json");
    if (fs.existsSync(storePath)) {
      const data = JSON.parse(fs.readFileSync(storePath, "utf8"));
      const filtered = data.filter((a) => a.cleanPhone !== testPhone && !a.phone.includes(testPhone));
      fs.writeFileSync(storePath, JSON.stringify(filtered, null, 2), "utf8");
    }
  } catch {}

  console.log("\n================================================================================");
  console.log("🎉 ALL END-TO-END STUDENT AUTH AND SUPABASE PERSISTENCE TESTS PASSED 100%!");
  console.log("================================================================================\n");
}

runTest().catch((err) => {
  console.error("\n❌ E2E TEST FAILED:", err);
  process.exit(1);
});
