import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Habit, HabitCompletion, Goal } from '../types';

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAll();
    }
  }, [user]);

  const fetchAll = async () => {
    await Promise.all([
      fetchGoals(),
      fetchHabits(),
      fetchCompletions()
    ]);
    setLoading(false);
  };

  const fetchGoals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  const fetchHabits = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*, goal:goals(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHabits(data || []);
    } catch (error) {
      console.error('Error fetching habits:', error);
    }
  };

  const fetchCompletions = async (days: number = 90) => {
    if (!user) return;

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', user.id)
        .gte('completed_date', startDate.toISOString().split('T')[0])
        .order('completed_date', { ascending: false });

      if (error) throw error;
      setCompletions(data || []);
    } catch (error) {
      console.error('Error fetching habit completions:', error);
    }
  };

  const addGoal = async (title: string, description?: string, targetDate?: string): Promise<Goal | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          title,
          description,
          target_date: targetDate || null,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;
      await fetchGoals();
      return data;
    } catch (error) {
      console.error('Error adding goal:', error);
      return null;
    }
  };

  const updateGoal = async (id: string, updates: Partial<Goal>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await fetchGoals();
      return true;
    } catch (error) {
      console.error('Error updating goal:', error);
      return false;
    }
  };

  const deleteGoal = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchGoals();
      return true;
    } catch (error) {
      console.error('Error deleting goal:', error);
      return false;
    }
  };

  const addHabit = async (
    name: string,
    goalId?: string,
    description?: string,
    frequency: 'daily' | 'weekly' = 'daily',
    targetCount: number = 1,
    icon: string = '✓'
  ): Promise<Habit | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          goal_id: goalId || null,
          name,
          description,
          frequency,
          target_count: targetCount,
          icon
        })
        .select()
        .single();

      if (error) throw error;
      await fetchHabits();
      return data;
    } catch (error) {
      console.error('Error adding habit:', error);
      return null;
    }
  };

  const updateHabit = async (id: string, updates: Partial<Habit>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('habits')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await fetchHabits();
      return true;
    } catch (error) {
      console.error('Error updating habit:', error);
      return false;
    }
  };

  const deleteHabit = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchHabits();
      return true;
    } catch (error) {
      console.error('Error deleting habit:', error);
      return false;
    }
  };

  const completeHabit = async (habitId: string, date?: string, note?: string): Promise<boolean> => {
    if (!user) return false;

    const completedDate = date || new Date().toISOString().split('T')[0];

    try {
      const { error } = await supabase
        .from('habit_completions')
        .insert({
          user_id: user.id,
          habit_id: habitId,
          completed_date: completedDate,
          note: note || null
        });

      if (error) throw error;
      await fetchCompletions();
      return true;
    } catch (error) {
      console.error('Error completing habit:', error);
      return false;
    }
  };

  const uncompleteHabit = async (habitId: string, date?: string): Promise<boolean> => {
    const completedDate = date || new Date().toISOString().split('T')[0];

    try {
      const { error } = await supabase
        .from('habit_completions')
        .delete()
        .eq('habit_id', habitId)
        .eq('completed_date', completedDate);

      if (error) throw error;
      await fetchCompletions();
      return true;
    } catch (error) {
      console.error('Error uncompleting habit:', error);
      return false;
    }
  };

  const isHabitCompleted = (habitId: string, date?: string): boolean => {
    const checkDate = date || new Date().toISOString().split('T')[0];
    return completions.some(
      c => c.habit_id === habitId && c.completed_date === checkDate
    );
  };

  const getHabitStreak = (habitId: string): number => {
    const habitCompletions = completions
      .filter(c => c.habit_id === habitId)
      .sort((a, b) => new Date(b.completed_date).getTime() - new Date(a.completed_date).getTime());

    if (habitCompletions.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < habitCompletions.length; i++) {
      const completionDate = new Date(habitCompletions[i].completed_date);
      completionDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - streak);

      if (completionDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const getHabitCompletionRate = (habitId: string, days: number = 30): number => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const relevantCompletions = completions.filter(c => {
      if (c.habit_id !== habitId) return false;
      const completionDate = new Date(c.completed_date);
      return completionDate >= startDate;
    });

    return Math.round((relevantCompletions.length / days) * 100);
  };

  return {
    habits,
    goals,
    completions,
    loading,
    addGoal,
    updateGoal,
    deleteGoal,
    addHabit,
    updateHabit,
    deleteHabit,
    completeHabit,
    uncompleteHabit,
    isHabitCompleted,
    getHabitStreak,
    getHabitCompletionRate,
    refetch: fetchAll
  };
}
