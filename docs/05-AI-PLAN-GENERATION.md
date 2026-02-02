# EXTENSIOVITAE — AI Plan Generation

## Overview

The plan generation uses a **hybrid approach**:
1. **LLM Mode** (OpenAI GPT-4 or Claude) — If API credentials are configured
2. **Algorithm Mode** — Deterministic fallback when no LLM is available

Output is:
- Structured JSON (for localStorage storage)
- Actionable daily micro-tasks (≤30 min total/day)
- No medical claims
- German language

---

## Configuration

### Environment Variables

```bash
# OpenAI API Key (for GPT-4 plan generation)
VITE_OPENAI_API_KEY=sk-...

# Anthropic API Key (for Claude plan generation)
VITE_ANTHROPIC_API_KEY=sk-ant-...

# Preferred LLM Provider: 'openai', 'claude', or 'auto' (default)
VITE_LLM_PROVIDER=auto
```

### Priority Order
1. If `VITE_LLM_PROVIDER=openai` and OpenAI key exists → Use OpenAI
2. If `VITE_LLM_PROVIDER=claude` and Claude key exists → Use Claude
3. If `VITE_LLM_PROVIDER=auto`:
   - OpenAI key exists → Use OpenAI
   - Claude key exists → Use Claude
4. No keys → Use deterministic algorithm

---

## The 6 Pillars

Every plan draws from these 6 evidence-based longevity pillars:

| Pillar ID | Name | Description |
|-----------|------|-------------|
| `sleep_recovery` | Sleep & Recovery | Sleep hygiene, timing, environment, regeneration |
| `circadian_rhythm` | Circadian Rhythm | Light exposure, caffeine timing, meal rhythm |
| `mental_resilience` | Mental Resilience | Breathwork, meditation, stress management |
| `nutrition_metabolism` | Nutrition & Metabolism | Protein timing, blood sugar control, meal quality |
| `movement_muscle` | Movement & Muscle | Strength training, NEAT, Zone-2 cardio, steps |
| `supplements` | Supplements | Targeted supplementation (low priority in MVP) |

---

## Need Score Algorithm

The plan builder calculates a **need score (0-100)** for each pillar based on user inputs:

### Sleep & Recovery (`sleep_recovery`)
```javascript
let sleepNeed = 50;
if (sleepBucket < 6) sleepNeed += 30;
else if (sleepBucket < 7) sleepNeed += 15;
if (primaryGoal === 'sleep') sleepNeed += 20;
if (stress > 7) sleepNeed += 10;
```

### Circadian Rhythm (`circadian_rhythm`)
```javascript
let circadianNeed = 40;
if (primaryGoal === 'energy') circadianNeed += 25;
if (sleepBucket < 7) circadianNeed += 15;
if (stress > 5) circadianNeed += 10;
```

### Mental Resilience (`mental_resilience`)
```javascript
let mentalNeed = 30;
mentalNeed += stress * 5; // Direct stress mapping
if (primaryGoal === 'stress') mentalNeed += 20;
```

### Nutrition & Metabolism (`nutrition_metabolism`)
```javascript
let nutritionNeed = 40;
if (primaryGoal === 'fat_loss') nutritionNeed += 30;
if (dietPatterns.includes('late_eating')) nutritionNeed += 15;
if (dietPatterns.includes('high_sugar_snacks')) nutritionNeed += 10;
```

### Movement & Muscle (`movement_muscle`)
```javascript
let movementNeed = 35;
if (trainingFreq === '0') movementNeed += 35;
else if (trainingFreq === '1-2') movementNeed += 20;
if (primaryGoal === 'fat_loss' || primaryGoal === 'strength_fitness') movementNeed += 20;
```

### Supplements (`supplements`)
```javascript
let supplementNeed = Math.min(needs.supplements, 30); // Hard cap at 30
```

---

## Plan Phases

The 30-day plan is divided into 4 progressive phases:

| Phase | Days | Focus |
|-------|------|-------|
| **Stabilize** | 1-7 | Foundation building, establishing habits |
| **Build** | 8-14 | Increasing intensity and complexity |
| **Optimize** | 15-21 | Fine-tuning and personalization |
| **Consolidate** | 22-30 | Habit integration and sustainability |

