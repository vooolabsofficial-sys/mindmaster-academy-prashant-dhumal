import { hashArgon2, verifyArgon2 } from "./argon2";

export interface StudentAccount {
  id: string;
  phone: string; // E.164 format: +919823456789
  cleanPhone: string; // 10-digit format: 9823456789
  full_name: string;
  email?: string;
  password_hash: string;
  recovery_pin: string; // 4-digit secret security PIN for zero-cost self reset
  onboarding_completed: boolean;
  created_at: string;
  district?: string;
  taluka?: string;
  village?: string;
  school_name?: string;
  active_session_token?: string;
}


// Production Clean Slate: 0 Fake Students
const INITIAL_STUDENT_ACCOUNTS: StudentAccount[] = [];

const STORAGE_KEY = "mma_student_accounts";
const SERVER_STORE = new Map<string, StudentAccount[]>();

function getStoreFilePath(): string | null {
  if (typeof window !== "undefined") return null;
  try {
    const pathModule = require("path");
    const fsModule = require("fs");
    const osModule = require("os");
    const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
    const dir = isVercel
      ? pathModule.join(osModule.tmpdir(), "mma-data")
      : pathModule.join(process.cwd(), ".data");
    if (!fsModule.existsSync(dir)) {
      try {
        fsModule.mkdirSync(dir, { recursive: true });
      } catch {}
    }
    return pathModule.join(dir, "students-store.json");
  } catch {
    return null;
  }
}

function loadFileStore(): StudentAccount[] {
  if (typeof window !== "undefined") return [];
  try {
    const file = getStoreFilePath();
    if (!file) return [];
    const fsModule = require("fs");
    if (fsModule.existsSync(file)) {
      const data = fsModule.readFileSync(file, "utf8");
      if (data && data.trim()) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn("Failed to load students-store.json:", e);
  }
  return [];
}

function saveFileStore(accounts: StudentAccount[]): void {
  if (typeof window !== "undefined") return;
  try {
    const file = getStoreFilePath();
    if (!file) return;
    const fsModule = require("fs");
    fsModule.writeFileSync(file, JSON.stringify(accounts, null, 2), "utf8");
  } catch (e) {
    console.warn("Failed to save students-store.json:", e);
  }
}

import { normalizePhone } from "./phoneUtils";
export { normalizePhone };

export function getStudentAccounts(): StudentAccount[] {
  if (typeof window === "undefined") {
    const fromFile = loadFileStore();
    if (fromFile.length > 0) {
      SERVER_STORE.set(STORAGE_KEY, fromFile);
      return fromFile;
    }
    if (!SERVER_STORE.has(STORAGE_KEY)) {
      SERVER_STORE.set(STORAGE_KEY, [...INITIAL_STUDENT_ACCOUNTS]);
      saveFileStore([...INITIAL_STUDENT_ACCOUNTS]);
    }
    return SERVER_STORE.get(STORAGE_KEY) || [...INITIAL_STUDENT_ACCOUNTS];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STUDENT_ACCOUNTS));
      return [...INITIAL_STUDENT_ACCOUNTS];
    }
    return JSON.parse(raw);
  } catch {
    return [...INITIAL_STUDENT_ACCOUNTS];
  }
}

export function saveStudentAccounts(accounts: StudentAccount[]): void {
  if (typeof window === "undefined") {
    SERVER_STORE.set(STORAGE_KEY, accounts);
    saveFileStore(accounts);
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error("Error saving student accounts to storage:", err);
  }
}

export function findStudentByPhone(rawPhone: string): StudentAccount | undefined {
  const clean = normalizePhone(rawPhone);
  if (!clean || clean.length !== 10) return undefined;
  const accounts = getStudentAccounts();
  return accounts.find((a) => a.cleanPhone === clean || a.phone.endsWith(clean));
}

export function findStudentBySessionToken(token: string): StudentAccount | undefined {
  if (!token) return undefined;
  const accounts = getStudentAccounts();
  return accounts.find(
    (a) =>
      a.active_session_token === token ||
      token.includes(a.id) ||
      token === `tok-${a.id}`
  );
}

