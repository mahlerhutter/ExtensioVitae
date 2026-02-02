# Plan Review & Refinement - Implementation Roadmap

## 🎯 Quick Reference

**Goal**: Add an interactive review step between plan generation and dashboard, allowing users to preview and adjust their plan.

**Priority**: High (significantly improves user experience and plan-user fit)

**Estimated Timeline**: 2-3 weeks (phased approach)

---

## 📋 Implementation Checklist

### Phase 1: MVP - Plan Overview (Week 1)

**Goal**: Show users a comprehensive overview of their generated plan

#### Backend Changes

- [ ] **Update Plan Generator** (`src/lib/planGenerator.js`)
  - [ ] Add function to calculate plan overview metadata
  - [ ] Extract focus percentages from generated plan
  - [ ] Calculate daily time commitment averages
  - [ ] Identify phase breakdown (Foundation/Growth/Mastery)
  
- [ ] **Database Schema** (`sql/migrations/`)
  - [ ] Create migration `004_add_plan_overview.sql`
  - [ ] Add `plan_overview` JSONB column to `plans` table
  - [ ] Add `plan_iterations` INTEGER column (track regenerations)
  - [ ] Add `user_adjustments` JSONB column

#### Frontend Components

- [ ] **Create Component Structure**
  ```
  src/components/plan-review/
  ├── PlanReviewModal.jsx          # Main container
  ├── PlanOverview.jsx             # Hero summary
  ├── FocusBreakdownChart.jsx      # Pillar distribution
  ├── PhaseTimeline.jsx            # 3-phase visualization
  └── ActivityPreview.jsx          # Sample activities
  ```

- [ ] **PlanReviewModal.jsx**
  - [ ] Full-screen modal with backdrop
  - [ ] Close/back button (returns to intake)
  - [ ] "Looks Good, Let's Start!" CTA button
  - [ ] Smooth animations (fade in, slide up)

- [ ] **PlanOverview.jsx**
  - [ ] Hero card with plan title and tagline
  - [ ] Daily commitment display
  - [ ] Difficulty level indicator
  - [ ] Projected longevity impact (if available)

- [ ] **FocusBreakdownChart.jsx**
  - [ ] Horizontal stacked bar chart
  - [ ] 6 colored segments (one per pillar)
  - [ ] Percentage labels
  - [ ] Hover tooltips with details

- [ ] **PhaseTimeline.jsx**
  - [ ] 3-phase horizontal timeline
  - [ ] Icons for each phase (🌱 🌿 🌳)
  - [ ] Day ranges (1-10, 11-20, 21-30)
  - [ ] Brief description per phase

- [ ] **ActivityPreview.jsx**
  - [ ] Show 3-5 sample days
  - [ ] List 2-3 activities per day
  - [ ] Pillar icons next to each activity
  - [ ] Expandable "See more" option

#### Integration

- [ ] **Update Routing** (`src/App.jsx`)
  - [ ] Add `/plan-review` route (or use modal)
  - [ ] Redirect from intake to review (instead of dashboard)

- [ ] **Update IntakePage.jsx**
  - [ ] After plan generation, show PlanReviewModal
  - [ ] Pass generated plan as prop
  - [ ] Handle "Confirm" action → navigate to dashboard

#### Testing

- [ ] Generate plan and verify review modal appears
- [ ] Check all overview components display correctly
- [ ] Verify "Confirm" navigates to dashboard
- [ ] Test on mobile (responsive design)

---

### Phase 2: Basic Adjustments (Week 2)

**Goal**: Allow users to adjust intensity and time budget, then regenerate

#### Backend Changes

- [ ] **Regeneration Logic** (`src/lib/planGenerator.js`)
  - [ ] Add `regeneratePlan(originalPlan, adjustments)` function
  - [ ] Accept intensity parameter (gentle/moderate/intense)
  - [ ] Accept time budget parameter (15/30/45/60 min)
  - [ ] Adjust task durations based on time budget
  - [ ] Filter/modify activities based on intensity
  - [ ] Preserve user's original intake data

- [ ] **API/Service Layer**
  - [ ] Create `updatePlanWithAdjustments()` function
  - [ ] Store adjustments in `user_adjustments` column
  - [ ] Increment `plan_iterations` counter
  - [ ] Return updated plan with new overview

#### Frontend Components

- [ ] **Create Adjustment Components**
  ```
  src/components/plan-review/
  ├── AdjustmentControls.jsx       # Container
  ├── IntensitySlider.jsx          # Gentle → Intense
  └── TimeBudgetSelector.jsx       # 15/30/45/60 min
  ```

- [ ] **IntensitySlider.jsx**
  - [ ] 3-position slider (Gentle, Moderate, Intense)
  - [ ] Visual indicator (feather → fire icon)
  - [ ] Description text for each level
  - [ ] onChange handler

- [ ] **TimeBudgetSelector.jsx**
  - [ ] 4 button options (15, 30, 45, 60 min)
  - [ ] Active state styling
  - [ ] onClick handler

