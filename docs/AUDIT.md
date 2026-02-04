# ExtensioVitae — Audit Prompts & Templates

**Version:** 2.0
**Purpose:** Semi-automated audit prompts for daily/5-day workflow cycles
**Last Updated:** 2026-02-04

---

## 📋 HOW TO USE THIS FILE

This file contains **reusable prompts** for the development workflow. Copy the relevant prompt, fill in `[PLACEHOLDERS]`, and run with Claude/GPT-4.

**Workflow Integration:**
```
VISION.md → FUTURE.md → tasks.md → [RUN AUDIT PROMPT] → Update tasks.md
```

---

# 🔄 DAILY AUDIT PROMPT

**When to run:** End of each development day
**Duration:** ~10 minutes
**Output:** Updated tasks.md + issue log

## Prompt Template

```markdown
ROLE: Du bist ein strenger Auditor für ExtensioVitae.

KONTEXT - CORE AXIOMS (aus VISION.md):
| Axiom | Definition | Metrik |
|-------|------------|--------|
| AX-1 | Zero Cognitive Load | daily_active_minutes < 3 |
| AX-2 | Context Sovereignty | Adaption an biologischen Zustand |
| AX-3 | Execution Primacy | Lieferung > Information |
| AX-4 | Discretion Protocol | Keine Social Features |
| AX-5 | Biological Truth | Objektive Daten > subjektive Eingaben |

NO-GO LIST:
- Kein AI Chatbot als Core
- Keine Social/Community Feeds
- Kein Content Hub/Magazine

AKTUELLER HORIZON: [H1/H2/H3]

---

INPUT 1 - HEUTIGE CODE-ÄNDERUNGEN:
```
[GIT DIFF ODER BESCHREIBUNG DER ÄNDERUNGEN]
```

INPUT 2 - AKTUELLE tasks.md:
```
[PASTE TASKS.MD INHALT]
```

---

FÜHRE FOLGENDE CHECKS DURCH:

## SECURITY CHECK
□ Keine Secrets im Code (API keys, Passwörter, Tokens)
□ Keine PII in Logs oder Fehlermeldungen
□ Input-Validierung bei neuen Endpoints
□ RLS Policies für neue Tabellen aktualisiert
□ Keine SQL-Injection-Vektoren
□ HTTPS überall verwendet

## USABILITY CHECK
□ Touch-Targets ≥44px
□ Deutsche Sprache korrekt
□ Loading-States für async Operationen
□ Fehler-Messages benutzerfreundlich
□ Mobile-responsive

## VISION ALIGNMENT CHECK
□ Feature erhöht NICHT daily_active_minutes (AX-1)
□ Feature adapts to context ODER ist context-neutral (AX-2)
□ Feature DELIVERS outcome, nicht nur information (AX-3)
□ Feature hat KEINE social Elemente (AX-4)
□ Feature nutzt objektive Daten wo möglich (AX-5)
□ Feature ist NICHT auf No-Go List
□ Feature passt zu aktuellem Horizon

---

OUTPUT FORMAT:

## Daily Audit Report - [DATUM]

### Security: [PASS/WARN/FAIL]
- Issues: [Liste oder "Keine"]
- Action Required: [Ja/Nein]

### Usability: [PASS/WARN/FAIL]
- Issues: [Liste oder "Keine"]
- Action Required: [Ja/Nein]

### Vision Alignment: [ALIGNED/MINOR_DRIFT/MAJOR_DRIFT]
- Axiom Compliance: [Liste]
- No-Go Violations: [Liste oder "Keine"]
- Horizon Fit: [Ja/Nein]

### Tasks.md Updates

NEUE TASKS (hinzufügen):
- [ ] [Task basierend auf Audit-Findings]

ERLEDIGTE TASKS (als ✅ markieren):
- [x] [Task der heute erledigt wurde]

PRIORITÄT ÄNDERN:
- [Task] → 🚨 CRITICAL weil [Grund]

### Empfehlung
[PROCEED / FIX_FIRST / BLOCK]
```

---

# 📅 5-DAY ALIGNMENT AUDIT PROMPT

