import React, { useState, useEffect } from 'react';
import './DailyInsight.css';

/**
 * DailyInsight - Shows a daily science-backed insight
 * 
 * Rotates through insights based on day of year.
 * Each insight includes an icon, text, and source citation.
 * 
 * Used in Dashboard to educate users on longevity science.
 */

const INSIGHTS = [
    {
        icon: '☀️',
        text: 'Morgensonne (10.000 Lux) stellt deine innere Uhr und verbessert den Schlaf um bis zu 45 Minuten.',
        source: 'Czeisler et al., 2019'
    },
    {
        icon: '💊',
        text: 'Vitamin D mit einer fetthaltigen Mahlzeit erhöht die Aufnahme um 50%.',
        source: 'Mulligan & Licata, 2010'
    },
    {
        icon: '⏱️',
        text: 'Frühes Essen (vor 15 Uhr) verbessert die Insulinsensitivität um 30% im Vergleich zu spätem Essen.',
        source: 'Sutton et al., 2018'
    },
    {
        icon: '💪',
        text: 'Training bei schlechter Erholung erhöht das Verletzungsrisiko um 40-60%.',
        source: 'Halson & Jeukendrup, 2004'
    },
    {
        icon: '😴',
        text: 'Weniger als 7 Stunden Schlaf reduziert die Leistung um 10-30% in allen Bereichen.',
        source: 'Fullagar et al., 2015'
    },
    {
        icon: '🧪',
        text: 'Optimale Vitamin D Werte (40-60 ng/ml) sind mit 20-40% geringerem Krankheitsrisiko verbunden.',
        source: 'Holick, 2007'
    },
    {
        icon: '🌙',
        text: 'Schon schwaches Licht (<200 Lux) vor dem Schlafengehen unterdrückt Melatonin um 50%.',
        source: 'Gooley et al., 2011'
    },
    {
        icon: '🔥',
        text: 'Autophagie (zelluläre Reinigung) steigt nach 16-18h Fasten um 300%.',
        source: 'de Cabo & Mattson, 2019'
    },
    {
        icon: '🏃',
        text: 'Subjektive Recovery-Scores korrelieren zu 70-80% mit objektiven Messungen (HRV, Leistung).',
        source: 'Kellmann et al., 2018'
    },
    {
        icon: '🥗',
        text: 'Nährstoffaufnahme variiert um 40-60% je nach Tageszeit aufgrund circadianer Rhythmen.',
        source: 'Rondanelli et al., 2019'
    },
    {
        icon: '💡',
        text: 'Blaues Licht (460-480nm) hat den stärksten Effekt auf Wachheit und circadiane Phase.',
        source: 'Lockley et al., 2006'
    },
    {
        icon: '🍽️',
        text: 'Spätes Essen (nach 20 Uhr) verschlechtert die Glukosetoleranz um 20%.',
        source: 'Hutchison et al., 2019'
    },
    {
        icon: '⚡',
        text: 'Eisenaufnahme steigt auf nüchternen Magen um das 3-4-fache im Vergleich zu Einnahme mit Essen.',
        source: 'Hurrell & Egli, 2010'
    },
    {
        icon: '🧬',
        text: 'CRP-Werte <1 mg/L reduzieren das kardiovaskuläre Risiko um 25%.',
        source: 'Ridker et al., 2017'
    },
    {
        icon: '✈️',
        text: 'Lichtanpassung vor dem Flug reduziert Jetlag um 50-70%.',
        source: 'Eastman & Burgess, 2009'
    }
];

export default function DailyInsight() {
    const [insight, setInsight] = useState(null);

    useEffect(() => {
        // Get daily insight (same insight for the whole day)
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = now - start;
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);

        const insightIndex = dayOfYear % INSIGHTS.length;
        setInsight(INSIGHTS[insightIndex]);
    }, []);

    if (!insight) return null;

    return (
        <div className="daily-insight">
            <div className="daily-insight__icon">{insight.icon}</div>
            <div className="daily-insight__content">
                <p className="daily-insight__text">{insight.text}</p>
                <span className="daily-insight__source">Quelle: {insight.source}</span>
            </div>
        </div>
    );
}
