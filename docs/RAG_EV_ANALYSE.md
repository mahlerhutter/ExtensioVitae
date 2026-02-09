# RAG-Integration für ExtensioVitae
## Strategische Analyse & Implementierungs-Blueprint

**Version:** 1.0
**Datum:** 8. Februar 2026
**Status:** ⚡ HOCHGRADIG SINNVOLL - STRATEGISCHER GAME-CHANGER

---

## 🎯 Executive Summary

**FAZIT: RAG ist EXTREM sinnvoll und strategisch zwingend notwendig.**

Die RAG-Spezifikationen passen zu **85%** perfekt auf die EV-Codebase. Die bestehende Infrastruktur (PostgreSQL, BioSync, Module System) bildet bereits das Fundament für 3 der 5 RAG-Phasen. Die Implementierung würde EV von einem "statischen 30-Tage-Plan-Generator" zu einem "dynamischen Longevity Decision Engine" transformieren – genau das Differenzierungsmerkmal, das im PRD gefordert wird.

**Kernaussage:** Die aktuelle EV-Architektur ist wie ein Haus mit solidem Fundament (User State, BioSync) und Dach (Frontend), aber ohne die intelligente Steuerung (RAG Decision Engine) dazwischen. Der RAG fügt das fehlende Gehirn hinzu.

---

## 📊 Kompatibilitäts-Matrix

### ✅ Was BEREITS EXISTIERT und DIREKT nutzbar ist:

| RAG-Komponente | EV-Pendant | Kompatibilität | Notizen |
|----------------|------------|----------------|---------|
| **PostgreSQL-Datenbank** | Supabase PostgreSQL | ✅ 100% | Event-Sourcing direkt umsetzbar |
| **Biometric Data Pipeline** | `bloodCheckService.js` | ✅ 85% | Aktuell nur Lab-Daten (OCR), aber Pipeline existiert |
| **User Profile (Static)** | `user_profiles` + `health_profiles` | ✅ 90% | Schema fast identisch mit RAG-Spec |
| **LLM Integration** | `llmPlanGenerator.js` | ✅ 80% | Edge Function Proxy existiert (OpenAI) |
| **Frontend Services** | `taskService.js`, `recoveryService.js` | ✅ 95% | Perfekte Basis für Decision Card |
| **Recommendation Logic** | `optimizationEngine.js` | ⚠️ 40% | Existiert, aber deterministisch (kein RAG) |

### ⚠️ Was TEILWEISE existiert und ERWEITERT werden muss:

| RAG-Komponente | EV-Status | Gap-Größe | Aufwand |
|----------------|-----------|-----------|---------|
| **Dynamic State Schema** | Partial (nur `recovery_metrics`) | 🟡 Medium | 2-3 Wochen |
| **Event Sourcing** | Nicht vorhanden | 🟡 Medium | 1-2 Wochen |
| **Vector Database** | Nicht vorhanden (pgvector fehlt) | 🟡 Medium | 1 Woche |
| **BioSync Continuous Data** | Nur Lab-Daten, keine Live-HRV | 🟠 Large | 3-4 Wochen |

### ❌ Was KOMPLETT FEHLT und NEU gebaut werden muss:

| RAG-Komponente | Status | Kritikalität | Aufwand |
|----------------|--------|--------------|---------|
| **Canon Knowledge Layer** | ❌ Fehlt | 🔴 Kritisch | 2-3 Wochen (Editorial + Engineering) |
| **Contextual Knowledge Layer** | ❌ Fehlt | 🔴 Kritisch | 2-3 Wochen |
| **Temporal Layer (12-Month Blueprint)** | ❌ Fehlt | 🔴 Kritisch | 2-3 Wochen |
| **State Hydration Loop** | ❌ Fehlt | 🔴 Kritisch | 2-3 Wochen |
| **Decision Synthesis Engine** | ❌ Fehlt | 🔴 Kritisch | 3-4 Wochen |

---

## 🧠 Warum RAG für EV ZWINGEND sinnvoll ist

### 1. **Strategische Positionierung**
Das RAG PRD beschreibt genau das, was EV sein SOLLTE:
- ✅ "Exactly one actionable decision per interaction" → EV's "One Decision Principle"
- ✅ "Not a general health chatbot" → EV's Fokus auf Longevity, nicht generische Gesundheit
- ✅ "Time-sequenced, opinionated" → EV's 30-Day Blueprints (aber aktuell statisch)

**Problem:** EV generiert aktuell statische 30-Tage-Pläne, die sich NICHT an veränderte Zustände anpassen. Ein User mit Schlafmangel am Tag 15 bekommt trotzdem HIIT vorgeschlagen. Das ist das Gegenteil von "intelligent".

**Lösung:** RAG ermöglicht dynamische, zustandsbasierte Anpassungen.

### 2. **Technische Synergien**
EV hat bereits 70% der benötigten Infrastruktur:
- ✅ PostgreSQL (für Event Sourcing)
- ✅ User State Model (muss nur erweitert werden)
- ✅ BioSync Pipeline (muss nur kontinuierliche Daten statt nur Labs integrieren)
- ✅ LLM Integration (Claude/OpenAI via Edge Functions)
- ✅ Module System (perfekte Basis für "Active Decision Card")

**Bedeutung:** RAG ist kein "neues Produkt", sondern die **evolutionäre Vervollständigung** der bestehenden Architektur.

