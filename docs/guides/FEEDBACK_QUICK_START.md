# Feedback Loop - Quick Start Guide

## 🎯 What You Need to Do Right Now

### 1. Run the Database Migration (REQUIRED)

The feedback system is fully coded but needs the database table to be created.

**Option A: Via Supabase Dashboard (Recommended)**
1. Open https://wiootadltjzpczozuhfl.supabase.co
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy-paste the entire contents of: `sql/migrations/003_create_feedback_table.sql`
5. Click **Run**
6. You should see: "Success. No rows returned"

**Option B: Via File**
```bash
# If you have Supabase CLI installed
supabase db push
```

### 2. Test It Out!

Your dev server is already running at `http://localhost:3101`

**Test Flow:**
1. **Go to** http://localhost:3101/intake
2. **Fill out** the intake form and generate a plan
3. **Wait 3 seconds** - Initial Feedback Modal should appear! ⭐
4. **Click** the floating "Feedback" button (bottom-right) 💬
5. **Try** submitting different types of feedback
6. **Go to** http://localhost:3101/admin
7. **Click** the "💬 Feedback" tab
8. **See** your feedback appear in the admin dashboard!

---

## 🎨 What the Feedback System Looks Like

### User Experience

```
┌─────────────────────────────────────────┐
│  Dashboard - After Plan Generation      │
│                                          │
│  [Your 30-Day Plan]                      │
│  ┌────────────────────────────────┐     │
│  │ ✨ Wie findest du deinen Plan? │     │
│  │                                 │     │
│  │ Gesamtbewertung *              │     │
│  │ ⭐ ⭐ ⭐ ⭐ ⭐                    │     │
│  │                                 │     │
│  │ Was gefällt dir am besten?     │     │
│  │ [Text area...]                 │     │
│  │                                 │     │
│  │ Was würdest du ändern?         │     │
│  │ [Text area...]                 │     │
│  │                                 │     │
│  │ [Feedback senden] [Überspringen]│     │
│  └────────────────────────────────┘     │
│                                          │
│                    [💬 Feedback] ←──────┤ Floating Button
└─────────────────────────────────────────┘
```

### Admin Dashboard

```
┌─────────────────────────────────────────────────────────┐
│  Admin Dashboard > 💬 Feedback Tab                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                  │
│  │  42  │ │ 4.2  │ │  12  │ │  30  │                  │
│  │Total │ │ Avg  │ │Unrev.│ │Review│                  │
│  └──────┘ └──────┘ └──────┘ └──────┘                  │
│                                                          │
│  Feedback by Type                                        │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                  │
│  │ 15 │ │ 10 │ │  8 │ │  5 │ │  4 │                  │
│  │Init│ │Gen │ │Micr│ │Bug │ │Feat│                  │
│  └────┘ └────┘ └────┘ └────┘ └────┘                  │
│                                                          │
│  [All] [Unreviewed (12)] [Initial] [Bug] [Feature]      │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ ⭐ user@example.com  [initial] [New]           │    │
│  │ 02.02.2026, 13:45                              │    │
│  │ ⭐⭐⭐⭐⭐                                        │    │
│  │                                                 │    │
│  │ 👍 What they like:                             │    │
│  │ "Die personalisierten Empfehlungen sind super!"│    │
│  │                                                 │    │
│  │ 💡 What to improve:                            │    │
│  │ "Mehr Flexibilität bei den Zeiten"            │    │
│  │                                                 │    │
│  │ Plan: Your 30-day plan focuses on rebuilding...│    │
│  │                            [✓ Mark as Reviewed]│    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔍 Where to Find Everything

### Frontend Components
- `src/components/feedback/InitialFeedbackModal.jsx` - Post-generation feedback
- `src/components/feedback/GeneralFeedbackPanel.jsx` - Slide-in panel
- `src/components/feedback/FloatingFeedbackButton.jsx` - Always-visible button
- `src/components/feedback/MicroFeedbackToast.jsx` - Task completion feedback

### Backend
- `src/lib/feedbackService.js` - All feedback operations
- `sql/migrations/003_create_feedback_table.sql` - Database schema

### Integration Points
- `src/pages/DashboardPage.jsx` - User-facing feedback (lines 604-657)
- `src/pages/AdminPage.jsx` - Admin feedback dashboard (lines 1126-1346)

---

## ✅ Checklist

- [ ] Run database migration in Supabase
- [ ] Test initial feedback modal (after plan generation)
- [ ] Test floating feedback button
- [ ] Test general feedback submission
- [ ] Test bug report submission
- [ ] Test feature request submission
- [ ] Check admin dashboard feedback tab
- [ ] Test feedback filtering
- [ ] Test "Mark as Reviewed" functionality

---

## 🎉 You're Done!

Once you run the migration, the entire feedback loop system is live and ready to collect user insights!

**Next time you want to check feedback:**
1. Go to http://localhost:3101/admin
2. Click the "💬 Feedback" tab
3. See all user feedback with stats and filters

**Questions?**
- Check `docs/FEEDBACK_LOOP_STATUS.md` for detailed documentation
- Review the KI at `.gemini/antigravity/knowledge/extensiovitae/artifacts/implementation/feedback_loop.md`
