-- ==============================================================================
-- MINDMASTER ACADEMY: PROFESSIONAL COUPON ENHANCEMENTS MIGRATION
-- Migration: 007_coupon_pro_enhancements.sql
-- Description: Adds minimum order value, status support ('paused'), and rich
--              redemption auditing (student name, phone, course, discount, paid).
-- ==============================================================================

-- 1. Add min_order_value_paise to coupons table
ALTER TABLE coupons 
ADD COLUMN IF NOT EXISTS min_order_value_paise bigint DEFAULT NULL;

COMMENT ON COLUMN coupons.min_order_value_paise IS 'Minimum course order price in paise required for this coupon to apply (e.g. 49900 = ₹499).';

-- 2. Enhance coupon_redemptions table with rich auditing columns
ALTER TABLE coupon_redemptions 
ADD COLUMN IF NOT EXISTS student_name text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS student_mobile text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS course_id text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS course_title text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS original_price_paise bigint DEFAULT NULL,
ADD COLUMN IF NOT EXISTS discount_paise bigint DEFAULT NULL,
ADD COLUMN IF NOT EXISTS paid_paise bigint DEFAULT NULL;

-- 3. Pre-seed default minimum order value for existing coupons
UPDATE coupons SET min_order_value_paise = 49900 WHERE min_order_value_paise IS NULL;
