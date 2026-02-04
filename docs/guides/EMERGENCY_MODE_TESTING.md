# Emergency Mode Selector - Testing Guide

**Feature:** Emergency Mode Selector MVP  
**Version:** Phase 1-3 Complete  
**Date:** 2026-02-04

---

## 🎯 Test Objectives

1. **Functional:** All 4 modes activate/deactivate correctly
2. **Visual:** UI looks premium and responsive
3. **Persistence:** Mode survives page refresh
4. **UX:** One-tap activation <5 seconds
5. **Mobile:** Works on mobile viewport

---

## 🧪 Test Cases

### Test 1: Mode Activation (CRITICAL)
**Steps:**
1. Open dashboard
2. Find ModeSelector in sidebar
3. Click "Travel" mode
4. Verify:
   - ✓ Button changes to active state (blue gradient)
   - ✓ ModeIndicator appears at top
   - ✓ Pulse animation visible
   - ✓ Duration starts counting

**Expected:** Mode activates in <5 seconds  
**Pass Criteria:** Visual feedback immediate, no errors

---

### Test 2: Mode Switching
**Steps:**
1. Activate "Travel" mode
2. Click "Sick" mode (without deactivating)
3. Verify:
   - ✓ Travel deactivates
   - ✓ Sick activates
   - ✓ ModeIndicator updates
   - ✓ No double-activation

**Expected:** Smooth transition  
**Pass Criteria:** Only one mode active at a time

---

### Test 3: Mode Deactivation
**Steps:**
1. Activate any mode
2. Click same mode again OR click X in ModeIndicator
3. Verify:
   - ✓ Mode deactivates
   - ✓ Returns to Normal
   - ✓ ModeIndicator disappears
   - ✓ Button returns to inactive state

**Expected:** Clean deactivation  
**Pass Criteria:** Returns to normal state

---

### Test 4: Persistence (CRITICAL)
**Steps:**
1. Activate "Deep Work" mode
2. Refresh page (Cmd+R)
3. Verify:
   - ✓ Mode still active after refresh
   - ✓ ModeIndicator shows correct mode
   - ✓ Duration continues from before refresh

**Expected:** Mode persists via localStorage  
**Pass Criteria:** No mode loss on refresh

---

### Test 5: All 4 Modes
**Steps:**
Test each mode individually:
1. Travel ✈️
2. Sick 🤒
3. Detox 🧘
4. Deep Work 🧠

**Verify for each:**
- ✓ Correct icon displays
- ✓ Correct description
- ✓ Correct color scheme
- ✓ Activation works

**Expected:** All modes functional  
**Pass Criteria:** No errors, consistent behavior

---

### Test 6: Mobile Responsive
**Steps:**
1. Resize browser to mobile width (375px)
2. Test mode activation
3. Verify:
   - ✓ ModeSelector readable
   - ✓ Buttons tappable (44px min)
   - ✓ ModeIndicator fits
   - ✓ No horizontal scroll

**Expected:** Mobile-friendly  
**Pass Criteria:** Usable on small screens

---

### Test 7: Duration Tracking
**Steps:**
1. Activate any mode
2. Wait 2-3 minutes
3. Check ModeIndicator
4. Verify:
   - ✓ Duration updates (e.g., "2m", "3m")
   - ✓ Format correct (hours + minutes)

**Expected:** Real-time duration  
**Pass Criteria:** Accurate time tracking

---

### Test 8: Console Errors
**Steps:**
1. Open DevTools Console
2. Activate/deactivate modes
3. Verify:
   - ✓ No React errors
   - ✓ No undefined errors
   - ✓ Clean console logs

**Expected:** No errors  
**Pass Criteria:** Console clean (except debug logs)

---

## 🐛 Known Issues to Check

### Potential Issues:
1. **Tailwind dynamic classes** - May not work (bg-${color}-500)
   - Fix: Use static classes or safelist
2. **localStorage quota** - Could fail in private mode
   - Fix: Try/catch already implemented
3. **Mode history overflow** - After 10+ mode changes
   - Fix: Slice to last 10 (already implemented)

---

## 🎨 Visual Quality Checklist

### Design Review:
- [ ] Colors match brand (Navy #0A1628, Gold #C9A227)
- [ ] Animations smooth (not janky)
- [ ] Typography consistent (Inter font)
- [ ] Spacing feels premium
- [ ] Hover states clear
- [ ] Active states obvious
- [ ] Icons render correctly
- [ ] Gradients look good

---

## 📊 Performance Checklist

### Speed:
- [ ] Mode activation <1 second
- [ ] No lag on click
- [ ] Smooth animations (60fps)
- [ ] localStorage fast
- [ ] No memory leaks

---

## ✅ Acceptance Criteria

**Must Pass:**
1. All 4 modes activate correctly
2. Persistence works (refresh test)
3. One-tap activation <5 seconds
4. No console errors
5. Mobile responsive

**Nice to Have:**
1. Animations smooth
2. Duration tracking accurate
3. Visual polish premium
4. Fast performance

---

## 🚀 Next Steps After Testing

### If Tests Pass:
1. Deploy to production
2. Get user feedback
3. Start Phase 4 (Protocol Engine)

### If Tests Fail:
1. Document bugs
2. Fix critical issues
3. Re-test
4. Iterate

---

## 📝 Test Results Template

```
Test Date: 2026-02-04
Tester: [Name]
Browser: [Chrome/Safari/Firefox]
Device: [Desktop/Mobile]

Test 1: Mode Activation - [PASS/FAIL]
Test 2: Mode Switching - [PASS/FAIL]
Test 3: Mode Deactivation - [PASS/FAIL]
Test 4: Persistence - [PASS/FAIL]
Test 5: All 4 Modes - [PASS/FAIL]
Test 6: Mobile Responsive - [PASS/FAIL]
Test 7: Duration Tracking - [PASS/FAIL]
Test 8: Console Errors - [PASS/FAIL]

Overall: [PASS/FAIL]
Notes: [Any issues or observations]
```

---

**Ready to test!** 🧪
