-- =====================================================
-- Migration 026: Full Module Upgrade
-- =====================================================
-- Date: 2026-02-07
-- Purpose: Upgrade ALL module_definitions to full quality
--          Mirrors FALLBACK_MODULES from moduleService.js
--          Adds: progression (min_day/max_day), conditions,
--                expectations, richer task_templates
-- =====================================================

-- =====================================================
-- 1. MOOD CHECK-IN — Full Upgrade (1→9 Tasks)
-- =====================================================
UPDATE module_definitions
SET task_template = '{
    "tasks": [
        {
            "id": "mood-morning",
            "type": "check-in",
            "time": "08:30",
            "title_de": "🌅 Morgen-Mood: Energie (1-10), Stimmung (1-10), Motivation (1-10)",
            "title_en": "Morning mood: energy, mood, motivation (1-10)",
            "pillar": "mindset",
            "duration_minutes": 1,
            "frequency": "daily",
            "condition": "config.check_in_times === ''morning'' || config.check_in_times === ''both''"
        },
        {
            "id": "sleep-mood-link",
            "type": "check-in",
            "time": "08:35",
            "title_de": "😴 Schlaf-Stimmung: Wie hast du geschlafen? (1-10) Aufwach-Häufigkeit?",
            "title_en": "Sleep-mood: How did you sleep? Wake-ups?",
            "pillar": "mental",
            "duration_minutes": 1,
            "frequency": "daily",
            "condition": "config.include_sleep_link",
            "min_day": 5
        },
        {
            "id": "midday-energy",
            "type": "check-in",
            "time": "13:00",
            "title_de": "⚡ Mittags-Energie: Wie ist dein Energie-Level? (1-10) Was hast du gegessen?",
            "title_en": "Midday energy: What is your energy level? What did you eat?",
            "pillar": "mindset",
            "duration_minutes": 1,
            "frequency": "daily",
            "min_day": 4
        },
        {
            "id": "trigger-check",
            "type": "check-in",
            "time": "18:00",
            "title_de": "⚡ Trigger-Check: Gab es heute einen emotionalen Trigger? Was hat ihn ausgelöst?",
            "title_en": "Trigger check: Any emotional trigger today? What caused it?",
            "pillar": "mental",
            "duration_minutes": 2,
            "frequency": "daily",
            "condition": "config.include_triggers",
            "min_day": 5
        },
        {
            "id": "activity-mood",
            "type": "check-in",
            "time": "18:05",
            "title_de": "🏃 Aktivitäts-Mood: Welche Aktivität hat heute deine Stimmung am meisten beeinflusst?",
            "title_en": "Activity mood: Which activity influenced your mood most?",
            "pillar": "mindset",
            "duration_minutes": 2,
            "frequency": "daily",
            "condition": "config.track_activities",
            "min_day": 8
        },
        {
            "id": "mood-evening",
            "type": "check-in",
            "time": "21:00",
            "title_de": "🌙 Abend-Mood: Stimmung (1-10), Stress (1-10), Angst (1-10). Bester Moment?",
            "title_en": "Evening mood: mood, stress, anxiety (1-10). Best moment?",
            "pillar": "mental",
            "duration_minutes": 2,
            "frequency": "daily",
            "condition": "config.check_in_times === ''evening'' || config.check_in_times === ''both''"
        },
        {
            "id": "gratitude-anchor",
            "type": "action",
            "time": "21:05",
            "title_de": "🙏 Stimmungs-Anker: 1 positiver Moment heute, egal wie klein",
            "title_en": "Mood anchor: 1 positive moment today, no matter how small",
            "pillar": "mindset",
            "duration_minutes": 1,
            "frequency": "daily",
            "min_day": 10
        },
        {
            "id": "weekly-analysis",
            "type": "check-in",
            "time": "19:00",
            "title_de": "📊 Wochen-Mood-Analyse: Trend, häufigste Trigger, beste Tage",
            "title_en": "Weekly mood analysis: trend, frequent triggers, best days",
            "pillar": "mental",
            "duration_minutes": 5,
            "frequency": "weekly",
            "day": "sunday"
        },
        {
            "id": "pattern-recognition",
            "type": "check-in",
            "time": "19:10",
            "title_de": "🔍 Muster-Erkennung: Wochentag-Muster? Schlaf-Stimmung-Links? Ernährungs-Einflüsse?",
            "title_en": "Pattern recognition: Weekday patterns? Sleep-mood links?",
            "pillar": "mental",
            "duration_minutes": 3,
            "frequency": "weekly",
            "day": "sunday",
            "min_day": 14
        }
    ]
}'::jsonb,
config_schema = '{
    "properties": {
        "check_in_times": {
            "type": "string",
            "title": "Check-In Zeitpunkt",
            "default": "both",
            "enum": ["morning", "evening", "both"],
            "enumLabels": {"morning": "Nur Morgens", "evening": "Nur Abends", "both": "Morgens & Abends"}
        },
        "include_triggers": {"type": "boolean", "title": "Trigger tracken", "default": true},
        "include_sleep_link": {"type": "boolean", "title": "Schlaf-Stimmung-Korrelation", "default": true},
        "track_activities": {"type": "boolean", "title": "Aktivitäten verknüpfen", "default": false}
    },
    "required": ["check_in_times"]
}'::jsonb,
description_de = '21 Tage strukturiertes Mood-Tracking zur Muster-Erkennung. PHQ-9 validiert, mit Trigger-Analyse und Schlaf-Korrelation.',
duration_days = 21,
updated_at = NOW()
WHERE slug = 'mood-check-in';

