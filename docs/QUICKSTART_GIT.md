# 🚀 Quick Start: Git & GitHub Setup

## ⚡ **Schnellstart (5 Minuten):**

### **Schritt 1: Git konfigurieren** (einmalig)

```bash
# Deine Email und Name setzen:
git config --global user.email "deine-email@example.com"
git config --global user.name "Dein Name"
```

### **Schritt 2: Ersten Commit erstellen**

```bash
# Alle Dateien hinzufügen
git add .

# Commit erstellen (Tests laufen automatisch!)
git commit -m "Initial commit with unit tests and CI/CD"

# Was passiert:
# → 🧪 Running tests before commit...
# → ✅ Tests passed! Proceeding with commit...
```

### **Schritt 3: Zu GitHub pushen**

#### **3a. GitHub Repository erstellen:**
1. Gehe zu https://github.com/new
2. Repository Name: `ExtensioVitae`
3. **NICHT** "Initialize with README" anklicken!
4. Klicke "Create repository"

#### **3b. Zu GitHub pushen:**

```bash
# Remote hinzufügen (ersetze USERNAME mit deinem GitHub Username!)
git remote add origin https://github.com/USERNAME/ExtensioVitae.git

# Branch zu main umbenennen
git branch -M main

# Pushen!
git push -u origin main
```

**Fertig!** 🎉

---

## 🎯 **Was passiert jetzt automatisch?**

### **Bei jedem Commit (lokal):**
```
git commit -m "..."
    ↓
🧪 Tests laufen automatisch
    ↓
✅ Tests OK → Commit wird erstellt
❌ Tests FAIL → Commit wird ABGEBROCHEN
```

### **Bei jedem Push (GitHub):**
```
git push
    ↓
📤 Code zu GitHub
    ↓
🤖 GitHub Actions startet
    ↓
🧪 Tests laufen auf GitHub's Servern
    ↓
✅ Grüner Haken im "Actions" Tab
```

---

## 📋 **Normaler Workflow:**

```bash
# 1. Code ändern
vim src/lib/longevityScore.js

# 2. Änderungen committen
git add src/lib/longevityScore.js
git commit -m "Improve score calculation"
# → Tests laufen automatisch!

# 3. Zu GitHub pushen
git push
# → GitHub Actions läuft automatisch!
```

---

## 🛠️ **Troubleshooting:**

### **Problem: "Author identity unknown"**

```bash
git config --global user.email "deine-email@example.com"
git config --global user.name "Dein Name"
```

### **Problem: Tests schlagen bei Commit fehl**

```bash
❌ Tests failed! Commit aborted.
```

**Lösung:** Fixe den Code und versuche erneut zu committen.

**Notfall (NICHT empfohlen):**
```bash
git commit -m "..." --no-verify  # Überspringt Tests
```

### **Problem: GitHub Actions schlägt fehl**

1. Gehe zu GitHub → Dein Repo → "Actions" Tab
2. Klicke auf den fehlgeschlagenen Workflow
3. Schau dir die Logs an
4. Fixe den Fehler und push erneut

---

## 📊 **Status Badge (optional):**

Füge das zu deiner `README.md` hinzu:

```markdown
![Tests](https://github.com/USERNAME/ExtensioVitae/actions/workflows/test.yml/badge.svg)
```

---

## ✅ **Checkliste:**

- [ ] Git konfiguriert (`user.email` und `user.name`)
- [ ] Ersten Commit erstellt
- [ ] GitHub Repository erstellt
- [ ] Zu GitHub gepusht
- [ ] GitHub Actions läuft (check "Actions" Tab)

---

**Bereit?** Los geht's! 🚀

```bash
git config --global user.email "deine-email@example.com"
git config --global user.name "Dein Name"
git add .
git commit -m "Initial commit with unit tests and CI/CD"
```
