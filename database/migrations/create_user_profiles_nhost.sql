-- ====================================================================
-- Quick Setup: user_profiles Table for Nhost
-- ====================================================================
-- 
-- INSTRUCTIONS:
-- 1. Go to Nhost Dashboard → Database → SQL Editor
-- 2. Copy and paste this ENTIRE file
-- 3. Click "Run"
-- 4. Then follow the Hasura permissions setup in:
--    NHOST_USER_PROFILES_SETUP_GUIDE.md
--
-- ====================================================================

-- ====================================================================
-- 1. Create user_profiles Table
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
  palates JSONB DEFAULT '[]'::jsonb,
  
  -- Onboarding Status
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE user_profiles IS 'User profile data linked to Nhost auth.users';
COMMENT ON COLUMN user_profiles.user_id IS 'Foreign key to auth.users.id';
COMMENT ON COLUMN user_profiles.username IS 'Unique username for the user';
COMMENT ON COLUMN user_profiles.palates IS 'JSONB array of palate preferences';
COMMENT ON COLUMN user_profiles.onboarding_complete IS 'Whether user has completed onboarding';

-- ====================================================================
-- 2. Create Indexes for Performance
-- ====================================================================

-- Index for username lookups (most common query)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_username 
  ON user_profiles(username) WHERE username IS NOT NULL;

-- Index for onboarding status queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding 
  ON user_profiles(onboarding_complete);

-- GIN index for JSONB palates queries (for searching by palates)
CREATE INDEX IF NOT EXISTS idx_user_profiles_palates 
  ON user_profiles USING GIN(palates);

-- ====================================================================
-- 3. Create Auto-update Timestamp Function & Trigger
-- ====================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists (to avoid duplicate trigger error)
DROP TRIGGER IF EXISTS trigger_update_user_profiles_updated_at ON user_profiles;

-- Create trigger to auto-update updated_at on every UPDATE
CREATE TRIGGER trigger_update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- ====================================================================
-- 4. Verification Queries
-- ====================================================================

-- Check if table was created successfully
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✅ user_profiles table created successfully';
  ELSE
    RAISE EXCEPTION '❌ user_profiles table was not created';
  END IF;
END $$;

-- Display table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Display indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'user_profiles'
ORDER BY indexname;

-- Display foreign key constraints
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
-- 5. Sample Query to Test
-- ====================================================================

-- This should return empty result (not an error)
SELECT * FROM user_profiles LIMIT 5;

-- ====================================================================
-- NEXT STEPS:
-- ====================================================================
-- 
-- 1. ✅ Table is created
-- 2. ⚠️  Go to Hasura Console and track the table:
--       - Hasura Console → Data tab
--       - Look for "Untracked tables or views"
--       - Click "Track" next to user_profiles
-- 
-- 3. ⚠️  Set up Hasura permissions (CRITICAL):
--       - Follow the detailed guide in:
--         NHOST_USER_PROFILES_SETUP_GUIDE.md
--       - Section: "Step 3: Set Up Hasura Permissions"
-- 
-- 4. ✅ Test authentication in your app
-- 
-- ====================================================================
