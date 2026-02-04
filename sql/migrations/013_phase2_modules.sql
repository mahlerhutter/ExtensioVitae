-- =====================================================
-- Migration 013: Phase 2 Modules
-- =====================================================
-- Date: 2026-02-04
-- Purpose: Add Phase 2 modules and 30-Day Plan integration
-- =====================================================

-- =====================================================
-- 1. ADD SOURCE PLAN REFERENCE TO MODULE INSTANCES
-- =====================================================

-- Allow linking module instances to source plans (for 30-day plan modules)
ALTER TABLE module_instances
ADD COLUMN IF NOT EXISTS source_plan_id UUID,
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'manual';

COMMENT ON COLUMN module_instances.source_plan_id IS 'Reference to plans table for converted 30-day plans';
COMMENT ON COLUMN module_instances.source_type IS 'manual=user activated, converted=from 30-day plan, auto=system activated';

-- =====================================================
-- 2. 30-DAY LONGEVITY PLAN MODULE
-- =====================================================

INSERT INTO module_definitions (
    slug, name_de, name_en, description_de, description_en, icon,
    type, duration_days, category, pillars, priority_weight,
    affected_by_modes, config_schema, task_template
) VALUES (
    '30-day-longevity',
    '30-Tage Longevity Plan',
    '30-Day Longevity Plan',
    'Dein personalisierter 30-Tage Plan basierend auf deinem Health Profile.',
    'Your personalized 30-day plan based on your health profile.',
    '🎯',
    'one-time',
    30,
    'general',
    ARRAY['sleep', 'nutrition', 'movement', 'stress', 'supplements'],
    100, -- Highest priority
    ARRAY['sick'],
    '{
        "plan_id": {"type": "string", "hidden": true},
        "start_date": {"type": "date", "label_de": "Startdatum"},
        "focus_pillars": {
            "type": "array",
            "items": ["sleep", "nutrition", "movement", "stress", "mental"],
            "label_de": "Fokus-Säulen"
        }
    }'::jsonb,
    '{
        "dynamic": true,
        "source": "plan_days",
        "tasks": []
    }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    name_de = EXCLUDED.name_de,
    description_de = EXCLUDED.description_de,
    priority_weight = EXCLUDED.priority_weight,
    updated_at = NOW();

-- =====================================================
-- 3. ENHANCED FASTING MODULES
-- =====================================================

-- 5:2 Fasting Module
INSERT INTO module_definitions (
    slug, name_de, name_en, description_de, description_en, icon,
    type, duration_days, category, pillars, priority_weight,
    affected_by_modes, config_schema, task_template
) VALUES (
    'fasting-5-2',
    'Intervallfasten 5:2',
    'Intermittent Fasting 5:2',
    '5 Tage normal essen, 2 Tage stark reduziert (500-600 kcal).',
    '5 days normal eating, 2 days restricted (500-600 kcal).',
    '🍽️',
    'continuous',
    NULL,
    'nutrition',
    ARRAY['nutrition', 'metabolic'],
    65,
    ARRAY['sick', 'travel'],
    '{
        "properties": {
            "fasting_days": {
                "type": "array",
                "title": "Fastentage",
                "items": {"type": "string", "enum": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]},
                "default": ["monday", "thursday"],
                "minItems": 2,
                "maxItems": 2
            },
            "calorie_limit": {
                "type": "integer",
                "title": "Kalorien an Fastentagen",
                "default": 500,
                "minimum": 400,
                "maximum": 800
            }
        },
        "required": ["fasting_days"]
    }'::jsonb,
    '{
        "tasks": [
            {
                "id": "fasting-day-start",
                "type": "info",
                "frequency": "weekly",
                "days": "{{config.fasting_days}}",
                "time": "07:00",
                "title_de": "🍽️ Heute ist Fastentag",
                "title_en": "🍽️ Today is a fasting day",
                "description": "Max {{config.calorie_limit}} kcal. Fokus auf Protein & Gemüse.",
                "pillar": "nutrition",
                "duration_minutes": 0
            },
            {
                "id": "fasting-day-meal",
                "type": "action",
                "frequency": "weekly",
                "days": "{{config.fasting_days}}",
                "time": "18:00",
                "title_de": "Fastentag-Mahlzeit planen",
                "title_en": "Plan fasting day meal",
                "description": "Eine proteinreiche, sättigende Mahlzeit",
                "pillar": "nutrition",
                "duration_minutes": 5
            },
            {
                "id": "hydration-reminder",
                "type": "reminder",
                "frequency": "weekly",
                "days": "{{config.fasting_days}}",
                "time": "12:00",
                "title_de": "💧 Extra Hydration an Fastentagen",
                "title_en": "💧 Extra hydration on fasting days",
                "description": "Mindestens 2.5L Wasser, Tee oder schwarzer Kaffee",
                "pillar": "nutrition",
                "duration_minutes": 1
            }
        ]
    }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    task_template = EXCLUDED.task_template,
    config_schema = EXCLUDED.config_schema,
    updated_at = NOW();