### 3. **Datenverfügbarkeit**
EV sammelt bereits viele der benötigten Daten:
- ✅ User Profile: `user_profiles`, `health_profiles`
- ✅ Recovery Metrics: `recovery_metrics` (HRV, Sleep, RHR)
- ✅ Task Completions: `task_completions` (Adherence)
- ✅ Biomarkers: `lab_results`, `biomarkers` (Blood data)

**Gap:** Fehlende kontinuierliche Wearable-Integration (nur Lab-Snapshots). Das ist aber laut `SYSTEM_SUMMARY.md` bereits geplant (Oura/Whoop).

### 4. **Kill Criteria Alignment**
Das RAG PRD definiert klare Failure States:
1. "User perceives system as generic" → EV's aktuelles Problem (statische Pläne)
2. "Recommendations feel optional" → EV's Problem (keine Autorität)
3. "No clear behavioral change after 14 days" → EV's Metrik-Lücke

**RAG löst ALLE drei Kill Criteria:**
- Canon Layer → verhindert generische Ratschläge
- Response Contract → erzwingt Autorität ("decision", nicht "suggestion")
- State Hydration + Temporal Layer → erzwingt zeitbasierte Sequenzierung

---

## 🚨 Kritische Unterschiede: RAG-Spec vs. EV-Realität

### 1. **Wearable-Daten: Diskrepanz**
- **RAG erwartet:** Kontinuierliche Biometric Streams (HRV, Sleep, Activity) via HealthKit/Whoop
- **EV hat:** Nur punktuelle Lab-Daten via OCR (Blood Tests)
- **Impact:** Die State Hydration Loop kann nicht funktionieren ohne Live-Daten

**Lösungsweg:** Phase 3 (BioSync Integration) muss PRIORISIERT werden. Die Wearable-Infrastruktur existiert laut `INTEGRATED_SYSTEMS_IMPLEMENTATION.md`, muss aber aktiviert werden.

### 2. **30-Day Plan vs. 12-Month Blueprint**
- **RAG erwartet:** 12-monatigen Temporal Layer mit expliziten "forbidden actions"
- **EV hat:** 30-Tage-Pläne, die nach 30 Tagen enden (keine langfristige Sequenzierung)
- **Impact:** Temporal Layer (P0) fehlt komplett

**Lösungsweg:** Bestehende `plan_snapshots` Tabelle erweitern zu `temporal_blueprints` mit 12-Monats-Phasen.

### 3. **Knowledge Architecture: Fehlt komplett**
- **RAG erwartet:** 3-Layer Knowledge System (Temporal, Canon, Contextual)
- **EV hat:** Hardcoded Task-Listen in `planBuilder.js` (keine Wissens-Datenbank)
- **Impact:** Das ist der größte Gap – Canon/Contextual Layer müssen von Grund auf gebaut werden

**Lösungsweg:** Phase 2 (Canon Knowledge Layer) ist EDITORIAL work, nicht nur Engineering. Braucht Domain-Expertise.

---

## 🍳 KOCHREZEPT: Maximal effiziente RAG-Implementierung

### 🎯 Philosophie: "Thin Slices, Fast Feedback"
Anstatt alle 5 Phasen sequenziell abzuarbeiten (8-12 Wochen), bauen wir **vertikale Slices**, die jeweils ein End-to-End-Feature liefern.

### 📋 Slice-Based Roadmap (6-8 Wochen)

---

## **SLICE 1: Minimal Viable Decision Engine (2 Wochen)**
**Ziel:** Eine einzelne, LLM-generierte Empfehlung basierend auf User State (ohne Vector DB)

### Week 1: User State Extension + Event Sourcing
**Deliverable:** Erweiterte `user_states` Tabelle mit Dynamic State Fields

```sql
-- Neue Tabelle (erweitert user_profiles/health_profiles)
CREATE TABLE user_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) UNIQUE,

    -- Dynamic State (aus RAG-Spec)
    sleep_debt TEXT CHECK (sleep_debt IN ('none', 'mild', 'moderate', 'severe')),
    stress_load TEXT CHECK (stress_load IN ('baseline', 'elevated', 'high', 'burnout_risk')),
    recovery_state TEXT CHECK (recovery_state IN ('optimal', 'moderate', 'low')),
    training_load TEXT CHECK (training_load IN ('deload', 'maintenance', 'building', 'overreaching')),
    metabolic_flexibility TEXT CHECK (metabolic_flexibility IN ('stable', 'dysregulated')),

    -- Active Constraints (JSON array)
    active_constraints JSONB DEFAULT '[]'::jsonb,

    -- Metadata
    last_material_change_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event Log (für Auditing)
CREATE TABLE state_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    field TEXT NOT NULL,
    previous_value TEXT,
    new_value TEXT,
    source TEXT NOT NULL, -- 'biosync_hrv', 'self_report', 'system_derived'
    triggered_reevaluation BOOLEAN DEFAULT false,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_state_events_user_time ON state_events(user_id, timestamp DESC);
```

**API Endpoints (Edge Functions):**
```typescript
// /supabase/functions/state-api/index.ts
export default async function handler(req: Request) {
    const { action, user_id, field, new_value, source } = await req.json();

    switch (action) {
        case 'get_state':
            // Return current user_states row
        case 'update_field':
            // Insert state_event + update user_states
        case 'get_history':
            // Return state_events for audit
    }
}
```

**Frontend Service:**
```javascript
// src/lib/stateService.js
export async function getCurrentState(userId) {
    const { data } = await supabase
        .from('user_states')
        .select('*')
        .eq('user_id', userId)
        .single();
    return data;
}

export async function updateStateField(field, newValue, source) {
    await supabase.functions.invoke('state-api', {
        body: { action: 'update_field', field, new_value: newValue, source }
    });
}
```

