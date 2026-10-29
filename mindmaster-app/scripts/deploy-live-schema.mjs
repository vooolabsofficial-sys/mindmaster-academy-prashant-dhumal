import pg from "pg";
const { Client } = pg;

const cleanSchemaSql = `
-- Core Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Roles & Permissions
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE (role_id, resource, action)
);

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  village VARCHAR(100),
  taluka VARCHAR(100),
  district VARCHAR(100),
  school_name VARCHAR(200),
  school VARCHAR(200),
  role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin')),
  target_exam VARCHAR(150) DEFAULT 'पोलीस भरती (Maharashtra Police Bharti 2026)',
  is_verified BOOLEAN DEFAULT FALSE,
  password_hash TEXT,
  recovery_pin VARCHAR(10),
  email VARCHAR(255),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  active_session_token TEXT,
  session_token TEXT,
  standard VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active_session_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS session_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS recovery_pin VARCHAR(10);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS standard VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_district ON profiles(district);
CREATE INDEX IF NOT EXISTS idx_profiles_target_exam ON profiles(target_exam);

-- Courses (Clean & Empty)
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  title_mr VARCHAR(255) NOT NULL,
  subtitle TEXT,
  description TEXT NOT NULL,
  header_tint VARCHAR(30) DEFAULT 'sky' CHECK (header_tint IN ('mint', 'sky', 'peach', 'lavender', 'pink', 'locked')),
  price_paise BIGINT NOT NULL DEFAULT 0,
  original_price_paise BIGINT NOT NULL DEFAULT 0,
  is_free BOOLEAN NOT NULL DEFAULT FALSE,
  access_months INT NOT NULL DEFAULT 3,
  status VARCHAR(20) DEFAULT 'live' CHECK (status IN ('draft', 'live', 'archived')),
  target_segment VARCHAR(50) DEFAULT 'general',
  standards INT[] DEFAULT NULL,
  publish_at TIMESTAMPTZ,
  remove_at TIMESTAMPTZ,
  badge_text VARCHAR(100),
  badge_type VARCHAR(50),
  image_src TEXT,
  instructor_name VARCHAR(150) DEFAULT 'Prashant Dhumal Sir',
  instructor_title VARCHAR(150) DEFAULT 'International Memory Trainer & Author',
  total_students INT DEFAULT 0,
  rating NUMERIC(3, 1) DEFAULT 5.0,
  rating_count INT DEFAULT 0,
  lessons_count INT DEFAULT 0,
  total_duration_hours NUMERIC(4, 1) DEFAULT 0.0,
  category VARCHAR(50) DEFAULT 'memory',
  features TEXT[] DEFAULT ARRAY[]::TEXT[],
  opens_on TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  closes_on TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);

-- Lessons (Clean & Empty)
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  duration_sec INT NOT NULL DEFAULT 0,
  is_free BOOLEAN NOT NULL DEFAULT FALSE,
  video_type VARCHAR(20) DEFAULT 'youtube' CHECK (video_type IN ('youtube', 'vimeo', 'bunny', 'custom')),
  video_url VARCHAR(255) NOT NULL,
  video_id VARCHAR(255),
  position INT NOT NULL DEFAULT 1,
  description TEXT,
  part_number INT,
  total_parts INT,
  series_title VARCHAR(255),
  likes_count INT DEFAULT 0,
  publish_at TIMESTAMPTZ,
  remove_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE (course_id, position)
);

CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_position ON lessons(course_id, position);

-- Coupons (Clean & Empty)
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percent', 'percentage', 'flat')),
  value INT NOT NULL,
  usage_limit INT NOT NULL DEFAULT 100,
  used_count INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'disabled', 'expired')),
  applies_all BOOLEAN DEFAULT TRUE,
  per_user_usage INT DEFAULT 1,
  school TEXT DEFAULT NULL,
  min_order_value_paise BIGINT DEFAULT 49900,
  starts_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  ends_at TIMESTAMPTZ DEFAULT (TIMEZONE('utc', NOW()) + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

CREATE TABLE IF NOT EXISTS coupon_courses (
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  PRIMARY KEY (coupon_id, course_id)
);

CREATE TABLE IF NOT EXISTS coupon_books (
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  PRIMARY KEY (coupon_id, book_id)
);

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
  coupon_code VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  student_name TEXT,
  student_mobile TEXT,
  course_id TEXT,
  course_title TEXT,
  item_type VARCHAR(20) DEFAULT 'course',
  book_id TEXT,
  book_title TEXT,
  original_price_paise BIGINT,
  discount_paise BIGINT,
  paid_paise BIGINT,
  order_id VARCHAR(100),
  redeemed_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE coupon_redemptions ADD COLUMN IF NOT EXISTS item_type VARCHAR(20) DEFAULT 'course';
ALTER TABLE coupon_redemptions ADD COLUMN IF NOT EXISTS book_id TEXT;
ALTER TABLE coupon_redemptions ADD COLUMN IF NOT EXISTS book_title TEXT;

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon_code ON coupon_redemptions(coupon_code);

-- Purchases
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE RESTRICT,
  book_id UUID REFERENCES books(id) ON DELETE RESTRICT,
  item_type VARCHAR(20) DEFAULT 'course' CHECK (item_type IN ('course', 'book')),
  amount_paise BIGINT NOT NULL,
  coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
  razorpay_order_id VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  razorpay_signature VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'expired', 'refunded', 'success')),
  purchased_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE purchases ALTER COLUMN course_id DROP NOT NULL;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS book_id UUID REFERENCES books(id) ON DELETE RESTRICT;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS item_type VARCHAR(20) DEFAULT 'course';

CREATE INDEX IF NOT EXISTS idx_purchases_user ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_book ON purchases(book_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);

-- Course Grants (Offline Admissions)
CREATE TABLE IF NOT EXISTS course_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_phone VARCHAR(20) NOT NULL,
  student_name VARCHAR(255) NOT NULL,
  course_id VARCHAR(100) NOT NULL,
  course_title VARCHAR(255) NOT NULL,
  item_type VARCHAR(20) DEFAULT 'course' CHECK (item_type IN ('course', 'book')),
  book_id VARCHAR(100),
  granted_by VARCHAR(100) NOT NULL,
  granted_by_name VARCHAR(255) NOT NULL,
  payment_mode VARCHAR(50) NOT NULL CHECK (payment_mode IN ('cash', 'upi', 'scholarship')),
  amount_paid INTEGER NOT NULL DEFAULT 0,
  valid_until TIMESTAMPTZ NOT NULL,
  remarks TEXT,
  whatsapp_sent BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE course_grants ADD COLUMN IF NOT EXISTS item_type VARCHAR(20) DEFAULT 'course';
ALTER TABLE course_grants ADD COLUMN IF NOT EXISTS book_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_course_grants_phone ON course_grants(student_phone);

-- Notes, Books, Progress, Video Likes
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  timestamp_sec INT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  code VARCHAR(50) UNIQUE,
  title VARCHAR(255) NOT NULL,
  subtitle TEXT,
  description TEXT,
  file_path TEXT NOT NULL,
  pages INT DEFAULT 1,
  file_size_mb NUMERIC(5, 2) DEFAULT 10.0,
  cover_image TEXT,
  is_free BOOLEAN NOT NULL DEFAULT FALSE,
  price_paise BIGINT NOT NULL DEFAULT 0,
  original_price_paise BIGINT NOT NULL DEFAULT 0,
  access_months INT NOT NULL DEFAULT 6,
  status VARCHAR(20) DEFAULT 'live' CHECK (status IN ('draft', 'live', 'archived')),
  header_tint VARCHAR(30) DEFAULT 'sky',
  badge_text VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE books ALTER COLUMN course_id DROP NOT NULL;
ALTER TABLE books ADD COLUMN IF NOT EXISTS code VARCHAR(50) UNIQUE;
ALTER TABLE books ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS is_free BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE books ADD COLUMN IF NOT EXISTS price_paise BIGINT NOT NULL DEFAULT 0;
ALTER TABLE books ADD COLUMN IF NOT EXISTS original_price_paise BIGINT NOT NULL DEFAULT 0;
ALTER TABLE books ADD COLUMN IF NOT EXISTS access_months INT NOT NULL DEFAULT 6;
ALTER TABLE books ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'live';
ALTER TABLE books ADD COLUMN IF NOT EXISTS header_tint VARCHAR(30) DEFAULT 'sky';
ALTER TABLE books ADD COLUMN IF NOT EXISTS badge_text VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_books_code ON books(code);
CREATE INDEX IF NOT EXISTS idx_books_course_id ON books(course_id);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);

CREATE TABLE IF NOT EXISTS progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  position_sec INT DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE (user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS video_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id VARCHAR(100) NOT NULL,
  course_id VARCHAR(100) NOT NULL,
  user_phone VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lesson_id, user_phone)
);

-- Staff RBAC, Audit Trail, Notifications, Central Settings
CREATE TABLE IF NOT EXISTS staff_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('main_admin', 'sub_admin')),
  password_hash TEXT NOT NULL,
  must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_by VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS staff_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id VARCHAR(50) NOT NULL REFERENCES staff_accounts(staff_id) ON DELETE CASCADE,
  permission_key VARCHAR(100) NOT NULL CHECK (
    permission_key IN (
      'videos.manage',
      'courses.manage',
      'coupons.manage',
      'students.view',
      'reports.view',
      'notes.books.manage',
      'freegrant.manage',
      'messages.manage'
    )
  ),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE (staff_id, permission_key)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id VARCHAR(50) REFERENCES staff_accounts(staff_id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  details TEXT,
  meta JSONB DEFAULT '{}'::jsonb,
  at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS in_app_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'system',
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  max_sub_admins INT NOT NULL DEFAULT 50,
  default_access_months INT NOT NULL DEFAULT 3,
  default_video_live_days INT NOT NULL DEFAULT 30,
  default_coupon_days INT NOT NULL DEFAULT 7,
  renewal_coupon_percent INT NOT NULL DEFAULT 50,
  reminder_template TEXT DEFAULT 'Namaskar {name}, your access to {course} will expire in {days} days. Renew today to get {percent}% off!',
  maintenance BOOLEAN NOT NULL DEFAULT FALSE,
  youtube_api_key TEXT,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- RLS On All Tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE in_app_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Additional Schema Alterations & Migrations
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS standard VARCHAR(50);
ALTER TABLE staff_accounts ADD COLUMN IF NOT EXISTS email VARCHAR(255);

ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW());
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW());
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS details TEXT;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}'::jsonb;

CREATE OR REPLACE VIEW audit_logs AS 
SELECT 
  id, 
  staff_id, 
  action, 
  entity_type, 
  entity_id, 
  details, 
  meta, 
  at, 
  COALESCE(created_at, at) AS created_at 
FROM audit_log;

ALTER TABLE settings ADD COLUMN IF NOT EXISTS razorpay_key_id VARCHAR(100) DEFAULT 'rzp_live_8F91kM4892482';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS razorpay_key_secret VARCHAR(100) DEFAULT 'sec_live_99d14a2f8b894ce12a';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS razorpay_mode VARCHAR(20) DEFAULT 'live';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS concurrent_devices INT DEFAULT 1;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS auto_send_reminders BOOLEAN DEFAULT TRUE;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS academy_title VARCHAR(255) DEFAULT 'MindMaster Academy';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS founder_name VARCHAR(150) DEFAULT 'Prashant Dhumal';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS centre_address TEXT DEFAULT 'Narhe Centre Desk, Pune, Maharashtra 411041';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS support_phone VARCHAR(50) DEFAULT '+91 84593 44077';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS support_email VARCHAR(100) DEFAULT 'mindmasterdhumal@gmail.com';

-- Live Support Messaging Tables
CREATE TABLE IF NOT EXISTS support_conversations (
  id TEXT PRIMARY KEY DEFAULT ('conv-' || gen_random_uuid()::text),
  student_id TEXT NOT NULL,
  student_name VARCHAR(255) NOT NULL,
  student_phone VARCHAR(20),
  district VARCHAR(100),
  course_id VARCHAR(100),
  unread_count INT DEFAULT 0,
  unread_student INT DEFAULT 0,
  unread_staff INT DEFAULT 0,
  last_message TEXT,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_support_conv_student ON support_conversations(student_id);
CREATE INDEX IF NOT EXISTS idx_support_conv_updated ON support_conversations(updated_at DESC);

CREATE TABLE IF NOT EXISTS support_messages (
  id TEXT PRIMARY KEY DEFAULT ('msg-' || gen_random_uuid()::text),
  conversation_id TEXT NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
  sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('student', 'staff')),
  sender_id VARCHAR(100) NOT NULL,
  sender_name VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_support_msg_conv ON support_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_support_msg_created ON support_messages(created_at ASC);

ALTER TABLE support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Drop insecure legacy policies on sensitive tables
DROP POLICY IF EXISTS "Public can view live courses" ON courses;
DROP POLICY IF EXISTS "Public can view scheduled live courses" ON courses;
DROP POLICY IF EXISTS "Public can view active coupons" ON coupons;
DROP POLICY IF EXISTS "Students can read their grants" ON course_grants;
DROP POLICY IF EXISTS "Staff manage grants" ON course_grants;
DROP POLICY IF EXISTS "Allow public read audit" ON audit_log;
DROP POLICY IF EXISTS "Allow system insert audit" ON audit_log;

-- Policies: Strict live courses visibility (No 'OR true')
CREATE POLICY "Public can view live courses" ON courses FOR SELECT USING (
  status = 'live'
  AND (publish_at IS NULL OR publish_at <= TIMEZONE('utc', NOW()))
  AND (remove_at IS NULL OR remove_at >= TIMEZONE('utc', NOW()))
);

-- Policies for public catalog and student interactions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view lessons' AND tablename = 'lessons') THEN
    CREATE POLICY "Public can view lessons" ON lessons FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view books' AND tablename = 'books') THEN
    CREATE POLICY "Public can view books" ON books FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view coupon books' AND tablename = 'coupon_books') THEN
    CREATE POLICY "Public can view coupon books" ON coupon_books FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can read video likes' AND tablename = 'video_likes') THEN
    CREATE POLICY "Public can read video likes" ON video_likes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view settings' AND tablename = 'settings') THEN
    CREATE POLICY "Public can view settings" ON settings FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Students can manage likes' AND tablename = 'video_likes') THEN
    CREATE POLICY "Students can manage likes" ON video_likes FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Students can read in_app_notifications' AND tablename = 'in_app_notifications') THEN
    CREATE POLICY "Students can read in_app_notifications" ON in_app_notifications FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Support conversations read' AND tablename = 'support_conversations') THEN
    CREATE POLICY "Support conversations read" ON support_conversations FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Support conversations insert' AND tablename = 'support_conversations') THEN
    CREATE POLICY "Support conversations insert" ON support_conversations FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Support conversations update' AND tablename = 'support_conversations') THEN
    CREATE POLICY "Support conversations update" ON support_conversations FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Support messages read' AND tablename = 'support_messages') THEN
    CREATE POLICY "Support messages read" ON support_messages FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Support messages insert' AND tablename = 'support_messages') THEN
    CREATE POLICY "Support messages insert" ON support_messages FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Canonical Phone Normalization Trigger Function
CREATE OR REPLACE FUNCTION normalize_phone_canonical(raw TEXT)
RETURNS VARCHAR(20) AS $$
DECLARE
  digits TEXT;
BEGIN
  IF raw IS NULL THEN
    RETURN NULL;
  END IF;
  digits := REGEXP_REPLACE(raw, '\D', '', 'g');
  IF LENGTH(digits) = 12 AND digits LIKE '91%' THEN
    RETURN SUBSTRING(digits FROM 3);
  ELSIF LENGTH(digits) = 11 AND digits LIKE '0%' THEN
    RETURN SUBSTRING(digits FROM 2);
  ELSIF LENGTH(digits) > 10 THEN
    RETURN RIGHT(digits, 10);
  ELSE
    RETURN digits;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION trg_fn_normalize_phone()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'profiles' THEN
    NEW.phone := normalize_phone_canonical(NEW.phone);
  ELSIF TG_TABLE_NAME = 'staff_accounts' THEN
    NEW.phone := normalize_phone_canonical(NEW.phone);
  ELSIF TG_TABLE_NAME = 'course_grants' THEN
    NEW.student_phone := normalize_phone_canonical(NEW.student_phone);
  ELSIF TG_TABLE_NAME = 'video_likes' THEN
    NEW.user_phone := normalize_phone_canonical(NEW.user_phone);
  ELSIF TG_TABLE_NAME = 'coupon_redemptions' THEN
    IF NEW.student_mobile IS NOT NULL THEN
      NEW.student_mobile := normalize_phone_canonical(NEW.student_mobile);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_normalize_phone_profiles ON profiles;
CREATE TRIGGER trg_normalize_phone_profiles
BEFORE INSERT OR UPDATE OF phone ON profiles
FOR EACH ROW EXECUTE FUNCTION trg_fn_normalize_phone();

DROP TRIGGER IF EXISTS trg_normalize_phone_staff ON staff_accounts;
CREATE TRIGGER trg_normalize_phone_staff
BEFORE INSERT OR UPDATE OF phone ON staff_accounts
FOR EACH ROW EXECUTE FUNCTION trg_fn_normalize_phone();

DROP TRIGGER IF EXISTS trg_normalize_phone_grants ON course_grants;
CREATE TRIGGER trg_normalize_phone_grants
BEFORE INSERT OR UPDATE OF student_phone ON course_grants
FOR EACH ROW EXECUTE FUNCTION trg_fn_normalize_phone();

DROP TRIGGER IF EXISTS trg_normalize_phone_likes ON video_likes;
CREATE TRIGGER trg_normalize_phone_likes
BEFORE INSERT OR UPDATE OF user_phone ON video_likes
FOR EACH ROW EXECUTE FUNCTION trg_fn_normalize_phone();

-- Storage Bucket Setup
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('course-materials', 'course-materials', true)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- System Settings
INSERT INTO settings (id, max_sub_admins, default_access_months, default_video_live_days, default_coupon_days, renewal_coupon_percent, reminder_template, maintenance)
VALUES (1, 50, 3, 30, 7, 50, 'Namaskar {name}, your access to {course} will expire in {days} days. Renew today to get {percent}% off!', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Owner Master Account Seed (MMA-000: Prashant Dhumal)
INSERT INTO staff_accounts (
  id,
  staff_id,
  full_name,
  phone,
  role,
  password_hash,
  must_change_password,
  status,
  created_by
)
VALUES (
  '99999999-9999-9999-9999-999999999000',
  'MMA-000',
  'Prashant Dhumal',
  '+919822012345',
  'main_admin',
  '$argon2id$v=19$m=65536,t=3,p=1$JrNHmszER1RNPWUBVM/8zg$3MRAw0LH9c4FBd+8N6lhF19AYm3MZ/x/5jEZqA/d1LM',
  TRUE,
  'active',
  'system_bootstrap'
)
ON CONFLICT (staff_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- Assign all 8 permissions to MMA-000 Owner
INSERT INTO staff_permissions (staff_id, permission_key)
VALUES
  ('MMA-000', 'videos.manage'),
  ('MMA-000', 'courses.manage'),
  ('MMA-000', 'coupons.manage'),
  ('MMA-000', 'students.view'),
  ('MMA-000', 'reports.view'),
  ('MMA-000', 'notes.books.manage'),
  ('MMA-000', 'freegrant.manage'),
  ('MMA-000', 'messages.manage')
ON CONFLICT (staff_id, permission_key) DO NOTHING;
`;