-- OMAD (One Meal A Day) Module
INSERT INTO module_definitions (
    slug, name_de, name_en, description_de, description_en, icon,
    type, duration_days, category, pillars, priority_weight,
    affected_by_modes, config_schema, task_template
) VALUES (
    'fasting-omad',
    'OMAD - Eine Mahlzeit',
    'OMAD - One Meal A Day',
    'Fortgeschrittenes Fasten: Eine nährstoffreiche Mahlzeit pro Tag.',
    'Advanced fasting: One nutrient-dense meal per day.',
    '🥗',
    'continuous',
    NULL,
    'nutrition',
    ARRAY['nutrition', 'metabolic', 'autophagy'],
    55,
    ARRAY['sick', 'travel', 'deep_work'],
    '{
        "properties": {
            "meal_time": {
                "type": "string",
                "format": "time",
                "title": "Mahlzeit-Zeit",
                "default": "18:00"
            },
            "eating_window_minutes": {
                "type": "integer",
                "title": "Essensfenster (Minuten)",
                "default": 60,
                "minimum": 30,
                "maximum": 120
            }
        },
        "required": ["meal_time"]
    }'::jsonb,
    '{
        "tasks": [
            {
                "id": "morning-electrolytes",
                "type": "action",
                "time": "07:00",
                "title_de": "Elektrolyte (Salz + Wasser)",
                "title_en": "Electrolytes (salt + water)",
                "description": "1/4 TL Salz in Wasser für Energie",
                "pillar": "nutrition",
                "duration_minutes": 1
            },
            {
                "id": "omad-meal-prep",
                "type": "reminder",
                "time": "{{config.meal_time}}-60min",
                "title_de": "OMAD-Mahlzeit vorbereiten",
                "title_en": "Prepare OMAD meal",
                "description": "Protein, gesunde Fette, viel Gemüse",
                "pillar": "nutrition",
                "duration_minutes": 30
            },
            {
                "id": "omad-meal",
                "type": "action",
                "time": "{{config.meal_time}}",
                "title_de": "🍽️ OMAD-Mahlzeit",
                "title_en": "🍽️ OMAD meal",
                "description": "Langsam essen, gut kauen, genießen",
                "pillar": "nutrition",
                "duration_minutes": 45
            }
        ]
    }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    task_template = EXCLUDED.task_template,
    config_schema = EXCLUDED.config_schema,
    updated_at = NOW();

