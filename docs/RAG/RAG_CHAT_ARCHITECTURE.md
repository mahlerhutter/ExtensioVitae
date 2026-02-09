# 🧠 RAG-First Chat Architecture + Hybrid LLM Strategy

**Date:** 2026-02-08  
**Status:** Architecture Design  
**Goal:** Maximize RAG quality, minimize LLM costs, enable local LLM for simple queries

---

## 🎯 **Core Philosophy**

> **"RAG is the brain, LLM is the voice"**

**Principles:**
1. **RAG does the thinking** (retrieve, rank, filter)
2. **LLM does the formatting** (natural language generation)
3. **Local LLM for simple queries** (greetings, confirmations, clarifications)
4. **Cloud LLM for complex reasoning** (multi-step logic, nuanced advice)

---

## 🏗️ **Architecture Overview**

```
User Message
    ↓
┌─────────────────────────────────────────────────────┐
│  TIER 1: Intent Classification (Local LLM)          │
│  - greeting / farewell                              │
│  - simple_question (factual, single-step)           │
│  - complex_question (multi-step, reasoning)         │
│  - state_update                                     │
│  - feedback / command                               │
└─────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────┐
│  TIER 2: RAG Retrieval (Always)                     │
│  1. Semantic Search (canon_entries)                 │
│  2. User State Lookup (user_states)                 │
│  3. Contextual Knowledge (future: studies, etc.)    │
│  4. Conversation History (last 5 messages)          │
└─────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────┐
│  TIER 3: Response Generation (Hybrid LLM)           │
│                                                      │
│  IF intent = greeting/farewell/simple:              │
│    → Local LLM (Llama 3.2 3B, Phi-3, Gemma 2 2B)   │
│    → Fast (<500ms), Free, Privacy                  │
│                                                      │
│  IF intent = complex_question/state_update:         │
│    → Cloud LLM (Claude 3.5 Sonnet)                  │
│    → High quality, Nuanced, Empathetic              │
│                                                      │
│  Response Template:                                  │
│    - RAG Context (canon entries, user state)        │
│    - Conversation History                           │
│    - Prompt Engineering (empathy, actionability)    │
└─────────────────────────────────────────────────────┘
    ↓
Save to conversation_history
    ↓
Return to User
```

---

## 🔍 **RAG Pipeline (The Core)**

### **Step 1: Semantic Search (Canon Entries)**

**Goal:** Find the 3-5 most relevant canon entries for the user's query.

**Implementation:**
```typescript
async function retrieveCanonEntries(
  query: string,
  userState: UserState,
  topK: number = 5
): Promise<CanonEntry[]> {
  // 1. Generate query embedding
  const embedding = await generateEmbedding(query);

  // 2. Semantic search via canon-api
  const response = await fetch(`${supabaseUrl}/functions/v1/canon-api`, {
    method: 'POST',
    headers: { ... },
    body: JSON.stringify({
      action: 'semantic_search',
      query_embedding: embedding,
      top_k: topK,
      filter_user_state: userState // Applicability filtering
    })
  });

  const { data: canonEntries } = await response.json();

  // 3. Re-rank by applicability
  return canonEntries
    .filter(entry => checkApplicability(entry, userState))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3);
}
```

**Key Features:**
- **Semantic Search:** Vector similarity (cosine distance)
- **Applicability Filtering:** Only return entries that match user's state
- **Re-ranking:** Prioritize by similarity + evidence grade

---

### **Step 2: User State Context**

**Goal:** Provide current user state to LLM for personalized responses.

**Implementation:**
```typescript
async function getUserStateContext(userId: string): Promise<UserStateContext> {
  const { data: userState } = await supabase
    .from('user_states')
    .select('*')
    .eq('user_id', userId)
    .single();

  // Extract relevant fields
  return {
    sleep_debt: userState.sleep_debt,
    stress_load: userState.stress_load,
    recovery_state: userState.recovery_state,
    training_load: userState.training_load,
    hrv_30day_baseline: userState.hrv_30day_baseline,
    rhr_30day_baseline: userState.rhr_30day_baseline,
    active_constraints: userState.active_constraints
  };
}
```

**Usage in Prompt:**
```
User State:
- Sleep Debt: moderate
- Stress Load: high
- Recovery State: fatigued
- Training Load: building
- Active Constraints: ["knee_injury", "time_limited"]
```

---

### **Step 3: Conversation History**

**Goal:** Maintain context across messages.

**Implementation:**
```typescript
async function getConversationHistory(
  userId: string,
  limit: number = 5
): Promise<Message[]> {
  const { data: history } = await supabase
    .from('conversation_history')
    .select('role, message, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return history?.reverse() || [];
}
```

