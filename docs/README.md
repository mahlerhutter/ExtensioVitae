# ExtensioVitae Documentation

**Last Updated:** 2026-02-09  
**Status:** Chat-First Pivot (v0.6.4)

---

## 🚀 Chat-First Pivot

ExtensioVitae is pivoting to a **chat-first** product strategy where conversational AI is the primary user interface.

**Quick Start:**
- **RAG + Chat Docs:** [`/rag`](./rag/) folder
- **30-min Setup:** [`rag/QUICK_START.md`](./rag/RAG_CHAT_QUICK_START.md)
- **Architecture:** [`rag/ARCHITECTURE.md`](./rag/RAG_CHAT_ARCHITECTURE.md)

---

## 📁 Documentation Structure

### Core Documents (Root Level)

**Strategic:**
- **`VISION.md`** - Die große Vision (Chat-First, Axiome, Three Horizons)
- **`FUTURE.md`** - Konkrete Umsetzung (4 Horizons, Module, Roadmap)
- **`FEATURES.md`** - Feature-Übersicht und Spezifikationen
- **`Ideas.md`** - Feature-Ideen und Backlog

**Operational:**
- **`tasks.md`** - Aktuelle Tasks & Technical Debt
- **`WORKFLOW.md`** - Daily Workflow Cycle Protocol
- **`WORKFLOW_PROMPT.md`** - Workflow Execution Prompt

**Overview:**
- **`README.md`** - This file

---

## 📂 Subdirectories

### `/rag` - RAG + Chat System Documentation ⭐ NEW
- `README.md` - RAG documentation index
- `canon.md` - 28 longevity principles (source of truth)
- `ARCHITECTURE.md` - RAG-First + Hybrid LLM architecture
- `QUICK_START.md` - 30-min deployment guide
- `DEPLOYMENT_GUIDE.md` - Detailed deployment instructions
- `BACKEND_IMPLEMENTATION_PLAN.md` - RAG backend plan
- `PHASE2_QUICK_START.md` - Phase 2 quick start (legacy)
- `BACKEND_PROMPT.md` - Chat backend prompt (legacy)
- `WEEK1_SUMMARY.md` - Week 1 summary (legacy)

### `/audits` - Security & Quality Audits
- `audit_2026-02-04.json` - Initial security audit
- `audit_2026-02-04_part2.json` - REMEDIATION #3 Part 1 audit
- `audit_2026-02-04_final.json` - REMEDIATION #3 complete audit
- `audit_2026-02-04_session_summary.json` - Full session audit
- `AUDIT.md` - Audit documentation
- `BETA_READINESS_ASSESSMENT.md` - Beta readiness checklist

### `/guides` - Setup & Configuration Guides
- `SECURITY_HEADERS.md` - Security headers configuration
- `SENTRY_SETUP.md` - Sentry error monitoring setup
- `BACKUP_CONFIGURATION.md` - Supabase backup configuration
- `EDGE_FUNCTION_DEPLOYMENT.md` - Edge Function deployment guide
- `EDGE_FUNCTION_VERIFICATION.md` - Edge Function testing guide
- `EMAIL_SETUP_GUIDE.md` - Email service setup
- `EMAIL_STRATEGY.md` - Email strategy & templates
- `REMINDER_BACKUPS_AFTER_PRO.md` - Backup reminder (Pro plan)

### `/sessions` - Session Summaries & Reports
- `DAILY_WORKFLOW_SUMMARY_2026-02-04.md` - Day 1 workflow summary
- `DEPLOYMENT_SUCCESS_2026-02-04.md` - Edge Function deployment report
- `WEEK2_SESSION_2026-02-04.md` - Week 2 session summary

### `/archive` - Historical & Deprecated Docs
- `01-PRODUCT-OVERVIEW.md` - Old product overview
- `02-USER-FLOW.md` - Old user flow
- `03-LANDING-PAGE.md` - Old landing page spec
- `04-INTAKE-FORM.md` - Old intake form spec
- `05-AI-PLAN-GENERATION.md` - Old AI generation spec
- `07-DASHBOARD.md` - Old dashboard spec
- `MVP_ROADMAP.md` - Old MVP roadmap
- `PRODUCT_VISION_SYNTHESIS.md` - Old vision synthesis
- `WHATS_NEXT.md` - Merged into tasks.md

### `/concepts` - Design Concepts
- (Existing concept files)

### `/implementation` - Implementation Details
- (Existing implementation files)

### `/testing` - Test Documentation
- (Existing test files)

---

## 🎯 Quick Navigation

**Need to know what to work on?**  
→ Read `tasks.md`

**Need to understand the vision?**  
→ Read `VISION.md` → `FUTURE.md`

**Need to set something up?**  
→ Check `/guides` folder

**Need to see progress?**  
→ Check `/sessions` folder

**Need to review security?**  
→ Check `/audits` folder

---

## 📊 Document Hierarchy

```
VISION.md  → Die große Vision (Axiome, Three Horizons, North Star)
     ↓
FUTURE.md  → Konkrete Umsetzung (Module, Scoring, Build-Sequenz)
     ↓
tasks.md   → Aktuelle Tasks (Was jetzt zu tun ist)
     ↓
/guides    → How to implement specific features
     ↓
/sessions  → What we've accomplished
```

---

## 🔍 Finding Documents

**By Purpose:**
- **Strategic Planning:** VISION.md, FUTURE.md
- **Current Work:** tasks.md
- **Feature Specs:** FEATURES.md, Ideas.md
- **How-To Guides:** /guides folder
- **Progress Reports:** /sessions folder
- **Quality Assurance:** /audits folder
- **Historical Reference:** /archive folder

**By Date:**
- All session summaries include dates in filename
- All audits include dates in filename
- Check `Last Updated` in document headers

---

## 📝 Document Conventions

**Naming:**
- Strategic docs: `UPPERCASE.md`
- Guides: `TITLE_CASE.md` in `/guides`
- Sessions: `PREFIX_YYYY-MM-DD.md` in `/sessions`
- Audits: `audit_YYYY-MM-DD.json` in `/audits`

**Headers:**
- All docs include `Last Updated` date
- All docs include `Status` or `Version`
- All docs include clear purpose statement

---

## 🗑️ Cleanup Policy

**Archive when:**
- Document is superseded by newer version
- Information is merged into another doc
- Document is no longer relevant

**Delete when:**
- Duplicate content exists
- Information is outdated and not historical
- Document was temporary/scratch

**Keep when:**
- Strategic importance (VISION, FUTURE)
- Operational necessity (tasks, WORKFLOW)
- Historical value (audits, sessions)
- Reference value (guides)

---

## ✅ Current Status

**Total Documents:** ~40 files  
**Organization:** Clean & Structured  
**Last Cleanup:** 2026-02-04  
**Next Review:** When adding 10+ new files

---

**For questions about documentation structure, see this README.**
