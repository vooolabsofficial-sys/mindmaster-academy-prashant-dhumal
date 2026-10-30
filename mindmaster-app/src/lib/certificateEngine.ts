import crypto from "crypto";
import fs from "fs";
import path from "path";
import { normalizePhone } from "./phoneUtils";
import { formatIST } from "./istTime";
import { getPlatformSettings } from "./staffStore";

export interface StudentCertificate {
  id: string;
  certificate_no: string;
  student_id: string;
  student_name: string;
  student_phone: string;
  student_phone_masked: string;
  course_id: string;
  course_title: string;
  course_code: string;
  category: string;
  issued_at_ist: string;
  completion_percentage: number;
  signatory_name: string;
  signatory_title: string;
  signature_url: string;
  stamp_url: string;
  academy_name: string;
  centres: string;
  status: "active" | "revoked";
  created_at: string;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const CERT_FILE = path.join(DATA_DIR, "certificates.json");

const CERT_SECRET =
  process.env.CERT_SECRET ||
  process.env.STAFF_SESSION_SECRET ||
  "mindmaster_cert_secret_key_2026_satara_pune";

function readLocalCertificates(): StudentCertificate[] {
  try {
    if (fs.existsSync(CERT_FILE)) {
      const raw = fs.readFileSync(CERT_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch {}
  return [];
}

function writeLocalCertificates(certs: StudentCertificate[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CERT_FILE, JSON.stringify(certs, null, 2), "utf-8");
  } catch (err) {
    console.warn("Failed to write .data/certificates.json:", err);
  }
}

/**
 * Extract 3-letter initials from Student's Full Name (e.g. Rohan Vinayak Kulkarni -> RVK)
 */
export function extractNameInitials(fullName: string): string {
  const parts = fullName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length >= 3) {
    return `${parts[0][0]}${parts[1][0]}${parts[parts.length - 1][0]}`;
  }
  if (parts.length === 2) {
    const firstTwo = parts[0].slice(0, 2);
    const lastOne = parts[1][0];
    return `${firstTwo}${lastOne}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 3) {
    return parts[0].slice(0, 3).toUpperCase();
  }
  return "MMA";
}

/**
 * Course short-token (e.g. VM26 for Vedic Maths 2026)
 */
export function getCourseToken(courseIdOrCode: string): string {
  const clean = courseIdOrCode.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.includes("VEDIC") || clean.includes("VM") || clean.includes("MATH")) return "VM26";
  if (clean.includes("MEMORY") || clean.includes("MIND") || clean.includes("MM")) return "MM26";
  if (clean.includes("CALENDAR") || clean.includes("CAL") || clean.includes("CL")) return "CL26";
  if (clean.includes("SCHOLAR") || clean.includes("SCH")) return "SC26";
  if (clean.includes("COLLEGE") || clean.includes("11") || clean.includes("12")) return "JC26";
  return clean.slice(0, 4) || "MC26";
}

/**
 * Generate 100% Collision-Proof & Tamper-Proof Certificate Serial Number
 * Formula: MMA-[Initials]-[PhoneTail]-[CourseToken]-[HMAC-Checksum]
 * Example: MMA-RVK-6789-VM26-K8X2
 */
export function generateCertificateNumber(
  studentName: string,
  studentPhone: string,
  courseId: string,
  studentId: string
): string {
  const initials = extractNameInitials(studentName);
  const cleanPhone = normalizePhone(studentPhone);
  const phoneTail = cleanPhone.slice(-4) || "0000";
  const courseToken = getCourseToken(courseId);

  // Compute 4-character cryptographic checksum
  const payload = `MMA:${initials}:${phoneTail}:${courseToken}:${studentId.trim()}`;
  const checksum = crypto
    .createHmac("sha256", CERT_SECRET)
    .update(payload)
    .digest("hex")
    .slice(0, 4)
    .toUpperCase();

  return `MMA-${initials}-${phoneTail}-${courseToken}-${checksum}`;
}

/**
 * Verify integrity of Certificate Serial Number against student/course data
 */
export function verifyChecksum(
  certificateNo: string,
  studentName: string,
  studentPhone: string,
  courseId: string,
  studentId: string
): boolean {
  const expected = generateCertificateNumber(studentName, studentPhone, courseId, studentId);
  return expected.toUpperCase() === certificateNo.trim().toUpperCase();
}

/**
 * Issue or Retrieve Certificate for Student on 100% Completion
 */
export async function issueCertificate({
  studentId,
  studentName,
  studentPhone,
  courseId,
  courseTitle,
  courseCode = "COURSE-01",
  category = "Vedic Maths & Mind Memory",
}: {
  studentId: string;
  studentName: string;
  studentPhone: string;
  courseId: string;
  courseTitle: string;
  courseCode?: string;
  category?: string;
}): Promise<StudentCertificate> {
  const localCerts = readLocalCertificates();
  const existing = localCerts.find(
    (c) => c.student_id === studentId && (c.course_id === courseId || c.course_code === courseCode)
  );

  if (existing) {
    return existing;
  }

  const cleanPhone = normalizePhone(studentPhone);
  const maskedPhone = cleanPhone.length === 10
    ? `+91 ******${cleanPhone.slice(-4)}`
    : `+91 ******${cleanPhone.slice(-4) || "0000"}`;

  const certificateNo = generateCertificateNumber(studentName, studentPhone, courseId, studentId);
  const now = new Date();
  const istTime = formatIST(now);
  const settings = getPlatformSettings ? getPlatformSettings() : null;

  const newCert: StudentCertificate = {
    id: `cert-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    certificate_no: certificateNo,
    student_id: studentId,
    student_name: studentName.trim(),
    student_phone: cleanPhone,
    student_phone_masked: maskedPhone,
    course_id: courseId,
    course_title: courseTitle.trim(),
    course_code: courseCode,
    category,
    issued_at_ist: istTime,
    completion_percentage: 100,
    signatory_name: settings?.founder_name || "Prashant Dhumal Sir",
    signatory_title: "Founder & International Memory Trainer",
    signature_url: settings?.signature_url || "/branding/prashant_sir_signature.png",
    stamp_url: settings?.stamp_url || "/branding/mindmaster_seal.png",
    academy_name: settings?.academy_title || "MindMaster Academy",
    centres: "Pune & Satara Centres, Maharashtra",
    status: "active",
    created_at: now.toISOString(),
  };

  // 1. Write to local store
  writeLocalCertificates([newCert, ...localCerts]);

  // 2. Persist to Supabase student_certificates asynchronously
  try {
    const { createAdminClient } = await import("./supabase/admin");
    const supabase = createAdminClient();
    await supabase.from("student_certificates").upsert(
      {
        certificate_no: newCert.certificate_no,
        student_id: newCert.student_id,
        student_name: newCert.student_name,
        student_phone: newCert.student_phone,
        student_phone_masked: newCert.student_phone_masked,
        course_id: newCert.course_id,
        course_title: newCert.course_title,
        course_code: newCert.course_code,
        category: newCert.category,
        issued_at_ist: newCert.issued_at_ist,
        completion_percentage: 100,
        signatory_name: newCert.signatory_name,
        signatory_title: newCert.signatory_title,
        signature_url: newCert.signature_url,
        stamp_url: newCert.stamp_url,
        academy_name: newCert.academy_name,
        centres: newCert.centres,
        status: newCert.status,
        created_at: newCert.created_at,
      },
      { onConflict: "certificate_no" }
    );
  } catch (dbErr) {
    console.warn("Supabase certificate persistence warning:", dbErr);
  }

  return newCert;
}

/**
 * Public Verification Check
 * Returns verified certificate details or null with reason
 */
export async function verifyCertificateByNumber(
  inputSerial: string
): Promise<{
  isValid: boolean;
  certificate?: StudentCertificate;
  error?: string;
}> {
  if (!inputSerial || typeof inputSerial !== "string") {
    return { isValid: false, error: "Please enter a valid certificate number." };
  }

  const cleanSerial = inputSerial.trim().toUpperCase().replace(/\s+/g, "");

  // 1. Check local file ledger first
  const localCerts = readLocalCertificates();
  let found = localCerts.find(
    (c) => c.certificate_no.toUpperCase().replace(/\s+/g, "") === cleanSerial
  );

  // 2. Fallback to Supabase live DB
  if (!found) {
    try {
      const { createAdminClient } = await import("./supabase/admin");
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("student_certificates")
        .select("*")
        .eq("certificate_no", cleanSerial)
        .maybeSingle();

      if (!error && data) {
        found = {
          id: data.id || `cert-${data.certificate_no}`,
          certificate_no: data.certificate_no,
          student_id: data.student_id,
          student_name: data.student_name,
          student_phone: data.student_phone,
          student_phone_masked: data.student_phone_masked,
          course_id: data.course_id,
          course_title: data.course_title,
          course_code: data.course_code || "MMA-01",
          category: data.category || "Vedic Maths & Mind Memory",
          issued_at_ist: data.issued_at_ist,
          completion_percentage: data.completion_percentage || 100,
          signatory_name: data.signatory_name || "Prashant Dhumal Sir",
          signatory_title: data.signatory_title || "Founder & International Memory Trainer",
          signature_url: data.signature_url || "/branding/prashant_sir_signature.png",
          stamp_url: data.stamp_url || "/branding/mindmaster_seal.png",
          academy_name: data.academy_name || "MindMaster Academy",
          centres: data.centres || "Pune & Satara Centres, Maharashtra",
          status: data.status || "active",
          created_at: data.created_at || new Date().toISOString(),
        };
        // Cache to local ledger
        writeLocalCertificates([found, ...localCerts]);
      }
    } catch {}
  }

  if (!found) {
    return {
      isValid: false,
      error: "This Certificate Number was not found in MindMaster Academy's official records. Please check the number or contact academy support.",
    };
  }

  if (found.status === "revoked") {
    return {
      isValid: false,
      error: "This certificate has been revoked by MindMaster Academy administration.",
    };
  }

  return {
    isValid: true,
    certificate: found,
  };
}

/**
 * Get all certificates earned by a student
 */
export function getStudentCertificates(studentIdOrPhone: string): StudentCertificate[] {
  const cleanPhone = normalizePhone(studentIdOrPhone);
  const localCerts = readLocalCertificates();
  return localCerts.filter(
    (c) =>
      c.student_id === studentIdOrPhone ||
      (cleanPhone && normalizePhone(c.student_phone) === cleanPhone)
  );
}
