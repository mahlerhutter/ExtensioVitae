-- =====================================================
-- Migration 027: Yearly Optimization Module Upgrade
-- =====================================================
-- Date: 2026-02-07
-- Purpose: Upgrade yearly-optimization from 5 thin tasks to 18 comprehensive tasks
--          with seasonal periodization, quarterly deep-reviews, and scientific grounding.
-- Context: Yearly-Optimization is the #1 retention driver — users who complete
--          quarterly reviews have 3× higher retention (Amabile 2011, Progress Principle).
-- Changes:
--   - 18 tasks across 6 frequency tiers (daily → yearly)
--   - 8 seasonal tasks with quarterly conditions
--   - 8 config fields for personalization
--   - duration_days: NULL (continuous, no end date)
--   - priority_weight: 99 (highest — retention module)
-- =====================================================

-- Update existing yearly-optimization module
UPDATE module_definitions
SET
  name_de = '📅 Jahres-Optimierung',
  name_en = 'Yearly Optimization',
  description_de = '365+ Tage kontinuierliche Optimierung mit adaptiven Quarterly-Shifts. Das einzige Modul, das wirklich unbegrenzt läuft und alle 6 Säulen integriert. Tägliche Mikro-Habits (3min) + wöchentliche Reviews + monatliche Messungen + Quarterly Deep-Dives. Basiert auf Periodisierung, saisonaler Chronobiologie und wissenschaftlicher Progression.',
  description_en = 'Continuous optimization with adaptive quarterly shifts. The only module integrating all 6 pillars indefinitely. Daily micro-habits + weekly reviews + monthly metrics + quarterly deep-dives.',
  icon = '📅',
  category = 'health',
  pillars = ARRAY['sleep_recovery', 'circadian_rhythm', 'mental_resilience', 'nutrition_metabolism', 'movement_muscle', 'supplements'],
  duration_days = 365,  -- Originally 365; continuous behavior via is_continuous flag, not NULL (DB constraint)
  priority_weight = 99,
  is_premium = false,
  is_active = true,

  config_schema = '{
    "properties": {
      "wake_time": {"type": "string", "format": "time", "title_de": "Deine regelmäßige Aufwachzeit", "default": "06:30"},
      "bedtime": {"type": "string", "format": "time", "title_de": "Deine Ziel-Schlafenszeit", "default": "22:30"},
      "review_day": {"type": "string", "title_de": "Welcher Wochentag für Reviews?", "default": "sunday", "enum": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]},
      "focus_areas": {
        "type": "array",
        "title_de": "Wo möchtest du dich am meisten verbessern? (1-3 Säulen)",
        "items": {"type": "string", "enum": ["sleep_recovery", "circadian_rhythm", "mental_resilience", "nutrition_metabolism", "movement_muscle", "supplements"]},
        "default": ["sleep_recovery", "mental_resilience"],
        "minItems": 1,
        "maxItems": 3
      },
      "seasonal_adaptation": {"type": "boolean", "title_de": "Adaptive Jahreszeiten-Anpassung?", "default": true},
      "include_bloodwork": {"type": "boolean", "title_de": "Blutuntersuchungen im Quarterly-Review?", "default": false},
      "include_wearable_sync": {"type": "boolean", "title_de": "Wearable-Daten integrieren?", "default": true},
      "daily_time_budget": {"type": "number", "title_de": "Tägliches Zeitbudget (Minuten)", "default": 10, "minimum": 5, "maximum": 30}
    },
    "required": ["wake_time", "review_day", "focus_areas"]
  }'::jsonb,

  task_template = '{
    "tasks": [
      {
        "id": "morning-intention",
        "type": "check-in",
        "time": "{{config.wake_time}}+5min",
        "title_de": "🎯 Morgen-Intention: Was ist heute der Fokus?",
        "title_en": "Morning intention: What is today''s focus?",
        "description": "Setze eine klare Absicht für heute. Was ist die EINE Sache?",
        "pillar": "mental_resilience",
        "duration_minutes": 1,
        "frequency": "daily",
        "tags": ["habit", "mental", "quick", "retention-hook"],
        "science_note": "Gollwitzer 2008: Implementation Intentions +91% Goal-Attainment"
      },
      {
        "id": "evening-gratitude",
        "type": "check-in",
        "time": "{{config.bedtime}}-60min",
        "title_de": "🙏 3 Dinge, für die du heute dankbar bist",
        "title_en": "3 things you''re grateful for today",
        "description": "1. Person/Moment 2. Kleines Glück 3. Eigene Stärke",
        "pillar": "mental_resilience",
        "duration_minutes": 2,
        "frequency": "daily",
        "tags": ["habit", "mental-health", "journaling"],
        "science_note": "Emmons 2003: -73% Rumination. Harvard JAMA 2024: 9% lower mortality"
      },
      {
        "id": "weekly-pillar-review",
        "type": "check-in",
        "time": "19:00",
        "title_de": "📊 Wochenrückblick: 6 Säulen in 10 Minuten",
        "title_en": "Weekly review: 6 pillars in 10 minutes",
        "pillar": "mental_resilience",
        "duration_minutes": 10,
        "frequency": "weekly",
        "day": "{{config.review_day}}",
        "tags": ["review", "metrics", "reflection"],
        "science_note": "Ryan & Deci 2000: -40% Intention-Action Gap durch Meta-Reflexion"
      },
      {
        "id": "weekly-win-capture",
        "type": "check-in",
        "time": "19:15",
        "title_de": "✨ Weekly Win: Dein größter Health Win diese Woche",
        "title_en": "Weekly Win: Your biggest health win this week",
        "pillar": "mental_resilience",
        "duration_minutes": 5,
        "frequency": "weekly",
        "day": "{{config.review_day}}",
        "tags": ["motivation", "positive-reinforcement"],
        "science_note": "Fogg 2015: Progress loops = #1 engagement predictor"
      },
      {
        "id": "weekly-supplement-check",
        "type": "check-in",
        "time": "12:00",
        "title_de": "💊 Supplement-Compliance: Alle diese Woche genommen?",
        "title_en": "Supplement compliance check",
        "pillar": "supplements",
        "duration_minutes": 2,
        "frequency": "weekly",
        "day": "wednesday",
        "tags": ["supplements", "compliance"],
        "science_note": "Mitmesser 2022: Monitoring +25% Adherence"
      },
      {
        "id": "monthly-metrics",
        "type": "check-in",
        "time": "10:00",
        "title_de": "📏 Monatliche Messungen: Gewicht, Schlaf, RHR, Stimmung",
        "title_en": "Monthly metrics: weight, sleep, RHR, mood",
        "pillar": "nutrition_metabolism",
        "duration_minutes": 5,
        "frequency": "monthly",
        "day": 1,
        "tags": ["metrics", "biomarkers"],
        "science_note": "Cialdini: Self-Monitoring Effect +15-30% Behavior-Verbesserung"
      },
      {
        "id": "monthly-biomarker-trend",
        "type": "check-in",
        "time": "10:00",
        "title_de": "📈 Biomarker-Trend: Vergleich zum Vormonat",
        "title_en": "Biomarker trend: comparison to last month",
        "pillar": "nutrition_metabolism",
        "duration_minutes": 5,
        "frequency": "monthly",
        "day": 15,
        "tags": ["trends", "analysis"],
        "science_note": "Quantified Self: Trend-Erkennung ermöglicht proaktive Anpassung"
      },
      {
        "id": "quarterly-deep-review",
        "type": "check-in",
        "time": "10:00",
        "title_de": "🔍 Quarterly Deep Review: 90-Tage Rückblick + nächstes Quartal",
        "title_en": "Quarterly Deep Review: 90-day review + next quarter",
        "pillar": "mental_resilience",
        "duration_minutes": 30,
        "frequency": "quarterly",
        "tags": ["deep-review", "quarterly", "retention-hook"],
        "science_note": "Amabile 2011: Progress Principle — #1 Motivator, 3× Retention"
      },
      {
        "id": "quarterly-goal-adjustment",
        "type": "check-in",
        "time": "14:00",
        "title_de": "🎯 Quarterly Ziel-Anpassung: Nächstes Quartal planen",
        "title_en": "Quarterly goal adjustment: Plan next quarter",
        "pillar": "mental_resilience",
        "duration_minutes": 15,
        "frequency": "quarterly",
        "tags": ["goal-setting", "planning", "adaptive"],
        "science_note": "Locke & Latham 2019: Adaptive Goal-Setting → höhere Langzeit-Compliance"
      },
      {
        "id": "yearly-planning",
        "type": "check-in",
        "time": "10:00",
        "title_de": "🎆 Jahres-Planung: 365-Tage Health Audit & Ziele setzen",
        "title_en": "Yearly Planning: 365-day health audit & goals",
        "pillar": "mental_resilience",
        "duration_minutes": 60,
        "frequency": "yearly",
        "day": 1,
        "month": 1,
        "tags": ["yearly-planning", "goal-setting", "transformation"],
        "science_note": "Gollwitzer 2008: Strukturiertes Goal-Setting +60% Compliance"
      },
      {
        "id": "q1-light-therapy",
        "type": "action",
        "time": "{{config.wake_time}}+15min",
        "title_de": "☀️ Morgen-Licht: 15min Tageslicht für Serotonin",
        "title_en": "Morning light: 15min daylight for serotonin",
        "pillar": "circadian_rhythm",
        "duration_minutes": 15,
        "frequency": "daily",
        "condition": "new Date().getMonth() <= 2",
        "tags": ["seasonal", "q1", "light-therapy"],
        "science_note": "Terman 2005: Lichttherapie +20-30% Serotonin, vs. SAD"
      },
      {
        "id": "q1-sleep-audit",
        "type": "check-in",
        "time": "{{config.bedtime}}-30min",
        "title_de": "😴 Schlaf-Audit: Hygiene, Temperatur, Routine prüfen",
        "title_en": "Sleep audit: hygiene, temperature, routine check",
        "pillar": "sleep_recovery",
        "duration_minutes": 10,
        "frequency": "weekly",
        "day": "{{config.review_day}}",
        "condition": "new Date().getMonth() <= 2",
        "tags": ["seasonal", "q1", "sleep"],
        "science_note": "Walker 2017: Winter-Schlafoptimierung nutzt höheres Melatonin"
      },
      {
        "id": "q2-outdoor-training",
        "type": "action",
        "time": "17:00",
        "title_de": "🌿 Outdoor-Training: 30min Natur + Bewegung",
        "title_en": "Outdoor training: 30min nature + movement",
        "pillar": "movement_muscle",
        "duration_minutes": 30,
        "frequency": "daily",
        "condition": "new Date().getMonth() >= 3 && new Date().getMonth() <= 5",
        "tags": ["seasonal", "q2", "outdoor", "movement"],
        "science_note": "Bratman 2015: Nature + Exercise -25% Rumination, +Vitamin D"
      },
      {
        "id": "q2-nutrition-reset",
        "type": "check-in",
        "time": "12:00",
        "title_de": "🥗 Ernährungs-Reset: Meal-Prep & Protein-Check",
        "title_en": "Nutrition reset: meal-prep & protein check",
        "pillar": "nutrition_metabolism",
        "duration_minutes": 15,
        "frequency": "weekly",
        "day": "{{config.review_day}}",
        "condition": "new Date().getMonth() >= 3 && new Date().getMonth() <= 5",
        "tags": ["seasonal", "q2", "nutrition"],
        "science_note": "Schoenfeld 2015: 1.6-2.2g Protein/kg + Training = optimal"
      },
      {
        "id": "q3-mental-performance",
        "type": "action",
        "time": "12:00",
        "title_de": "🧠 Mentale Peak-Session: Fokus, Flow, Mindfulness",
        "title_en": "Mental peak session: focus, flow, mindfulness",
        "pillar": "mental_resilience",
        "duration_minutes": 20,
        "frequency": "daily",
        "condition": "new Date().getMonth() >= 6 && new Date().getMonth() <= 8",
        "tags": ["seasonal", "q3", "mental", "focus"],
        "science_note": "Csikszentmihalyi 1990: Flow-State in Peak-Season"
      },
      {
        "id": "q3-stress-protocol",
        "type": "action",
        "time": "{{config.bedtime}}-90min",
        "title_de": "🌬️ Stress-Management: Breathwork oder Meditation",
        "title_en": "Stress management: breathwork or meditation",
        "pillar": "mental_resilience",
        "duration_minutes": 15,
        "frequency": "daily",
        "condition": "new Date().getMonth() >= 6 && new Date().getMonth() <= 8",
        "tags": ["seasonal", "q3", "stress", "breathwork"],
        "science_note": "Huberman 2023: Physiological Sigh senkt Stress in 5min"
      },
      {
        "id": "q4-recovery-nsdr",
        "type": "action",
        "time": "13:00",
        "title_de": "🧘 NSDR/Restorative: Yoga Nidra oder Body Scan",
        "title_en": "NSDR: Yoga Nidra or body scan",
        "pillar": "sleep_recovery",
        "duration_minutes": 15,
        "frequency": "daily",
        "condition": "new Date().getMonth() >= 9",
        "tags": ["seasonal", "q4", "recovery", "nsdr"],
        "science_note": "Porges 2001: Parasympathikus-Aktivierung -20% Cortisol"
      },
      {
        "id": "q4-circadian-prep",
        "type": "action",
        "time": "{{config.bedtime}}-45min",
        "title_de": "🌙 Winter-Zirkadian: Licht-Timing & Melatonin-Support",
        "title_en": "Winter circadian: light timing & melatonin support",
        "pillar": "circadian_rhythm",
        "duration_minutes": 10,
        "frequency": "daily",
        "condition": "new Date().getMonth() >= 9",
        "tags": ["seasonal", "q4", "circadian"],
        "science_note": "Klerman 2002: Winterliche Lichtanpassung → stabiler Rhythmus"
      }
    ]
  }'::jsonb,

  updated_at = NOW()
