// Student In-App Notifications Store
// Strictly In-App / Push - NO WhatsApp

function getSupabase() {
  try {
    if (typeof window === "undefined") {
      const { createAdminClient } = require("./supabase/admin");
      return createAdminClient();
    } else {
      const { createClient } = require("./supabase/client");
      return createClient();
    }
  } catch {
    return null;
  }
}

export interface StudentNotification {
  id: string;
  userId: string; // studentId or "all"
  title: string;
  body: string;
  type: "renewal" | "reminder" | "course" | "announcement" | "system";
  couponCode?: string;
  courseCode?: string;
  courseTitle?: string;
  daysLeft?: number;
  readAt: string | null;
  createdAt: string;
  actionUrl?: string;
}

export const INITIAL_STUDENT_NOTIFICATIONS: StudentNotification[] = [];

const NOTIFS_KEY = "mma_student_notifications";

export function getStudentNotifications(userId?: string): StudentNotification[] {
  if (typeof window === "undefined") {
    return INITIAL_STUDENT_NOTIFICATIONS;
  }
  try {
    const raw = localStorage.getItem(NOTIFS_KEY);
    if (!raw) {
      return INITIAL_STUDENT_NOTIFICATIONS;
    }
    const parsed: StudentNotification[] = JSON.parse(raw);
    if (!userId) return parsed;
    return parsed.filter((n) => n.userId === "all" || n.userId === userId);
  } catch (err) {
    return INITIAL_STUDENT_NOTIFICATIONS;
  }
}

export function getUnreadNotificationCount(userId?: string): number {
  const notifs = getStudentNotifications(userId);
  return notifs.filter((n) => !n.readAt).length;
}

export function markNotificationAsRead(id: string): void {
  if (typeof window === "undefined") return;
  const notifs = getStudentNotifications();
  const updated = notifs.map((n) =>
    n.id === id ? { ...n, readAt: new Date().toLocaleDateString("en-IN") } : n
  );
  localStorage.setItem(NOTIFS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event("mma_notifications_changed"));

  const supabase = getSupabase();
  if (supabase) {
    try {
      supabase.from("in_app_notifications").update({ read: true }).eq("id", id).then(() => {});
    } catch {}
  }
}

export function markAllNotificationsAsRead(userId?: string): void {
  if (typeof window === "undefined") return;
  const notifs = getStudentNotifications();
  const updated = notifs.map((n) => {
    if (!userId || n.userId === "all" || n.userId === userId) {
      return { ...n, readAt: new Date().toLocaleDateString("en-IN") };
    }
    return n;
  });
  localStorage.setItem(NOTIFS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event("mma_notifications_changed"));

  const supabase = getSupabase();
  if (supabase) {
    try {
      const q = supabase.from("in_app_notifications").update({ read: true });
      if (userId) {
        q.or(`user_id.eq.${userId},user_id.eq.all`).then(() => {});
      } else {
        q.neq("id", "00000000-0000-0000-0000-000000000000").then(() => {});
      }
    } catch {}
  }
}

export function addStudentNotification(
  notif: Omit<StudentNotification, "id" | "createdAt" | "readAt">
): StudentNotification {
  const notifs = getStudentNotifications();
  const now = new Date();
  const newNotif: StudentNotification = {
    ...notif,
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: `${now.toLocaleDateString("en-IN")}, ${now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    })}`,
    readAt: null,
  };

  const updated = [newNotif, ...notifs];
  if (typeof window !== "undefined") {
    localStorage.setItem(NOTIFS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("mma_notifications_changed"));
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      supabase
        .from("in_app_notifications")
        .insert({
          user_id: notif.userId || "all",
          title: notif.title,
          body: notif.body,
          type: notif.type || "system",
          action_url: notif.actionUrl,
          read: false,
        })
        .then(() => {})
        .catch(() => {});
    } catch {}
  }

  return newNotif;
}

export async function fetchDbStudentNotifications(userId?: string): Promise<StudentNotification[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return getStudentNotifications(userId);

    let query = supabase.from("in_app_notifications").select("*").order("created_at", { ascending: false });
    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.eq.all`);
    }

    const { data, error } = await query;
    if (error) return getStudentNotifications(userId);
    if (!data || data.length === 0) {
      if (typeof window !== "undefined") {
        localStorage.setItem(NOTIFS_KEY, JSON.stringify([]));
        window.dispatchEvent(new Event("mma_notifications_changed"));
      }
      return [];
    }

    const mapped: StudentNotification[] = data.map((d: any) => ({
      id: d.id,
      userId: d.user_id,
      title: d.title,
      body: d.body,
      type: d.type || "system",
      readAt: d.read ? new Date(d.created_at).toLocaleDateString("en-IN") : null,
      createdAt: new Date(d.created_at).toLocaleDateString("en-IN"),
      actionUrl: d.action_url,
    }));

    if (typeof window !== "undefined") {
      localStorage.setItem(NOTIFS_KEY, JSON.stringify(mapped));
      window.dispatchEvent(new Event("mma_notifications_changed"));
    }

    return mapped;
  } catch {
    return getStudentNotifications(userId);
  }
}
