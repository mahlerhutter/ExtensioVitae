# NOT LIVE - Components & Features

**Date:** 2026-02-05 08:51  
**Production URL:** https://extensiovitae.vercel.app

---

## ❌ NOT LIVE (Temporarily Disabled)

### 1. TrendChart
**File:** `src/components/progress/TrendChart.jsx`  
**Reason:** recharts build issue on Vercel  
**Status:** Component exists, but commented out in DashboardPage.jsx  
**Impact:** Users can't see 7-day recovery trend visualization  
**Fix needed:** Debug why Vercel can't resolve recharts import

### 2. CircadianCard
**File:** `src/components/dashboard/CircadianCard.jsx`  
**Reason:** Vercel cache issue - file exists but Vercel couldn't find it  
**Status:** Component exists, but commented out in DashboardPage.jsx  
**Impact:** Users don't see circadian light recommendations card  
**Fix needed:** Re-enable after Vercel cache clears (24-48h) or force cache clear

---

## ⚠️ PARTIALLY WORKING

### 3. MorningCheckIn - DB Save
**Component:** Working ✅  
**Issue:** `recovery_scores` table doesn't exist in Supabase yet  
**Status:** Modal works, score calculates, but save fails silently  
**Impact:** Users can do check-in, see score, but data isn't persisted  
**Fix needed:** Deploy `sql/migrations/022_recovery_scores.sql` to Supabase

---

## ✅ LIVE & WORKING

1. ✅ ProgressBar (Intake)
2. ✅ OnboardingGuard
3. ✅ StreakCounter
4. ✅ DailyInsight
5. ✅ NextBestAction
6. ✅ MorningCheckIn Modal (UI works, DB save pending)
7. ✅ CircadianWidget
8. ✅ SupplementTimingWidget
9. ✅ BiologicalSuppliesWidget

---

## 📋 TO-DO TO MAKE EVERYTHING LIVE

### Priority 1: Database
```bash
# Deploy recovery_scores table
File: sql/migrations/022_recovery_scores.sql
Action: Run in Supabase SQL Editor
Time: 2 minutes
```

### Priority 2: Re-enable Components
```bash
# After testing, re-enable:
1. TrendChart (debug recharts first)
2. CircadianCard (wait for cache clear or force)
```

---

## 🎯 CURRENT PRODUCTION STATUS

**Working:** 9/11 components (82%)  
**Disabled:** 2/11 components (18%)  
**DB Migration:** Pending

**User Experience:** Good, but missing:
- Recovery trend visualization
- Circadian recommendations card
- Persistent morning check-in data

---

**Last Updated:** 2026-02-05 08:51
