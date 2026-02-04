# Calendar API - Database Migration

**Status:** Ready to run  
**Time:** 2 minutes

---

## 🚀 Quick Migration Steps

### Option 1: Supabase Dashboard (Recommended)

1. **Open Supabase SQL Editor:**
   - Go to your Supabase project
   - Click "SQL Editor" in sidebar
   - Click "New query"

2. **Copy & Paste Migration:**
   - Open: `sql/calendar_integration.sql`
   - Copy entire file content
   - Paste into SQL Editor

3. **Run Migration:**
   - Click "Run" button
   - Wait for success message

4. **Verify Tables Created:**
   - Go to "Table Editor"
   - Check for new tables:
     - ✅ `calendar_connections`
     - ✅ `calendar_events`
     - ✅ `calendar_detections`
     - ✅ `calendar_settings`

---

### Option 2: Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db push

# Or run migration directly
psql $DATABASE_URL < sql/calendar_integration.sql
```

---

## ✅ Verification Queries

After running migration, verify with these queries:

### Check Tables Exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'calendar_%';
```

**Expected Result:** 4 tables

### Check RLS Policies
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename LIKE 'calendar_%';
```

**Expected Result:** 10+ policies

### Check Indexes
```sql
SELECT indexname 
FROM pg_indexes 
WHERE tablename LIKE 'calendar_%';
```

**Expected Result:** 6+ indexes

---

## 🎯 What This Migration Creates

### Tables (4)
1. **calendar_connections** - OAuth tokens
2. **calendar_events** - Synced events
3. **calendar_detections** - Pattern detections
4. **calendar_settings** - User preferences

### RLS Policies (10)
- Users can only access their own data
- Full CRUD permissions for own records
- Admin access (if needed later)

### Indexes (6)
- Fast user lookups
- Efficient date queries
- Optimized joins

### Functions (1)
- `update_updated_at_column()` - Auto-timestamp

---

## 🔐 Security Features

✅ Row Level Security (RLS) enabled  
✅ User isolation (auth.uid() checks)  
✅ Cascade deletes on user removal  
✅ Token encryption at rest (Supabase default)  
✅ Unique constraints prevent duplicates

---

## 🐛 Troubleshooting

### Error: "extension uuid-ossp does not exist"
**Solution:** Run this first:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Error: "relation auth.users does not exist"
**Solution:** You're not running in Supabase. Use local Supabase setup.

### Error: "permission denied"
**Solution:** Make sure you're running as database owner or have CREATE permissions.

---

## 📊 Post-Migration Testing

### Test 1: Insert Test Connection
```sql
INSERT INTO calendar_connections (
  user_id, 
  provider, 
  access_token, 
  refresh_token, 
  expires_at
) VALUES (
  auth.uid(),
  'google',
  'test_access_token',
  'test_refresh_token',
  NOW() + INTERVAL '1 hour'
);
```

### Test 2: Query Your Connection
```sql
SELECT * FROM calendar_connections 
WHERE user_id = auth.uid();
```

### Test 3: Delete Test Data
```sql
DELETE FROM calendar_connections 
WHERE access_token = 'test_access_token';
```

---

## ✅ Migration Checklist

- [ ] Opened Supabase SQL Editor
- [ ] Copied `sql/calendar_integration.sql`
- [ ] Ran migration
- [ ] Verified 4 tables created
- [ ] Verified RLS policies active
- [ ] Tested insert/select/delete
- [ ] Ready for OAuth flow

---

**Status:** ✅ READY TO RUN  
**Time:** 2 minutes  
**Difficulty:** Easy

🎯 **Run the migration and you're ready to test!**
