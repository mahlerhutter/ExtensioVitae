# ExtensioVitae - AI Context

> **Version**: 2.1 | **Last Updated**: 2026-02-02
> Comprehensive guide for AI assistants working on ExtensioVitae codebase

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Key Concepts](#key-concepts)
   - [6 Longevity Pillars](#6-longevity-pillars)
   - [Plan Generation](#plan-generation-planbuilderjs-v20)
   - [Intake Form Fields](#intake-form-fields)
   - [Database Tables](#database-tables-v21)
5. [Routes & Navigation](#routes--navigation)
6. [Data Flow & Architecture](#data-flow--architecture)
7. [Code Conventions & Patterns](#code-conventions--patterns)
8. [Common Tasks](#common-tasks)
9. [Development Workflows](#development-workflows)
10. [New Features in v2.1](#new-features-in-v21)
11. [API Reference](#api-reference-key-services)
12. [Longevity Score System](#longevity-score-system)
13. [UI Integration](#ui-integration)
14. [Design Guidelines](#design-guidelines)
15. [Gotchas & Tips](#gotchas--tips-v21)
16. [Best Practices for AI Assistants](#best-practices-for-ai-assistants)
17. [Related Files & Documentation](#related-files--documentation)

---

## Project Overview
**ExtensioVitae** is a personalized 30-day longevity plan generator. Users complete an intake form, receive an AI-generated health blueprint, and track daily tasks via a dashboard (and optionally WhatsApp nudges).

**Current Version**: v2.1 (with Health Profile System, Feedback Loop, and Unit Tests)

**Language**: German (user-facing content), English (code/comments)

## Tech Stack
```
Frontend: React 18 + Vite + Tailwind CSS
Testing:  Vitest + Happy DOM
Backend:  Supabase (PostgreSQL + Auth + RLS)
Auth:     Google OAuth via Supabase
Deploy:   Vercel (frontend) + Supabase (backend)
Git:      Husky pre-commit hooks
Optional: WhatsApp Cloud API (via Make.com webhooks)
```

## Project Structure
```
src/
├── App.jsx              # Routes: /, /auth, /intake, /health-profile, /generating, /dashboard, /admin
├── main.jsx             # Entry point with AuthProvider
├── contexts/
│   └── AuthContext.jsx  # Supabase auth state management
├── components/
│   ├── ProtectedRoute.jsx
│   ├── ErrorBoundary.jsx      # Error handling wrapper
│   ├── LongevityScoreCard.jsx # Full longevity score display
│   ├── LifeInWeeks.jsx        # Life in weeks visualization
│   ├── LogViewer.jsx          # Debug logging viewer
│   ├── dashboard/             # Dashboard-specific components
│   │   ├── DashboardHeader.jsx
│   │   ├── TodayCard.jsx
│   │   ├── MonthOverview.jsx
│   │   ├── UserProfileSection.jsx
│   │   ├── LongevityScoreWidget.jsx
│   │   ├── TaskItem.jsx
│   │   ├── DayCell.jsx
│   │   ├── ProgressRing.jsx
│   │   ├── PlanSummary.jsx
│   │   ├── FullPlanModal.jsx
│   │   ├── DayPreviewModal.jsx
│   │   ├── PlanHistoryModal.jsx
│   │   ├── EditProfileModal.jsx
│   │   ├── PillarsExplanationBox.jsx
│   │   ├── PillarsExplanationModal.jsx
│   │   └── InteractiveLoading.jsx
│   ├── feedback/              # Feedback system components
│   │   ├── InitialFeedbackModal.jsx
│   │   ├── FloatingFeedbackButton.jsx
│   │   ├── MicroFeedbackToast.jsx
│   │   └── GeneralFeedbackPanel.jsx
│   └── plan-review/           # Plan review modal components
│       ├── PlanReviewModal.jsx
│       ├── PlanOverview.jsx
│       ├── PhaseTimeline.jsx
│       ├── ActivityPreview.jsx
│       └── FocusBreakdownChart.jsx
├── pages/
│   ├── LandingPage.jsx        # Marketing page with longevity calculator
│   ├── AuthPage.jsx           # Google login
│   ├── IntakePage.jsx         # Multi-step intake form
│   ├── HealthProfilePage.jsx  # ⭐ NEW: Extended health profile (v2.1)
│   ├── GeneratingPage.jsx     # Loading screen during plan generation
│   ├── DashboardPage.jsx      # 30-day plan view + task tracking
│   ├── AdminPage.jsx          # Admin analytics and user management
│   └── NotFoundPage.jsx       # 404 error page
├── lib/
│   ├── supabase.js            # Supabase client init
│   ├── dataService.js         # CRUD operations for plans/intake/progress
│   ├── planBuilder.js         # ⭐ CORE: Deterministic plan generation (v2.1 Enhanced)
│   ├── llmPlanGenerator.js    # LLM-based generation (OpenAI/Claude fallback)
│   ├── planGenerator.js       # Orchestrator: tries LLM first, falls back to algorithm
│   ├── longevityScore.js      # Longevity score calculation + life expectancy
│   ├── profileService.js      # ⭐ NEW: User & health profile management (v2.1)
│   ├── healthConstraints.js   # ⭐ NEW: Health-based plan constraints (v2.1)
│   ├── feedbackService.js     # Feedback system CRUD operations
│   ├── planOverviewService.js # Plan overview generation and storage
│   ├── logger.js              # Structured logging utility
│   ├── logger.examples.js     # Logger usage examples
│   └── testPlanBuilder.js     # Test script for plan generation
├── tests/                     # ⭐ NEW: Unit tests (v2.1)
│   ├── setup.js               # Vitest setup
│   ├── run-tests.js           # Test runner
│   ├── simple-test.js         # Pre-commit test
│   ├── planBuilder.test.js
│   ├── longevityScore.test.js
│   ├── dataService.test.js
│   ├── healthConstraints.test.js
│   ├── healthProfileTest.js
│   └── healthProfileIntegration.test.js
sql/
├── schema.sql                 # Full DB schema with RLS policies
├── admin_policies.sql         # Admin-specific access
├── fix_rls.sql                # RLS fixes
└── migrations/                # Database migrations
    ├── 001_update_cancelled_to_inactive.sql
    ├── 002_add_unique_constraint_intake_responses.sql
    ├── 003_create_feedback_table.sql
    ├── 004_add_plan_overview.sql
    ├── 005_separate_user_and_health_profiles.sql  # ⭐ Health Profile System
    ├── 006_auto_create_user_profile.sql
    └── 007_fix_feedback_rls.sql
docs/                          # Extensive documentation (see docs/STRUCTURE.md)
├── implementation/            # Feature implementation docs
│   ├── USER_HEALTH_PROFILE_SYSTEM.md  # ⭐ Health Profile System (v2.1)
│   ├── FEEDBACK_LOOP_STATUS.md
│   ├── PLAN_REVIEW_MVP_SUMMARY.md
│   └── ...
├── guides/                    # Quick start guides
├── concepts/                  # Future feature concepts
├── archive/                   # Historical documentation
└── testing/                   # Testing documentation
landing/                       # Standalone landing page (separate from React app)
scripts/                       # Utility scripts
.husky/                        # Git hooks (pre-commit tests)
```

## Key Concepts

### 6 Longevity Pillars
1. `sleep_recovery` - Sleep optimization
2. `circadian_rhythm` - Light exposure, timing
3. `mental_resilience` - Stress, meditation, breathing
4. `nutrition_metabolism` - Diet, protein, fasting
5. `movement_muscle` - Exercise, mobility, NEAT
6. `supplements` - Vitamin D, Magnesium, etc.

### Plan Generation (planBuilder.js v2.0)
The core algorithm computes a 30-day personalized plan:

```javascript
// Basic usage
import { build30DayBlueprint, TASKS_EXAMPLE } from './lib/planBuilder.js';
const result = build30DayBlueprint(intake, TASKS_EXAMPLE);

// With user state (returning users)
const result = build30DayBlueprint(intake, TASKS_EXAMPLE, {
    completedTasks: ["SLP001", "CIR001", ...],  // For prerequisites
    userCompletions: { sleep_recovery: 8, ... }, // For mastery levels
    completionRate7Day: 0.85,                    // Adaptive difficulty
    energyLevel: 4                               // Daily energy (1-5)
});
```

**Enhanced Features (v2.0):**
- Task Cooldown: 3-day hard cooldown, freshness multiplier
- Day-of-Week Profiles: Mon=fresh_start, Sun=rest, etc.
- Pillar Rotation: Prevents same pillar 3+ consecutive days
- Mastery Levels: Beginner → Intermediate → Advanced
- Prerequisites: Tasks unlock after completing dependencies
- Seasonal Adjustments: Winter boosts circadian/supplements
- Novelty Injection: Every 7th day explores underused pillars
- Completion Rate Adaptation: Low completion → easier tasks

### Intake Form Fields
```javascript
{
  name, age, sex,
  primary_goal,        // energy|sleep|stress|fat_loss|strength_fitness|focus_clarity
  sleep_hours_bucket,  // <6|6-6.5|6.5-7|7-7.5|7.5-8|>8
  stress_1_10,         // 1-10
  training_frequency,  // 0|1-2|3-4|5+
  diet_pattern,        // Array: high_ultra_processed, high_sugar_snacks, etc.
  daily_time_budget,   // 10|20|30 (minutes)
  equipment_access     // none|basic|gym
}
```

### Database Tables (v2.1)
- `user_profiles` - User identity data (name, email, sex, birth_date)
- `health_profiles` - Health-specific data (height, weight, conditions, injuries)
- `intake_responses` - Original intake form submissions (legacy)
- `plans` - Generated 30-day plans with health_profile_snapshot (JSONB)
- `plan_overviews` - Pre-generated plan summaries for review
- `daily_progress` - Task completion tracking
- `feedback` - User feedback submissions (initial + general)
- `whatsapp_messages` - Message logs (optional)

## Common Tasks

### Run Development Server
```bash
npm run dev              # Vite dev server on localhost:5173
npm run build            # Production build
npm run preview          # Preview production build
npm run lint             # ESLint check
```

### Testing
```bash
npm run test             # Run vitest tests
npm run test:ui          # Run tests with UI
npm run test:coverage    # Generate coverage report
node src/tests/simple-test.js  # Quick pre-commit test
```

### Test Plan Generation
```bash
cd src/lib
node testPlanBuilder.js
```

### Environment Variables (Supabase)
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Git Workflow
- **Pre-commit Hook**: Automatically runs `simple-test.js` before each commit
- **Husky**: Manages git hooks (`.husky/pre-commit`)
- Tests must pass before commits are allowed

## Design Guidelines
- **Colors**: Navy `#0A1628`, Gold `#C9A227`, White backgrounds
- **Font**: System fonts, clean and minimal
- **Tone**: Professional, science-backed, German language
- **Mobile-first**: All pages responsive

## Code Patterns

### Supabase Query Pattern
```javascript
const { data, error } = await supabase
  .from('plans')
  .select('*')
  .eq('user_id', userId)
  .eq('status', 'active')
  .single();
```

### Task Object Structure
```javascript
{
  id: "SLP001",
  pillar: "sleep_recovery",
  minutes: 5,
  intensity: -1,              // -1=light, 0=medium, +1=intense
  equipment: "any",           // none|basic|gym|any
  level: "beginner",          // beginner|intermediate|advanced
  tags: ["sleep", "winddown"],
  when: "pm",                 // am|pm|any
  how: "90 Min vor Schlaf: Screens dimmen...",
  prerequisites: ["SLP001"]   // Optional: task IDs to unlock
}
```

## Routes & Navigation

### Public Routes
- `/` - LandingPage (with longevity calculator)
- `/auth` - AuthPage (Google OAuth login)

### Protected Routes (require authentication)
- `/intake` - IntakePage (multi-step form)
- `/health-profile` or `/settings/health` - HealthProfilePage (extended health data)
- `/generating` - GeneratingPage (loading animation)
- `/dashboard` - DashboardPage (default: load active plan)
- `/d/:planId` - DashboardPage (load specific plan)
- `/d/:planId/:day` - DashboardPage (deep-link to day number)

### Admin Route (email-restricted)
- `/admin` - AdminPage (analytics, user management, feedback review)

### Error Handling
- `*` - NotFoundPage (404 catch-all)
- ErrorBoundary wraps all protected routes

## Data Flow & Architecture

### Plan Generation Flow
```
1. User submits intake → IntakePage
2. Data saved to health_profiles table
3. Navigate to GeneratingPage
4. Plan generation:
   a. Try LLM generation (planGenerator.js)
   b. If fails, use deterministic (planBuilder.js)
5. Health constraints applied (healthConstraints.js)
6. Plan stored in plans table with health_profile_snapshot
7. Navigate to DashboardPage
```

### Health Profile Integration
```
health_profiles table
    ↓
profileService.getHealthProfile(userId)
    ↓
healthConstraints.applyHealthConstraints(tasks, healthProfile)
    ↓
planBuilder.build30DayBlueprint(intake, filteredTasks, userState)
    ↓
plans table (with health_profile_snapshot)
```

### Feedback Collection Points
```
Day 7 → InitialFeedbackModal (one-time)
Anytime → FloatingFeedbackButton (persistent)
Per task → MicroFeedbackToast (optional)
Settings → GeneralFeedbackPanel (bulk feedback)
```

## Code Conventions & Patterns

### Component Organization
- **Standalone components**: `/src/components/` (ErrorBoundary, ProtectedRoute, etc.)
- **Feature-grouped**: `/src/components/dashboard/`, `/feedback/`, `/plan-review/`
- **Pages**: `/src/pages/` (one per route)
- **Services**: `/src/lib/` (data operations, business logic)

### Service Layer Pattern
All database operations go through service files:
```javascript
// ❌ Don't do this
const { data } = await supabase.from('plans').select('*');

// ✅ Do this instead
import { getUserActivePlan } from './lib/dataService.js';
const plan = await getUserActivePlan(userId);
```

### Error Handling Pattern
```javascript
try {
  const result = await someAsyncOperation();
  logger.info('Operation succeeded', { result });
} catch (error) {
  logger.error('Operation failed', { error: error.message });
  // Show user-friendly error
}
```

### Health Constraints Pattern
```javascript
import { applyHealthConstraints } from './lib/healthConstraints.js';

// Before plan generation
const healthProfile = await getHealthProfile(userId);
const filteredTasks = applyHealthConstraints(allTasks, healthProfile);
const plan = build30DayBlueprint(intake, filteredTasks);
```

## Gotchas & Tips (v2.1)

### Database & RLS
1. **RLS**: All tables have Row Level Security. User can only see own data.
2. **plan_data JSONB**: Full 30-day plan stored as JSON in `plans` table.
3. **health_profile_snapshot**: Plans store a snapshot of health data at generation time.
4. **Migration Order**: Run migrations sequentially (001 → 007).

### Plan Generation
5. **Freshness 0.00**: Means task was just added to history (expected).
6. **Prerequisites**: New users only see beginner tasks without prerequisites.
7. **Health Constraints**: Tasks are filtered BEFORE plan generation, not after.
8. **Mastery Calculation**: Based on `userCompletions[pillar]` count.

### Frontend & UX
9. **German Content**: Task descriptions (`how` field) are in German.
10. **Error Boundaries**: Wrap dashboard routes to prevent full app crashes.
11. **URL Deep-linking**: Always support `/d/:planId/:day` format for sharing.
12. **Modal State**: Use React state, not URL params, for modal visibility.

### Testing & Git
13. **Pre-commit Hook**: Tests MUST pass before commits are allowed.
14. **Vitest Setup**: Uses Happy DOM for browser environment simulation.
15. **Logger Redaction**: Sensitive data auto-redacted in logs.
16. **Test Isolation**: Each test should reset database state (use transactions).

### Health Profile System
17. **Two-Table Split**: `user_profiles` (identity) vs `health_profiles` (health data).
18. **Automatic Creation**: User profile auto-created on first auth (migration 006).
19. **Constraint Application**: Use `healthConstraints.js`, not manual filtering.
20. **Condition Mapping**: See `healthConstraints.js` for complete condition rules.

## Development Workflows

### Adding a New Task to Library
Tasks are in `TASKS_EXAMPLE` array in `planBuilder.js`.

```javascript
{
  id: "MOV025",                    // Unique ID (pillar prefix + number)
  pillar: "movement_muscle",       // One of 6 pillars
  minutes: 15,                     // Time required
  intensity: 0,                    // -1=light, 0=medium, +1=intense
  equipment: "none",               // none|basic|gym|any
  level: "intermediate",           // beginner|intermediate|advanced
  tags: ["strength", "bodyweight"],
  when: "am",                      // am|pm|any
  how: "15 Min Bodyweight-Kraft...", // German description
  prerequisites: ["MOV001"],       // Optional: required prior tasks
  avoidWith: ["knee_injury"]       // Optional: health constraints
}
```

**Steps:**
1. Choose unique ID (check existing IDs)
2. Set appropriate `level` and `prerequisites`
3. Add `avoidWith` if task conflicts with health conditions
4. Keep `how` text concise and actionable (German)
5. Test with `node src/lib/testPlanBuilder.js`
6. Add unit test case if logic is complex

### Adding a New Health Constraint
Edit `src/lib/healthConstraints.js`:

```javascript
const CONDITION_CONSTRAINTS = {
  new_condition: {
    name: "New Condition Name",
    avoid: ["HIIT", "heavy_lifting"],     // Activity types to exclude
    prefer: ["walking", "meditation"],    // Activity types to prioritize
    intensityCap: "moderate",             // light|moderate|normal
    pillarWeights: {                      // Adjust pillar priorities
      movement_muscle: 0.6,
      mental_resilience: 1.3
    }
  }
};
```

**Then update tasks** to include `avoidWith: ["new_condition"]` tags.

### Adding a New Route
1. Create page component in `src/pages/`
2. Add route in `src/App.jsx`
3. Wrap with `<ProtectedRoute>` if auth required
4. Wrap with `<ErrorBoundary>` for error handling
5. Update CLAUDE.md routes section

### Running Database Migrations
```bash
# Connect to Supabase dashboard SQL editor
# Run migrations in order from sql/migrations/
# Or use migration script:
node scripts/run-migration-004.js
```

### Adding a New Feedback Type
1. Update feedback schema in `feedbackService.js`
2. Add UI component in `src/components/feedback/`
3. Update `feedback` table RLS if needed
4. Add to AdminPage feedback viewer

### Debugging Common Issues

**Issue**: Plan generation fails
```
1. Check health_profiles exists: profileService.getHealthProfile()
2. Check task library: TASKS_EXAMPLE array
3. Check constraints: healthConstraints.applyHealthConstraints()
4. Check logs: logger output in console
```

**Issue**: RLS permission denied
```
1. Check user is authenticated
2. Check RLS policies in sql/schema.sql
3. Check user_id matches auth.uid()
4. Check table has RLS enabled
```

**Issue**: Tests failing
```
1. Run: npm run test
2. Check setup.js for environment
3. Check mock data in test files
4. Run single test: npm run test -- planBuilder.test.js
```

**Issue**: Pre-commit hook blocking
```
1. Check: node src/tests/simple-test.js
2. Fix failing tests
3. Or temporarily bypass: git commit --no-verify (not recommended)
```

## Longevity Score System

### Components:
- `src/lib/longevityScore.js` - Score calculation + Life in Weeks data
- `src/components/LongevityScoreCard.jsx` - Score display with breakdown
- `src/components/LifeInWeeks.jsx` - Visual weeks grid

### Usage:
```javascript
import { calculateLongevityScore, calculateQuickScore } from './lib/longevityScore';

// Full score (after intake)
const scoreData = calculateLongevityScore(intake);

// Quick score (landing page with 4 inputs)
const quickScore = calculateQuickScore({ age, sleepHours, stressLevel, exerciseFrequency });

// scoreData contains:
// - score (0-100)
// - biologicalAge vs chronologicalAge
// - currentExpectancy, optimizedExpectancy
// - weeksLived, currentRemainingWeeks, optimizedRemainingWeeks
// - potentialGainYears, potentialGainWeeks
// - breakdown (sleep, stress, movement, nutrition)
```

### Score Factors:
| Factor | Range | Impact |
|--------|-------|--------|
| Sleep | <6h to >8h | -4.5 to +0.5 Jahre |
| Stress | 1-10 | +2 to -6 Jahre |
| Training | 0 to 5+/Woche | -3.5 to +2.5 Jahre |
| Diet | Patterns | -5 to +5 Jahre |

## UI Integration

### Landing Page (`/src/pages/LandingPage.jsx`)
- **LifeInWeeksSection**: Interactive calculator with 4 inputs (age, sleep, stress, exercise)
- Shows circular score display + compact weeks grid
- "Berechnen" button triggers score calculation
- CTA to intake form after results

### Dashboard (`/src/pages/DashboardPage.jsx`)
- **LongevityScoreWidget**: Compact score display at top of dashboard
- Shows score circle, biological age, potential gain
- Compact life-in-weeks visualization
- Breakdown mini-cards for sleep, stress, movement, nutrition

### Admin Panel (`/src/pages/AdminPage.jsx`)
Email-restricted dashboard for admin users.

**Features:**
- **User Analytics**: Total users, active plans, completion rates
- **Plan Statistics**: Plans by status, average completion rate
- **Feedback Viewer**: View all user feedback submissions
- **User Management**: View user profiles, health data, plan history
- **System Health**: Database stats, error logs
- **Email Allowlist**: Configured in `ADMIN_EMAILS` (see docs/implementation/ADMIN_EMAIL_CONFIG.md)

**Access Control:**
- Checks user email against admin allowlist
- No special database role needed (RLS allows self-access)
- Admin users see aggregate data via service layer

## API Reference (Key Services)

### profileService.js
```javascript
// Get user profile (identity data)
const userProfile = await getUserProfile(userId);
// Returns: { id, email, name, biological_sex, birth_date, ... }

// Update user profile
await updateUserProfile(userId, { name: "New Name" });

// Get health profile (health data)
const healthProfile = await getHealthProfile(userId);
// Returns: { user_id, height_cm, weight_kg, chronic_conditions, ... }

// Update health profile
await updateHealthProfile(userId, {
  chronic_conditions: ["diabetes_type_2"],
  injuries_limitations: ["knee_injury"]
});

// Get or create health profile
const profile = await getOrCreateHealthProfile(userId);
```

### healthConstraints.js
```javascript
import { applyHealthConstraints } from './lib/healthConstraints.js';

// Filter tasks based on health profile
const filteredTasks = applyHealthConstraints(allTasks, healthProfile);

// Returns tasks with:
// - Excluded tasks removed (e.g., HIIT for heart disease)
// - Intensity adjusted (e.g., capped at moderate)
// - Preferred activities prioritized
```

### dataService.js
```javascript
import {
  getUserActivePlan,
  createPlan,
  updatePlanStatus,
  getDailyProgress,
  markTaskComplete
} from './lib/dataService.js';

// Get user's active plan
const plan = await getUserActivePlan(userId);

// Create new plan
const newPlan = await createPlan({
  user_id: userId,
  plan_data: thirtyDayPlan,
  health_profile_snapshot: healthProfile
});

// Update plan status
await updatePlanStatus(planId, 'active'); // active|inactive|completed

// Get progress for specific day
const progress = await getDailyProgress(planId, dayNumber);

// Mark task as complete/incomplete
await markTaskComplete(planId, dayNumber, taskId, isComplete);
```

### feedbackService.js
```javascript
import {
  submitInitialFeedback,
  submitGeneralFeedback,
  getUserFeedback,
  getAllFeedback
} from './lib/feedbackService.js';

// Submit initial Day 7 feedback
await submitInitialFeedback(userId, planId, {
  rating: 4,
  difficulty: 3,
  relevance: 5,
  comments: "Great plan!"
});

// Submit general feedback anytime
await submitGeneralFeedback(userId, {
  category: 'feature_request',
  message: 'Would love to see...'
});

// Get user's feedback history
const feedback = await getUserFeedback(userId);

// Admin: Get all feedback
const allFeedback = await getAllFeedback(); // Admin only
```

### planOverviewService.js
```javascript
import {
  generatePlanOverview,
  getPlanOverview
} from './lib/planOverviewService.js';

// Generate and store plan overview (for Plan Review Modal)
const overview = await generatePlanOverview(userId, planData, intake);
// Returns: { focus_areas, phases, sample_tasks, pillar_breakdown }

// Get existing plan overview
const overview = await getPlanOverview(planId);
```

### longevityScore.js
```javascript
import {
  calculateLongevityScore,
  calculateQuickScore,
  getLifeInWeeksData
} from './lib/longevityScore.js';

// Full score calculation (after intake)
const scoreData = calculateLongevityScore(intake);
// Returns: {
//   score: 78,
//   biologicalAge: 35,
//   chronologicalAge: 40,
//   currentExpectancy: 82,
//   optimizedExpectancy: 88,
//   potentialGainYears: 6,
//   breakdown: { sleep: 15, stress: 20, movement: 18, nutrition: 25 }
// }

// Quick score (landing page calculator)
const quickScore = calculateQuickScore({
  age: 40,
  sleepHours: 7,
  stressLevel: 5,
  exerciseFrequency: 3
});

// Life in weeks data
const lifeData = getLifeInWeeksData(age, currentExpectancy, optimizedExpectancy);
```

## New Features in v2.1

### 1. User & Health Profile System
**Separation of Concerns**: User identity data (name, email) is now separate from health data (conditions, injuries).

**Key Files:**
- `src/pages/HealthProfilePage.jsx` - Extended health profile UI
- `src/lib/profileService.js` - Profile CRUD operations
- `src/lib/healthConstraints.js` - Health-based plan adaptations
- `sql/migrations/005_separate_user_and_health_profiles.sql`

**Health Constraints:**
Plans are automatically adapted based on:
- Chronic conditions (heart disease, diabetes, arthritis, pregnancy, etc.)
- Injuries/limitations (knee injury, back pain, shoulder issues)
- Dietary restrictions (vegan, gluten-free, dairy-free)
- Lifestyle factors (smoking, alcohol, medications)

**Example Constraints:**
- Heart disease → Excludes HIIT, prefers Zone 2 cardio
- Pregnancy → Excludes back-lying exercises, adds prenatal focus
- Knee injury → Excludes running/jumping, prefers low-impact
- Vegan → Adjusts nutrition tasks for plant-based protein

### 2. Feedback System
**Multi-stage feedback collection** for continuous improvement.

**Components:**
- `InitialFeedbackModal.jsx` - Day 7 initial feedback
- `FloatingFeedbackButton.jsx` - Persistent feedback access
- `MicroFeedbackToast.jsx` - Quick task-level feedback
- `GeneralFeedbackPanel.jsx` - General comments

**Database:**
- Table: `feedback` with RLS policies
- Service: `feedbackService.js`

### 3. Plan Review Modal
**Pre-generation plan preview** before committing to 30 days.

**Components:**
- `PlanReviewModal.jsx` - Main modal orchestrator
- `PlanOverview.jsx` - Plan summary and key insights
- `PhaseTimeline.jsx` - 3-phase progression visualization
- `ActivityPreview.jsx` - Sample daily tasks
- `FocusBreakdownChart.jsx` - Pillar distribution chart

**Database:**
- Table: `plan_overviews` stores pre-generated summaries
- Service: `planOverviewService.js`

### 4. Dashboard Enhancements
**Improved organization** with component-based architecture.

**New Components:**
- `MonthOverview.jsx` - Enhanced calendar with day previews
- `UserProfileSection.jsx` - Profile display with edit access
- `LongevityScoreWidget.jsx` - Compact score display
- `DayPreviewModal.jsx` - Quick day view without navigation
- `PlanHistoryModal.jsx` - View archived plans

**URL Parameters:**
- `/dashboard` - Auto-loads active plan
- `/d/:planId` - Load specific plan
- `/d/:planId/:day` - Deep-link to specific day

### 5. Testing Infrastructure
**Comprehensive unit tests** with pre-commit validation.

**Test Coverage:**
- `planBuilder.test.js` - Plan generation logic
- `longevityScore.test.js` - Score calculations
- `healthConstraints.test.js` - Health profile integration
- `dataService.test.js` - Database operations
- Pre-commit hook prevents commits if tests fail

### 6. Logging System
**Structured logging** for debugging and monitoring.

**Usage:**
```javascript
import logger from './lib/logger.js';

logger.info('Plan generated', { userId, planId, duration: 542 });
logger.warn('Missing health profile', { userId });
logger.error('Database error', { error: err.message });
```

**Features:**
- Auto-redacts sensitive data (email, phone, passwords)
- Configurable log levels (DEBUG, INFO, WARN, ERROR)
- Browser console integration
- Examples in `logger.examples.js`

## Best Practices for AI Assistants

### When Making Changes

1. **Always Read First**
   - Read relevant files before suggesting changes
   - Check existing patterns and conventions
   - Review related documentation in `/docs/`

2. **Use Service Layer**
   - Never query Supabase directly in components
   - Use service files (`dataService.js`, `profileService.js`, etc.)
   - This ensures RLS policies are respected and code is maintainable

3. **Test Your Changes**
   - Run `npm run test` before committing
   - Add test cases for new features
   - Ensure pre-commit hook passes
   - Test with `node src/lib/testPlanBuilder.js` for plan changes

4. **Respect Health Constraints**
   - Always apply `healthConstraints.js` before plan generation
   - Never bypass health-based task filtering
   - Add `avoidWith` tags to tasks that conflict with conditions

5. **Maintain German UI**
   - All user-facing text must be in German
   - Use professional, science-backed tone
   - Code comments and documentation in English

6. **Log Important Operations**
   - Use `logger.js` for debugging and monitoring
   - Log errors with context (user ID, plan ID, etc.)
   - Sensitive data is auto-redacted

7. **Error Boundaries**
   - Wrap new protected routes in `<ErrorBoundary>`
   - Handle async errors with try/catch
   - Show user-friendly error messages

### When Adding Features

1. **Check Documentation First**
   - Review `/docs/implementation/` for existing features
   - Check `/docs/concepts/` for planned features
   - Avoid duplicating functionality

2. **Follow Component Organization**
   - Standalone: `/components/`
   - Feature-grouped: `/components/dashboard/`, `/feedback/`, etc.
   - Pages: `/pages/`
   - Services: `/lib/`

3. **Update Documentation**
   - Update CLAUDE.md with new features
   - Add implementation docs to `/docs/implementation/`
   - Update `/docs/STRUCTURE.md` if adding new doc files

4. **Database Changes**
   - Create migration in `/sql/migrations/`
   - Number sequentially (008, 009, etc.)
   - Add RLS policies for new tables
   - Test RLS with different user contexts

### When Debugging

1. **Check Logs First**
   - Browser console for frontend errors
   - `logger` output for service layer issues
   - Supabase dashboard for database errors

2. **Verify Authentication**
   - Check user is logged in
   - Verify `userId` is available
   - Check RLS policies allow operation

3. **Health Profile Issues**
   - Verify health profile exists: `getHealthProfile(userId)`
   - Check constraints are applied correctly
   - Review `healthConstraints.js` for condition rules

4. **Plan Generation Issues**
   - Check task library has valid tasks
   - Verify health constraints aren't over-filtering
   - Check user state (completedTasks, mastery levels)
   - Review logs from `planBuilder.js`

### Code Quality Standards

1. **Component Structure**
   ```javascript
   // ✅ Good: Clean, single responsibility
   export default function TaskItem({ task, onComplete }) {
     return <div>...</div>;
   }

   // ❌ Bad: Multiple responsibilities, side effects
   export default function TaskItem({ task, userId, planId }) {
     useEffect(() => { /* database calls */ }, []);
     // ... complex logic
   }
   ```

2. **Service Layer**
   ```javascript
   // ✅ Good: Use service layer
   import { getUserActivePlan } from './lib/dataService.js';
   const plan = await getUserActivePlan(userId);

   // ❌ Bad: Direct Supabase query
   const { data } = await supabase.from('plans').select('*');
   ```

3. **Error Handling**
   ```javascript
   // ✅ Good: Comprehensive error handling
   try {
     const result = await someOperation();
     logger.info('Operation succeeded', { result });
     return result;
   } catch (error) {
     logger.error('Operation failed', { error: error.message });
     throw new Error('User-friendly error message');
   }

   // ❌ Bad: No error handling
   const result = await someOperation();
   return result;
   ```

4. **Testing**
   ```javascript
   // ✅ Good: Comprehensive test case
   test('filters tasks for heart disease', () => {
     const healthProfile = { chronic_conditions: ['heart_disease'] };
     const filtered = applyHealthConstraints(tasks, healthProfile);
     expect(filtered.find(t => t.tags.includes('HIIT'))).toBeUndefined();
   });

   // ❌ Bad: No edge cases
   test('filters tasks', () => {
     const filtered = applyHealthConstraints(tasks, {});
     expect(filtered).toBeDefined();
   });
   ```

### When Stuck

1. **Consult Documentation**
   - This CLAUDE.md file
   - `/docs/implementation/` for features
   - `/docs/guides/` for quick starts
   - `/docs/testing/` for test setup

2. **Check Examples**
   - Existing components for patterns
   - `logger.examples.js` for logging
   - Test files for test patterns
   - Service files for data operations

3. **Review Recent Changes**
   - `git log` for recent commits
   - `/docs/archive/SESSION_SUMMARY_*.md` for context
   - `/docs/UPDATE_SUMMARY.md` for major changes

## Related Files & Documentation

### Core Documentation
- `/CLAUDE.md` - This file (AI assistant guide)
- `/README.md` - Project quick start
- `/PROMPT_LONGEVITY_SCORE.md` - Life in Weeks implementation prompt

### Extensive Docs (38+ files)
- `/docs/STRUCTURE.md` - Documentation organization
- `/docs/implementation/USER_HEALTH_PROFILE_SYSTEM.md` - Health Profile System (v2.1)
- `/docs/implementation/FEEDBACK_LOOP_STATUS.md` - Feedback implementation
- `/docs/implementation/PLAN_REVIEW_MVP_SUMMARY.md` - Plan Review feature
- `/docs/guides/` - Quick start guides
- `/docs/testing/UNIT_TEST_SETUP.md` - Testing setup
- `/docs/concepts/` - Future feature concepts
- `/docs/archive/` - Historical documentation

### Standalone Pages
- `/landing/index.html` - Marketing page with Longevity Score calculator
- `/landing/GOOGLE_APPS_SCRIPT_SETUP.md` - Landing page integration

### Git & CI/CD
- `.husky/pre-commit` - Pre-commit test hook
- `package.json` - npm scripts and dependencies

---

**For questions or clarification, consult:**
1. This CLAUDE.md file (you're here!)
2. Relevant docs in `/docs/implementation/`
3. Code examples in `/src/components/` and `/src/lib/`
4. Test cases in `/src/tests/`

**Last updated**: 2026-02-02 (v2.1 with Health Profile System)
