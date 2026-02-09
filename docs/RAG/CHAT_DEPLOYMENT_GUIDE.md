# 🎯 Chat Implementation - Pending Tasks & Deployment Guide

**Date:** 2026-02-08  
**Status:** Week 1 + Week 2 Code Complete  
**Next:** Deployment & Testing

---

## ✅ What's Complete

### **Week 1: Chat UI** ✅
- ✅ `src/pages/ChatPage.jsx` - Chat component
- ✅ `src/pages/ChatPage.css` - Styling
- ✅ `sql/migrations/028_chat_conversation_history.sql` - Database schema
- ✅ `/chat` route added to `src/App.jsx`
- ✅ Chat link added to Dashboard Header (Health menu)

### **Week 2: chat-api** ✅
- ✅ `supabase/functions/chat-api/index.ts` - Edge Function
- ✅ Intent Classification (Claude 3.5 Sonnet)
- ✅ State Update Parsing
- ✅ RAG Retrieval (canon-api integration)
- ✅ Response Generation (empathetic, actionable)

---

## 📋 PENDING TASKS

### **1. Fix NPM Cache** ⏳

**Issue:** NPM permission error prevents installing dependencies

**Solution:**
```bash
# Fix npm cache ownership
sudo chown -R 501:20 "/Users/mahlerhutter/.npm"

# Verify fix
npm --version
```

**Expected Output:** No errors

---

### **2. Install Dependencies** ⏳

**Required Package:** `react-markdown`

**Command:**
```bash
cd /Users/mahlerhutter/dev/projekte/MVPExtensio
npm install react-markdown
```

**Verification:**
```bash
# Check package.json
grep "react-markdown" package.json
```

**Expected Output:** `"react-markdown": "^9.x.x"`

---

### **3. Deploy SQL Migration** ⏳

**File:** `sql/migrations/028_chat_conversation_history.sql`

**Steps:**
1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to: **SQL Editor**
3. Click: **New Query**
4. Copy entire content from `sql/migrations/028_chat_conversation_history.sql`
5. Paste into SQL Editor
6. Click: **Run**

**Verification:**
```sql
-- Check table exists
SELECT * FROM conversation_history LIMIT 1;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'conversation_history';

-- Check helper functions
SELECT proname FROM pg_proc WHERE proname IN ('get_conversation_history', 'get_conversation_stats');
```

**Expected Output:**
- Table exists (empty or with data)
- 3 RLS policies (read own, insert own, service role)
- 2 helper functions

---

### **4. Set ANTHROPIC_API_KEY** ⏳

**Requirement:** chat-api needs Claude 3.5 Sonnet API key

**Steps:**
1. Open Supabase Dashboard
2. Navigate to: **Settings** → **Edge Functions** → **Secrets**
3. Add new secret:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** `sk-ant-...` (your Anthropic API key)
4. Click: **Save**

**Verification:**
```bash
# Check if secret is set (via Supabase CLI if installed)
supabase secrets list
```

**Expected Output:** `ANTHROPIC_API_KEY` listed

**Don't have an Anthropic API key?**
1. Go to: https://console.anthropic.com/
2. Sign up / Log in
3. Navigate to: **API Keys**
4. Create new key
5. Copy key (starts with `sk-ant-`)

---

### **5. Deploy chat-api Edge Function** ⏳

**File:** `supabase/functions/chat-api/index.ts`

**Option A: Manual Deployment (Recommended)**

**Steps:**
1. Open Supabase Dashboard
2. Navigate to: **Edge Functions**
3. Click: **Deploy new function**
4. **Function name:** `chat-api`
5. **Import from:** Paste content from `supabase/functions/chat-api/index.ts`
6. Click: **Deploy**

**Option B: Supabase CLI (If installed)**

```bash
cd /Users/mahlerhutter/dev/projekte/MVPExtensio

# Deploy chat-api
supabase functions deploy chat-api
```

**Verification:**
```bash
# Test chat-api with curl
curl -X POST \
  'https://YOUR_PROJECT_ID.supabase.co/functions/v1/chat-api' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "YOUR_USER_ID",
    "message": "Hallo"
  }'
```

**Expected Output:**
```json
{
  "success": true,
  "response": "Hallo! Wie kann ich dir heute helfen? ..."
}
```

---

### **6. Test End-to-End** ⏳

**Steps:**
1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Log in to your app**

3. **Navigate to /chat:**
   - Click: **Health** menu → **AI Coach Chat**
   - Or go directly to: `http://localhost:5173/chat`

