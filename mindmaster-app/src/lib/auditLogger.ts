import { INITIAL_AUDIT_LOGS } from "./mockStaffData";

declare global {
  // eslint-disable-next-line no-var
  var _mma_server_audit_logs: any[] | undefined;
}

if (!globalThis._mma_server_audit_logs) {
  globalThis._mma_server_audit_logs = [...INITIAL_AUDIT_LOGS];
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
    globalThis._mma_server_audit_logs = [...INITIAL_AUDIT_LOGS];
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
  };

  globalThis._mma_server_audit_logs.unshift(newLogEntry);

  if (globalThis._mma_server_audit_logs.length > 500) {
    globalThis._mma_server_audit_logs = globalThis._mma_server_audit_logs.slice(0, 500);
  }

  return newLogEntry;
}

export function getServerAuditLogs(): any[] {
  if (!globalThis._mma_server_audit_logs) {
    globalThis._mma_server_audit_logs = [...INITIAL_AUDIT_LOGS];
  }
  return globalThis._mma_server_audit_logs;
}
