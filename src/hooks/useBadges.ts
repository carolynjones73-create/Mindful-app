import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Badge, UserBadge } from '../types';

export function useBadges() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      initializeBadges();
    }
  }, [user]);

  const initializeBadges = async () => {
    try {
      // Fetch badges and user badges
      await Promise.all([
        fetchBadges(),
        fetchUserBadges()
      ]);
    } catch (error) {
      console.error('Error initializing badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBadges = async () => {
    try {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('requirement_value', { ascending: true });

      if (error) {
        throw error;
      }
      
      setBadges(data || []);
    } catch (error) {
      console.error('Error fetching badges:', error);
    }
  };

  const fetchUserBadges = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          *,
          badges (*)
        `)
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (error) {
        throw error;
      }
      
      console.log('fetchUserBadges result:', data);
      setUserBadges(data || []);
    } catch (error) {
      console.error('Error fetching user badges:', error);
      setUserBadges([]); // Clear state on error
    } finally {
      setLoading(false);
    }
  };

  const checkAndAwardBadges = async () => {
    if (!user) return;

    try {
      // Fetch current user badges directly from database to ensure up-to-date list
      const { data: currentUserBadges, error: userBadgesError } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', user.id);

      if (userBadgesError) throw userBadgesError;

      // Get user's profile to check subscription tier
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      const isPremium = profile?.subscription_tier === 'premium';

      // Get user's stats
      const { data: entries, error: entriesError } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false });

      if (entriesError) throw entriesError;

      const stats = calculateDetailedUserStats(entries || []);
      const earnedBadgeIds = currentUserBadges?.map(ub => ub.badge_id) || [];
      const newBadges: Badge[] = [];

      // Check each badge requirement
      for (const badge of badges) {
        if (earnedBadgeIds.includes(badge.id)) continue;

        // Skip premium badges if user is not premium
        if (badge.tier === 'premium' && !isPremium) continue;

        console.log(`🔍 Checking badge: ${badge.name}`);
        console.log(`📊 Stats:`, stats);
        console.log(`🎯 Requirement: ${badge.requirement_type} >= ${badge.requirement_value}`);

        let shouldEarn = false;

        // Check specific badge requirements
        if (badge.name === 'First Steps') {
          // Should only be awarded for completing first morning intention
          shouldEarn = stats.totalMorningIntentions >= 1;
          console.log(`🌅 First Steps check: ${stats.totalMorningIntentions} >= 1 = ${shouldEarn}`);
        } else if (badge.name === 'Getting Started') {
          // Should be awarded for completing first full day
          shouldEarn = stats.totalCompletions >= 1;
          console.log(`🚀 Getting Started check: ${stats.totalCompletions} >= 1 = ${shouldEarn}`);
        } else if (badge.name === 'Premium Pioneer') {
          // Awarded immediately upon subscribing to premium
          shouldEarn = isPremium;
          console.log(`👑 Premium Pioneer check: isPremium = ${shouldEarn}`);
        } else if (badge.category === 'data') {
          // Data export badges - check export count
          const { data: exports } = await supabase
            .from('data_exports')
            .select('id')
            .eq('user_id', user.id);
          shouldEarn = (exports?.length || 0) >= badge.requirement_value;
          console.log(`📊 Data export check: ${exports?.length} >= ${badge.requirement_value} = ${shouldEarn}`);
        } else if (badge.category === 'customization') {
          // Notification customization badges
          const { data: prefs } = await supabase
            .from('notification_preferences')
            .select('id')
            .eq('user_id', user.id);
          shouldEarn = (prefs?.length || 0) >= badge.requirement_value;
          console.log(`🔔 Customization check: ${prefs?.length} >= ${badge.requirement_value} = ${shouldEarn}`);
        } else if (badge.category === 'habits') {
          // Habit-related badges
          if (badge.name === 'Multi-Tracker') {
            const { data: habits } = await supabase
              .from('habits')
              .select('id')
              .eq('user_id', user.id);
            shouldEarn = (habits?.length || 0) >= badge.requirement_value;
            console.log(`📊 Multi-Tracker check: ${habits?.length} >= ${badge.requirement_value} = ${shouldEarn}`);
          } else if (badge.requirement_type === 'streak') {
            // Check habit streaks
            const { data: habits } = await supabase
              .from('habits')
              .select('id')
              .eq('user_id', user.id);

            if (habits && habits.length > 0) {
              const { data: completions } = await supabase
                .from('habit_completions')
                .select('*')
                .eq('user_id', user.id)
                .order('completed_date', { ascending: false });

              // Calculate max streak across all habits
              let maxStreak = 0;
              for (const habit of habits) {
                const habitCompletions = (completions || [])
                  .filter(c => c.habit_id === habit.id)
                  .sort((a, b) => new Date(b.completed_date).getTime() - new Date(a.completed_date).getTime());

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

                if (streak > maxStreak) maxStreak = streak;
              }

              shouldEarn = maxStreak >= badge.requirement_value;
              console.log(`💪 Habit streak check: ${maxStreak} >= ${badge.requirement_value} = ${shouldEarn}`);
            }
          }
        } else {
          // Use general requirement logic for other badges
          switch (badge.requirement_type) {
            case 'streak':
              shouldEarn = stats.currentStreak >= badge.requirement_value;
              break;
            case 'completion':
              shouldEarn = stats.totalCompletions >= badge.requirement_value;
              break;
            case 'milestone':
              shouldEarn = stats.totalStars >= badge.requirement_value;
              break;
          }
          console.log(`⭐ General check: ${shouldEarn}`);
        }

        if (shouldEarn) {
          console.log(`🏆 Badge ${badge.name} should be earned! Stats:`, stats, 'requirement:', badge.requirement_value);
        }

        if (shouldEarn) {
          // Award the badge
          const { error: awardError } = await supabase
            .from('user_badges')
            .insert({
              user_id: user.id,
              badge_id: badge.id
            });

          if (awardError) {
            console.error('Error awarding badge:', awardError);
          } else {
            console.log('Awarded badge:', badge.name);
            newBadges.push(badge);
            // Add to earned badges list to prevent re-awarding in same execution
            earnedBadgeIds.push(badge.id);
          }
        }
      }

      if (newBadges.length > 0) {
        await fetchUserBadges();
      }

      return newBadges;
    } catch (error) {
      console.error('Error checking badges:', error);
      return [];
    }
  };

  const calculateDetailedUserStats = (entries: any[]) => {
    const totalCompletions = entries.filter(e => 
      e.morning_completed && e.evening_completed
    ).length;
    
    const totalMorningIntentions = entries.filter(e => 
      e.morning_completed
    ).length;
    
    const totalEveningReflections = entries.filter(e => 
      e.evening_completed
    ).length;
    
    const totalStars = entries.reduce((sum, e) => sum + (e.stars_earned || 0), 0);
    
    // Calculate current streak
    let currentStreak = 0;
    const sortedEntries = entries.sort((a, b) => 
      new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
    );

    for (const entry of sortedEntries) {
      if (entry.morning_completed && entry.evening_completed) {
        currentStreak++;
      } else {
        break;
      }
    }


    return {
      totalCompletions,
      totalMorningIntentions,
      totalEveningReflections,
      totalStars,
      currentStreak,
      totalEntries: entries.length
    };
  };

  return {
    badges,
    userBadges,
    loading,
    checkAndAwardBadges,
    refetch: async () => {
      await fetchBadges();
      await fetchUserBadges();
    }
  };
}