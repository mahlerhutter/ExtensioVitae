import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { generatePlan, getPlanGeneratorInfo } from '../lib/planGenerator';
import { calculateLongevityScore } from '../lib/longevityScore';
import {
  getIntake,
  getPlan,
  savePlan,
  getProgress,
  updateProgress,
  getStorageInfo,
  shouldUseSupabase,
  clearLocalData,
  saveIntake,
  getArchivedPlans
} from '../lib/dataService';

// Dashboard Components
import InteractiveLoading from '../components/dashboard/InteractiveLoading';
import LongevityScoreWidget from '../components/dashboard/LongevityScoreWidget';
import PillarsExplanationBox from '../components/dashboard/PillarsExplanationBox';
import PillarsExplanationModal from '../components/dashboard/PillarsExplanationModal';
import DashboardHeader from '../components/dashboard/DashboardHeader';
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

  const navigate = useNavigate();
  const { planId, day } = useParams(); // Get URL parameters


  // Get auth state from context
  const { user, signOut: authSignOut } = useAuth();

  useEffect(() => {
    // Load or generate plan using DataService
    const loadPlan = async () => {
      setLoading(true);

      try {
        // Log storage info for debugging
        const storageInfo = await getStorageInfo();
        logger.debug('[Dashboard] Storage mode:', storageInfo);

        if (user) {
          setUserEmail(user.email);

          // Check if user is admin via server-side Edge Function
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              const isAdminUser = await checkAdminStatus(session);
              setIsAdmin(isAdminUser);
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
          if (existingPlan.supabase_plan_id && await shouldUseSupabase()) {
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
      <DashboardHeader
        userName={plan.user_name}
        onSignOut={handleSignOut}
        onProfileClick={() => setShowEditModal(true)}
        isAdmin={isAdmin}
      />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Emergency Mode Indicator (if active) */}
        <div className="mb-4">
          <ModeIndicator showDuration={true} size="md" />
        </div>

        {selectedDay && selectedDay !== currentDay && (
          <button
            onClick={() => handleSelectDay(null)}
            className="mb-4 text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
          >
            ← Back to today
          </button>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <TodayCard
              day={displayDay}
              dayData={dayData}
              progress={dayProgress}
              onTaskToggle={handleTaskToggle}
              startDate={plan.start_date}
            />
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Longevity Score - Compact */}
            <LongevityScoreWidget intakeData={intakeData} userName={intakeData?.name} compact={true} />

            {/* Emergency Mode Selector */}
            <ModeSelector variant="collapsible" />

            {/* Calendar Integration */}
            <CalendarConnect variant="compact" />

            {/* New Plan Button */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <button
                onClick={() => navigate('/intake')}
                className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold rounded-lg transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Neuen Plan erstellen
              </button>

              {/* Health Profile Button */}
              <button
                onClick={() => navigate('/health-profile')}
                className="w-full mt-3 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-all border border-slate-700 hover:border-slate-600 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                🩺 Gesundheitsprofil
              </button>

              {/* Calendar Export Button */}
              <button
                onClick={() => {
                  const icsContent = generateICS(plan);
                  downloadICS(icsContent);
                  addToast('📅 Calendar exported!', 'success');
                  trackFeatureUsed('calendar_export');
                }}
                className="w-full mt-3 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-all border border-slate-700 hover:border-slate-600 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Sync to Calendar
              </button>
            </div>

            {/* Save & Export Section */}
            <div className="mt-4 pt-4 border-t border-slate-700">
              <h4 className="text-slate-400 text-xs uppercase tracking-wider mb-3 font-semibold">Save & Export</h4>
              <WhatsAppButton />
            </div>

            <MonthOverview
              plan={plan}
              progress={progress}
              currentDay={currentDay}
              onDayClick={handleDayClick}
              startDate={plan.start_date}
            />

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

          </div>
        </div>
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
      {showInitialFeedback && (
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
          }}
        />
      )}

      {showFeedbackPanel && (
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
      )}

      {user && (
        <FloatingFeedbackButton onClick={() => setShowFeedbackPanel(true)} />
      )}
    </div>
  );
}