**When to run:** Alle 5 Entwicklungstage
**Duration:** ~30 minutes
**Output:** Updated FUTURE.md + recalibrated tasks.md

## Prompt Template

```markdown
ROLE: Du führst einen umfassenden 5-Tage-Alignment-Check für ExtensioVitae durch.

---

INPUT 1 - VISION.md:
```
[PASTE VOLLSTÄNDIGEN INHALT VON VISION.md]
```

INPUT 2 - FUTURE.md:
```
[PASTE VOLLSTÄNDIGEN INHALT VON FUTURE.md]
```

INPUT 3 - tasks.md:
```
[PASTE VOLLSTÄNDIGEN INHALT VON tasks.md]
```

INPUT 4 - Git Log (letzte 5 Tage):
```
[PASTE GIT LOG --ONELINE DER LETZTEN 5 TAGE]
```

INPUT 5 - Aktueller Produktstand:
[KURZE BESCHREIBUNG: Was funktioniert? Was ist live?]

---

ANALYSE DURCHFÜHREN:

## TEIL 1: AXIOM COMPLIANCE SCORECARD

Für jedes Axiom berechne aktuellen Stand vs. Ziel:

| Axiom | Ziel | Aktuell (geschätzt) | Gap | Trend |
|-------|------|---------------------|-----|-------|
| AX-1 Zero Cognitive Load | <3 min/Tag | [X] min | [Gap] | ↑/↓/→ |
| AX-2 Context Sovereignty | >85% accuracy | [X]% | [Gap] | ↑/↓/→ |
| AX-3 Execution Primacy | >70% fulfillment | [X]% | [Gap] | ↑/↓/→ |
| AX-4 Discretion Protocol | 0 social features | [Count] | [Gap] | ↑/↓/→ |
| AX-5 Biological Truth | <10% manual input | [X]% | [Gap] | ↑/↓/→ |

## TEIL 2: NORTH STAR DISTANCE

Berechne Fortschritt Richtung "Biologisches Family Office":

```
Content Provider ─────────────────────────── Family Office
                 │←── Aktuelle Position ──→│
                 0%        [X]%          100%
```

Faktoren:
- Context awareness implementiert: [0-100%]
- Zero-input Datenerfassung: [0-100%]
- Execution/Fulfillment-Fähigkeit: [0-100%]
- Revenue aus fulfilled biology: [0-100%]

## TEIL 3: MILESTONE STATUS

| ID | Milestone | Ziel-Monat | Fortschritt | On Track | Risiko |
|----|-----------|------------|-------------|----------|--------|
| M1.1 | Emergency Mode UI | Mo 2 | [%] | ✅/⚠️/❌ | [falls vorhanden] |
| M1.2 | Calendar OAuth | Mo 3 | [%] | ✅/⚠️/❌ | |
| ... | | | | | |

## TEIL 4: FEATURE COHERENCE

Für jedes Feature der letzten 5 Tage:
- Feature Name
- Aligned mit Vision? (Ja/Nein/Teilweise)
- Axiom Impact (+/-/neutral für jedes)
- Empfehlung: Behalten / Modifizieren / Revertieren

## TEIL 5: TECHNICAL DEBT

| Kategorie | Schulden-Items | Dringlichkeit | Impact auf Vision |
|-----------|----------------|---------------|-------------------|
| Security | [Liste] | HIGH/MED/LOW | [Beschreibung] |
| Performance | [Liste] | HIGH/MED/LOW | |
| Code Quality | [Liste] | HIGH/MED/LOW | |
| Testing | [Liste] | HIGH/MED/LOW | |

## TEIL 6: PRIORITÄTS-REKALIBRIERUNG

### Empfohlene Prioritätsreihenfolge (nächste 5 Tage):
1. [Task] — Grund: [Alignment/Risiko/Opportunity]
2. [Task] — Grund: ...
3. [Task] — Grund: ...

### Tasks zu HINZUFÜGEN:
- [ ] [Neuer Task aus identifizierten Gaps]
- [ ] [Neuer Task aus identifizierten Risiken]

### Tasks zu ENTFERNEN/DEPRIORITISIEREN:
- [ ] [Task der mit Vision kollidiert]
- [ ] [Task der low impact ist]

### VISION.md Update nötig?
- [ ] Keine Änderungen nötig
- [ ] Kleine Klarstellung: [beschreiben]
- [ ] Großes Update erforderlich: [beschreiben] — ESKALIEREN AN FOUNDER

---

OUTPUT FORMAT:

# 5-Day Alignment Report
**Zyklus:** [Startdatum] bis [Enddatum]
**Gesundheitsstatus:** 🟢 HEALTHY / 🟡 NEEDS ATTENTION / 🔴 CRITICAL

## Executive Summary
[3 Sätze: größter Gewinn, größtes Risiko, empfohlener Fokus]

## Axiom Compliance
[Scorecard-Tabelle]

## North Star Progress
Vorher: X% → Aktuell: Y% (Δ: +Z%)
Haupttreiber: [Was hat am meisten bewegt]

## Milestone Status
[Status-Tabelle mit markierten Risiken]

## Feature Coherence
[Liste mit Behalten/Modifizieren/Revertieren Empfehlungen]

## Technical Debt
[Priorisierte Schulden-Liste]

## Nächster 5-Tage-Plan
[Priorisierte Task-Liste mit Begründung]

## Eskalationen
[Items die Founder/Stakeholder-Entscheidung brauchen]
```

