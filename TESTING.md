# Pre-Deployment Testing Plan

**Date:** 2026-02-03  
**Version:** v2.1.2  
**Status:** Testing before deployment

---

## 🎯 Testing Objectives

1. ✅ **LLM Plan Generation** - Verify Edge Function works
2. ✅ **Messaging System** - Test notification preferences
3. ✅ **End-to-End Flow** - Complete user journey

---

## 1️⃣ LLM Plan Generation Test

### Current Status
- ✅ Edge Function exists: `supabase/functions/generate-plan-proxy/index.ts`
- ✅ Frontend integration ready: `src/lib/llmPlanGenerator.js`
- ⚠️ **NOT DEPLOYED** - Edge Function needs to be deployed to Supabase

### Prerequisites
- OpenAI API Key (for testing)
- Supabase CLI installed
- Edge Function deployed

### Test Steps

#### A. Deploy Edge Function

```bash
# 1. Install Supabase CLI (if not installed)
brew install supabase/tap/supabase

# 2. Login to Supabase
supabase login

# 3. Link to your project
supabase link --project-ref qnjjusilviwvovrlunep

# 4. Set OpenAI API Key as secret
supabase secrets set OPENAI_API_KEY=your_openai_key_here

# 5. Deploy the Edge Function
supabase functions deploy generate-plan-proxy
```

#### B. Test Edge Function

```bash
# Test with curl
curl -X POST \
  'https://qnjjusilviwvovrlunep.supabase.co/functions/v1/generate-plan-proxy' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "intakeData": {
      "age": 35,
      "goals": ["longevity", "energy"],
      "time_available": 30
    },
    "provider": "openai"
  }'
```

#### C. Test in App

1. Go to `/intake`
2. Fill out questionnaire
3. Submit
4. Check console for LLM generation logs
5. Verify plan is generated

### Expected Results
- ✅ Edge Function deploys successfully
- ✅ API call returns valid JSON plan
- ✅ Plan appears in dashboard
- ✅ No CORS errors

### Fallback
If LLM fails, app should fall back to deterministic `planBuilder.js` ✅

---

## 2️⃣ Messaging System Test

### Current Status
- ✅ Database schema supports notification preferences
- ✅ Migration `009_add_notification_prefs.sql` exists
- ⚠️ **NOT IMPLEMENTED** - No Telegram bot or email sending yet

### What's Already There

**Database:**
```sql
-- user_profiles table has:
notification_preferences JSONB DEFAULT '{
  "email": true, 
  "telegram": false, 
  "sms": false
}'
telegram_connected BOOLEAN DEFAULT false
telegram_chat_id TEXT
```

**Frontend:**
- User can see notification preferences in profile (if implemented)
- No actual sending mechanism yet

### Implementation Options

#### Option A: MVP - Email Only (Fastest)
**Time:** 1-2 hours  
**Complexity:** Low

1. Use Supabase Auth emails (already configured)
2. Add "Weekly Summary" email template
3. Create Edge Function to send emails via Resend

#### Option B: Full Messaging (Telegram + Email)
**Time:** 4-6 hours  
**Complexity:** Medium

1. Create Telegram Bot via @BotFather
2. Implement bot webhook handler
3. Add Telegram sending logic
4. Implement email templates
5. Create notification router Edge Function

#### Option C: Skip for MVP
**Time:** 0 hours  
**Rationale:** Focus on core plan generation first

### Recommendation: **Option C - Skip for MVP**

**Why:**
- Core value is the plan, not notifications
- Can add messaging post-launch based on user feedback
- Reduces deployment complexity
- Email notifications can be added later via Supabase triggers

**What to do instead:**
- ✅ Keep database schema (already done)
- ✅ Add UI for notification preferences (future-ready)
- ✅ Document messaging plan (already done in `docs/concepts/`)
- ⏭️ Implement after MVP launch

---

## 3️⃣ End-to-End Flow Test

### Test Scenario: New User Journey

**Steps:**
1. ✅ Visit landing page
2. ✅ Click "Get Started"
3. ✅ Sign up with Google OAuth
4. ✅ Complete intake questionnaire
5. ✅ Wait for plan generation
6. ✅ View dashboard with plan
7. ✅ Mark tasks as complete
8. ✅ Check progress tracking
9. ✅ View longevity score

