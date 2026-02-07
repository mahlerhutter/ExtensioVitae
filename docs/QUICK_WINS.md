# ⚡ Quick-Wins Backlog — Usability Improvements

**Status:** Active (Dogfooding Phase)  
**Period:** 2026-02-07 → 2026-02-20  
**Rule:** Only build if **<2h effort** AND **improves daily usability**

---

## 🎯 Prioritization Matrix

| Priority | Criteria |
|----------|----------|
| **P0** | Blocks daily usage OR causes data loss |
| **P1** | Annoys every day, <30min fix |
| **P2** | Annoys every day, <2h fix |
| **P3** | Nice-to-have, can wait for post-Beta |

---

## 📋 Backlog

### P0 — Critical (Build Immediately)

_(None yet — add as discovered)_

---

### P1 — High Priority (<30min fixes)

#### ✅ [EXAMPLE] Add Keyboard Shortcut for Task Completion
- **Problem:** Clicking "Erledigt" every time is slow
- **Solution:** Press `Space` or `Enter` on focused task
- **Effort:** 15 min
- **Status:** ⏸️ Waiting
- **Discovered:** DOGFOODING_LOG.md Day X

---

### P2 — Medium Priority (<2h fixes)

#### 💡 [EXAMPLE] Undo Button After Task Completion
- **Problem:** Accidentally clicked "Erledigt" on wrong task
- **Solution:** Toast with "Undo" button (3 sec timeout)
- **Effort:** 1h
- **Status:** ⏸️ Waiting
- **Discovered:** DOGFOADING_LOG.md Day X

---

#### 💡 [EXAMPLE] Pillar Filter in Dashboard
- **Problem:** Dashboard shows all tasks, hard to focus on one area
- **Solution:** Filter buttons: "Alle | Schlaf | Bewegung | ..."
- **Effort:** 90 min
- **Status:** ⏸️ Waiting
- **Discovered:** DOGFOODING_LOG.md Day X

---

### P3 — Low Priority (Nice-to-Have)

#### 💡 [EXAMPLE] Dark Mode Persistence
- **Problem:** Dark mode resets on page reload
- **Solution:** Save preference to localStorage
- **Effort:** 10 min
- **Status:** ⏸️ Waiting
- **Discovered:** DOGFOODING_LOG.md Day X

---

#### 💡 [PRZYKŁAD] "Mark All Complete" for Low-Task Days
- **Problem:** On days with 1-2 tasks, clicking each is tedious
- **Solution:** "Alle abhaken" button (with confirmation)
- **Effort:** 45 min
- **Status:** ⏸️ Waiting
- **Discovered:** DOGFOODING_LOG.md Day X

---

## 📊 Weekly Summary

### Week 1 (Feb 7-13)
- **Added:** X items
- **Completed:** X items
- **Deferred:** X items (moved to post-Beta)

### Week 2 (Feb 14-20)
- **Added:** X items
- **Completed:** X items
- **Deferred:** X items

---

## ✅ Completed Quick-Wins

_(Move completed items here with completion date)_

### 2026-02-XX — [Feature Name]
- **Problem:** ...
- **Solution:** ...
- **Effort Actual:** Xmin
- **Impact:** (High/Medium/Low)
- **Commit:** `abc1234`

---

## 🚫 Rejected / Deferred

_(Items that don't meet <2h OR don't improve daily usability)_

### [Feature Name]
- **Why Rejected:** Too complex (>2h) / Not daily pain point / Requires backend changes
- **Alternative:** Do this after Beta in v0.7.0
- **Moved to:** FUTURE.md

---

## 🔧 Quick-Win Template

Copy-paste this for new items:

```markdown
#### 💡 [Feature Name]
- **Problem:** (What's annoying?)
- **Solution:** (What's the fix?)
- **Effort:** (Estimate: Xmin / Xh)
- **Status:** ⏸️ Waiting | 🚧 In Progress | ✅ Done
- **Discovered:** DOGFOODING_LOG.md Day X
- **Priority:** P1 / P2 / P3
```

---

**Last Updated:** 2026-02-07
