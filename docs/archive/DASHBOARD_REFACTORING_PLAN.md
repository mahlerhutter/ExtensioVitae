# DashboardPage Refactoring Plan

## Overview
Extracting 10 inline components from DashboardPage.jsx (1526 lines) into separate files in `src/components/dashboard/`.

## Components to Extract

### 1. ✅ LongevityScoreWidget (Lines 20-183)
**Dependencies:** 
- `useMemo` from React
- `calculateLongevityScore` from `../lib/longevityScore`
- Internal: `ScoreMiniItem` helper component

**Props:** `{ intakeData, compact }`

**File:** `src/components/dashboard/LongevityScoreWidget.jsx`

---

### 2. TodayCard (Lines ~185-350)
**Dependencies:**
- Task rendering logic
- Progress tracking

**Props:** `{ day, tasks, progress, onTaskToggle }`

**File:** `src/components/dashboard/TodayCard.jsx`

---

### 3. MonthOverview (Lines ~352-500)
**Dependencies:**
- Calendar/grid visualization
- Day selection logic

**Props:** `{ days, currentDay, selectedDay, onDayClick }`

**File:** `src/components/dashboard/MonthOverview.jsx`

---

### 4. PlanSummary (Lines ~502-650)
**Dependencies:**
- Plan metadata display

**Props:** `{ plan, intakeData }`

**File:** `src/components/dashboard/PlanSummary.jsx`

---

### 5. PillarsExplanationBox (Lines ~652-750)
**Dependencies:**
- Static content about 6 pillars

**Props:** None or `{ onLearnMore }`

**File:** `src/components/dashboard/PillarsExplanationBox.jsx`

---

### 6. EditProfileModal (Lines ~752-950)
**Dependencies:**
- Form handling
- `saveIntake` from dataService

**Props:** `{ isOpen, onClose, intakeData, onSave }`

**File:** `src/components/dashboard/EditProfileModal.jsx`

---

### 7. UserProfileSection (Lines ~952-1050)
**Dependencies:**
- User info display
- Edit trigger

**Props:** `{ userEmail, intakeData, onEditClick, onSignOut }`

**File:** `src/components/dashboard/UserProfileSection.jsx`

---

### 8. FullPlanModal (Lines ~1052-1100)
**Dependencies:**
- Full plan view/export

**Props:** `{ isOpen, onClose, plan }`

**File:** `src/components/dashboard/FullPlanModal.jsx`

---

### 9. PillarsExplanationModal (Lines ~1102-1130)
**Dependencies:**
- Modal with pillar details

**Props:** `{ isOpen, onClose }`

**File:** `src/components/dashboard/PillarsExplanationModal.jsx`

---

### 10. PlanHistoryModal (Lines ~1132-1140)
**Dependencies:**
- Archived plans list
- Plan switching logic

**Props:** `{ isOpen, onClose, archivedPlans, onSelectPlan }`

**File:** `src/components/dashboard/PlanHistoryModal.jsx`

---

## Refactoring Strategy

Given the size and complexity, I'll use a phased approach:

### Phase 1: Extract Standalone Components (No Dependencies)
1. PillarsExplanationBox
2. PillarsExplanationModal
3. LongevityScoreWidget (with ScoreMiniItem)

### Phase 2: Extract Components with Simple Props
4. UserProfileSection
5. PlanSummary
6. MonthOverview

### Phase 3: Extract Complex Components
7. TodayCard
8. EditProfileModal
9. FullPlanModal
10. PlanHistoryModal

### Phase 4: Update DashboardPage.jsx
- Add all imports
- Remove extracted component code
- Verify all props are passed correctly

## Estimated Impact
- **Before:** 1526 lines in DashboardPage.jsx
- **After:** ~400-500 lines in DashboardPage.jsx + 10 component files
- **Reduction:** ~70% smaller main file
- **Maintainability:** Each component independently testable

## Testing Checklist
- [ ] All components render without errors
- [ ] Props are correctly passed
- [ ] State management still works
- [ ] No broken imports
- [ ] Dark theme styling preserved
- [ ] Responsive behavior intact

---

**Status:** Ready to begin extraction
**Priority:** High (Task #5 in tasks.md)
**Estimated Time:** 2-3 hours for full refactoring
