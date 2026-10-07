-- ==============================================================================
-- MINDMASTER ACADEMY: PHASE-2 STAFF RBAC, AUDIT, NOTIFICATIONS & SETTINGS MIGRATION
-- Migration: 003_phase2_staff_rbac_schema.sql
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. STAFF ACCOUNTS TABLE
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 2. STAFF PERMISSIONS TABLE
-- ------------------------------------------------------------------------------
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
      'notes.books.manage'
    )
  ),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE (staff_id, permission_key)
);

-- ------------------------------------------------------------------------------
-- 3. AUDIT LOG (IMMUTABLE MUTATING ACTIONS TRACKER)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id VARCHAR(50) REFERENCES staff_accounts(staff_id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  meta JSONB DEFAULT '{}'::jsonb,
  at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ------------------------------------------------------------------------------
-- 4. IN-APP NOTIFICATIONS (STRICTLY NO WHATSAPP)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS in_app_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ------------------------------------------------------------------------------
-- 5. COUPON REDEMPTIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ------------------------------------------------------------------------------
-- 6. EXTEND COURSES WITH TARGET SEGMENT & SCHEDULING
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'target_segment') THEN
    ALTER TABLE courses ADD COLUMN target_segment JSONB DEFAULT '["general"]'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'publish_at') THEN
    ALTER TABLE courses ADD COLUMN publish_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'remove_at') THEN
    ALTER TABLE courses ADD COLUMN remove_at TIMESTAMPTZ DEFAULT NULL;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 7. EXTEND LESSONS WITH PUBLISH_AT & REMOVE_AT
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'publish_at') THEN
    ALTER TABLE lessons ADD COLUMN publish_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'remove_at') THEN
    ALTER TABLE lessons ADD COLUMN remove_at TIMESTAMPTZ DEFAULT NULL;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 8. EXTEND COUPONS WITH APPLIES_ALL, PER_USER_USAGE, STARTS_AT, ENDS_AT
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'applies_all') THEN
    ALTER TABLE coupons ADD COLUMN applies_all BOOLEAN DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'per_user_usage') THEN
    ALTER TABLE coupons ADD COLUMN per_user_usage TEXT DEFAULT 'once' CHECK (per_user_usage IN ('once', 'multiple'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'starts_at') THEN
    ALTER TABLE coupons ADD COLUMN starts_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'ends_at') THEN
    ALTER TABLE coupons ADD COLUMN ends_at TIMESTAMPTZ DEFAULT NULL;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 9. SETTINGS (SINGLE ROW TABLE)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  max_sub_admins INT NOT NULL DEFAULT 50,
  default_access_months INT NOT NULL DEFAULT 3,
  default_video_live_days INT NOT NULL DEFAULT 30,
  default_coupon_days INT NOT NULL DEFAULT 7,
  renewal_coupon_percent INT NOT NULL DEFAULT 50,
  reminder_template TEXT NOT NULL DEFAULT 'Namaskar! Your MindMaster course module is ready in your library.',
  maintenance BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Seed initial single row for settings
INSERT INTO settings (
  id,
  max_sub_admins,
  default_access_months,
  default_video_live_days,
  default_coupon_days,
  renewal_coupon_percent,
  reminder_template,
  maintenance
) VALUES (
  1,
  50,
  3,
  30,
  7,
  50,
  'Namaskar! Your MindMaster course module is ready in your library.',
  FALSE
) ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES PER HARD RULES
-- ==============================================================================

ALTER TABLE staff_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE in_app_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Helper function to get current staff role and permissions
CREATE OR REPLACE FUNCTION get_current_staff_record()
RETURNS TABLE (
  staff_id VARCHAR(50),
  role VARCHAR(20),
  status VARCHAR(20)
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT s.staff_id, s.role, s.status
  FROM staff_accounts s
  WHERE s.phone = (auth.jwt() ->> 'phone')
     OR s.staff_id = (auth.jwt() ->> 'staff_id')
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION has_staff_perm(p_key VARCHAR)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff_accounts s
    LEFT JOIN staff_permissions sp ON sp.staff_id = s.staff_id
    WHERE (s.phone = (auth.jwt() ->> 'phone') OR s.staff_id = (auth.jwt() ->> 'staff_id'))
      AND s.status = 'active'
      AND (s.role = 'main_admin' OR sp.permission_key = p_key)
  );
$$;

-- RLS: staff_accounts (Main admin full powers, sub-admins see own account)
CREATE POLICY "Main admin has full control on staff_accounts"
ON staff_accounts FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM staff_accounts s
    WHERE (s.phone = (auth.jwt() ->> 'phone') OR s.staff_id = (auth.jwt() ->> 'staff_id'))
      AND s.role = 'main_admin'
      AND s.status = 'active'
  )
);

CREATE POLICY "Sub-admins can view own staff account"
ON staff_accounts FOR SELECT
USING (
  phone = (auth.jwt() ->> 'phone')
  OR staff_id = (auth.jwt() ->> 'staff_id')
);

-- RLS: staff_permissions (Main admin manage, sub-admin view own)
CREATE POLICY "Main admin has full control on staff_permissions"
ON staff_permissions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM staff_accounts s
    WHERE (s.phone = (auth.jwt() ->> 'phone') OR s.staff_id = (auth.jwt() ->> 'staff_id'))
      AND s.role = 'main_admin'
      AND s.status = 'active'
  )
);

CREATE POLICY "Sub-admins can view own permissions"
ON staff_permissions FOR SELECT
USING (
  staff_id IN (
    SELECT s.staff_id FROM staff_accounts s
    WHERE s.phone = (auth.jwt() ->> 'phone') OR s.staff_id = (auth.jwt() ->> 'staff_id')
  )
);

