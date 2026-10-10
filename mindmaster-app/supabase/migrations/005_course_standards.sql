-- ==============================================================================
-- MINDMASTER ACADEMY: COURSE STANDARDS MIGRATION
-- Migration: 005_course_standards.sql
-- Description: Adds 'standards' integer array to courses table (grades 5 to 12).
--              NULL or empty array indicates course is open to all / other segments.
-- ==============================================================================

-- 1. Add standards column to courses table
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS standards INT[] DEFAULT NULL;

-- 2. Document the column
COMMENT ON COLUMN courses.standards IS 'Target school standards/grades (e.g. ARRAY[5,6,7,8,9,10,11,12]). NULL or empty array represents open to all / general / non-school courses.';

-- 3. Pre-seed default standards for existing foundational school courses
UPDATE courses
SET standards = ARRAY[5, 6, 7, 8, 9, 10, 11, 12]
WHERE code IN ('MM-01', 'MM-04', 'MM-05')
  AND (standards IS NULL OR cardinality(standards) = 0);