-- =====================================================
-- 2. EXTENDED FAST — Full Upgrade (5→9 Tasks)
-- =====================================================
UPDATE module_definitions
SET task_template = '{
    "tasks": [
        {
            "id": "fast-start",
            "type": "action",
            "time": "{{config.start_time}}",
            "title_de": "🚀 Fast beginnt: Letzte leichte Mahlzeit. Wasser + Elektrolyte bereitstellen",
            "title_en": "Fast starts: last light meal. Prepare water + electrolytes",
            "pillar": "nutrition",
            "duration_minutes": 5,
            "frequency": "once",
            "max_day": 1
        },
        {
            "id": "electrolyte-morning",
            "type": "action",
            "time": "08:00",
            "title_de": "⚡ Morgen-Elektrolyte: 1/4 TL Salz + Kalium + Magnesium in 500ml Wasser",
            "title_en": "Morning electrolytes: salt + potassium + magnesium in water",
            "pillar": "nutrition",
            "duration_minutes": 2,
            "frequency": "daily"
        },
        {
            "id": "midday-check",
            "type": "check-in",
            "time": "12:00",
            "title_de": "📊 Mittags-Check: Hunger (1-10), Energie (1-10), Klarheit (1-10), Schwindel?",
            "title_en": "Midday check: hunger, energy, clarity, dizziness?",
            "pillar": "nutrition",
            "duration_minutes": 2,
            "frequency": "daily",
            "condition": "config.include_mood_tracking"
        },
        {
            "id": "gentle-movement",
            "type": "action",
            "time": "10:00",
            "title_de": "🚶 Leichte Bewegung: 15-20min Spaziergang (KEIN intensives Training!)",
            "title_en": "Light movement: 15-20min walk (NO intense training!)",
            "pillar": "movement",
            "duration_minutes": 20,
            "frequency": "daily"
        },
        {
            "id": "electrolyte-afternoon",
            "type": "action",
            "time": "15:00",
            "title_de": "⚡ Nachmittags-Elektrolyte: Besonders wichtig ab 24h+",
            "title_en": "Afternoon electrolytes: especially important after 24h+",
            "pillar": "nutrition",
            "duration_minutes": 2,
            "frequency": "daily"
        },
        {
            "id": "evening-check",
            "type": "check-in",
            "time": "18:00",
            "title_de": "📊 Abend-Check: Energie (1-10), Stimmung (1-10), Abbruch-Kriterien?",
            "title_en": "Evening check: energy, mood, break criteria?",
            "pillar": "nutrition",
            "duration_minutes": 3,
            "frequency": "daily",
            "condition": "config.include_mood_tracking"
        },
        {
            "id": "sleep-prep",
            "type": "action",
            "time": "21:00",
            "title_de": "😴 Schlaf-Optimierung: Extra Magnesium, kein Screen — Schlaf leidet oft beim Fasten",
            "title_en": "Sleep optimization: extra magnesium, no screen",
            "pillar": "sleep",
            "duration_minutes": 5,
            "frequency": "daily"
        },
        {
            "id": "refeeding",
            "type": "action",
            "time": "{{config.start_time}}",
            "title_de": "🎉 Refeeding: Knochenbrühe → 30min warten → leichte Mahlzeit (Protein + Gemüse)",
            "title_en": "Refeeding: bone broth → wait 30min → light meal",
            "pillar": "nutrition",
            "duration_minutes": 30,
            "frequency": "once",
            "min_day": 2
        },
        {
            "id": "post-fast-reflection",
            "type": "check-in",
            "time": "20:00",
            "title_de": "📝 Post-Fast Reflexion: Wie war die Erfahrung? Was gelernt? Nächstes Mal anders?",
            "title_en": "Post-fast reflection: How was the experience? What did you learn?",
            "pillar": "nutrition",
            "duration_minutes": 5,
            "frequency": "once",
            "min_day": 2
        }
    ]
}'::jsonb,
config_schema = '{
    "properties": {
        "duration_hours": {
            "type": "integer",
            "title": "Fasten-Dauer",
            "enum": [24, 36, 48, 72],
            "enumLabels": {"24": "24h (1 Tag)", "36": "36h", "48": "48h (2 Tage)", "72": "72h (3 Tage)"},
            "default": 24
        },
        "start_time": {"type": "string", "format": "time", "title": "Startzeit", "default": "20:00"},
        "has_medical_clearance": {"type": "boolean", "title": "Ärztliche Freigabe", "default": false},
        "include_mood_tracking": {"type": "boolean", "title": "Mood-Tracking", "default": true}
    },
    "required": ["duration_hours", "has_medical_clearance"]
}'::jsonb,
description_de = 'Strukturiertes Extended-Fasting (24-72h) mit Elektrolyt-Management, Mood-Tracking, Schlaf-Optimierung und Refeeding-Protokoll.',
updated_at = NOW()
WHERE slug = 'fasting-extended';

