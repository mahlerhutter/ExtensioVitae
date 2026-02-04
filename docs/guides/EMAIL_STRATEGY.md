# ExtensioVitae — Email Strategy & Implementation

**Version:** 1.0
**Created:** 2026-02-04
**Provider:** Resend + React Email

---

## 🎯 EMAIL PHILOSOPHY (Aligned with Vision)

Based on ExtensioVitae's core axioms:

| Axiom | Email Implication |
|-------|-------------------|
| **AX-1** Zero Cognitive Load | Emails must be scannable in <30 seconds |
| **AX-2** Context Sovereignty | Send timing adapts to user's timezone + mode |
| **AX-3** Execution Primacy | Every email has ONE clear action |
| **AX-4** Discretion Protocol | No social proof, no "X users joined", no public tracking |
| **AX-5** Biological Truth | Data-driven personalization, not generic tips |

**Email Principles:**
1. **Less is more** — Max 2 emails/week for active users
2. **Action-oriented** — Every email has exactly ONE CTA
3. **Personalized** — Use actual user data, not templates
4. **Discrete** — No "Share your progress!" or social elements
5. **Mobile-first** — 70%+ will read on mobile

---

## 📧 EMAIL CATEGORIES

### 1. Transactional (System)
**Frequency:** On-demand
**Priority:** Must deliver instantly

| Email | Trigger | SLA |
|-------|---------|-----|
| Welcome | Account creation | <1 min |
| Email verification | Signup | <1 min |
| Password reset | User request | <30 sec |
| Plan delivery | Plan generated | <2 min |
| Plan completion | Day 30 complete | <5 min |

### 2. Engagement Nudges
**Frequency:** Max 1/day when relevant
**Priority:** High engagement, low annoyance

| Email | Trigger | Condition |
|-------|---------|-----------|
| Day 1 Kickoff | First plan generated | Immediately |
| Missed Day | No task completed | After 24h inactivity |
| Streak Milestone | 7/14/21/30 days | On achievement |
| Weekly Summary | Sunday evening | If any activity that week |
| Plan Renewal | Day 28 | Before plan expires |

### 3. Onboarding Sequence
**Frequency:** Days 1, 3, 7, 14 after signup
**Goal:** Activate → Habit → Retention

| Day | Email | Content |
|-----|-------|---------|
| 0 | Welcome | Plan overview + first task |
| 3 | Quick Win | "You've completed X tasks!" |
| 7 | Habit Check | Weekly summary + encouragement |
| 14 | Deep Dive | One protocol explanation |

### 4. Re-engagement
**Frequency:** After 7+ days inactive
**Goal:** Win back dormant users

| Condition | Email | Content |
|-----------|-------|---------|
| 7 days inactive | "Your protocol misses you" | Simplified restart |
| 14 days inactive | "Quick reset?" | 1-week mini plan offer |
| 30 days inactive | "Fresh start" | New intake option |

---

## 🛠 TECHNICAL IMPLEMENTATION

### Stack
```
Resend (API)
    ├── React Email (Templates)
    ├── Supabase Edge Functions (Triggers)
    └── Postgres (Email logs + preferences)
```

### Project Structure
```
src/
├── emails/
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Button.tsx
│   │   └── TaskCard.tsx
│   ├── templates/
│   │   ├── Welcome.tsx
│   │   ├── PlanDelivery.tsx
│   │   ├── DailyNudge.tsx
│   │   ├── WeeklySummary.tsx
│   │   ├── StreakMilestone.tsx
│   │   ├── MissedDay.tsx
│   │   ├── PlanRenewal.tsx
│   │   └── PasswordReset.tsx
│   └── index.ts
├── lib/
│   └── emailService.js
supabase/
└── functions/
    ├── send-email/index.ts
    ├── daily-nudge-cron/index.ts
    └── weekly-summary-cron/index.ts
```

### Database Schema Addition
```sql
-- Email preferences (extends user_profiles)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS
    email_preferences JSONB DEFAULT '{
        "transactional": true,
        "nudges": true,
        "weekly_summary": true,
        "marketing": true
    }'::jsonb;

-- Email log for tracking
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email_type TEXT NOT NULL,
    subject TEXT NOT NULL,
    resend_id TEXT,
    status TEXT DEFAULT 'sent',
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_logs_user ON email_logs(user_id);
CREATE INDEX idx_email_logs_type ON email_logs(email_type);
```

---

## 📐 EMAIL TEMPLATES

### Design System
- **Width:** 600px max
- **Font:** System fonts (San Francisco, Segoe UI, Roboto)
- **Colors:**
  - Primary: #1a1a1a (near black)
  - Accent: #22c55e (green for success)
  - Background: #ffffff
- **Logo:** Minimal, top-left
- **Footer:** Unsubscribe + Preferences only

### Template: Welcome Email
```
Subject: Dein 30-Tage Blueprint ist fertig 🧬

---

[LOGO]

Hallo {name},

Dein persönlicher Longevity Plan wartet.

**Dein Fokus:**
{primary_goal}

**Heute starten:**
{first_task_title}
{first_task_description}

[BUTTON: Plan ansehen →]

---

Du erhältst max. 2 Emails/Woche.
[Einstellungen] | [Abmelden]
```