/**
 * Register a new student account using phone + password (zero SMS cost).
 */
export async function registerStudentAccount(params: {
  phone: string;
  password: string;
  fullName: string;
  email?: string;
  recoveryPin?: string;
  standard?: string;
  targetExam?: string;
}): Promise<{ success: boolean; student?: StudentAccount; error?: string }> {
  const clean = normalizePhone(params.phone);
  if (clean.length !== 10) {
    return { success: false, error: "Please enter a valid 10-digit mobile number." };
  }

  if (!params.password || params.password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters." };
  }

  let existing = findStudentByPhone(clean);

  // If not found in local disk cache, check live Supabase profiles table
  if (!existing && typeof window === "undefined") {
    try {
      const { createAdminClient } = require("./supabase/admin");
      const supabase = createAdminClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, phone")
        .or(`phone.eq.${clean},phone.eq.+91${clean}`)
        .maybeSingle();

      if (profile) {
        return {
          success: false,
          error: "This mobile number is already registered. Please sign in.",
        };
      }
    } catch (e) {
      console.warn("Supabase profile check during registration:", e);
    }
  }

  if (existing) {
    return {
      success: false,
      error: "This mobile number is already registered. Please sign in.",
    };
  }

  const passwordHash = await hashArgon2(params.password);
  const pin = params.recoveryPin && params.recoveryPin.length === 4 ? params.recoveryPin : "1234";

  const newStudent: StudentAccount = {
    id: `std-${Date.now()}`,
    phone: `+91${clean}`,
    cleanPhone: clean,
    full_name: params.fullName.trim() || `Student ${clean.slice(-4)}`,
    email: params.email?.trim() || undefined,
    password_hash: passwordHash,
    recovery_pin: pin,
    onboarding_completed: false,
    created_at: new Date().toISOString(),
  };

  const all = getStudentAccounts();
  saveStudentAccounts([newStudent, ...all]);

  // Instantly sync account to live Supabase profiles table
  if (typeof window === "undefined") {
    try {
      const { createAdminClient } = require("./supabase/admin");
      const supabase = createAdminClient();
      await supabase.from("profiles").upsert(
        {
          phone: clean,
          full_name: newStudent.full_name,
          email: newStudent.email || null,
          password_hash: newStudent.password_hash,
          recovery_pin: newStudent.recovery_pin,
          session_token: newStudent.active_session_token || null,
          active_session_token: newStudent.active_session_token || null,
          onboarding_completed: false,
          role: "student",
          standard: params.standard || null,
          target_exam: params.targetExam || undefined,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "phone" }
      );
    } catch (e) {
      console.warn("Supabase profile sync error during registration:", e);
    }
  }

  return { success: true, student: newStudent };
}

/**
 * Authenticate student via Phone + Password.
 */
export async function authenticateStudent(
  phone: string,
  password: string
): Promise<{ success: boolean; student?: StudentAccount; error?: string; code?: string }> {
  const clean = normalizePhone(phone);
  if (clean.length !== 10) {
    return { success: false, code: "INVALID_PHONE", error: "Please enter a valid 10-digit mobile number." };
  }

  let student = findStudentByPhone(clean);

  // If not found in memory, query live Supabase profiles table on server
  if (!student && typeof window === "undefined") {
    try {
      const { createAdminClient } = require("./supabase/admin");
      const supabase = createAdminClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .or(`phone.eq.${clean},phone.eq.+91${clean}`)
        .maybeSingle();

      if (profile) {
        student = {
          id: profile.id,
          phone: profile.phone?.startsWith("+") ? profile.phone : `+91${clean}`,
          cleanPhone: clean,
          full_name: profile.full_name || `Student ${clean.slice(-4)}`,
          email: profile.email || undefined,
          password_hash: profile.password_hash || "",
          recovery_pin: profile.recovery_pin || "1234",
          onboarding_completed: Boolean(profile.district || profile.school_name || profile.village),
          created_at: profile.created_at || new Date().toISOString(),
          district: profile.district,
          taluka: profile.taluka,
          school_name: profile.school_name || profile.school,
          active_session_token: profile.active_session_token,
        };
        const all = getStudentAccounts();
        saveStudentAccounts([student, ...all.filter((a) => a.cleanPhone !== clean)]);
      }
    } catch (e) {
      console.warn("Supabase profile lookup error in authenticateStudent:", e);
    }
  }

  if (!student) {
    return {
      success: false,
      code: "USER_NOT_FOUND",
      error: "This mobile number is not found / not registered. Please sign up or create an account.",
    };
  }

  // If password_hash is not set yet (e.g. offline grant before registration)
  if (!student.password_hash) {
    return {
      success: false,
      code: "USER_NOT_FOUND",
      error: "This mobile number is new! Please enter your name and password to create an account.",
    };
  }

  // Verify Argon2 password
  const isValid = await verifyArgon2(password, student.password_hash);

  if (!isValid) {
    return {
      success: false,
      code: "INVALID_PASSWORD",
      error: "Incorrect password. Please enter the correct password or use Forgot Password.",
    };
  }

  return { success: true, student };
}

