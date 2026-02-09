# 🚀 RAG + Chat Quick Start Guide

**Date:** 2026-02-08  
**Goal:** Get RAG-powered chat working end-to-end  
**Time:** ~30 minutes

---

## 📋 Prerequisites

- ✅ Supabase project created
- ✅ PostgreSQL with pgvector extension
- ✅ OpenAI API key (for embeddings)
- ✅ Anthropic API key (for Claude 3.5 Sonnet)
- ✅ Node.js installed

---

## 🎯 Step-by-Step Guide

### **Step 1: Deploy SQL Migrations** (5 min)

**Files to deploy:**
1. `sql/migrations/026_rag_user_states.sql` (User States + Event Sourcing)
2. `sql/migrations/027_canon_knowledge_layer.sql` (Canon Entries + pgvector)
3. `sql/migrations/028_chat_conversation_history.sql` (Chat History)

**How:**
1. Open Supabase Dashboard → SQL Editor
2. Copy each file content
3. Paste and Run
4. Verify:
   ```sql
   SELECT * FROM user_states LIMIT 1;
   SELECT * FROM canon_entries LIMIT 1;
   SELECT * FROM conversation_history LIMIT 1;
   ```

---

### **Step 2: Set API Keys** (2 min)

**Supabase Dashboard → Settings → Edge Functions → Secrets**

Add:
- `VITE_OPENAI_API_KEY` = `sk-...` (OpenAI)
- `ANTHROPIC_API_KEY` = `sk-ant-...` (Anthropic)

---

### **Step 3: Deploy Edge Functions** (10 min)

**Functions to deploy:**
1. `state-api` (User State Management)
2. `canon-api` (Canon Knowledge Retrieval)
3. `chat-api` (Chat Logic + RAG)

**How (Manual):**
1. Supabase Dashboard → Edge Functions → Deploy new function
2. Name: `state-api`
3. Paste: `supabase/functions/state-api/index.ts`
4. Deploy
5. Repeat for `canon-api` and `chat-api`

**Verify:**
```bash
# Test state-api
curl -X POST 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/state-api' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"action": "get_stats"}'

# Test canon-api
curl -X POST 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/canon-api' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"action": "stats"}'

# Test chat-api
curl -X POST 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/chat-api' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"user_id": "YOUR_USER_ID", "message": "Hallo"}'
```

---

### **Step 4: Seed Canon Entries** (5 min)

**Option A: Via Script (Recommended)**

```bash
cd /Users/mahlerhutter/dev/projekte/MVPExtensio

# Install dependencies (if needed)
npm install dotenv node-fetch

# Run seeding script
node scripts/seed-canon-from-md.js
```

**Expected Output:**
```
🌱 Canon Entries Seeding Script
================================

Total entries to seed: 28
Supabase URL: https://...
OpenAI API Key: ✓ Set

[1/28] Processing: Sleep Timing Consistency Supersedes Duration...
  → Generating embedding...
  → Inserting into database...
  ✅ Success! ID: ...

[2/28] Processing: Morning Light Exposure Is Non-Negotiable...
  ...

================================
📊 Seeding Complete!
================================

✅ Success: 28/28
❌ Errors:  0/28

✨ Done!
```

**Option B: Via canon-api (Manual)**

```bash
# Create entry via API
curl -X POST 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/canon-api' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "create_entry",
    "entry": {
      "domain": "sleep",
      "doctrine": "Sleep Timing Consistency Supersedes Duration",
      "mechanism": "The suprachiasmatic nucleus (SCN) synchronizes...",
      "evidence_grade": "A",
      "source_citations": ["Czeisler et al. (2005)"]
    }
  }'
```

**Verify:**
```sql
SELECT COUNT(*) FROM canon_entries;
-- Expected: 28

SELECT domain, COUNT(*) FROM canon_entries GROUP BY domain;
-- Expected:
-- sleep: 6
-- metabolism: 6
-- movement: 6
-- stress: 5
-- meaning: 5
```

---

### **Step 5: Initialize User State** (2 min)