---

## Task Selection Algorithm

1. **Rank pillars** by need score (highest first)
2. **Calculate daily time budget** (user input: 10, 20, or 30 minutes)
3. **Filter tasks** from task library by pillar relevance
4. **Select tasks** that fit within time budget
5. **Progress difficulty** based on phase (week 1 easier, week 4 more advanced)

---

## Task Library Structure

Tasks are defined in `src/lib/taskLibrary.js`:

```javascript
const TASKS_EXAMPLE = [
  {
    id: 'circadian_morning_light',
    pillar: 'circadian_rhythm',
    summary: '2-3 Minuten Tageslicht draußen, ohne Sonnenbrille.',
    instruction: 'Geh morgens direkt nach dem Aufstehen für 2-3 Minuten nach draußen...',
    duration_minutes: 3,
    phase: ['stabilize', 'build', 'optimize', 'consolidate'],
    scienceNote: 'Setzt Cortisol-Awakening-Response, verankert circadianen Rhythmus.'
  },
  // ... more tasks
];
```

---

## Output JSON Schema

```json
{
  "user_name": "Max",
  "generated_at": "2026-02-01T10:00:00.000Z",
  "start_date": "2026-02-01",
  "plan_summary": "Generated specifically for energy with a 10 min daily budget.",
  "primary_focus_pillars": ["circadian", "mental", "sleep"],
  "meta": {
    "computed": {
      "needs": {
        "sleep_recovery": 73,
        "circadian_rhythm": 78,
        "mental_resilience": 82,
        "nutrition_metabolism": 58,
        "movement_muscle": 7,
        "supplements": 20
      },
      "rankedPillars": ["mental_resilience", "circadian_rhythm", "sleep_recovery", ...],
      "dailyBudget": 10
    }
  },
  "days": [
    {
      "day": 1,
      "phase": "stabilize",
      "total_time": 6,
      "tasks": [
        {
          "id": "d1_t0_circadian_morning_light",
          "pillar": "circadian_rhythm",
          "summary": "2-3 Minuten Tageslicht draußen, ohne Sonnenbrille.",
          "duration": 3
        },
        {
          "id": "d1_t1_sleep_evening_routine",
          "pillar": "sleep_recovery",
          "summary": "30 Minuten vor Schlaf: Blaulichtbrille aufsetzen.",
          "duration": 3
        }
      ]
    }
    // ... 29 more days
  ]
}
```

---

## Input JSON Schema

```json
{
  "name": "Max",
  "age": 35,
  "sex": "male",
  "primary_goal": "energy",
  "sleep_hours_bucket": "6-6.5",
  "stress_1_10": 7,
  "training_frequency": "1-2",
  "diet_pattern": ["late_eating", "high_sugar_snacks"],
  "height_cm": 178,
  "weight_kg": 82,
  "daily_time_budget": "10",
  "equipment_access": "basic"
}
```

---

## Personalization Factors

| Factor | Impact |
|--------|--------|
| **Age** | Adjusts recovery intensity (50+ = more sleep focus) |
| **Primary Goal** | Heavily weights the plan (e.g., "fat_loss" → nutrition + movement) |
| **Sleep Hours** | If <7, prioritize sleep extension strategies |
| **Stress Level** | If >7, prioritize nervous system down-regulation |
| **Training Frequency** | Build movement habits that complement activity level |
| **Diet Pattern** | Address specific flags (e.g., "late_eating" → timing focus) |
| **Time Budget** | STRICTLY respect the daily limit (10, 20, or 30 mins) |
| **Equipment** | No gym exercises if equipment = "none" |
| **Health Profile** ⭐ **NEW (v2.1)** | Filter tasks based on chronic conditions, injuries, and health status |

---

## Health Profile Integration (v2.1)

**Added:** 2026-02-02

The plan builder now integrates detailed health profiles to ensure safe, personalized recommendations:

### Health-Based Task Filtering

Tasks are automatically filtered based on:
- **Chronic Conditions** (16 types: diabetes, heart disease, cancer, asthma, etc.)
- **Injuries & Limitations** (11 types: back pain, knee issues, shoulder problems, etc.)
- **Lifestyle Factors** (smoking, alcohol, medications)

