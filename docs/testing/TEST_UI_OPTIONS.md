# Test Runner UI Options

## 🎯 Wer führt die Tests durch?

### **Aktuell verfügbar:**

#### **1. Manuell im Terminal** ✅
```bash
# Einfacher Test-Runner (funktioniert jetzt):
node src/tests/simple-test.js

# Output:
# 🧪 Running Longevity Score Tests...
# ✅ calculates baseline score for optimal health
# ✅ calculates lower score for poor health habits
# ✅ handles missing optional fields
# 📊 Results: 3 passed, 0 failed
```

#### **2. Vitest (wenn Permission-Problem gelöst)** ⚠️
```bash
npm test              # Alle Tests ausführen
npm test:ui           # Browser-UI starten
npm test:coverage     # Mit Coverage-Report
```

---

## 🖥️ **Verfügbare UIs:**

### **1. Terminal UI (Aktuell)** ✅

**Wie es aussieht:**
```
🧪 Running Longevity Score Tests...

✅ calculates baseline score for optimal health
✅ calculates lower score for poor health habits
✅ handles missing optional fields

📊 Results: 3 passed, 0 failed
```

**Features:**
- ✅ Funktioniert JETZT
- ✅ Schnell
- ✅ Einfach
- ❌ Keine Details bei Fehlern
- ❌ Keine Coverage-Visualisierung

---

### **2. Vitest UI (Browser)** 🌐 ⚠️ Permission-Problem

**Würde starten mit:**
```bash
npm test:ui
```

**Würde öffnen:** `http://localhost:51204/__vitest__/`

**Wie es aussehen würde:**

```
┌─────────────────────────────────────────────────────────┐
│ ⚡ Vitest UI                                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📁 Test Files                          ✅ 92 passed   │
│  ├─ 📄 longevityScore.test.js          ✅ 24 passed   │
│  ├─ 📄 planBuilder.test.js             ✅ 28 passed   │
│  ├─ 📄 healthConstraints.test.js       ✅ 22 passed   │
│  └─ 📄 dataService.test.js             ✅ 18 passed   │
│                                                         │
│  ⏱️  Duration: 1.2s                                     │
│  📊 Coverage: 87%                                       │
│                                                         │
│  ┌─────────────────────────────────────┐              │
│  │ Test Details                        │              │
│  ├─────────────────────────────────────┤              │
│  │ ✅ calculates baseline score        │              │
│  │    Expected: > 70                   │              │
│  │    Received: 78                     │              │
│  │    ✓ Passed in 12ms                 │              │
│  └─────────────────────────────────────┘              │
│                                                         │
│  [Re-run] [Watch Mode] [Coverage Report]               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- ✅ Interaktive Browser-UI
- ✅ Echtzeit-Updates
- ✅ Code-Coverage Visualisierung
- ✅ Test-Datei-Explorer
- ✅ Einzelne Tests re-runnen
- ✅ Watch-Mode (automatisch bei Änderungen)
- ✅ Detaillierte Fehler-Anzeige
- ❌ Funktioniert aktuell nicht (Permission-Problem)

---

### **3. VS Code Extension** 🔌 (Optional)

**Installation:**
1. VS Code öffnen
2. Extensions (⌘+Shift+X)
3. Suche "Vitest"
4. Install "Vitest" Extension

**Wie es aussieht:**

```
src/tests/longevityScore.test.js
├─ 📊 Longevity Score Calculation
│  ├─ ✅ calculates baseline score (12ms)
│  ├─ ✅ calculates lower score (8ms)
│  └─ ✅ handles missing fields (5ms)
```

**Features:**
- ✅ Tests direkt in VS Code ausführen
- ✅ Inline-Test-Ergebnisse
- ✅ Debug-Support (Breakpoints in Tests)
- ✅ Code-Coverage Highlights
- ✅ Test-Explorer Sidebar

---

### **4. GitHub Actions (CI/CD)** 🤖 (Noch nicht eingerichtet)

**Würde automatisch laufen bei:**
- Jedem Push zu GitHub
- Jedem Pull Request
- Vor jedem Deployment

**Wie es aussehen würde:**

```
GitHub Actions Workflow:
┌─────────────────────────────────────┐
│ ✅ Tests Passed                     │
│ ✅ Build Successful                 │
│ ✅ Deploy to Production             │
└─────────────────────────────────────┘

Test Results:
  ✅ 92 tests passed
  ⏱️  Duration: 1.2s
  📊 Coverage: 87%
```

---

## 🚀 **Wie du Tests ausführst:**

### **Jetzt sofort (funktioniert):**
```bash
node src/tests/simple-test.js
```

### **Wenn Vitest funktioniert:**
```bash
npm test              # Alle Tests
npm test:ui           # Browser-UI
npm test:coverage     # Mit Coverage
```

### **In VS Code (mit Extension):**
1. Extension installieren
2. Test-Explorer öffnen
3. Auf "Run All Tests" klicken

### **Automatisch (mit Git Hooks):**
```bash
git commit -m "..."
→ Tests laufen automatisch vor Commit
```

---

## 📊 **Vergleich der UIs:**

| Feature | Terminal | Vitest UI | VS Code | GitHub Actions |
|---------|----------|-----------|---------|----------------|
| **Verfügbar** | ✅ Jetzt | ⚠️ Permission | 🔌 Optional | ❌ Nicht eingerichtet |
| **Echtzeit** | ❌ | ✅ | ✅ | ❌ |
| **Coverage** | ❌ | ✅ | ✅ | ✅ |
| **Debug** | ❌ | ❌ | ✅ | ❌ |
| **Watch Mode** | ❌ | ✅ | ✅ | ❌ |
| **Automatisch** | ❌ | ❌ | ❌ | ✅ |

---

## 🎯 **Empfehlung:**

### **Für jetzt:**
```bash
node src/tests/simple-test.js
```

### **Für später (wenn Permission-Problem gelöst):**
```bash
npm test:ui
```

### **Für Entwicklung:**
- VS Code Extension installieren
- Watch-Mode aktivieren
- Tests laufen automatisch bei Änderungen

### **Für Production:**
- GitHub Actions einrichten
- Tests laufen vor jedem Deployment
- Automatische Coverage-Reports

---

**Möchtest du, dass ich:**
1. ✅ Die VS Code Extension einrichten zeige?
2. ✅ GitHub Actions Workflow erstelle?
3. ✅ Git Hooks (Husky) einrichte?
4. ✅ Das Permission-Problem anders löse?
