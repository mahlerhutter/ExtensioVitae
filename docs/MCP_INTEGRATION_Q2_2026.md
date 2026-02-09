# 🔌 MCP Integration Roadmap — Q2 2026

**Status:** 📋 Planned (Post-Beta Validation)  
**Timeline:** Q2 2026 (April - June)  
**Prerequisites:** Beta validation complete, PMF confirmed  
**Decision Gate:** End of Q1 2026

---

## 🎯 Strategic Context: Why MCP?

### Current State (v0.6.4)
- ✅ Edge Functions handle heavy computation (Plan Gen, Recovery Scoring, Lab Parsing)
- ⚠️ LLM prompts manually serialize context (biomarkers, wearables, activity history)
- ⚠️ No standardized protocol for context injection
- ⚠️ ~1500 tokens overhead per LLM call for context

### MCP Opportunity
**Model Context Protocol** provides **structured, reusable context** for LLM operations without manual serialization overhead.

**Key Benefits:**
- 🚀 **Performance:** ~75% reduction in context serialization time (200ms → 50ms)
- 💰 **Cost:** ~47% reduction in LLM token overhead (1500 → 800 tokens)
- 🎯 **Personalization:** Structured access to historical data improves plan quality
- 🔧 **Maintainability:** Centralized context logic (not scattered across Edge Functions)

---

## 🎯 Three High-Leverage Use Cases

### 1. **Lab Report Intelligence** 🧬
**Integration Point:** `parse-lab-report` Edge Function

**MCP Server:** `biomarker-intelligence`

#### Resources
- Lab PDFs (user uploads from `lab_results` table)
- Reference ranges (age/sex-specific LOINC standards)
- Biomarker ontology (clinical significance database)
- Trend analysis (historical lab data)

#### Tools
```typescript
parse_lab_pdf(file: PDF) → StructuredBiomarkers
  // OCR + LLM extraction → standardized format

interpret_biomarker(marker: string, value: number, context: UserProfile) → Interpretation
  // Clinical significance + personalized context

suggest_interventions(out_of_range: Biomarker[]) → Protocol[]
  // Protocol recommendations based on lab results

compare_baseline(marker: string, timeframe: number) → TrendAnalysis
  // Historical trend analysis
```

#### Prompts
```
"Analyze {biomarker} trend over {timeframe}"
"Suggest interventions for {out_of_range_markers}"
"Explain clinical significance of {marker} = {value} for {age}/{sex}"
```

#### Value Proposition
- ✅ Eliminates manual context serialization for lab interpretation
- ✅ Standardized biomarker knowledge base (reusable across users)
- ✅ Automatic protocol suggestions based on lab results
- ✅ Reduces lab interpretation time from ~45s → ~8s

**Implementation Timeline:** Week 1-2 of Q2 2026

---

### 2. **Wearable Data Context** ⌚
**Integration Point:** `calculate-recovery-score`, `get-adjusted-tasks` Edge Functions

**MCP Server:** `recovery-context`

#### Resources
- 30-day HRV baseline (from `wearable_data` partitioned table)
- Sleep patterns (duration, quality, REM/Deep phases)
- RHR trends (resting heart rate)
- Activity load (training stress balance)
- Recovery baselines (from `user_recovery_baseline` materialized view)

#### Tools
```typescript
get_recovery_state(userId: string, days: number) → RecoveryState
  // Current readiness score (0-100) with historical context

predict_readiness(userId: string, forecast_days: number) → ReadinessForecast
  // 7-day readiness prediction based on trends

suggest_deload(userId: string) → DeloadRecommendation
  // Overtraining detection + recovery protocol

compare_cohort(userId: string, metric: string) → CohortComparison
  // Peer benchmarking (anonymized)
```

#### Prompts
```
"Should I train today based on my last 7 days?"
"When should I schedule my next HIIT session?"
"Am I overtraining? Suggest recovery protocol."
```

#### Value Proposition
- ✅ `planBuilder.js` accesses historical trends without manual queries
- ✅ Real-time context for NextBestAction recommendations
- ✅ Predictive insights (not just reactive)
- ✅ Enables **Auto-Plan Renewal** (Horizon 2 goal)

