# Database Error Fix: Auto-Create User Profile

## Problem
**Error:** "Database error saving new user"  
**Root Cause:** When a new user signs up, the system tries to create a `user_profiles` entry, but the RLS policies prevent this because `auth.uid()` is not yet available during the signup process.

## Solution
Add a database trigger that automatically creates a `user_profiles` entry when a new user is created in `auth.users`.

---

## How to Apply the Fix

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project: **ExtensioVitae**
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Run the Migration
1. Click **New Query**
2. Copy the entire contents of `sql/migrations/006_auto_create_user_profile.sql`
3. Paste into the SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 3: Verify the Fix
1. Go back to http://localhost:3100/auth?mode=signup
2. Try creating a new account with a fresh email
3. The signup should now succeed without the "Database error" message

---

## What the Migration Does

1. **Creates a trigger function** (`handle_new_user()`) that:
   - Automatically inserts a new row into `user_profiles` when a user signs up
   - Uses the new user's `id` and `email` from `auth.users`
   - Runs with `SECURITY DEFINER` to bypass RLS policies

2. **Creates a trigger** (`on_auth_user_created`) that:
   - Fires AFTER a new user is inserted into `auth.users`
   - Calls the `handle_new_user()` function

3. **Grants permissions** to ensure the trigger can execute properly

---

## Alternative: Manual Fix (If Trigger Doesn't Work)

If the trigger approach doesn't work due to Supabase limitations, you can modify the signup handler in your frontend:

### Option A: Use Service Role Key (Backend Only)
Create a backend endpoint that uses the service role key to create the user profile.

### Option B: Modify RLS Policies
Change the `user_profiles_insert` policy to allow inserts during signup:

```sql
DROP POLICY IF EXISTS "user_profiles_insert" ON user_profiles;
CREATE POLICY "user_profiles_insert" ON user_profiles
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        auth.uid() IS NULL  -- Allow during signup
    );
```

**⚠️ Warning:** This is less secure and should only be used temporarily.

---

## Testing

After applying the migration, test with:

```bash
# Test email (use a unique email each time)
test-user-$(date +%s)@example.com

# Password
Password123!
```

Expected result: User should be created successfully and redirected to the dashboard.

---

## Rollback (If Needed)

If you need to remove the trigger:

```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
```
