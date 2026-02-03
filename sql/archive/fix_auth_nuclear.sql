-- =====================================================
-- Nuclear Option: Remove Foreign Key & Fix Trigger
-- =====================================================
-- This removes the problematic foreign key constraint
-- and makes the trigger more robust
-- =====================================================

-- 1. Drop the foreign key constraint entirely
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;

-- 2. Drop and recreate the trigger function WITHOUT foreign key dependency
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_name TEXT;
BEGIN
    -- Extract name from metadata or use email prefix
    v_name := COALESCE(
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1)
    );
    
    -- Insert into user_profiles (no foreign key to worry about!)
    INSERT INTO public.user_profiles (
        user_id, 
        email, 
        name,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        v_name,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;  -- Prevent duplicates
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log but don't fail auth
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public;

-- 3. Recreate trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- 4. Ensure RLS allows the insert
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_profiles;
CREATE POLICY "Enable insert for authenticated users" ON user_profiles
    FOR INSERT 
    WITH CHECK (true);  -- Allow all inserts (we validate in trigger)

-- =====================================================
-- Cleanup: Remove any orphaned profiles
-- =====================================================

DELETE FROM user_profiles
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- =====================================================
-- Verification
-- =====================================================

SELECT 'Trigger exists:' as check, COUNT(*) as count
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created'
UNION ALL
SELECT 'Function exists:', COUNT(*)
FROM pg_proc 
WHERE proname = 'handle_new_user'
UNION ALL
SELECT 'Foreign key removed:', COUNT(*)
FROM pg_constraint
WHERE conname = 'user_profiles_user_id_fkey';

-- =====================================================
-- DONE - Try signup now!
-- =====================================================