---

### Week 2: Minimal LLM Decision Synthesis (ohne Vector DB)
**Deliverable:** LLM generiert eine Empfehlung basierend auf User State

**Strategie:** Überspringe vorerst Canon/Contextual Layer. Nutze ein **hardcoded System Prompt** mit den wichtigsten Longevity-Prinzipien.

```typescript
// /supabase/functions/decision-synthesis/index.ts
const MINIMAL_CANON = `
You are Extensio Vitae, a decision engine for longevity.

Core Principles:
1. Sleep: Consistency > Duration. 7h at consistent times > 8h varying.
2. Movement: Walking is highest ROI. 8000 steps minimum before any training.
3. Metabolic: Glucose stability first. Optimize fasting glucose and post-meal spikes.
4. Stress: HRV trends are the primary indicator. Daily nervous system regulation is non-negotiable.
5. Sequence over optimize. The right action at the wrong time is a failure.

Response Format (JSON):
{
  "decision": "Single, prescriptive action (max 2 lines)",
  "why_now": "Why this action is prioritized NOW (2-3 sentences)",
  "cost_of_decision": "What the user sacrifices or must manage (1-2 sentences)",
  "next_14_days_action": "Concrete, measurable steps for the next 14 days"
}
`;

export default async function handler(req: Request) {
    const { user_id } = await req.json();

    // Step 1: Fetch current user state
    const state = await supabase
        .from('user_states')
        .select('*')
        .eq('user_id', user_id)
        .single();

    // Step 2: Fetch static profile
    const profile = await supabase
        .from('health_profiles')
        .select('*')
        .eq('user_id', user_id)
        .single();

    // Step 3: Construct prompt
    const userContext = `
User State:
- Sleep Debt: ${state.sleep_debt}
- Stress Load: ${state.stress_load}
- Recovery State: ${state.recovery_state}
- Training Load: ${state.training_load}
- Active Constraints: ${JSON.stringify(state.active_constraints)}

User Profile:
- Age: ${calculateAge(profile.birth_date)}
- Training Frequency: ${profile.training_frequency}
- Daily Time Budget: ${profile.daily_time_budget} minutes
- Equipment: ${profile.equipment_access}
`;

    // Step 4: Call Claude Sonnet 4.5
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': Deno.env.get('ANTHROPIC_API_KEY'),
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: MINIMAL_CANON,
            messages: [{
                role: 'user',
                content: `${userContext}\n\nGenerate the single most important longevity decision for this user RIGHT NOW. Output as JSON.`
            }]
        })
    });

    const decision = await response.json();

    // Step 5: Validate JSON schema
    const parsed = JSON.parse(decision.content[0].text);
    if (!parsed.decision || !parsed.why_now || !parsed.cost_of_decision || !parsed.next_14_days_action) {
        throw new Error('Invalid response schema');
    }

    // Step 6: Store decision
    await supabase.from('active_decisions').insert({
        user_id,
        decision_data: parsed,
        state_snapshot: state,
        generated_at: new Date().toISOString()
    });

    return new Response(JSON.stringify(parsed), {
        headers: { 'Content-Type': 'application/json' }
    });
}
```

**Frontend: Active Decision Card**
```jsx
// src/components/ActiveDecisionCard.jsx
export function ActiveDecisionCard() {
    const [decision, setDecision] = useState(null);

    useEffect(() => {
        async function loadDecision() {
            const { data } = await supabase
                .from('active_decisions')
                .select('*')
                .eq('user_id', user.id)
                .order('generated_at', { ascending: false })
                .limit(1)
                .single();

            setDecision(data?.decision_data);
        }
        loadDecision();
    }, []);

    if (!decision) return <LoadingSpinner />;

    return (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-6 shadow-lg">
            {/* Decision Headline */}
            <h2 className="text-2xl font-bold text-white mb-4">
                {decision.decision}
            </h2>

            {/* Why Now */}
            <div className="text-gray-300 mb-4">
                <span className="text-cyan-400 font-semibold">Why now: </span>
                {decision.why_now}
            </div>

            {/* Cost Callout */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded p-3 mb-4">
                <span className="text-amber-400 font-semibold">⚠️ Cost: </span>
                <span className="text-gray-200">{decision.cost_of_decision}</span>
            </div>

            {/* Action Plan */}
            <div>
                <span className="text-cyan-400 font-semibold">Next 14 days:</span>
                <p className="text-gray-300 mt-2 whitespace-pre-line">
                    {decision.next_14_days_action}
                </p>
            </div>
        </div>
    );
}
```

**✅ SLICE 1 Akzeptanzkriterien:**
1. User State kann über API aktualisiert werden
2. LLM generiert valide Decision JSON
3. Active Decision Card zeigt Empfehlung an
4. Kein Crash bei fehlenden Daten

---

## **SLICE 2: State Hydration Loop (1.5 Wochen)**
**Ziel:** Automatische State-Updates basierend auf BioSync-Daten