### Intensity Capping

Maximum exercise intensity is automatically capped based on health conditions:

| Health Status | Max Intensity | Example Restrictions |
|---------------|---------------|---------------------|
| **Heart Disease** | Gentle (0) | No HIIT, heavy lifting |
| **Pregnancy** | Moderate (1) | No supine exercises, hot yoga |
| **Knee Issues** | Moderate (1) | No jumping, running, deep squats |
| **Diabetes** | Intense (2) | Post-meal walks prioritized |
| **Healthy** | Intense (2) | No restrictions |

### Task Avoidance Rules

Specific tasks are excluded based on conditions:
- **Heart Disease** → No HIIT, heavy deadlifts, intense cardio
- **Knee Problems** → No jumping, running, deep squats
- **Pregnancy** → No supine exercises, high-impact, hot yoga
- **Back Pain** → No heavy deadlifts, spinal flexion under load

### Preference Boosting

Therapeutic activities are prioritized:
- **Diabetes** → Post-meal walks, blood sugar control
- **Hypertension** → Breathing exercises, Zone 2 cardio
- **Anxiety** → Meditation, breathwork, nature walks

### Plan Metadata

Health adaptations are stored in plan metadata:

```json
{
  "meta": {
    "health": {
      "hasProfile": true,
      "warnings": [
        "Nach Mahlzeiten kurze Bewegung empfohlen",
        "Kein High-Impact Training"
      ],
      "summary": {
        "topWarnings": ["Diabetes Typ 2", "Knieprobleme"],
        "intensityNote": "Plan auf moderate Intensität begrenzt"
      },
      "intensityCap": 1,
      "tasksFiltered": 12
    }
  }
}
```

**Documentation:** See `/docs/implementation/USER_HEALTH_PROFILE_SYSTEM.md` for full details.


---

## Code Location

The plan builder is implemented in:
- `src/lib/planGenerator.js` — Unified generator (auto LLM/algorithm selection)
- `src/lib/llmPlanGenerator.js` — OpenAI and Claude integration
- `src/lib/planBuilder.js` — Deterministic `build30DayBlueprint()` function (v2.1 - health-aware)
- `src/lib/taskLibrary.js` — Task definitions
- `src/lib/healthConstraints.js` ⭐ **NEW** — Health-based task filtering and intensity capping
- `src/lib/profileService.js` ⭐ **NEW** — Health profile management
- `src/pages/HealthProfilePage.jsx` ⭐ **NEW** — Health profile UI

---

## Critical Constraints

- ✅ **NEVER make medical claims or diagnoses**
- ✅ **NEVER recommend medications or treatments**
- ✅ **Maximum 30 minutes of daily effort**
- ✅ **Be specific and actionable, not vague**
- ✅ **German language for all user-facing text**
- ✅ **Automatic fallback to algorithm if LLM fails**

---

## Example Task Formats

### Good
- "2-3 Minuten Tageslicht draußen, ohne Sonnenbrille."
- "30 Minuten vor Schlaf: Blaulichtbrille aufsetzen."
- "10-Min Walk, Nase atmen, locker."

### Bad
- "Get some sunlight in the morning"
- "Try to sleep better"
- "Do some exercise"

---

## Fallback Handling

### LLM Mode
1. Attempt to generate with configured LLM (OpenAI or Claude)
2. If LLM fails (API error, invalid response):
   - Log error to console
   - Automatically fall back to deterministic algorithm
   - Add `llm_error` field to plan metadata

### Algorithm Mode
1. Generate deterministic plan
2. If generation fails:
   - Use MOCK_PLAN as fallback
   - Display dashboard with mock data

---

## Console Logs

The system logs the generation method:
```
[Dashboard] Plan generator config: { llmAvailable: true, llmProvider: 'openai', defaultMode: 'llm' }
[PlanGenerator] LLM available (openai), attempting LLM generation...
[LLM] Generating plan with openai...
[LLM] Plan generated successfully with openai
[Dashboard] Plan generated via: llm
[Dashboard] LLM provider: openai
```

---

*Decision: Hybrid approach - use LLM when available for creative, personalized plans; fall back to algorithm for reliability and zero API cost.*

