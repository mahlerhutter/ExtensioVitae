# EXTENSIOVITAE — Dashboard

## Design Philosophy

- Minimal, calm interface
- No gamification (no points, badges, streaks)
- Focus on today + 30-day overview
- Quick task completion
- Mobile-first
- German UI language

---

## What the User Sees

### Primary View: Heute (Today's Tasks)
- Current date in German format (e.g., "Sonntag, 1. Februar 2026")
- Current day number (e.g., "Tag 1 von 30")
- List of 1-3 tasks with checkboxes
- Pillar icons and colors next to each task
- Time estimate per task
- Total time remaining
- Progress ring showing completion status

### Secondary View: Your 30 Days
- Calendar/grid of all 30 days
- Visual completion status (Complete, Partial, Missed, Future)
- Click to view any day's tasks
- Current day highlighted in amber

### Tertiary View: Dein Plan (Plan Summary)
- Personalized summary paragraph
- Primary focus pillars with colored badges
- **"30-Tage Plan ansehen →"** button (opens fullscreen modal with all 30 days)
- "Download PDF →" button (placeholder)

### Quaternary View: Die 6 Säulen der Langlebigkeit (Pillars Explanation)
- Inline collapsible box (not a modal)
- Shows top 3 pillars sorted by user's personalized need score
- Expandable to show all 6 pillars
- Each pillar displays:
  - Emoji icon
  - Name (German)
  - Need percentage bar
  - Short description

### Sidebar Links
- **"Neuen Plan erstellen"** — Navigate to intake form to create a new plan
- **"🩺 Gesundheitsprofil"** ⭐ **NEW (v2.1)** — Opens health profile page for managing chronic conditions, injuries, and health data
- **"Meine Angaben ansehen"** — Opens modal showing original intake questionnaire answers

---

## Component List

| Component | Description |
|-----------|-------------|
| `DashboardLayout` | Main container with header and content area |
| `DashboardHeader` | Logo, user name, sign out button |
| `TodayCard` | Current day's tasks with checklist and date display |
| `TaskItem` | Individual task with checkbox, pillar color, time |
| `ProgressRing` | Circular indicator of today's completion (completed/total) |
| `MonthOverview` | 30-day grid showing completion status |
| `DayCell` | Individual day in the grid (clickable for past days) |
| `PlanSummary` | Text summary with focus pillars and 30-day plan button |
| `PillarsExplanationBox` | Inline collapsible box explaining the 6 longevity pillars |
| `FullPlanModal` | Modal showing all 30 days with tasks and phases |
| `IntakeDataModal` | Modal showing user's original questionnaire answers |

---

## Layout Description (Desktop)

```
┌────────────────────────────────────────────────────────────────┐
│ HEADER                                                         │
│ [ExtensioVitae Logo]                    [UserName] [Sign Out]  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────────────────────┐  ┌────────────────────┐  │
│  │ HEUTE                           │  │ YOUR 30 DAYS       │  │
│  │ Sonntag, 1. Februar 2026        │  │ [1][2][3]...       │  │
│  │ Tag 1 von 30                    │  │ Calendar Grid      │  │
│  │                                 │  │                    │  │
│  │ ○ Progress Ring (0/2)           │  │ ● Complete         │  │
│  │                                 │  │ ◐ Partial          │  │
│  │ ☐ [Circadian] Task 1     3 min  │  │ ○ Missed           │  │
│  │ ☐ [Sleep] Task 2         5 min  │  │ [ ] Future         │  │
│  │                                 │  │                    │  │
│  │ Gesamt: 8 min    8 min übrig    │  │ [📄 Meine Angaben] │  │
│  └─────────────────────────────────┘  └────────────────────┘  │
│                                                                │
│  ┌─────────────────────────────────┐                          │
│  │ DEIN PLAN                       │                          │
│  │ "Generated specifically for..." │                          │
│  │                                 │                          │
│  │ Fokus-Bereiche: [Sleep][Mental] │                          │
│  │                                 │                          │
│  │ [📅 30-Tage Plan] [Download PDF]│                          │
│  └─────────────────────────────────┘                          │
│                                                                │
│  ┌─────────────────────────────────┐                          │
│  │ DIE 6 SÄULEN DER LANGLEBIGKEIT  │                          │
│  │ Sortiert nach deinem Bedarf     │                          │
│  │                                 │                          │
│  │ 🌙 Schlaf & Erholung      73%   │                          │
│  │ ☀️ Circadianer Rhythmus   78%   │                          │
│  │ 🧠 Mentale Resilienz      82%   │                          │
│  │                                 │                          │
│  │ [↓ Alle 6 Säulen anzeigen]      │                          │
│  └─────────────────────────────────┘                          │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│ FOOTER                                                         │
│ Need help? hello@extensiovitae.com                            │
└────────────────────────────────────────────────────────────────┘
```

