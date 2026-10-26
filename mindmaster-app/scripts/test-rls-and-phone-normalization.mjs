/**
 * ==============================================================================
 * 🧪 TEST SUITE: RLS POLICIES & PHONE NUMBER NORMALIZATION VERIFICATION
 * ==============================================================================
 */

import assert from "assert";
import fs from "fs";
import path from "path";
import { normalizePhone, isValidIndianMobile, formatDisplayPhone } from "../src/lib/phoneUtils";

console.log("================================================================================");
console.log("🛡️ VERIFYING DATABASE RLS POLICIES & CANONICAL PHONE NORMALIZATION");
console.log("================================================================================\n");

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

// -----------------------------------------------------------------------------
// 1. Phone Normalization Unit Tests
// -----------------------------------------------------------------------------
console.log("--- 1. Phone Normalization (normalizePhone) ---");

test("normalizePhone converts +91 prefix with spaces to 10 digits", () => {
  assert.strictEqual(normalizePhone("+91 98765 43210"), "9876543210");
});

test("normalizePhone converts +91 prefix without spaces to 10 digits", () => {
  assert.strictEqual(normalizePhone("+919876543210"), "9876543210");
});

test("normalizePhone converts 91 prefix (12 digits) to 10 digits", () => {
  assert.strictEqual(normalizePhone("919876543210"), "9876543210");
});

test("normalizePhone converts leading 0 (11 digits) to 10 digits", () => {
  assert.strictEqual(normalizePhone("09876543210"), "9876543210");
});

test("normalizePhone keeps already clean 10-digit number intact", () => {
  assert.strictEqual(normalizePhone("9876543210"), "9876543210");
});

test("normalizePhone handles dirty characters (+, -, spaces, brackets)", () => {
  assert.strictEqual(normalizePhone("+91 (98765) 43-210"), "9876543210");
});

test("normalizePhone handles empty or null gracefully", () => {
  assert.strictEqual(normalizePhone(""), "");
  assert.strictEqual(normalizePhone(null), "");
  assert.strictEqual(normalizePhone(undefined), "");
});

test("formatDisplayPhone formats 10 digits to +91 Indian format", () => {
  assert.strictEqual(formatDisplayPhone("9876543210"), "+91 98765 43210");
  assert.strictEqual(formatDisplayPhone("+919876543210"), "+91 98765 43210");
});

test("isValidIndianMobile validates only genuine Indian mobile numbers", () => {
  assert.strictEqual(isValidIndianMobile("9876543210"), true);
  assert.strictEqual(isValidIndianMobile("+91 87654 32109"), true);
  assert.strictEqual(isValidIndianMobile("+91 76543 21098"), true);
  assert.strictEqual(isValidIndianMobile("+91 65432 10987"), true);
  assert.strictEqual(isValidIndianMobile("1234567890"), false);
  assert.strictEqual(isValidIndianMobile("5234567890"), false);
});

// -----------------------------------------------------------------------------
// 2. deploy-live-schema.mjs RLS & Policy Audit
// -----------------------------------------------------------------------------
console.log("\n--- 2. deploy-live-schema.mjs RLS & Policy Audit ---");

const deployScriptPath = path.join(process.cwd(), "scripts", "deploy-live-schema.mjs");
assert(fs.existsSync(deployScriptPath), "deploy-live-schema.mjs missing");
const deployScriptSrc = fs.readFileSync(deployScriptPath, "utf-8");

test("deploy-live-schema.mjs: Courses SELECT policy must NOT contain 'OR true'", () => {
  assert(
    !deployScriptSrc.includes("status = 'live' OR true"),
    "Found insecure 'status = \\'live\\' OR true' in deploy-live-schema.mjs"
  );
  assert(
    deployScriptSrc.includes("status = 'live'"),
    "Missing 'status = \\'live\\'' check in deploy-live-schema.mjs"
  );
});

