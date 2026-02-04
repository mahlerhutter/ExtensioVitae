# EXTENSIOVITAE — User Flow

## Complete Journey (Numbered)

```
┌─────────────────────────────────────────────────────────────────┐
│  1. LANDING PAGE                                                │
│     User arrives → Reads value prop → Clicks "Get My Blueprint" │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  2. INTAKE FORM (3 min max)                                     │
│     7 mandatory questions + 3 optional                          │
│     Collects: demographics, goals, constraints, lifestyle       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  3. WHATSAPP OPT-IN                                             │
│     Phone number + explicit consent                             │
│     "I agree to receive daily WhatsApp messages"                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  4. PROCESSING SCREEN                                           │
│     "Generating your personalized blueprint..."                 │
│     Show subtle animation (15-30 seconds)                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  5. AI PLAN GENERATION (Backend)                                │
│     Make.com triggers → OpenAI API call                         │
│     Returns structured 30-day plan                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  6. PLAN SAVED + WELCOME MESSAGE                                │
│     Plan stored in Supabase                                     │
│     WhatsApp welcome message sent immediately                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  7. DASHBOARD UNLOCKED                                          │
│     User redirected to /dashboard                               │
│     Sees: 30-day overview, today's tasks, progress tracker      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  8. DAILY EXECUTION LOOP (Days 1-30)                            │
│     6:30 AM: WhatsApp nudge with today's 3-5 micro-tasks        │
│     User checks off tasks in dashboard (optional)               │
│     8:00 PM: Optional evening reflection prompt                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  9. DAY 30 COMPLETION                                           │
│     Summary message                                             │
│     Prompt to continue or upgrade                               │
└─────────────────────────────────────────────────────────────────┘
```

## Detailed Step Breakdown

### Step 1: Landing Page
- **URL:** `/`
- **Goal:** Convert visitor to intake
- **Primary CTA:** "Get My Blueprint" → `/intake`
- **Secondary CTA:** "See How It Works" → scroll to explainer

### Step 2: Intake Form
- **URL:** `/intake`
- **Goal:** Collect personalization data in <3 minutes
- **UX:** Single-page form with progress indicator
- **Validation:** Real-time, inline errors
- **Exit:** Submit → Processing

### Step 3: WhatsApp Opt-In
- **Integrated:** Final section of intake form
- **Required:** Phone number (international format)
- **Required:** Checkbox consent
- **Copy:** "I agree to receive daily WhatsApp messages for 30 days. Unsubscribe anytime."

### Step 4: Processing Screen
- **URL:** `/generating`
- **Duration:** 15-30 seconds (actual API time)
- **UX:** Minimal loader, no progress bar (feels faster)
- **Copy:** "Creating your personalized 30-day blueprint..."

### Step 5: AI Plan Generation
- **Trigger:** Form submission webhook
- **Process:** Make.com scenario
- **Output:** Structured JSON plan saved to Supabase

### Step 6: Plan Saved + Welcome Message
- **Database:** `plans` table populated
- **WhatsApp:** Welcome message sent via Cloud API
- **Email:** Backup copy sent (optional, for MVP skip)

### Step 7: Dashboard
- **URL:** `/dashboard`
- **Auth:** Magic link or simple session token (MVP: localStorage)
- **Components:** Plan overview, daily checklist, pillar breakdown

### Step 8: Daily Loop
- **Timing:** 6:30 AM user's local timezone
- **Content:** 3-5 tasks from that day's plan
- **Tone:** Calm, actionable, no fluff
- **Optional:** Quick reply to mark complete

### Step 9: Completion
- **Day 30:** Summary message
- **CTA:** "Continue with Month 2" or "Share feedback"

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| User abandons intake | Save partial data, retarget via email if captured |
| WhatsApp delivery fails | Fallback to email (future iteration) |
| User unsubscribes WhatsApp | Respect immediately, mark in DB |
| User returns mid-plan | Dashboard shows current day, can review past |
| User wants to restart | Allow reset from dashboard settings |

---

*Decision: MVP uses localStorage for session persistence. Supabase Auth added in v1.1.*
