import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { NotificationPreference } from '../types';

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .order('time', { ascending: true });

      if (error) throw error;
      setPreferences(data || []);
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPreference = async (time: string, message: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: user.id,
          time,
          message,
          enabled: true
        });

      if (error) throw error;
      await fetchPreferences();
      return true;
    } catch (error) {
      console.error('Error adding notification preference:', error);
      return false;
    }
  };

  const updatePreference = async (
    id: string,
    updates: Partial<Pick<NotificationPreference, 'time' | 'message' | 'enabled'>>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await fetchPreferences();
      return true;
    } catch (error) {
      console.error('Error updating notification preference:', error);
      return false;
    }
  };

  const deletePreference = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchPreferences();
      return true;
    } catch (error) {
      console.error('Error deleting notification preference:', error);
      return false;
    }
  };

  const togglePreference = async (id: string, enabled: boolean): Promise<boolean> => {
    return updatePreference(id, { enabled });
  };

  return {
    preferences,
    loading,
    addPreference,
    updatePreference,
    deletePreference,
    togglePreference,
    refetch: fetchPreferences
  };
}
