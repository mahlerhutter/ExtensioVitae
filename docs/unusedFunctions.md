# ExtensioVitae — Unused Functions & Dead Code Audit

**Generated:** 2026-02-07
**Scope:** Full `src/` directory analysis
**Total Unused Exports:** ~247 (229 lib functions + 17 components + 6 hooks)

---

## ZUSAMMENFASSUNG

| Kategorie | Anzahl | Geschätzte Zeilen | Bundle-Impact |
|-----------|--------|-------------------|---------------|
| Lib-Funktionen (nie importiert) | 229 | ~6.500 | ~25-40 kB |
| Unused Components (nie gerendert) | 17 | ~850 | ~2-5 kB |
| Unused Hooks | 6 | ~220 | ~1 kB |
| **Gesamt** | **~247** | **~7.570** | **~28-46 kB** |

### Priorität

- **Rot — Ganze Files unused:** 18 Service-Files, deren ALLE Exports unused sind
- **Orange — Teilweise unused:** 19 Files mit Mix aus genutzten + ungenutzten Exports
- **Gelb — Components unused:** 17 Komponenten die nirgends gerendert werden
- **Grün — 1 Bug gefunden:** `tasks` statt `allTasks` in TodayDashboard.jsx (Zeile 93)

---

## 1. KOMPLETT UNGENUTZTE SERVICE-FILES (Rot)

Diese Files haben **keine einzige Funktion** die irgendwo importiert wird. Kandidaten für Löschung oder Feature-Freeze-Archivierung.

### lib/adminService.js (2 Exports)
| Funktion | Zeile | Beschreibung |
|----------|-------|-------------|
| `checkAdminStatus` | 18 | Admin-Zugriff prüfen |
| `getAdminDetails` | 56 | Admin-Status mit Details |

### lib/analytics.js (15 Exports)
| Funktion | Zeile | Beschreibung |
|----------|-------|-------------|
| `initAnalytics` | 55 | PostHog Analytics initialisieren |
| `identifyUser` | 103 | User nach Login identifizieren |
| `trackEvent` | 118 | Custom Event tracken |
| `trackPageView` | 135 | Page View tracken |
| `resetUser` | 143 | User bei Logout zurücksetzen |
| `trackIntakeCompleted` | 152 | Intake-Abschluss tracken |
| `trackPlanGenerated` | 162 | Plan-Generierung tracken |
| `trackTaskCompleted` | 171 | Task-Abschluss tracken |
| `trackDayCompleted` | 179 | Tag-Abschluss tracken |
| `trackSignup` | 195 | Signup tracken |
| `trackLogin` | 199 | Login tracken |
| `trackPlanReviewOpened` | 203 | Plan-Review tracken |
| `trackPlanAccepted` | 207 | Plan-Akzeptanz tracken |
| `trackHealthProfileUpdated` | 211 | Health-Profile-Update tracken |
| `trackFeatureUsed` | 218 | Feature-Nutzung tracken |

### lib/analyticsService.js (6 Exports)
| Funktion | Zeile | Beschreibung |
|----------|-------|-------------|
| `calculateWeeklyAggregate` | 40 | Wöchentliche Aggregation berechnen |
| `getProgressOverview` | 152 | Progress-Übersicht für Dashboard |
| `checkAndAwardAchievements` | 263 | Achievements vergeben |
| `getUserAchievements` | 350 | Alle Achievements abrufen |
| `getCompletionHistory` | 380 | Completion-History für Charts |
| `getPillarProgressHistory` | 409 | Pillar-Fortschritt über Zeit |

### lib/bloodCheckService.js (9 Exports)
| Funktion | Zeile | Beschreibung |
|----------|-------|-------------|
| `getLabResults` | 20 | Lab-Results-History abrufen |
| `getLabResultWithAnalysis` | 42 | Einzelnes Lab-Result mit Biomarker-Analyse |
| `saveLabResult` | 79 | Neues Lab-Result speichern |
| `parseLabReport` | 123 | Lab-Report per OCR parsen |
| `updateBiomarkers` | 183 | Biomarker manuell eingeben |
| `getBiomarkerReferences` | 221 | Alle Biomarker-Referenzwerte |
| `getDeficiencies` | 357 | Defizite für Blood-Check-Modul |
| `compareLatestResults` | 380 | Zwei Lab-Results vergleichen |
| `checkBloodCheckDue` | 486 | Prüfen ob Blood-Check fällig |