-- Extended Water Fast Module (24-72h)
INSERT INTO module_definitions (
    slug, name_de, name_en, description_de, description_en, icon,
    type, duration_days, category, pillars, priority_weight,
    affected_by_modes, is_premium, config_schema, task_template
) VALUES (
    'fasting-extended',
    'Extended Fast (24-72h)',
    'Extended Fast (24-72h)',
    'Tiefgreifende Autophagie durch längeres Fasten. Nur mit ärztlicher Beratung.',
    'Deep autophagy through extended fasting. Only with medical consultation.',
    '⚡',
    'one-time',
    3,
    'nutrition',
    ARRAY['nutrition', 'metabolic', 'autophagy', 'longevity'],
    40,
    ARRAY['sick', 'travel', 'deep_work'],
    true,
    '{
        "properties": {
            "duration_hours": {
                "type": "integer",
                "title": "Fasten-Dauer (Stunden)",
                "enum": [24, 36, 48, 72],
                "enumLabels": {"24": "24h", "36": "36h", "48": "48h", "72": "72h"},
                "default": 24
            },
            "start_time": {
                "type": "string",
                "format": "time",
                "title": "Startzeit",
                "default": "20:00"
            },
            "has_medical_clearance": {
                "type": "boolean",
                "title": "Ärztliche Freigabe",
                "description": "Ich habe mit einem Arzt gesprochen",
                "default": false
            }
        },
        "required": ["duration_hours", "has_medical_clearance"]
    }'::jsonb,
    '{
        "tasks": [
            {
                "id": "fast-start",
                "type": "action",
                "frequency": "once",
                "day": 1,
                "time": "{{config.start_time}}",
                "title_de": "🚀 Fast beginnt jetzt",
                "title_en": "🚀 Fast starts now",
                "description": "Letzte leichte Mahlzeit. Viel Wasser bereitstellen.",
                "pillar": "nutrition",
                "duration_minutes": 5
            },
            {
                "id": "electrolyte-morning",
                "type": "action",
                "time": "08:00",
                "title_de": "Elektrolyte Morgen",
                "title_en": "Morning electrolytes",
                "description": "Salz, Kalium, Magnesium in Wasser",
                "pillar": "nutrition",
                "duration_minutes": 2
            },
            {
                "id": "electrolyte-evening",
                "type": "action",
                "time": "18:00",
                "title_de": "Elektrolyte Abend",
                "title_en": "Evening electrolytes",
                "description": "Besonders wichtig ab 24h+",
                "pillar": "nutrition",
                "duration_minutes": 2
            },
            {
                "id": "gentle-movement",
                "type": "action",
                "time": "10:00",
                "title_de": "Leichte Bewegung (Spaziergang)",
                "title_en": "Light movement (walk)",
                "description": "Kein intensives Training während Extended Fast",
                "pillar": "movement",
                "duration_minutes": 20
            },
            {
                "id": "fast-end",
                "type": "action",
                "frequency": "once",
                "day": "{{config.duration_hours / 24}}",
                "time": "{{config.start_time}}",
                "title_de": "🎉 Fast beenden - Refeeding",
                "title_en": "🎉 Break fast - Refeeding",
                "description": "Langsam mit Brühe oder leichtem Essen beginnen",
                "pillar": "nutrition",
                "duration_minutes": 30
            }
        ]
    }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    task_template = EXCLUDED.task_template,
    config_schema = EXCLUDED.config_schema,
    updated_at = NOW();

-- =====================================================
-- 4. ENHANCED CIRCADIAN MODULE
-- =====================================================