-- RLS: audit_log (Main admin views all, staff can insert and view own actions)
CREATE POLICY "Main admin can view full audit trail"
ON audit_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM staff_accounts s
    WHERE (s.phone = (auth.jwt() ->> 'phone') OR s.staff_id = (auth.jwt() ->> 'staff_id'))
      AND s.role = 'main_admin'
      AND s.status = 'active'
  )
);

CREATE POLICY "Staff can view own audit entries"
ON audit_log FOR SELECT
USING (
  staff_id IN (
    SELECT s.staff_id FROM staff_accounts s
    WHERE s.phone = (auth.jwt() ->> 'phone') OR s.staff_id = (auth.jwt() ->> 'staff_id')
  )
);

CREATE POLICY "Active staff can insert audit log entries"
ON audit_log FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM staff_accounts s
    WHERE (s.phone = (auth.jwt() ->> 'phone') OR s.staff_id = (auth.jwt() ->> 'staff_id'))
      AND s.status = 'active'
  )
);

-- RLS: in_app_notifications (Students view/update own, staff can insert)
CREATE POLICY "Students can view own notifications"
ON in_app_notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Students can mark own notifications read"
ON in_app_notifications FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff with students.view or main_admin can insert notifications"
ON in_app_notifications FOR INSERT
WITH CHECK (has_staff_perm('students.view'));

-- RLS: coupon_redemptions (Students insert/view own, staff inspect)
CREATE POLICY "Students can view own coupon redemptions"
ON coupon_redemptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Students can insert coupon redemption on enrollment"
ON coupon_redemptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff with coupons.manage or reports.view can view all redemptions"
ON coupon_redemptions FOR SELECT
USING (has_staff_perm('coupons.manage') OR has_staff_perm('reports.view'));

-- RLS: settings (Public can read maintenance, staff view, main_admin update)
CREATE POLICY "Public can view settings"
ON settings FOR SELECT
USING (TRUE);

CREATE POLICY "Main admin can update settings"
ON settings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM staff_accounts s
    WHERE (s.phone = (auth.jwt() ->> 'phone') OR s.staff_id = (auth.jwt() ->> 'staff_id'))
      AND s.role = 'main_admin'
      AND s.status = 'active'
  )
);

-- RLS: Update courses policy for scheduling
DROP POLICY IF EXISTS "Public can view live courses" ON courses;
CREATE POLICY "Public can view scheduled live courses"
ON courses FOR SELECT
USING (
  status = 'live'
  AND (publish_at IS NULL OR publish_at <= TIMEZONE('utc', NOW()))
  AND (remove_at IS NULL OR remove_at >= TIMEZONE('utc', NOW()))
);

CREATE POLICY "Staff with courses.manage can view and edit courses"
ON courses FOR ALL
USING (has_staff_perm('courses.manage'))
WITH CHECK (has_staff_perm('courses.manage'));

-- Delete course is strictly reserved for main_admin
CREATE POLICY "Only main_admin can delete courses"
ON courses FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM staff_accounts s
    WHERE (s.phone = (auth.jwt() ->> 'phone') OR s.staff_id = (auth.jwt() ->> 'staff_id'))
      AND s.role = 'main_admin'
      AND s.status = 'active'
  )
);

-- ==============================================================================
-- 11. SEED OWNER (MMA-000) FROM ENV (OWNER_PHONE + OWNER_TEMP_PASSWORD)
-- ==============================================================================
DO $$
DECLARE
  v_owner_phone VARCHAR(20);
  v_owner_temp_password TEXT;
  v_password_hash TEXT;
BEGIN
  -- Read from PostgreSQL session configuration if provided, or default fallback
  v_owner_phone := COALESCE(NULLIF(current_setting('app.owner_phone', TRUE), ''), '+919822012345');
  v_owner_temp_password := COALESCE(NULLIF(current_setting('app.owner_temp_password', TRUE), ''), 'Owner@2026');

  -- Generate bcrypt hash
  v_password_hash := crypt(v_owner_temp_password, gen_salt('bf', 10));

  -- Insert or update MMA-000
  INSERT INTO staff_accounts (
    staff_id,
    full_name,
    phone,
    role,
    password_hash,
    must_change_password,
    status,
    created_by
  ) VALUES (
    'MMA-000',
    'Prashant Dhumal',
    v_owner_phone,
    'main_admin',
    v_password_hash,
    TRUE,
    'active',
    'system_seed'
  )
  ON CONFLICT (staff_id) DO UPDATE SET
    phone = EXCLUDED.phone,
    role = 'main_admin',
    status = 'active',
    must_change_password = EXCLUDED.must_change_password,
    password_hash = EXCLUDED.password_hash;

  -- Grant all 6 permission keys to MMA-000
  INSERT INTO staff_permissions (staff_id, permission_key)
  VALUES
    ('MMA-000', 'videos.manage'),
    ('MMA-000', 'courses.manage'),
    ('MMA-000', 'coupons.manage'),
    ('MMA-000', 'students.view'),
    ('MMA-000', 'reports.view'),
    ('MMA-000', 'notes.books.manage')
  ON CONFLICT (staff_id, permission_key) DO NOTHING;

  -- Record initial audit log entry
  INSERT INTO audit_log (
    staff_id,
    action,
    entity_type,
    entity_id,
    meta
  ) VALUES (
    'MMA-000',
    'OWNER_INITIALIZED',
    'staff_accounts',
    'MMA-000',
    jsonb_build_object(
      'phone', v_owner_phone,
      'role', 'main_admin',
      'must_change_password', TRUE
    )
  );
END $$;
