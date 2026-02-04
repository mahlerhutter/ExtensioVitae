# Security Headers Configuration

**Date:** 2026-02-04  
**Status:** ✅ CONFIGURED  
**Location:** `vercel.json`

---

## 🔒 Headers Implemented

### 1. X-Content-Type-Options: nosniff
**Purpose:** Prevents MIME type sniffing  
**Protection:** Stops browsers from interpreting files as a different MIME type  
**Impact:** Prevents XSS attacks via MIME confusion

### 2. X-Frame-Options: DENY
**Purpose:** Prevents clickjacking attacks  
**Protection:** Disallows the site from being embedded in iframes  
**Impact:** Protects against UI redressing attacks

### 3. X-XSS-Protection: 1; mode=block
**Purpose:** Enables browser XSS filter  
**Protection:** Stops pages from loading when XSS is detected  
**Impact:** Legacy protection for older browsers

### 4. Referrer-Policy: strict-origin-when-cross-origin
**Purpose:** Controls referrer information  
**Protection:** Only sends origin when crossing origins  
**Impact:** Privacy protection, prevents leaking sensitive URLs

### 5. Permissions-Policy
**Purpose:** Controls browser features  
**Protection:** Disables camera, microphone, geolocation  
**Impact:** Reduces attack surface, privacy protection

**Configured:**
- `camera=()` - No camera access
- `microphone=()` - No microphone access
- `geolocation=()` - No geolocation access

### 6. Strict-Transport-Security (HSTS)
**Purpose:** Forces HTTPS connections  
**Protection:** Prevents protocol downgrade attacks  
**Impact:** All connections must use HTTPS

**Configuration:**
- `max-age=63072000` - 2 years
- `includeSubDomains` - Applies to all subdomains
- `preload` - Eligible for browser preload list

### 7. Content-Security-Policy (CSP)
**Purpose:** Prevents XSS and data injection attacks  
**Protection:** Controls which resources can be loaded  
**Impact:** Most important security header

**Directives:**

**default-src 'self'**
- Only load resources from same origin by default

**script-src**
- `'self'` - Own scripts
- `'unsafe-inline'` - Inline scripts (required for React)
- `'unsafe-eval'` - eval() (required for some libraries)
- `https://qnjjusilviwvovrlunep.supabase.co` - Supabase
- `https://accounts.google.com` - Google OAuth
- `https://www.gstatic.com` - Google static resources

**style-src**
- `'self'` - Own stylesheets
- `'unsafe-inline'` - Inline styles (required for React/Tailwind)
- `https://fonts.googleapis.com` - Google Fonts

**font-src**
- `'self'` - Own fonts
- `https://fonts.gstatic.com` - Google Fonts

**img-src**
- `'self'` - Own images
- `data:` - Data URIs
- `https:` - Any HTTPS image
- `blob:` - Blob URLs

**connect-src**
- `'self'` - Own API
- `https://qnjjusilviwvovrlunep.supabase.co` - Supabase API
- `https://accounts.google.com` - Google OAuth
- `https://www.googleapis.com` - Google APIs

**frame-src**
- `https://accounts.google.com` - Google OAuth iframe

**object-src 'none'**
- No plugins (Flash, Java, etc.)

**base-uri 'self'**
- Restricts <base> tag to same origin

**form-action 'self'**
- Forms can only submit to same origin

**frame-ancestors 'none'**
- Cannot be embedded in iframes (same as X-Frame-Options)

**upgrade-insecure-requests**
- Automatically upgrades HTTP to HTTPS

---

## 🧪 Testing Security Headers

### Test with SecurityHeaders.com

**URL:** https://securityheaders.com

**Steps:**
1. Go to https://securityheaders.com
2. Enter your production URL
3. Click "Scan"
4. Review the grade (should be A or A+)

**Expected Grade:** A or A+

### Test with Mozilla Observatory

**URL:** https://observatory.mozilla.org

**Steps:**
1. Go to https://observatory.mozilla.org
2. Enter your production URL
3. Click "Scan Me"
4. Review the score (should be 90+)

