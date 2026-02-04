# ExtensioVitae — Technisches Konzept: Modulares Tracking-System

**Version:** 1.0
**Datum:** 2026-02-04
**Autor:** Claude (Autonomous Product Architect)
**Basis:** VISION.md v2.0, FUTURE.md

---

## 📋 EXECUTIVE SUMMARY

Dieses Dokument beschreibt die technische Architektur für die Erweiterung von ExtensioVitae von einem statischen 30-Tage-Plan-System zu einem **kontinuierlichen, modularen Biologischen Betriebssystem**.

**Kernproblem:** 30-Tage-Pläne sind gut für Akquisition, aber nicht für langfristige Bindung. Ein "Biologisches Family Office" erfordert kontinuierliches, kontextbewusstes Tracking mit integrierbaren Modulen.

**Lösungsansatz:** Layered Architecture mit:
1. **Core Engine** — Kontinuierliches Daily Tracking
2. **Module Registry** — Plug-in System für Jahrespläne, Fasten, Blutchecks
3. **Context Layer** — Intelligente Anpassung basierend auf Modus + Daten
4. **Fulfillment Bridge** — Vorbereitung für H3

**Geschätzter Gesamtaufwand:** 12-16 Wochen (1 Entwickler)

---

## 🎯 ZIELE & AXIOM-ALIGNMENT

| Ziel | Axiom | Wie erfüllt |
|------|-------|-------------|
| Tägliches Tracking ohne Friction | AX-1 | Auto-generated daily view, <30 sec check-in |
| Kontextbewusste Anpassung | AX-2 | Module reagieren auf Emergency Modes |
| Ausführung statt Information | AX-3 | Jedes Modul hat konkrete Actions |
| Diskret & unsichtbar | AX-4 | Keine Social Features, keine Sharing |
| Objektive Daten | AX-5 | Wearable + Lab Integration ready |

---

## 🏗️ ARCHITEKTUR OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER INTERFACE LAYER                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Daily View  │  │ Module Hub  │  │ Insights    │              │
│  │ (Heute)     │  │ (Alle)      │  │ (Progress)  │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────┐
│                    CONTEXT LAYER                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Mode Engine │  │ Time Engine │  │ Bio Engine  │              │
│  │ (Travel,..) │  │ (Circadian) │  │ (HRV, Labs) │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────┐
│                    MODULE REGISTRY                               │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐        │
│  │ 30-Day    │ │ Jahres-   │ │ Fasten-   │ │ Blut-     │        │
│  │ Plan      │ │ plan      │ │ modul     │ │ check     │  ...   │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘        │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────┐
│                    CORE ENGINE                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Daily       │  │ Task        │  │ Progress    │              │
│  │ Aggregator  │  │ Scheduler   │  │ Tracker     │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────┐
│                    DATA LAYER (Supabase)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ user_       │  │ module_     │  │ daily_      │              │
│  │ profiles    │  │ instances   │  │ tracking    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 DATENBANK-SCHEMA

### Neue Tabellen

