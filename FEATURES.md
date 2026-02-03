# ExtensioVitae - Feature Documentation

**Last Updated:** 2026-02-03  
**Branch:** `dev-feature`  
**Status:** MVP Complete - 8-Day Sprint ✅

---

## 🎯 Overview

ExtensioVitae is a science-backed longevity lifestyle platform that generates personalized 30-day protocols based on user intake data. The platform follows "Calm Technology" principles with a minimalist, high-contrast aesthetic.

---

## 📦 Core Features

### 1. **Longevity Scoring System** (Day 1)
**File:** `src/utils/scoring.ts`

- **Algorithm:** Calculates biological baseline score (0-100) based on:
  - Sleep quality and duration
  - Exercise frequency and intensity
  - Stress levels
  - Nutrition patterns
- **Visualization:** Animated SVG donut chart (`src/components/ScoreGauge.tsx`)
- **Display Locations:**
  - Plan Review Modal (after generation)
  - Dashboard Longevity Score Widget
- **Features:**
  - Count-up animation on mount
  - Color-coded by score tier (red/amber/green)
  - Shows biological age vs chronological age
  - Displays potential gain in years

**Usage:**
```javascript
import { calculateLongevityScore } from './utils/scoring';
const scoreData = calculateLongevityScore(intakeData);
// Returns: { score, biologicalAge, potentialGainYears, breakdown, ... }
```

---

### 2. **Commitment Contract** (Day 2)
**File:** `src/components/CommitmentModal.jsx`

- **Trigger:** First dashboard visit (checks `localStorage`)
- **Blocking Modal:** User must sign before accessing dashboard
- **Design:** Premium serif font, fade animations, legal aesthetic
- **Mobile Fix:** Scrollable container prevents keyboard from hiding button
- **Storage:** Saves signature to `localStorage`
  - `has_signed_contract`: 'true'
  - `contract_signer_name`: user's name

**Features:**
- Enter key support for submission
- Responsive text sizing (mobile/desktop)
- Disabled state when name is empty
- Unique signature ID generation

---

### 3. **WhatsApp Self-Loop** (Day 3)
**File:** `src/components/WhatsAppButton.jsx`

- **Purpose:** Send plan link to yourself for easy access
- **Mobile Detection:** Uses User Agent (not window width)
- **URLs:**
  - **Mobile:** `wa.me//` (opens contact picker)
  - **Desktop:** `web.whatsapp.com/send` (works without contact)
- **Location:** Dashboard sidebar
- **Message Template:** "My ExtensioVitae Protocol: [URL] — Pin this chat to keep your plan accessible."

**Fix Applied:** Prevents ~40% desktop users from experiencing broken button

---

### 4. **Focus Mode** (Day 4)
**Files:** 
- `src/utils/time.js` (time utilities)
- `src/components/dashboard/TodayCard.jsx` (UI)

**Time Blocks:**
- **Morning:** 05:00 - 11:00
- **Day:** 11:00 - 21:00
- **Evening:** 21:00 - 05:00

**Features:**
- Toggle switch to enable/disable Focus Mode
- Filters tasks by current time block
- Shows current block name and icon
- **Active Recovery State:** When no tasks in current block:
  - Shows next protocol time
  - Displays micro-actions (hydrate, walk, rest)
  - Prevents "app is broken" perception

**Functions:**
```javascript
import { getCurrentBlock, isTaskInCurrentBlock } from './utils/time';
const block = getCurrentBlock(); // 'morning' | 'day' | 'evening'
const isRelevant = isTaskInCurrentBlock(task, block);
```

---

### 5. **Quick Win + Confetti** (Day 5)
**Files:**
- `src/lib/planGenerator.js` (task injection)
- `src/utils/confetti.js` (animation)
- `src/components/dashboard/TaskItem.jsx` (UI)

