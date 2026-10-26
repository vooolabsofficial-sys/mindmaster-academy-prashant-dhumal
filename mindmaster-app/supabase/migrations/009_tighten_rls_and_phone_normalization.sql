-- ==============================================================================
-- 🚀 MIGRATION 009: TIGHTEN RLS ON SENSITIVE TABLES & PHONE NUMBER NORMALIZATION
-- ==============================================================================
-- 1. Remove 'OR true' and restrict courses SELECT policy to status='live' + active schedule.
-- 2. Restrict sensitive tables (coupons, purchases, course_grants, staff_accounts, audit_log)
--    so only server-side Service Role (admin.ts) can mutate or list them.
-- 3. Clean up existing phone numbers in DB to clean 10-digit Indian mobile standard.
-- 4. Install DB trigger on phone columns to guarantee 10-digit normalization forever.
-- ==============================================================================

-- 1. COURSES CATALOG: Strict RLS (Drop 'OR true')
DROP POLICY IF EXISTS "Public can view live courses" ON courses;
DROP POLICY IF EXISTS "Public can view scheduled live courses" ON courses;

CREATE POLICY "Public can view live courses"
ON courses FOR SELECT
USING (
  status = 'live'
  AND (publish_at IS NULL OR publish_at <= TIMEZONE('utc', NOW()))
  AND (remove_at IS NULL OR remove_at >= TIMEZONE('utc', NOW()))
);

-- 2. RESTRICT SENSITIVE TABLES (No public listing or mutation)
-- Service Role (admin.ts) bypasses RLS in Supabase. Regular anon/authenticated cannot access.

-- A) Coupons & Redemptions
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active coupons" ON coupons;
DROP POLICY IF EXISTS "Public can view coupons" ON coupons;
DROP POLICY IF EXISTS "Anyone can view coupons" ON coupons;

-- B) Purchases & Enrollments
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read purchases" ON purchases;
DROP POLICY IF EXISTS "Public can manage purchases" ON purchases;

-- C) Course Grants (Offline Admissions / Scholarships)
ALTER TABLE course_grants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students can read their grants" ON course_grants;
DROP POLICY IF EXISTS "Staff manage grants" ON course_grants;
DROP POLICY IF EXISTS "Public can read grants" ON course_grants;

-- D) Staff Accounts & Staff Permissions
ALTER TABLE staff_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read staff" ON staff_accounts;
DROP POLICY IF EXISTS "Anyone can manage staff" ON staff_accounts;

-- E) Audit Logs
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read audit" ON audit_log;
DROP POLICY IF EXISTS "Allow system insert audit" ON audit_log;

-- ==============================================================================
-- 3. PHONE NORMALIZATION: RETROACTIVE DATA CLEANUP
-- ==============================================================================
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

-- Retroactively clean all existing table records
UPDATE profiles
SET phone = normalize_phone_canonical(phone)
WHERE phone IS NOT NULL AND (phone LIKE '+91%' OR phone LIKE '91%' OR phone LIKE '0%' OR LENGTH(phone) > 10);

UPDATE staff_accounts
SET phone = normalize_phone_canonical(phone)
WHERE phone IS NOT NULL AND (phone LIKE '+91%' OR phone LIKE '91%' OR phone LIKE '0%' OR LENGTH(phone) > 10);

UPDATE course_grants
SET student_phone = normalize_phone_canonical(student_phone)
WHERE student_phone IS NOT NULL AND (student_phone LIKE '+91%' OR student_phone LIKE '91%' OR student_phone LIKE '0%' OR LENGTH(student_phone) > 10);

UPDATE video_likes
SET user_phone = normalize_phone_canonical(user_phone)
WHERE user_phone IS NOT NULL AND (user_phone LIKE '+91%' OR user_phone LIKE '91%' OR user_phone LIKE '0%' OR LENGTH(user_phone) > 10);

UPDATE coupon_redemptions
SET student_mobile = normalize_phone_canonical(student_mobile)
WHERE student_mobile IS NOT NULL AND (student_mobile LIKE '+91%' OR student_mobile LIKE '91%' OR student_mobile LIKE '0%' OR LENGTH(student_mobile) > 10);

-- ==============================================================================
-- 4. DB TRIGGERS: AUTOMATIC 10-DIGIT ENFORCEMENT ON INSERT/UPDATE
-- ==============================================================================
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
