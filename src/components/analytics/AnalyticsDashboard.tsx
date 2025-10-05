import { TrendingUp, Award, Flame, Star, Target, Calendar, Lock } from 'lucide-react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useSubscription } from '../../hooks/useSubscription';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsDashboard() {
  const { analytics, loading } = useAnalytics();
  const { isPremium } = useSubscription();

  if (!isPremium) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="text-emerald-600" size={24} />
          <h3 className="text-lg font-semibold text-slate-800">Advanced Analytics</h3>
        </div>

        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-6 text-center">
          <Lock className="mx-auto text-amber-600 mb-4" size={48} />
          <h4 className="font-bold text-amber-900 text-xl mb-2">Premium Feature</h4>
          <p className="text-amber-800 mb-4">
            Unlock detailed insights about your progress with charts, trends, and personalized statistics.
          </p>
          <div className="bg-white/70 rounded-lg p-4 text-left space-y-2 mb-4">
            <div className="flex items-center gap-2 text-amber-900">
              <TrendingUp size={16} className="text-emerald-600" />
              <span className="text-sm">Visual completion trends over time</span>
            </div>
            <div className="flex items-center gap-2 text-amber-900">
              <Star size={16} className="text-emerald-600" />
              <span className="text-sm">Rating distribution analysis</span>
            </div>
            <div className="flex items-center gap-2 text-amber-900">
              <Flame size={16} className="text-emerald-600" />
              <span className="text-sm">Streak tracking and best performance days</span>
            </div>
            <div className="flex items-center gap-2 text-amber-900">
              <Calendar size={16} className="text-emerald-600" />
              <span className="text-sm">Weekly and monthly progress reports</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="text-emerald-600" size={24} />
        <h3 className="text-lg font-semibold text-slate-800">Your Analytics</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-600 mb-2">
            <Target size={16} />
            <span className="text-sm">Completion Rate</span>
          </div>
          <p className="text-3xl font-bold text-emerald-600">{analytics.completionRate}%</p>
          <p className="text-xs text-slate-500 mt-1">
            {analytics.totalCompletions} of {analytics.totalDays} days
          </p>
          <p className="text-xs text-slate-400 italic mt-2">
            Morning & evening journal completion
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-600 mb-2">
            <Flame size={16} />
            <span className="text-sm">Current Streak</span>
          </div>
          <p className="text-3xl font-bold text-orange-600">{analytics.currentStreak}</p>
          <p className="text-xs text-slate-500 mt-1">
            Longest: {analytics.longestStreak} days
          </p>
          <p className="text-xs text-slate-400 italic mt-2">
            Consecutive days with journal entries
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-600 mb-2">
            <Star size={16} />
            <span className="text-sm">Total Stars</span>
          </div>
          <p className="text-3xl font-bold text-yellow-600">{analytics.totalStars}</p>
          <p className="text-xs text-slate-500 mt-1">
            Avg rating: {analytics.averageRating}
          </p>
          <p className="text-xs text-slate-400 italic mt-2">
            Combined ratings from journal entries
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-600 mb-2">
            <Award size={16} />
            <span className="text-sm">Badges Earned</span>
          </div>
          <p className="text-3xl font-bold text-purple-600">{analytics.totalBadges}</p>
          <p className="text-xs text-slate-500 mt-1">
            Best day: {analytics.bestDay}
          </p>
          <p className="text-xs text-slate-400 italic mt-2">
            Achievement milestones unlocked
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="mb-4">
          <h4 className="font-semibold text-slate-800">Weekly Journal Completion Trend</h4>
          <p className="text-xs text-slate-500 mt-1">Shows your daily journal completions over the past 7 days</p>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={analytics.weeklyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px'
              }}
            />
            <Line
              type="monotone"
              dataKey="completions"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {analytics.monthlyTrend.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="mb-4">
            <h4 className="font-semibold text-slate-800">Monthly Journal Completions</h4>
            <p className="text-xs text-slate-500 mt-1">Total journal completions per month to track long-term progress</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="completions" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="mb-4">
          <h4 className="font-semibold text-slate-800">Rating Distribution</h4>
          <p className="text-xs text-slate-500 mt-1">How you rated your habit completions (1-5 stars)</p>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={analytics.ratingDistribution} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" stroke="#64748b" fontSize={12} />
            <YAxis dataKey="rating" type="category" stroke="#64748b" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px'
              }}
            />
            <Bar dataKey="count" fill="#eab308" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="mb-4">
          <h4 className="font-semibold text-slate-800">Habit Performance</h4>
          <p className="text-xs text-slate-500 mt-1">Your most completed habits and their completion rates</p>
        </div>
        {analytics.habitStats.topHabits.length > 0 ? (
          <div className="space-y-3">
            {analytics.habitStats.topHabits.map((habit, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">{habit.name}</p>
                  <div className="mt-1 w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all"
                      style={{ width: `${habit.rate}%` }}
                    />
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <p className="text-sm font-semibold text-slate-700">{habit.rate}%</p>
                  <p className="text-xs text-slate-500">{habit.completions} times</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-4">
            Start tracking habits to see your performance metrics
          </p>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="mb-4">
          <h4 className="font-semibold text-slate-800">Weekly Habit Completions</h4>
          <p className="text-xs text-slate-500 mt-1">Total number of habits completed each day this week</p>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={analytics.habitStats.habitWeeklyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px'
              }}
            />
            <Bar dataKey="completions" fill="#10b981" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-600 mb-2">
            <Target size={16} />
            <span className="text-sm">Total Habits</span>
          </div>
          <p className="text-3xl font-bold text-slate-700">{analytics.habitStats.totalHabits}</p>
          <p className="text-xs text-slate-400 italic mt-2">
            Active habits you're tracking
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-600 mb-2">
            <Flame size={16} />
            <span className="text-sm">Habit Completion Rate</span>
          </div>
          <p className="text-3xl font-bold text-emerald-600">{analytics.habitStats.habitCompletionRate}%</p>
          <p className="text-xs text-slate-400 italic mt-2">
            Overall habit success rate
          </p>
        </div>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
        <TrendingUp className="text-emerald-600 flex-shrink-0" size={20} />
        <div>
          <h4 className="font-medium text-emerald-900 mb-1">Keep Up the Great Work!</h4>
          <p className="text-sm text-emerald-800">
            {analytics.completionRate >= 80
              ? "You're crushing it! Your consistency is impressive."
              : analytics.completionRate >= 50
              ? "You're making solid progress. Keep building that momentum!"
              : "Every day is a new opportunity. Stay committed to your journey!"}
          </p>
        </div>
      </div>
    </div>
  );
}
