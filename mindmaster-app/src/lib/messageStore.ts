// In-App Messaging Store
// Bidirectional Student ↔ Staff messaging — NO WhatsApp anywhere

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

// ==========================================
// PRE-SEEDED CONVERSATIONS
// ==========================================
const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-academy",
    studentId: "std-01",
    studentName: "Aditi Patil",
    staffId: "staff-3",
    staffName: "Sneha Patil",
    courseId: null,
    courseTitle: null,
    lastAt: "2026-09-10T15:30:00Z",
    lastMessage: "Thank you for clarifying, I will try the revised drill tonight.",
    unreadStudent: 1,
    unreadStaff: 0,
    district: "Pune",
  },
  {
    id: "conv-vedic-doubt",
    studentId: "std-coupon-used",
    studentName: "Kavita Mane",
    staffId: "staff-3",
    staffName: "Sneha Patil",
    courseId: "c2",
    courseTitle: "Vedic Maths Speed System",
    lastAt: "2026-09-10T11:20:00Z",
    lastMessage: "Sir, Lesson 4 ma Vedic multiplication cha shortcut nahi samjhla. Plz help?",
    unreadStudent: 0,
    unreadStaff: 1,
    district: "Sangli",
  },
  {
    id: "conv-police-query",
    studentId: "std-02",
    studentName: "Rahul Shinde",
    staffId: null,
    staffName: null,
    courseId: "c4",
    courseTitle: "Police Bharti Speed & GK Memory",
    lastAt: "2026-09-09T14:00:00Z",
    lastMessage: "Access expiring in 5 days — can I get renewal coupon?",
    unreadStudent: 0,
    unreadStaff: 1,
    district: "Satara",
  },
  {
    id: "conv-new-student",
    studentId: "std-new",
    studentName: "Tanvi Deshpande",
    staffId: "staff-mma-000",
    staffName: "Prashant Dhumal",
    courseId: null,
    courseTitle: null,
    lastAt: "2026-09-08T10:45:00Z",
    lastMessage: "Welcome to MindMaster Academy! Feel free to ask any questions here.",
    unreadStudent: 1,
    unreadStaff: 0,
    district: "Pune",
  },
];

// ==========================================
// PRE-SEEDED MESSAGES
// ==========================================
const INITIAL_MESSAGES: Message[] = [
  // Aditi conversation
  {
    id: "msg-001",
    conversationId: "conv-academy",
    senderType: "student",
    senderId: "std-01",
    senderName: "Aditi Patil",
    body: "Namaste! Mala Vedic Maths lesson 6 madhe speed drill che technique nahi samjhle. Can you help?",
    at: "2026-09-10T14:00:00Z",
  },
  {
    id: "msg-002",
    conversationId: "conv-academy",
    senderType: "staff",
    senderId: "staff-3",
    senderName: "Sneha Patil",
    body: "Hi Aditi! Lesson 6 madhye tum Base 100 method vaparla pahije. Step 1: Subtract from 100. Step 2: Cross-multiply. Practice with numbers 88 × 96 first. 🧠",
    at: "2026-09-10T14:30:00Z",
  },
  {
    id: "msg-003",
    conversationId: "conv-academy",
    senderType: "student",
    senderId: "std-01",
    senderName: "Aditi Patil",
    body: "Thank you for clarifying, I will try the revised drill tonight.",
    at: "2026-09-10T15:30:00Z",
  },
  {
    id: "msg-004",
    conversationId: "conv-academy",
    senderType: "staff",
    senderId: "staff-3",
    senderName: "Sneha Patil",
    body: "Great! Once you complete the drill, share your score here. Keep going! 💪",
    at: "2026-09-10T15:35:00Z",
  },

  // Kavita conversation
  {
    id: "msg-005",
    conversationId: "conv-vedic-doubt",
    senderType: "student",
    senderId: "std-coupon-used",
    senderName: "Kavita Mane",
    body: "Sir, Lesson 4 ma Vedic multiplication cha shortcut nahi samjhla. Plz help?",
    at: "2026-09-10T11:20:00Z",
  },

  // Rahul conversation
  {
    id: "msg-006",
    conversationId: "conv-police-query",
    senderType: "student",
    senderId: "std-02",
    senderName: "Rahul Shinde",
    body: "Namaskar sir, maza Police Bharti course 5 divas madhye expire honar aahe. Renewal coupon milel ka?",
    at: "2026-09-09T13:30:00Z",
  },
  {
    id: "msg-007",
    conversationId: "conv-police-query",
    senderType: "student",
    senderId: "std-02",
    senderName: "Rahul Shinde",
    body: "Access expiring in 5 days — can I get renewal coupon?",
    at: "2026-09-09T14:00:00Z",
  },

  // Tanvi welcome conversation
  {
    id: "msg-008",
    conversationId: "conv-new-student",
    senderType: "student",
    senderId: "std-new",
    senderName: "Tanvi Deshpande",
    body: "Hi, I just registered. Which course should I start with for 10th scholarship?",
    at: "2026-09-08T10:30:00Z",
  },
  {
    id: "msg-009",
    conversationId: "conv-new-student",
    senderType: "staff",
    senderId: "staff-mma-000",
    senderName: "Prashant Dhumal",
    body: "Welcome to MindMaster Academy! Feel free to ask any questions here.",
    at: "2026-09-08T10:45:00Z",
  },
];

