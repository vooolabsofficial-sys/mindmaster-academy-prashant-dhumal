-- ==============================================================================
-- MINDMASTER ACADEMY: COUPON SCHOOL RESTRICTION MIGRATION
-- Migration: 006_coupon_school.sql
-- Description: Adds 'school' text column to coupons table.
--              If NULL or empty, the coupon is unrestricted (open to all students).
--              If set, only students from that specific school can redeem it.
-- ==============================================================================

ALTER TABLE coupons ADD COLUMN school text DEFAULT NULL;
