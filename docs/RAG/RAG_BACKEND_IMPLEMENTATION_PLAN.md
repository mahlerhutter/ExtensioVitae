# RAG Backend Implementation Plan
## Backend-First Approach (No Dashboard/UI)

**Version:** 1.0  
**Datum:** 8. Februar 2026  
**Status:** 🚧 In Planung

---

## 🎯 Zielsetzung

**Solides Backend aufbauen BEVOR wir Dashboard/UI anfassen.**

Wir implementieren die komplette RAG-Infrastruktur als **API-first Backend**, testbar via:
- ✅ SQL Queries (Supabase Dashboard)
- ✅ Edge Function Calls (curl/Postman)
- ✅ Automated Tests (Deno Test)
- ❌ **KEIN** Dashboard UI
- ❌ **KEINE** React Components

---

## 📊 Aktueller Stand (Phase 1 ✅ Complete)

### ✅ Was bereits existiert:

1. **SQL Migration 026** (`sql/migrations/026_rag_user_states.sql`)
   - `user_states` Tabelle (Dynamic State)
   - `state_events` Tabelle (Event Sourcing)
   - Helper Functions: `initialize_user_state()`, `record_state_event()`, `get_user_state_history()`

2. **Edge Function: `state-api`** (`supabase/functions/state-api/index.ts`)
   - Actions: `get_state`, `update_field`, `update_multiple`, `get_history`, `check_calibration`
   - Material Change Detection (Threshold-based)
   - Event Logging

3. **Wearable Integration** (Partial)
   - `sync-oura-data` Edge Function
   - `sync-whoop-data` Edge Function

---

## 🏗️ Backend Implementation Roadmap

### **Phase 2: Canon Knowledge Layer** (Week 2-3)
**Ziel:** Non-negotiable Longevity-Prinzipien als durchsuchbare Knowledge Base

#### 2.1 SQL Migration: Canon Entries
**File:** `sql/migrations/027_canon_knowledge_layer.sql`

```sql
CREATE TABLE canon_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    domain TEXT NOT NULL CHECK (domain IN (
        'sleep_regulation',
        'metabolic_health',
        'movement_hierarchy',
        'stress_nervous_system',
        'meaning_purpose'
    )),
    doctrine TEXT NOT NULL,
    mechanism TEXT NOT NULL,
    embedding vector(1536), -- OpenAI text-embedding-3-small
    
    applicability_conditions JSONB DEFAULT '{}'::jsonb,
    contraindications JSONB DEFAULT '[]'::jsonb,
    evidence_grade TEXT CHECK (evidence_grade IN ('S', 'A', 'B', 'C')),
    
    source_citations TEXT[] DEFAULT '{}',
    
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    retired_at TIMESTAMPTZ
);

-- Vector similarity search index
CREATE INDEX idx_canon_embedding ON canon_entries 
USING ivfflat (embedding vector_cosine_ops);

-- Domain filtering
CREATE INDEX idx_canon_domain ON canon_entries(domain) 
WHERE retired_at IS NULL;
```

#### 2.2 Edge Function: `canon-api`
**File:** `supabase/functions/canon-api/index.ts`

**Actions:**
- `create_entry`: Add new canon entry (admin only)
- `get_by_domain`: Retrieve all entries for a domain
- `semantic_search`: Vector similarity search
- `check_applicability`: Filter by user state conditions

**Example Request:**
```json
{
  "action": "semantic_search",
  "query": "How should I optimize sleep timing?",
  "user_state": {
    "sleep_debt": "moderate",
    "stress_load": "elevated"
  },
  "top_k": 5
}
```

#### 2.3 Seed Data Script
**File:** `scripts/seed-canon-entries.ts`

Populate 23-33 Canon Entries across 5 domains (from `RAG_DATENERHEBUNG.md`):
- 5-7 Sleep Regulation
- 5-7 Metabolic Health
- 5-7 Movement Hierarchy
- 5-7 Stress/Nervous System
- 3-5 Meaning/Purpose

**Test:**
```bash
deno run --allow-net --allow-env scripts/seed-canon-entries.ts
```

---

### **Phase 3: Contextual Knowledge Layer** (Week 3-4)
**Ziel:** Wissenschaftliche Studien, Protokolle, Mechanismen (conditional)

