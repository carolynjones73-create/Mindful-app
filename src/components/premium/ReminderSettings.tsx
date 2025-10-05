import { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Clock, Lock, Lightbulb, TrendingUp, Heart, DollarSign } from 'lucide-react';
import { useNotificationPreferences } from '../../hooks/useNotificationPreferences';
import { useSubscription } from '../../hooks/useSubscription';

const REMINDER_SUGGESTIONS = [
  {
    icon: TrendingUp,
    time: '09:00',
    message: 'Morning money mindset: Review your financial goals',
    description: 'Start your day with intention'
  },
  {
    icon: DollarSign,
    time: '12:00',
    message: 'Midday check: Track today\'s spending',
    description: 'Stay aware throughout the day'
  },
  {
    icon: Heart,
    time: '15:00',
    message: 'Afternoon pause: Practice gratitude for what you have',
    description: 'Shift from scarcity to abundance'
  },
  {
    icon: Bell,
    time: '18:00',
    message: 'Evening prep: Plan tomorrow\'s financial priorities',
    description: 'End the day with clarity'
  },
  {
    icon: TrendingUp,
    time: '20:00',
    message: 'Nightly reflection: What money decision am I proud of today?',
    description: 'Celebrate your progress'
  }
];

export default function ReminderSettings() {
  const { preferences, loading, addPreference, deletePreference, togglePreference } = useNotificationPreferences();
  const { isPremium, getMaxReminders } = useSubscription();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [newTime, setNewTime] = useState('09:00');
  const [newMessage, setNewMessage] = useState('');
  const maxReminders = getMaxReminders();

  const handleAdd = async () => {
    if (!newTime || !newMessage.trim()) return;

    const success = await addPreference(newTime + ':00', newMessage);
    if (success) {
      setNewTime('09:00');
      setNewMessage('');
      setShowAddForm(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this reminder?')) {
      await deletePreference(id);
    }
  };

  const handleToggle = async (id: string, currentEnabled: boolean) => {
    await togglePreference(id, !currentEnabled);
  };

  const handleUseSuggestion = (suggestion: typeof REMINDER_SUGGESTIONS[0]) => {
    setNewTime(suggestion.time);
    setNewMessage(suggestion.message);
    setShowSuggestions(false);
    setShowAddForm(true);
  };

  const canAddMore = preferences.length < maxReminders;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="text-emerald-600" size={24} />
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Notification Reminders</h3>
            <p className="text-sm text-slate-600">
              {preferences.length} of {maxReminders} reminders configured
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {canAddMore && (
            <>
              <button
                onClick={() => {
                  setShowSuggestions(!showSuggestions);
                  setShowAddForm(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <Lightbulb size={20} />
                Ideas
              </button>
              <button
                onClick={() => {
                  setShowAddForm(!showAddForm);
                  setShowSuggestions(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              >
                <Plus size={20} />
                Add Custom
              </button>
            </>
          )}
        </div>
      </div>

      {!isPremium && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <Lock className="text-amber-600 flex-shrink-0" size={20} />
          <div>
            <h4 className="font-medium text-amber-900 mb-1">Premium Feature</h4>
            <p className="text-sm text-amber-800">
              Upgrade to Premium to add up to 5 custom reminders. Free users can use the 2 default morning and evening reminders.
            </p>
          </div>
        </div>
      )}

      {showSuggestions && canAddMore && (
        <div className="bg-gradient-to-br from-blue-50 to-emerald-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Lightbulb className="text-blue-600" size={24} />
            <div>
              <h4 className="font-semibold text-slate-800">Reminder Ideas</h4>
              <p className="text-sm text-slate-600">Click any suggestion to customize and add it</p>
            </div>
          </div>
          <div className="space-y-3">
            {REMINDER_SUGGESTIONS.map((suggestion, index) => {
              const Icon = suggestion.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleUseSuggestion(suggestion)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-4 hover:border-emerald-300 hover:shadow-md transition-all text-left group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 transition-colors">
                      <Icon className="text-emerald-600" size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="text-slate-400" size={14} />
                        <span className="text-sm font-medium text-slate-700">{suggestion.time}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-800 mb-1">{suggestion.message}</p>
                      <p className="text-xs text-slate-600">{suggestion.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showAddForm && canAddMore && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
          <h4 className="font-medium text-slate-800">Add New Reminder</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Time
              </label>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Message
              </label>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="e.g., Time for your money mindset check-in"
                maxLength={100}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-xs text-slate-500 mt-1">{newMessage.length}/100 characters</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex gap-2">
                <Lightbulb className="text-blue-600 flex-shrink-0" size={16} />
                <p className="text-xs text-blue-800">
                  <strong>Tip:</strong> The most effective reminders are specific, actionable, and tied to your daily routine.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={!newMessage.trim()}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Reminder
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewMessage('');
                  setNewTime('09:00');
                }}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {!canAddMore && !showAddForm && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
          <p className="text-sm text-slate-600">
            {isPremium
              ? 'You have reached the maximum number of reminders (5).'
              : 'Upgrade to Premium to add custom reminders beyond the default morning and evening notifications.'}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {preferences.map((pref) => (
          <div
            key={pref.id}
            className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between hover:border-emerald-300 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              <Clock className="text-slate-400" size={20} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-800">
                    {pref.time.substring(0, 5)}
                  </p>
                  {!pref.enabled && (
                    <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-600 rounded">
                      Disabled
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600">{pref.message}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggle(pref.id, pref.enabled)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  pref.enabled
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {pref.enabled ? 'Enabled' : 'Disabled'}
              </button>
              <button
                onClick={() => handleDelete(pref.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete reminder"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {preferences.length === 0 && (
        <div className="text-center py-8">
          <Bell className="mx-auto text-slate-300 mb-3" size={48} />
          <p className="text-slate-600">No custom reminders configured yet.</p>
          <p className="text-sm text-slate-500 mt-1">
            Add your first reminder to get personalized notifications.
          </p>
        </div>
      )}
    </div>
  );
}
