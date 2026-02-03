# Analytics & Admin Setup

## 📊 Analytics Setup (PostHog)

PostHog ist kostenlos, open-source, und privacy-focused.

### **Schritt 1: PostHog Account erstellen**

1. Gehe zu https://posthog.com
2. Wähle "Get started for free"
3. Wähle **EU Cloud** (DSGVO-konform) oder US Cloud
4. Erstelle ein neues Projekt

### **Schritt 2: API Key holen**

1. In PostHog: **Project Settings** → **Project API Key**
2. Kopiere den API Key (beginnt mit `phc_...`)

### **Schritt 3: Environment Variable setzen**

Füge zu deiner `.env` Datei hinzu:

```bash
VITE_POSTHOG_API_KEY=phc_dein_api_key_hier
VITE_POSTHOG_HOST=https://eu.i.posthog.com  # für EU Cloud
# oder https://us.i.posthog.com für US Cloud
```

### **Schritt 4: PostHog Package installieren**

```bash
npm install posthog-js
```

### **Fertig!**

Analytics wird automatisch gestartet wenn die App läuft.

---

## 📈 Was wird getrackt?

### **Automatisch:**
- Page Views (alle Seitenaufrufe)
- Sessions (Nutzer-Sessions)
- Device Info (Browser, OS, Screen Size)

### **Custom Events:**

| Event | Wann | Daten |
|-------|------|-------|
| `user_logged_in` | Nach Login | Methode (Google) |
| `intake_completed` | Intake Form abgeschlossen | Alter, Ziel, Gesundheitsprofil |
| `plan_generated` | Plan wurde erstellt | Longevity Score, Pillars |
| `task_completed` | Task abgehakt | Task ID, Pillar, Tag |
| `day_completed` | Alle Tasks eines Tages erledigt | Tag, Completion Rate |
| `feedback_submitted` | Feedback gesendet | Typ, Rating |

---

## 🛡️ Admin Panel Fix

### **Problem:**
Admin Panel zeigt "0 Registrierte User" weil RLS-Policies den Zugriff blockieren.

### **Lösung:**
Migration `008_admin_access_policies.sql` erstellt eine `is_admin_user()` Funktion.

### **Setup:**

1. **Migration in Supabase ausführen:**

   Gehe zu Supabase → SQL Editor → Neue Query:

   ```sql
   -- Führe den Inhalt von sql/migrations/008_admin_access_policies.sql aus
   ```

2. **Admin Emails in Migration anpassen:**

   Öffne `sql/migrations/008_admin_access_policies.sql` und füge deine Admin-Emails hinzu:

   ```sql
   admin_emails TEXT[] := ARRAY[
       'manuelmahlerhutter@gmail.com',
       'weitere-admin@example.com'
   ];
   ```

3. **Migration erneut ausführen**

### **Verifizieren:**

Nach der Migration sollte das Admin Panel zeigen:
- ✅ Korrekte User-Anzahl
- ✅ User-Emails (nicht mehr "Anonymous")
- ✅ Alle Feedback-Einträge

---

## 📋 Checkliste

### **Analytics:**
- [ ] PostHog Account erstellt
- [ ] API Key in `.env` eingetragen
- [ ] `posthog-js` installiert (`npm install posthog-js`)
- [ ] App neu gestartet
- [ ] Verifiziert: Events erscheinen in PostHog Dashboard

### **Admin Panel:**
- [ ] Migration 008 in Supabase ausgeführt
- [ ] Admin Emails in Migration korrekt
- [ ] Admin Panel zeigt User Count
- [ ] Feedback-Daten werden angezeigt

---

## 🔍 Troubleshooting

### **Analytics zeigt keine Events:**
1. Prüfe: `VITE_POSTHOG_API_KEY` in `.env` gesetzt?
2. Prüfe: App läuft im Production-Modus? (Dev-Modus ist deaktiviert)
3. Prüfe: Browser-Console für Errors

### **Admin zeigt immer noch 0 User:**
1. Prüfe: Migration erfolgreich ausgeführt?
2. Prüfe: Bist du mit einer Admin-Email eingeloggt?
3. Prüfe: RLS Policies mit `SELECT * FROM pg_policies WHERE tablename = 'user_profiles'`

---

## 📊 PostHog Dashboard

Nach dem Setup kannst du in PostHog sehen:

1. **Insights** → User Funnel (Intake → Plan → Task Completion)
2. **Persons** → Einzelne User-Journeys
3. **Cohorts** → User-Gruppen (z.B. "Aktive Nutzer", "Abbrecher")
4. **Dashboards** → Custom Dashboards erstellen

### **Empfohlene erste Insights:**

1. **Funnel: Conversion Rate**
   - Intake Started → Intake Completed → Plan Generated → Task Completed

2. **Retention: Weekly Active Users**
   - Wie viele User kommen zurück?

3. **Feature Usage: Most Used Pillars**
   - Welche Task-Pillar werden am häufigsten abgehakt?
