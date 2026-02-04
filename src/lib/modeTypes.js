/**
 * Emergency Mode Types & Configurations
 * Based on VISION.md Horizon 1 specs
 * 
 * Each mode reconfigures the protocol stack for specific contexts:
 * - Travel: Jetlag, timezone adaptation, melatonin timing
 * - Sick: Recovery, immune support, rest prioritization
 * - Detox: Reset protocols, liver support, electrolytes
 * - Deep Work: Focus optimization, nootropics, distraction blocking
 */

export const MODES = {
    NORMAL: 'normal',
    TRAVEL: 'travel',
    SICK: 'sick',
    DETOX: 'detox',
    DEEP_WORK: 'deepWork'
};

export const MODE_CONFIGS = {
    [MODES.NORMAL]: {
        id: MODES.NORMAL,
        name: 'Normal',
        icon: '🏠',
        color: 'gray',
        description: 'Standard protocol - balanced optimization',
        focus: 'Balanced health optimization',
        pillars: {
            sleep: { priority: 'medium', adjustments: [] },
            movement: { priority: 'medium', adjustments: [] },
            nutrition: { priority: 'medium', adjustments: [] },
            stress: { priority: 'medium', adjustments: [] },
            connection: { priority: 'medium', adjustments: [] },
            environment: { priority: 'medium', adjustments: [] }
        },
        taskModifications: {
            filter: null, // Show all tasks
            emphasize: [],
            suppress: []
        }
    },

    [MODES.TRAVEL]: {
        id: MODES.TRAVEL,
        name: 'Travel',
        icon: '✈️',
        color: 'blue',
        description: 'Jetlag prevention & timezone adaptation',
        focus: 'Jetlag, Light Timing, Melatonin',
        triggers: ['calendar_flight', 'timezone_delta > 3'],
        pillars: {
            sleep: {
                priority: 'critical',
                adjustments: [
                    'Melatonin timing adjusted for new timezone',
                    'Light exposure protocol for circadian reset',
                    'Sleep schedule shifted gradually'
                ]
            },
            movement: {
                priority: 'low',
                adjustments: [
                    'Light movement only (walking, stretching)',
                    'No HIIT for 48h post-arrival'
                ]
            },
            nutrition: {
                priority: 'high',
                adjustments: [
                    'Hydration priority (electrolytes)',
                    'Eating schedule aligned to destination timezone',
                    'Light meals during travel'
                ]
            },
            stress: {
                priority: 'high',
                adjustments: [
                    'Meditation for travel anxiety',
                    'Breathing exercises during flight'
                ]
            },
            connection: {
                priority: 'low',
                adjustments: ['Minimal social obligations for 24h']
            },
            environment: {
                priority: 'critical',
                adjustments: [
                    'Blue light blocking (evening)',
                    'Bright light exposure (morning)',
                    'Temperature optimization for sleep'
                ]
            }
        },
        taskModifications: {
            filter: ['sleep', 'nutrition', 'environment'],
            emphasize: ['melatonin', 'light-exposure', 'hydration'],
            suppress: ['hiit', 'strength-training', 'social-events']
        }
    },

    [MODES.SICK]: {
        id: MODES.SICK,
        name: 'Sick',
        icon: '🤒',
        color: 'red',
        description: 'Recovery mode - immune support & rest',
        focus: 'Recovery, Sleep, Zinc, Bone Broth',
        triggers: ['user_manual', 'hrv_crash > 30%'],
        pillars: {
            sleep: {
                priority: 'critical',
                adjustments: [
                    'Sleep as much as needed',
                    'No sleep restriction',
                    'Naps encouraged'
                ]
            },
            movement: {
                priority: 'minimal',
                adjustments: [
                    'Complete rest for 48-72h',
                    'Light walking only when feeling better',
                    'No exercise until recovered'
                ]
            },
            nutrition: {
                priority: 'critical',
                adjustments: [
                    'Bone broth (immune support)',
                    'Zinc supplementation',
                    'Vitamin C, D3',
                    'Light, easy-to-digest meals',
                    'Hydration priority'
                ]
            },
            stress: {
                priority: 'critical',
                adjustments: [
                    'Zero work stress',
                    'Cancel non-essential meetings',
                    'Rest is priority #1'
                ]
            },
            connection: {
                priority: 'minimal',
                adjustments: ['Minimal social interaction']
            },
            environment: {
                priority: 'high',
                adjustments: [
                    'Temperature optimization',
                    'Air quality (humidifier)',
                    'Dark, quiet room for rest'
                ]
            }
        },
        taskModifications: {
            filter: ['sleep', 'nutrition'],
            emphasize: ['rest', 'immune-support', 'hydration'],
            suppress: ['exercise', 'social', 'work', 'fasting']
        },
        notifications: {
            suppress: true,
            duration: 72, // hours
            exceptions: ['critical-health']
        }
    },

    [MODES.DETOX]: {
        id: MODES.DETOX,
        name: 'Detox',
        icon: '🧘',
        color: 'green',
        description: 'Reset protocol - liver support & cleanse',
        focus: 'Electrolytes, Sauna, Liver Support',
        triggers: ['user_manual', 'post_travel_48h'],
        pillars: {
            sleep: {
                priority: 'high',
                adjustments: [
                    'Early bedtime (9-10 PM)',
                    'Sleep optimization for recovery'
                ]
            },
            movement: {
                priority: 'medium',
                adjustments: [
                    'Sauna sessions (20-30 min)',
                    'Light cardio (walking, cycling)',
                    'Yoga or stretching'
                ]
            },
            nutrition: {
                priority: 'critical',
                adjustments: [
                    'Intermittent fasting (16:8 or 18:6)',
                    'Liver support supplements (milk thistle, NAC)',
                    'Electrolytes (sodium, potassium, magnesium)',
                    'Green vegetables priority',
                    'No alcohol, processed foods'
                ]
            },
            stress: {
                priority: 'high',
                adjustments: [
                    'Meditation daily',
                    'Breathwork',
                    'Reduced work intensity'
                ]
            },
            connection: {
                priority: 'low',
                adjustments: ['Minimal social obligations']
            },
            environment: {
                priority: 'high',
                adjustments: [
                    'Sauna access',
                    'Clean air',
                    'Toxin reduction (plastics, chemicals)'
                ]
            }
        },
        taskModifications: {
            filter: ['nutrition', 'movement', 'environment'],
            emphasize: ['fasting', 'sauna', 'liver-support', 'electrolytes'],
            suppress: ['alcohol', 'processed-foods', 'late-nights']
        }
    },

    [MODES.DEEP_WORK]: {
        id: MODES.DEEP_WORK,
        name: 'Deep Work',
        icon: '🧠',
        color: 'purple',
        description: 'Focus optimization - cognitive performance',
        focus: 'Nootropics, Binaural Beats, Distraction Blocking',
        triggers: ['calendar_focus_block > 4h'],
        pillars: {
            sleep: {
                priority: 'high',
                adjustments: [
                    'Optimize sleep for cognitive performance',
                    'Consistent sleep schedule',
                    'No late nights'
                ]
            },
            movement: {
                priority: 'medium',
                adjustments: [
                    'Morning exercise for alertness',
                    'Walking breaks every 90 min',
                    'No intense exercise during work blocks'
                ]
            },
            nutrition: {
                priority: 'high',
                adjustments: [
                    'Nootropics (caffeine + L-theanine, creatine)',
                    'Ketogenic or low-carb for stable energy',
                    'Intermittent fasting (skip breakfast)',
                    'Hydration priority',
                    'No heavy meals during work'
                ]
            },
            stress: {
                priority: 'critical',
                adjustments: [
                    'Distraction blocking (phone, notifications)',
                    'Binaural beats or focus music',
                    'Pomodoro technique (90 min blocks)',
                    'Meditation before work sessions'
                ]
            },
            connection: {
                priority: 'minimal',
                adjustments: [
                    'No meetings during deep work blocks',
                    'Communication batching (specific times only)'
                ]
            },
            environment: {
                priority: 'critical',
                adjustments: [
                    'Quiet workspace',
                    'Optimal temperature (18-21°C)',
                    'Good lighting',
                    'Ergonomic setup'
                ]
            }
        },
        taskModifications: {
            filter: ['nutrition', 'stress', 'environment'],
            emphasize: ['nootropics', 'focus', 'distraction-blocking'],
            suppress: ['social', 'meetings', 'notifications']
        },
        notifications: {
            suppress: true,
            duration: null, // Suppress during active deep work blocks only
            exceptions: ['critical-health', 'emergency']
        }
    }
};

/**
 * Get mode configuration by ID
 */
export const getModeConfig = (modeId) => {
    return MODE_CONFIGS[modeId] || MODE_CONFIGS[MODES.NORMAL];
};

/**
 * Get all available modes (excluding NORMAL)
 */
export const getAvailableModes = () => {
    return Object.values(MODES).filter(mode => mode !== MODES.NORMAL);
};

/**
 * Get mode color class for Tailwind
 */
export const getModeColorClass = (modeId) => {
    const config = getModeConfig(modeId);
    const colorMap = {
        gray: 'bg-gray-100 text-gray-800 border-gray-300',
        blue: 'bg-blue-100 text-blue-800 border-blue-300',
        red: 'bg-red-100 text-red-800 border-red-300',
        green: 'bg-green-100 text-green-800 border-green-300',
        purple: 'bg-purple-100 text-purple-800 border-purple-300'
    };
    return colorMap[config.color] || colorMap.gray;
};

/**
 * Check if mode should suppress notifications
 */
export const shouldSuppressNotifications = (modeId) => {
    const config = getModeConfig(modeId);
    return config.notifications?.suppress || false;
};
