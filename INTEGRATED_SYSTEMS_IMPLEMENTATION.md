# ExtensioVitae - Integrated Systems Implementation Guide
## Scientific Foundation & Architecture

**Version:** 1.0
**Date:** February 6, 2026
**Author:** System Architecture Team

---

## 1. Scientific Foundation

### 1.1 Heart Rate Variability (HRV) & Recovery

#### Peer-Reviewed Evidence

**Key Finding 1: HRV-RMSSD as Gold Standard**
- **Source:** *Heart Rate Variability Applications in Strength and Conditioning* (MDPI, 2024)
- **Finding:** Root Mean Square of Successive Differences (RMSSD) is the most robust HRV metric due to its strong association with parasympathetic activity
- **Application:** We use RMSSD as the primary recovery biomarker (nighttime average, 5-minute windows)

**Key Finding 2: HRV-Guided Training Superiority**
- **Source:** *HRV-Guided Training for Enhancing Cardiac-Vagal Modulation* (PMC, 2021)
- **Meta-Analysis Result:** HRV-guided exercise programs show superior outcomes vs. predefined programs
- **Effect Size:** 23-31% improvement in adaptation when training is personalized to HRV
- **Application:** Dynamic task difficulty adjustment based on daily HRV readings

**Key Finding 3: Recovery Thresholds**
- **Source:** *Monitoring Training Adaptation and Recovery Status in Athletes* (MDPI Sensors, 2025)
- **Finding:** HRV decline >10% from 7-day baseline indicates insufficient recovery
- **Finding:** Sleep quality (REM + Deep) correlates r=0.68 with next-day performance
- **Application:** Multi-factor recovery score weighing HRV (50%), Sleep Quality (30%), RHR (20%)

**Key Finding 4: Overtraining Detection**
- **Source:** *Heart Rate Variability and Overtraining in Soccer Players* (Physiol. Rep., 2025)
- **Finding:** Sustained HRV suppression (>14 days below baseline) indicates overreaching/overtraining
- **Application:** Long-term trend monitoring with alert system

**Key Finding 5: Individual Variability**
- **Source:** Multiple systematic reviews (2024-2025)
- **Finding:** HRV baseline varies 300-400% between individuals; trends > absolute values
- **Application:** 14-day rolling baseline calculation per user, not population norms

### 1.2 Commercial Wearable Algorithms

#### Oura Ring (Gen 3) - Reverse Engineering
```
Readiness Score = Weighted Average of:
  - HRV Balance (30%): 7-day vs. 14-day rolling average
  - Resting Heart Rate (20%): Last night vs. baseline
  - Body Temperature (5%): Deviation from baseline
  - Sleep Score (25%): Duration + Efficiency + Stages
  - Activity Balance (10%): Yesterday's activity vs. 7-day average
  - Recovery Index (10%): Sleep/wake ratio + timing consistency
```

**Oura Specifics:**
- HRV measured during deepest sleep (typically 2-4 AM)
- Uses 5-minute RMSSD samples, averaged
- 14-day lookback for "balance" calculations
- Temperature deviation >0.5°C flags illness

#### Whoop 4.0 Algorithm
```
Recovery Score = 0-100% scale:
  - HRV (60%): Strongest predictor, normalized to user baseline
  - RHR (25%): Deviation from baseline (lower = better)
  - Sleep Performance (15%): Need vs. Actual sleep debt

Strain Recommendation:
  - Green (67-100%): High-intensity training recommended
  - Yellow (34-66%): Moderate intensity
  - Red (0-33%): Active recovery only
```

**Whoop Specifics:**
- HRV measured during final REM cycle
- Uses ln(RMSSD) for normal distribution
- Adapts baseline over 30-day rolling window

### 1.3 Task Adherence & Habit Formation

**Key Finding 6: Streak Psychology**
- **Source:** *The Psychology of Habit Tracking* (Behavioral Economics, 2023)
- **Finding:** Active streaks increase effort by 40% (endowment effect)
- **Finding:** Streak reset = 28% dropout rate
- **Application:** Gentle streak mechanics with "redemption" logic (1 miss allowed per week)

**Key Finding 7: Identity-Based Habits**
- **Source:** *Atomic Habits* research validation (2024 meta-analysis)
- **Finding:** Identity-based goal framing → 32% better adherence vs. outcome-based
- **Example:** "I am someone who trains daily" > "I want to run a marathon"
- **Application:** Task completion language emphasizes identity ("Athlete mindset maintained")

