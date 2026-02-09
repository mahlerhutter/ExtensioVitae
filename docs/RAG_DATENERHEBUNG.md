# RAG Datenerhebung für ExtensioVitae
## Welche Daten sammeln? In welchem Format? Wie strukturieren?

**Version:** 1.0
**Datum:** 8. Februar 2026

---

## 🎯 Übersicht

Dieses Dokument definiert **WAS** du sammeln musst, **WIE** du es formatieren sollst, und **WIE** du es in logische Kapitel aufteilst – speziell optimiert für die RAG-Integration in ExtensioVitae.

---

## 📊 KAPITEL 1: User State Data (Dynamic)

### 🎯 Zweck
Kontinuierliche Tracking-Daten, die sich täglich/wöchentlich ändern und die Entscheidungsfindung treiben.

### 📝 Zu erhebende Daten:

#### 1.1 Sleep Data
**Quelle:** Wearables (Oura, Whoop, Apple Watch) via HealthKit/Google Health Connect

| Feld | Format | Einheit | Update-Frequenz | Threshold für Material Change |
|------|--------|---------|-----------------|-------------------------------|
| `sleep_duration` | DECIMAL(3,1) | Stunden | Täglich | ±1.0h vom 7-Tage-Durchschnitt |
| `sleep_efficiency` | INTEGER | Prozent (0-100) | Täglich | ±10% vom 7-Tage-Durchschnitt |
| `deep_sleep_minutes` | INTEGER | Minuten | Täglich | ±20 Minuten vom Baseline |
| `rem_sleep_minutes` | INTEGER | Minuten | Täglich | ±15 Minuten vom Baseline |
| `sleep_onset_time` | TIME | HH:MM | Täglich | ±60 Minuten (Consistency-Check) |
| `wake_time` | TIME | HH:MM | Täglich | ±60 Minuten (Consistency-Check) |
| `sleep_debt_categorical` | ENUM | 'none', 'mild', 'moderate', 'severe' | Täglich | Kategorie-Wechsel |

**Aggregation:**
- 7-Tage-Durchschnitt für `sleep_duration`, `sleep_efficiency`
- 30-Tage-Baseline für Deep/REM Sleep
- Consistency Score: Varianz der `sleep_onset_time` über 7 Tage

**Beispiel JSON (Rohdaten-Format):**
```json
{
  "user_id": "uuid-123",
  "date": "2026-02-08",
  "sleep_duration": 7.2,
  "sleep_efficiency": 87,
  "deep_sleep_minutes": 105,
  "rem_sleep_minutes": 98,
  "sleep_onset_time": "23:15",
  "wake_time": "06:45",
  "data_source": "oura_ring"
}
```

---

#### 1.2 Heart Rate Variability (HRV)
**Quelle:** Wearables (Oura, Whoop, Apple Watch)

| Feld | Format | Einheit | Update-Frequenz | Threshold |
|------|--------|---------|-----------------|-----------|
| `hrv_rmssd` | INTEGER | Millisekunden | Täglich | ±15% vom 30-Tage-Baseline |
| `resting_heart_rate` | INTEGER | BPM | Täglich | ±5 BPM vom 7-Tage-Durchschnitt |
| `hrv_7day_avg` | INTEGER | ms | Täglich (rolling) | ±10% Änderung innerhalb 7 Tage |
| `hrv_30day_baseline` | INTEGER | ms | Wöchentlich | Initial nach 30 Tagen, dann monatlich |
| `stress_load_categorical` | ENUM | 'baseline', 'elevated', 'high', 'burnout_risk' | Täglich | Kategorie-Wechsel |

**Thresholds für `stress_load_categorical`:**
- `baseline`: HRV ≥ 95% vom 30-Tage-Baseline
- `elevated`: HRV 85-94% vom Baseline
- `high`: HRV 70-84% vom Baseline
- `burnout_risk`: HRV < 70% vom Baseline

