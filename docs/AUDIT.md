# ExtensioVitae MVP Audit Report

**Datum:** Februar 2026
**Status:** Nicht deploybar - Kritische Issues müssen behoben werden

---

## Executive Summary

| Bereich | Status | Kritisch | Hoch | Mittel |
|---------|--------|----------|------|--------|
| **Security** | 🔴 Blockt Deploy | 3 | 4 | 4 |
| **UX/Usability** | 🟡 Verbesserung nötig | 2 | 8 | 10 |
| **Score Logic** | 🟢 Solide | 1 | 3 | 5 |
| **Code Quality** | 🔴 Build kaputt | 2 | 2 | 3 |

**Gesamt-Bereitschaft: 4/10**

---

## Phase 1: Deployment-Blocker (KRITISCH)

### 1.1 Build reparieren

```bash
# Terminal im Projektverzeichnis ausführen:
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Erwartetes Ergebnis:** Build läuft ohne Fehler durch.

---

### 1.2 Supabase API Keys rotieren

**Problem:** Anon Key ist im Git-Verlauf geleakt.

**Anleitung:**
1. Gehe zu [Supabase Dashboard](https://supabase.com/dashboard)
2. Projekt auswählen → Settings → API
3. Klicke "Regenerate" bei `anon` Key
4. Neuen Key in `.env.local` speichern (NICHT `.env`!)

```bash
# .env.local erstellen (wird von Git ignoriert)
cp .env .env.local

# In .env.local den neuen Key eintragen:
VITE_SUPABASE_ANON_KEY=eyJ...neuer_key...
```

---

### 1.3 .env aus Git entfernen

```bash
# .env aus Git-Tracking entfernen (Datei bleibt lokal)
git rm --cached .env

# .gitignore prüfen - diese Zeilen müssen vorhanden sein:
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore

# Commit
git add .gitignore
git commit -m "chore: remove .env from tracking, add to gitignore"
```

---

### 1.4 AuthProvider Duplikation beheben

**Problem:** AuthProvider ist in `main.jsx` UND `App.jsx` - verursacht React Context Issues.

**Datei:** `src/App.jsx`

```jsx
// VORHER (falsch):
export default function App() {
  return (
    <AuthProvider>  // ❌ ENTFERNEN
      <BrowserRouter>
        ...
      </BrowserRouter>
    </AuthProvider>  // ❌ ENTFERNEN
  );
}

// NACHHER (korrekt):
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        ...
      </Routes>
    </BrowserRouter>
  );
}
```

**Grund:** `main.jsx` hat bereits den AuthProvider-Wrapper.

---

### 1.5 ESLint Config erstellen

**Datei erstellen:** `.eslintrc.json`

```json
{
  "env": {
    "browser": true,
    "es2021": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "parserOptions": {
    "ecmaFeatures": {
      "jsx": true
    },
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "plugins": ["react", "react-hooks"],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
```

**Dependencies installieren:**
```bash
npm install -D eslint eslint-plugin-react eslint-plugin-react-hooks
```

---

### 1.6 Supabase Row Level Security (RLS)

**Problem:** Ohne RLS kann JEDER User ALLE Daten lesen/schreiben!

**Im Supabase SQL Editor ausführen:**

```sql
-- =============================================
-- 1. RLS für intake_responses
-- =============================================
ALTER TABLE intake_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own intake" ON intake_responses;
CREATE POLICY "Users can view own intake" ON intake_responses
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own intake" ON intake_responses;
CREATE POLICY "Users can insert own intake" ON intake_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own intake" ON intake_responses;
CREATE POLICY "Users can update own intake" ON intake_responses
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- 2. RLS für plans
-- =============================================
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own plans" ON plans;
CREATE POLICY "Users can view own plans" ON plans
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own plans" ON plans;
CREATE POLICY "Users can insert own plans" ON plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own plans" ON plans;
CREATE POLICY "Users can update own plans" ON plans
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- 3. RLS für daily_progress
-- =============================================
ALTER TABLE daily_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own progress" ON daily_progress;
CREATE POLICY "Users can view own progress" ON daily_progress
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own progress" ON daily_progress;
CREATE POLICY "Users can insert own progress" ON daily_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own progress" ON daily_progress;
CREATE POLICY "Users can update own progress" ON daily_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- 4. RLS für user_profiles
-- =============================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- 5. RLS für health_profiles
-- =============================================
ALTER TABLE health_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own health profile" ON health_profiles;
CREATE POLICY "Users can view own health profile" ON health_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own health profile" ON health_profiles;
CREATE POLICY "Users can insert own health profile" ON health_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own health profile" ON health_profiles;
CREATE POLICY "Users can update own health profile" ON health_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- 6. RLS für feedback (User können eigenes sehen, Admins alles)
-- =============================================
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own feedback" ON feedback;
CREATE POLICY "Users can view own feedback" ON feedback
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert feedback" ON feedback;
CREATE POLICY "Users can insert feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 7. RLS für plan_snapshots
-- =============================================
ALTER TABLE plan_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own snapshots" ON plan_snapshots;
CREATE POLICY "Users can view own snapshots" ON plan_snapshots
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own snapshots" ON plan_snapshots;
CREATE POLICY "Users can insert own snapshots" ON plan_snapshots
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

**Verifizieren:**
```sql
-- Prüfen ob RLS aktiv ist
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

---

## Phase 2: Kritische UX Fixes

### 2.1 Toast-Komponente erstellen

**Datei erstellen:** `src/components/Toast.jsx`

```jsx
import React, { useState, useEffect, createContext, useContext } from 'react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

function ToastContainer({ toasts, removeToast }) {
  if (toasts.length === 0) return null;

  const typeStyles = {
    success: 'bg-green-600 border-green-500',
    error: 'bg-red-600 border-red-500',
    warning: 'bg-amber-600 border-amber-500',
    info: 'bg-blue-600 border-blue-500'
  };

  const typeIcons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`${typeStyles[toast.type]} border rounded-lg px-4 py-3 text-white shadow-lg flex items-center gap-3 animate-slideIn`}
        >
          <span className="text-lg">{typeIcons[toast.type]}</span>
          <p className="flex-1 text-sm">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-white/70 hover:text-white"
          >
            ✕
          </button>
        </div>
      ))}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default { ToastProvider, useToast };
