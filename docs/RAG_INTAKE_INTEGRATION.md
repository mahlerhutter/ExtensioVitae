# Smart Intake → User States Integration

**Date:** 2026-02-08  
**Status:** ✅ Code Complete - Ready to Deploy

---

## 🎯 Was wurde implementiert?

### **1. state-api erweitert** ✅

**Neue Action:** `initialize_from_intake`

**Funktion:** `handleInitializeFromIntake()`
- Mappt Intake Responses → User State Fields
- Initialisiert `user_states` Tabelle automatisch
- Upsert-Logik (erstellt oder updated)

**Mapping-Logik:**

| Intake Field | User State Field | Mapping |
|--------------|------------------|---------|
| `sleep_hours_bucket` | `sleep_debt` | `<6h` → `severe`, `6-7h` → `moderate`, `7-8h` → `mild`, `8h+` → `none` |
| `stress_1_10` | `stress_load` | `8-10` → `burnout_risk`, `6-7` → `high`, `4-5` → `elevated`, `1-3` → `baseline` |
| `training_frequency` | `training_load` | `5+/7+` → `building`, `3-4/1-2` → `maintenance`, `0` → `deload` |
| - | `recovery_state` | Default: `moderate` |
| - | `metabolic_flexibility` | Default: `unknown` |
| - | `calibration_start_date` | Current date |
| - | `calibration_completed` | `false` |

---

### **2. saveIntakeToSupabase erweitert** ✅

**File:** `src/lib/supabase.js`

**Neue Logik:**
```javascript
// Nach erfolgreichem Intake-Save:
1. Call state-api mit action: 'initialize_from_intake'
2. Übergebe intake_data
3. Logge Erfolg/Fehler (non-blocking)
```

**Fehlerbehandlung:**
- Intake-Save ist primär
- State-Init ist sekundär
- Fehler werden geloggt, aber nicht geworfen

---

## 🚀 Deployment

### **Step 1: Redeploy state-api Edge Function**

**Option A: Via Supabase Dashboard**
1. Öffne: https://supabase.com/dashboard/project/qnjjusilviwvovrlunep/functions
2. Click auf `state-api`
3. Click "Edit function"
4. Kopiere kompletten Inhalt von: `supabase/functions/state-api/index.ts`
5. Paste & Save
6. Click "Deploy"

**Option B: Via CLI (falls Permissions funktionieren)**
```bash
supabase functions deploy state-api --project-ref qnjjusilviwvovrlunep --no-verify-jwt
```

---

### **Step 2: Frontend neu builden (optional)**

Da `src/lib/supabase.js` geändert wurde:

```bash
# Development: Restart dev server
npm run dev

# Production: Redeploy to Vercel
git add .
git commit -m "feat: Smart Intake → User States integration"
git push
```

---

## 🧪 Testing

### **Test 1: Manueller API Call**

```bash
# Test initialize_from_intake action
curl -X POST 'https://qnjjusilviwvovrlunep.supabase.co/functions/v1/state-api' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "initialize_from_intake",
    "user_id": "YOUR_USER_ID",
    "intake_data": {
      "sleep_hours_bucket": "7-8h",
      "stress_1_10": 5,
      "training_frequency": "3-4"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User state initialized from intake",
  "state": {
    "user_id": "...",
    "sleep_debt": "mild",
    "stress_load": "elevated",
    "training_load": "maintenance",
    "recovery_state": "moderate",
    "metabolic_flexibility": "unknown",
    "calibration_start_date": "2026-02-08",
    "calibration_completed": false
  }
}
```

---

### **Test 2: End-to-End (Smart Intake)**

1. **Öffne:** http://localhost:5173/intake (oder deployed URL)
2. **Fülle Intake aus:**
   - Name: Test User
   - Age: 30
   - Sleep: 7-8h
   - Stress: 5/10
   - Training: 3-4x/week
3. **Submit**
4. **Check Logs:**
   ```
   [Supabase] Intake saved: <intake_id>
   [Supabase] User state initialized: User state initialized from intake
   ```
5. **Verify in Supabase:**
   ```sql
   SELECT * FROM user_states WHERE user_id = 'YOUR_USER_ID';
   ```

**Expected Result:**
```
user_id | sleep_debt | stress_load | training_load | recovery_state | ...
--------|------------|-------------|---------------|----------------|----
abc123  | mild       | elevated    | maintenance   | moderate       | ...
```

---

## 📊 Integration Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    SMART INTAKE FLOW                         │
└─────────────────────────────────────────────────────────────┘

User fills intake form
         │
         ▼
IntakePage.handleSubmit()
         │
         ▼
saveIntake(payload)
         │
         ▼
saveIntakeToSupabase(intakeData, userId)
         │
         ├─► Save to intake_responses table ✅
         │
         └─► Call state-api (initialize_from_intake) ✅
                    │
                    ▼
         handleInitializeFromIntake()
                    │
                    ├─► Map intake → user_states fields
                    │
                    └─► Upsert user_states table ✅
                              │
                              ▼
                    User State Initialized! 🎉
                              │
                              ▼
         Ready for Material Change Detection
         Ready for RAG Decision Engine
```

---

## ✅ Success Criteria

Integration ist erfolgreich wenn:

- [ ] `state-api` redeployed mit neuer Action
- [ ] Intake Submit loggt: "User state initialized"
- [ ] `user_states` Tabelle enthält Entry nach Intake
- [ ] Mapping korrekt: `sleep_hours_bucket` → `sleep_debt`
- [ ] Mapping korrekt: `stress_1_10` → `stress_load`
- [ ] Mapping korrekt: `training_frequency` → `training_load`
- [ ] Keine Fehler im Browser Console
- [ ] Keine Fehler in Supabase Logs

---

## 🔄 Nächste Schritte

Nach erfolgreicher Integration:

1. **Wearable Integration** (Phase 5)
   - Oura/Whoop → Update `user_states` daily
   - Material Change Detection triggers

2. **Decision Engine** (Phase 6)
   - Material Change → RAG Retrieval
   - Canon + Contextual + Temporal → Decision JSON

3. **Dashboard Integration**
   - Zeige User State in Dashboard
   - Visualisiere Material Changes
   - History Timeline

---

## 📝 Code Changes Summary

**Modified Files:**
1. `supabase/functions/state-api/index.ts`
   - Added `handleInitializeFromIntake()` function
   - Added `initialize_from_intake` action
   - Added intake_data mapping logic

2. `src/lib/supabase.js`
   - Extended `saveIntakeToSupabase()`
   - Added state-api call after intake save
   - Added error handling (non-blocking)

**No Database Changes Required:**
- Uses existing `user_states` table from Migration 026
- Uses existing `intake_responses` table

---

## 🎉 Summary

**Smart Intake → User States Integration ist KOMPLETT!**

- ✅ Intake Responses werden automatisch zu User State gemappt
- ✅ User State wird bei jedem Intake Submit initialisiert/updated
- ✅ Fehlerbehandlung ist robust (non-blocking)
- ✅ Bereit für Material Change Detection
- ✅ Bereit für RAG Decision Engine

**Next:** Redeploy `state-api` und teste mit echtem Intake! 🚀
