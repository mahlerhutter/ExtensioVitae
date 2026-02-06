# ExtensioVitae - Deployment & Integration Guide

**Complete System Integration: Task Management, Recovery Tracking & Wearable Integration**

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Edge Functions Deployment](#edge-functions-deployment)
4. [Frontend Integration](#frontend-integration)
5. [OAuth Configuration](#oauth-configuration)
6. [Testing Checklist](#testing-checklist)
7. [Monitoring & Alerts](#monitoring--alerts)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts
- ✅ Supabase project (with database access)
- ✅ Oura API developer account (https://cloud.ouraring.com/oauth/applications)
- ✅ Whoop API developer account (https://developer.whoop.com)
- ✅ Apple Developer account (for HealthKit, if implementing iOS)

### Required Tools
- ✅ Node.js 18+ and npm
- ✅ Supabase CLI (`npm install -g supabase`)
- ✅ Git

### Environment Variables

Create `.env.local` with:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# OAuth Credentials (Frontend)
VITE_OURA_CLIENT_ID=your-oura-client-id
VITE_WHOOP_CLIENT_ID=your-whoop-client-id

# Edge Function Secrets (Set via Supabase CLI)
OURA_CLIENT_SECRET=your-oura-secret
WHOOP_CLIENT_SECRET=your-whoop-secret
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Database Setup

### Step 1: Run Migration

```bash
# Connect to your Supabase project
supabase link --project-ref your-project-ref

# Run the migration
supabase db push 20260206_integrated_systems.sql
```

**Or manually via Supabase Dashboard:**
1. Go to SQL Editor
2. Copy contents of `20260206_integrated_systems.sql`
3. Run the migration
4. Verify tables created successfully

### Step 2: Create Refresh Function

Run this SQL to enable materialized view refresh:

```sql
CREATE OR REPLACE FUNCTION refresh_materialized_view_user_recovery_baseline()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_recovery_baseline;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Step 3: Set Up Cron Job

In Supabase Dashboard → Database → Cron Jobs:

```sql
SELECT cron.schedule(
  'refresh-recovery-baselines',
  '0 3 * * *', -- Daily at 3 AM UTC
  $$
  SELECT refresh_materialized_view_user_recovery_baseline();
  $$
);
```

### Step 4: Verify Database

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('tasks', 'task_completions', 'wearable_connections', 'wearable_data', 'recovery_metrics');

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE '%task%' OR tablename LIKE '%wearable%' OR tablename LIKE '%recovery%';

-- Check indexes
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('tasks', 'recovery_metrics', 'wearable_data')
ORDER BY tablename;
```

---

## Edge Functions Deployment

### Step 1: Create Function Directories

```bash
mkdir -p supabase/functions/sync-oura-data
mkdir -p supabase/functions/sync-whoop-data
mkdir -p supabase/functions/sync-apple-health
mkdir -p supabase/functions/calculate-recovery-score
mkdir -p supabase/functions/refresh-baselines
mkdir -p supabase/functions/oauth-callback
```

### Step 2: Add Function Code

Copy the TypeScript code from `EDGE_FUNCTIONS.md` into each respective `index.ts` file.

Example structure:
```
supabase/
  functions/
    sync-oura-data/
      index.ts
    sync-whoop-data/
      index.ts
    calculate-recovery-score/
      index.ts
    ...
```

### Step 3: Deploy Functions

```bash
# Deploy all functions
supabase functions deploy sync-oura-data
supabase functions deploy sync-whoop-data
supabase functions deploy sync-apple-health
supabase functions deploy calculate-recovery-score
supabase functions deploy refresh-baselines
supabase functions deploy oauth-callback

# Or deploy all at once
supabase functions deploy --no-verify-jwt
```

### Step 4: Set Secrets

```bash
# Set OAuth secrets
supabase secrets set OURA_CLIENT_ID=your-oura-client-id
supabase secrets set OURA_CLIENT_SECRET=your-oura-client-secret
supabase secrets set WHOOP_CLIENT_ID=your-whoop-client-id
supabase secrets set WHOOP_CLIENT_SECRET=your-whoop-client-secret

# Verify secrets
supabase secrets list
```

### Step 5: Configure Webhooks

#### Oura Webhook
1. Go to https://cloud.ouraring.com/oauth/applications
2. Select your application
3. Add webhook URL: `https://your-project.supabase.co/functions/v1/sync-oura-data`
4. Subscribe to events: `daily_sleep`, `daily_readiness`, `daily_activity`

#### Whoop Webhook
1. Go to https://developer.whoop.com
2. Configure webhook URL: `https://your-project.supabase.co/functions/v1/sync-whoop-data`
3. Subscribe to: `recovery.updated`, `sleep.updated`, `workout.created`

---

## Frontend Integration

### Step 1: Install Dependencies

```bash
npm install @supabase/supabase-js lucide-react recharts
```

### Step 2: Create Service Files

Create service files in `src/services/`:

```bash
mkdir -p src/services
touch src/services/taskService.js
touch src/services/recoveryService.js
touch src/services/wearableService.js
touch src/services/errorHandler.js
```

Copy code from `FRONTEND_SERVICES.md`.

### Step 3: Create Components

Create components in `src/components/dashboard/`:

```bash
mkdir -p src/components/dashboard
touch src/components/dashboard/TaskListWidget.jsx
touch src/components/dashboard/RecoveryScoreWidget.jsx
touch src/components/dashboard/WearableConnectionPanel.jsx
```

Copy code from `REACT_COMPONENTS.md`.

### Step 4: Update Dashboard

Integrate components into your main Dashboard page:

```jsx
// src/pages/Dashboard.jsx
import NextBestAction from '../components/dashboard/NextBestAction'
import RecoveryScoreWidget from '../components/dashboard/RecoveryScoreWidget'
import TaskListWidget from '../components/dashboard/TaskListWidget'
import WearableConnectionPanel from '../components/dashboard/WearableConnectionPanel'

export const Dashboard = () => {
  return (
    <div className="min-h-screen bg-[#0A0E14] p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <NextBestAction />
          <TaskListWidget />
        </div>
        <div className="space-y-6">
          <RecoveryScoreWidget />
          <WearableConnectionPanel />
        </div>
      </div>
    </div>
  )
}
```

### Step 5: Add Styles

Add component styles from `REACT_COMPONENTS.md` to your global CSS or Tailwind config.

### Step 6: Configure OAuth Callback Route

Create callback handler for OAuth flows:

```jsx
// src/pages/auth/OAuthCallback.jsx
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { wearableService } from '../../services/wearableService'

export const OAuthCallback = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const state = searchParams.get('state')

      try {
        await wearableService.handleOAuthCallback(code, state)
        navigate('/dashboard', { state: { message: 'Device connected successfully!' } })
      } catch (error) {
        navigate('/dashboard', { state: { error: 'Failed to connect device' } })
      }
    }

    handleCallback()
  }, [])

  return (
    <div className="min-h-screen bg-[#0A0E14] flex items-center justify-center">
      <div className="text-white font-mono">Connecting device...</div>
    </div>
  )
}
```

Add route in your router:

```jsx
<Route path="/auth/callback" element={<OAuthCallback />} />
```

---

## OAuth Configuration

### Oura Ring Setup

1. **Create Application**
   - Go to https://cloud.ouraring.com/oauth/applications
   - Click "Create New Application"
   - Name: "ExtensioVitae"
   - Redirect URI: `https://your-domain.com/auth/callback`
   - Scopes: `email`, `personal`, `daily`

2. **Configure Webhooks**
   - Webhook URL: `https://your-project.supabase.co/functions/v1/sync-oura-data`
   - Events: `daily_sleep`, `daily_readiness`, `daily_activity`
   - Generate webhook secret and save it

3. **Test Connection**
   ```bash
   # Test OAuth flow in browser
   https://cloud.ouraring.com/oauth/authorize?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&scope=email%20personal%20daily
   ```

### Whoop Setup

1. **Create Application**
   - Go to https://developer.whoop.com
   - Register application
   - Redirect URI: `https://your-domain.com/auth/callback`
   - Scopes: `read:recovery`, `read:sleep`, `read:workout`

2. **Configure Webhooks**
   - Endpoint: `https://your-project.supabase.co/functions/v1/sync-whoop-data`
   - Events: `recovery.updated`, `sleep.updated`, `workout.created`

### Apple Health (iOS App Required)

Apple HealthKit requires native iOS integration:

1. Enable HealthKit capability in Xcode
2. Request permissions in Info.plist:
   ```xml
   <key>NSHealthShareUsageDescription</key>
   <string>ExtensioVitae needs access to your health data for recovery tracking</string>
   ```
3. Implement HealthKit sync in Swift/React Native
4. POST data to `sync-apple-health` Edge Function

---

## Testing Checklist

### Database Tests

```sql
-- Test 1: Create a task
INSERT INTO tasks (user_id, title, category, base_difficulty, is_recurring)
VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'Test Morning Run',
  'exercise',
  6,
  true
);

-- Test 2: Complete a task
INSERT INTO task_completions (task_id, user_id, perceived_difficulty)
SELECT id, user_id, 7
FROM tasks
WHERE title = 'Test Morning Run';

-- Test 3: Verify streak updated
SELECT title, current_streak, longest_streak, total_completions
FROM tasks
WHERE title = 'Test Morning Run';

-- Test 4: Get adjusted tasks
SELECT * FROM get_adjusted_tasks(
  (SELECT id FROM auth.users LIMIT 1),
  CURRENT_DATE
);

-- Test 5: Create recovery metric
INSERT INTO recovery_metrics (user_id, date, hrv_rmssd, rhr_bpm, sleep_total_minutes, recovery_score, readiness_state)
VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  CURRENT_DATE,
  45.5,
  58,
  450,
  72,
  'optimal'
);

-- Test 6: Query baseline
SELECT * FROM user_recovery_baseline
WHERE user_id = (SELECT id FROM auth.users LIMIT 1);
```

### Edge Function Tests

```bash
# Test calculate-recovery-score
curl -X POST https://your-project.supabase.co/functions/v1/calculate-recovery-score \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "user_id": "your-user-uuid",
    "date": "2026-02-06"
  }'

# Test sync-oura-data (simulate webhook)
curl -X POST https://your-project.supabase.co/functions/v1/sync-oura-data \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "oura-user-123",
    "data_type": "sleep",
    "date": "2026-02-06"
  }'
```

### Frontend Tests

```javascript
// Test taskService
import { taskService } from './services/taskService'

// Create task
const task = await taskService.createTask({
  title: 'Morning Meditation',
  category: 'recovery',
  durationMinutes: 15,
  isRecurring: true
})

// Complete task
const result = await taskService.completeTask(task.id)
console.log('New streak:', result.task.current_streak)

// Get next action
const nextTask = await taskService.getNextBestAction()
console.log('Next task:', nextTask.title)
```

### E2E User Flow Test

1. **New User Onboarding**
   - Sign up
   - Create first task
   - Connect Oura Ring (OAuth flow)
   - Wait for first sync
   - View recovery score

2. **Daily Usage**
   - Open app in morning
   - Check recovery score
   - View adjusted tasks
   - Complete NextBestAction
   - Observe streak increment

3. **Low Recovery Day**
   - Manually set low recovery score
   - Verify tasks are adjusted (HIIT → Yoga)
   - Check insights panel shows warnings

---

## Monitoring & Alerts

### Supabase Dashboard

Monitor via **Database → Logs**:

```sql
-- Failed syncs in last 24h
SELECT
  device_type,
  sync_error_message,
  sync_retry_count,
  last_sync_at
FROM wearable_connections
WHERE sync_status = 'error'
  AND last_sync_at > NOW() - INTERVAL '24 hours'
ORDER BY sync_retry_count DESC;

-- Recovery score distribution
SELECT
  readiness_state,
  COUNT(*) as count,
  AVG(recovery_score) as avg_score
FROM recovery_metrics
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY readiness_state;

-- Task completion rate
SELECT
  DATE(completed_at) as date,
  COUNT(*) as completions
FROM task_completions
WHERE completed_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(completed_at)
ORDER BY date DESC;
```

### Performance Metrics

```sql
-- Slow queries (>500ms)
SELECT
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
WHERE mean_exec_time > 500
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Set Up Alerts

Create alerts in Supabase Dashboard:

1. **High Sync Failure Rate**
   - Condition: >5% of syncs failing in 1 hour
   - Action: Send email/Slack notification

2. **Database Performance**
   - Condition: Query time >1s
   - Action: Log to monitoring dashboard

3. **User Engagement**
   - Condition: Task completion rate <50% for 7 days
   - Action: Trigger re-engagement campaign

---

## Troubleshooting

### Common Issues

#### 1. OAuth Callback Not Working

**Symptoms:** User redirected but device not connected

**Solutions:**
- Check redirect URI matches exactly (including trailing slash)
- Verify CORS settings in Supabase
- Check browser console for errors
- Ensure `oauth-callback` Edge Function is deployed

```bash
# Test callback directly
curl -X POST https://your-project.supabase.co/functions/v1/oauth-callback \
  -H "Content-Type: application/json" \
  -d '{
    "code": "test-code",
    "device_type": "oura",
    "redirect_uri": "https://your-domain.com/auth/callback"
  }'
```

#### 2. Webhook Not Firing

**Symptoms:** Wearable data not syncing

**Solutions:**
- Check webhook URL is publicly accessible
- Verify signature validation (Oura uses HMAC-SHA256)
- Check Edge Function logs in Supabase Dashboard
- Test webhook manually with curl

```bash
# Test Oura webhook
curl -X POST https://your-project.supabase.co/functions/v1/sync-oura-data \
  -H "Content-Type: application/json" \
  -H "x-oura-signature: test-signature" \
  -d '{
    "user_id": "test-user",
    "data_type": "sleep",
    "date": "2026-02-06"
  }'
```

#### 3. Recovery Score Not Calculating

**Symptoms:** `recovery_metrics` table empty

**Solutions:**
- Check wearable data is being ingested: `SELECT * FROM wearable_data LIMIT 10`
- Manually trigger calculation:
  ```bash
  curl -X POST https://your-project.supabase.co/functions/v1/calculate-recovery-score \
    -H "Authorization: Bearer YOUR_ANON_KEY" \
    -d '{"user_id": "uuid", "date": "2026-02-06"}'
  ```
- Check Edge Function logs for errors

#### 4. Materialized View Not Refreshing

**Symptoms:** Baseline metrics not updating

**Solutions:**
- Check cron job is active:
  ```sql
  SELECT * FROM cron.job WHERE jobname = 'refresh-recovery-baselines';
  ```
- Manually refresh:
  ```sql
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_recovery_baseline;
  ```
- Check function permissions:
  ```sql
  SELECT has_function_privilege('refresh_materialized_view_user_recovery_baseline()', 'execute');
  ```

#### 5. RLS Blocking Queries

**Symptoms:** Empty results despite data existing

**Solutions:**
- Verify user is authenticated:
  ```javascript
  const { data: { user } } = await supabase.auth.getUser()
  console.log('User ID:', user?.id)
  ```
- Check RLS policies are correct:
  ```sql
  SELECT * FROM pg_policies WHERE tablename = 'tasks';
  ```
- Test with service role key (temporarily):
  ```javascript
  const supabase = createClient(url, SERVICE_ROLE_KEY) // For debugging only!
  ```

#### 6. Streak Not Updating

**Symptoms:** Task completed but streak stays at 0

**Solutions:**
- Check trigger is active:
  ```sql
  SELECT * FROM pg_trigger WHERE tgname = 'trigger_update_task_streak_on_completion';
  ```
- Manually recalculate:
  ```sql
  SELECT * FROM calculate_task_streak('task-uuid');
  ```
- Verify completion was inserted:
  ```sql
  SELECT * FROM task_completions WHERE task_id = 'task-uuid' ORDER BY completed_at DESC LIMIT 5;
  ```

---

## Performance Optimization

### Database Indexes

Verify critical indexes exist:

```sql
-- Should return indexes for:
-- - tasks(user_id, is_active)
-- - recovery_metrics(user_id, date DESC)
-- - wearable_data(user_id, measurement_date DESC)
SELECT indexname, tablename, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('tasks', 'recovery_metrics', 'wearable_data')
ORDER BY tablename;
```

### Query Optimization

Use `EXPLAIN ANALYZE` for slow queries:

```sql
EXPLAIN ANALYZE
SELECT * FROM get_adjusted_tasks('user-uuid', CURRENT_DATE);
```

Target: All queries <200ms at 95th percentile

### Frontend Caching

Implement service worker for offline support:

```javascript
// sw.js
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/recovery_metrics')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((fetchResponse) => {
          return caches.open('recovery-cache').then((cache) => {
            cache.put(event.request, fetchResponse.clone())
            return fetchResponse
          })
        })
      })
    )
  }
})
```

---

## Security Checklist

- [ ] RLS enabled on all tables
- [ ] OAuth secrets stored in Supabase Secrets (not .env)
- [ ] Webhook signature validation implemented
- [ ] CORS configured for production domain only
- [ ] Service role key never exposed to frontend
- [ ] SQL injection prevention (parameterized queries)
- [ ] Rate limiting on Edge Functions (default: 60 req/min)
- [ ] User data encryption at rest (Supabase default)
- [ ] HTTPS enforced on all endpoints

---

## Next Steps

1. **Phase 1: Core Launch** (Week 1-2)
   - Deploy database migration
   - Deploy Edge Functions
   - Launch with Oura integration only

2. **Phase 2: Expand Devices** (Week 3-4)
   - Add Whoop integration
   - Test with beta users
   - Gather feedback

3. **Phase 3: iOS App** (Week 5-8)
   - Build React Native app
   - Implement Apple HealthKit sync
   - Submit to App Store

4. **Phase 4: Advanced Features** (Week 9-12)
   - Add task templates
   - Implement habit stacking
   - Build insights AI (GPT-4 integration)

---

## Support & Documentation

- **Scientific Research:** See `INTEGRATED_SYSTEMS_IMPLEMENTATION.md`
- **Database Schema:** See SQL migration file
- **Edge Functions:** See `EDGE_FUNCTIONS.md`
- **Frontend Services:** See `FRONTEND_SERVICES.md`
- **React Components:** See `REACT_COMPONENTS.md`

**Questions?** Open an issue in the repository.

---

**Deployment Status: ✅ Ready for Production**

All systems designed, documented, and ready to deploy. Follow this guide step-by-step for successful integration.

