# 🔍 OAuth Debug Checklist

**Problem:** Login funktioniert, aber User wird nicht eingeloggt / bleibt auf /auth

---

## Schritt 1: Dev Server neu starten

**.env.local** Änderungen werden nur beim Start geladen!

```bash
# Terminal: Ctrl+C zum Stoppen
# Dann:
npm run dev
```

---

## Schritt 2: Browser komplett neu laden

```bash
# Hard Reload (Cache löschen):
Cmd+Shift+R (Mac)
Ctrl+Shift+R (Windows/Linux)

# ODER Incognito Mode:
Cmd+Shift+N (Mac)
Ctrl+Shift+N (Windows/Linux)
```

---

## Schritt 3: Console Errors checken

**Browser DevTools öffnen:** `F12` oder `Cmd+Option+I`

**Gehe zu Console Tab**

**Suche nach:**
- ❌ `Supabase` Errors
- ❌ `Auth` Errors  
- ❌ `401` oder `403` Errors

**Ignoriere:**
- ✅ React Router Warnings (harmlos)
- ✅ "Removing unpermitted intrinsics" (SES Lockdown, harmlos)

---

## Schritt 4: Network Tab checken

**Browser DevTools → Network Tab**

**Nach Google Login:**
1. Suche nach Request zu `supabase.co/auth/v1/callback`
2. Status sollte `200` oder `302` sein
3. Suche nach Request zu `supabase.co/auth/v1/token`
4. Response sollte `access_token` enthalten

**Screenshot hilfreich!**

---

## Schritt 5: Supabase Dashboard checken

**Gehe zu:** Supabase Dashboard → Authentication → Users

**Frage:** Wurde ein User erstellt nach dem Google Login?

- ✅ **JA** → User wurde erstellt, aber Frontend erkennt ihn nicht
- ❌ **NEIN** → OAuth Setup Problem

---

## Schritt 6: Manual Session Check

**In Browser Console ausführen:**

```javascript
// Check ob Supabase konfiguriert ist
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);

// Check Session (async)
const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
const { data } = await supabase.auth.getSession();
console.log('Session:', data.session);
console.log('User:', data.session?.user);
```

**Erwartung:**
- `session` sollte ein Object sein (nicht `null`)
- `user` sollte deine Email enthalten

---

## Häufige Probleme & Lösungen

### Problem 1: "Session is null"
**Ursache:** OAuth Callback schreibt Session nicht in localStorage  
**Lösung:**
```javascript
// Check localStorage
console.log(localStorage.getItem('sb-qnjjusilviwvovrlunep-auth-token'));
// Sollte ein JSON Object sein
```

### Problem 2: "CORS Error"
**Ursache:** Supabase URL falsch konfiguriert  
**Lösung:** Check `.env.local` - URL muss mit `https://` starten

### Problem 3: "Invalid JWT"
**Ursache:** Anon Key ist falsch oder abgelaufen  
**Lösung:** Neuen Key aus Supabase Dashboard kopieren

### Problem 4: "User created but not logged in"
**Ursache:** `onAuthStateChange` Listener fehlt oder funktioniert nicht  
**Lösung:** Bereits gefixt in `AuthPage.jsx` - Server neu starten!

---

## Quick Fix: Manual Redirect Test

**Wenn Session existiert aber Redirect nicht funktioniert:**

**In Browser Console:**
```javascript
// Force redirect to dashboard
window.location.href = '/dashboard';
```

**Wenn das funktioniert:** Problem ist im React Router / Auth State Listener  
**Wenn das NICHT funktioniert:** Problem ist in der Session / Auth

---

## Next Steps

**Bitte mach:**
1. ✅ Dev Server neu starten
2. ✅ Browser hard reload (Cmd+Shift+R)
3. ✅ Erneut mit Google einloggen
4. ✅ Screenshot von Console Errors (falls vorhanden)
5. ✅ Check Supabase Dashboard → Users

**Dann sag mir:**
- Wurde ein User in Supabase erstellt?
- Gibt es Console Errors?
- Was steht in der Network Tab beim `/callback` Request?
