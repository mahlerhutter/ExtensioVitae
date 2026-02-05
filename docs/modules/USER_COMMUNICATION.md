# ExtensioVitae User Communication Guide

**Last Updated:** 2026-02-05  
**Version:** v0.5.0  
**Purpose:** All user-facing copy for module onboarding, tooltips, notifications, and states

**Tone:** Friendly, competent, not preachy. "Du" not "Sie". Numbers > adjectives.

---

## 1. Circadian Light Protocol

### Onboarding Card
**Headline:** Licht zur richtigen Zeit  
**Description:** Dein circadianer Rhythmus steuert Schlaf, Energie und Stoffwechsel. Erhalte personalisierte Lichtempfehlungen basierend auf der Tageszeit und deinem Wachrhythmus.  
**CTA:** Lichtprotokoll aktivieren

### Tooltip (ℹ️)
Wissenschaftlich fundierte Lichtempfehlungen optimieren deinen circadianen Rhythmus und verbessern deine Schlafqualität um bis zu 45 Minuten.

### Push Notification
**Headline:** Zeit für helles Licht ☀️  
**Body:** Hol dir jetzt 10 Minuten Sonnenlicht, um deine Energie zu steigern und deine innere Uhr zu stellen.  
**Action:** Timer starten

### Empty State
**Icon:** ☀️  
**Headline:** Noch keine Lichtdaten  
**Description:** Aktiviere das Circadian Light Protocol, um personalisierte Empfehlungen den ganzen Tag über zu erhalten.  
**CTA:** Jetzt starten

### Error States
**Missing Data:** Wir brauchen deine Aufwachzeit, um optimale Lichtzeiten zu berechnen.  
**Invalid Data:** Bitte gib eine gültige Zeit zwischen 4 und 11 Uhr ein.  
**System Error:** Lichtempfehlungen können gerade nicht berechnet werden. Bitte versuche es erneut.

---

## 2. Supplement Timing Optimizer

### Onboarding Card
**Headline:** Supplements richtig timen  
**Description:** Falsche Einnahmezeiten reduzieren die Aufnahme um 30-70%. Erhalte wissenschaftlich fundierte Timing-Empfehlungen für jedes deiner Supplements.  
**CTA:** Supplements optimieren

### Tooltip (ℹ️)
Die Nährstoffaufnahme variiert um 40-60% je nach Tageszeit. Richtiges Timing kann die Wirksamkeit deiner Supplements verdoppeln oder verdreifachen.

### Push Notification
**Headline:** Zeit für deine Morgen-Supplements 💊  
**Body:** Vitamin D, Omega-3 und B-Komplex jetzt mit dem Frühstück einnehmen.  
**Action:** Als erledigt markieren

### Empty State
**Icon:** 💊  
**Headline:** Keine Supplements hinzugefügt  
**Description:** Füge deine Supplements hinzu und wir zeigen dir die optimalen Einnahmezeiten basierend auf Absorption und Wechselwirkungen.  
**CTA:** Supplements hinzufügen

### Error States
**Missing Data:** Wir brauchen deine Essenszeiten, um optimale Supplement-Zeiten zu berechnen.  
**Invalid Data:** Dieses Supplement kennen wir nicht. Bitte kategorisiere es oder überspringe es.  
**System Error:** Supplement-Zeitplan kann gerade nicht erstellt werden. Bitte versuche es erneut.  
**Conflict Warning:** ⚠️ Calcium und Eisen blockieren sich gegenseitig. Nimm sie mit 2+ Stunden Abstand ein.

---

## 3. Fasting Window Calculator

### Onboarding Card
**Headline:** Fasten zur richtigen Zeit  
**Description:** Die meisten fasten zur falschen Zeit. Wir berechnen dein optimales Essfenster basierend auf deinem circadianen Rhythmus und Trainingsplan.  
**CTA:** Fastenfenster berechnen

### Tooltip (ℹ️)
Frühes Essfenster (z.B. 8-16 Uhr) verbessert die Insulinsensitivität um 30% im Vergleich zu spätem Essen. Autophagie startet nach 16-18h Fasten.

### Push Notification
**Headline:** Fastenfenster öffnet sich in 30 Min 🍽️  
**Body:** Dein 16:8-Fenster öffnet sich um 12:00 Uhr. Autophagie-Phase erreicht!  
**Action:** Fasten beenden

### Empty State
**Icon:** ⏱️  
**Headline:** Kein Fastenprotokoll aktiv  
**Description:** Wähle ein Fastenprotokoll (16:8, 18:6, OMAD) und wir berechnen dein optimales Essfenster.  
**CTA:** Protokoll wählen

### Error States
**Missing Data:** Wir brauchen deine Aufwach- und Schlafenszeit für optimale Fensterberechnung.  
**Invalid Data:** Dein Essfenster überschneidet sich mit deiner Schlafenszeit. Bitte passe es an.  
**System Error:** Fastenfenster kann gerade nicht berechnet werden. Bitte versuche es erneut.  
**Warning:** ⚠️ Training während des Fastens? Erwäge BCAA oder verschiebe dein Fenster.

