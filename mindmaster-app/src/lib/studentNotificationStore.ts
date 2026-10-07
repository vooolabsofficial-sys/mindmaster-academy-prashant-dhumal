// Student In-App Notifications Store
// Strictly In-App / Push - NO WhatsApp

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

export const INITIAL_STUDENT_NOTIFICATIONS: StudentNotification[] = [
  {
    id: "notif-exp-01",
    userId: "all",
    title: "⏳ Access Expiring Soon: Complete Brain Mastery",
    body: "Namaskar Vishal, your 3-month access to Complete Brain Mastery expires in 3 days. Renew today with coupon RENEW50 to lock in 50% discount for another 3 months!",
    type: "renewal",
    couponCode: "RENEW50",
    courseCode: "MM-01",
    courseTitle: "Complete Brain Mastery (Marathi)",
    daysLeft: 3,
    readAt: null,
    createdAt: "Today, 09:30 AM",
    actionUrl: "/checkout?courseId=c1&coupon=RENEW50",
  },
  {
    id: "notif-routine-02",
    userId: "all",
    title: "🧠 Keep Your Memory Streak Alive!",
    body: "Lesson 7: Instant Number Matrix Recall has been added to your curriculum. Practice for 15 minutes today.",
    type: "reminder",
    courseCode: "MM-02",
    courseTitle: "Vedic Maths Speed System",
    readAt: null,
    createdAt: "Yesterday, 04:15 PM",
    actionUrl: "/my-courses",
  },
  {
    id: "notif-hub-03",
    userId: "all",
    title: "📢 Pune Narhe Hub Offline Doubt Clearing",
    body: "Join mentor Prashant Dhumal this Saturday in Room 302 for interactive Vedic Maths speed drill solutions.",
    type: "announcement",
    readAt: "2026-09-08 12:00 PM",
    createdAt: "2 days ago",
    actionUrl: "/notes",
  },
];

const NOTIFS_KEY = "mma_student_notifications";

export function getStudentNotifications(userId?: string): StudentNotification[] {
  if (typeof window === "undefined") {
    return INITIAL_STUDENT_NOTIFICATIONS;
  }
  try {
    const raw = localStorage.getItem(NOTIFS_KEY);
    if (!raw) {
      localStorage.setItem(NOTIFS_KEY, JSON.stringify(INITIAL_STUDENT_NOTIFICATIONS));
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
  return newNotif;
}
