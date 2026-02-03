# ExtensioVitae — MVP Roadmap & Next Steps

> **Stand:** 3. Februar 2026 | **Version:** 0.1 (Early Beta)

---

## ✅ Was ist FERTIG

### Core Features
- [x] **Landing Page** - Responsive, SEO-optimiert
- [x] **Intake Form** - 10 Fragen, Validierung
- [x] **AI Plan Generation** - GPT-4 via Supabase Edge Function
- [x] **Dashboard** - 30-Tage Plan, Task-Tracking
- [x] **User Authentication** - Email/Google OAuth
- [x] **Feedback System** - Initial, General, Bug, Feature
- [x] **Admin Dashboard** - User-Liste, Pläne, Feedbacks

### Legal & Compliance
- [x] **Privacy Policy** - DSGVO-konform
- [x] **Terms of Service** - Deutsch
- [x] **Impressum** - EU-Pflicht
- [x] **Beta Badge** - Erwartungsmanagement

### Technical
- [x] **Deployment** - Vercel (Auto-Deploy)
- [x] **Database** - Supabase (EU Region)
- [x] **Mobile Responsive** - Alle Komponenten

---

## 🎯 MVP Definition: Was fehlt noch?

### KRITISCH (vor öffentlichem Launch)

#### 1. **Email Notifications** 📧
- [ ] Willkommens-Email nach Signup
- [ ] Plan-Ready Email nach Generation
- [ ] Wöchentliche Progress-Zusammenfassung
- **Warum:** User brauchen Erinnerungen, sonst vergessen sie die App

#### 2. **Onboarding Flow** 🚀
- [ ] Intro-Tour im Dashboard
- [ ] Tooltips für neue User
- [ ] "So funktioniert's" Sektion
- **Warum:** User verstehen nicht sofort was zu tun ist

#### 3. **Plan-Qualität verbessern** 🧠
- [ ] Bessere AI Prompts
- [ ] Mehr Personalisierung basierend auf Intake
- [ ] Wissenschaftliche Quellen zu Tasks
- **Warum:** Core Value Proposition

---

### WICHTIG (für gute UX)

#### 4. **Progress Tracking** 📊
- [ ] Streak-Counter (X Tage in Folge)
- [ ] Wöchentliche/Monatliche Statistiken
- [ ] Longevity Score Entwicklung
- **Warum:** Gamification = Motivation

#### 5. **Plan Anpassung** ✏️
- [ ] Tasks verschieben
- [ ] Tasks als "nicht machbar" markieren
- [ ] Alternative Tasks vorschlagen
- **Warum:** Life happens, Plan muss flexibel sein

#### 6. **Reminder System** ⏰
- [ ] Browser Push Notifications
- [ ] Einstellbare Reminder-Zeiten
- [ ] Daily Digest Option
- **Warum:** Ohne Reminder = keine Nutzung

---

### NICE-TO-HAVE (nach Launch)

#### 7. **Social Features** 👥
- [ ] Freunde einladen
- [ ] Accountability Partner
- [ ] Anonyme Leaderboards
- **Warum:** Soziale Motivation

#### 8. **Content Library** 📚
- [ ] Wissenschaftliche Artikel
- [ ] Video-Tutorials
- [ ] Rezepte & Workouts
- **Warum:** Mehrwert über Plan hinaus

#### 9. **Premium Features** 💎
- [ ] Erweiterte Analytics
- [ ] 1:1 Coaching Integration
- [ ] Wearable-Integration (Fitbit, Apple Watch)
- **Warum:** Monetarisierung

---

## 📅 Vorgeschlagener Fahrplan

### Woche 1: Email & Notifications
```
Mo-Di: Resend.com Integration
Mi-Do: Email Templates (Welcome, Plan Ready)
Fr:    Testing & Deploy
```

### Woche 2: Onboarding & UX
```
Mo-Di: Intro-Tour mit React Joyride
Mi-Do: Onboarding Checkliste im Dashboard
Fr:    User Testing, Feedback einarbeiten
```

### Woche 3: Plan Verbesserungen
```
Mo:    AI Prompt Optimierung
Di-Mi: Task-Datenbank mit Quellen
Do-Fr: Plan Review Feature
```

### Woche 4: Launch Vorbereitung
```
Mo:    Load Testing
Di:    Bug Fixes
Mi:    Marketing Assets
Do:    Soft Launch (50 User)
Fr:    🎉 Public Launch
```

---

## 🧠 Entscheidungen zu treffen

### 1. **Email Provider**
| Option | Kosten | Vorteile |
|--------|--------|----------|
| Resend | $0-$20/mo | Modern, einfache API |
| Postmark | $10/mo | Beste Deliverability |
| SendGrid | $0-$15/mo | Bekannt, robust |
| Supabase Edge | $0 | Kostenlos, aber basic |

**Empfehlung:** Resend (modern, React Email Templates)

### 2. **Notification Strategie**
- Option A: Email only (einfacher)
- Option B: Email + Push (besser, mehr Aufwand)
- Option C: Email + Push + SMS (teuer)

**Empfehlung:** Start mit Email, Push später

### 3. **Analytics**
- PostHog (empfohlen) - Privacy-first
- Mixpanel - Mächtig, aber $$
- Vercel Analytics - Basic, kostenlos

**Empfehlung:** PostHog einrichten

---

## 💡 Quick Wins (< 2 Stunden)

1. **404 Seite** - Schöner als Vercel Default
2. **Loading States** - Skeleton Loaders
3. **Empty States** - Wenn keine Daten
4. **Meta Tags** - Open Graph für Social Sharing
5. **Favicon** - App Icon im Browser Tab

---

## 🚀 Immediate Next Steps

1. **Heute:** Auth Redirect URLs fixen (Supabase + Google)
2. **Morgen:** Email System einrichten (Resend)
3. **Diese Woche:** Onboarding Flow

---

## 📊 Success Metrics für MVP

| Metrik | Ziel |
|--------|------|
| Signups | 100 in Woche 1 |
| Activated (Plan generated) | 50% |
| Day 7 Retention | 30% |
| Feedback gegeben | 20% |
| NPS Score | > 30 |

---

## ❓ Offene Fragen

1. Willst du Emails selbst hosten oder Service nutzen?
2. Soll Plan-Generation kostenpflichtig werden?
3. Wer ist deine erste Zielgruppe für Launch?
4. Hast du schon Marketing-Kanäle geplant?

---

*Letzte Aktualisierung: 3. Februar 2026*
