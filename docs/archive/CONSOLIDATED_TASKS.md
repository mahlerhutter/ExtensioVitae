# ExtensioVitae — Konsolidierte Task-Liste
**Erstellt:** 2026-02-03 12:00  
**Basierend auf:** AUDIT.md + tasks.md  
**Status:** Post-Refactoring (LLM Proxy, Admin RLS, Code Cleanup)

---

## 🎯 AKTUELLER STATUS

### Was wurde HEUTE bereits erledigt:
- ✅ **LLM API Keys aus Frontend entfernt** → Supabase Edge Function Proxy erstellt
- ✅ **Admin Auth gehärtet** → Kein hardcoded Email-Check mehr, RLS-basiert
- ✅ **Code Hygiene** → Duplicate Imports behoben, Pre-commit Hooks aktiviert
- ✅ **Syntax Errors** → HealthProfilePage + llmPlanGenerator.js gefixt
- ✅ **README.md** → Aktualisiert (keine Frontend API Keys mehr)

### Was ist JETZT der Status:
**MVP Readiness: 85/100** (runtergestuft wegen neuer Edge Function Dependencies)

---

## 🔴 PHASE 1: DEPLOYMENT BLOCKER (KRITISCH)

### 1.1 ✅ Build reparieren
**Status:** ✅ ERLEDIGT (heute)
- Syntax Errors behoben
- App läuft wieder

---

### 1.2 ⬜ Supabase API Keys rotieren
**Status:** ❌ **KRITISCH - MUSS VOR DEPLOY**  
**Effort:** 15 Minuten  
**Grund:** Anon Key ist im Git-Verlauf geleakt

**Anleitung:**
```bash
# 1. Supabase Dashboard → Settings → API → "Regenerate" anon key
# 2. .env aus Git entfernen
git rm --cached .env
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore

# 3. Neuen Key in .env.local speichern
cp .env .env.local
# → Neuen Key in .env.local eintragen

# 4. Committen
git add .gitignore
git commit -m "security: remove .env from tracking, rotate keys"
```

---

### 1.3 ⬜ Supabase Edge Function deployen
**Status:** ❌ **NEU - BLOCKER**  
**Effort:** 30 Minuten  
**Grund:** LLM Proxy existiert nur lokal, muss deployed werden

**Anleitung:**
```bash
# 1. Supabase CLI installieren (falls nicht vorhanden)
brew install supabase/tap/supabase

# 2. Login
supabase login

# 3. Link zu Projekt
supabase link --project-ref <your-project-ref>

# 4. Edge Function deployen
supabase functions deploy generate-plan-proxy

# 5. Secrets setzen
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

# 6. Testen
supabase functions invoke generate-plan-proxy --body '{"intakeData": {...}, "provider": "openai"}'
```

**Wichtig:** Ohne diesen Schritt funktioniert Plan-Generierung NICHT!

---

### 1.4 ⬜ RLS Policies aktivieren
**Status:** ⏳ SQL bereit, muss ausgeführt werden  
**Effort:** 5 Minuten  
**Datei:** `sql/fix_rls_v2.sql`

