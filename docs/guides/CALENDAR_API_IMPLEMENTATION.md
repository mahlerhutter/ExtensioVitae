# Calendar API Integration - Implementation Plan

**Date:** 2026-02-04  
**Priority:** #7 in FUTURE.md (Trojan Horse 🐴)  
**Estimated Time:** 3-4 hours (MVP)  
**Strategic Value:** HIGH (data collection + auto-mode activation)

---

## 🎯 Objective

Build Google Calendar integration that:
1. **Surface Value:** Auto-activates Emergency Modes based on calendar events
2. **Hidden Value:** Collects behavioral data for H3 Predictive Fulfillment
3. **User Benefit:** Zero-friction context detection

---

## 📋 MVP Scope (3-4 hours)

### Phase 1: Google Calendar OAuth (1.5h)
- [ ] Set up Google Cloud Project
- [ ] Configure OAuth 2.0 credentials
- [ ] Create OAuth flow in frontend
- [ ] Store access/refresh tokens securely
- [ ] Test authentication

### Phase 2: Calendar Event Fetching (1h)
- [ ] Fetch upcoming events (next 7 days)
- [ ] Parse event data (title, time, location)
- [ ] Store in Supabase (calendar_events table)
- [ ] Handle token refresh

### Phase 3: Auto-Detection Logic (1h)
- [ ] Detect flights (keywords: "flight", "✈️", airport codes)
- [ ] Detect focus blocks (4+ hour blocks)
- [ ] Detect busy weeks (3+ meetings/day)
- [ ] Trigger Emergency Mode activation

### Phase 4: UI Integration (30min)
- [ ] Calendar connection button
- [ ] Connected status indicator
- [ ] Auto-mode activation notifications
- [ ] Settings to enable/disable auto-activation

---

## 🏗️ Technical Architecture

### Frontend Components

```
src/
├── components/
│   └── calendar/
│       ├── CalendarConnect.jsx       # OAuth flow UI
│       ├── CalendarStatus.jsx        # Connection status
│       └── CalendarSettings.jsx      # Auto-activation settings
├── lib/
│   ├── googleCalendar.js            # Google Calendar API client
│   └── calendarDetection.js         # Event detection logic
└── contexts/
    └── CalendarContext.jsx          # Calendar state management
```

### Backend (Supabase)

```sql
-- calendar_connections table
CREATE TABLE calendar_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'google', 'apple', 'outlook'
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- calendar_events table
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES calendar_connections(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL, -- Google event ID
  title TEXT,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  attendees JSONB,
  metadata JSONB, -- For detection flags
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(connection_id, event_id)
);

-- calendar_detections table (for H3 data)
CREATE TABLE calendar_detections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  detection_type TEXT NOT NULL, -- 'flight', 'focus_block', 'busy_week'
  confidence FLOAT, -- 0.0 - 1.0
  metadata JSONB,
  mode_activated TEXT, -- Which mode was triggered
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Edge Function (Supabase)

```javascript
// supabase/functions/calendar-sync/index.ts
// Runs every 6 hours to fetch new events
```

---

## 🔍 Detection Logic

### Flight Detection
```javascript
const detectFlight = (event) => {
  const keywords = ['flight', 'flug', '✈️', 'boarding'];
  const airportCodes = /\b[A-Z]{3}\b/g; // LAX, JFK, etc.
  
  const hasKeyword = keywords.some(k => 
    event.title.toLowerCase().includes(k)
  );
  const hasAirportCode = airportCodes.test(event.title);
  
  if (hasKeyword || hasAirportCode) {
    return {
      type: 'flight',
      confidence: hasKeyword && hasAirportCode ? 0.9 : 0.7,
      trigger_time: event.start_time - 24 * 60 * 60 * 1000, // 24h before
      mode: 'TRAVEL'
    };
  }
  return null;
};
```

### Focus Block Detection
```javascript
const detectFocusBlock = (event) => {
  const duration = event.end_time - event.start_time;
  const hours = duration / (1000 * 60 * 60);
  
  if (hours >= 4) {
    const keywords = ['focus', 'deep work', 'writing', 'coding'];
    const hasFocusKeyword = keywords.some(k => 
      event.title.toLowerCase().includes(k)
    );
    
    return {
      type: 'focus_block',
      confidence: hasFocusKeyword ? 0.9 : 0.6,
      trigger_time: event.start_time,
      mode: 'DEEP_WORK'
    };
  }
  return null;
};
```

### Busy Week Detection
```javascript
const detectBusyWeek = (events, date) => {
  const weekEvents = events.filter(e => 
    isSameWeek(e.start_time, date)
  );
  
  const dailyMeetings = groupByDay(weekEvents);
  const busyDays = Object.values(dailyMeetings).filter(
    day => day.length >= 3
  );
  
  if (busyDays.length >= 3) {
    return {
      type: 'busy_week',
      confidence: 0.8,
      trigger_time: getWeekStart(date),
      mode: null, // Just alert, don't activate mode
      alert: 'High stress week detected'
    };
  }
  return null;
};
```

---

## 🔐 Security Considerations

### Token Storage
- ✅ Store in Supabase (encrypted at rest)
- ✅ Never expose in frontend
- ✅ Use RLS policies
- ✅ Rotate tokens regularly

### OAuth Scopes
```javascript
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events.readonly'
];
// Read-only access only
```

### RLS Policies
```sql
-- Users can only access their own calendar data
CREATE POLICY "Users can view own calendar connections"
  ON calendar_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own calendar events"
  ON calendar_events FOR SELECT
  USING (auth.uid() = user_id);
