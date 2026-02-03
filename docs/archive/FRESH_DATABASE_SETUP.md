# 🚀 Neue Supabase Datenbank Setup - Anleitung

**Erstellt:** 2026-02-03  
**Zweck:** Komplette Neueinrichtung der ExtensioVitae Datenbank

---

## 📋 Schritt-für-Schritt Anleitung

### 1️⃣ Neues Supabase Projekt erstellen

1. Gehe zu [supabase.com/dashboard](https://supabase.com/dashboard)
2. Klicke auf **"New Project"**
3. Wähle:
   - **Name:** `ExtensioVitae Production` (oder beliebig)
   - **Database Password:** Sicheres Passwort generieren & speichern!
   - **Region:** `Europe (Frankfurt)` (oder nächstgelegene)
4. Klicke **"Create new project"**
5. ⏳ Warte 2-3 Minuten bis Projekt bereit ist

---

### 2️⃣ Database Setup ausführen

1. Im Supabase Dashboard → **SQL Editor** (linke Sidebar)
2. Klicke **"New Query"**
3. Kopiere den **kompletten Inhalt** von `sql/complete_database_setup.sql`
4. Paste in den SQL Editor
5. **WICHTIG:** Ändere Zeile 438:
   ```sql
   -- VORHER:
   ALTER DATABASE postgres SET app.admin_emails TO 'admin@extensiovitae.com';
   
   -- NACHHER (deine Email!):
   ALTER DATABASE postgres SET app.admin_emails TO 'deine-email@example.com';
   ```
6. Klicke **"Run"** (oder `Cmd+Enter`)
7. ✅ Warte auf "Success" Meldung

---

### 3️⃣ Credentials kopieren

1. Gehe zu **Settings → API** (linke Sidebar)
2. Kopiere folgende Werte:

   ```
   Project URL: https://xxxxxxxxxxxxx.supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (für Edge Functions)
   ```

---

### 4️⃣ `.env.local` aktualisieren

1. Im Projekt-Root: `.env.local` erstellen (falls nicht vorhanden)
2. Füge ein:

   ```bash
   # Supabase (NEU!)
   VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   
   # PostHog Analytics (optional)
   VITE_POSTHOG_API_KEY=phc_...
   VITE_POSTHOG_HOST=https://eu.i.posthog.com
   
   # Logging
   VITE_LOG_LEVEL=info
   
   # Admin Access (deine Email!)
   VITE_ADMIN_EMAILS=deine-email@example.com
   ```

3. **NICHT** in Git committen! (`.env.local` ist in `.gitignore`)

---

### 5️⃣ Google OAuth konfigurieren

1. Supabase Dashboard → **Authentication → Providers**
2. Klicke auf **Google**
3. Toggle **"Enable Sign in with Google"** → ON
4. Gehe zu [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
5. Erstelle OAuth 2.0 Client ID:
   - **Application type:** Web application
   - **Authorized redirect URIs:**
     ```
     https://xxxxxxxxxxxxx.supabase.co/auth/v1/callback
     ```
6. Kopiere **Client ID** und **Client Secret** in Supabase
7. Klicke **Save**

---

### 6️⃣ Edge Function deployen

```bash
# 1. Supabase CLI installieren (falls nicht vorhanden)
brew install supabase/tap/supabase

# 2. Login
supabase login

# 3. Link zu neuem Projekt
supabase link --project-ref xxxxxxxxxxxxx

# 4. Edge Function deployen
supabase functions deploy generate-plan-proxy

# 5. Secrets setzen (LLM API Keys)
supabase secrets set OPENAI_API_KEY=sk-proj-...
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

# 6. Testen
supabase functions invoke generate-plan-proxy \
  --body '{"intakeData": {"name": "Test", "age": 30}, "provider": "openai"}'
```

**Erwartete Ausgabe:**
```json
{
  "days": [...],
  "summary": "...",
  "generated_at": "2026-02-03T12:00:00.000Z"
}
```

---

### 7️⃣ Lokale App testen

```bash
# 1. Dependencies installieren (falls noch nicht)
npm install

# 2. Dev Server starten
npm run dev

# 3. Browser öffnen
open http://localhost:5173

# 4. Testen:
# - Registrierung mit Google
# - Fragebogen ausfüllen
# - Plan generieren
# - Admin Panel (mit deiner Email)
```

---

### 8️⃣ Verifizierung

**In Supabase Dashboard:**

1. **Table Editor** → Prüfe ob Tabellen existieren:
   - ✅ user_profiles
   - ✅ intake_responses
   - ✅ health_profiles
   - ✅ plans
   - ✅ daily_progress
   - ✅ plan_snapshots
   - ✅ feedback

2. **SQL Editor** → Führe aus:
   ```sql
   -- RLS Check
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```
   **Erwartung:** Alle Tabellen haben `rowsecurity = true`

3. **SQL Editor** → Führe aus:
   ```sql
   -- Policies Check
   SELECT tablename, policyname 
   FROM pg_policies 
   WHERE schemaname = 'public'
   ORDER BY tablename;
   ```
   **Erwartung:** Mindestens 20+ Policies

---

## 🔒 Security Checklist

- [x] RLS auf allen Tabellen aktiviert
- [x] Admin-Policies verwenden `app.admin_emails` Setting
- [x] User können nur eigene Daten sehen
- [x] Edge Function verwendet Backend Secrets
- [x] `.env.local` ist in `.gitignore`
- [x] Alte `.env` aus Git entfernt

---

## 🐛 Troubleshooting

### Problem: "Edge Function not found"
**Lösung:**
```bash
supabase functions list
# Sollte zeigen: generate-plan-proxy

# Falls nicht:
supabase functions deploy generate-plan-proxy --no-verify-jwt
```

### Problem: "Admin Panel zeigt keine Daten"
**Lösung:**
```sql
-- Prüfe Admin Email Setting
SHOW app.admin_emails;

-- Falls leer:
ALTER DATABASE postgres SET app.admin_emails TO 'deine-email@example.com';
```

### Problem: "RLS Policy Error"
**Lösung:**
```sql
-- Disable RLS temporär zum Debuggen
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Daten prüfen
SELECT * FROM user_profiles;

-- RLS wieder aktivieren
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
```

---

## 📝 Nächste Schritte

Nach erfolgreichem Setup:

1. ✅ Alte Supabase Projekt löschen (optional)
2. ✅ `.env` aus Git entfernen (falls noch nicht)
3. ✅ Production Deployment vorbereiten (Vercel/Netlify)
4. ✅ Monitoring einrichten (Supabase Dashboard)

---

## 🆘 Support

Bei Problemen:
1. Prüfe Supabase Logs: Dashboard → Logs
2. Prüfe Browser Console: F12 → Console
3. Prüfe Edge Function Logs: `supabase functions logs generate-plan-proxy`
