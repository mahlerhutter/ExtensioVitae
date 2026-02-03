# ExtensioVitae - Deployment Guide

**Last Updated:** 2026-02-03  
**Status:** ✅ Ready to Deploy

---

## 🚀 Quick Deploy to Vercel

### Prerequisites
- ✅ GitHub repository pushed
- ✅ Supabase project created
- ✅ Database initialized with `sql/complete_database_setup.sql`
- ✅ Google OAuth configured

---

## Step 1: Deploy to Vercel

### 1.1 Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your GitHub repository: `mahlerhutter/ExtensioVitae`
4. Click **"Import"**

### 1.2 Configure Build Settings

Vercel should auto-detect Vite. Verify these settings:

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### 1.3 Add Environment Variables

Click **"Environment Variables"** and add:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://qnjjusilviwvovrlunep.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# PostHog Analytics (Optional)
VITE_POSTHOG_KEY=your_posthog_key_here
VITE_POSTHOG_HOST=https://eu.i.posthog.com
```

**⚠️ Important:** 
- Get your Supabase keys from: Supabase Dashboard → Settings → API
- Use the **anon/public** key (not the service role key!)

### 1.4 Deploy

1. Click **"Deploy"**
2. Wait for build to complete (~2-3 minutes)
3. Get your deployment URL (e.g., `extensiovitae.vercel.app`)

---

## Step 2: Configure OAuth Redirect URLs

### 2.1 Update Supabase

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel URL to **Site URL**:
   ```
   https://your-app.vercel.app
   ```
3. Add to **Redirect URLs**:
   ```
   https://your-app.vercel.app/auth
   https://your-app.vercel.app/dashboard
   ```

### 2.2 Update Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to: APIs & Services → Credentials
3. Edit your OAuth 2.0 Client
4. Add to **Authorized JavaScript origins**:
   ```
   https://your-app.vercel.app
   ```
5. Add to **Authorized redirect URIs**:
   ```
   https://qnjjusilviwvovrlunep.supabase.co/auth/v1/callback
   ```

---

## Step 3: Test Production

### 3.1 Test Authentication

1. Visit your Vercel URL
2. Click **"Sign in with Google"**
3. Verify redirect works
4. Check Supabase Dashboard → Authentication → Users

### 3.2 Test Core Features

- [ ] Google OAuth login
- [ ] Email/Password signup
- [ ] Intake form submission
- [ ] Dashboard loads
- [ ] Plan generation works
- [ ] Progress tracking works

---

## 🔧 Troubleshooting

### Build Fails

**Error: `Module not found`**
- Check `package.json` dependencies
- Run `npm install` locally first
- Commit `package-lock.json`

**Error: `Environment variable not found`**
- Verify all `VITE_*` variables are set in Vercel
- Redeploy after adding variables

### OAuth Not Working

**Redirect loop or "Invalid redirect URL"**
- Check Supabase URL Configuration
- Verify Google OAuth redirect URIs
- Clear browser cache and cookies

**"User not created"**
- Check Supabase logs: Dashboard → Logs
- Verify `handle_new_user` trigger exists
- Check RLS policies on `user_profiles`

### Database Errors

**"Infinite recursion detected"**
- This should be fixed! If it happens:
- Check if any `is_admin()` policies were re-added
- Run: `SELECT * FROM pg_policies WHERE qual LIKE '%is_admin%'`

---

## 📊 Monitoring

### Vercel Analytics

- View deployment logs: Vercel Dashboard → Deployments
- Monitor performance: Vercel Dashboard → Analytics
- Check errors: Vercel Dashboard → Logs

### Supabase Monitoring

- Database logs: Supabase Dashboard → Logs
- Auth events: Supabase Dashboard → Authentication → Logs
- API usage: Supabase Dashboard → Settings → Usage

### PostHog Analytics (Optional)

- User events: PostHog Dashboard
- Feature usage tracking
- Error monitoring

---

## 🔐 Security Checklist

- [x] `.env` not committed to Git
- [x] Using fresh Supabase database (no leaked keys)
- [x] RLS enabled on all tables
- [x] OAuth redirect URLs configured
- [ ] Custom domain with HTTPS (optional)
- [ ] Rate limiting configured (future)

---

## 🚀 Post-Deployment

### Custom Domain (Optional)

1. Vercel Dashboard → Settings → Domains
2. Add your domain (e.g., `extensiovitae.com`)
3. Update DNS records as instructed
4. Update Supabase and Google OAuth URLs

### Performance Optimization

- Enable Vercel Edge Functions (if needed)
- Configure caching headers
- Optimize images with Vercel Image Optimization

---

## 📝 Deployment Checklist

**Pre-Deployment:**
- [x] Code pushed to GitHub
- [x] Database initialized
- [x] Environment variables documented
- [x] OAuth configured locally

**During Deployment:**
- [ ] Vercel project created
- [ ] Environment variables added
- [ ] Build successful
- [ ] Deployment URL obtained

**Post-Deployment:**
- [ ] Supabase URLs updated
- [ ] Google OAuth URLs updated
- [ ] Authentication tested
- [ ] Core features tested
- [ ] Analytics verified (optional)

---

## 🆘 Support

**Issues?**
1. Check Vercel deployment logs
2. Check Supabase logs
3. Review `docs/tasks.md` for known issues
4. Check `sql/CHANGELOG.md` for database changes

**Documentation:**
- Setup Guide: `docs/POST_DATABASE_SETUP.md`
- Tasks & Issues: `docs/tasks.md`
- Code Audit: `docs/AUDIT.md`

---

## 🎉 Success!

Your app should now be live at: `https://your-app.vercel.app`

**Next Steps:**
1. Share with beta testers
2. Monitor analytics
3. Iterate based on feedback
4. Implement features from `docs/tasks.md`

---

**Deployment Date:** 2026-02-03  
**Version:** v2.1.2  
**Status:** ✅ Production Ready
