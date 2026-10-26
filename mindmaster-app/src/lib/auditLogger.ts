declare global {
  // eslint-disable-next-line no-var
  var _mma_server_audit_logs: any[] | undefined;
}

if (!globalThis._mma_server_audit_logs) {
  globalThis._mma_server_audit_logs = [];
}

export interface AuditLogInput {
  staff_id: string;
  staff_name?: string;
  staff_role?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  entity_name?: string;
  meta?: any;
}

export function recordServerAuditLog(entry: AuditLogInput) {
  if (!globalThis._mma_server_audit_logs) {
    globalThis._mma_server_audit_logs = [];
  }

  const now = new Date();
  const formattedTimestamp = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 8)}`;

  const newLogEntry = {
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    staff_id: entry.staff_id,
    staffId: entry.staff_id,
    staffName: entry.staff_name || entry.staff_id,
    staffRole: entry.staff_role || "sub_admin",
    action: entry.action,
    entity_type: entry.entity_type,
    entityType: entry.entity_type,
    entity_id: entry.entity_id || "gen-id",
    entityId: entry.entity_id || "gen-id",
    entity_name: entry.entity_name || entry.entity_type,
    entityName: entry.entity_name || entry.entity_type,
    meta: typeof entry.meta === "object" ? entry.meta : { raw: entry.meta || "" },
    details: typeof entry.meta === "string" ? entry.meta : JSON.stringify(entry.meta || {}),
    timestamp: formattedTimestamp,
    at: now.toISOString(),
    created_at: now.toISOString(),
  };

  globalThis._mma_server_audit_logs.unshift(newLogEntry);

  if (globalThis._mma_server_audit_logs.length > 500) {
    globalThis._mma_server_audit_logs = globalThis._mma_server_audit_logs.slice(0, 500);
  }

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
        entity_id: entry.entity_id || "gen-id",
        details: typeof entry.meta === "string" ? entry.meta : JSON.stringify(entry.meta || {}),
        meta: typeof entry.meta === "object" ? entry.meta : { raw: entry.meta || "" },
        at: now.toISOString(),
        created_at: now.toISOString(),
      })
      .then(() => {})
      .catch((err: any) => console.warn("Supabase audit_log insert error:", err));
  } catch {}

  return newLogEntry;
}

export function getServerAuditLogs(): any[] {
  if (!globalThis._mma_server_audit_logs) {
    globalThis._mma_server_audit_logs = [];
  }
  return globalThis._mma_server_audit_logs;
}

export async function fetchDbAuditLogs(staffId?: string): Promise<any[]> {
  try {
    const { createAdminClient } = require("./supabase/admin");
    const supabase = createAdminClient();
    let query = supabase
      .from("audit_log")
      .select("*, staff_accounts(full_name, role)")
      .order("at", { ascending: false })
      .limit(200);

    if (staffId && staffId !== "all") {
      query = query.eq("staff_id", staffId);
    }

    const { data, error } = await query;

    if (!error && data) {
      return data.map((d: any) => ({
        id: d.id,
        staffId: d.staff_id,
        staff_id: d.staff_id,
        staffName: d.meta?.staffName || d.staff_accounts?.full_name || d.staff_id,
        staffRole: d.staff_accounts?.role || "admin",
        action: d.action,
        entityType: d.entity_type,
        entity_type: d.entity_type,
        entityId: d.entity_id,
        entity_id: d.entity_id,
        entityName: d.meta?.entityName || d.entity_id,
        details: d.details || "",
        meta: d.meta || {},
        timestamp: d.at ? new Date(d.at).toLocaleString("en-IN") : "",
        at: d.at,
        created_at: d.created_at || d.at,
      }));
    }
    return getServerAuditLogs();
  } catch {
    return getServerAuditLogs();
  }
}