**Beispiel JSON:**
```json
{
  "user_id": "uuid-123",
  "date": "2026-02-08",
  "hrv_rmssd": 48,
  "resting_heart_rate": 58,
  "hrv_7day_avg": 52,
  "hrv_30day_baseline": 55,
  "data_source": "whoop"
}
```

---

#### 1.3 Activity & Training Load
**Quelle:** Wearables + Manual Logging

| Feld | Format | Einheit | Update-Frequenz | Threshold |
|------|--------|---------|-----------------|-----------|
| `daily_steps` | INTEGER | Steps | Täglich | ±2000 vom 7-Tage-Durchschnitt |
| `active_energy_kcal` | INTEGER | Kilokalorien | Täglich | ±200 vom Baseline |
| `workout_sessions` | JSONB Array | Structured | Per Workout | N/A |
| `training_load_weekly` | INTEGER | Minuten | Wöchentlich | ±20% vom Baseline |
| `training_load_categorical` | ENUM | 'deload', 'maintenance', 'building', 'overreaching' | Wöchentlich | Kategorie-Wechsel |

**`workout_sessions` Struktur:**
```json
{
  "date": "2026-02-08",
  "type": "HIIT",
  "duration_minutes": 35,
  "intensity": "high",
  "perceived_exertion": 8,
  "completed": true
}
```

**Thresholds für `training_load_categorical`:**
- `deload`: < 50% vom 4-Wochen-Durchschnitt
- `maintenance`: 50-80% vom Durchschnitt
- `building`: 80-120% vom Durchschnitt
- `overreaching`: > 120% vom Durchschnitt UND (`recovery_state` = 'low' OR `hrv_rmssd` < 85% Baseline)

---

#### 1.4 Metabolic Data
**Quelle:** Lab Tests (periodisch) + Continuous Glucose Monitors (optional)

| Feld | Format | Einheit | Update-Frequenz | Threshold |
|------|--------|---------|-----------------|-----------|
| `fasting_glucose_mg_dl` | INTEGER | mg/dL | Quartalsweise (Lab) | ±10 mg/dL |
| `hba1c_percent` | DECIMAL(3,1) | Prozent | Quartalsweise | ±0.3% |
| `post_meal_spike_avg` | INTEGER | mg/dL | Wöchentlich (CGM) | ±20 mg/dL |
| `metabolic_flexibility_categorical` | ENUM | 'stable', 'dysregulated' | Quartalsweise | Kategorie-Wechsel |

**Thresholds für `metabolic_flexibility_categorical`:**
- `stable`: Fasting Glucose < 100 mg/dL UND HbA1c < 5.5%
- `dysregulated`: Fasting Glucose ≥ 100 mg/dL ODER HbA1c ≥ 5.5%

**Beispiel JSON:**
```json
{
  "user_id": "uuid-123",
  "test_date": "2026-02-01",
  "fasting_glucose_mg_dl": 92,
  "hba1c_percent": 5.2,
  "data_source": "lab_test_ocr"
}
```

---

#### 1.5 Recovery State (Aggregated)
**Quelle:** Berechnet aus HRV + Sleep + RHR

| Feld | Format | Einheit | Update-Frequenz |
|------|--------|---------|-----------------|
| `recovery_score` | INTEGER | 0-100 | Täglich |
| `recovery_state_categorical` | ENUM | 'optimal', 'moderate', 'low' | Täglich |

**Recovery Score Formel (aus RAG Spec):**
```
recoveryScore = (
  hrvScore × 0.50 +
  sleepScore × 0.30 +
  rhrScore × 0.20
)

Where:
  hrvScore = 50 + ((currentHRV / 7dayBaselineHRV - 1) × 100)
  sleepScore = (sleepEfficiency × 0.40) + ((deepSleep + remSleep) / totalSleep × 60)
  rhrScore = 50 + ((7dayBaselineRHR - currentRHR) / 7dayBaselineRHR × 200)

recovery_state_categorical:
  ≥70: optimal
  50-69: moderate
  <50: low
```

