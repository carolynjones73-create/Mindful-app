import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

export function useSubscription() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const isPremium = (): boolean => {
    if (!profile) return false;

    const now = new Date();

    // Check if user is in trial period
    if (profile.trial_ends_at) {
      const trialEnds = new Date(profile.trial_ends_at);
      if (now < trialEnds) {
        return true;
      }
    }

    // Check if user has active premium subscription
    if (profile.subscription_tier !== 'premium') return false;

    if (profile.subscription_ends_at) {
      const endsAt = new Date(profile.subscription_ends_at);
      return now < endsAt;
    }

    return true;
  };

  const getTrialDaysRemaining = (): number | null => {
    if (!profile?.trial_ends_at) return null;

    const now = new Date();
    const trialEnds = new Date(profile.trial_ends_at);

    if (now >= trialEnds) return null;

    const diffTime = trialEnds.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isOnTrial = (): boolean => {
    if (!profile?.trial_ends_at) return false;

    const now = new Date();
    const trialEnds = new Date(profile.trial_ends_at);

    return now < trialEnds;
  };

  const checkAccess = (feature: string): boolean => {
    const premiumFeatures = [
      'custom_ai_prompts',
      'advanced_analytics',
      'data_export',
      'multiple_reminders',
      'premium_badges',
      'money_coach',
      'habit_tracking'
    ];

    if (!premiumFeatures.includes(feature)) {
      return true;
    }

    return isPremium();
  };

  const getMaxReminders = (): number => {
    return isPremium() ? 5 : 2;
  };

  const canExportData = (): boolean => {
    return isPremium();
  };

  return {
    profile,
    loading,
    isPremium: isPremium(),
    isOnTrial: isOnTrial(),
    trialDaysRemaining: getTrialDaysRemaining(),
    checkAccess,
    getMaxReminders,
    canExportData,
    refetch: fetchProfile
  };
}
