# ExtensioVitae Documentation

> **Last Updated:** 2026-02-02  
> **Version:** v2.1 (Health Profile Integration)

---

## 📚 Documentation Structure

### 🎯 **Product Documentation** (Root Level)
Core product specifications and user flows:

- **[01-PRODUCT-OVERVIEW.md](./01-PRODUCT-OVERVIEW.md)** - Product vision and core features
- **[02-USER-FLOW.md](./02-USER-FLOW.md)** - End-to-end user journey
- **[03-LANDING-PAGE.md](./03-LANDING-PAGE.md)** - Landing page specifications
- **[04-INTAKE-FORM.md](./04-INTAKE-FORM.md)** - Intake form design
- **[05-AI-PLAN-GENERATION.md](./05-AI-PLAN-GENERATION.md)** - Plan generation logic
- **[06-WHATSAPP-FLOW.md](./06-WHATSAPP-FLOW.md)** - WhatsApp integration
- **[07-DASHBOARD.md](./07-DASHBOARD.md)** - Dashboard specifications
- **[09-MAKE-AUTOMATIONS.md](./09-MAKE-AUTOMATIONS.md)** - Make.com workflows

### 💡 **[concepts/](./concepts/)** - Design Concepts & Planning
High-level concepts and future features:

- **[FEEDBACK_LOOP_CONCEPT.md](./concepts/FEEDBACK_LOOP_CONCEPT.md)** - Feedback system design
- **[PLAN_REVIEW_REFINEMENT_CONCEPT.md](./concepts/PLAN_REVIEW_REFINEMENT_CONCEPT.md)** - Plan refinement vision

### 🔧 **[implementation/](./implementation/)** - Implementation Details
Current system implementations and technical documentation:

- **[USER_HEALTH_PROFILE_SYSTEM.md](./implementation/USER_HEALTH_PROFILE_SYSTEM.md)** ⭐ **NEW** - Health profile architecture (v2.1)
- **[FEEDBACK_LOOP_STATUS.md](./implementation/FEEDBACK_LOOP_STATUS.md)** - Feedback system status
- **[PLAN_REVIEW_MVP_SUMMARY.md](./implementation/PLAN_REVIEW_MVP_SUMMARY.md)** - Plan review implementation
- **[ADMIN_EMAIL_CONFIG.md](./implementation/ADMIN_EMAIL_CONFIG.md)** - Admin configuration
- **[FAVICON_SEO_IMPLEMENTATION.md](./implementation/FAVICON_SEO_IMPLEMENTATION.md)** - SEO setup
- **[DASHBOARD_URL_PARAMS.md](./implementation/DASHBOARD_URL_PARAMS.md)** - URL parameter handling
- **[MONTH_OVERVIEW_ENHANCEMENT.md](./implementation/MONTH_OVERVIEW_ENHANCEMENT.md)** - Month view features
- **[status_field_standardization.md](./implementation/status_field_standardization.md)** - Status field conventions

### 📖 **[guides/](./guides/)** - Quick Start Guides
Step-by-step guides for developers:

- **[FEEDBACK_QUICK_START.md](./guides/FEEDBACK_QUICK_START.md)** - Feedback system setup
- **[PLAN_REVIEW_MVP_QUICK_START.md](./guides/PLAN_REVIEW_MVP_QUICK_START.md)** - Plan review setup
- **[MIGRATION_GUIDE.md](./guides/MIGRATION_GUIDE.md)** - Database migrations
- **[10-DEPLOYMENT-CHECKLIST.md](./guides/10-DEPLOYMENT-CHECKLIST.md)** - Deployment steps

### 📦 **[archive/](./archive/)** - Archived Documentation
Completed refactorings and historical documentation:

- Dashboard refactoring phases (1-4)
- Bug fixes and testing documentation
- Session summaries

---

## 🚀 Latest Features (v2.1)

### Health Profile System
**Status:** ✅ Fully Implemented (2026-02-02)

The system now supports detailed health profiles that influence plan generation:

- **User Profiles** - Stable identity data (name, email, demographics)
- **Health Profiles** - Plan-relevant health data (conditions, injuries, lifestyle)
- **Plan Snapshots** - Frozen health state at plan generation

**Key Features:**
- 🩺 16 chronic conditions with automatic task filtering
- 🩹 11 injury types with exercise avoidance rules
- 🥗 9 dietary restrictions
- 💊 Medication tracking
- 🔒 Automatic intensity capping based on health status
- ⚡ Real-time constraint preview

**Documentation:** [implementation/USER_HEALTH_PROFILE_SYSTEM.md](./implementation/USER_HEALTH_PROFILE_SYSTEM.md)

---

## 📝 Working Documents

- **[tasks.md](./tasks.md)** - Current development tasks and backlog
- **[Ideas.md](./Ideas.md)** - Feature ideas and brainstorming
- **[claude.md](./claude.md)** - Claude AI integration notes
- **[gemini.md](./gemini.md)** - Gemini AI integration notes

---

## 🗂️ Related Documentation

### Database
- **SQL Migrations:** `/sql/migrations/`
  - `005_separate_user_and_health_profiles.sql` - Latest migration (Health Profiles)

### Code Documentation
- **Plan Builder:** `/src/lib/planBuilder.js` - v2.1 (health-aware)
- **Health Constraints:** `/src/lib/healthConstraints.js` - Health filtering logic
- **Profile Service:** `/src/lib/profileService.js` - Profile management

---

## 🔄 Version History

| Version | Date | Description |
|---------|------|-------------|
| **v2.1** | 2026-02-02 | Health Profile System Integration |
| **v2.0** | 2026-02-01 | Plan Review MVP & Feedback Loop |
| **v1.x** | 2026-01 | Core MVP with Dashboard & WhatsApp |

---

## 📞 Support

For questions or issues, refer to:
1. **Implementation docs** for technical details
2. **Guides** for step-by-step instructions
3. **Archive** for historical context
