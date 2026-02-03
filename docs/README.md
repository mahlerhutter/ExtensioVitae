# ExtensioVitae Documentation

**Last Updated:** 2026-02-03  
**Version:** 2.1.2

---

## 📚 Documentation Index

### 🚀 **Getting Started**

1. **[POST_DATABASE_SETUP.md](POST_DATABASE_SETUP.md)** - Complete setup guide
   - Supabase project setup
   - Database initialization
   - Environment configuration
   - Google OAuth setup
   - Local testing

### 📋 **Product Documentation**

2. **[01-PRODUCT-OVERVIEW.md](01-PRODUCT-OVERVIEW.md)** - Product vision and concept
3. **[02-USER-FLOW.md](02-USER-FLOW.md)** - Complete user journey
4. **[03-LANDING-PAGE.md](03-LANDING-PAGE.md)** - Landing page design
5. **[04-INTAKE-FORM.md](04-INTAKE-FORM.md)** - Questionnaire structure
6. **[05-AI-PLAN-GENERATION.md](05-AI-PLAN-GENERATION.md)** - Plan generation logic
7. **[06-WHATSAPP-FLOW.md](06-WHATSAPP-FLOW.md)** - WhatsApp integration concept
8. **[07-DASHBOARD.md](07-DASHBOARD.md)** - Dashboard features
9. **[09-MAKE-AUTOMATIONS.md](09-MAKE-AUTOMATIONS.md)** - Make.com workflows

### 🔧 **Technical Documentation**

10. **[AUDIT.md](AUDIT.md)** - Code quality audit and recommendations
11. **[tasks.md](tasks.md)** - Current tasks and technical debt
12. **[ANALYTICS_ADMIN_SETUP.md](ANALYTICS_ADMIN_SETUP.md)** - Analytics and admin setup
13. **[GIT_GITHUB_SETUP.md](GIT_GITHUB_SETUP.md)** - Git and GitHub configuration

### 💡 **Planning & Ideas**

14. **[Ideas.md](Ideas.md)** - Feature ideas and backlog
15. **[UPDATE_SUMMARY.md](UPDATE_SUMMARY.md)** - Recent updates summary
16. **[concepts/](concepts/)** - Detailed concept documents

---

## 🗂️ Archived Documentation

Older or superseded documentation has been moved to `docs/archive/`:

- `DEBUG_OAUTH.md` - OAuth debugging guide (issue resolved)
- `FIX_GOOGLE_OAUTH.md` - Google OAuth fix guide (issue resolved)
- `FRESH_DATABASE_SETUP.md` - Old database setup (superseded by POST_DATABASE_SETUP.md)
- `QUICKSTART_DATABASE.md` - Quick setup (superseded by POST_DATABASE_SETUP.md)
- `CONSOLIDATED_TASKS.md` - Old task list (superseded by tasks.md)
- `GIT_HISTORY_CLEANUP.md` - Git cleanup guide (completed)
- `ADMIN_FEEDBACK_DEBUG_STATUS.md` - Debug status (resolved)

---

## 🎯 Quick Links

### For New Developers
1. Start with [POST_DATABASE_SETUP.md](POST_DATABASE_SETUP.md)
2. Read [01-PRODUCT-OVERVIEW.md](01-PRODUCT-OVERVIEW.md)
3. Check [tasks.md](tasks.md) for current priorities

### For Product/Design
1. [02-USER-FLOW.md](02-USER-FLOW.md) - User journey
2. [03-LANDING-PAGE.md](03-LANDING-PAGE.md) - Landing page
3. [07-DASHBOARD.md](07-DASHBOARD.md) - Dashboard features

### For DevOps/Deployment
1. [POST_DATABASE_SETUP.md](POST_DATABASE_SETUP.md) - Database setup
2. [ANALYTICS_ADMIN_SETUP.md](ANALYTICS_ADMIN_SETUP.md) - Analytics
3. [tasks.md](tasks.md) - Deployment blockers

---

## 📝 Recent Changes (v2.1.2)

### ✅ Auth System Fixes
- Google OAuth login working
- User signup/login working
- RLS policies fixed (no more infinite recursion)
- Dashboard redirect working

### ✅ Documentation Cleanup
- Archived outdated guides
- Updated setup documentation
- Created comprehensive changelog

### ⚠️ Known Issues
- Admin panel temporarily disabled (needs re-implementation)
- Foreign key constraint removed on `user_profiles.user_id`

See [tasks.md](tasks.md) for full details.

---

## 🔗 External Resources

- **Supabase Docs:** https://supabase.com/docs
- **React Router:** https://reactrouter.com
- **PostHog Analytics:** https://posthog.com/docs
- **Make.com:** https://www.make.com/en/help

---

## 📧 Support

For questions or issues, check:
1. [tasks.md](tasks.md) - Known issues and fixes
2. [AUDIT.md](AUDIT.md) - Code quality recommendations
3. [archive/](archive/) - Historical documentation
