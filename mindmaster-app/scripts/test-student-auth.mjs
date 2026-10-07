import assert from "assert";
import fs from "fs";
import {
  authenticateStudent,
  registerStudentAccount,
  resetStudentPasswordWithPin,
  findStudentByPhone,
  normalizePhone,
} from "../src/lib/studentAuthService.ts";
import { POST as studentAuthApiPost } from "../src/app/api/student/auth/route.ts";
import { middleware } from "../src/middleware.ts";

console.log("================================================================================");
console.log("📱 VERIFYING ZERO-COST STUDENT AUTH (GOOGLE + PHONE/PASSWORD + FORGOT PASSWORD)");
console.log("================================================================================\n");

let passed = 0;
let failed = 0;

async function test(desc, fn) {
  try {
    await fn();
    console.log(`✅ PASS: ${desc}`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL: ${desc} -> ${err.message}`);
    failed++;
  }
}

async function runAllTests() {
  // ---------------------------------------------------------------------------
  // 1. Phone Normalization & Seed Verification
  // ---------------------------------------------------------------------------
  console.log("--- 1. Phone Normalization & Seed Verification ---");

  await test("normalizePhone strips country code and non-digits cleanly", () => {
    assert.strictEqual(normalizePhone("+91 98234 56789"), "9823456789");
    assert.strictEqual(normalizePhone("919823456789"), "9823456789");
    assert.strictEqual(normalizePhone("09823456789"), "9823456789");
    assert.strictEqual(normalizePhone("9823456789"), "9823456789");
  });

  await test("Seed students (Rohan & Pooja) exist and are queryable by phone", () => {
    const s1 = findStudentByPhone("9823456789");
    assert(s1, "Rohan not found by phone");
    assert.strictEqual(s1.full_name, "Rohan Kulkarni");

    const s2 = findStudentByPhone("9876543210");
    assert(s2, "Pooja not found by phone");
    assert.strictEqual(s2.full_name, "Pooja Patil");
  });

  // ---------------------------------------------------------------------------
  // 2. Student Registration Flow (Phone + Password + 4-digit PIN)
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Student Registration Flow ---");

  const testPhone = "9988776655";
  await test("Register new student with phone, password, full_name and recovery_pin", async () => {
    const res = await registerStudentAccount({
      phone: testPhone,
      password: "TestPassword@123",
      fullName: "Aniket Shinde",
      recoveryPin: "4321",
    });

    assert.strictEqual(res.success, true);
    assert(res.student, "Student object missing");
    assert.strictEqual(res.student.cleanPhone, testPhone);
    assert.strictEqual(res.student.full_name, "Aniket Shinde");
    assert.strictEqual(res.student.recovery_pin, "4321");
    assert.strictEqual(res.student.onboarding_completed, false);
  });

  await test("Duplicate registration with same phone is cleanly rejected", async () => {
    const res = await registerStudentAccount({
      phone: testPhone,
      password: "AnotherPassword123",
      fullName: "Duplicate User",
    });

    assert.strictEqual(res.success, false);
    assert(res.error.includes("आधीच नोंदणीकृत"), "Expected duplicate registration error");
  });

  await test("Registration rejects invalid phone numbers (< 10 digits)", async () => {
    const res = await registerStudentAccount({
      phone: "12345",
      password: "ValidPassword123",
      fullName: "Short Phone",
    });

    assert.strictEqual(res.success, false);
    assert(res.error.includes("१० अंकी"), "Expected 10-digit validation error");
  });

  // ---------------------------------------------------------------------------
  // 3. Student Authentication (Login with Phone + Password)
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. Student Authentication Flow ---");

  await test("Authenticate newly registered student with valid credentials", async () => {
    const res = await authenticateStudent(testPhone, "TestPassword@123");
    assert.strictEqual(res.success, true);
    assert(res.student, "Student missing in auth result");
    assert.strictEqual(res.student.full_name, "Aniket Shinde");
  });

  await test("Authentication fails on incorrect password", async () => {
    const res = await authenticateStudent(testPhone, "WrongPassword");
    assert.strictEqual(res.success, false);
    assert(res.error.includes("चुकीचा पासवर्ड"), "Expected incorrect password error");
  });

  await test("Authentication fails for non-existent mobile number", async () => {
    const res = await authenticateStudent("9000000000", "SomePassword123");
    assert.strictEqual(res.success, false);
    assert(res.error.includes("नोंदणीकृत नाही"), "Expected not registered error");
  });

  // ---------------------------------------------------------------------------
  // 4. Zero-Cost Password Reset Flow (Self-Service via 4-Digit PIN)
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. Zero-Cost Password Reset Flow ---");

  await test("Reset password succeeds when valid phone and 4-digit PIN are provided", async () => {
    const res = await resetStudentPasswordWithPin({
      phone: testPhone,
      recoveryPin: "4321",
      newPassword: "BrandNewPassword@999",
    });

    assert.strictEqual(res.success, true);

    // Verify student can now log in with the new password
    const loginRes = await authenticateStudent(testPhone, "BrandNewPassword@999");
    assert.strictEqual(loginRes.success, true);

    // Verify old password no longer works
    const oldLoginRes = await authenticateStudent(testPhone, "TestPassword@123");
    assert.strictEqual(oldLoginRes.success, false);
  });

  await test("Reset password fails when wrong PIN is provided", async () => {
    const res = await resetStudentPasswordWithPin({
      phone: testPhone,
      recoveryPin: "0000",
      newPassword: "ShouldFailPassword",
    });

    assert.strictEqual(res.success, false);
    assert(res.error.includes("चुकीचा सिक्युरिटी पिन"), "Expected wrong pin error");
  });

  // ---------------------------------------------------------------------------
  // 5. Backend API Route (/api/student/auth)
  // ---------------------------------------------------------------------------
  console.log("\n--- 5. Backend API Route (/api/student/auth) ---");

  await test("API POST action='login' sets auth cookies and returns user data", async () => {
    const req = new Request("http://localhost:3000/api/student/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "login",
        phone: testPhone,
        password: "BrandNewPassword@999",
      }),
    });

    const res = await studentAuthApiPost(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.phone, `+91${testPhone}`);

    // Check Set-Cookie headers
    const setCookie = res.headers.get("set-cookie") || "";
    assert(setCookie.includes("sb-mindmaster-auth-token"), "sb-mindmaster-auth-token cookie missing");
    assert(setCookie.includes("mindmaster_session"), "mindmaster_session cookie missing");
  });

  await test("API POST action='forgot-password' handles self-service reset", async () => {
    const req = new Request("http://localhost:3000/api/student/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "forgot-password",
        phone: testPhone,
        recoveryPin: "4321",
        newPassword: "ApiUpdatedPassword@123",
      }),
    });

    const res = await studentAuthApiPost(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert(data.message.includes("यशस्वीरित्या बदलला"), "Success message missing");
  });

  // ---------------------------------------------------------------------------
  // 6. UI & Codebase Audits (Login & Forgot Password Pages)
  // ---------------------------------------------------------------------------
  console.log("\n--- 6. UI & Codebase Audits ---");

  await test("login/page.tsx includes Google 1-click OAuth and Phone+Password tabs", () => {
    const loginSrc = fs.readFileSync("src/app/login/page.tsx", "utf-8");
    assert(loginSrc.includes("signInWithOAuth"), "signInWithOAuth missing");
    assert(loginSrc.includes("provider: \"google\"") || loginSrc.includes("provider: 'google'"), "Google provider missing");
    assert(loginSrc.includes("Google ने लॉगिन करा"), "Google button text missing");
    assert(loginSrc.includes("लॉगिन करा (Sign In)"), "Sign In tab missing");
    assert(loginSrc.includes("नवीन नोंदणी (Sign Up)"), "Sign Up tab missing");
    assert(loginSrc.includes("href=\"/forgot-password\""), "Forgot password link missing");
    assert(loginSrc.includes("wa.me/91"), "WhatsApp help link missing");
  });

  await test("forgot-password/page.tsx includes PIN reset, Email option and WhatsApp card", () => {
    assert(fs.existsSync("src/app/forgot-password/page.tsx"), "forgot-password/page.tsx does not exist");
    const fpSrc = fs.readFileSync("src/app/forgot-password/page.tsx", "utf-8");
    assert(fpSrc.includes("सिक्युरिटी पिनने बदला"), "PIN method missing");
    assert(fpSrc.includes("ईमेलने लिंक मागवा"), "Email method missing");
    assert(fpSrc.includes("resetPasswordForEmail"), "Supabase email reset missing");
    assert(fpSrc.includes("WhatsApp वर थेट मदत मिळवा"), "WhatsApp support missing");
  });

  // ---------------------------------------------------------------------------
  // 7. Route Guards via Middleware
  // ---------------------------------------------------------------------------
  console.log("\n--- 7. Middleware Route Guards ---");

  await test("Unauthenticated visit to /home redirects to /login?next=%2Fhome", async () => {
    const req = new Request("http://localhost:3000/home");
    const res = await middleware(req);
    assert.strictEqual(res.status, 307);
    const location = res.headers.get("location") || "";
    assert(location.includes("/login") && location.includes("next=%2Fhome"));
  });

  await test("Authenticated visit with sb-mindmaster-auth-token allows access to /home", async () => {
    const req = new Request("http://localhost:3000/home", {
      headers: { Cookie: "sb-mindmaster-auth-token=active-token-xyz123; mindmaster_session=true" },
    });
    const res = await middleware(req);
    assert.strictEqual(res.status, 200);
  });

  console.log("\n================================================================================");
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} ZERO-COST STUDENT AUTH VERIFICATION CHECKS PASSED!`);
  } else {
    console.log(`💥 ${failed} TEST(S) FAILED! (${passed} passed)`);
    process.exit(1);
  }
  console.log("================================================================================\n");
}

runAllTests().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
