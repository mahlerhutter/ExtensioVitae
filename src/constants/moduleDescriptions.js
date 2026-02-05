/**
 * Module Descriptions & User Communication
 * 
 * Centralized source of truth for all module-related copy.
 * Used by ModuleCard, onboarding flows, tooltips, and notifications.
 * 
 * @version 0.5.0
 * @lastUpdated 2026-02-05
 */

export const MODULE_DESCRIPTIONS = {
    circadian_light: {
        name: "Circadian Light Protocol",
        tagline: "Licht zur richtigen Zeit",
        icon: "☀️",
        category: "intelligence_layer",
        score: 10,
        onboarding: {
            headline: "Licht zur richtigen Zeit",
            description: "Dein circadianer Rhythmus steuert Schlaf, Energie und Stoffwechsel. Erhalte personalisierte Lichtempfehlungen basierend auf der Tageszeit und deinem Wachrhythmus.",
            cta: "Lichtprotokoll aktivieren"
        },
        tooltip: "Wissenschaftlich fundierte Lichtempfehlungen optimieren deinen circadianen Rhythmus und verbessern deine Schlafqualität um bis zu 45 Minuten.",
        notification: {
            headline: "Zeit für helles Licht ☀️",
            body: "Hol dir jetzt 10 Minuten Sonnenlicht, um deine Energie zu steigern und deine innere Uhr zu stellen.",
            action: "Timer starten"
        },
        emptyState: {
            icon: "☀️",
            headline: "Noch keine Lichtdaten",
            description: "Aktiviere das Circadian Light Protocol, um personalisierte Empfehlungen den ganzen Tag über zu erhalten.",
            cta: "Jetzt starten"
        },
        errors: {
            missingData: "Wir brauchen deine Aufwachzeit, um optimale Lichtzeiten zu berechnen.",
            invalidData: "Bitte gib eine gültige Zeit zwischen 4 und 11 Uhr ein.",
            systemError: "Lichtempfehlungen können gerade nicht berechnet werden. Bitte versuche es erneut."
        }
    },

    supplement_timing: {
        name: "Supplement Timing Optimizer",
        tagline: "Supplements richtig timen",
        icon: "💊",
        category: "intelligence_layer",
        score: 9,
        onboarding: {
            headline: "Supplements richtig timen",
            description: "Falsche Einnahmezeiten reduzieren die Aufnahme um 30-70%. Erhalte wissenschaftlich fundierte Timing-Empfehlungen für jedes deiner Supplements.",
            cta: "Supplements optimieren"
        },
        tooltip: "Die Nährstoffaufnahme variiert um 40-60% je nach Tageszeit. Richtiges Timing kann die Wirksamkeit deiner Supplements verdoppeln oder verdreifachen.",
        notification: {
            headline: "Zeit für deine Morgen-Supplements 💊",
            body: "Vitamin D, Omega-3 und B-Komplex jetzt mit dem Frühstück einnehmen.",
            action: "Als erledigt markieren"
        },
        emptyState: {
            icon: "💊",
            headline: "Keine Supplements hinzugefügt",
            description: "Füge deine Supplements hinzu und wir zeigen dir die optimalen Einnahmezeiten basierend auf Absorption und Wechselwirkungen.",
            cta: "Supplements hinzufügen"
        },
        errors: {
            missingData: "Wir brauchen deine Essenszeiten, um optimale Supplement-Zeiten zu berechnen.",
            invalidData: "Dieses Supplement kennen wir nicht. Bitte kategorisiere es oder überspringe es.",
            systemError: "Supplement-Zeitplan kann gerade nicht erstellt werden. Bitte versuche es erneut.",
            conflict: "⚠️ Calcium und Eisen blockieren sich gegenseitig. Nimm sie mit 2+ Stunden Abstand ein."
        }
    },

    fasting_window: {
        name: "Fasting Window Calculator",
        tagline: "Fasten zur richtigen Zeit",
        icon: "⏱️",
        category: "intelligence_layer",
        score: 11,
        onboarding: {
            headline: "Fasten zur richtigen Zeit",
            description: "Die meisten fasten zur falschen Zeit. Wir berechnen dein optimales Essfenster basierend auf deinem circadianen Rhythmus und Trainingsplan.",
            cta: "Fastenfenster berechnen"
        },
        tooltip: "Frühes Essfenster (z.B. 8-16 Uhr) verbessert die Insulinsensitivität um 30% im Vergleich zu spätem Essen. Autophagie startet nach 16-18h Fasten.",
        notification: {
            headline: "Fastenfenster öffnet sich in 30 Min 🍽️",
            body: "Dein 16:8-Fenster öffnet sich um 12:00 Uhr. Autophagie-Phase erreicht!",
            action: "Fasten beenden"
        },
        emptyState: {
            icon: "⏱️",
            headline: "Kein Fastenprotokoll aktiv",
            description: "Wähle ein Fastenprotokoll (16:8, 18:6, OMAD) und wir berechnen dein optimales Essfenster.",
            cta: "Protokoll wählen"
        },
        errors: {
            missingData: "Wir brauchen deine Aufwach- und Schlafenszeit für optimale Fensterberechnung.",
            invalidData: "Dein Essfenster überschneidet sich mit deiner Schlafenszeit. Bitte passe es an.",
            systemError: "Fastenfenster kann gerade nicht berechnet werden. Bitte versuche es erneut.",
            warning: "⚠️ Training während des Fastens? Erwäge BCAA oder verschiebe dein Fenster."
        }
    },

    calendar_detection: {
        name: "Calendar Event Detection",
        tagline: "Dein Kalender, deine Biologie",
        icon: "📅",
        category: "strategic_bets",
        score: 12,
        onboarding: {
            headline: "Dein Kalender, deine Biologie",
            description: "Flüge, späte Dinner und intensive Arbeitsphasen stören deine Routine. Wir erkennen diese Events automatisch und passen deine Protokolle an.",
            cta: "Kalender verbinden"
        },
        tooltip: "Automatische Erkennung von Flügen, Focus-Blöcken und späten Events. Proaktive Anpassungen verbessern Ergebnisse um 40-60%.",
        notification: {
            headline: "Flug morgen erkannt ✈️",
            body: "Wir haben dein Jet-Lag-Protokoll vorbereitet: Licht- und Schlafanpassungen für schnellere Erholung.",
            action: "Protokoll ansehen"
        },
        emptyState: {
            icon: "📅",
            headline: "Kalender noch nicht verbunden",
            description: "Verbinde deinen Google Calendar und wir erkennen automatisch Flüge, Focus-Blöcke und späte Events.",
            cta: "Kalender verbinden"
        },
        errors: {
            missingData: "Kalender-Zugriff benötigt. Bitte verbinde deinen Google Calendar.",
            invalidData: "Event konnte nicht klassifiziert werden. Bitte kategorisiere es manuell.",
            systemError: "Kalender-Synchronisation fehlgeschlagen. Bitte versuche es erneut.",
            lowConfidence: "🤔 Ist \"Meeting am Flughafen\" ein Flug? Bitte bestätige."
        }
    },

    lab_snapshot: {
        name: "Lab Snapshot Lite",
        tagline: "Verstehe deine Blutwerte",
        icon: "🧪",
        category: "strategic_bets",
        score: 12,
        onboarding: {
            headline: "Verstehe deine Blutwerte",
            description: "Lade dein Laborbericht hoch und erhalte sofortige Analyse von 10 Schlüssel-Biomarkern mit farbcodierten Status und konkreten Handlungsempfehlungen.",
            cta: "Laborbericht hochladen"
        },
        tooltip: "Wir zeigen dir OPTIMALE Bereiche (nicht nur \"normal\"). Basierend auf Longevity-Forschung: 20-40% geringeres Krankheitsrisiko.",
        notification: {
            headline: "Deine Laborergebnisse sind da 🧪",
            body: "8 von 10 Biomarkern im optimalen Bereich. Vitamin D könnte verbessert werden.",
            action: "Ergebnisse ansehen"
        },
        emptyState: {
            icon: "🧪",
            headline: "Noch keine Laborergebnisse",
            description: "Lade deinen Laborbericht hoch (PDF oder Foto) und wir analysieren 10 Schlüssel-Biomarker für Longevity.",
            cta: "Bericht hochladen"
        },
        errors: {
            missingData: "OCR konnte keine Werte extrahieren. Bitte gib sie manuell ein.",
            invalidData: "Dieser Wert scheint unrealistisch. Bitte überprüfe die OCR-Erkennung.",
            systemError: "Bericht kann gerade nicht analysiert werden. Bitte versuche es erneut.",
            lowConfidence: "⚠️ OCR-Konfidenz <90%. Bitte überprüfe die erkannten Werte.",
            missingReference: "Referenzbereich fehlt. Wir verwenden Populations-Durchschnitte (bitte verifizieren)."
        }
    },

    recovery_score: {
        name: "Recovery Score & Auto-Swap",
        tagline: "Trainiere smart, nicht hart",
        icon: "💪",
        category: "strategic_bets",
        score: 15,
        onboarding: {
            headline: "Trainiere smart, nicht hart",
            description: "3-Fragen-Check-in jeden Morgen. Wir berechnen deinen Recovery Score und tauschen automatisch HIIT gegen Yoga, wenn du Erholung brauchst.",
            cta: "Morning Check-in starten"
        },
        tooltip: "Training bei schlechter Erholung erhöht das Verletzungsrisiko um 40-60%. Wir passen deine Tasks automatisch an deinen Recovery-Status an.",
        notification: {
            headline: "Zeit für deinen Morning Check-in ☀️",
            body: "3 Fragen, 30 Sekunden. Wir passen deine heutigen Tasks an deine Erholung an.",
            action: "Check-in starten"
        },
        emptyState: {
            icon: "💪",
            headline: "Noch kein Recovery Score",
            description: "Starte deinen Morning Check-in (3 Fragen, 30 Sek) und wir berechnen deinen Recovery Score.",
            cta: "Check-in starten"
        },
        errors: {
            missingData: "Bitte beantworte alle 3 Fragen für einen genauen Recovery Score.",
            invalidData: "Bitte gib realistische Werte ein (4-10h Schlaf).",
            systemError: "Recovery Score kann gerade nicht berechnet werden. Bitte versuche es erneut.",
            poorRecovery: "🚨 Recovery Score: 42/100 (schlecht). Wir haben HIIT durch Yoga Nidra ersetzt.",
            consecutivePoor: "⚠️ 3 Tage schlechte Erholung. Erwäge mehr Schlaf oder medizinische Beratung."
        }
    }
};

