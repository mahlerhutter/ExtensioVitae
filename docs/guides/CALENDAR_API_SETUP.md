# Calendar API Integration - Setup Guide

**Status:** ✅ Code Complete - Ready for Configuration  
**Time to Deploy:** ~30 minutes

---

## 📋 Prerequisites

- Google Cloud Project
- Supabase Project
- Node.js & npm installed

---

## 🚀 Quick Setup (5 Steps)

### Step 1: Google Cloud Setup (10 min)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google Calendar API**:
   - Navigate to "APIs & Services" → "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

4. Create **OAuth 2.0 Credentials**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "ExtensioVitae Calendar Integration"
   
5. Add **Authorized Redirect URIs**:
   ```
   http://localhost:3100/calendar/callback
   https://your-production-domain.com/calendar/callback
   ```

6. Copy **Client ID** and **Client Secret**

---

### Step 2: Environment Variables (2 min)

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your Google OAuth credentials:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
   VITE_GOOGLE_CLIENT_SECRET=your_client_secret
   VITE_GOOGLE_REDIRECT_URI=http://localhost:3100/calendar/callback
   ```

---

### Step 3: Database Migration (5 min)

1. Run the SQL migration in Supabase:
   ```bash
   # Copy the contents of sql/calendar_integration.sql
   # Paste into Supabase SQL Editor
   # Run the migration
   ```

2. Verify tables created:
   - `calendar_connections`
   - `calendar_events`
   - `calendar_detections`
   - `calendar_settings`

3. Verify RLS policies are active

---

### Step 4: Test OAuth Flow (5 min)

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Navigate to Dashboard

3. Click "Connect Google Calendar"

4. OAuth popup should open

5. Authorize the app

6. Check Supabase for connection record

---

### Step 5: Deploy (Optional - 10 min)

1. Add production redirect URI to Google Cloud Console

2. Update `.env` for production:
   ```env
   VITE_GOOGLE_REDIRECT_URI=https://your-domain.com/calendar/callback
   ```

3. Deploy to Vercel/Netlify

4. Test OAuth flow in production

---

## 🔧 Troubleshooting

### OAuth Popup Blocked
**Problem:** Browser blocks OAuth popup  
**Solution:** Allow popups for your domain

### Invalid Redirect URI
**Problem:** "redirect_uri_mismatch" error  
**Solution:** Verify redirect URI matches exactly in Google Cloud Console

### Token Refresh Fails
**Problem:** Access token expired, refresh fails  
**Solution:** Check refresh_token is saved in database

### Events Not Syncing
**Problem:** Events don't appear after connection  
**Solution:** 
1. Check browser console for errors
2. Verify access_token in database
3. Test API call manually

---

## 📊 Monitoring

### Check Connection Status
```sql
SELECT * FROM calendar_connections 
WHERE user_id = 'your-user-id' 
AND is_active = true;
```

### Check Events
```sql
SELECT * FROM calendar_events 
WHERE user_id = 'your-user-id' 
ORDER BY start_time DESC 
LIMIT 10;
```

### Check Detections
```sql
SELECT * FROM calendar_detections 
WHERE user_id = 'your-user-id' 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 🎯 Testing Checklist

- [ ] OAuth popup opens
- [ ] User can authorize
- [ ] Connection saved to database
- [ ] Events sync from Google Calendar
- [ ] Detections run on events
- [ ] Flight detected (if applicable)
- [ ] Focus block detected (if applicable)
- [ ] Auto-activation works
- [ ] Settings can be updated
- [ ] Disconnect works

---

## 🔐 Security Notes

1. **Never commit `.env` file**
2. **Rotate secrets regularly**
3. **Use environment-specific credentials**
4. **Monitor OAuth usage in Google Cloud Console**
5. **Review RLS policies regularly**

---

## 📚 API Documentation

### Google Calendar API
- [Official Docs](https://developers.google.com/calendar/api/v3/reference)
- [OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Scopes](https://developers.google.com/calendar/api/auth)

### Our Implementation
- **Scopes Used:** `calendar.readonly`, `calendar.events.readonly`
- **Token Storage:** Supabase (encrypted at rest)
- **Refresh Strategy:** Automatic on expiry
- **Sync Frequency:** Configurable (default: 6 hours)

---

## 🚀 Next Steps

After setup is complete:

1. **Add to Dashboard UI:**
   - Add CalendarConnect component to sidebar
   - Add CalendarSettings to settings page

2. **Create Edge Function:**
   - Auto-sync every 6 hours
   - Run detections
   - Trigger mode activations

3. **User Testing:**
   - Test with real calendar data
   - Validate detection accuracy
   - Gather feedback

4. **Analytics:**
   - Track connection rate
   - Monitor detection accuracy
   - Measure auto-activation success

---

**Status:** ✅ READY TO CONFIGURE  
**Estimated Setup Time:** 30 minutes  
**Difficulty:** Medium

🎯 **Let's get it running!**
