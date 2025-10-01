import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import { useDailyContent } from '../../hooks/useDailyContent';
import { useBadges } from '../../hooks/useBadges';
import { supabase } from '../../lib/supabase';
import { DailyEntry } from '../../types';
import DailyTip from './DailyTip';
import MorningBoost from './MorningBoost';
import EveningReflection from './EveningReflection';
import NotificationSetup from '../notifications/NotificationSetup';
import BadgeDisplay from '../badges/BadgeDisplay';
import BadgeNotification from '../badges/BadgeNotification';
import Timeline from './Timeline';
import TestimonialPrompt from '../testimonials/TestimonialPrompt';
import { useTestimonials } from '../../hooks/useTestimonials';
import { LogOut, Sun, Moon, Award, RotateCcw, Trash2 } from 'lucide-react';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { tip, quickActions, prompt, loading } = useDailyContent();
  const { badges, userBadges, loading: badgesLoading, checkAndAwardBadges, refetch: refetchBadges } = useBadges();
  const { shouldShowPrompt, dismissPrompt, handleTestimonialSubmitted } = useTestimonials();
  const [dailyEntry, setDailyEntry] = useState<DailyEntry | null>(null);
  const [actionCompleted, setActionCompleted] = useState<boolean | undefined>(undefined);
  const [userStats, setUserStats] = useState<{
    totalStars: number;
    totalCompletions: number;
    currentStreak: number;
  }>({ totalStars: 0, totalCompletions: 0, currentStreak: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [newBadges, setNewBadges] = useState<any[]>([]);
  const [showTimeline, setShowTimeline] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Determine if it's morning or evening based on time
  const getTimeOfDay = () => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 14) {
      return 'morning';
    } else {
      return 'evening';
    }
  };

  const timeOfDay = getTimeOfDay();
  const isMorning = timeOfDay === 'morning';

  useEffect(() => {
    if (user) {
      fetchDailyEntry();
      fetchUserStats();
      setTimeout(() => {
        checkAndAwardBadges();
      }, 1000);
    }
  }, [user]);

  const fetchDailyEntry = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('entry_date', today)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        setDailyEntry(data);
        setActionCompleted(data.action_completed);
      }
    } catch (error) {
      console.error('Error fetching daily entry:', error);
    }
  };

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      console.log('fetchUserStats: Starting to fetch entries...');
      const { data: entries, error } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false });

      if (error) {
        console.error('Supabase error fetching user stats:', error);
        return;
      }

      console.log('fetchUserStats: Entries found:', entries?.length || 0, entries);
      const totalStars = entries?.reduce((sum, entry) => sum + (entry.stars_earned || 0), 0) || 0;
      const totalCompletions = entries?.filter(entry => 
        entry.morning_completed && entry.evening_completed
      ).length || 0;

      let currentStreak = 0;
      const sortedEntries = entries?.sort((a, b) => 
        new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
      ) || [];

      for (const entry of sortedEntries) {
        if (entry.morning_completed && entry.evening_completed) {
          currentStreak++;
        } else {
          break;
        }
      }

      console.log('fetchUserStats: Calculated stats:', { totalStars, totalCompletions, currentStreak });
      setUserStats({ totalStars, totalCompletions, currentStreak });
    } catch (error) {
      console.error('Network error fetching user stats:', error);
      setUserStats({ totalStars: 0, totalCompletions: 0, currentStreak: 0 });
    }
  };

  const handleActionCommit = async (actionId: string) => {
    if (!user || !tip) return;

    try {
      const entryData = {
        user_id: user.id,
        entry_date: today,
        tip_id: tip.id,
        quick_action_id: actionId,
      };

      const { data, error } = await supabase
        .from('daily_entries')
        .upsert(entryData, { onConflict: 'user_id,entry_date' })
        .select()
        .single();

      if (error) throw error;

      setDailyEntry(data);
      
      await fetchUserStats();
      
      const earnedBadges = await checkAndAwardBadges();
      if (earnedBadges.length > 0) {
        setNewBadges(earnedBadges);
      }
    } catch (error) {
      console.error('Error completing action:', error);
    }
  };

  const handleActionCompletionUpdate = async (completed: boolean) => {
    if (!user) return;

    try {
      const starsToAdd = completed ? 1 : 0;
      const entryData = {
        user_id: user.id,
        entry_date: today,
        action_completed: completed,
        stars_earned: (dailyEntry?.stars_earned || 0) + starsToAdd
      };

      const { data, error } = await supabase
        .from('daily_entries')
        .upsert(entryData, { onConflict: 'user_id,entry_date' })
        .select()
        .single();

      if (error) throw error;
      setDailyEntry(data);
      setActionCompleted(completed);
      
      await fetchUserStats();
      
      const earnedBadges = await checkAndAwardBadges();
      if (earnedBadges.length > 0) {
        setNewBadges(earnedBadges);
      }
    } catch (error) {
      console.error('Error updating action completion:', error);
    }
  };

  const handleIntentionComplete = async (intention: string) => {
    if (!user) return;

    try {
      const entryData = {
        user_id: user.id,
        entry_date: today,
        morning_intention: intention,
        morning_completed: true,
        morning_completed_at: new Date().toISOString(),
        stars_earned: (dailyEntry?.stars_earned || 0) + 2
      };

      const { data, error } = await supabase
        .from('daily_entries')
        .upsert(entryData, { onConflict: 'user_id,entry_date' })
        .select()
        .single();

      if (error) throw error;
      setDailyEntry(data);
      
      await fetchUserStats();
      
      const earnedBadges = await checkAndAwardBadges();
      if (earnedBadges.length > 0) {
        setNewBadges(earnedBadges);
      }
    } catch (error) {
      console.error('Error setting intention:', error);
    }
  };

  const handleReflectionComplete = async (reflection: string, rating: number) => {
    if (!user || !prompt) return;

    try {
      const entryData = {
        user_id: user.id,
        entry_date: today,
        prompt_id: prompt.id,
        reflection_text: reflection,
        rating: rating,
        evening_completed: true,
        evening_completed_at: new Date().toISOString(),
        stars_earned: (dailyEntry?.stars_earned || 0) + 1
      };

      const { data, error } = await supabase
        .from('daily_entries')
        .upsert(entryData, { onConflict: 'user_id,entry_date' })
        .select()
        .single();

      if (error) throw error;
      setDailyEntry(data);
      
      await fetchUserStats();
      
      const earnedBadges = await checkAndAwardBadges();
      if (earnedBadges.length > 0) {
        setNewBadges(earnedBadges);
      }
    } catch (error) {
      console.error('Error completing reflection:', error);
    }
  };

  const resetTodayEntry = async () => {
    if (!user) return;
    
    if (!confirm('Reset today\'s entry? This will clear your morning intention and evening reflection.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('daily_entries')
        .delete()
        .eq('user_id', user.id)
        .eq('entry_date', today);

      if (error) throw error;

      setDailyEntry(null);
      setActionCompleted(undefined);
      // Force a refetch to ensure we get the latest state
      await fetchDailyEntry();
      await fetchUserStats();
      
      // Also refresh badges since stats changed
      await refetchBadges();
    } catch (error) {
      console.error('Error resetting today entry:', error);
    }
  };

  const resetAllBadges = async () => {
    if (!user) return;
    
    if (!confirm('Reset ALL badges? This will remove all your earned badges but keep your stars and daily entries.')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('user_badges')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error deleting user badges:', deleteError);
        throw deleteError;
      }

      setNewBadges([]);
      
      // Refresh badges first, then manually set stats to 0
      await refetchBadges();
      
      // Keep stats at 0 for badge display purposes
      setUserStats({ totalStars: 0, totalCompletions: 0, currentStreak: 0 });
      
      alert('All badges have been reset successfully!');
    } catch (error) {
      console.error('Error resetting badges:', error);
      alert('Failed to reset badges. Please try again.');
    }
  };

  const resetAllData = async () => {
    if (!user) return;
    
    if (!confirm('Reset ALL DATA? This will remove all badges, daily entries, and stars. This cannot be undone!')) {
      return;
    }

    console.log('Starting complete data reset...');

    try {
      // Delete user badges first
      const { error: badgeError } = await supabase
        .from('user_badges')
        .delete()
        .eq('user_id', user.id);

      if (badgeError) {
        console.error('Error deleting user badges:', badgeError);
        throw badgeError;
      }
      console.log('Deleted user badges');

      // Get all daily entries first to see what we're working with
      const { data: allEntries, error: fetchError } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('user_id', user.id)
        .select();

      if (fetchError) {
        console.error('Error fetching entries to delete:', fetchError);
        throw fetchError;
      }

      console.log('Found entries to delete:', allEntries?.length || 0, allEntries);

      // Delete daily entries
      const { error: entriesError } = await supabase
        .from('daily_entries')
        .delete()
        .eq('user_id', user.id);

      if (entriesError) {
        console.error('Error deleting daily entries:', entriesError);
        alert(`Failed to delete entries: ${entriesError.message}. This is likely a Row Level Security permissions issue - the database doesn't allow deleting daily entries. You may need to contact support or check the database policies.`);
        return;
      }
      
      // Verify deletion worked
      const { data: remainingEntries, error: checkError } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('user_id', user.id);
        
      if (checkError) {
        console.error('Error checking remaining entries:', checkError);
      } else {
        console.log('Remaining entries after delete:', remainingEntries?.length || 0, remainingEntries);
      }
      
      if (remainingEntries && remainingEntries.length > 0) {
        alert(`Delete failed: ${remainingEntries.length} entries still exist. This is a Row Level Security permissions issue - the database policies don't allow deleting daily entries. The reset feature cannot work without proper DELETE policies in the database.`);
        return;
      }
      
      console.log('Successfully deleted all daily entries');

      // Reset all local state
      setNewBadges([]);
      setDailyEntry(null);
      setActionCompleted(undefined);
      setUserStats({ totalStars: 0, totalCompletions: 0, currentStreak: 0 });
      console.log('Reset local state');
      
      // Refresh all data
      await refetchBadges();
      console.log('Refetched badges');
      await fetchDailyEntry();
      console.log('Refetched daily entry');
      await fetchUserStats();
      console.log('Refetched user stats');
      
      alert('All data has been reset successfully!');
    } catch (error) {
      console.error('Error resetting all data:', error);
      alert('Failed to reset all data. Please try again.');
    }
  };

  if (loading || badgesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your daily content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-ivory">
      {/* Timeline Modal */}
      {showTimeline && (
        <Timeline onClose={() => setShowTimeline(false)} />
      )}

      {/* Testimonial Prompt */}
      {shouldShowPrompt && (
        <TestimonialPrompt
          milestone={shouldShowPrompt}
          onClose={dismissPrompt}
          onSubmit={handleTestimonialSubmitted}
        />
      )}

      {/* Badge Notification */}
      {newBadges.length > 0 && (
        <BadgeNotification
          badges={newBadges}
          onClose={() => setNewBadges([])}
        />
      )}

      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <img 
                src="/logo.svg" 
                alt="The Mindful Money App" 
                className="w-12 h-12 rounded-lg shadow-sm"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">The Mindful Money App</h1>
              </div>
            </div>
            <p className="text-gray-600">Welcome back, {profile?.full_name || user?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTimeline(true)}
              className="flex items-center gap-2 px-3 py-2 bg-soft-sky/50 hover:bg-soft-sky text-muted-taupe rounded-lg transition-colors text-sm"
            >
              <Award className="w-4 h-4" />
              <span>View Timeline</span>
            </button>
            <button
              onClick={resetTodayEntry}
              className="flex items-center gap-2 px-3 py-2 bg-golden-cream hover:bg-warm-blush text-soft-clay rounded-lg transition-colors text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Today</span>
            </button>
            <button
              onClick={resetAllBadges}
              className="flex items-center gap-2 px-3 py-2 bg-warm-blush hover:bg-soft-clay/20 text-muted-taupe rounded-lg transition-colors text-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span>Reset Badges Only</span>
            </button>
            <button
              onClick={resetAllData}
              className="flex items-center gap-2 px-3 py-2 bg-soft-clay/30 hover:bg-soft-clay/50 text-muted-taupe rounded-lg transition-colors text-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span>Reset All Data</span>
            </button>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-3 py-2 bg-warm-beige hover:bg-greige rounded-lg transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Notification Setup */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
            <NotificationSetup />
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            {isMorning ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-golden-cream rounded-lg flex items-center justify-center">
                    <Sun className="w-6 h-6 text-soft-clay" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Morning Boost</h2>
                    <p className="text-gray-600">Start your day with intention and inspiration</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <MorningBoost
                    onIntentionComplete={handleIntentionComplete}
                    isCompleted={dailyEntry?.morning_completed || false}
                    intention={dailyEntry?.morning_intention}
                    committedAction={
                      dailyEntry?.quick_action_id 
                        ? quickActions.find(qa => qa.id === dailyEntry.quick_action_id)?.action_text
                        : undefined
                    }
                  />

                  {tip && (
                    <DailyTip
                      tip={tip}
                      quickActions={quickActions}
                     onActionCommit={handleActionCommit}
                     committedActionId={dailyEntry?.quick_action_id}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-opal rounded-lg flex items-center justify-center">
                    <Moon className="w-6 h-6 text-muted-taupe" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Evening Reflection</h2>
                    <p className="text-gray-600">Reflect on your progress and growth</p>
                  </div>
                </div>

                {prompt && (
                  <EveningReflection
                    prompt={prompt}
                    onComplete={handleReflectionComplete}
                    isCompleted={dailyEntry?.evening_completed || false}
                    morningIntention={dailyEntry?.morning_intention}
                    userGoals={profile?.goals}
                    completedReflection={dailyEntry?.reflection_text}
                    completedRating={dailyEntry?.rating}
                   committedAction={
                     dailyEntry?.quick_action_id 
                       ? quickActions.find(qa => qa.id === dailyEntry.quick_action_id)?.action_text
                       : undefined
                   }
                   actionCompleted={actionCompleted}
                   onActionCompletionUpdate={handleActionCompletionUpdate}
                  />
                )}
              </div>
            )}
          </div>

          {/* Progress Summary */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Progress</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-sage-green/10 rounded-lg border border-sage-green/20">
                <div className="text-2xl font-bold text-palm-green mb-1">{dailyEntry?.stars_earned || 0}</div>
                <div className="text-sm font-medium text-palm-green">Stars Earned</div>
              </div>
              <div className="text-center p-4 bg-soft-sky/30 rounded-lg border border-soft-sky/50">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {dailyEntry?.morning_completed ? '✅' : '⭕'}
                </div>
                <div className="text-sm font-medium text-muted-taupe">Intention Set</div>
              </div>
              <div className="text-center p-4 bg-opal/50 rounded-lg border border-opal">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {dailyEntry?.evening_completed ? '✅' : '⭕'}
                </div>
                <div className="text-sm font-medium text-muted-taupe">Evening Complete</div>
              </div>
            </div>
          </div>

          {/* Badges Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-golden-cream rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-soft-clay" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Your Badges</h3>
                <p className="text-gray-600">
                  {userBadges.length} of {badges.length} earned • {userStats.totalStars} total stars • {userStats.currentStreak} day streak
                </p>
              </div>
            </div>
            <BadgeDisplay badges={badges} userBadges={userBadges} userStats={userStats} />
          </div>
        </div>
      </main>
    </div>
  );
}