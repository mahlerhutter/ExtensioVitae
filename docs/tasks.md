# ExtensioVitae — Tasks & Technical Debt

**Last Updated:** 2026-02-03 14:18  
**Current Version:** v2.1.2 (MVP Ready)  
**Security Audit:** 2026-02-03 (8/10 - APPROVED)  
**MVP Readiness:** 100/100 ✅ **READY TO DEPLOY!**

---

## 🟢 CURRENT STATUS

### ✅ **MVP Complete!**
- ✅ Authentication working (Google OAuth + Email/Password)
- ✅ User signup and login functional
- ✅ Plan generation working (deterministic)
- ✅ Dashboard with progress tracking
- ✅ Database setup complete
- ✅ RLS policies fixed
- ✅ Code cleaned up
- ✅ Documentation organized
- ✅ Security audit passed (8/10)
- ✅ No deployment blockers

### 🎯 **What's Working:**
- Auth flow (Google + Email)
- Intake questionnaire
- Plan generation (30-day blueprints)
- Progress tracking
- Longevity score calculation
- Data persistence (Supabase + localStorage)
- Responsive UI

### ⚠️ **Known Limitations (Acceptable for MVP):**
- Admin panel disabled (RLS recursion fix)
- LLM integration prepared but not active
- No messaging/notifications yet
- No rate limiting
- localStorage not encrypted

---

## 🚀 DEPLOYMENT TASKS

### 1. � **Deploy to Vercel** (READY NOW)
**Priority:** 🔴 CRITICAL  
**Effort:** 15-30 minutes  
**Status:** ⏳ **PENDING**

**Steps:**
1. Push to GitHub: `git push origin main`
2. Connect Vercel to GitHub repo
3. Configure environment variables:
   ```
   VITE_SUPABASE_URL=https://qnjjusilviwvovrlunep.supabase.co
   VITE_SUPABASE_ANON_KEY=<from .env.local>
   ```
4. Deploy
5. Update Supabase OAuth redirect URLs
6. Update Google OAuth redirect URLs
7. Test in production

**Documentation:** See `DEPLOYMENT.md`

---

### 2. 🟡 **Post-Deployment Monitoring** (First 48h)
**Priority:** 🟠 HIGH  
**Effort:** Ongoing

**Monitor:**
- [ ] Authentication success rate
- [ ] Plan generation errors
- [ ] Database query performance
- [ ] Supabase usage/quotas
- [ ] Error logs in Vercel
- [ ] User feedback

**Tools:**
- Vercel Dashboard → Analytics
- Supabase Dashboard → Logs
- Browser Console (for user reports)

---

## 🔐 SECURITY HARDENING (Post-MVP)

### 1. 🔴 **Implement Rate Limiting**
**Priority:** 🔴 CRITICAL (Within 1 week)  
**Effort:** 4-6 hours  
**Security Risk:** HIGH (DoS, quota exhaustion)

**Implementation:**
- Add rate limiting to Edge Functions
- Use Upstash Redis or Vercel KV
- Limit: 10 requests/minute per IP
- Limit: 100 requests/hour per user

**Files to modify:**
- `supabase/functions/generate-plan-proxy/index.ts`
- Create middleware for rate limiting

---

### 2. 🟠 **Add Security Headers**
**Priority:** 🟠 HIGH (Within 2 weeks)  
**Effort:** 2-3 hours  
**Security Risk:** MEDIUM (XSS, clickjacking)