### lib/calendarDetection.js (7 Exports)
| Funktion | Zeile | Beschreibung |
|----------|-------|-------------|
| `detectFlight` | 13 | Flug-Events erkennen |
| `detectFocusBlock` | 78 | Focus-Blöcke erkennen (4h+) |
| `detectBusyWeek` | 140 | Busy Week erkennen (3+ Meetings/Tag) |
| `detectDoctorAppointment` | 200 | Arzt-Termine erkennen |
| `detectAll` | 248 | Alle Detektionen auf Event anwenden |
| `detectBusyWeekFromEvents` | 268 | Busy Week aus Event-Liste |
| `getDetectionSummary` | 277 | Detection-Summary für UI |

### lib/circadianService.js (5 Exports)
| Funktion | Zeile | Beschreibung |
|----------|-------|-------------|
| `getSolarTimes` | 35 | Sonnenzeiten nach Lat/Long |
| `shouldActivateMelatoninGuard` | 111 | Melatonin-Guard aktivieren? |
| `getCircadianWindow` | 128 | Optimales Zirkadian-Fenster |
| `getCircadianRecommendations` | 181 | Zirkadiane Empfehlungen |
| `getCurrentCircadianPhase` | 264 | Aktuelle zirkadiane Phase |

### lib/emailService.js (1 Export)
| Funktion | Zeile | Beschreibung |
|----------|-------|-------------|
| `emailService` | 9 | Email-Versand via Supabase Edge Function |

### lib/encryptionService.js (1 Export)
| Funktion | Zeile | Beschreibung |
|----------|-------|-------------|
| `isEncrypted` | 149 | Prüfen ob Daten verschlüsselt sind |

### lib/fastingService.js (4 Exports)
| Funktion | Zeile | Beschreibung |
|----------|-------|-------------|
| `getFastingWindow` | 12 | Fasten-Fenster nach Wake-Time |
| `getFastingProtocols` | 57 | Fasten-Protokolle (16/8, 18/6, etc.) |
| `getCustomFastingWindow` | 97 | Custom Eating-Window berechnen |
| `getMealTimings` | 123 | Mahlzeiten-Timing Empfehlungen |

### lib/feedbackService.js (6 Exports)
| Funktion | Zeile | Beschreibung |
|----------|-------|-------------|
| `submitFeedback` | 24 | Feedback einreichen |
| `getUserFeedback` | 65 | Eigenes Feedback abrufen |
| `checkIfFeedbackGiven` | 91 | Feedback bereits gegeben? |
| `getAllFeedback` | 124 | Alles Feedback (Admin) |
| `markFeedbackReviewed` | 191 | Feedback als reviewed markieren |
| `getFeedbackStats` | 220 | Feedback-Statistiken (Admin) |

### lib/googleCalendar.js (7 Exports)
| Funktion | Zeile | Beschreibung |
|----------|-------|-------------|
| `getGoogleAuthUrl` | 17 | Google OAuth URL generieren |
| `exchangeCodeForTokens` | 35 | Auth-Code gegen Tokens tauschen |
| `refreshAccessToken` | 63 | Access Token erneuern |
| `fetchCalendarEvents` | 91 | Calendar Events fetchen |
| `parseGoogleEvent` | 132 | Google Event parsen |
| `getCalendarInfo` | 161 | Calendar-Info abrufen |
| `revokeAccess` | 184 | Google-Zugriff widerrufen |

### lib/inventoryService.js (11 Exports)
| Funktion | Zeile | Beschreibung |
|----------|-------|-------------|
| `getUserInventory` | 62 | Supplement-Inventar abrufen |
| `updateSupplementStock` | 87 | Supplement-Bestand aktualisieren |
| `calculateDailyConsumption` | 117 | Täglichen Verbrauch berechnen |
| `calculateDepletionDate` | 138 | Aufbrauchdatum berechnen |
| `getInventoryStatus` | 155 | Inventar-Status mit Prognosen |
| `checkProtocolFulfillment` | 206 | Protokoll-Erfüllung prüfen |
| `logConsumption` | 253 | Supplement-Einnahme loggen |
| `generateReorderList` | 306 | Nachbestellliste generieren |
| `generateReorderMessage` | 347 | Nachbestell-Nachricht erstellen |
| `logReorder` | 391 | Nachbestellung loggen |
| `initializeInventory` | 421 | Default-Inventar initialisieren |

