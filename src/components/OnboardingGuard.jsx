import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

/**
 * OnboardingGuard - Forces new users to complete intake before accessing dashboard
 * 
 * Checks if user has completed intake (has active plan).
 * If not, redirects to /intake.
 * 
 * Allows access to:
 * - /intake (the onboarding page itself)
 * - /generating (plan generation page)
 * - Public pages
 */
export default function OnboardingGuard({ children }) {
    const { user, session, loading: authLoading } = useAuth();
    const location = useLocation();
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function checkOnboardingStatus() {
            if (!user || !session) {
                setLoading(false);
                return;
            }

            try {
                // Check if user has any active plans
                const { data: plans, error } = await supabase
                    .from('plans')
                    .select('id, status')
                    .eq('user_id', user.id)
                    .eq('status', 'active')
                    .limit(1);

                if (error) throw error;

                const hasActivePlan = plans && plans.length > 0;
                setHasCompletedOnboarding(hasActivePlan);
            } catch (error) {
                console.error('Error checking onboarding status:', error);
                // On error, allow access (fail open)
                setHasCompletedOnboarding(true);
            } finally {
                setLoading(false);
            }
        }

        if (!authLoading) {
            checkOnboardingStatus();
        }
    }, [user, session, authLoading]);

    // Still loading auth or onboarding status
    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <div className="text-slate-400">Loading...</div>
                </div>
            </div>
        );
    }

    // Not authenticated - let ProtectedRoute handle this
    if (!session) {
        return children;
    }

    // Allow access to intake and generating pages (part of onboarding flow)
    const allowedPaths = ['/intake', '/generating'];
    if (allowedPaths.includes(location.pathname)) {
        return children;
    }

    // User hasn't completed onboarding - redirect to intake
    if (hasCompletedOnboarding === false) {
        return <Navigate to="/intake" replace />;
    }

    // User has completed onboarding - allow access
    return children;
}