-- Update existing circadian-light module with more tasks
UPDATE module_definitions
SET task_template = '{
    "tasks": [
        {
            "id": "morning-light",
            "type": "action",
            "time": "{{config.wake_time}}+15min",
            "title_de": "☀️ Morgenlicht holen (10 min)",
            "title_en": "☀️ Get morning light (10 min)",
            "description": "Direkt nach dem Aufwachen nach draußen. Keine Sonnenbrille.",
            "pillar": "sleep",
            "duration_minutes": 10
        },
        {
            "id": "caffeine-cutoff",
            "type": "reminder",
            "time": "14:00",
            "title_de": "☕ Koffein-Stopp",
            "title_en": "☕ Caffeine cutoff",
            "description": "Letzter Kaffee des Tages für optimalen Schlaf",
            "pillar": "sleep",
            "duration_minutes": 0
        },
        {
            "id": "sunset-light",
            "type": "action",
            "time": "{{config.target_bedtime}}-180min",
            "title_de": "🌅 Abendsonne genießen",
            "title_en": "🌅 Enjoy sunset light",
            "description": "Rotes/oranges Licht signalisiert dem Körper: bald Schlafenszeit",
            "pillar": "sleep",
            "duration_minutes": 10
        },
        {
            "id": "blue-light-cutoff",
            "type": "action",
            "time": "{{config.target_bedtime}}-120min",
            "title_de": "📱 Blaulicht reduzieren",
            "title_en": "📱 Reduce blue light",
            "description": "Night Shift/Dark Mode aktivieren, Blaulichtbrille aufsetzen",
            "pillar": "sleep",
            "duration_minutes": 1
        },
        {
            "id": "dim-lights",
            "type": "action",
            "time": "{{config.target_bedtime}}-60min",
            "title_de": "💡 Lichter dimmen",
            "title_en": "💡 Dim lights",
            "description": "Nur warmes, gedimmtes Licht. Kein Deckenlicht.",
            "pillar": "sleep",
            "duration_minutes": 1
        },
        {
            "id": "bedroom-prep",
            "type": "action",
            "time": "{{config.target_bedtime}}-30min",
            "title_de": "🛏️ Schlafzimmer vorbereiten",
            "title_en": "🛏️ Prepare bedroom",
            "description": "Kühl (18°C), dunkel, ruhig",
            "pillar": "sleep",
            "duration_minutes": 5
        }
    ]
}'::jsonb,
config_schema = '{
    "properties": {
        "wake_time": {
            "type": "string",
            "format": "time",
            "title": "Aufwachzeit",
            "default": "07:00"
        },
        "target_bedtime": {
            "type": "string",
            "format": "time",
            "title": "Ziel-Schlafenszeit",
            "default": "22:30"
        }
    },
    "required": ["wake_time", "target_bedtime"]
}'::jsonb,
updated_at = NOW()
WHERE slug = 'circadian-light';

-- =====================================================
-- 5. ENHANCED SUPPLEMENT TIMING MODULE
-- =====================================================

UPDATE module_definitions
SET task_template = '{
    "tasks": [
        {
            "id": "morning-supplements-fat",
            "type": "action",
            "time": "{{config.wake_time}}+30min",
            "title_de": "💊 Morgen-Supplements (mit Fett)",
            "title_en": "💊 Morning supplements (with fat)",
            "description": "Vitamin D3+K2, Omega-3 — mit Frühstück/Fett",
            "pillar": "supplements",
            "duration_minutes": 2,
            "condition": "config.supplements.includes(''vitamin_d'') || config.supplements.includes(''omega3'')"
        },
        {
            "id": "morning-supplements-empty",
            "type": "action",
            "time": "{{config.wake_time}}",
            "title_de": "💊 Supplements (nüchtern)",
            "title_en": "💊 Supplements (empty stomach)",
            "description": "B-Komplex, Probiotika — vor dem Essen",
            "pillar": "supplements",
            "duration_minutes": 1,
            "condition": "config.supplements.includes(''b_complex'') || config.supplements.includes(''probiotics'')"
        },
        {
            "id": "midday-supplements",
            "type": "action",
            "time": "12:00",
            "title_de": "💊 Mittag-Supplements",
            "title_en": "💊 Midday supplements",
            "description": "Vitamin C, Eisen (falls supplementiert)",
            "pillar": "supplements",
            "duration_minutes": 1,
            "condition": "config.supplements.includes(''vitamin_c'') || config.supplements.includes(''iron'')"
        },
        {
            "id": "evening-magnesium",
            "type": "action",
            "time": "{{config.bedtime}}-60min",
            "title_de": "💊 Magnesium (Abend)",
            "title_en": "💊 Magnesium (evening)",
            "description": "Magnesium Glycinat oder Threonat für besseren Schlaf",
            "pillar": "supplements",
            "duration_minutes": 1,
            "condition": "config.supplements.includes(''magnesium'')"
        },
        {
            "id": "evening-zinc",
            "type": "action",
            "time": "{{config.bedtime}}-30min",
            "title_de": "💊 Zink (Abend)",
            "title_en": "💊 Zinc (evening)",
            "description": "Zink für Immunsystem und Schlaf",
            "pillar": "supplements",
            "duration_minutes": 1,
            "condition": "config.supplements.includes(''zinc'')"
        }
    ]
}'::jsonb,
config_schema = '{
    "properties": {
        "supplements": {
            "type": "array",
            "title": "Deine Supplements",
            "items": {
                "type": "string",
                "enum": ["vitamin_d", "omega3", "magnesium", "zinc", "b_complex", "vitamin_c", "iron", "probiotics", "creatine", "collagen"]
            },
            "enumLabels": {
                "vitamin_d": "Vitamin D3+K2",
                "omega3": "Omega-3",
                "magnesium": "Magnesium",
                "zinc": "Zink",
                "b_complex": "B-Komplex",
                "vitamin_c": "Vitamin C",
                "iron": "Eisen",
                "probiotics": "Probiotika",
                "creatine": "Kreatin",
                "collagen": "Kollagen"
            },
            "default": ["vitamin_d", "magnesium", "omega3"]
        },
        "wake_time": {
            "type": "string",
            "format": "time",
            "title": "Aufwachzeit",
            "default": "07:00"
        },
        "bedtime": {
            "type": "string",
            "format": "time",
            "title": "Schlafenszeit",
            "default": "22:30"
        }
    },
    "required": ["supplements", "wake_time", "bedtime"]
}'::jsonb,
updated_at = NOW()
WHERE slug = 'supplement-timing';