### lib/notificationService.js (14 Exports)
| Funktion | Zeile | Beschreibung |
|----------|-------|-------------|
| `getNotificationPreferences` | 19 | Benachrichtigungs-Einstellungen |
| `updateNotificationPreferences` | 59 | Einstellungen aktualisieren |
| `scheduleNotification` | 91 | Benachrichtigung planen |
| `scheduleTaskReminder` | 163 | Task-Erinnerung planen |
| `scheduleStreakWarning` | 193 | Streak-Warnung planen |
| `scheduleWeeklySummary` | 221 | Wochen-Zusammenfassung planen |
| `scheduleBloodCheckReminder` | 244 | Blood-Check-Erinnerung |
| `sendAchievementNotification` | 272 | Achievement-Benachrichtigung |
| `getPendingNotifications` | 291 | Ausstehende Benachrichtigungen |
| `markNotificationSent` | 316 | Als gesendet markieren |
| `markNotificationOpened` | 341 | Als geöffnet markieren |
| `getNotificationHistory` | 367 | Benachrichtigungs-History |
| `requestPushPermission` | 393 | Push-Permission anfragen |
| `subscribeToPush` | 416 | Push-Notifications abonnieren |

### lib/offlineService.js (11 Exports)
| Funktion | Zeile | Beschreibung |
|----------|-------|-------------|
| `registerServiceWorker` | 17 | Service Worker registrieren |
| `unregisterServiceWorker` | 53 | Service Worker deregistrieren |
| `skipWaiting` | 65 | Neuen SW sofort aktivieren |
| `checkOffline` | 81 | Offline-Status prüfen |
| `subscribeToOfflineStatus` | 90 | Offline-Status abonnieren |
| `queueForSync` | 146 | Request für Sync queuen |
| `getQueuedRequests` | 173 | Gequeute Requests abrufen |
| `clearSyncQueue` | 193 | Sync-Queue leeren |
| `subscribeToUpdates` | 268 | App-Update-Events abonnieren |
| `precacheUrls` | 284 | URLs pre-cachen |
| `offlineFetch` | 310 | Fetch mit Offline-Queueing |

### lib/optimizationEngine.js (5 Exports)
| Funktion | Zeile | Beschreibung |
|----------|-------|-------------|
| `applyModeSwap` | 94 | Mode-basierte Task-Swaps |
| `applyChronoInjection` | 141 | Chronobiologische Task-Injections |
| `applyBufferOptimization` | 215 | Buffer-Optimierung für Task-Timing |
| `optimizeDailyPlan` | 286 | Täglichen Plan optimieren |
| `getOptimizationContext` | 368 | Optimization-Kontext abrufen |

### lib/predictiveService.js (5 Exports)
| Funktion | Zeile | Beschreibung |
|----------|-------|-------------|
| `scanCalendarForPredictions` | 199 | Kalender nach Vorhersagen scannen |
| `autoActivateProtocol` | 237 | Protokoll auto-aktivieren |
| `checkBioFulfillment` | 297 | Biomarker-Erfüllung prüfen |
| `getSupplementInventory` | 335 | Supplement-Inventar für Protokoll |
| `getPredictiveIntelligence` | 355 | Komplette Predictive Intelligence |

### lib/recoveryService.js (6 Exports)
| Funktion | Zeile | Beschreibung |
|----------|-------|-------------|
| `RECOVERY_THRESHOLDS` | 21 | Recovery-Schwellenwerte |
| `FEELING_SCORES` | 27 | Emoji-Score-Mapping |
| `WAKEUP_PENALTIES` | 33 | Aufwach-Penalties |
| `calculateRecoveryScore` | 51 | Recovery-Score berechnen |
| `getTodayRecoveryScore` | 360 | Heutigen Recovery-Score |
| `getRecoveryHistory` | 336 | Recovery-History |