#### 3.1 SQL Migration: Contextual Entries
**File:** `sql/migrations/028_contextual_knowledge_layer.sql`

```sql
CREATE TABLE contextual_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    entry_type TEXT NOT NULL CHECK (entry_type IN ('study', 'protocol', 'mechanism', 'heuristic')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536),
    
    applicable_phases INTEGER[] DEFAULT '{}', -- 12-month phases
    applicable_constraints JSONB DEFAULT '{}'::jsonb,
    risk_profile TEXT CHECK (risk_profile IN ('low', 'moderate', 'high')),
    
    source_url TEXT,
    publication_year INTEGER,
    quality_score INTEGER CHECK (quality_score BETWEEN 1 AND 10),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contextual_embedding ON contextual_entries 
USING ivfflat (embedding vector_cosine_ops);

CREATE INDEX idx_contextual_quality ON contextual_entries(quality_score DESC);
```

#### 3.2 Edge Function: `contextual-api`
**File:** `supabase/functions/contextual-api/index.ts`

**Actions:**
- `semantic_search`: Vector search with state filtering
- `filter_by_phase`: Get entries for current 12-month phase
- `filter_by_constraints`: Match user constraints (injury, travel, etc.)

**Example Request:**
```json
{
  "action": "semantic_search",
  "query": "HIIT training protocols for elevated stress",
  "user_state": {
    "stress_load": "elevated",
    "recovery_state": "moderate",
    "current_phase": 3
  },
  "entry_types": ["protocol", "heuristic"],
  "top_k": 10
}
```

#### 3.3 Content Curation Pipeline
**File:** `scripts/curate-contextual-entries.ts`

**LLM-Assisted Curation:**
1. Fetch PubMed abstracts via API
2. Summarize with Claude 3.5 Sonnet (3-5 sentences)
3. Generate embeddings (OpenAI `text-embedding-3-small`)
4. Store in `contextual_entries`

**Target:** 75-115 Entries
- 30-50 Studies
- 20-30 Protocols
- 15-20 Mechanisms
- 10-15 Heuristics

---

### **Phase 4: Temporal Layer (12-Month Blueprint)** (Week 4-5)
**Ziel:** Sequenzierung + Forbidden Actions pro Phase

#### 4.1 SQL Migration: Temporal Blueprints
**File:** `sql/migrations/029_temporal_blueprints.sql`

```sql
CREATE TABLE temporal_blueprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    
    phase_number INTEGER CHECK (phase_number BETWEEN 1 AND 12),
    phase_name TEXT NOT NULL,
    phase_start_date DATE NOT NULL,
    phase_end_date DATE NOT NULL,
    
    active_focus_block TEXT NOT NULL,
    forbidden_actions TEXT[] DEFAULT '{}',
    deferred_actions JSONB DEFAULT '[]'::jsonb,
    
    -- Phase Override Logic (NEW)
    override_conditions JSONB DEFAULT '[]'::jsonb,
    -- Example: [{"if": {"sleep_debt": "severe"}, "then": {"force_phase": 1}}]
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_temporal_user_date ON temporal_blueprints(user_id, phase_start_date);
```

#### 4.2 Edge Function: `temporal-api`
**File:** `supabase/functions/temporal-api/index.ts`

**Actions:**
- `get_current_phase`: Retrieve active phase for user
- `check_action_allowed`: Validate if action is forbidden
- `get_deferred_actions`: List actions deferred to future phases
- `apply_override`: Force phase change based on state (e.g., severe sleep debt → Phase 1)

**Example Request:**
```json
{
  "action": "check_action_allowed",
  "user_id": "uuid-123",
  "proposed_action": "HIIT Training"
}

// Response:
{
  "allowed": false,
  "reason": "HIIT Training is forbidden in Phase 1 (Foundation: Sleep Architecture)",
  "deferred_to_phase": 3,
  "current_phase": 1
}
```

#### 4.3 Seed Data: 12-Month Template
**File:** `scripts/seed-temporal-blueprint.ts`

Populate 12 phases with:
- Phase Names
- Focus Blocks
- Forbidden Actions
- Deferred Actions

---

### **Phase 5: State Hydration Loop** (Week 5-6)
**Ziel:** Wearable Data → State Updates → Material Change Detection