```

---

## 🎨 UI/UX Flow

### 1. Connection Flow
```
Dashboard → Settings → Calendar Integration
  ↓
"Connect Google Calendar" button
  ↓
Google OAuth popup
  ↓
Success → "Calendar connected ✓"
  ↓
Auto-sync starts (background)
```

### 2. Auto-Activation Notification
```
[Notification]
✈️ Flight detected tomorrow
Travel Mode activated automatically

[Dismiss] [View Details]
```

### 3. Settings Panel
```
Calendar Integration
  ✓ Google Calendar connected
  
Auto-Activation Settings:
  ☑ Auto-activate Travel Mode (flights)
  ☑ Auto-activate Deep Work Mode (focus blocks)
  ☐ Alert on busy weeks (no auto-activation)
  
[Disconnect Calendar]
```

---

## 📊 Success Metrics

### Technical
- [ ] OAuth flow works (success rate >95%)
- [ ] Events sync within 6 hours
- [ ] Detection accuracy >80%
- [ ] Zero token leaks

### User
- [ ] 30%+ users connect calendar
- [ ] 50%+ enable auto-activation
- [ ] 70%+ find auto-activation helpful
- [ ] <5% disconnect calendar

### Strategic (H3)
- [ ] Collect 1000+ flight events
- [ ] Collect 500+ focus blocks
- [ ] Build behavioral patterns
- [ ] Predict mode needs

---

## 🚀 Implementation Steps

### Step 1: Google Cloud Setup (15min)
1. Create Google Cloud Project
2. Enable Google Calendar API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URIs

### Step 2: Database Schema (15min)
1. Create tables in Supabase
2. Set up RLS policies
3. Create indexes
4. Test migrations

### Step 3: Frontend OAuth (1h)
1. Create CalendarConnect component
2. Implement OAuth flow
3. Handle token storage
4. Test authentication

### Step 4: Event Fetching (45min)
1. Create googleCalendar.js client
2. Fetch events API call
3. Store in Supabase
4. Handle pagination

### Step 5: Detection Logic (1h)
1. Implement flight detection
2. Implement focus block detection
3. Implement busy week detection
4. Test with sample data

### Step 6: Auto-Activation (30min)
1. Trigger Emergency Mode on detection
2. Send notification
3. Log to analytics
4. Test end-to-end

### Step 7: UI Integration (30min)
1. Add to Dashboard settings
2. Create status indicator
3. Add settings panel
4. Test user flow

---

## ⚠️ Risks & Mitigation

### Risk 1: OAuth Complexity
**Mitigation:** Use proven library (react-google-login)

### Risk 2: Token Expiration
**Mitigation:** Implement automatic refresh

### Risk 3: Detection False Positives
**Mitigation:** Allow user to disable auto-activation

### Risk 4: Privacy Concerns
**Mitigation:** Clear privacy policy, read-only access

---

## 📝 Next Steps

**Immediate:**
1. Set up Google Cloud Project
2. Create database schema
3. Start OAuth implementation

**After MVP:**
1. Add Apple Calendar support
2. Add Outlook support
3. Improve detection algorithms
4. Build H3 data pipeline

---

**Status:** ✅ READY TO BUILD  
**Priority:** HIGH (Trojan Horse)  
**Time:** 3-4 hours

🎯 **Let's build it!**