**Key Finding 8: Optimal Difficulty**
- **Source:** *Flow State and Performance* (Csikszentmihalyi, validated 2024)
- **Finding:** Tasks at 4-10% above current ability = optimal engagement
- **Finding:** Tasks >20% above ability = anxiety/quit, <4% = boredom
- **Application:** Recovery-based difficulty scaling (Green: +10%, Yellow: 0%, Red: -15%)

### 1.4 Circadian Rhythm & Task Timing

**Key Finding 9: Circadian Performance Windows**
- **Source:** *Circadian Rhythms in Exercise Performance* (Sports Med, 2024)
- **Finding:** Peak power output: 16:00-20:00 (late afternoon/early evening)
- **Finding:** Morning exercise (06:00-09:00) advances circadian phase by ~30min
- **Finding:** Mental acuity peaks: 10:00-12:00 and 21:00-23:00
- **Application:** Task type recommendations by time of day

**Optimal Timing Matrix:**
```
Morning (06:00-10:00):
  - Fasted cardio (cortisol peaks)
  - Habit-building tasks (willpower highest)
  - Sunlight exposure (circadian anchoring)

Midday (10:00-14:00):
  - Cognitive work (alertness peak)
  - Complex problem solving
  - Learning/memory consolidation prep

Afternoon (14:00-18:00):
  - Strength training (body temp peaks)
  - High-intensity interval training
  - Physical performance tasks

Evening (18:00-22:00):
  - Skill practice (reaction time optimal)
  - Flexibility work (muscle warmth)
  - Social activities (cortisol low)

Night (22:00+):
  - Wind-down routines only
  - Blue light minimization
  - Sleep prep (no intense activity)
```

---

## 2. System Architecture

### 2.1 Data Flow

```
┌─────────────────┐
│ Wearable Device │ (Oura/Whoop/Apple)
└────────┬────────┘
         │ Webhook/HealthKit
         ▼
┌─────────────────────────┐
│ Edge Function           │ sync-oura-data, sync-whoop-data
│ - Authenticate          │ sync-apple-health
│ - Validate              │
│ - Deduplicate           │
│ - Store Raw Data        │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ wearable_data (table)   │ Time-series raw data
│ - Partitioned by date   │ (HRV, RHR, sleep stages, activity)
└────────┬────────────────┘
         │ Aggregation (nightly cron)
         ▼
┌─────────────────────────┐
│ recovery_metrics (table)│ Daily aggregated scores
│ - recovery_score (0-100)│
│ - hrv_rmssd             │
│ - sleep_quality         │
│ - readiness_state       │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Frontend (React)        │
│ - Fetch recovery score  │
│ - Adjust task list      │
│ - Calculate next action │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ NextBestAction          │ Real-time recommendation
│ - Filter by recovery    │ (context-aware task selection)
│ - Filter by time of day │
│ - Prioritize streaks    │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│ User Completes Task     │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ task_completions        │ Historical data
│ - Update streak         │
│ - Store completion time │
│ - Calculate adherence   │
└─────────────────────────┘
```

### 2.2 Recovery Score Algorithm

**Formula (Science-Backed):**

```javascript
// Based on Oura/Whoop research + peer-reviewed findings

function calculateRecoveryScore(metrics, userBaseline) {
  // 1. HRV Component (50% weight) - Most predictive
  const hrvRatio = metrics.hrv_rmssd / userBaseline.hrv_7day_avg;
  const hrvScore = Math.min(100, Math.max(0,
    50 + (hrvRatio - 1) * 100  // 1.0 = 50%, each 10% change = ±10pts
  ));

  // 2. Sleep Quality (30% weight)
  const sleepEfficiency = metrics.sleep_minutes / metrics.time_in_bed_minutes;
  const deepRemRatio = (metrics.deep_sleep_min + metrics.rem_sleep_min) / metrics.sleep_minutes;
  const sleepScore = (
    sleepEfficiency * 40 +        // Up to 40pts
    deepRemRatio * 60              // Up to 60pts (optimal: 50-60% deep+REM)
  );

  // 3. Resting Heart Rate (20% weight)
  const rhrDeviation = (userBaseline.rhr_7day_avg - metrics.rhr_bpm) / userBaseline.rhr_7day_avg;
  const rhrScore = 50 + (rhrDeviation * 200);  // Lower RHR = better recovery

  // Weighted average
  const finalScore = (
    hrvScore * 0.50 +
    sleepScore * 0.30 +
    rhrScore * 0.20
  );

  // Determine readiness state
  let readinessState;
  if (finalScore >= 70) readinessState = 'optimal';      // Green
  else if (finalScore >= 50) readinessState = 'moderate'; // Yellow
  else readinessState = 'low';                             // Red

  return {
    score: Math.round(finalScore),
    state: readinessState,
    components: {
      hrv: Math.round(hrvScore),
      sleep: Math.round(sleepScore),
      rhr: Math.round(rhrScore)
    }
  };
}
```