-- =====================================================
-- 6. ENHANCED YEARLY PLAN MODULE
-- =====================================================

UPDATE module_definitions
SET task_template = '{
    "tasks": [
        {
            "id": "morning-intention",
            "type": "action",
            "time": "{{config.wake_time}}+15min",
            "title_de": "🎯 Tages-Intention setzen",
            "title_en": "🎯 Set daily intention",
            "description": "1 Satz: Was ist heute am wichtigsten?",
            "pillar": "mindset",
            "duration_minutes": 2
        },
        {
            "id": "weekly-review",
            "type": "check-in",
            "frequency": "weekly",
            "day": "{{config.review_day}}",
            "time": "19:00",
            "title_de": "📊 Wochen-Review",
            "title_en": "📊 Weekly review",
            "description": "Was lief gut? Was verbessern? Nächste Woche planen.",
            "pillar": "mindset",
            "duration_minutes": 10
        },
        {
            "id": "monthly-metrics",
            "type": "check-in",
            "frequency": "monthly",
            "day": 1,
            "time": "10:00",
            "title_de": "📈 Monats-Metriken",
            "title_en": "📈 Monthly metrics",
            "description": "Gewicht, Energie (1-10), Schlafqualität, Stimmung notieren",
            "pillar": "health",
            "duration_minutes": 5
        },
        {
            "id": "quarterly-deep-review",
            "type": "check-in",
            "frequency": "quarterly",
            "time": "14:00",
            "title_de": "🔬 Quartals-Deep-Review",
            "title_en": "🔬 Quarterly deep review",
            "description": "Blutbild, Körperkomposition, Ziel-Anpassung",
            "pillar": "health",
            "duration_minutes": 30
        },
        {
            "id": "yearly-planning",
            "type": "check-in",
            "frequency": "yearly",
            "month": 1,
            "day": 1,
            "time": "10:00",
            "title_de": "🎆 Jahres-Planung",
            "title_en": "🎆 Yearly planning",
            "description": "Große Gesundheitsziele für das Jahr setzen",
            "pillar": "mindset",
            "duration_minutes": 60
        }
    ]
}'::jsonb,
config_schema = '{
    "properties": {
        "wake_time": {
            "type": "string",
            "format": "time",
            "title": "Aufwachzeit",
            "default": "07:00"
        },
        "review_day": {
            "type": "string",
            "title": "Wöchentlicher Review-Tag",
            "enum": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
            "enumLabels": {
                "monday": "Montag",
                "tuesday": "Dienstag",
                "wednesday": "Mittwoch",
                "thursday": "Donnerstag",
                "friday": "Freitag",
                "saturday": "Samstag",
                "sunday": "Sonntag"
            },
            "default": "sunday"
        },
        "focus_areas": {
            "type": "array",
            "title": "Fokus-Bereiche",
            "items": {
                "type": "string",
                "enum": ["longevity", "performance", "recovery", "metabolic", "mental", "strength", "flexibility"]
            },
            "enumLabels": {
                "longevity": "Longevity",
                "performance": "Performance",
                "recovery": "Recovery",
                "metabolic": "Metabolisch",
                "mental": "Mental",
                "strength": "Kraft",
                "flexibility": "Flexibilität"
            },
            "default": ["longevity", "recovery"]
        }
    },
    "required": ["review_day"]
}'::jsonb,
description_de = 'Tägliche Intentionen, wöchentliche Reviews, monatliche Metriken und Quartals-Checkups für langfristigen Erfolg.',
description_en = 'Daily intentions, weekly reviews, monthly metrics and quarterly checkups for long-term success.',
updated_at = NOW()
WHERE slug = 'yearly-optimization';