test("deploy-live-schema.mjs: Drops permissive public policies on coupons, course_grants, audit_log", () => {
  assert(
    deployScriptSrc.includes('DROP POLICY IF EXISTS "Public can view active coupons" ON coupons'),
    "coupons public read policy must be dropped"
  );
  assert(
    deployScriptSrc.includes('DROP POLICY IF EXISTS "Students can read their grants" ON course_grants'),
    "course_grants public student read policy must be dropped"
  );
  assert(
    deployScriptSrc.includes('DROP POLICY IF EXISTS "Staff manage grants" ON course_grants'),
    "course_grants public staff manage policy must be dropped"
  );
  assert(
    deployScriptSrc.includes('DROP POLICY IF EXISTS "Allow public read audit" ON audit_log'),
    "audit_log public read policy must be dropped"
  );
});

test("deploy-live-schema.mjs: Ensures RLS is enabled on sensitive tables", () => {
  assert(deployScriptSrc.includes("ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;"), "RLS missing on coupons");
  assert(deployScriptSrc.includes("ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;"), "RLS missing on purchases");
  assert(deployScriptSrc.includes("ALTER TABLE course_grants ENABLE ROW LEVEL SECURITY;"), "RLS missing on course_grants");
  assert(deployScriptSrc.includes("ALTER TABLE staff_accounts ENABLE ROW LEVEL SECURITY;"), "RLS missing on staff_accounts");
  assert(deployScriptSrc.includes("ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;"), "RLS missing on audit_log");
});

test("deploy-live-schema.mjs: Contains DB triggers for automatic phone normalization", () => {
  assert(deployScriptSrc.includes("CREATE OR REPLACE FUNCTION normalize_phone_canonical"), "normalize_phone_canonical function missing");
  assert(deployScriptSrc.includes("CREATE TRIGGER trg_normalize_phone_profiles"), "profiles phone trigger missing");
  assert(deployScriptSrc.includes("CREATE TRIGGER trg_normalize_phone_grants"), "course_grants phone trigger missing");
  assert(deployScriptSrc.includes("CREATE TRIGGER trg_normalize_phone_likes"), "video_likes phone trigger missing");
  assert(deployScriptSrc.includes("CREATE TRIGGER trg_normalize_phone_staff"), "staff_accounts phone trigger missing");
});

// -----------------------------------------------------------------------------
// 3. Consolidated Schema Audit
// -----------------------------------------------------------------------------
console.log("\n--- 3. Consolidated Production Schemas Audit ---");

const appConsolidatedPath = path.join(process.cwd(), "supabase", "consolidated_production_schema.sql");
const rootConsolidatedPath = path.join(process.cwd(), "..", "supabase", "consolidated_production_schema.sql");

[appConsolidatedPath, rootConsolidatedPath].forEach((filePath) => {
  const label = path.relative(process.cwd(), filePath);
  if (fs.existsSync(filePath)) {
    const src = fs.readFileSync(filePath, "utf-8");
    test(`${label}: No 'OR true' in courses policy`, () => {
      assert(!src.includes("status = 'live' OR true"), `${label} contains 'status = \\'live\\' OR true'`);
    });
    test(`${label}: No public 'view active coupons' policy`, () => {
      assert(!src.includes('CREATE POLICY "Public can view active coupons" ON coupons FOR SELECT USING (true)'), `${label} has public coupons policy`);
    });
    test(`${label}: No public 'Staff manage grants' policy`, () => {
      assert(!src.includes('CREATE POLICY "Staff manage grants" ON course_grants FOR ALL USING (true)'), `${label} has public grants policy`);
    });
  }
});

// -----------------------------------------------------------------------------
// 4. Migration 009 Audit
// -----------------------------------------------------------------------------
console.log("\n--- 4. Migration 009 Audit ---");

const migration009Path = path.join(process.cwd(), "supabase", "migrations", "009_tighten_rls_and_phone_normalization.sql");
test("Migration 009 exists and contains RLS lockdown & phone normalization", () => {
  assert(fs.existsSync(migration009Path), "009_tighten_rls_and_phone_normalization.sql must exist");
  const sql = fs.readFileSync(migration009Path, "utf-8");
  assert(sql.includes("CREATE POLICY \"Public can view live courses\""), "Courses policy missing");
  assert(!sql.includes("status = 'live' OR true"), "Insecure 'status = \\'live\\' OR true' found in migration 009");
  assert(sql.includes("ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;"), "Coupons RLS missing");
  assert(sql.includes("ALTER TABLE course_grants ENABLE ROW LEVEL SECURITY;"), "Grants RLS missing");
  assert(sql.includes("ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;"), "Purchases RLS missing");
  assert(sql.includes("UPDATE profiles"), "Profiles retroactive cleanup missing");
  assert(sql.includes("UPDATE course_grants"), "course_grants retroactive cleanup missing");
  assert(sql.includes("CREATE TRIGGER trg_normalize_phone_profiles"), "profiles trigger missing");
  assert(sql.includes("CREATE TRIGGER trg_normalize_phone_grants"), "grants trigger missing");
});

