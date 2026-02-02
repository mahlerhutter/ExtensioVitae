# Dashboard Refactoring - Phase 2 Plan

**Date:** 2026-02-02  
**Status:** 🟡 IN PROGRESS  
**Completion:** 1/7 components extracted (14%)

---

## Phase 2 Components to Extract

### ✅ Completed (1/7)
1. **UserProfileSection** ✅ - 114 lines
   - File: `/src/components/dashboard/UserProfileSection.jsx`
   - Props: `{ intakeData, email, onEdit }`
   - Features: Expandable profile details, WhatsApp status, edit button

### ⏳ Remaining (6/7)

2. **PlanSummary** - ~51 lines
   - Location: Lines 308-358
   - Props: `{ plan, onShowFullPlan, onShowHistory }`
   - Features: Plan metadata, primary pillars, action buttons

3. **MonthOverview** - ~48 lines
   - Location: Lines 259-306
   - Props: `{ plan, progress, currentDay, onDayClick }`
   - Features: 30-day calendar grid, day status indicators
   - Helper: `getDayStatus(day)` function

4. **TodayCard** - ~43 lines
   - Location: Lines 195-237
   - Props: `{ day, dayData, progress, onTaskToggle, startDate }`
   - Features: Daily task list, progress tracking, time estimates

5. **EditProfileModal** - ~129 lines
   - Location: Lines 362-490
   - Props: `{ isOpen, onClose, initialData, onSave }`
   - Features: Full profile editing form with validation

6. **FullPlanModal** - ~94 lines
   - Location: Lines 607-700
   - Props: `{ isOpen, onClose, plan, progress }`
   - Features: Complete 30-day plan view, export functionality

7. **PlanHistoryModal** - ~47 lines
   - Location: Lines 704-750
   - Props: `{ isOpen, onClose, plans, onLoadPlan, isLoading }`
   - Features: Archived plans list, load previous plan

---

## Helper Components Needed

These smaller components are used by the main components:

### TaskItem (37 lines)
- Location: Lines 141-175
- Props: `{ task, completed, onToggle }`
- Used by: TodayCard

### DayCell (19 lines)
- Location: Lines 239-257
- Props: `{ day, status, isToday, onClick }`
- Used by: MonthOverview

### ProgressRing (40 lines)
- Location: Lines 100-139
- Props: `{ completed, total }`
- Used by: TodayCard, MonthOverview

### DashboardHeader (29 lines)
- Location: Lines 70-98
- Props: `{ userName, onSignOut, onProfileClick }`
- Used by: Main DashboardPage

---

## Helper Functions to Extract

### formatDate (5 lines)
- Location: Lines 177-181
- Used by: TodayCard

### calculatePlanDay (11 lines)
- Location: Lines 183-193
- Used by: DashboardPage

---

## Extraction Strategy

### Priority Order
1. ✅ **UserProfileSection** - Completed
2. **Helper Components** - Extract shared components first
   - ProgressRing
   - TaskItem
   - DayCell
   - DashboardHeader
3. **Simple Components** - Extract standalone components
   - PlanSummary
   - MonthOverview
   - TodayCard
4. **Complex Modals** - Extract modal components last
   - EditProfileModal
   - FullPlanModal
   - PlanHistoryModal

### File Organization
```
src/components/dashboard/
├── InteractiveLoading.jsx ✅
├── LongevityScoreWidget.jsx ✅
├── PillarsExplanationBox.jsx ✅
├── PillarsExplanationModal.jsx ✅
├── UserProfileSection.jsx ✅
├── DashboardHeader.jsx ⏳
├── ProgressRing.jsx ⏳
├── TaskItem.jsx ⏳
├── DayCell.jsx ⏳
├── PlanSummary.jsx ⏳
├── MonthOverview.jsx ⏳
├── TodayCard.jsx ⏳
├── EditProfileModal.jsx ⏳
├── FullPlanModal.jsx ⏳
└── PlanHistoryModal.jsx ⏳
```

---

## Expected Results

### File Size Reduction
- **Current:** 1,149 lines
- **After Phase 2:** ~400-500 lines (estimated)
- **Total Reduction:** ~650 lines (56%)

### Components Extracted
- **Phase 1:** 3 components
- **Phase 2:** 7 main + 4 helper = 11 components
- **Total:** 14 reusable components

---

## Next Steps

1. Extract helper components (ProgressRing, TaskItem, DayCell, DashboardHeader)
2. Extract simple components (PlanSummary, MonthOverview, TodayCard)
3. Extract modal components (EditProfileModal, FullPlanModal, PlanHistoryModal)
4. Update DashboardPage.jsx with new imports
5. Replace InteractiveLoading in loading state
6. Test all components
7. Update documentation

---

**Estimated Time:** 1-2 hours  
**Complexity:** Medium  
**Impact:** High - Major code organization improvement
