/**
 * Protocol Packs - v0.4.0 Intelligence Layer
 * 
 * These are pre-configured, science-backed protocol bundles that users can activate
 * with a single tap. They override or augment the daily plan to solve specific
 * acute problems (Jet Lag, Sickness, Focus).
 */

export const PROTOCOL_PACKS = [
    {
        id: 'immune_shield',
        title: 'Immune Shield',
        description: 'Sofortige Abwehrstärkung bei ersten Erkältungssymptomen.',
        icon: '🛡️',
        color: 'red',
        duration_hours: 24,
        category: 'recovery',
        impact_score: 9,
        science_ref: 'Zinc/VitC loading during early viral replication phase.',
        tasks: [
            {
                id: 'imm_zinc',
                title: 'Zink Ladung (30mg)',
                descr: 'Nimm 30mg Zink-Gluconat oder Picolinat nach dem Essen.',
                time_minutes: 2,
                category: 'nutrition',
                priority: 'high'
            },
            {
                id: 'imm_vitc',
                title: 'Vitamin C Stoss (1g)',
                descr: '1g Vitamin C alle 2 Stunden bis 4g erreicht sind.',
                time_minutes: 2,
                category: 'nutrition',
                priority: 'high'
            },
            {
                id: 'imm_sleep',
                title: 'Schlaf-Priorität',
                descr: 'Gehe heute 60 min früher als gewohnt ins Bett.',
                time_minutes: 0,
                category: 'sleep',
                priority: 'critical'
            },
            {
                id: 'imm_hydration',
                title: 'Hyper-Hydration',
                descr: 'Trinke min. 3 Liter Wasser/Tee heute.',
                time_minutes: 5,
                category: 'nutrition',
                priority: 'medium'
            }
        ]
    },
    {
        id: 'deep_work',
        title: 'Deep Work Focus',
        description: 'Maximale kognitive Leistung für 4-6 Stunden.',
        icon: '🧠',
        color: 'indigo',
        duration_hours: 8,
        category: 'performance',
        impact_score: 8,
        science_ref: 'Ultradian interactions & Catecholamine optimization.',
        tasks: [
            {
                id: 'dw_phone',
                title: 'Phone Jail',
                descr: 'Telefon in einen anderen Raum oder Flugmodus.',
                time_minutes: 1,
                category: 'environment',
                priority: 'critical'
            },
            {
                id: 'dw_nsdr',
                title: 'Pre-Focus NSDR',
                descr: '10 min Non-Sleep Deep Rest zur Dopamin-Sensibilisierung.',
                time_minutes: 10,
                category: 'stress',
                priority: 'high'
            },
            {
                id: 'dw_caffeine',
                title: 'Koffein Timing',
                descr: 'Koffein 90 min nach dem Aufwachen, dann Stop.',
                time_minutes: 2,
                category: 'nutrition',
                priority: 'medium'
            },
            {
                id: 'dw_binaural',
                title: '40Hz Binaural Beats',
                descr: 'Nutze 40Hz Beats für Hintergrund-Fokus.',
                time_minutes: 0,
                category: 'environment',
                priority: 'medium'
            }
        ]
    },
    {
        id: 'jet_lag_west',
        title: 'Jet Lag (West)',
        description: 'Schnelle Anpassung bei Reisen nach Westen.',
        icon: '✈️',
        color: 'sky',
        duration_hours: 48,
        category: 'travel',
        impact_score: 10,
        science_ref: 'Light exposure timing relative to temperature minimum.',
        tasks: [
            {
                id: 'jl_light_pm',
                title: 'Abend-Licht',
                descr: 'Suche helles Licht am späten Nachmittag/Abend.',
                time_minutes: 30,
                category: 'environment',
                priority: 'critical'
            },
            {
                id: 'jl_melatonin',
                title: 'Kein Melatonin',
                descr: 'Vermeide Melatonin bei West-Reisen, nutze Licht.',
                time_minutes: 0,
                category: 'sleep',
                priority: 'medium'
            }
        ]
    },
    {
        id: 'metabolic_reset',
        title: 'Metabolic Reset',
        description: 'System-Reset nach einem Tag schlechter Ernährung.',
        icon: '🔥',
        color: 'emerald',
        duration_hours: 24,
        category: 'nutrition',
        impact_score: 7,
        science_ref: 'Glycogen depletion and insulin sensitivity restoration.',
        tasks: [
            {
                id: 'mr_fast',
                title: '16h Fasten',
                descr: 'Mindestens 16 Stunden Fastenfenster einhalten.',
                time_minutes: 0,
                category: 'nutrition',
                priority: 'high'
            },
            {
                id: 'mr_walk',
                title: 'Post-Meal Walk',
                descr: '15 min Spaziergang nach jeder Mahlzeit.',
                time_minutes: 15,
                category: 'movement',
                priority: 'high'
            },
            {
                id: 'mr_sugar',
                title: 'Zero Sugar',
                descr: 'Absoluter Verzicht auf Zucker heute.',
                time_minutes: 0,
                category: 'nutrition',
                priority: 'critical'
            }
        ]
    }
];
