import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useProfile } from './hooks/useProfile';
import AuthForm from './components/auth/AuthForm';
import OnboardingFlow from './components/onboarding/OnboardingFlow';
import Dashboard from './components/home/Dashboard';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show landing page if user is not authenticated and hasn't clicked "Get Started"
  if (!user && showLanding) {
    return <LandingPage onGetStarted={() => setShowLanding(false)} />;
  }

  if (!user) {
    return <AuthForm onBack={() => setShowLanding(true)} />;
  }

  if (!profile || !profile.full_name) {
    return <OnboardingFlow onComplete={() => window.location.reload()} />;
  }

  return <Dashboard />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;