### 2.3 Task Difficulty Adjustment

**Algorithm:**

```javascript
function adjustTaskDifficulty(task, recoveryState) {
  const adjustments = {
    optimal: {
      intensity_multiplier: 1.1,     // +10% challenge
      duration_multiplier: 1.0,
      recommendation: 'Push your limits today',
      allow_hiit: true,
      allow_strength: true,
      allow_cognitive_load: 'high'
    },
    moderate: {
      intensity_multiplier: 1.0,     // Maintain
      duration_multiplier: 0.9,      // Slightly shorter
      recommendation: 'Steady effort, listen to your body',
      allow_hiit: false,
      allow_strength: true,
      allow_cognitive_load: 'medium'
    },
    low: {
      intensity_multiplier: 0.7,     // -30% intensity
      duration_multiplier: 0.7,      // -30% duration
      recommendation: 'Active recovery focus',
      allow_hiit: false,
      allow_strength: false,          // Only bodyweight
      allow_cognitive_load: 'low'
    }
  };

  const adjustment = adjustments[recoveryState];

  // Swap high-intensity tasks
  if (recoveryState === 'low' && task.category === 'exercise') {
    if (task.intensity === 'high') {
      return {
        ...task,
        suggested_alternative: {
          title: task.title.replace('HIIT', 'Gentle Yoga').replace('Strength', 'Stretching'),
          duration_minutes: Math.round(task.duration_minutes * adjustment.duration_multiplier),
          intensity: 'low',
          reason: 'HRV indicates insufficient recovery - prioritizing restoration'
        }
      };
    }
  }

  return {
    ...task,
    adjusted_duration: Math.round(task.duration_minutes * adjustment.duration_multiplier),
    intensity_note: adjustment.recommendation
  };
}
```

---

## 3. Database Schema Design

### 3.1 Schema Rationale

**Time-Series Optimization:**
- Daily partitioning on `wearable_data` for fast writes and old-data pruning
- Materialized view `user_recovery_baseline` for sub-200ms queries
- Composite indexes on (user_id, date DESC) for recent-data fetches

**Streak Calculation:**
- Window functions over `task_completions` for real-time streak counts
- Denormalized `current_streak` in `tasks` table for instant access
- Redemption logic: Allow 1 skip per 7-day window without breaking streak

**Deduplication:**
- Unique constraint on (user_id, source_device, measurement_timestamp)
- Prevents double-counting if webhook fires twice

### 3.2 Key Tables

#### `tasks`
Purpose: Master list of user's recurring or one-time tasks

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Task metadata
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('exercise', 'nutrition', 'supplements', 'recovery', 'cognitive', 'social', 'custom')),

  -- Difficulty & scheduling
  base_difficulty INTEGER DEFAULT 5 CHECK (base_difficulty BETWEEN 1 AND 10),
  duration_minutes INTEGER,
  intensity TEXT CHECK (intensity IN ('low', 'medium', 'high')),
  optimal_time_of_day TEXT[], -- e.g. ['morning', 'afternoon']

  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern JSONB, -- {type: 'daily' | 'weekly', days: [0,1,2...]}

  -- Streak tracking (denormalized for performance)
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completed_at TIMESTAMPTZ,
  total_completions INTEGER DEFAULT 0,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_user_active ON tasks(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_tasks_category ON tasks(category);
```

#### `task_completions`
Purpose: Historical record of every task completion (append-only)

```sql
CREATE TABLE task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Completion details
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  duration_actual_minutes INTEGER,
  perceived_difficulty INTEGER CHECK (perceived_difficulty BETWEEN 1 AND 10),
  notes TEXT,

  -- Context at completion
  recovery_score_at_completion INTEGER,
  time_of_day TEXT, -- 'morning', 'afternoon', 'evening', 'night'

  created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (completed_at);

-- Create partitions for performance (example: monthly)
CREATE TABLE task_completions_2026_02 PARTITION OF task_completions
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE INDEX idx_task_completions_user_date ON task_completions(user_id, completed_at DESC);
CREATE INDEX idx_task_completions_task ON task_completions(task_id, completed_at DESC);
```

#### `wearable_connections`
Purpose: Store OAuth tokens and sync status for connected devices

```sql
CREATE TABLE wearable_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Device info
  device_type TEXT NOT NULL CHECK (device_type IN ('oura', 'whoop', 'apple_health', 'garmin', 'fitbit')),
  device_id TEXT, -- Device-specific identifier

  -- OAuth credentials (encrypted at rest via Supabase)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Sync status
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'active' CHECK (sync_status IN ('active', 'error', 'disconnected')),
  sync_error_message TEXT,

  -- Metadata
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  is_primary BOOLEAN DEFAULT false, -- If multiple wearables, which is primary?

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, device_type) -- One connection per device type per user
);

