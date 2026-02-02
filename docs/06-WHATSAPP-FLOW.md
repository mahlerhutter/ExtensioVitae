# EXTENSIOVITAE — WhatsApp Flow

## Overview

WhatsApp is the primary delivery channel for daily nudges. All messages must be:
- Calm and non-spammy
- Actionable
- Under 1024 characters (WhatsApp limit)
- Compliant with WhatsApp Business Policy

---

## Opt-In Logic

### Consent Collection (Intake Form)
```
Location: Final step of intake form
Checkbox: Required (checked = true)
Copy: "I agree to receive daily WhatsApp messages for 30 days. I can unsubscribe anytime by replying STOP."
```

### Phone Number Validation
- Format: E.164 international format (e.g., +14155551234)
- Validation: Regex pattern `^\+[1-9]\d{1,14}$`
- Storage: Encrypted in Supabase

### Consent Record
```json
{
  "user_id": "uuid",
  "phone_number": "+14155551234",
  "consent_given": true,
  "consent_timestamp": "2025-01-15T10:30:00Z",
  "consent_ip": "192.168.1.1",
  "consent_source": "intake_form_v1"
}
```

---

## Opt-Out Handling

### Trigger Keywords
User can reply with any of these to unsubscribe:
- STOP
- UNSUBSCRIBE
- CANCEL
- QUIT
- END

### Opt-Out Flow
1. User sends opt-out keyword
2. Webhook receives message
3. Mark `whatsapp_active = false` in database
4. Send confirmation message
5. Stop all future messages immediately

### Opt-Out Confirmation Message
```
You've been unsubscribed from ExtensioVitae daily messages.

Your plan remains available at extensiovitae.com/dashboard

To resubscribe anytime, reply START.
```

---

## Message Templates

### Template 1: Welcome Message (Sent Immediately After Plan Generation)

**Template Name:** `welcome_plan_ready`

**Template Content:**
```
Welcome to ExtensioVitae, {{1}} 👋

Your personalized 30-day longevity blueprint is ready.

Starting tomorrow at 6:30am, you'll receive your daily micro-tasks here. Each day takes ≤30 minutes.

View your full plan: {{2}}

Reply STOP anytime to unsubscribe.

Here's to extending your vitae.
```

**Variables:**
- `{{1}}`: User's first name
- `{{2}}`: Dashboard URL with auth token

**Example:**
```
Welcome to ExtensioVitae, Sarah 👋

Your personalized 30-day longevity blueprint is ready.

Starting tomorrow at 6:30am, you'll receive your daily micro-tasks here. Each day takes ≤30 minutes.

View your full plan: extensiovitae.com/d/abc123

Reply STOP anytime to unsubscribe.

Here's to extending your vitae.
```

---

### Template 2: Daily Nudge (Morning)

**Template Name:** `daily_nudge`

**Timing:** 6:30 AM user's local timezone

**Template Content:**
```
Good morning {{1}} ☀️

Day {{2}} of 30:

{{3}}

Total: {{4}} minutes

View details: {{5}}

Reply ✓ when complete.
```

**Variables:**
- `{{1}}`: User's first name
- `{{2}}`: Current day number
- `{{3}}`: Formatted task list
- `{{4}}`: Total time in minutes
- `{{5}}`: Dashboard day URL

**Example:**
```
Good morning Sarah ☀️

Day 7 of 30:

☐ 4-7-8 breathing before first call (2 min)
☐ 16oz water with lemon, no food until 11am (1 min)
☐ 15-min walk meeting or solo walk (15 min)
☐ Blue light glasses on by 7pm (1 min)
☐ Gratitude note to one person (5 min)

Total: 24 minutes

View details: extensiovitae.com/d/abc123/7

Reply ✓ when complete.
```

---

### Template 3: Completion Acknowledgment

**Template Name:** `completion_ack`

**Trigger:** User replies with ✓ or "done" or "complete"

**Template Content:**
```
Day {{1}} complete ✓

{{2}}

See you tomorrow at 6:30am.
```

**Variables:**
- `{{1}}`: Day number
- `{{2}}`: Brief encouragement (rotated, not repetitive)

