/**
 * Science Evidence Database
 * Keyword -> Mechanism mapping for tooltip display
 */
export const SCIENCE_DATA = {
    'Magnesium': {
        why: 'Supports GABA receptors in the brain, promoting relaxation and sleep quality. Essential cofactor in 300+ enzymatic reactions.',
        source: 'NIH - National Institutes of Health'
    },
    'Sunlight': {
        why: 'Sets circadian rhythm via melanopsin receptors in the retina. Triggers cortisol awakening response and suppresses melatonin production.',
        source: 'Huberman Lab - Neuroscience'
    },
    'Protein': {
        why: 'Provides essential amino acids for muscle protein synthesis (MPS). Leucine threshold ~2.5g per meal triggers mTOR pathway.',
        source: 'Journal of the International Society of Sports Nutrition'
    },
    'Cold Exposure': {
        why: 'Activates brown adipose tissue (BAT) and increases norepinephrine by up to 530%. Improves metabolic rate and resilience.',
        source: 'European Journal of Applied Physiology'
    },
    'Zone 2': {
        why: 'Trains mitochondrial efficiency at 60-70% max HR. Improves fat oxidation and metabolic flexibility without excessive cortisol.',
        source: 'Dr. Peter Attia - Exercise Physiology'
    },
    'Sleep': {
        why: 'Consolidates memory via hippocampal replay. Clears metabolic waste through glymphatic system. Essential for cellular repair.',
        source: 'Matthew Walker - Why We Sleep'
    },
    'Breathing': {
        why: 'Activates parasympathetic nervous system via vagus nerve. 4-7-8 pattern shown to reduce cortisol and heart rate variability.',
        source: 'Journal of Clinical Psychology'
    },
    'Fasting': {
        why: 'Triggers autophagy (cellular cleanup) after 12-16h. Increases NAD+ levels and activates sirtuins for longevity pathways.',
        source: 'Cell Metabolism - Autophagy Research'
    },
    'Resistance Training': {
        why: 'Stimulates muscle protein synthesis and bone density via mechanical tension. Increases IGF-1 and growth hormone naturally.',
        source: 'American College of Sports Medicine'
    },
    'Meditation': {
        why: 'Increases gray matter density in prefrontal cortex. Reduces amygdala reactivity and lowers inflammatory markers (IL-6, CRP).',
        source: 'Harvard Medical School - Neuroscience'
    }
};

/**
 * Get science explanation for a keyword
 * @param {string} keyword - The keyword to look up
 * @returns {Object|null} Science data or null if not found
 */
export function getScienceData(keyword) {
    return SCIENCE_DATA[keyword] || null;
}

/**
 * Extract keywords from text that have science data
 * @param {string} text - Text to search
 * @returns {Array} Array of found keywords
 */
export function extractKeywords(text) {
    if (!text) return [];

    const keywords = Object.keys(SCIENCE_DATA);
    const found = [];

    keywords.forEach(keyword => {
        // Case-insensitive search
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (regex.test(text)) {
            found.push(keyword);
        }
    });

    return found;
}