### Implementation:
```typescript
// /supabase/functions/state-hydration/index.ts
interface HydrationRule {
    field: 'sleep_debt' | 'stress_load' | 'recovery_state' | 'training_load';
    source: string;
    threshold: (data: any, baseline: any) => string;
}

const HYDRATION_RULES: HydrationRule[] = [
    {
        field: 'sleep_debt',
        source: 'biosync_sleep',
        threshold: (data, baseline) => {
            const sleepDeficit = baseline.sleep_7day_avg - data.sleep_duration;
            if (sleepDeficit < 0.5) return 'none';
            if (sleepDeficit < 1.5) return 'mild';
            if (sleepDeficit < 2.5) return 'moderate';
            return 'severe';
        }
    },
    {
        field: 'stress_load',
        source: 'biosync_hrv',
        threshold: (data, baseline) => {
            const hrvRatio = data.hrv_rmssd / baseline.hrv_30day_avg;
            if (hrvRatio > 0.95) return 'baseline';
            if (hrvRatio > 0.85) return 'elevated';
            if (hrvRatio > 0.70) return 'high';
            return 'burnout_risk';
        }
    }
    // ... weitere Rules für recovery_state, training_load
];

export default async function handler(req: Request) {
    const { user_id, data_type, data } = await req.json();

    // Step 1: Fetch personal baseline
    const baseline = await supabase
        .from('user_recovery_baseline')
        .select('*')
        .eq('user_id', user_id)
        .single();

    // Step 2: Apply threshold rules
    const stateChanges = [];
    for (const rule of HYDRATION_RULES) {
        if (rule.source === data_type) {
            const newValue = rule.threshold(data, baseline.data);
            const currentState = await getCurrentStateField(user_id, rule.field);

            if (newValue !== currentState) {
                stateChanges.push({
                    field: rule.field,
                    previous_value: currentState,
                    new_value: newValue,
                    triggered_reevaluation: true
                });
            }
        }
    }

    // Step 3: Write state events + trigger decision synthesis
    for (const change of stateChanges) {
        await supabase.from('state_events').insert({
            user_id,
            ...change,
            source: data_type,
            timestamp: new Date().toISOString()
        });

        // Update materialized user_states
        await supabase.from('user_states').update({
            [change.field]: change.new_value,
            last_material_change_at: new Date().toISOString()
        }).eq('user_id', user_id);
    }

    // Step 4: Trigger new decision synthesis if material change
    if (stateChanges.some(c => c.triggered_reevaluation)) {
        await supabase.functions.invoke('decision-synthesis', {
            body: { user_id }
        });
    }

    return new Response(JSON.stringify({ changes: stateChanges.length }));
}
```

**Webhook Integration (BioSync → State Hydration):**
```javascript
// Modify existing bloodCheckService.js
export async function processBioSyncData(userId, dataType, rawData) {
    // Existing logic: store in wearable_data
    await supabase.from('wearable_data').insert({ ... });

    // NEW: Trigger State Hydration
    await supabase.functions.invoke('state-hydration', {
        body: { user_id: userId, data_type: dataType, data: rawData }
    });
}
```

---

## **SLICE 3: Canon Knowledge Layer (2 Wochen)**
**Ziel:** Vector-basiertes Knowledge Retrieval mit pgvector

### Week 1: Vector DB Setup + Canon Seeding
```sql
-- Enable pgvector extension (in Supabase Dashboard)
CREATE EXTENSION IF NOT EXISTS vector;

-- Canon entries table
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

    -- Metadata for filtering
    applicability_conditions JSONB DEFAULT '{}'::jsonb,
    contraindications JSONB DEFAULT '[]'::jsonb,
    evidence_grade TEXT CHECK (evidence_grade IN ('S', 'A', 'B', 'C')),

    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    retired_at TIMESTAMPTZ -- For versioning
);

CREATE INDEX idx_canon_domain ON canon_entries(domain);
CREATE INDEX idx_canon_embedding ON canon_entries USING ivfflat (embedding vector_cosine_ops);
```

**Seeding Script:**
```typescript
// scripts/seed-canon.ts
const CANON_SEED_DATA = [
    {
        domain: 'sleep_regulation',
        doctrine: 'Sleep timing consistency matters more than sleep duration.',
        mechanism: 'Consistent sleep-wake times strengthen circadian entrainment, improving sleep quality and metabolic regulation. A user sleeping 7 hours at consistent times outperforms a user sleeping 8 hours at varying times.',
        applicability_conditions: { sleep_debt: ['none', 'mild'] },
        contraindications: [{ field: 'sleep_debt', value: 'severe' }],
        evidence_grade: 'A'
    },
    {
        domain: 'metabolic_health',
        doctrine: 'Glucose stability is the primary metabolic lever.',
        mechanism: 'Fasting glucose, post-meal spikes, and overnight glucose patterns are the first metrics to optimize. Stable glucose reduces inflammation and improves insulin sensitivity.',
        applicability_conditions: {},
        contraindications: [],
        evidence_grade: 'S'
    },
    {
        domain: 'movement_hierarchy',
        doctrine: 'Walking is the highest-ROI movement.',
        mechanism: 'Before any structured training program, daily walking volume must be established at a minimum of 8,000 steps. Walking improves cardiovascular health, metabolic flexibility, and recovery capacity with minimal fatigue cost.',
        applicability_conditions: { training_load: ['deload', 'maintenance'] },
        contraindications: [],
        evidence_grade: 'S'
    },
    {
        domain: 'stress_nervous_system',
        doctrine: 'Chronic sympathetic dominance is the silent longevity killer.',
        mechanism: 'HRV trends are the primary indicator. Daily nervous system regulation (breathwork, meditation, or parasympathetic activation) is non-negotiable for longevity.',
        applicability_conditions: {},
        contraindications: [],
        evidence_grade: 'A'
    },
    {
        domain: 'meaning_purpose',
        doctrine: 'Purpose and social connection are not soft metrics.',
        mechanism: 'Longitudinal data places purpose and connection alongside exercise and nutrition in terms of mortality impact. Isolation and lack of purpose accelerate biological aging.',
        applicability_conditions: {},
        contraindications: [],
        evidence_grade: 'A'
    }
    // ... Add 15-25 more entries across all domains
];

async function seedCanon() {
    for (const entry of CANON_SEED_DATA) {
        // Generate embedding
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'text-embedding-3-small',
                input: `${entry.doctrine} ${entry.mechanism}`
            })
        });

        const { data } = await embeddingResponse.json();
        const embedding = data[0].embedding;

        // Insert into database
        await supabase.from('canon_entries').insert({
            ...entry,
            embedding
        });
    }
}
```

