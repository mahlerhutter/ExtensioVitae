# User & Health Profile System

## Überblick

Die Datenstruktur wurde grundlegend überarbeitet, um User-Identitätsdaten von Plan-relevanten Gesundheitsdaten zu trennen.

## Architektur

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER PROFILE                                 │
│  (Stabil, ändert sich selten, nicht plan-relevant)                  │
├─────────────────────────────────────────────────────────────────────┤
│  • name, email, phone_number                                         │
│  • biological_sex, birth_date                                        │
│  • whatsapp_opt_in, notification_preferences                         │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      HEALTH PROFILE                                  │
│  (Plan-relevant, kann sich ändern, detaillierter über Zeit)         │
├─────────────────────────────────────────────────────────────────────┤
│  CORE (Quick Intake):                                                │
│  • height_cm, weight_kg                                              │
│  • sleep_hours_bucket, stress_level                                  │
│  • training_frequency, diet_patterns                                 │
│  • daily_time_budget, equipment_access                               │
│                                                                      │
│  EXTENDED (Deep Health Profile):                                     │
│  • is_smoker, alcohol_frequency                                      │
│  • chronic_conditions[]                                              │
│  • injuries_limitations[]                                            │
│  • dietary_restrictions[]                                            │
│  • menopause_status, takes_medications                               │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      PLAN SNAPSHOT                                   │
│  (Eingefrorener Zustand bei Plan-Generierung)                       │
├─────────────────────────────────────────────────────────────────────┤
│  • health_profile_snapshot (JSONB)                                   │
│  • excluded_activities[], intensity_cap                              │
│  • generation_notes, generated_at                                    │
└─────────────────────────────────────────────────────────────────────┘
```

## Dateien

| Datei | Beschreibung |
|-------|-------------|
| `sql/migrations/005_separate_user_and_health_profiles.sql` | Datenbank-Migration |
| `src/lib/profileService.js` | CRUD für User- und Health-Profile |
| `src/lib/healthConstraints.js` | Logik für Plan-Anpassungen basierend auf Gesundheitsprofil |
| `src/pages/HealthProfilePage.jsx` | UI für erweitertes Gesundheitsprofil |
| `src/lib/planBuilder.js` | Erweitert mit Health-Profile-Integration (v2.1) |

## Chronische Erkrankungen & Plan-Impact

Jede chronische Erkrankung hat definierte Regeln:

| Erkrankung | Vermeiden | Bevorzugen | Intensität |
|------------|-----------|------------|------------|
| **Herzerkrankung** | HIIT, Krafttraining, Kältebad | Zone 2, Leichtes Gehen, Atemübungen | Sanft |
| **Bluthochdruck** | HIIT, Schweres Heben, Atemhalten | Zone 2, Meditation | Moderat |
| **Krebs (aktiv)** | HIIT, Fasten, Kältebad | Sanfte Bewegung, Achtsamkeit | Sanft |
| **Diabetes Typ 1** | Langes Fasten, Intensives HIIT | Blutzucker-Monitoring, Steady Cardio | Moderat |
| **Diabetes Typ 2** | Zucker, Sitzen | Nach-Mahlzeit-Spaziergang, Protein | Normal |
| **Arthritis** | High-Impact, Springen, Laufen | Mobilität, Low-Impact, Schwimmen | Moderat |
| **Schwangerschaft** | Rückenlage, High-Impact, Hot-Yoga | Prenatal, Beckenboden | Moderat |

## User Flows

### Flow A: Neue User (Landing Page)
```
Landing → Quick Intake (5-6 Fragen) → Plan generiert → Signup
```
- Nur Core Health Data erforderlich
- Maximale Conversion

### Flow B: Bestehende User - Plan Renewal
```
Dashboard → "Neuen Plan" → Automatisch mit letzten Daten → Plan Review
```
- Keine erneute Dateneingabe
- Schnelle Regeneration

### Flow C: Bestehende User - Profile Update
```
Dashboard → Settings → Health Profile → Daten aktualisieren → Plan neu generieren
```
- Erweiterte Gesundheitsdaten
- Angepasste Empfehlungen

## API-Referenz

### profileService.js

```javascript
// User Profile
getUserProfile(userId)
upsertUserProfile(userId, profileData)

// Health Profile
getHealthProfile(userId)
upsertHealthProfile(userId, healthData)
updateCoreHealthProfile(userId, coreData)
updateExtendedHealthProfile(userId, extendedData)

// Plan Snapshot
createPlanSnapshot(planId, healthProfile, primaryGoal, constraints)
getPlanSnapshot(planId)

// Constraints
calculatePlanConstraints(healthProfile)
generateConstraintsSummary(constraints)

// Migration
migrateIntakeToProfiles(userId, intakeData)
```

### healthConstraints.js

```javascript
// Task-Filterung
shouldExcludeTask(task, healthProfile)
healthPreferenceBoost(task, healthProfile)
calculateIntensityCap(healthProfile)
filterTasksByHealth(tasks, healthProfile)

// Warnungen
generateHealthWarnings(healthProfile)
createHealthSummary(healthProfile)
```

### planBuilder.js (v2.1)

```javascript
// Erweiterte Signatur
build30DayBlueprint(intake, tasks, userState = {}, healthProfile = null)

// Plan enthält jetzt:
plan.meta.health = {
    hasProfile: boolean,
    warnings: string[],
    summary: object,
    intensityCap: number | null,
    tasksFiltered: number
}
```

## Routes

| Route | Komponente | Beschreibung |
|-------|------------|-------------|
| `/health-profile` | HealthProfilePage | Erweitertes Gesundheitsprofil |
| `/settings/health` | HealthProfilePage | Alias für Settings-Integration |

## Migration durchführen

1. **Migration ausführen:**
   ```sql
   -- Kopiere sql/migrations/005_separate_user_and_health_profiles.sql
   -- in Supabase SQL Editor und ausführen
   ```

2. **Bestehende Daten migrieren** (optional):
   ```javascript
   import { migrateIntakeToProfiles } from './lib/profileService';
   
   // Für jeden existierenden User
   await migrateIntakeToProfiles(userId, existingIntakeData);
   ```

## Zukünftige Erweiterungen

- [ ] KI-basierte Medikamenten-Interaktions-Warnungen
- [ ] Integration mit Wearables (Apple Health, Fitbit)
- [ ] Automatische Profil-Updates basierend auf Nutzungsmustern
- [ ] Arzt-Freigabe-Workflow für bestimmte Erkrankungen