```sql
-- =====================================================
-- MODULE DEFINITIONS (System-weit, von Admin gepflegt)
-- =====================================================
CREATE TABLE module_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identification
    slug TEXT UNIQUE NOT NULL,           -- 'fasting', 'blood-check', 'yearly-plan'
    name_de TEXT NOT NULL,               -- 'Fastenmodul'
    name_en TEXT NOT NULL,               -- 'Fasting Module'
    description_de TEXT,
    description_en TEXT,

    -- Module Type
    type TEXT NOT NULL,                  -- 'recurring', 'one-time', 'continuous'
    duration_days INTEGER,               -- NULL = infinite, 7 = 7 days, etc.

    -- Configuration Schema (JSON Schema)
    config_schema JSONB DEFAULT '{}',    -- What options does this module have?

    -- Task Template
    task_template JSONB NOT NULL,        -- Template for generating tasks

    -- Context Integration
    affected_by_modes TEXT[] DEFAULT '{}', -- ['travel', 'sick'] = paused in these modes
    priority_weight INTEGER DEFAULT 50,    -- Higher = shown first in daily view

    -- Pricing (for future)
    is_premium BOOLEAN DEFAULT false,

    -- Metadata
    version TEXT DEFAULT '1.0',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MODULE INSTANCES (Pro User aktivierte Module)
-- =====================================================
CREATE TABLE module_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    module_id UUID REFERENCES module_definitions(id) ON DELETE CASCADE NOT NULL,

    -- Instance State
    status TEXT DEFAULT 'active',         -- 'active', 'paused', 'completed', 'cancelled'
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ends_at TIMESTAMPTZ,                  -- NULL = no end date
    paused_at TIMESTAMPTZ,

    -- User Configuration
    config JSONB DEFAULT '{}',            -- User's choices for this module

    -- Progress
    current_day INTEGER DEFAULT 1,
    total_days INTEGER,                   -- Calculated from module duration
    completion_percentage DECIMAL(5,2) DEFAULT 0,

    -- Context
    auto_pause_in_modes TEXT[] DEFAULT '{}', -- User override for mode pausing

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    UNIQUE(user_id, module_id, started_at)
);

-- =====================================================
-- DAILY TRACKING (Zentrale Tracking-Tabelle)
-- =====================================================
CREATE TABLE daily_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Date (one row per user per day)
    tracking_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Context Snapshot (at start of day)
    active_mode TEXT,                     -- 'normal', 'travel', 'sick', 'detox', 'deep_work'
    readiness_score INTEGER,              -- 0-100 (from wearable or manual)

    -- Aggregated Tasks (from all active modules)
    tasks JSONB NOT NULL DEFAULT '[]',    -- Array of task objects

    -- Completion Summary
    tasks_total INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0,

    -- Time Tracking (AX-1 monitoring)
    time_spent_seconds INTEGER DEFAULT 0, -- Total time in app this day

    -- User Notes (optional)
    notes TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    UNIQUE(user_id, tracking_date)
);

-- =====================================================
-- TASK COMPLETIONS (Granular task tracking)
-- =====================================================
CREATE TABLE task_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    daily_tracking_id UUID REFERENCES daily_tracking(id) ON DELETE CASCADE,
    module_instance_id UUID REFERENCES module_instances(id) ON DELETE SET NULL,

    -- Task Identification
    task_id TEXT NOT NULL,                -- Unique within the day
    task_type TEXT NOT NULL,              -- 'action', 'reminder', 'check-in'

    -- Task Content
    title_de TEXT NOT NULL,
    title_en TEXT,
    description TEXT,
    pillar TEXT,                          -- 'sleep', 'nutrition', 'exercise', etc.
    duration_minutes INTEGER,

    -- Completion
    status TEXT DEFAULT 'pending',        -- 'pending', 'completed', 'skipped', 'snoozed'
    completed_at TIMESTAMPTZ,
    skipped_reason TEXT,

    -- Source
    source_module TEXT,                   -- 'fasting', '30-day-plan', etc.

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- LAB RESULTS (für Blutcheck-Modul)
-- =====================================================
CREATE TABLE lab_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Lab Info
    lab_date DATE NOT NULL,
    lab_provider TEXT,                    -- 'Quest', 'LabCorp', 'Custom'

    -- Raw Data
    raw_file_url TEXT,                    -- Uploaded PDF
    parsed_data JSONB,                    -- Extracted values

    -- Key Biomarkers (normalized)
    biomarkers JSONB NOT NULL DEFAULT '{}',
    -- Example: {"vitamin_d": {"value": 28, "unit": "ng/ml", "optimal_min": 50, "optimal_max": 80}}

    -- Analysis
    deficiencies JSONB DEFAULT '[]',      -- Array of identified deficiencies
    recommendations JSONB DEFAULT '[]',   -- Generated recommendations

    -- Verification
    verification_status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'flagged'
    verified_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_module_instances_user ON module_instances(user_id);
CREATE INDEX idx_module_instances_status ON module_instances(status);
CREATE INDEX idx_daily_tracking_user_date ON daily_tracking(user_id, tracking_date);
CREATE INDEX idx_task_completions_daily ON task_completions(daily_tracking_id);
CREATE INDEX idx_task_completions_user ON task_completions(user_id);
CREATE INDEX idx_lab_results_user ON lab_results(user_id);
```

---

## 🧩 MODULE REGISTRY — BEISPIEL-MODULE

### 1. Jahresplan-Modul

