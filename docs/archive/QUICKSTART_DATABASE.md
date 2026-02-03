# 🎯 Quick Start: Neue Supabase Datenbank

**Erstellt:** 2026-02-03 12:13  
**Status:** READY TO RUN ✅

---

## ⚡ 3-Minuten Setup

### 1. Neues Supabase Projekt erstellen
- Gehe zu [supabase.com/dashboard](https://supabase.com/dashboard)
- **New Project** → Name wählen → Region: `Europe (Frankfurt)`
- ⏳ 2-3 Minuten warten

### 2. Admin Email ändern
**Datei:** `sql/complete_database_setup.sql`  
**Zeile 271:**

```sql
-- VORHER:
VALUES ('admin_emails', '["admin@extensiovitae.com"]'::jsonb)

-- NACHHER (DEINE EMAIL!):
VALUES ('admin_emails', '["deine-email@gmail.com"]'::jsonb)
```

### 3. SQL ausführen
1. Supabase Dashboard → **SQL Editor**
2. **New Query**
3. Paste **kompletten Inhalt** von `sql/complete_database_setup.sql`
4. **Run** (`Cmd+Enter`)
5. ✅ Warte auf "Success"

### 4. Credentials kopieren
**Settings → API:**
```
Project URL: https://xxxxx.supabase.co
anon key: eyJhbGci...
```

### 5. `.env.local` erstellen
```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_ADMIN_EMAILS=deine-email@gmail.com
VITE_LOG_LEVEL=info
```

### 6. Google OAuth
**Authentication → Providers → Google:**
- Enable Google
- Redirect URI: `https://xxxxx.supabase.co/auth/v1/callback`
- Client ID + Secret von [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

---

## ✅ Verifizierung

**SQL Editor ausführen:**
```sql
-- Check Tabellen
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
-- Erwartung: 8 Tabellen (user_profiles, plans, admin_config, etc.)

-- Check RLS
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- Erwartung: Alle = true

-- Check Admin Email
SELECT * FROM admin_config WHERE key = 'admin_emails';
-- Erwartung: Deine Email im JSON Array
```

---

## 🚀 App starten

```bash
npm install
npm run dev
```

**Testen:**
1. http://localhost:5173
2. Login mit Google
3. Fragebogen ausfüllen
4. Plan generieren
5. Admin Panel öffnen (mit deiner Email)

---

## 🐛 Troubleshooting

### "relation admin_config does not exist"
→ **Lösung:** Script wurde nicht komplett ausgeführt. Nochmal komplett pasten & ausführen.

### "Admin Panel zeigt keine Daten"
→ **Lösung:** 
```sql
-- Check Admin Email
SELECT * FROM admin_config WHERE key = 'admin_emails';
-- Falls falsch:
UPDATE admin_config 
SET value = '["deine-email@gmail.com"]'::jsonb 
WHERE key = 'admin_emails';
```

### "Plan Generation failed"
→ **Lösung:** Edge Function noch nicht deployed (kommt später)

---

## 📋 Was wurde erstellt?

### Tabellen (8):
- ✅ `user_profiles` - User Daten & Preferences
- ✅ `intake_responses` - Fragebogen
- ✅ `health_profiles` - Gesundheitsdaten
- ✅ `plans` - 30-Tage Pläne
- ✅ `daily_progress` - Task Tracking
- ✅ `plan_snapshots` - Plan Historie
- ✅ `feedback` - User Feedback
- ✅ `admin_config` - Admin Konfiguration

### RLS Policies (20+):
- ✅ User können nur eigene Daten sehen
- ✅ Admin kann alles sehen (basierend auf `admin_config`)
- ✅ Sichere CRUD-Operationen

### Functions (3):
- ✅ `update_updated_at_column()` - Auto-Timestamps
- ✅ `handle_new_user()` - Auto-Profile Creation
- ✅ `is_admin(email)` - Admin Check Helper

### Indexes (15+):
- ✅ Optimiert für schnelle Queries
- ✅ Composite Indexes für häufige Abfragen

---

## 🎯 Nächste Schritte

Nach erfolgreichem Setup:

1. ✅ **Edge Function deployen** (für LLM Plan Generation)
   ```bash
   supabase functions deploy generate-plan-proxy
   ```

2. ✅ **Production Deployment** (Vercel/Netlify)

3. ✅ **Monitoring einrichten** (Supabase Dashboard)

---

**Geschätzte Zeit:** 5-10 Minuten  
**Schwierigkeit:** Einfach ⭐  
**Status:** Production Ready ✅