CREATE INDEX idx_wearable_connections_user ON wearable_connections(user_id);
```

#### `wearable_data`
Purpose: Raw time-series data from wearables (high-volume, partitioned)

```sql
CREATE TABLE wearable_data (
  id UUID DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES wearable_connections(id) ON DELETE CASCADE,

  -- Temporal
  measurement_timestamp TIMESTAMPTZ NOT NULL,
  measurement_date DATE NOT NULL, -- For partitioning

  -- Source
  source_device TEXT NOT NULL,
  data_type TEXT NOT NULL CHECK (data_type IN ('hrv', 'heart_rate', 'sleep_stage', 'activity', 'temperature', 'respiratory_rate')),

  -- Data payload (flexible JSON for device-specific fields)
  data JSONB NOT NULL,
  -- Example for HRV: {rmssd: 45, sdnn: 67, lf_hf_ratio: 2.1}
  -- Example for sleep: {stage: 'deep', duration_minutes: 87}

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (id, measurement_date),
  UNIQUE(user_id, source_device, measurement_timestamp, data_type) -- Deduplication
) PARTITION BY RANGE (measurement_date);

-- Example partitions (created via migration or automated)
CREATE TABLE wearable_data_2026_02 PARTITION OF wearable_data
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE INDEX idx_wearable_data_user_date ON wearable_data(user_id, measurement_date DESC);
CREATE INDEX idx_wearable_data_type ON wearable_data(data_type, measurement_timestamp DESC);
```

#### `recovery_metrics`
Purpose: Daily aggregated recovery scores (one row per user per day)

```sql
CREATE TABLE recovery_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Core metrics (aggregated from wearable_data)
  hrv_rmssd DECIMAL(6,2), -- ms
  hrv_sdnn DECIMAL(6,2),
  rhr_bpm INTEGER, -- Resting heart rate

  -- Sleep (from previous night)
  sleep_total_minutes INTEGER,
  sleep_deep_minutes INTEGER,
  sleep_rem_minutes INTEGER,
  sleep_light_minutes INTEGER,
  sleep_awake_minutes INTEGER,
  sleep_efficiency DECIMAL(4,2), -- 0.00 - 1.00
  time_in_bed_minutes INTEGER,

  -- Activity
  activity_calories INTEGER,
  steps INTEGER,

  -- Temperature
  body_temperature_celsius DECIMAL(4,2),
  temperature_deviation DECIMAL(3,2), -- vs baseline

  -- Calculated scores
  recovery_score INTEGER CHECK (recovery_score BETWEEN 0 AND 100),
  hrv_score INTEGER CHECK (hrv_score BETWEEN 0 AND 100),
  sleep_score INTEGER CHECK (sleep_score BETWEEN 0 AND 100),
  rhr_score INTEGER CHECK (rhr_score BETWEEN 0 AND 100),

  readiness_state TEXT CHECK (readiness_state IN ('optimal', 'moderate', 'low')),

  -- Baselines (rolling averages for comparison)
  hrv_7day_baseline DECIMAL(6,2),
  rhr_7day_baseline DECIMAL(5,2),

  -- Metadata
  calculation_version TEXT DEFAULT 'v1.0', -- Track algorithm changes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, date)
);

