# ExtensioVitae - AI Context

## Project Overview
**ExtensioVitae** is a personalized 30-day longevity plan generator. Users complete an intake form, receive an AI-generated health blueprint, and track daily tasks via a dashboard (and optionally WhatsApp nudges).

**Language**: German (user-facing content), English (code/comments)

## Tech Stack
```
Frontend: React 18 + Vite + Tailwind CSS
Backend:  Supabase (PostgreSQL + Auth + RLS)
Auth:     Google OAuth via Supabase
Deploy:   Vercel (frontend) + Supabase (backend)
Optional: WhatsApp Cloud API (via Make.com webhooks)
```

## Project Structure
```
src/
├── App.jsx              # Routes: /, /auth, /intake, /generating, /dashboard, /admin
├── main.jsx             # Entry point with AuthProvider
├── contexts/
│   └── AuthContext.jsx  # Supabase auth state management
├── components/
│   └── ProtectedRoute.jsx
├── pages/
│   ├── LandingPage.jsx  # Marketing page
│   ├── AuthPage.jsx     # Google login
│   ├── IntakePage.jsx   # Multi-step form (age, goals, sleep, stress, etc.)
│   ├── GeneratingPage.jsx # Loading screen during plan generation
│   ├── DashboardPage.jsx  # 30-day plan view + task tracking
│   └── AdminPage.jsx    # Admin-only analytics
├── lib/
│   ├── supabase.js      # Supabase client init
│   ├── dataService.js   # CRUD operations for plans/intake/progress
│   ├── planBuilder.js   # ⭐ CORE: Deterministic plan generation (v2.0 Enhanced)
│   ├── llmPlanGenerator.js # LLM-based generation (OpenAI/Claude fallback)
│   └── planGenerator.js # Orchestrator: tries LLM first, falls back to algorithm
sql/
├── schema.sql           # Full DB schema with RLS policies
├── admin_policies.sql   # Admin-specific access
└── fix_rls.sql          # RLS fixes
docs/                    # Product documentation (01-10)
landing/                 # Standalone landing page (separate from React app)
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

### Database Tables
- `user_profiles` - Linked to Supabase Auth
- `intake_responses` - Form submissions
- `plans` - Generated 30-day plans (JSONB)
- `daily_progress` - Task completion tracking
- `whatsapp_messages` - Message logs (optional)

## Common Tasks

### Run Development Server
```bash
npm run dev        # Vite dev server on localhost:5173
npm run build      # Production build
npm run lint       # ESLint check
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

## Gotchas & Tips
1. **RLS**: All tables have Row Level Security. User can only see own data.
2. **plan_data JSONB**: Full 30-day plan stored as JSON in `plans` table.
3. **Freshness 0.00**: Means task was just added to history (expected).
4. **Prerequisites**: New users only see beginner tasks without prerequisites.
5. **German Content**: Task descriptions (`how` field) are in German.
6. **Mastery Calculation**: Based on `userCompletions[pillar]` count.

## Extending the Task Library
Tasks are in `TASKS_EXAMPLE` array in `planBuilder.js`. To add tasks:
1. Use unique ID (e.g., `MOV025`)
2. Set appropriate `level` and `prerequisites`
3. Follow existing tag conventions
4. Keep `how` text concise (German)

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

## Related Files
- `/landing/index.html` - Standalone marketing page with Longevity Score calculator
- `/docs/` - Product specs, user flows, deployment checklist
- `/PROMPT_LONGEVITY_SCORE.md` - Implementation prompt for Life in Weeks UI
