import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MobileFrame } from './components/layout/MobileFrame';

// Pages
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { ResidentHome } from './pages/resident/ResidentHome';
import { ReportIssue } from './pages/resident/ReportIssue';
import { ResidentIssueDetails } from './pages/resident/ResidentIssueDetails';
import { MaintenanceDashboard } from './pages/maintenance/MaintenanceDashboard';
import { MaintenanceIssueDetails } from './pages/maintenance/MaintenanceIssueDetails';

// Role Guard Component
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRole?: 'resident' | 'maintenance';
}> = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    // If a staff user tries to visit resident route or vice-versa, redirect to their home
    return <Navigate to={user.role === 'maintenance' ? '/maintenance' : '/resident'} replace />;
  }

  return <>{children}</>;
};

// Public Route Guard - if already logged in, redirect directly to their dashboard
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to={user.role === 'maintenance' ? '/maintenance' : '/resident'} replace />;
  }

  return <>{children}</>;
};

// Root Redirector - checks auth status before redirecting
const RootRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
      </div>
    );
  }
  if (user) {
    return <Navigate to={user.role === 'maintenance' ? '/maintenance' : '/resident'} replace />;
  }
  return <Navigate to="/login" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <MobileFrame>
          <Routes>
            {/* Public Routes - guarded against logged in users */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <SignUp />
                </PublicRoute>
              }
            />

            {/* Resident Protected Routes */}
            <Route
              path="/resident"
              element={
                <ProtectedRoute allowedRole="resident">
                  <ResidentHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resident/report"
              element={
                <ProtectedRoute allowedRole="resident">
                  <ReportIssue />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resident/issues/:id"
              element={
                <ProtectedRoute allowedRole="resident">
                  <ResidentIssueDetails />
                </ProtectedRoute>
              }
            />

            {/* Maintenance Protected Routes */}
            <Route
              path="/maintenance"
              element={
                <ProtectedRoute allowedRole="maintenance">
                  <MaintenanceDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/maintenance/issues/:id"
              element={
                <ProtectedRoute allowedRole="maintenance">
                  <MaintenanceIssueDetails />
                </ProtectedRoute>
              }
            />

            {/* Root and Catch-All */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MobileFrame>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