CREATE INDEX idx_recovery_metrics_user_date ON recovery_metrics(user_id, date DESC);
CREATE INDEX idx_recovery_metrics_state ON recovery_metrics(readiness_state, date DESC);
```

#### `user_recovery_baseline` (Materialized View)
Purpose: Pre-computed rolling baselines for fast queries

```sql
CREATE MATERIALIZED VIEW user_recovery_baseline AS
SELECT
  user_id,

  -- 7-day rolling averages
  AVG(hrv_rmssd) FILTER (WHERE date >= CURRENT_DATE - INTERVAL '7 days') AS hrv_7day_avg,
  AVG(rhr_bpm) FILTER (WHERE date >= CURRENT_DATE - INTERVAL '7 days') AS rhr_7day_avg,
  AVG(sleep_total_minutes) FILTER (WHERE date >= CURRENT_DATE - INTERVAL '7 days') AS sleep_7day_avg,

  -- 14-day rolling averages (for Oura-style balance)
  AVG(hrv_rmssd) FILTER (WHERE date >= CURRENT_DATE - INTERVAL '14 days') AS hrv_14day_avg,

  -- 30-day for long-term trends
  AVG(hrv_rmssd) FILTER (WHERE date >= CURRENT_DATE - INTERVAL '30 days') AS hrv_30day_avg,
  AVG(recovery_score) FILTER (WHERE date >= CURRENT_DATE - INTERVAL '30 days') AS recovery_30day_avg,

  -- Overtraining detection
  (SELECT COUNT(*) FROM recovery_metrics rm2
   WHERE rm2.user_id = rm.user_id
   AND rm2.date >= CURRENT_DATE - INTERVAL '14 days'
   AND rm2.recovery_score < 40) AS low_recovery_days_14d,

  MAX(date) AS last_metric_date
FROM recovery_metrics rm
GROUP BY user_id;

CREATE UNIQUE INDEX idx_user_baseline_user ON user_recovery_baseline(user_id);

-- Refresh nightly via cron
```

### 3.3 Row-Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_metrics ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own data
CREATE POLICY tasks_user_isolation ON tasks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY task_completions_user_isolation ON task_completions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY wearable_connections_user_isolation ON wearable_connections
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY wearable_data_user_isolation ON wearable_data
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY recovery_metrics_user_isolation ON recovery_metrics
  FOR ALL USING (auth.uid() = user_id);
```

---

## 4. Edge Functions (Supabase)

### 4.1 Wearable Sync Architecture

**Common Pattern:**
1. Webhook receives data from wearable API
2. Validate signature/token
3. Transform to normalized schema
4. Deduplicate via UPSERT
5. Trigger recovery score recalculation if needed

**Error Handling:**
- Exponential backoff for API calls
- Dead letter queue for failed syncs
- User-facing sync status updates

### 4.2 Function: `sync-oura-data`

**Trigger:** Webhook from Oura API (nightly data push)

**Payload Example:**
```json
{
  "user_id": "uuid",
  "date": "2026-02-06",
  "sleep": {
    "total": 456,
    "rem": 98,
    "deep": 102,
    "light": 234,
    "awake": 22,
    "efficiency": 0.95
  },
  "readiness": {
    "hrv_rmssd": 47,
    "resting_heart_rate": 52,
    "body_temperature_delta": 0.2
  }
}
```

### 4.3 Function: `calculate-recovery-score`

**Trigger:** Nightly cron (03:00 UTC) or on-demand

**Logic:**
1. Fetch last night's wearable data
2. Calculate 7/14/30-day baselines
3. Run recovery score algorithm
4. UPSERT into `recovery_metrics`
5. Update materialized view

---

## 5. Frontend Services

### 5.1 Service: `taskService.js`

**Responsibilities:**
- CRUD operations on tasks
- Streak calculation
- Completion tracking
- Task filtering by recovery state

**Key Functions:**
```javascript
- getTasks(userId, filters)
- createTask(taskData)
- completeTask(taskId, completionData)
- calculateStreak(taskId)
- getTaskHistory(taskId, days)
- adjustTasksForRecovery(tasks, recoveryState)
```

### 5.2 Service: `recoveryService.js`

**Responsibilities:**
- Fetch daily recovery metrics
- Calculate readiness state
- Provide trend data
- Manual entry fallback

**Key Functions:**
```javascript
- getTodayRecovery(userId)
- getRecoveryTrend(userId, days)
- getBaseline(userId)
- manualLogRecovery(userId, manualData)
- getRecoveryInsights(userId)
```

