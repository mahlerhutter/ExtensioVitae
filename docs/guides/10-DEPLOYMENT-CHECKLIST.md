# ExtensioVitae — Deployment Guide

> **Version:** 2.2 | **Stand:** Februar 2026

---

## 🚀 Quick Deployment (5 Minuten)

Wenn Supabase und Vercel bereits eingerichtet sind:

```bash
git push origin main
# Vercel deployed automatisch!
```

---

## 📋 Vollständiges Setup

### 1. Supabase Setup

1. **Projekt erstellen:** [app.supabase.com](https://app.supabase.com)
   - Region: **EU (Frankfurt)** für GDPR
   - Projekt-Name: `extensiovitae`

2. **Datenbank initialisieren:**
   ```sql
   -- In Supabase SQL Editor ausführen:
   -- Kopiere den Inhalt von: sql/complete_database_setup.sql
   ```

3. **Edge Function deployen:**
   ```bash
   cd supabase
   supabase functions deploy generate-plan-proxy
   ```

4. **Environment Variables notieren:**
   - `SUPABASE_URL` → Project Settings → API
   - `SUPABASE_ANON_KEY` → Project Settings → API
   - `SUPABASE_SERVICE_ROLE_KEY` → Project Settings → API (geheim!)

---

### 2. OpenAI Setup

1. **API Key erstellen:** [platform.openai.com](https://platform.openai.com)
2. **Spending Limit setzen:** $50/Monat für MVP
3. **Key speichern:** `OPENAI_API_KEY`

---

### 3. Supabase Edge Function Secrets

```bash
# In Supabase Dashboard → Edge Functions → Secrets
OPENAI_API_KEY=sk-...
```

Oder via CLI:
```bash
supabase secrets set OPENAI_API_KEY=sk-...
```

---

### 4. Vercel Deployment

1. **Repository verbinden:**
   - [vercel.com](https://vercel.com) → New Project
   - GitHub Repo auswählen: `ExtensioVitae`

2. **Environment Variables setzen:**

   | Variable | Wert |
   |----------|------|
   | `VITE_SUPABASE_URL` | `https://xxx.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | `eyJxxx...` |
   | `VITE_APP_VERSION` | `0.1.0` |

3. **Domain verbinden (optional):**
   - Settings → Domains → Add
   - `extensiovitae.com` hinzufügen
   - DNS Records bei Domain-Provider setzen

4. **Deploy:**
   ```bash
   git push origin main
   # Automatic deployment!
   ```

---

## ✅ Post-Deployment Checklist

### Funktionalität testen:
- [ ] Landing Page lädt
- [ ] Auth (Login/Signup) funktioniert
- [ ] Intake Form funktioniert
- [ ] Plan wird generiert
- [ ] Dashboard zeigt Plan an
- [ ] Feedback Button funktioniert
- [ ] Admin Panel (`/admin`) funktioniert

### Legal Pages:
- [ ] `/privacy` erreichbar
- [ ] `/terms` erreichbar
- [ ] `/imprint` erreichbar

### Mobile:
- [ ] Responsive auf iPhone
- [ ] Responsive auf Android
- [ ] Touch-Interaktionen funktionieren

---

## 🔧 Troubleshooting

### "Plan Generation Failed"
1. Checke Supabase Edge Function Logs
2. Verifiziere `OPENAI_API_KEY` in Supabase Secrets
3. Prüfe OpenAI Spending Limit

### "Database Error"
1. Prüfe RLS Policies in Supabase
2. Führe `NOTIFY pgrst, 'reload schema';` aus
3. Checke Browser Console für Details

### "Auth Funktioniert nicht"
1. Verifiziere Supabase URL & Anon Key
2. Prüfe Auth Providers in Supabase Dashboard
3. Checke Redirect URLs

---

## 📊 Monitoring

### Vercel
- Deployment Logs: vercel.com/dashboard
- Analytics: Vercel Analytics (optional)

### Supabase
- Database Usage: Supabase Dashboard → Database
- Edge Function Logs: Supabase Dashboard → Edge Functions
- Auth Users: Supabase Dashboard → Authentication

### PostHog (optional)
- User Analytics: posthog.com
- Einrichten in `.env.local`:
  ```
  VITE_POSTHOG_API_KEY=phc_xxx
  VITE_POSTHOG_HOST=https://eu.i.posthog.com
  ```

---

## 💰 Kosten (Erste 100 User)

| Service | Kosten/Monat |
|---------|--------------|
| Vercel | $0 (Hobby) |
| Supabase | $0 (Free tier) |
| OpenAI | ~$20-40 |
| Domain | ~$1 |
| **Total** | **~$25-45/Monat** |

---

## 🔗 Wichtige URLs

| Service | URL |
|---------|-----|
| Produktion | https://extensiovitae.com |
| Vercel | https://vercel.com/dashboard |
| Supabase | https://app.supabase.com |
| OpenAI | https://platform.openai.com |
| GitHub | https://github.com/mahlerhutter/ExtensioVitae |

---

## 📞 Support

Bei Problemen:
- Supabase: status.supabase.com
- Vercel: vercel.com/docs
- OpenAI: status.openai.com
