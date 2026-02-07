/**
 * ExtensioVitae Module Service
 *
 * Manages module definitions and user module instances.
 * Core of the modular tracking system.
 */

import { supabase } from './supabase';
import { logger } from './logger';

// =====================================================
// LOCAL FALLBACK MODULE DEFINITIONS
// Used when database migrations haven't been run
// =====================================================

const FALLBACK_MODULES = [
  // =========================================================================
  // 1. INTERVALLFASTEN 16:8 — Full Protocol (30 Tage)
  //    Evidenz: Time-restricted eating → Autophagie, Insulinsensitivität, Gewicht
  //    Phasen: stabilize(1-7) → build(8-14) → optimize(15-21) → consolidate(22-30)
  // =========================================================================
  {
    id: 'fallback-fasting-16-8',
    slug: 'fasting-16-8',
    name_de: '⏰ Intervallfasten 16:8',
    name_en: 'Intermittent Fasting 16:8',
    icon: '⏰',
    category: 'nutrition',
    pillars: ['nutrition', 'metabolism'],
    duration_days: 30,
    is_active: true,
    is_premium: false,
    difficulty_level: 'beginner',
    tasks_per_day: 4,
    description_de: '30 Tage strukturiertes Intervallfasten mit progressivem Aufbau. Von Basis-Hydration bis zur optimierten Mahlzeitensteuerung — wissenschaftlich fundiert.',
    description_en: '30 days structured intermittent fasting with progressive phases. From basic hydration to optimized meal timing — evidence-based.',
    expectations: [
      { de: 'Woche 1: Gewöhnung an das Essensfenster', en: 'Week 1: Adapting to eating window' },
      { de: 'Woche 2: Protein-Optimierung & Elektrolyte', en: 'Week 2: Protein optimization & electrolytes' },
      { de: 'Woche 3: Post-Meal Walks & Blutzucker', en: 'Week 3: Post-meal walks & blood sugar' },
      { de: 'Woche 4: Volles Protokoll & Autophagie', en: 'Week 4: Full protocol & autophagy' }
    ],
    priority_weight: 90,
    config_schema: {
      properties: {
        eating_window_start: { type: 'string', format: 'time', title: 'Essensfenster Start', title_de: 'Essensfenster Start', default: '12:00', description_de: 'Wann öffnest du dein Essensfenster?' },
        eating_window_end: { type: 'string', format: 'time', title: 'Essensfenster Ende', title_de: 'Essensfenster Ende', default: '20:00', description_de: 'Wann schließt du dein Essensfenster?' },
        include_acv: { type: 'boolean', title: 'Apfelessig-Shot', title_de: 'Apfelessig-Shot vor Mahlzeit?', default: true, description_de: 'Reduziert Blutzuckerspitzen um ~30%' },
        hydration_goal_l: { type: 'number', title: 'Wasserziel (Liter)', title_de: 'Tägliches Wasserziel (Liter)', default: 2.5, minimum: 1.5, maximum: 4 }
      },
      required: ['eating_window_start', 'eating_window_end']
    },
    task_template: {
      tasks: [
        { id: 'morning-hydration', type: 'action', time: '07:00', title_de: '💧 Morgen-Hydration: 500ml Wasser + Prise Salz', title_en: 'Morning hydration: 500ml water + pinch of salt', pillar: 'nutrition', duration_minutes: 2, frequency: 'daily' },
        { id: 'fast-reminder', type: 'info', time: '09:00', title_de: '⏰ Fastenfenster aktiv — keine Kalorien (Wasser/Tee/Kaffee schwarz ok)', title_en: 'Fasting window active — no calories', pillar: 'nutrition', duration_minutes: 1, frequency: 'daily' },
        { id: 'eating-window-open', type: 'action', time: '{{config.eating_window_start}}', title_de: '🍽️ Essensfenster öffnen — Protein First!', title_en: 'Open eating window — protein first!', pillar: 'nutrition', duration_minutes: 3, frequency: 'daily' },
        { id: 'protein-tracking', type: 'action', time: '{{config.eating_window_start}}+30min', title_de: '🥩 Protein-Check: Mind. 30g Protein in erster Mahlzeit', title_en: 'Protein check: min 30g in first meal', pillar: 'nutrition', duration_minutes: 2, frequency: 'daily', min_day: 8 },
        { id: 'acv-shot', type: 'action', time: '{{config.eating_window_start}}-15min', title_de: '🍎 Apfelessig-Shot: 1 EL in Wasser (15min vor Mahlzeit)', title_en: 'ACV shot: 1 tbsp in water (15min before meal)', pillar: 'nutrition', duration_minutes: 2, frequency: 'daily', condition: 'config.include_acv', min_day: 8 },
        { id: 'glucose-walk', type: 'action', time: '{{config.eating_window_start}}+60min', title_de: '🚶 Post-Meal Walk: 10min langsam gehen für Blutzucker', title_en: 'Post-meal walk: 10min for blood sugar', pillar: 'movement', duration_minutes: 10, frequency: 'daily', min_day: 15 },
        { id: 'electrolytes', type: 'action', time: '14:00', title_de: '⚡ Elektrolyte: Prise Salz + Kalium in Wasser', title_en: 'Electrolytes: salt + potassium in water', pillar: 'nutrition', duration_minutes: 2, frequency: 'daily', min_day: 8 },
        { id: 'eating-window-close', type: 'action', time: '{{config.eating_window_end}}', title_de: '🔒 Essensfenster schließen — ab jetzt nur noch Wasser', title_en: 'Close eating window — water only from now', pillar: 'nutrition', duration_minutes: 1, frequency: 'daily' },
        { id: 'evening-prep', type: 'action', time: '20:30', title_de: '📋 Morgen-Mahlzeit planen: Protein + Gemüse + gesunde Fette', title_en: 'Plan tomorrow\'s meals: protein + veggies + healthy fats', pillar: 'nutrition', duration_minutes: 5, frequency: 'daily', min_day: 15 },
        { id: 'weekly-review', type: 'check-in', time: '19:00', title_de: '📊 Fasten-Woche reflektieren: Hunger-Level, Energie, Schlaf, Gewicht', title_en: 'Weekly fasting review: hunger, energy, sleep, weight', pillar: 'nutrition', duration_minutes: 5, frequency: 'weekly', day: 'sunday' }
      ]
    },
    daily_tasks: [
      { id: 'morning-hydration', task: '💧 Morgen-Hydration: 500ml Wasser + Prise Salz', type: 'checkbox', duration_minutes: 2 },
      { id: 'eating-window-open', task: '🍽️ Essensfenster öffnen — Protein First!', type: 'checkbox', duration_minutes: 3 },
      { id: 'eating-window-close', task: '🔒 Essensfenster schließen — nur noch Wasser', type: 'checkbox', duration_minutes: 1 },
      { id: 'electrolytes', task: '⚡ Elektrolyte während Fastenphase', type: 'checkbox', duration_minutes: 2 }
    ]
  },

  // =========================================================================
  // 2. SCHLAF-PROTOKOLL — Evidence-Based Sleep Optimization (21 Tage)
  //    Evidenz: Walker (Why We Sleep), Huberman Sleep Toolkit
  //    Phasen: hygiene(1-7) → optimize(8-14) → biohack(15-21)
  // =========================================================================
  {
    id: 'fallback-sleep-protocol',
    slug: 'sleep-protocol',
    name_de: '😴 Schlaf-Protokoll',
    name_en: 'Sleep Protocol',
    icon: '😴',
    category: 'sleep',
    pillars: ['sleep', 'recovery', 'circadian'],
    duration_days: 21,
    is_active: true,
    is_premium: false,
    difficulty_level: 'beginner',
    tasks_per_day: 4,
    description_de: '21 Tage evidenzbasiertes Schlaf-Protokoll. Von Basis-Hygiene über Licht-Management bis zu fortgeschrittenen Biohacking-Techniken — für tiefen, erholsamen Schlaf.',
    description_en: '21 days evidence-based sleep protocol. From basic hygiene through light management to advanced biohacking techniques.',
    expectations: [
      { de: 'Woche 1: Schlaf-Hygiene Basics (Temperatur, Licht, Koffein)', en: 'Week 1: Sleep hygiene basics' },
      { de: 'Woche 2: Wind-Down Routine & Schlaf-Tracking', en: 'Week 2: Wind-down routine & tracking' },
      { de: 'Woche 3: NSDR, Supplements & vollständiges Protokoll', en: 'Week 3: NSDR, supplements & full protocol' }
    ],
    priority_weight: 95,
    config_schema: {
      properties: {
        target_bedtime: { type: 'string', format: 'time', title: 'Ziel-Schlafenszeit', title_de: 'Wann willst du schlafen gehen?', default: '22:30', description_de: 'Deine ideale Einschlafzeit' },
        wake_time: { type: 'string', format: 'time', title: 'Aufwachzeit', title_de: 'Wann stehst du auf?', default: '06:30', description_de: 'Deine tägliche Aufwachzeit' },
        room_temp_c: { type: 'integer', title: 'Raumtemperatur', title_de: 'Schlafzimmer-Temperatur (°C)', default: 18, minimum: 15, maximum: 22, description_de: 'Ideal: 16-19°C' },
        include_supplements: { type: 'boolean', title: 'Supplements', title_de: 'Schlaf-Supplements nutzen?', default: true, description_de: 'Magnesium Bisglycinat + Glycin' }
      },
      required: ['target_bedtime', 'wake_time']
    },
    task_template: {
      tasks: [
        { id: 'caffeine-cutoff', type: 'action', time: '14:00', title_de: '☕ Koffein-Stopp: Ab jetzt nur noch koffeinfrei (Wasser, Kräutertee)', title_en: 'Caffeine cutoff: decaf only from now', pillar: 'sleep', duration_minutes: 1, frequency: 'daily' },
        { id: 'afternoon-light', type: 'action', time: '15:00', title_de: '☀️ Nachmittags-Licht: 5min Tageslicht für Cortisol-Rhythmus', title_en: 'Afternoon light: 5min daylight for cortisol rhythm', pillar: 'circadian', duration_minutes: 5, frequency: 'daily', min_day: 8 },
        { id: 'no-late-meal', type: 'action', time: '{{config.target_bedtime}}-180min', title_de: '🍽️ Letzte Mahlzeit jetzt — danach 3h Pause vor dem Schlaf', title_en: 'Last meal now — 3h gap before bed', pillar: 'nutrition', duration_minutes: 2, frequency: 'daily', min_day: 15 },
        { id: 'screen-dim', type: 'action', time: '{{config.target_bedtime}}-120min', title_de: '📱 Screens dimmen + Blue-Light Blocker aktivieren', title_en: 'Dim screens + activate blue light blocker', pillar: 'circadian', duration_minutes: 2, frequency: 'daily' },
        { id: 'room-prep', type: 'action', time: '{{config.target_bedtime}}-60min', title_de: '🌡️ Schlafzimmer vorbereiten: {{config.room_temp_c}}°C, verdunkeln, lüften', title_en: 'Prepare bedroom: cool, dark, ventilate', pillar: 'sleep', duration_minutes: 3, frequency: 'daily' },
        { id: 'wind-down', type: 'action', time: '{{config.target_bedtime}}-45min', title_de: '📖 Wind-Down: Lesen, sanftes Dehnen oder ruhige Musik (kein Screen)', title_en: 'Wind-down: reading, gentle stretching or calm music', pillar: 'sleep', duration_minutes: 15, frequency: 'daily', min_day: 8 },
        { id: 'magnesium', type: 'action', time: '{{config.target_bedtime}}-30min', title_de: '💊 Magnesium Bisglycinat (300-400mg) + Glycin (3g)', title_en: 'Magnesium bisglycinate (300-400mg) + Glycine (3g)', pillar: 'supplements', duration_minutes: 2, frequency: 'daily', condition: 'config.include_supplements' },
        { id: 'sleep-breathing', type: 'action', time: '{{config.target_bedtime}}-10min', title_de: '🫁 4-7-8 Atmung im Bett: 4 Runden (Einatmen 4s, Halten 7s, Ausatmen 8s)', title_en: '4-7-8 breathing in bed: 4 rounds', pillar: 'sleep', duration_minutes: 5, frequency: 'daily', min_day: 8 },
        { id: 'sleep-journal', type: 'check-in', time: '{{config.wake_time}}+15min', title_de: '📝 Schlaf-Journal: Wie war die Nacht? Tiefschlaf, Aufwachen, Träume?', title_en: 'Sleep journal: How was the night? Deep sleep, wake-ups, dreams?', pillar: 'sleep', duration_minutes: 3, frequency: 'daily', min_day: 8 },
        { id: 'nsdr', type: 'action', time: '13:00', title_de: '🧘 NSDR / Yoga Nidra: 10-15min geführte Tiefenentspannung', title_en: 'NSDR / Yoga Nidra: 10-15min guided deep rest', pillar: 'recovery', duration_minutes: 15, frequency: 'daily', min_day: 15 },
        { id: 'weekly-review', type: 'check-in', time: '19:00', title_de: '📊 Schlaf-Woche: HRV-Trend, Tiefschlaf-%, Einschlafzeit, Energie-Level', title_en: 'Sleep week review: HRV trend, deep sleep %, energy', pillar: 'sleep', duration_minutes: 5, frequency: 'weekly', day: 'sunday' }
      ]
    },
    daily_tasks: [
      { id: 'caffeine-cutoff', task: '☕ Koffein-Stopp ab 14:00', type: 'checkbox', duration_minutes: 1 },
      { id: 'screen-dim', task: '📱 Screens dimmen + Blue-Light Blocker (2h vor Bett)', type: 'checkbox', duration_minutes: 2 },
      { id: 'room-prep', task: '🌡️ Schlafzimmer: kühl, dunkel, lüften', type: 'checkbox', duration_minutes: 3 },
      { id: 'magnesium', task: '💊 Magnesium Bisglycinat (300-400mg)', type: 'checkbox', duration_minutes: 2 }
    ]
  },

  // =========================================================================
  // 3. MORGENROUTINE — Energie-Aktivierung (14 Tage)
  //    Evidenz: Huberman Morning Protocol, Circadian Entrainment
  //    Phasen: core(1-7) → full(8-14)
  // =========================================================================
  {
    id: 'fallback-morning-routine',
    slug: 'morning-routine',
    name_de: '🌅 Morgenroutine',
    name_en: 'Morning Routine',
    icon: '🌅',
    category: 'lifestyle',
    pillars: ['circadian', 'movement', 'mental'],
    duration_days: 14,
    is_active: true,
    is_premium: false,
    difficulty_level: 'beginner',
    tasks_per_day: 4,
    description_de: '14 Tage strukturierte Morgenroutine für maximale Energie. Licht, Bewegung, Kälte und Intention — alles zeitlich optimiert auf deine Aufwachzeit.',
    description_en: '14 days structured morning routine for maximum energy. Light, movement, cold and intention — timed to your wake time.',
    expectations: [
      { de: 'Woche 1: Kern-Routine (Licht, Hydration, Bewegung)', en: 'Week 1: Core routine (light, hydration, movement)' },
      { de: 'Woche 2: Volle Routine mit Breathwork & Intention', en: 'Week 2: Full routine with breathwork & intention' }
    ],
    priority_weight: 85,
    config_schema: {
      properties: {
        wake_time: { type: 'string', format: 'time', title: 'Aufwachzeit', title_de: 'Wann stehst du auf?', default: '06:30' },
        include_cold: { type: 'boolean', title: 'Kälte-Exposure', title_de: 'Kalte Dusche / Kaltwasser?', default: false, description_de: '30s kaltes Wasser für Dopamin + Noradrenalin Boost' },
        include_journaling: { type: 'boolean', title: 'Journaling', title_de: 'Intention + Dankbarkeit schreiben?', default: true, description_de: 'Tages-Intention und 3 Dankbarkeiten' },
        include_movement: { type: 'boolean', title: 'Bewegung', title_de: 'Morgen-Bewegung?', default: true, description_de: '5-10min Dehnen, Yoga oder Spaziergang' }
      },
      required: ['wake_time']
    },
    task_template: {
      tasks: [
        { id: 'no-phone', type: 'action', time: '{{config.wake_time}}', title_de: '📵 Kein Handy für 30min — kein Social Media, keine News', title_en: 'No phone for 30min — no social media, no news', pillar: 'mental', duration_minutes: 1, frequency: 'daily' },
        { id: 'hydration', type: 'action', time: '{{config.wake_time}}+5min', title_de: '💧 Großes Glas Wasser + Prise Salz (Rehydration nach 8h)', title_en: 'Large glass of water + pinch of salt', pillar: 'nutrition', duration_minutes: 2, frequency: 'daily' },
        { id: 'sunlight', type: 'action', time: '{{config.wake_time}}+15min', title_de: '☀️ 5-10min Tageslicht draußen (ohne Sonnenbrille) für Cortisol-Peak', title_en: '5-10min outdoor sunlight (no sunglasses) for cortisol peak', pillar: 'circadian', duration_minutes: 10, frequency: 'daily' },
        { id: 'cold-exposure', type: 'action', time: '{{config.wake_time}}+25min', title_de: '🧊 30s kaltes Wasser (Dusche oder Gesicht) — Dopamin +250%', title_en: '30s cold water (shower or face) — dopamine +250%', pillar: 'recovery', duration_minutes: 3, frequency: 'daily', condition: 'config.include_cold' },
        { id: 'movement', type: 'action', time: '{{config.wake_time}}+30min', title_de: '🤸 5-10min Bewegung: Dehnen, leichtes Yoga oder kurzer Spaziergang', title_en: '5-10min movement: stretching, light yoga or short walk', pillar: 'movement', duration_minutes: 10, frequency: 'daily', condition: 'config.include_movement' },
        { id: 'breathwork', type: 'action', time: '{{config.wake_time}}+40min', title_de: '🫁 3min Box Breathing (4-4-4-4) oder Physiological Sigh (3x)', title_en: '3min box breathing or physiological sigh', pillar: 'mental', duration_minutes: 3, frequency: 'daily', min_day: 8 },
        { id: 'intention', type: 'check-in', time: '{{config.wake_time}}+45min', title_de: '🎯 Tages-Intention: Was ist heute am wichtigsten? 1 Fokus-Ziel setzen', title_en: 'Daily intention: What matters most today? Set 1 focus goal', pillar: 'mental', duration_minutes: 3, frequency: 'daily', condition: 'config.include_journaling', min_day: 8 },
        { id: 'gratitude', type: 'check-in', time: '{{config.wake_time}}+50min', title_de: '🙏 3 Dinge, für die du dankbar bist (laut oder schriftlich)', title_en: '3 things you\'re grateful for (spoken or written)', pillar: 'mental', duration_minutes: 3, frequency: 'daily', condition: 'config.include_journaling', min_day: 8 },
        { id: 'no-caffeine-60', type: 'info', time: '{{config.wake_time}}+60min', title_de: '☕ Erst jetzt Koffein — 60-90min nach Aufwachen für optimale Wirkung', title_en: 'Caffeine now — 60-90min after waking for optimal effect', pillar: 'circadian', duration_minutes: 1, frequency: 'daily' }
      ]
    },
    daily_tasks: [
      { id: 'no-phone', task: '📵 Kein Handy für 30min nach Aufwachen', type: 'checkbox', duration_minutes: 1 },
      { id: 'hydration', task: '💧 Großes Glas Wasser + Prise Salz', type: 'checkbox', duration_minutes: 2 },
      { id: 'sunlight', task: '☀️ 5-10min Tageslicht draußen', type: 'checkbox', duration_minutes: 10 },
      { id: 'movement', task: '🤸 5-10min Bewegung oder Dehnen', type: 'checkbox', duration_minutes: 10 }
    ]
  },

  // =========================================================================
  // 4. STRESS RESET — 7-Tage Nervensystem-Reset
  //    Evidenz: Polyvagal-Theorie, Huberman Stress Toolkit, Yale Stress Center
  //    Progression: Tag 1-2 Awareness → Tag 3-4 Techniken → Tag 5-7 Integration
  // =========================================================================
  {
    id: 'fallback-stress-reset',
    slug: 'stress-reset',
    name_de: '🧘 Stress Reset',
    name_en: 'Stress Reset',
    icon: '🧘',
    category: 'stress',
    pillars: ['mental', 'recovery', 'stress'],
    duration_days: 7,
    is_active: true,
    is_premium: false,
    difficulty_level: 'beginner',
    tasks_per_day: 4,
    description_de: '7 Tage intensiver Stress-Reset für dein Nervensystem. Progressive Techniken von Atemarbeit über Body Scan bis NSDR — für messbar niedrigeren Cortisol-Spiegel.',
    description_en: '7 days intensive stress reset for your nervous system. Progressive techniques from breathwork to NSDR.',
    expectations: [
      { de: 'Tag 1-2: Stress-Awareness & Basis-Atmung', en: 'Day 1-2: Stress awareness & basic breathing' },
      { de: 'Tag 3-4: Body Scan, Natur & NSDR', en: 'Day 3-4: Body scan, nature & NSDR' },
      { de: 'Tag 5-7: Tiefere Praxis & Integration', en: 'Day 5-7: Deeper practice & integration' }
    ],
    priority_weight: 80,
    config_schema: {
      properties: {
        stress_level: { type: 'integer', title: 'Aktuelles Stress-Level', title_de: 'Dein aktuelles Stress-Level (1-10)?', default: 6, minimum: 1, maximum: 10, description_de: '1 = entspannt, 10 = extrem gestresst' },
        preferred_technique: { type: 'string', title: 'Bevorzugte Technik', title_de: 'Welche Technik interessiert dich?', default: 'box_breathing', enum: ['box_breathing', 'nsdr', 'nature', 'body_scan'], enumLabels: { box_breathing: 'Box Breathing', nsdr: 'NSDR / Yoga Nidra', nature: 'Natur & Achtsamkeit', body_scan: 'Body Scan' } },
        available_minutes: { type: 'integer', title: 'Verfügbare Zeit', title_de: 'Wie viel Zeit hast du pro Tag?', default: 15, enum: [5, 10, 15, 20], description_de: 'Minuten pro Tag für Stressabbau' }
      },
      required: ['stress_level']
    },
    task_template: {
      tasks: [
        { id: 'box-breathing', type: 'action', time: '08:00', title_de: '🫁 Box Breathing: 4-4-4-4 (5min) — Nervensystem beruhigen', title_en: 'Box breathing: 4-4-4-4 (5min) — calm nervous system', pillar: 'mental', duration_minutes: 5, frequency: 'daily' },
        { id: 'stress-check', type: 'check-in', time: '09:00', title_de: '📊 Stress-Check: Wie fühlst du dich? Körper-Spannung, Gedanken, Energie (1-10)', title_en: 'Stress check: How do you feel? Body tension, thoughts, energy', pillar: 'mental', duration_minutes: 2, frequency: 'daily' },
        { id: 'physiological-sigh', type: 'action', time: null, title_de: '😮‍💨 Physiological Sigh bei Stress: Doppelt einatmen (Nase), lang ausatmen (Mund) — 3x', title_en: 'Physiological sigh for stress: double inhale, long exhale — 3x', pillar: 'mental', duration_minutes: 1, frequency: 'daily' },
        { id: 'body-scan', type: 'action', time: '12:00', title_de: '🧘 Body Scan: 5-10min von Füßen bis Kopf, Spannung wahrnehmen und loslassen', title_en: 'Body scan: 5-10min from feet to head, notice and release tension', pillar: 'mental', duration_minutes: 8, frequency: 'daily', min_day: 2 },
        { id: 'nature-walk', type: 'action', time: '14:00', title_de: '🌳 Natur-Pause: 10min draußen (ohne Handy) — Bäume, Himmel, frische Luft', title_en: 'Nature break: 10min outside (no phone) — trees, sky, fresh air', pillar: 'mental', duration_minutes: 10, frequency: 'daily', min_day: 2 },
        { id: 'nsdr', type: 'action', time: '15:00', title_de: '🧘 NSDR / Yoga Nidra: 10-15min geführte Tiefenentspannung (YouTube/App)', title_en: 'NSDR / Yoga Nidra: 10-15min guided deep rest', pillar: 'recovery', duration_minutes: 15, frequency: 'daily', min_day: 3 },
        { id: 'digital-detox', type: 'action', time: '19:00', title_de: '📵 Digital Detox: 1 Stunde komplett offline — lesen, kochen, spazieren', title_en: 'Digital detox: 1 hour completely offline', pillar: 'mental', duration_minutes: 60, frequency: 'daily', min_day: 4 },
        { id: 'stress-journal', type: 'check-in', time: '21:00', title_de: '📝 Stress-Journal: Was hat heute Stress ausgelöst? Was hat geholfen? 1 Learning', title_en: 'Stress journal: What caused stress? What helped? 1 learning', pillar: 'mental', duration_minutes: 5, frequency: 'daily', min_day: 3 },
        { id: 'gratitude-evening', type: 'check-in', time: '21:30', title_de: '🙏 3 positive Momente des Tages benennen — auch kleine Dinge zählen', title_en: '3 positive moments of the day — small things count too', pillar: 'mental', duration_minutes: 3, frequency: 'daily' }
      ]
    },
    daily_tasks: [
      { id: 'box-breathing', task: '🫁 Box Breathing 4-4-4-4 (5min)', type: 'checkbox', duration_minutes: 5 },
      { id: 'physiological-sigh', task: '😮‍💨 Physiological Sigh bei Stress (3x)', type: 'checkbox', duration_minutes: 1 },
      { id: 'nature-walk', task: '🌳 Natur-Pause ohne Handy (10min)', type: 'checkbox', duration_minutes: 10 },
      { id: 'gratitude-evening', task: '🙏 3 positive Momente benennen', type: 'checkbox', duration_minutes: 3 }
    ]
  },

  // =========================================================================
  // 5. OMAD — One Meal A Day (14 Tage)
  //    Evidenz: 23h Fasten → maximale Autophagie, mTOR-Senkung, Longevity
  //    Phasen: adapt(1-4) → optimize(5-10) → master(11-14)
  // =========================================================================
  {
    id: 'fallback-omad',
    slug: 'omad-protocol',
    name_de: '🍽️ OMAD (One Meal A Day)',
    name_en: 'OMAD Protocol',
    icon: '🍽️',
    category: 'nutrition',
    pillars: ['nutrition', 'metabolism'],
    duration_days: 14,
    is_active: true,
    is_premium: true,
    difficulty_level: 'advanced',
    tasks_per_day: 4,
    description_de: '14 Tage OMAD-Protokoll für maximale Autophagie und metabolische Flexibilität. Progressiver Aufbau mit Elektrolyt-Management und nährstoffdichter Mahlzeit-Planung.',
    description_en: '14 days OMAD protocol for maximum autophagy and metabolic flexibility.',
    expectations: [
      { de: 'Tag 1-4: Anpassung an 23h Fasten', en: 'Day 1-4: Adapting to 23h fasting' },
      { de: 'Tag 5-10: Optimierung Mahlzeit & Elektrolyte', en: 'Day 5-10: Optimizing meal & electrolytes' },
      { de: 'Tag 11-14: Volles Protokoll mit Supplements & Tracking', en: 'Day 11-14: Full protocol with supplements & tracking' }
    ],
    priority_weight: 92,
    config_schema: {
      properties: {
        meal_time: { type: 'string', format: 'time', title: 'Mahlzeit-Zeit', title_de: 'Wann isst du deine Mahlzeit?', default: '18:00', description_de: 'Ideal: Abends zwischen 17-19 Uhr' },
        eating_window_minutes: { type: 'integer', title: 'Essensfenster', title_de: 'Essensfenster (Minuten)', default: 60, minimum: 30, maximum: 120, description_de: 'Wie lange für die Mahlzeit?' },
        include_supplements: { type: 'boolean', title: 'Supplements', title_de: 'Supplements mit Mahlzeit?', default: true, description_de: 'D3, Omega-3, Kreatin zur Mahlzeit' },
        has_medical_clearance: { type: 'boolean', title: 'Ärztliche Freigabe', title_de: 'Ärztliche Freigabe für Extended Fasting?', default: false, description_de: 'Empfohlen bei Vorerkrankungen' }
      },
      required: ['meal_time']
    },
    task_template: {
      tasks: [
        { id: 'morning-hydration', type: 'action', time: '07:00', title_de: '💧 Morgen-Hydration: 500ml Wasser + Prise Salz + Elektrolyte', title_en: 'Morning hydration: water + salt + electrolytes', pillar: 'nutrition', duration_minutes: 2, frequency: 'daily' },
        { id: 'fast-check', type: 'check-in', time: '12:00', title_de: '📊 Fasten-Check: Hunger (1-10), Energie (1-10), Mentale Klarheit (1-10)', title_en: 'Fasting check: hunger, energy, mental clarity (1-10)', pillar: 'nutrition', duration_minutes: 2, frequency: 'daily' },
        { id: 'electrolytes-midday', type: 'action', time: '14:00', title_de: '⚡ Elektrolyte nachfüllen: 1/4 TL Salz + Kalium in 500ml Wasser', title_en: 'Refill electrolytes: salt + potassium in water', pillar: 'nutrition', duration_minutes: 2, frequency: 'daily', min_day: 3 },
        { id: 'light-movement', type: 'action', time: '16:00', title_de: '🚶 Leichte Bewegung: 10min Spaziergang (erhält Muskelmasse im Fasten)', title_en: 'Light movement: 10min walk (preserves muscle during fasting)', pillar: 'movement', duration_minutes: 10, frequency: 'daily' },
        { id: 'meal-prep', type: 'action', time: '{{config.meal_time}}-60min', title_de: '👨‍🍳 Mahlzeit vorbereiten: Nährstoffdicht, 40g+ Protein, buntes Gemüse, gesunde Fette', title_en: 'Prepare meal: nutrient-dense, 40g+ protein, colorful veggies, healthy fats', pillar: 'nutrition', duration_minutes: 30, frequency: 'daily', min_day: 5 },
        { id: 'feast', type: 'action', time: '{{config.meal_time}}', title_de: '🍽️ Das Festmahl: Bewusst und langsam essen — Protein zuerst, dann Gemüse, dann Carbs', title_en: 'The feast: eat mindfully — protein first, then veggies, then carbs', pillar: 'nutrition', duration_minutes: 30, frequency: 'daily' },
        { id: 'supplements', type: 'action', time: '{{config.meal_time}}+15min', title_de: '💊 Supplements: D3+K2, Omega-3, Kreatin — immer mit Mahlzeit für Aufnahme', title_en: 'Supplements: D3+K2, Omega-3, Creatine — always with meal for absorption', pillar: 'supplements', duration_minutes: 2, frequency: 'daily', condition: 'config.include_supplements', min_day: 5 },
        { id: 'post-meal-walk', type: 'action', time: '{{config.meal_time}}+30min', title_de: '🚶 Post-Meal Walk: 10min langsam gehen für Blutzucker-Management', title_en: 'Post-meal walk: 10min gentle walk for blood sugar', pillar: 'movement', duration_minutes: 10, frequency: 'daily', min_day: 5 },
        { id: 'fast-start', type: 'info', time: '{{config.meal_time}}+60min', title_de: '🔒 23h Fastenfenster beginnt — nur noch Wasser, schwarzer Kaffee, Tee', title_en: '23h fasting window starts — water, black coffee, tea only', pillar: 'nutrition', duration_minutes: 1, frequency: 'daily' },
        { id: 'weekly-review', type: 'check-in', time: '19:00', title_de: '📊 OMAD-Woche: Gewicht, Energie, Hunger-Kurve, Wohlbefinden reflektieren', title_en: 'OMAD week review: weight, energy, hunger curve, wellbeing', pillar: 'nutrition', duration_minutes: 5, frequency: 'weekly', day: 'sunday' }
      ]
    },
    daily_tasks: [
      { id: 'morning-hydration', task: '💧 Morgen-Hydration + Elektrolyte', type: 'checkbox', duration_minutes: 2 },
      { id: 'fast-check', task: '📊 Fasten-Check: Hunger, Energie, Klarheit', type: 'checkbox', duration_minutes: 2 },
      { id: 'feast', task: '🍽️ Das Festmahl (Nährstoffdicht!)', type: 'checkbox', duration_minutes: 30 },
      { id: 'fast-start', task: '🔒 23h Fasten beginnt — nur Wasser/Tee', type: 'checkbox', duration_minutes: 1 }
    ]
  },

  // =========================================================================
  // 6. BREATHWORK MASTERY — 21-Tage Atemmeisterschaft
  //    Evidenz: Wim Hof Method, Pranayama, Stanford Huberman Lab
  //    Phasen: foundation(1-7) → intermediate(8-14) → advanced(15-21)
  // =========================================================================
  {
    id: 'fallback-breathwork',
    slug: 'breathwork-mastery',
    name_de: '🌬️ Breathwork Masterclass',
    name_en: 'Breathwork Mastery',
    icon: '🌬️',
    category: 'stress',
    pillars: ['mental', 'recovery', 'stress'],
    duration_days: 21,
    is_active: true,
    is_premium: false,
    difficulty_level: 'intermediate',
    tasks_per_day: 3,
    description_de: '21 Tage progressive Atemmeisterschaft. Von Zwerchfell-Atmung über Box Breathing bis Wim Hof — jede Woche eine neue Stufe für messbar bessere Stressresilienz.',
    description_en: '21 days progressive breathwork mastery. From diaphragmatic breathing to Wim Hof — weekly progression for measurable stress resilience.',
    expectations: [
      { de: 'Woche 1: Foundation — Zwerchfell-Atmung & Box Breathing', en: 'Week 1: Foundation — diaphragmatic & box breathing' },
      { de: 'Woche 2: Intermediate — Wim Hof Light & Wechselatmung', en: 'Week 2: Intermediate — Wim Hof light & alternate nostril' },
      { de: 'Woche 3: Advanced — Full Wim Hof, 4-7-8 & Breath Hold', en: 'Week 3: Advanced — Full Wim Hof, 4-7-8 & breath hold' }
    ],
    priority_weight: 70,
    config_schema: {
      properties: {
        experience_level: { type: 'string', title: 'Erfahrungs-Level', title_de: 'Dein Breathwork-Level?', default: 'beginner', enum: ['beginner', 'intermediate', 'advanced'], enumLabels: { beginner: 'Anfänger (keine Erfahrung)', intermediate: 'Fortgeschritten (regelmäßige Praxis)', advanced: 'Erfahren (tägliche Praxis)' } },
        morning_duration: { type: 'integer', title: 'Morgen-Session', title_de: 'Morgen-Session Dauer (Minuten)', default: 10, enum: [5, 10, 15], description_de: '5min = Quick, 10min = Standard, 15min = Deep' },
        evening_session: { type: 'boolean', title: 'Abend-Session', title_de: 'Abend-Breathwork zum Einschlafen?', default: true, description_de: '4-7-8 Atmung für besseres Einschlafen' },
        technique_focus: { type: 'string', title: 'Fokus-Technik', title_de: 'Welche Technik interessiert dich?', default: 'box_breathing', enum: ['box_breathing', 'wim_hof', '478_breathing', 'nadi_shodhana'], enumLabels: { box_breathing: 'Box Breathing (Ruhe & Fokus)', wim_hof: 'Wim Hof (Energie & Kälte)', '478_breathing': '4-7-8 (Schlaf & Entspannung)', nadi_shodhana: 'Wechselatmung (Balance)' } }
      },
      required: ['experience_level']
    },
    task_template: {
      tasks: [
        { id: 'co2-test', type: 'check-in', time: '07:00', title_de: '⏱️ CO2-Toleranz Test: Einatmen → langsam ausatmen → Zeit bis zum nächsten Atemzug messen', title_en: 'CO2 tolerance test: inhale → slow exhale → measure time to next breath', pillar: 'mental', duration_minutes: 3, frequency: 'weekly', day: 'monday' },
        { id: 'morning-breathwork', type: 'action', time: '07:15', title_de: '🌬️ Morgen-Breathwork: {{config.morning_duration}}min Session — voll konzentriert', title_en: 'Morning breathwork: {{config.morning_duration}}min session — fully focused', pillar: 'mental', duration_minutes: 10, frequency: 'daily' },
        { id: 'diaphragmatic', type: 'action', time: '07:30', title_de: '🫁 Zwerchfell-Atmung: Hand auf Bauch, 5min sanft atmen (Bauch hebt sich)', title_en: 'Diaphragmatic breathing: hand on belly, 5min gentle breathing', pillar: 'mental', duration_minutes: 5, frequency: 'daily', max_day: 7 },
        { id: 'box-breathing', type: 'action', time: '12:00', title_de: '📦 Box Breathing: 4s ein – 4s halten – 4s aus – 4s halten (5min)', title_en: 'Box breathing: 4s in – 4s hold – 4s out – 4s hold (5min)', pillar: 'mental', duration_minutes: 5, frequency: 'daily', max_day: 14 },
        { id: 'wim-hof-light', type: 'action', time: '07:30', title_de: '❄️ Wim Hof Light: 2 Runden × 20 tiefe Atemzüge → Atem halten → erholen', title_en: 'Wim Hof light: 2 rounds × 20 deep breaths → hold → recover', pillar: 'mental', duration_minutes: 8, frequency: 'daily', min_day: 8, condition: "config.experience_level !== 'beginner'" },
        { id: 'nadi-shodhana', type: 'action', time: '12:00', title_de: '🌀 Wechselatmung (Nadi Shodhana): 5min abwechselnd durch rechts/links atmen', title_en: 'Alternate nostril breathing: 5min alternating right/left', pillar: 'mental', duration_minutes: 5, frequency: 'daily', min_day: 8 },
        { id: 'stress-sigh', type: 'action', time: null, title_de: '😮‍💨 Physiological Sigh bei Stress: 2x schnell durch Nase ein, lang durch Mund aus — 3x', title_en: 'Physiological sigh for stress: double nasal inhale, long mouth exhale — 3x', pillar: 'mental', duration_minutes: 1, frequency: 'daily' },
        { id: 'evening-478', type: 'action', time: '22:00', title_de: '🌙 4-7-8 Atmung vor Schlaf: 4s einatmen, 7s halten, 8s ausatmen — 4 Runden', title_en: '4-7-8 breathing before sleep: 4s in, 7s hold, 8s out — 4 rounds', pillar: 'sleep', duration_minutes: 5, frequency: 'daily', condition: 'config.evening_session' },
        { id: 'breath-hold', type: 'check-in', time: '07:45', title_de: '⏱️ Breath Hold Test: Nach Ausatmen — wie lange kannst du den Atem halten? (Sekunden notieren)', title_en: 'Breath hold test: after exhale — how long can you hold? (note seconds)', pillar: 'mental', duration_minutes: 3, frequency: 'weekly', day: 'friday', min_day: 8 },
        { id: 'weekly-review', type: 'check-in', time: '19:00', title_de: '📊 Breathwork-Woche: CO2-Toleranz-Trend, Stress-Level, Schlafqualität, Fokus', title_en: 'Breathwork week: CO2 tolerance trend, stress level, sleep quality, focus', pillar: 'mental', duration_minutes: 5, frequency: 'weekly', day: 'sunday' }
      ]
    },
    daily_tasks: [
      { id: 'morning-breathwork', task: '🌬️ Morgen-Breathwork Session', type: 'checkbox', duration_minutes: 10 },
      { id: 'stress-sigh', task: '😮‍💨 Physiological Sigh bei Stress (3x)', type: 'checkbox', duration_minutes: 1 },
      { id: 'evening-478', task: '🌙 4-7-8 Atmung vor dem Schlafen', type: 'checkbox', duration_minutes: 5 }
    ]
  },

  // =========================================================================
  // 7. DANKBARKEITS-TAGEBUCH — Gratitude Science (21 Tage)
  //    Evidenz: Harvard JAMA 2024 (9% niedrigere Mortalität), 64 RCTs Meta-Analyse
  //    Phasen: foundation(1-7) → deepening(8-14) → integration(15-21)
  // =========================================================================
  {
    id: 'fallback-gratitude-journal',
    slug: 'gratitude-journal',
    name_de: '💛 Dankbarkeits-Tagebuch',
    name_en: 'Gratitude Journal',
    icon: '💛',
    category: 'mindset',
    pillars: ['mental', 'mindset', 'connection'],
    duration_days: 21,
    is_active: true,
    is_premium: false,
    difficulty_level: 'beginner',
    tasks_per_day: 3,
    description_de: '21 Tage wissenschaftlich fundiertes Dankbarkeits-Programm. Von einfachen Abend-Notizen über Dankbarkeitsbriefe bis zur tiefen Reflexion — Harvard-Studie zeigt 9% niedrigere Mortalität.',
    description_en: '21 days evidence-based gratitude program. From simple evening notes to gratitude letters and deep reflection — Harvard study shows 9% lower mortality.',
    expectations: [
      { de: 'Woche 1: Basis — Abendliche 3-Dinge-Praxis + Micro-Moments', en: 'Week 1: Foundation — Evening 3 things + micro-moments' },
      { de: 'Woche 2: Vertiefung — Dankbarkeitsbriefe + Körper-Dankbarkeit', en: 'Week 2: Deepening — Gratitude letters + body gratitude' },
      { de: 'Woche 3: Integration — Dankbarkeitsspaziergang + Vollständige Praxis', en: 'Week 3: Integration — Gratitude walk + full practice' }
    ],
    priority_weight: 90,
    config_schema: {
      properties: {
        reminder_time: { type: 'string', format: 'time', title: 'Erinnerungszeit', title_de: 'Wann willst du dein Dankbarkeits-Journal schreiben?', default: '21:00', description_de: 'Ideal: Abends vor dem Schlafen' },
        reflection_depth: { type: 'string', title: 'Reflexionstiefe', title_de: 'Wie tief willst du reflektieren?', default: 'standard', enum: ['quick', 'standard', 'detailed'], enumLabels: { quick: 'Quick (1-2 Sätze)', standard: 'Standard (3-5 Sätze)', detailed: 'Detailliert (Mini-Journal)' } },
        include_morning: { type: 'boolean', title: 'Morgen-Intention', title_de: 'Morgens positive Intention setzen?', default: true, description_de: 'Starte den Tag mit Dankbarkeit' },
        include_body_gratitude: { type: 'boolean', title: 'Körper-Dankbarkeit', title_de: 'Körper-Wertschätzung üben?', default: true, description_de: 'Danke deinem Körper für das, was er leistet' }
      },
      required: ['reminder_time']
    },
    task_template: {
      tasks: [
        { id: 'morning-gratitude', type: 'check-in', time: '08:00', title_de: '🌅 Morgen-Dankbarkeit: 1 Sache, auf die du dich heute freust', title_en: 'Morning gratitude: 1 thing you look forward to today', pillar: 'mindset', duration_minutes: 2, frequency: 'daily', condition: 'config.include_morning' },
        { id: 'micro-gratitude', type: 'action', time: '13:00', title_de: '✨ Micro-Moment: Halte kurz inne und bemerke etwas Schönes (Natur, Essen, Gespräch)', title_en: 'Micro-moment: pause and notice something beautiful', pillar: 'mindset', duration_minutes: 1, frequency: 'daily', min_day: 4 },
        { id: 'evening-3-things', type: 'check-in', time: '{{config.reminder_time}}', title_de: '📝 3 Dinge, für die ich heute dankbar bin (Person, Moment, Fortschritt)', title_en: '3 things I am grateful for today (person, moment, progress)', pillar: 'mindset', duration_minutes: 3, frequency: 'daily' },
        { id: 'body-gratitude', type: 'check-in', time: '{{config.reminder_time}}-30min', title_de: '🙌 Körper-Dankbarkeit: Danke an deinen Körper — Beine die tragen, Augen die sehen, Herz das schlägt', title_en: 'Body gratitude: thank your body for what it does', pillar: 'mindset', duration_minutes: 2, frequency: 'daily', condition: 'config.include_body_gratitude', min_day: 8 },
        { id: 'gratitude-letter', type: 'action', time: '19:00', title_de: '💌 Dankbarkeitsbrief: Schreibe 3-5 Sätze an jemanden, der dir wichtig ist (musst du nicht abschicken)', title_en: 'Gratitude letter: write 3-5 sentences to someone important to you', pillar: 'connection', duration_minutes: 7, frequency: 'weekly', day: 'wednesday', min_day: 8 },
        { id: 'gratitude-walk', type: 'action', time: '14:00', title_de: '🚶 Dankbarkeits-Spaziergang: 10min achtsam gehen, 5 Dinge bewusst wahrnehmen', title_en: 'Gratitude walk: 10min mindful walking, notice 5 things', pillar: 'mindset', duration_minutes: 10, frequency: 'daily', min_day: 15 },
        { id: 'detailed-reflection', type: 'check-in', time: '{{config.reminder_time}}+10min', title_de: '📖 Tiefe Reflexion: Warum bin ich für diese 3 Dinge dankbar? Was bedeuten sie mir?', title_en: 'Deep reflection: Why am I grateful? What do they mean to me?', pillar: 'mindset', duration_minutes: 5, frequency: 'daily', condition: "config.reflection_depth === 'detailed'", min_day: 8 },
        { id: 'weekly-review', type: 'check-in', time: '19:00', title_de: '📊 Wochen-Reflexion: Top-3 der Woche, Stimmungs-Trend, neue Muster entdeckt?', title_en: 'Weekly reflection: Top 3 of the week, mood trend, new patterns?', pillar: 'mindset', duration_minutes: 5, frequency: 'weekly', day: 'sunday' }
      ]
    },
    daily_tasks: [
      { id: 'morning-gratitude', task: '🌅 Morgen-Dankbarkeit: 1 Freude', type: 'checkbox', duration_minutes: 2 },
      { id: 'evening-3-things', task: '📝 3 Dinge, für die ich dankbar bin', type: 'checkbox', duration_minutes: 3 },
      { id: 'micro-gratitude', task: '✨ Micro-Moment: Etwas Schönes bemerken', type: 'checkbox', duration_minutes: 1 }
    ]
  },

  // =========================================================================
  // 8. BLUTBILD-OPTIMIERUNG — 90-Tage Blood Panel Cycle
  //    Evidenz: Personalised Medicine, Biomarker-guided Supplementation
  //    Phasen: baseline(1-14) → optimize(15-60) → retest(61-85) → evaluate(86-90)
  // =========================================================================
  {
    id: 'fallback-blood-check',
    slug: 'blood-check',
    name_de: '🩸 Blutbild-Optimierung',
    name_en: 'Blood Panel Optimization',
    icon: '🩸',
    category: 'health',
    pillars: ['health', 'supplements', 'nutrition'],
    duration_days: 90,
    is_active: true,
    is_premium: true,
    difficulty_level: 'intermediate',
    tasks_per_day: 3,
    description_de: '90-Tage Zyklus zur gezielten Optimierung deiner Blutwerte. Supplement-Anpassung, Ernährungs-Tipps und regelmäßige Selbst-Checks — alles auf deine Defizite abgestimmt.',
    description_en: '90-day cycle for targeted blood panel optimization. Supplement adjustment, nutrition tips and regular self-checks — tailored to your deficiencies.',
    expectations: [
      { de: 'Woche 1-2: Basis-Analyse & Supplement-Start', en: 'Week 1-2: Baseline analysis & supplement start' },
      { de: 'Woche 3-8: Optimierungsphase — Ernährung + Supplements gezielt', en: 'Week 3-8: Optimization — targeted nutrition + supplements' },
      { de: 'Woche 9-12: Symptom-Checks, Retest-Vorbereitung', en: 'Week 9-12: Symptom checks, retest preparation' },
      { de: 'Tag 85-90: Neues Blutbild & Auswertung', en: 'Day 85-90: New blood panel & evaluation' }
    ],
    priority_weight: 50,
    config_schema: {
      properties: {
        target_markers: { type: 'array', title: 'Ziel-Marker', title_de: 'Welche Marker optimieren?', items: { type: 'string', enum: ['vitamin_d', 'b12', 'ferritin', 'tsh', 'hba1c', 'homocysteine', 'crp', 'omega3_index', 'zinc', 'magnesium'] }, enumLabels: { vitamin_d: 'Vitamin D', b12: 'Vitamin B12', ferritin: 'Ferritin (Eisen)', tsh: 'TSH (Schilddrüse)', hba1c: 'HbA1c (Langzeit-Blutzucker)', homocysteine: 'Homocystein', crp: 'CRP (Entzündung)', omega3_index: 'Omega-3 Index', zinc: 'Zink', magnesium: 'Magnesium' }, default: ['vitamin_d', 'b12', 'ferritin'] },
        supplement_plan: { type: 'boolean', title: 'Supplement-Plan', title_de: 'Supplements basierend auf Blutwerten nehmen?', default: true, description_de: 'Gezielte Supplementierung für Defizite' },
        last_lab_date: { type: 'string', format: 'date', title: 'Letztes Blutbild', title_de: 'Wann war dein letztes Blutbild?', description_de: 'Hilft bei der Zeitplanung' },
        has_doctor: { type: 'boolean', title: 'Arzt-Begleitung', title_de: 'Hast du einen Arzt der dich begleitet?', default: true, description_de: 'Empfohlen für Interpretation' }
      },
      required: ['target_markers']
    },
    task_template: {
      tasks: [
        { id: 'daily-supplement', type: 'action', time: '08:00', title_de: '💊 Tages-Supplements einnehmen (basierend auf Blutwerten)', title_en: 'Take daily supplements (based on blood work)', pillar: 'supplements', duration_minutes: 2, frequency: 'daily', condition: 'config.supplement_plan' },
        { id: 'nutrition-tip', type: 'info', time: '12:00', title_de: '🥗 Ernährungs-Tipp: Nährstoffreiche Lebensmittel für deine Ziel-Marker einbauen', title_en: 'Nutrition tip: Include nutrient-rich foods for your target markers', pillar: 'nutrition', duration_minutes: 1, frequency: 'daily', min_day: 7 },
        { id: 'hydration-blood', type: 'action', time: '07:30', title_de: '💧 Morgen-Hydration: 500ml Wasser (wichtig für Blut-Viskosität & Nährstoff-Transport)', title_en: 'Morning hydration: 500ml water (blood viscosity & nutrient transport)', pillar: 'nutrition', duration_minutes: 2, frequency: 'daily' },
        { id: 'symptom-check', type: 'check-in', time: '20:00', title_de: '📋 Symptom-Check: Energie (1-10), Haut, Haare, Schlaf, Stimmung — Veränderungen notieren', title_en: 'Symptom check: energy, skin, hair, sleep, mood — note changes', pillar: 'health', duration_minutes: 3, frequency: 'daily', min_day: 14 },
        { id: 'weekly-marker-edu', type: 'info', time: '10:00', title_de: '📚 Marker-Wissen: Was bedeutet dein Ziel-Marker? Optimale Werte & Einflussfaktoren', title_en: 'Marker education: What does your target marker mean? Optimal values', pillar: 'health', duration_minutes: 3, frequency: 'weekly', day: 'tuesday' },
        { id: 'bi-weekly-review', type: 'check-in', time: '19:00', title_de: '📊 Zwei-Wochen-Review: Supplement-Compliance, Symptom-Trends, Ernährungs-Check', title_en: 'Bi-weekly review: supplement compliance, symptom trends', pillar: 'health', duration_minutes: 5, frequency: 'weekly', day: 'sunday', min_day: 14 },
        { id: 'midcycle-assessment', type: 'check-in', time: '10:00', title_de: '🔬 Halbzeit-Assessment (Tag 45): Wie fühlst du dich? Supplements anpassen?', title_en: 'Mid-cycle assessment (Day 45): How do you feel? Adjust supplements?', pillar: 'health', duration_minutes: 10, frequency: 'once', min_day: 42, max_day: 48 },
        { id: 'retest-reminder', type: 'action', time: '10:00', title_de: '🩸 Neues Blutbild fällig! Termin beim Arzt buchen für Kontroll-Blutbild', title_en: 'New blood panel due! Book appointment for follow-up blood work', pillar: 'health', duration_minutes: 5, frequency: 'once', min_day: 80, max_day: 90 },
        { id: 'results-entry', type: 'check-in', time: '10:00', title_de: '📈 Ergebnisse eintragen & vergleichen: Was hat sich verbessert? Nächste 90 Tage planen', title_en: 'Enter results & compare: What improved? Plan next 90 days', pillar: 'health', duration_minutes: 15, frequency: 'once', min_day: 85, max_day: 90 }
      ]
    },
    daily_tasks: [
      { id: 'daily-supplement', task: '💊 Tages-Supplements einnehmen', type: 'checkbox', duration_minutes: 2 },
      { id: 'hydration-blood', task: '💧 Morgen-Hydration 500ml', type: 'checkbox', duration_minutes: 2 },
      { id: 'symptom-check', task: '📋 Symptom-Check: Energie, Schlaf, Stimmung', type: 'checkbox', duration_minutes: 3 }
    ]
  },

  // =========================================================================
  // 9. CBT GEDANKEN-PROTOKOLL — Cognitive Behavioral Therapy (21 Tage)
  //    Evidenz: Gold-Standard Psychotherapie, 300+ RCTs
  //    Phasen: awareness(1-7) → challenge(8-14) → restructure(15-21)
  // =========================================================================
  {
    id: 'fallback-cbt-thought-record',
    slug: 'cbt-thought-record',
    name_de: '🧩 Gedanken-Protokoll (CBT)',
    name_en: 'CBT Thought Record',
    icon: '🧩',
    category: 'mindset',
    pillars: ['mental', 'mindset', 'stress'],
    duration_days: 21,
    is_active: true,
    is_premium: true,
    difficulty_level: 'intermediate',
    tasks_per_day: 3,
    description_de: '21 Tage strukturiertes CBT-Programm. Lerne negative Gedankenmuster zu erkennen, zu hinterfragen und umzustrukturieren — die wissenschaftlich am besten belegte Therapieform.',
    description_en: '21 days structured CBT program. Learn to identify, challenge and restructure negative thought patterns — the most evidence-based therapy approach.',
    expectations: [
      { de: 'Woche 1: Awareness — Automatische Gedanken erkennen & beobachten', en: 'Week 1: Awareness — Identify and observe automatic thoughts' },
      { de: 'Woche 2: Challenge — Kognitive Verzerrungen identifizieren & hinterfragen', en: 'Week 2: Challenge — Identify and question cognitive distortions' },
      { de: 'Woche 3: Restructure — Alternative Gedanken entwickeln & integrieren', en: 'Week 3: Restructure — Develop and integrate alternative thoughts' }
    ],
    priority_weight: 85,
    config_schema: {
      properties: {
        trigger_reminder: { type: 'boolean', title: 'Stress-Trigger Erinnerung', title_de: 'Erinnerung bei Stress-Trigger?', default: true, description_de: 'Mittags-Erinnerung zum Gedanken-Beobachten' },
        evening_review: { type: 'boolean', title: 'Abend-Review', title_de: 'Abendliches Gedanken-Protokoll?', default: true, description_de: 'Tägliches CBT 5-Spalten-Protokoll' },
        include_behavioral: { type: 'boolean', title: 'Verhaltens-Experimente', title_de: 'Verhaltens-Experimente durchführen?', default: false, description_de: 'Aktiv Annahmen testen (Fortgeschritten)' },
        focus_area: { type: 'string', title: 'Fokus-Bereich', title_de: 'Welcher Bereich am meisten?', default: 'general', enum: ['general', 'anxiety', 'self_worth', 'perfectionism'], enumLabels: { general: 'Allgemein', anxiety: 'Angst & Sorgen', self_worth: 'Selbstwert', perfectionism: 'Perfektionismus' } }
      },
      required: ['evening_review']
    },
    task_template: {
      tasks: [
        { id: 'morning-awareness', type: 'check-in', time: '08:30', title_de: '🔍 Gedanken-Awareness: Wie starte ich in den Tag? Welche automatischen Gedanken sind da?', title_en: 'Thought awareness: How am I starting the day? What automatic thoughts arise?', pillar: 'mindset', duration_minutes: 2, frequency: 'daily' },
        { id: 'midday-trigger', type: 'action', time: '13:00', title_de: '⚡ Trigger-Check: Gab es heute schon eine Situation, die Stress ausgelöst hat? Gedanke notieren', title_en: 'Trigger check: Any stressful situation today? Note the thought', pillar: 'mental', duration_minutes: 2, frequency: 'daily', condition: 'config.trigger_reminder' },
        { id: 'thought-record', type: 'action', time: '20:00', title_de: '📝 CBT 5-Spalten: Situation → Automatischer Gedanke → Gefühl (0-10) → Evidenz → Alternative', title_en: 'CBT 5 columns: Situation → Automatic thought → Feeling → Evidence → Alternative', pillar: 'mental', duration_minutes: 7, frequency: 'daily', condition: 'config.evening_review' },
        { id: 'distortion-id', type: 'check-in', time: '20:10', title_de: '🎯 Kognitive Verzerrung erkennen: Schwarz-Weiß? Katastrophisieren? Gedankenlesen? Personalisierung?', title_en: 'Identify cognitive distortion: black-white? catastrophizing? mind-reading?', pillar: 'mental', duration_minutes: 3, frequency: 'daily', min_day: 5 },
        { id: 'evidence-check', type: 'check-in', time: '20:15', title_de: '⚖️ Evidenz-Check: Was spricht FÜR diesen Gedanken? Was spricht DAGEGEN? Sei fair zu dir', title_en: 'Evidence check: What supports this thought? What contradicts it?', pillar: 'mental', duration_minutes: 3, frequency: 'daily', min_day: 8 },
        { id: 'alternative-thought', type: 'action', time: '20:20', title_de: '💡 Alternative formulieren: Was wäre eine realistischere, hilfreichere Sichtweise?', title_en: 'Formulate alternative: What would be a more realistic, helpful perspective?', pillar: 'mental', duration_minutes: 3, frequency: 'daily', min_day: 10 },
        { id: 'behavioral-experiment', type: 'action', time: '14:00', title_de: '🧪 Verhaltens-Experiment: Teste eine Annahme heute aktiv — was passiert wirklich?', title_en: 'Behavioral experiment: actively test an assumption today — what actually happens?', pillar: 'mental', duration_minutes: 5, frequency: 'daily', condition: 'config.include_behavioral', min_day: 15 },
        { id: 'self-compassion', type: 'action', time: '21:00', title_de: '💚 Selbstmitgefühl: Was würdest du einem Freund in dieser Situation sagen? Sag es dir selbst', title_en: 'Self-compassion: What would you say to a friend? Say it to yourself', pillar: 'mindset', duration_minutes: 2, frequency: 'daily', min_day: 8 },
        { id: 'weekly-pattern', type: 'check-in', time: '19:00', title_de: '📊 Wochen-Muster: Welche Gedanken kamen oft? Welche Verzerrungen? Was hat geholfen?', title_en: 'Weekly patterns: Which thoughts recurred? Which distortions? What helped?', pillar: 'mental', duration_minutes: 5, frequency: 'weekly', day: 'sunday' }
      ]
    },
    daily_tasks: [
      { id: 'morning-awareness', task: '🔍 Gedanken-Awareness Check', type: 'checkbox', duration_minutes: 2 },
      { id: 'thought-record', task: '📝 CBT 5-Spalten Protokoll', type: 'checkbox', duration_minutes: 7 },
      { id: 'distortion-id', task: '🎯 Kognitive Verzerrung erkennen', type: 'checkbox', duration_minutes: 3 }
    ]
  },

  // =========================================================================
  // 10. INTERVALLFASTEN 5:2 — Vollständig (30 Tage)
  //     Evidenz: Harvie et al. (5:2 vs. CER), Mosley BBC
  //     Besonderheit: Wochentag-basierte Logik (Fastentage vs. normale Tage)
  // =========================================================================
  {
    id: 'fallback-fasting-5-2',
    slug: 'fasting-5-2',
    name_de: '🍽️ Intervallfasten 5:2',
    name_en: 'Intermittent Fasting 5:2',
    icon: '🍽️',
    category: 'nutrition',
    pillars: ['nutrition', 'metabolism'],
    duration_days: 30,
    is_active: true,
    is_premium: false,
    difficulty_level: 'intermediate',
    tasks_per_day: 4,
    description_de: '30 Tage strukturiertes 5:2 Fasten: 5 Tage normal essen, 2 Tage auf 500-600 kcal reduzieren. Sanfter Einstieg mit progressivem Aufbau und voller Unterstützung an Fastentagen.',
    description_en: '30 days structured 5:2 fasting: 5 days normal eating, 2 days reduced to 500-600 kcal. Gentle start with progressive build-up.',
    expectations: [
      { de: 'Woche 1: Erster Fastentag + Hydration-Fokus', en: 'Week 1: First fasting day + hydration focus' },
      { de: 'Woche 2: Optimierung der Fastentag-Mahlzeiten', en: 'Week 2: Optimizing fasting day meals' },
      { de: 'Woche 3: Elektrolyte + Post-Fast Ernährung', en: 'Week 3: Electrolytes + post-fast nutrition' },
      { de: 'Woche 4: Volles Protokoll + Langzeit-Strategie', en: 'Week 4: Full protocol + long-term strategy' }
    ],
    priority_weight: 65,
    config_schema: {
      properties: {
        fasting_days: { type: 'array', title: 'Fastentage', title_de: 'An welchen Tagen fastest du?', items: { type: 'string', enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] }, enumLabels: { monday: 'Montag', tuesday: 'Dienstag', wednesday: 'Mittwoch', thursday: 'Donnerstag', friday: 'Freitag', saturday: 'Samstag', sunday: 'Sonntag' }, default: ['monday', 'thursday'], minItems: 2, maxItems: 2, description_de: 'Ideal: 2-3 Tage Abstand zwischen Fastentagen' },
        calorie_limit: { type: 'integer', title: 'Kalorien-Limit', title_de: 'Kalorien an Fastentagen', default: 500, minimum: 400, maximum: 800, description_de: 'Empfehlung: 500 kcal (Frauen), 600 kcal (Männer)' },
        include_protein_focus: { type: 'boolean', title: 'Protein-Fokus', title_de: 'Protein-Fokus an Fastentagen?', default: true, description_de: 'Mindestens 50g Protein an Fastentagen für Muskelerhalt' },
        meal_timing: { type: 'string', title: 'Mahlzeiten-Verteilung', title_de: 'Wie verteilst du die Kalorien?', default: 'one_meal', enum: ['one_meal', 'two_meals', 'spread'], enumLabels: { one_meal: '1 Mahlzeit (Abends)', two_meals: '2 Mahlzeiten (Mittag + Abend)', spread: 'Über den Tag verteilt' } }
      },
      required: ['fasting_days', 'calorie_limit']
    },
    task_template: {
      tasks: [
        { id: 'fasting-day-start', type: 'info', time: '07:00', title_de: '🍽️ Fastentag! Max {{config.calorie_limit}} kcal heute. Fokus: Protein + Gemüse + viel trinken', title_en: 'Fasting day! Max {{config.calorie_limit}} kcal today. Focus: protein + veggies + hydrate', pillar: 'nutrition', duration_minutes: 1, frequency: 'weekly', days: '{{config.fasting_days}}' },
        { id: 'fasting-hydration', type: 'action', time: '08:00', title_de: '💧 Extra-Hydration: 500ml Wasser + Kräutertee. An Fastentagen mind. 3L trinken', title_en: 'Extra hydration: 500ml water + herbal tea. Drink at least 3L on fasting days', pillar: 'nutrition', duration_minutes: 2, frequency: 'weekly', days: '{{config.fasting_days}}' },
        { id: 'fasting-electrolytes', type: 'action', time: '12:00', title_de: '⚡ Elektrolyte: Prise Salz + Kalium in Wasser (verhindert Kopfschmerzen)', title_en: 'Electrolytes: salt + potassium in water (prevents headaches)', pillar: 'nutrition', duration_minutes: 1, frequency: 'weekly', days: '{{config.fasting_days}}', min_day: 8 },
        { id: 'fasting-meal-plan', type: 'action', time: '16:00', title_de: '👨‍🍳 Fastentag-Mahlzeit: {{config.calorie_limit}} kcal — 50g+ Protein, buntes Gemüse, gesunde Fette', title_en: 'Fasting day meal: protein-rich, colorful veggies, healthy fats', pillar: 'nutrition', duration_minutes: 5, frequency: 'weekly', days: '{{config.fasting_days}}' },
        { id: 'fasting-protein', type: 'check-in', time: '19:00', title_de: '🥩 Protein-Check: Hast du mind. 50g Protein heute erreicht? (Muskelerhalt!)', title_en: 'Protein check: Did you reach 50g+ protein today? (Muscle preservation!)', pillar: 'nutrition', duration_minutes: 2, frequency: 'weekly', days: '{{config.fasting_days}}', condition: 'config.include_protein_focus', min_day: 8 },
        { id: 'non-fasting-nutrition', type: 'info', time: '12:00', title_de: '🥗 Normaler Esstag: Ausgewogen essen, nicht kompensieren! Kein Binge nach Fasttag', title_en: 'Normal eating day: eat balanced, no compensating! No binge after fast', pillar: 'nutrition', duration_minutes: 1, frequency: 'daily' },
        { id: 'fasting-mood', type: 'check-in', time: '20:00', title_de: '📊 Fasten-Stimmung: Hunger (1-10), Energie (1-10), Klarheit (1-10), Schlaf letzte Nacht', title_en: 'Fasting mood: hunger, energy, clarity, last night sleep', pillar: 'nutrition', duration_minutes: 2, frequency: 'weekly', days: '{{config.fasting_days}}', min_day: 4 },
        { id: 'weekly-review', type: 'check-in', time: '19:00', title_de: '📊 5:2-Woche: Gewichts-Trend, Energie-Level, Fastentag-Erfahrung, Anpassungen?', title_en: '5:2 week review: weight trend, energy, fasting experience, adjustments?', pillar: 'nutrition', duration_minutes: 5, frequency: 'weekly', day: 'sunday' }
      ]
    },
    daily_tasks: [
      { id: 'fasting-hydration', task: '💧 Hydration (besonders an Fastentagen)', type: 'checkbox', duration_minutes: 2 },
      { id: 'non-fasting-nutrition', task: '🥗 Ausgewogen essen (keine Kompensation)', type: 'checkbox', duration_minutes: 1 },
      { id: 'fasting-mood', task: '📊 Energie & Stimmung tracken', type: 'checkbox', duration_minutes: 2 }
    ]
  }
];

