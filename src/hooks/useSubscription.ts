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

    if (profile.subscription_tier !== 'premium') return false;

    if (profile.subscription_ends_at) {
      const endsAt = new Date(profile.subscription_ends_at);
      const now = new Date();
      return now < endsAt;
    }

    return true;
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
    checkAccess,
    getMaxReminders,
    canExportData,
    refetch: fetchProfile
  };
}
