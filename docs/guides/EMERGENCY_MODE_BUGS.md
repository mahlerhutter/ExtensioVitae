# Emergency Mode Selector - Code Review & Bug Check

**Date:** 2026-02-04  
**Feature:** Emergency Mode Selector (Phases 1-3)  
**Status:** Ready for testing

---

## 🔍 Potential Issues to Fix

### 1. Tailwind Dynamic Classes ⚠️ HIGH PRIORITY

**Problem:**
```javascript
// In ModeSelector.jsx
className={`bg-${mode.color}-500`}  // ❌ Won't work!
```

**Why:** Tailwind purges unused classes. Dynamic class names aren't detected.

**Fix Options:**

**Option A: Static Color Map** (Recommended)
```javascript
const colorClasses = {
  blue: 'bg-blue-500 text-white hover:bg-blue-600',
  red: 'bg-red-500 text-white hover:bg-red-600',
  green: 'bg-green-500 text-white hover:bg-green-600',
  purple: 'bg-purple-500 text-white hover:bg-purple-600'
};

className={colorClasses[mode.color]}
```

**Option B: Safelist in tailwind.config.js**
```javascript
module.exports = {
  safelist: [
    'bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-purple-500',
    'text-blue-800', 'text-red-800', // etc...
  ]
}
```

**Action Required:** ✅ Fix before testing

---

### 2. Mode Persistence Edge Cases

**Potential Issues:**
- Private browsing mode (localStorage disabled)
- localStorage quota exceeded
- Corrupted data in localStorage

**Current Handling:**
```javascript
try {
  const stored = localStorage.getItem(MODE_STORAGE_KEY);
  // ...
} catch (error) {
  console.error('Error loading mode:', error);
}
```

**Status:** ✅ Already handled with try/catch

---

### 3. Mode Duration Updates

**Question:** Does duration update in real-time?

**Current Code:**
```javascript
const getModeDuration = () => {
  if (!modeActivatedAt) return null;
  const now = new Date();
  const activated = new Date(modeActivatedAt);
  const durationMs = now - activated;
  // ...
};
```

**Issue:** This is called once. Duration won't update automatically.

**Fix Required:**
```javascript
// In ModeIndicator.jsx
const [currentTime, setCurrentTime] = useState(Date.now());

useEffect(() => {
  const interval = setInterval(() => {
    setCurrentTime(Date.now());
  }, 60000); // Update every minute
  
  return () => clearInterval(interval);
}, []);
```

**Action Required:** ⚠️ Add real-time duration updates

---

### 4. Multiple Mode Activation

**Question:** Can user activate multiple modes simultaneously?

**Current Logic:**
```javascript
const activateMode = (modeId, metadata = {}) => {
  const previousMode = currentMode;
  setCurrentMode(modeId);  // ✅ Replaces previous
};
```

**Status:** ✅ Only one mode at a time (correct)

---

### 5. PostHog Analytics

**Current Code:**
```javascript
if (window.posthog) {
  window.posthog.capture('emergency_mode_activated', {
    mode: modeId,
    previous_mode: previousMode,
    trigger: metadata.trigger || 'manual',
    timestamp
  });
}
```

**Question:** Is PostHog initialized?

**Status:** ⚠️ Check if PostHog is set up

---

### 6. Task Filtering (Not Implemented Yet)

**Current Status:** Phase 4 (pending)

**What's Missing:**
- Tasks don't filter by mode yet
- Protocol doesn't reconfigure yet
- Notifications aren't suppressed yet

**Expected in Phase 4:**
```javascript
// In TodayCard or task rendering
const { shouldShowTask, shouldEmphasizeTask } = useMode();

tasks.filter(task => shouldShowTask(task))
```

**Action Required:** ⏳ Phase 4 work

---

## 🐛 Bugs to Test For

### Visual Bugs:
- [ ] Colors not showing (Tailwind dynamic classes)
- [ ] Layout breaks on mobile
- [ ] Icons not rendering
- [ ] Animations janky
- [ ] Hover states not working

### Functional Bugs:
- [ ] Mode doesn't activate
- [ ] Mode doesn't persist on refresh
- [ ] Multiple modes active simultaneously
- [ ] Duration not updating
- [ ] Can't deactivate mode
- [ ] Console errors

### Edge Cases:
- [ ] Private browsing mode
- [ ] localStorage full
- [ ] Very long mode duration (days)
- [ ] Rapid mode switching
- [ ] Page refresh during activation

---

## 🔧 Quick Fixes Needed

### Fix 1: Static Color Classes

**File:** `src/components/ModeSelector.jsx`

**Replace:**
```javascript
// Line ~75-80
className={`
  ${isActive
    ? `bg-${mode.color}-500 text-white`
    : `bg-${mode.color}-50 text-${mode.color}-700`
  }
`}
```

**With:**
```javascript
const getActiveClasses = (color) => {
  const classes = {
    blue: 'bg-blue-500 text-white',
    red: 'bg-red-500 text-white',
    green: 'bg-green-500 text-white',
    purple: 'bg-purple-500 text-white'
  };
  return classes[color] || classes.blue;
};

const getInactiveClasses = (color) => {
  const classes = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200'
  };
  return classes[color] || classes.blue;
};

className={`
  ${isActive
    ? getActiveClasses(mode.color)
    : getInactiveClasses(mode.color)
  }
`}
```

---

### Fix 2: Real-Time Duration

**File:** `src/components/ModeIndicator.jsx`

**Add:**
```javascript
const [, forceUpdate] = useState(0);

useEffect(() => {
  const interval = setInterval(() => {
    forceUpdate(n => n + 1); // Force re-render every minute
  }, 60000);
  
  return () => clearInterval(interval);
}, []);
```

---

## ✅ Testing Priority

**Critical (Test First):**
1. Mode activation works
2. Colors display correctly
3. Persistence works
4. No console errors

**Important (Test Second):**
1. All 4 modes work
2. Mobile responsive
3. Duration tracking
4. Deactivation works

**Nice to Have (Test Last):**
1. Animations smooth
2. PostHog tracking
3. Edge cases

---

## 📝 Next Steps

1. **Fix Tailwind dynamic classes** (10 min)
2. **Add real-time duration updates** (5 min)
3. **Test locally** (15 min)
4. **Fix any bugs found** (30 min)
5. **Deploy to production** (5 min)
6. **Get user feedback** (ongoing)

---

**Status:** Ready to fix and test! 🚀
