# 🚀 Supabase Database - Quick Reference

**ExtensioVitae** | **Project:** `qnjjusilviwvovrlunep` | **Updated:** 2026-02-06

---

## 🎯 Die 3 Besten Methoden

### 1️⃣ **Supabase Studio** (EINFACHSTE)

```bash
# Öffne Web GUI
open https://supabase.com/dashboard/project/qnjjusilviwvovrlunep/editor
```

**Oder nutze das Helper-Script:**
```bash
./scripts/db-query.sh
# Wähle Option 1
```

### 2️⃣ **psql Client** (FÜR POWER-USER)

```bash
# Installation
brew install postgresql@15

# Verbinden (Connection String von Supabase Dashboard)
psql "postgresql://postgres.[REF]:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"
```

### 3️⃣ **SQL Files + Studio** (FÜR SCRIPTS)

```bash
# Erstelle SQL-Datei
cat > my_query.sql << 'EOF'
SELECT * FROM users LIMIT 10;
EOF

# Kopiere Inhalt und führe in Studio aus
```

---

## 📊 Häufigste Queries

### Alle Tabellen anzeigen
```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

### User Count
```sql
SELECT COUNT(*) FROM auth.users;
```

### Neueste User
```sql
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;
```

### Plans nach Status
```sql
SELECT status, COUNT(*) as count 
FROM plans 
GROUP BY status;
```

### Lab Results Übersicht
```sql
SELECT 
  lr.id,
  lr.test_date,
  lr.lab_name,
  lr.analysis_status,
  COUNT(b.id) as biomarker_count
FROM lab_results lr
LEFT JOIN biomarkers b ON lr.id = b.lab_result_id
GROUP BY lr.id
ORDER BY lr.test_date DESC;
```

### User Activity
```sql
SELECT 
  u.email,
  COUNT(DISTINCT p.id) as plans,
  COUNT(DISTINCT lr.id) as lab_results,
  COUNT(DISTINCT f.id) as feedback_count
FROM auth.users u
LEFT JOIN plans p ON u.id = p.user_id
LEFT JOIN lab_results lr ON u.id = lr.user_id
LEFT JOIN feedback f ON u.id = f.user_id
GROUP BY u.id, u.email
ORDER BY plans DESC;
```

### Feedback Stats
```sql
SELECT 
  feedback_type,
  AVG(rating) as avg_rating,
  COUNT(*) as total_feedback
FROM feedback
GROUP BY feedback_type;
```

### Database Size
```sql
SELECT pg_size_pretty(pg_database_size(current_database()));
```

---

## 🛠️ Supabase CLI Commands

```bash
# Projekt verlinken
supabase link --project-ref qnjjusilviwvovrlunep

# Status anzeigen
supabase status

# Schema dumpen
supabase db dump --schema public > schema.sql

# Daten dumpen
supabase db dump --data-only > data.sql

# Spezifische Tabelle dumpen
supabase db dump --table users > users.sql

# Schema von Remote pullen
supabase db pull

# Migrations pushen
supabase db push

# Lokale DB starten
supabase start

# Lokale DB stoppen
supabase stop

# Lokale DB resetten
supabase db reset
```

---

## 🔍 psql Nützliche Befehle

```sql
-- Liste alle Tabellen
\dt

-- Beschreibe Tabelle
\d users

-- Liste alle Schemas
\dn

-- Liste alle Functions
\df

-- Zeige Query-Timing
\timing

-- Erweiterte Anzeige (für breite Tabellen)
\x

-- Hilfe
\?

-- Beenden
\q
```

---

## 📤 Export & Import

### Export zu CSV (via psql)
```bash
psql "CONNECTION_STRING" -c "COPY (SELECT * FROM users) TO STDOUT WITH CSV HEADER" > users.csv
```

### Import von CSV (via psql)
```sql
\copy users(email, created_at) FROM 'users.csv' WITH CSV HEADER;
```

---

## 🎨 Helper Script

```bash
# Interaktives Menu
./scripts/db-query.sh

# Optionen:
# 1) Supabase Studio öffnen
# 2) psql installieren
# 3) Custom Query File erstellen
# 4) Schema dumpen
# 5) Daten dumpen
# 6) Common Queries anzeigen
```

---

## 🔗 Quick Links

- **SQL Editor:** https://supabase.com/dashboard/project/qnjjusilviwvovrlunep/editor
- **Table Editor:** https://supabase.com/dashboard/project/qnjjusilviwvovrlunep/editor
- **Database Settings:** https://supabase.com/dashboard/project/qnjjusilviwvovrlunep/settings/database

---

## 💡 Pro Tips

1. **Nutze Supabase Studio** für schnelle Queries - es hat Auto-Complete!
2. **Speichere häufige Queries** in Studio als "Saved Queries"
3. **Nutze `\x` in psql** für bessere Lesbarkeit bei breiten Tabellen
4. **Aktiviere `\timing`** um Query-Performance zu messen
5. **Nutze `EXPLAIN ANALYZE`** für Query-Optimierung

---

## 🚨 Wichtige Hinweise

- ⚠️ **Niemals** `service_role` Key im Frontend verwenden
- ✅ Teste Queries erst auf **lokaler DB** (`supabase start`)
- ✅ Nutze **Transactions** für kritische Operationen
- ✅ Prüfe **RLS Policies** bevor du in Production gehst

---

**Schnellstart:** Öffne einfach Studio und leg los! 🚀
```bash
open https://supabase.com/dashboard/project/qnjjusilviwvovrlunep/editor
```