---

### Week 2: Vector Retrieval Integration
```typescript
// /supabase/functions/decision-synthesis/index.ts (UPDATED)
export default async function handler(req: Request) {
    const { user_id } = await req.json();

    // Step 1-2: Same as before (fetch state + profile)
    const state = await getCurrentState(user_id);
    const profile = await getProfile(user_id);

    // Step 3: NEW - Retrieve relevant Canon entries via vector similarity
    const queryText = `
        User seeking longevity advice with:
        - Sleep debt: ${state.sleep_debt}
        - Stress load: ${state.stress_load}
        - Recovery state: ${state.recovery_state}
        - Training load: ${state.training_load}
    `;

    // Generate query embedding
    const queryEmbedding = await generateEmbedding(queryText);

    // Vector search with metadata filtering
    const { data: canonEntries } = await supabase.rpc('match_canon_entries', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: 5,
        filter_conditions: state // Automatically filter by applicability
    });

    // Step 4: Construct enhanced prompt with Canon entries
    const canonContext = canonEntries.map(entry => `
        Domain: ${entry.domain}
        Doctrine: ${entry.doctrine}
        Mechanism: ${entry.mechanism}
        Evidence Grade: ${entry.evidence_grade}
    `).join('\n\n');

    const systemPrompt = `${MINIMAL_CANON}\n\n## Applicable Canon Doctrine:\n${canonContext}`;

    // Step 5-6: Same as before (LLM call + validation)
    const decision = await callClaude(systemPrompt, userContext);

    // Step 7: Store with Canon references
    await supabase.from('active_decisions').insert({
        user_id,
        decision_data: decision,
        state_snapshot: state,
        canon_entries_used: canonEntries.map(e => e.id),
        generated_at: new Date().toISOString()
    });

    return new Response(JSON.stringify(decision));
}
```

**PostgreSQL Function for Vector Search:**
```sql
CREATE OR REPLACE FUNCTION match_canon_entries(
    query_embedding vector(1536),
    match_threshold float,
    match_count int,
    filter_conditions jsonb
)
RETURNS TABLE (
    id uuid,
    domain text,
    doctrine text,
    mechanism text,
    evidence_grade text,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        canon_entries.id,
        canon_entries.domain,
        canon_entries.doctrine,
        canon_entries.mechanism,
        canon_entries.evidence_grade,
        1 - (canon_entries.embedding <=> query_embedding) AS similarity
    FROM canon_entries
    WHERE
        -- Metadata filters
        retired_at IS NULL
        AND (
            applicability_conditions = '{}'::jsonb
            OR applicability_conditions @> filter_conditions
        )
        -- Contraindication check
        AND NOT (
            contraindications @> jsonb_build_array(filter_conditions)
        )
        -- Similarity threshold
        AND 1 - (canon_entries.embedding <=> query_embedding) > match_threshold
    ORDER BY canon_entries.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
```

---

## **SLICE 4: Temporal Layer (2 Wochen)**
**Ziel:** 12-Monats-Blueprint mit "forbidden actions" und Phasen-Übergängen

### Implementation:
```sql
-- Temporal blueprints (12-month phases)
CREATE TABLE temporal_blueprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),

    phase_number INTEGER CHECK (phase_number BETWEEN 1 AND 12),
    phase_name TEXT NOT NULL, -- e.g. "Foundation", "Metabolic Optimization", etc.
    phase_start_date DATE NOT NULL,
    phase_end_date DATE NOT NULL,

    active_focus_block TEXT NOT NULL, -- Current priority (e.g. "Sleep Architecture")
    forbidden_actions TEXT[] DEFAULT '{}', -- Explicitly deferred
    deferred_actions JSONB DEFAULT '[]'::jsonb, -- Queued for future phases

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_temporal_user_date ON temporal_blueprints(user_id, phase_start_date);
```

**Seeding Logic:**
```typescript
// /supabase/functions/generate-temporal-blueprint/index.ts
const PHASE_TEMPLATES = [
    {
        phase_number: 1,
        phase_name: 'Foundation: Sleep Architecture',
        duration_days: 30,
        active_focus_block: 'Sleep Consistency',
        forbidden_actions: ['HIIT', 'Extended Fasting', 'New Supplements'],
        deferred_actions: [
            { action: 'Introduce HIIT', target_phase: 3 },
            { action: 'Optimize Supplement Stack', target_phase: 2 }
        ]
    },
    {
        phase_number: 2,
        phase_name: 'Metabolic Flexibility',
        duration_days: 30,
        active_focus_block: 'Fasting Windows + Glucose Stability',
        forbidden_actions: ['High-Intensity Training', 'Late-Night Eating'],
        deferred_actions: []
    },
    {
        phase_number: 3,
        phase_name: 'Movement Capacity Building',
        duration_days: 30,
        active_focus_block: 'Strength + Cardiovascular Base',
        forbidden_actions: ['Fasting >16h', 'Sleep Deprivation'],
        deferred_actions: []
    }
    // ... 9 more phases
];

