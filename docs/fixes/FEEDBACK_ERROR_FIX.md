# Feedback Submission Error - Fix Documentation

**Date:** 2026-02-02  
**Error:** "Fehler beim Senden des Feedbacks. Bitte versuche es später erneut."  
**Status:** 🔧 **FIX AVAILABLE**

---

## 🐛 Problem

**Symptom:** When users try to submit feedback (initial or general), they get an error popup.

**Root Cause:** Database permission error (RLS policy issue)

**Technical Details:**
```
PostgreSQL Error Code: 42501
Message: "permission denied for table users"
```

**Why This Happens:**
The feedback table has admin policies that try to query the `auth.users` table:

```sql
CREATE POLICY "Admins can view all feedback"
  ON feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users  -- ❌ Regular users can't access this!
      WHERE auth.users.id = auth.uid()
    )
  );
```

When a regular user tries to insert feedback, Supabase evaluates **ALL** policies on the table, including the admin policies. Since regular users don't have SELECT permission on `auth.users`, the query fails with a permission error.

---

## ✅ Solution

Remove the problematic admin policies and rely on service role access for admin operations.

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project: **ExtensioVitae**
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Run the Migration
1. Click **New Query**
2. Copy the entire contents of `sql/migrations/007_fix_feedback_rls.sql`
3. Paste into the SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 3: Verify the Fix
1. Go back to http://localhost:3100/dashboard
2. Wait for the initial feedback modal to appear (or click the floating feedback button)
3. Fill out the feedback form
4. Click "Feedback senden"
5. **Expected Result:** Feedback submits successfully, no error popup

---

## 🔍 What the Migration Does

1. **Removes Problematic Policies:**
   - `"Admins can view all feedback"`
   - `"Admins can update feedback"`

2. **Keeps User-Scoped Policies:**
   - `"Users can insert own feedback"` ✅
   - `"Users can view own feedback"` ✅

3. **Admin Access Strategy:**
   - Admins should use the **service role key** to access all feedback
   - Service role bypasses RLS entirely (more secure)
   - Admin queries should be made server-side or via Supabase dashboard

---

## 🧪 Testing

After applying the migration, test with:

1. **Initial Feedback Modal:**
   - Refresh dashboard
   - Wait 3 seconds for modal to appear
   - Rate the plan (1-5 stars)
   - Add comments
   - Click "Feedback senden"
   - **Expected:** Success message, modal closes

2. **General Feedback (Floating Button):**
   - Click floating feedback button (bottom-right)
   - Enter feedback text
   - Click "Feedback senden"
   - **Expected:** Success message, panel closes

3. **Console Logs:**
   - Open browser console (F12)
   - Submit feedback
   - **Expected:** `[FeedbackService] Feedback submitted: <uuid>`
   - **No errors** about "permission denied"

---

## 📊 Impact

**Before:**
- ❌ Users cannot submit feedback
- ❌ Error: "permission denied for table users"
- ❌ Poor user experience

**After:**
- ✅ Users can submit feedback successfully
- ✅ No permission errors
- ✅ Feedback stored in database
- ✅ Admins can still access all feedback via service role

---

## 🔐 Admin Access

### How Admins Should Access Feedback:

**Option 1: Supabase Dashboard (Recommended)**
1. Go to Supabase Dashboard
2. Navigate to **Table Editor** → `feedback`
3. View all feedback records
4. Filter by `reviewed = false` for unreviewed feedback

**Option 2: Server-Side API (Future)**
Create a backend endpoint that uses the service role key:

```javascript
// server/api/admin/feedback.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Service role bypasses RLS
)

export async function getAllFeedback() {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false })
  
  return data
}
```

---

## 🔗 Related Files

- **Migration:** `sql/migrations/007_fix_feedback_rls.sql`
- **Feedback Service:** `src/lib/feedbackService.js`
- **Dashboard:** `src/pages/DashboardPage.jsx` (line 674)
- **Original Migration:** `sql/migrations/003_create_feedback_table.sql`

---

## 📝 Rollback (If Needed)

If you need to revert this change:

```sql
-- Restore admin policies (NOT RECOMMENDED - will cause the same error)
CREATE POLICY "Admins can view all feedback"
  ON feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
    )
  );
```

**Note:** This will bring back the original error. Better to use service role for admin access.

---

## ✅ Verification Checklist

- [ ] Migration executed successfully in Supabase
- [ ] Initial feedback modal submits without errors
- [ ] General feedback panel submits without errors
- [ ] Browser console shows no permission errors
- [ ] Feedback appears in Supabase `feedback` table
- [ ] Admin can view feedback via Supabase dashboard

---

**Resolution Status:** ⏳ Awaiting migration execution
