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
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';


export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/intake" element={<IntakePage />} />
          <Route path="/generating" element={<GeneratingPage />} />
          <Route path="/science" element={<SciencePage />} />

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
          <Route path="/admin" element={<AdminPage />} />


          {/* 404 Catch-all Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