### Template: Daily Nudge (Missed Day)
```
Subject: Tag {day_number} wartet auf dich

---

[LOGO]

{name}, heute steht an:

[TASK CARD]
{task_icon} {task_title}
{task_duration} min

[BUTTON: Jetzt erledigen →]

---

[Benachrichtigungen pausieren] | [Abmelden]
```

### Template: Weekly Summary
```
Subject: Deine Woche: {completed}/{total} erledigt

---

[LOGO]

**Woche {week_number} Zusammenfassung**

✅ Erledigt: {completed_count}
⏳ Offen: {pending_count}
🔥 Streak: {streak_days} Tage

**Nächste Woche:**
- {next_week_focus_1}
- {next_week_focus_2}

[BUTTON: Weiter geht's →]

---

[Einstellungen] | [Abmelden]
```

---

## ⚙️ AUTOMATION WORKFLOWS

### Workflow 1: Welcome Sequence
```
TRIGGER: User creates account + completes intake

Day 0 (immediate):
  → Send: Welcome + Plan Delivery
  → Log: email_logs (type: 'welcome')

Day 3:
  → Check: Has user completed ≥1 task?
  → IF YES: Send "Quick Win" email
  → IF NO: Send "Need help getting started?"

Day 7:
  → Send: Weekly Summary (even if minimal activity)
  → Include: "Tip of the week" from their protocol

Day 14:
  → Check: User still active?
  → IF YES: Send "Deep Dive" protocol education
  → IF NO: Start re-engagement sequence
```

### Workflow 2: Daily Nudge
```
CRON: Every day at user's preferred time (default: 8:00 local)

FOR EACH active user:
  → Check: email_preferences.nudges = true
  → Check: Last activity > 20 hours ago
  → Check: Not in "Sick Mode" or "Travel Mode"
  → IF ALL: Send daily nudge
  → ELSE: Skip
```

### Workflow 3: Streak Celebration
```
TRIGGER: daily_progress INSERT

→ Calculate current streak
→ IF streak IN [7, 14, 21, 30]:
    → Send streak milestone email
    → Include: Personalized stat ("You've done X cold plunges!")
```

### Workflow 4: Re-engagement
```
CRON: Daily at 10:00 UTC

FOR EACH user WHERE last_activity > 7 days:
  → Day 7: Send "We miss you" email
  → Day 14: Send "Quick reset?" email
  → Day 30: Send "Fresh start" email
  → Day 45+: Mark as churned, stop emails
```

---

## 🔐 COMPLIANCE & PRIVACY

### DSGVO Requirements
- ✅ Double opt-in for marketing emails
- ✅ One-click unsubscribe in every email
- ✅ Email preferences in user settings
- ✅ No tracking pixels (Resend provides opens via headers)
- ✅ Data deletion removes all email logs

### Unsubscribe Flow
```
User clicks "Abmelden"
    ↓
Landing page: "What would you like to change?"
    ↓
Options:
  [ ] Pause for 1 week
  [ ] Only receive plan updates
  [ ] Unsubscribe from all marketing
  [ ] Delete my account
    ↓
Confirm → Update email_preferences
```

---

## 📊 METRICS TO TRACK

| Metric | Target | Measurement |
|--------|--------|-------------|
| Delivery rate | >99% | Resend dashboard |
| Open rate | >40% | Resend webhook |
| Click rate | >15% | Resend webhook |
| Unsubscribe rate | <0.5% | Per email type |
| Reactivation rate | >20% | Re-engagement → active within 7d |

---

## 🚀 IMPLEMENTATION PHASES

### Phase 1: Foundation (Week 1)
- [ ] Set up Resend account + API key
- [ ] Create React Email templates (Welcome, Password Reset)
- [ ] Create Edge Function for sending
- [ ] Add email_preferences to user_profiles
- [ ] Create email_logs table

### Phase 2: Transactional (Week 2)
- [ ] Welcome email on signup
- [ ] Plan delivery email
- [ ] Password reset email
- [ ] Plan completion email

### Phase 3: Engagement (Week 3-4)
- [ ] Daily nudge cron job
- [ ] Weekly summary cron job
- [ ] Streak milestone triggers
- [ ] Missed day detection

### Phase 4: Sequences (Month 2)
- [ ] Onboarding sequence (Day 0, 3, 7, 14)
- [ ] Re-engagement sequence
- [ ] User preference management UI

---

## 💰 COST ESTIMATE

**Resend Pricing (as of 2026):**
- Free tier: 3,000 emails/month
- Pro: $20/month = 50,000 emails

**Projected Usage (100 active users):**
- Transactional: ~200/month
- Nudges: ~400/month (assuming 50% opt-in)
- Weekly summaries: ~400/month
- **Total: ~1,000 emails/month = FREE TIER**

**At 1,000 users:** ~10,000 emails/month = still under Pro tier

---

## 🔗 REFERENCES

- [Resend Documentation](https://resend.com/docs)
- [React Email Components](https://react.email)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- ExtensioVitae VISION.md (axioms alignment)

---

*Email Strategy v1.0 | Created: 2026-02-04*