**Implementation Timeline:** Week 3-4 of Q2 2026

---

### 3. **Smart Log & Activity Memory** 📝
**Integration Point:** `smart-log` Edge Function

**MCP Server:** `activity-memory`

#### Resources
- User activity history (`smart_log` table)
- Completion patterns (`task_completions` partitioned table)
- Feedback data (user ratings, notes from `feedback` table)
- Contextual metadata (time, location, mood)

#### Tools
```typescript
log_activity(userId: string, activity: Activity) → LogEntry
  // Structured activity capture with metadata

retrieve_similar_activities(userId: string, context: string) → Activity[]
  // Pattern matching based on context (time, mood, location)

suggest_next(userId: string, current_state: State) → Recommendation
  // Contextual recommendations based on history

analyze_adherence(userId: string, timeframe: number) → AdherenceInsights
  // Behavioral pattern analysis
```

#### Prompts
```
"What did I do last time I felt this way?"
"What's the best time for me to do {task}?"
"Why do I skip {task} on Mondays?"
```

#### Value Proposition
- ✅ Contextual memory for **AI Coach** (Horizon 2)
- ✅ Auto-Plan Renewal based on historical performance
- ✅ Situational protocol triggers (**NextBestAction v2**)
- ✅ Enables "memory" for conversational AI features

**Implementation Timeline:** Week 5-6 of Q2 2026

---

## 🏗️ Technical Architecture

### MCP Server Stack
```
supabase/functions/mcp-servers/
├── biomarker-intelligence/
│   ├── index.ts          # MCP server entry point
│   ├── resources.ts      # Lab PDFs, reference ranges
│   ├── tools.ts          # parse, interpret, suggest
│   └── prompts.ts        # Template library
├── recovery-context/
│   ├── index.ts
│   ├── resources.ts      # Wearable data queries
│   ├── tools.ts          # Recovery calculations
│   └── prompts.ts
└── activity-memory/
    ├── index.ts
    ├── resources.ts      # Activity history
    ├── tools.ts          # Pattern matching
    └── prompts.ts
```

### Integration Pattern (Example)
```javascript
// src/lib/planBuilder.js with MCP
import { MCPClient } from '@modelcontextprotocol/sdk';

const buildPersonalizedPlan = async (userId) => {
  const mcpClient = new MCPClient({
    servers: [
      'recovery-context',
      'activity-memory'
    ]
  });

  // MCP automatically provides structured context
  const recoveryState = await mcpClient.callTool(
    'recovery-context',
    'get_recovery_state',
    { userId, days: 30 }
  );

  const activityPatterns = await mcpClient.callTool(
    'activity-memory',
    'retrieve_similar_activities',
    { userId, context: 'morning_routine' }
  );

  // LLM prompt with MCP-injected context
  const plan = await generatePlan({
    userId,
    mcpContext: {
      recovery: recoveryState,
      patterns: activityPatterns
    }
  });

  return plan;
};
```

### Authentication & Security
```typescript
// MCP Server Auth (Supabase RLS integration)
const mcpServer = new MCPServer({
  name: 'recovery-context',
  version: '1.0.0',
  auth: {
    type: 'supabase',
    validateToken: async (token) => {
      const { data: { user } } = await supabase.auth.getUser(token);
      return user;
    }
  }
});
```

---

## 📊 Success Metrics (Q2 2026)

| Metric | Baseline (v0.6.4) | Target (Q2) | Measurement |
|--------|-------------------|-------------|-------------|
| **Context Serialization Time** | ~200ms (manual) | ~50ms (MCP) | Edge Function logs |
| **LLM Token Overhead** | ~1500 tokens | ~800 tokens | OpenAI API logs |
| **Plan Personalization Score** | 7.2/10 | 8.5/10 | User feedback |
| **Auto-Plan Renewal Accuracy** | N/A | >75% acceptance | User activation rate |
| **Lab Interpretation Time** | ~45s (manual) | ~8s (MCP) | Edge Function latency |
| **NextBestAction Relevance** | 6.8/10 | 8.2/10 | User ratings |