- [ ] **Update PlanReviewModal.jsx**
  - [ ] Add state for adjustments
  - [ ] Add "Regenerate Plan" button
  - [ ] Show loading state during regeneration
  - [ ] Handle regeneration response
  - [ ] Update plan overview with new data

#### Integration

- [ ] **Wire up regeneration flow**
  - [ ] Capture adjustment changes in state
  - [ ] Call regeneration API on button click
  - [ ] Show loading spinner
  - [ ] Update UI with new plan
  - [ ] Track iteration count

#### Testing

- [ ] Adjust intensity and verify plan changes
- [ ] Adjust time budget and verify activities fit
- [ ] Test multiple regenerations
- [ ] Verify adjustments are saved to database
- [ ] Test error handling (if regeneration fails)

---

### Phase 3: Advanced Controls (Week 3)

**Goal**: Add focus rebalancing and activity exclusions

#### Backend Changes

- [ ] **Enhanced Regeneration** (`src/lib/planGenerator.js`)
  - [ ] Accept focus percentage adjustments
  - [ ] Rebalance activities across pillars
  - [ ] Accept activity exclusion list
  - [ ] Filter out excluded activity types
  - [ ] Find suitable replacements

- [ ] **Validation Logic**
  - [ ] Ensure focus percentages sum to 100%
  - [ ] Enforce minimum 5% per pillar
  - [ ] Warn if exclusions significantly impact plan

#### Frontend Components

- [ ] **Create Advanced Components**
  ```
  src/components/plan-review/
  ├── FocusRebalancer.jsx          # Interactive sliders
  └── ActivityExclusions.jsx       # Checkboxes
  ```

- [ ] **FocusRebalancer.jsx**
  - [ ] 6 sliders (one per pillar)
  - [ ] Auto-balance to maintain 100% total
  - [ ] Visual feedback (color-coded bars)
  - [ ] Real-time percentage updates
  - [ ] Reset to default button

- [ ] **ActivityExclusions.jsx**
  - [ ] Checkboxes for common exclusions:
    - Cold exposure
    - Fasting protocols
    - Supplements
    - High-intensity exercise
    - Social activities
    - Meditation
  - [ ] Warning messages if exclusion impacts plan
  - [ ] "Why exclude?" tooltips

- [ ] **Update AdjustmentControls.jsx**
  - [ ] Add collapsible "Advanced" section
  - [ ] Include FocusRebalancer
  - [ ] Include ActivityExclusions
  - [ ] Aggregate all adjustments for regeneration

#### Integration

- [ ] **Update regeneration payload**
  - [ ] Include focus percentages
  - [ ] Include exclusion list
  - [ ] Pass to backend

- [ ] **Update plan generator**
  - [ ] Apply focus rebalancing
  - [ ] Filter excluded activities
  - [ ] Validate and warn if needed

#### Testing

- [ ] Adjust focus percentages and verify rebalancing
- [ ] Exclude activities and verify they're removed
- [ ] Test edge cases (exclude too many activities)
- [ ] Verify warnings display correctly
- [ ] Test reset functionality

---

### Phase 4: Polish & Analytics (Ongoing)

**Goal**: Refine UX and gather insights

#### UX Improvements

- [ ] **Animations**
  - [ ] Smooth transitions between states
  - [ ] Pulse effect on "Regenerate" when changes made
  - [ ] Confetti animation on "Confirm"
  - [ ] Loading skeleton for regeneration

- [ ] **Mobile Optimization**
  - [ ] Responsive layout for all components
  - [ ] Touch-friendly sliders
  - [ ] Collapsible sections on small screens
  - [ ] Bottom sheet modal on mobile

- [ ] **Accessibility**
  - [ ] Keyboard navigation
  - [ ] Screen reader labels
  - [ ] Focus management
  - [ ] Color contrast compliance

#### Analytics

- [ ] **Track User Behavior**
  - [ ] % of users who adjust plan
  - [ ] Average number of regenerations
  - [ ] Most common adjustments
  - [ ] Time spent on review page
  - [ ] Correlation with plan completion

- [ ] **A/B Testing Setup**
  - [ ] Test different default intensities
  - [ ] Test regeneration limits (unlimited vs. 3 max)
  - [ ] Test CTA copy variations
  - [ ] Test overview depth (summary vs. detailed)

#### Documentation

- [ ] Update user guide with review step
- [ ] Add tooltips and help text
- [ ] Create video tutorial
- [ ] Update onboarding flow

---

## 🗂️ File Structure (Final)

```
src/
├── components/
│   └── plan-review/
│       ├── PlanReviewModal.jsx
│       ├── PlanOverview.jsx
│       ├── FocusBreakdownChart.jsx
│       ├── PhaseTimeline.jsx
│       ├── TimeCommitmentChart.jsx
│       ├── ActivityPreview.jsx
│       ├── AdjustmentControls.jsx
│       ├── IntensitySlider.jsx
│       ├── TimeBudgetSelector.jsx
│       ├── FocusRebalancer.jsx
│       └── ActivityExclusions.jsx
├── lib/
│   ├── planGenerator.js          # Updated with regeneration
│   └── planReviewService.js      # New: handles adjustments
└── pages/
    └── IntakePage.jsx            # Updated to show review modal

sql/migrations/
└── 004_add_plan_overview.sql     # New migration

docs/
├── PLAN_REVIEW_REFINEMENT_CONCEPT.md
└── PLAN_REVIEW_IMPLEMENTATION.md  # This file
```

