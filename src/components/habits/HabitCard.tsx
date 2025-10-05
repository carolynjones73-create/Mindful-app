import { CheckCircle, Circle, Flame, CreditCard as Edit2, Trash2, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Habit } from '../../types';
import { useState } from 'react';
import { useHabits } from '../../contexts/HabitsContext';

interface HabitCardProps {
  habit: Habit;
  isCompleted: boolean;
  streak: number;
  onToggle: () => void;
}

export default function HabitCard({ habit, isCompleted, streak, onToggle }: HabitCardProps) {
  const { deleteHabit, getHabitCompletionRate, getLast7Days, getMonthData } = useHabits();
  const [showActions, setShowActions] = useState(false);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  const completionRate = getHabitCompletionRate(habit.id, 30);
  const last7Days = getLast7Days(habit.id);
  const monthData = getMonthData(habit.id, currentDate.getFullYear(), currentDate.getMonth());

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${habit.name}"?`)) {
      const success = await deleteHabit(habit.id);
      console.log('Delete result:', success);
      if (!success) {
        alert('Failed to delete habit. Please try again.');
      }
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
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

          <div className="mb-4 pb-4 border-b border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    viewMode === 'week'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    viewMode === 'month'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Month
                </button>
              </div>
              {viewMode === 'month' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="p-1 hover:bg-slate-100 rounded transition-colors"
                  >
                    <ChevronLeft size={16} className="text-slate-600" />
                  </button>
                  <span className="text-xs font-medium text-slate-700 min-w-[100px] text-center">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </span>
                  <button
                    onClick={() => navigateMonth('next')}
                    className="p-1 hover:bg-slate-100 rounded transition-colors"
                  >
                    <ChevronRight size={16} className="text-slate-600" />
                  </button>
                </div>
              )}
            </div>

            {viewMode === 'week' ? (
              <div className="flex items-center justify-between gap-2">
                {last7Days.map((day) => (
                  <div key={day.date} className="flex flex-col items-center gap-1">
                    <span className="text-xs font-medium text-slate-500">
                      {day.dayLabel}
                    </span>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        day.isCompleted
                          ? 'bg-emerald-500 ring-2 ring-emerald-200'
                          : day.isToday
                          ? 'bg-slate-100 ring-2 ring-slate-300'
                          : 'bg-slate-100'
                      }`}
                      title={day.date}
                    >
                      {day.isCompleted && (
                        <div className="w-3 h-3 bg-white rounded-full" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {dayHeaders.map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-slate-500 py-1">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {monthData.flat().map((day, index) => (
                    <div
                      key={`${day.date}-${index}`}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] transition-all ${
                        day.isCompleted
                          ? 'bg-emerald-500 text-white font-medium ring-1 ring-emerald-200'
                          : day.isToday
                          ? 'bg-slate-100 ring-1 ring-slate-300 font-medium'
                          : day.isCurrentMonth
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-slate-50 text-slate-400'
                      }`}
                      title={day.date}
                    >
                      {day.day}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

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
