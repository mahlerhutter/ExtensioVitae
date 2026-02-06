import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { useMode } from '../contexts/ModeContext';
import { useCalendar } from '../contexts/CalendarContext';
import { generatePlan, getPlanGeneratorInfo } from '../lib/planGenerator';
import { calculateLongevityScore } from '../lib/longevityScore';
import {
  getIntake,
  getPlan,
  savePlan,
  getProgress,
  updateProgress,
  getStorageInfo,
  saveIntake,
  getArchivedPlans,
  activateProtocol,
  getActiveProtocols,
  updateProtocolTaskStatus,
  deactivateProtocol,
  shouldUseSupabase
} from '../lib/dataService';

// Dashboard Components
import InteractiveLoading from '../components/dashboard/InteractiveLoading';
import LongevityScoreWidget from '../components/dashboard/LongevityScoreWidget';
import PillarsExplanationBox from '../components/dashboard/PillarsExplanationBox';
import PillarsExplanationModal from '../components/dashboard/PillarsExplanationModal';
import DashboardHeaderV2 from '../components/dashboard/DashboardHeaderV2';
import UserProfileSection from '../components/dashboard/UserProfileSection';
import PlanSummary from '../components/dashboard/PlanSummary';
import MonthOverview from '../components/dashboard/MonthOverview';
import TodayCard from '../components/dashboard/TodayCard';
import EditProfileModal from '../components/dashboard/EditProfileModal';
import FullPlanModal from '../components/dashboard/FullPlanModal';
import PlanHistoryModal from '../components/dashboard/PlanHistoryModal';

// Feedback Components
import InitialFeedbackModal from '../components/feedback/InitialFeedbackModal';
import FloatingFeedbackButton from '../components/feedback/FloatingFeedbackButton';
import GeneralFeedbackPanel from '../components/feedback/GeneralFeedbackPanel';
import { submitFeedback, checkIfFeedbackGiven } from '../lib/feedbackService';
import CommitmentModal from '../components/CommitmentModal';
import WhatsAppButton from '../components/WhatsAppButton';

// Analytics
import { trackTaskCompleted, trackDayCompleted, trackFeatureUsed } from '../lib/analytics';
import { logger } from '../lib/logger';
import { generateICS, downloadICS } from '../utils/icsGenerator';
import { checkAdminStatus } from '../lib/adminService';

// Emergency Mode Components
import ModeSelector from '../components/ModeSelector';

// Calendar Components
import CalendarConnect from '../components/calendar/CalendarConnect';
import ModeIndicator from '../components/ModeIndicator';

// Modular Tracking System (Phase 1 & 2)
import { DailyView, ModuleHub, ModuleActivationFlow } from '../components/modules';
import { getUserModules } from '../lib/moduleService';

// New Unified Dashboard (Phase 4)
import TodayDashboard from '../components/dashboard/TodayDashboard';

import ProtocolLibrary from '../components/dashboard/ProtocolLibrary';
import { PROTOCOL_PACKS } from '../lib/protocolPacks';
import CircadianWidget from '../components/dashboard/CircadianWidget';
import CircadianCard from '../components/dashboard/CircadianCard';
import SupplementTimingWidget from '../components/dashboard/SupplementTimingWidget';
import { useConfirm } from '../components/ui/ConfirmModal';
import ConciergeCard from '../components/dashboard/ConciergeCard';
import { getPredictiveIntelligence } from '../lib/predictiveService';
import BiologicalSuppliesWidget from '../components/dashboard/BiologicalSuppliesWidget';

// UX Week 1 Components (v0.5.0)
import StreakCounter from '../components/dashboard/StreakCounter';
import DailyInsight from '../components/dashboard/DailyInsight';
import NextBestAction from '../components/dashboard/NextBestAction';
import TrendChart from '../components/progress/TrendChart';
import MorningCheckIn from '../components/dashboard/MorningCheckIn';
import OnboardingTour from '../components/dashboard/OnboardingTour';

// Beta-Tester Nutzen Components (v0.7.0)
import WelcomeHeroCard from '../components/dashboard/WelcomeHeroCard';
import ImpactCounter from '../components/dashboard/ImpactCounter';
import ScienceCredibilityBar from '../components/dashboard/ScienceCredibilityBar';
import AdaptationNotice from '../components/dashboard/AdaptationNotice';
import EmptyState, { EMPTY_STATE_TYPES } from '../components/dashboard/EmptyState';

// Pillar configuration
const PILLARS = {
  sleep: { label: 'Sleep', color: 'bg-indigo-500', textColor: 'text-indigo-400' },
  movement: { label: 'Movement', color: 'bg-emerald-500', textColor: 'text-emerald-400' },
  nutrition: { label: 'Nutrition', color: 'bg-orange-500', textColor: 'text-orange-400' },
  stress: { label: 'Calm', color: 'bg-violet-500', textColor: 'text-violet-400' },
  connection: { label: 'Connection', color: 'bg-pink-500', textColor: 'text-pink-400' },
  environment: { label: 'Environment', color: 'bg-teal-500', textColor: 'text-teal-400' },
  // Additional mappings for planBuilder output
  circadian: { label: 'Circadian', color: 'bg-amber-500', textColor: 'text-amber-400' },
  mental: { label: 'Mental', color: 'bg-purple-500', textColor: 'text-purple-400' },
  supplements: { label: 'Supplements', color: 'bg-cyan-500', textColor: 'text-cyan-400' },
};

