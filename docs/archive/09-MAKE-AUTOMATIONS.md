# EXTENSIOVITAE — Make.com Automations

## Overview

Three main scenarios handle the ExtensioVitae automation:

1. **Plan Generation** — Triggered on intake submission
2. **Daily Nudge** — Scheduled daily at 6:30 AM (per timezone)
3. **WhatsApp Webhook** — Handles inbound messages

---

## Scenario 1: Plan Generation

**Trigger:** Webhook (POST from intake form)

### Step-by-Step Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Webhook Trigger                                         │
│ ─────────────────────────────────────────────────────────────── │
│ Module: Webhooks > Custom Webhook                               │
│ Name: intake_submission                                          │
│ Method: POST                                                     │
│ Payload: Intake form JSON                                        │
│ Output: {{1.name}}, {{1.age_range}}, {{1.phone_number}}, etc.   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Save Intake to Supabase                                 │
│ ─────────────────────────────────────────────────────────────── │
│ Module: Supabase > Insert a Row                                 │
│ Table: intake_responses                                          │
│ Fields:                                                          │
│   - name: {{1.name}}                                            │
│   - phone_number: {{1.phone_number}}                            │
│   - age_range: {{1.age_range}}                                  │
│   - primary_goal: {{1.primary_goal}}                            │
│   - wake_time: {{1.wake_time}}                                  │
│   - exercise_current: {{1.exercise_current}}                    │
│   - biggest_constraint: {{1.biggest_constraint}}                │
│   - diet_preference: {{1.diet_preference}}                      │
│   - sleep_quality: {{1.sleep_quality}}                          │
│   - stress_level: {{1.stress_level}}                            │
│   - whatsapp_consent: {{1.whatsapp_consent}}                    │
│ Output: {{2.id}} (intake_id)                                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Call OpenAI API                                         │
│ ─────────────────────────────────────────────────────────────── │
│ Module: HTTP > Make a Request                                   │
│ URL: https://api.openai.com/v1/chat/completions                 │
│ Method: POST                                                     │
│ Headers:                                                         │
│   - Authorization: Bearer {{OPENAI_API_KEY}}                    │
│   - Content-Type: application/json                              │
│ Body (JSON):                                                     │
│ {                                                                │
│   "model": "gpt-4-turbo-preview",                               │
│   "messages": [                                                  │
│     { "role": "system", "content": "{{SYSTEM_PROMPT}}" },       │
│     { "role": "user", "content": "Generate plan for: {{1}}" }   │
│   ],                                                             │
│   "temperature": 0.7,                                            │
│   "max_tokens": 8000,                                            │
│   "response_format": { "type": "json_object" }                  │
│ }                                                                │
│ Parse response: Yes                                              │
│ Output: {{3.choices[0].message.content}} (plan JSON)            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Parse AI Response                                       │
│ ─────────────────────────────────────────────────────────────── │
│ Module: JSON > Parse JSON                                       │
│ Input: {{3.choices[0].message.content}}                         │
│ Output: Structured plan object                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Save Plan to Supabase                                   │
│ ─────────────────────────────────────────────────────────────── │
│ Module: Supabase > Insert a Row                                 │
│ Table: plans                                                     │
│ Fields:                                                          │
│   - intake_id: {{2.id}}                                         │
│   - user_name: {{1.name}}                                       │
│   - phone_number: {{1.phone_number}}                            │
│   - plan_summary: {{4.plan_summary}}                            │
│   - primary_focus_pillars: {{4.primary_focus_pillars}}          │
│   - plan_data: {{3.choices[0].message.content}}                 │
│   - timezone: {{1.timezone}} (or default UTC)                   │
│   - status: "active"                                             │
│ Output: {{5.id}} (plan_id)                                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: Send WhatsApp Welcome Message                           │
│ ─────────────────────────────────────────────────────────────── │
│ Module: HTTP > Make a Request                                   │
│ URL: https://graph.facebook.com/v18.0/{{PHONE_NUMBER_ID}}/messages │
│ Method: POST                                                     │
│ Headers:                                                         │
│   - Authorization: Bearer {{WHATSAPP_ACCESS_TOKEN}}             │
│   - Content-Type: application/json                              │
│ Body:                                                            │
│ {                                                                │
│   "messaging_product": "whatsapp",                              │
│   "to": "{{1.phone_number}}",                                   │
│   "type": "template",                                            │
│   "template": {                                                  │
│     "name": "welcome_plan_ready",                               │
│     "language": { "code": "en" },                               │
│     "components": [{                                             │
│       "type": "body",                                            │
│       "parameters": [                                            │
│         { "type": "text", "text": "{{1.name}}" },               │
│         { "type": "text", "text": "extensiovitae.com/d/{{5.id}}" } │
│       ]                                                          │
│     }]                                                           │
│   }                                                              │
│ }                                                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 7: Log Message to Supabase                                 │
│ ─────────────────────────────────────────────────────────────── │
│ Module: Supabase > Insert a Row                                 │
│ Table: whatsapp_messages                                         │
│ Fields:                                                          │
│   - plan_id: {{5.id}}                                           │
│   - phone_number: {{1.phone_number}}                            │
│   - direction: "outbound"                                        │
│   - message_type: "welcome"                                      │
│   - template_name: "welcome_plan_ready"                         │
│   - whatsapp_message_id: {{6.messages[0].id}}                   │
│   - delivery_status: "sent"                                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 8: Return Success Response                                 │
│ ─────────────────────────────────────────────────────────────── │
│ Module: Webhooks > Webhook Response                             │
│ Status: 200                                                      │
│ Body: { "success": true, "plan_id": "{{5.id}}" }               │
└─────────────────────────────────────────────────────────────────┘
```

### Error Handling

Add error handler after Step 3 (OpenAI call):

```
┌─────────────────────────────────────────────────────────────────┐
│ ERROR HANDLER: AI Generation Failed                             │
│ ─────────────────────────────────────────────────────────────── │
│ Module: Tools > Set Variable                                    │
│ Variable: error_occurred = true                                  │
│                                                                  │
│ Then: Supabase > Insert a Row (error_logs)                      │
│ Fields:                                                          │
│   - error_type: "ai_generation_failed"                          │
│   - error_message: {{error.message}}                            │
│   - intake_id: {{2.id}}                                         │
│   - context_data: {{1}}                                         │
│                                                                  │
│ Then: Schedule retry (Make.com Scheduler)                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Scenario 2: Daily Nudge Sender

