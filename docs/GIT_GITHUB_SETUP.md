# Git & GitHub Setup Guide

## 🎯 Was wurde eingerichtet?

### 1. ✅ Git Repository
- Lokales Git Repository initialisiert
- `.gitignore` erstellt (ignoriert node_modules, .env, etc.)

### 2. ✅ Git Hooks (Husky)
- Tests laufen **automatisch vor jedem Commit**
- Verhindert "kaputte" Commits
- Läuft lokal auf deinem Computer

### 3. ✅ GitHub Actions
- Tests laufen **automatisch bei jedem Push zu GitHub**
- Sichtbar in Pull Requests
- Läuft auf GitHub's Servern

---

## 🚀 Wie du es benutzt:

### **Erster Commit (jetzt gleich):**

```bash
# 1. Alle Dateien zum Staging hinzufügen
git add .

# 2. Commit erstellen (Tests laufen automatisch!)
git commit -m "Initial commit with unit tests"

# Was passiert:
# → 🧪 Running tests before commit...
# → ✅ calculates baseline score for optimal health
# → ✅ calculates lower score for poor health habits
# → ✅ handles missing optional fields
# → 📊 Results: 3 passed, 0 failed
# → ✅ Tests passed! Proceeding with commit...
# → [main abc1234] Initial commit with unit tests
```

### **Zu GitHub pushen:**

```bash
# 1. GitHub Repository erstellen (auf github.com)
#    - Gehe zu github.com
#    - Klicke "New Repository"
#    - Name: "ExtensioVitae" (oder wie du willst)
#    - NICHT "Initialize with README" anklicken!
#    - Klicke "Create repository"

# 2. Remote hinzufügen (ersetze USERNAME mit deinem GitHub Username)
git remote add origin https://github.com/USERNAME/ExtensioVitae.git

# 3. Branch umbenennen zu main (falls nötig)
git branch -M main

# 4. Zu GitHub pushen
git push -u origin main

# Was passiert auf GitHub:
# → GitHub Actions startet automatisch
# → Tests laufen auf GitHub's Servern
# → Ergebnis sichtbar im "Actions" Tab
```

---

## 📋 **Workflow:**

### **Normaler Entwicklungs-Workflow:**

```bash
# 1. Code ändern
vim src/lib/longevityScore.js

# 2. Testen (optional, manuell)
node src/tests/simple-test.js

# 3. Zu Git hinzufügen
git add src/lib/longevityScore.js

# 4. Commit (Tests laufen automatisch!)
git commit -m "Improve longevity score calculation"

# → Wenn Tests FEILEN:
# ❌ Tests failed! Commit aborted.
# → Commit wird NICHT erstellt
# → Du musst den Code fixen

# → Wenn Tests PASSEN:
# ✅ Tests passed! Proceeding with commit...
# → Commit wird erstellt

# 5. Zu GitHub pushen
git push

# → GitHub Actions läuft automatisch
# → Ergebnis in "Actions" Tab sichtbar
```

---

## 🔍 **Was passiert bei einem Commit?**

### **Lokal (Husky):**

```
git commit -m "..."
    ↓
🧪 Husky Pre-Commit Hook
    ↓
node src/tests/simple-test.js
    ↓
┌─────────────────────────┐
│ Tests PASSED?           │
├─────────────────────────┤
│ ✅ YES → Commit erstellt│
│ ❌ NO  → Commit aborted │
└─────────────────────────┘
```

### **Auf GitHub (Actions):**

```
git push
    ↓
GitHub empfängt Push
    ↓
GitHub Actions startet
    ↓
┌─────────────────────────────┐
│ 1. Code auschecken          │
│ 2. Node.js installieren     │
│ 3. Dependencies installieren│
│ 4. Tests ausführen          │
│ 5. Ergebnis anzeigen        │
└─────────────────────────────┘
    ↓
Ergebnis im "Actions" Tab
```

---

## 🎨 **Wie es aussieht:**

### **Im Terminal (bei Commit):**

```bash
$ git commit -m "Add new feature"

🧪 Running tests before commit...

✅ calculates baseline score for optimal health
✅ calculates lower score for poor health habits
✅ handles missing optional fields

📊 Results: 3 passed, 0 failed

✅ Tests passed! Proceeding with commit...
[main abc1234] Add new feature
 2 files changed, 10 insertions(+), 2 deletions(-)
```

### **Auf GitHub (Actions Tab):**

```
┌─────────────────────────────────────────┐
│ ✅ Tests (Node 18.x)                    │
│ ✅ Tests (Node 20.x)                    │
│                                         │
│ Duration: 45s                           │
│ Triggered by: push                      │
│ Commit: abc1234 "Add new feature"       │
└─────────────────────────────────────────┘
```

---

## 🛠️ **Troubleshooting:**

### **Problem: Tests schlagen fehl bei Commit**

```bash
❌ Tests failed! Commit aborted.
```

**Lösung:**
1. Schau dir die Fehler an
2. Fixe den Code
3. Versuche erneut zu committen

### **Problem: Ich will committen OHNE Tests**

```bash
# NICHT EMPFOHLEN, aber möglich:
git commit -m "..." --no-verify
```

### **Problem: GitHub Actions schlägt fehl**

1. Gehe zu GitHub → Dein Repo → "Actions" Tab
2. Klicke auf den fehlgeschlagenen Workflow
3. Schau dir die Logs an
4. Fixe den Fehler
5. Push erneut

---

## 📊 **Status Badges (optional):**

Füge das zu deiner `README.md` hinzu:

```markdown
![Tests](https://github.com/USERNAME/ExtensioVitae/actions/workflows/test.yml/badge.svg)
```

Ergebnis: ![Tests](https://img.shields.io/badge/tests-passing-brightgreen)

---

## 🎯 **Nächste Schritte:**

### **Jetzt sofort:**

```bash
# 1. Ersten Commit erstellen
git add .
git commit -m "Initial commit with unit tests and CI/CD"

# 2. GitHub Repository erstellen (auf github.com)

# 3. Zu GitHub pushen
git remote add origin https://github.com/USERNAME/ExtensioVitae.git
git branch -M main
git push -u origin main
```

### **Später:**

- [ ] Mehr Tests hinzufügen
- [ ] Coverage-Reports in GitHub Actions
- [ ] Deployment-Workflow hinzufügen
- [ ] Branch-Protection Rules einrichten

---

## 📁 **Erstellte Dateien:**

- ✅ `.git/` - Git Repository
- ✅ `.gitignore` - Ignorierte Dateien
- ✅ `.husky/pre-commit` - Pre-Commit Hook
- ✅ `.github/workflows/test.yml` - GitHub Actions Workflow
- ✅ `package.json` - Updated mit "prepare" script

---

**Bereit für den ersten Commit?** 🚀

```bash
git add .
git commit -m "Initial commit with unit tests and CI/CD"
```