### Checklist

**Authentication:**
- [ ] Google OAuth works
- [ ] Email/Password signup works
- [ ] User profile created in database
- [ ] Redirect to dashboard works

**Intake:**
- [ ] All form fields work
- [ ] Validation works
- [ ] Data saves to `intake_responses`
- [ ] Redirect to generating page

**Plan Generation:**
- [ ] Loading animation shows
- [ ] Plan generates (deterministic or LLM)
- [ ] Plan saves to `plans` table
- [ ] Redirect to dashboard

**Dashboard:**
- [ ] Plan displays correctly
- [ ] Tasks are interactive
- [ ] Progress tracking works
- [ ] Longevity score displays
- [ ] No console errors

**Data Persistence:**
- [ ] Refresh page - data persists
- [ ] Logout/Login - data persists
- [ ] Check Supabase - data in tables

---

## 🧪 Testing Checklist

### Before Testing
- [ ] Local dev server running (`npm run dev`)
- [ ] Supabase database initialized
- [ ] `.env.local` configured
- [ ] Google OAuth configured

### Core Features
- [ ] Authentication (Google + Email)
- [ ] Intake form submission
- [ ] Plan generation (deterministic)
- [ ] Dashboard display
- [ ] Progress tracking
- [ ] Data persistence

### Optional Features (Can Skip for MVP)
- [ ] LLM plan generation (requires Edge Function deployment)
- [ ] Messaging/Notifications (not implemented yet)
- [ ] Admin panel (temporarily disabled)

### Browser Testing
- [ ] Chrome/Edge (primary)
- [ ] Safari (macOS)
- [ ] Firefox (optional)
- [ ] Mobile responsive (optional)

---

## 🚀 Deployment Decision Matrix

### ✅ Ready to Deploy If:
- [x] Auth works
- [x] Intake works
- [x] Plan generation works (deterministic)
- [x] Dashboard works
- [x] No critical errors

### ⏸️ Hold Deployment If:
- [ ] Auth completely broken
- [ ] Database errors on every request
- [ ] App crashes on load
- [ ] Data loss issues

### 🔄 Can Deploy and Fix Later:
- [ ] LLM not working (fallback exists)
- [ ] Messaging not implemented (future feature)
- [ ] Admin panel disabled (known issue)
- [ ] Minor UI bugs
- [ ] Performance optimizations

---

## 📝 Test Results

### Authentication
- Status: ✅ **WORKING**
- Notes: Google OAuth and email signup both functional

### Plan Generation
- Status: ⚠️ **DETERMINISTIC ONLY**
- Notes: LLM Edge Function not deployed yet
- Fallback: ✅ Works with `planBuilder.js`

### Messaging
- Status: ⏭️ **NOT IMPLEMENTED**
- Notes: Database schema ready, implementation deferred
- Impact: None - not critical for MVP

### Overall Status
**🟢 READY TO DEPLOY** (with deterministic plans)

---

## 🎯 Recommendation

### Deploy Now With:
1. ✅ Deterministic plan generation
2. ✅ Full auth flow
3. ✅ Dashboard and progress tracking
4. ✅ Database persistence

### Add Post-Launch:
1. 🔄 LLM plan generation (deploy Edge Function)
2. 🔄 Messaging system (Telegram + Email)
3. 🔄 Admin panel (re-implement without recursion)
4. 🔄 Performance optimizations

---

## 🚀 Next Steps

**If you want to test LLM:**
1. Deploy Edge Function (see Section 1A)
2. Test with curl (see Section 1B)
3. Test in app (see Section 1C)

**If you want to skip LLM for now:**
1. ✅ Proceed with deployment
2. ✅ App works with deterministic plans
3. 🔄 Add LLM later

**If you want to implement messaging:**
1. Choose Option A (Email only) or B (Full)
2. Follow implementation in `docs/concepts/MESSAGING_MVP_PLAN.md`
3. Estimated time: 1-6 hours

---

**What would you like to do?**
- A) Deploy now (deterministic plans, no messaging)
- B) Test LLM first (deploy Edge Function)
- C) Implement messaging first (1-6 hours)