#### 5.1 Edge Function: `state-hydration`
**File:** `supabase/functions/state-hydration/index.ts`

**Workflow:**
1. **Triggered by:** Wearable webhook (Oura/Whoop)
2. **Fetch:** Latest wearable data
3. **Calculate:** Aggregated metrics (7-day avg, 30-day baseline)
4. **Update:** `user_states` via `state-api`
5. **Detect:** Material changes
6. **Trigger:** Decision re-evaluation (if material)

**Example Flow:**
```
Oura Webhook → state-hydration → Calculate HRV 7-day avg
→ Update user_states.hrv_7day_avg
→ Detect: HRV dropped 18% (material change!)
→ Set triggered_reevaluation = true
→ (Later: Decision Engine generates new plan)
```

#### 5.2 Wearable Data Aggregation
**File:** `supabase/functions/state-hydration/aggregators.ts`

**Functions:**
- `calculateSleep7DayAvg(userId)`
- `calculateHRV30DayBaseline(userId)`
- `calculateRecoveryScore(userId)` (from RAG_DATENERHEBUNG.md formula)
- `detectSleepDebt(userId)`
- `detectStressLoad(userId)`

#### 5.3 Cron Job Setup
**File:** `supabase/functions/state-hydration/cron.ts`

**Schedule:**
- **Daily 06:00 UTC:** Hydrate all user states from wearable data
- **Hourly:** Check for new wearable webhooks

**Supabase Cron:**
```sql
SELECT cron.schedule(
  'daily-state-hydration',
  '0 6 * * *', -- Every day at 6 AM UTC
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/state-hydration',
    headers := '{"Authorization": "Bearer SERVICE_ROLE_KEY"}'::jsonb,
    body := '{"action": "hydrate_all"}'::jsonb
  );
  $$
);
```

---

### **Phase 6: Decision Synthesis Engine** (Week 6-8)
**Ziel:** RAG-basierte Entscheidungsgenerierung (LLM)

#### 6.1 SQL Migration: Active Decisions
**File:** `sql/migrations/030_active_decisions.sql`

```sql
CREATE TABLE active_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    
    -- Decision Output (Response Contract)
    decision_data JSONB NOT NULL,
    -- {
    --   "decision": "Prioritize sleep consistency for 14 days...",
    --   "why_now": "Your HRV dropped 18% below baseline...",
    --   "cost_of_decision": "You must skip HIIT sessions...",
    --   "next_14_days_action": "1. Go to bed at 22:30 every night..."
    -- }
    
    -- Context Snapshots
    state_snapshot JSONB NOT NULL,
    temporal_context JSONB NOT NULL,
    canon_entries_used UUID[] DEFAULT '{}',
    contextual_entries_used UUID[] DEFAULT '{}',
    
    -- LLM Metadata
    llm_model TEXT, -- e.g. 'claude-sonnet-4-20250514'
    llm_prompt_tokens INTEGER,
    llm_completion_tokens INTEGER,
    generation_latency_ms INTEGER,
    
    -- User Interaction
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    superseded_at TIMESTAMPTZ,
    user_dismissed_at TIMESTAMPTZ,
    user_feedback_rating INTEGER CHECK (user_feedback_rating BETWEEN 1 AND 5)
);

CREATE INDEX idx_active_decisions_latest ON active_decisions(user_id, generated_at DESC)
WHERE superseded_at IS NULL AND user_dismissed_at IS NULL;
```

#### 6.2 Edge Function: `decision-engine`
**File:** `supabase/functions/decision-engine/index.ts`

**Workflow:**
1. **Triggered by:** Material state change OR manual request
2. **Fetch Context:**
   - Current `user_states`
   - Current `temporal_blueprint` phase
   - Relevant `canon_entries` (semantic search)
   - Relevant `contextual_entries` (filtered by state + phase)
3. **Build Prompt:**
   - System Prompt: "You are a longevity decision engine..."
   - User State Context
   - Canon Principles
   - Contextual Knowledge
   - Temporal Constraints
4. **LLM Call:** Claude 3.5 Sonnet (Anthropic API)
5. **Store Decision:** Insert into `active_decisions`
6. **Return:** Decision JSON

