# Supabase CLI Setup Guide - ExtensioVitae

**Status:** ✅ Supabase CLI v2.75.0 already installed  
**Last Updated:** 2026-02-06  
**Project:** ExtensioVitae v0.6.0

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Link to Remote Project](#link-to-remote-project)
4. [Local Development](#local-development)
5. [Migration Management](#migration-management)
6. [Edge Functions](#edge-functions)
7. [Common Commands](#common-commands)
8. [Troubleshooting](#troubleshooting)

---

## ✅ Prerequisites

### Already Installed
- ✅ Supabase CLI v2.75.0 (`/opt/homebrew/bin/supabase`)
- ✅ Docker Desktop (required for local development)

### Verify Installation
```bash
supabase --version
# Should output: 2.75.0

docker --version
# Should output: Docker version XX.X.X
```

---

## 🚀 Initial Setup

### Step 1: Initialize Supabase in Project

```bash
cd /Users/mahlerhutter/dev/projekte/MVPExtensio

# Initialize Supabase (creates config.toml and migrations folder)
supabase init
```

**Note:** You already have a `supabase/` folder, so this will detect existing configuration.

### Step 2: Review Configuration

The `supabase/config.toml` file contains your local development settings:

```toml
# Example configuration
[api]
port = 54321
schemas = ["public", "storage", "graphql_public"]

[db]
port = 54322
shadow_port = 54320

[studio]
port = 54323
```

---

## 🔗 Link to Remote Project

### Step 1: Login to Supabase

```bash
supabase login
```

This will open a browser window to authenticate.

### Step 2: Link to Your Remote Project

```bash
# List your projects
supabase projects list

# Link to your project (replace with your project ref)
supabase link --project-ref <your-project-ref>
```

**Finding your Project Ref:**
- Go to your Supabase Dashboard: https://supabase.com/dashboard
- Select your project
- Project Settings → General → Reference ID

**Alternative:** Link using project URL
```bash
supabase link --project-ref $(echo $VITE_SUPABASE_URL | sed 's/https:\/\///' | sed 's/\.supabase\.co//')
```

### Step 3: Verify Link

```bash
supabase status
```

---

## 🏠 Local Development

### Start Local Supabase

```bash
# Start all services (Postgres, Auth, Storage, etc.)
supabase start
```

**First run will:**
- Download Docker images (~2-3 GB)
- Start PostgreSQL, PostgREST, GoTrue, Storage, etc.
- Create local database

**Output will include:**
```
API URL: http://localhost:54321
GraphQL URL: http://localhost:54321/graphql/v1
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio URL: http://localhost:54323
Anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Service role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Update Local Environment

Create `.env.local` for local development:

```bash
# .env.local (for local Supabase)
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<anon-key-from-supabase-start>

# Keep other variables from .env
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_POSTHOG_KEY=your_posthog_key
# ... etc
```

### Stop Local Supabase

```bash
supabase stop
```

### Reset Local Database

```bash
# Warning: This deletes all local data
supabase db reset
```

---

## 📦 Migration Management

### Pull Existing Migrations from Remote

```bash
# Download all migrations from remote database
supabase db pull

# This creates migration files in supabase/migrations/
```

### Create New Migration

```bash
# Create a new migration file
supabase migration new <migration_name>

# Example:
supabase migration new add_user_preferences_table
```

This creates: `supabase/migrations/YYYYMMDDHHMMSS_add_user_preferences_table.sql`

### Apply Migrations Locally

```bash
# Apply all pending migrations
supabase db reset

# Or apply specific migration
supabase migration up
```

### Push Migrations to Remote

```bash
# Push local migrations to remote database
supabase db push
```

### Generate Migration from Schema Diff

```bash
# Compare local vs remote and generate migration
supabase db diff -f <migration_name>

# Example:
supabase db diff -f sync_remote_changes
```

---

## ⚡ Edge Functions

### List Edge Functions

```bash
supabase functions list
```

### Serve Edge Functions Locally

```bash
# Serve all functions
supabase functions serve

# Serve specific function
supabase functions serve analyze-lab-results
```

### Deploy Edge Function

```bash
# Deploy specific function
supabase functions deploy analyze-lab-results

# Deploy with environment variables
supabase secrets set OPENAI_API_KEY=your_key
supabase functions deploy analyze-lab-results
```

### View Function Logs

```bash
# View logs for specific function
supabase functions logs analyze-lab-results

# Follow logs in real-time
supabase functions logs analyze-lab-results --follow
```

---

## 🛠️ Common Commands

### Database Commands

```bash
# Open Supabase Studio (GUI)
supabase studio

# Execute SQL query
supabase db execute --sql "SELECT * FROM users LIMIT 10;"

# Dump database schema
supabase db dump --schema public > schema.sql

# Dump database data
supabase db dump --data-only > data.sql
```

### Project Management

```bash
# Check project status
supabase status

# View project details
supabase projects list

# Unlink project
supabase unlink
```

### Secrets Management

```bash
# Set secret for edge functions
supabase secrets set MY_SECRET=value

# List all secrets
supabase secrets list

# Unset secret
supabase secrets unset MY_SECRET
```

---

## 🔧 Troubleshooting

### Issue: "Docker is not running"

**Solution:**
```bash
# Start Docker Desktop
open -a Docker

# Wait for Docker to start, then retry
supabase start
```

### Issue: "Port already in use"

**Solution:**
```bash
# Check what's using the port
lsof -i :54321

# Kill the process or change port in config.toml
```

### Issue: "Migration already applied"

**Solution:**
```bash
# Check migration status
supabase migration list

# Reset database if needed
supabase db reset
```

### Issue: "Cannot connect to remote project"

**Solution:**
```bash
# Re-login
supabase login

# Re-link project
supabase link --project-ref <your-project-ref>
```

### Issue: "Local database out of sync"

**Solution:**
```bash
# Pull latest schema from remote
supabase db pull

# Reset local database
supabase db reset
```

---

## 📚 Workflow Examples

### Workflow 1: Start Fresh Local Development

```bash
# 1. Start Supabase
supabase start

# 2. Apply all migrations
supabase db reset

# 3. Start your app
npm run dev

# 4. Open Studio to view data
supabase studio
```

### Workflow 2: Create and Deploy New Feature

```bash
# 1. Create migration
supabase migration new add_new_feature

# 2. Edit migration file
# supabase/migrations/YYYYMMDDHHMMSS_add_new_feature.sql

# 3. Test locally
supabase db reset

# 4. Push to remote
supabase db push
```

### Workflow 3: Sync Remote Changes Locally

```bash
# 1. Pull remote schema
supabase db pull

# 2. Review generated migration
# Check supabase/migrations/ for new file

# 3. Apply locally
supabase db reset
```

---

## 🎯 Next Steps for ExtensioVitae

### Recommended Actions

1. **Link to Remote Project**
   ```bash
   supabase link --project-ref <your-ref>
   ```

2. **Pull Existing Migrations**
   ```bash
   supabase db pull
   ```
   This will sync your existing migrations from `sql/migrations/` to `supabase/migrations/`

3. **Organize Migration Files**
   - Move existing migrations from `sql/migrations/` to `supabase/migrations/`
   - Ensure proper naming convention: `YYYYMMDDHHMMSS_description.sql`

4. **Set Up Local Development**
   ```bash
   supabase start
   supabase db reset
   ```

5. **Configure Edge Functions**
   - Move `supabase/functions/analyze-lab-results/` to proper structure
   - Test locally with `supabase functions serve`

---

## 📖 Additional Resources

- **Official Docs:** https://supabase.com/docs/guides/cli
- **CLI Reference:** https://supabase.com/docs/reference/cli
- **Local Development:** https://supabase.com/docs/guides/cli/local-development
- **Migration Guide:** https://supabase.com/docs/guides/cli/managing-environments

---

## 🔐 Security Notes

- ✅ Never commit `.env` files with real credentials
- ✅ Use `.env.local` for local development
- ✅ Use Supabase secrets for Edge Function environment variables
- ✅ Keep `service_role` key secure (never expose in frontend)

---

**Ready to start?** Run `supabase link` to connect to your remote project! 🚀