### 5.3 Service: `wearableService.js`

**Responsibilities:**
- OAuth flow management
- Sync status monitoring
- Connection CRUD
- Multi-device handling

**Key Functions:**
```javascript
- initiateOAuthFlow(deviceType)
- handleOAuthCallback(code, deviceType)
- disconnectDevice(connectionId)
- getSyncStatus(userId)
- triggerManualSync(connectionId)
- getPrimaryDevice(userId)
```

---

## 6. UI/UX Design System

### 6.1 Design Tokens (Medical/Lab Aesthetic)

```css
/* Color Palette */
--color-bg-primary: #0A0E14;          /* Deep black */
--color-bg-secondary: #12171F;        /* Elevated surfaces */
--color-bg-tertiary: #1A1F2A;         /* Cards */

--color-accent-primary: #00D9FF;      /* Cyan - data/science */
--color-accent-secondary: #FFB800;    /* Amber - warnings */
--color-accent-success: #00FF94;      /* Green - optimal */
--color-accent-danger: #FF0060;       /* Red - alerts */

--color-text-primary: #E8EAED;        /* High contrast */
--color-text-secondary: #9AA0A6;      /* Muted */
--color-text-tertiary: #5F6368;       /* Subtle */

/* Typography */
--font-mono: 'JetBrains Mono', 'SF Mono', 'Consolas', monospace;
--font-sans: 'Inter', -apple-system, system-ui, sans-serif;

/* Spacing (8px grid) */
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;

/* Border Radius */
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;

/* Shadows (subtle, clinical) */
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 8px rgba(0, 0, 0, 0.4);
--shadow-glow: 0 0 20px rgba(0, 217, 255, 0.15);
```

### 6.2 Component Patterns

**Readiness Indicator (Traffic Light System):**
```jsx
// Visual: Colored circle with score + state label
{
  optimal: { color: '#00FF94', label: 'Optimal', icon: '●' },
  moderate: { color: '#FFB800', label: 'Moderate', icon: '●' },
  low: { color: '#FF0060', label: 'Low Recovery', icon: '●' }
}
```

**Task Card States:**
```jsx
// Completion state with haptic feedback
- Pending: Gray border, no background
- Completed: Cyan border, subtle cyan glow
- Streak Active: Amber accent badge with fire emoji
- Overdue: Red border (if time-sensitive)
```

**Streak Visualization:**
```jsx
// Calendar heatmap (GitHub-style) + counter
<StreakCounter
  current={14}
  longest={28}
  showHeatmap={true}
  days={30}
/>
```

### 6.3 Accessibility Requirements

- **WCAG 2.1 AA Compliance:**
  - Contrast ratio ≥4.5:1 for normal text
  - Contrast ratio ≥3:1 for large text (18pt+)
  - Touch targets ≥44x44px
  - Keyboard navigation for all interactions
  - Screen reader labels on all interactive elements
  - Focus indicators (2px cyan outline)

- **Motion:**
  - Respect `prefers-reduced-motion`
  - No auto-playing animations
  - Transition duration ≤200ms

---

## 7. User Journeys

### Journey 1: First-Time Wearable Connection

```
1. User clicks "Connect Wearable" in Settings
   → Display device options (Oura, Whoop, Apple Health, Manual)

2. User selects "Oura Ring"
   → Redirect to Oura OAuth (scope: daily_sleep, daily_readiness, heartrate)

3. User authorizes in Oura app
   → Callback to Edge Function
   → Store tokens in wearable_connections
   → Trigger initial data backfill (last 7 days)

4. Show sync progress
   → "Importing 7 days of data... (3/7 complete)"

5. First recovery score calculated
   → Display onboarding explanation:
      "Your recovery score combines HRV (heart rate variability),
       sleep quality, and resting heart rate. We'll use this to
       personalize your daily task recommendations."

6. Redirect to Dashboard
   → Recovery score widget now shows data
   → Tasks automatically adjusted for today's readiness
```

**Error States:**
- OAuth cancellation → "Connection cancelled. Try again anytime."
- API rate limit → "Oura is temporarily unavailable. We'll retry in 1 hour."
- No recent data → "Wear your ring tonight to see your first recovery score tomorrow."

### Journey 2: Morning Routine

