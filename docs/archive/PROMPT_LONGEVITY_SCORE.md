# Prompt: Longevity Score & Life in Weeks Implementation

## Kontext
Du arbeitest an ExtensioVitae, einer Longevity-App. Die folgenden Komponenten wurden bereits erstellt:
- `src/lib/longevityScore.js` - Score-Berechnung + Life in Weeks Daten
- `src/components/LongevityScoreCard.jsx` - Score-Anzeige mit Breakdown
- `src/components/LifeInWeeks.jsx` - Wochen-Grid Visualisierung

---

## TASK 1: Landing Page Section "Dein Leben in Wochen"

Füge auf der Landing Page (vor dem Beta-Signup) eine interaktive Sektion hinzu:

### Design-Spezifikation:
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   WIE VIELE WOCHEN HAST DU NOCH?                               │
│   Visualisiere dein Leben – und was ExtensioVitae              │
│   verändern kann.                                               │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                                                         │  │
│   │   [Alter: ___]  [Schlaf/Nacht: ___h]                   │  │
│   │   [Stress (1-10): ___]  [Training/Woche: ___]          │  │
│   │                                                         │  │
│   │              [BERECHNEN]                                │  │
│   │                                                         │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   ┌───────────────────────────┬─────────────────────────────┐  │
│   │                           │                             │  │
│   │   LONGEVITY SCORE         │   DEIN LEBEN IN WOCHEN     │  │
│   │                           │                             │  │
│   │      ┌────────┐           │   ▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪   │  │
│   │      │   72   │           │   ▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪   │  │
│   │      │  /100  │           │   ▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫   │  │
│   │      └────────┘           │   ▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫   │  │
│   │                           │   ░░░░░░░░░░░░░░░░░░░░░   │  │
│   │   Bio. Alter: 41          │   ░░░░░░░░░░░░░░░░░░░░░   │  │
│   │   (Chrono: 38)            │                             │  │
│   │                           │   ▪ Gelebt  ▫ Prognose     │  │
│   │   +4.2 Jahre möglich      │   ░ + mit ExtensioVitae    │  │
│   │                           │                             │  │
│   └───────────────────────────┴─────────────────────────────┘  │
│                                                                 │
│       "Du hast noch 2.340 Wochen. Mach jede einzelne          │
│        zu deiner besten."                                       │
│                                                                 │
│              [JETZT BETA TESTEN →]                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Code-Integration:
```jsx
import { calculateQuickScore, generateLifeInWeeksData } from '../lib/longevityScore';
import LongevityScoreCard from '../components/LongevityScoreCard';
import LifeInWeeks from '../components/LifeInWeeks';

// Im Component:
const [inputs, setInputs] = useState({ age: 35, sleepHours: 7, stressLevel: 5, exerciseFrequency: 2 });
const [scoreData, setScoreData] = useState(null);

const handleCalculate = () => {
    const result = calculateQuickScore(inputs);
    setScoreData(result);
};

// Render:
{scoreData && (
    <>
        <LongevityScoreCard scoreData={scoreData} showBreakdown={false} />
        <LifeInWeeks
            weeksLived={scoreData.weeksLived}
            currentRemainingWeeks={scoreData.currentRemainingWeeks}
            optimizedRemainingWeeks={scoreData.optimizedRemainingWeeks}
            chronologicalAge={scoreData.chronologicalAge}
            showPotential={true}
        />
    </>
)}
```

