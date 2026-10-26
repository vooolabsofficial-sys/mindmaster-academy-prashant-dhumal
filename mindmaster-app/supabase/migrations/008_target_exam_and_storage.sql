-- ==============================================================================
-- MINDMASTER ACADEMY: TARGET EXAM GOAL & STORAGE BUCKET MIGRATION
-- Migration: 008_target_exam_and_storage.sql
-- Description: Adds 'target_exam' column to profiles table for personalized
--              course recommendations and student learning paths.
--              Also sets up storage bucket definitions for official course PDFs.
-- ==============================================================================

-- 1. Add target_exam column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS target_exam VARCHAR(150) DEFAULT 'पोलीस भरती (Maharashtra Police Bharti 2026)';

COMMENT ON COLUMN profiles.target_exam IS 'Student selected competitive exam goal (e.g. Police Bharti, MPSC, 10th SSC Board, Vedic Maths, Scholarship)';

-- 2. Index on target_exam for swift analytics and filtering
CREATE INDEX IF NOT EXISTS idx_profiles_target_exam ON profiles(target_exam);

-- 3. Pre-seed default exam goals for existing seed profiles if null
UPDATE profiles 
SET target_exam = 'पोलीस भरती (Maharashtra Police Bharti 2026)'
WHERE target_exam IS NULL;

-- 4. Setup Course Materials Storage Bucket if Supabase Storage schema exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('course-materials', 'course-materials', true)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