```json
{
  "slug": "yearly-plan",
  "name_de": "Jahres-Optimierung",
  "type": "continuous",
  "duration_days": 365,
  "config_schema": {
    "focus_areas": {
      "type": "array",
      "items": ["longevity", "performance", "recovery", "metabolic"],
      "min_items": 1,
      "max_items": 3
    },
    "quarterly_goals": {
      "type": "object",
      "properties": {
        "q1": { "type": "string" },
        "q2": { "type": "string" },
        "q3": { "type": "string" },
        "q4": { "type": "string" }
      }
    }
  },
  "task_template": {
    "weekly_review": {
      "frequency": "weekly",
      "day": "sunday",
      "task": {
        "type": "check-in",
        "title_de": "Wochen-Review",
        "duration_minutes": 5,
        "pillar": "mindset"
      }
    },
    "monthly_biomarker_check": {
      "frequency": "monthly",
      "day": 1,
      "task": {
        "type": "reminder",
        "title_de": "Monatlicher Health-Check",
        "duration_minutes": 2,
        "pillar": "health"
      }
    },
    "quarterly_goal_review": {
      "frequency": "quarterly",
      "task": {
        "type": "action",
        "title_de": "Quartals-Ziel Review",
        "duration_minutes": 15,
        "pillar": "mindset"
      }
    }
  },
  "affected_by_modes": [],
  "priority_weight": 30
}
```

### 2. Fasten-Modul

```json
{
  "slug": "fasting-protocol",
  "name_de": "Fastenprotokoll",
  "type": "recurring",
  "duration_days": 7,
  "config_schema": {
    "fasting_type": {
      "type": "enum",
      "options": ["16-8", "18-6", "omad", "5-2", "prolonged-3day"]
    },
    "eating_window_start": {
      "type": "time",
      "default": "12:00"
    },
    "eating_window_end": {
      "type": "time",
      "default": "20:00"
    }
  },
  "task_template": {
    "morning_fast_reminder": {
      "frequency": "daily",
      "time": "07:00",
      "task": {
        "type": "reminder",
        "title_de": "Fastenphase läuft — nur Wasser, Kaffee (schwarz), Tee",
        "duration_minutes": 0,
        "pillar": "nutrition"
      }
    },
    "eating_window_start": {
      "frequency": "daily",
      "time": "{{config.eating_window_start}}",
      "task": {
        "type": "reminder",
        "title_de": "Essensfenster beginnt",
        "duration_minutes": 0,
        "pillar": "nutrition"
      }
    },
    "eating_window_end": {
      "frequency": "daily",
      "time": "{{config.eating_window_end}}",
      "task": {
        "type": "action",
        "title_de": "Letzte Mahlzeit — Essensfenster schließt",
        "duration_minutes": 0,
        "pillar": "nutrition"
      }
    },
    "electrolytes": {
      "frequency": "daily",
      "time": "10:00",
      "condition": "config.fasting_type IN ['prolonged-3day']",
      "task": {
        "type": "action",
        "title_de": "Elektrolyte nehmen (Na, K, Mg)",
        "duration_minutes": 2,
        "pillar": "nutrition"
      }
    }
  },
  "affected_by_modes": ["sick", "travel"],
  "priority_weight": 70
}
```

### 3. Blutcheck-Modul

```json
{
  "slug": "blood-check",
  "name_de": "Blutbild-Optimierung",
  "type": "recurring",
  "duration_days": 90,
  "config_schema": {
    "last_lab_date": { "type": "date" },
    "target_markers": {
      "type": "array",
      "items": ["vitamin_d", "b12", "ferritin", "tsh", "hba1c", "homocysteine"]
    }
  },
  "task_template": {
    "supplement_based_on_labs": {
      "frequency": "daily",
      "time": "08:00",
      "condition": "lab_results.deficiencies.length > 0",
      "task": {
        "type": "action",
        "title_de": "{{generated_supplement_reminder}}",
        "duration_minutes": 2,
        "pillar": "supplements"
      }
    },
    "retest_reminder": {
      "frequency": "once",
      "day": 85,
      "task": {
        "type": "reminder",
        "title_de": "Zeit für neuen Blutcheck — Termin buchen",
        "duration_minutes": 5,
        "pillar": "health"
      }
    }
  },
  "affected_by_modes": [],
  "priority_weight": 60
}
```

---

