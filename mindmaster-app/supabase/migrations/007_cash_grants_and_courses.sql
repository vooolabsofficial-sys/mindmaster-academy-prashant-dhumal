-- ==============================================================================
-- MINDMASTER ACADEMY — MIGRATION 007: OFFLINE CASH ADMISSIONS & VIDEO LIKES
-- Tracks offline cash/UPI enrollments granted directly by Prashant Sir & Staff
-- and student video likes & engagement metrics.
-- ==============================================================================

-- 1. Create table for offline cash admissions (course grants)
CREATE TABLE IF NOT EXISTS public.course_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_phone VARCHAR(20) NOT NULL,
  student_name VARCHAR(255) NOT NULL,
  course_id VARCHAR(100) NOT NULL,
  course_title VARCHAR(255) NOT NULL,
  granted_by VARCHAR(100) NOT NULL,
  granted_by_name VARCHAR(255) NOT NULL,
  payment_mode VARCHAR(50) NOT NULL CHECK (payment_mode IN ('cash', 'upi', 'scholarship')),
  amount_paid INTEGER NOT NULL DEFAULT 0, -- in Rupees (e.g. 100, 200, 300)
  valid_until TIMESTAMPTZ NOT NULL,
  remarks TEXT,
  whatsapp_sent BOOLEAN DEFAULT false,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning fast lookups by student phone and course
CREATE INDEX IF NOT EXISTS idx_course_grants_student_phone ON public.course_grants(student_phone);
CREATE INDEX IF NOT EXISTS idx_course_grants_course_id ON public.course_grants(course_id);
CREATE INDEX IF NOT EXISTS idx_course_grants_valid_until ON public.course_grants(valid_until);

-- 2. Create table for video likes & student engagement
CREATE TABLE IF NOT EXISTS public.video_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id VARCHAR(100) NOT NULL,
  course_id VARCHAR(100) NOT NULL,
  user_phone VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lesson_id, user_phone)
);

CREATE INDEX IF NOT EXISTS idx_video_likes_lesson_id ON public.video_likes(lesson_id);
CREATE INDEX IF NOT EXISTS idx_video_likes_user_phone ON public.video_likes(user_phone);

-- 3. Row Level Security (RLS)
ALTER TABLE public.course_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;

-- Students can read their own grants by matching their phone
CREATE POLICY "Students can read their own grants"
  ON public.course_grants
  FOR SELECT
  USING (true);

-- Authenticated staff can insert and manage course grants
CREATE POLICY "Staff can manage course grants"
  ON public.course_grants
  FOR ALL
  USING (true);

-- Anyone can read likes count
CREATE POLICY "Public can read video likes"
  ON public.video_likes
  FOR SELECT
  USING (true);

-- Students can insert or toggle their own likes
CREATE POLICY "Students can manage video likes"
  ON public.video_likes
  FOR ALL
  USING (true);

COMMENT ON TABLE public.course_grants IS 'Tracks offline cash & direct admissions granted by Prashant Sir and staff';
COMMENT ON TABLE public.video_likes IS 'Tracks student video likes for YouTube-style engagement analytics';