**Example Request:**
```json
{
  "action": "generate_decision",
  "user_id": "uuid-123",
  "trigger": "material_change",
  "changed_fields": ["hrv_rmssd_current", "stress_load"]
}
```

**Example Response:**
```json
{
  "decision": "Prioritize nervous system recovery for the next 14 days.",
  "why_now": "Your HRV dropped 18% below your 30-day baseline (from 55ms to 45ms), and your stress load shifted from 'baseline' to 'elevated'. This indicates sympathetic dominance.",
  "cost_of_decision": "You must pause HIIT training and reduce training volume by 30%. Social commitments after 21:00 should be minimized.",
  "next_14_days_action": "1. Practice box breathing (4-4-4-4) for 5 minutes, twice daily.\n2. Go to bed at 22:30 every night.\n3. Replace HIIT with zone 2 cardio (30 min walks).\n4. Track HRV daily to monitor recovery.",
  "canon_entries_used": ["uuid-canon-1", "uuid-canon-2"],
  "contextual_entries_used": ["uuid-ctx-1", "uuid-ctx-2", "uuid-ctx-3"]
}
```

#### 6.3 Prompt Engineering
**File:** `supabase/functions/decision-engine/prompts.ts`

**System Prompt Template:**
```typescript
const SYSTEM_PROMPT = `
You are a longevity decision engine for ExtensioVitae.

Your role:
- Synthesize user state, canon principles, and contextual knowledge
- Generate actionable 14-day decisions
- Explain WHY NOW (urgency) and COST (tradeoffs)
- Follow temporal constraints (forbidden actions)

Response Format (JSON):
{
  "decision": "One-sentence decision",
  "why_now": "2-3 sentences explaining urgency",
  "cost_of_decision": "What user must sacrifice",
  "next_14_days_action": "Numbered list of 3-5 actions"
}
`;
```

---

## 🧪 Testing Strategy (Backend-Only)

### **Unit Tests** (Deno Test)
**File:** `supabase/functions/_tests/`

```bash
# Test state-api
deno test supabase/functions/state-api/test.ts

# Test canon-api
deno test supabase/functions/canon-api/test.ts

# Test decision-engine
deno test supabase/functions/decision-engine/test.ts
```

### **Integration Tests** (SQL + Edge Functions)
**File:** `tests/integration/rag-workflow.test.ts`

**Test Flow:**
1. Create test user
2. Initialize `user_states`
3. Simulate wearable data → `state-hydration`
4. Verify material change detection
5. Trigger `decision-engine`
6. Verify decision stored in `active_decisions`

### **Manual Testing** (curl)
**File:** `docs/RAG_API_TESTING.md`

```bash
# 1. Get current state
curl -X POST 'https://your-project.supabase.co/functions/v1/state-api' \
  -H 'Authorization: Bearer ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"action": "get_state", "user_id": "uuid-123"}'

# 2. Update HRV (trigger material change)
curl -X POST 'https://your-project.supabase.co/functions/v1/state-api' \
  -H 'Authorization: Bearer ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "update_field",
    "user_id": "uuid-123",
    "field": "hrv_rmssd_current",
    "new_value": 45,
    "source": "biosync_hrv"
  }'

# 3. Generate decision
curl -X POST 'https://your-project.supabase.co/functions/v1/decision-engine' \
  -H 'Authorization: Bearer ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "generate_decision",
    "user_id": "uuid-123",
    "trigger": "material_change"
  }'
```

---

## 📋 Implementation Checklist

### **Phase 2: Canon Knowledge Layer** (Week 2-3)
- [ ] SQL Migration: `027_canon_knowledge_layer.sql`
- [ ] Edge Function: `canon-api` (create, search, filter)
- [ ] Seed Script: `seed-canon-entries.ts` (23-33 entries)
- [ ] Tests: Unit tests for semantic search
- [ ] Docs: API documentation

### **Phase 3: Contextual Knowledge Layer** (Week 3-4)
- [ ] SQL Migration: `028_contextual_knowledge_layer.sql`
- [ ] Edge Function: `contextual-api` (search, filter by phase/constraints)
- [ ] Curation Script: `curate-contextual-entries.ts` (75-115 entries)
- [ ] Tests: Integration tests for filtering logic
- [ ] Docs: Curation workflow

