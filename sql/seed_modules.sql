-- Seed Module Definitions
-- Run this to enable Module Activation in ModuleHub

INSERT INTO module_definitions (slug, name_de, name_en, icon, category, pillars, duration_days, is_active, is_premium, description_de, description_en, priority_weight, daily_tasks)
VALUES
-- Fasting 16:8
('fasting-16-8', '⏰ Intervallfasten 16:8', 'Intermittent Fasting 16:8', '⏰', 'nutrition', ARRAY['nutrition'], 30, true, false,
 '16 Stunden fasten, 8 Stunden Essensfenster.',
 '16 hours fasting, 8 hours eating window.',
 90,
 '[
   {"id": "fast_start", "task": "Fastenfenster starten (keine Kalorien mehr)", "type": "checkbox"},
   {"id": "hydration", "task": "Morgens 500ml Wasser + Salz", "type": "checkbox"},
   {"id": "fast_break", "task": "Fastenbrechen (Proteinreich)", "type": "checkbox"}
 ]'::jsonb),

-- Sleep Protocol
('sleep-protocol', '😴 Schlaf-Protokoll', 'Sleep Protocol', '😴', 'sleep', ARRAY['sleep'], 21, true, false,
 'Optimiere deinen Schlaf für mehr Energie.',
 'Optimize your sleep for more energy.',
 95,
 '[
   {"id": "no_caffeine", "task": "Kein Koffein nach 14:00", "type": "checkbox"},
   {"id": "blue_block", "task": "Blue-Light Blocker (1h vor Bett)", "type": "checkbox"},
   {"id": "magnesium", "task": "Magnesium Bisglycinat (300-400mg)", "type": "checkbox"}
 ]'::jsonb),

-- Morning Routine
('morning-routine', '🌅 Morgenroutine', 'Morning Routine', '🌅', 'lifestyle', ARRAY['circadian', 'movement'], 14, true, false,
 'Starte jeden Tag mit einer energetisierenden Routine.',
 'Start every day with an energizing routine.',
 85,
 '[
   {"id": "sunlight", "task": "Tageslicht (5-10 min outdoor)", "type": "checkbox"},
   {"id": "movement", "task": "Bewegung (Dehnen/Spazieren)", "type": "checkbox"},
   {"id": "cold_water", "task": "Kaltes Wasser ins Gesicht / Dusche", "type": "checkbox"}
 ]'::jsonb),

-- Stress Reset
('stress-reset', '🧘 Stress Reset', 'Stress Reset', '🧘', 'stress', ARRAY['stress', 'mental'], 7, true, false,
 '7 Tage für mehr innere Ruhe.',
 '7 days for more inner peace.',
 80,
 '[
   {"id": "box_breathing", "task": "Box Breathing (4-4-4-4) - 5min", "type": "checkbox"},
   {"id": "nsdr", "task": "NSDR / Yoga Nidra Session", "type": "checkbox"},
   {"id": "nature", "task": "Zeit in der Natur (ohne Handy)", "type": "checkbox"}
 ]'::jsonb),

-- OMAD
('omad-protocol', '🍽️ OMAD (One Meal A Day)', 'OMAD Protocol', '🍽️', 'nutrition', ARRAY['nutrition', 'longevity'], 21, true, true,
 'Eine Mahlzeit pro Tag. Fortgeschrittenes Fasten.',
 'One meal a day. Advanced fasting.',
 75,
 '[
   {"id": "meal_time", "task": "Eine Mahlzeit (nährstoffreich)", "type": "checkbox"},
   {"id": "electrolytes", "task": "Elektrolyte während Fasten", "type": "checkbox"},
   {"id": "hydration", "task": "3L+ Wasser trinken", "type": "checkbox"}
 ]'::jsonb)

ON CONFLICT (slug) DO UPDATE SET
  name_de = EXCLUDED.name_de,
  name_en = EXCLUDED.name_en,
  icon = EXCLUDED.icon,
  description_de = EXCLUDED.description_de,
  description_en = EXCLUDED.description_en,
  priority_weight = EXCLUDED.priority_weight,
  daily_tasks = EXCLUDED.daily_tasks,
  updated_at = NOW();