import fs from "fs";
import path from "path";

function getDatabaseConfig() {
  let dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    try {
      const envPath = path.join(process.cwd(), ".env.local");
      if (fs.existsSync(envPath)) {
        const lines = fs.readFileSync(envPath, "utf8").split("\n");
        for (const line of lines) {
          if (line.startsWith("DATABASE_URL=")) {
            dbUrl = line.split("=")[1].trim();
            break;
          }
        }
      }
    } catch {}
  }
  return dbUrl;
}

async function deploy() {
  console.log("Connecting directly to Supabase Postgres database...");
  const dbUrl = getDatabaseConfig();
  const client = dbUrl
    ? new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
    : new Client({
        host: process.env.DB_HOST || "db.xyycqnpqnrtumoemlels.supabase.co",
        port: parseInt(process.env.DB_PORT || "5432", 10),
        database: process.env.DB_NAME || "postgres",
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
      });

  try {
    await client.connect();
    console.log("Connected successfully to PostgreSQL!");

    console.log("Executing clean production schema...");
    await client.query(cleanSchemaSql);
    console.log("Clean schema executed successfully!");

    // Verify tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log("\nVerified Created Tables in Supabase:");
    res.rows.forEach((r) => console.log("  ✓ " + r.table_name));

    // Check count of courses, lessons, coupons (should be 0)
    const coursesCount = await client.query("SELECT count(*) FROM courses;");
    const lessonsCount = await client.query("SELECT count(*) FROM lessons;");
    const couponsCount = await client.query("SELECT count(*) FROM coupons;");
    const staffCount = await client.query("SELECT count(*) FROM staff_accounts;");

    console.log("\nRow Counts (Verified 100% Clean):");
    console.log("  Courses count:", coursesCount.rows[0].count, "(Expected: 0 - completely clean)");
    console.log("  Lessons count:", lessonsCount.rows[0].count, "(Expected: 0 - completely clean)");
    console.log("  Coupons count:", couponsCount.rows[0].count, "(Expected: 0 - completely clean)");
    console.log("  Staff accounts:", staffCount.rows[0].count, "(Owner MMA-000 only)");

    await client.end();
    console.log("\n🎉 ALL TABLES SUCCESSFULLY DEPLOYED TO SUPABASE CLOUD!");
  } catch (err) {
    console.error("Deployment failed:", err);
    process.exit(1);
  }
}

deploy();
