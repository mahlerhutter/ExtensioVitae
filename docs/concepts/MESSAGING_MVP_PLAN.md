# MVP Messaging Integration Concept
**Strategy:** "Low Hanging Fruit First, Premium Ready"
**Goal:** Integrate Email, Telegram, and simple SMS Verification into the MVP without blocking future WhatsApp migration.

---

## 1. Architecture: The "Notification Hub"
Instead of hardcoding "Send Email" everywhere, we build a unified internal notification router. This prepares the system for WhatsApp later.

**Core Logic (Supabase Edge Function: `notify-user`):**
1.  Frontend/Backend triggers event: `TRIGGER_MORNING_BRIEFING`
2.  Edge Function checks User Preferences:
    *   *User A:* Prefers Telegram → Send via Bot API
    *   *User B:* Prefers Email → Send via Resend/SMTP
    *   *User C (Future):* Prefers WhatsApp → (Placeholder for now)
3.  Execute sending logic.

---

## 2. Channel Integration Details (MVP)

### A. Telegram (Daily Nudges & Accountability)
**Role:** The daily companion. "Your Pocket Coach".
**Cost:** €0.00
**Tech:** Telegram Bot API (via HTTP Requests).

**User Flow:**
1.  User clicks "Enable Telegram Bot" in Dashboard.
2.  Redirects to `t.me/ExtensioVitaeBot?start=USER_ID`.
3.  User clicks "Start".
4.  Bot captures `chat_id` and saves it to user's profile in Supabase.
5.  **DONE.** We can now push messages anytime.

**Features:**
*   **07:00:** "Guten Morgen [Name]! Heute Fokus: [Pillar]. Deine 3 Tasks..."
*   **20:00:** "Check-in: Hast du dein [Task] erledigt? 👍 / 👎" (Inline Buttons)

### B. Email (Summaries & System)
**Role:** The "Official Record" and deep dives.
**Cost:** Free tier (Resend/SendGrid) usually sufficient for MVP.
**Tech:** Resend API (recommended for DX) or Supabase Auth Emails.

**Features:**
*   **Welcome:** On Sign-up (Native Supabase).
*   **Weekly Report (Sunday):** PDF or HTML summary of the week's progress. "Your Longevity Score improved by 2 points!"
*   **Alerts:** "Subscription ending", "New feature available".

### C. SMS (Premium / Fallback)
**Role:** Immediate Reach & Reliability.
**Cost:** Pay per message ($0.08+ in DACH). **Premium Tier Only.**
**Tech:** Twilio Programmable SMS.

**Use Case:**
*   **Fallback:** If user has no data/Telegram, but needs the morning nudge.
*   **Premium:** For users specifically requesting SMS (older demographics or business preference).
*   **Format:** Short text only. "ExtensioVitae Morning: 1. Sun light (10m), 2. Protein brkfst. Good luck!"

---

## 3. Database Updates Needed

We need to extend the `user_profiles` or create a `user_preferences` table.

```sql
-- Conceptual Schema Update
ALTER TABLE user_profiles 
ADD COLUMN notification_preferences JSONB DEFAULT '{
  "email": {"enabled": true, "types": ["weekly_report", "system"]},
  "telegram": {"enabled": false, "chat_id": null, "username": null},
  "sms": {"enabled": false, "phone": null, "types": ["daily_briefing"]}
}';
```

---

## 4. Implementation Roadmap

### Step 1: Database & Preferences (Day 1)
*   Add notification fields to User Profile schema.
*   Add "Notification Settings" section to User Dashboard (`/settings`).

### Step 2: Telegram Bot Setup (Day 2)
*   Create Bot via @BotFather.
*   Write simple Edge Function to handle `/start` webhook and link `chat_id` to Supabase User.

### Step 3: Trigger System (Day 2-3)
*   Set up a Cron Job (via Supabase pg_cron or GitHub Actions).
*   **Cron:** Runs every hour.
*   **Logic:** "Find all users where `local_time == 07:00` AND `telegram_enabled == true` -> Send Morning Briefing."

### Step 4: Email Reports (Day 4)
*   Design simple HTML template for Weekly Summary.
*   Hook into Sunday Cron Job.

---

## 5. Future-Proofing for WhatsApp
By building the **Notification Hub** (Step 1), adding WhatsApp later is just:
1.  Buying a number.
2.  Adding a new case to the router: `if (pref == 'whatsapp') sendViaTwilio(...)`.
3.  The rest of the logic (Cron jobs, content generation) remains **identical**.

---

## 🚀 Summary
*   **Telegram:** The robust, free workhorse for daily habits.
*   **Email:** The professional layer for summaries.
*   **SMS:** Premium/Fallback option for users who want simple text nudges.
*   **Architecture:** Centralized router makes upgrading to WhatsApp easy later.