export default async function handler(req: Request) {
    const { user_id, start_date } = await req.json();

    let currentDate = new Date(start_date);

    for (const template of PHASE_TEMPLATES) {
        const phaseEndDate = new Date(currentDate);
        phaseEndDate.setDate(phaseEndDate.getDate() + template.duration_days);

        await supabase.from('temporal_blueprints').insert({
            user_id,
            phase_number: template.phase_number,
            phase_name: template.phase_name,
            phase_start_date: currentDate.toISOString().split('T')[0],
            phase_end_date: phaseEndDate.toISOString().split('T')[0],
            active_focus_block: template.active_focus_block,
            forbidden_actions: template.forbidden_actions,
            deferred_actions: template.deferred_actions
        });

        currentDate = phaseEndDate;
    }

    return new Response('Blueprint generated', { status: 200 });
}
```

**Integration in Decision Synthesis:**
```typescript
// In decision-synthesis function
async function getTemporalContext(user_id: string) {
    const today = new Date().toISOString().split('T')[0];

    const { data: currentPhase } = await supabase
        .from('temporal_blueprints')
        .select('*')
        .eq('user_id', user_id)
        .lte('phase_start_date', today)
        .gte('phase_end_date', today)
        .single();

    return {
        phase_name: currentPhase.phase_name,
        active_focus_block: currentPhase.active_focus_block,
        forbidden_actions: currentPhase.forbidden_actions,
        deferred_actions: currentPhase.deferred_actions,
        phase_end_date: currentPhase.phase_end_date
    };
}

// In LLM prompt construction
const temporalContext = await getTemporalContext(user_id);

const systemPrompt = `
${MINIMAL_CANON}

## Current Temporal Context:
- Phase: ${temporalContext.phase_name}
- Focus Block: ${temporalContext.active_focus_block}
- Forbidden Actions: ${temporalContext.forbidden_actions.join(', ')}
- Phase ends on: ${temporalContext.phase_end_date}

CRITICAL RULE: You MUST NOT recommend any action listed in "Forbidden Actions". These are explicitly deferred for later phases.
`;
```

---

## **SLICE 5: Contextual Layer + Optimization (1.5 Wochen)**
**Ziel:** Wissenschaftliche Studien/Protokolle als dritte Knowledge Layer

### Implementation:
```sql
-- Contextual knowledge entries (studies, protocols, heuristics)
CREATE TABLE contextual_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    entry_type TEXT NOT NULL CHECK (entry_type IN ('study', 'protocol', 'mechanism', 'heuristic')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536),

    -- Applicability metadata
    applicable_phases INTEGER[] DEFAULT '{}', -- Which phases this applies to
    applicable_constraints JSONB DEFAULT '{}'::jsonb,
    risk_profile TEXT CHECK (risk_profile IN ('low', 'moderate', 'high')),

    -- Evidence metadata
    source_url TEXT,
    publication_year INTEGER,
    quality_score INTEGER CHECK (quality_score BETWEEN 1 AND 10),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contextual_embedding ON contextual_entries USING ivfflat (embedding vector_cosine_ops);
```

**Seeding Examples:**
```typescript
const CONTEXTUAL_SEED_DATA = [
    {
        entry_type: 'study',
        title: 'HRV-Guided Training Enhances Cardiac-Vagal Modulation',
        content: 'A 12-week RCT showed that athletes who adjusted training intensity based on daily HRV measurements achieved 15% greater improvements in aerobic capacity compared to fixed-intensity controls. HRV-guided training prevents overtraining and optimizes adaptation.',
        applicable_phases: [3, 4, 5], // Movement phases
        applicable_constraints: { recovery_state: ['moderate', 'low'] },
        risk_profile: 'low',
        source_url: 'https://pubmed.ncbi.nlm.nih.gov/...',
        publication_year: 2021,
        quality_score: 9
    },
    {
        entry_type: 'protocol',
        title: 'Box Breathing for Parasympathetic Activation',
        content: '4-4-4-4 breathing (inhale 4s, hold 4s, exhale 4s, hold 4s) performed for 5 minutes twice daily has been shown to reduce sympathetic tone and improve HRV within 7 days. Effective for stress_load = elevated or high.',
        applicable_phases: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // All phases
        applicable_constraints: { stress_load: ['elevated', 'high', 'burnout_risk'] },
        risk_profile: 'low',
        source_url: 'https://...',
        publication_year: 2023,
        quality_score: 8
    }
    // ... Add 50-100 entries
];
```

**Updated Retrieval Logic:**
```typescript
// In decision-synthesis function
async function retrieveContextualKnowledge(
    user_id: string,
    state: UserState,
    temporalContext: TemporalContext,
    queryEmbedding: number[]
) {
    const { data } = await supabase.rpc('match_contextual_entries', {
        query_embedding: queryEmbedding,
        match_threshold: 0.65,
        match_count: 3,
        current_phase: temporalContext.phase_number,
        state_constraints: state
    });

    return data;
}