---

#### 1.6 Active Constraints
**Quelle:** Manual Input + Calendar Sync + System-Derived

| Feld | Format | Beispiel | Update-Frequenz |
|------|--------|----------|-----------------|
| `active_constraints` | JSONB Array | Siehe unten | Event-Based |

**Constraint Types:**
```json
[
  {
    "type": "travel",
    "start_date": "2026-02-10",
    "end_date": "2026-02-15",
    "timezone": "America/New_York",
    "impact": ["sleep_disruption", "limited_equipment"]
  },
  {
    "type": "injury",
    "location": "knee",
    "severity": "mild",
    "started_at": "2026-01-28",
    "restrictions": ["no_running", "no_jumping"]
  },
  {
    "type": "illness",
    "severity": "moderate",
    "started_at": "2026-02-05",
    "symptoms": ["fatigue", "congestion"]
  },
  {
    "type": "calendar_event",
    "event_type": "late_night_social",
    "date": "2026-02-09",
    "expected_sleep_impact": "high"
  }
]
```

---

### 📦 Datenbank-Schema (PostgreSQL)

```sql
-- Dynamic User State (Materialized View)
CREATE TABLE user_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) UNIQUE,

    -- Sleep
    sleep_debt TEXT CHECK (sleep_debt IN ('none', 'mild', 'moderate', 'severe')),
    sleep_7day_avg_hours DECIMAL(3,1),
    sleep_consistency_score INTEGER CHECK (sleep_consistency_score BETWEEN 0 AND 100),

    -- HRV & Stress
    stress_load TEXT CHECK (stress_load IN ('baseline', 'elevated', 'high', 'burnout_risk')),
    hrv_rmssd_current INTEGER,
    hrv_7day_avg INTEGER,
    hrv_30day_baseline INTEGER,
    rhr_current INTEGER,

    -- Recovery
    recovery_state TEXT CHECK (recovery_state IN ('optimal', 'moderate', 'low')),
    recovery_score INTEGER CHECK (recovery_score BETWEEN 0 AND 100),

    -- Training
    training_load TEXT CHECK (training_load IN ('deload', 'maintenance', 'building', 'overreaching')),
    weekly_training_volume_minutes INTEGER,
    last_hiit_session_date DATE,

    -- Metabolic
    metabolic_flexibility TEXT CHECK (metabolic_flexibility IN ('stable', 'dysregulated')),
    fasting_glucose_mg_dl INTEGER,
    hba1c_percent DECIMAL(3,1),

    -- Constraints
    active_constraints JSONB DEFAULT '[]'::jsonb,

    -- Metadata
    last_material_change_at TIMESTAMPTZ,
    last_hydration_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event Log (Immutable)
CREATE TABLE state_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),

    field TEXT NOT NULL,
    previous_value TEXT,
    new_value TEXT,
    source TEXT NOT NULL,
    triggered_reevaluation BOOLEAN DEFAULT false,

    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_state_events_user_time ON state_events(user_id, timestamp DESC);
```

---

## 📊 KAPITEL 2: Canon Knowledge Layer (Editorial)

### 🎯 Zweck
Non-negotiable Longevity-Prinzipien, die immer gelten (unabhängig vom User State).

### 📝 Zu erhebende Daten:

#### 2.1 Canon Entry Struktur

| Feld | Format | Beschreibung | Beispiel |
|------|--------|--------------|----------|
| `domain` | ENUM | Longevity-Bereich | 'sleep_regulation' |
| `doctrine` | TEXT (1-2 Sätze) | Die "Was"-Aussage | "Sleep timing consistency matters more than duration." |
| `mechanism` | TEXT (3-5 Sätze) | Die "Warum"-Erklärung | "Consistent sleep-wake times strengthen circadian entrainment..." |
| `applicability_conditions` | JSONB | Wann gilt dies? | `{"sleep_debt": ["none", "mild"]}` |
| `contraindications` | JSONB Array | Wann NICHT? | `[{"field": "sleep_debt", "value": "severe"}]` |
| `evidence_grade` | ENUM | Evidenzstärke | 'A' (RCT-backed) |

