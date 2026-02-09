# 🧠 RAG + Chat Documentation

**Last Updated:** 2026-02-09  
**Status:** Production-Ready Architecture

---

## 📁 Folder Structure

```
docs/rag/
├── README.md                           ← This file
├── canon.md                            ← 28 Longevity Principles (Source of Truth)
│
├── ARCHITECTURE.md                     ← RAG-First + Hybrid LLM Architecture
├── QUICK_START.md                      ← 30-min Deployment Guide
├── DEPLOYMENT_GUIDE.md                 ← Detailed Deployment Instructions
│
├── BACKEND_IMPLEMENTATION_PLAN.md      ← RAG Backend Implementation Plan
├── PHASE2_QUICK_START.md               ← Phase 2 Quick Start (Legacy)
├── BACKEND_PROMPT.md                   ← Chat Backend Prompt (Legacy)
└── WEEK1_SUMMARY.md                    ← Week 1 Summary (Legacy)
```

---

## 🎯 Quick Navigation

### **Getting Started**
1. **Read First:** [`ARCHITECTURE.md`](./RAG_CHAT_ARCHITECTURE.md) - Understand the system
2. **Deploy:** [`QUICK_START.md`](./RAG_CHAT_QUICK_START.md) - 30-min setup guide
3. **Troubleshoot:** [`DEPLOYMENT_GUIDE.md`](./CHAT_DEPLOYMENT_GUIDE.md) - Detailed help

### **Knowledge Base**
- **Canon Entries:** [`canon.md`](./canon.md) - 28 longevity principles
- **Implementation Plan:** [`BACKEND_IMPLEMENTATION_PLAN.md`](./RAG_BACKEND_IMPLEMENTATION_PLAN.md)

### **Legacy Docs** (Historical Reference)
- [`PHASE2_QUICK_START.md`](./RAG_PHASE2_QUICK_START.md)
- [`BACKEND_PROMPT.md`](./CHAT_BACKEND_PROMPT.md)
- [`WEEK1_SUMMARY.md`](./CHAT_WEEK1_SUMMARY.md)

---

## 🏗️ Architecture Overview

```
User Message
    ↓
┌─────────────────────────────────────────────────────┐
│  TIER 1: Intent Classification (Local LLM)          │
│  - greeting / farewell (70% of queries)             │
│  - simple_question                                  │
│  - complex_question (30% of queries)                │
│  - state_update                                     │
└─────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────┐
│  TIER 2: RAG Retrieval (Always)                     │
│  1. Semantic Search (canon_entries) → Top 3-5       │
│  2. User State Lookup (user_states)                 │
│  3. Conversation History (last 5 messages)          │
│  4. Applicability Filtering (user state matching)   │
└─────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────┐
│  TIER 3: Response Generation (Hybrid LLM)           │
│                                                      │
│  IF simple query:                                   │
│    → Local LLM (Llama 3.2 3B via Ollama)           │
│    → <500ms, Free, Privacy                         │
│                                                      │
│  IF complex query:                                  │
│    → Cloud LLM (Claude 3.5 Sonnet)                  │
│    → High quality, Empathetic, Nuanced              │
└─────────────────────────────────────────────────────┘
    ↓
Save to conversation_history
    ↓
Return to User
```

---

## 📊 Key Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Canon Entries | 28 | 28 |
| RAG Relevance | >90% | TBD |
| Response Time (Simple) | <500ms | TBD |
| Response Time (Complex) | <3s | TBD |
| Cost per 1000 messages | <$2 | $3.90 |
| Local LLM Usage | 70% | 0% |

---

## 🚀 Quick Start

```bash
# 1. Seed Canon Entries
node scripts/seed-canon-from-md.js

# 2. Test Semantic Search
curl -X POST 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/canon-api' \
  -d '{"action": "semantic_search", "query": "Schlaf optimieren", "top_k": 3}'

# 3. Test Chat
npm run dev
# Navigate to /chat
# Send: "Ich habe 6h geschlafen"

# 4. (Week 4) Install Ollama
brew install ollama
ollama serve
ollama pull llama3.2:3b
```

---

## 🧩 Components

### **Database Tables**
- `user_states` - Current user biological state
- `state_events` - Event sourcing for state changes
- `canon_entries` - 28 longevity principles with embeddings
- `conversation_history` - Chat messages

### **Edge Functions**
- `state-api` - User state management
- `canon-api` - Canon knowledge retrieval
- `chat-api` - Chat logic + RAG

### **Frontend**
- `src/pages/ChatPage.jsx` - Chat UI
- `src/pages/ChatPage.css` - Styling

### **Scripts**
- `scripts/seed-canon-from-md.js` - Canon seeding

---

## 📚 Canon Domains

| Domain | Entries | ID Range |
|--------|---------|----------|
| **Sleep Regulation** | 6 | CANON-SLEEP-001 – 006 |
| **Metabolic Health** | 6 | CANON-META-001 – 006 |
| **Movement Hierarchy** | 6 | CANON-MOVE-001 – 006 |
| **Stress & Nervous System** | 5 | CANON-STRESS-001 – 005 |
| **Meaning & Purpose** | 5 | CANON-MEAN-001 – 005 |

**Total:** 28 entries

---

## 🎯 Roadmap

### **Phase 1: RAG Optimization** (Week 3) ✅
- [x] Seed canon entries
- [x] Test semantic search
- [x] Implement applicability filtering
- [x] Test end-to-end chat

### **Phase 2: Local LLM Integration** (Week 4) 🚧
- [ ] Install Ollama
- [ ] Integrate Llama 3.2 3B
- [ ] Implement routing logic
- [ ] Measure cost savings

### **Phase 3: Advanced RAG** (Week 5-6) 📋
- [ ] Add contextual knowledge layer
- [ ] Implement citation system
- [ ] Add feedback loop

---

## 🐛 Common Issues

### **"canon_entries table is empty"**
→ Run: `node scripts/seed-canon-from-md.js`

### **"ANTHROPIC_API_KEY not configured"**
→ Set in Supabase Dashboard: Settings → Edge Functions → Secrets

### **"Bot responses are generic"**
→ Verify canon entries seeded + OpenAI API key set

---

## 📖 Further Reading

- **Vision:** `../VISION.md` - Product strategy
- **Future:** `../FUTURE.md` - Roadmap
- **Tasks:** `../tasks.md` - Implementation tasks

---

**Status:** 🚀 Production-Ready

**Maintainer:** Mahler Hutter  
**Last Updated:** 2026-02-09