-- =====================================================
-- 3. COLD EXPOSURE — Full Upgrade (4→8 Tasks)
-- =====================================================
UPDATE module_definitions
SET task_template = '{
    "tasks": [
        {
            "id": "pre-cold-breathwork",
            "type": "action",
            "time": "07:25",
            "title_de": "🫁 Kälte-Atemvorbereitung: 2min Box Breathing oder 10 tiefe Atemzüge",
            "title_en": "Cold prep breathing: 2min box breathing or 10 deep breaths",
            "pillar": "mental",
            "duration_minutes": 2,
            "frequency": "daily",
            "condition": "config.include_breathwork"
        },
        {
            "id": "cold-session",
            "type": "action",
            "time": "07:30",
            "title_de": "🧊 Kälte-Session: Kalte Dusche / Eisbad — ruhig atmen, im Moment bleiben",
            "title_en": "Cold session: cold shower / ice bath — breathe calmly, stay present",
            "pillar": "recovery",
            "duration_minutes": 5,
            "frequency": "daily"
        },
        {
            "id": "natural-warmup",
            "type": "action",
            "time": "07:35",
            "title_de": "☀️ Natürlich aufwärmen: KEINE heiße Dusche! Körper durch Bewegung aufwärmen",
            "title_en": "Natural warmup: NO hot shower! Warm up through movement",
            "pillar": "recovery",
            "duration_minutes": 5,
            "frequency": "daily"
        },
        {
            "id": "cold-log",
            "type": "check-in",
            "time": "07:40",
            "title_de": "📊 Kälte-Log: Dauer (Sekunden), Komfort (1-10), Danach-Energie (1-10)",
            "title_en": "Cold log: duration, comfort, post-energy (1-10)",
            "pillar": "recovery",
            "duration_minutes": 2,
            "frequency": "daily",
            "condition": "config.track_tolerance",
            "min_day": 3
        },
        {
            "id": "dopamine-check",
            "type": "check-in",
            "time": "09:00",
            "title_de": "⚡ 90min-Dopamin-Check: Fokus und Energie 90min nach der Kälte?",
            "title_en": "90min dopamine check: Focus and energy 90min after cold?",
            "pillar": "mental",
            "duration_minutes": 1,
            "frequency": "daily",
            "min_day": 7
        },
        {
            "id": "progression-step",
            "type": "info",
            "time": "07:28",
            "title_de": "📈 Progressions-Schritt: Diese Woche 15 Sek länger. Konsistenz > Intensität!",
            "title_en": "Progression: 15 sec longer this week. Consistency > intensity!",
            "pillar": "recovery",
            "duration_minutes": 1,
            "frequency": "weekly",
            "day": "monday",
            "min_day": 8
        },
        {
            "id": "cold-contrast",
            "type": "action",
            "time": "07:30",
            "title_de": "🔥🧊 Kontrast-Training: 30s heiß → 30s kalt → wiederholen (immer mit kalt enden!)",
            "title_en": "Contrast training: hot → cold → repeat (always end cold!)",
            "pillar": "recovery",
            "duration_minutes": 5,
            "frequency": "daily",
            "min_day": 15,
            "condition": "config.intensity !== ''beginner''"
        },
        {
            "id": "weekly-review",
            "type": "check-in",
            "time": "19:00",
            "title_de": "📊 Kälte-Woche: Durchschnittliche Dauer, Komfort-Trend, Energie-Impact",
            "title_en": "Cold week: avg duration, comfort trend, energy impact",
            "pillar": "recovery",
            "duration_minutes": 5,
            "frequency": "weekly",
            "day": "sunday"
        }
    ]
}'::jsonb,
config_schema = '{
    "properties": {
        "intensity": {
            "type": "string",
            "title": "Start-Intensität",
            "enum": ["beginner", "intermediate", "advanced"],
            "enumLabels": {"beginner": "Anfänger (kalte Dusche)", "intermediate": "Fortgeschritten (Eisbad 1-2min)", "advanced": "Profi (Eisbad 3-5min)"},
            "default": "beginner"
        },
        "preferred_time": {
            "type": "string",
            "title": "Tageszeit",
            "enum": ["morning", "post_workout", "afternoon"],
            "default": "morning"
        },
        "include_breathwork": {"type": "boolean", "title": "Atemvorbereitung", "default": true},
        "track_tolerance": {"type": "boolean", "title": "Toleranz tracken", "default": true}
    },
    "required": ["intensity"]
}'::jsonb,
description_de = '21 Tage progressive Kälte-Adaption mit Atemvorbereitung, natürlichem Aufwärmen und Dopamin-Tracking.',
duration_days = 21,
updated_at = NOW()
WHERE slug = 'cold-exposure';

