# Plan Review & Refinement System - Concept

## 🎯 Vision

After plan generation, users should see a **comprehensive overview** of their personalized 30-day blueprint and have the opportunity to **adjust parameters** before committing. This creates a collaborative experience where the AI proposes and the user refines.

---

## 🔄 User Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. INTAKE FORM                                              │
│    User answers health/lifestyle questions                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. PLAN GENERATION (Loading State)                          │
│    AI generates initial 30-day plan                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. PLAN PREVIEW & REVIEW ✨ NEW                            │
│    ┌───────────────────────────────────────────────────┐   │
│    │ Plan Overview Card                                 │   │
│    │ - Focus Areas (with percentages)                   │   │
│    │ - Time Commitment (daily average)                  │   │
│    │ - Difficulty Level                                 │   │
│    │ - Phase Breakdown (Foundation → Growth → Mastery)  │   │
│    └───────────────────────────────────────────────────┘   │
│                                                              │
│    ┌───────────────────────────────────────────────────┐   │
│    │ Adjustment Controls                                │   │
│    │ - Intensity Slider (Gentle → Moderate → Intense)   │   │
│    │ - Time Budget (15min → 30min → 45min → 60min)     │   │
│    │ - Focus Rebalancing (drag to adjust percentages)   │   │
│    │ - Exclude Activities (checkboxes)                  │   │
│    └───────────────────────────────────────────────────┘   │
│                                                              │
│    [Regenerate Plan] [Looks Good, Let's Start!]             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. DASHBOARD (Final Plan)                                   │
│    User begins their 30-day journey                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Plan Overview Components

### 1. **Hero Summary Card**

A visually striking card that summarizes the entire plan at a glance.

**Content:**
- **Plan Title**: "Your Personalized Longevity Blueprint"
- **Tagline**: Auto-generated based on focus (e.g., "Focus on Sleep & Stress Recovery")
- **Longevity Score Projection**: "Estimated +3.2 years healthy lifespan"
- **Visual Icon**: Dynamic icon based on primary focus area

**Example:**
```
┌────────────────────────────────────────────────────────┐
│  🌟 Your Personalized Longevity Blueprint              │
│                                                         │
│  Focus: Sleep Optimization & Stress Management         │
│  Projected Impact: +3.2 years healthy lifespan         │
│                                                         │
│  Daily Commitment: ~35 minutes                         │
│  Difficulty: Moderate                                  │
└────────────────────────────────────────────────────────┘
```

---

### 2. **Focus Area Breakdown**

Visual representation of how the plan distributes attention across the 6 longevity pillars.

**Visualization**: Horizontal stacked bar chart or donut chart

**Data Points:**
- 🏃 **Movement**: 25%
- 🥗 **Nutrition**: 20%
- 😴 **Sleep**: 30% ← Primary Focus
- 🧘 **Stress Management**: 15%
- 🧠 **Cognitive Health**: 5%
- 🤝 **Social Connection**: 5%

**Interactive Element**: 
- Hover to see specific activities in each category
- Click to expand and see day-by-day distribution

---

### 3. **Phase Timeline**

Show how the plan evolves over 30 days with clear phases.

**Three Phases:**

**Phase 1: Foundation (Days 1-10)**
- Focus: Building habits, gentle introduction
- Key Activities: Sleep hygiene basics, simple breathing exercises
- Intensity: Low → Medium

**Phase 2: Growth (Days 11-20)**
- Focus: Increasing complexity, adding variety
- Key Activities: Longer meditation, meal planning, social activities
- Intensity: Medium → Medium-High

**Phase 3: Mastery (Days 21-30)**
- Focus: Optimization, advanced techniques
- Key Activities: Advanced breathwork, fasting protocols, habit stacking
- Intensity: Medium-High → High

**Visualization**: Timeline with milestone markers

```
Day 1 ────────── Day 10 ────────── Day 20 ────────── Day 30
  │                │                 │                 │
Foundation      Growth           Mastery          Complete
  🌱              🌿               🌳               🏆
```

---

### 4. **Time Commitment Analysis**

Clear breakdown of daily time investment.

**Display:**
- **Average Daily Time**: 35 minutes
- **Range**: 20-50 minutes (varies by day)
- **Peak Days**: Days 15, 22, 28 (50 min)
- **Light Days**: Days 7, 14, 21 (20 min - recovery days)

**Visualization**: Bar chart showing time per day

---

### 5. **Activity Preview**

Sample activities from different days to give a concrete sense of what's included.

**Example:**
```
┌─────────────────────────────────────────────────────┐
│ Sample Activities from Your Plan                    │
├─────────────────────────────────────────────────────┤
│ Day 3:                                              │
│ • 10-min morning walk (Movement)                    │
│ • 5-min box breathing (Stress)                      │
│ • Sleep journal entry (Sleep)                       │
│                                                      │
│ Day 15:                                             │
│ • 20-min HIIT workout (Movement)                    │
│ • Prepare overnight oats (Nutrition)                │
│ • 15-min meditation (Stress)                        │
│                                                      │
│ Day 28:                                             │
│ • 30-min nature walk (Movement + Social)            │
│ • Advanced breathwork (Stress)                      │
│ • Gratitude practice (Cognitive)                    │
└─────────────────────────────────────────────────────┘
```

---

## 🎛️ Adjustment Controls

### 1. **Intensity Slider**

Allows users to adjust overall plan difficulty.

**Options:**
- **Gentle** (Beginner-friendly, minimal time commitment)
- **Moderate** (Balanced, sustainable)
- **Intense** (Ambitious, maximum impact)

**Effect**: Adjusts:
- Duration of activities
- Frequency of challenging tasks
- Complexity of techniques
- Rest day frequency

---

### 2. **Time Budget Selector**

Set realistic daily time commitment.

**Options:**
- 15 minutes/day (Minimal)
- 30 minutes/day (Standard)
- 45 minutes/day (Committed)
- 60+ minutes/day (Deep Dive)

**Effect**: 
- Filters activities to fit within time budget
- Prioritizes high-impact activities
- May reduce variety in lower time budgets

---

### 3. **Focus Rebalancing**

Interactive sliders or drag-and-drop to adjust pillar percentages.

**UI Concept**: 6 horizontal sliders that auto-balance (total = 100%)

**Example Adjustment:**
```
Before:
Sleep: ████████████████████████████ 30%
Movement: ████████████████████ 25%

After User Adjustment:
Sleep: ████████████████████████████████████ 40% ↑
Movement: ██████████████ 15% ↓
```

**Constraint**: Minimum 5% per pillar to maintain holistic approach

---

### 4. **Activity Exclusions**

Checkboxes to exclude specific activity types.

**Common Exclusions:**
- ☐ Cold exposure (ice baths, cold showers)
- ☐ Fasting protocols
- ☐ Supplement recommendations
- ☐ Social activities (for introverts)
- ☐ High-intensity exercise
- ☐ Meditation (if not interested)

**Effect**: 
- Removes excluded activities
- Replaces with alternatives from same pillar
- May show warning if exclusion significantly impacts plan effectiveness

---

### 5. **Specific Preferences** (Advanced)

Collapsible section for power users.

**Options:**
- Preferred exercise types (yoga, running, strength, etc.)
- Dietary restrictions (already in intake, but can refine)
- Morning person vs. Night owl (adjust timing of activities)
- Indoor vs. Outdoor preference
- Solo vs. Group activities

---

## 🔄 Regeneration Logic

### When User Clicks "Regenerate Plan"

**Backend Process:**
1. **Capture Adjustments**: Store user's changes (intensity, time, focus %, exclusions)
2. **Merge with Intake Data**: Combine original intake responses with new preferences
3. **Re-run Plan Generator**: Call `planGenerator.js` with updated parameters
4. **Preserve Context**: Maintain conversation history for LLM (if using AI)
5. **Show New Preview**: Display updated plan overview
6. **Track Iterations**: Store in database for analytics (how many regenerations before acceptance)

**Performance Optimization:**
- Cache original plan
- Only regenerate affected days/pillars if possible
- Show loading state with "Redesigning your plan..." message

---

## 💾 Data Storage

### New Database Fields

**Add to `plans` table:**
```sql
ALTER TABLE plans ADD COLUMN IF NOT EXISTS plan_iterations INTEGER DEFAULT 1;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS user_adjustments JSONB;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS plan_overview JSONB;
```

**`user_adjustments` structure:**
```json
{
  "intensity": "moderate",
  "time_budget": 30,
  "focus_percentages": {
    "movement": 25,
    "nutrition": 20,
    "sleep": 30,
    "stress": 15,
    "cognitive": 5,
    "social": 5
  },
  "exclusions": ["cold_exposure", "fasting"],
  "preferences": {
    "exercise_types": ["yoga", "walking"],
    "timing_preference": "morning"
  }
}
```

**`plan_overview` structure:**
```json
{
  "title": "Your Personalized Longevity Blueprint",
  "tagline": "Focus on Sleep Optimization & Stress Management",
  "projected_impact": "+3.2 years",
  "daily_commitment_avg": 35,
  "difficulty": "moderate",
  "phases": [
    {
      "name": "Foundation",
      "days": "1-10",
      "focus": "Building habits",
      "intensity": "low-medium"
    },
    {
      "name": "Growth",
      "days": "11-20",
      "focus": "Increasing complexity",
      "intensity": "medium-high"
    },
    {
      "name": "Mastery",
      "days": "21-30",
      "focus": "Optimization",
      "intensity": "medium-high"
    }
  ],
  "focus_breakdown": {
    "movement": 25,
    "nutrition": 20,
    "sleep": 30,
    "stress": 15,
    "cognitive": 5,
    "social": 5
  },
  "sample_activities": [
    {
      "day": 3,
      "activities": ["10-min morning walk", "5-min box breathing", "Sleep journal"]
    }
  ]
}
```

---

## 🎨 UI/UX Design Principles

### Visual Hierarchy

1. **Hero Summary** (largest, most prominent)
2. **Focus Breakdown** (visual chart, eye-catching)
3. **Phase Timeline** (horizontal flow)
4. **Adjustment Controls** (interactive, below the fold)
5. **Sample Activities** (expandable, for curious users)

### Color Coding

- **Sleep**: Deep blue/purple
- **Movement**: Energetic orange/red
- **Nutrition**: Fresh green
- **Stress**: Calming teal
- **Cognitive**: Vibrant yellow
- **Social**: Warm pink/coral

### Animations

- **Smooth transitions** when adjusting sliders
- **Live preview** of focus percentages changing
- **Pulse effect** on "Regenerate" button when changes are made
- **Confetti animation** when user confirms plan (celebration moment!)

---

## 🧪 A/B Testing Opportunities

1. **Default View**: Overview first vs. Adjustments first
2. **Regeneration Limit**: Unlimited vs. 3 regenerations (to prevent analysis paralysis)
3. **Confirmation Copy**: "Looks Good!" vs. "Let's Start!" vs. "I'm Ready!"
4. **Preview Depth**: High-level overview vs. Detailed day-by-day preview

---

## 📈 Success Metrics

**Engagement:**
- % of users who adjust plan before confirming
- Average number of regenerations per user
- Most commonly adjusted parameters
- Time spent on review page

**Quality:**
- Correlation between adjustments and plan completion rate
- Feedback ratings for users who adjusted vs. didn't adjust
- Drop-off rate at review stage

**Insights:**
- Which exclusions are most common?
- Do users generally increase or decrease intensity?
- What time budgets do users select?

---

## 🚀 Implementation Phases

### Phase 1: MVP (Core Overview)
- Hero summary card
- Focus breakdown chart
- Phase timeline
- Simple "Confirm" button
- **Estimated Effort**: 2-3 days

### Phase 2: Basic Adjustments
- Intensity slider
- Time budget selector
- Regenerate functionality
- **Estimated Effort**: 3-4 days

### Phase 3: Advanced Controls
- Focus rebalancing sliders
- Activity exclusions
- Specific preferences
- **Estimated Effort**: 4-5 days

### Phase 4: Polish & Optimization
- Animations and transitions
- Mobile responsiveness
- Performance optimization
- A/B testing setup
- **Estimated Effort**: 2-3 days

**Total Estimated Effort**: 11-15 days

---

## 🔧 Technical Implementation

### New Component Structure

```
src/components/plan-review/
├── PlanReviewModal.jsx          # Main container
├── PlanOverview.jsx             # Hero summary + stats
├── FocusBreakdownChart.jsx      # Pillar distribution chart
├── PhaseTimeline.jsx            # 3-phase visualization
├── TimeCommitmentChart.jsx      # Daily time bar chart
├── ActivityPreview.jsx          # Sample activities
├── AdjustmentControls.jsx       # Container for all controls
├── IntensitySlider.jsx          # Gentle → Intense
├── TimeBudgetSelector.jsx       # 15min → 60min
├── FocusRebalancer.jsx          # Interactive sliders
└── ActivityExclusions.jsx       # Checkboxes
```

### Integration Points

**1. After Plan Generation (in `IntakePage.jsx` or routing logic):**
```javascript
// After plan is generated
if (planGenerated) {
  // Instead of navigating directly to dashboard:
  // navigate('/dashboard');
  
  // Show review modal first:
  setShowPlanReview(true);
}
```

**2. Plan Review Modal Flow:**
```javascript
<PlanReviewModal
  plan={generatedPlan}
  onConfirm={() => {
    // Save plan as final
    navigate('/dashboard');
  }}
  onRegenerate={(adjustments) => {
    // Call plan generator with adjustments
    regeneratePlan(adjustments);
  }}
/>
```

**3. Regeneration Function:**
```javascript
async function regeneratePlan(adjustments) {
  setRegenerating(true);
  
  const updatedPlan = await generatePlan({
    ...originalIntakeData,
    adjustments: adjustments,
  });
  
  setPlan(updatedPlan);
  setRegenerating(false);
}
```

---

## 🎯 Key Benefits

### For Users:
✅ **Transparency**: See exactly what they're committing to
✅ **Control**: Adjust plan to fit their life
✅ **Confidence**: Feel ownership over their journey
✅ **Reduced Overwhelm**: Can dial down intensity if needed

### For Product:
✅ **Higher Engagement**: Users invest time in customization
✅ **Better Retention**: Plans that fit = higher completion rates
✅ **Valuable Data**: Learn what users actually want
✅ **Differentiation**: Unique feature vs. competitors

### For AI/Algorithm:
✅ **Feedback Loop**: Learn from user adjustments
✅ **Improved Accuracy**: Refine future plan generation
✅ **Personalization**: Better understand user preferences

---

## 💡 Future Enhancements

1. **AI Explanation**: "Why did we focus on Sleep?" with reasoning
2. **Comparison View**: Show before/after when regenerating
3. **Save Presets**: "Save these preferences for future plans"
4. **Collaborative Mode**: Share plan with coach/partner for input
5. **Smart Suggestions**: "Users like you often increase Movement by 10%"
6. **Video Previews**: Short clips demonstrating sample activities
7. **Calendar Integration**: Show plan overlaid on user's actual calendar
8. **Difficulty Prediction**: "Based on your profile, this plan is 85% achievable"

---

## 🎬 Example User Journey

**Sarah, 35, busy professional:**

1. Completes intake form (wants better sleep, limited time)
2. AI generates plan: 30% Sleep, 25% Movement, 30min/day
3. **Review Screen Appears**:
   - Sees overview: "Focus on Sleep & Stress"
   - Notices 30min/day commitment
   - Thinks: "I can only do 20 minutes realistically"
4. **Adjusts**:
   - Moves time budget slider to 20min
   - Increases Sleep focus to 40%
   - Excludes "Cold Exposure" (not interested)
5. **Regenerates**: New plan appears with shorter activities
6. **Confirms**: "Perfect! Let's start!"
7. **Result**: Higher likelihood of completion because plan fits her life

---

## 📝 Summary

The **Plan Review & Refinement System** transforms plan generation from a one-way AI output into a **collaborative design process**. By giving users visibility and control, we:

- Increase trust and engagement
- Improve plan-user fit
- Gather valuable preference data
- Differentiate from competitors
- Boost completion rates

**Next Step**: Build MVP (Phase 1) to validate concept with real users.