// ==========================================
// localStorage Keys
// ==========================================
const CONVERSATIONS_KEY = "mma_conversations";
const MESSAGES_KEY = "mma_messages";

const SERVER_MEM_STORE = new Map<string, any>();

function safeGetItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return SERVER_MEM_STORE.has(key) ? (SERVER_MEM_STORE.get(key) as T) : fallback;
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSetItem<T>(key: string, data: T): void {
  if (typeof window === "undefined") {
    SERVER_MEM_STORE.set(key, data);
    return;
  }
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error writing ${key}:`, err);
  }
}

// ==========================================
// CONVERSATION CRUD
// ==========================================
export function getConversations(): Conversation[] {
  return safeGetItem<Conversation[]>(CONVERSATIONS_KEY, INITIAL_CONVERSATIONS);
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
  let convs = getConversations();

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

  // Sort by most recent
  return convs.sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
}

export function getConversationById(id: string): Conversation | undefined {
  return getConversations().find((c) => c.id === id);
}

// ==========================================
// MESSAGE CRUD
// ==========================================
export function getMessages(): Message[] {
  return safeGetItem<Message[]>(MESSAGES_KEY, INITIAL_MESSAGES);
}

export function getConversationMessages(conversationId: string): Message[] {
  return getMessages()
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

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

  // Save message
  const messages = getMessages();
  safeSetItem(MESSAGES_KEY, [...messages, newMsg]);

  // Update conversation
  const convs = getConversations();
  const updated = convs.map((c) => {
    if (c.id === params.conversationId) {
      return {
        ...c,
        lastAt: now.toISOString(),
        lastMessage: params.body,
        staffId: params.senderType === "staff" ? params.senderId : c.staffId,
        staffName: params.senderType === "staff" ? params.senderName : c.staffName,
        unreadStudent: params.senderType === "staff" ? c.unreadStudent + 1 : c.unreadStudent,
        unreadStaff: params.senderType === "student" ? c.unreadStaff + 1 : c.unreadStaff,
      };
    }
    return c;
  });
  safeSetItem(CONVERSATIONS_KEY, updated);

  // Dispatch event for real-time badge updates
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("mma_messages_changed"));
  }

  return newMsg;
}

// ==========================================
// CREATE A NEW CONVERSATION (student-initiated)
// ==========================================
export function createConversation(params: {
  studentId: string;
  studentName: string;
  courseId?: string;
  courseTitle?: string;
  district?: string;
  firstMessage: string;
}): Conversation {
  const now = new Date();
  const newConv: Conversation = {
    id: `conv-${Date.now()}`,
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

  const convs = getConversations();
  safeSetItem(CONVERSATIONS_KEY, [newConv, ...convs]);

  // Also create the first message
  sendMessage({
    conversationId: newConv.id,
    senderType: "student",
    senderId: params.studentId,
    senderName: params.studentName,
    body: params.firstMessage,
  });

  return newConv;
}

// ==========================================
// MARK-AS-READ
// ==========================================
export function markConversationReadByStudent(conversationId: string): void {
  const convs = getConversations();
  const updated = convs.map((c) =>
    c.id === conversationId ? { ...c, unreadStudent: 0 } : c
  );
  safeSetItem(CONVERSATIONS_KEY, updated);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("mma_messages_changed"));
  }
}

export function markConversationReadByStaff(conversationId: string): void {
  const convs = getConversations();
  const updated = convs.map((c) =>
    c.id === conversationId ? { ...c, unreadStaff: 0 } : c
  );
  safeSetItem(CONVERSATIONS_KEY, updated);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("mma_messages_changed"));
  }
}

// ==========================================
// UNREAD BADGE COUNTERS
// ==========================================
export function getUnreadCountForStudent(studentId: string): number {
  return getConversationsForStudent(studentId).reduce(
    (sum, c) => sum + c.unreadStudent,
    0
  );
}

export function getUnreadCountForStaff(): number {
  return getConversations().reduce((sum, c) => sum + c.unreadStaff, 0);
}
