import { useState } from 'react';
import { CheckCircle, Circle, Plus, Target, TrendingUp, Lock } from 'lucide-react';
import { useHabits } from '../../contexts/HabitsContext';
import { useSubscription } from '../../hooks/useSubscription';
import HabitCard from './HabitCard';
import AddHabitModal from './AddHabitModal';

export default function HabitTracker() {
  const { habits, loading, completeHabit, uncompleteHabit, isHabitCompleted, getHabitStreak } = useHabits();
  const { isPremium } = useSubscription();
  const [showAddModal, setShowAddModal] = useState(false);

  const toggleHabit = async (habitId: string) => {
    const isCompleted = isHabitCompleted(habitId);
    if (isCompleted) {
      await uncompleteHabit(habitId);
    } else {
      await completeHabit(habitId);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Target className="text-emerald-600" size={24} />
          <h3 className="text-lg font-semibold text-slate-800">Habit Tracking</h3>
        </div>

        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-6 text-center">
          <Lock className="mx-auto text-amber-600 mb-4" size={48} />
          <h4 className="font-bold text-amber-900 text-xl mb-2">Premium Feature</h4>
          <p className="text-amber-800 mb-4">
            Track daily habits tied to your financial goals. Build consistency and achieve your money mindset objectives.
          </p>
          <div className="bg-white/70 rounded-lg p-4 text-left space-y-2 mb-4">
            <div className="flex items-center gap-2 text-amber-900">
              <CheckCircle size={16} className="text-emerald-600" />
              <span className="text-sm">Create unlimited custom habits</span>
            </div>
            <div className="flex items-center gap-2 text-amber-900">
              <CheckCircle size={16} className="text-emerald-600" />
              <span className="text-sm">Link habits to your financial goals</span>
            </div>
            <div className="flex items-center gap-2 text-amber-900">
              <CheckCircle size={16} className="text-emerald-600" />
              <span className="text-sm">Track streaks and completion rates</span>
            </div>
            <div className="flex items-center gap-2 text-amber-900">
              <CheckCircle size={16} className="text-emerald-600" />
              <span className="text-sm">Visual habit calendar</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="text-emerald-600" size={24} />
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Your Habits</h3>
            <p className="text-sm text-slate-600">
              {habits.length} {habits.length === 1 ? 'habit' : 'habits'} tracked
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
        >
          <Plus size={20} />
          Add Habit
        </button>
      </div>

      {habits.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
          <Target className="mx-auto text-slate-300 mb-4" size={48} />
          <h4 className="text-lg font-medium text-slate-800 mb-2">No habits yet</h4>
          <p className="text-sm text-slate-600 mb-4">
            Start tracking your financial habits to build lasting change.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            <Plus size={20} />
            Create Your First Habit
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              isCompleted={isHabitCompleted(habit.id)}
              streak={getHabitStreak(habit.id)}
              onToggle={() => toggleHabit(habit.id)}
            />
          ))}
        </div>
      )}

      {habits.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
          <TrendingUp className="text-emerald-600 flex-shrink-0" size={20} />
          <div>
            <h4 className="font-medium text-emerald-900 mb-1">Keep Going!</h4>
            <p className="text-sm text-emerald-800">
              Consistency is key. Check in daily to build strong financial habits.
            </p>
          </div>
        </div>
      )}

      {showAddModal && (
        <AddHabitModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}