**Trigger:** Schedule (runs every 15 minutes to handle timezones)

### Step-by-Step Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Schedule Trigger                                        │
│ ─────────────────────────────────────────────────────────────── │
│ Module: Schedule > Every 15 minutes                             │
│ Note: Check timezone windows for 6:30 AM delivery               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Get Plans Needing Nudge                                 │
│ ─────────────────────────────────────────────────────────────── │
│ Module: Supabase > Search Rows                                  │
│ Table: plans                                                     │
│ Filter:                                                          │
│   - status = 'active'                                           │
│   - whatsapp_active = true                                      │
│   - start_date <= today                                         │
│   - (today - start_date) < 30                                   │
│   - timezone matches current window                              │
│ Output: Array of plans needing nudge                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Iterator                                                │
│ ─────────────────────────────────────────────────────────────── │
│ Module: Flow Control > Iterator                                 │
│ Array: {{2.data}}                                               │
│ Process each plan individually                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Calculate Current Day                                   │
│ ─────────────────────────────────────────────────────────────── │
│ Module: Tools > Set Variable                                    │
│ current_day = dateDiff(today, {{3.start_date}}) + 1             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Check if Nudge Already Sent Today                       │
│ ─────────────────────────────────────────────────────────────── │
│ Module: Supabase > Search Rows                                  │
│ Table: daily_progress                                            │
│ Filter:                                                          │
│   - plan_id = {{3.id}}                                          │
│   - day_number = {{4.current_day}}                              │
│   - nudge_sent_at >= today                                      │
│ Continue only if no results                                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: Extract Today's Tasks                                   │
│ ─────────────────────────────────────────────────────────────── │
│ Module: Tools > Set Variable                                    │
│ today_data = {{3.plan_data.days[current_day - 1]}}              │
│ tasks_text = Format tasks for WhatsApp message                  │
│ total_time = {{today_data.total_time_minutes}}                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 7: Send WhatsApp Daily Nudge                               │
│ ─────────────────────────────────────────────────────────────── │
│ Module: HTTP > Make a Request                                   │
│ URL: https://graph.facebook.com/v18.0/{{PHONE_NUMBER_ID}}/messages │
│ Method: POST                                                     │
│ Body:                                                            │
│ {                                                                │
│   "messaging_product": "whatsapp",                              │
│   "to": "{{3.phone_number}}",                                   │
│   "type": "template",                                            │
│   "template": {                                                  │
│     "name": "daily_nudge",                                      │
│     "language": { "code": "en" },                               │
│     "components": [{                                             │
│       "type": "body",                                            │
│       "parameters": [                                            │
│         { "type": "text", "text": "{{3.user_name}}" },          │
│         { "type": "text", "text": "{{4.current_day}}" },        │
│         { "type": "text", "text": "{{6.tasks_text}}" },         │
│         { "type": "text", "text": "{{6.total_time}}" },         │
│         { "type": "text", "text": "extensiovitae.com/d/{{3.id}}/{{4.current_day}}" } │
│       ]                                                          │
│     }]                                                           │
│   }                                                              │
│ }                                                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 8: Create/Update Daily Progress Record                     │
│ ─────────────────────────────────────────────────────────────── │
│ Module: Supabase > Upsert a Row                                 │
│ Table: daily_progress                                            │
│ Match on: plan_id + day_number                                  │
│ Fields:                                                          │
│   - plan_id: {{3.id}}                                           │
│   - day_number: {{4.current_day}}                               │
│   - total_tasks: {{length(today_data.tasks)}}                   │
│   - nudge_sent_at: now()                                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 9: Log WhatsApp Message                                    │
│ ─────────────────────────────────────────────────────────────── │
│ Module: Supabase > Insert a Row                                 │
│ Table: whatsapp_messages                                         │
│ Fields:                                                          │
│   - plan_id: {{3.id}}                                           │
│   - phone_number: {{3.phone_number}}                            │
│   - direction: "outbound"                                        │
│   - message_type: "daily_nudge"                                 │
│   - template_name: "daily_nudge"                                │
│   - delivery_status: "sent"                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Scenario 3: WhatsApp Webhook Handler

