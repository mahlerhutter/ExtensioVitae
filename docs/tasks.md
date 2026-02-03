# ExtensioVitae — Open Tasks & Technical Debt

**Last Updated:** 2026-02-03 08:47  
**Current Version:** v2.1 (Health Profile Integration + Analytics)  
**Last Audit:** 2026-02-03 (AUDIT.md reviewed)
**MVP Readiness:** 65/100 (Deployment-Blocker vorhanden!)

---

## 🔴 CRITICAL PRIORITY - DEPLOYMENT BLOCKER

### 1. 🔴 **Supabase API Keys im Git-Verlauf geleakt**
**Location:** `.env` file checked into Git  
**Status:** ❌ **KRITISCH - DEPLOY BLOCKIERT**  
**Security Risk:** Anon Key ist öffentlich im GitHub Repository sichtbar!  
**Effort:** 15 Minuten

**Fix:**
```bash
# 1. Keys in Supabase rotieren
# → Supabase Dashboard → Settings → API → "Regenerate" anon key

# 2. .env aus Git entfernen
git rm --cached .env
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore

# 3. Neuen Key in .env.local speichern (lokal, nicht committen!)
cp .env .env.local
# → Neuen Key in .env.local eintragen

# 4. Committen
git add .gitignore
git commit -m "security: remove .env from tracking, rotate keys"
```

---

### 2. 🔴 **RLS (Row Level Security) nicht aktiviert**
**Location:** Supabase Database  
**Status:** ❌ **KRITISCH - JEDER kann ALLE Daten lesen!**  
**Security Risk:** Ohne RLS kann jeder User alle Pläne, Intake-Daten, etc. einsehen  
**Effort:** 30 Minuten

**Betroffene Tabellen:**
- `intake_responses` - ❌ RLS nicht aktiv
- `plans` - ❌ RLS nicht aktiv  
- `daily_progress` - ❌ RLS nicht aktiv
- `user_profiles` - ⚠️ RLS teilweise (Admin-Policies fehlen)
- `health_profiles` - ⚠️ RLS teilweise (Admin-Policies fehlen)
- `feedback` - ✅ RLS aktiv (Migration 007)

**Fix:**  
→ Siehe `docs/AUDIT.md` Abschnitt 1.6  
→ Komplettes SQL-Script im Audit vorhanden  
→ Im Supabase SQL Editor ausführen

**Verifizierung:**
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

---

### 3. 🔴 **AuthProvider doppelt gewrappt**
**Location:** `src/App.jsx` + `src/main.jsx`  
**Status:** ❌ **React Context Konflikt**  
**Impact:** Kann zu unerwartetem Auth-Verhalten führen  
**Effort:** 5 Minuten

**Problem:** AuthProvider ist sowohl in `main.jsx` als auch in `App.jsx` → Duplikation

**Fix:** In `src/App.jsx` AuthProvider-Wrapper entfernen (nur in main.jsx behalten)

---

## 🟠 HIGH PRIORITY - Vor Launch erledigen

### 4. 🟠 **Admin Panel RLS Fix - PENDING MIGRATION**
**Location:** `sql/migrations/008_admin_access_policies.sql`  
**Status:** ⏳ Migration bereit, muss in Supabase ausgeführt werden  
**Effort:** 5 Minuten

**To complete:**
```
1. Supabase → SQL Editor
2. Run: sql/migrations/008_admin_access_policies.sql
3. Verify: Admin page zeigt User count
```

---

### 5. 🟠 **alert() entfernen - Toast System implementieren**
**Location:** `IntakePage.jsx` (Zeile ~545), `AdminPage.jsx` (mehrere)  
**Status:** ❌ Noch nicht implementiert  
**Impact:** UX - alert() blockiert UI, nicht modern  
**Effort:** 2-3 Stunden

**Tasks:**
1. Toast-Komponente erstellen (`src/components/Toast.jsx`) - siehe AUDIT.md 2.1
2. ToastProvider in main.jsx wrappen - siehe AUDIT.md 2.2
3. Alle `alert()` Calls durch `useToast()` ersetzen - siehe AUDIT.md 2.3

**Betroffene Dateien:**
- `src/pages/IntakePage.jsx` - Validation errors
- `src/pages/AdminPage.jsx` - Delete confirmations
- Potentiell andere Dateien

---

### 6. 🟠 **Accessibility (A11y) Fixes**
**Location:** Alle Form-Komponenten  
**Status:** ❌ Labels nicht mit Inputs verbunden  
**Impact:** Screen Reader Support fehlt komplett  
**Effort:** 2 Stunden

**Missing:**
- `htmlFor` + `id` bei allen Form-Labels
- `aria-label` bei Icon-Buttons
- `aria-hidden` bei dekorativen SVGs

**Fix:** Siehe AUDIT.md Abschnitt 2.4

---

### 7. 🟠 **Document Titles fehlen**
**Location:** Alle Page-Komponenten  
**Status:** ❌ Alle Pages zeigen generischen Titel  
**Impact:** SEO, Browser Tabs, Bookmarks  
**Effort:** 30 Minuten