### Styling:
- Background: Gradient von Navy (#0A1628) zu etwas hellerem Blau
- Cards: Weißer Hintergrund mit subtle shadow
- Gold (#C9A227) für Potential-Gain Highlights
- Animation: Wochen-Boxen sollten nacheinander "erscheinen" (staggered fade-in)

---

## TASK 2: Dashboard Integration

Im Dashboard nach dem Login zeige:

### Haupt-Dashboard (oben):
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Hallo [Name]! 👋                      Tag 12 von 30          │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                                                         │  │
│   │   DEIN LONGEVITY SCORE        LIFE IN WEEKS (compact)   │  │
│   │                                                         │  │
│   │   ┌──────┐   Bio: 36          ▪▪▪▪▫▫░░                 │  │
│   │   │  78  │   Chrono: 38       +3.8 Jahre Potenzial     │  │
│   │   └──────┘   +2 Jahre besser                            │  │
│   │                                                         │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   Heute zu erledigen:                                          │
│   ...                                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Code-Integration:
```jsx
// In DashboardPage.jsx
import { calculateLongevityScore, generateLifeInWeeksData } from '../lib/longevityScore';

// Bei Plan-Load:
const scoreData = useMemo(() => {
    if (!plan?.meta?.inputs) return null;
    return calculateLongevityScore(plan.meta.inputs);
}, [plan]);

// Render (oberhalb der Tages-Tasks):
{scoreData && (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <LongevityScoreCard scoreData={scoreData} showBreakdown={false} compact />
        <LifeInWeeks {...scoreData} compact showPotential maxYears={90} />
    </div>
)}
```

---

## TASK 3: Score-Update bei Task-Completion

Zeige visuelles Feedback wenn Tasks abgeschlossen werden:

### Konzept:
- Bei jedem abgeschlossenen Task: kleines "+X Wochen" Popup
- Wöchentlicher Score-Update basierend auf Completion Rate
- "Streak" Bonus für konsistente Tage

### Micro-Interaction:
```jsx
// Nach Task-Completion
const showWeekGainAnimation = (weeks) => {
    // Toast/Popup: "+2 Wochen gewonnen 🎉"
    // Life in Weeks Grid: goldene Box blinkt kurz auf
};
```

---

## TASK 4: Motivations-Copy

Verwende diese Texte für emotionale Wirkung:

### Landing Page:
- Headline: "Wie viele Wochen hast du noch?"
- Subline: "Die durchschnittliche Person verschenkt 8-12 Jahre an vermeidbare Faktoren."
- CTA nach Score: "Du hast noch [X] Wochen. Mach jede einzelne zu deiner besten."

### Dashboard:
- Bei gutem Score (>70): "Du investierst in deine Zukunft. Weiter so! 🌟"
- Bei mittlerem Score (40-70): "Jeder Tag zählt. Heute ist der perfekte Tag für Veränderung."
- Bei niedrigem Score (<40): "Kleine Änderungen, große Wirkung. Starte mit einer Sache."

### Wochen-Gewinn Messaging:
- "Diese Woche hast du dir +12 Stunden Lebenszeit zurückgeholt."
- "Dein biologisches Alter ist diese Woche um 0.3 Jahre gesunken."

---

## TASK 5: Animation Specifications

### Life in Weeks Grid Animation:
```css
/* Staggered reveal animation */
.week-box {
    opacity: 0;
    animation: fadeIn 0.1s ease forwards;
}

.week-box:nth-child(1) { animation-delay: 0ms; }
.week-box:nth-child(2) { animation-delay: 2ms; }
/* ... etc, oder via JS */

@keyframes fadeIn {
    to { opacity: 1; }
}

/* Potential gain highlight pulse */
.week-box.potential {
    animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 1; }
}
```

### Score Circle Animation:
```css
/* SVG stroke animation */
.score-circle {
    stroke-dasharray: 283; /* 2 * PI * 45 */
    stroke-dashoffset: 283;
    animation: drawCircle 1.5s ease-out forwards;
}

@keyframes drawCircle {
    to { stroke-dashoffset: var(--target-offset); }
}
```

---

## TASK 6: Mobile Responsiveness

### Life in Weeks auf Mobile:
- Zeige nur 30 Jahre statt 90 (kompakter)
- Oder: horizontales Scrollen für volles Grid
- Größere Touch-Targets für Tooltips

### Score Card auf Mobile:
- Stack vertikal statt horizontal
- Breakdown als ausklappbares Accordion

---

## Wichtige Dateien:
- `/src/lib/longevityScore.js` - Score-Logik
- `/src/components/LongevityScoreCard.jsx` - Score UI
- `/src/components/LifeInWeeks.jsx` - Grid UI
- `/src/pages/LandingPage.jsx` - Integration Landing
- `/src/pages/DashboardPage.jsx` - Integration Dashboard

## Farben:
- Navy: #0A1628
- Gold: #C9A227
- Lived weeks: #1e3a5f (dark navy)
- Current projection: #64748b (slate)
- Potential gain: #C9A227 (gold)
- Beyond: #e2e8f0 (light gray)

## Disclaimer:
Füge immer einen kleinen Disclaimer hinzu:
"Dieser Score dient der Motivation und ist keine medizinische Diagnose."
