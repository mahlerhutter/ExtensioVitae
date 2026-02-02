# ExtensioVitae - Product Ideas & Feature Backlog

**Last Updated:** 2026-02-02  
**Status:** Living Document - Continuously Updated

This document captures feature ideas, UX improvements, and product enhancements for ExtensioVitae. Ideas are organized by category and priority.

---

## 🎯 High-Impact Features (Next Quarter)

### 1. AI-Powered Deep Questionnaire
**Concept:** A comprehensive, AI-analyzed questionnaire for better user understanding  
**Why:** Current intake is basic - we can gather much richer data for personalization  
**Implementation:**
- Extended questionnaire with open-ended questions
- AI analysis (GPT-4/Claude) to extract insights
- Generate personalized recommendations based on analysis
- Store insights in user profile for future plan refinement

**Effort:** 2-3 weeks  
**Impact:** High - Better personalization, higher user satisfaction

---

### 2. Interactive Plan Generation Experience
**Current State:** "Loading your plan..." is static and boring  
**Proposed Enhancement:**
- Show real-time progress: "Analyzing your health profile..."
- Display fun facts about longevity while loading
- Animate task selection process
- Show "Building Day 1... Day 2..." progression
- Add micro-animations and transitions

**Effort:** 1 week  
**Impact:** Medium - Better UX, reduces perceived wait time

---

### 3. Enhanced Daily Plan View
**Current State:** Users see "Your 30 Days" but can't preview individual days  
**Proposed Enhancement:**
- Calendar-style view showing all 30 days
- Click on any day to preview tasks
- Show current day number (e.g., "Day 12 of 30")
- Visual progress indicator
- Highlight completed vs. upcoming days

**Effort:** 1-2 weeks  
**Impact:** High - Better overview, increased engagement

---

## 🏆 Gamification & Motivation

### 4. Completion Badges & Visual Rewards
**Concept:** Generate personalized images and badges after task/plan completion  
**Features:**
- Daily completion badges
- Weekly milestone achievements
- 30-day completion certificate
- Shareable social media graphics
- "Anti-badge badge" for users who don't care about badges (meta-achievement)

**Effort:** 2 weeks  
**Impact:** Medium-High - Increases motivation and social sharing

---

### 5. "Letter to Myself in 30 Days"
**Concept:** Users write a letter to their future self at the start of the plan  
**Features:**
- Prompt users to write goals, fears, hopes
- Store securely and reveal on Day 30
- Option to share with community (anonymously)
- Reflection prompts comparing Day 1 vs. Day 30

**Effort:** 1 week  
**Impact:** High - Emotional connection, reflection, retention

---

### 6. "Life in Weeks" Visualization
**Concept:** Visualize user's life expectancy in weeks (inspired by Wait But Why)  
**Features:**
- Grid showing 4,000+ weeks (average lifespan)
- Highlight weeks lived vs. weeks remaining
- Show impact of longevity interventions on remaining weeks
- Sobering but motivating visualization

**Effort:** 1 week  
**Impact:** High - Powerful motivator for lifestyle change

---

## 📊 Analytics & Scoring

### 7. Enhanced Longevity Score
**Current State:** Basic score calculation exists  
**Proposed Enhancements:**
- Real-time score updates as user completes tasks
- Score breakdown by category (sleep, nutrition, exercise, stress)
- Comparison to population average
- Projected lifespan extension based on adherence
- Historical score tracking over multiple plans

**Effort:** 1-2 weeks  
**Impact:** High - Quantifiable progress, motivation

---

## 🔧 Technical Improvements

### 8. Weekend-Aware Task Scheduling
**Current State:** Tasks are scheduled uniformly across all days  
**Proposed Enhancement:**
- Detect weekends (Saturday/Sunday)
- Adjust task difficulty/time requirements
- Offer "weekend bonus challenges" or "recovery days"
- User preference: "I work weekends" vs. "I have weekends off"

**Effort:** 3-5 days  
**Impact:** Medium - Better real-world alignment

---

### 9. Admin Dashboard Access
**Current State:** Admin link is always visible  
**Proposed Enhancement:**
- Show admin link only for admin users
- Add role-based access control (RBAC)
- Admin badge in user profile

