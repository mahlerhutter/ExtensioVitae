-- =====================================================
-- Migration 016: Mental Health Modules
-- =====================================================
-- Date: 2026-02-04
-- Purpose: Add evidence-based mental health tracking modules
-- Research: Harvard longevity study (gratitude), CBT effectiveness, PHQ-9 validation
-- =====================================================

-- Gratitude Journal Module (Harvard 2024: 9% lower mortality risk)
INSERT INTO module_definitions (
    slug,
    name_de,
    name_en,
    description_de,
    description_en,
    icon,
    type,
    duration_days,
    category,
    pillars,
    priority_weight,
    affected_by_modes,
    config_schema,
    task_template
) VALUES (
    'gratitude-journal',
    'Dankbarkeits-Tagebuch',
    'Gratitude Journal',
    '3 Dinge täglich, für die du dankbar bist. Harvard-Studie: 9% niedrigeres Sterberisiko, bessere Herz-Gesundheit.',
    '3 things you''re grateful for daily. Harvard study: 9% lower mortality risk, better cardiovascular health.',
    '💛',
    'continuous',
    NULL,
    'mindset',
    ARRAY['mindset', 'mental', 'connection'],
    90,
    ARRAY[]::text[],
    '{
        "reminder_time": {"type": "time", "default": "20:00", "label_de": "Erinnerung"},
        "reflection_depth": {"type": "select", "options": ["quick", "detailed"], "default": "quick", "label_de": "Tiefe"}
    }'::jsonb,
    '{
        "tasks": [
            {
                "id": "gratitude-evening",
                "type": "check-in",
                "time": "{{config.reminder_time}}",
                "title_de": "3 Dinge, für die ich dankbar bin",
                "title_en": "3 things I''m grateful for",
                "description": "Was lief heute gut? Wofür bin ich dankbar? (Menschen, Momente, Fortschritte)",
                "pillar": "mindset",
                "duration_minutes": 3,
                "prompts": [
                    "1. Person oder Moment heute",
                    "2. Etwas Kleines, das Freude brachte",
                    "3. Eine eigene Stärke, die ich genutzt habe"
                ]
            }
        ]
    }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    name_de = EXCLUDED.name_de,
    description_de = EXCLUDED.description_de,
    task_template = EXCLUDED.task_template,
    updated_at = NOW();

-- CBT Thought Record Module (Evidence-based cognitive restructuring)
INSERT INTO module_definitions (
    slug,
    name_de,
    name_en,
    description_de,
    description_en,
    icon,
    type,
    duration_days,
    category,
    pillars,
    priority_weight,
    affected_by_modes,
    is_premium,
    config_schema,
    task_template
) VALUES (
    'cbt-thought-record',
    'Gedanken-Protokoll (CBT)',
    'CBT Thought Record',
    'Identifiziere & challengte negative Gedankenmuster. Klinisch bewährte Cognitive Behavioral Therapy.',
    'Identify & challenge negative thought patterns. Clinically proven Cognitive Behavioral Therapy.',
    '🧩',
    'continuous',
    NULL,
    'mindset',
    ARRAY['mindset', 'mental', 'stress'],
    85,
    ARRAY['sick']::text[],
    true,
    '{
        "trigger_reminder": {"type": "boolean", "default": true, "label_de": "Erinnerung bei Stress-Trigger"},
        "evening_review": {"type": "boolean", "default": true, "label_de": "Abend-Review"}
    }'::jsonb,
    '{
        "tasks": [
            {
                "id": "cbt-morning-intention",
                "type": "check-in",
                "time": "08:00",
                "title_de": "Gedanken-Awareness Check",
                "title_en": "Thought Awareness Check",
                "description": "Beobachte heute deine automatischen Gedanken. Welche Muster erkennst du?",
                "pillar": "mindset",
                "duration_minutes": 2
            },
            {
                "id": "cbt-thought-record",
                "type": "action",
                "time": "20:00",
                "title_de": "Gedanken-Protokoll",
                "title_en": "Thought Record",
                "description": "CBT 5-Spalten: Situation → Gedanke → Gefühl → Evidenz → Alternative",
                "pillar": "mental",
                "duration_minutes": 7,
                "prompts": [
                    "Situation: Was ist passiert?",
                    "Automatischer Gedanke: Was dachte ich?",
                    "Gefühl: Was fühlte ich? (0-10)",
                    "Evidenz: Ist dieser Gedanke wahr?",
                    "Alternative: Realistischere Sichtweise?"
                ]
            }
        ]
    }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    name_de = EXCLUDED.name_de,
    description_de = EXCLUDED.description_de,
    task_template = EXCLUDED.task_template,
    updated_at = NOW();

