import React, { useEffect, useState } from 'react';
import { build30DayBlueprint, TASKS_EXAMPLE } from '../lib/planBuilder';
import { savePlan, shouldUseSupabase } from '../lib/dataService';
import { calculatePlanOverview, savePlanOverview } from '../lib/planOverviewService';
import { getHealthProfile, createPlanSnapshot } from '../lib/profileService';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import PlanReviewModal from '../components/plan-review/PlanReviewModal';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const STAGES = [
  'Analyzing your profile...',
  'Mapping your goals to the 6 pillars...',
  'Designing your 30-day architecture...',
  'Optimizing for your constraints...',
  'Finalizing your blueprint...',
];

export default function GeneratingPage() {
  useDocumentTitle('Generating Blueprint... - ExtensioVitae');
  const [currentStage, setCurrentStage] = useState(0);
  const [dots, setDots] = useState('');
  const [showReview, setShowReview] = useState(false);
  const [planOverview, setPlanOverview] = useState(null);
  const [generatedPlanId, setGeneratedPlanId] = useState(null);

  // Progress through stages
  useEffect(() => {
    const stageInterval = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev < STAGES.length - 1) return prev + 1;
        return prev;
      });
    }, 4000);

    return () => clearInterval(stageInterval);
  }, []);

  // Animate dots
  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    return () => clearInterval(dotInterval);
  }, []);

  // Check for plan completion (poll or webhook)
  useEffect(() => {
    const generatePlan = async () => {
      try {
        // Artificial delay for UX
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // 1. Get intake data
        const intakeStr = localStorage.getItem('intake_data');
        if (!intakeStr) {
          logger.warn('No intake data found, redirecting to intake');
          window.location.href = '/intake';
          return;
        }

        const intake = JSON.parse(intakeStr);

        // 2. Get health profile if user is authenticated
        let healthProfile = null;
        let userId = null;
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            userId = user.id;
            healthProfile = await getHealthProfile(user.id);
            if (healthProfile) {
              logger.debug('[Generating] Health profile loaded:', {
                conditions: healthProfile.chronic_conditions?.length || 0,
                injuries: healthProfile.injuries_limitations?.length || 0
              });
            }
          }
        } catch (error) {
          logger.warn('[Generating] Could not fetch health profile:', error);
        }

        // 3. Build plan with health profile integration (v2.1)
        logger.info('[Generating] Building plan for:', intake);
        const result = build30DayBlueprint(intake, TASKS_EXAMPLE, {}, healthProfile);

        // Log health adaptations
        if (result.json.meta?.health?.hasProfile) {
          logger.info('[Generating] Plan adapted for health profile:', {
            tasksFiltered: result.json.meta.health.tasksFiltered,
            intensityCap: result.json.meta.health.intensityCap,
            warnings: result.json.meta.health.warnings?.length || 0
          });
        }

        // 4. Calculate plan overview
        logger.debug('[Generating] Calculating plan overview...');
        const overview = calculatePlanOverview(result.json, intake);

        if (!overview) {
          logger.error('[Generating] Failed to calculate overview');
        }

        // 5. Save to storage
        const savedPlan = await savePlan(result.json);
        logger.info('[Generating] Plan saved:', savedPlan.id);

        // 6. Save overview to Supabase if authenticated
        if (savedPlan?.supabase_plan_id && overview) {
          try {
            await savePlanOverview(supabase, savedPlan.supabase_plan_id, overview);
            logger.info('[Generating] Overview saved to Supabase');
            setGeneratedPlanId(savedPlan.supabase_plan_id);
          } catch (error) {
            logger.error('[Generating] Error saving overview:', error);
          }
        }

        // 7. Create plan snapshot if health profile exists
        if (savedPlan?.supabase_plan_id && userId && healthProfile) {
          try {
            await createPlanSnapshot(
              savedPlan.supabase_plan_id,
              userId,
              healthProfile,
              intake.primary_goal,
              {
                excludedActivities: result.json.meta.health?.summary?.topWarnings || [],
                intensityCap: result.json.meta.health?.intensityCap,
                notes: result.json.meta.health?.warnings?.join('; ')
              }
            );
            logger.info('[Generating] Plan snapshot created');
          } catch (error) {
            logger.error('[Generating] Error creating snapshot:', error);
          }
        }

        // 8. Show review modal
        setPlanOverview(overview);
        setShowReview(true);

      } catch (error) {
        logger.error('[Generating] Error generating plan:', error);
        // Fallback - redirect to dashboard
        window.location.href = '/dashboard';
      }
    };

    generatePlan();
  }, []);

  // Handle plan confirmation
  const handleConfirmPlan = async () => {
    try {
      // Check auth and redirect
      const isAuth = await shouldUseSupabase();
      if (isAuth) {
        window.location.href = '/dashboard';
      } else {
        // Redirect to Auth for signup if not logged in
        window.location.href = '/auth?next=/dashboard&mode=signup';
      }
    } catch (error) {
      logger.error('[Generating] Error confirming plan:', error);
      window.location.href = '/dashboard';
    }
  };

  return (
    <>
      {/* Loading Screen */}
      {!showReview && (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6">
          {/* Logo */}
          <div className="text-2xl font-semibold text-white tracking-tight mb-16">
            Extensio<span className="text-amber-400">Vitae</span>
          </div>

          {/* Loader */}
          <div className="relative w-20 h-20 mb-12">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-2 border-slate-800" />
            {/* Spinning ring */}
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-400 animate-spin" />
            {/* Inner pulse */}
            <div className="absolute inset-4 rounded-full bg-amber-400/10 animate-pulse" />
          </div>

          {/* Current stage */}
          <div className="text-center max-w-md">
            <p className="text-xl text-white mb-2">
              {STAGES[currentStage]}{dots}
            </p>
            <p className="text-slate-500 text-sm">
              This usually takes 15-30 seconds
            </p>
          </div>

          {/* Stage indicators */}
          <div className="flex items-center gap-2 mt-12">
            {STAGES.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-500 ${index <= currentStage ? 'bg-amber-400' : 'bg-slate-700'
                  }`}
              />
            ))}
          </div>

          {/* Subtle messaging */}
          <p className="text-slate-600 text-xs mt-16 text-center max-w-sm">
            Your personalized plan is being crafted by AI, optimized for your unique goals and constraints.
          </p>
        </div>
      )}

      {/* Plan Review Modal */}
      {showReview && planOverview && (
        <PlanReviewModal
          planOverview={planOverview}
          onConfirm={handleConfirmPlan}
          onBack={() => {
            // Optional: allow going back to intake
            window.location.href = '/intake';
          }}
        />
      )}
    </>
  );
}