**Encouragement Rotation:**
```
- "Consistency compounds."
- "One day closer."
- "Solid work."
- "Building momentum."
- "Progress logged."
```

**Example:**
```
Day 7 complete ✓

Consistency compounds.

See you tomorrow at 6:30am.
```

---

### Template 4: Week Summary (Days 7, 14, 21)

**Template Name:** `week_summary`

**Timing:** End of day on days 7, 14, 21

**Template Content:**
```
Week {{1}} complete, {{2}}.

{{3}} of {{4}} days logged.

{{5}}

Keep going. Week {{6}} starts tomorrow.
```

**Variables:**
- `{{1}}`: Week number (1, 2, or 3)
- `{{2}}`: User's first name
- `{{3}}`: Days completed this week
- `{{4}}`: Total days this week (7)
- `{{5}}`: One insight or pattern
- `{{6}}`: Next week number

**Example:**
```
Week 1 complete, Sarah.

6 of 7 days logged.

Your sleep pillar consistency stands out.

Keep going. Week 2 starts tomorrow.
```

---

### Template 5: Day 30 Completion

**Template Name:** `plan_complete`

**Timing:** After Day 30 tasks

**Template Content:**
```
30 days complete, {{1}} 🎉

You showed up {{2}} out of 30 days.

Your full journey: {{3}}

What's next?
→ Reply CONTINUE for Month 2
→ Reply FEEDBACK to share thoughts

Thank you for trusting ExtensioVitae.
```

**Variables:**
- `{{1}}`: User's first name
- `{{2}}`: Number of days completed
- `{{3}}`: Dashboard summary URL

**Example:**
```
30 days complete, Sarah 🎉

You showed up 26 out of 30 days.

Your full journey: extensiovitae.com/d/abc123/summary

What's next?
→ Reply CONTINUE for Month 2
→ Reply FEEDBACK to share thoughts

Thank you for trusting ExtensioVitae.
```

---

### Template 6: Missed Day Check-In

**Template Name:** `missed_day`

**Timing:** If no completion by 8pm

**Template Content:**
```
Hey {{1}}, just checking in.

No pressure—life happens. Your Day {{2}} tasks are still there if you have 15 minutes.

Or simply reply SKIP to move on.
```

**Variables:**
- `{{1}}`: User's first name
- `{{2}}`: Current day number

**Example:**
```
Hey Sarah, just checking in.

No pressure—life happens. Your Day 7 tasks are still there if you have 15 minutes.

Or simply reply SKIP to move on.
```

---

## WhatsApp Cloud API Configuration

### API Endpoint
```
POST https://graph.facebook.com/v18.0/{{PHONE_NUMBER_ID}}/messages
```

### Headers
```
Authorization: Bearer {{WHATSAPP_ACCESS_TOKEN}}
Content-Type: application/json
```

### Send Template Message (Example)
```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "{{USER_PHONE_NUMBER}}",
  "type": "template",
  "template": {
    "name": "daily_nudge",
    "language": {
      "code": "en"
    },
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "Sarah" },
          { "type": "text", "text": "7" },
          { "type": "text", "text": "☐ 4-7-8 breathing (2 min)\n☐ Water with lemon (1 min)\n☐ 15-min walk (15 min)\n☐ Blue light glasses by 7pm (1 min)\n☐ Gratitude note (5 min)" },
          { "type": "text", "text": "24" },
          { "type": "text", "text": "extensiovitae.com/d/abc123/7" }
        ]
      }
    ]
  }
}
```

---

## Timezone Handling

- Collect timezone during intake (auto-detect or manual selection)
- Default: UTC if not provided
- Store as IANA timezone string (e.g., "America/Los_Angeles")
- All scheduled sends use user's local time

---

## Rate Limits & Best Practices

| Rule | Implementation |
|------|----------------|
| Max 1 proactive message per day | Only morning nudge |
| No marketing messages | All messages are transactional |
| Clear opt-out in every message | Include in templates |
| 24-hour response window | Replies are conversational |
| Template approval | Submit all templates to Meta |

---

*Decision: Evening check-ins sent only if user hasn't marked complete. Disabled after 3 consecutive skips to avoid annoyance.*