// Mock data for demonstration
const MOCK_PLAN = {
  user_name: 'Sarah',
  plan_summary: 'Your 30-day plan focuses on rebuilding energy through better sleep architecture and nervous system regulation. Given your time constraints, every task is designed for maximum impact in minimal time.',
  primary_focus_pillars: ['sleep', 'stress', 'movement'],
  start_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  days: Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    theme: i === 0 ? 'Foundation Day' : `Day ${i + 1}`,
    tasks: [
      { id: `d${i + 1}_t1`, pillar: 'stress', task: '4-7-8 breathing before first call', time_minutes: 2, when: 'morning' },
      { id: `d${i + 1}_t2`, pillar: 'nutrition', task: '16oz water with lemon upon waking', time_minutes: 1, when: 'morning' },
      { id: `d${i + 1}_t3`, pillar: 'movement', task: '15-min walk meeting or solo walk', time_minutes: 15, when: 'midday' },
      { id: `d${i + 1}_t4`, pillar: 'environment', task: 'Blue light glasses on by 7pm', time_minutes: 1, when: 'evening' },
      { id: `d${i + 1}_t5`, pillar: 'connection', task: 'Gratitude note to one person', time_minutes: 5, when: 'anytime' },
    ],
    total_time_minutes: 24,
  })),
};

const MOCK_PROGRESS = {
  1: { d1_t1: true, d1_t2: true, d1_t3: true, d1_t4: true, d1_t5: true },
  2: { d2_t1: true, d2_t2: true, d2_t3: true, d2_t4: true, d2_t5: true },
  3: { d3_t1: true, d3_t2: true, d3_t3: true, d3_t4: false, d3_t5: true },
  4: { d4_t1: true, d4_t2: true, d4_t3: true, d4_t4: true, d4_t5: true },
  5: { d5_t1: true, d5_t2: true, d5_t3: false, d5_t4: true, d5_t5: true },
  6: { d6_t1: true, d6_t2: true, d6_t3: true, d6_t4: true, d6_t5: true },
  7: { d7_t1: false, d7_t2: true, d7_t3: true, d7_t4: true, d7_t5: true },
};


// Helper to calculate day number in plan
function calculatePlanDay(startDate) {
  const start = new Date(startDate);
  const today = new Date();
  // Reset time to midnight for accurate day calculation
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffTime = today - start;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 because day 1 is start day
  return Math.max(1, Math.min(30, diffDays)); // Clamp between 1 and 30
}

import { useDocumentTitle } from '../hooks/useDocumentTitle';

