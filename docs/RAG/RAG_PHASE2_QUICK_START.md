# RAG Phase 2 - Quick Deployment Checklist

**Status:** 🚧 Ready to Deploy  
**Date:** 2026-02-08

---

## ✅ Files Created

- [x] `sql/migrations/026_rag_user_states.sql` - User States & Event Sourcing
- [x] `sql/migrations/027_canon_knowledge_layer.sql` - Canon Knowledge Layer
- [x] `supabase/functions/state-api/index.ts` - State API Edge Function
- [x] `supabase/functions/canon-api/index.ts` - Canon API Edge Function
- [x] `scripts/seed-canon-entries.ts` - Seed 33 Canon Entries
- [x] `scripts/deploy-rag-phase2.sh` - Deployment Script
- [x] `docs/RAG_PHASE2_DEPLOYMENT.md` - Full Deployment Guide
- [x] `docs/RAG_BACKEND_IMPLEMENTATION_PLAN.md` - Overall Backend Plan

---

## 🚀 Deployment Steps (Manual)

### **1. Deploy SQL Migrations** (5 minutes)

**Supabase Dashboard:** https://supabase.com/dashboard/project/qnjjusilviwvovrlunep/sql/new

**Migration 026:**
```bash
# Copy contents of:
cat sql/migrations/026_rag_user_states.sql

# Paste into Supabase SQL Editor → Run
```

**Migration 027:**
```bash
# Copy contents of:
cat sql/migrations/027_canon_knowledge_layer.sql

# Paste into Supabase SQL Editor → Run
```

**Verify:**
```sql
-- Should return: user_states, state_events, canon_entries
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('user_states', 'state_events', 'canon_entries');
```

---

### **2. Deploy Edge Functions** (3 minutes)

**Option A: Via Supabase Dashboard**
1. Go to: https://supabase.com/dashboard/project/qnjjusilviwvovrlunep/functions
2. Click "Deploy new function"
3. Upload `supabase/functions/state-api/index.ts`
4. Repeat for `canon-api`

**Option B: Via CLI (if permissions work)**
```bash
cd /Users/mahlerhutter/dev/projekte/MVPExtensio

# Try deployment script
./scripts/deploy-rag-phase2.sh
```

---

### **3. Set Environment Variables** (2 minutes)

**Supabase Dashboard:** https://supabase.com/dashboard/project/qnjjusilviwvovrlunep/settings/functions

Add:
- **Name:** `OPENAI_API_KEY`
- **Value:** `sk-...` (from your `.env` file)

---

### **4. Seed Canon Entries** (2 minutes)

```bash
cd /Users/mahlerhutter/dev/projekte/MVPExtensio

# Run seed script
deno run --allow-net --allow-env scripts/seed-canon-entries.ts
```

**Expected Output:**
```
🌱 Starting Canon Entries Seed Script...
📝 Creating: [sleep_regulation] Sleep timing consistency...
   ✅ Created (ID: uuid-1)
...
✅ Successful: 33
```

---

### **5. Test Deployment** (5 minutes)

**Get your ANON_KEY from `.env`:**
```bash
grep VITE_SUPABASE_ANON_KEY .env
```

**Test 1: Canon API - Get Stats**
```bash
curl -X POST 'https://qnjjusilviwvovrlunep.supabase.co/functions/v1/canon-api' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"action": "get_stats"}'
```

**Expected Response:**
```json
{
  "success": true,
  "stats": {
    "total": 33,
    "by_domain": {
      "sleep_regulation": 7,
      "metabolic_health": 7,
      "movement_hierarchy": 7,
      "stress_nervous_system": 7,
      "meaning_purpose": 5
    }
  }
}
```

**Test 2: Canon API - Semantic Search**
```bash
curl -X POST 'https://qnjjusilviwvovrlunep.supabase.co/functions/v1/canon-api' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "semantic_search",
    "query": "How should I optimize my sleep?",
    "top_k": 3
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "domain": "sleep_regulation",
      "doctrine": "Sleep timing consistency matters more than sleep duration.",
      "similarity": 0.87
    },
    ...
  ]
}
```

---

## 🎯 Success Criteria

Phase 2 deployment is complete when:

- [ ] Migration 026 runs without errors
- [ ] Migration 027 runs without errors
- [ ] `state-api` Edge Function is deployed
- [ ] `canon-api` Edge Function is deployed
- [ ] `OPENAI_API_KEY` environment variable is set
- [ ] 33 Canon Entries are seeded
- [ ] `get_stats` API call returns `total: 33`
- [ ] `semantic_search` API call returns relevant results

---

## 🐛 Troubleshooting

### **Problem: "pgvector extension not found"**

**Solution:**
```sql
-- Run in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS vector;
```

### **Problem: "OPENAI_API_KEY not set"**

**Solution:** Add to Edge Function environment variables in Supabase Dashboard.

### **Problem: Seed script fails**

**Possible causes:**
1. Edge Function not deployed → Deploy `canon-api` first
2. OpenAI API key invalid → Check `.env` file
3. Network timeout → Retry with longer timeout

---

## 📚 Next Steps

After Phase 2 is deployed:

1. **Verify all tests pass** (see Testing section above)
2. **Review deployment guide:** `docs/RAG_PHASE2_DEPLOYMENT.md`
3. **Plan Phase 3:** Contextual Knowledge Layer (Studies, Protocols, Mechanisms)

---

## 📝 Notes

- All SQL migrations have `IF NOT EXISTS` clauses → Safe to re-run
- Edge Functions can be redeployed without data loss
- Seed script checks for duplicates → Safe to re-run
- Total deployment time: ~15-20 minutes

---

**Questions?** Check:
- `docs/RAG_BACKEND_IMPLEMENTATION_PLAN.md` - Overall strategy
- `docs/RAG_PHASE2_DEPLOYMENT.md` - Detailed deployment guide
- `docs/RAG_DATENERHEBUNG.md` - Data structure reference
