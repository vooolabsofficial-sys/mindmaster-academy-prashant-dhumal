import assert from "assert";
import { validateCoupon } from "../src/app/actions/checkout.ts";

async function run() {
  console.log("=== Testing School Restricted Coupon Logic ===");

  // 1. Matching school (case-insensitive) -> Success
  const resMatch = await validateCoupon("ABHINAVA100", "c-mm-01", "any-id", "abhinava vidyalaya, pune");
  assert.strictEqual(resMatch.success, true, "Should succeed for matching school case-insensitively");
  assert.strictEqual(resMatch.coupon?.code, "ABHINAVA100");
  console.log("✓ Matching school case-insensitive succeeded");

  // 2. Different school -> Error: हा कूपन फक्त [school name] च्या विद्यार्थ्यांसाठी आहे.
  const resMismatch = await validateCoupon("ABHINAVA100", "c-mm-01", "any-id", "Modern High School, Karad");
  assert.strictEqual(resMismatch.success, false, "Should fail for different school");
  assert.strictEqual(resMismatch.error, "हा कूपन फक्त Abhinava Vidyalaya, Pune च्या विद्यार्थ्यांसाठी आहे.");
  console.log("✓ Different school rejected with Marathi toast message");

  // 3. No school specified -> Error
  const resNoSchool = await validateCoupon("ABHINAVA100", "c-mm-01", "any-id", "");
  assert.strictEqual(resNoSchool.success, false, "Should fail when student has no school");
  assert.strictEqual(resNoSchool.error, "हा कूपन फक्त Abhinava Vidyalaya, Pune च्या विद्यार्थ्यांसाठी आहे.");
  console.log("✓ Missing school rejected with Marathi toast message");

  // 4. Unrestricted coupon -> Works for everyone
  const resUnrestricted = await validateCoupon("WELCOME50", "c-mm-01", "std-unrestricted-test", "Any Random School");
  assert.strictEqual(resUnrestricted.success, true, "Unrestricted coupon should work for any student");
  console.log("✓ Unrestricted coupon works for everyone");

  // 5. Resolving school from StudentRecord (std-new is pre-seeded with Abhinava Vidyalaya, Pune)
  const resStudentRecord = await validateCoupon("ABHINAVA100", "c-mm-01", "std-new");
  assert.strictEqual(resStudentRecord.success, true, "Should resolve school from StudentRecord");
  console.log("✓ School resolved automatically from StudentRecord");

  console.log("🎉 ALL SCHOOL COUPON TESTS PASSED!");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
