import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import IntakePage from './pages/IntakePage';
import GeneratingPage from './pages/GeneratingPage';
import DashboardNewPage from './pages/DashboardNewPage';
import AuthPage from './pages/AuthPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminPage from './pages/AdminPage';
import HealthProfilePage from './pages/HealthProfilePage';
import SciencePage from './pages/SciencePage';
import NotFoundPage from './pages/NotFoundPage';
import ModuleHubPage from './pages/ModuleHubPage';
import LabsPage from './pages/LabsPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import ImprintPage from './pages/ImprintPage';
import FuturePage from './pages/FuturePage';
import FeaturesPage from './pages/FeaturesPage';
import RecoveryPage from './pages/RecoveryPage';
import VersionsPage from './pages/VersionsPage';
import DogfoodingPage from './pages/DogfoodingPage';
import FriendsPage from './pages/FriendsPage';
import DashboardMockupPage from './pages/DashboardMockupPage';
import ProtectedRoute from './components/ProtectedRoute';
import OnboardingGuard from './components/OnboardingGuard';
import ErrorBoundary from './components/ErrorBoundary';
import BetaBadge from './components/BetaBadge';
import { ModeProvider } from './contexts/ModeContext';
import { CalendarProvider } from './contexts/CalendarContext';
import CalendarCallbackPage from './pages/CalendarCallbackPage';
import OAuthCallback from './components/oauth/OAuthCallback';
import { getCircadianIntelligence } from './lib/circadianService';



export default function App() {


  // HACK 4: Ghost Tab - Change title when user leaves
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        document.title = '⚠️ Protocol Paused...';
      } else {
        document.title = 'ExtensioVitae';
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);



  return (
    <ModeProvider>
      <CalendarProvider>
        <BrowserRouter>
          <BetaBadge />
          <Routes>
            <Route path="/" element={
              <ErrorBoundary>
                <LandingPage />
              </ErrorBoundary>
            } />
            <Route path="/auth" element={
              <ErrorBoundary>
                <AuthPage />
              </ErrorBoundary>
            } />
            <Route path="/reset-password" element={
              <ErrorBoundary>
                <ResetPasswordPage />
              </ErrorBoundary>
            } />
            <Route path="/intake" element={
              <ErrorBoundary>
                <IntakePage />
              </ErrorBoundary>
            } />
            <Route path="/generating" element={
              <ErrorBoundary>
                <GeneratingPage />
              </ErrorBoundary>
            } />
            <Route path="/science" element={
              <ErrorBoundary>
                <SciencePage />
              </ErrorBoundary>
            } />

            {/* Calendar OAuth Callback */}
            <Route path="/calendar/callback" element={
              <ErrorBoundary>
                <CalendarCallbackPage />
              </ErrorBoundary>
            } />

            {/* Wearable OAuth Callbacks */}
            <Route path="/oauth/oura/callback" element={
              <ErrorBoundary>
                <OAuthCallback />
              </ErrorBoundary>
            } />
            <Route path="/oauth/whoop/callback" element={
              <ErrorBoundary>
                <OAuthCallback />
              </ErrorBoundary>
            } />

            {/* Legal Pages */}
            <Route path="/privacy" element={
              <ErrorBoundary>
                <PrivacyPage />
              </ErrorBoundary>
            } />
            <Route path="/terms" element={
              <ErrorBoundary>
                <TermsPage />
              </ErrorBoundary>
            } />
            <Route path="/imprint" element={
              <ErrorBoundary>
                <ImprintPage />
              </ErrorBoundary>
            } />

            {/* Friends & Family Hub - Hidden Pages for Trusted Users */}
            <Route path="/friends" element={
              <ErrorBoundary>
                <FriendsPage />
              </ErrorBoundary>
            } />

            <Route path="/friends/future" element={
              <ErrorBoundary>
                <FuturePage />
              </ErrorBoundary>
            } />

            <Route path="/friends/features" element={
              <ErrorBoundary>
                <FeaturesPage />
              </ErrorBoundary>
            } />

            <Route path="/friends/versions" element={
              <ErrorBoundary>
                <VersionsPage />
              </ErrorBoundary>
            } />

            <Route path="/friends/mockup" element={
              <ErrorBoundary>
                <DashboardMockupPage />
              </ErrorBoundary>
            }
            />

            <Route path="/dogfood" element={
              <ErrorBoundary>
                <DogfoodingPage />
              </ErrorBoundary>
            } />





            {/* Protected Dashboard Routes with Error Boundary + Onboarding Guard */}
            <Route path="/dashboard" element={
              <ErrorBoundary>
                <ProtectedRoute>
                  <OnboardingGuard>
                    <DashboardNewPage />
                  </OnboardingGuard>
                </ProtectedRoute>
              </ErrorBoundary>
            } />
            <Route path="/d/:planId" element={
              <ErrorBoundary>
                <ProtectedRoute>
                  <OnboardingGuard>
                    <DashboardNewPage />
                  </OnboardingGuard>
                </ProtectedRoute>
              </ErrorBoundary>
            } />
            <Route path="/d/:planId/:day" element={
              <ErrorBoundary>
                <ProtectedRoute>
                  <OnboardingGuard>
                    <DashboardNewPage />
                  </OnboardingGuard>
                </ProtectedRoute>
              </ErrorBoundary>
            } />

            {/* Recovery & Performance (Protected + Onboarding Guard) */}
            <Route path="/recovery" element={
              <ErrorBoundary>
                <ProtectedRoute>
                  <OnboardingGuard>
                    <RecoveryPage />
                  </OnboardingGuard>
                </ProtectedRoute>
              </ErrorBoundary>
            } />

            {/* Health Profile (Protected + Onboarding Guard) */}
            <Route path="/health-profile" element={
              <ErrorBoundary>
                <ProtectedRoute>
                  <OnboardingGuard>
                    <HealthProfilePage />
                  </OnboardingGuard>
                </ProtectedRoute>
              </ErrorBoundary>
            } />
            <Route path="/settings/health" element={
              <ErrorBoundary>
                <ProtectedRoute>
                  <OnboardingGuard>
                    <HealthProfilePage />
                  </OnboardingGuard>
                </ProtectedRoute>
              </ErrorBoundary>
            } />

            {/* Module Hub (Protected + Onboarding Guard) */}
            <Route path="/modules" element={
              <ErrorBoundary>
                <ProtectedRoute>
                  <OnboardingGuard>
                    <ModuleHubPage />
                  </OnboardingGuard>
                </ProtectedRoute>
              </ErrorBoundary>
            } />

            {/* Labs (Protected + Onboarding Guard) */}
            <Route path="/labs" element={
              <ErrorBoundary>
                <ProtectedRoute>
                  <OnboardingGuard>
                    <LabsPage />
                  </OnboardingGuard>
                </ProtectedRoute>
              </ErrorBoundary>
            } />

            {/* Admin Dashboard (email-restricted) */}
            <Route path="/admin" element={
              <ErrorBoundary>
                <AdminPage />
              </ErrorBoundary>
            } />


            {/* 404 Catch-all Route */}
            <Route path="*" element={
              <ErrorBoundary>
                <NotFoundPage />
              </ErrorBoundary>
            } />
          </Routes>
        </BrowserRouter>


      </CalendarProvider>
    </ModeProvider >
  );
}
