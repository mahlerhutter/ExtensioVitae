# ExtensioVitae 🌟

> **Science-backed longevity protocols. Personalized. Delivered daily.**

A minimalist PWA that generates 30-day longevity blueprints based on user intake data. Built with React, Tailwind CSS, and Supabase.

[![Status](https://img.shields.io/badge/status-v0.6.0%20Beta-blue)](https://extensiovitae.vercel.app)
[![Production](https://img.shields.io/badge/production-95%25%20Ready-success)]()
[![License](https://img.shields.io/badge/license-Proprietary-red)]()

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

**Environment Variables:**
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## ✨ Features

### 🎯 **8-Day MVP Sprint (Complete)**

| Day | Feature | Status | Description |
|-----|---------|--------|-------------|
| 1 | **Longevity Score** | ✅ | Biological baseline scoring with animated donut chart |
| 2 | **Commitment Contract** | ✅ | Blocking signature modal with premium design |
| 3 | **WhatsApp Self-Loop** | ✅ | Send plan link to yourself (mobile/desktop optimized) |
| 4 | **Focus Mode** | ✅ | Time-based task filtering with Active Recovery state |
| 5 | **Quick Win + Confetti** | ✅ | First-task momentum with custom confetti effect |
| 6 | **Calendar Export** | ✅ | RFC 5545 compliant .ics file generation |
| 7 | **Evidence Tooltips** | ✅ | Science-backed explanations for 10+ keywords |
| 8 | **Social Share Card** | ✅ | 1080x1080 shareable score image via Canvas API |

### 🎨 **Design Philosophy**

- **Calm Technology:** Minimalist, high-contrast aesthetic
- **Mobile-First:** Responsive design with keyboard handling
- **Performance:** Lightweight, dependency-free implementations
- **Accessibility:** Clear typography, sufficient contrast, touch-friendly

### 🧬 **v0.4.0 - Intelligence Layer (Complete)**

| Feature | Status | Description |
|---------|--------|-------------|
| **Circadian Light Protocol** | ✅ | Dynamic light exposure recommendations based on time of day |
| **Supplement Timing Optimizer** | ✅ | Science-backed timing for supplements aligned with circadian rhythm |
| **AI Context Injection** | ✅ | Enhanced plan generation with user profile and historical data |
| **Fasting Window Calculator** | ✅ | Intermittent fasting support with visual timeline |
| **Telegram Bot** | 🟡 | Code complete, awaiting deployment (token needed) |
| **Error Monitoring** | 🟡 | Sentry integration (soft-ready) |
| **Security Headers** | ✅ | Production-ready security configuration |

### 🚀 **v0.5.0 - Strategic Bets (Complete)**

| Feature | Status | Description |
|---------|--------|-------------|
| **Lab Snapshot Lite** | ✅ | Biomarker tracking with color-coded status for 10 key markers |
| **Recovery Score** | ✅ | 3-question morning check-in with auto-swap (HIIT → Yoga Nidra) |
| **Calendar Event Detection** | ✅ | Smart detection of flights, focus blocks, late-night events |
| **Biological Supplies Widget** | ✅ | Inventory tracking with smart refill recommendations |
| **Supplement Timing Protocol** | ✅ | Optimized supplement scheduling based on circadian rhythm |

### 🧪 **v0.6.0 - Lab Results Integration (Beta)**

| Feature | Status | Description |
|---------|--------|-------------|
| **Lab Upload** | ✅ | Drag & drop PDF/image upload with secure storage |
| **OCR Parsing** | ✅ | Claude 3.5 Sonnet vision API for biomarker extraction |
| **Biomarker Database** | ✅ | Normalized schema for trend analysis (lab_results + biomarkers) |
| **Detail View** | ✅ | Modal with categorized biomarkers and status indicators |
| **Dashboard Integration** | ✅ | Quick Actions + NextBestAction wiring |
| **Edge Function** | 🟡 | Implemented, pending deployment |

---

## 📁 Project Structure

```
src/
├── components/
│   ├── dashboard/           # Dashboard components
│   ├── modules/             # Module system (DailyView, ModuleHub, etc.)
│   ├── bloodcheck/          # Blood check UI (Panel, Upload, BiomarkerCard)
│   ├── analytics/           # Progress dashboard (Streaks, Charts)
│   ├── notifications/       # Notification settings & history
│   ├── marketplace/         # Module marketplace
│   └── common/              # Shared (ErrorBoundary, LoadingFallback)
├── lib/
│   ├── moduleService.js         # Module registry & instances
│   ├── dailyTrackingService.js  # Daily aggregation
│   ├── bloodCheckService.js     # Lab OCR integration
│   ├── readinessService.js      # Readiness scoring
│   ├── analyticsService.js      # Progress & achievements
│   ├── notificationService.js   # Push notifications
│   ├── offlineService.js        # Service worker management
│   └── [more services]
├── hooks/
│   └── useOptimizedQuery.js     # Cached data fetching
├── pages/
│   └── [12 pages]
├── supabase/functions/
│   └── parse-lab-report/        # OCR Edge Function
└── public/
    └── sw.js                    # Service worker
```

---

## 🔧 Technical Stack

- **Frontend:** React 18 + Vite
- **Styling:** Tailwind CSS
- **Backend:** Supabase (Auth, Database, Storage)
- **State:** React Context + Local Storage
- **Analytics:** PostHog (optional)
- **Deployment:** Vercel / Netlify ready

---

## 📊 Key Metrics

- **Intake Time:** ~3 minutes
- **Plan Generation:** <5 seconds
- **Daily Time Commitment:** ≤30 minutes
- **Protocol Duration:** 30 days
- **Longevity Pillars:** 6 (Sleep, Movement, Nutrition, Calm, Connection, Environment)

---

## 🧪 Development

### Testing Commitment Contract
```javascript
// In browser console:
localStorage.removeItem('has_signed_contract');
localStorage.removeItem('contract_signer_name');
// Reload page
```

### Testing Focus Mode
- Morning (05:00-11:00): Morning tasks visible
- Day (11:00-21:00): Day tasks visible
- Evening (21:00-05:00): Evening tasks visible
- Active Recovery: Shows when no tasks in current block

### Mobile Testing
- Test on iPhone SE/Mini for keyboard handling
- Verify WhatsApp button on mobile vs desktop
- Check video responsiveness

---

## 🚨 Known Issues

### Permission Error (macOS)
```bash
# If you see EPERM errors:
sudo chown -R $(whoami) ~/.npm
rm -rf node_modules
npm install
```

### Husky Pre-commit
```bash
# Skip hooks if needed:
git commit --no-verify -m "your message"
```

---

## 📝 Documentation

- **[CHANGELOG.md](./docs/CHANGELOG.md)** - Version history and release notes
- **[FEATURES.md](./FEATURES.md)** - Comprehensive feature documentation
- **[FUTURE.md](./docs/FUTURE.md)** - Roadmap and module priority matrix
- **[tasks.md](./docs/tasks.md)** - Current tasks and execution priorities
- **[CLAUDE.MD](./CLAUDE.MD)** - Development prompts and context
- **Inline Comments** - Code-level documentation

---

## 🎯 Roadmap

### ✅ Phase 2 (Complete - 2026-02-04)
- [x] Modular Tracking System (Module Registry, Daily Aggregation)
- [x] 30-Day Plan → Module Conversion
- [x] Fasting Modules (5:2, OMAD, Extended)
- [x] Module Activation Flow (Onboarding)

### ✅ Phase 3 (Complete - 2026-02-04)
- [x] Blood Check OCR (Claude Vision API via Edge Function)
- [x] Readiness-based Task Swapping (5 intensity levels)
- [x] Progress Analytics (Streaks, Achievements)
- [x] Notification Engine (Push + Quiet Hours)

### ✅ Phase 4 (Complete - 2026-02-04)
- [x] Blood Check UI Components
- [x] Progress Dashboard UI
- [x] Notification Settings UI
- [x] Module Marketplace UI
- [x] Error Boundaries and Fallbacks
- [x] Code Splitting / Lazy Loading
- [x] Service Worker (Offline Support)

### Phase 5 (Planned)
- [ ] One-Tap Protocol Packs
- [ ] Circadian Light Protocol
- [ ] Wearable Integration (Oura, Whoop)
- [ ] Multi-language support (DE/EN)
- [ ] Full TypeScript migration

---

## 🤝 Contributing

### Code Style
- Functional components with hooks
- Tailwind CSS (no inline styles)
- ESLint + Prettier
- Meaningful commit messages

### Commit Convention
```
feat: add new feature
fix: bug fix
style: formatting
refactor: code restructuring
docs: documentation
test: testing
chore: maintenance
```

---

## 📄 License

Proprietary - All rights reserved © 2025 ExtensioVitae

---

## 📞 Contact

- **Email:** hello@extensiovitae.com
- **Website:** [extensiovitae.com](https://extensiovitae.com)

---

**Built with ❤️ for longevity optimization**
