# 🔧 Google OAuth Redirect URI Fix

**Fehler:** `Error 400: redirect_uri_mismatch`  
**Ursache:** Redirect URI in Google Console stimmt nicht mit Supabase überein

---

## ✅ Schritt-für-Schritt Fix

### 1️⃣ Supabase Redirect URI kopieren

**In Supabase Dashboard:**

1. Gehe zu **Authentication → Providers**
2. Klicke auf **Google**
3. Kopiere die **Callback URL (Redirect URI)**

Es sollte so aussehen:
```
https://DEIN-PROJECT-ID.supabase.co/auth/v1/callback
```

**Beispiel:**
```
https://abcdefghijklmnop.supabase.co/auth/v1/callback
```

---

### 2️⃣ Google Cloud Console konfigurieren

**Gehe zu:** [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)

#### Option A: OAuth Client existiert bereits

1. Klicke auf deinen **OAuth 2.0 Client**
2. Unter **Authorized redirect URIs:**
   - **Entferne** alle alten URIs (falls vorhanden)
   - **Füge hinzu:** Die Supabase Callback URL
   - **Füge auch hinzu:** `http://localhost:5173/auth/callback` (für lokales Testing)
3. **Save**

#### Option B: Neuen OAuth Client erstellen

1. **Create Credentials → OAuth 2.0 Client ID**
2. **Application type:** Web application
3. **Name:** ExtensioVitae (oder beliebig)
4. **Authorized JavaScript origins:**
   ```
   http://localhost:5173
   https://DEIN-PROJECT-ID.supabase.co
   ```
5. **Authorized redirect URIs:**
   ```
   https://DEIN-PROJECT-ID.supabase.co/auth/v1/callback
   http://localhost:5173/auth/callback
   ```
6. **Create**
7. Kopiere **Client ID** und **Client Secret**

---

### 3️⃣ Credentials in Supabase eintragen

**Zurück zu Supabase Dashboard:**

1. **Authentication → Providers → Google**
2. Paste:
   - **Client ID** (von Google Console)
   - **Client Secret** (von Google Console)
3. **Save**

---

### 4️⃣ App neu starten

```bash
# Dev Server stoppen (Ctrl+C)
# Neu starten:
npm run dev
```

---

### 5️⃣ Erneut testen

1. Öffne http://localhost:5173
2. Klicke **Login with Google**
3. Sollte jetzt funktionieren! ✅

---

## 🐛 Troubleshooting

### Fehler bleibt bestehen?

**Check 1: Richtige Redirect URI?**
```bash
# In Supabase Dashboard → Authentication → Providers → Google
# Die "Callback URL" sollte sein:
https://DEIN-PROJECT-ID.supabase.co/auth/v1/callback

# NICHT:
https://DEIN-PROJECT-ID.supabase.co/auth/callback  ❌ (fehlt /v1)
http://... ❌ (muss https sein)
```

**Check 2: Google Console gespeichert?**
- Nach Änderungen in Google Console **MUSS** "Save" geklickt werden
- Manchmal dauert es 1-2 Minuten bis Änderungen aktiv sind

**Check 3: Richtiges Google Projekt?**
- Stelle sicher, dass du im richtigen Google Cloud Projekt bist
- Check ob Client ID in Supabase mit der in Google Console übereinstimmt

**Check 4: Browser Cache leeren**
```bash
# Chrome/Brave:
Cmd+Shift+Delete → Cookies löschen

# Oder Incognito Mode verwenden
```

---

## 📋 Checkliste

- [ ] Supabase Callback URL kopiert
- [ ] Google Console: Redirect URI hinzugefügt
- [ ] Google Console: Gespeichert
- [ ] Supabase: Client ID & Secret eingetragen
- [ ] Supabase: Gespeichert
- [ ] Dev Server neu gestartet
- [ ] Browser Cache geleert / Incognito Mode
- [ ] Erneut getestet

---

## ✅ Erwartetes Ergebnis

Nach dem Fix:
1. Klick auf "Login with Google"
2. Google Login Popup öffnet sich
3. Email auswählen
4. Redirect zurück zur App
5. ✅ Eingeloggt!

---

## 🆘 Immer noch Probleme?

**Zeig mir:**
1. Die **Callback URL** aus Supabase (Screenshot)
2. Die **Redirect URIs** aus Google Console (Screenshot)
3. Den **genauen Fehlertext** aus dem Browser

Dann kann ich dir weiterhelfen!
