# EXTENSIOVITAE — Intake Form

## Design Principles

- Complete in ≤3 minutes
- Progressive disclosure (step-by-step wizard)
- No medical history (liability)
- Focus on lifestyle, constraints, goals
- Every question maps directly to plan personalization
- **German language UI**

---

## Current Implementation (MVP)

The intake form is implemented in `src/pages/IntakePage.jsx` with 12 questions organized in a step-by-step wizard format.

---

## Question Specification

### Questions (12 total)

| # | Field Name | German Label | Type | Options |
|---|------------|--------------|------|---------|
| 1 | `name` | Wie heißt du? | text | — |
| 2 | `age` | Wie alt bist du? | number | 18-80 |
| 3 | `sex` | Dein Geschlecht | select | Männlich, Weiblich |
| 4 | `primary_goal` | Was ist dein Hauptziel? | select | 6 options |
| 5 | `sleep_hours_bucket` | Wie viele Stunden schläfst du durchschnittlich? | select | 6 ranges |
| 6 | `stress_1_10` | Wie hoch ist dein Stresslevel? | slider | 1-10 |
| 7 | `training_frequency` | Trainingseinheiten pro Woche | select | 4 options |
| 8 | `diet_pattern` | Ernährungsmuster (Mehrfachauswahl) | multiselect | 6 options |
| 9 | `height_cm` | Größe in cm | number | 130-220 |
| 10 | `weight_kg` | Gewicht in kg | number | 40-200 |
| 11 | `daily_time_budget` | Tägliches Zeitbudget | select | 10, 20, 30 min |
| 12 | `equipment_access` | Verfügbares Equipment | select | 3 options |

---

## Field Details

### Field 1: Name
```
Field: name
Label: "Wie heißt du?"
Type: text
Required: true
Placeholder: "Dein Vorname"
Validation: min 2 chars, max 50 chars
```

### Field 2: Age
```
Field: age
Label: "Wie alt bist du?"
Type: number
Required: true
Range: 18-80
```

### Field 3: Sex
```
Field: sex
Label: "Dein Geschlecht"
Type: select
Required: true
Options:
  - { value: "male", label: "Männlich" }
  - { value: "female", label: "Weiblich" }
```

### Field 4: Primary Goal
```
Field: primary_goal
Label: "Was ist dein Hauptziel?"
Type: select
Required: true
Options:
  - { value: "energy", label: "Mehr Energie" }
  - { value: "sleep", label: "Besserer Schlaf" }
  - { value: "stress", label: "Weniger Stress" }
  - { value: "fat_loss", label: "Fettabbau" }
  - { value: "strength_fitness", label: "Kraft & Fitness" }
  - { value: "focus_clarity", label: "Fokus & Klarheit" }
```

### Field 5: Sleep Hours
```
Field: sleep_hours_bucket
Label: "Wie viele Stunden schläfst du durchschnittlich?"
Type: select
Required: true
Options:
  - { value: "<6", label: "Weniger als 6 Stunden" }
  - { value: "6-6.5", label: "6-6,5 Stunden" }
  - { value: "6.5-7", label: "6,5-7 Stunden" }
  - { value: "7-7.5", label: "7-7,5 Stunden" }
  - { value: "7.5-8", label: "7,5-8 Stunden" }
  - { value: ">8", label: "Mehr als 8 Stunden" }
```

### Field 6: Stress Level
```
Field: stress_1_10
Label: "Wie hoch ist dein Stresslevel? (1 = entspannt, 10 = sehr gestresst)"
Type: range/slider
Required: true
Range: 1-10
Default: 5
```

### Field 7: Training Frequency
```
Field: training_frequency
Label: "Wie oft trainierst du pro Woche?"
Type: select
Required: true
Options:
  - { value: "0", label: "Gar nicht" }
  - { value: "1-2", label: "1-2 mal" }
  - { value: "3-4", label: "3-4 mal" }
  - { value: "5+", label: "5+ mal" }
```

### Field 8: Diet Pattern
```
Field: diet_pattern
Label: "Welche Ernährungsmuster treffen auf dich zu?"
Type: multiselect (chips/tags)
Required: false
Options:
  - { value: "mostly_whole_foods", label: "Überwiegend unverarbeitete Lebensmittel" }
  - { value: "high_ultra_processed", label: "Viele verarbeitete Lebensmittel" }
  - { value: "high_sugar_snacks", label: "Häufig zuckerhaltige Snacks" }
  - { value: "frequent_alcohol", label: "Regelmäßiger Alkoholkonsum" }
  - { value: "high_protein_focus", label: "Fokus auf Protein" }
  - { value: "late_eating", label: "Spät abends essen" }
```

