-- ====================================================================
-- User Profiles Migration for Nhost
-- ====================================================================
-- 
-- Purpose: Create user_profiles table and link to Nhost auth.users
-- Migration: From Firebase to Nhost authentication system
--
-- This migration:
-- - Creates user_profiles table with custom user fields
-- - Links to Nhost's auth.users table via foreign key
-- - Migrates data from existing restaurant_users (if needed)
--
-- ====================================================================

-- ====================================================================
-- 1. Create user_profiles table
-- ====================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  -- Primary key that references auth.users.id
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Profile Information
  username VARCHAR(255) UNIQUE NOT NULL,
  about_me TEXT,
  birthdate DATE,
  gender VARCHAR(50),
  
  -- Preferences (JSONB for flexibility)
  palates JSONB DEFAULT '[]'::jsonb, -- Array of palate preferences
  
  -- Onboarding Status
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 2. Indexes for Performance
-- ====================================================================

-- Index for username lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_username 
  ON user_profiles(username) WHERE username IS NOT NULL;

-- Index for onboarding status queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding 
  ON user_profiles(onboarding_complete);

-- GIN index for JSONB palates queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_palates 
  ON user_profiles USING GIN(palates);

-- ====================================================================
-- 3. Auto-update timestamp trigger
-- ====================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on UPDATE
CREATE TRIGGER trigger_update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- ====================================================================
-- 4. Hasura Relationship Configuration
-- ====================================================================

-- In Hasura Console, create these relationships:
-- 
-- user_profiles table:
--   - Object relationship to auth.users:
--     - Name: user
--     - Reference: user_id → auth.users.id
--
-- auth.users table:
--   - Object relationship to user_profiles:
--     - Name: profile
--     - Reference: id → user_profiles.user_id
--

-- ====================================================================
-- 5. Optional: Migrate data from restaurant_users (if applicable)
-- ====================================================================

-- Uncomment and run this section if you have existing restaurant_users
-- that need to be migrated to the new user_profiles structure.

/*
-- Step 1: Link restaurant_users to auth.users
-- First, you need to have created Nhost auth users and added nhost_user_id
-- to restaurant_users (as described in the migration plan).

-- Step 2: Migrate to user_profiles
INSERT INTO user_profiles (
  user_id,
  username,
  about_me,
  birthdate,
  gender,
  palates,
  onboarding_complete,
  created_at,
  updated_at
)
SELECT
  ru.nhost_user_id AS user_id,
  ru.username,
  ru.about_me,
  ru.birthdate,
  ru.gender,
  COALESCE(ru.palates, '[]'::jsonb) AS palates,
  COALESCE(ru.onboarding_complete, false) AS onboarding_complete,
  ru.created_at,
  ru.updated_at
FROM restaurant_users ru
WHERE ru.nhost_user_id IS NOT NULL
  AND ru.deleted_at IS NULL
ON CONFLICT (user_id) DO UPDATE SET
  username = EXCLUDED.username,
  about_me = EXCLUDED.about_me,
  birthdate = EXCLUDED.birthdate,
  gender = EXCLUDED.gender,
  palates = EXCLUDED.palates,
  onboarding_complete = EXCLUDED.onboarding_complete,
  updated_at = NOW();
*/

-- ====================================================================
-- 6. Hasura Permissions Setup (run in Hasura Console)
-- ====================================================================

/*
-- For 'user' role on user_profiles:

-- SELECT permission:
{
  "user_id": {
    "_eq": "X-Hasura-User-Id"
  }
}
-- Columns: all columns

-- INSERT permission:
{
  "user_id": {
    "_eq": "X-Hasura-User-Id"
  }
}
-- Columns: username, about_me, birthdate, gender, palates, onboarding_complete
-- Check: user_id = X-Hasura-User-Id

-- UPDATE permission:
{
  "user_id": {
    "_eq": "X-Hasura-User-Id"
  }
}
-- Columns: username, about_me, birthdate, gender, palates, onboarding_complete

-- DELETE permission:
-- Not typically allowed; deletion should happen via auth.users cascade
*/

-- ====================================================================
-- Verification Queries
-- ====================================================================

-- Check table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_profiles'
);

-- Check foreign key constraint
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'user_profiles';

-- ====================================================================
-- Notes
-- ====================================================================

-- 1. This table is specifically designed for Nhost auth integration
-- 2. user_id references auth.users.id (Nhost's auth table)
-- 3. All custom user fields live here (username, about_me, etc.)
-- 4. Nhost auth fields (email, displayName, avatarUrl) live in auth.users
-- 5. On user deletion in auth.users, the profile is CASCADE deleted