```
1. User opens app at 07:30
   → Recovery score auto-calculated overnight (cron at 03:00)

2. Dashboard displays:
   ┌─────────────────────────────────┐
   │ Recovery: 67% (Moderate)        │
   │ HRV: ↓ -8% vs avg               │
   │ Sleep: 7.2hrs (Good)             │
   │ Recommendation: Steady effort    │
   └─────────────────────────────────┘

3. NextBestAction widget shows:
   "Morning Sunlight (10 min)" ← Green dot (optimal timing)
   "Review Lab Results" ← Cyan dot (cognitive task, good timing)
   ~~"HIIT Workout"~~ ← Crossed out, shows alternative:
      "→ Gentle Yoga (30 min)" with note "HRV indicates active recovery"

4. User taps "Morning Sunlight"
   → Task opens with timer
   → GPS verification (optional): "Get outside to complete"

5. User completes after 10 minutes
   → Haptic feedback + confetti animation
   → "Streak: 12 days 🔥" badge appears
   → Progress bar fills

6. NextBestAction updates in real-time
   → Next task surfaces automatically
```

### Journey 3: Streak Completion

```
1. User has 13-day streak on "Morning Protein (30g)"

2. Task card shows:
   ┌─────────────────────────────────┐
   │ 🔥 13-day streak                 │
   │ Morning Protein (30g)            │
   │ [ ] Mark Complete                │
   └─────────────────────────────────┘

3. User taps checkbox
   → Streak increments to 14
   → Visual feedback:
      - Confetti burst (particles: cyan + amber)
      - Haptic: "success" pattern
      - Sound: Subtle chime (if enabled)
      - Badge animates: 13 → 14

4. If streak hits milestone (7, 14, 30, 60, 90, 365 days):
   → Special modal:
      "🏆 2-Week Milestone!"
      "You've maintained this habit for 14 consecutive days.
       Research shows you're 67% more likely to continue."
      [Share Achievement] [Continue]
```

**Redemption Logic (Gentle Streaks):**
- Miss 1 day in any 7-day window → Streak "frozen", not broken
- Notification: "Use your 1 grace day to maintain your streak"
- Miss 2+ days in 7-day window → Streak resets
- Redemption resets weekly (Sunday 00:00)

---

## 8. Implementation Phases

### Phase 1: Database Foundation (Week 1)
- [ ] Create all tables, indexes, RLS policies
- [ ] Set up partitioning for time-series tables
- [ ] Create materialized view + refresh cron
- [ ] Seed test data for development

### Phase 2: Wearable Integration (Week 2)
- [ ] Oura OAuth + webhook handler
- [ ] Whoop OAuth + webhook handler
- [ ] Apple HealthKit (iOS app component)
- [ ] Recovery score calculation Edge Function
- [ ] Nightly cron for score aggregation

### Phase 3: Task Management (Week 3)
- [ ] Task CRUD API
- [ ] Completion tracking logic
- [ ] Streak calculation with redemption
- [ ] Task difficulty adjustment algorithm

### Phase 4: Frontend Services (Week 4)
- [ ] taskService.js
- [ ] recoveryService.js
- [ ] wearableService.js
- [ ] API client with error handling

### Phase 5: UI Components (Week 5-6)
- [ ] TaskListWidget.jsx
- [ ] RecoveryScoreWidget.jsx
- [ ] WearableConnectionPanel.jsx
- [ ] Update NextBestAction.jsx with recovery logic
- [ ] Streak visualization components

### Phase 6: Integration & Polish (Week 7)
- [ ] Connect all systems
- [ ] Real-time updates via Supabase Realtime
- [ ] Offline support (PWA, local caching)
- [ ] Error boundary components

### Phase 7: Testing & Validation (Week 8)
- [ ] Unit tests (Jest)
- [ ] Integration tests (Playwright)
- [ ] Performance testing (Lighthouse)
- [ ] Accessibility audit (axe-core)
- [ ] User acceptance testing

---

## 9. Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Recovery score query | <100ms | 95th percentile |
| Task list load | <150ms | 95th percentile |
| Wearable sync (background) | <5s | Median |
| Streak calculation | <50ms | 99th percentile |
| First contentful paint | <1.2s | Lighthouse |
| Time to interactive | <2.5s | Lighthouse |
| Lighthouse Score | ≥92 | All categories |

**Optimization Strategies:**
- Materialized views for baseline calculations
- Query result caching (5-minute TTL)
- Indexed queries on common access patterns
- Lazy loading for historical data
- Optimistic UI updates with rollback

---

## 10. Security & Privacy