---

## The 6 Pillars Configuration

| Pillar ID | German Name | Icon | Color | Tailwind Class |
|-----------|-------------|------|-------|----------------|
| `sleep_recovery` | Schlaf & Erholung | 🌙 | Indigo | `bg-indigo-500` |
| `circadian_rhythm` | Circadianer Rhythmus | ☀️ | Amber | `bg-amber-500` |
| `mental_resilience` | Mentale Resilienz | 🧠 | Purple | `bg-purple-500` |
| `nutrition_metabolism` | Ernährung & Metabolismus | 🥗 | Orange | `bg-orange-500` |
| `movement_muscle` | Bewegung & Muskulatur | 💪 | Emerald | `bg-emerald-500` |
| `supplements` | Supplements | 💊 | Cyan | `bg-cyan-500` |

---

## Modal Components

### FullPlanModal (30-Tage Plan ansehen)
- Header: "Dein 30-Tage Plan" + plan summary
- Scrollable list of all 30 days
- Each day shows:
  - Day number
  - Phase badge (Stabilisieren/Aufbauen/Optimieren/Festigen)
  - Total time
  - Completion status if any tasks done
  - List of tasks with pillar colors

### IntakeDataModal (Meine Angaben ansehen)
- Header: "Deine Angaben"
- Displays all intake form answers:
  - Name, Alter, Geschlecht
  - Hauptziel
  - Schlaf, Stresslevel
  - Trainingsfrequenz, Ernährungsmuster
  - Größe, Gewicht, Equipment
  - Eingabedatum

---

## Plan Phases

The 30-day plan is divided into 4 phases:

| Phase | Days | German Label | Color |
|-------|------|--------------|-------|
| Stabilize | 1-7 | Stabilisieren | Blue |
| Build | 8-14 | Aufbauen | Emerald |
| Optimize | 15-21 | Optimieren | Amber |
| Consolidate | 22-30 | Festigen | Purple |

---

## Responsive Behavior

### Desktop (≥1024px)
- Two-column layout
- Main content (TodayCard, PlanSummary, Pillars) on left (col-span-2)
- 30-day calendar + buttons on right

### Tablet (768px–1023px)
- Single column, stacked
- Today's tasks first
- 30-day overview below

### Mobile (<768px)
- Full-width cards
- Larger touch targets (48px minimum)
- 30-day grid becomes scrollable horizontal strip

---

## Interactions

| Action | Behavior |
|--------|----------|
| Click checkbox | Toggle task complete, save to localStorage |
| Click day cell | Show that day's tasks (only past/current days) |
| Click "30-Tage Plan ansehen" | Open full plan modal |
| Click "Meine Angaben ansehen" | Open intake data modal |
| Click "Alle 6 Säulen anzeigen" | Expand pillars box to show all 6 |
| Click "Sign Out" | Clear session, navigate to landing |

---

## State Management

```typescript
interface DashboardState {
  plan: LongevityPlan | null;
  progress: Record<number, Record<string, boolean>>;
  currentDay: number;
  selectedDay: number | null;
  loading: boolean;
  showIntakeModal: boolean;
  showFullPlanModal: boolean;
  intakeData: IntakeData | null;
}
```

---

## Data Flow

### On Load
1. Read `intake_data` from localStorage
2. If exists: Generate plan via `build30DayBlueprint(intakeData, TASKS)`
3. Calculate current day based on `plan.start_date`
4. Read `plan_progress` from localStorage for completion status
5. If no intake data: Fall back to MOCK_PLAN

### On Task Toggle
1. Optimistic UI update
2. Update `progress` state
3. Save to localStorage under `plan_progress`

### Plan Generation
- Uses deterministic `build30DayBlueprint()` function in `src/lib/planBuilder.js`
- Generates unique task IDs per day: `d{day}_t{index}_{originalId}`
- Calculates need scores per pillar based on intake data

---

## LocalStorage Keys

| Key | Content |
|-----|---------|
| `intake_data` | User's questionnaire answers (JSON) |
| `plan_progress` | Completion status per day/task (JSON) |

---

*Decision: No streaks or gamification. Users are high-performing adults who don't need badges. Simple completion tracking only.*

*Decision: German UI language for primary market.*
