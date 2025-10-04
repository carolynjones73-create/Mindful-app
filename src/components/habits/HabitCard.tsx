import { CheckCircle, Circle, Flame, CreditCard as Edit2, Trash2 } from 'lucide-react';
import { Habit } from '../../types';
import { useState } from 'react';
import { useHabits } from '../../hooks/useHabits';

interface HabitCardProps {
  habit: Habit;
  isCompleted: boolean;
  streak: number;
  onToggle: () => void;
}

export default function HabitCard({ habit, isCompleted, streak, onToggle }: HabitCardProps) {
  const { deleteHabit, getHabitCompletionRate } = useHabits();
  const [showActions, setShowActions] = useState(false);
  const completionRate = getHabitCompletionRate(habit.id, 30);

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${habit.name}"?`)) {
      const success = await deleteHabit(habit.id);
      console.log('Delete result:', success);
      if (!success) {
        alert('Failed to delete habit. Please try again.');
      }
    }
  };

  return (
    <div
      className={`bg-white border-2 rounded-lg p-4 transition-all ${
        isCompleted
          ? 'border-emerald-300 bg-emerald-50'
          : 'border-slate-200 hover:border-emerald-200'
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start gap-4">
        <button
          onClick={onToggle}
          className={`flex-shrink-0 mt-1 transition-all ${
            isCompleted
              ? 'text-emerald-600 hover:text-emerald-700'
              : 'text-slate-300 hover:text-emerald-500'
          }`}
        >
          {isCompleted ? (
            <CheckCircle size={28} className="fill-current" />
          ) : (
            <Circle size={28} />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{habit.icon}</span>
              <h4 className={`font-semibold text-lg ${
                isCompleted ? 'text-emerald-900' : 'text-slate-800'
              }`}>
                {habit.name}
              </h4>
            </div>
            {showActions && (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleDelete}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete habit"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          {habit.description && (
            <p className="text-sm text-slate-600 mb-3">{habit.description}</p>
          )}

          {habit.goal && (
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs mb-3">
              <span>Goal: {habit.goal.title}</span>
            </div>
          )}

          <div className="flex items-center gap-4 text-sm">
            {streak > 0 && (
              <div className="flex items-center gap-1.5 text-orange-600">
                <Flame size={16} className="fill-current" />
                <span className="font-medium">{streak} day streak</span>
              </div>
            )}
            <div className="text-slate-600">
              <span className="font-medium">{completionRate}%</span>
              <span className="text-slate-500"> completion (30d)</span>
            </div>
            <div className="text-slate-500 text-xs">
              {habit.frequency === 'daily' ? 'Daily' : `${habit.target_count}x per week`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
