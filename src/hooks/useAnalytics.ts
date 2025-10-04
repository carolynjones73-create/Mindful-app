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

      const analyticsData = calculateAnalytics(entries || [], badges?.length || 0);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (entries: any[], badgeCount: number): AnalyticsData => {
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
      totalDays
    };
  };

  return {
    analytics,
    loading,
    refetch: fetchAnalytics
  };
}