#### 2.2 Domains & Mindest-Einträge

| Domain | Mindestanzahl | Fokus |
|--------|---------------|-------|
| `sleep_regulation` | 5-7 | Sleep timing, architecture, hygiene |
| `metabolic_health` | 5-7 | Glucose stability, insulin sensitivity, fasting |
| `movement_hierarchy` | 5-7 | Walking first, then strength, then HIIT |
| `stress_nervous_system` | 5-7 | HRV, breathwork, parasympathetic activation |
| `meaning_purpose` | 3-5 | Social connection, purpose, loneliness |

**Total: 23-33 Canon Entries für MVP**

#### 2.3 Beispiel Canon Entries

```json
{
  "domain": "sleep_regulation",
  "doctrine": "Sleep timing consistency matters more than sleep duration.",
  "mechanism": "Consistent sleep-wake times strengthen circadian entrainment, improving sleep quality, metabolic regulation, and cognitive performance. A user sleeping 7 hours at consistent times outperforms a user sleeping 8 hours at varying times. Circadian misalignment increases cortisol dysregulation and insulin resistance.",
  "applicability_conditions": {
    "sleep_debt": ["none", "mild"]
  },
  "contraindications": [
    {"field": "sleep_debt", "value": "severe"}
  ],
  "evidence_grade": "A",
  "source_citations": [
    "Walker, M. (2017). Why We Sleep. Scribner.",
    "Chaix, A. et al. (2019). Time-Restricted Feeding Prevents Obesity. Cell Metabolism."
  ]
}
```

```json
{
  "domain": "metabolic_health",
  "doctrine": "Glucose stability is the primary metabolic lever.",
  "mechanism": "Fasting glucose, post-meal spikes, and overnight glucose patterns are the first metrics to optimize. Stable glucose reduces systemic inflammation, improves insulin sensitivity, and prevents glycation damage to tissues. Even in non-diabetics, glucose variability correlates with cardiovascular risk.",
  "applicability_conditions": {},
  "contraindications": [],
  "evidence_grade": "S",
  "source_citations": [
    "Ceriello, A. et al. (2008). Glucose variability and diabetic complications. Diabetes."
  ]
}
```

```json
{
  "domain": "movement_hierarchy",
  "doctrine": "Walking is the highest-ROI movement.",
  "mechanism": "Before any structured training program, daily walking volume must be established at a minimum of 8,000 steps. Walking improves cardiovascular health, metabolic flexibility, and recovery capacity with minimal fatigue cost. It serves as the foundation for all higher-intensity training.",
  "applicability_conditions": {
    "training_load": ["deload", "maintenance"]
  },
  "contraindications": [],
  "evidence_grade": "S",
  "source_citations": [
    "Paluch, A. et al. (2022). Steps per day and all-cause mortality. JAMA."
  ]
}
```

```json
{
  "domain": "stress_nervous_system",
  "doctrine": "Chronic sympathetic dominance is the silent longevity killer.",
  "mechanism": "HRV trends are the primary indicator of nervous system state. Daily nervous system regulation (breathwork, meditation, or parasympathetic activation) is non-negotiable for longevity. Chronic stress accelerates epigenetic aging and telomere shortening.",
  "applicability_conditions": {},
  "contraindications": [],
  "evidence_grade": "A",
  "source_citations": [
    "Thayer, J.F. et al. (2012). A meta-analysis of heart rate variability. Psychophysiology."
  ]
}
```

