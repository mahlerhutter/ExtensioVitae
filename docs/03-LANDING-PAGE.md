# EXTENSIOVITAE — Landing Page

## Wireframe Description

```
┌────────────────────────────────────────────────────────────────┐
│ NAVBAR                                                         │
│ [Logo: ExtensioVitae]                    [How It Works] [Start]│
├────────────────────────────────────────────────────────────────┤
│                                                                │
│                         HERO SECTION                           │
│                                                                │
│              Your Personalized 30-Day                          │
│              Longevity Blueprint                               │
│                                                                │
│         Science-informed. Delivered daily. Under 30 min.       │
│                                                                │
│                   [ Get My Blueprint → ]                       │
│                                                                │
│                 ✓ 3-minute intake                              │
│                 ✓ Personalized to your life                    │
│                 ✓ Daily WhatsApp nudges                        │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│                     THE 6 PILLARS                              │
│                                                                │
│   ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  │
│   │Sleep │  │Move  │  │Fuel  │  │Calm  │  │Connect│ │Environ│ │
│   │      │  │      │  │      │  │      │  │      │  │      │  │
│   │ icon │  │ icon │  │ icon │  │ icon │  │ icon │  │ icon │  │
│   └──────┘  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘  │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│                     HOW IT WORKS                               │
│                                                                │
│   1. Answer    →    2. Receive    →    3. Execute              │
│   7 questions       Your 30-day        Daily tasks             │
│   (3 min)           blueprint          via WhatsApp            │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│                     PHILOSOPHY                                 │
│                                                                │
│   "We believe longevity is built in daily micro-decisions,    │
│    not radical interventions. ExtensioVitae gives you         │
│    the clarity to act—without the overwhelm."                  │
│                                                                │
│   ✓ No medical claims                                          │
│   ✓ Evidence-informed                                          │
│   ✓ Privacy-first                                              │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│                     FINAL CTA                                  │
│                                                                │
│              Ready to extend your vitae?                       │
│                                                                │
│                   [ Start Now → ]                              │
│                                                                │
│              Free for early adopters                           │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│ FOOTER                                                         │
│ © 2025 ExtensioVitae  |  Privacy  |  Terms  |  Contact        │
└────────────────────────────────────────────────────────────────┘
```

---

## Final Copy Text

### Hero Section

**Headline:**
Your Personalized 30-Day Longevity Blueprint

**Subheadline:**
Science-informed. Delivered daily. Under 30 minutes.

**CTA Button:**
Get My Blueprint →

**Trust Bullets:**
- ✓ 3-minute intake
- ✓ Personalized to your life
- ✓ Daily WhatsApp nudges

---

### The 6 Pillars

**Section Title:**
Built on 6 Pillars of Longevity

| Pillar | Label | One-liner |
|--------|-------|-----------|
| 1 | Sleep | Optimize your recovery architecture |
| 2 | Movement | Strategic physical stress for adaptation |
| 3 | Nutrition | Fuel timing and quality, simplified |
| 4 | Stress | Regulate your nervous system daily |
| 5 | Connection | Purpose and social bonds that matter |
| 6 | Environment | Reduce toxins, optimize your space |

---

### How It Works

**Section Title:**
Three Minutes to Your Blueprint

**Step 1:**
*Answer*
7 focused questions about your life, goals, and constraints.

**Step 2:**
*Receive*
Your personalized 30-day plan—organized by pillar, day by day.

**Step 3:**
*Execute*
Daily WhatsApp nudges keep you on track. ≤30 min/day.

---

### Philosophy / Trust Section

**Section Title:**
Our Philosophy

**Body Copy:**
We believe longevity is built in daily micro-decisions, not radical interventions. ExtensioVitae gives you the clarity to act—without the overwhelm.

**Trust Bullets:**
- ✓ No medical claims—lifestyle optimization only
- ✓ Evidence-informed, not hype-driven
- ✓ Your data stays private. Always.

---

### Final CTA Section

**Headline:**
Ready to extend your vitae?

**CTA Button:**
Start Now →

**Subtext:**
Free for early adopters. No credit card required.

---

## CTA Copy Variants (A/B Testing)

| Variant | CTA Text |
|---------|----------|
| A (Default) | Get My Blueprint → |
| B | Start My 30 Days → |
| C | Build My Plan → |
| D | Create My Blueprint → |

---

## Component List

| Component | Description |
|-----------|-------------|
| `Navbar` | Logo left, nav links right (How It Works, Start) |
| `Hero` | Centered headline, subheadline, CTA, trust bullets |
| `PillarGrid` | 6-column grid (3x2 on mobile) with icons and labels |
| `HowItWorks` | 3-step horizontal flow with icons |
| `Philosophy` | Centered text block with trust bullets |
| `FinalCTA` | Centered headline, CTA button, subtext |
| `Footer` | Copyright, legal links |

---

## Design Tokens

```css
/* Colors */
--color-bg: #FAFAFA;
--color-bg-dark: #0A1628;
--color-text: #1A1A1A;
--color-text-muted: #6B7280;
--color-accent: #C9A227;
--color-accent-hover: #B8922A;
--color-navy: #0A1628;
--color-white: #FFFFFF;

/* Typography */
--font-sans: 'Inter', -apple-system, sans-serif;
--font-size-hero: 3.5rem;
--font-size-h2: 2rem;
--font-size-body: 1.125rem;
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-bold: 600;

/* Spacing */
--spacing-section: 6rem;
--spacing-element: 2rem;
--radius-button: 8px;
--radius-card: 12px;
```

---

*Decision: Dark mode as default (navy background) for premium feel. Light sections for contrast.*
