# CLAUDE.MD - ExtensioVitae Project Guide

**Last Updated:** 2026-02-03
**Project Version:** 1.0.0 (Early Beta v0.1)
**Status:** MVP - Beta-ready with core features complete

## Project Overview

**ExtensioVitae** is a personalized longevity planning system that generates science-backed 30-day health optimization blueprints in under 3 minutes. The application helps high-performing professionals (ages 35-65) create and track daily health activities across 6 longevity pillars: Sleep, Movement, Nutrition, Stress, Connection, and Environment.

**Key Differentiators:**
- Quick intake (3 minutes) vs lengthy assessments
- Action-first approach (30-day plan immediately)
- Premium minimal UX (calm over chaotic)
- Science-backed but accessible
- Built for time-poor professionals

## Tech Stack

### Frontend
- React 18.2.0 with React Router DOM 6.20.0
- Vite 5.0.0 (build tool)
- Tailwind CSS 3.3.5 (styling)
- PostHog 1.336.4 (analytics)

### Backend & Database
- Supabase (PostgreSQL, EU-hosted)
- Supabase Auth (Email + Google OAuth)
- Supabase Edge Functions (serverless)

### AI/LLM Integration
- OpenAI API (GPT-4) - Primary
- Anthropic Claude API - Fallback
- Deterministic algorithm fallback if LLM unavailable

### Testing & Quality
- Vitest 4.0.18 (test framework)
- ESLint 8.53.0 (linting)
- Husky 9.1.7 (git hooks)
- Lint-staged 16.2.7 (pre-commit checks)

### Deployment
- Vercel (auto-deploy on git push)
- Custom domain ready
- SPA routing configured

## Project Structure

```
MVPExtensio/
├── src/
│   ├── components/         # Reusable React components
│   │   ├── dashboard/      # Dashboard-specific components (18 files)
│   │   ├── feedback/       # Feedback system components (4 files)
│   │   └── plan-review/    # Plan review/edit components
│   ├── pages/              # Full page components (12 pages)
│   ├── lib/                # Utilities & services
│   │   ├── supabase.js     # Supabase client
│   │   ├── analytics.js    # PostHog integration
│   │   ├── planBuilder.js  # Plan building logic (57KB)
│   │   ├── planGenerator.js # LLM plan generation
│   │   ├── longevityScore.js # Scoring algorithm (29KB)
│   │   └── [8 more services]
│   ├── contexts/           # React context providers
│   ├── hooks/              # Custom React hooks
│   └── tests/              # Test files (6 test suites)
├── docs/                   # Comprehensive documentation (50+ files)
├── sql/                    # Database migrations & setup
├── public/                 # Static assets
└── [config files]          # Build, lint, test configs
```

## Key Files & Their Purpose

### Core Application Files
- **src/App.jsx** - Root component with all route definitions
- **src/main.jsx** - React DOM mount point, analytics init
- **src/contexts/AuthContext.jsx** - Authentication state management

### Services (src/lib/)
- **supabase.js** - Supabase client initialization
- **dataService.js** - Core data fetching/mutations
- **planBuilder.js** - Plan building algorithm (57KB, critical)
- **planGenerator.js** - LLM integration for plan generation
- **llmPlanGenerator.js** - Multi-provider LLM abstraction
- **longevityScore.js** - Scoring algorithm (29KB, complex math)
- **profileService.js** - User profile CRUD operations
- **feedbackService.js** - Feedback collection & management
- **analytics.js** - PostHog event tracking
- **logger.js** - Client-side logging utility

### Pages (src/pages/)
- **LandingPage.jsx** - Marketing homepage
- **AuthPage.jsx** - Login/signup flow
- **IntakePage.jsx** - 10-question intake questionnaire
- **GeneratingPage.jsx** - Loading state during plan generation
- **DashboardPage.jsx** - Main app dashboard (30-day plan)
- **HealthProfilePage.jsx** - Profile settings & editing
- **AdminPage.jsx** - Admin dashboard (user/plan management)
- **SciencePage.jsx** - Methodology explainer
- **PrivacyPage.jsx, TermsPage.jsx, ImprintPage.jsx** - Legal pages

### Configuration
- **vite.config.js** - Dev server (port 3100), build config
- **vitest.config.js** - Test configuration
- **tailwind.config.js** - Brand colors, fonts, theme
- **vercel.json** - Deployment config for SPA routing
- **.eslintrc.json** - Linting rules

## Environment Variables

### Required
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ADMIN_EMAILS=admin@example.com,admin2@example.com
```

### Optional
```bash
VITE_OPENAI_API_KEY=sk-...           # For GPT-4 plan generation
VITE_ANTHROPIC_API_KEY=sk-ant-...    # For Claude fallback
VITE_LLM_PROVIDER=openai             # 'openai', 'claude', or 'auto'
VITE_MAKE_WEBHOOK_URL=https://...    # Make.com automation
VITE_POSTHOG_API_KEY=phc_...         # PostHog analytics
VITE_POSTHOG_HOST=https://eu.i.posthog.com  # EU or US endpoint
```

## Development Workflow

### Setup
```bash
# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Edit .env.local with your Supabase credentials