// =====================================================
// HELPER: Transform module instances for UI compatibility
// =====================================================

/**
 * Transforms raw module instance data from Supabase into UI-friendly format
 * Maps 'module' to 'definition' and ensures all required fields exist
 */
function transformModuleInstances(instances) {
  const fallbackDef = {
    name_de: 'Unbenanntes Modul',
    name_en: 'Unnamed Module',
    name: 'Module',
    icon: '📋',
    pillars: [],
    category: 'general',
    duration_days: 30,
    slug: 'unknown'
  };

  return instances.map(instance => {
    let moduleDef = instance.module;

    // Attempt to find matching fallback to enhance data (e.g. daily_tasks)
    const fallbackMatch = FALLBACK_MODULES.find(f =>
      f.slug === moduleDef?.slug || f.id === moduleDef?.id || f.slug === instance.module_id
    );

    const definition = moduleDef ? {
      ...moduleDef,
      name_de: moduleDef.name_de || moduleDef.name || (fallbackMatch?.name_de || 'Unbenanntes Modul'),
      name_en: moduleDef.name_en || moduleDef.name || (fallbackMatch?.name_en || 'Unnamed Module'),
      icon: moduleDef.icon || (fallbackMatch?.icon || '📋'),
      pillars: moduleDef.pillars || (fallbackMatch?.pillars || []),
      category: moduleDef.category || (fallbackMatch?.category || 'general'),
      slug: moduleDef.slug || (fallbackMatch?.slug || 'unknown'),
      // CRITICAL: Inject daily_tasks if missing in DB but present in fallback
      daily_tasks: moduleDef.daily_tasks || fallbackMatch?.daily_tasks || []
    } : (fallbackMatch || {
      name_de: 'Unbenanntes Modul',
      name_en: 'Unnamed Module',
      name: 'Module',
      icon: '📋',
      pillars: [],
      category: 'general',
      duration_days: 30,
      slug: 'unknown',
      daily_tasks: []
    });

    return {
      ...instance,
      definition,
      total_days: instance.total_days || definition.duration_days || 30,
      current_day: instance.current_day || 1,
      completion_rate: instance.completion_percentage || 0
    };
  });
}

