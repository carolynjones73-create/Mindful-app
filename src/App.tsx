import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useProfile } from './hooks/useProfile';
import AuthForm from './components/auth/AuthForm';
import OnboardingFlow from './components/onboarding/OnboardingFlow';
import Dashboard from './components/home/Dashboard';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [showLanding, setShowLanding] = useState(true);

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

  if (!user) {
    return <AuthForm />;
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