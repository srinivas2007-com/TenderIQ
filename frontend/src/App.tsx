import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/common/Layout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { CompanyProfilePage } from './pages/CompanyProfilePage';
import { TendersListPage } from './pages/TendersListPage';
import { TenderUploadPage } from './pages/TenderUploadPage';
import { TenderDetailPage } from './pages/TenderDetailPage';
import { ComparePage } from './pages/ComparePage';
import { SimulatorPage } from './pages/SimulatorPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { Loader2 } from 'lucide-react';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route Guard (redirects already logged in users to dashboard)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            {/* Public Landing & Marketing */}
            <Route path="/" element={<LandingPage />} />

            {/* Auth Pages */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <ForgotPasswordPage />
                </PublicRoute>
              }
            />

            {/* Authenticated Application Workspace */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/company-profile" element={<CompanyProfilePage />} />
              <Route path="/profile" element={<CompanyProfilePage />} />
              <Route path="/tenders" element={<TendersListPage />} />
              <Route path="/tenders/upload" element={<TenderUploadPage />} />
              <Route path="/tenders/:id" element={<TenderDetailPage />} />
              <Route path="/tenders/:id/analysis" element={<TenderDetailPage />} />
              <Route path="/tenders/:id/requirements" element={<TenderDetailPage />} />
              <Route path="/tenders/:id/documents" element={<TenderDetailPage />} />
              <Route path="/tenders/:id/risks" element={<TenderDetailPage />} />
              <Route path="/tenders/:id/deadlines" element={<TenderDetailPage />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/simulator" element={<SimulatorPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />

              {/* Redirects for removed modules */}
              <Route path="/portfolio" element={<Navigate to="/dashboard" replace />} />
              <Route path="/tasks" element={<Navigate to="/dashboard" replace />} />
              <Route path="/company-intelligence" element={<Navigate to="/company-profile" replace />} />
              <Route path="/companies" element={<Navigate to="/company-profile" replace />} />
              <Route path="/companies/:id" element={<Navigate to="/company-profile" replace />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
