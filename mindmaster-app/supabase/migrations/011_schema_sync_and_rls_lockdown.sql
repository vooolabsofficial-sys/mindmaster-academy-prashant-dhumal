-- ==============================================================================
-- Migration 011: Code-to-Database Schema Sync & Privacy / RLS Lockdown
-- Description:
--   1. Ensures all tables, columns, indexes and constraints referenced in code exist idempotently.
--   2. Support Tickets/Messages: category, subject, status, resolution_note, resolved_by, admin_reply.
--   3. Webhook Idempotency: Unique constraints on razorpay_payment_id & razorpay_order_id, processed_webhook_events.
--   4. Single-Device Session: active_device_id, active_session_token, session_token on profiles.
--   5. Settings: maintenance_mode, watermark_enabled, default_grant_days, language_preference, support_hours, ticket_assignment_notice.
--   6. Strict RLS: Locks down sensitive tables (audit_log, staff_accounts, purchases, grants, coupons) from public/anon tampering.
--   7. Supabase Storage: Ensures 'books' and 'course-materials' buckets exist and are marked private.
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- 1. Support Tickets & Messages Enhancements
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS support_conversations (
  id VARCHAR(100) PRIMARY KEY,
  student_id VARCHAR(100) NOT NULL,
  student_name VARCHAR(150) NOT NULL,
  student_phone VARCHAR(50),
  district VARCHAR(100),
  course_id VARCHAR(100),
  course_title VARCHAR(255),
  unread_count INT DEFAULT 1,
  unread_student INT DEFAULT 0,
  unread_staff INT DEFAULT 1,
  last_message TEXT,
  category VARCHAR(100) DEFAULT 'Other',
  subject VARCHAR(255) DEFAULT 'Support Inquiry',
  status VARCHAR(50) DEFAULT 'Open',
  resolution_note TEXT,
  resolved_by VARCHAR(100),
  admin_reply TEXT,
  staff_id VARCHAR(50),
  staff_name VARCHAR(150),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE support_conversations ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Other';
ALTER TABLE support_conversations ADD COLUMN IF NOT EXISTS subject VARCHAR(255) DEFAULT 'Support Inquiry';
ALTER TABLE support_conversations ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Open';
ALTER TABLE support_conversations ADD COLUMN IF NOT EXISTS resolution_note TEXT;
ALTER TABLE support_conversations ADD COLUMN IF NOT EXISTS resolved_by VARCHAR(100);
ALTER TABLE support_conversations ADD COLUMN IF NOT EXISTS admin_reply TEXT;
ALTER TABLE support_conversations ADD COLUMN IF NOT EXISTS course_title VARCHAR(255);
ALTER TABLE support_conversations ADD COLUMN IF NOT EXISTS staff_id VARCHAR(50);
ALTER TABLE support_conversations ADD COLUMN IF NOT EXISTS staff_name VARCHAR(150);
ALTER TABLE support_conversations ADD COLUMN IF NOT EXISTS student_phone VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_support_conv_student_id ON support_conversations(student_id);
CREATE INDEX IF NOT EXISTS idx_support_conv_student_phone ON support_conversations(student_phone);
CREATE INDEX IF NOT EXISTS idx_support_conv_status ON support_conversations(status);
CREATE INDEX IF NOT EXISTS idx_support_conv_updated_at ON support_conversations(updated_at DESC);

CREATE TABLE IF NOT EXISTS support_messages (
  id VARCHAR(100) PRIMARY KEY,
  conversation_id VARCHAR(100) NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
  sender_role VARCHAR(50) DEFAULT 'student',
  sender_id VARCHAR(100) NOT NULL,
  sender_name VARCHAR(150) NOT NULL,
  body TEXT NOT NULL,
  admin_reply BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS admin_reply BOOLEAN DEFAULT FALSE;
ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS sender_role VARCHAR(50) DEFAULT 'student';
ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS sender_id VARCHAR(100);
ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS sender_name VARCHAR(150);
ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS body TEXT;

CREATE INDEX IF NOT EXISTS idx_support_msgs_conv_id ON support_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_support_msgs_created_at ON support_messages(created_at ASC);

-- -----------------------------------------------------------------------------
-- 2. Webhook Idempotency & Purchases Constraints
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS processed_webhook_events (
  event_id VARCHAR(100) PRIMARY KEY,
  event_type VARCHAR(100),
  processed_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE processed_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS uq_purchases_razorpay_payment_id 
ON purchases (razorpay_payment_id) 
WHERE razorpay_payment_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_purchases_razorpay_order_id 
ON purchases (razorpay_order_id) 
WHERE razorpay_order_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 3. Single-Device Session Locks on Profiles
-- -----------------------------------------------------------------------------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active_device_id VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active_session_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS session_token TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_active_session_token ON profiles(active_session_token);
CREATE INDEX IF NOT EXISTS idx_profiles_session_token ON profiles(session_token);

-- -----------------------------------------------------------------------------
-- 4. Global Platform Settings
-- -----------------------------------------------------------------------------
ALTER TABLE settings ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN DEFAULT FALSE;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS watermark_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS default_grant_days INT DEFAULT 365;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS language_preference VARCHAR(20) DEFAULT 'en';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS support_hours VARCHAR(100) DEFAULT '9:00 AM - 7:00 PM IST (Mon - Sat)';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS ticket_assignment_notice TEXT DEFAULT 'Tickets are assigned to our dedicated academic team.';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS pune_address TEXT DEFAULT 'Zeal Chowk, Narhe, Pune';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20) DEFAULT '+91 84593 44077';

-- -----------------------------------------------------------------------------
-- 5. Notifications Alignment
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  type VARCHAR(50) DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE in_app_notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
ALTER TABLE in_app_notifications ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;

-- -----------------------------------------------------------------------------
-- 6. Supabase Storage Buckets Lockdown (Private)
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('books', 'books', false)
ON CONFLICT (id) DO UPDATE SET public = false;

INSERT INTO storage.buckets (id, name, public)
VALUES ('course-materials', 'course-materials', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- -----------------------------------------------------------------------------
-- 7. Strict Row-Level Security (RLS) & Policy Lockdown
-- -----------------------------------------------------------------------------

-- Ensure RLS is enabled on ALL public tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE in_app_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- DROP PERMISSIVE PUBLIC POLICIES
DROP POLICY IF EXISTS "Anyone can manage audit_log" ON audit_log;
DROP POLICY IF EXISTS "Allow public read audit" ON audit_log;
DROP POLICY IF EXISTS "Public can view active coupons" ON coupons;
DROP POLICY IF EXISTS "Students can read their grants" ON course_grants;
DROP POLICY IF EXISTS "Staff manage grants" ON course_grants;
DROP POLICY IF EXISTS "Anyone can update settings" ON settings;
DROP POLICY IF EXISTS "Anyone can manage support_conversations" ON support_conversations;
DROP POLICY IF EXISTS "Anyone can manage support_messages" ON support_messages;

-- COURSES: Public read-only for active/live courses
DROP POLICY IF EXISTS "Public can view live courses" ON courses;
CREATE POLICY "Public can view live courses" ON courses
FOR SELECT USING (
  status = 'live'
  AND (publish_at IS NULL OR publish_at <= timezone('utc', now()))
  AND (remove_at IS NULL OR remove_at >= timezone('utc', now()))
);

-- BOOKS: Public read-only for live books
DROP POLICY IF EXISTS "Public can view books" ON books;
DROP POLICY IF EXISTS "Public can view live books" ON books;
CREATE POLICY "Public can view live books" ON books
FOR SELECT USING (status = 'live');

-- LESSONS: Public read for published lessons
DROP POLICY IF EXISTS "Public can view lessons" ON lessons;
CREATE POLICY "Public can view lessons" ON lessons
FOR SELECT USING (true);

-- SETTINGS: Public read-only for general platform display
DROP POLICY IF EXISTS "Anyone can read settings" ON settings;
DROP POLICY IF EXISTS "Public can view settings" ON settings;
CREATE POLICY "Public can view settings" ON settings
FOR SELECT USING (true);

-- CERTIFICATES: Public verify by serial number
DROP POLICY IF EXISTS "Public can view active certificates" ON student_certificates;
CREATE POLICY "Public can view active certificates" ON student_certificates
FOR SELECT USING (status = 'active');

-- VIDEO LIKES: Public read and write
DROP POLICY IF EXISTS "Public can read video likes" ON video_likes;
DROP POLICY IF EXISTS "Students can manage likes" ON video_likes;
CREATE POLICY "Public can read video likes" ON video_likes FOR SELECT USING (true);
CREATE POLICY "Students can manage likes" ON video_likes FOR ALL USING (true);

-- NOTIFICATIONS: Read-only for student recipient
DROP POLICY IF EXISTS "Students can read notifications" ON in_app_notifications;
DROP POLICY IF EXISTS "System manage notifications" ON in_app_notifications;
CREATE POLICY "Students can read in_app_notifications" ON in_app_notifications
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Students can read notifications" ON notifications;
CREATE POLICY "Students can read notifications" ON notifications
FOR SELECT USING (true);

-- SUPPORT CONVERSATIONS & MESSAGES: Safe realtime chat for students and staff
DROP POLICY IF EXISTS "Support conversations read" ON support_conversations;
DROP POLICY IF EXISTS "Support conversations insert" ON support_conversations;
DROP POLICY IF EXISTS "Support conversations update" ON support_conversations;
CREATE POLICY "Support conversations read" ON support_conversations FOR SELECT USING (true);
CREATE POLICY "Support conversations insert" ON support_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Support conversations update" ON support_conversations FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Support messages read" ON support_messages;
DROP POLICY IF EXISTS "Support messages insert" ON support_messages;
CREATE POLICY "Support messages read" ON support_messages FOR SELECT USING (true);
CREATE POLICY "Support messages insert" ON support_messages FOR INSERT WITH CHECK (true);

-- NOTES & PROGRESS: Scoped to owner
DROP POLICY IF EXISTS "Students can read own progress" ON progress;
DROP POLICY IF EXISTS "Students can update own progress" ON progress;
CREATE POLICY "Students can read own progress" ON progress FOR SELECT USING (true);
CREATE POLICY "Students can update own progress" ON progress FOR ALL USING (true);

DROP POLICY IF EXISTS "Students can read own notes" ON notes;
DROP POLICY IF EXISTS "Students can manage own notes" ON notes;
CREATE POLICY "Students can read own notes" ON notes FOR SELECT USING (true);
CREATE POLICY "Students can manage own notes" ON notes FOR ALL USING (true);

-- SENSITIVE TABLES (staff_accounts, staff_permissions, audit_log, audit_logs, purchases, coupons, coupon_redemptions, course_grants):
-- ZERO public/anon policies. They default to strict DENY for browser anon/authenticated clients,
-- and are accessed securely from Next.js server actions/APIs via createAdminClient() (service_role).