### **Phase 4: Temporal Layer** (Week 4-5)
- [ ] SQL Migration: `029_temporal_blueprints.sql`
- [ ] Edge Function: `temporal-api` (phase management, override logic)
- [ ] Seed Script: `seed-temporal-blueprint.ts` (12 phases)
- [ ] Tests: Override condition tests
- [ ] Docs: Phase definitions

### **Phase 5: State Hydration Loop** (Week 5-6)
- [ ] Edge Function: `state-hydration` (wearable → state updates)
- [ ] Aggregation Functions: Sleep/HRV/Recovery calculations
- [ ] Cron Job: Daily hydration schedule
- [ ] Tests: End-to-end wearable → state flow
- [ ] Docs: Wearable integration guide

### **Phase 6: Decision Synthesis Engine** (Week 6-8)
- [ ] SQL Migration: `030_active_decisions.sql`
- [ ] Edge Function: `decision-engine` (RAG + LLM)
- [ ] Prompt Templates: System + user prompts
- [ ] Tests: Decision quality validation
- [ ] Docs: Decision contract specification

---

## 🚀 Deployment Strategy

### **Week-by-Week Rollout:**

**Week 2-3:** Canon Layer
```bash
# Deploy migration
psql -h db.your-project.supabase.co -U postgres -f sql/migrations/027_canon_knowledge_layer.sql

# Deploy Edge Function
npx supabase functions deploy canon-api

# Seed data
deno run --allow-net --allow-env scripts/seed-canon-entries.ts
```

**Week 3-4:** Contextual Layer
```bash
psql -f sql/migrations/028_contextual_knowledge_layer.sql
npx supabase functions deploy contextual-api
deno run scripts/curate-contextual-entries.ts
```

**Week 4-5:** Temporal Layer
```bash
psql -f sql/migrations/029_temporal_blueprints.sql
npx supabase functions deploy temporal-api
deno run scripts/seed-temporal-blueprint.ts
```

**Week 5-6:** State Hydration
```bash
npx supabase functions deploy state-hydration
# Setup cron job in Supabase Dashboard
```

**Week 6-8:** Decision Engine
```bash
psql -f sql/migrations/030_active_decisions.sql
npx supabase functions deploy decision-engine
```

---

## 🎯 Success Criteria (Backend-Only)

**Phase 2-6 is complete when:**

✅ All SQL migrations run without errors  
✅ All Edge Functions deploy successfully  
✅ All seed scripts populate data  
✅ Unit tests pass (>90% coverage)  
✅ Integration tests pass (end-to-end RAG workflow)  
✅ Manual curl tests verify API contracts  
✅ Decision Engine generates valid JSON responses  
✅ State Hydration Loop runs daily via cron  

**WITHOUT:**
❌ Any React components  
❌ Any Dashboard UI  
❌ Any frontend integration  

---

## 📚 Documentation Deliverables

1. **API Reference:** `docs/RAG_API_REFERENCE.md`
   - All Edge Function endpoints
   - Request/Response schemas
   - Error codes

2. **Testing Guide:** `docs/RAG_API_TESTING.md`
   - curl examples for all endpoints
   - Integration test scenarios

3. **Deployment Runbook:** `docs/RAG_DEPLOYMENT_RUNBOOK.md`
   - Step-by-step deployment instructions
   - Rollback procedures

4. **Knowledge Curation Guide:** `docs/RAG_KNOWLEDGE_CURATION.md`
   - How to add Canon Entries
   - How to curate Contextual Entries
   - LLM summarization workflow

---

## 🔄 Next Steps After Backend Complete

**Only AFTER all 6 phases are deployed and tested:**

1. **Frontend Integration** (Week 9-10)
   - React hooks for RAG APIs
   - Dashboard components
   - Real-time decision display

2. **User Testing** (Week 11-12)
   - Beta users
   - Feedback collection
   - Decision quality metrics

3. **ML Training** (Week 13+)
   - Export `active_decisions` + `user_feedback_rating`
   - Train decision quality classifier
   - Deploy as Edge Function

---

**Fragen? Nächste Schritte?**

Sollen wir mit **Phase 2 (Canon Knowledge Layer)** starten?