```json
{
  "domain": "meaning_purpose",
  "doctrine": "Purpose and social connection are not soft metrics.",
  "mechanism": "Longitudinal data places purpose and social connection alongside exercise and nutrition in terms of mortality impact. Isolation and lack of purpose accelerate biological aging through inflammatory pathways and neuroendocrine dysregulation.",
  "applicability_conditions": {},
  "contraindications": [],
  "evidence_grade": "A",
  "source_citations": [
    "Holt-Lunstad, J. et al. (2010). Social relationships and mortality risk. PLOS Medicine."
  ]
}
```

### 📦 Datenbank-Schema

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

CREATE INDEX idx_canon_embedding ON canon_entries USING ivfflat (embedding vector_cosine_ops);
```

---

## 📊 KAPITEL 3: Contextual Knowledge Layer

### 🎯 Zweck
Wissenschaftliche Studien, Protokolle, Mechanismen – conditional gültig je nach User State.

### 📝 Zu erhebende Daten:

#### 3.1 Entry Types

| Type | Beschreibung | Anzahl (MVP) | Beispiel |
|------|--------------|--------------|----------|
| `study` | Peer-reviewed Research | 30-50 | "HRV-Guided Training Enhances Aerobic Capacity" |
| `protocol` | Actionable Interventions | 20-30 | "Box Breathing for Parasympathetic Activation" |
| `mechanism` | Biological Explanations | 15-20 | "Why Glucose Spikes Damage Endothelium" |
| `heuristic` | Expert Rules-of-Thumb | 10-15 | "Never train HIIT below 85% HRV baseline" |

**Total: 75-115 Entries für MVP**

#### 3.2 Contextual Entry Struktur

| Feld | Format | Beschreibung |
|------|--------|--------------|
| `entry_type` | ENUM | 'study', 'protocol', 'mechanism', 'heuristic' |
| `title` | TEXT | Kurze Headline |
| `content` | TEXT | 3-5 Sätze Zusammenfassung |
| `applicable_phases` | INTEGER[] | In welchen 12-Monats-Phasen relevant? |
| `applicable_constraints` | JSONB | Welche User States? |
| `risk_profile` | ENUM | 'low', 'moderate', 'high' |
| `source_url` | TEXT | PubMed Link, DOI |
| `publication_year` | INTEGER | Für Recency-Filtering |
| `quality_score` | INTEGER (1-10) | Evidenzstärke |

#### 3.3 Beispiel Entries

**Study:**
```json
{
  "entry_type": "study",
  "title": "HRV-Guided Training Enhances Cardiac-Vagal Modulation",
  "content": "A 12-week RCT showed that athletes who adjusted training intensity based on daily HRV measurements achieved 15% greater improvements in aerobic capacity compared to fixed-intensity controls. HRV-guided training prevents overtraining and optimizes adaptation. N=60, p<0.01.",
  "applicable_phases": [3, 4, 5, 6],
  "applicable_constraints": {
    "recovery_state": ["moderate", "low"],
    "training_load": ["building", "overreaching"]
  },
  "risk_profile": "low",
  "source_url": "https://pubmed.ncbi.nlm.nih.gov/33846571/",
  "publication_year": 2021,
  "quality_score": 9
}
```

**Protocol:**
```json
{
  "entry_type": "protocol",
  "title": "Box Breathing for Parasympathetic Activation",
  "content": "4-4-4-4 breathing (inhale 4s, hold 4s, exhale 4s, hold 4s) performed for 5 minutes twice daily has been shown to reduce sympathetic tone and improve HRV within 7 days. Effective for elevated or high stress states. Zero equipment, minimal time cost.",
  "applicable_phases": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  "applicable_constraints": {
    "stress_load": ["elevated", "high", "burnout_risk"]
  },
  "risk_profile": "low",
  "source_url": "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC...",
  "publication_year": 2023,
  "quality_score": 8
}
```

**Mechanism:**
```json
{
  "entry_type": "mechanism",
  "title": "Why Glucose Spikes Damage Endothelium",
  "content": "Post-meal glucose spikes above 140 mg/dL trigger oxidative stress and glycation of vascular proteins. Repeated spikes impair nitric oxide production, causing endothelial dysfunction—the earliest marker of cardiovascular disease. This occurs even in non-diabetics.",
  "applicable_phases": [2, 3, 4, 5, 6],
  "applicable_constraints": {
    "metabolic_flexibility": ["dysregulated"]
  },
  "risk_profile": "moderate",
  "source_url": "https://pubmed.ncbi.nlm.nih.gov/...",
  "publication_year": 2019,
  "quality_score": 9
}
```

**Heuristic:**
```json
{
  "entry_type": "heuristic",
  "title": "Never Train HIIT Below 85% HRV Baseline",
  "content": "When HRV drops below 85% of your 30-day baseline, high-intensity training compounds stress load and delays recovery. Substitute HIIT with zone 2 cardio or yoga until HRV rebounds. This rule prevents overtraining-induced HRV suppression.",
  "applicable_phases": [3, 4, 5, 6, 7],
  "applicable_constraints": {
    "stress_load": ["elevated", "high"],
    "recovery_state": ["low"]
  },
  "risk_profile": "low",
  "source_url": "https://www.hrv4training.com/blog/...",
  "publication_year": 2024,
  "quality_score": 7
}
```

### 📦 Datenbank-Schema

```sql
CREATE TABLE contextual_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    entry_type TEXT NOT NULL CHECK (entry_type IN ('study', 'protocol', 'mechanism', 'heuristic')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536),

    applicable_phases INTEGER[] DEFAULT '{}',
    applicable_constraints JSONB DEFAULT '{}'::jsonb,
    risk_profile TEXT CHECK (risk_profile IN ('low', 'moderate', 'high')),

    source_url TEXT,
    publication_year INTEGER,
    quality_score INTEGER CHECK (quality_score BETWEEN 1 AND 10),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contextual_embedding ON contextual_entries USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_contextual_quality ON contextual_entries(quality_score DESC);
