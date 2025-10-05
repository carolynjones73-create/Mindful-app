import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface AnalyticsData {
  totalCompletions: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  totalStars: number;
  averageRating: number;
  totalBadges: number;
  weeklyTrend: Array<{ date: string; completions: number }>;
  monthlyTrend: Array<{ month: string; completions: number }>;
  ratingDistribution: Array<{ rating: number; count: number }>;
  bestDay: string;
  totalDays: number;
  habitStats: {
    totalHabits: number;
    totalHabitCompletions: number;
    habitCompletionRate: number;
    topHabits: Array<{ name: string; completions: number; rate: number }>;
    habitWeeklyTrend: Array<{ date: string; completions: number }>;
  };
}

export function useAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      const { data: entries, error } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false });

      if (error) throw error;

      const { data: badges, error: badgesError } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', user.id);

      if (badgesError) throw badgesError;

      const { data: habits, error: habitsError } = await supabase
        .from('habits')
        .select('id, name')
        .eq('user_id', user.id);

      if (habitsError) throw habitsError;

      const { data: habitCompletions, error: completionsError } = await supabase
        .from('habit_completions')
        .select('habit_id, completed_date')
        .eq('user_id', user.id)
        .order('completed_date', { ascending: false });

      if (completionsError) throw completionsError;

      const analyticsData = calculateAnalytics(
        entries || [],
        badges?.length || 0,
        habits || [],
        habitCompletions || []
      );
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (
    entries: any[],
    badgeCount: number,
    habits: any[],
    habitCompletions: any[]
  ): AnalyticsData => {
    const completedEntries = entries.filter(
      e => e.morning_completed && e.evening_completed
    );

    const totalCompletions = completedEntries.length;
    const totalDays = entries.length;
    const completionRate = totalDays > 0 ? Math.round((totalCompletions / totalDays) * 100) : 0;

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const sortedEntries = [...entries].sort(
      (a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
    );

    for (let i = 0; i < sortedEntries.length; i++) {
      const entry = sortedEntries[i];
      if (entry.morning_completed && entry.evening_completed) {
        tempStreak++;
        if (i === 0) currentStreak = tempStreak;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        if (i === 0) currentStreak = 0;
        tempStreak = 0;
      }
    }

    const totalStars = entries.reduce((sum, e) => sum + (e.stars_earned || 0), 0);

    const ratingsData = entries.filter(e => e.rating);
    const averageRating = ratingsData.length > 0
      ? Math.round(
          (ratingsData.reduce((sum, e) => sum + e.rating, 0) / ratingsData.length) * 10
        ) / 10
      : 0;

    const last7Days = sortedEntries.slice(0, 7).reverse();
    const weeklyTrend = last7Days.map(entry => ({
      date: new Date(entry.entry_date).toLocaleDateString('en-US', { weekday: 'short' }),
      completions: entry.morning_completed && entry.evening_completed ? 1 : 0
    }));

    const monthlyData: { [key: string]: number } = {};
    entries.forEach(entry => {
      const month = new Date(entry.entry_date).toLocaleDateString('en-US', { month: 'short' });
      if (!monthlyData[month]) monthlyData[month] = 0;
      if (entry.morning_completed && entry.evening_completed) {
        monthlyData[month]++;
      }
    });

    const monthlyTrend = Object.entries(monthlyData).map(([month, completions]) => ({
      month,
      completions
    }));

    const ratingCounts: { [key: number]: number } = {};
    ratingsData.forEach(entry => {
      const rating = entry.rating;
      ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
    });

    const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: ratingCounts[rating] || 0
    }));

    const dayOfWeekCounts: { [key: string]: number } = {};
    completedEntries.forEach(entry => {
      const day = new Date(entry.entry_date).toLocaleDateString('en-US', { weekday: 'long' });
      dayOfWeekCounts[day] = (dayOfWeekCounts[day] || 0) + 1;
    });

    let bestDay = 'N/A';
    let maxCount = 0;
    Object.entries(dayOfWeekCounts).forEach(([day, count]) => {
      if (count > maxCount) {
        maxCount = count;
        bestDay = day;
      }
    });

    const totalHabits = habits.length;
    const totalHabitCompletions = habitCompletions.length;

    const totalPossibleHabitCompletions = totalHabits * totalDays;
    const habitCompletionRate = totalPossibleHabitCompletions > 0
      ? Math.round((totalHabitCompletions / totalPossibleHabitCompletions) * 100)
      : 0;

    const habitCompletionsByHabit: { [key: string]: { name: string; count: number } } = {};
    habits.forEach(habit => {
      habitCompletionsByHabit[habit.id] = { name: habit.name, count: 0 };
    });

    habitCompletions.forEach(completion => {
      if (habitCompletionsByHabit[completion.habit_id]) {
        habitCompletionsByHabit[completion.habit_id].count++;
      }
    });

    const topHabits = Object.entries(habitCompletionsByHabit)
      .map(([habitId, data]) => ({
        name: data.name,
        completions: data.count,
        rate: totalDays > 0 ? Math.round((data.count / totalDays) * 100) : 0
      }))
      .sort((a, b) => b.completions - a.completions)
      .slice(0, 5);

    const last7DaysHabits: { [key: string]: number } = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last7DaysHabits[dateStr] = 0;
    }

    habitCompletions.forEach(completion => {
      const dateStr = completion.completed_date;
      if (last7DaysHabits.hasOwnProperty(dateStr)) {
        last7DaysHabits[dateStr]++;
      }
    });

    const habitWeeklyTrend = Object.entries(last7DaysHabits).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      completions: count
    }));

    return {
      totalCompletions,
      completionRate,
      currentStreak,
      longestStreak,
      totalStars,
      averageRating,
      totalBadges: badgeCount,
      weeklyTrend,
      monthlyTrend,
      ratingDistribution,
      bestDay,
      totalDays,
      habitStats: {
        totalHabits,
        totalHabitCompletions,
        habitCompletionRate,
        topHabits,
        habitWeeklyTrend
      }
    };
  };

  return {
    analytics,
    loading,
    refetch: fetchAnalytics
  };
}
