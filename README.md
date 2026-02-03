# ExtensioVitae

**Your Personalized 30-Day Longevity Blueprint**

Science-informed. Delivered daily. Under 30 minutes.

---

## Overview

ExtensioVitae is a sophisticated longevity lifestyle optimization platform that generates personalized 30-day blueprints based on scientific pillars. It uses advanced algorithms and optional AI (LLM) to craft daily routines tailored to user goals, time constraints, and health profiles.

## Key Features

-   **Personalized Blueprints**: 30-day plans based on 6 core longevity pillars.
-   **Health Profile Integration**: Adapts plans for chronic conditions, injuries, and limitations.
-   **Hybrid Generation Engine**:
    -   **Deterministic**: Robust, rule-based generation (Default).
    -   **AI-Enhanced**: Optional LLM integration (OpenAI/Claude) for hyper-personalized content.
-   **Longevity Score**: Real-time scoring based on scientific literature (Cappuccio, Walker, Yin).
-   **Progress Tracking**: Daily check-ins and completion analytics.
-   **Flexible Architecture**:
    -   **Privacy-First**: Works entirely client-side with localStorage.
    -   **Cloud-Sync**: Optional Supabase integration for cross-device sync and authentication.

---

## The 6 Longevity Pillars

| Pillar | Focus | Scientific Basis |
| :--- | :--- | :--- |
| 🌙 **Sleep & Recovery** | Hygiene, duration, environment | *Walker (2017), Cappuccio (2010)* |
| ☀️ **Circadian Rhythm** | Light exposure, timing | *Satchin Panda, Huberman* |
| 🧠 **Mental Resilience** | Breathwork, meditation | *Steptoe & Kivimäki (2012)* |
| 🥗 **Nutrition & Metabolism** | Protein timing, glucose control | *Valter Longo, Peter Attia* |
| 💪 **Movement & Muscle** | NEAT, Zone-2, Strength | *Study references on sarcopenia* |
| 💊 **Supplements** | Targeted protocols | *Evidence-based supplementation* |

---

## Tech Stack

-   **Frontend**: React 18, Vite, Tailwind CSS
-   **State Management**: React Context + Custom Hooks
-   **Data Persistence**: Hybrid (localStorage + Supabase)
-   **AI/LLM**: OpenAI GPT-4 / Anthropic Claude (via API proxy)
-   **Analytics**: PostHog (Privacy-focused)
-   **Logging**: Centralized Logger with environment awareness

---

## Quick Start

### 1. Installation

```bash
# Install dependencies
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` (or create one):

```bash
cp .env.example .env
```

**Required Variables for Full Feature Set:**

```env
# Supabase (Required for Auth, Sync & LLM Proxy)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Analytics (Optional)
VITE_POSTHOG_API_KEY=your_posthog_key
VITE_POSTHOG_HOST=https://eu.i.posthog.com

# Logging
VITE_LOG_LEVEL=info
```

**Note:** LLM API Keys (OpenAI/Anthropic) are now managed securely via Supabase Edge Functions and are NOT stored in the frontend `.env` file.

### 3. Development

```bash
npm run dev
```

### 4. Production Build

```bash
npm run build
```

---

## Project Structure

```
extensiovitae/
├── src/
│   ├── lib/                 # Core Logic
│   │   ├── planBuilder.js   # Deterministic algorithm
│   │   ├── llmPlanGenerator.js # AI generation logic
│   │   ├── longevityScore.js # Scoring algorithm
│   │   ├── healthConstraints.js # Medical/Health logic
│   │   └── supabase.js      # Database client
│   ├── pages/               # Route Components
│   │   ├── IntakePage.jsx   # Questionnaire
│   │   ├── GeneratingPage.jsx # Loading/Processing
│   │   └── DashboardPage.jsx # Main User Interface
│   └── components/          # UI Components
├── sql/
│   ├── complete_database_setup.sql # Single source of truth
│   ├── CHANGELOG.md         # Database version history
│   └── archive/             # Old fix scripts
├── docs/
│   ├── README.md            # Documentation index
│   ├── tasks.md             # Current priorities
│   ├── POST_DATABASE_SETUP.md # Setup guide
│   └── archive/             # Resolved documentation
└── CLEANUP_SUMMARY.md       # Recent cleanup (2026-02-03)
```

**📚 For detailed documentation, see [`docs/README.md`](docs/README.md)**

---

## Scoring System

The **Longevity Score** (0-100) is calculated using a weighted algorithm derived from meta-analyses on mortality risk factors.

-   **Baseline**: 50 points
-   **Multipliers**: Sleep duration, stress levels, VO2 max proxies (activity), diet quality.
-   **Penalties**: Smoking, inactivity, poor social connection.

*Note: This is a motivational metric, not a medical diagnosis.*

---

## License

Proprietary. All rights reserved by ExtensioVitae.
Built with focus by the ExtensioVitae team.