-- =====================================================
-- 4. CIRCADIAN LIGHT — Enhanced (6→9 Tasks)
-- =====================================================
UPDATE module_definitions
SET task_template = '{
    "tasks": [
        {
            "id": "morning-light",
            "type": "action",
            "time": "{{config.wake_time}}+15min",
            "title_de": "☀️ Morgenlicht: 10min draußen ohne Sonnenbrille (bei Wolken: 20min)",
            "title_en": "Morning light: 10min outside without sunglasses",
            "pillar": "sleep",
            "duration_minutes": 10
        },
        {
            "id": "caffeine-cutoff",
            "type": "reminder",
            "time": "14:00",
            "title_de": "☕ Koffein-Stopp: Ab jetzt kein Kaffee/Tee mehr",
            "title_en": "Caffeine cutoff: no more coffee/tea",
            "pillar": "sleep",
            "duration_minutes": 1
        },
        {
            "id": "afternoon-light",
            "type": "action",
            "time": "15:00",
            "title_de": "🌤️ Nachmittags-Licht: 5min draußen — stabilisiert Cortisol-Rhythmus",
            "title_en": "Afternoon light: 5min outside",
            "pillar": "sleep",
            "duration_minutes": 5,
            "min_day": 8
        },
        {
            "id": "sunset-light",
            "type": "action",
            "time": "{{config.target_bedtime}}-180min",
            "title_de": "🌅 Abendsonne: Oranges/rotes Licht anschauen",
            "title_en": "Sunset viewing: orange/red light",
            "pillar": "sleep",
            "duration_minutes": 10,
            "condition": "config.include_sunset",
            "min_day": 8
        },
        {
            "id": "blue-light-cutoff",
            "type": "action",
            "time": "{{config.target_bedtime}}-120min",
            "title_de": "📱 Blaulicht-Stopp: Night Shift + Blaulichtbrille + Screens dimmen",
            "title_en": "Blue light cutoff: night shift + glasses + dim screens",
            "pillar": "sleep",
            "duration_minutes": 2
        },
        {
            "id": "dim-lights",
            "type": "action",
            "time": "{{config.target_bedtime}}-60min",
            "title_de": "💡 Lichter dimmen: Nur warmes Licht. Kein Deckenlicht. Kerzen ideal",
            "title_en": "Dim lights: warm light only. No overhead. Candles ideal",
            "pillar": "sleep",
            "duration_minutes": 1,
            "min_day": 4
        },
        {
            "id": "bedroom-prep",
            "type": "action",
            "time": "{{config.target_bedtime}}-30min",
            "title_de": "🛏️ Schlafzimmer: Komplett dunkel, kühl (18°C), kein Standby-Licht",
            "title_en": "Bedroom: dark, cool, no standby lights",
            "pillar": "sleep",
            "duration_minutes": 5
        },
        {
            "id": "light-score",
            "type": "check-in",
            "time": "{{config.target_bedtime}}-15min",
            "title_de": "📊 Licht-Score: Morgenlicht ✓ Blaulicht-Stopp ✓ Dimmen ✓ Dunkel ✓",
            "title_en": "Light score: Morning ✓ Blue light ✓ Dim ✓ Dark ✓",
            "pillar": "sleep",
            "duration_minutes": 1,
            "min_day": 8
        },
        {
            "id": "weekly-review",
            "type": "check-in",
            "time": "19:00",
            "title_de": "📊 Licht-Woche: Schlafqualität-Trend, Einschlaf-Geschwindigkeit, Energie",
            "title_en": "Light week: sleep quality trend, sleep onset, energy",
            "pillar": "sleep",
            "duration_minutes": 5,
            "frequency": "weekly",
            "day": "sunday"
        }
    ]
}'::jsonb,
config_schema = '{
    "properties": {
        "wake_time": {"type": "string", "format": "time", "title": "Aufwachzeit", "default": "07:00"},
        "target_bedtime": {"type": "string", "format": "time", "title": "Ziel-Schlafenszeit", "default": "22:30"},
        "has_outdoor_access": {"type": "boolean", "title": "Zugang nach draußen morgens?", "default": true},
        "include_sunset": {"type": "boolean", "title": "Abendsonne anschauen?", "default": true}
    },
    "required": ["wake_time", "target_bedtime"]
}'::jsonb,
description_de = '21 Tage Licht-Optimierung: Morgenlicht, Blaulicht-Management, Schlafzimmer-Dunkelheit — für besseren Schlaf und mehr Energie.',
duration_days = 21,
updated_at = NOW()
WHERE slug = 'circadian-light';

