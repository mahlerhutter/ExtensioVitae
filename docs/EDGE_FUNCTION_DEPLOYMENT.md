# Edge Function Deployment Guide

**Date:** 2026-02-04  
**Function:** check-admin  
**Priority:** 🚨 CRITICAL  
**Effort:** 5 minutes

---

## Prerequisites

### 1. Install Supabase CLI

**macOS:**
```bash
brew install supabase/tap/supabase
```

**Other platforms:**
Visit: https://supabase.com/docs/guides/cli

### 2. Login to Supabase

```bash
supabase login
```

This will open a browser window for authentication.

### 3. Get Your Project Reference

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your ExtensioVitae project
3. Go to **Settings** → **API**
4. Copy the **Project Reference ID** (e.g., `abcdefghijklmnop`)

---

## Deployment Steps

### Option 1: Using the Deployment Script (Recommended)

1. **Update the script with your project reference:**
   ```bash
   # Edit scripts/deploy-edge-function.sh
   # Replace YOUR_PROJECT_REF with your actual project reference
   ```

2. **Make the script executable:**
   ```bash
   chmod +x scripts/deploy-edge-function.sh
   ```

3. **Run the deployment:**
   ```bash
   ./scripts/deploy-edge-function.sh
   ```

### Option 2: Manual Deployment

1. **Navigate to project root:**
   ```bash
   cd /Users/mahlerhutter/dev/playground/MVPExtensio
   ```

2. **Deploy the function:**
   ```bash
   supabase functions deploy check-admin --project-ref YOUR_PROJECT_REF
   ```

   Replace `YOUR_PROJECT_REF` with your actual project reference.

3. **Verify deployment:**
   ```bash
   supabase functions list --project-ref YOUR_PROJECT_REF
   ```

---

## Testing the Deployment

### 1. Test in Supabase Dashboard

1. Go to **Edge Functions** in your Supabase dashboard
2. Select `check-admin`
3. Click **Invoke Function**
4. Add Authorization header:
   ```json
   {
     "Authorization": "Bearer YOUR_USER_JWT_TOKEN"
   }
   ```
5. Click **Send**
6. Verify response:
   ```json
   {
     "isAdmin": true/false,
     "email": "user@example.com",
     "userId": "uuid"
   }
   ```

### 2. Test from Application

1. **Deploy to Vercel** (if not already deployed):
   ```bash
   git push origin develop
   ```

2. **Test admin access:**
   - Login as admin user (michael@extensiovitae.com or manuelmahlerhutter@gmail.com)
   - Navigate to `/admin`
   - Verify access is granted

3. **Test non-admin access:**
   - Login as regular user
   - Navigate to `/admin`
   - Verify redirect to `/dashboard`

### 3. Check Logs

```bash
supabase functions logs check-admin --project-ref YOUR_PROJECT_REF
```

Look for:
- `[Admin Check] User: email@example.com, IsAdmin: true/false`
- No errors or exceptions

---

## Troubleshooting

### Error: "Not logged in to Supabase"

**Solution:**
```bash
supabase login
```

### Error: "Project not found"

**Solution:**
1. Verify your project reference ID
2. Check you're logged in with the correct account
3. Ensure you have access to the project

### Error: "Function already exists"

**Solution:**
This is normal. The deploy command will update the existing function.

### Error: "Invalid auth token"

**Solution:**
1. Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct in `.env`
2. Verify the user is authenticated
3. Check Edge Function logs for details

### Admin access not working after deployment

**Checklist:**
- [ ] Edge Function deployed successfully
- [ ] No errors in Edge Function logs
- [ ] User is logged in
- [ ] User email matches one in `ADMIN_EMAILS` array in Edge Function
- [ ] Frontend is calling `checkAdminStatus()` correctly
- [ ] Browser console shows no errors

---

## Environment Variables

The Edge Function uses these Supabase environment variables (automatically available):
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key

**No additional configuration needed.**

---

## Admin Email List

The admin emails are defined in `supabase/functions/check-admin/index.ts`:

```typescript
const ADMIN_EMAILS = [
  'michael@extensiovitae.com',
  'manuelmahlerhutter@gmail.com',
  'admin@extensiovitae.com',
];
```

**To add/remove admins:**
1. Edit `supabase/functions/check-admin/index.ts`
2. Update the `ADMIN_EMAILS` array
3. Redeploy: `supabase functions deploy check-admin --project-ref YOUR_PROJECT_REF`

---

## Security Notes

✅ **What's secure:**
- Admin emails stored server-side only
- Authentication verified via JWT token
- No client-side bypass possible
- All admin checks logged server-side

⚠️ **Important:**
- Never commit your project reference to public repos (it's in the deployment script)
- Admin emails are case-insensitive
- Edge Function logs contain email addresses (for security monitoring)

---

## Cost Considerations

**Supabase Edge Functions (Free Tier):**
- 500,000 invocations/month
- 2 million CPU seconds/month

**Expected usage:**
- ~10-50 invocations/day (admin checks)
- Well within free tier limits

---

## Rollback Procedure

If the deployment causes issues:

1. **Check previous version:**
   ```bash
   supabase functions list --project-ref YOUR_PROJECT_REF
   ```

2. **Redeploy from Git:**
   ```bash
   git checkout HEAD~1 supabase/functions/check-admin/index.ts
   supabase functions deploy check-admin --project-ref YOUR_PROJECT_REF
   git checkout develop supabase/functions/check-admin/index.ts
   ```

3. **Disable function temporarily:**
   - Go to Supabase Dashboard → Edge Functions
   - Delete the `check-admin` function
   - Admin panel will be inaccessible until redeployed

---

## Success Criteria

- [ ] Edge Function deployed without errors
- [ ] Function appears in Supabase dashboard
- [ ] Admin users can access `/admin` page
- [ ] Non-admin users are redirected from `/admin`
- [ ] No errors in Edge Function logs
- [ ] No errors in browser console
- [ ] Production bundle does not contain admin emails

---

## Next Steps After Deployment

1. ✅ Mark task #5 complete in `docs/tasks.md`
2. ⏳ Proceed to task #6: Configure Backups
3. ⏳ Test mobile UX on real iOS device
4. ⏳ Run production bundle security audit

---

**Estimated Time:** 5 minutes  
**Difficulty:** Easy (if Supabase CLI is installed)  
**Impact:** CRITICAL (admin authentication will not work without this)

---

**Last Updated:** 2026-02-04  
**Owner:** ExtensioVitae DevOps