## 🔄 CORE ENGINE — Daily Aggregation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    DAILY AGGREGATION FLOW                        │
│                    (Runs at 00:01 user timezone)                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 1. GET CONTEXT                                                   │
│    - Current Emergency Mode                                      │
│    - Readiness Score (if wearable connected)                    │
│    - Calendar events for today                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. GET ACTIVE MODULES                                            │
│    SELECT * FROM module_instances                                │
│    WHERE user_id = ? AND status = 'active'                      │
│    AND (ends_at IS NULL OR ends_at > CURRENT_DATE)              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. FILTER BY CONTEXT                                             │
│    FOR EACH module:                                              │
│      IF current_mode IN module.affected_by_modes:               │
│        SKIP (paused due to mode)                                │
│      IF readiness_score < 50 AND module requires high_energy:   │
│        SWAP tasks (HIIT → Yoga)                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. GENERATE TASKS                                                │
│    FOR EACH active module:                                       │
│      - Apply task_template with user config                     │
│      - Calculate which tasks apply to TODAY                     │
│      - Apply time substitutions                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. SORT & DEDUPLICATE                                            │
│    - Sort by time, then priority_weight                         │
│    - Merge similar tasks (e.g., multiple supplement reminders)  │
│    - Cap at MAX_DAILY_TASKS (AX-1 compliance)                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. WRITE TO daily_tracking                                       │
│    INSERT INTO daily_tracking (user_id, tracking_date, tasks)   │
│    VALUES (?, CURRENT_DATE, ?)                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📱 UI KONZEPT

### Daily View (Hauptansicht)

```
┌─────────────────────────────────────────┐
│  ExtensioVitae        [🔔] [👤]         │
├─────────────────────────────────────────┤
│                                         │
│  Guten Morgen, Manuel                   │
│  Heute: 4 Tasks · ~12 min               │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ 🟢 Travel Mode aktiv            │    │
│  │    Angepasst für Jetlag         │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ─────── 07:00 ───────                  │
│  ┌─────────────────────────────────┐    │
│  │ ☀️ Morgenlicht holen             │    │
│  │ 10 min · Circadian              │    │
│  │ [✓ Erledigt]                    │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ─────── 08:00 ───────                  │
│  ┌─────────────────────────────────┐    │
│  │ 💊 Supplements                   │    │
│  │ Vitamin D, Omega-3              │    │
│  │ [ ] Noch offen                  │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ─────── 12:00 ───────                  │
│  ┌─────────────────────────────────┐    │
│  │ 🍽️ Essensfenster startet        │    │
│  │ Fasten-Modul · 16:8             │    │
│  │ [Info]                          │    │
│  └─────────────────────────────────┘    │
│                                         │
├─────────────────────────────────────────┤
│  [Heute]  [Module]  [Progress]  [Mehr]  │
└─────────────────────────────────────────┘
```

### Module Hub