**Add to each page:**
```jsx
useEffect(() => {
  document.title = 'PageName - ExtensioVitae';
}, []);
```

**Seiten:** Landing, Intake, Generating, Dashboard, Science, Auth, Admin, 404

---

### 8. 🟠 **ErrorBoundary nicht auf allen Routes**
**Location:** `src/App.jsx`  
**Status:** ⚠️ Teilweise vorhanden  
**Impact:** Crashes zeigen weiße Seite statt Fehlerseite  
**Effort:** 15 Minuten

**Fix:** Alle Routes mit `<ErrorBoundary>` wrappen - siehe AUDIT.md 2.6

---

### 9. 🟠 **ESLint Config fehlt**
**Location:** Projekt-Root  
**Status:** ❌ Keine Linting-Rules  
**Impact:** Code Quality, keine automatische Error-Detection  
**Effort:** 30 Minuten

**Fix:**
1. `.eslintrc.json` erstellen - siehe AUDIT.md 1.5
2. Dependencies installieren: `npm install -D eslint eslint-plugin-react eslint-plugin-react-hooks`
3. Script in package.json: `"lint": "eslint src"`

---

## 🟡 MEDIUM PRIORITY - Code Quality

### 10. 🟡 **Score Logic Guards fehlen**
**Location:** `src/lib/longevityScore.js`  
**Status:** ⚠️ Potentielle Division-by-Zero  
**Impact:** App Crash bei Edge-Cases  
**Effort:** 30 Minuten

**Fixes needed:**
1. `normalizeSubScore()` - Guard gegen `max === min` (AUDIT.md 3.1)
2. `getBMITip()` - Guard gegen invalid height/weight (AUDIT.md 3.2)
3. `biologicalAge` - Guard gegen negative Werte (AUDIT.md 3.3)
4. `intensityCap` - Validierung in profileService (AUDIT.md 3.4)

---

### 11. 🟡 **Magic Numbers ohne Erklärung**
**Location:** `src/lib/longevityScore.js`  
**Status:** ⚠️ Code schwer nachvollziehbar  
**Impact:** Maintenance, Wissenschaftliche Nachvollziehbarkeit  
**Effort:** 30 Minuten

**Fix:** Inline-Kommentare für alle Konstanten (z.B. `-4.5`, `0.7`, `78.6`) mit Studien-Referenzen

---

### 12. 🟡 **Health Warnings nicht in Plan Review angezeigt**
**Location:** `src/components/plan-review/PlanReviewModal.jsx`  
**Status:** ❌ Warnings werden berechnet aber nicht angezeigt  
**Impact:** User sieht nicht welche Tasks aufgrund Health Profile gefiltert wurden  
**Effort:** 1 Stunde

**Add Section:**
- Zeige `plan.meta.health.hasProfile`
- Liste Health Warnings
- Zeige Intensity Cap
- Anzahl gefilterter Tasks

---

### 13. 🟡 **CSS Animation `animate-fadeIn` nicht definiert**
**Location:** `src/pages/DashboardPage.jsx`  
**Status:** ⚠️ Animation funktioniert nicht  
**Impact:** Minor visual bug  
**Effort:** 15 Minuten

**Fix:** Animation in `index.css` oder `tailwind.config.js` definieren

---

## 🟢 LOW PRIORITY - Nice to Have

### 14. 🟢 **console.log() aufräumen**
**Location:** Überall  
**Status:** ⚠️ Viele Debug-Logs  
**Impact:** Console Pollution in Production  
**Effort:** 1 Stunde

**Options:**
1. Logger-Service mit Log-Levels verwenden (BEREITS VORHANDEN: `src/lib/logger.js`)
2. Build-Script das console.logs entfernt
3. ESLint Rule: `no-console: warn`

---

### 15. 🟢 **README.md vervollständigen**
**Location:** `README.md`  
**Status:** ⚠️ Basis vorhanden, aber unvollständig  
**Impact:** GitHub Presentation  
**Effort:** 1 Stunde

**Add:**
- Screenshots
- Feature-Liste
- Installation Guide
- Deployment Guide
- Contribution Guide

---

## 🔮 POST-MVP - Security Hardening

### 16. 🔮 **LLM API Keys im Frontend**
**Location:** `src/lib/llmPlanGenerator.js`  
**Status:** ⚠️ Security Risk wenn LLM aktiviert  
**Impact:** API Keys können ausgelesen werden  
**Effort:** 4-6 Stunden

**Solution:** Supabase Edge Function - siehe AUDIT.md 4.1

---

### 17. 🔮 **localStorage nicht verschlüsselt**
**Location:** `src/lib/dataService.js`  
**Status:** ⚠️ Sensible Daten im Klartext  
**Impact:** Privacy - Daten können ausgelesen werden  
**Effort:** 2 Stunden

**Solution:** CryptoJS Verschlüsselung - siehe AUDIT.md 4.3

---