// Main Dashboard Page
export default function DashboardPage() {
  useDocumentTitle('Your Dashboard - ExtensioVitae');
  const [plan, setPlan] = useState(null);
  const [progress, setProgress] = useState({});
  const [currentDay, setCurrentDay] = useState(7);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  const [showFullPlanModal, setShowFullPlanModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false); // New state for history modal
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [intakeData, setIntakeData] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showArchived, setShowArchived] = useState(false); // New state for accordion
  const [archivedPlans, setArchivedPlans] = useState([]);
  const [loadingArchivedPlan, setLoadingArchivedPlan] = useState(false); // Loading state for archived plans
  const [userEmail, setUserEmail] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false); // Admin status
  const { addToast } = useToast();

  // Feedback states
  const [showInitialFeedback, setShowInitialFeedback] = useState(false);
  const [showFeedbackPanel, setShowFeedbackPanel] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Commitment Contract State
  const [showCommitmentModal, setShowCommitmentModal] = useState(false);

  // Module Management State
  const [showModuleHub, setShowModuleHub] = useState(false);
  const [showModuleActivation, setShowModuleActivation] = useState(false);
  const [hasActiveModules, setHasActiveModules] = useState(null); // null = loading, true/false = checked

  // Morning Check-in State (v0.5.1)
  const [showMorningCheckIn, setShowMorningCheckIn] = useState(false);

  // Protocol Pack State (v0.4.0) - Now persistent via DB
  const [activePack, setActivePack] = useState(null);
  const [activePackDbId, setActivePackDbId] = useState(null); // Track DB record ID
  const { showConfirm, ConfirmDialog } = useConfirm();

  // Onboarding Milestones State (v0.7.0)
  const [onboardingMilestones, setOnboardingMilestones] = useState({
    firstTask: false,
    morningCheckIn: false,
    threeDayStreak: false,
    moduleActivated: false,
    weekComplete: false
  });

  const navigate = useNavigate();
  const { planId, day } = useParams(); // Get URL parameters


  // Get auth state from context
  const { user, signOut: authSignOut } = useAuth();

  // Get emergency mode from ModeContext (v0.5.0)
  const { currentMode: activeMode } = useMode();

  // Get calendar events from CalendarContext (v0.5.0)
  const { todayEvents } = useCalendar();

  // Predictive Intelligence State (v0.7.0)
  const [predictions, setPredictions] = useState([]);
  const [loadingPredictions, setLoadingPredictions] = useState(false);

  // Stats for NextBestAction (v0.5.2)
  const [dashboardStats, setDashboardStats] = useState({
    morningCheckIn: false,
    incompleteTasks: 0,
    hasLabResults: false
  });

  // Fetch Dashboard Stats
  useEffect(() => {
    async function fetchStats() {
      if (!user?.id) return;

      try {
        const today = new Date().toISOString().split('T')[0];

        // 1. Check Morning Check-In
        const { count: checkInCount } = await supabase
          .from('recovery_scores')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('check_in_date', today);

        // 2. Check Lab Results
        const { count: labCount } = await supabase
          .from('lab_results')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);

        setDashboardStats(prev => ({
          ...prev,
          morningCheckIn: (checkInCount || 0) > 0,
          hasLabResults: (labCount || 0) > 0
        }));

      } catch (error) {
        logger.error('[Dashboard] Failed to fetch stats:', error);
      }
    }

    fetchStats();
  }, [user?.id, showMorningCheckIn]); // Re-fetch when check-in modal closes/opens logic changes

  // Track Onboarding Milestones (v0.7.0)
  useEffect(() => {
    if (!progress || !plan) return;

    // Milestone 1: First Task completed
    const hasCompletedTask = Object.values(progress).some(dayProgress =>
      Object.values(dayProgress || {}).some(Boolean)
    );
    if (hasCompletedTask && !onboardingMilestones.firstTask) {
      setOnboardingMilestones(prev => ({ ...prev, firstTask: true }));
    }

    // Milestone 2: Morning Check-in (from dashboardStats)
    if (dashboardStats?.morningCheckIn && !onboardingMilestones.morningCheckIn) {
      setOnboardingMilestones(prev => ({ ...prev, morningCheckIn: true }));
    }

    // Milestone 3: 3-Day Streak
    const completedDaysCount = Object.keys(progress).filter(day => {
      const dayProgress = progress[day];
      const completedTasksInDay = Object.values(dayProgress || {}).filter(Boolean).length;
      return completedTasksInDay > 0;
    }).length;

    if (completedDaysCount >= 3 && !onboardingMilestones.threeDayStreak) {
      setOnboardingMilestones(prev => ({ ...prev, threeDayStreak: true }));
    }

    // Milestone 4: Module activated (if hasActiveModules is true)
    if (hasActiveModules && !onboardingMilestones.moduleActivated) {
      setOnboardingMilestones(prev => ({ ...prev, moduleActivated: true }));
    }

    // Milestone 5: Week Complete
    if (completedDaysCount >= 7 && !onboardingMilestones.weekComplete) {
      setOnboardingMilestones(prev => ({ ...prev, weekComplete: true }));
    }
  }, [progress, plan, dashboardStats, hasActiveModules]);

  // Update incomplete tasks based on plan progress
  useEffect(() => {
    if (!plan || !progress || !currentDay) return;

    const dayData = plan.days[currentDay - 1];
    if (!dayData?.tasks) return;

    const totalTasks = dayData.tasks.length;
    const completedTasks = Object.values(progress[currentDay] || {}).filter(Boolean).length;

    setDashboardStats(prev => ({
      ...prev,
      incompleteTasks: Math.max(0, totalTasks - completedTasks)
    }));
  }, [plan, progress, currentDay]);

  useEffect(() => {
    // Load or generate plan using DataService
    const loadPlan = async () => {
      // Only show full loading screen if we don't have data yet
      if (!plan) setLoading(true);

      try {
        // Log storage info for debugging
        const storageInfo = await getStorageInfo();
        logger.debug('[Dashboard] Storage mode:', storageInfo);

        if (user) {
          setUserEmail(user.email);

          // Check if user is admin via server-side Edge Function
          try {
            if (supabase) {
              const { data: { session } } = await supabase.auth.getSession();
              if (session) {
                const isAdminUser = await checkAdminStatus(session);
                setIsAdmin(isAdminUser);
              }
            }
          } catch (error) {
            logger.warn('[Dashboard] Failed to check admin status:', error);
            setIsAdmin(false);
          }
        }


        // Get intake data from Supabase or localStorage
        let intakeData = await getIntake();
        logger.debug('[Dashboard] Intake data loaded:', intakeData ? 'YES' : 'NO');
        const isSupabaseAuth = await shouldUseSupabase();
        logger.debug('[Dashboard] Supabase auth:', isSupabaseAuth ? 'YES' : 'NO');

        // Load user profile to get email and phone if authenticated
        if (isSupabaseAuth && user) {
          try {
            const { getUserProfile } = await import('../lib/profileService');
            const userProfile = await getUserProfile(user.id);
            if (userProfile && intakeData) {
              // Merge email and phone from user profile into intake data
              intakeData = {
                ...intakeData,
                email: userProfile.email || intakeData.email || user.email,
                phone_number: userProfile.phone_number || intakeData.phone_number
              };
              logger.debug('[Dashboard] Merged user profile data (email, phone)');
            }
          } catch (err) {
            logger.warn('[Dashboard] Could not load user profile:', err);
          }
        }

        // Try to get existing plan first
        let existingPlan;

        // If planId is provided in URL, load that specific plan
        if (planId && isSupabaseAuth) {
          logger.debug('[Dashboard] Loading specific plan from URL:', planId);
          try {
            const { data, error } = await supabase
              .from('plans')
              .select('*')
              .eq('id', planId)
              .single();

            if (error) {
              logger.error('[Dashboard] Error loading plan from URL:', error);
              // Fall back to default plan loading
              existingPlan = await getPlan();
            } else {
              logger.debug('[Dashboard] Loaded plan from URL:', data.id);
              existingPlan = data;

              // Extract intake data from plan if available
              if (data.meta?.input) {
                intakeData = data.meta.input;
                setIntakeData(intakeData);
              }
            }
          } catch (err) {
            logger.error('[Dashboard] Error loading plan from URL:', err);
            existingPlan = await getPlan();
          }
        } else {
          // Normal flow: load current active plan
          existingPlan = await getPlan();
        }

        if (existingPlan) {
          logger.debug('[Dashboard] Existing plan loaded:', existingPlan?.supabase_plan_id || 'no-id');
        }

        // If authenticated but no intake data AND no existing plan, force intake
        if (isSupabaseAuth && !intakeData && !existingPlan) {
          logger.info('[Dashboard] Authenticated user missing intake data and plan. Redirecting to intake.');
          navigate('/intake');
          return;
        }

        // If we have a plan but no intake, extract intake from plan metadata
        if (!intakeData && existingPlan && existingPlan.meta?.input) {
          logger.info('[Dashboard] No intake data, but found plan with metadata. Using plan metadata as intake.');
          intakeData = existingPlan.meta.input;
          setIntakeData(intakeData);
        }

        // Sync intake to Supabase if logged in
        if (intakeData && isSupabaseAuth) {
          logger.debug('[Dashboard] Syncing intake to Supabase...');
          await saveIntake(intakeData);
        }

        if (intakeData) {
          setIntakeData(intakeData);

          // Sync local plan to Supabase if logged in and not yet synced
          if (existingPlan && !existingPlan.supabase_plan_id && await shouldUseSupabase()) {
            logger.info('[Dashboard] Syncing anonymous plan to Supabase account...');
            // This will attach the new supabase_plan_id and return the updated plan
            existingPlan = await savePlan(existingPlan);
          }

          // Use existing plan if found (DO NOT auto-regenerate based on intake timestamp)
          if (existingPlan) {
            logger.debug('[Dashboard] Using active plan:', existingPlan.supabase_plan_id || 'local-only');
          } else {
            // Generate new plan ONLY if no plan exists at all
            logger.info('[Dashboard] No active plan found. Generating new plan...');
            const generatorInfo = getPlanGeneratorInfo();
            logger.debug('[Dashboard] Plan generator config:', generatorInfo);

            existingPlan = await generatePlan(intakeData);

            logger.info(`[Dashboard] Plan generated via: ${existingPlan.generation_method}`);
            if (existingPlan.llm_provider) {
              logger.info(`[Dashboard] LLM provider: ${existingPlan.llm_provider}`);
            }

            // Save to Supabase/localStorage
            existingPlan = await savePlan(existingPlan);
          }

          setPlan(existingPlan);

          // Calculate current day based on plan start date
          const planDay = calculatePlanDay(existingPlan.start_date);

          // Load progress
          if (existingPlan.supabase_plan_id) {
            const prog = await getProgress(existingPlan.supabase_plan_id);
            setProgress(prog);
          } else {
            const prog = await getProgress();
            setProgress(prog);
          }

          // Calculate Day
          if (existingPlan.start_date) {
            const now = new Date();
            const start = new Date(existingPlan.start_date);
            const diffTime = Math.abs(now - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            // 1-indexed day. If start date is today, day is 1.
            // If start date was yesterday, diff is 1 day, so day should be 2?
            // Let's rely on simple diff for now.
            const dayNum = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
            setCurrentDay(dayNum > 0 ? dayNum : 1);
          } else {
            setCurrentDay(1);
          }

          // Load History
          try {
            const historyPlans = await getArchivedPlans();
            setArchivedPlans(historyPlans);
          } catch (e) {
            console.error("Failed to load history on init", e);
          }

          // Check if initial feedback should be shown
          const dismissedKey = `feedback_dismissed_${existingPlan.supabase_plan_id}`;
          const isDismissed = localStorage.getItem(dismissedKey) === 'true';

          if (existingPlan.supabase_plan_id && await shouldUseSupabase() && !isDismissed) {
            try {
              const feedbackGiven = await checkIfFeedbackGiven(existingPlan.supabase_plan_id, 'initial');
              if (!feedbackGiven && !feedbackSubmitted) {
                // Show feedback modal after 3 seconds
                setTimeout(() => {
                  setShowInitialFeedback(true);
                }, 3000);
              }
            } catch (e) {
              logger.warn('[Dashboard] Failed to check feedback status:', e);
            }
          }

        } else {
          logger.info('[Dashboard] No intake data, using mock plan');
          setPlan(MOCK_PLAN);
          setArchivedPlans([{
            supabase_plan_id: 'mock-archived-1',
            created_at: '2025-12-01T10:00:00Z',
            updated_at: '2026-01-01T10:00:00Z',
            plan_summary: 'Previous plan focused on Sleep and Nutrition.',
            start_date: '2025-12-01'
          }]);
          setProgress(MOCK_PROGRESS);
        }
      } catch (err) {
        logger.error('[Dashboard] Error loading/generating plan:', err);
        setPlan(MOCK_PLAN);
        setProgress(MOCK_PROGRESS);
      } finally {
        setLoading(false);
      }
    };

    loadPlan();

    // Check commitment contract
    const hasSigned = localStorage.getItem('has_signed_contract');
    if (!hasSigned) {
      // Small delay to let loading finish first if needed, or strictly blocking
      // If we want it to be blocking immediately, we can set it true
      // But let's wait until plan is loaded so we don't block empty state?
      // Actually, if we are on dashboard, we should block.
      // Let's set it after a tick to avoid hydration mismatch if using SSR (though this is SPA)
      setTimeout(() => setShowCommitmentModal(true), 1000);
    }
  }, [user, navigate, planId]); // Re-run when user changes (login/logout) or planId changes

  // Load active protocol packs from DB
  useEffect(() => {
    async function loadActiveProtocols() {
      if (!user?.id) return;

      try {
        const protocols = await getActiveProtocols();
        if (protocols.length > 0) {
          // Load the first active protocol
          const activeProtocol = protocols[0];
          // Map DB record back to PROTOCOL_PACKS format
          const packData = PROTOCOL_PACKS.find(p => p.id === activeProtocol.protocol_id);
          if (packData) {
            setActivePack({
              ...packData,
              // Merge with DB data (task completion status)
              task_completion_status: activeProtocol.task_completion_status || {}
            });
            setActivePackDbId(activeProtocol.id);
            logger.info('[Dashboard] Active protocol loaded from DB:', activeProtocol.protocol_name);
          }
        }
      } catch (error) {
        logger.error('[Dashboard] Failed to load active protocols:', error);
      }
    }

    if (!loading) {
      loadActiveProtocols();
    }
  }, [user?.id, loading]);

  // Check if user has active modules (for new user onboarding)
  useEffect(() => {
    async function checkModules() {
      if (!user?.id) {
        setHasActiveModules(false);
        return;
      }

      try {
        const modules = await getUserModules(user.id);
        const activeCount = modules?.filter(m => m.status === 'active' || m.status === 'paused').length || 0;
        setHasActiveModules(activeCount > 0);

        // Show activation flow for users without modules (after plan is loaded)
        if (activeCount === 0 && !localStorage.getItem('module_onboarding_dismissed')) {
          // Delay to let other modals (commitment) appear first
          setTimeout(() => {
            setShowModuleActivation(true);
          }, 2000);
        }
      } catch (err) {
        logger.warn('[Dashboard] Failed to check module status:', err);
        setHasActiveModules(false);
      }
    }

    if (!loading && user?.id) {
      checkModules();
    }
  }, [loading, user?.id]);

  // Set selected day from URL parameter when plan is loaded
  useEffect(() => {
    if (day && plan && !loading) {
      const dayNum = parseInt(day, 10);
      if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 30) {
        logger.debug('[Dashboard] Setting selected day from URL:', dayNum);
        setSelectedDay(dayNum);
      } else {
        logger.warn('[Dashboard] Invalid day parameter in URL:', day);
      }
    }
  }, [day, plan, loading]);

  // HACK 5: Zen Auto-Scroll - Focus on current time block
  useEffect(() => {
    if (!loading && plan) {
      setTimeout(() => {
        const hour = new Date().getHours();
        let blockId = 'today-card'; // Default to today card

        // Determine time block
        if (hour >= 5 && hour < 11) {
          blockId = 'morning-block';
        } else if (hour >= 11 && hour < 21) {
          blockId = 'day-block';
        } else {
          blockId = 'evening-block';
        }

        const element = document.getElementById(blockId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300); // Wait for layout to stabilize
    }
  }, [loading, plan]);

  // Predictive Intelligence Scanning (v0.7.0)
  useEffect(() => {
    async function scanForPredictions() {
      if (!user?.id || !todayEvents || todayEvents.length === 0) {
        return;
      }
      setLoadingPredictions(true);
      try {
        const intel = await getPredictiveIntelligence(todayEvents, user.id);
        if (intel.hasPredictions) {
          setPredictions(intel.predictions);
          logger.info('[Dashboard] Predictions loaded:', intel.predictions.length);
        }
      } catch (error) {
        logger.error('[Dashboard] Failed to scan predictions:', error);
      } finally {
        setLoadingPredictions(false);
      }
    }
    // Scan on mount and when events change
    scanForPredictions();
    // Refresh every 30 minutes
    const interval = setInterval(scanForPredictions, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.id, todayEvents]);

  const handleTaskToggle = async (day, taskId) => {
    const dayData = plan.days[day - 1];
    const totalTasks = dayData?.tasks?.length || 0;
    const task = dayData?.tasks?.find(t => t.id === taskId);

    setProgress((prev) => {
      const dayProgress = prev[day] || {};
      const newStatus = !dayProgress[taskId];

      const newProgress = {
        ...prev,
        [day]: {
          ...dayProgress,
          [taskId]: newStatus,
        },
      };

      // Save to Supabase/localStorage in background
      updateProgress(day, taskId, newStatus, totalTasks, plan.supabase_plan_id);

      // Track task completion in analytics
      if (newStatus && task) {
        trackTaskCompleted({ id: taskId, pillar: task.pillar, day });

        // Check if day is completed
        const completedTasks = Object.values(newProgress[day] || {}).filter(Boolean).length;
        if (completedTasks === totalTasks) {
          trackDayCompleted(day, completedTasks, totalTasks);
        }
      }

      return newProgress;
    });
  };

  const handleDayClick = (day) => {
    if (day <= currentDay) {
      setSelectedDay(day);

      // Update URL with day parameter for shareable deep links
      if (plan?.supabase_plan_id) {
        navigate(`/d/${plan.supabase_plan_id}/${day}`, { replace: true });
      } else {
        // For local plans without supabase_plan_id, just update the day in state
        logger.debug('[Dashboard] Local plan, not updating URL');
      }
    }
  };

  // Helper function to handle day selection with URL update
  const handleSelectDay = (day) => {
    setSelectedDay(day);

    if (plan?.supabase_plan_id) {
      if (day === null) {
        // Clear day from URL, keep planId
        navigate(`/d/${plan.supabase_plan_id}`, { replace: true });
      } else {
        // Update URL with day parameter
        navigate(`/d/${plan.supabase_plan_id}/${day}`, { replace: true });
      }
    }
  };

  // Protocol Pack Activation (v0.4.0) - Now with persistent DB sync
  const handleActivatePack = async (pack) => {
    // If clicking the already active pack, ask to deactivate
    if (activePack?.id === pack.id) {
      const confirmed = await showConfirm({
        title: 'Protokoll beenden?',
        message: `${pack.title} wird deaktiviert. Dein normaler Plan bleibt erhalten.`,
        confirmText: 'Beenden',
        cancelText: 'Weiterlaufen lassen',
        confirmVariant: 'danger',
        icon: '⏹️'
      });

      if (confirmed) {
        // Deactivate in DB
        try {
          if (activePackDbId) {
            await deactivateProtocol(activePackDbId, 'User deactivated');
            logger.info('[Dashboard] Protocol deactivated in DB');
          }
          setActivePack(null);
          setActivePackDbId(null);
          addToast(`${pack.title} deaktiviert.`, 'info');
        } catch (error) {
          logger.error('[Dashboard] Failed to deactivate protocol:', error);
          addToast('Fehler beim Deaktivieren', 'error');
        }
      }
      return;
    }

    // New activation
    const confirmed = await showConfirm({
      title: `${pack.title} aktivieren?`,
      message: `${pack.description}\n\nDieses Protokoll hat Vorrang vor deinem täglichen Plan für die nächsten ${pack.duration_hours} Stunden.`,
      confirmText: 'Jetzt Aktivieren',
      cancelText: 'Abbrechen',
      confirmVariant: 'primary',
      icon: pack.icon
    });

    if (confirmed) {
      try {
        // Deactivate any existing protocol first
        if (activePackDbId) {
          await deactivateProtocol(activePackDbId, 'Replaced by new protocol');
        }

        // Activate in DB
        const dbRecord = await activateProtocol(pack);
        setActivePackDbId(dbRecord.id);
        setActivePack({
          ...pack,
          task_completion_status: {}
        });

        addToast(`${pack.title} ist jetzt aktiv!`, 'success');
        trackFeatureUsed('protocol_pack_activated', { pack_id: pack.id });

        logger.info('[Dashboard] Protocol activated in DB:', dbRecord.id);

        // Smooth scroll to top to see active pack
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (error) {
        logger.error('[Dashboard] Failed to activate protocol:', error);
        addToast('Fehler beim Aktivieren', 'error');
      }
    }
  };

  const handleProtocolTaskToggle = async (taskId, completed) => {
    if (!activePackDbId) return;

    try {
      const updatedProtocol = await updateProtocolTaskStatus(activePackDbId, taskId, completed);
      setActivePack(prev => ({
        ...prev,
        task_completion_status: updatedProtocol.task_completion_status,
        tasks_completed: updatedProtocol.tasks_completed
      }));

      if (completed) {
        addToast('Aufgabe erledigt!', 'success');
      }
    } catch (error) {
      logger.error('[Dashboard] Failed to update protocol task:', error);
      addToast('Fehler beim Speichern', 'error');
    }
  };

  // Predictive Intelligence Handlers (v0.7.0)
  const handleActivatePrediction = (prediction, result) => {
    // Remove prediction from list
    setPredictions(prev => prev.filter(p => p.id !== prediction.id));

    // Show success toast (Family Office Briefing)
    addToast(result.message, 'success', { duration: 8000 });

    // Update activePack state
    setActivePack(result.protocol);

    // Track analytics
    trackFeatureUsed('predictive_protocol_activated', {
      type: prediction.type,
      protocol: result.protocol.id
    });
  };

  const handleDismissPrediction = (prediction) => {
    setPredictions(prev => prev.filter(p => p.id !== prediction.id));
    addToast('Vorhersage verworfen', 'info');
  };

  const handleSignOut = async () => {
    await authSignOut();
    // Clear local data is handled by authSignOut
    navigate('/');
  };

  const handleUpdateProfile = async (updatedData) => {
    try {
      // 1. Update intake (and sync to Supabase if valid)
      const newData = { ...intakeData, ...updatedData };
      await saveIntake(newData);
      setIntakeData(newData);

      // 2. Update user profile (email, phone) if authenticated
      if (user) {
        try {
          const { upsertUserProfile } = await import('../lib/profileService');
          await upsertUserProfile(user.id, {
            name: updatedData.name,
            email: updatedData.email,
            phone_number: updatedData.phone_number,
            age: updatedData.age,
            height_cm: updatedData.height_cm,
            weight_kg: updatedData.weight_kg
          });
          logger.info('[Dashboard] User profile updated');
        } catch (err) {
          logger.warn('[Dashboard] Could not update user profile:', err);
        }
      }

      // 3. Update Plan User Name (if name changed)
      if (updatedData.name && plan) {
        const updatedPlan = { ...plan, user_name: updatedData.name };
        await savePlan(updatedPlan);
        setPlan(updatedPlan);
      }

      setShowEditModal(false);
    } catch (err) {
      logger.error("Failed to update profile", err);
      addToast("Fehler beim Speichern: " + err.message, 'error');
    }
  };

  // Helper: Calculate overall completion rate (v0.7.0)
  const calculateCompletionRate = () => {
    if (!progress || !plan?.days) return 0;

    let totalTasks = 0;
    let completedTasks = 0;

    plan.days.forEach((day, index) => {
      const dayNum = index + 1;
      const dayProgress = progress[dayNum] || {};
      const tasksInDay = day.tasks?.length || 0;
      const completedInDay = Object.values(dayProgress).filter(Boolean).length;

      totalTasks += tasksInDay;
      completedTasks += completedInDay;
    });

    return totalTasks > 0 ? completedTasks / totalTasks : 0;
  };

  if (loading) {
    return <InteractiveLoading message="Loading your plan" />;
  }

  // Safety check: if plan has no days, redirect to intake
  if (!plan || !plan.days || plan.days.length === 0) {
    logger.error('[Dashboard] Plan has no days data. Redirecting to intake.');
    navigate('/intake');
    return <InteractiveLoading message="Redirecting..." />;
  }

  const displayDay = selectedDay || currentDay;
  const dayData = plan.days[displayDay - 1];
  const dayProgress = progress[displayDay] || {};

  return (
    <div className="min-h-screen bg-slate-950">
      <DashboardHeaderV2
        userName={plan.user_name}
        onSignOut={handleSignOut}
        onProfileClick={() => setShowEditModal(true)}
        isAdmin={isAdmin}
      />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Top Status Bar: Mode + Streak + Longevity Score */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <ModeIndicator showDuration={true} size="md" />
            {user?.id && <StreakCounter userId={user.id} />}
          </div>
          <div className="sm:ml-auto">
            <LongevityScoreWidget intakeData={intakeData} userName={intakeData?.name} compact={true} variant="inline" />
          </div>
        </div>

        {/* HERO SECTION: Day 1-7 Onboarding OR Impact Counter */}
        {(currentDay <= 7 || Object.values(onboardingMilestones).filter(Boolean).length < 5) ? (
          <WelcomeHeroCard
            userName={plan?.user_name || 'dort'}
            milestones={onboardingMilestones}
            onQuickWinClick={() => {
              const todayDashboard = document.querySelector('[data-tour="daily-progress"]');
              if (todayDashboard) {
                todayDashboard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                todayDashboard.classList.add('ring-4', 'ring-amber-400', 'ring-opacity-50');
                setTimeout(() => {
                  todayDashboard.classList.remove('ring-4', 'ring-amber-400', 'ring-opacity-50');
                }, 2000);
              } else {
                window.scrollTo({ top: 400, behavior: 'smooth' });
              }
            }}
          />
        ) : (
          <div className="mb-8">
            <ImpactCounter
              yearsAdded={null}
              biologicalAge={plan?.biological_age || intakeData?.biological_age}
              chronologicalAge={intakeData?.age}
              completionRate={calculateCompletionRate()}
            />
          </div>
        )}

        {/* PRIMARY ACTION ZONE */}
        <div className="mb-8 space-y-4">
          <DailyInsight />
          <NextBestAction
            user={user}
            todayStats={{
              morningCheckIn: dashboardStats.morningCheckIn,
              incompleteTasks: dashboardStats.incompleteTasks,
              hasLabResults: dashboardStats.hasLabResults,
              hasCalendarConnected: !!todayEvents?.length
            }}
            onMorningCheckInClick={() => setShowMorningCheckIn(true)}
          />
        </div>

        {/* Concierge Card - Priority Inbox (above today dashboard) */}
        {predictions.length > 0 && (
          <div className="mb-6">
            <ConciergeCard
              predictions={predictions}
              userId={user?.id}
              onActivate={handleActivatePrediction}
              onDismiss={handleDismissPrediction}
            />
          </div>
        )}

        {selectedDay && selectedDay !== currentDay && (
          <button
            onClick={() => handleSelectDay(null)}
            className="mb-4 text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
          >
            ← Back to today
          </button>
        )}

        {/* MAIN DASHBOARD GRID */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Column - Today Dashboard (wider) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today Dashboard - Core Functionality */}
            <div data-tour="daily-progress">
              <TodayDashboard
                userId={user?.id}
                language="de"
                onShowModuleHub={() => setShowModuleHub(true)}
                hasPlan={!!(plan?.supabase_plan_id || plan?.days?.length > 0)}
                plan={plan}
                planProgress={progress}
                currentPlanDay={currentDay}
                onTaskToggle={handleTaskToggle}
                activePack={activePack}
                onProtocolTaskToggle={handleProtocolTaskToggle}
                activeMode={activeMode || 'normal'}
                calendarEvents={todayEvents || []}
              />
            </div>

            {/* Recovery Adaptation Notice - Conditional (when recovery < 70) */}
            {dashboardStats.recoveryScore !== null && dashboardStats.recoveryScore < 70 && (
              <AdaptationNotice
                recoveryScore={dashboardStats.recoveryScore}
                adaptations={[
                  {
                    from: 'HIIT Workout 30 Min',
                    to: 'Yoga Nidra 20 Min',
                    reason: 'Dein Körper braucht heute mehr Recovery. HRV-Daten zeigen erhöhten Stress.'
                  },
                  {
                    from: '6 Tasks geplant',
                    to: '3 Essential Tasks',
                    reason: 'Reduzierte Belastung für bessere Regeneration.'
                  }
                ]}
                hrv={dashboardStats.hrv}
                hrvBaseline={dashboardStats.hrvBaseline}
              />
            )}

            {/* Month Overview - Calendar View */}
            <MonthOverview
              plan={plan}
              progress={progress}
              currentDay={currentDay}
              onDayClick={handleDayClick}
              startDate={plan.start_date}
              userId={user?.id}
            />
          </div>

          {/* Sidebar - Compact & Focused */}
          <div className="space-y-6">
            {/* Science Credibility */}
            <ScienceCredibilityBar compact={true} />

            {/* Quick Actions - Consolidated */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <h3 className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-3">Quick Actions</h3>

              <button
                onClick={() => navigate('/intake')}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold rounded-lg transition-all text-sm flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Neuer Plan
              </button>

              <div className="space-y-2">
                <button
                  onClick={() => navigate('/modules')}
                  className="w-full py-2 bg-slate-800/70 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-all border border-slate-700/50 flex items-center gap-2 px-3"
                >
                  <span>📦</span>
                  <span>Module Hub</span>
                </button>

                <button
                  onClick={() => navigate('/recovery')}
                  className="w-full py-2 bg-slate-800/70 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-all border border-slate-700/50 flex items-center gap-2 px-3"
                >
                  <span>📊</span>
                  <span>Recovery</span>
                </button>
              </div>
            </div>

            {/* 7-Day Trend */}
            {user?.id && <TrendChart userId={user.id} />}

            {/* Mode Selector - Collapsible */}
            <ModeSelector variant="collapsible" />

            {/* Calendar Connect - Compact */}
            <CalendarConnect variant="compact" />
          </div>
        </div>

        {/* SECONDARY CONTENT - Below Fold */}
        <div className="mt-12 space-y-6">
          <PlanSummary
            plan={plan}
            onShowFullPlan={() => setShowFullPlanModal(true)}
            onShowHistory={async () => {
              setShowHistoryModal(true);
              setLoadingHistory(true);
              try {
                logger.debug('[Dashboard] Fetching history...');
                const history = await getArchivedPlans();
                logger.debug('[Dashboard] History fetched length:', history.length);
                setArchivedPlans(history);
              } catch (e) {
                logger.error("Failed to load history", e);
              } finally {
                setLoadingHistory(false);
              }
            }}
          />

          <PillarsExplanationBox needs={plan?.meta?.computed?.needs} />

          {/* Premium Widgets - Collapsible Section */}
          <details className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <summary className="px-6 py-4 cursor-pointer hover:bg-slate-800/50 transition-colors text-white font-semibold flex items-center justify-between">
              <span>🔬 Advanced Tracking</span>
              <span className="text-slate-400 text-sm">Expand</span>
            </summary>
            <div className="px-6 pb-6 space-y-4">
              <CircadianWidget />
              <CircadianCard userProfile={intakeData} />
              <BiologicalSuppliesWidget
                userId={user?.id}
                activeProtocols={activePack ? [{ protocol_id: activePack.id }] : []}
                onReorderComplete={() => {
                  addToast('Nachbestellung erfolgreich erstellt!', 'success');
                }}
              />
              <SupplementTimingWidget
                userId={user?.id}
                wakeTime={intakeData?.wake_time || '07:00'}
                activeProtocols={activePack ? [{ protocol_id: activePack.id }] : []}
              />
            </div>
          </details>

          {/* Export Actions */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-2">Export & Share</h3>
            <button
              onClick={() => {
                const icsContent = generateICS(plan);
                downloadICS(icsContent);
                addToast('📅 Kalender exportiert!', 'success');
                trackFeatureUsed('calendar_export');
              }}
              className="w-full py-2.5 bg-slate-800/70 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-all border border-slate-700/50 hover:border-slate-600 flex items-center gap-3 px-4"
            >
              <span className="text-lg">📅</span>
              <span>Kalender exportieren</span>
            </button>
            <WhatsAppButton />
          </div>
        </div>

        {/* History */}
        {archivedPlans.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
            >
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider text-slate-400">Vergangene Pläne</h3>
              <span className={`text-slate-400 transform transition-transform ${showArchived ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {showArchived && (
              <div className="px-5 pb-5 space-y-3 animate-fadeIn">
                {loadingArchivedPlan && (
                  <div className="p-6 flex flex-col items-center justify-center text-slate-400">
                    <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mb-3"></div>
                    <p className="text-sm">Plan wird geladen...</p>
                  </div>
                )}
                {archivedPlans.map(p => (
                  <div
                    key={p.supabase_plan_id}
                    onClick={async () => {
                      if (loadingArchivedPlan) return; // Prevent clicks during loading

                      try {
                        setLoadingArchivedPlan(true);
                        setPlan(p);
                        const archProgress = await getProgress(p.supabase_plan_id);
                        setProgress(archProgress);
                        if (p.start_date) {
                          setCurrentDay(calculatePlanDay(p.start_date));
                        } else {
                          setCurrentDay(1);
                        }
                        handleSelectDay(null);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      } catch (error) {
                        logger.error('Error loading archived plan:', error);
                      } finally {
                        setLoadingArchivedPlan(false);
                      }
                    }}
                    className={`p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg transition-colors cursor-pointer group ${loadingArchivedPlan
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-slate-700'
                      }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-slate-200 text-sm group-hover:text-amber-400 transition-colors">
                        {new Date(p.created_at).toLocaleDateString('de-DE')}
                        {p.updated_at && (
                          <span className="text-slate-500 font-normal text-xs ml-1">→ {new Date(p.updated_at).toLocaleDateString('de-DE')}</span>
                        )}
                      </span>
                      <span className="text-xs text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">Archiv</span>
                    </div>
                    <div className="text-xs text-slate-400 line-clamp-2">{p.plan_summary}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      <footer className="border-t border-slate-800 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-6 text-center text-slate-500 text-sm">
          Need help? <a href="mailto:hello@extensiovitae.com" className="text-amber-400 hover:text-amber-300">hello@extensiovitae.com</a>
        </div>
      </footer>

      <CommitmentModal
        isOpen={showCommitmentModal}
        onCommit={() => {
          setShowCommitmentModal(false);
          addToast('Protocol Initiated. Welcome.', 'success');
        }}
      />



      <FullPlanModal
        isOpen={showFullPlanModal}
        onClose={() => setShowFullPlanModal(false)}
        plan={plan}
        progress={progress}
      />

      {/* Plan History Modal */}
      <PlanHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        plans={archivedPlans}
        isLoading={loadingHistory}
        onLoadPlan={async (p) => {
          setPlan(p);
          // Load progress for this plan
          const archProgress = await getProgress(p.supabase_plan_id);
          setProgress(archProgress);
          if (p.start_date) {
            setCurrentDay(calculatePlanDay(p.start_date));
          } else {
            setCurrentDay(1);
          }

          // v0.4.0: Load Active Protocols
          try {
            const activeProtocols = await getActiveProtocols();
            if (activeProtocols && activeProtocols.length > 0) {
              const firstActive = activeProtocols[0];
              const packTemplate = PROTOCOL_PACKS.find(p => p.id === firstActive.protocol_id);

              if (packTemplate) {
                setActivePack({
                  ...packTemplate,
                  task_completion_status: firstActive.task_completion_status || {},
                  tasks_completed: firstActive.tasks_completed || 0
                });
                setActivePackDbId(firstActive.id);
              }
            }
          } catch (error) {
            logger.warn('[Dashboard] Failed to load protocols:', error);
          }
          handleSelectDay(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        initialData={intakeData}
        onSave={handleUpdateProfile}
      />

      {/* Feedback Components */}
      {
        showInitialFeedback && (
          <InitialFeedbackModal
            onSubmit={async (feedbackData) => {
              try {
                // Only include plan_id if it exists
                const feedback = {
                  ...feedbackData,
                  ...(plan?.supabase_plan_id && { plan_id: plan.supabase_plan_id }),
                };
                await submitFeedback(feedback);
                setShowInitialFeedback(false);
                setFeedbackSubmitted(true);
                addToast('Vielen Dank für dein Feedback! 🎉', 'success');
              } catch (error) {
                logger.error('[Dashboard] Failed to submit initial feedback:', error);
                addToast(`Fehler: ${error.message || 'Unbekannter Fehler'}`, 'error');
              }
            }}
            onSkip={() => {
              setShowInitialFeedback(false);
              setFeedbackSubmitted(true);
              if (plan?.supabase_plan_id) {
                localStorage.setItem(`feedback_dismissed_${plan.supabase_plan_id}`, 'true');
              }
            }}
          />
        )
      }

      {
        showFeedbackPanel && (
          <GeneralFeedbackPanel
            onClose={() => setShowFeedbackPanel(false)}
            onSubmit={async (feedbackData) => {
              try {
                await submitFeedback({
                  ...feedbackData,
                  plan_id: plan?.supabase_plan_id,
                });
              } catch (error) {
                logger.error('[Dashboard] Failed to submit general feedback:', error);
                throw error;
              }
            }}
          />
        )
      }

      {
        user && (
          <FloatingFeedbackButton onClick={() => setShowFeedbackPanel(true)} />
        )
      }

      {/* Module Activation Flow (New User Onboarding) */}
      {
        showModuleActivation && user?.id && (
          <ModuleActivationFlow
            userId={user.id}
            intakeData={intakeData}
            language="de"
            onComplete={() => {
              setShowModuleActivation(false);
              setHasActiveModules(true);
              // Refresh the page to show the new modules
              window.location.reload();
              addToast('🧩 Module aktiviert! Dein Daily Tracking ist bereit.', 'success');
            }}
            onSkip={() => {
              setShowModuleActivation(false);
              localStorage.setItem('module_onboarding_dismissed', 'true');
            }}
          />
        )
      }

      {/* Module Hub Modal */}
      {
        showModuleHub && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/70"
              onClick={() => setShowModuleHub(false)}
            />
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setShowModuleHub(false)}
                className="absolute top-4 right-4 z-10 p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <ModuleHub userId={user?.id} language="de" />
            </div>
          </div>
        )
      }

      {/* Morning Check-in Modal (v0.5.1) */}
      {
        showMorningCheckIn && (
          <MorningCheckIn
            showModal={showMorningCheckIn}
            onComplete={(result) => {
              setShowMorningCheckIn(false);
              addToast(`Recovery Score: ${result.score}/100`, 'success');
            }}
            onSkip={() => setShowMorningCheckIn(false)}
          />
        )
      }

      {/* Confirmation Dialog */}
      <ConfirmDialog />

      <OnboardingTour
        canStart={!showInitialFeedback && !showMorningCheckIn && !showModuleActivation && !showModuleHub}
      />
    </div >
  );
}