4. **Send test messages:**
   - "Hallo" (greeting)
   - "Ich habe 6h geschlafen" (state update)
   - "Soll ich heute trainieren?" (question)

5. **Verify:**
   - ✅ Messages appear in UI
   - ✅ Bot responds within 3 seconds
   - ✅ Markdown rendering works
   - ✅ Conversation history persists (refresh page)
   - ✅ State updates reflected in user_states table

**Check Database:**
```sql
-- Check conversation history
SELECT * FROM conversation_history 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY created_at DESC 
LIMIT 10;

-- Check user states (if state update was sent)
SELECT * FROM user_states 
WHERE user_id = 'YOUR_USER_ID';

-- Check state events (if state update was sent)
SELECT * FROM state_events 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY timestamp DESC 
LIMIT 5;
```

---

## 🐛 Troubleshooting

### **Issue: "react-markdown not found"**

**Cause:** Dependency not installed

**Solution:**
```bash
npm install react-markdown
```

---

### **Issue: "conversation_history table does not exist"**

**Cause:** SQL migration not deployed

**Solution:** Deploy `sql/migrations/028_chat_conversation_history.sql` (see Task #3)

---

### **Issue: "ANTHROPIC_API_KEY not configured"**

**Cause:** API key not set in Supabase Edge Functions

**Solution:** Set secret in Supabase Dashboard (see Task #4)

---

### **Issue: "Chat API request failed"**

**Possible Causes:**
1. chat-api not deployed
2. ANTHROPIC_API_KEY not set
3. state-api or canon-api not deployed

**Solution:**
1. Deploy chat-api (see Task #5)
2. Set ANTHROPIC_API_KEY (see Task #4)
3. Verify state-api and canon-api are deployed:
   ```bash
   # Test state-api
   curl 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/state-api'
   
   # Test canon-api
   curl 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/canon-api'
   ```

---

### **Issue: "Bot responses are generic / not using RAG"**

**Possible Causes:**
1. canon_entries table is empty
2. canon-api not working
3. OpenAI API key not set (for embeddings)

**Solution:**
1. Seed canon_entries (see `docs/RAG_PHASE2_QUICK_START.md`)
2. Verify canon-api works
3. Set VITE_OPENAI_API_KEY in Supabase Edge Functions

---

## 📊 Success Criteria Checklist

### **Week 1: Chat UI**
- [ ] /chat route accessible for logged-in users
- [ ] Can send messages (stored in DB)
- [ ] Can view conversation history
- [ ] Clean, minimal UI
- [ ] Auto-scroll works
- [ ] Typing indicator works
- [ ] Markdown rendering works

### **Week 2: chat-api**
- [ ] Intent classification works (90% accurate)
- [ ] State updates work ("Ich habe 6h geschlafen" → user_states)
- [ ] RAG retrieval returns relevant canon entries
- [ ] Response time < 3 seconds
- [ ] Responses are empathetic and actionable
- [ ] Conversation history persists

---

## 🎯 Quick Start (TL;DR)

```bash
# 1. Fix npm cache
sudo chown -R 501:20 "/Users/mahlerhutter/.npm"

# 2. Install dependencies
npm install react-markdown

# 3. Deploy SQL migration (via Supabase Dashboard)
# Copy sql/migrations/028_chat_conversation_history.sql → SQL Editor → Run

# 4. Set ANTHROPIC_API_KEY (via Supabase Dashboard)
# Settings → Edge Functions → Secrets → Add ANTHROPIC_API_KEY

# 5. Deploy chat-api (via Supabase Dashboard)
# Edge Functions → Deploy new function → chat-api → Paste code → Deploy

# 6. Test
npm run dev
# Navigate to /chat
# Send "Hallo"
```

---

## 🚀 Next Steps (After Deployment)

**Week 3: Natural Language → User State Updates** (Optional Enhancement)
- Improve state update parsing accuracy
- Add more state fields (training_load, recovery_state, etc.)
- Add confirmation messages for state updates

**Week 4: Proactive Notification Scheduler** (Optional Enhancement)
- Cron job (2x daily: 9:00 + 18:00)
- Material Change Detection
- Priority Ranking (max 2/day)
- Web Push Notifications

**Horizon 1: Messaging Platforms** (Weeks 5-8)
- WhatsApp Integration (Twilio API)
- Telegram Bot (Telegram Bot API)
- Unified Message Router

---

**Status:** 🚀 Code Complete | Deployment Pending

**Last Updated:** 2026-02-08