# Start dev server (opens at http://localhost:3100)
npm run dev
```

### Common Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run test         # Run tests with Vitest
npm run test:ui      # Interactive test UI
npm run test:coverage # Generate coverage report
```

### Database Setup
```bash
# Run the complete database setup script in Supabase SQL Editor
# File: sql/complete_database_setup.sql

# Or run individual migrations in order
# Files: sql/migrations/001_*.sql through 011_*.sql
```

### Deployment
Automatic via Vercel:
1. Push to `main` branch
2. Vercel auto-builds and deploys
3. Environment variables configured in Vercel dashboard

## Current Status & Known Issues

### Complete Features
- Landing page (responsive, SEO-optimized)
- Intake form (10-question questionnaire)
- AI plan generation (GPT-4 via Supabase Edge Functions)
- Dashboard (30-day plan with task tracking)
- User authentication (email + Google OAuth)
- Health profile management
- Feedback system (Initial, General, Bug, Feature types)
- Legal compliance (Privacy, Terms, Imprint)
- Analytics integration (PostHog)

### Known Issues
- Admin panel temporarily disabled (needs re-implementation)
- Foreign key constraint removed on user_profiles.user_id (intentional)
- WhatsApp integration planned but not yet implemented

### Critical Next Steps (from docs/MVP_ROADMAP.md)
1. **Email notifications** - Welcome, Plan Ready, Weekly Progress
2. **Onboarding flow** - Intro tour, tooltips, help section
3. **Plan quality improvements** - Better AI prompts, more personalization
4. **Progress tracking** - Streak counter, weekly/monthly stats
5. **Plan adjustment** - Reschedule tasks, mark as non-doable
6. **Reminder system** - Browser push notifications, daily digests

## Important Documentation

### Product & UX
- `docs/01-PRODUCT-OVERVIEW.md` - Product vision, target users
- `docs/02-USER-FLOW.md` - Complete user journey
- `docs/03-LANDING-PAGE.md` - Landing page design & copy
- `docs/04-INTAKE-FORM.md` - Intake questionnaire structure
- `docs/05-AI-PLAN-GENERATION.md` - Plan generation algorithm
- `docs/07-DASHBOARD.md` - Dashboard features & interactions

### Technical
- `docs/README.md` - Documentation index
- `docs/MVP_ROADMAP.md` - Next milestones & priorities
- `docs/AUDIT.md` - Code quality recommendations (31KB)
- `docs/tasks.md` - Current tasks & technical debt
- `DEPLOYMENT.md` - Vercel deployment guide
- `TESTING.md` - Testing strategy & coverage
- `SECURITY_AUDIT.md` - Security review findings

### Database
- `sql/complete_database_setup.sql` - Full database schema
- `sql/CHANGELOG.md` - Database change history
- `sql/migrations/` - Individual migration files (11 total)

## Code Style & Conventions

### React Patterns
- Functional components with hooks (no class components)
- Custom hooks for reusable logic
- Context API for authentication state
- Error boundaries for fault tolerance
- Protected routes for authenticated sections