```

### 2.2 Toast in App integrieren

**Datei:** `src/main.jsx`

```jsx
import { ToastProvider } from './components/Toast';

// Wrap mit ToastProvider
<AuthProvider>
  <ToastProvider>
    <App />
  </ToastProvider>
</AuthProvider>
```

### 2.3 alert() ersetzen

**Suchen und ersetzen in allen Dateien:**

```jsx
// VORHER:
alert("Please fix the following issues:\n\n- " + errors.join("\n- "));

// NACHHER:
import { useToast } from '../components/Toast';

// In der Komponente:
const { addToast } = useToast();

// Statt alert:
addToast(errors[0], 'error'); // Zeige ersten Fehler
// oder für mehrere:
errors.forEach(err => addToast(err, 'error'));
```

**Dateien die alert() verwenden:**
- `src/pages/IntakePage.jsx` (Zeile ~545)
- `src/pages/AdminPage.jsx` (mehrere Stellen)
- `src/pages/DashboardPage.jsx` (wenn vorhanden)

---

### 2.4 Accessibility Fixes

**In allen Form-Feldern htmlFor + id hinzufügen:**

```jsx
// VORHER:
<label className="...">Your Name</label>
<input type="text" ... />

// NACHHER:
<label htmlFor="name-input" className="...">Your Name</label>
<input id="name-input" type="text" ... />
```

**ARIA Labels für Icon-Buttons:**

```jsx
// VORHER:
<button onClick={...}>
  <svg>...</svg>
</button>

// NACHHER:
<button onClick={...} aria-label="Schließen">
  <svg aria-hidden="true">...</svg>
</button>
```

---

### 2.5 Document Title setzen

**In jeder Page-Komponente:**

```jsx
import { useEffect } from 'react';

export default function LandingPage() {
  useEffect(() => {
    document.title = 'ExtensioVitae - Dein 30-Tage Longevity Blueprint';
  }, []);

  // ...
}
```

**Titel pro Seite:**
| Route | Titel |
|-------|-------|
| `/` | ExtensioVitae - Dein 30-Tage Longevity Blueprint |
| `/intake` | Fragebogen - ExtensioVitae |
| `/generating` | Plan wird erstellt... - ExtensioVitae |
| `/dashboard` | Dashboard - ExtensioVitae |
| `/science` | Wissenschaft - ExtensioVitae |
| `/auth` | Anmelden - ExtensioVitae |

---

### 2.6 ErrorBoundary auf alle Routes

**Datei:** `src/App.jsx`

```jsx
import ErrorBoundary from './components/ErrorBoundary';

// Alle Routes wrappen:
<Route path="/" element={
  <ErrorBoundary>
    <LandingPage />
  </ErrorBoundary>
} />

<Route path="/intake" element={
  <ErrorBoundary>
    <IntakePage />
  </ErrorBoundary>
} />

