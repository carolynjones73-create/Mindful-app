import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useHabits } from '../../contexts/HabitsContext';

const HABIT_COLORS = [
  { bg: 'bg-blue-500', ring: 'ring-blue-200', text: 'text-blue-500' },
  { bg: 'bg-purple-500', ring: 'ring-purple-200', text: 'text-purple-500' },
  { bg: 'bg-pink-500', ring: 'ring-pink-200', text: 'text-pink-500' },
  { bg: 'bg-orange-500', ring: 'ring-orange-200', text: 'text-orange-500' },
  { bg: 'bg-teal-500', ring: 'ring-teal-200', text: 'text-teal-500' },
  { bg: 'bg-cyan-500', ring: 'ring-cyan-200', text: 'text-cyan-500' },
  { bg: 'bg-rose-500', ring: 'ring-rose-200', text: 'text-rose-500' },
  { bg: 'bg-amber-500', ring: 'ring-amber-200', text: 'text-amber-500' },
  { bg: 'bg-lime-500', ring: 'ring-lime-200', text: 'text-lime-500' },
  { bg: 'bg-indigo-500', ring: 'ring-indigo-200', text: 'text-indigo-500' },
];

export default function MonthlyCalendar() {
  const { habits, getMonthData } = useHabits();
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const monthData = habits.length > 0
    ? getMonthData(habits[0].id, currentDate.getFullYear(), currentDate.getMonth())
    : [];

  const getDayCompletions = (dateString: string) => {
    return habits
      .map((habit, index) => ({
        habit,
        isCompleted: getMonthData(habit.id, currentDate.getFullYear(), currentDate.getMonth())
          .flat()
          .find(d => d.date === dateString)?.isCompleted || false,
        color: HABIT_COLORS[index % HABIT_COLORS.length]
      }))
      .filter(item => item.isCompleted);
  };

  if (habits.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="text-center text-slate-500">
          <p className="text-sm">Add some habits to see your monthly progress</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-slate-800">Monthly Overview</h3>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="text-slate-600" />
          </button>
          <span className="text-base font-medium text-slate-700 min-w-[150px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronRight size={20} className="text-slate-600" />
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {dayHeaders.map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-slate-600">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {monthData.flat().map((day, index) => {
            const completions = getDayCompletions(day.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isToday = day.date === today.toISOString().split('T')[0];

            return (
              <div
                key={`${day.date}-${index}`}
                className={`aspect-square rounded-md border flex flex-col items-center justify-center gap-0.5 transition-all ${
                  isToday
                    ? 'border-emerald-400 bg-emerald-50'
                    : day.isCurrentMonth
                    ? 'border-slate-200 bg-white hover:bg-slate-50'
                    : 'border-slate-100 bg-slate-50'
                }`}
              >
                <div className={`text-[10px] font-medium ${
                  day.isCurrentMonth ? 'text-slate-700' : 'text-slate-400'
                }`}>
                  {day.day}
                </div>
                {completions.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 justify-center max-w-[30px]">
                    {completions.slice(0, 4).map((completion, idx) => (
                      <div
                        key={idx}
                        className={`w-2 h-2 rounded-full ${completion.color.bg}`}
                        title={completion.habit.name}
                      />
                    ))}
                    {completions.length > 4 && (
                      <div className="text-[7px] text-slate-500 font-medium">
                        +{completions.length - 4}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Habits</h4>
        <div className="grid grid-cols-2 gap-2">
          {habits.map((habit, index) => {
            const color = HABIT_COLORS[index % HABIT_COLORS.length];
            return (
              <div key={habit.id} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${color.bg} flex-shrink-0`} />
                <span className="text-sm text-slate-700 truncate flex items-center gap-1.5">
                  <span>{habit.icon}</span>
                  <span>{habit.name}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
