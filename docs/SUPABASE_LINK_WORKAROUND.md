# Supabase Link Workaround - macOS Permission Issue

## Problem
The `.env.local` file has macOS "Operation not permitted" protection, preventing Supabase CLI from reading it.

## Solution Options

### Option 1: Manual Link (Recommended)

Run this command and enter your database password when prompted:

```bash
cd /Users/mahlerhutter/dev/projekte/MVPExtensio

# Link without reading .env.local
supabase link --project-ref qnjjusilviwvovrlunep
```

**When prompted for database password:**
- Go to Supabase Dashboard → Project Settings → Database
- Copy the database password
- Paste it into the terminal

### Option 2: Remove File Protection

If you want to remove the protection from `.env.local`:

```bash
# Check current permissions
ls -lO .env.local

# Remove the "restricted" flag if present
sudo chflags norestricted .env.local

# Or remove all flags
sudo chflags 0 .env.local

# Then retry link
supabase link --project-ref qnjjusilviwvovrlunep
```

### Option 3: Use Environment Variable

```bash
# Set password as environment variable
export SUPABASE_DB_PASSWORD="your-database-password"

# Link with password from env
supabase link --project-ref qnjjusilviwvovrlunep --password "$SUPABASE_DB_PASSWORD"
```

### Option 4: Skip .env.local Temporarily

```bash
# Create a temporary directory without .env.local
mkdir -p /tmp/supabase-link
cd /tmp/supabase-link

# Initialize and link
supabase init
supabase link --project-ref qnjjusilviwvovrlunep

# Copy config back to project
cp -r .supabase /Users/mahlerhutter/dev/projekte/MVPExtensio/
```

## After Successful Link

Verify the link:

```bash
cd /Users/mahlerhutter/dev/projekte/MVPExtensio
supabase status
```

You should see your project details.

## Next Steps

1. Pull existing migrations:
   ```bash
   supabase db pull
   ```

2. Start local development:
   ```bash
   supabase start
   ```

3. View your database in Studio:
   ```bash
   supabase studio
   ```