---

## 🎨 Design Tokens

### Colors (Pillar-Specific)

```css
--movement: #f97316;      /* Orange */
--nutrition: #22c55e;     /* Green */
--sleep: #3b82f6;         /* Blue */
--stress: #14b8a6;        /* Teal */
--cognitive: #eab308;     /* Yellow */
--social: #ec4899;        /* Pink */
```

### Intensity Levels

```css
--gentle: #94a3b8;        /* Slate 400 */
--moderate: #f59e0b;      /* Amber 500 */
--intense: #ef4444;       /* Red 500 */
```

---

## 🧪 Testing Scenarios

### Happy Path
1. User completes intake
2. Plan generates successfully
3. Review modal appears
4. User reviews overview
5. User adjusts intensity to "Gentle"
6. User clicks "Regenerate"
7. New plan appears
8. User clicks "Looks Good, Let's Start!"
9. Navigates to dashboard with finalized plan

### Edge Cases
1. **No adjustments**: User confirms without changes
2. **Multiple regenerations**: User regenerates 5+ times
3. **Extreme exclusions**: User excludes 80% of activities
4. **Invalid focus**: User tries to set Sleep to 0%
5. **Generation failure**: Regeneration API fails
6. **Slow connection**: Long loading time for regeneration

---

## 📊 Success Metrics

### Engagement
- **Adjustment Rate**: % of users who make at least one adjustment
- **Regeneration Rate**: Average number of regenerations per user
- **Time on Page**: Average time spent on review screen

### Quality
- **Completion Rate**: Do adjusted plans have higher completion?
- **Satisfaction**: Feedback ratings for adjusted vs. non-adjusted plans
- **Drop-off**: % of users who abandon at review stage

### Insights
- **Popular Adjustments**: Which parameters are adjusted most?
- **Exclusion Patterns**: What do users commonly exclude?
- **Time Budget**: What's the most selected time commitment?

---

## 🚀 Launch Strategy

### Soft Launch (Beta)
1. Enable for 10% of users
2. Gather feedback via surveys
3. Monitor analytics
4. Iterate based on findings

### Full Launch
1. Enable for all users
2. Announce feature in email/social
3. Update onboarding to highlight review step
4. Monitor completion rates

### Post-Launch
1. Analyze adjustment patterns
2. Use data to improve default plan generation
3. Add AI explanations ("Why we chose this focus")
4. Explore collaborative features (share with coach)

---

## 💡 Future Enhancements

1. **AI Explanations**: "Why did we prioritize Sleep?" with reasoning
2. **Comparison View**: Side-by-side before/after regeneration
3. **Save Presets**: "Save these preferences for next time"
4. **Smart Suggestions**: "Users like you often increase Movement"
5. **Video Previews**: Clips demonstrating sample activities
6. **Calendar Sync**: Overlay plan on user's actual calendar
7. **Difficulty Prediction**: "This plan is 85% achievable for you"
8. **Social Proof**: "1,234 users completed similar plans"

---

## ✅ Definition of Done

### Phase 1 (MVP)
- [ ] Review modal appears after plan generation
- [ ] All overview components display correctly
- [ ] User can confirm and navigate to dashboard
- [ ] Plan overview data saved to database
- [ ] Mobile responsive
- [ ] No console errors

### Phase 2 (Adjustments)
- [ ] Intensity and time budget controls functional
- [ ] Regeneration creates new plan based on adjustments
- [ ] Loading states display during regeneration
- [ ] Adjustments saved to database
- [ ] Iteration count tracked
- [ ] Error handling in place

### Phase 3 (Advanced)
- [ ] Focus rebalancing works correctly
- [ ] Activity exclusions filter plan
- [ ] Validation prevents invalid states
- [ ] Warnings display when appropriate
- [ ] All adjustments persist across regenerations
- [ ] Advanced section collapsible on mobile

### Phase 4 (Polish)
- [ ] Smooth animations implemented
- [ ] Accessibility audit passed
- [ ] Analytics tracking in place
- [ ] A/B tests configured
- [ ] Documentation complete
- [ ] User feedback collected and analyzed

---

## 🎯 Next Steps

1. **Review this concept** with team/stakeholders
2. **Prioritize features** (which phases to build first?)
3. **Design mockups** (high-fidelity designs)
4. **Create database migration** (Phase 1)
5. **Build MVP components** (Phase 1)
6. **Test with beta users**
7. **Iterate and expand** (Phases 2-4)

---

**Ready to transform plan generation into a collaborative experience!** 🚀