```

---

## 📊 KAPITEL 4: Temporal Layer (12-Month Blueprint)

### 🎯 Zweck
Definiert WAS in WELCHER Phase erlaubt/verboten ist. Erzwingt Sequenzierung.

### 📝 Zu erhebende Daten:

#### 4.1 Phase Template Struktur

| Feld | Format | Beschreibung |
|------|--------|--------------|
| `phase_number` | INTEGER (1-12) | Monats-Phase |
| `phase_name` | TEXT | Human-readable Name |
| `duration_days` | INTEGER | Typischerweise 30 |
| `active_focus_block` | TEXT | Primäre Priorität |
| `forbidden_actions` | TEXT[] | Explizit NICHT erlaubt |
| `deferred_actions` | JSONB[] | Für spätere Phasen |

#### 4.2 Beispiel 12-Monats-Blueprint

**Phase 1: Foundation - Sleep Architecture**
```json
{
  "phase_number": 1,
  "phase_name": "Foundation: Sleep Architecture",
  "duration_days": 30,
  "active_focus_block": "Sleep Consistency & Hygiene",
  "forbidden_actions": [
    "HIIT Training",
    "Extended Fasting (>16h)",
    "New Supplement Introduction",
    "Late-Night Social Events"
  ],
  "deferred_actions": [
    {"action": "Introduce HIIT", "target_phase": 3, "rationale": "Need sleep foundation first"},
    {"action": "Optimize Supplement Stack", "target_phase": 2, "rationale": "After metabolic baseline established"}
  ]
}
```

**Phase 2: Metabolic Flexibility**
```json
{
  "phase_number": 2,
  "phase_name": "Metabolic Flexibility",
  "duration_days": 30,
  "active_focus_block": "Fasting Windows + Glucose Stability",
  "forbidden_actions": [
    "High-Intensity Training",
    "Carb-Heavy Post-Workout Meals",
    "Late-Night Eating (after 20:00)"
  ],
  "deferred_actions": [
    {"action": "Introduce Strength Training", "target_phase": 3}
  ]
}
```

**Phase 3: Movement Capacity Building**
```json
{
  "phase_number": 3,
  "phase_name": "Movement Capacity Building",
  "duration_days": 30,
  "active_focus_block": "Strength + Cardiovascular Base",
  "forbidden_actions": [
    "Fasting >16h on Training Days",
    "HIIT when HRV <85% baseline",
    "Training 2 Days in Row (require 1 rest day)"
  ],
  "deferred_actions": [
    {"action": "Advanced HIIT Protocols", "target_phase": 5}
  ]
}
```

**Phase 4-12:** (Ähnliche Struktur für Stress Management, Advanced Training, Recovery Optimization, etc.)

### 📦 Datenbank-Schema

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

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_temporal_user_date ON temporal_blueprints(user_id, phase_start_date);
```

