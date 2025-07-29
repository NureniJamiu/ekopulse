import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ClerkProvider, ClerkLoading, ClerkLoaded } from '@clerk/clerk-react';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './contexts/AuthContext';
import { MapProvider } from './contexts/MapContext';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/common/ErrorBoundary';
import HomePage from './pages/HomePage';
import MyReportsPage from './pages/MyReportsPage';
import AuthorityDashboardPage from './pages/AuthorityDashboardPage';
import AgencyDashboardPage from './pages/AgencyDashboardPage';
import AgencyManagementPage from './pages/AgencyManagementPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import AgencySetupPage from './pages/AgencySetupPage';
import PostSignupFlow from './components/onboarding/PostSignupFlow';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error('Missing Clerk Publishable Key');
}

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <ClerkLoading>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      </ClerkLoading>
      <ClerkLoaded>
        <Router>
          <AuthProvider>
            <MapProvider>
              <ErrorBoundary>
                <div className="App">
                  <Layout>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/agency-setup" element={<AgencySetupPage />} />
                      <Route path="/my-reports" element={<MyReportsPage />} />
                      <Route path="/authority-dashboard" element={<AuthorityDashboardPage />} />
                      <Route path="/agency-dashboard" element={<AgencyDashboardPage />} />
                      <Route path="/agency-management" element={<AgencyManagementPage />} />
                    </Routes>
                  </Layout>

                  {/* Post-signup onboarding flow */}
                  <PostSignupFlow />

                  <Toaster
                    position="top-right"
                    toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    style: {
                      background: '#059669',
                    },
                  },
                  error: {
                    style: {
                      background: '#dc2626',
                    },
                  },
                }}
              />
                </div>
              </ErrorBoundary>
            </MapProvider>
          </AuthProvider>
        </Router>
      </ClerkLoaded>
    </ClerkProvider>
  );
}

export default App;
