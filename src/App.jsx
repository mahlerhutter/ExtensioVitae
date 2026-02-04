import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import IntakePage from './pages/IntakePage';
import GeneratingPage from './pages/GeneratingPage';
import DashboardPage from './pages/DashboardPage';
import AuthPage from './pages/AuthPage';
import AdminPage from './pages/AdminPage';
import HealthProfilePage from './pages/HealthProfilePage';
import SciencePage from './pages/SciencePage';
import NotFoundPage from './pages/NotFoundPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import ImprintPage from './pages/ImprintPage';
import FuturePage from './pages/FuturePage';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import BetaBadge from './components/BetaBadge';
import { ModeProvider } from './contexts/ModeContext';



export default function App() {
  const [nightModeOverride, setNightModeOverride] = useState(false);

  // HACK 1: Melatonin Guard - Red Shift after 9 PM
  useEffect(() => {
    const checkNightMode = () => {
      const hour = new Date().getHours();
      const isNightTime = hour >= 21 || hour < 6;
      const override = localStorage.getItem('night_mode_override') === 'true';

      if (isNightTime && !override) {
        document.body.classList.add('night-mode');
      } else {
        document.body.classList.remove('night-mode');
      }

      setNightModeOverride(override);
    };

    checkNightMode();
    const interval = setInterval(checkNightMode, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

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

  const toggleNightMode = () => {
    const newValue = !nightModeOverride;
    localStorage.setItem('night_mode_override', newValue.toString());
    setNightModeOverride(newValue);

    if (newValue) {
      document.body.classList.remove('night-mode');
    }
  };

  return (
    <ModeProvider>
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

          {/* Hidden Future Vision Page (for trusted users only) */}
          <Route path="/future" element={
            <ErrorBoundary>
              <FuturePage />
            </ErrorBoundary>
          } />

          {/* Protected Dashboard Routes with Error Boundary */}
          <Route path="/dashboard" element={
            <ErrorBoundary>
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            </ErrorBoundary>
          } />
          <Route path="/d/:planId" element={
            <ErrorBoundary>
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            </ErrorBoundary>
          } />
          <Route path="/d/:planId/:day" element={
            <ErrorBoundary>
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            </ErrorBoundary>
          } />

          {/* Health Profile (Protected) */}
          <Route path="/health-profile" element={
            <ErrorBoundary>
              <ProtectedRoute>
                <HealthProfilePage />
              </ProtectedRoute>
            </ErrorBoundary>
          } />
          <Route path="/settings/health" element={
            <ErrorBoundary>
              <ProtectedRoute>
                <HealthProfilePage />
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

      {/* Night Mode Override Button */}
      {(new Date().getHours() >= 21 || new Date().getHours() < 6) && (
        <button
          onClick={toggleNightMode}
          className="fixed bottom-4 right-4 z-50 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs text-slate-300 transition-colors"
        >
          {nightModeOverride ? '🌙 Enable Night Mode' : '☀️ Override Night Mode'}
        </button>
      )}

      {/* Night Mode CSS */}
      <style>{`
        body.night-mode {
          filter: sepia(100%) hue-rotate(-50deg) saturate(400%) contrast(0.9);
        }
      `}</style>
    </ModeProvider>
  );
}