---

## 4. Calendar Event Detection

### Onboarding Card
**Headline:** Dein Kalender, deine Biologie  
**Description:** Flüge, späte Dinner und intensive Arbeitsphasen stören deine Routine. Wir erkennen diese Events automatisch und passen deine Protokolle an.  
**CTA:** Kalender verbinden

### Tooltip (ℹ️)
Automatische Erkennung von Flügen, Focus-Blöcken und späten Events. Proaktive Anpassungen verbessern Ergebnisse um 40-60%.

### Push Notification
**Headline:** Flug morgen erkannt ✈️  
**Body:** Wir haben dein Jet-Lag-Protokoll vorbereitet: Licht- und Schlafanpassungen für schnellere Erholung.  
**Action:** Protokoll ansehen

### Empty State
**Icon:** 📅  
**Headline:** Kalender noch nicht verbunden  
**Description:** Verbinde deinen Google Calendar und wir erkennen automatisch Flüge, Focus-Blöcke und späte Events.  
**CTA:** Kalender verbinden

### Error States
**Missing Data:** Kalender-Zugriff benötigt. Bitte verbinde deinen Google Calendar.  
**Invalid Data:** Event konnte nicht klassifiziert werden. Bitte kategorisiere es manuell.  
**System Error:** Kalender-Synchronisation fehlgeschlagen. Bitte versuche es erneut.  
**Low Confidence:** 🤔 Ist "Meeting am Flughafen" ein Flug? Bitte bestätige.

---

## 5. Lab Snapshot Lite

### Onboarding Card
**Headline:** Verstehe deine Blutwerte  
**Description:** Lade dein Laborbericht hoch und erhalte sofortige Analyse von 10 Schlüssel-Biomarkern mit farbcodierten Status und konkreten Handlungsempfehlungen.  
**CTA:** Laborbericht hochladen

### Tooltip (ℹ️)
Wir zeigen dir OPTIMALE Bereiche (nicht nur "normal"). Basierend auf Longevity-Forschung: 20-40% geringeres Krankheitsrisiko.

### Push Notification
**Headline:** Deine Laborergebnisse sind da 🧪  
**Body:** 8 von 10 Biomarkern im optimalen Bereich. Vitamin D könnte verbessert werden.  
**Action:** Ergebnisse ansehen

### Empty State
**Icon:** 🧪  
**Headline:** Noch keine Laborergebnisse  
**Description:** Lade deinen Laborbericht hoch (PDF oder Foto) und wir analysieren 10 Schlüssel-Biomarker für Longevity.  
**CTA:** Bericht hochladen

### Error States
**Missing Data:** OCR konnte keine Werte extrahieren. Bitte gib sie manuell ein.  
**Invalid Data:** Dieser Wert scheint unrealistisch. Bitte überprüfe die OCR-Erkennung.  
**System Error:** Bericht kann gerade nicht analysiert werden. Bitte versuche es erneut.  
**Low Confidence:** ⚠️ OCR-Konfidenz <90%. Bitte überprüfe die erkannten Werte.  
**Missing Reference:** Referenzbereich fehlt. Wir verwenden Populations-Durchschnitte (bitte verifizieren).

---

## 6. Recovery Score & Auto-Swap

### Onboarding Card
**Headline:** Trainiere smart, nicht hart  
**Description:** 3-Fragen-Check-in jeden Morgen. Wir berechnen deinen Recovery Score und tauschen automatisch HIIT gegen Yoga, wenn du Erholung brauchst.  
**CTA:** Morning Check-in starten

### Tooltip (ℹ️)
Training bei schlechter Erholung erhöht das Verletzungsrisiko um 40-60%. Wir passen deine Tasks automatisch an deinen Recovery-Status an.

### Push Notification
**Headline:** Zeit für deinen Morning Check-in ☀️  
**Body:** 3 Fragen, 30 Sekunden. Wir passen deine heutigen Tasks an deine Erholung an.  
**Action:** Check-in starten

### Empty State
**Icon:** 💪  
**Headline:** Noch kein Recovery Score  
**Description:** Starte deinen Morning Check-in (3 Fragen, 30 Sek) und wir berechnen deinen Recovery Score.  
**CTA:** Check-in starten

### Error States
**Missing Data:** Bitte beantworte alle 3 Fragen für einen genauen Recovery Score.  
**Invalid Data:** Bitte gib realistische Werte ein (4-10h Schlaf).  
**System Error:** Recovery Score kann gerade nicht berechnet werden. Bitte versuche es erneut.  
**Poor Recovery Alert:** 🚨 Recovery Score: 42/100 (schlecht). Wir haben HIIT durch Yoga Nidra ersetzt.  
**Consecutive Poor:** ⚠️ 3 Tage schlechte Erholung. Erwäge mehr Schlaf oder medizinische Beratung.

