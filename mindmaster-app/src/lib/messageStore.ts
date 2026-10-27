// In-App Messaging Store
// Bidirectional Student ↔ Staff messaging — 100% Live Supabase support_conversations & support_messages

export interface Conversation {
  id: string;
  studentId: string;
  studentName: string;
  staffId: string | null;
  staffName: string | null;
  courseId: string | null;
  courseTitle: string | null;
  lastAt: string;
  lastMessage: string;
  unreadStudent: number;
  unreadStaff: number;
  district?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderType: "student" | "staff";
  senderId: string;
  senderName: string;
  body: string;
  at: string;
}

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

// In-Memory cache for instantaneous synchronous UI reads
let CACHED_CONVERSATIONS: Conversation[] = [];
const CACHED_MESSAGES: Map<string, Message[]> = new Map();

function notifyListeners() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("mma_messages_changed"));
  }
}

// ----------------------------------------------------
// DIRECT SUPABASE ASYNC FETCHERS
// ----------------------------------------------------
export async function fetchDbConversations(): Promise<Conversation[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return CACHED_CONVERSATIONS;

    const { data, error } = await supabase
      .from("support_conversations")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error || !data) return CACHED_CONVERSATIONS;

    const mapped: Conversation[] = data.map((d: any) => ({
      id: d.id,
      studentId: d.student_id,
      studentName: d.student_name,
      staffId: null,
      staffName: null,
      courseId: d.course_id || null,
      courseTitle: null,
      lastAt: d.updated_at || d.created_at || new Date().toISOString(),
      lastMessage: d.last_message || "",
      unreadStudent: d.unread_student || 0,
      unreadStaff: d.unread_staff ?? d.unread_count ?? 0,
      district: d.district || undefined,
    }));

    CACHED_CONVERSATIONS = mapped;
    notifyListeners();
    return mapped;
  } catch {
    return CACHED_CONVERSATIONS;
  }
}

export async function fetchDbMessages(conversationId: string): Promise<Message[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return CACHED_MESSAGES.get(conversationId) || [];

    const { data, error } = await supabase
      .from("support_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error || !data) return CACHED_MESSAGES.get(conversationId) || [];

    const mapped: Message[] = data.map((d: any) => ({
      id: d.id,
      conversationId: d.conversation_id,
      senderType: d.sender_role as "student" | "staff",
      senderId: d.sender_id,
      senderName: d.sender_name,
      body: d.body,
      at: d.created_at || new Date().toISOString(),
    }));

    CACHED_MESSAGES.set(conversationId, mapped);
    notifyListeners();
    return mapped;
  } catch {
    return CACHED_MESSAGES.get(conversationId) || [];
  }
}

// ----------------------------------------------------
// SYNCHRONOUS GETTERS (CACHED)
// ----------------------------------------------------
export function getConversations(): Conversation[] {
  // Trigger background fetch if empty on client
  if (CACHED_CONVERSATIONS.length === 0 && typeof window !== "undefined") {
    fetchDbConversations().catch(() => {});
  }
  return CACHED_CONVERSATIONS;
}

export function getConversationsForStudent(studentId: string): Conversation[] {
  return getConversations().filter((c) => c.studentId === studentId);
}

export function getConversationsForStaff(filters?: {
  unreadOnly?: boolean;
  courseId?: string;
  district?: string;
  search?: string;
}): Conversation[] {
  let convs = [...getConversations()];

  if (filters?.unreadOnly) {
    convs = convs.filter((c) => c.unreadStaff > 0);
  }
  if (filters?.courseId) {
    convs = convs.filter((c) => c.courseId === filters.courseId);
  }
  if (filters?.district) {
    convs = convs.filter((c) => c.district === filters.district);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    convs = convs.filter(
      (c) =>
        c.studentName.toLowerCase().includes(q) ||
        (c.courseTitle && c.courseTitle.toLowerCase().includes(q)) ||
        c.lastMessage.toLowerCase().includes(q)
    );
  }

  return convs.sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
}

export function getConversationById(id: string): Conversation | undefined {
  return getConversations().find((c) => c.id === id);
}

export function getMessages(): Message[] {
  const all: Message[] = [];
  CACHED_MESSAGES.forEach((msgs) => all.push(...msgs));
  return all;
}

export function getConversationMessages(conversationId: string): Message[] {
  if (!CACHED_MESSAGES.has(conversationId) && typeof window !== "undefined") {
    fetchDbMessages(conversationId).catch(() => {});
  }
  return (CACHED_MESSAGES.get(conversationId) || []).sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()
  );
}