---

## 📊 KAPITEL 5: Decision History & Audit Trail

### 🎯 Zweck
Alle generierten Entscheidungen mit vollständigem Kontext speichern (für Debugging, Analytics, ML).

### 📝 Zu erhebende Daten:

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
    superseded_at TIMESTAMPTZ, -- When replaced by new decision
    user_dismissed_at TIMESTAMPTZ, -- If user explicitly dismisses
    user_feedback_rating INTEGER CHECK (user_feedback_rating BETWEEN 1 AND 5)
);

CREATE INDEX idx_active_decisions_latest ON active_decisions(user_id, generated_at DESC)
WHERE superseded_at IS NULL AND user_dismissed_at IS NULL;
```

---

## 🎯 Zusammenfassung: Datenerhebungs-Checkliste

### ✅ Sofort erheben (für MVP):

#### Dynamic State Data:
- [ ] Sleep Duration, Efficiency, Deep/REM (Oura/Whoop/Apple Watch)
- [ ] HRV RMSSD, Resting Heart Rate (Wearables)
- [ ] Daily Steps, Active Energy (Wearables)
- [ ] Workout Sessions (Manual Log + Wearables)
- [ ] Fasting Glucose, HbA1c (Lab Tests via OCR – bereits implementiert)

#### Canon Layer (Editorial):
- [ ] 5-7 Sleep Doctrine Entries
- [ ] 5-7 Metabolic Entries
- [ ] 5-7 Movement Entries
- [ ] 5-7 Stress/HRV Entries
- [ ] 3-5 Purpose/Connection Entries
**Total: 23-33 Entries**

#### Temporal Layer:
- [ ] 12-Monats-Phasen-Template definieren
- [ ] Forbidden Actions pro Phase festlegen

#### Contextual Layer:
- [ ] 30-50 Studies (PubMed Zusammenfassungen)
- [ ] 20-30 Protocols (Actionable Interventions)
- [ ] 15-20 Mechanisms (Biological Explanations)
**Total: 65-100 Entries**

---

### 🔄 Kontinuierlich erheben (nach MVP):

- Weekly Training Load Adjustments
- Quarterly Metabolic Lab Tests
- User Feedback Ratings on Decisions
- Decision Dismissal Patterns (für Prompt-Optimierung)

---

### 📊 Datenformate-Übersicht:

| Datentyp | Primärformat | Storage |
|----------|--------------|---------|
| Dynamic State | PostgreSQL (normalized) + JSONB (constraints) | `user_states`, `state_events` |
| Canon Layer | PostgreSQL + Vector (pgvector) | `canon_entries` |
| Contextual Layer | PostgreSQL + Vector | `contextual_entries` |
| Temporal Layer | PostgreSQL | `temporal_blueprints` |
| Decision History | PostgreSQL (JSONB) | `active_decisions` |
| Raw Wearable Data | PostgreSQL (time-series, partitioned) | `wearable_data` |

---

**Alle SQL-Schemas sind produktionsbereit und können direkt in Supabase deployed werden.**