/**
 * Self-service zero-cost password reset using 4-digit Security Recovery PIN.
 */
export async function resetStudentPasswordWithPin(params: {
  phone: string;
  recoveryPin: string;
  newPassword: string;
}): Promise<{ success: boolean; error?: string }> {
  const clean = normalizePhone(params.phone);
  if (clean.length !== 10) {
    return { success: false, error: "Invalid 10-digit mobile number." };
  }

  const student = findStudentByPhone(clean);
  if (!student) {
    return { success: false, error: "Account with this mobile number was not found." };
  }

  if (!params.recoveryPin || student.recovery_pin !== params.recoveryPin.trim()) {
    return {
      success: false,
      error: "Incorrect Security PIN. Please enter your valid 4-digit PIN or contact WhatsApp support.",
    };
  }

  if (!params.newPassword || params.newPassword.length < 6) {
    return { success: false, error: "New password must be at least 6 characters." };
  }

  const newHash = await hashArgon2(params.newPassword);
  student.password_hash = newHash;

  const all = getStudentAccounts().map((acc) => (acc.cleanPhone === clean ? student : acc));
  saveStudentAccounts(all);

  // Sync new password hash to live Supabase profiles table
  if (typeof window === "undefined") {
    try {
      const { createAdminClient } = require("./supabase/admin");
      const supabase = createAdminClient();
      supabase
        .from("profiles")
        .update({
          password_hash: newHash,
          updated_at: new Date().toISOString(),
        })
        .or(`phone.eq.${clean},phone.eq.+91${clean}`)
        .then(() => {});
    } catch (e) {
      console.warn("Supabase password update error:", e);
    }
  }

  return { success: true };
}

/**
 * Mark student onboarding completed and optionally save district/taluka/school.
 */
export function completeStudentOnboarding(
  phone: string,
  details?: {
    district?: string;
    taluka?: string;
    school_name?: string;
    village?: string;
    fullName?: string;
  }
): boolean {
  const clean = normalizePhone(phone);
  if (!clean || clean.length !== 10) return false;

  const accounts = getStudentAccounts();
  const student = accounts.find((a) => a.cleanPhone === clean || a.phone.endsWith(clean));
  if (!student) return false;

  student.onboarding_completed = true;
  if (details?.fullName) student.full_name = details.fullName;
  if (details?.district) student.district = details.district;
  if (details?.taluka) student.taluka = details.taluka;
  if (details?.village) student.village = details.village;
  if (details?.school_name) student.school_name = details.school_name;

  const updated = accounts.map((acc) => (acc.cleanPhone === clean ? student : acc));
  saveStudentAccounts(updated);

  // Sync onboarding state to live Supabase profiles table
  if (typeof window === "undefined") {
    try {
      const { createAdminClient } = require("./supabase/admin");
      const supabase = createAdminClient();
      supabase
        .from("profiles")
        .upsert(
          {
            phone: clean,
            ...(details?.fullName ? { full_name: details.fullName.trim() } : {}),
            village: details?.village?.trim() || null,
            taluka: details?.taluka?.trim() || null,
            district: details?.district?.trim() || null,
            school_name: details?.school_name?.trim() || null,
            school: details?.school_name?.trim() || null,
            onboarding_completed: true,
            role: "student",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "phone" }
        )
        .then(() => {});
    } catch (e) {
      console.warn("Supabase onboarding profile sync error:", e);
    }
  }

  return true;
}