**Usage in Prompt:**
```
Conversation History:
User: "Ich habe 6h geschlafen"
Bot: "Verstanden. Dein Schlafdefizit ist jetzt moderate..."
User: "Soll ich heute trainieren?"
Bot: [Current response]
```

---

## 🤖 **Hybrid LLM Strategy**

### **Local LLM (Tier 1: Simple Queries)**

**Use Cases:**
- ✅ Greetings ("Hallo", "Guten Morgen")
- ✅ Farewells ("Tschüss", "Bis später")
- ✅ Confirmations ("Danke", "OK", "Verstanden")
- ✅ Simple factual questions ("Was ist Zone 2?")
- ✅ Clarifications ("Kannst du das wiederholen?")

**Model Options:**
| Model | Size | Speed | Quality | Use Case |
|-------|------|-------|---------|----------|
| **Llama 3.2 3B** | 3B | Fast | Good | General chat |
| **Phi-3 Mini** | 3.8B | Fast | Good | Reasoning |
| **Gemma 2 2B** | 2B | Very Fast | OK | Simple responses |
| **Qwen 2.5 3B** | 3B | Fast | Good | Multilingual |

**Recommended:** **Llama 3.2 3B** (best balance)

**Deployment Options:**
1. **Ollama** (local server, easy setup)
2. **llama.cpp** (C++ library, fastest)
3. **LM Studio** (GUI, user-friendly)
4. **Deno Deploy Edge Function** (serverless, but limited)

**Implementation (Ollama):**
```typescript
async function generateLocalResponse(
  prompt: string,
  context: RAGContext
): Promise<string> {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2:3b',
      prompt: buildPrompt(prompt, context),
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 200
      }
    })
  });

  const data = await response.json();
  return data.response;
}
```

---

### **Cloud LLM (Tier 2: Complex Queries)**

**Use Cases:**
- ✅ Complex questions ("Wie optimiere ich meinen Schlaf UND Training?")
- ✅ Multi-step reasoning ("Basierend auf meinem HRV, was soll ich heute tun?")
- ✅ Nuanced advice ("Ich fühle mich müde, aber will trainieren")
- ✅ State updates with recommendations ("6h geschlafen → was jetzt?")
- ✅ Personalized planning ("Erstelle mir einen 7-Tage Plan")

**Model:** **Claude 3.5 Sonnet** (current)

**Why Claude?**
- ✅ Best at empathetic, nuanced responses
- ✅ Excellent at following complex instructions
- ✅ Strong reasoning capabilities
- ✅ Good at German language

**Alternative:** **GPT-4o** (faster, cheaper, but less empathetic)

---

## 🧩 **Intent Classification Logic**

**Goal:** Route to Local vs Cloud LLM based on query complexity.

**Implementation:**
```typescript
interface Intent {
  type: 'greeting' | 'farewell' | 'simple_question' | 'complex_question' | 'state_update' | 'feedback' | 'command';
  complexity: 'low' | 'medium' | 'high';
  requiresRAG: boolean;
  useLLM: 'local' | 'cloud';
}

async function classifyIntent(message: string): Promise<Intent> {
  // Use Local LLM for classification (fast, cheap)
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    body: JSON.stringify({
      model: 'llama3.2:3b',
      prompt: `Classify this message:
"${message}"

Categories:
- greeting: "Hallo", "Guten Morgen"
- farewell: "Tschüss", "Bis später"
- simple_question: Single fact, no reasoning
- complex_question: Multi-step, requires reasoning
- state_update: "Ich habe 6h geschlafen"
- feedback: "Danke", "Das hat geholfen"
- command: "/stats", "/history"

Respond with JSON only:
{
  "type": "...",
  "complexity": "low|medium|high",
  "requiresRAG": true|false,
  "useLLM": "local|cloud"
}`,
      stream: false
    })
  });

  const data = await response.json();
  return JSON.parse(data.response);
}
```

**Routing Logic:**
```typescript
async function generateResponse(
  message: string,
  intent: Intent,
  ragContext: RAGContext
): Promise<string> {
  if (intent.useLLM === 'local') {
    // Use Local LLM (Llama 3.2 3B)
    return await generateLocalResponse(message, ragContext);
  } else {
    // Use Cloud LLM (Claude 3.5 Sonnet)
    return await generateCloudResponse(message, ragContext);
  }
}
```

---

## 📊 **Cost & Performance Analysis**

### **Scenario 1: 100% Cloud LLM (Current)**

**Assumptions:**
- 1000 messages/day
- Avg 500 tokens/request (input + output)
- Claude 3.5 Sonnet pricing: $3/M input, $15/M output

**Cost:**
```
Input:  1000 * 300 tokens * $3/M  = $0.90/day
Output: 1000 * 200 tokens * $15/M = $3.00/day
Total:  $3.90/day = $117/month
```