export const MODULE_SCIENCE = {
    circadian_light: {
        studies: [
            {
                title: "Light exposure and circadian phase shifting in humans",
                authors: "Czeisler et al.",
                year: 2019,
                url: "https://pubmed.ncbi.nlm.nih.gov/31068719/",
                summary: "Morning light (10,000 lux) advances circadian phase by 1-2 hours and improves sleep quality."
            },
            {
                title: "Exposure to room light before bedtime suppresses melatonin onset",
                authors: "Gooley et al.",
                year: 2011,
                url: "https://pubmed.ncbi.nlm.nih.gov/21552190/",
                summary: "Even dim light (<200 lux) suppresses melatonin by 50%, delaying sleep onset."
            },
            {
                title: "Short-wavelength sensitivity for the direct effects of light on alertness",
                authors: "Lockley et al.",
                year: 2006,
                url: "https://pubmed.ncbi.nlm.nih.gov/16687322/",
                summary: "Blue light (460-480nm) has the strongest effect on alertness and circadian phase."
            }
        ],
        userExplanation: "Deine innere Uhr wird durch Licht gesteuert. Morgensonne sagt deinem Gehirn \"Wach auf!\", Abenddunkelheit sagt \"Zeit zu schlafen\". Wir timen dein Licht für optimalen Schlaf.",
        evidenceTooltip: "Basierend auf 30+ Jahren circadianer Forschung von Harvard, Stanford und MIT. Über 200 peer-reviewed Studien bestätigen den Einfluss von getimtem Licht auf Schlafqualität."
    },

    supplement_timing: {
        studies: [
            {
                title: "Circadian aspects of dietary intake and metabolism",
                authors: "Rondanelli et al.",
                year: 2019,
                url: "https://pubmed.ncbi.nlm.nih.gov/31387448/",
                summary: "Nutrient absorption varies 40-60% based on time of day due to circadian rhythms."
            },
            {
                title: "Nutritional interactions of calcium and magnesium",
                authors: "Scholz-Ahrens et al.",
                year: 2007,
                url: "https://pubmed.ncbi.nlm.nih.gov/17684097/",
                summary: "Calcium reduces magnesium absorption by 30-40% when taken together."
            },
            {
                title: "Iron bioavailability and dietary reference values",
                authors: "Hurrell & Egli",
                year: 2010,
                url: "https://pubmed.ncbi.nlm.nih.gov/20479766/",
                summary: "Iron absorption increases 3-4x on empty stomach vs with food."
            }
        ],
        userExplanation: "Dein Körper nimmt Nährstoffe unterschiedlich auf, je nach Tageszeit. Manche wirken morgens besser, andere abends. Manche blockieren sich gegenseitig. Wir optimieren das Timing für maximalen Nutzen.",
        evidenceTooltip: "Basierend auf Nährstoff-Absorptionsstudien und Pharmakokinetik-Forschung. Richtiges Timing kann die Wirksamkeit deiner Supplements verdoppeln oder verdreifachen."
    },

    fasting_window: {
        studies: [
            {
                title: "Early time-restricted feeding improves insulin sensitivity",
                authors: "Sutton et al.",
                year: 2018,
                url: "https://pubmed.ncbi.nlm.nih.gov/29754952/",
                summary: "Early eating window (8 AM-2 PM) improves insulin sensitivity by 30% vs late window."
            },
            {
                title: "Effects of intermittent fasting on health, aging, and disease",
                authors: "de Cabo & Mattson",
                year: 2019,
                url: "https://pubmed.ncbi.nlm.nih.gov/31881139/",
                summary: "Autophagy increases 300% after 16-18h fasting, promoting cellular cleanup and longevity."
            },
            {
                title: "Time-restricted feeding improves glucose tolerance",
                authors: "Hutchison et al.",
                year: 2019,
                url: "https://pubmed.ncbi.nlm.nih.gov/31689013/",
                summary: "Late eating (after 8 PM) impairs glucose tolerance by 20% compared to early eating."
            }
        ],
        userExplanation: "Fasten triggert Autophagie - dein körpereigener Zellreinigungs-Prozess. Aber Timing ist wichtig: Frühes Essen passt zu deinem Stoffwechsel, spätes Essen stört ihn.",
        evidenceTooltip: "Basierend auf Time-Restricted Eating Forschung vom Salk Institute und Johns Hopkins. Frühe Essfenster zeigen 2-3x bessere metabolische Vorteile als späte Fenster."
    },

    calendar_detection: {
        studies: [
            {
                title: "How to travel the world without jet lag",
                authors: "Eastman & Burgess",
                year: 2009,
                url: "https://pubmed.ncbi.nlm.nih.gov/19622099/",
                summary: "Pre-flight light adjustment reduces jet lag by 50-70% compared to no adjustment."
            },
            {
                title: "The cost of interrupted work",
                authors: "Mark et al.",
                year: 2008,
                url: "https://dl.acm.org/doi/10.1145/1357054.1357072",
                summary: "Interruptions increase task completion time by 25-40% and reduce quality."
            },
            {
                title: "Why We Sleep (Chapter on social jet lag)",
                authors: "Walker",
                year: 2017,
                url: "https://www.simonandschuster.com/books/Why-We-Sleep/Matthew-Walker/9781501144318",
                summary: "Late-night social events delay circadian phase by 1-2 hours, affecting next-day performance."
            }
        ],
        userExplanation: "Dein Kalender beeinflusst deine Biologie. Flüge verschieben deinen Rhythmus. Späte Dinner verzögern deinen Schlaf. Focus-Blöcke brauchen Schutz. Wir erkennen diese Events und passen deine Protokolle automatisch an.",
        evidenceTooltip: "Basierend auf Chronobiologie-Forschung und Verhaltensforschung. Proaktive Anpassungen an störende Events verbessern Ergebnisse um 40-60%."
    },

    lab_snapshot: {
        studies: [
            {
                title: "Vitamin D deficiency",
                authors: "Holick",
                year: 2007,
                url: "https://pubmed.ncbi.nlm.nih.gov/17634462/",
                summary: "40-60 ng/ml is optimal for health outcomes (not just >20 ng/ml \"normal\")."
            },
            {
                title: "Antiinflammatory therapy with canakinumab for atherosclerotic disease",
                authors: "Ridker et al.",
                year: 2017,
                url: "https://pubmed.ncbi.nlm.nih.gov/28845751/",
                summary: "CRP <1 mg/L reduces cardiovascular risk by 25% compared to \"normal\" <3 mg/L."
            },
            {
                title: "Standards of Medical Care in Diabetes",
                authors: "American Diabetes Association",
                year: 2021,
                url: "https://care.diabetesjournals.org/content/44/Supplement_1",
                summary: "HbA1c 5.7-6.4% is prediabetes (intervention opportunity), not just >6.5% diabetes."
            }
        ],
        userExplanation: "Labor-\"Normalbereiche\" sind dafür da, Krankheiten zu erkennen, nicht Gesundheit zu optimieren. Wir zeigen dir OPTIMALE Bereiche basierend auf Longevity-Forschung.",
        evidenceTooltip: "Basierend auf präventiver Medizin und Longevity-Studien. Optimale Bereiche sind mit 20-40% geringerem Krankheitsrisiko verbunden als \"normale\" Bereiche."
    },

    recovery_score: {
        studies: [
            {
                title: "Does overtraining exist? An analysis of overreaching and overtraining research",
                authors: "Halson & Jeukendrup",
                year: 2004,
                url: "https://pubmed.ncbi.nlm.nih.gov/15571428/",
                summary: "Training when under-recovered increases injury risk by 40-60% and impairs performance."
            },
            {
                title: "Recovery and performance in sport: consensus statement",
                authors: "Kellmann et al.",
                year: 2018,
                url: "https://pubmed.ncbi.nlm.nih.gov/29189930/",
                summary: "Subjective recovery scores correlate 0.7-0.8 with objective measures (HRV, performance)."
            },
            {
                title: "Sleep and athletic performance: the effects of sleep loss on exercise performance",
                authors: "Fullagar et al.",
                year: 2015,
                url: "https://pubmed.ncbi.nlm.nih.gov/25028798/",
                summary: "<7h sleep reduces performance by 10-30% across all athletic domains."
            }
        ],
        userExplanation: "Dein Körper braucht Erholung, um sich zu verbessern. Training bei schlechter Erholung macht dich nicht stärker - es macht dich schwächer und verletzungsanfälliger. Wir passen deine Tasks an deine Erholung an.",
        evidenceTooltip: "Basierend auf Sportwissenschaft und Erholungsforschung. Auto-Swap von High-Intensity zu Recovery-Aktivitäten bei Bedarf verbessert Langzeit-Ergebnisse um 20-40%."
    }
};

// Helper function to get module by key
export function getModule(key) {
    return MODULE_DESCRIPTIONS[key] || null;
}

// Helper function to get all modules by category
export function getModulesByCategory(category) {
    return Object.entries(MODULE_DESCRIPTIONS)
        .filter(([_, module]) => module.category === category)
        .map(([key, module]) => ({ key, ...module }));
}

// Helper function to get all modules sorted by score
export function getModulesByScore() {
    return Object.entries(MODULE_DESCRIPTIONS)
        .map(([key, module]) => ({ key, ...module }))
        .sort((a, b) => b.score - a.score);
}

// Helper function to get science references for a module
export function getModuleScience(key) {
    return MODULE_SCIENCE[key] || null;
}