/**
 * Update academic profile fields, PIN, or password for a registered student.
 */
export function updateStudentProfileFields(
  phone: string,
  fields: {
    fullName?: string;
    standard?: string;
    targetExam?: string;
    schoolName?: string;
    village?: string;
    taluka?: string;
    district?: string;
    recoveryPin?: string;
    passwordHash?: string;
  }
): boolean {
  const clean = normalizePhone(phone);
  if (!clean || clean.length !== 10) return false;

  const accounts = getStudentAccounts();
  const student = accounts.find((a) => a.cleanPhone === clean || a.phone.endsWith(clean));
  if (!student) return false;

  if (fields.fullName) student.full_name = fields.fullName.trim();
  if (fields.district) student.district = fields.district.trim();
  if (fields.taluka) student.taluka = fields.taluka.trim();
  if (fields.village) student.village = fields.village.trim();
  if (fields.schoolName) student.school_name = fields.schoolName.trim();
  if (fields.recoveryPin) student.recovery_pin = fields.recoveryPin.trim();
  if (fields.passwordHash) student.password_hash = fields.passwordHash;

  const updated = accounts.map((acc) => (acc.cleanPhone === clean ? student : acc));
  saveStudentAccounts(updated);
  return true;
}

// ---------------------------------------------------------------------------
// SINGLE-DEVICE LOGIN LOCK (1 Student = 1 Active Device)
// ---------------------------------------------------------------------------
const ACTIVE_STUDENT_SESSIONS = new Map<string, string>(); // cleanPhone -> sessionToken

export function recordActiveStudentSession(
  studentId: string,
  rawPhone: string,
  sessionToken: string
): void {
  const clean = normalizePhone(rawPhone);
  if (clean) {
    ACTIVE_STUDENT_SESSIONS.set(clean, sessionToken);
  }
  if (studentId) {
    ACTIVE_STUDENT_SESSIONS.set(studentId, sessionToken);
  }

  // Update in in-memory / local storage accounts
  const accounts = getStudentAccounts();
  const updated = accounts.map((acc) => {
    if (acc.id === studentId || (clean && acc.cleanPhone === clean)) {
      return { ...acc, active_session_token: sessionToken };
    }
    return acc;
  });
  saveStudentAccounts(updated);

  // Sync to Supabase profiles table if available
  if (typeof window === "undefined" && clean) {
    try {
      const { createAdminClient } = require("./supabase/admin");
      const supabase = createAdminClient();
      supabase
        .from("profiles")
        .update({
          active_session_token: sessionToken,
          session_token: sessionToken,
          updated_at: new Date().toISOString(),
        })
        .or(`phone.eq.${clean},phone.eq.+91${clean}`)
        .then(() => {});
    } catch {}
  }
}

export function validateStudentSession(
  rawPhoneOrId: string,
  sessionToken: string | undefined | null
): boolean {
  if (!sessionToken) return false;
  const clean = normalizePhone(rawPhoneOrId);

  // Check active session cache by clean phone
  if (clean && ACTIVE_STUDENT_SESSIONS.has(clean)) {
    const currentToken = ACTIVE_STUDENT_SESSIONS.get(clean);
    return currentToken === sessionToken;
  }

  // Check active session cache by ID
  if (rawPhoneOrId && ACTIVE_STUDENT_SESSIONS.has(rawPhoneOrId)) {
    const currentToken = ACTIVE_STUDENT_SESSIONS.get(rawPhoneOrId);
    return currentToken === sessionToken;
  }

  // Check persisted student accounts
  const accounts = getStudentAccounts();
  const student = accounts.find(
    (a) =>
      a.id === rawPhoneOrId ||
      (clean && a.cleanPhone === clean) ||
      (clean && a.phone.endsWith(clean))
  );

  if (student?.active_session_token) {
    const isValid = student.active_session_token === sessionToken;
    if (clean) ACTIVE_STUDENT_SESSIONS.set(clean, student.active_session_token);
    return isValid;
  }

  // If no session recorded yet, accept current token as active
  if (clean) {
    ACTIVE_STUDENT_SESSIONS.set(clean, sessionToken);
  }
  return true;
}