// =====================================================
// MODULE DEFINITIONS (System-wide)
// =====================================================

/**
 * Get all available modules
 * @param {Object} options - Filter options
 * @param {string} options.category - Filter by category
 * @param {boolean} options.includePremium - Include premium modules
 * @returns {Promise<Array>} List of module definitions
 */
export async function getAvailableModules({ category = null, includePremium = true } = {}) {
  try {
    let query = supabase
      .from('module_definitions')
      .select('*')
      .eq('is_active', true)
      .order('priority_weight', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (!includePremium) {
      query = query.eq('is_premium', false);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('[ModuleService] Database error, using fallback modules:', error.message);
      // Return fallback modules if database query fails (migrations not run)
      let fallback = [...FALLBACK_MODULES];
      if (category) {
        fallback = fallback.filter(m => m.category === category);
      }
      return fallback;
    }

    // If no modules in database, return fallbacks
    if (!data || data.length === 0) {
      console.warn('[ModuleService] No modules in database, using fallback modules. Run migrations: 012, 013, 014');
      let fallback = [...FALLBACK_MODULES];
      if (category) {
        fallback = fallback.filter(m => m.category === category);
      }
      return fallback;
    }

    // MERGE: Combine DB modules with richer Fallback modules
    // - If Fallback has more tasks than DB version → use Fallback
    // - If Fallback slug not in DB → add it to the list
    // - Cross-slug mapping for modules that exist with different slugs in DB vs Fallback
    // This ensures users always get the richest module version available
    const dbSlugs = new Set(data.map(m => m.slug));
    const merged = [...data];

    // Map: Fallback slugs that should also match DB slugs
    // (When a richer Fallback program exists for a thin DB continuous module)
    const SLUG_ALIASES = {
      'omad-protocol': 'fasting-omad',       // Fallback 10 tasks → DB 3 tasks
      'breathwork-mastery': 'breathwork'      // Fallback 10 tasks → DB 3 tasks
    };

    for (const fallback of FALLBACK_MODULES) {
      const aliasSlug = SLUG_ALIASES[fallback.slug];

      if (!dbSlugs.has(fallback.slug)) {
        if (aliasSlug && dbSlugs.has(aliasSlug)) {
          // Fallback has alias in DB — upgrade the DB version
          const dbModule = data.find(m => m.slug === aliasSlug);
          const dbTaskCount = dbModule?.task_template?.tasks?.length || 0;
          const fbTaskCount = fallback.task_template?.tasks?.length || 0;
          if (fbTaskCount > dbTaskCount) {
            const idx = merged.findIndex(m => m.slug === aliasSlug);
            if (idx >= 0) {
              merged[idx] = { ...fallback, id: dbModule.id, slug: aliasSlug };
              logger.info(`[ModuleService] Upgraded '${aliasSlug}' (DB ${dbTaskCount} tasks) with '${fallback.slug}' (Fallback ${fbTaskCount} tasks)`);
            }
          }
        } else {
          // Fallback module not in DB at all — add it
          merged.push(fallback);
        }
      } else {
        // Both exist with same slug — prefer the version with more tasks
        const dbModule = data.find(m => m.slug === fallback.slug);
        const dbTaskCount = dbModule?.task_template?.tasks?.length || 0;
        const fbTaskCount = fallback.task_template?.tasks?.length || 0;
        if (fbTaskCount > dbTaskCount) {
          const idx = merged.findIndex(m => m.slug === fallback.slug);
          if (idx >= 0) {
            // Preserve DB id but use Fallback's richer content
            merged[idx] = { ...fallback, id: dbModule.id };
            logger.info(`[ModuleService] Upgraded '${fallback.slug}' from DB (${dbTaskCount} tasks) to Fallback (${fbTaskCount} tasks)`);
          }
        }
      }
    }

    if (category) {
      return merged.filter(m => m.category === category);
    }
    return merged;
  } catch (error) {
    console.error('[ModuleService] Error fetching modules:', error);
    // Return fallback modules on any error
    return [...FALLBACK_MODULES];
  }
}

/**
 * Get a single module definition by slug
 * @param {string} slug - Module slug
 * @returns {Promise<Object|null>}
 */
export async function getModuleBySlug(slug) {
  try {
    const { data, error } = await supabase
      .from('module_definitions')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) {
      console.warn(`[ModuleService] Module '${slug}' not found in database, checking fallbacks`);
      // Try to find in fallback modules
      const fallback = FALLBACK_MODULES.find(m => m.slug === slug);
      if (fallback) {
        logger.info(`[ModuleService] Using fallback module for '${slug}'`);
        return fallback;
      }
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching module:', error);
    // Try fallback on error
    const fallback = FALLBACK_MODULES.find(m => m.slug === slug);
    return fallback || null;
  }
}

// =====================================================
// MODULE INSTANCES (User-specific)
// =====================================================

/**
 * Get user's active module instances
 * @param {string} userId - User ID
 * @returns {Promise<Array>}
 */
export async function getUserModules(userId) {
  try {
    const { data, error } = await supabase
      .from('module_instances')
      .select(`
        *,
        module:module_definitions(*)
      `)
      .eq('user_id', userId)
      .in('status', ['active', 'paused'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform data with fallbacks for UI components
    return transformModuleInstances(data || []);
  } catch (error) {
    console.warn('[ModuleService] DB error fetching user modules, trying local fallback:', error.message);
    try {
      const key = `extensio_modules_${userId}`;
      const local = localStorage.getItem(key);
      if (local) {
        const parsed = JSON.parse(local);
        // Local modules are already stored with 'module' property containing definition
        // We need to run them through transform to ensure consistency
        return transformModuleInstances(parsed);
      }
    } catch (e) { console.error('Local module fetch error:', e); }
    return [];
  }
}

/**
 * Get user's active modules (not paused)
 * @param {string} userId - User ID
 * @returns {Promise<Array>}
 */
export async function getActiveUserModules(userId) {
  try {
    const { data, error } = await supabase
      .from('module_instances')
      .select(`
        *,
        module:module_definitions(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform data with fallbacks for UI components
    return transformModuleInstances(data || []);
  } catch (error) {
    console.error('Error fetching active user modules:', error);
    return [];
  }
}

/**
 * Activate a module for a user
 * @param {string} userId - User ID
 * @param {string} moduleSlug - Module slug
 * @param {Object} config - User configuration for the module
 * @returns {Promise<Object>}
 */
export async function activateModule(userId, moduleSlug, config = {}) {
  // 1. Get Definition (with fallback support)
  const moduleDef = await getModuleBySlug(moduleSlug);
  if (!moduleDef) {
    return { success: false, error: 'Module not found' };
  }

  // Calculate end date
  const endsAt = moduleDef.duration_days
    ? new Date(Date.now() + moduleDef.duration_days * 24 * 60 * 60 * 1000).toISOString()
    : null;

  try {
    // 2. DB Logic
    // Check existing
    const { data: existing, error: existingError } = await supabase
      .from('module_instances')
      .select('id')
      .eq('user_id', userId)
      .eq('module_id', moduleDef.id)
      .eq('status', 'active')
      .single();

    // Ignore P0001 (Row not found) but throw others (like table missing)
    if (existingError && existingError.code !== 'PGRST116') throw existingError;

    if (existing) {
      return { success: false, error: 'Module already active' };
    }

    // Insert
    const { data, error } = await supabase
      .from('module_instances')
      .insert({
        user_id: userId,
        module_id: moduleDef.id,
        config: config,
        total_days: moduleDef.duration_days,
        ends_at: endsAt,
        auto_pause_in_modes: moduleDef.affected_by_modes || []
      })
      .select(`
        *,
        module:module_definitions(*)
      `)
      .single();

    if (error) throw error;
    return { success: true, instance: data };

  } catch (error) {
    console.warn('[ModuleService] DB Activation failed, falling back to LocalStorage:', error.message);

    // 3. Local Fallback
    try {
      // Generate ID
      const instanceId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const newInstance = {
        id: instanceId,
        user_id: userId,
        module_id: moduleDef.id,
        module: moduleDef, // Include full def regarding UI requirements
        status: 'active',
        created_at: new Date().toISOString(),
        config: config,
        total_days: moduleDef.duration_days,
        ends_at: endsAt,
        auto_pause_in_modes: moduleDef.affected_by_modes || [],
        current_day: 1,
        completion_percentage: 0
      };

      const key = `extensio_modules_${userId}`;
      const local = localStorage.getItem(key);
      let modules = local ? JSON.parse(local) : [];

      // Check duplicates locally
      if (modules.some(m => m.module_id === moduleDef.id && m.status === 'active')) {
        return { success: false, error: 'Module already active (local)' };
      }

      modules.push(newInstance);
      localStorage.setItem(key, JSON.stringify(modules));

      return { success: true, instance: newInstance };
    } catch (localErr) {
      console.error('Local activation fatal:', localErr);
      return { success: false, error: error.message };
    }
  }
}

/**
 * Pause a module instance
 * @param {string} instanceId - Module instance ID
 * @returns {Promise<Object>}
 */
export async function pauseModule(instanceId) {
  try {
    const { data, error } = await supabase
      .from('module_instances')
      .update({
        status: 'paused',
        paused_at: new Date().toISOString()
      })
      .eq('id', instanceId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, instance: data };
  } catch (error) {
    console.error('Error pausing module:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Resume a paused module
 * @param {string} instanceId - Module instance ID
 * @returns {Promise<Object>}
 */
export async function resumeModule(instanceId) {
  try {
    const { data, error } = await supabase
      .from('module_instances')
      .update({
        status: 'active',
        paused_at: null
      })
      .eq('id', instanceId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, instance: data };
  } catch (error) {
    console.error('Error resuming module:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Deactivate (cancel) a module
 * @param {string} instanceId - Module instance ID
 * @returns {Promise<Object>}
 */
export async function deactivateModule(instanceId) {
  try {
    const { data, error } = await supabase
      .from('module_instances')
      .update({
        status: 'cancelled'
      })
      .eq('id', instanceId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, instance: data };
  } catch (error) {
    console.error('Error deactivating module:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update module instance configuration
 * @param {string} instanceId - Module instance ID
 * @param {Object} config - New configuration
 * @returns {Promise<Object>}
 */
export async function updateModuleConfig(instanceId, config) {
  try {
    const { data, error } = await supabase
      .from('module_instances')
      .update({ config })
      .eq('id', instanceId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, instance: data };
  } catch (error) {
    console.error('Error updating module config:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update module instance progress
 * @param {string} instanceId - Module instance ID
 * @param {number} currentDay - Current day number
 * @param {number} completionPercentage - Completion percentage
 * @returns {Promise<Object>}
 */
export async function updateModuleProgress(instanceId, currentDay, completionPercentage) {
  try {
    const updates = {
      current_day: currentDay,
      completion_percentage: completionPercentage
    };

    // Check if module is complete
    const { data: instance } = await supabase
      .from('module_instances')
      .select('total_days')
      .eq('id', instanceId)
      .single();

    if (instance?.total_days && currentDay >= instance.total_days && completionPercentage >= 100) {
      updates.status = 'completed';
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('module_instances')
      .update(updates)
      .eq('id', instanceId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, instance: data };
  } catch (error) {
    console.error('Error updating module progress:', error);
    return { success: false, error: error.message };
  }
}

// =====================================================
// HELPERS
// =====================================================

/**
 * Get module categories with counts
 * @returns {Promise<Array>}
 */
export async function getModuleCategories() {
  const categories = [
    { id: 'nutrition', name_de: 'Ernährung', name_en: 'Nutrition', icon: '🥗' },
    { id: 'exercise', name_de: 'Bewegung', name_en: 'Exercise', icon: '💪' },
    { id: 'sleep', name_de: 'Schlaf', name_en: 'Sleep', icon: '😴' },
    { id: 'supplements', name_de: 'Supplements', name_en: 'Supplements', icon: '💊' },
    { id: 'mindset', name_de: 'Mindset', name_en: 'Mindset', icon: '🧠' },
    { id: 'health', name_de: 'Gesundheit', name_en: 'Health', icon: '❤️' },
    { id: 'general', name_de: 'Allgemein', name_en: 'General', icon: '📋' }
  ];

  try {
    const { data, error } = await supabase
      .from('module_definitions')
      .select('category')
      .eq('is_active', true);

    if (error) throw error;

    // Count modules per category
    const counts = {};
    (data || []).forEach(m => {
      counts[m.category] = (counts[m.category] || 0) + 1;
    });

    return categories.map(c => ({
      ...c,
      count: counts[c.id] || 0
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return categories;
  }
}

/**
 * Check if user has a specific module active
 * @param {string} userId - User ID
 * @param {string} moduleSlug - Module slug
 * @returns {Promise<boolean>}
 */
export async function hasModuleActive(userId, moduleSlug) {
  try {
    const { data, error } = await supabase
      .from('module_instances')
      .select(`
        id,
        module:module_definitions!inner(slug)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .eq('module.slug', moduleSlug)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  } catch (error) {
    console.error('Error checking module status:', error);
    return false;
  }
}

export default {
  getAvailableModules,
  getModuleBySlug,
  getUserModules,
  getActiveUserModules,
  activateModule,
  pauseModule,
  resumeModule,
  deactivateModule,
  updateModuleConfig,
  updateModuleProgress,
  getModuleCategories,
  hasModuleActive
};
