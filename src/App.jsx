import React from 'react';
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
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import BetaBadge from './components/BetaBadge';



export default function App() {
  return (
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
    </BrowserRouter >
  );
}