**Quick Win Task:**
- **Name:** "Hydration Kickstart"
- **Injected:** Day 1, position 0 (first task)
- **Visual:** Gold border + "Start Here" badge
- **On Complete:** 
  - Custom confetti effect (no dependencies)
  - Success toast: "🎉 Momentum started!"

**Confetti:**
- Lightweight, dependency-free implementation
- 50 particles with physics simulation
- Auto-cleanup after 3 seconds

---

### 6. **Calendar Export** (Day 6)
**File:** `src/utils/icsGenerator.js`

- **Format:** RFC 5545 compliant `.ics` file
- **Events:**
  - Morning Protocol: 7:00 AM (daily)
  - Evening Protocol: 9:00 PM (daily)
  - Duration: 30 days from plan start
- **Location:** Dashboard sidebar "Sync to Calendar" button
- **Analytics:** Tracks `calendar_export` feature usage

**Functions:**
```javascript
import { generateICS, downloadICS } from './utils/icsGenerator';
const icsContent = generateICS(planStartDate, planEndDate, planTitle);
downloadICS(icsContent, 'extensiovitae-protocol.ics');
```

---

### 7. **Evidence Tooltips** (Day 7)
**Files:**
- `src/utils/scienceData.js` (keyword database)
- `src/components/dashboard/EvidenceText.jsx` (component)

**Keywords Supported:**
- Magnesium, Sunlight, Protein, Omega-3, Fiber
- Cortisol, Melatonin, Dopamine, BDNF, Autophagy

**Features:**
- Regex-based keyword detection in task descriptions
- Clickable keywords with dashed underline
- Tooltip shows:
  - Scientific mechanism ("why")
  - Research source (PubMed link)
- Click outside to close
- Integrated into all TaskItem components

**Usage:**
```jsx
import EvidenceText from './components/dashboard/EvidenceText';
<EvidenceText text="Get morning Sunlight for 10 minutes" />
```

---

### 8. **Social Share Card** (Day 8)
**File:** `src/components/ShareScoreCard.jsx`

- **Format:** 1080x1080 PNG (Instagram-ready)
- **Content:**
  - Longevity score as donut chart
  - User name (if available)
  - ExtensioVitae branding
- **Technology:** Canvas API (no external dependencies)
- **Sharing:**
  - **Mobile:** Web Share API (Instagram, WhatsApp, etc.)
  - **Desktop:** Download as PNG
- **Locations:**
  - Plan Review Modal (after generation)
  - Dashboard Longevity Score Widget

**Features:**
- Color-coded score visualization
- Gradient background
- Professional typography
- One-click sharing

---

## 🎨 Design System

### Color Palette
```css
/* Background */
--slate-950: #020617
--slate-900: #0f172a
--slate-800: #1e293b

/* Accent */
--amber-400: #fbbf24
--amber-500: #f59e0b

/* Text */
--white: #ffffff
--slate-300: #cbd5e1
--slate-400: #94a3b8
```

### Typography
- **Primary:** System font stack (Inter, SF Pro, Roboto)
- **Serif:** Georgia (for Commitment Contract)
- **Mono:** Monospace (for technical elements)

### Spacing
- Mobile: Reduced padding (`p-4` instead of `p-6`)
- Desktop: Standard spacing (`p-6`, `p-8`, `p-12`)

---

## 🗂️ File Structure

```
src/
├── components/
│   ├── CommitmentModal.jsx          # Day 2: Signature modal
│   ├── ScoreGauge.tsx               # Day 1: Animated score donut
│   ├── ShareScoreCard.jsx           # Day 8: Social share generator
│   ├── WhatsAppButton.jsx           # Day 3: Self-loop button
│   └── dashboard/
│       ├── EvidenceText.jsx         # Day 7: Science tooltips
│       ├── LongevityScoreWidget.jsx # Dashboard score display
│       ├── TaskItem.jsx             # Task rendering + confetti
│       └── TodayCard.jsx            # Day 4: Focus Mode UI
├── utils/
│   ├── confetti.js                  # Day 5: Confetti animation
│   ├── icsGenerator.js              # Day 6: Calendar export
│   ├── scienceData.js               # Day 7: Evidence database
│   ├── scoring.ts                   # Day 1: Longevity algorithm
│   └── time.js                      # Day 4: Time block utilities
├── lib/
│   ├── planGenerator.js             # Quick Win injection
│   └── planOverviewService.js       # Score calculation integration
└── pages/
    ├── DashboardPage.jsx            # Main dashboard
    ├── LandingPage.jsx              # Hero video
    └── GeneratingPage.jsx           # Plan generation flow
```