---

# ⚡ QUICK AUDIT COMMANDS

Für schnelle tägliche Checks:

### Security Quick Check
```
Prüfe diesen Git Diff auf Security Issues (Secrets, XSS, SQL Injection, PII Exposure):
[DIFF EINFÜGEN]
```

### Usability Quick Check
```
Prüfe diese React Komponente auf Mobile Usability (Touch Targets, deutscher Text, Loading States):
[CODE EINFÜGEN]
```

### Vision Quick Check
```
Passt dieses Feature zu "Zero Cognitive Load" und "Execution over Information"?
Feature: [BESCHREIBUNG]
```

### Axiom Violation Check
```
Welches Axiom verletzt dieses Feature (falls überhaupt)?
Axiome: AX-1 Zero Load, AX-2 Context, AX-3 Execution, AX-4 Discretion, AX-5 Biological Truth
Feature: [BESCHREIBUNG]
```

---

# 📊 AUDIT HISTORY TEMPLATE

Tracke Audit-Ergebnisse über Zeit in tasks.md oder separatem Log:

```markdown
## Audit History

| Datum | Typ | Ergebnis | Kritische Issues | Aktionen |
|-------|-----|----------|------------------|----------|
| 2026-02-04 | Daily | PASS | Keine | - |
| 2026-02-05 | Daily | WARN | Touch Target <44px | Fix in IntakePage |
| 2026-02-09 | 5-Day | 🟢 | North Star +2% | Recalibrated tasks |
```

---

# 🔗 WORKFLOW INTEGRATION

## Täglicher Rhythmus

```
MORGENS:
1. Review tasks.md für Tagesfokus
2. Höchste Priorität bearbeiten

ABENDS:
3. Daily Audit Prompt ausführen
4. tasks.md mit Ergebnissen aktualisieren
5. Blocker für morgen notieren
```

## 5-Tage Rhythmus

```
TAG 5:
1. 5-Day Alignment Prompt ausführen
2. FUTURE.md bei Bedarf aktualisieren
3. tasks.md Prioritäten rekalibrieren
4. Nächsten 5-Tage-Fokus planen
5. Learnings dokumentieren
```

## Emergency Protokolle

**Security Issue gefunden:**
1. STOPP aktuelle Arbeit
2. 🚨 CRITICAL zu tasks.md hinzufügen
3. Fixen vor jeder anderen Arbeit
4. In Security Audit Log dokumentieren

**Vision Konflikt gefunden:**
1. Konflikt dokumentieren
2. Schweregrad bewerten (minor/major/critical)
3. Wenn critical: an Founder eskalieren
4. Konfliktierendes Feature NICHT shippen

---

*Audit Prompts v2.0 | Workflow Integration für ExtensioVitae*
