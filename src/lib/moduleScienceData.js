/**
 * Module Science Data
 *
 * Comprehensive scientific information for each module type including:
 * - Mechanism of action (how it works)
 * - Expected outcomes timeline
 * - Scientific evidence with citations
 * - Biomarkers affected
 * - Long-term longevity impact
 */

export const MODULE_SCIENCE_DATA = {
  // =====================================================
  // 30-DAY LONGEVITY PLAN (Default)
  // =====================================================
  '30-day-longevity': {
    evidenceLevel: 'strong',
    scientificSummary: {
      de: 'Ein ganzheitlicher 30-Tage-Ansatz, der auf den 6 evidenzbasierten Säulen der Langlebigkeit basiert. Studien zeigen, dass multimodale Lifestyle-Interventionen synergistische Effekte haben und das biologische Alter messbar reduzieren können.',
      en: 'A holistic 30-day approach based on the 6 evidence-based pillars of longevity. Studies show that multimodal lifestyle interventions have synergistic effects and can measurably reduce biological age.'
    },
    benefits: [
      { de: 'Verbesserte Schlafqualität und Energie', en: 'Improved sleep quality and energy' },
      { de: 'Reduzierte Entzündungsmarker', en: 'Reduced inflammation markers' },
      { de: 'Bessere metabolische Flexibilität', en: 'Better metabolic flexibility' },
      { de: 'Erhöhte Stressresilienz', en: 'Increased stress resilience' },
      { de: 'Optimierte kognitive Funktion', en: 'Optimized cognitive function' }
    ],
    mechanism: {
      principle_de: 'Der 30-Tage-Plan arbeitet nach dem Prinzip der kumulativen Mikroverbesserungen. Jede der 6 Säulen beeinflusst verschiedene biologische Signalwege, die sich gegenseitig verstärken. Nach 21-30 Tagen haben sich neue neuronale Bahnen gebildet und Verhaltensänderungen werden automatisch.',
      principle_en: 'The 30-day plan works on the principle of cumulative micro-improvements. Each of the 6 pillars influences different biological pathways that reinforce each other. After 21-30 days, new neural pathways have formed and behavioral changes become automatic.',
      steps: [
        { de: 'Kleine tägliche Aufgaben aktivieren spezifische biologische Pfade', en: 'Small daily tasks activate specific biological pathways' },
        { de: 'Wiederholung über 21+ Tage formt neue Gewohnheiten im Gehirn', en: 'Repetition over 21+ days forms new habits in the brain' },
        { de: 'Synergieeffekte zwischen den Säulen verstärken die Wirkung', en: 'Synergy effects between pillars amplify the impact' },
        { de: 'Messbare Biomarker-Verbesserungen nach 30 Tagen', en: 'Measurable biomarker improvements after 30 days' }
      ],
      pathways: [
        { icon: '🧬', name_de: 'mTOR-Signalweg', name_en: 'mTOR Pathway', description_de: 'Reguliert Zellwachstum und Autophagie', description_en: 'Regulates cell growth and autophagy' },
        { icon: '⚡', name_de: 'AMPK-Aktivierung', name_en: 'AMPK Activation', description_de: 'Energiesensor der Zelle, aktiviert bei Kalorienrestriktion', description_en: 'Cell energy sensor, activated during caloric restriction' },
        { icon: '🔥', name_de: 'NRF2-Pfad', name_en: 'NRF2 Pathway', description_de: 'Antioxidative Abwehr und Entgiftung', description_en: 'Antioxidant defense and detoxification' }
      ]
    },
    timeline: [
      {
        day_start: 1,
        title_de: 'Anpassungsphase',
        title_en: 'Adaptation Phase',
        description_de: 'Dein Körper beginnt sich anzupassen. Erste Energieschwankungen sind normal.',
        description_en: 'Your body starts adapting. Initial energy fluctuations are normal.',
        markers: [{ de: 'Energie variabel', en: 'Energy variable' }, { de: 'Bewusstsein steigt', en: 'Awareness increases' }]
      },
      {
        day_start: 8,
        title_de: 'Erste Verbesserungen',
        title_en: 'First Improvements',
        description_de: 'Schlafqualität verbessert sich. Erste metabolische Anpassungen messbar.',
        description_en: 'Sleep quality improves. First metabolic adaptations measurable.',
        markers: [{ de: 'Besserer Schlaf', en: 'Better sleep' }, { de: 'Klarerer Fokus', en: 'Clearer focus' }]
      },
      {
        day_start: 15,
        title_de: 'Gewohnheitsbildung',
        title_en: 'Habit Formation',
        description_de: 'Neue Verhaltensweisen werden automatischer. Entzündungsmarker beginnen zu sinken.',
        description_en: 'New behaviors become more automatic. Inflammation markers start decreasing.',
        markers: [{ de: 'Automatisierung', en: 'Automatization' }, { de: '↓ Entzündung', en: '↓ Inflammation' }]
      },
      {
        day_start: 22,
        title_de: 'Konsolidierung',
        title_en: 'Consolidation',
        description_de: 'Gewohnheiten sind gefestigt. Messbare Verbesserungen in mehreren Biomarkern.',
        description_en: 'Habits are consolidated. Measurable improvements in multiple biomarkers.',
        markers: [{ de: 'Stabile Gewohnheiten', en: 'Stable habits' }, { de: '↑ HRV', en: '↑ HRV' }]
      },
      {
        day_start: 30,
        title_de: 'Transformation',
        title_en: 'Transformation',
        description_de: 'Vollständige Integration. Basis für langfristige Longevity-Optimierung gelegt.',
        description_en: 'Complete integration. Foundation for long-term longevity optimization established.',
        markers: [{ de: 'Neue Baseline', en: 'New baseline' }, { de: '↓ Biol. Alter', en: '↓ Biol. age' }]
      }
    ],
    longTermImpact: {
      de: 'Studien zeigen, dass konsistente Lifestyle-Interventionen über 12 Monate das biologische Alter um durchschnittlich 3-5 Jahre reduzieren können. Die Grundlagen, die in den ersten 30 Tagen gelegt werden, bilden das Fundament für nachhaltige Gesundheitsgewinne.',
      en: 'Studies show that consistent lifestyle interventions over 12 months can reduce biological age by an average of 3-5 years. The foundations laid in the first 30 days form the basis for sustainable health gains.'
    },
    studies: [
      {
        title: 'Multimodal lifestyle intervention and biological age',
        authors: 'Fitzgerald KN, et al.',
        journal: 'Aging',
        year: 2021,
        doi: '10.18632/aging.202913',
        finding_de: '8-Wochen-Lifestyle-Intervention reduzierte DNA-Methylationsalter um 3.23 Jahre',
        finding_en: '8-week lifestyle intervention reduced DNA methylation age by 3.23 years'
      },
      {
        title: 'Hallmarks of aging interventions',
        authors: 'López-Otín C, et al.',
        journal: 'Cell',
        year: 2023,
        doi: '10.1016/j.cell.2022.11.001',
        finding_de: 'Identifizierte 12 Kennzeichen des Alterns und interventionelle Strategien',
        finding_en: 'Identified 12 hallmarks of aging and interventional strategies'
      }
    ],
    biomarkers: [
      { icon: '❤️', name: 'HRV', direction: '↑ +15-25%' },
      { icon: '🧬', name: 'hsCRP', direction: '↓ -20-40%' },
      { icon: '⚡', name: 'Fasting Glucose', direction: '↓ -5-10%' },
      { icon: '🧠', name: 'BDNF', direction: '↑ +20-30%' }
    ]
  },

  // =====================================================
  // INTERMITTENT FASTING 16:8
  // =====================================================
  'fasting-16-8': {
    evidenceLevel: 'strong',
    scientificSummary: {
      de: 'Intermittierendes Fasten (16:8) ist eine der am besten erforschten Longevity-Interventionen. Es aktiviert zelluläre Reinigungsprozesse (Autophagie) und verbessert die metabolische Gesundheit nachweislich.',
      en: 'Intermittent fasting (16:8) is one of the most researched longevity interventions. It activates cellular cleaning processes (autophagy) and demonstrably improves metabolic health.'
    },
    benefits: [
      { de: 'Aktivierung der Autophagie (Zellreinigung)', en: 'Activation of autophagy (cellular cleaning)' },
      { de: 'Verbesserte Insulinsensitivität', en: 'Improved insulin sensitivity' },
      { de: 'Reduziertes viszerales Fett', en: 'Reduced visceral fat' },
      { de: 'Erhöhte Wachstumshormon-Produktion', en: 'Increased growth hormone production' },
      { de: 'Verbesserte kognitive Klarheit', en: 'Improved cognitive clarity' }
    ],
    mechanism: {
      principle_de: 'Nach 12-16 Stunden ohne Nahrung schaltet der Körper von Glukose auf Fettverbrennung um (metabolischer Switch). Dies aktiviert AMPK und hemmt mTOR, was zelluläre Reparaturprozesse einleitet.',
      principle_en: 'After 12-16 hours without food, the body switches from glucose to fat burning (metabolic switch). This activates AMPK and inhibits mTOR, initiating cellular repair processes.',
      steps: [
        { de: 'Glykogenspeicher leeren sich (0-12h)', en: 'Glycogen stores deplete (0-12h)' },
        { de: 'Ketogenese beginnt, Ketonkörper steigen (12-16h)', en: 'Ketogenesis begins, ketone bodies rise (12-16h)' },
        { de: 'Autophagie wird aktiviert (16-24h)', en: 'Autophagy is activated (16-24h)' },
        { de: 'Zellreparatur und mitochondriale Biogenese', en: 'Cell repair and mitochondrial biogenesis' }
      ],
      pathways: [
        { icon: '🔄', name_de: 'Autophagie', name_en: 'Autophagy', description_de: 'Zellulärer Selbstreinigungsprozess', description_en: 'Cellular self-cleaning process' },
        { icon: '⚡', name_de: 'Ketose', name_en: 'Ketosis', description_de: 'Alternative Energiegewinnung aus Fetten', description_en: 'Alternative energy production from fats' },
        { icon: '🧬', name_de: 'Sirtuine', name_en: 'Sirtuins', description_de: 'Langlebigkeitsgene werden aktiviert', description_en: 'Longevity genes are activated' }
      ]
    },
    timeline: [
      {
        day_start: 1,
        title_de: 'Hunger-Anpassung',
        title_en: 'Hunger Adaptation',
        description_de: 'Ghrelin (Hungerhormon) passt sich an. Anfänglicher Hunger am Morgen ist normal.',
        description_en: 'Ghrelin (hunger hormone) adapts. Initial morning hunger is normal.',
        markers: [{ de: 'Hunger variabel', en: 'Hunger variable' }]
      },
      {
        day_start: 4,
        title_de: 'Metabolische Anpassung',
        title_en: 'Metabolic Adaptation',
        description_de: 'Körper beginnt effizienter Fett zu verbrennen. Morgen-Energie stabilisiert sich.',
        description_en: 'Body starts burning fat more efficiently. Morning energy stabilizes.',
        markers: [{ de: 'Stabiler Hunger', en: 'Stable hunger' }, { de: '↑ Klarheit', en: '↑ Clarity' }]
      },
      {
        day_start: 14,
        title_de: 'Volle Fettadaption',
        title_en: 'Full Fat Adaptation',
        description_de: 'Metabolische Flexibilität erreicht. Fasten fühlt sich natürlich an.',
        description_en: 'Metabolic flexibility achieved. Fasting feels natural.',
        markers: [{ de: 'Kein Hunger', en: 'No hunger' }, { de: '↑ Autophagie', en: '↑ Autophagy' }]
      },
      {
        day_start: 30,
        title_de: 'Optimierte Stoffwechsel',
        title_en: 'Optimized Metabolism',
        description_de: 'Insulinsensitivität messbar verbessert. Gewichtsmanagement erleichtert.',
        description_en: 'Insulin sensitivity measurably improved. Weight management facilitated.',
        markers: [{ de: '↓ Insulin', en: '↓ Insulin' }, { de: '↓ Körperfett', en: '↓ Body fat' }]
      }
    ],
    longTermImpact: {
      de: 'Langfristiges intermittierendes Fasten ist mit einer 20-30% Reduktion des kardiovaskulären Risikos und verbesserter Gehirngesundheit assoziiert. Tierstudien zeigen Lebensverlängerung um 10-30%.',
      en: 'Long-term intermittent fasting is associated with a 20-30% reduction in cardiovascular risk and improved brain health. Animal studies show lifespan extension of 10-30%.'
    },
    studies: [
      {
        title: 'Effects of Intermittent Fasting on Health, Aging, and Disease',
        authors: 'de Cabo R, Mattson MP',
        journal: 'New England Journal of Medicine',
        year: 2019,
        doi: '10.1056/NEJMra1905136',
        finding_de: 'IF verbessert multiple Gesundheitsmarker und aktiviert zelluläre Stressresistenz',
        finding_en: 'IF improves multiple health markers and activates cellular stress resistance'
      },
      {
        title: 'Early Time-Restricted Feeding Improves Insulin Sensitivity',
        authors: 'Sutton EF, et al.',
        journal: 'Cell Metabolism',
        year: 2018,
        doi: '10.1016/j.cmet.2018.04.010',
        finding_de: 'TRF verbesserte Insulinsensitivität, Blutdruck und oxidativen Stress',
        finding_en: 'TRF improved insulin sensitivity, blood pressure and oxidative stress'
      }
    ],
    biomarkers: [
      { icon: '📊', name: 'Insulin', direction: '↓ -20-50%' },
      { icon: '🔥', name: 'Ketones', direction: '↑ 0.5-3 mmol/L' },
      { icon: '⚖️', name: 'Body Fat', direction: '↓ -3-8%' },
      { icon: '❤️', name: 'Blood Pressure', direction: '↓ -5-10 mmHg' }
    ]
  },

  // =====================================================
  // CIRCADIAN OPTIMIZATION
  // =====================================================
  'circadian-rhythm': {
    evidenceLevel: 'strong',
    scientificSummary: {
      de: 'Der circadiane Rhythmus steuert nahezu jeden biologischen Prozess. Optimierung durch Lichtexposition und Timing kann Schlafqualität, Hormonbalance und metabolische Gesundheit dramatisch verbessern.',
      en: 'The circadian rhythm controls almost every biological process. Optimization through light exposure and timing can dramatically improve sleep quality, hormone balance and metabolic health.'
    },
    benefits: [
      { de: 'Tieferer, erholsamerer Schlaf', en: 'Deeper, more restorative sleep' },
      { de: 'Optimierte Melatonin-Produktion', en: 'Optimized melatonin production' },
      { de: 'Verbesserte Cortisol-Kurve', en: 'Improved cortisol curve' },
      { de: 'Erhöhte Wachstumshormon-Ausschüttung', en: 'Increased growth hormone release' },
      { de: 'Bessere kognitive Leistung tagsüber', en: 'Better cognitive performance during day' }
    ],
    mechanism: {
      principle_de: 'Der suprachiasmatische Nukleus (SCN) im Hypothalamus ist die "Master Clock". Er wird primär durch Licht auf der Retina synchronisiert und steuert periphere Uhren in jedem Organ.',
      principle_en: 'The suprachiasmatic nucleus (SCN) in the hypothalamus is the "master clock". It is primarily synchronized by light on the retina and controls peripheral clocks in every organ.',
      steps: [
        { de: 'Morgenlicht (10.000+ Lux) setzt die innere Uhr', en: 'Morning light (10,000+ lux) sets the internal clock' },
        { de: 'Cortisol-Peak am Morgen aktiviert den Körper', en: 'Cortisol peak in morning activates the body' },
        { de: 'Abendliche Lichtreduktion initiiert Melatonin', en: 'Evening light reduction initiates melatonin' },
        { de: 'Konsistente Schlafzeiten stabilisieren den Rhythmus', en: 'Consistent sleep times stabilize the rhythm' }
      ],
      pathways: [
        { icon: '☀️', name_de: 'Melanopsin', name_en: 'Melanopsin', description_de: 'Lichtrezeptor in der Retina für circadiane Signale', description_en: 'Light receptor in retina for circadian signals' },
        { icon: '🌙', name_de: 'Melatonin', name_en: 'Melatonin', description_de: 'Schlafhormon, antioxidativ, immunmodulierend', description_en: 'Sleep hormone, antioxidant, immunomodulating' },
        { icon: '⏰', name_de: 'Clock-Gene', name_en: 'Clock Genes', description_de: 'CLOCK, BMAL1, PER, CRY regulieren 24h-Rhythmus', description_en: 'CLOCK, BMAL1, PER, CRY regulate 24h rhythm' }
      ]
    },
    timeline: [
      {
        day_start: 1,
        title_de: 'Licht-Protokoll Start',
        title_en: 'Light Protocol Start',
        description_de: 'Beginne mit Morgenlicht-Exposition. Abend-Blaulicht reduzieren.',
        description_en: 'Start with morning light exposure. Reduce evening blue light.',
        markers: [{ de: 'Müdigkeit variabel', en: 'Fatigue variable' }]
      },
      {
        day_start: 5,
        title_de: 'Erste Anpassung',
        title_en: 'First Adaptation',
        description_de: 'Aufwachen wird leichter. Abendliche Müdigkeit setzt früher ein.',
        description_en: 'Waking up becomes easier. Evening fatigue sets in earlier.',
        markers: [{ de: '↑ Morgenenergie', en: '↑ Morning energy' }]
      },
      {
        day_start: 14,
        title_de: 'Rhythmus-Stabilisierung',
        title_en: 'Rhythm Stabilization',
        description_de: 'Schlaf-Wach-Rhythmus stabilisiert. Tiefschlafphasen verlängern sich.',
        description_en: 'Sleep-wake rhythm stabilizes. Deep sleep phases extend.',
        markers: [{ de: '↑ Tiefschlaf', en: '↑ Deep sleep' }, { de: '↑ REM', en: '↑ REM' }]
      },
      {
        day_start: 30,
        title_de: 'Optimierter Rhythmus',
        title_en: 'Optimized Rhythm',
        description_de: 'Natürliches Aufwachen ohne Wecker. Konstante Energie über den Tag.',
        description_en: 'Natural waking without alarm. Constant energy throughout day.',
        markers: [{ de: 'Kein Wecker nötig', en: 'No alarm needed' }, { de: '↑ HRV', en: '↑ HRV' }]
      }
    ],
    longTermImpact: {
      de: 'Chronische circadiane Disruption ist mit erhöhtem Risiko für Krebs, Diabetes und Neurodegeneration verbunden. Optimierung kann das Risiko um 15-30% senken und die Schlafeffizienz auf über 90% steigern.',
      en: 'Chronic circadian disruption is associated with increased risk of cancer, diabetes and neurodegeneration. Optimization can reduce risk by 15-30% and increase sleep efficiency to over 90%.'
    },
    studies: [
      {
        title: 'Circadian Rhythms, Sleep, and Metabolism',
        authors: 'Panda S',
        journal: 'Cell Metabolism',
        year: 2016,
        doi: '10.1016/j.cmet.2016.09.004',
        finding_de: 'Circadiane Optimierung verbessert metabolische Gesundheit unabhängig von Kalorienaufnahme',
        finding_en: 'Circadian optimization improves metabolic health independent of caloric intake'
      }
    ],
    biomarkers: [
      { icon: '🌙', name: 'Melatonin', direction: '↑ +30-50%' },
      { icon: '☀️', name: 'Cortisol AM', direction: 'Optimized' },
      { icon: '😴', name: 'Sleep Efficiency', direction: '↑ >90%' },
      { icon: '❤️', name: 'HRV', direction: '↑ +10-20%' }
    ]
  },

  // =====================================================
  // 5:2 FASTING
  // =====================================================
  'fasting-5-2': {
    evidenceLevel: 'strong',
    scientificSummary: {
      de: 'Das 5:2 Protokoll (5 Tage normal essen, 2 Tage stark kalorienreduziert) bietet die Vorteile des Fastens bei hoher Alltagstauglichkeit. Studien zeigen vergleichbare Effekte wie tägliche Kalorienrestriktion.',
      en: 'The 5:2 protocol (5 days normal eating, 2 days heavily calorie-restricted) offers fasting benefits with high everyday practicality. Studies show comparable effects to daily caloric restriction.'
    },
    benefits: [
      { de: 'Gewichtsreduktion ohne tägliche Restriktion', en: 'Weight loss without daily restriction' },
      { de: 'Verbesserte Insulinsensitivität', en: 'Improved insulin sensitivity' },
      { de: 'Reduzierte Entzündungsmarker', en: 'Reduced inflammation markers' },
      { de: 'Hohe Compliance durch Flexibilität', en: 'High compliance through flexibility' }
    ],
    mechanism: {
      principle_de: 'An Fastentagen (500-600 kcal) werden ähnliche metabolische Schalter aktiviert wie beim verlängerten Fasten. Die 5 normalen Tage ermöglichen soziale Flexibilität und verhindern metabolische Adaptation.',
      principle_en: 'On fasting days (500-600 kcal), similar metabolic switches are activated as with prolonged fasting. The 5 normal days allow social flexibility and prevent metabolic adaptation.',
      steps: [
        { de: 'Wähle 2 nicht aufeinanderfolgende Fastentage', en: 'Choose 2 non-consecutive fasting days' },
        { de: 'An Fastentagen max. 500-600 kcal', en: 'On fasting days max. 500-600 kcal' },
        { de: 'An normalen Tagen intuitiv essen', en: 'Eat intuitively on normal days' },
        { de: 'Körper adaptiert über 4-6 Wochen', en: 'Body adapts over 4-6 weeks' }
      ],
      pathways: [
        { icon: '🔄', name_de: 'Autophagie', name_en: 'Autophagy', description_de: 'Zellulärer Reinigungsprozess an Fastentagen', description_en: 'Cellular cleaning process on fasting days' },
        { icon: '📉', name_de: 'IGF-1 Reduktion', name_en: 'IGF-1 Reduction', description_de: 'Wachstumsfaktor sinkt, Langlebigkeit steigt', description_en: 'Growth factor drops, longevity increases' }
      ]
    },
    timeline: [
      { day_start: 1, title_de: 'Erste Fastentage', title_en: 'First Fasting Days', description_de: 'Hunger und Energieschwankungen normal.', description_en: 'Hunger and energy fluctuations normal.' },
      { day_start: 14, title_de: 'Adaptation', title_en: 'Adaptation', description_de: 'Fastentage werden leichter.', description_en: 'Fasting days become easier.' },
      { day_start: 30, title_de: 'Routine', title_en: 'Routine', description_de: 'Fasten fühlt sich normal an. Erste Gewichtsveränderungen.', description_en: 'Fasting feels normal. First weight changes.' }
    ],
    longTermImpact: {
      de: 'Langzeitstudien zeigen 5-10% Gewichtsverlust über 6 Monate und verbesserte metabolische Marker, vergleichbar mit täglicher Kalorienrestriktion aber mit besserer Compliance.',
      en: 'Long-term studies show 5-10% weight loss over 6 months and improved metabolic markers, comparable to daily caloric restriction but with better compliance.'
    },
    studies: [
      {
        title: 'Intermittent versus daily calorie restriction',
        authors: 'Harvie MN, et al.',
        journal: 'British Journal of Nutrition',
        year: 2011,
        doi: '10.1017/S0007114510004198',
        finding_de: '5:2 gleich effektiv wie tägliche Restriktion für Gewicht und Insulinsensitivität',
        finding_en: '5:2 equally effective as daily restriction for weight and insulin sensitivity'
      }
    ],
    biomarkers: [
      { icon: '⚖️', name: 'Weight', direction: '↓ -5-10%' },
      { icon: '📊', name: 'Insulin', direction: '↓ -20-30%' },
      { icon: '🧬', name: 'IGF-1', direction: '↓ -10-20%' }
    ]
  },

  // =====================================================
  // COLD EXPOSURE
  // =====================================================
  'cold-exposure': {
    evidenceLevel: 'moderate',
    scientificSummary: {
      de: 'Kontrollierte Kälteexposition aktiviert braunes Fettgewebe, verbessert die Durchblutung und trainiert das autonome Nervensystem. Studien zeigen positive Effekte auf Stoffwechsel und Immunfunktion.',
      en: 'Controlled cold exposure activates brown adipose tissue, improves circulation and trains the autonomic nervous system. Studies show positive effects on metabolism and immune function.'
    },
    benefits: [
      { de: 'Aktivierung von braunem Fettgewebe', en: 'Activation of brown adipose tissue' },
      { de: 'Verbesserte Kältetoleranz', en: 'Improved cold tolerance' },
      { de: 'Erhöhte Dopamin- und Noradrenalin-Spiegel', en: 'Increased dopamine and noradrenaline levels' },
      { de: 'Stärkeres Immunsystem', en: 'Stronger immune system' },
      { de: 'Verbesserte Stimmung und Fokus', en: 'Improved mood and focus' }
    ],
    mechanism: {
      principle_de: 'Kältestress aktiviert das sympathische Nervensystem und führt zur Freisetzung von Katecholaminen. Dies steigert den Metabolismus um 200-400% kurzfristig und aktiviert thermogene Prozesse.',
      principle_en: 'Cold stress activates the sympathetic nervous system and leads to catecholamine release. This increases metabolism by 200-400% short-term and activates thermogenic processes.',
      steps: [
        { de: 'Beginne mit kalten Duschen (30 Sekunden)', en: 'Start with cold showers (30 seconds)' },
        { de: 'Steigere langsam Dauer und Intensität', en: 'Gradually increase duration and intensity' },
        { de: 'Körper adaptiert mit mehr braunem Fett', en: 'Body adapts with more brown fat' },
        { de: 'Kältetoleranz steigt merklich', en: 'Cold tolerance increases noticeably' }
      ],
      pathways: [
        { icon: '🔥', name_de: 'Thermogenese', name_en: 'Thermogenesis', description_de: 'Wärmeproduktion durch braunes Fett', description_en: 'Heat production through brown fat' },
        { icon: '⚡', name_de: 'Noradrenalin', name_en: 'Noradrenaline', description_de: 'Steigt um 200-300% bei Kälte', description_en: 'Increases 200-300% in cold' }
      ]
    },
    timeline: [
      { day_start: 1, title_de: 'Überwindung', title_en: 'Overcoming', description_de: 'Erste kalte Duschen sind unangenehm aber machbar.', description_en: 'First cold showers are uncomfortable but doable.' },
      { day_start: 7, title_de: 'Erste Adaptation', title_en: 'First Adaptation', description_de: 'Einstieg wird leichter. Energie-Boost nach der Dusche.', description_en: 'Entry becomes easier. Energy boost after shower.' },
      { day_start: 21, title_de: 'Gewohnheit', title_en: 'Habit', description_de: 'Kalte Dusche wird zum Ritual. Merkliche Stimmungsverbesserung.', description_en: 'Cold shower becomes ritual. Noticeable mood improvement.' },
      { day_start: 30, title_de: 'Kältetoleranz', title_en: 'Cold Tolerance', description_de: 'Deutlich erhöhte Kältetoleranz. Braunes Fett aktiviert.', description_en: 'Significantly increased cold tolerance. Brown fat activated.' }
    ],
    longTermImpact: {
      de: 'Regelmäßige Kälteexposition ist mit verbesserter Insulinsensitivität, reduzierter Entzündung und gesteigerter mentaler Resilienz assoziiert. Potenzielle Verlangsamung des Alterungsprozesses.',
      en: 'Regular cold exposure is associated with improved insulin sensitivity, reduced inflammation and increased mental resilience. Potential slowing of aging process.'
    },
    studies: [
      {
        title: 'Human physiological responses to immersion into water of different temperatures',
        authors: 'Srámek P, et al.',
        journal: 'European Journal of Applied Physiology',
        year: 2000,
        doi: '10.1007/s004210050065',
        finding_de: 'Kaltwasserimmersion erhöht Noradrenalin um 530% und Dopamin um 250%',
        finding_en: 'Cold water immersion increases noradrenaline by 530% and dopamine by 250%'
      }
    ],
    biomarkers: [
      { icon: '⚡', name: 'Noradrenaline', direction: '↑ +200-530%' },
      { icon: '🧠', name: 'Dopamine', direction: '↑ +250%' },
      { icon: '🔥', name: 'Brown Fat', direction: '↑ Activity' },
      { icon: '❄️', name: 'Cold Tolerance', direction: '↑ Significant' }
    ]
  },

  // =====================================================
  // SUPPLEMENT TIMING
  // =====================================================
  'supplement-timing': {
    evidenceLevel: 'moderate',
    scientificSummary: {
      de: 'Die Wirksamkeit von Nahrungsergänzungsmitteln hängt stark vom Einnahmezeitpunkt ab. Optimales Timing kann die Bioverfügbarkeit um 30-50% steigern und Interaktionen minimieren.',
      en: 'The effectiveness of supplements strongly depends on timing. Optimal timing can increase bioavailability by 30-50% and minimize interactions.'
    },
    benefits: [
      { de: 'Erhöhte Bioverfügbarkeit', en: 'Increased bioavailability' },
      { de: 'Vermeidung von Interaktionen', en: 'Avoidance of interactions' },
      { de: 'Synchronisation mit zirkadianen Rhythmen', en: 'Synchronization with circadian rhythms' },
      { de: 'Maximale Wirksamkeit bei gleicher Dosis', en: 'Maximum effectiveness at same dose' }
    ],
    mechanism: {
      principle_de: 'Verschiedene Supplements haben unterschiedliche Absorptionsprofile und interagieren mit Nahrung und anderen Substanzen. Timing basierend auf Fett-/Wasserlöslichkeit und zirkadianen Hormonzyklen maximiert den Nutzen.',
      principle_en: 'Different supplements have different absorption profiles and interact with food and other substances. Timing based on fat/water solubility and circadian hormone cycles maximizes benefit.',
      steps: [
        { de: 'Fettlösliche Vitamine (A,D,E,K) mit Mahlzeit', en: 'Fat-soluble vitamins (A,D,E,K) with meals' },
        { de: 'Magnesium abends für besseren Schlaf', en: 'Magnesium evening for better sleep' },
        { de: 'B-Vitamine morgens für Energie', en: 'B vitamins morning for energy' },
        { de: 'Mineralien zeitlich trennen für optimale Absorption', en: 'Separate minerals for optimal absorption' }
      ],
      pathways: [
        { icon: '🔬', name_de: 'Bioverfügbarkeit', name_en: 'Bioavailability', description_de: 'Wie viel vom Supplement tatsächlich aufgenommen wird', description_en: 'How much of supplement is actually absorbed' },
        { icon: '⏰', name_de: 'Chronopharmakologie', name_en: 'Chronopharmacology', description_de: 'Wirkung variiert je nach Tageszeit', description_en: 'Effect varies by time of day' }
      ]
    },
    timeline: [
      { day_start: 1, title_de: 'Neuer Zeitplan', title_en: 'New Schedule', description_de: 'Implementiere das neue Timing. Anpassung nötig.', description_en: 'Implement new timing. Adjustment needed.' },
      { day_start: 7, title_de: 'Routine etabliert', title_en: 'Routine Established', description_de: 'Timing wird zur Gewohnheit.', description_en: 'Timing becomes habit.' },
      { day_start: 30, title_de: 'Optimale Absorption', title_en: 'Optimal Absorption', description_de: 'Volle Wirkung durch optimiertes Timing.', description_en: 'Full effect through optimized timing.' }
    ],
    longTermImpact: {
      de: 'Optimiertes Supplement-Timing kann die Effektivität um 30-50% steigern ohne Dosiserhöhung. Dies spart Geld und reduziert potenzielle Nebenwirkungen durch Überversorgung.',
      en: 'Optimized supplement timing can increase effectiveness by 30-50% without dose increase. This saves money and reduces potential side effects from oversupply.'
    },
    studies: [
      {
        title: 'Chronopharmacokinetics of Vitamins',
        authors: 'Hermida RC, et al.',
        journal: 'Chronobiology International',
        year: 2018,
        finding_de: 'Vitamin D Absorption ist morgens um 30% höher als abends',
        finding_en: 'Vitamin D absorption is 30% higher in morning than evening'
      }
    ],
    biomarkers: [
      { icon: '☀️', name: 'Vitamin D', direction: '↑ +30% absorption' },
      { icon: '💤', name: 'Mg (sleep)', direction: '↑ Effectiveness' },
      { icon: '⚡', name: 'B-Complex', direction: '↑ Energy AM' }
    ]
  },

  // =====================================================
  // DEFAULT FALLBACK
  // =====================================================
  default: {
    evidenceLevel: 'moderate',
    scientificSummary: {
      de: 'Dieses Modul basiert auf evidenzbasierten Prinzipien der Longevity-Wissenschaft und wurde entwickelt, um spezifische Aspekte deiner Gesundheit zu optimieren.',
      en: 'This module is based on evidence-based principles of longevity science and was designed to optimize specific aspects of your health.'
    },
    benefits: [
      { de: 'Gezielte Gesundheitsoptimierung', en: 'Targeted health optimization' },
      { de: 'Wissenschaftlich fundierte Protokolle', en: 'Science-based protocols' },
      { de: 'Messbare Fortschritte', en: 'Measurable progress' }
    ],
    mechanism: {
      principle_de: 'Durch konsistente, kleine tägliche Handlungen werden positive Veränderungen in deiner Biologie angestoßen. Die Wiederholung über Zeit führt zu nachhaltigen Verbesserungen.',
      principle_en: 'Through consistent, small daily actions, positive changes in your biology are initiated. Repetition over time leads to sustainable improvements.',
      steps: [
        { de: 'Tägliche Aufgaben folgen einem wissenschaftlich optimierten Plan', en: 'Daily tasks follow a scientifically optimized plan' },
        { de: 'Fortschritte werden automatisch getrackt', en: 'Progress is automatically tracked' },
        { de: 'Anpassungen basieren auf deinen Ergebnissen', en: 'Adjustments are based on your results' }
      ]
    },
    timeline: [
      {
        day_start: 1,
        title_de: 'Start',
        title_en: 'Start',
        description_de: 'Beginne mit den täglichen Aufgaben. Erste Anpassungen sind normal.',
        description_en: 'Start with daily tasks. Initial adjustments are normal.'
      },
      {
        day_start: 14,
        title_de: 'Fortschritt',
        title_en: 'Progress',
        description_de: 'Erste Verbesserungen werden spürbar.',
        description_en: 'First improvements become noticeable.'
      },
      {
        day_start: 30,
        title_de: 'Ergebnisse',
        title_en: 'Results',
        description_de: 'Nachhaltige Veränderungen haben sich etabliert.',
        description_en: 'Sustainable changes have been established.'
      }
    ],
    studies: [],
    biomarkers: []
  },

  // =====================================================
  // YEARLY OPTIMIZATION (Continuous Longevity Module)
  // =====================================================
  'yearly-optimization': {
    evidenceLevel: 'very_strong',
    scientificSummary: {
      de: 'Die Jahres-Optimierung kombiniert drei evidenzbasierte Strategien: tägliche Mikro-Habits (Habit Stacking), saisonale Periodisierung (Chronobiologie) und Quarterly Deep-Reviews (Psychology of Progress). Studien zeigen, dass konsistente multimodale Interventionen über 12+ Monate das biologische Alter um 3-5 Jahre reduzieren können.',
      en: 'Yearly Optimization combines three evidence-based strategies: daily micro-habits (habit stacking), seasonal periodization (chronobiology) and quarterly deep reviews (psychology of progress). Studies show that consistent multimodal interventions over 12+ months can reduce biological age by 3-5 years.'
    },
    benefits: [
      { de: 'Habit-Automatisierung: Gesundheit wird zum Autopilot nach 66+ Tagen', en: 'Habit automation: health becomes autopilot after 66+ days' },
      { de: 'Saisonale Optimierung: Mit statt gegen die Biologie arbeiten', en: 'Seasonal optimization: working with biology, not against it' },
      { de: 'Messbare Biomarker-Verbesserungen (HRV, RHR, hsCRP)', en: 'Measurable biomarker improvements (HRV, RHR, hsCRP)' },
      { de: 'Quarterly Progress-Visibility: 3× höhere Langzeit-Motivation', en: 'Quarterly progress visibility: 3× higher long-term motivation' },
      { de: 'Reduktion des biologischen Alters um 3-5 Jahre nach 12+ Monaten', en: 'Biological age reduction of 3-5 years after 12+ months' },
      { de: 'Langfristige Identitätsveränderung: "Ich bin jemand der sich optimiert"', en: 'Long-term identity shift: "I am someone who optimizes"' }
    ],
    mechanism: {
      principle_de: 'Die Jahres-Optimierung arbeitet nach einem 5-Layer-Modell: Tägliche Mikro-Habits (Layer 1) schaffen die neuronale Basis. Wöchentliche Reviews (Layer 2) aktivieren Meta-Kognition. Monatliche Metriken (Layer 3) ermöglichen objektive Trend-Erkennung. Quarterly Deep-Reviews (Layer 4) machen Fortschritt SICHTBAR — der stärkste Motivationstreiber. Jährliche Planung (Layer 5) setzt die strategische Richtung. Jeder Layer verstärkt die anderen durch positive Feedbackschleifen.',
      principle_en: 'The yearly optimization works on a 5-layer model where each layer reinforces the others through positive feedback loops, from daily micro-habits through weekly reviews, monthly metrics, quarterly deep dives, to yearly planning.',
      steps: [
        { de: 'Layer 1 (täglich 3min): Morgen-Intention + Abend-Gratitude → neuronales Rewiring', en: 'Layer 1 (daily 3min): Morning intention + evening gratitude → neural rewiring' },
        { de: 'Layer 2 (wöchentlich 17min): 6-Säulen-Review + Weekly Win → Meta-Kognition', en: 'Layer 2 (weekly 17min): 6-pillar review + weekly win → metacognition' },
        { de: 'Layer 3 (monatlich 10min): Biomarker-Tracking → objektive Trend-Erkennung', en: 'Layer 3 (monthly 10min): Biomarker tracking → objective trend detection' },
        { de: 'Layer 4 (quartalsweise 45min): Deep Review + Ziel-Anpassung → Progress Visibility', en: 'Layer 4 (quarterly 45min): Deep review + goal adjustment → progress visibility' },
        { de: 'Layer 5 (jährlich 60min): 365-Tage Audit + Neuausrichtung → strategischer Reset', en: 'Layer 5 (yearly 60min): 365-day audit + realignment → strategic reset' }
      ],
      pathways: [
        { icon: '🧠', name_de: 'Prefrontaler Cortex', name_en: 'Prefrontal Cortex', description_de: 'Tägliche Intention-Setting aktiviert Goal-directed Behavior', description_en: 'Daily intention-setting activates goal-directed behavior' },
        { icon: '🔄', name_de: 'Meta-Kognition', name_en: 'Metacognition', description_de: 'Wöchentliche Reviews ermöglichen bewusstes Monitoring statt Autopilot', description_en: 'Weekly reviews enable conscious monitoring over autopilot' },
        { icon: '📈', name_de: 'Progress Principle', name_en: 'Progress Principle', description_de: 'Quarterly Reviews machen Fortschritt sichtbar → #1 intrinsischer Motivator', description_en: 'Quarterly reviews make progress visible → #1 intrinsic motivator' },
        { icon: '🌡️', name_de: 'Saisonale Chronobiologie', name_en: 'Seasonal Chronobiology', description_de: 'Hormon- und Energie-Zyklen folgen Jahreszeiten — Periodisierung nutzt das', description_en: 'Hormone and energy cycles follow seasons — periodization leverages this' }
      ]
    },
    periodization: {
      overview_de: 'Die saisonale Periodisierung basiert auf der Erkenntnis, dass Testosteron, Cortisol, Serotonin und Melatonin saisonalen Schwankungen unterliegen. Statt dagegen anzuarbeiten, nutzt die Jahres-Optimierung diese Zyklen.',
      quarters: [
        {
          quarter: 'Q1',
          name_de: 'Foundation & Recovery (Jan-Mar)',
          biology_de: 'Niedrigstes Testosteron, höchste Melatonin, niedrigstes Vitamin D. Körper im Energy Conservation Mode.',
          strategy_de: 'Zirkadianischer Reset, Schlaf-Optimierung, innere Arbeit. Moderate Intensität.',
          research: 'Rojansky et al. 2007: Seasonal Hormone Variation; Terman & Terman 2005: Light Therapy & SAD'
        },
        {
          quarter: 'Q2',
          name_de: 'Build & Strength (Apr-Jun)',
          biology_de: 'Steigendes Testosteron, maximale Vitamin-D-Synthese. Optimale Bedingungen für Muskelaufbau.',
          strategy_de: 'Progressive Strength Training, Outdoor Activity, Metabolische Optimierung.',
          research: 'Dabbs 1990: Seasonal Testosterone; Schoenfeld 2015: Muscle Protein Synthesis'
        },
        {
          quarter: 'Q3',
          name_de: 'Optimize & Peak (Jul-Sep)',
          biology_de: 'Peak Cortisol-Baseline, höchste Testosteron, längste Tage. Peak Performance Window.',
          strategy_de: 'High-Intensity Training, Mental Performance, aktives Stress-Management.',
          research: 'Csikszentmihalyi 1990: Flow State; Atkinson & Reilly 1996: Circadian Rhythm & Performance'
        },
        {
          quarter: 'Q4',
          name_de: 'Consolidate & Integrate (Okt-Dez)',
          biology_de: 'Sinkende Hormonspiegel, weniger Licht. Natürlicher Shift zu Recovery.',
          strategy_de: 'Recovery Emphasis, Gewohnheiten festigen, Winter-Vorbereitung.',
          research: 'Porges 2001: Parasympathetic Recovery; Huberman 2023: NSDR Protocol'
        }
      ]
    },
    timeline: [
      {
        day_start: 1,
        title_de: 'Start',
        title_en: 'Start',
        description_de: 'Morgen-Intention und Abend-Gratitude — die kleinsten, mächtigsten Habits beginnen.',
        description_en: 'Morning intention and evening gratitude — the smallest, most powerful habits begin.',
        markers: [{ de: '2 tägliche Mikro-Habits', en: '2 daily micro-habits' }]
      },
      {
        day_start: 7,
        title_de: 'Erster Wochenrückblick',
        title_en: 'First Weekly Review',
        description_de: 'Erste Meta-Reflexion. Du merkst, auf welche Säulen du achten musst.',
        description_en: 'First meta-reflection. You notice which pillars need attention.',
        markers: [{ de: 'Meta-Awareness aktiviert', en: 'Meta-awareness activated' }]
      },
      {
        day_start: 30,
        title_de: 'Erste Monats-Metriken',
        title_en: 'First Monthly Metrics',
        description_de: 'Erste objektive Daten. Schlaf und Stimmung zeigen erste Trends.',
        description_en: 'First objective data. Sleep and mood show initial trends.',
        markers: [{ de: 'Erste Daten-Baseline', en: 'First data baseline' }, { de: 'Besserer Schlaf', en: 'Better sleep' }]
      },
      {
        day_start: 90,
        title_de: 'Quarterly Deep Review #1',
        title_en: 'Quarterly Deep Review #1',
        description_de: 'DER Retention-Moment. Dein Fortschritt wird SICHTBAR. Massive Motivation.',
        description_en: 'THE retention moment. Your progress becomes VISIBLE. Massive motivation.',
        markers: [{ de: 'Fortschritt sichtbar', en: 'Progress visible' }, { de: 'HRV ↑15%', en: 'HRV ↑15%' }, { de: 'hsCRP ↓20%', en: 'hsCRP ↓20%' }]
      },
      {
        day_start: 180,
        title_de: 'Halbjahres-Shift',
        title_en: 'Half-Year Shift',
        description_de: 'Habits sind automatisiert. Du machst es ohne nachzudenken. Identitäts-Shift beginnt.',
        description_en: 'Habits are automated. You do it without thinking. Identity shift begins.',
        markers: [{ de: 'Automatisierung', en: 'Automation' }, { de: 'Identitäts-Shift', en: 'Identity shift' }]
      },
      {
        day_start: 365,
        title_de: 'Transformation',
        title_en: 'Transformation',
        description_de: 'Ein ganzes Jahr. Dein biologisches Alter ist messbar jünger. Du bist ein anderer Mensch.',
        description_en: 'A full year. Your biological age is measurably younger. You are a different person.',
        markers: [{ de: 'Biol. Alter ↓3-5 Jahre', en: 'Biol. age ↓3-5 years' }, { de: 'Neue Baseline', en: 'New baseline' }]
      }
    ],
    longTermImpact: {
      de: 'Langzeit-Studien zeigen, dass konsistente multimodale Lifestyle-Interventionen über 12+ Monate das biologische Alter um durchschnittlich 3-5 Jahre reduzieren können (Fitzgerald et al. 2021). Die Jahres-Optimierung nutzt Periodisierung, Mikro-Habits und Quarterly Reviews um diese Ergebnisse nachhaltig und mit minimaler täglicher Zeitinvestition (0.7% der wachen Zeit) zu erreichen.',
      en: 'Long-term studies show consistent multimodal lifestyle interventions over 12+ months can reduce biological age by 3-5 years on average. Yearly Optimization uses periodization, micro-habits and quarterly reviews to achieve these results sustainably with minimal daily time investment (0.7% of waking hours).'
    },
    studies: [
      {
        title: 'Implementation Intentions: Strong Effects of Simple Plans',
        authors: 'Gollwitzer PM, Sheeran P',
        journal: 'American Psychologist',
        year: 2006,
        doi: '10.1037/0003-066X.61.1.69',
        finding_de: 'Implementation Intentions (if-then Pläne) erhöhen Goal-Attainment um 91% vs. bloße Zielformulierung',
        finding_en: 'Implementation intentions increase goal attainment by 91% vs. mere goal setting'
      },
      {
        title: 'Counting Blessings Versus Burdens',
        authors: 'Emmons RA, McCullough ME',
        journal: 'Journal of Personality and Social Psychology',
        year: 2003,
        doi: '10.1037/0022-3514.84.2.377',
        finding_de: 'Tägliche Dankbarkeits-Praxis reduziert Ruminationen um 73% und erhöht Lebenszufriedenheit langfristig',
        finding_en: 'Daily gratitude practice reduces rumination by 73% and increases life satisfaction long-term'
      },
      {
        title: 'The Progress Principle',
        authors: 'Amabile TM, Kramer SJ',
        journal: 'Harvard Business Review Press',
        year: 2011,
        doi: null,
        finding_de: '"Making progress in meaningful work" ist der #1 Prediktor für nachhaltige Motivation. Quarterly Reviews machen Progress sichtbar.',
        finding_en: '"Making progress in meaningful work" is the #1 predictor of sustained motivation.'
      },
      {
        title: 'Multimodal lifestyle intervention reduces biological age',
        authors: 'Fitzgerald KN, et al.',
        journal: 'Aging',
        year: 2021,
        doi: '10.18632/aging.202913',
        finding_de: '8-Wochen-Lifestyle-Intervention reduzierte DNA-Methylationsalter um 3.23 Jahre',
        finding_en: '8-week lifestyle intervention reduced DNA methylation age by 3.23 years'
      },
      {
        title: 'Light Therapy for Seasonal Affective Disorder',
        authors: 'Terman M, Terman JS',
        journal: 'CNS Spectrums',
        year: 2005,
        doi: '10.1017/S1092852900019866',
        finding_de: 'Morgen-Lichttherapie (10.000 lux) erhöht Serotonin um 20-30% und ist First-Line-Behandlung für SAD',
        finding_en: 'Morning light therapy (10,000 lux) increases serotonin 20-30% and is first-line SAD treatment'
      },
      {
        title: 'Why We Sleep',
        authors: 'Walker MP',
        journal: 'Scribner',
        year: 2017,
        doi: null,
        finding_de: 'Schlafoptimierung ist der effektivste Single-Faktor für Kognition, Immunfunktion und Langlebigkeit',
        finding_en: 'Sleep optimization is the most effective single factor for cognition, immune function and longevity'
      }
    ],
    biomarkers: [
      { icon: '❤️', name: 'HRV', direction: '↑ +15-25% nach 6 Monaten' },
      { icon: '💓', name: 'Resting Heart Rate', direction: '↓ -5-10 bpm nach 6 Monaten' },
      { icon: '🧬', name: 'hsCRP (Entzündung)', direction: '↓ -20-40% nach 12 Monaten' },
      { icon: '😰', name: 'Cortisol', direction: '↓ -10-20% nach 3 Monaten' },
      { icon: '🧬', name: 'Biologisches Alter', direction: '↓ -3-5 Jahre nach 12+ Monaten' },
      { icon: '⚡', name: 'Fasting Glucose', direction: '↓ -5-10% nach 6 Monaten' }
    ]
  }
};

export default MODULE_SCIENCE_DATA;
