# ExtensioVitae

**Your Personalized 30-Day Longevity Blueprint**

Science-informed. Delivered daily. Under 30 minutes.

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## Project Structure

```
extensiovitae/
├── docs/                    # Documentation
│   ├── 01-PRODUCT-OVERVIEW.md
│   ├── 02-USER-FLOW.md
│   ├── 03-LANDING-PAGE.md
│   ├── 04-INTAKE-FORM.md
│   ├── 05-AI-PLAN-GENERATION.md
│   ├── 06-WHATSAPP-FLOW.md
│   ├── 07-DASHBOARD.md
│   ├── 09-MAKE-AUTOMATIONS.md
│   └── 10-DEPLOYMENT-CHECKLIST.md
├── src/
│   ├── lib/
│   │   ├── supabase.js      # Supabase client (optional)
│   │   ├── planBuilder.js   # Deterministic plan generation
│   │   └── taskLibrary.js   # Task definitions
│   └── pages/
│       ├── LandingPage.jsx
│       ├── IntakePage.jsx
│       └── DashboardPage.jsx
├── package.json
├── vite.config.js
└── index.html
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| State | localStorage (MVP) |
| Plan Generation | Deterministic algorithm (no LLM) |
| Hosting | Any static host (Vercel, Netlify) |

---

## The 6 Longevity Pillars

| Pillar | Icon | Description |
|--------|------|-------------|
| 🌙 Sleep & Recovery | `sleep_recovery` | Regeneration, hormones, brain health |
| ☀️ Circadian Rhythm | `circadian_rhythm` | Light, caffeine timing, daily rhythm |
| 🧠 Mental Resilience | `mental_resilience` | Stress management, breathwork, mindfulness |
| 🥗 Nutrition & Metabolism | `nutrition_metabolism` | Protein timing, blood sugar control |
| 💪 Movement & Muscle | `movement_muscle` | Strength, NEAT, Zone-2 cardio |
| 💊 Supplements | `supplements` | Targeted supplementation |

---

## User Flow

1. **Landing Page** → Explains the product
2. **Intake Form** → 12-question questionnaire (German)
3. **Dashboard** → Personalized 30-day plan with daily tasks

---

## Dashboard Features

### Main Content Area
- **Heute (Today)**: Current date, day number, tasks with checkboxes
- **Dein Plan**: Plan summary, focus areas, "30-Tage Plan ansehen" button
- **Die 6 Säulen**: Inline pillars explanation with personalized need scores

### Sidebar
- **Your 30 Days**: Calendar grid with completion status
- **Meine Angaben ansehen**: Button to view intake form answers

### Modals
- **Full Plan Modal**: All 30 days with phases and tasks
- **Intake Data Modal**: Original questionnaire answers

---

## Data Storage (MVP)

| Key | Description |
|-----|-------------|
| `intake_data` | User's questionnaire answers |
| `plan_progress` | Task completion status per day |

---

## Development

```bash
# Start development server on port 3100
npm run dev

# Access the app
open http://localhost:3100
```

---

## Key Decisions

1. **German UI** — Primary market is DACH region
2. **No authentication for MVP** — Uses localStorage
3. **Deterministic plan generation** — Same inputs = same output
4. **No gamification** — Target users are adults who don't need badges
5. **30-minute daily limit** — All tasks must fit within this constraint
6. **No medical claims** — Lifestyle optimization language only

---

## License

Proprietary. All rights reserved.

---

Built with focus by the ExtensioVitae team.
# Test
