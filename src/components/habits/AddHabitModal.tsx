import { useState } from 'react';
import { X, Target } from 'lucide-react';
import { useHabits } from '../../contexts/HabitsContext';

interface AddHabitModalProps {
  onClose: () => void;
}

const HABIT_ICONS = ['💰', '📊', '✍️', '📚', '🎯', '💪', '🏃', '🧘', '📝', '💡', '🔔', '✓'];

const PRESET_HABITS = [
  { name: 'Log daily spending', icon: '💰', description: 'Track every expense in your budget app' },
  { name: 'Review budget', icon: '📊', description: 'Check your spending vs budget weekly' },
  { name: 'No-spend day', icon: '🎯', description: 'Complete a day without spending' },
  { name: 'Save money', icon: '💡', description: 'Put money into savings' },
  { name: 'Read finance article', icon: '📚', description: 'Learn about personal finance' },
];

export default function AddHabitModal({ onClose }: AddHabitModalProps) {
  const { addHabit, goals } = useHabits();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('✓');
  const [goalId, setGoalId] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;

    setSaving(true);
    await addHabit(name, goalId || undefined, description, frequency, 1, icon);
    setSaving(false);
    onClose();
  };

  const applyPreset = (preset: typeof PRESET_HABITS[0]) => {
    setName(preset.name);
    setDescription(preset.description);
    setIcon(preset.icon);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="text-emerald-600" size={24} />
            <h3 className="text-xl font-bold text-slate-800">Add New Habit</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h4 className="font-medium text-slate-800 mb-3">Quick Start Templates</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_HABITS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => applyPreset(preset)}
                  className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-colors text-left"
                >
                  <span className="text-2xl">{preset.icon}</span>
                  <span className="text-sm font-medium text-slate-700">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h4 className="font-medium text-slate-800 mb-4">Custom Habit</h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Icon
                </label>
                <div className="flex flex-wrap gap-2">
                  {HABIT_ICONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setIcon(emoji)}
                      className={`w-12 h-12 text-2xl rounded-lg border-2 transition-all ${
                        icon === emoji
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Habit Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Track my spending"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description..."
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  maxLength={200}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Link to Goal (Optional)
                </label>
                <select
                  value={goalId}
                  onChange={(e) => setGoalId(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">No goal</option>
                  {goals.filter(g => g.status === 'active').map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.title}
                    </option>
                  ))}
                </select>
                {goals.length === 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    You haven't created any goals yet. Goals help organize your habits.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Frequency
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="frequency"
                      value="daily"
                      checked={frequency === 'daily'}
                      onChange={(e) => setFrequency(e.target.value as 'daily')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-slate-700">Daily</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="frequency"
                      value="weekly"
                      checked={frequency === 'weekly'}
                      onChange={(e) => setFrequency(e.target.value as 'weekly')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-slate-700">Weekly</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {saving ? 'Adding...' : 'Add Habit'}
          </button>
        </div>
      </div>
    </div>
  );
}
