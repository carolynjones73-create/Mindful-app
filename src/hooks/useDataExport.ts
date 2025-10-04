import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export function useDataExport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const exportToCSV = async (dateRangeStart?: string, dateRangeEnd?: string): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('daily_entries')
        .select(`
          *,
          tips (*),
          prompts (*),
          quick_actions (*)
        `)
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false });

      if (dateRangeStart) {
        query = query.gte('entry_date', dateRangeStart);
      }
      if (dateRangeEnd) {
        query = query.lte('entry_date', dateRangeEnd);
      }

      const { data: entries, error: entriesError } = await query;
      if (entriesError) throw entriesError;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      const { data: userBadges, error: badgesError } = await supabase
        .from('user_badges')
        .select('*, badges (*)')
        .eq('user_id', user.id);

      if (badgesError) throw badgesError;

      const csvRows: string[] = [];
      csvRows.push(
        'Date,Morning Completed,Morning Intention,Action Completed,Evening Completed,Reflection,Rating,Stars Earned,Tip Title,Quick Action'
      );

      (entries || []).forEach(entry => {
        const row = [
          entry.entry_date || '',
          entry.morning_completed ? 'Yes' : 'No',
          (entry.morning_intention || '').replace(/"/g, '""'),
          entry.action_completed ? 'Yes' : 'No',
          entry.evening_completed ? 'Yes' : 'No',
          (entry.reflection_text || '').replace(/"/g, '""'),
          entry.rating || '',
          entry.stars_earned || 0,
          entry.tips?.title || '',
          entry.quick_actions?.action_text || ''
        ];
        csvRows.push(row.map(val => `"${val}"`).join(','));
      });

      csvRows.push('');
      csvRows.push('BADGES EARNED');
      csvRows.push('Badge Name,Description,Earned At');
      (userBadges || []).forEach(ub => {
        if (ub.badges) {
          csvRows.push(`"${ub.badges.name}","${ub.badges.description}","${ub.earned_at}"`);
        }
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mindful-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      await supabase.from('data_exports').insert({
        user_id: user.id,
        export_type: 'csv',
        date_range_start: dateRangeStart || null,
        date_range_end: dateRangeEnd || null
      });

      return true;
    } catch (err) {
      console.error('Error exporting to CSV:', err);
      setError(err instanceof Error ? err.message : 'Failed to export data');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getExportHistory = async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('data_exports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching export history:', err);
      return [];
    }
  };

  return {
    loading,
    error,
    exportToCSV,
    getExportHistory
  };
}