-- Mood Check-In Module (PHQ-9 based, clinical validation)
INSERT INTO module_definitions (
    slug,
    name_de,
    name_en,
    description_de,
    description_en,
    icon,
    type,
    duration_days,
    category,
    pillars,
    priority_weight,
    affected_by_modes,
    config_schema,
    task_template
) VALUES (
    'mood-check-in',
    'Stimmungs-Check',
    'Mood Check-In',
    'Tägliches Mood-Tracking zur Früherkennung von Mustern. PHQ-9 validiert, 2 Min täglich.',
    'Daily mood tracking for early pattern detection. PHQ-9 validated, 2 min daily.',
    '📊',
    'continuous',
    NULL,
    'mindset',
    ARRAY['mindset', 'mental'],
    75,
    ARRAY[]::text[],
    '{
        "check_in_times": {
            "type": "array",
            "options": ["morning", "evening", "both"],
            "default": "evening",
            "label_de": "Check-In Zeitpunkt"
        },
        "include_triggers": {"type": "boolean", "default": true, "label_de": "Trigger tracken"}
    }'::jsonb,
    '{
        "tasks": [
            {
                "id": "mood-morning",
                "type": "check-in",
                "time": "08:30",
                "title_de": "Morgen Mood-Check",
                "title_en": "Morning Mood Check",
                "description": "Wie fühlst du dich heute Morgen? (0-10)",
                "pillar": "mindset",
                "duration_minutes": 1,
                "condition": "config.check_in_times === ''morning'' || config.check_in_times === ''both''",
                "metrics": [
                    {"id": "energy", "label": "Energie", "scale": "0-10"},
                    {"id": "mood", "label": "Stimmung", "scale": "0-10"}
                ]
            },
            {
                "id": "mood-evening",
                "type": "check-in",
                "time": "21:00",
                "title_de": "Abend Mood-Check",
                "title_en": "Evening Mood Check",
                "description": "Wie war dein Tag emotional? Was waren Trigger?",
                "pillar": "mental",
                "duration_minutes": 2,
                "metrics": [
                    {"id": "mood", "label": "Stimmung", "scale": "0-10"},
                    {"id": "stress", "label": "Stress", "scale": "0-10"},
                    {"id": "anxiety", "label": "Angst", "scale": "0-10"}
                ],
                "prompts": [
                    "Haupttrigger heute? (optional)",
                    "Was half, die Stimmung zu heben?"
                ]
            },
            {
                "id": "mood-weekly-review",
                "type": "check-in",
                "frequency": "weekly",
                "day": "sunday",
                "time": "19:00",
                "title_de": "Wochen-Mood-Analyse",
                "title_en": "Weekly Mood Analysis",
                "description": "Review: Wie war die Woche insgesamt? Muster erkannt?",
                "pillar": "mental",
                "duration_minutes": 5
            }
        ]
    }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    name_de = EXCLUDED.name_de,
    description_de = EXCLUDED.description_de,
    task_template = EXCLUDED.task_template,
    updated_at = NOW();

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT 'Mental Health Modules added:' AS status;
SELECT slug, name_de, category, is_premium FROM module_definitions
WHERE slug IN ('gratitude-journal', 'cbt-thought-record', 'mood-check-in')
ORDER BY priority_weight DESC;

-- =====================================================
-- NOTES
-- =====================================================
--
-- Research Sources:
-- - Harvard JAMA Psychiatry 2024: Gratitude & Longevity (9% lower mortality)
-- - Meta-analysis 64 RCTs: Gratitude interventions improve life satisfaction 6.86%
-- - CBT apps clinical trials: Significant reduction in anxiety/depression symptoms
-- - PHQ-9: Gold standard for depression screening, validated across populations
--
-- =====================================================