-- =====================================================
-- 7. NEW: COLD EXPOSURE MODULE
-- =====================================================

INSERT INTO module_definitions (
    slug, name_de, name_en, description_de, description_en, icon,
    type, duration_days, category, pillars, priority_weight,
    affected_by_modes, config_schema, task_template
) VALUES (
    'cold-exposure',
    'Kälte-Protokoll',
    'Cold Exposure Protocol',
    'Schrittweise Gewöhnung an Kälte für Stoffwechsel und Resilienz.',
    'Gradual cold adaptation for metabolism and resilience.',
    '🧊',
    'continuous',
    NULL,
    'health',
    ARRAY['recovery', 'metabolic', 'mental'],
    45,
    ARRAY['sick'],
    '{
        "properties": {
            "intensity": {
                "type": "string",
                "title": "Intensität",
                "enum": ["beginner", "intermediate", "advanced"],
                "enumLabels": {
                    "beginner": "Anfänger (kalt duschen)",
                    "intermediate": "Fortgeschritten (Eisbad 1-2 min)",
                    "advanced": "Profi (Eisbad 3-5 min)"
                },
                "default": "beginner"
            },
            "preferred_time": {
                "type": "string",
                "title": "Bevorzugte Zeit",
                "enum": ["morning", "post_workout", "evening"],
                "enumLabels": {
                    "morning": "Morgens (Energie-Boost)",
                    "post_workout": "Nach dem Training",
                    "evening": "Abends (nicht <2h vor Schlaf)"
                },
                "default": "morning"
            }
        },
        "required": ["intensity"]
    }'::jsonb,
    '{
        "tasks": [
            {
                "id": "cold-exposure-session",
                "type": "action",
                "time": "07:30",
                "title_de": "🧊 Kälte-Session",
                "title_en": "🧊 Cold exposure session",
                "description": "Ende der Dusche: 30 Sek kalt (Anfänger), aufbauend",
                "pillar": "recovery",
                "duration_minutes": 5,
                "condition": "config.intensity === ''beginner''"
            },
            {
                "id": "cold-exposure-intermediate",
                "type": "action",
                "time": "07:30",
                "title_de": "🧊 Eisbad (1-2 min)",
                "title_en": "🧊 Ice bath (1-2 min)",
                "description": "10-15°C Wasser, kontrollierte Atmung",
                "pillar": "recovery",
                "duration_minutes": 10,
                "condition": "config.intensity === ''intermediate''"
            },
            {
                "id": "cold-exposure-advanced",
                "type": "action",
                "time": "07:30",
                "title_de": "🧊 Eisbad (3-5 min)",
                "title_en": "🧊 Ice bath (3-5 min)",
                "description": "5-10°C Wasser, Wim Hof Breathing vorher",
                "pillar": "recovery",
                "duration_minutes": 15,
                "condition": "config.intensity === ''advanced''"
            },
            {
                "id": "warmup-after",
                "type": "reminder",
                "time": "07:45",
                "title_de": "☀️ Natürlich aufwärmen",
                "title_en": "☀️ Warm up naturally",
                "description": "Keine heiße Dusche! Körper selbst aufwärmen lassen.",
                "pillar": "recovery",
                "duration_minutes": 0
            }
        ]
    }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    task_template = EXCLUDED.task_template,
    config_schema = EXCLUDED.config_schema,
    updated_at = NOW();