**Via Smart Intake:**
1. Log in to app
2. Complete Smart Intake form
3. User state auto-initializes

**Or manually via state-api:**
```bash
curl -X POST 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/state-api' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "initialize_from_intake",
    "user_id": "YOUR_USER_ID",
    "intake_data": {
      "sleep_hours_bucket": "6-7",
      "stress_1_10": 5,
      "training_frequency": "3-4"
    }
  }'
```

**Verify:**
```sql
SELECT * FROM user_states WHERE user_id = 'YOUR_USER_ID';
-- Should show initialized state
```

---

### **Step 6: Install Frontend Dependencies** (2 min)

```bash
cd /Users/mahlerhutter/dev/projekte/MVPExtensio

# Fix npm cache (if needed)
sudo chown -R 501:20 "/Users/mahlerhutter/.npm"

# Install react-markdown
npm install react-markdown
```

---

### **Step 7: Test Chat** (5 min)

```bash
# Start dev server
npm run dev
```

**In Browser:**
1. Navigate to `/chat`
2. Send test messages:
   - "Hallo" (greeting)
   - "Ich habe 6h geschlafen" (state update)
   - "Soll ich heute trainieren?" (question)

**Expected Behavior:**
- ✅ Messages appear in UI
- ✅ Bot responds within 3 seconds
- ✅ Responses are empathetic and actionable
- ✅ Markdown rendering works
- ✅ Conversation history persists

**Check Database:**
```sql
-- Conversation history
SELECT * FROM conversation_history 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY created_at DESC;

-- User state (if state update was sent)
SELECT * FROM user_states 
WHERE user_id = 'YOUR_USER_ID';

-- State events (if state update was sent)
SELECT * FROM state_events 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY timestamp DESC;
```

---

## ✅ Success Criteria

- [ ] All 3 SQL migrations deployed
- [ ] All 3 Edge Functions deployed
- [ ] 28 canon entries seeded
- [ ] User state initialized
- [ ] Chat UI accessible at `/chat`
- [ ] Can send messages
- [ ] Bot responds with RAG-powered answers
- [ ] State updates work
- [ ] Conversation history persists

---

## 🐛 Troubleshooting

### **Issue: "canon_entries table is empty"**

**Solution:** Run seeding script (Step 4)

---

### **Issue: "ANTHROPIC_API_KEY not configured"**

**Solution:** Set secret in Supabase Dashboard (Step 2)

---

### **Issue: "Bot responses are generic"**

**Possible Causes:**
1. Canon entries not seeded
2. OpenAI API key not set (embeddings fail)
3. canon-api not working

**Solution:**
1. Verify canon entries: `SELECT COUNT(*) FROM canon_entries;`
2. Verify OpenAI key: Check Supabase secrets
3. Test canon-api: `curl ...`

---

### **Issue: "State updates don't work"**

**Possible Causes:**
1. state-api not deployed
2. User state not initialized

**Solution:**
1. Deploy state-api (Step 3)
2. Initialize user state (Step 5)

---

## 🚀 Next Steps

**After basic chat works:**

1. **Test RAG Quality:**
   - Ask domain-specific questions
   - Verify canon entries are used in responses
   - Check response relevance

2. **Test State Updates:**
   - "Ich habe 6h geschlafen"
   - Verify user_states table updates
   - Verify state_events logged

3. **Optimize Prompts:**
   - Improve empathy
   - Improve actionability
   - Improve conciseness

4. **Add Local LLM** (Week 4):
   - Install Ollama
   - Integrate Llama 3.2 3B
   - Route simple queries to local LLM

---

## 📚 Documentation

- **RAG Architecture:** `docs/RAG_CHAT_ARCHITECTURE.md`
- **Deployment Guide:** `docs/CHAT_DEPLOYMENT_GUIDE.md`
- **Phase 2 Quick Start:** `docs/RAG_PHASE2_QUICK_START.md`
- **Implementation Plan:** `docs/RAG_BACKEND_IMPLEMENTATION_PLAN.md`

---

**Status:** 🚀 Ready to Deploy!

**Last Updated:** 2026-02-08