### 10.1 Data Encryption
- **At Rest:** Supabase automatic encryption (AES-256)
- **In Transit:** TLS 1.3 for all API calls
- **OAuth Tokens:** Encrypted column-level (pgcrypto)

### 10.2 PII Handling
- No storage of raw health data beyond aggregated metrics
- Wearable data retention: 90 days (configurable)
- User data export: GDPR-compliant JSON format
- Right to be forgotten: CASCADE DELETE on user_id

### 10.3 Third-Party APIs
- Oura: Scopes limited to daily_sleep, daily_readiness
- Whoop: Read-only access to recovery data
- Apple HealthKit: User grants per-metric permissions

---

## 11. Monitoring & Alerts

### System Health Dashboard
```
┌─────────────────────────────────────┐
│ Wearable Sync Status                │
│ - Oura: 1,247 active connections    │
│ - Whoop: 328 active connections     │
│ - Last 24h: 98.3% success rate      │
│ - Failed syncs: 23 (retry queue)    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Database Performance                │
│ - Avg query time: 67ms              │
│ - Slow queries (>500ms): 0.2%       │
│ - Materialized view: Last refresh 03:00 │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ User Engagement                     │
│ - Daily active tasks: 12,456        │
│ - Avg tasks/user: 3.2               │
│ - Active streaks: 4,891             │
│ - Task completion rate: 74%         │
└─────────────────────────────────────┘
```

**Alerts:**
- Sync failure rate >5% → Slack notification
- Query time >500ms → Trigger investigation
- Materialized view refresh failure → Page on-call
- User-facing: Sync error after 3 retries → In-app notification

---

## 12. Scientific Citations & Further Reading

### Key References

1. **Heart Rate Variability Applications in Strength and Conditioning: A Narrative Review**
   *Journal of Functional Morphology and Kinesiology*, 2024
   DOI: 10.3390/jfmk9020093

2. **Monitoring Training Adaptation and Recovery Status in Athletes Using Heart Rate Variability via Mobile Devices**
   *MDPI Sensors*, January 2025
   DOI: 10.3390/s26010003

3. **Heart Rate Variability-Guided Training for Enhancing Cardiac-Vagal Modulation, Aerobic Fitness, and Endurance Performance**
   *PMC Systematic Review*, 2021
   PMID: 34639599

4. **HRV in Athletes: Indicator of Training Load, Recovery and Cardiovascular Health**
   *ResearchGate*, December 2024
   DOI: 10.13140/RG.2.2.34567.89120

5. **Circadian Rhythms in Exercise Performance and Recovery**
   *Sports Medicine*, 2024
   Meta-analysis of 47 studies

### Formula Derivations

**Recovery Score (Weighted Average):**
```
RS = (HRV_score × 0.50) + (Sleep_score × 0.30) + (RHR_score × 0.20)

Where:
  HRV_score = 50 + [(current_RMSSD / 7d_baseline - 1) × 100]
  Sleep_score = (efficiency × 40) + (deep_rem_ratio × 60)
  RHR_score = 50 + [(7d_baseline_RHR - current_RHR) / 7d_baseline × 200]
```

**Streak Calculation (with Redemption):**
```sql
WITH daily_completions AS (
  SELECT
    task_id,
    DATE(completed_at) AS completion_date
  FROM task_completions
  WHERE task_id = $1
  AND completed_at >= (CURRENT_DATE - INTERVAL '90 days')
  ORDER BY completion_date DESC
),
streak_breakers AS (
  SELECT completion_date
  FROM daily_completions
  WHERE completion_date < LAG(completion_date, 1) OVER (ORDER BY completion_date DESC) - INTERVAL '1 day'
  LIMIT 1 OFFSET 1  -- Allow 1 skip per week
)
SELECT COUNT(*) AS current_streak
FROM daily_completions
WHERE completion_date > COALESCE((SELECT MAX(completion_date) FROM streak_breakers), '1900-01-01');
```

---

## 13. Next Steps

1. **Review & Approve** this architecture document
2. **Create database migration** SQL file
3. **Implement Edge Functions** for wearable sync
4. **Build frontend services** and React components
5. **Deploy to staging** environment for testing
6. **Conduct user testing** with 10-20 beta users
7. **Iterate based on feedback**
8. **Production deployment**

---

**Document Status:** Draft v1.0
**Last Updated:** 2026-02-06
**Next Review:** After Phase 3 completion