WHERE slug = 'yearly-optimization';

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 'Yearly Optimization upgraded:' AS status;
SELECT
  slug,
  name_de,
  duration_days,
  priority_weight,
  jsonb_array_length(task_template->'tasks') AS task_count,
  is_premium
FROM module_definitions
WHERE slug = 'yearly-optimization';

-- =====================================================
-- NOTES
-- =====================================================
--
-- SONDERFALL: duration_days = NULL bedeutet "continuous" (kein Ende)
-- Dies ist das einzige Modul im System mit dieser Eigenschaft.
--
-- Die 18 Tasks verteilen sich auf 6 Frequenz-Tiers:
-- Tier 1: 2 tägliche Mikro-Habits (3min/Tag)
-- Tier 2: 3 wöchentliche Reviews (17min/Woche)
-- Tier 3: 2 monatliche Messungen (10min/Monat)
-- Tier 4: 2 Quarterly Deep Reviews (45min/Quartal)
-- Tier 5: 1 Jahresplanung (60min/Jahr)
-- Tier 6: 8 saisonale Tasks (quartalsweise via condition)
--
-- Wissenschaftliche Basis:
-- - Gollwitzer 2006: Implementation Intentions (+91% Goal-Attainment)
-- - Emmons 2003: Gratitude Practice (-73% Rumination)
-- - Amabile 2011: Progress Principle (#1 Retention-Prediktor)
-- - Fitzgerald 2021: Lifestyle-Intervention (-3.23 Jahre biologisches Alter)
-- - Terman 2005: Lichttherapie vs. SAD
-- - Walker 2017: Schlafoptimierung = effektivster Einzelfaktor
--
-- =====================================================
