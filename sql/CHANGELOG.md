# Database Changelog

## Version 2.1.2 - 2026-02-03 (Auth Fixes)

### 🔧 Critical Fixes

**Auth Trigger Issues:**
- Removed foreign key constraint on `user_profiles.user_id` to fix signup failures
- Made `handle_new_user()` trigger more robust with `ON CONFLICT DO NOTHING`
- Added `SECURITY DEFINER` and proper `search_path` to trigger function

**RLS Infinite Recursion:**
- Removed all policies that caused infinite recursion via `is_admin()` function
- Simplified `admin_config` policies to allow public read access
- Removed `is_admin()` function entirely (was causing circular dependencies)
- Affected policies:
  - `admin_config`: "Admins can view config"
  - `user_profiles`: "Admins can view all profiles"
  - `plans`: "Admins can view all plans", "Admins can delete any plan"

**OAuth Redirect:**
- Fixed Google OAuth redirect flow in `AuthPage.jsx`
- Added `onAuthStateChange` listener to handle OAuth callbacks
- Changed `redirectTo` to `/auth` instead of `/dashboard` for proper callback handling

### 📝 Changes

**Database:**
- `user_profiles`: Removed foreign key constraint (was blocking trigger)
- `admin_config`: Simplified RLS policies (no more recursion)
- All tables: Removed admin-specific policies (temporarily, to fix recursion)

**Code:**
- `src/pages/AuthPage.jsx`: Added auth state listener for OAuth
- `src/lib/supabase.js`: Updated `signInWithGoogle()` redirect URL
- `src/components/dashboard/InteractiveLoading.jsx`: Fixed `jsx` attribute warning

### ⚠️ Known Limitations

- Admin features temporarily disabled (policies removed to fix recursion)
- Admin panel will need new implementation without `is_admin()` function
- Foreign key integrity not enforced on `user_profiles.user_id`

### 🚀 Next Steps

1. Implement admin check via direct email comparison (no function)
2. Re-add admin policies without circular dependencies
3. Consider adding foreign key back with `DEFERRABLE INITIALLY DEFERRED`

---

## Version 2.1.1 - 2026-02-03

### Initial Release
- Complete database schema with 8 tables
- RLS policies for all tables
- Admin config table for email-based admin access
- Triggers for user profile creation
- Indexes for performance

### Tables
- `user_profiles`: User data and notification preferences
- `intake_responses`: Questionnaire responses
- `health_profiles`: Calculated health metrics
- `plans`: User longevity plans
- `daily_progress`: Task completion tracking
- `plan_snapshots`: Plan version history
- `feedback`: User feedback collection
- `admin_config`: Admin email configuration