---

### **Scenario 2: Hybrid (70% Local, 30% Cloud)**

**Assumptions:**
- 1000 messages/day
- 70% simple queries → Local LLM (free)
- 30% complex queries → Cloud LLM

**Cost:**
```
Local:  700 messages * $0 = $0/day
Cloud:  300 messages * $3.90 = $1.17/day
Total:  $1.17/day = $35/month

Savings: $82/month (70% reduction)
```

**Performance:**
```
Local LLM:  <500ms response time
Cloud LLM:  1-3s response time
Average:    ~1s response time (vs 2s all-cloud)
```

---

## 🚀 **Implementation Roadmap**

### **Phase 1: RAG Optimization (Week 3)** 🎯 CURRENT

**Goal:** Maximize RAG quality before adding local LLM.

**Tasks:**
1. ✅ **Seed Canon Entries** (28 entries from canon.md)
2. ✅ **Test Semantic Search** (verify relevance)
3. ✅ **Implement Applicability Filtering** (user state matching)
4. ✅ **Add Re-ranking Logic** (similarity + evidence grade)
5. ✅ **Test End-to-End** (chat → RAG → response)

**Success Criteria:**
- Canon entries return relevant results (90% accuracy)
- Applicability filtering works (only show applicable entries)
- Response quality is high (empathetic, actionable)

---

### **Phase 2: Local LLM Integration (Week 4)**

**Goal:** Add local LLM for simple queries.

**Tasks:**
1. **Install Ollama** (local LLM server)
   ```bash
   # macOS
   brew install ollama
   
   # Start server
   ollama serve
   
   # Pull model
   ollama pull llama3.2:3b
   ```

2. **Update Intent Classification** (use local LLM)
3. **Add Routing Logic** (local vs cloud)
4. **Test Performance** (response time, quality)
5. **Monitor Cost Savings** (track cloud LLM usage)

**Success Criteria:**
- Local LLM handles 70% of queries
- Response time < 500ms for simple queries
- Quality is acceptable (user satisfaction ≥ 4/5)
- Cost reduction ≥ 60%

---

### **Phase 3: Advanced RAG (Week 5-6)**

**Goal:** Add contextual knowledge layer.

**Tasks:**
1. **Create contextual_knowledge table** (studies, protocols, etc.)
2. **Implement Multi-Source RAG** (canon + contextual)
3. **Add Citation System** (show sources in responses)
4. **Implement Feedback Loop** (user ratings → improve retrieval)

---

## 🔧 **Technical Implementation**

### **Updated chat-api Architecture:**

```typescript
// supabase/functions/chat-api/index.ts

serve(async (req: Request) => {
  const { user_id, message } = await req.json();

  // 1. Classify intent (Local LLM)
  const intent = await classifyIntent(message);

  // 2. RAG Retrieval (Always)
  const ragContext = await buildRAGContext(user_id, message);

  // 3. Generate response (Hybrid LLM)
  let response: string;
  
  if (intent.useLLM === 'local') {
    // Use Local LLM (Ollama)
    response = await generateLocalResponse(message, ragContext);
  } else {
    // Use Cloud LLM (Claude)
    response = await generateCloudResponse(message, ragContext);
  }

  // 4. Save to DB
  await saveConversation(user_id, message, response, intent, ragContext);

  return new Response(JSON.stringify({ success: true, response }));
});

async function buildRAGContext(userId: string, query: string): Promise<RAGContext> {
  const [canonEntries, userState, history] = await Promise.all([
    retrieveCanonEntries(query, userId),
    getUserStateContext(userId),
    getConversationHistory(userId)
  ]);

  return {
    canonEntries,
    userState,
    conversationHistory: history
  };
}
```

---

## 📋 **Next Steps**

**Immediate (Week 3):**
1. ✅ Seed canon_entries from canon.md
2. ✅ Test semantic search
3. ✅ Verify applicability filtering
4. ✅ Test end-to-end chat

**Short-term (Week 4):**
1. Install Ollama
2. Integrate local LLM
3. Implement routing logic
4. Measure cost savings

**Medium-term (Week 5-6):**
1. Add contextual knowledge layer
2. Implement citation system
3. Add feedback loop

---

## 🎯 **Success Metrics**

| Metric | Target | Current |
|--------|--------|---------|
| RAG Relevance | >90% | TBD |
| Response Time (Simple) | <500ms | TBD |
| Response Time (Complex) | <3s | TBD |
| Cost per 1000 messages | <$2 | $3.90 |
| User Satisfaction | ≥4/5 | TBD |
| Local LLM Usage | 70% | 0% |

---

**Status:** 🚀 RAG-First Architecture Designed | Local LLM Integration Planned

**Last Updated:** 2026-02-08
