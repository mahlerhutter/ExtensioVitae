# 📁 Documentation Structure Overview

```
docs/
│
├── 📘 README.md                          # Documentation index (you are here!)
├── 📝 tasks.md                           # Current tasks & technical debt
├── 💡 Ideas.md                           # Feature ideas & brainstorming
│
├── 🎯 PRODUCT DOCS (Root Level)          # Core product specifications
│   ├── 01-PRODUCT-OVERVIEW.md
│   ├── 02-USER-FLOW.md
│   ├── 03-LANDING-PAGE.md
│   ├── 04-INTAKE-FORM.md
│   ├── 05-AI-PLAN-GENERATION.md
│   ├── 06-WHATSAPP-FLOW.md
│   ├── 07-DASHBOARD.md
│   ├── 09-MAKE-AUTOMATIONS.md
│   ├── claude.md                         # Claude AI integration notes
│   └── gemini.md                         # Gemini AI integration notes
│
├── 💡 concepts/                          # Design concepts & future features
│   ├── FEEDBACK_LOOP_CONCEPT.md
│   └── PLAN_REVIEW_REFINEMENT_CONCEPT.md
│
├── 🔧 implementation/                    # Current implementations
│   ├── USER_HEALTH_PROFILE_SYSTEM.md    ⭐ NEW (v2.1)
│   ├── FEEDBACK_LOOP_STATUS.md
│   ├── PLAN_REVIEW_MVP_SUMMARY.md
│   ├── ADMIN_EMAIL_CONFIG.md
│   ├── FAVICON_SEO_IMPLEMENTATION.md
│   ├── DASHBOARD_URL_PARAMS.md
│   ├── MONTH_OVERVIEW_ENHANCEMENT.md
│   └── status_field_standardization.md
│
├── 📖 guides/                            # Quick start guides
│   ├── FEEDBACK_QUICK_START.md
│   ├── PLAN_REVIEW_MVP_QUICK_START.md
│   ├── MIGRATION_GUIDE.md
│   └── 10-DEPLOYMENT-CHECKLIST.md
│
└── 📦 archive/                           # Historical documentation
    ├── DASHBOARD_REFACTORING_*.md       (4 files)
    ├── BUG_FIX_INTAKE_PERSISTENCE.md
    ├── ERROR_BOUNDARY_TESTING.md
    ├── LOGGER_MIGRATION.md
    ├── ARCHIVED_PLANS_LOADING_STATE.md
    ├── PLAN_REVIEW_*.md                 (2 files)
    ├── 404_NOT_FOUND_PAGE.md
    └── SESSION_SUMMARY_2026-02-02.md
```

---

## 📊 Statistics

- **Total Files:** 38 markdown files
- **Total Size:** ~150 KB
- **Organized Into:** 4 categories + root level
- **Latest Addition:** Health Profile System (v2.1) - 2026-02-02

---

## 🎯 Quick Navigation

### For Developers
- **Start Here:** [README.md](./README.md)
- **Current Work:** [tasks.md](./tasks.md)
- **Setup Guides:** [guides/](./guides/)

### For Product Managers
- **Product Specs:** Root level docs (01-09)
- **Feature Concepts:** [concepts/](./concepts/)
- **Implementation Status:** [implementation/](./implementation/)

### For Maintainers
- **Technical Debt:** [tasks.md](./tasks.md)
- **Migration Guides:** [guides/MIGRATION_GUIDE.md](./guides/MIGRATION_GUIDE.md)
- **Historical Context:** [archive/](./archive/)

---

## 🔄 Maintenance

**When to Update:**
- ✅ After completing a task → Update `tasks.md`
- ✅ After implementing a feature → Add to `implementation/`
- ✅ When planning a feature → Add to `concepts/`
- ✅ After a major refactoring → Move old docs to `archive/`

**Review Schedule:**
- Weekly: Update `tasks.md` priorities
- Monthly: Review and archive completed work
- Quarterly: Update product specs (01-09)

---

*Last updated: 2026-02-02 15:17*
