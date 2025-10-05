import { CoachAuthProvider, useCoachAuth } from './contexts/CoachAuthContext';
import CoachLogin from './components/coach/CoachLogin';
import CoachDashboard from './components/coach/CoachDashboard';

function CoachAppContent() {
  const { user, isCoach, loading } = useCoachAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user || !isCoach) {
    return <CoachLogin />;
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