**Effort:** 1 day  
**Impact:** Low - Security & UX polish

---

### 10. GitHub Integration
**Concept:** Track longevity tasks like code commits  
**Features:**
- Daily task completion = GitHub-style contribution graph
- Streak tracking
- "Merge" completed plans into user's longevity history
- Export data as JSON/CSV for personal tracking

**Effort:** 1-2 weeks  
**Impact:** Medium - Appeals to developer audience, data ownership

---

## 💬 Communication & Engagement

### 11. WhatsApp Nudge System (Partially Implemented)
**Current State:** Database schema exists, approval flow documented, but not implemented  
**Remaining Work:**
- Build WhatsApp Business API integration
- Implement daily nudge scheduling
- Allow users to set preferred nudge time
- Handle opt-in/opt-out (STOP command)
- Track engagement metrics

**Effort:** 2-3 weeks  
**Impact:** High - Core retention feature

**Reference:** `/docs/06-WHATSAPP-FLOW.md`

---

## 🐛 Bug Fixes & Polish

### 12. Feedback Submission Error ✅ FIX AVAILABLE
**Issue:** Popup shows "Fehler beim Senden des Feedbacks. Bitte versuche es später erneut."  
**Root Cause:** RLS policy on `feedback` table tries to access `auth.users`, causing "permission denied" error  
**Status:** 🔧 **Fix Ready - Awaiting Migration**  
**Priority:** High  
**Effort:** 5 minutes (run SQL migration)

**Solution:**
- Remove problematic admin policies that query `auth.users`
- Keep user-scoped policies (insert own, view own)
- Admins use service role for full access

**Files Created:**
- `sql/migrations/007_fix_feedback_rls.sql` - Migration to fix RLS policies
- `docs/fixes/FEEDBACK_ERROR_FIX.md` - Detailed fix documentation

**Next Steps:**
1. Run migration in Supabase SQL Editor
2. Test feedback submission
3. Verify no permission errors

---

## 📋 Implementation Priority Matrix

| Feature | Impact | Effort | Priority | Status |
|---------|--------|--------|----------|--------|
| AI Questionnaire | High | High | P1 | 💡 Idea |
| Enhanced Daily View | High | Medium | P1 | 💡 Idea |
| Letter to Future Self | High | Low | P1 | 💡 Idea |
| Life in Weeks | High | Low | P1 | 💡 Idea |
| Longevity Score v2 | High | Medium | P2 | 💡 Idea |
| Completion Badges | Medium | Medium | P2 | 💡 Idea |
| Interactive Loading | Medium | Low | P2 | 💡 Idea |
| WhatsApp Integration | High | High | P0 | 🚧 In Progress |
| Weekend Scheduling | Medium | Low | P3 | 💡 Idea |
| GitHub Integration | Medium | Medium | P3 | 💡 Idea |
| Admin Link Fix | Low | Low | P3 | 💡 Idea |
| Feedback Bug Fix | Medium | Low | P2 | 🐛 Bug |

**Legend:**
- **P0:** Critical - Core functionality
- **P1:** High Priority - Next quarter
- **P2:** Medium Priority - This year
- **P3:** Low Priority - Nice to have

---

## 🎨 Design Principles

When implementing these features, follow these principles:

1. **Science-Backed:** Every feature should support evidence-based longevity practices
2. **Minimal Friction:** Don't add complexity that reduces user adherence
3. **Emotional Connection:** Features should create meaning, not just gamification
4. **Data Ownership:** Users should own and export their data
5. **Privacy First:** Health data is sensitive - handle with care

---

## 📝 How to Use This Document

1. **Add Ideas:** Append new ideas to the appropriate section
2. **Vote:** Team members can add 👍 reactions to ideas they support
3. **Promote:** Move ideas from backlog to "High-Impact" when prioritized
4. **Archive:** Move completed features to `/docs/CHANGELOG.md`

---

## 🔗 Related Documents

- [Product Roadmap](/docs/strategy/roadmap_and_technical_debt.md)
- [Tasks & Bugs](/docs/tasks.md)
- [WhatsApp Flow](/docs/06-WHATSAPP-FLOW.md)
- [System Architecture](/docs/ARCHITECTURE.md)