// etc. für alle Routes
```

---

## Phase 3: Score-Logic Fixes

### 3.1 normalizeSubScore Guard

**Datei:** `src/lib/longevityScore.js`

```javascript
// Zeile ~545 - VORHER:
function normalizeSubScore(impact, min, max) {
    const normalized = ((impact - min) / (max - min)) * 100;
    return Math.round(Math.max(0, Math.min(100, normalized)));
}

// NACHHER:
function normalizeSubScore(impact, min, max) {
    if (max === min) return 50; // Guard gegen Division by Zero
    const normalized = ((impact - min) / (max - min)) * 100;
    return Math.round(Math.max(0, Math.min(100, normalized)));
}
```

### 3.2 getBMITip Guard

**Datei:** `src/lib/longevityScore.js`

```javascript
// Zeile ~663 - VORHER:
function getBMITip(height, weight) {
    if (!height || !weight) return "Gewicht und Größe tracken...";
    const bmi = weight / ((height / 100) ** 2);
    // ...
}

// NACHHER:
function getBMITip(height, weight) {
    if (!height || !weight || height <= 0 || weight <= 0) {
        return "Gewicht und Größe tracken für bessere Einschätzung";
    }
    const bmi = weight / ((height / 100) ** 2);
    if (!isFinite(bmi)) return "Ungültige Werte eingegeben";
    // ...
}
```

### 3.3 Biological Age Guard

**Datei:** `src/lib/longevityScore.js`

```javascript
// Zeile ~308 - VORHER:
const biologicalAge = Math.round(age + biologicalAgeOffset);

// NACHHER:
const biologicalAge = Math.max(1, Math.round(age + biologicalAgeOffset));
```

### 3.4 Intensity Cap Validierung

**Datei:** `src/lib/profileService.js`

```javascript
// In calculatePlanConstraints() - Zeile ~530 hinzufügen:
// Validiere intensityCap
const validCaps = ['gentle', 'moderate', 'intense', null];
if (!validCaps.includes(constraints.intensityCap)) {
    console.warn(`Invalid intensityCap: ${constraints.intensityCap}, defaulting to null`);
    constraints.intensityCap = null;
}
```

---

## Phase 4: Security Hardening (Post-MVP)

### 4.1 LLM-Calls nach Backend verschieben

**Problem:** API Keys sind im Browser sichtbar.

**Lösung:** Supabase Edge Function erstellen.

**Datei erstellen:** `supabase/functions/generate-plan/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { intake } = await req.json()

  // API Key aus Supabase Secrets (nicht im Client!)
  const apiKey = Deno.env.get('OPENAI_API_KEY')

  // LLM Call hier...

  return new Response(JSON.stringify({ plan }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### 4.2 Input-Validierung Server-side

**In Supabase:** Database Functions oder Edge Functions für Validierung.

### 4.3 localStorage verschlüsseln

```javascript
// Einfache Verschlüsselung für localStorage
import CryptoJS from 'crypto-js';

const SECRET = 'user-specific-secret'; // Aus Auth-Token ableiten

export function encryptData(data) {
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET).toString();
}

export function decryptData(encrypted) {
  const bytes = CryptoJS.AES.decrypt(encrypted, SECRET);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}
```

---

## Checkliste: Definition of Done

### Vor Deploy MUSS erledigt sein:

- [ ] `npm run build` läuft fehlerfrei
- [ ] Supabase API Keys rotiert
- [ ] `.env` aus Git entfernt
- [ ] RLS Policies für alle Tabellen aktiv
- [ ] AuthProvider Duplikation behoben
- [ ] ESLint Config vorhanden
- [ ] Keine `alert()` im Code
- [ ] `htmlFor` + `id` bei allen Form-Labels
- [ ] `aria-label` bei allen Icon-Buttons
- [ ] ErrorBoundary auf allen Routes
- [ ] Score-Logic Guards implementiert

### Nice-to-Have für MVP:

- [ ] Toast-System implementiert
- [ ] Document Titles gesetzt
- [ ] Console.logs durch Logger ersetzt
- [ ] README.md vervollständigt

### Post-MVP:

- [ ] LLM-Calls ins Backend
- [ ] Server-side Validierung
- [ ] localStorage Verschlüsselung
- [ ] Admin-Rolle server-side prüfen

---

## Zeitschätzung

| Phase | Aufwand | Priorität |
|-------|---------|-----------|
| Phase 1 (Blocker) | 3-4 Stunden | KRITISCH |
| Phase 2 (UX) | 5-6 Stunden | HOCH |
| Phase 3 (Score) | 1 Stunde | MITTEL |
| Phase 4 (Security) | 8-12 Stunden | POST-MVP |

**Minimal Deployable MVP: ~10 Stunden**

---

## Kontakt

Bei Fragen zu diesem Audit: Entwicklungsteam kontaktieren.
