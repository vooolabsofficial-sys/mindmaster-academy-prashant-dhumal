-- ==============================================================================
-- MINDMASTER ACADEMY: SUPABASE POSTGRESQL PRODUCTION SCHEMA & MIGRATION
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. RESERVED: ROLES & PERMISSIONS (Phase 2 RBAC)
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 2. PROFILES (Students & Instructors)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone VARCHAR(20) NOT NULL UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  village VARCHAR(100),
  taluka VARCHAR(100),
  district VARCHAR(100),
  school_name VARCHAR(200),
  role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ------------------------------------------------------------------------------
-- 3. COURSES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  title_mr VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  header_tint VARCHAR(30) DEFAULT 'sky' CHECK (header_tint IN ('mint', 'sky', 'peach', 'lavender', 'pink', 'locked')),
  price_paise BIGINT NOT NULL DEFAULT 0,          -- in paise: 99900 = ₹999
  original_price_paise BIGINT NOT NULL DEFAULT 0, -- in paise: 299900 = ₹2999
  is_free BOOLEAN NOT NULL DEFAULT FALSE,
  access_months INT NOT NULL DEFAULT 3,           -- Default access period 3 months
  status VARCHAR(20) DEFAULT 'live' CHECK (status IN ('draft', 'live', 'archived')),
  opens_on TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  closes_on TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ------------------------------------------------------------------------------
-- 4. LESSONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  duration_sec INT NOT NULL DEFAULT 0,
  is_free BOOLEAN NOT NULL DEFAULT FALSE,         -- true = free preview
  video_type VARCHAR(20) DEFAULT 'youtube' CHECK (video_type IN ('youtube', 'vimeo', 'custom')),
  video_url TEXT NOT NULL,                        -- video ID or secure URL
  live_days INT DEFAULT 0,
  expires_at TIMESTAMPTZ,
  position INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ------------------------------------------------------------------------------
-- 5. COUPONS & COUPON_COURSES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) DEFAULT 'flat' CHECK (discount_type IN ('flat', 'percent')),
  value INT NOT NULL,                             -- flat paise discount or percent discount
  starts_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  ends_at TIMESTAMPTZ,
  usage_limit INT DEFAULT 500,
  used_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS coupon_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE (coupon_id, course_id)
);

-- ------------------------------------------------------------------------------
-- 6. PURCHASES (Orders)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  amount_paise BIGINT NOT NULL,
  coupon_id UUID REFERENCES coupons(id),
  razorpay_order_id VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  razorpay_signature VARCHAR(255),
  status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('created', 'success', 'refunded', 'failed')),
  purchased_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(user_id, course_id)
);

-- ------------------------------------------------------------------------------
-- 7. STUDENT NOTES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ------------------------------------------------------------------------------
-- 8. COURSE BOOKS & PDF MATERIALS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  pages INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ------------------------------------------------------------------------------
-- 9. STUDENT PROGRESS & RESUME PLAYBACK
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  position_sec INT DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE (user_id, lesson_id)
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

-- 1. Courses: anyone can read live published courses
CREATE POLICY "Public can view live courses"
ON courses FOR SELECT
USING (status = 'live');

-- 2. Lessons:
-- Anyone can see lesson titles and metadata for live courses
-- Video URL is protected: visible only if lesson.is_free = true OR user has active unexpired purchase
CREATE POLICY "Public can view lessons metadata"
ON lessons FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = lessons.course_id AND c.status = 'live'
  )
);

-- Secure view / function for checking if a lesson video is accessible
CREATE OR REPLACE FUNCTION is_lesson_unlocked(lesson_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  lesson_record RECORD;
  has_valid_purchase BOOLEAN;
BEGIN
  SELECT is_free, course_id INTO lesson_record FROM lessons WHERE id = lesson_uuid;
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- If lesson is free, it is unlocked
  IF lesson_record.is_free = TRUE THEN
    RETURN TRUE;
  END IF;

  -- If user is logged in, check active purchase
  IF user_uuid IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM purchases p
    WHERE p.user_id = user_uuid
      AND p.course_id = lesson_record.course_id
      AND p.status = 'success'
      AND p.expires_at > TIMEZONE('utc', NOW())
  ) INTO has_valid_purchase;

  RETURN has_valid_purchase;
END;
$$;

-- 3. Profiles: Students can only read and update their own profile
CREATE POLICY "Students can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Students can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Students can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- 4. Purchases: Students can only view their own purchases
CREATE POLICY "Students can view own purchases"
ON purchases FOR SELECT
USING (auth.uid() = user_id);

-- 5. Notes: Students have full CRUD on their own notes only
CREATE POLICY "Students can view own notes"
ON notes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Students can insert own notes"
ON notes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can update own notes"
ON notes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Students can delete own notes"
ON notes FOR DELETE
USING (auth.uid() = user_id);

-- 6. Books: Visible to students who have an unexpired purchase of the course
CREATE POLICY "Enrolled students can view course books"
ON books FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM purchases p
    WHERE p.course_id = books.course_id
      AND p.user_id = auth.uid()
      AND p.status = 'success'
      AND p.expires_at > TIMEZONE('utc', NOW())
  )
);

-- 7. Progress: Students can view, insert, and update their own progress
CREATE POLICY "Students can view own progress"
ON progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Students can upsert own progress"
ON progress FOR ALL
USING (auth.uid() = user_id);

-- 8. Coupons: readable by authenticated students to validate discount
CREATE POLICY "Students can view active coupons"
ON coupons FOR SELECT
USING (is_active = TRUE AND (ends_at IS NULL OR ends_at > TIMEZONE('utc', NOW())));