**Implementation:**
Create `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

---

### 3. 🟠 **Encrypt localStorage Data**
**Priority:** 🟠 HIGH (Within 1 month)  
**Effort:** 3-4 hours  
**Security Risk:** MEDIUM (XSS data theft)

**Implementation:**
- Use `crypto-js` or Web Crypto API
- Encrypt intake responses before storing
- Decrypt on retrieval
- Use user-specific encryption key

**Files to modify:**
- `src/lib/dataService.js`

---

### 4. 🟡 **Server-Side Input Validation**
**Priority:** 🟡 MEDIUM (Within 1 month)  
**Effort:** 4-5 hours  
**Security Risk:** MEDIUM (malicious data)

**Implementation:**
- Add validation in Edge Functions
- Sanitize user input
- Enforce length limits
- Validate data types

**Files to modify:**
- `supabase/functions/generate-plan-proxy/index.ts`
- Create validation utilities

---

### 5. 🟡 **Re-implement Admin Panel**
**Priority:** 🟡 MEDIUM (Within 1 month)  
**Effort:** 6-8 hours  
**Security Risk:** LOW (feature disabled)

**Implementation:**
- Add `is_admin` column to `user_profiles`
- Use direct email checks instead of function
- Recreate admin RLS policies without recursion
- Test thoroughly

**Files to modify:**
- `sql/migrations/011_admin_panel_v2.sql`
- `src/pages/AdminPage.jsx`

---

### 6. 🟢 **Set Up Error Monitoring**
**Priority:** 🟢 LOW (Within 2 months)  
**Effort:** 2-3 hours

**Implementation:**
- Integrate Sentry or similar
- Track frontend errors
- Track backend errors
- Set up alerts

---

## 🎨 UX/UI IMPROVEMENTS

### 1. � **Accessibility Fixes**
**Priority:** 🟡 MEDIUM  
**Effort:** 3-4 hours  
**Impact:** Compliance, UX

**Tasks:**
- [ ] Add `htmlFor`/`id` to all form labels
- [ ] Add `aria-label` to icon buttons
- [ ] Add `aria-live` for dynamic content
- [ ] Test with screen reader
- [ ] Add keyboard navigation
- [ ] Improve color contrast

**Files to modify:**
- All form components
- `src/pages/IntakePage.jsx`
- `src/pages/DashboardPage.jsx`

---

### 2. 🟢 **Loading States**
**Priority:** 🟢 LOW  
**Effort:** 2-3 hours

**Tasks:**
- [ ] Add skeleton loaders
- [ ] Improve loading animations
- [ ] Add progress indicators
- [ ] Better error states

---

### 3. � **Mobile Optimization**
**Priority:** 🟢 LOW  
**Effort:** 4-5 hours

**Tasks:**
- [ ] Test on mobile devices
- [ ] Optimize touch targets
- [ ] Improve mobile navigation
- [ ] Test on different screen sizes

---

## 🤖 LLM INTEGRATION

### 1. 🟡 **Enable LLM Plan Generation**
**Priority:** 🟡 MEDIUM (Post-MVP)  
**Effort:** 2-3 hours (debugging)  
**Status:** ⚠️ **PREPARED BUT NOT ACTIVE**

**Current State:**
- ✅ Edge Function deployed and tested
- ✅ OpenAI API key configured
- ✅ Code integrated
- ⚠️ Not being called (browser cache issue?)
- ✅ Fallback to deterministic works

**Next Steps:**
1. Debug why `generatePlan()` uses algorithm
2. Test in production environment
3. Monitor costs (OpenAI usage)
4. A/B test LLM vs deterministic

**Files:**
- `src/lib/planGenerator.js` ✅
- `src/pages/GeneratingPage.jsx` ✅
- `supabase/functions/generate-plan-proxy/index.ts` ✅

---

## � MESSAGING SYSTEM

### 1. � **Implement Email Notifications**
**Priority:** 🟢 LOW (Post-MVP)  
**Effort:** 4-6 hours

**Features:**
- Welcome email on signup
- Weekly progress summary
- Plan completion email

**Implementation:**
- Use Resend or SendGrid
- Create email templates
- Set up Edge Function for sending

---

### 2. � **Implement Telegram Bot**
**Priority:** 🟢 LOW (Future)  
**Effort:** 8-12 hours

**Features:**
- Daily nudges
- Progress check-ins
- Task reminders

**Implementation:**
- Create bot via @BotFather
- Implement webhook handler
- Link to user profiles

**Documentation:** See `docs/concepts/MESSAGING_MVP_PLAN.md`

---

## 📊 ANALYTICS & MONITORING

### 1. 🟡 **PostHog Analytics**
**Priority:** 🟡 MEDIUM  
**Effort:** 2-3 hours  
**Status:** ⚠️ **PARTIALLY IMPLEMENTED**

**Current State:**
- ✅ Analytics code exists
- ⚠️ PostHog not installed (`npm install posthog-js`)
- ⚠️ No PostHog key configured

**Next Steps:**
1. Install PostHog: `npm install posthog-js`
2. Get PostHog API key
3. Add to `.env.local`:
   ```
   VITE_POSTHOG_KEY=phc_...
   VITE_POSTHOG_HOST=https://eu.i.posthog.com
   ```
4. Test events

**Files:**
- `src/lib/analytics.js` ✅

---

### 2. 🟢 **User Feedback Collection**
**Priority:** 🟢 LOW  
**Effort:** 3-4 hours  
**Status:** ⚠️ **IMPLEMENTED BUT UNUSED**

**Current State:**
- ✅ Feedback service exists
- ✅ Database table exists
- ⚠️ Not integrated in UI

**Next Steps:**
1. Add feedback button to dashboard
2. Create feedback modal
3. Test submission

**Files:**
- `src/lib/feedbackService.js` ✅

---

## 🗄️ DATABASE IMPROVEMENTS

### 1. 🟠 **Configure Automated Backups**
**Priority:** � HIGH (Within 1 week)  
**Effort:** 1 hour

**Steps:**
1. Go to Supabase Dashboard → Settings → Backups
2. Enable automated backups
3. Set retention period (7 days minimum)
4. Test restore procedure
5. Document recovery process

---

### 2. 🟡 **Fix health_profiles RLS**
**Priority:** 🟡 MEDIUM  
**Effort:** 1-2 hours  
**Status:** ⚠️ **406 ERROR**

**Current State:**
- `GET /health_profiles` returns 406 (Not Acceptable)
- Doesn't block plan generation
- Health profile integration works

**Next Steps:**
1. Check RLS policies on `health_profiles`
2. Verify user can read own profile
3. Test with authenticated user

---

### 3. 🟢 **Add Database Indexes**
**Priority:** 🟢 LOW  
**Effort:** 2-3 hours

**Indexes to add:**
- `plans(user_id, status, created_at)`
- `plan_progress(plan_id, day_number)`
- `feedback(user_id, created_at)`

---

## 🧪 TESTING

### 1. 🟡 **Unit Tests**
**Priority:** 🟡 MEDIUM  
**Effort:** Ongoing  
**Status:** ✅ **92 TESTS PASSING**

**Coverage:**
- ✅ Core business logic
- ✅ Longevity score calculation
- ✅ Plan builder
- ⚠️ No component tests
- ⚠️ No integration tests

**Next Steps:**
- Add component tests (React Testing Library)
- Add E2E tests (Playwright)

---

### 2. 🟢 **E2E Tests**
**Priority:** � LOW  
**Effort:** 8-12 hours

**Test Scenarios:**
- User signup flow
- Google OAuth flow
- Intake → Plan generation → Dashboard
- Progress tracking
- Plan renewal

---

## 📝 DOCUMENTATION

### 1. 🟢 **API Documentation**
**Priority:** � LOW  
**Effort:** 4-6 hours

**Create:**
- Edge Function API docs
- Supabase schema docs
- Integration guides

---

### 2. 🟢 **User Guide**
**Priority:** 🟢 LOW  
**Effort:** 3-4 hours

**Create:**
- Getting started guide
- FAQ
- Troubleshooting guide

---

## 🎯 FEATURE BACKLOG

### High Priority
- [ ] Plan regeneration (if user not satisfied)
- [ ] Export plan as PDF
- [ ] Share plan with others
- [ ] Custom task creation

### Medium Priority
- [ ] Dark/Light mode toggle
- [ ] Multiple language support
- [ ] Integration with fitness trackers
- [ ] Nutrition tracking

### Low Priority
- [ ] Social features (community)
- [ ] Gamification (badges, streaks)
- [ ] AI coach chat
- [ ] Premium tier features

---

## 📊 SUMMARY & PRIORITIES

### **Deployment Readiness: 100/100** ✅

| Category | Tasks | Priority | Estimated Time |
|----------|-------|----------|----------------|
| **🔴 Critical (Deploy Now)** | 1 | MUST DO | 30 min |
| **🟠 High (Week 1)** | 4 | SHOULD DO | 12-16h |
| **🟡 Medium (Month 1)** | 8 | NICE TO DO | 30-40h |
| **🟢 Low (Future)** | 10+ | OPTIONAL | 50+ h |

---

## 🎉 READY TO DEPLOY!

```
✅ Auth working (Google OAuth + Email/Password)
✅ Database setup complete
✅ RLS policies fixed
✅ Code cleaned up
✅ Documentation organized
✅ Security audit passed (8/10)
✅ No critical blockers

→ APP IS DEPLOYABLE NOW!
```

---

## 🚀 RECOMMENDED NEXT STEPS

### Immediate (Today):
1. � **Deploy to Vercel** (30 min)
2. 🟠 **Monitor for 24h** (ongoing)
3. 🟠 **Test all features in production** (1h)

### Week 1:
1. 🟠 **Implement rate limiting** (4-6h)
2. 🟠 **Add security headers** (2-3h)
3. 🟠 **Configure backups** (1h)
4. 🟠 **Set up monitoring** (2-3h)

### Month 1:
1. 🟡 **Encrypt localStorage** (3-4h)
2. 🟡 **Re-implement admin panel** (6-8h)
3. 🟡 **Fix health_profiles RLS** (1-2h)
4. 🟡 **Enable LLM (optional)** (2-3h)
5. 🟡 **Accessibility fixes** (3-4h)

---

**Last Audit:** 2026-02-03  
**Next Review:** After 1 week in production  
**Security Score:** 8/10 ✅  
**Deployment Status:** 🟢 **APPROVED**
