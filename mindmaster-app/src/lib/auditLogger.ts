import { formatIST } from "./istTime";

declare global {
  // eslint-disable-next-line no-var
  var _mma_server_audit_logs: any[] | undefined;
}

if (!globalThis._mma_server_audit_logs) {
  globalThis._mma_server_audit_logs = [];
}

function getNodeFs() {
  if (typeof process !== "undefined" && process.env?.NEXT_RUNTIME === "edge") return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("fs");
  } catch {
    return null;
  }
}

function getNodePaths() {
  if (typeof process !== "undefined" && process.env?.NEXT_RUNTIME === "edge") return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const p = require("path");
    const dataDir = p.join(process.cwd(), ".data");
    const auditFile = p.join(dataDir, "audit_logs.json");
    return { dataDir, auditFile };
  } catch {
    return null;
  }
}

export type AuditCategory =
  | "admissions"
  | "settlements"
  | "catalog"
  | "security"
  | "system";

export type AuditSeverity = "info" | "warning" | "critical";

export interface AuditLogInput {
  staff_id: string;
  staff_name?: string;
  staff_role?: string;
  action: string;
  category?: AuditCategory;
  severity?: AuditSeverity;
  entity_type: string;
  entity_id?: string;
  entity_name?: string;
  target_student_phone?: string;
  target_student_name?: string;
  diff?: {
    previous_value?: any;
    new_value?: any;
  };
  meta?: any;
}

export interface ForensicAuditLogEntry {
  id: string;
  staffId: string;
  staff_id: string;
  staffName: string;
  staffRole: string;
  action: string;
  category: AuditCategory;
  severity: AuditSeverity;
  entityType: string;
  entity_type: string;
  entityId: string;
  entity_id: string;
  entityName: string;
  targetStudentPhone?: string;
  targetStudentName?: string;
  diff?: {
    previous_value?: any;
    new_value?: any;
  };
  details: string;
  meta: any;
  timestamp: string;
  recorded_at_ist: string;
  at: string;
  created_at: string;
}

function loadLocalLogs(): ForensicAuditLogEntry[] {
  try {
    const fs = getNodeFs();
    const paths = getNodePaths();
    if (fs && paths && fs.existsSync(paths.auditFile)) {
      const raw = fs.readFileSync(paths.auditFile, "utf-8");
      return JSON.parse(raw);
    }
  } catch {}
  return [];
}

function saveLocalLogs(logs: ForensicAuditLogEntry[]) {
  try {
    const fs = getNodeFs();
    const paths = getNodePaths();
    if (fs && paths) {
      if (!fs.existsSync(paths.dataDir)) {
        fs.mkdirSync(paths.dataDir, { recursive: true });
      }
      // Cap to 3,000 entries
      const capped = logs.slice(0, 3000);
      fs.writeFileSync(paths.auditFile, JSON.stringify(capped, null, 2), "utf-8");
    }
  } catch (err) {
    console.warn("Failed to write .data/audit_logs.json:", err);
  }
}

// Populate global store from local disk on first start
if (globalThis._mma_server_audit_logs.length === 0) {
  const loaded = loadLocalLogs();
  if (loaded.length > 0) {
    globalThis._mma_server_audit_logs = loaded;
  }
}

function inferCategory(action: string, entityType: string): AuditCategory {
  const act = action.toUpperCase();
  const ent = entityType.toLowerCase();

  if (act.includes("GRANT") || act.includes("ADMISSION") || ent.includes("grant") || ent.includes("student")) {
    return "admissions";
  }
  if (act.includes("CASH") || act.includes("SETTLE") || act.includes("PAYMENT") || act.includes("ORDER")) {
    return "settlements";
  }
  if (act.includes("LOGIN") || act.includes("AUTH") || act.includes("PASSWORD") || act.includes("LOCKOUT") || act.includes("FORBIDDEN")) {
    return "security";
  }
  if (ent.includes("course") || ent.includes("video") || ent.includes("coupon") || ent.includes("book") || ent.includes("cms")) {
    return "catalog";
  }
  return "system";
}

function inferSeverity(action: string, meta?: any): AuditSeverity {
  const act = action.toUpperCase();
  if (
    act.includes("DELETE") ||
    act.includes("LOCKOUT") ||
    act.includes("SUSPEND") ||
    act.includes("FORBIDDEN") ||
    act.includes("TAMPER") ||
    meta?.isSecurityAlert
  ) {
    return "critical";
  }
  if (act.includes("UPDATE") || act.includes("RESET") || act.includes("PASSWORD_CHANGE")) {
    return "warning";
  }
  return "info";
}

/**
 * 100% Append-Only Centralized Server Audit Logger
 * Stamped in exact Indian Standard Time (IST - Asia/Kolkata).
 */
