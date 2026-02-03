-- =====================================================
-- Fix Foreign Key Constraint Issue
-- =====================================================
-- The trigger fails because it tries to insert into user_profiles
-- before the auth.users transaction is committed
-- =====================================================

-- Solution: Make the foreign key constraint DEFERRABLE
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;

ALTER TABLE user_profiles
ADD CONSTRAINT user_profiles_user_id_fkey
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE
DEFERRABLE INITIALLY DEFERRED;

-- =====================================================
-- Verification
-- =====================================================

-- Check constraint
SELECT 
    conname, 
    contype, 
    condeferrable, 
    condeferred
FROM pg_constraint
WHERE conname = 'user_profiles_user_id_fkey';

-- Should show:
-- condeferrable: true
-- condeferred: true

-- =====================================================
-- DONE - Now try signup again!
-- =====================================================