### Field 9: Height
```
Field: height_cm
Label: "Größe in cm"
Type: number
Required: true
Range: 130-220
Placeholder: "z.B. 175"
```

### Field 10: Weight
```
Field: weight_kg
Label: "Gewicht in kg"
Type: number
Required: true
Range: 40-200
Placeholder: "z.B. 80"
```

### Field 11: Daily Time Budget
```
Field: daily_time_budget
Label: "Wie viel Zeit hast du täglich für deinen Plan?"
Type: select
Required: true
Options:
  - { value: "10", label: "10 Minuten" }
  - { value: "20", label: "20 Minuten" }
  - { value: "30", label: "30 Minuten" }
```

### Field 12: Equipment Access
```
Field: equipment_access
Label: "Welches Equipment steht dir zur Verfügung?"
Type: select
Required: true
Options:
  - { value: "none", label: "Keines" }
  - { value: "basic", label: "Basis (Matte, Bänder)" }
  - { value: "gym", label: "Fitnessstudio" }
```

---

## JSON Schema for Intake Payload

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "IntakePayload",
  "type": "object",
  "required": [
    "name",
    "age",
    "sex",
    "primary_goal",
    "sleep_hours_bucket",
    "stress_1_10",
    "training_frequency",
    "height_cm",
    "weight_kg",
    "daily_time_budget",
    "equipment_access"
  ],
  "properties": {
    "name": {
      "type": "string",
      "minLength": 2,
      "maxLength": 50
    },
    "age": {
      "type": "integer",
      "minimum": 18,
      "maximum": 80
    },
    "sex": {
      "type": "string",
      "enum": ["male", "female"]
    },
    "primary_goal": {
      "type": "string",
      "enum": ["energy", "sleep", "stress", "fat_loss", "strength_fitness", "focus_clarity"]
    },
    "sleep_hours_bucket": {
      "type": "string",
      "enum": ["<6", "6-6.5", "6.5-7", "7-7.5", "7.5-8", ">8"]
    },
    "stress_1_10": {
      "type": "integer",
      "minimum": 1,
      "maximum": 10
    },
    "training_frequency": {
      "type": "string",
      "enum": ["0", "1-2", "3-4", "5+"]
    },
    "diet_pattern": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["mostly_whole_foods", "high_ultra_processed", "high_sugar_snacks", "frequent_alcohol", "high_protein_focus", "late_eating"]
      }
    },
    "height_cm": {
      "type": "integer",
      "minimum": 130,
      "maximum": 220
    },
    "weight_kg": {
      "type": "integer",
      "minimum": 40,
      "maximum": 200
    },
    "daily_time_budget": {
      "type": "string",
      "enum": ["10", "20", "30"]
    },
    "equipment_access": {
      "type": "string",
      "enum": ["none", "basic", "gym"]
    },
    "submitted_at": {
      "type": "string",
      "format": "date-time"
    }
  },
  "additionalProperties": false
}
```

---

## Example Payload

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
  "daily_time_budget": "20",
  "equipment_access": "basic",
  "submitted_at": "2026-02-01T10:00:00.000Z"
}
```

---

## Data Storage (MVP)

Intake data is stored in `localStorage` under the key `intake_data` as JSON:

```javascript
localStorage.setItem('intake_data', JSON.stringify(formData));
```

---

## How Intake Data Affects Plan Generation

| Field | Pillar Affected | Impact |
|-------|-----------------|--------|
| `sleep_hours_bucket` | `sleep_recovery` | Low sleep → higher need score |
| `stress_1_10` | `mental_resilience` | High stress → more breathwork tasks |
| `primary_goal` | All pillars | Weights plan towards goal (e.g., fat_loss → nutrition + movement) |
| `training_frequency` | `movement_muscle` | Low frequency → more movement tasks |
| `diet_pattern` | `nutrition_metabolism` | Flags like `late_eating` → timing tasks |
| `daily_time_budget` | All | Strictly respects 10/20/30 min limit |
| `equipment_access` | `movement_muscle` | No gym → bodyweight exercises only |
| `age` | `sleep_recovery` | 50+ → more sleep focus |

---

*Decision: No WhatsApp integration in MVP. Phone number field removed. Uses localStorage only.*