---

## General UI Copy

### Success Messages
- **Module Activated:** "✅ [Module Name] aktiviert! Du erhältst ab jetzt personalisierte Empfehlungen."
- **Task Completed:** "🎉 Erledigt! Du baust Momentum auf."
- **Streak Milestone:** "🔥 [X]-Tage-Streak! Konsistenz ist der Schlüssel zu Longevity."
- **Optimal Result:** "🟢 Perfekt! Du bist im optimalen Bereich."

### Error Messages (General)
- **Network Error:** "Keine Internetverbindung. Bitte überprüfe deine Verbindung."
- **Server Error:** "Etwas ist schiefgelaufen. Wir arbeiten daran. Bitte versuche es später erneut."
- **Permission Denied:** "Zugriff verweigert. Bitte erlaube [X] in den Einstellungen."
- **Rate Limit:** "Zu viele Anfragen. Bitte warte [X] Sekunden."

### Loading States
- **Calculating:** "Berechne deine Empfehlungen..."
- **Analyzing:** "Analysiere deine Daten..."
- **Syncing:** "Synchronisiere mit [Service]..."
- **Processing:** "Verarbeite deinen Upload..."

### Empty States (General)
- **No Data Yet:** "Noch keine Daten. Starte mit [Action], um Insights zu erhalten."
- **No Tasks Today:** "Keine Tasks für heute. Genieße deinen freien Tag! 🌴"
- **No History:** "Noch keine Historie. Nutze [Module] für 7 Tage, um Trends zu sehen."

### Confirmation Dialogs
- **Delete Confirmation:** "Bist du sicher? Diese Aktion kann nicht rückgängig gemacht werden."
- **Override Swap:** "Möchtest du wirklich HIIT machen trotz schlechter Erholung? (Verletzungsrisiko +40%)"
- **Skip Check-in:** "Check-in überspringen? Wir können deine Tasks nicht optimal anpassen."

### Encouragement Messages
- **First Task:** "Großartiger Start! 🎉 Der erste Schritt ist der wichtigste."
- **Halfway:** "Halbzeit! 💪 Du machst großartige Fortschritte."
- **All Done:** "Alle Tasks erledigt! 🌟 Du bist auf dem richtigen Weg."
- **Improvement:** "📈 Du verbesserst dich! [Metric] ist um [X]% gestiegen."

### Educational Tooltips
- **Why Science Matters:** "Wir basieren auf 200+ peer-reviewed Studien. Keine Trends, nur Evidenz."
- **Why Timing Matters:** "Dein Körper funktioniert in Zyklen. Richtiges Timing = 2-3x bessere Ergebnisse."
- **Why Personalization Matters:** "Jeder Mensch ist anders. Wir passen Empfehlungen an DEINE Daten an."

---

## Voice & Tone Guidelines

### DO ✅
- Verwende "Du" (nicht "Sie")
- Sei spezifisch: "8h Schlaf" (nicht "ausreichend Schlaf")
- Sei actionable: "Nimm 5000 IU Vitamin D" (nicht "erwäge Supplementierung")
- Sei ermutigend: "Großartig!" (nicht nur neutral)
- Sei wissenschaftlich: Nenne Studien, aber überwältige nicht
- Sei ehrlich: "Wir wissen es nicht" ist okay

### DON'T ❌
- Verwende keine Fachbegriffe ohne Erklärung
- Sei nicht belehrend oder von oben herab
- Sei nicht vage: "könnte helfen" → "verbessert um 30%"
- Sei nicht übertrieben: "revolutionär" → "evidenzbasiert"
- Sei nicht schuldzuweisend: "Du hast versagt" → "Morgen ist ein neuer Tag"

### Examples

**BAD:** "Ihre zirkadiane Rhythmik weist Dysregulation auf."  
**GOOD:** "Deine innere Uhr ist durcheinander. Lass uns das mit Licht-Timing fixen."

**BAD:** "Erwägen Sie eine Supplementierung mit Cholecalciferol."  
**GOOD:** "Dein Vitamin D ist niedrig. Nimm 5000 IU/Tag + 15 Min Sonne."

**BAD:** "Suboptimale Adhärenz detektiert."  
**GOOD:** "Du hast 3 Tasks übersprungen. Alles okay? Sollen wir das Pensum reduzieren?"

**BAD:** "Biomarker im Normbereich."  
**GOOD:** "🟢 Vitamin D: 52 ng/ml (optimal für Longevity!)"

---

## Accessibility Notes

- All icons must have text alternatives
- All colors must have sufficient contrast (WCAG AA)
- All interactive elements must be keyboard-accessible
- All error messages must be screen-reader friendly
- All time-sensitive notifications must have alternatives

---

**Status:** All copy is production-ready and user-tested (tone, clarity, actionability).
