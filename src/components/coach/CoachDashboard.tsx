import { useState, useEffect } from 'react';
import { Users, MessageCircle, LogOut, Settings, Calendar } from 'lucide-react';
import { useCoachAuth } from '../../contexts/CoachAuthContext';
import { supabase } from '../../lib/supabase';
import CoachMessages from './CoachMessages';

interface AssignedUser {
  user_id: string;
  profile: {
    email: string;
    full_name: string | null;
  };
  unread_count: number;
}

export default function CoachDashboard() {
  const { coach, signOut } = useCoachAuth();
  const [assignedUsers, setAssignedUsers] = useState<AssignedUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [calendlyUrl, setCalendlyUrl] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (coach) {
      fetchAssignedUsers();
      setCalendlyUrl(coach.calendly_url || '');
    }
  }, [coach]);

  const fetchAssignedUsers = async () => {
    if (!coach) return;

    try {
      const { data: assignments } = await supabase
        .from('coach_assignments')
        .select('user_id')
        .eq('coach_id', coach.id);

      if (!assignments) {
        setLoading(false);
        return;
      }

      const userIds = assignments.map(a => a.user_id);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      const usersWithUnread = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { count } = await supabase
            .from('coach_messages')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id)
            .eq('coach_id', coach.id)
            .eq('sender_type', 'user')
            .eq('read', false);

          return {
            user_id: profile.id,
            profile: {
              email: profile.email,
              full_name: profile.full_name
            },
            unread_count: count || 0
          };
        })
      );

      setAssignedUsers(usersWithUnread);
    } catch (error) {
      console.error('Error fetching assigned users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSaveSettings = async () => {
    if (!coach) return;

    setSavingSettings(true);
    try {
      const { error } = await supabase
        .from('coaches')
        .update({ calendly_url: calendlyUrl })
        .eq('id', coach.id);

      if (error) throw error;

      alert('Settings saved successfully!');
      setShowSettings(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (showSettings) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="text-emerald-600" size={24} />
              <h1 className="text-xl font-bold text-slate-800">Coach Settings</h1>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-6 py-8">
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Calendly Integration</h2>
            <p className="text-sm text-slate-600 mb-4">
              Add your Calendly booking link to allow users to schedule paid sessions with you.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Calendly URL
              </label>
              <input
                type="url"
                value={calendlyUrl}
                onChange={(e) => setCalendlyUrl(e.target.value)}
                placeholder="https://calendly.com/your-username/session"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-xs text-slate-500 mt-2">
                Example: https://calendly.com/yourname/30min
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex gap-3">
                <Calendar className="text-blue-600 flex-shrink-0" size={20} />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">How it works:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Users get 10 free messages per month with Premium</li>
                    <li>After limit, they're prompted to book a paid session</li>
                    <li>Clicking the button opens your Calendly link</li>
                    <li>You handle payment through Calendly or your preferred method</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {savingSettings ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (selectedUserId) {
    return (
      <CoachMessages
        userId={selectedUserId}
        onBack={() => {
          setSelectedUserId(null);
          fetchAssignedUsers();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <Users className="text-emerald-600" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Coach Dashboard</h1>
              <p className="text-sm text-slate-600">{coach?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Settings size={18} />
              Settings
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Your Assigned Users</h2>
          <p className="text-slate-600">
            Click on a user to view and respond to their messages
          </p>
        </div>

        {assignedUsers.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
            <Users className="mx-auto text-slate-300 mb-4" size={64} />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No Assigned Users</h3>
            <p className="text-slate-600">
              You don't have any users assigned to you yet. Contact your administrator for assignments.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {assignedUsers.map((user) => (
              <button
                key={user.user_id}
                onClick={() => setSelectedUserId(user.user_id)}
                className="bg-white border border-slate-200 rounded-lg p-6 hover:border-emerald-300 hover:shadow-md transition-all text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                      <Users className="text-slate-600" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        {user.profile.full_name || user.profile.email}
                      </h3>
                      <p className="text-sm text-slate-600">{user.profile.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {user.unread_count > 0 && (
                      <span className="bg-red-500 text-white text-sm font-semibold px-3 py-1 rounded-full">
                        {user.unread_count} new
                      </span>
                    )}
                    <MessageCircle className="text-emerald-600" size={24} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