-- =====================================================
-- 8. NEW: BREATHWORK MODULE
-- =====================================================

INSERT INTO module_definitions (
    slug, name_de, name_en, description_de, description_en, icon,
    type, duration_days, category, pillars, priority_weight,
    affected_by_modes, config_schema, task_template
) VALUES (
    'breathwork',
    'Atemübungen',
    'Breathwork Protocol',
    'Tägliche Atemübungen für Stressabbau und Fokus.',
    'Daily breathing exercises for stress relief and focus.',
    '🌬️',
    'continuous',
    NULL,
    'mindset',
    ARRAY['stress', 'mental', 'energy'],
    55,
    ARRAY[]::text[],
    '{
        "properties": {
            "technique": {
                "type": "string",
                "title": "Haupt-Technik",
                "enum": ["box_breathing", "wim_hof", "478_breathing", "physiological_sigh"],
                "enumLabels": {
                    "box_breathing": "Box Breathing (4-4-4-4)",
                    "wim_hof": "Wim Hof Methode",
                    "478_breathing": "4-7-8 Entspannung",
                    "physiological_sigh": "Physiological Sigh (schnelle Beruhigung)"
                },
                "default": "box_breathing"
            },
            "morning_session": {
                "type": "boolean",
                "title": "Morgen-Session",
                "default": true
            },
            "evening_session": {
                "type": "boolean",
                "title": "Abend-Session",
                "default": true
            }
        },
        "required": ["technique"]
    }'::jsonb,
    '{
        "tasks": [
            {
                "id": "morning-breathwork",
                "type": "action",
                "time": "07:00",
                "title_de": "🌬️ Morgen-Atemübung",
                "title_en": "🌬️ Morning breathwork",
                "description": "5 Minuten gewählte Technik",
                "pillar": "stress",
                "duration_minutes": 5,
                "condition": "config.morning_session"
            },
            {
                "id": "stress-reset",
                "type": "action",
                "time": "14:00",
                "title_de": "😮‍💨 Physiological Sigh",
                "title_en": "😮‍💨 Physiological sigh",
                "description": "2x tief einatmen, lang ausatmen. Sofortige Beruhigung.",
                "pillar": "stress",
                "duration_minutes": 1
            },
            {
                "id": "evening-breathwork",
                "type": "action",
                "time": "21:00",
                "title_de": "🌬️ Abend-Atemübung (4-7-8)",
                "title_en": "🌬️ Evening breathwork (4-7-8)",
                "description": "Einatmen 4, Halten 7, Ausatmen 8 - für besseren Schlaf",
                "pillar": "sleep",
                "duration_minutes": 5,
                "condition": "config.evening_session"
            }
        ]
    }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    task_template = EXCLUDED.task_template,
    config_schema = EXCLUDED.config_schema,
    updated_at = NOW();

-- =====================================================
-- 9. VERIFICATION
-- =====================================================

SELECT 'Phase 2 Modules Added:' AS status;
SELECT slug, name_de, type, duration_days, is_premium
FROM module_definitions
ORDER BY priority_weight DESC;

-- =====================================================
