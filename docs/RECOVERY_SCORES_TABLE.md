# Recovery Scores Table - Setup Guide

**Date:** 2026-02-05 08:17  
**Migration:** 022_recovery_scores.sql  
**Status:** Ready to deploy

---

## 📋 TABLE SCHEMA

### recovery_scores

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to auth.users |
| `score` | INTEGER | Total recovery score (0-100) |
| `level` | TEXT | Recovery level (poor/moderate/good/excellent) |
| `sleep_hours` | INTEGER | Sleep duration score (0-40) |
| `sleep_quality` | INTEGER | Sleep quality score (0-30) |
| `feeling` | INTEGER | Subjective feeling score (0-30) |
| `recommendations` | JSONB | Personalized recommendations |
| `recorded_at` | TIMESTAMPTZ | When check-in was recorded |
| `created_at` | TIMESTAMPTZ | Record creation time |
| `updated_at` | TIMESTAMPTZ | Last update time |

---

## 🔒 SECURITY

### Row Level Security (RLS)
- ✅ Enabled
- ✅ Users can only see their own scores
- ✅ Users can only insert their own scores
- ✅ Users can only update same-day scores
- ✅ Users can delete their own scores

### Constraints
- ✅ `score` must be 0-100
- ✅ `level` must be one of: poor, moderate, good, excellent
- ✅ `sleep_hours` must be 0-40
- ✅ `sleep_quality` must be 0-30
- ✅ `feeling` must be 0-30
- ✅ One score per user per day (unique constraint)

---

## 📊 INDEXES

1. `idx_recovery_scores_user_id` - Fast user lookups
2. `idx_recovery_scores_recorded_at` - Fast date range queries
3. `idx_recovery_scores_user_date` - Fast user+date lookups

---

## 🚀 DEPLOYMENT

### Option 1: Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Click **New Query**
5. Copy contents of `sql/migrations/022_recovery_scores.sql`
6. Paste and click **Run**
7. ✅ Table created!

### Option 2: Supabase CLI

```bash
# Navigate to project
cd /Users/mahlerhutter/dev/playground/MVPExtensio

# Run migration
supabase db push sql/migrations/022_recovery_scores.sql
```

### Option 3: psql (Direct)

```bash
# Connect to Supabase DB
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Run migration
\i sql/migrations/022_recovery_scores.sql
```

---

## 🧪 TESTING

### After deployment, test with:

```sql
-- Insert test score
INSERT INTO recovery_scores (
    user_id,
    score,
    level,
    sleep_hours,
    sleep_quality,
    feeling,
    recommendations
) VALUES (
    auth.uid(),
    85,
    'good',
    40,
    30,
    15,
    '[{"category":"sleep","message":"Great sleep!"}]'::jsonb
);

-- Query your scores
SELECT * FROM recovery_scores WHERE user_id = auth.uid();

-- Get today's score
SELECT * FROM recovery_scores 
WHERE user_id = auth.uid() 
AND DATE(recorded_at) = CURRENT_DATE;
```

---

## 📈 EXPECTED DATA

### Example Record

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "score": 85,
  "level": "good",
  "sleep_hours": 40,
  "sleep_quality": 30,
  "feeling": 15,
  "recommendations": [
    {
      "category": "training",
      "priority": "high",
      "message": "Good recovery. Proceed with planned training.",
      "action": "Continue as scheduled"
    }
  ],
  "recorded_at": "2026-02-05T07:30:00Z",
  "created_at": "2026-02-05T07:30:00Z",
  "updated_at": "2026-02-05T07:30:00Z"
}
```

---

## 🔄 INTEGRATION STATUS

### Frontend Components
- ✅ MorningCheckIn.jsx - Saves to recovery_scores
- ✅ TrendChart.jsx - Reads from recovery_tracking (different table)
- ✅ StreakCounter.jsx - Reads from recovery_tracking (different table)

### Backend Services
- ✅ recoveryService.js - saveRecoveryScore() function
- ✅ recoveryService.js - getRecoveryHistory() function
- ✅ recoveryService.js - getTodayRecoveryScore() function

---

## ⚠️ MIGRATION NOTES

### Existing Tables
This migration creates a **new** table: `recovery_scores`

**Note:** There's also a `recovery_tracking` table (migration 021) which is different:
- `recovery_tracking` - Detailed daily tracking (sleep, HRV, etc.)
- `recovery_scores` - Morning check-in scores (3 questions)

Both tables can coexist. They serve different purposes.

---

## 📝 ROLLBACK

If you need to rollback:

```sql
-- Drop table and all related objects
DROP TABLE IF EXISTS recovery_scores CASCADE;
DROP FUNCTION IF EXISTS update_recovery_scores_updated_at CASCADE;
```

---

## ✅ POST-DEPLOYMENT CHECKLIST

After running migration:

- [ ] Table created successfully
- [ ] RLS policies active
- [ ] Indexes created
- [ ] Test insert works
- [ ] Test select works
- [ ] Morning Check-in saves to DB
- [ ] No errors in browser console
- [ ] Toast shows "Recovery Score: XX/100"

---

## 🎯 NEXT STEPS

1. **Deploy migration** to Supabase
2. **Test Morning Check-in** on Dashboard
3. **Verify DB save** (check Supabase table)
4. **Update TrendChart** to use recovery_scores (optional)
5. **Add recovery history view** (future feature)

---

**Migration File:** `sql/migrations/022_recovery_scores.sql`

**Status:** ✅ Ready to deploy

**Deploy now:** Copy SQL to Supabase Dashboard → SQL Editor → Run