// -----------------------------------------------------------------------------
// 5. Application Codebase Phone Normalization Audit
// -----------------------------------------------------------------------------
console.log("\n--- 5. Application Codebase Phone Normalization Audit ---");

test("onboarding/page.tsx saves phone using normalizePhone (no +91 prefix prepended)", () => {
  const onboardingSrc = fs.readFileSync("src/app/onboarding/page.tsx", "utf-8");
  assert(!onboardingSrc.includes('phone: "+91" +'), "onboarding/page.tsx still prepends '+91'");
  assert(onboardingSrc.includes("normalizePhone(phone)"), "onboarding/page.tsx must use normalizePhone(phone)");
});

test("staffStore.ts saveStudentRecord saves phone using normalizePhone (no +91 prefix prepended)", () => {
  const staffStoreSrc = fs.readFileSync("src/lib/staffStore.ts", "utf-8");
  assert(!staffStoreSrc.includes("phone: cleanPhone.length === 10 ? `+91${cleanPhone}` : student.phone"), "staffStore still prepends '+91'");
  assert(staffStoreSrc.includes("phone: cleanPhone"), "staffStore must save cleanPhone");
});

test("actions/checkout.ts normalizes studentMobile and links purchase to clean phone profile", () => {
  const checkoutSrc = fs.readFileSync("src/app/actions/checkout.ts", "utf-8");
  assert(checkoutSrc.includes("cleanMobile = normalizePhone(studentMobile)"), "checkout.ts must normalize studentMobile");
  assert(checkoutSrc.includes(".eq(\"phone\", cleanMobile)"), "checkout.ts must link purchase to profile with cleanMobile");
});

test("checkout/page.tsx uses normalizePhone instead of raw regex slice", () => {
  const checkoutPageSrc = fs.readFileSync("src/app/checkout/page.tsx", "utf-8");
  assert(!checkoutPageSrc.includes("studentMobile.replace(/\\D/g, \"\").slice(-10)"), "checkout page still uses raw regex slice");
  assert(checkoutPageSrc.includes("normalizePhone"), "checkout page must use normalizePhone");
});

test("studentAccess.ts server action exists with Service Role queries", () => {
  const studentAccessPath = path.join(process.cwd(), "src", "app", "actions", "studentAccess.ts");
  assert(fs.existsSync(studentAccessPath), "studentAccess.ts must exist");
  const src = fs.readFileSync(studentAccessPath, "utf-8");
  assert(src.includes("createAdminClient"), "studentAccess.ts must use createAdminClient (Service Role)");
  assert(src.includes("verifyStudentCourseAccess"), "verifyStudentCourseAccess missing");
  assert(src.includes("getStudentActiveEnrollments"), "getStudentActiveEnrollments missing");
});

test("watch/[lessonId]/page.tsx uses verifyStudentCourseAccess server action", () => {
  const watchSrc = fs.readFileSync("src/app/watch/[lessonId]/page.tsx", "utf-8");
  assert(watchSrc.includes("verifyStudentCourseAccess"), "watch page must use verifyStudentCourseAccess");
});

test("my-courses/page.tsx uses getStudentActiveEnrollments server action", () => {
  const myCoursesSrc = fs.readFileSync("src/app/my-courses/page.tsx", "utf-8");
  assert(myCoursesSrc.includes("getStudentActiveEnrollments"), "my-courses page must use getStudentActiveEnrollments");
});

console.log("\n================================================================================");
if (failed === 0) {
  console.log(`🎉 ALL ${passed} RLS POLICIES & PHONE NORMALIZATION CHECKS PASSED!`);
} else {
  console.log(`💥 ${failed} TEST(S) FAILED! (${passed} passed)`);
  process.exit(1);
}
console.log("================================================================================\n");