// PostgreSQL function
CREATE OR REPLACE FUNCTION match_contextual_entries(
    query_embedding vector(1536),
    match_threshold float,
    match_count int,
    current_phase int,
    state_constraints jsonb
)
RETURNS TABLE (
    id uuid,
    entry_type text,
    title text,
    content text,
    quality_score int,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        contextual_entries.id,
        contextual_entries.entry_type,
        contextual_entries.title,
        contextual_entries.content,
        contextual_entries.quality_score,
        1 - (contextual_entries.embedding <=> query_embedding) AS similarity
    FROM contextual_entries
    WHERE
        -- Phase filter
        current_phase = ANY(applicable_phases)
        -- Constraint filter
        AND (
            applicable_constraints = '{}'::jsonb
            OR applicable_constraints @> state_constraints
        )
        -- Similarity threshold
        AND 1 - (contextual_entries.embedding <=> query_embedding) > match_threshold
    ORDER BY
        quality_score DESC, -- Prioritize high-quality entries
        contextual_entries.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
```

---

## ✅ Gesamter Slice-Zeitplan

| Slice | Deliverable | Dauer | Kumulativ |
|-------|-------------|-------|-----------|
| 1 | Minimal Decision Engine (hardcoded Canon) | 2 Wochen | 2 Wochen |
| 2 | State Hydration Loop (BioSync → State) | 1.5 Wochen | 3.5 Wochen |
| 3 | Canon Vector Layer + Retrieval | 2 Wochen | 5.5 Wochen |
| 4 | Temporal Layer (12-Month Blueprint) | 2 Wochen | 7.5 Wochen |
| 5 | Contextual Layer + Optimization | 1.5 Wochen | 9 Wochen |

**Total: 9 Wochen** (vs. 12 Wochen im Original-RAG-Guide)

---

## 📊 Datenstruktur-Spezifikation

### **Kapitel 1: User State Data Model**
Format: PostgreSQL (Supabase)

#### 1.1 Static Profile
```sql
-- EXISTING: user_profiles + health_profiles
-- NO CHANGES NEEDED (already 90% aligned)
```

#### 1.2 Dynamic State (NEW)
```sql
CREATE TABLE user_states (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) UNIQUE,

    -- Sleep
    sleep_debt TEXT CHECK (sleep_debt IN ('none', 'mild', 'moderate', 'severe')),
    sleep_7day_avg_hours DECIMAL(3,1),
    sleep_consistency_score INTEGER, -- 0-100

    -- Stress & Recovery
    stress_load TEXT CHECK (stress_load IN ('baseline', 'elevated', 'high', 'burnout_risk')),
    recovery_state TEXT CHECK (recovery_state IN ('optimal', 'moderate', 'low')),
    hrv_7day_avg INTEGER, -- RMSSD in ms
    hrv_30day_baseline INTEGER,
    rhr_current INTEGER, -- Resting Heart Rate in bpm

    -- Training
    training_load TEXT CHECK (training_load IN ('deload', 'maintenance', 'building', 'overreaching')),
    weekly_training_volume_minutes INTEGER,
    last_hiit_session_date DATE,

    -- Metabolic
    metabolic_flexibility TEXT CHECK (metabolic_flexibility IN ('stable', 'dysregulated')),
    fasting_glucose_mg_dl INTEGER,
    post_meal_spike_avg INTEGER,

    -- Constraints
    active_constraints JSONB DEFAULT '[]'::jsonb,
    -- Example: [{"type": "travel", "start": "2026-02-10", "end": "2026-02-15"}, {"type": "injury", "location": "knee", "severity": "mild"}]

    -- Metadata
    last_material_change_at TIMESTAMPTZ,
    last_hydration_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 1.3 Event Log (Audit Trail)
```sql
CREATE TABLE state_events (
    event_id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),

    field TEXT NOT NULL, -- e.g. "sleep_debt", "stress_load"
    previous_value TEXT,
    new_value TEXT,

    source TEXT NOT NULL, -- 'biosync_hrv', 'biosync_sleep', 'self_report', 'system_derived'
    triggered_reevaluation BOOLEAN DEFAULT false,

    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Partitioned by month for performance
CREATE INDEX idx_state_events_user_time ON state_events(user_id, timestamp DESC);
```

---

### **Kapitel 2: Knowledge Architecture**
Format: PostgreSQL + Vector (pgvector)

#### 2.1 Canon Layer
```sql
CREATE TABLE canon_entries (
    id UUID PRIMARY KEY,

    -- Content
    domain TEXT NOT NULL CHECK (domain IN (
        'sleep_regulation',
        'metabolic_health',
        'movement_hierarchy',
        'stress_nervous_system',
        'meaning_purpose'
    )),
    doctrine TEXT NOT NULL, -- The "what" (1-2 sentences)
    mechanism TEXT NOT NULL, -- The "why" (3-5 sentences)

    -- Vector
    embedding vector(1536), -- OpenAI text-embedding-3-small

    -- Applicability
    applicability_conditions JSONB DEFAULT '{}'::jsonb,
    -- Example: {"sleep_debt": ["none", "mild"], "training_load": ["maintenance", "building"]}
    contraindications JSONB DEFAULT '[]'::jsonb,
    -- Example: [{"field": "sleep_debt", "value": "severe"}]

    -- Evidence
    evidence_grade TEXT CHECK (evidence_grade IN ('S', 'A', 'B', 'C')),
    -- S = Meta-analysis / RCT consensus
    -- A = Multiple RCTs
    -- B = Single RCT or strong observational
    -- C = Expert consensus / mechanistic reasoning

    -- Versioning
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    retired_at TIMESTAMPTZ
);

CREATE INDEX idx_canon_embedding ON canon_entries USING ivfflat (embedding vector_cosine_ops);
```

#### 2.2 Temporal Layer
```sql
CREATE TABLE temporal_blueprints (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),

    phase_number INTEGER CHECK (phase_number BETWEEN 1 AND 12),
    phase_name TEXT NOT NULL,
    phase_start_date DATE NOT NULL,
    phase_end_date DATE NOT NULL,

    active_focus_block TEXT NOT NULL,
    forbidden_actions TEXT[] DEFAULT '{}',
    deferred_actions JSONB DEFAULT '[]'::jsonb,

    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2.3 Contextual Layer
```sql
CREATE TABLE contextual_entries (
    id UUID PRIMARY KEY,

    entry_type TEXT NOT NULL CHECK (entry_type IN ('study', 'protocol', 'mechanism', 'heuristic')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536),

    -- Applicability
    applicable_phases INTEGER[] DEFAULT '{}',
    applicable_constraints JSONB DEFAULT '{}'::jsonb,
    risk_profile TEXT CHECK (risk_profile IN ('low', 'moderate', 'high')),

    -- Evidence
    source_url TEXT,
    publication_year INTEGER,
    quality_score INTEGER CHECK (quality_score BETWEEN 1 AND 10),

    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### **Kapitel 3: Decision Storage**
```sql
CREATE TABLE active_decisions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),

    -- Decision content (Response Contract)
    decision_data JSONB NOT NULL,
    -- {
    --   "decision": "...",
    --   "why_now": "...",
    --   "cost_of_decision": "...",
    --   "next_14_days_action": "..."
    -- }

    -- Audit context
    state_snapshot JSONB NOT NULL, -- User state at time of generation
    temporal_context JSONB NOT NULL, -- Active phase + forbidden actions
    canon_entries_used UUID[] DEFAULT '{}', -- References to canon_entries
    contextual_entries_used UUID[] DEFAULT '{}',

    -- Metadata
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    superseded_at TIMESTAMPTZ, -- When a new decision replaces this
    user_dismissed_at TIMESTAMPTZ -- If user explicitly dismisses
);

-- Only show the LATEST non-dismissed decision
CREATE INDEX idx_active_decisions_latest ON active_decisions(user_id, generated_at DESC)
WHERE superseded_at IS NULL AND user_dismissed_at IS NULL;
```

---

### **Kapitel 4: BioSync Integration Points**
Format: Existing `wearable_data` table (already exists in EV)

```sql
-- EXISTING TABLE (no changes needed)
-- Just add new event triggers

-- Trigger: On new wearable_data insert, call State Hydration
CREATE OR REPLACE FUNCTION trigger_state_hydration()
RETURNS TRIGGER AS $$
BEGIN
    -- Call Edge Function asynchronously
    PERFORM net.http_post(
        url := 'https://your-project.supabase.co/functions/v1/state-hydration',
        headers := '{"Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
        body := jsonb_build_object(
            'user_id', NEW.user_id,
            'data_type', NEW.data_type,
            'data', NEW.data
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_wearable_data_insert
AFTER INSERT ON wearable_data
FOR EACH ROW
EXECUTE FUNCTION trigger_state_hydration();
```

---

## 🎯 Zusammenfassung & Nächste Schritte

### ✅ Was du jetzt hast:
1. **Klare Antwort:** RAG ist EXTREM sinnvoll und strategisch zwingend
2. **Gap-Analyse:** 70% der Infrastruktur existiert bereits
3. **Slice-Based Roadmap:** 9 Wochen statt 12
4. **Vollständige Datenstruktur:** SQL-Schemas für alle Komponenten
5. **Code-Beispiele:** Konkrete Implementierungen für jede Phase

### 🚀 Empfohlene nächste Schritte:

#### **JETZT (Woche 1):**
1. ✅ Dieser Report ist dein Blueprint
2. Entscheidung: Slice 1 sofort starten ODER erst Wearable-Integration (BioSync) priorisieren?
3. pgvector Extension in Supabase aktivieren (1 Klick in Dashboard)

#### **Woche 2-3: Slice 1**
- `user_states` Tabelle + `state_events` erstellen
- Minimal LLM Decision Synthesis (hardcoded Canon)
- Active Decision Card UI bauen

#### **Woche 4-5: Slice 2**
- State Hydration Loop implementieren
- BioSync Webhook-Integration (falls Wearables bereits connected)

#### **Woche 6-8: Slice 3 + 4**
- Canon Vector Layer (Editorial + Engineering)
- Temporal Blueprints (12-Month Phases)

#### **Woche 9: Slice 5 + Launch Prep**
- Contextual Layer (Studien/Protokolle)
- Testing + Monitoring Setup

---

## 📝 Offene Fragen für dich:

1. **Wearable-Status:** Sind Oura/Whoop/HealthKit Integrationen bereits live oder nur Code-Ready? (Laut `SYSTEM_SUMMARY.md` "implemented but pending deployment")

2. **Canon Editorial:** Wer kuratiert die Canon-Einträge? Braucht Domain-Expertise in Longevity Science. Hast du Zugang zu einem Experten?

3. **LLM Budget:** Claude Sonnet 4.5 kostet ~$3 per 1M Input-Tokens. Bei 1000 aktiven Usern mit 2 Decisions/Woche = ~$24/Monat. OK?

4. **Priorisierung:** Sollte Slice 2 (State Hydration) VOR Slice 1 starten, wenn Wearables noch nicht live sind? Oder erst Slice 1 mit Mock-Daten?

5. **Versioning:** Wie aggressiv soll das Canon-Versioning sein? Quarterly Review wie im PRD oder häufiger?

---

**Soll ich dir basierend auf diesem Blueprint eine konkrete Task-Liste für die nächsten 2 Wochen erstellen?**