### 18. 🔮 **Server-side Input Validierung fehlt**
**Location:** Supabase Edge Functions / DB Functions  
**Status:** ❌ Nur Client-side Validierung  
**Impact:** Sicherheit - böswillige Requests möglich  
**Effort:** 4-6 Stunden

**Solution:** Database Functions oder Edge Functions - siehe AUDIT.md 4.2

---

## 🔮 FUTURE FEATURES

### 19. 🔮 **WhatsApp Integration**
**Location:** Konzept in `docs/06-WHATSAPP-FLOW.md`  
**Status:** ❌ Nicht implementiert  
**Impact:** Major Feature Missing  
**Effort:** 8+ Stunden

**Decision needed:** WhatsApp vs. SMS vs. Email (siehe frühere Diskussion)

---

### 20. 🔮 **LLM-generierte Pläne**
**Location:** `src/lib/llmPlanGenerator.js` existiert, aber nicht genutzt  
**Status:** ⚠️ Fallback auf deterministic planBuilder  
**Impact:** Plan-Qualität  
**Effort:** 16+ Stunden

**Requires:** Backend-Integration (siehe #16)

---

## ✅ COMPLETED TASKS (Recent)

### ✅ Analytics Integration (2026-02-03)
**Status:** ✅ **COMPLETE**  
**Priority:** 🟠 HIGH  

**Implementation:**
- ✅ Created `src/lib/analytics.js` with PostHog
- ✅ Graceful degradation wenn posthog-js nicht installiert
- ✅ Tracking für Login, Intake, Tasks, Feedback
- ✅ `posthog-js` dependency added to package.json

**To enable:**
1. PostHog Account erstellen
2. API Key in `.env`: `VITE_POSTHOG_API_KEY=phc_...`

---

### ✅ Admin Panel RLS Fix Prepared (2026-02-03)
**Status:** ✅ **MIGRATION CREATED**  
**Priority:** 🟠 HIGH  

**Implementation:**
- ✅ `sql/migrations/008_admin_access_policies.sql`
- ✅ `is_admin_user()` function mit SECURITY DEFINER

**To complete:** Run migration in Supabase

---

### ✅ Unit Test Setup (2026-02-02)
**Status:** ✅ **COMPLETE**  
**Priority:** 🟡 MEDIUM  

**Implementation:**
- ✅ 92 Tests für Core Business Logic
- ✅ GitHub Actions CI/CD
- ✅ Standalone test runner (simple-test.js)

---

## 📊 SUMMARY & PRIORITIES

### **Deployment Readiness: 65/100**

| Category | Tasks | Priority | Estimated Time |
|----------|-------|----------|----------------|
| **🔴 Critical (Blocker)** | 3 | MUST FIX | 1h |
| **🟠 High (Pre-Launch)** | 6 | SHOULD FIX | 6-8h |
| **🟡 Medium (Quality)** | 4 | NICE TO FIX | 3h |
| **🟢 Low (Polish)** | 2 | OPTIONAL | 2h |
| **🔮 Post-MVP** | 3 | LATER | 12-16h |

### **Critical Path to MVP (Minimal Deployable):**

```
Pflicht (Deployment Blocker):
1. ⬜ Supabase Keys rotieren (15 min)
2. ⬜ .env aus Git entfernen (5 min)  
3. ⬜ RLS Policies aktivieren (30 min)
4. ⬜ AuthProvider Duplikation fixen (5 min)

GESAMT: ~1 Stunde → DANN DEPLOYBAR
```

### **Empfohlener Launch-Pfad (Solides MVP):**

```
Critical + High Priority:
1-4. (siehe oben - 1h)
5. ⬜ Admin Migration ausführen (5 min)
6. ⬜ Toast System (2-3h)
7. ⬜ Accessibility Fixes (2h)
8. ⬜ Document Titles (30 min)
9. ⬜ ErrorBoundary alle Routes (15 min)
10. ⬜ ESLint Setup (30 min)

GESAMT: ~7-8 Stunden → SOLIDES MVP
```

### **Nächste Schritte (Empfohlen):**

1. 🔴 **JETZT:** Kritische Security Fixes (1h)
2. 🚀 **DANN:** Deployment auf Vercel/Netlify
3. 🟠 **DANN:** High Priority UX Fixes (6-8h)
4. 📊 **PARALLEL:** PostHog Account + Analytics aktivieren
5. 🧪 **DANACH:** Beta Testing mit 5-10 Usern

---

## 🎯 AUDIT SUMMARY

**Quelle:** `docs/AUDIT.md` (Februar 2026)

**Overall Assessment:** 
- Security: 🔴 **Deployment-Blocker**
- UX/Usability: 🟡 **Verbesserung nötig**
- Score Logic: 🟢 **Solide**
- Code Quality: 🟠 **Needs Work**

**Zeit bis Minimal MVP:** ~1 Stunde (nur Critical)  
**Zeit bis Solides MVP:** ~7-8 Stunden (Critical + High)  
**Zeit bis Production-Ready:** ~15-20 Stunden (+ Medium + Polish)
