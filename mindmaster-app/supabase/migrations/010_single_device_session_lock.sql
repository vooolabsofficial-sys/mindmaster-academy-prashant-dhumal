-- ==============================================================================
-- Migration 010: Single-Device Login Session Lock
-- Description: Adds active_session_token to profiles to enforce 1 student = 1 active device
-- ==============================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active_session_token TEXT;

COMMENT ON COLUMN profiles.active_session_token IS 'Unique active device session token for single-device login enforcement';