export function resetStudentDeviceSessionLock(rawPhoneOrId: string): boolean {
  const clean = normalizePhone(rawPhoneOrId);
  if (clean) ACTIVE_STUDENT_SESSIONS.delete(clean);
  if (rawPhoneOrId) ACTIVE_STUDENT_SESSIONS.delete(rawPhoneOrId);

  // Clear in local accounts
  const accounts = getStudentAccounts();
  const updated = accounts.map((acc) => {
    if (acc.id === rawPhoneOrId || (clean && acc.cleanPhone === clean)) {
      const copy = { ...acc };
      delete copy.active_session_token;
      return copy;
    }
    return acc;
  });
  saveStudentAccounts(updated);

  // If in browser, notify server endpoint to clear server memory session & disk store
  if (typeof window !== "undefined" && clean) {
    try {
      fetch("/api/student/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "admin-reset-session", phone: clean }),
      }).catch(() => {});
    } catch {}
  }

  // Sync to Supabase profiles
  try {
    let supabase: any = null;
    if (typeof window === "undefined") {
      const { createAdminClient } = require("./supabase/admin");
      supabase = createAdminClient();
    } else {
      const { createClient } = require("./supabase/client");
      supabase = createClient();
    }

    if (supabase) {
      if (clean) {
        supabase
          .from("profiles")
          .update({ active_session_token: null, session_token: null })
          .or(`phone.eq.${clean},phone.eq.+91${clean}`)
          .then(() => {});
      } else if (rawPhoneOrId) {
        supabase
          .from("profiles")
          .update({ active_session_token: null, session_token: null })
          .eq("id", rawPhoneOrId)
          .then(() => {});
      }
    }
  } catch {}

  return true;
}

/**
 * Admin Power Action: Reset student password directly using Argon2id.
 * Updates in-memory accounts, local/disk store, and Supabase profiles table.
 */
export async function adminResetStudentPassword(
  rawPhoneOrId: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const clean = normalizePhone(rawPhoneOrId);
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "New password must be at least 6 characters long." };
  }

  try {
    const newHash = await hashArgon2(newPassword);

    // 1. Update in-memory / local storage accounts
    const accounts = getStudentAccounts();
    let accountUpdated = false;
    const updated = accounts.map((acc) => {
      if (
        (clean && acc.cleanPhone === clean) ||
        acc.id === rawPhoneOrId ||
        (clean && acc.phone.endsWith(clean))
      ) {
        accountUpdated = true;
        return {
          ...acc,
          password_hash: newHash,
        };
      }
      return acc;
    });

    if (accountUpdated) {
      saveStudentAccounts(updated);
    }

    // 2. Client-side fetch to server API route for .data/students-store.json update
    if (typeof window !== "undefined") {
      try {
        await fetch("/api/student/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "admin-reset-password",
            phone: clean || rawPhoneOrId,
            newPassword,
          }),
        });
      } catch (err) {
        console.warn("Server reset API call warning:", err);
      }
    }

    // 3. Update Supabase profiles table
    let supabase: any = null;
    if (typeof window === "undefined") {
      const { createAdminClient } = require("./supabase/admin");
      supabase = createAdminClient();
    } else {
      const { createClient } = require("./supabase/client");
      supabase = createClient();
    }

    if (supabase) {
      if (clean) {
        await supabase
          .from("profiles")
          .update({
            password_hash: newHash,
            updated_at: new Date().toISOString(),
          })
          .or(`phone.eq.${clean},phone.eq.+91${clean}`);
      } else {
        await supabase
          .from("profiles")
          .update({
            password_hash: newHash,
            updated_at: new Date().toISOString(),
          })
          .eq("id", rawPhoneOrId);
      }
    }

    return { success: true };
  } catch (e: any) {
    console.error("adminResetStudentPassword error:", e);
    return { success: false, error: e?.message || "Failed to reset student password." };
  }
}


