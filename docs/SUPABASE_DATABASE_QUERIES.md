# Supabase Database Queries - Praktische Anleitung

**Projekt:** ExtensioVitae v0.6.0  
**Supabase CLI:** v2.75.0  
**Last Updated:** 2026-02-06

---

## 📋 Inhaltsverzeichnis

1. [Supabase Studio (GUI) - Empfohlen](#supabase-studio-gui)
2. [Direkte PostgreSQL Verbindung](#direkte-postgresql-verbindung)
3. [psql Client](#psql-client)
4. [Supabase CLI Utilities](#supabase-cli-utilities)
5. [Praktische Beispiele](#praktische-beispiele)
6. [Häufige Abfragen](#häufige-abfragen)

---

## 🎨 Supabase Studio (GUI) - **EMPFOHLEN**

### Remote Studio (Einfachste Methode)

**Direkter Link zu deinem Projekt:**
```
https://supabase.com/dashboard/project/qnjjusilviwvovrlunep/editor
```

**Features:**
- ✅ **SQL Editor** mit Syntax-Highlighting und Auto-Complete
- ✅ **Table Editor** - Visuell Daten bearbeiten wie in Excel
- ✅ **Query History** - Alle Queries werden gespeichert
- ✅ **Saved Queries** - Häufige Queries speichern
- ✅ **Schema Visualizer** - ER-Diagramme
- ✅ **RLS Policy Editor** - Security Policies verwalten

### Wie du Queries ausführst:

1. Gehe zu: https://supabase.com/dashboard/project/qnjjusilviwvovrlunep/editor
2. Klicke auf **"SQL Editor"** in der linken Sidebar
3. Schreibe deine Query:
   ```sql
   SELECT * FROM users LIMIT 10;
   ```
4. Drücke **Cmd+Enter** oder klicke auf **"Run"**
5. Ergebnisse werden unten angezeigt

### Lokale Studio (für Local Development)

```bash
# Erst lokale Supabase starten
supabase start

# Dann Studio öffnen (automatisch im Browser)
# http://localhost:54323
```

---

## 🔌 Direkte PostgreSQL Verbindung

### Connection String abrufen

```bash
# Zeige Connection Details
supabase status

# Oder direkt die Connection String
supabase db url
```

**Output:**
```
postgresql://postgres:postgres@localhost:54322/postgres
```

### Mit psql verbinden

```bash
# Lokale Datenbank
psql "postgresql://postgres:postgres@localhost:54322/postgres"

# Remote Datenbank (von Supabase Dashboard kopieren)
psql "postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"
```

---

## 🎨 Supabase Studio (GUI)

### Studio starten

```bash
# Lokale Studio öffnen
supabase studio

# Oder direkt im Browser:
# http://localhost:54323
```

**Features:**
- ✅ Table Editor (visuell Daten bearbeiten)
- ✅ SQL Editor (Queries schreiben und speichern)
- ✅ Database Schema visualisieren
- ✅ RLS Policies verwalten
- ✅ Functions & Triggers

### Remote Studio

Gehe zu: https://supabase.com/dashboard/project/qnjjusilviwvovrlunep/editor

---

## 💻 psql Client

### Installation (falls nicht installiert)

```bash
# macOS
brew install postgresql@15

# Verify
psql --version
```

### Nützliche psql Befehle

```sql
-- Liste alle Tabellen
\dt

-- Beschreibe Tabelle
\d users
\d+ users  -- Mit mehr Details

-- Liste alle Schemas
\dn

-- Liste alle Functions
\df

-- Liste alle Views
\dv

-- Zeige aktuelle Verbindung
\conninfo

-- Führe SQL-Datei aus
\i /path/to/file.sql

-- Ausgabe in Datei umleiten
\o output.txt
SELECT * FROM users;
\o  -- Stop redirect

-- Timing aktivieren
\timing
SELECT COUNT(*) FROM users;

-- Erweiterte Anzeige (gut für breite Tabellen)
\x
SELECT * FROM users LIMIT 1;
\x  -- Toggle off

-- Hilfe
\?        -- psql Befehle
\h SELECT -- SQL Syntax Hilfe

-- Beenden
\q
```

---

## 📊 Praktische Beispiele

### 1. Alle Tabellen anzeigen

```bash
supabase db execute --sql "
  SELECT 
    schemaname,
    tablename,
    tableowner
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename;
"
```

### 2. Tabellen-Größen anzeigen

```bash
supabase db execute --sql "
  SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

### 3. Anzahl Einträge pro Tabelle

```bash
supabase db execute --sql "
  SELECT 
    schemaname,
    tablename,
    n_live_tup AS row_count
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
  ORDER BY n_live_tup DESC;
"
```

### 4. Letzte 10 User

```bash
supabase db execute --sql "
  SELECT 
    id,
    email,
    created_at,
    updated_at
  FROM users
  ORDER BY created_at DESC
  LIMIT 10;
"
```

### 5. User mit ihren Plänen

```bash
supabase db execute --sql "
  SELECT 
    u.email,
    COUNT(p.id) as plan_count,
    MAX(p.created_at) as latest_plan
  FROM users u
  LEFT JOIN plans p ON u.id = p.user_id
  GROUP BY u.email
  ORDER BY plan_count DESC;
"
```

### 6. Lab Results mit Biomarkern

```bash
supabase db execute --sql "
  SELECT 
    lr.id,
    lr.user_id,
    lr.test_date,
    lr.lab_name,
    COUNT(b.id) as biomarker_count
  FROM lab_results lr
  LEFT JOIN biomarkers b ON lr.id = b.lab_result_id
  GROUP BY lr.id
  ORDER BY lr.test_date DESC
  LIMIT 10;
"
```

### 7. Aktive vs. Abgeschlossene Pläne

```bash
supabase db execute --sql "
  SELECT 
    status,
    COUNT(*) as count,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
  FROM plans
  GROUP BY status;
"
```

### 8. Feedback-Statistiken

```bash
supabase db execute --sql "
  SELECT 
    feedback_type,
    rating,
    COUNT(*) as count
  FROM feedback
  GROUP BY feedback_type, rating
  ORDER BY feedback_type, rating;
"
```

---

## 🔍 Häufige Abfragen für ExtensioVitae

### User Management

```sql
-- Alle User mit Details
SELECT 
  id,
  email,
  created_at,
  updated_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- User-Aktivität
SELECT 
  u.email,
  COUNT(DISTINCT p.id) as plans,
  COUNT(DISTINCT lr.id) as lab_results,
  COUNT(DISTINCT f.id) as feedback_count
FROM users u
LEFT JOIN plans p ON u.id = p.user_id
LEFT JOIN lab_results lr ON u.id = lr.user_id
LEFT JOIN feedback f ON u.id = f.user_id
GROUP BY u.id, u.email;
```

### Plan Analytics

```sql
-- Plan-Status Übersicht
SELECT 
  status,
  COUNT(*) as count,
  ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600), 2) as avg_hours_to_complete
FROM plans
GROUP BY status;

-- Neueste Pläne mit User
SELECT 
  p.id,
  u.email,
  p.name,
  p.status,
  p.created_at
FROM plans p
JOIN users u ON p.user_id = u.id
ORDER BY p.created_at DESC
LIMIT 20;
```

### Lab Results Analytics

```sql
-- Lab Results Übersicht
SELECT 
  lr.id,
  u.email,
  lr.test_date,
  lr.lab_name,
  lr.analysis_status,
  COUNT(b.id) as biomarker_count
FROM lab_results lr
JOIN users u ON lr.user_id = u.id
LEFT JOIN biomarkers b ON lr.id = b.lab_result_id
GROUP BY lr.id, u.email
ORDER BY lr.test_date DESC;

-- Biomarker-Trends für einen User
SELECT 
  b.name,
  b.value,
  b.unit,
  b.reference_range,
  lr.test_date
FROM biomarkers b
JOIN lab_results lr ON b.lab_result_id = lr.id
WHERE lr.user_id = 'USER_ID_HERE'
ORDER BY b.name, lr.test_date;
```

### Feedback Analytics

```sql
-- Feedback-Übersicht
SELECT 
  feedback_type,
  AVG(rating) as avg_rating,
  COUNT(*) as total_feedback,
  COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive_feedback
FROM feedback
GROUP BY feedback_type;

-- Neuestes Feedback
SELECT 
  u.email,
  f.feedback_type,
  f.rating,
  f.comment,
  f.created_at
FROM feedback f
JOIN users u ON f.user_id = u.id
ORDER BY f.created_at DESC
LIMIT 20;
```

### System Health

```sql
-- Datenbank-Größe
SELECT 
  pg_size_pretty(pg_database_size(current_database())) as database_size;

-- Aktive Verbindungen
SELECT 
  COUNT(*) as active_connections,
  state
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state;

-- Langsame Queries (wenn pg_stat_statements aktiviert)
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

---

## 🛠️ Daten-Manipulation

### INSERT

```bash
supabase db execute --sql "
  INSERT INTO users (email, created_at)
  VALUES ('test@example.com', NOW())
  RETURNING *;
"
```

### UPDATE

```bash
supabase db execute --sql "
  UPDATE plans
  SET status = 'completed'
  WHERE id = 'PLAN_ID_HERE'
  RETURNING *;
"
```

### DELETE

```bash
supabase db execute --sql "
  DELETE FROM feedback
  WHERE created_at < NOW() - INTERVAL '90 days'
  RETURNING COUNT(*);
"
```

---

## 📤 Export & Import

### Export zu CSV

```bash
# Via psql
psql "$(supabase db url)" -c "COPY (SELECT * FROM users) TO STDOUT WITH CSV HEADER" > users.csv

# Oder mit Supabase CLI
supabase db dump --data-only --table users > users_data.sql
```

### Import von CSV

```sql
-- In psql Session
\copy users(email, created_at) FROM 'users.csv' WITH CSV HEADER;
```

### Vollständiger Dump

```bash
# Schema + Daten
supabase db dump > full_backup.sql

# Nur Schema
supabase db dump --schema public > schema.sql

# Nur Daten
supabase db dump --data-only > data.sql

# Spezifische Tabelle
supabase db dump --table users > users_backup.sql
```

### Restore

```bash
# Restore von Dump
psql "$(supabase db url)" < full_backup.sql

# Oder mit Supabase CLI
supabase db execute -f full_backup.sql
```

---

## 🔐 Sicherheits-Checks

### RLS Policies prüfen

```sql
-- Alle RLS Policies anzeigen
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public';

-- Tabellen ohne RLS
SELECT 
  tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT IN (
    SELECT tablename 
    FROM pg_policies
  );
```

### User Permissions

```sql
-- Zeige alle Grants
SELECT 
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public';
```

---

## 🎯 Quick Reference

### Häufigste Befehle

```bash
# Interaktive Shell
supabase db shell

# Query ausführen
supabase db execute --sql "SELECT * FROM users LIMIT 5;"

# SQL-Datei ausführen
supabase db execute -f query.sql

# Studio öffnen
supabase studio

# Connection String
supabase db url

# Dump erstellen
supabase db dump > backup.sql

# Status anzeigen
supabase status
```

### Nützliche Aliases (Optional)

Füge zu deiner `~/.zshrc` hinzu:

```bash
# Supabase Aliases
alias sdb='supabase db shell'
alias sdbx='supabase db execute --sql'
alias sstudio='supabase studio'
alias surl='supabase db url'
alias sdump='supabase db dump'

# Reload shell
source ~/.zshrc
```

Dann kannst du einfach verwenden:

```bash
sdb                                    # Öffne Shell
sdbx "SELECT * FROM users LIMIT 5;"   # Quick Query
sstudio                                # Öffne Studio
```

---

## 📚 Weitere Ressourcen

- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Supabase SQL Editor:** https://supabase.com/dashboard/project/qnjjusilviwvovrlunep/editor
- **psql Guide:** https://www.postgresql.org/docs/current/app-psql.html
- **Supabase CLI Reference:** https://supabase.com/docs/reference/cli

---

**Tipp:** Für komplexe Queries empfehle ich Supabase Studio - es hat Syntax-Highlighting, Auto-Complete und Query-History! 🚀