### Naming Conventions
- Components: PascalCase (e.g., `DashboardHeader.jsx`)
- Files: camelCase for services (e.g., `dataService.js`)
- Functions: camelCase (e.g., `generatePlan()`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_TASKS_PER_DAY`)

### Code Organization
- One component per file
- Service layer for data operations (no direct Supabase calls in components)
- Shared utilities in `src/lib/`
- Page components should be thin (delegate to smaller components)

### Testing
- Test files mirror source structure: `src/lib/foo.js` → `src/tests/foo.test.js`
- Focus on service layer tests (business logic)
- Use Vitest's expect API
- Mock Supabase client in tests

## Database Schema

### Core Tables
- **users** (via Supabase Auth) - User authentication
- **user_profiles** - Extended user data (age, gender, health goals)
- **health_profiles** - Intake responses (sleep, exercise, stress, etc.)
- **plans** - Generated 30-day plans
- **plan_days** - Individual days within a plan
- **daily_tasks** - Tasks for each day (linked to pillar)
- **task_completion** - Completion tracking
- **feedback** - User feedback (initial, general, bug, feature)

### Key Relationships
- `user_profiles.user_id` → `auth.users.id` (1:1)
- `health_profiles.user_id` → `auth.users.id` (1:1)
- `plans.user_id` → `auth.users.id` (1:many)
- `plan_days.plan_id` → `plans.id` (many:1)
- `daily_tasks.plan_day_id` → `plan_days.id` (many:1)

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own data
- Admin access controlled via email whitelist

## Longevity Pillars

1. **Sleep** - Recovery architecture
2. **Movement** - Strategic physical stress
3. **Nutrition** - Fuel timing and quality
4. **Stress** - Nervous system regulation
5. **Connection** - Social and purpose alignment
6. **Environment** - Toxin reduction and optimization

Each pillar has:
- Icon/visual representation
- Daily tasks (typically 1-3 per day)
- Science-backed rationale
- Progress tracking
- Scoring contribution

## Branding & Design

### Colors
- **Navy:** #0A1628 (primary), #0F1F35, #1A2D4A (shades)
- **Gold:** #C9A227, #B8922A (accents)

### Typography
- **Font:** Inter (Google Fonts)
- **Weights:** 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### Design Philosophy
- Calm over chaotic (Apple-like restraint)
- Clarity over features
- Trust over hype
- Execution over education
- Premium minimal aesthetic

## Testing Strategy

### Unit Tests
- `src/tests/longevityScore.test.js` - Scoring algorithm
- `src/tests/planBuilder.test.js` - Plan building logic
- `src/tests/dataService.test.js` - Data service functions
- `src/tests/healthConstraints.test.js` - Health validation
- `src/tests/healthProfileTest.js` - Profile operations

### Running Tests
```bash
npm run test              # Run all tests
npm run test:ui           # Interactive UI
npm run test:coverage     # Coverage report
```

### Coverage Goals
- Service layer: >80%
- Core algorithms (scoring, plan building): >90%
- Components: Best effort (visual/integration testing)

## Analytics Events

Tracked via PostHog:
- Page views (automatic)
- User signup/login
- Intake form completion
- Plan generation success/failure
- Task completion
- Feedback submission
- Profile updates

See `src/lib/analytics.js` for event definitions.

## Security Considerations

### Authentication
- Supabase Auth handles security (bcrypt, JWT)
- Google OAuth for social login
- Email verification required
- Password reset flow built-in

### Data Protection
- Row Level Security (RLS) on all tables
- API keys never exposed client-side (Edge Functions)
- HTTPS enforced via Vercel
- CORS configured via Supabase

### Privacy
- GDPR compliant (EU hosting, Privacy Policy)
- User data deletion available
- No third-party trackers (except PostHog)
- Opt-in analytics

## Common Tasks

### Add a new page
1. Create component in `src/pages/NewPage.jsx`
2. Add route in `src/App.jsx`
3. Add navigation link if needed
4. Update relevant documentation

### Add a new service function
1. Add function to appropriate service in `src/lib/`
2. Write test in `src/tests/`
3. Import and use in components
4. Document in code comments

### Modify database schema
1. Write migration SQL in `sql/migrations/`
2. Test locally in Supabase SQL Editor
3. Update RLS policies if needed
4. Update `sql/complete_database_setup.sql`
5. Document in `sql/CHANGELOG.md`

### Deploy to production
```bash
# Automatic via Vercel
git add .
git commit -m "Your commit message"
git push origin main

# Vercel auto-deploys on push to main
# Check Vercel dashboard for build status
```

## Troubleshooting

### Build fails on Vercel
- Check `vercel.json` is committed
- Verify environment variables in Vercel dashboard
- Check Vercel build logs for specific error
- Ensure `npm run build` works locally

### Auth not working
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Check Supabase Auth settings (email templates, OAuth providers)
- Verify RLS policies are correct
- Check browser console for errors

### Plan generation fails
- Check LLM provider API keys (OpenAI or Claude)
- Verify Supabase Edge Function is deployed
- Check Edge Function logs in Supabase dashboard
- Fallback to deterministic algorithm if LLM unavailable

### Database connection issues
- Verify Supabase project is running
- Check connection pooler settings
- Verify RLS policies allow user access
- Check Supabase dashboard for service status

## Contact & Support

### Admin Emails
Configured via `VITE_ADMIN_EMAILS` environment variable

### Feedback System
Built-in feedback collection via:
- Floating feedback button
- Initial feedback modal (post-plan generation)
- Bug report form
- Feature request form

### Documentation Issues
If documentation is outdated or incorrect, file an issue or update directly.

## Git Workflow

### Branch Strategy
- `main` - Production-ready code (auto-deploys to Vercel)
- Feature branches - Use descriptive names (e.g., `feature/email-notifications`)

### Commit Messages
Follow conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `chore:` - Maintenance tasks
- `test:` - Test additions/modifications

### Pre-commit Hooks
- ESLint runs automatically (via Husky + lint-staged)
- Fix linting errors before committing
- Bypass with `git commit --no-verify` (not recommended)

## Future Enhancements

See `docs/MVP_ROADMAP.md` and `docs/Ideas.md` for detailed roadmap.

**Immediate Priorities:**
1. Email notification system
2. Onboarding/tutorial flow
3. Plan quality improvements
4. Progress tracking & streaks
5. Task rescheduling

**Medium-term:**
- WhatsApp integration
- Mobile app (React Native)
- Wearable device integration (Oura, Whoop)
- Community features
- Premium tier with coaching

**Long-term:**
- AI-powered plan adjustments
- Multi-language support
- Corporate wellness partnerships
- Marketplace for health services

## License & Legal

- Privacy Policy: `/privacy` (PrivacyPage.jsx)
- Terms of Service: `/terms` (TermsPage.jsx)
- Imprint (EU legal): `/imprint` (ImprintPage.jsx)

---

**For detailed technical information, always refer to the documentation in the `/docs` folder.**

**Last Updated:** 2026-02-03 by Claude Code
