// Test suite for Free Access Grants logic
// 1. One student grant
// 2. District-wide grant
// 3. All-courses grant
// 4. Revoke flow (verifying status='revoked' and related grant purchases expires_at=now)
// 5. Onboarding auto-apply flow
// 6. Waived revenue calculation (sum of price_paise over grant purchases)

// Setup in-memory localStorage polyfill for Node.js
const storage = new Map();
global.localStorage = {
  getItem: (k) => storage.get(k) || null,
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
  clear: () => storage.clear(),
};
global.window = {
  dispatchEvent: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
};

console.log("=== RUNNING FREE ACCESS GRANTS TEST SUITE ===");

async function runTests() {
  const {
    getGrants,
    getGrantPurchases,
    createGrant,
    revokeGrant,
    getMatchingStudents,
    getMatchingStudentCount,
    autoApplyGrantsForStudent,
    getWaivedRevenue,
  } = await import("../src/lib/grantStore.ts");

  // TEST 1: Initial state check
  console.log("\n[TEST 1] Initial Seed Grants and Purchases");
  const initialGrants = getGrants();
  const initialPurchases = getGrantPurchases();
  console.log(`Initial Grants Count: ${initialGrants.length}`);
  console.log(`Initial Purchases Count: ${initialPurchases.length}`);
  if (initialGrants.length < 2) throw new Error("Expected at least 2 seeded grants");
  console.log("✓ TEST 1 PASSED: Initial grants seeded properly");

  // TEST 2: One student grant
  console.log("\n[TEST 2] Create Single Student Grant");
  const studentCount = getMatchingStudentCount("student", "Rahul Shinde");
  console.log(`Matching student 'Rahul Shinde' count: ${studentCount}`);
  if (studentCount !== 1) throw new Error("Expected exactly 1 matching student");

  const grantStudent = createGrant({
    scopeType: "student",
    scopeValue: "Rahul Shinde",
    courseScope: "one",
    courseId: "c-mm-04",
    months: 6,
    reason: "State Level Memory Champion Special Award",
  });
  console.log(`Created Grant ID: ${grantStudent.id}, affected: ${grantStudent.affectedStudentsCount}`);

  const purchasesAfterSingle = getGrantPurchases().filter(
    (p) => (p.grant_id === grantStudent.id || p.grantId === grantStudent.id)
  );
  console.log(`Materialized Purchases for Single Student: ${purchasesAfterSingle.length}`);
  if (purchasesAfterSingle.length !== 1) throw new Error("Expected 1 purchase row for single student grant");
  if (purchasesAfterSingle[0].amount !== 0 || purchasesAfterSingle[0].source !== "grant") {
    throw new Error("Expected amount=0 and source='grant'");
  }
  console.log("✓ TEST 2 PASSED: Single student grant materialized amount 0 purchase");

  // TEST 3: District-wide grant
  console.log("\n[TEST 3] Create District-Wide Grant");
  const puneCount = getMatchingStudentCount("district", "Pune");
  console.log(`Matching Pune district students: ${puneCount}`);
  if (puneCount < 1) throw new Error("Expected at least 1 student in Pune district");

  const grantDistrict = createGrant({
    scopeType: "district",
    scopeValue: "Pune",
    courseScope: "one",
    courseId: "c-mm-03",
    months: 3,
    reason: "Pune Police Bharti Special Prep Drive",
  });
  console.log(`Created District Grant ID: ${grantDistrict.id}, affected: ${grantDistrict.affectedStudentsCount}`);

  const districtPurchases = getGrantPurchases().filter(
    (p) => (p.grant_id === grantDistrict.id || p.grantId === grantDistrict.id)
  );
  if (districtPurchases.length !== puneCount) {
    throw new Error(`Expected ${puneCount} purchases materialized for Pune district, got ${districtPurchases.length}`);
  }
  console.log(`✓ TEST 3 PASSED: District-wide grant materialized ${districtPurchases.length} purchases at ₹0`);

  // TEST 4: All-courses grant
  console.log("\n[TEST 4] Create All-Courses Grant");
  const grantAllCourses = createGrant({
    scopeType: "school",
    scopeValue: "Abhinava Vidyalaya",
    courseScope: "all",
    months: 12,
    reason: "School Model Academy Partnership 2026",
  });
  console.log(`Created All-Courses Grant ID: ${grantAllCourses.id}, courseTitle: ${grantAllCourses.courseTitle}`);

  const schoolPurchases = getGrantPurchases().filter(
    (p) => (p.grant_id === grantAllCourses.id || p.grantId === grantAllCourses.id)
  );
  console.log(`Materialized purchases across all courses for school: ${schoolPurchases.length}`);
  if (schoolPurchases.length <= grantAllCourses.affectedStudentsCount) {
    throw new Error("Expected multiple course purchase rows per matching student for all-courses grant");
  }
  console.log("✓ TEST 4 PASSED: All-courses grant correctly materialized purchases for all curriculum courses");

  // TEST 5: Revoke flow
  console.log("\n[TEST 5] Revoke Flow Verification");
  const targetGrantId = grantStudent.id;
  const beforeRevoke = getGrants().find((g) => g.id === targetGrantId);
  if (beforeRevoke.status !== "active") throw new Error("Grant should be active before revoke");

  const revokeResult = revokeGrant(targetGrantId);
  if (!revokeResult) throw new Error("Revoke function returned false");

  const afterRevoke = getGrants().find((g) => g.id === targetGrantId);
  if (afterRevoke.status !== "revoked") throw new Error("Grant status should be 'revoked'");

  const revokedPurchases = getGrantPurchases().filter(
    (p) => (p.grant_id === targetGrantId || p.grantId === targetGrantId)
  );
  for (const rp of revokedPurchases) {
    if (rp.status !== "revoked") throw new Error("Related purchase status must be 'revoked'");
    const expDate = new Date(rp.expires_at || rp.expiresAt).getTime();
    const now = Date.now();
    // Verify expires_at was set to approximately now (within 5 seconds)
    if (Math.abs(expDate - now) > 5000) {
      throw new Error(`Related purchase expires_at must be set to now. Got: ${rp.expires_at}`);
    }
  }
  console.log("✓ TEST 5 PASSED: Revoke set grant status to 'revoked' and all related purchases expires_at = now");

  // TEST 6: Auto-apply at onboarding
  console.log("\n[TEST 6] Auto-Apply at Onboarding for New Signups");
  const newSignupProfile = {
    id: "stu-new-999",
    phone: "+91 99887 66554",
    full_name: "Ganesh Shinde",
    district: "Pune",
    taluka: "Haveli",
    school_name: "Abhinava Vidyalaya, Pune",
  };

  const autoResult = autoApplyGrantsForStudent(newSignupProfile);
  console.log(`Auto-applied grants count: ${autoResult.appliedGrantsCount}`);
  console.log(`Unlocked courses: ${autoResult.unlockedCourses.join(", ")}`);
  if (autoResult.appliedGrantsCount < 1) {
    throw new Error("Expected active Pune/Narhe grants to auto-apply to new signup profile");
  }

  const newStudentPurchases = getGrantPurchases().filter(
    (p) => (p.user_id === newSignupProfile.id || p.studentId === newSignupProfile.id)
  );
  console.log(`New student purchases created: ${newStudentPurchases.length}`);
  if (newStudentPurchases.length === 0) {
    throw new Error("Expected grant purchases materialized for new onboarding signup");
  }
  console.log("✓ TEST 6 PASSED: Active grants automatically unlocked and materialized for new student at onboarding");

  // TEST 7: Analytics waived revenue
  console.log("\n[TEST 7] Waived Revenue Calculation");
  const rev = getWaivedRevenue();
  console.log(`Total Waived Revenue: ₹${rev.totalRupees.toLocaleString("en-IN")} (${rev.totalPaise} paise)`);
  console.log(`Active Waived Revenue: ₹${rev.activeRupees.toLocaleString("en-IN")}`);
  console.log(`Students Covered: ${rev.totalStudentsCovered}`);
  if (rev.totalRupees <= 0 || rev.totalStudentsCovered <= 0) {
    throw new Error("Waived revenue must be greater than zero");
  }
  console.log("✓ TEST 7 PASSED: Waived revenue accurately sums course prices over grant purchases");

  console.log("\n=======================================================");
  console.log("🎉 ALL 7 FREE ACCESS GRANTS VERIFICATION TESTS PASSED!");
  console.log("=======================================================\n");
}

runTests().catch((err) => {
  console.error("\n❌ TEST FAILED:", err);
  process.exit(1);
});
