import { useState } from 'react';
import { CoachAuthProvider, useCoachAuth } from './contexts/CoachAuthContext';
import CoachLogin from './components/coach/CoachLogin';
import CoachRegistration from './components/coach/CoachRegistration';
import CoachDashboard from './components/coach/CoachDashboard';

function CoachAppContent() {
  const { user, isCoach, loading } = useCoachAuth();
  const [showRegistration, setShowRegistration] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user || !isCoach) {
    if (showRegistration) {
      return <CoachRegistration onBackToLogin={() => setShowRegistration(false)} />;
    }
    return <CoachLogin onShowRegistration={() => setShowRegistration(true)} />;
  }

  return <CoachDashboard />;
}

export default function CoachApp() {
  return (
    <CoachAuthProvider>
      <CoachAppContent />
    </CoachAuthProvider>
  );
}