### lib/smartLogService.js (6 Exports)
| Funktion | Zeile | Beschreibung |
|----------|-------|-------------|
| `logSmartActivity` | 18 | Smart Activity loggen |
| `getTodayLogs` | 60 | Heutige Logs abrufen |
| `getLogsByDateRange` | 84 | Logs nach Zeitraum |
| `getTodayPillarSummary` | 105 | Heutige Pillar-Zusammenfassung |
| `deleteActivityLog` | 138 | Activity Log löschen |
| `PILLAR_META` | 154 | Pillar-Metadaten für Logging |

### lib/supplementTiming.js (6 Exports)
| Funktion | Zeile | Beschreibung |
|----------|-------|-------------|
| `SUPPLEMENT_TIMING_RULES` | 38 | Supplement-Timing-Regeln |
| `getOptimalTimings` | 292 | Optimale Einnahmezeiten |
| `groupSupplementsByTiming` | 353 | Supplements nach Timing gruppieren |
| `checkTimingConflicts` | 379 | Timing-Konflikte prüfen |
| `formatSupplementTime` | 410 | Supplement-Zeit formatieren |
| `getSupplementDisplayName` | 422 | Supplement-Anzeigename |

---

## 2. TEILWEISE UNGENUTZTE FILES (Orange)

Diese Files haben einige genutzte UND einige ungenutzte Exports.

### lib/moduleService.js
**Genutzt:** `activateModule`, `getActiveUserModules`, `FALLBACK_MODULES`, `SLUG_ALIASES`
**Ungenutzt:**
| Funktion | Zeile | Beschreibung |
|----------|-------|-------------|
| `getAvailableModules` | 1330 | Alle verfügbaren Module-Definitionen |
| `getUserModules` | 1473 | User-Module abrufen |
| `pauseModule` | 1676 | Modul pausieren |
| `resumeModule` | 1701 | Pausiertes Modul fortsetzen |
| `deactivateModule` | 1726 | Modul deaktivieren |
| `updateModuleConfig` | 1751 | Modul-Config aktualisieren |
| `updateModuleProgress` | 1775 | Modul-Fortschritt aktualisieren |
| `getModuleCategories` | 1817 | Modul-Kategorien abrufen |
| `hasModuleActive` | 1858 | Hat User aktive Module? |
| `checkYearlySuggestion` | 1888 | Jahres-Modul vorschlagen? |

> **Hinweis:** `getAvailableModules` und `checkYearlySuggestion` werden in kürzlich geschriebenen Komponenten verwendet (ModuleMarketplace.jsx, ModuleHubPage.jsx, YearlySuggestionBanner.jsx). Die Suche hat möglicherweise neuere Imports nicht erfasst — **bitte manuell verifizieren**.

### lib/dailyTrackingService.js
**Genutzt:** *(in DashboardPage/TodayDashboard)*
**Ungenutzt:**
| Funktion | Zeile | Beschreibung |
|----------|-------|-------------|
| `getDailyTracking` | 27 | Tägliche Tracking-Daten abrufen |
| `generateDailyTracking` | 61 | Tägliches Tracking generieren |
| `completeTask` | 530 | Task als erledigt markieren |
| `skipTask` | 560 | Task überspringen |
| `undoTaskCompletion` | 589 | Task-Erledigung rückgängig machen |
| `getTrackingHistory` | 655 | Tracking-History abrufen |
| `calculateStreak` | 689 | Streak berechnen |
| `getWeeklySummary` | 719 | Wöchentliche Zusammenfassung |