---

## 🚧 Prerequisites

### Before MCP Integration (End of Q1 2026)
- [ ] **Beta validation complete** (>40% 7-day retention)
- [ ] **Product-Market-Fit confirmed** in DACH market
- [ ] **Edge Functions stable** (>99.5% uptime)
- [ ] **Smart Log deployed and validated** (>60% daily usage)
- [ ] **Critical Path hardened** (zero white-screen crashes)

### Technical Requirements
- [ ] **MCP SDK integration** (`@modelcontextprotocol/sdk`)
- [ ] **Authentication layer** (MCP server access control via Supabase RLS)
- [ ] **Monitoring** (MCP request/response logging in PostHog)
- [ ] **Error handling** (fallback to manual context if MCP unavailable)
- [ ] **Documentation** (MCP server API specs)

---

## 🎯 Decision Gate (End of Q1 2026)

### GO Criteria ✅
- ✅ **10+ beta users** with >40% 7-day retention
- ✅ **Critical Path stable** (zero white-screen crashes for 14 days)
- ✅ **Smart Log validated** (>60% daily usage)
- ✅ **Edge Functions proven reliable** (>99.5% uptime)
- ✅ **Team bandwidth available** (no critical bugs in backlog)

### NO-GO Criteria ❌
- ❌ **Retention <30%** (PMF not proven)
- ❌ **Critical bugs in production** (stability issues)
- ❌ **Resource constraints** (team bandwidth insufficient)
- ❌ **User feedback negative** (feature not requested)

---

## 📅 Implementation Timeline (6 Weeks)

### Week 1-2: Lab Report Intelligence
- [ ] Set up MCP SDK in Supabase Edge Functions
- [ ] Build `biomarker-intelligence` server
- [ ] Integrate with `parse-lab-report` Edge Function
- [ ] Test with 5 real lab reports
- [ ] Deploy to staging

### Week 3-4: Wearable Data Context
- [ ] Build `recovery-context` server
- [ ] Integrate with `calculate-recovery-score` Edge Function
- [ ] Connect to `planBuilder.js` for Auto-Plan Renewal
- [ ] Test with 30-day wearable data
- [ ] Deploy to staging

### Week 5-6: Smart Log & Activity Memory
- [ ] Build `activity-memory` server
- [ ] Integrate with `smart-log` Edge Function
- [ ] Connect to NextBestAction engine
- [ ] Test with historical activity data
- [ ] Deploy to production (phased rollout)

### Week 7: Monitoring & Optimization
- [ ] Set up PostHog tracking for MCP metrics
- [ ] Analyze performance (latency, token usage)
- [ ] Optimize slow queries
- [ ] Document learnings

---

## 🔮 Future Enhancements (Post-Q2)

### Q3 2026: Advanced Features
- [ ] **MCP Server: `supplement-optimizer`** (personalized supplement recommendations)
- [ ] **MCP Server: `protocol-composer`** (multi-protocol orchestration)
- [ ] **MCP Server: `genetic-insights`** (23andMe/AncestryDNA integration)

### Q4 2026: AI Coach Integration
- [ ] **Conversational AI** with full MCP context
- [ ] **Proactive suggestions** based on activity memory
- [ ] **Multi-turn dialogues** with persistent context

---

## 📝 Notes

### Key Learnings from Analysis (Feb 2026)
1. **MCP is NOT a Quick-Win** (~8-18h implementation)
2. **Timing matters** (wait for Beta validation)
3. **Strategic fit** (aligns with Horizon 2: Autonomous Optimization)
4. **Alternative exists** (Context Injection pattern for interim)

### Principles
1. **User First** — Only build if it improves personalization
2. **Data Driven** — Measure token savings and latency improvements
3. **Iterate Fast** — Start with 1 server, expand based on results
4. **Quality Matters** — MCP should feel invisible to users
5. **Sustainable** — Build for long-term maintainability

---

**Status:** 📋 Planned for Q2 2026 | Decision Gate: End of Q1 2026  
**Owner:** Technical Lead  
**Stakeholders:** Product, Engineering, Data Science

**Last Updated:** 2026-02-07