export function recordServerAuditLog(entry: AuditLogInput): ForensicAuditLogEntry {
  if (!globalThis._mma_server_audit_logs) {
    globalThis._mma_server_audit_logs = [];
  }

  const now = new Date();
  const istFormatted = formatIST(now);
  const category = entry.category || inferCategory(entry.action, entry.entity_type);
  const severity = entry.severity || inferSeverity(entry.action, entry.meta);

  const newLogEntry: ForensicAuditLogEntry = {
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    staffId: entry.staff_id,
    staff_id: entry.staff_id,
    staffName: entry.staff_name || entry.staff_id,
    staffRole: entry.staff_role || "sub_admin",
    action: entry.action,
    category,
    severity,
    entityType: entry.entity_type,
    entity_type: entry.entity_type,
    entityId: entry.entity_id || "target",
    entity_id: entry.entity_id || "target",
    entityName: entry.entity_name || entry.entity_type,
    targetStudentPhone: entry.target_student_phone || entry.meta?.studentPhone || entry.meta?.phone,
    targetStudentName: entry.target_student_name || entry.meta?.studentName || entry.meta?.name,
    diff: entry.diff || entry.meta?.diff || undefined,
    meta: typeof entry.meta === "object" ? entry.meta : { raw: entry.meta || "" },
    details:
      typeof entry.meta === "string"
        ? entry.meta
        : entry.meta?.details || JSON.stringify(entry.diff || entry.meta || {}),
    timestamp: istFormatted,
    recorded_at_ist: istFormatted,
    at: now.toISOString(),
    created_at: now.toISOString(),
  };

  globalThis._mma_server_audit_logs.unshift(newLogEntry);

  if (globalThis._mma_server_audit_logs.length > 3000) {
    globalThis._mma_server_audit_logs = globalThis._mma_server_audit_logs.slice(0, 3000);
  }

  // Backup to local disk
  saveLocalLogs(globalThis._mma_server_audit_logs);

  // Persist to Supabase audit_log asynchronously
  try {
    const { createAdminClient } = require("./supabase/admin");
    const supabase = createAdminClient();
    supabase
      .from("audit_log")
      .insert({
        staff_id: entry.staff_id,
        action: entry.action,
        entity_type: entry.entity_type,
        entity_id: entry.entity_id || "target",
        details: newLogEntry.details,
        meta: {
          ...newLogEntry.meta,
          category,
          severity,
          diff: newLogEntry.diff,
          target_student_phone: newLogEntry.targetStudentPhone,
          target_student_name: newLogEntry.targetStudentName,
          recorded_at_ist: istFormatted,
        },
        at: now.toISOString(),
        created_at: now.toISOString(),
      })
      .then(() => {})
      .catch((err: any) => console.warn("Supabase audit_log insert error:", err?.message || err));
  } catch {}

  return newLogEntry;
}

export function getServerAuditLogs(): ForensicAuditLogEntry[] {
  if (!globalThis._mma_server_audit_logs || globalThis._mma_server_audit_logs.length === 0) {
    globalThis._mma_server_audit_logs = loadLocalLogs();
  }
  return globalThis._mma_server_audit_logs;
}

export async function fetchDbAuditLogs(staffId?: string): Promise<ForensicAuditLogEntry[]> {
  try {
    const { createAdminClient } = require("./supabase/admin");
    const supabase = createAdminClient();
    let query = supabase
      .from("audit_log")
      .select("*, staff_accounts(full_name, role)")
      .order("at", { ascending: false })
      .limit(300);

    if (staffId && staffId !== "all") {
      query = query.eq("staff_id", staffId);
    }

    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      const mapped: ForensicAuditLogEntry[] = data.map((d: any) => {
        const meta = d.meta || {};
        const recordedAt = meta.recorded_at_ist || formatIST(d.at || d.created_at);
        return {
          id: String(d.id),
          staffId: d.staff_id,
          staff_id: d.staff_id,
          staffName: meta.staffName || d.staff_accounts?.full_name || d.staff_id,
          staffRole: meta.staffRole || d.staff_accounts?.role || "sub_admin",
          action: d.action,
          category: meta.category || inferCategory(d.action, d.entity_type),
          severity: meta.severity || inferSeverity(d.action, meta),
          entityType: d.entity_type,
          entity_type: d.entity_type,
          entityId: d.entity_id,
          entity_id: d.entity_id,
          entityName: meta.entityName || d.entity_id,
          targetStudentPhone: meta.target_student_phone || meta.studentPhone,
          targetStudentName: meta.target_student_name || meta.studentName,
          diff: meta.diff || undefined,
          details: d.details || "",
          meta,
          timestamp: recordedAt,
          recorded_at_ist: recordedAt,
          at: d.at || d.created_at,
          created_at: d.created_at || d.at,
        };
      });
      return mapped;
    }
    return getServerAuditLogs();
  } catch {
    return getServerAuditLogs();
  }
}