### lib/dataService.js (14 Exports — alle unused)
| Funktion | Zeile | Beschreibung |
|----------|-------|-------------|
| `saveIntake` | 54 | Intake speichern |
| `getIntake` | 94 | Intake abrufen |
| `savePlan` | 148 | Plan speichern |
| `getPlan` | 201 | Plan abrufen |
| `getCachedPlan` | 250 | Gecachten Plan prüfen |
| `getArchivedPlans` | 269 | Archivierte Pläne |
| `getProgress` | 287 | Task-Progress abrufen |
| `updateProgress` | 327 | Progress aktualisieren |
| `clearLocalData` | 367 | Lokale Daten löschen |
| `getStorageInfo` | 391 | Speicher-Info |
| `activateProtocol` | 409 | Protokoll aktivieren |
| `getActiveProtocols` | 449 | Aktive Protokolle |
| `updateProtocolTaskStatus` | 485 | Protokoll-Task-Status |
| `deactivateProtocol` | 549 | Protokoll deaktivieren |

### lib/healthConstraints.js (9 Exports — alle unused)
| Funktion | Zeile | Beschreibung |
|----------|-------|-------------|
| `TAG_AVOIDANCE_RULES` | 15 | Tags die vermieden werden sollen |
| `TAG_PREFERENCE_RULES` | 60 | Bevorzugte Tags nach Kondition |
| `INTENSITY_CAPS` | 104 | Intensitäts-Limits nach Kondition |
| `shouldExcludeTask` | 113 | Task ausschließen nach Health |
| `healthPreferenceBoost` | 154 | Präferenz-Boost nach Health |
| `calculateIntensityCap` | 192 | Intensitäts-Cap berechnen |
| `filterTasksByHealth` | 221 | Tasks nach Health filtern |
| `generateHealthWarnings` | 244 | Health-Warnungen generieren |
| `createHealthSummary` | 280 | Health-Summary erstellen |

### lib/planModuleService.js (8 Exports — teilweise genutzt)
**Genutzt:** `generateYearlyPreview` (in ModulePreview.jsx), `generateModulePreview`
**Ungenutzt:**
| Funktion | Zeile | Beschreibung |
|----------|-------|-------------|
| `convertPlanToModule` | 21 | Plan zu Modul konvertieren |
| `getActivePlanModule` | 144 | Aktives Plan-Modul abrufen |
| `getConvertiblePlan` | 170 | Konvertierbaren Plan finden |
| `quickActivateModule` | 233 | Quick-Aktivierung |
| `getRecommendedModules` | 263 | Empfohlene Module |
| `getStarterBundle` | 306 | Starter-Bundle |

### lib/profileService.js
**Genutzt:** `getHealthProfile`, `getUserProfile`, `upsertUserProfile`
**Ungenutzt:**
| Funktion | Zeile | Beschreibung |
|----------|-------|-------------|
| `CHRONIC_CONDITIONS` | 18 | Chronische Krankheiten mit Plan-Impact |
| `INJURIES_LIMITATIONS` | 201 | Verletzungen/Einschränkungen |
| `DIETARY_RESTRICTIONS` | 263 | Diät-Einschränkungen |
| `upsertHealthProfile` | 352 | Health-Profil erstellen/updaten |
| `updateCoreHealthProfile` | 396 | Core Health-Daten updaten |
| `updateExtendedHealthProfile` | 423 | Extended Health updaten |
| `createPlanSnapshot` | 441 | Plan-Snapshot erstellen |
| `getPlanSnapshot` | 473 | Plan-Snapshot abrufen |
| `calculatePlanConstraints` | 496 | Plan-Constraints berechnen |
| `generateConstraintsSummary` | 593 | Constraints-Summary generieren |
| `migrateIntakeToProfiles` | 626 | Intake zu Profiles migrieren |

### lib/modeService.js (10 Exports — alle unused)
| Funktion | Zeile | Beschreibung |
|----------|-------|-------------|
| `getUserMode` | 83 | Aktuellen Modus abrufen |
| `setUserMode` | 129 | Modus setzen |
| `resetToNormalMode` | 194 | Zurück zu Normal |
| `extendModeDuration` | 204 | Modus-Dauer verlängern |
| `getAllModes` | 244 | Alle verfügbaren Modi |
| `getModeConfig` | 253 | Modus-Konfiguration |
| `shouldPauseModule` | 263 | Modul pausieren im Modus? |
| `shouldSuppressNotifications` | 274 | Notifications unterdrücken? |
| `getTimeRemaining` | 284 | Verbleibende Modus-Zeit |
| `formatModeForDisplay` | 304 | Modus für UI formatieren |