---

## 🔧 Technical Details

### State Management
- **React Context:** `AuthContext` for user authentication
- **Local Storage:** 
  - Commitment contract signature
  - Task completion progress
  - User preferences
- **Supabase:** Plan data, user profiles, analytics

### Mobile Optimizations
1. **Keyboard Handling:** Modal scrolling prevents button hiding
2. **User Agent Detection:** Reliable mobile/desktop distinction
3. **Responsive Sizing:** Breakpoints at `md:` (768px)
4. **Touch Targets:** Minimum 44px for buttons
5. **Video:** `playsInline` for iOS autoplay

### Performance
- **Confetti:** RequestAnimationFrame for smooth 60fps
- **Score Animation:** CSS transitions + JS count-up
- **Lazy Loading:** Components loaded on-demand
- **Image Optimization:** WebP with PNG fallback

---

## 🚀 Deployment Checklist

### Environment Variables
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Build Commands
```bash
npm install          # Install dependencies
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
```

### Known Issues
- **Node Modules Permission:** Run `sudo chown -R $(whoami) ~/.npm` if needed
- **Husky Pre-commit:** Use `--no-verify` flag if hooks fail

---

## 📊 Analytics Events

```javascript
trackFeatureUsed('calendar_export')    // Calendar sync
trackFeatureUsed('whatsapp_share')     // WhatsApp button
trackFeatureUsed('social_share')       // Score sharing
trackFeatureUsed('focus_mode_toggle')  // Focus Mode
trackFeatureUsed('quick_win_complete') // First task completion
```

---

## 🧪 Testing Scenarios

### Commitment Contract
```javascript
// Reset contract in browser console:
localStorage.removeItem('has_signed_contract');
localStorage.removeItem('contract_signer_name');
// Reload page to see modal
```

### Focus Mode
- Test at 08:00 (morning), 14:00 (day), 22:00 (evening)
- Verify Active Recovery state when no tasks
- Check next protocol time accuracy

### Mobile Keyboard
- Test on iPhone SE/Mini (small screens)
- Verify button stays accessible when keyboard opens
- Test Enter key submission

### WhatsApp Button
- **Mobile:** Should open contact picker
- **Desktop:** Should open web.whatsapp.com
- Verify message text includes plan URL

---

## 📝 Future Enhancements

### Planned Features
- [ ] Push notifications for protocol reminders
- [ ] Streak tracking and gamification
- [ ] Social proof (community stats)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Dark/Light theme toggle
- [ ] Offline mode with service worker

### Technical Debt
- [ ] Add TypeScript to all components
- [ ] Implement comprehensive test suite
- [ ] Add error boundaries
- [ ] Optimize bundle size
- [ ] Add accessibility audit
- [ ] Implement proper SEO meta tags

---

## 🤝 Contributing

### Code Style
- Use functional components with hooks
- Follow ESLint configuration
- Use Tailwind CSS (no inline styles)
- Comment complex logic
- Keep components under 200 lines

### Commit Convention
```
feat: add new feature
fix: bug fix
style: formatting changes
refactor: code restructuring
docs: documentation updates
test: test additions
chore: maintenance tasks
```

---

## 📞 Support

- **Email:** hello@extensiovitae.com
- **Documentation:** This file
- **Issues:** GitHub Issues (if applicable)

---

**Built with ❤️ for longevity optimization**
