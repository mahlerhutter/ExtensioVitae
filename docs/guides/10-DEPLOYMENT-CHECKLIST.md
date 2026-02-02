# EXTENSIOVITAE — 48-Hour Deployment Checklist

## Pre-Launch (Day 0)

### Domain & Hosting
- [ ] Purchase domain: `extensiovitae.com` (Namecheap/Cloudflare)
- [ ] Create Vercel account (use GitHub SSO)
- [ ] Connect custom domain to Vercel
- [ ] Enable HTTPS (automatic with Vercel)
- [ ] Configure DNS records (Vercel will provide)

### Supabase Setup
- [ ] Create Supabase project (EU region for GDPR)
- [ ] Run `schema.sql` in SQL editor
- [ ] Enable Row Level Security
- [ ] Copy project URL and service role key
- [ ] Test database connection

### OpenAI Setup
- [ ] Create OpenAI account (if needed)
- [ ] Generate API key with usage limits
- [ ] Set spending cap ($50/month for MVP)
- [ ] Test API call with system prompt

### WhatsApp Business Setup
- [ ] Create Meta Business account
- [ ] Apply for WhatsApp Business API access
- [ ] Set up WhatsApp Business phone number
- [ ] Submit message templates for approval:
  - [ ] `welcome_plan_ready`
  - [ ] `daily_nudge`
  - [ ] `completion_ack`
  - [ ] `week_summary`
  - [ ] `plan_complete`
  - [ ] `missed_day`
- [ ] Configure webhook URL (will set after Make.com)
- [ ] Test message sending

### Make.com Setup
- [ ] Create Make.com account (EU region)
- [ ] Create scenarios:
  - [ ] Plan Generation scenario
  - [ ] Daily Nudge scenario
  - [ ] WhatsApp Webhook scenario
- [ ] Configure connections:
  - [ ] Supabase
  - [ ] OpenAI
  - [ ] WhatsApp Cloud API
- [ ] Set environment variables in Data Store
- [ ] Test each scenario individually
- [ ] Enable scenario scheduling

---

## Day 1: Build & Connect

### Frontend Deployment

```bash
# Initialize React project
npx create-vite extensiovitae --template react
cd extensiovitae

# Install dependencies
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Copy components from deliverables
cp -r ../extensiovitae/src/* ./src/

# Configure tailwind.config.js
# Configure environment variables

# Deploy to Vercel
vercel
```

### Environment Variables (Vercel)

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJxxx...` |
| `VITE_MAKE_WEBHOOK_URL` | `https://hook.eu1.make.com/xxx` |

### Connect Services
- [ ] Update Make.com webhook URLs in frontend
- [ ] Test intake form → Make.com webhook
- [ ] Test Make.com → Supabase write
- [ ] Test Make.com → OpenAI call
- [ ] Test Make.com → WhatsApp send
- [ ] Verify full flow end-to-end

---

## Day 2: Test & Launch

### Testing Checklist

#### Landing Page
- [ ] Hero loads correctly
- [ ] All CTAs link to `/intake`
- [ ] Mobile responsive (test on real device)
- [ ] Page speed < 3 seconds

#### Intake Form
- [ ] All fields validate correctly
- [ ] Phone number accepts international format
- [ ] Form submits to webhook
- [ ] Loading state shows correctly
- [ ] Error handling works

#### Plan Generation
- [ ] AI generates valid 30-day plan
- [ ] Plan saves to Supabase correctly
- [ ] JSON structure matches schema
- [ ] Generation time < 30 seconds

#### WhatsApp
- [ ] Welcome message sends immediately
- [ ] Message formatting looks correct
- [ ] Links work in messages
- [ ] Opt-out (STOP) works
- [ ] Completion (✓) acknowledgment works

#### Dashboard
- [ ] Plan loads from database
- [ ] Task checkboxes save state
- [ ] 30-day grid displays correctly
- [ ] Mobile layout works

#### Daily Nudge
- [ ] Scheduled job runs at correct time
- [ ] Messages sent to correct users
- [ ] Day calculation is accurate
- [ ] Duplicate sends prevented

### Pre-Launch Fixes
- [ ] Fix any bugs found during testing
- [ ] Optimize slow queries
- [ ] Review error logs
- [ ] Clear test data from production

---

## Launch Checklist

### Legal (Essential)
- [ ] Privacy Policy page (`/privacy`)
- [ ] Terms of Service page (`/terms`)
- [ ] Cookie consent banner (if using analytics)
- [ ] WhatsApp opt-in language approved

### Analytics (Optional for MVP)
- [ ] Vercel Analytics enabled
- [ ] Basic event tracking (intake start, intake complete, plan generated)

### Monitoring
- [ ] Make.com error notifications enabled
- [ ] Supabase usage alerts configured
- [ ] OpenAI usage monitoring active

### Go Live
- [ ] Remove test data
- [ ] Enable all Make.com scenarios
- [ ] Share URL with first 10 users
- [ ] Monitor first 24 hours closely

---

## Post-Launch (Week 1)

### Daily Monitoring
- [ ] Check error logs each morning
- [ ] Verify daily nudges sent correctly
- [ ] Monitor WhatsApp delivery rates
- [ ] Check OpenAI token usage

### User Feedback
- [ ] Set up simple feedback mechanism (reply to WhatsApp or email)
- [ ] Document common issues
- [ ] Prioritize fixes for v1.1

### Quick Wins
- [ ] Implement most-requested feature
- [ ] Optimize any slow operations
- [ ] Add email backup for failed WhatsApp (if recurring issue)

---

## Emergency Contacts

| Service | Issue | Contact |
|---------|-------|---------|
| Vercel | Deployment failed | Vercel Dashboard or @vercel on Twitter |
| Supabase | Database down | status.supabase.com |
| Make.com | Scenario failed | Make.com Dashboard |
| OpenAI | API issues | status.openai.com |
| Meta/WhatsApp | Message delivery | Meta Business Help Center |

---

## Quick Reference: Key URLs

| Resource | URL |
|----------|-----|
| Production site | `https://extensiovitae.com` |
| Vercel dashboard | `https://vercel.com/dashboard` |
| Supabase dashboard | `https://app.supabase.com/project/xxx` |
| Make.com dashboard | `https://eu1.make.com/xxx` |
| OpenAI usage | `https://platform.openai.com/usage` |
| WhatsApp Manager | `https://business.facebook.com/wa/manage/xxx` |

---

## Cost Estimates (First 100 Users)

| Service | Estimated Monthly Cost |
|---------|----------------------|
| Vercel | $0 (Hobby tier) |
| Supabase | $0 (Free tier: 500MB, 2GB transfer) |
| Make.com | $9 (Core: 10,000 operations) |
| OpenAI | $20-40 (GPT-4 Turbo, ~100 plans) |
| Domain | $12/year |
| WhatsApp | $0 (first 1,000 conversations/month free) |
| **Total** | **~$30-50/month** |

---

*Decision: Start on free tiers. Upgrade as usage grows. WhatsApp Business verification may take 2-3 days—apply immediately.*