### lib/modeTypes.js (5 Exports — alle unused)
| Funktion | Zeile | Beschreibung |
|----------|-------|-------------|
| `MODE_CONFIGS` | 20 | Mode-Konfigurationen (Travel, Sick, etc.) |
| `getModeConfig` | 309 | Config nach ID |
| `getAvailableModes` | 316 | Alle Modi (ohne NORMAL) |
| `getModeColorClass` | 323 | Tailwind Farb-Klasse |
| `shouldSuppressNotifications` | 338 | Notifications unterdrücken? |

### Weitere Files mit einzelnen unused Exports

| File | Unused | Zeile | Beschreibung |
|------|--------|-------|-------------|
| `lib/llmPlanGenerator.js` | `SYSTEM_PROMPT` | 72 | LLM System Prompt (Edge Function) |
| `lib/logger.js` | `LOG_LEVELS` | 12 | Log-Level Konstanten |
| `lib/moduleScienceData.js` | `MODULE_SCIENCE_DATA` | 12 | Science-Daten pro Modul |
| `lib/longevityScore.js` | `generateLifeInWeeksData` | 720 | Life-in-Weeks Visualisierung |
| `lib/longevityScore.js` | `calculateQuickScore` | 806 | Quick Longevity Score |
| `lib/planGenerator.js` | `generatePlan` | 21 | 30-Tage Plan generieren |
| `lib/planGenerator.js` | `getPlanGeneratorInfo` | 120 | Generator-Info |
| `lib/planOverviewService.js` | `calculatePlanOverview` | 14 | Plan-Übersicht berechnen |
| `lib/planOverviewService.js` | `savePlanOverview` | 260 | Plan-Übersicht speichern |
| `lib/planOverviewService.js` | `getPlanOverview` | 287 | Plan-Übersicht abrufen |
| `lib/readinessService.js` | `calculateReadinessScore` | 79 | Readiness Score |
| `lib/readinessService.js` | `recordManualReadiness` | 321 | Manuelle Readiness |
| `lib/readinessService.js` | `getTodayReadiness` | 414 | Heutige Readiness |
| `lib/readinessService.js` | `getReadinessHistory` | 424 | Readiness-History |
| `lib/readinessService.js` | `getIntensityLevels` | 449 | Intensitäts-Level |
| `lib/supabase.js` | `updateTaskProgress` | 53 | Task-Progress updaten |
| `lib/supabase.js` | `submitIntake` | 88 | Intake einreichen |
| `lib/supabase.js` | `signInWithGoogle` | 120 | Google Sign-In |
| `lib/supabase.js` | `signOut` | 143 | Ausloggen |
| `lib/supabase.js` | `onAuthStateChange` | 182 | Auth State Changes |
| `lib/supabase.js` | `isAuthAvailable` | 194 | Auth verfügbar? |

---

## 3. UNGENUTZTE KOMPONENTEN (Gelb)

### Kategorie A: Dead Code — Nirgends importiert (12)

| Komponente | Pfad | Beschreibung |
|------------|------|-------------|
| `ActiveModuleCard` | `components/dashboard/ActiveModuleCard.jsx` | Aktives Modul mit Progress |
| `BiomarkerResultsCard` | `components/lab/BiomarkerResultsCard.jsx` | Lab-Results-Anzeige |
| `CalendarSettings` | `components/calendar/CalendarSettings.jsx` | Kalender-Sync-Config |
| `DayCell` | `components/dashboard/DayCell.jsx` | Tag-Grid-Button |
| `DayPreviewModal` | `components/dashboard/DayPreviewModal.jsx` | Tag-Details-Popup |
| `LifeInWeeks` | `components/LifeInWeeks.jsx` | Lebens-Visualisierung |
| `LongevityScoreCard` | `components/LongevityScoreCard.jsx` | Score-Anzeige |
| `MicroFeedbackToast` | `components/feedback/MicroFeedbackToast.jsx` | Sentiment-Check Toast |
| `MorningBioCheckOverlay` | `components/dashboard/MorningBioCheckOverlay.jsx` | Bio-Check Popup (v0.6.0) |
| `ReadinessWidget` | `components/dashboard/ReadinessWidget.jsx` | Readiness Score (v0.6.0) |
| `TodayTaskList` | `components/dashboard/TodayTaskList.jsx` | Heutige Tasks-Liste |
| `ProductEvolutionMockup` | `pages/ProductEvolutionMockup.jsx` | Product-Evolution Mockup (nie geroutet) |

