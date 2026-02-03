# 🚀 Post-Database Setup Checklist

**Datenbank Setup:** ✅ COMPLETE  
**Nächste Schritte:** App konfigurieren & testen

---

## 1️⃣ Credentials in `.env.local` eintragen

```bash
# Im Projekt-Root:
cp .env.local.example .env.local
```

**Dann `.env.local` bearbeiten:**

```bash
# Supabase (aus Dashboard → Settings → API)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...

# Admin Email (DEINE Email!)
VITE_ADMIN_EMAILS=deine-email@gmail.com

# Logging
VITE_LOG_LEVEL=info
```

---

## 2️⃣ Google OAuth konfigurieren

**In Supabase Dashboard:**

1. **Authentication → Providers → Google**
2. Toggle **"Enable Sign in with Google"** → ON
3. Kopiere die **Redirect URI**: `https://xxxxx.supabase.co/auth/v1/callback`

**In Google Cloud Console:**

1. Gehe zu [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
2. **Create Credentials → OAuth 2.0 Client ID**
3. **Application type:** Web application
4. **Authorized redirect URIs:** Paste die Supabase Redirect URI
5. Kopiere **Client ID** und **Client Secret**
6. Zurück zu Supabase → Paste Client ID + Secret
7. **Save**

---

## 3️⃣ App lokal testen

```bash
# Dependencies installieren
npm install

# Dev Server starten
npm run dev
```

**Browser öffnen:** http://localhost:5173

**Testen:**
- ✅ Login mit Google funktioniert
- ✅ Fragebogen ausfüllen
- ✅ Plan generieren (wird OHNE LLM laufen, nur Algorithmus)
- ✅ Dashboard zeigt Plan
- ✅ Admin Panel zeigt User (mit deiner Email)

---

## 4️⃣ Edge Function deployen (für LLM)

**Nur wenn du LLM-generierte Pläne willst:**

```bash
# 1. Supabase CLI installieren (falls nicht vorhanden)
brew install supabase/tap/supabase

# 2. Login
supabase login

# 3. Link zu Projekt
supabase link --project-ref xxxxx

# 4. Edge Function deployen
supabase functions deploy generate-plan-proxy

# 5. Secrets setzen (LLM API Keys)
supabase secrets set OPENAI_API_KEY=sk-proj-...
# ODER
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

## 5️⃣ Production Deployment (optional)

**Wenn alles lokal funktioniert:**

### Option A: Vercel

```bash
# 1. Vercel CLI installieren
npm i -g vercel

# 2. Deployen
vercel

# 3. Environment Variables setzen (in Vercel Dashboard):
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
# - VITE_ADMIN_EMAILS
# - VITE_LOG_LEVEL
```

### Option B: Netlify

```bash
# 1. Netlify CLI installieren
npm i -g netlify-cli

# 2. Deployen
netlify deploy --prod

# 3. Environment Variables setzen (in Netlify Dashboard)
```

---

## ✅ Verifizierung

### Database Check:
```sql
-- In Supabase SQL Editor:

-- 1. Check Tabellen
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
-- Erwartung: 8 Tabellen

-- 2. Check RLS
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- Erwartung: Alle = true

-- 3. Check Admin Email
SELECT * FROM admin_config WHERE key = 'admin_emails';
-- Erwartung: Deine Email
```

### App Check:
- [ ] Login funktioniert
- [ ] Fragebogen speichert Daten
- [ ] Plan wird generiert
- [ ] Dashboard zeigt Plan
- [ ] Tasks können abgehakt werden
- [ ] Admin Panel zeigt User (nur mit Admin Email)
- [ ] Feedback kann abgegeben werden

---

## 🐛 Troubleshooting

### "Supabase connection failed"
→ **Lösung:** Check `.env.local` - URL und Key korrekt?

### "Google OAuth not working"
→ **Lösung:** 
1. Check Redirect URI in Google Console
2. Check Client ID/Secret in Supabase
3. Restart dev server

### "Admin Panel zeigt keine Daten"
→ **Lösung:**
```sql
-- Check Admin Email in DB
SELECT * FROM admin_config WHERE key = 'admin_emails';

-- Update falls nötig
UPDATE admin_config 
SET value = '["deine-email@gmail.com"]'::jsonb 
WHERE key = 'admin_emails';
```

### "Plan generation failed"
→ **Lösung:** 
- Ohne Edge Function: Verwendet deterministic algorithm (OK für MVP)
- Mit Edge Function: Check `supabase functions logs generate-plan-proxy`

---

## 📊 Status Check

**Was funktioniert JETZT:**
- ✅ Datenbank komplett eingerichtet
- ✅ RLS Policies aktiv
- ✅ Admin System konfiguriert
- ⏳ App Konfiguration (nächster Schritt)
- ⏳ Google OAuth (nächster Schritt)
- ⏳ Edge Function (optional)

**Was fehlt noch:**
1. `.env.local` erstellen & ausfüllen
2. Google OAuth konfigurieren
3. App lokal testen
4. (Optional) Edge Function deployen
5. (Optional) Production Deployment

---

## 🎯 Nächster Schritt

**JETZT:** Schritt 1 - `.env.local` erstellen

```bash
cp .env.local.example .env.local
# Dann .env.local mit deinen Credentials ausfüllen
```

**Brauchst du Hilfe dabei?**