// ----------------------------------------------------
// MUTATIONS (LIVE SUPABASE WRITE + CACHE UPDATE)
// ----------------------------------------------------
export function sendMessage(params: {
  conversationId: string;
  senderType: "student" | "staff";
  senderId: string;
  senderName: string;
  body: string;
}): Message {
  const now = new Date();
  const newMsg: Message = {
    id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    conversationId: params.conversationId,
    senderType: params.senderType,
    senderId: params.senderId,
    senderName: params.senderName,
    body: params.body,
    at: now.toISOString(),
  };

  // Update local cache immediately
  const existing = CACHED_MESSAGES.get(params.conversationId) || [];
  CACHED_MESSAGES.set(params.conversationId, [...existing, newMsg]);

  CACHED_CONVERSATIONS = CACHED_CONVERSATIONS.map((c) => {
    if (c.id === params.conversationId) {
      return {
        ...c,
        lastAt: now.toISOString(),
        lastMessage: params.body,
        unreadStudent: params.senderType === "staff" ? c.unreadStudent + 1 : c.unreadStudent,
        unreadStaff: params.senderType === "student" ? c.unreadStaff + 1 : c.unreadStaff,
      };
    }
    return c;
  });

  notifyListeners();

  // Persist directly to Supabase
  const supabase = getSupabase();
  if (supabase) {
    try {
      supabase
        .from("support_messages")
        .insert({
          conversation_id: params.conversationId,
          sender_role: params.senderType,
          sender_id: params.senderId,
          sender_name: params.senderName,
          body: params.body,
          created_at: now.toISOString(),
        })
        .then(() => {})
        .catch((err: any) => console.warn("Supabase support_messages insert error:", err));

      const isStaff = params.senderType === "staff";
      const conv = CACHED_CONVERSATIONS.find((c) => c.id === params.conversationId);
      supabase
        .from("support_conversations")
        .update({
          last_message: params.body,
          updated_at: now.toISOString(),
          unread_staff: isStaff ? 0 : (conv?.unreadStaff || 1),
          unread_student: isStaff ? (conv?.unreadStudent || 1) : 0,
        })
        .eq("id", params.conversationId)
        .then(() => {})
        .catch((err: any) => console.warn("Supabase support_conversations update error:", err));
    } catch {}
  }

  return newMsg;
}

export function createConversation(params: {
  studentId: string;
  studentName: string;
  studentPhone?: string;
  courseId?: string;
  courseTitle?: string;
  district?: string;
  firstMessage: string;
}): Conversation {
  const now = new Date();
  const convId = `conv-${Date.now()}`;
  const newConv: Conversation = {
    id: convId,
    studentId: params.studentId,
    studentName: params.studentName,
    staffId: null,
    staffName: null,
    courseId: params.courseId || null,
    courseTitle: params.courseTitle || null,
    lastAt: now.toISOString(),
    lastMessage: params.firstMessage,
    unreadStudent: 0,
    unreadStaff: 1,
    district: params.district,
  };

  CACHED_CONVERSATIONS = [newConv, ...CACHED_CONVERSATIONS];
  notifyListeners();

  // Synchronously record the first message in memory cache & dispatch
  sendMessage({
    conversationId: convId,
    senderType: "student",
    senderId: params.studentId,
    senderName: params.studentName,
    body: params.firstMessage,
  });

  const supabase = getSupabase();
  if (supabase) {
    try {
      supabase
        .from("support_conversations")
        .insert({
          id: convId,
          student_id: params.studentId,
          student_name: params.studentName,
          student_phone: params.studentPhone || null,
          district: params.district || null,
          course_id: params.courseId || null,
          unread_count: 1,
          unread_staff: 1,
          unread_student: 0,
          last_message: params.firstMessage,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .then(() => {})
        .catch((err: any) => console.warn("Supabase support_conversations insert error:", err));
    } catch {}
  }

  return newConv;
}

export function markConversationReadByStudent(conversationId: string): void {
  CACHED_CONVERSATIONS = CACHED_CONVERSATIONS.map((c) =>
    c.id === conversationId ? { ...c, unreadStudent: 0 } : c
  );
  notifyListeners();

  const supabase = getSupabase();
  if (supabase) {
    try {
      supabase
        .from("support_conversations")
        .update({ unread_student: 0 })
        .eq("id", conversationId)
        .then(() => {});
    } catch {}
  }
}

export function markConversationReadByStaff(conversationId: string): void {
  CACHED_CONVERSATIONS = CACHED_CONVERSATIONS.map((c) =>
    c.id === conversationId ? { ...c, unreadStaff: 0 } : c
  );
  notifyListeners();

  const supabase = getSupabase();
  if (supabase) {
    try {
      supabase
        .from("support_conversations")
        .update({ unread_staff: 0, unread_count: 0 })
        .eq("id", conversationId)
        .then(() => {});
    } catch {}
  }
}

export function getUnreadCountForStudent(studentId: string): number {
  return getConversationsForStudent(studentId).reduce(
    (sum, c) => sum + c.unreadStudent,
    0
  );
}

export function getUnreadCountForStaff(): number {
  return getConversations().reduce((sum, c) => sum + c.unreadStaff, 0);
}

/**
 * Real-time Supabase subscription + fallback polling for bidirectional instant chat
 */
export function subscribeToSupportLiveUpdates(onUpdate: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const supabase = getSupabase();
  let channel: any = null;

  if (supabase && typeof supabase.channel === "function") {
    try {
      channel = supabase
        .channel(`support_live_${Date.now()}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "support_messages" },
          async () => {
            await fetchDbConversations();
            notifyListeners();
            onUpdate();
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "support_conversations" },
          async () => {
            await fetchDbConversations();
            notifyListeners();
            onUpdate();
          }
        )
        .subscribe();
    } catch (e) {
      console.warn("Supabase realtime subscription fallback:", e);
    }
  }

  // High-frequency live poller (3.5s) ensuring instant arrival of student & staff messages
  const interval = setInterval(async () => {
    try {
      await fetchDbConversations();
      notifyListeners();
      onUpdate();
    } catch {}
  }, 3500);

  return () => {
    clearInterval(interval);
    if (channel && supabase) {
      try {
        supabase.removeChannel(channel);
      } catch {}
    }
  };
}