**Expected Score:** 90-100

### Manual Testing

**Check headers in browser:**
1. Open DevTools (F12)
2. Go to Network tab
3. Reload page
4. Click on the document request
5. Go to Headers tab
6. Verify all security headers are present

**Expected Headers:**
```
x-content-type-options: nosniff
x-frame-options: DENY
x-xss-protection: 1; mode=block
referrer-policy: strict-origin-when-cross-origin
permissions-policy: camera=(), microphone=(), geolocation=()
strict-transport-security: max-age=63072000; includeSubDomains; preload
content-security-policy: default-src 'self'; ...
```

---

## ⚠️ Known Limitations

### 'unsafe-inline' and 'unsafe-eval'

**Why needed:**
- React uses inline styles
- Tailwind generates inline styles
- Some libraries use eval()

**Future improvement:**
- Use nonce-based CSP
- Remove 'unsafe-inline' with nonce
- Remove 'unsafe-eval' by replacing libraries

### HTTPS Required

**HSTS requires HTTPS:**
- All connections must be HTTPS
- HTTP will be automatically upgraded
- Ensure Vercel HTTPS is enabled

---

## 🔧 Troubleshooting

### Issue: CSP blocking resources

**Symptoms:**
- Console errors: "Refused to load..."
- Missing images, fonts, or scripts

**Solution:**
1. Check browser console for CSP violations
2. Add the blocked domain to appropriate directive
3. Redeploy to Vercel

**Example:**
```
Refused to load script from 'https://example.com/script.js'
```

**Fix:** Add to `script-src`:
```json
"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://example.com"
```

### Issue: Google OAuth not working

**Symptoms:**
- OAuth popup blocked
- "Refused to frame" error

**Solution:**
- Verify `frame-src` includes `https://accounts.google.com`
- Verify `connect-src` includes Google domains

### Issue: Fonts not loading

**Symptoms:**
- Fonts fallback to system fonts
- Console errors about font loading

**Solution:**
- Verify `font-src` includes `https://fonts.gstatic.com`
- Verify `style-src` includes `https://fonts.googleapis.com`

---

## 📊 Security Impact

**Before Headers:**
- Grade: F (no security headers)
- Vulnerable to: XSS, clickjacking, MIME sniffing
- No HTTPS enforcement

**After Headers:**
- Grade: A or A+ (comprehensive protection)
- Protected against: XSS, clickjacking, MIME sniffing, protocol downgrade
- HTTPS enforced with HSTS

**Security Improvement:** CRITICAL

---

## 🚀 Deployment

**Headers are applied automatically on next deploy:**

```bash
git add vercel.json
git commit -m "feat: add comprehensive security headers"
git push origin develop
```

**Vercel will:**
1. Detect vercel.json changes
2. Apply headers to all routes
3. Headers active immediately after deployment

**Verify after deployment:**
1. Visit your production URL
2. Check headers in DevTools
3. Test with securityheaders.com
4. Verify no broken functionality

---

## 📝 Maintenance

**When to update:**
- Adding new third-party services (update CSP)
- Changing authentication providers (update frame-src, connect-src)
- Adding new features that load external resources

**How to update:**
1. Edit `vercel.json`
2. Add new domains to appropriate CSP directives
3. Test locally (headers won't apply in dev)
4. Deploy to Vercel
5. Verify headers in production

---

## ✅ Checklist

- [x] Security headers configured in vercel.json
- [ ] Deployed to Vercel
- [ ] Tested with securityheaders.com (should be A/A+)
- [ ] Tested with Mozilla Observatory (should be 90+)
- [ ] Verified no broken functionality
- [ ] Verified Google OAuth still works
- [ ] Verified fonts load correctly
- [ ] Verified images load correctly

---

**Status:** ✅ CONFIGURED  
**Next:** Deploy to Vercel and verify  
**Impact:** CRITICAL security improvement

**Last Updated:** 2026-02-04  
**Owner:** ExtensioVitae Security
