// scripts/test-multilingual-support.mjs
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  TRANSLATIONS,
  getTranslation,
} from "../src/lib/i18n.ts";

console.log("================================================================================");
console.log("🌐 VERIFYING MULTILINGUAL INDIAN LANGUAGE SUPPORT (8 LANGUAGES, ENGLISH DEFAULT)");
console.log("================================================================================\n");

// --- 1. Default Language Verification ---
console.log("--- 1. Default Language Verification ---");
assert.strictEqual(DEFAULT_LANGUAGE, "en", "Default language must be English ('en')");
console.log("✅ PASS: Default language is strictly English ('en')");

// --- 2. 8 Major Indian Languages Verification ---
console.log("\n--- 2. Supported Indian Languages Registry ---");
assert.strictEqual(SUPPORTED_LANGUAGES.length, 8, "Must support exactly 8 major Indian languages");

const expectedCodes = ["en", "mr", "hi", "gu", "kn", "te", "ta", "bn"];
expectedCodes.forEach((code) => {
  const found = SUPPORTED_LANGUAGES.find((l) => l.code === code);
  assert.ok(found, `Language ${code} must be registered`);
  assert.ok(found.nativeName, `Language ${code} must have a native name`);
  assert.ok(found.englishName, `Language ${code} must have an English name`);
  assert.ok(found.region, `Language ${code} must have a region badge`);
  console.log(`✅ PASS: [${code}] ${found.nativeName} (${found.englishName}) — ${found.region}`);
});

// --- 3. Dictionary Completeness Verification ---
console.log("\n--- 3. Translation Dictionary Completeness ---");
const englishKeys = Object.keys(TRANSLATIONS.en);
assert.ok(englishKeys.length >= 25, `Expected at least 25 translation keys, got ${englishKeys.length}`);

SUPPORTED_LANGUAGES.forEach((lang) => {
  const dict = TRANSLATIONS[lang.code];
  assert.ok(dict, `Dictionary for ${lang.code} must exist`);

  englishKeys.forEach((key) => {
    const val = dict[key];
    assert.ok(val && val.trim().length > 0, `Missing or empty translation for key "${key}" in language "${lang.code}"`);
  });
  console.log(`✅ PASS: [${lang.code}] 100% dictionary completeness (${englishKeys.length}/${englishKeys.length} keys)`);
});

// --- 4. Single-Language Purity & No Cross-Contamination ---
console.log("\n--- 4. Single-Language Purity Verification ---");
// When English is selected, no Devanagari characters (Marathi/Hindi: \u0900-\u097F) should appear
englishKeys.forEach((key) => {
  const val = TRANSLATIONS.en[key];
  const hasDevanagari = /[\u0900-\u097F]/.test(val);
  assert.strictEqual(hasDevanagari, false, `English key ${key} contains Devanagari characters: ${val}`);
});
console.log("✅ PASS: English dictionary is 100% pure English (zero Devanagari contamination)");

// When Marathi is selected, nav.home should be 'मुख्यपृष्ठ' and not 'Home'
assert.strictEqual(TRANSLATIONS.mr["nav.home"], "मुख्यपृष्ठ");
assert.strictEqual(TRANSLATIONS.hi["nav.home"], "होम");
assert.strictEqual(TRANSLATIONS.gu["nav.home"], "હોમ");
assert.strictEqual(TRANSLATIONS.kn["nav.home"], "ಮುಖಪುಟ");
assert.strictEqual(TRANSLATIONS.te["nav.home"], "హోమ్");
assert.strictEqual(TRANSLATIONS.ta["nav.home"], "முகப்பு");
assert.strictEqual(TRANSLATIONS.bn["nav.home"], "হোম");
console.log("✅ PASS: Navigation tabs resolve strictly to active native script");

// --- 5. getTranslation Fallback Logic ---
console.log("\n--- 5. getTranslation Helper Logic ---");
const enHome = getTranslation("en", "nav.home");
assert.strictEqual(enHome, "Home");
const mrHome = getTranslation("mr", "nav.home");
assert.strictEqual(mrHome, "मुख्यपृष्ठ");
// Fallback for invalid code defaults to English
const fallbackHome = getTranslation("xx", "nav.home");
assert.strictEqual(fallbackHome, "Home");
console.log("✅ PASS: getTranslation resolves active language and safely falls back to English");

// --- 6. Codebase File Integrations Audit ---
console.log("\n--- 6. Component Integrations Audit ---");
const bottomNavSrc = fs.readFileSync(path.resolve("src/components/navigation/BottomNav.tsx"), "utf8");
assert.ok(bottomNavSrc.includes("useLanguage"), "BottomNav must import useLanguage");
assert.ok(bottomNavSrc.includes("t(\"nav.home\")"), "BottomNav must translate nav.home");

const topBarSrc = fs.readFileSync(path.resolve("src/components/navigation/TopBar.tsx"), "utf8");
assert.ok(topBarSrc.includes("LanguageModal"), "TopBar must render LanguageModal");
assert.ok(topBarSrc.includes("useLanguage"), "TopBar must import useLanguage");

const profileSrc = fs.readFileSync(path.resolve("src/app/profile/page.tsx"), "utf8");
assert.ok(profileSrc.includes("LanguageModal"), "Profile must render LanguageModal");
assert.ok(profileSrc.includes("languageInfo.nativeName"), "Profile must display active native language name");

const appShellSrc = fs.readFileSync(path.resolve("src/components/navigation/AppShell.tsx"), "utf8");
assert.ok(appShellSrc.includes("LanguageProvider"), "AppShell must wrap layout in LanguageProvider");

console.log("✅ PASS: BottomNav, TopBar, Profile, and AppShell correctly integrate LanguageProvider & LanguageModal");

console.log("\n================================================================================");
console.log("🎉 ALL MULTILINGUAL INDIAN LANGUAGE VERIFICATION CHECKS PASSED!");
console.log("================================================================================");