**Anleitung:**
```
1. Supabase → SQL Editor
2. Paste Inhalt von sql/fix_rls_v2.sql
3. Execute
4. Verify: SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

---

### 1.5 ⬜ Admin Access Policy deployen
**Status:** ⏳ Migration bereit  
**Effort:** 5 Minuten  
**Datei:** `sql/migrations/008_admin_access_policies.sql`

**Anleitung:**
```
1. Supabase → SQL Editor
2. Run: sql/migrations/008_admin_access_policies.sql
3. Verify: Admin page zeigt User count
```

---

## 🟠 PHASE 2: HIGH PRIORITY (Vor Launch)

### 2.1 ⬜ Accessibility (A11y) Fixes
**Status:** ❌ Fehlt komplett  
**Effort:** 2 Stunden  
**Impact:** Screen Reader Support, WCAG Compliance

**To-Do:**
- [ ] `htmlFor` + `id` bei allen Form-Labels
- [ ] `aria-label` bei Icon-Buttons
- [ ] `aria-hidden` bei dekorativen SVGs
- [ ] Keyboard Navigation testen

**Betroffene Dateien:**
- `src/pages/IntakePage.jsx`
- `src/pages/HealthProfilePage.jsx`
- `src/pages/DashboardPage.jsx`
- `src/components/*`

---

### 2.2 ⬜ Toast System vollständig integrieren
**Status:** ⚠️ Komponente existiert, aber nicht überall genutzt  
**Effort:** 1 Stunde

**Verbleibende alert() Calls:**
- `src/pages/AdminPage.jsx` (cleanupActivePlans)
- Potentiell weitere in Error-Handlern

**Fix:** Alle `alert()` und `window.confirm()` durch Toast/Modal ersetzen

---

### 2.3 ⬜ Document Titles vervollständigen
**Status:** ⚠️ Teilweise implementiert  
**Effort:** 30 Minuten

**Fehlende Titel:**
- `/health-profile` → "Gesundheitsprofil - ExtensioVitae"
- `/admin` → "Admin Dashboard - ExtensioVitae"

**Empfehlung:** Custom Hook `useDocumentTitle()` erstellen für DRY

---

## 🟡 PHASE 3: CODE QUALITY (Medium Priority)

### 3.1 ⬜ ESLint Config erstellen
**Status:** ❌ Fehlt  
**Effort:** 30 Minuten  
**Datei:** `.eslintrc.json` (siehe AUDIT.md 1.5)

**Warum wichtig:** Pre-commit Hook läuft bereits, aber ohne Config!

---

### 3.2 ⬜ Score Logic Guards
**Status:** ⚠️ Teilweise vorhanden  
**Effort:** 1 Stunde

**Fehlende Guards:**
- `normalizeSubScore()` → Division by Zero
- `getBMITip()` → Negative/Zero Werte
- `biologicalAge` → Kann negativ werden

**Dateien:**
- `src/lib/longevityScore.js`
- `src/lib/profileService.js`

---

### 3.3 ⬜ Test Coverage erweitern
**Status:** ⚠️ 92 Tests, aber nur Core Logic  
**Effort:** Ongoing

**Fehlende Coverage:**
- UI Components (React Testing Library)
- Edge Function (Deno Tests)
- E2E Tests (Playwright/Cypress)

---

## 🔮 PHASE 4: POST-MVP (Security Hardening)

### 4.1 ✅ LLM-Calls nach Backend verschieben
**Status:** ✅ ERLEDIGT (heute)  
**Implementation:** Supabase Edge Function `generate-plan-proxy`

---

### 4.2 ⬜ localStorage verschlüsseln
**Status:** ❌ Sensible Daten im Klartext  
**Effort:** 2 Stunden  
**Impact:** Privacy

**Solution:** CryptoJS Verschlüsselung (siehe AUDIT.md 4.3)

---

### 4.3 ⬜ Server-side Input Validierung
**Status:** ❌ Nur Client-side  
**Effort:** 4-6 Stunden  
**Impact:** Sicherheit gegen böswillige Requests

**Solution:** Database Functions oder Edge Functions

---

### 4.4 ⬜ Admin-Rolle server-side prüfen
**Status:** ⚠️ Teilweise (RLS-basiert, aber kein explizites `is_admin` Flag)  
**Effort:** 2 Stunden

**Current:** Admin Access wird über RLS + Email-Liste geprüft  
**Better:** `user_profiles.is_admin` Boolean + RLS Policy

---

## 📊 ZUSAMMENFASSUNG & PRIORISIERUNG

### Deployment Readiness: 85/100

| Phase | Tasks Offen | Effort | Blocker? |
|-------|-------------|--------|----------|
| **🔴 Phase 1 (Blocker)** | 4 | ~1h | JA |
| **🟠 Phase 2 (High)** | 3 | ~3.5h | NEIN |
| **🟡 Phase 3 (Medium)** | 3 | ~2.5h | NEIN |
| **🔮 Phase 4 (Post-MVP)** | 3 | ~8-12h | NEIN |

---

## 🚀 KRITISCHER PFAD ZUM DEPLOYMENT

### Minimal Deployable MVP (MUSS erledigt sein):

```
1. ⬜ Supabase Keys rotieren (15 min)
2. ⬜ Edge Function deployen (30 min)
3. ⬜ RLS Policies aktivieren (5 min)
4. ⬜ Admin Access Policy deployen (5 min)

GESAMT: ~55 Minuten → DANN DEPLOYBAR
```

### Empfohlene Reihenfolge (heute):

```
JETZT (Blocker):
1. Supabase Keys rotieren
2. Edge Function deployen + testen
3. RLS + Admin Policies ausführen
4. Deployment testen

DANACH (High Priority):
5. A11y Fixes (2h)
6. Toast System vervollständigen (1h)
7. ESLint Config (30 min)

SPÄTER (Polish):
8. Score Logic Guards (1h)
9. Document Titles (30 min)
10. Test Coverage erweitern (ongoing)
```

---

## ⚠️ RISIKEN & ABHÄNGIGKEITEN

### Kritische Abhängigkeiten:
1. **Edge Function Deployment** → Ohne dies funktioniert Plan-Generierung NICHT
2. **RLS Policies** → Ohne dies sind User-Daten ungeschützt
3. **API Key Rotation** → Ohne dies ist das alte Key-Leak aktiv

### Bekannte Risiken:
- Edge Function könnte Timeout-Issues haben (LLM Calls dauern 10-30s)
- RLS Policies könnten Admin-Zugriff brechen (testen!)
- localStorage-Daten gehen bei Verschlüsselung verloren (Migration nötig)

---

## 📝 NÄCHSTE SCHRITTE (Empfehlung)

**Option A: Schnellster Weg zum Deploy (55 min)**
→ Nur Phase 1 Tasks erledigen, dann deployen

**Option B: Solider MVP (4-5h)**
→ Phase 1 + Phase 2 erledigen, dann deployen

**Option C: Production-Ready (7-8h)**
→ Phase 1 + Phase 2 + Phase 3 erledigen

**Meine Empfehlung:** Option B (Solider MVP)
- Deployment-sicher
- Accessibility vorhanden
- Code Quality akzeptabel
- Post-MVP Security kann später kommen
