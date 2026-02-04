# ExtensioVitae Email Setup Guide

**Quick setup for Resend email integration**

---

## 1. Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up and verify your email
3. Add your domain (or use their free @resend.dev domain for testing)

---

## 2. Get API Key

1. Dashboard → API Keys → Create API Key
2. Name: `extensiovitae-production`
3. Copy the key (starts with `re_`)

---

## 3. Configure Supabase

### Add Secrets
```bash
# In your terminal
supabase secrets set RESEND_API_KEY=re_your_api_key_here
supabase secrets set FROM_EMAIL="ExtensioVitae <noreply@extensiovitae.com>"
```

Or via Dashboard:
1. Supabase Dashboard → Settings → Edge Functions
2. Add secrets: `RESEND_API_KEY`, `FROM_EMAIL`

### Run Database Migration
```sql
-- In Supabase SQL Editor, run:
-- Copy content from sql/migrations/011_email_tables.sql
```

### Deploy Edge Function
```bash
cd MVPExtensio
supabase functions deploy send-email
```

---

## 4. Verify Domain (Production)

For production emails, verify your domain:

1. Resend Dashboard → Domains → Add Domain
2. Add DNS records:
   - SPF record
   - DKIM record
   - DMARC record (optional but recommended)
3. Wait for verification (usually 5-10 min)

---

## 5. Test Email Sending

### Quick Test (Browser Console)
```javascript
// In your app's browser console when logged in
import { sendEmail } from './lib/emailService';

await sendEmail({
  to: 'your@email.com',
  template: 'welcome',
  data: {
    name: 'Test User',
    primary_goal: 'Longevity',
    first_task_title: 'Morning Routine',
    first_task_description: 'Start with a glass of water',
    dashboard_url: 'http://localhost:5173/dashboard'
  }
});
```

### Test via cURL
```bash
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/send-email' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "to": "your@email.com",
    "template": "welcome",
    "data": {
      "name": "Test User",
      "primary_goal": "Longevity",
      "first_task_title": "Morning Routine",
      "first_task_description": "Start with a glass of water",
      "dashboard_url": "https://extensiovitae.com/dashboard"
    }
  }'
```

---

## 6. Available Templates

| Template | Use Case |
|----------|----------|
| `welcome` | After signup + plan generation |
| `daily-nudge` | Daily reminder for inactive users |
| `weekly-summary` | Weekly progress recap |
| `streak-milestone` | 7/14/21/30 day celebrations |
| `missed-day` | Re-engagement after inactivity |
| `password-reset` | Password reset flow |

---

## 7. Environment Variables

Add to `.env.local`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

The Edge Function uses Supabase secrets (not exposed to client).

---

## 8. Cost Estimate

| Users | Emails/Month | Cost |
|-------|--------------|------|
| 100 | ~1,000 | FREE |
| 500 | ~5,000 | FREE |
| 1,000 | ~10,000 | $20/mo |
| 5,000 | ~50,000 | $20/mo |

---

## 9. Monitoring

- Resend Dashboard: Delivery rates, opens, clicks
- Supabase Logs: Edge Function errors
- `email_logs` table: Per-user history

---

## Troubleshooting

**"Email service not configured"**
→ Check `RESEND_API_KEY` is set in Supabase secrets

**"Unknown template"**
→ Use one of the defined templates (see list above)

**Emails not arriving**
→ Check spam folder, verify domain DNS, check Resend dashboard

**CORS errors**
→ Ensure Edge Function is deployed with latest version

---

*Setup time: ~15 minutes*