**Trigger:** Webhook (incoming WhatsApp messages)

### Step-by-Step Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Webhook Trigger                                         │
│ ─────────────────────────────────────────────────────────────── │
│ Module: Webhooks > Custom Webhook                               │
│ Name: whatsapp_incoming                                          │
│ Verify Meta webhook challenge on setup                          │
│ Payload: WhatsApp Cloud API webhook format                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Parse Message                                           │
│ ─────────────────────────────────────────────────────────────── │
│ Module: Tools > Set Multiple Variables                          │
│ Variables:                                                       │
│   - phone_number: {{1.entry[0].changes[0].value.messages[0].from}} │
│   - message_text: {{1.entry[0].changes[0].value.messages[0].text.body}} │
│   - message_type: {{1.entry[0].changes[0].value.messages[0].type}} │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Router - Message Type                                   │
│ ─────────────────────────────────────────────────────────────── │
│ Module: Flow Control > Router                                   │
│ Routes:                                                          │
│   - OPT_OUT: message matches /^(STOP|UNSUBSCRIBE|CANCEL)$/i     │
│   - COMPLETION: message matches /^(✓|done|complete)$/i          │
│   - SKIP: message matches /^SKIP$/i                              │
│   - CONTINUE: message matches /^CONTINUE$/i                      │
│   - OTHER: fallback                                              │
└─────────────────────────────────────────────────────────────────┘
```

### Route: OPT_OUT

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4a: Mark User Unsubscribed                                 │
│ ─────────────────────────────────────────────────────────────── │
│ Module: Supabase > Update Rows                                  │
│ Table: plans                                                     │
│ Filter: phone_number = {{2.phone_number}} AND status = 'active' │
│ Update: whatsapp_active = false                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5a: Send Opt-Out Confirmation                              │
│ ─────────────────────────────────────────────────────────────── │
│ Module: HTTP > Make a Request (WhatsApp API)                    │
│ Message: "You've been unsubscribed from ExtensioVitae..."       │
└─────────────────────────────────────────────────────────────────┘
```

### Route: COMPLETION

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4b: Get User's Plan                                        │
│ ─────────────────────────────────────────────────────────────── │
│ Module: Supabase > Search Rows                                  │
│ Table: plans                                                     │
│ Filter: phone_number = {{2.phone_number}} AND status = 'active' │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5b: Update Daily Progress                                  │
│ ─────────────────────────────────────────────────────────────── │
│ Module: Supabase > Update Rows                                  │
│ Table: daily_progress                                            │
│ Filter: plan_id = {{4b.id}} AND day_number = current_day       │
│ Update:                                                          │
│   - tasks_completed: mark all as true                           │
│   - completed_tasks: total_tasks                                │
│   - all_tasks_completed_at: now()                               │
│   - nudge_acknowledged_at: now()                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6b: Send Acknowledgment                                    │
│ ─────────────────────────────────────────────────────────────── │
│ Module: HTTP > Make a Request (WhatsApp API)                    │
│ Template: completion_ack                                         │
│ Message: "Day X complete ✓ [encouragement]"                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Make.com Configuration Checklist

### Required Connections

| Connection | Purpose |
|------------|---------|
| Supabase | Database operations |
| OpenAI | Plan generation |
| WhatsApp Cloud API | Message sending |

### Environment Variables (Make.com Data Store)

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `WHATSAPP_ACCESS_TOKEN` | Meta WhatsApp access token |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Business phone ID |
| `SYSTEM_PROMPT` | Full AI system prompt |

### Webhook URLs to Configure

1. **Intake Webhook:** `https://hook.eu1.make.com/xxx/intake_submission`
2. **WhatsApp Webhook:** `https://hook.eu1.make.com/xxx/whatsapp_incoming`

---

## Error Handling Best Practices

1. **Enable error notifications** — Email alerts for failed scenarios
2. **Use try/catch blocks** — Wrap API calls in error handlers
3. **Implement retries** — 3 retries with exponential backoff
4. **Log all errors** — Write to `error_logs` table
5. **Graceful degradation** — Send "processing" message if AI fails

---

*Decision: Use Make.com EU region for GDPR compliance. Webhook timeouts set to 30 seconds for AI calls.*