-- =====================================================
-- 5. SUPPLEMENT TIMING — Enhanced (5→9 Tasks)
-- =====================================================
UPDATE module_definitions
SET task_template = '{
    "tasks": [
        {
            "id": "morning-empty",
            "type": "action",
            "time": "{{config.wake_time}}",
            "title_de": "💊 Nüchtern-Supplements: B-Komplex, Probiotika — VOR dem Essen",
            "title_en": "Empty stomach: B-complex, Probiotics — BEFORE eating",
            "pillar": "supplements",
            "duration_minutes": 1,
            "condition": "config.supplements.includes(''b_complex'') || config.supplements.includes(''probiotics'')"
        },
        {
            "id": "morning-fat",
            "type": "action",
            "time": "{{config.wake_time}}+30min",
            "title_de": "💊 Fettlösliche: D3+K2, Omega-3 — MIT Fett/Frühstück einnehmen",
            "title_en": "Fat-soluble: D3+K2, Omega-3 — WITH fat/breakfast",
            "pillar": "supplements",
            "duration_minutes": 2,
            "condition": "config.supplements.includes(''vitamin_d'') || config.supplements.includes(''omega3'')"
        },
        {
            "id": "creatine",
            "type": "action",
            "time": "{{config.wake_time}}+30min",
            "title_de": "💊 Kreatin: 5g täglich — Zeitpunkt egal, Konsistenz zählt",
            "title_en": "Creatine: 5g daily — timing flexible, consistency matters",
            "pillar": "supplements",
            "duration_minutes": 1,
            "condition": "config.supplements.includes(''creatine'')"
        },
        {
            "id": "midday-vitamin-c",
            "type": "action",
            "time": "12:00",
            "title_de": "💊 Mittag: Vitamin C + Eisen — C verbessert Eisen-Aufnahme!",
            "title_en": "Midday: Vitamin C + Iron — C improves iron absorption!",
            "pillar": "supplements",
            "duration_minutes": 1,
            "condition": "config.supplements.includes(''vitamin_c'') || config.supplements.includes(''iron'')"
        },
        {
            "id": "collagen",
            "type": "action",
            "time": "14:00",
            "title_de": "💊 Kollagen: 10-15g in Wasser — nüchtern oder zwischen Mahlzeiten",
            "title_en": "Collagen: 10-15g in water — fasted or between meals",
            "pillar": "supplements",
            "duration_minutes": 2,
            "condition": "config.supplements.includes(''collagen'')"
        },
        {
            "id": "evening-magnesium",
            "type": "action",
            "time": "{{config.bedtime}}-60min",
            "title_de": "💊 Abend-Magnesium: Glycinat oder Threonat — Schlaf & Muskelrelaxation",
            "title_en": "Evening magnesium: glycinate or threonate — sleep & relaxation",
            "pillar": "supplements",
            "duration_minutes": 1,
            "condition": "config.supplements.includes(''magnesium'')"
        },
        {
            "id": "evening-zinc",
            "type": "action",
            "time": "{{config.bedtime}}-30min",
            "title_de": "💊 Abend-Zink: 15-30mg — Immunsystem & Schlaf (NICHT mit Eisen!)",
            "title_en": "Evening zinc: 15-30mg — immune & sleep (NOT with iron!)",
            "pillar": "supplements",
            "duration_minutes": 1,
            "condition": "config.supplements.includes(''zinc'')"
        },
        {
            "id": "weekly-education",
            "type": "info",
            "time": "10:00",
            "title_de": "📚 Supplement-Wissen: Timing, Interaktionen & Absorptions-Tipps",
            "title_en": "Supplement education: timing, interactions & absorption tips",
            "pillar": "supplements",
            "duration_minutes": 3,
            "frequency": "weekly",
            "day": "wednesday",
            "min_day": 4
        },
        {
            "id": "weekly-review",
            "type": "check-in",
            "time": "19:00",
            "title_de": "📊 Supplement-Woche: Compliance, Verträglichkeit, Energie, Schlaf?",
            "title_en": "Supplement week: compliance, tolerability, energy, sleep?",
            "pillar": "supplements",
            "duration_minutes": 3,
            "frequency": "weekly",
            "day": "sunday"
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
                "vitamin_d": "Vitamin D3+K2", "omega3": "Omega-3", "magnesium": "Magnesium",
                "zinc": "Zink", "b_complex": "B-Komplex", "vitamin_c": "Vitamin C",
                "iron": "Eisen", "probiotics": "Probiotika", "creatine": "Kreatin", "collagen": "Kollagen"
            },
            "default": ["vitamin_d", "magnesium", "omega3"]
        },
        "wake_time": {"type": "string", "format": "time", "title": "Aufwachzeit", "default": "07:00"},
        "bedtime": {"type": "string", "format": "time", "title": "Schlafenszeit", "default": "22:30"},
        "has_breakfast": {"type": "boolean", "title": "Frühstückst du?", "default": true}
    },
    "required": ["supplements", "wake_time"]
}'::jsonb,
description_de = '14 Tage optimiertes Supplement-Timing. Individuell auf deine Auswahl abgestimmt — mit Fett, nüchtern oder abends.',
duration_days = 14,
updated_at = NOW()
WHERE slug = 'supplement-timing';

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT '026 Module Upgrades Applied:' AS status;
SELECT slug, name_de,
       jsonb_array_length(task_template->'tasks') AS task_count,
       duration_days,
       updated_at
FROM module_definitions
WHERE slug IN ('mood-check-in', 'fasting-extended', 'cold-exposure', 'circadian-light', 'supplement-timing')
ORDER BY slug;

-- =====================================================