```
┌─────────────────────────────────────────┐
│  ← Module                               │
├─────────────────────────────────────────┤
│                                         │
│  AKTIVE MODULE                          │
│  ┌─────────────────────────────────┐    │
│  │ 📅 30-Tage Blueprint            │    │
│  │ Tag 12/30 · 40% erledigt        │    │
│  │ [→]                             │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ 🍽️ Fasten 16:8                  │    │
│  │ Aktiv · 12:00-20:00             │    │
│  │ [→]                             │    │
│  └─────────────────────────────────┘    │
│                                         │
│  VERFÜGBARE MODULE                      │
│  ┌─────────────────────────────────┐    │
│  │ 🩸 Blutbild-Optimierung         │    │
│  │ 90 Tage · Personalisiert        │    │
│  │ [+ Aktivieren]                  │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ 📆 Jahres-Optimierung           │    │
│  │ 365 Tage · Quartalsziele        │    │
│  │ [+ Aktivieren]                  │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ ❄️ Kälteprotokoll               │    │
│  │ 30 Tage · Cold Exposure         │    │
│  │ [+ Aktivieren]                  │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

---

## 📈 AUFWANDSSCHÄTZUNG

### Phase 1: Core Engine (4-5 Wochen)

| Task | Aufwand | Priorität |
|------|---------|-----------|
| Database Schema (neue Tabellen) | 2 Tage | 🔴 |
| Daily Aggregation Service | 5 Tage | 🔴 |
| Module Registry Backend | 3 Tage | 🔴 |
| Daily View UI | 4 Tage | 🔴 |
| Module Hub UI | 3 Tage | 🔴 |
| Context Integration (Modes) | 3 Tage | 🟠 |
| Migration bestehender 30-Tage-Pläne | 2 Tage | 🔴 |
| **Subtotal** | **22 Tage** | |

### Phase 2: Basis-Module (3-4 Wochen)

| Task | Aufwand | Priorität |
|------|---------|-----------|
| 30-Tage-Plan als Modul refactoren | 3 Tage | 🔴 |
| Fasten-Modul | 4 Tage | 🟠 |
| Jahresplan-Modul (Basic) | 3 Tage | 🟠 |
| Circadian-Modul | 3 Tage | 🟠 |
| Supplement-Timing-Modul | 4 Tage | 🟠 |
| Module Activation Flow | 2 Tage | 🔴 |
| **Subtotal** | **19 Tage** | |

### Phase 3: Advanced Features (3-4 Wochen)

| Task | Aufwand | Priorität |
|------|---------|-----------|
| Blutcheck-Modul + OCR Integration | 7 Tage | 🟡 |
| Wearable Data Integration | 5 Tage | 🟡 |
| Readiness-based Task Swapping | 3 Tage | 🟡 |
| Progress Analytics | 3 Tage | 🟡 |
| Notification Engine | 3 Tage | 🟡 |
| **Subtotal** | **21 Tage** | |

### Phase 4: Polish & Scale (2-3 Wochen)

| Task | Aufwand | Priorität |
|------|---------|-----------|
| Performance Optimization | 3 Tage | 🟡 |
| Edge Cases & Error Handling | 3 Tage | 🟠 |
| Offline Support | 3 Tage | 🟢 |
| Module Marketplace UI | 4 Tage | 🟢 |
| A/B Testing Setup | 2 Tage | 🟢 |
| **Subtotal** | **15 Tage** | |

---

## 📊 GESAMTÜBERSICHT

| Phase | Dauer | Aufwand | Status |
|-------|-------|---------|--------|
| **Phase 1:** Core Engine | 4-5 Wochen | 22 Tage | 🔴 CRITICAL |
| **Phase 2:** Basis-Module | 3-4 Wochen | 19 Tage | 🟠 HIGH |
| **Phase 3:** Advanced | 3-4 Wochen | 21 Tage | 🟡 MEDIUM |
| **Phase 4:** Polish | 2-3 Wochen | 15 Tage | 🟢 LOW |
| **TOTAL** | **12-16 Wochen** | **77 Tage** | |

### Mit Parallelisierung (2 Entwickler)

| Szenario | Dauer |
|----------|-------|
| 1 Entwickler | 12-16 Wochen |
| 2 Entwickler | 7-9 Wochen |
| 1 Entwickler + Designer | 10-12 Wochen |

---

## 🚀 EMPFOHLENER STARTPUNKT

**Minimum Viable Module System (4-5 Wochen):**

1. ✅ Database Schema
2. ✅ Daily Aggregation Service
3. ✅ Refactor 30-Tage-Plan als Modul
4. ✅ Daily View UI
5. ✅ Fasten-Modul (als erstes neues Modul)
6. ✅ Module Hub (Basic)

**Danach iterativ:**
- Jahresplan
- Blutcheck
- Wearable Integration

---

## ⚠️ RISIKEN & MITIGATIONEN

| Risiko | Wahrscheinlichkeit | Mitigation |
|--------|-------------------|------------|
| Migration bricht bestehende User | MITTEL | Dual-Mode: Alte + neue Ansicht parallel |
| Zu viele Tasks pro Tag (AX-1 Verletzung) | HOCH | Hard cap: MAX_DAILY_TASKS = 8 |
| Module-Konflikte (z.B. 2 Fasten-Module) | NIEDRIG | Validation bei Aktivierung |
| Performance bei vielen Modulen | MITTEL | Caching + Background Jobs |
| Komplexität für User | HOCH | Default-Module, progressive disclosure |

---

## 🔗 ALIGNMENT MIT VISION.md

| Feature | Horizon | Axiom |
|---------|---------|-------|
| Daily Tracking | H1 | AX-1, AX-2 |
| Module System | H1 | AX-2, AX-3 |
| Fasten-Modul | H1 | AX-2 |
| Blutcheck-Modul | H3 Bridge | AX-5 |
| Jahresplan | H1 | AX-3 |
| Wearable Integration | H2 | AX-5 |
| Context-based Swapping | H2 | AX-2 |

---

## 📝 NÄCHSTE SCHRITTE

1. **Entscheidung:** Phase 1 starten?
2. **Team:** Wer entwickelt? (Solo oder Team)
3. **Timeline:** Q1 oder Q2 2026?
4. **Priorität:** Welche Module zuerst nach 30-Tage-Refactor?

---

*Technisches Konzept v1.0 | 2026-02-04 | Aligned with VISION.md v2.0*