### Kategorie B: Lazy-Loaded aber nie verwendet (3)

| Komponente | Pfad | Beschreibung |
|------------|------|-------------|
| `ProgressDashboard` | `components/analytics/ProgressDashboard.jsx` | Analytics Dashboard |
| `BloodCheckPanel` | `components/bloodcheck/BloodCheckPanel.jsx` | Blood-Test OCR & Visualisierung |
| `NotificationSettings` | `components/notifications/NotificationSettings.jsx` | Notification-Einstellungen |

### Kategorie C: Barrel-Exported aber nie verwendet (2)

| Komponente | Pfad | Beschreibung |
|------------|------|-------------|
| `ModuleMarketplace` | `components/marketplace/ModuleMarketplace.jsx` | Modul-Browse (superseded by ModuleHubPage) |
| `NotificationHistory` | `components/notifications/NotificationHistory.jsx` | Notification-History |

### Sonderfall: BEHALTEN

| Komponente | Pfad | Grund |
|------------|------|-------|
| `ConfirmModal` | `components/ui/ConfirmModal.jsx` | `useConfirm()` Hook wird in 3 Files aktiv genutzt |

---

## 4. UNGENUTZTE HOOKS (6)

Alle in `hooks/useOptimizedQuery.js`:

| Hook/Funktion | Zeile | Beschreibung |
|---------------|-------|-------------|
| `useCachedQuery` | 16 | Cached Query Hook |
| `useOptimisticMutation` | 116 | Optimistic Mutation Hook |
| `useDebounce` | 169 | Debounce Hook |
| `useThrottle` | 186 | Throttle Hook |
| `invalidateCache` | 211 | Cache invalidieren |
| `prefetch` | 218 | Daten prefetchen |

> `useDocumentTitle` ist in 20 Page-Files genutzt — BEHALTEN.

---

## 5. BUG GEFUNDEN

### TodayDashboard.jsx — Zeile 93: Undefinierte Variable

```javascript
// BUG: Verwendet `tasks` statt `allTasks`
setCompletedToday(tasks.filter(t => t.completed).length);
// ↑ `tasks` ist undefined — sollte `allTasks` sein (definiert in Zeile 90)
```

**Impact:** `completedToday` wird nie korrekt gesetzt — der Wert bleibt bei 0 oder wirft einen stillen Fehler.

**Fix:**
```javascript
setCompletedToday(allTasks.filter(t => t.completed).length);
```

---

## 6. EMPFEHLUNGEN

### Sofort löschen (kein Risiko)
- 12 Dead-Code-Komponenten (Kategorie A)
- `hooks/useOptimizedQuery.js` (ganzes File)
- `ProductEvolutionMockup.jsx`

### Review vor Löschung (geplante Features?)
- `ProgressDashboard`, `BloodCheckPanel`, `NotificationSettings` (Lazy-loaded)
- `ModuleMarketplace` (superseded by ModuleHubPage)
- `lib/analytics.js` (PostHog-Integration geplant?)
- `lib/notificationService.js` (Push-Notifications geplant?)
- `lib/bloodCheckService.js` (Lab-Results Feature geplant?)
- `lib/googleCalendar.js` (Calendar-Integration geplant?)

### Behalten (Feature-Freeze, aber strategisch wertvoll)
- `lib/circadianService.js` — Horizon 2 Feature
- `lib/inventoryService.js` — Supplement Fulfillment (Horizon 2)
- `lib/predictiveService.js` — AI-gestützte Vorhersagen
- `lib/optimizationEngine.js` — Task-Optimierung
- `lib/recoveryService.js` — Wearable-Integration

### Bug fixen
- `TodayDashboard.jsx` Zeile 93: `tasks` → `allTasks`

---

*Generiert am 2026-02-07 | Scope: src/ komplett | Methode: Export-Scan + Codebase-weite Import-Suche*
