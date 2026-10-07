-- ==============================================================================
-- MINDMASTER ACADEMY: FINAL AUTHORITY MODEL & PERMISSION LOCK
-- Migration: 004_permission_lock.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. DATA MIGRATION: PURGE NON-ASSIGNABLE SUB-ADMIN PERMISSIONS
-- ------------------------------------------------------------------------------
-- Delete all permission rows not in ('messages.manage', 'students.view')
DELETE FROM staff_permissions
WHERE permission_key NOT IN ('messages.manage', 'students.view');

-- Restrict CHECK constraint on staff_permissions to only the 2 assignable keys
ALTER TABLE staff_permissions DROP CONSTRAINT IF EXISTS staff_permissions_permission_key_check;
ALTER TABLE staff_permissions ADD CONSTRAINT staff_permissions_permission_key_check
  CHECK (permission_key IN ('messages.manage', 'students.view'));

-- ------------------------------------------------------------------------------
-- 2. HELPER FUNCTION: CHECK MAIN ADMIN AUTHORITY
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_main_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff_accounts s
    WHERE (s.phone = (auth.jwt() ->> 'phone') OR s.staff_id = (auth.jwt() ->> 'staff_id'))
      AND s.role = 'main_admin'
      AND s.status = 'active'
  );
$$;

-- ------------------------------------------------------------------------------
-- 3. COURSES: WRITE & DELETE STRICTLY RESERVED FOR MAIN ADMIN
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Staff with courses.manage can view and edit courses" ON courses;
DROP POLICY IF EXISTS "Only main_admin can delete courses" ON courses;

CREATE POLICY "Main admin can manage all courses"
ON courses FOR ALL
USING (is_main_admin())
WITH CHECK (is_main_admin());

-- ------------------------------------------------------------------------------
-- 4. LESSONS / VIDEOS: WRITE & DELETE STRICTLY RESERVED FOR MAIN ADMIN
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Staff with videos.manage can manage lessons" ON lessons;
DROP POLICY IF EXISTS "Only main_admin can delete lessons" ON lessons;

CREATE POLICY "Main admin can manage all lessons"
ON lessons FOR ALL
USING (is_main_admin())
WITH CHECK (is_main_admin());

-- ------------------------------------------------------------------------------
-- 5. COUPONS: WRITE & DELETE STRICTLY RESERVED FOR MAIN ADMIN
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Staff with coupons.manage can manage coupons" ON coupons;
DROP POLICY IF EXISTS "Only main_admin can delete coupons" ON coupons;

CREATE POLICY "Main admin can manage all coupons"
ON coupons FOR ALL
USING (is_main_admin())
WITH CHECK (is_main_admin());

-- ------------------------------------------------------------------------------
-- 6. FREE GRANTS: WRITE & DELETE STRICTLY RESERVED FOR MAIN ADMIN
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Staff with freegrant.manage can manage grants" ON grants;
DROP POLICY IF EXISTS "Only main_admin can delete grants" ON grants;

CREATE POLICY "Main admin can manage all grants"
ON grants FOR ALL
USING (is_main_admin())
WITH CHECK (is_main_admin());

-- ------------------------------------------------------------------------------
-- 7. BOOKS & STUDY MATERIAL: WRITE & DELETE STRICTLY RESERVED FOR MAIN ADMIN
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Staff with notes.books.manage can manage books" ON books;
DROP POLICY IF EXISTS "Only main_admin can delete books" ON books;

CREATE POLICY "Main admin can manage all books"
ON books FOR ALL
USING (is_main_admin())
WITH CHECK (is_main_admin());

-- ------------------------------------------------------------------------------
-- 8. AUDIT LOG: FULL QUERY RESERVED FOR MAIN ADMIN; SUB-ADMIN LIMITED TO OWN
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Main admin can view full audit trail" ON audit_log;
DROP POLICY IF EXISTS "Staff can view own audit entries" ON audit_log;

CREATE POLICY "Main admin can view full audit trail"
ON audit_log FOR SELECT
USING (is_main_admin());

CREATE POLICY "Staff can view own audit entries"
ON audit_log FOR SELECT
USING (
  staff_id IN (
    SELECT s.staff_id FROM staff_accounts s
    WHERE s.phone = (auth.jwt() ->> 'phone') OR s.staff_id = (auth.jwt() ->> 'staff_id')
  )
);

-- ------------------------------------------------------------------------------
-- 9. SETTINGS: UPDATES STRICTLY RESERVED FOR MAIN ADMIN
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Main admin can update settings" ON settings;

CREATE POLICY "Main admin can update settings"
ON settings FOR UPDATE
USING (is_main_admin())
WITH CHECK (is_main_admin());

-- ------------------------------------------------------------------------------
-- 10. STAFF ACCOUNTS & PERMISSIONS: CRUD STRICTLY RESERVED FOR MAIN ADMIN
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Main admin can manage staff accounts" ON staff_accounts;
DROP POLICY IF EXISTS "Main admin can manage staff permissions" ON staff_permissions;

CREATE POLICY "Main admin can manage staff accounts"
ON staff_accounts FOR ALL
USING (is_main_admin())
WITH CHECK (is_main_admin());

CREATE POLICY "Main admin can manage staff permissions"
ON staff_permissions FOR ALL
USING (is_main_admin())
WITH CHECK (is_main_admin());

-- ------------------------------------------------------------------------------
-- 11. STUDENT TELEMETRY: PER-LESSON DRILL IS HIDDEN FROM SUB-ADMIN
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Staff can view all progress" ON progress;

CREATE POLICY "Main admin can view all progress"
ON progress FOR SELECT
USING (is_main_admin());
