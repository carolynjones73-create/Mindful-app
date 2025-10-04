import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { jsPDF } from 'jspdf';

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

  const exportToPDF = async (dateRangeStart?: string, dateRangeEnd?: string): Promise<boolean> => {
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

      const doc = new jsPDF();
      let yPos = 20;

      doc.setFontSize(20);
      doc.text('Mindful Money Journey Report', 105, yPos, { align: 'center' });
      yPos += 10;

      doc.setFontSize(10);
      doc.text(
        `Generated on ${new Date().toLocaleDateString()}`,
        105,
        yPos,
        { align: 'center' }
      );
      yPos += 15;

      doc.setFontSize(14);
      doc.text('Summary', 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      const completedEntries = (entries || []).filter(
        e => e.morning_completed && e.evening_completed
      ).length;
      const totalStars = (entries || []).reduce((sum, e) => sum + (e.stars_earned || 0), 0);

      doc.text(`Total Days Tracked: ${entries?.length || 0}`, 20, yPos);
      yPos += 6;
      doc.text(`Completed Days: ${completedEntries}`, 20, yPos);
      yPos += 6;
      doc.text(`Total Stars Earned: ${totalStars}`, 20, yPos);
      yPos += 6;
      doc.text(`Badges Earned: ${userBadges?.length || 0}`, 20, yPos);
      yPos += 15;

      if (userBadges && userBadges.length > 0) {
        doc.setFontSize(14);
        doc.text('Badges', 20, yPos);
        yPos += 8;

        doc.setFontSize(10);
        userBadges.forEach((ub: any) => {
          if (ub.badges) {
            if (yPos > 270) {
              doc.addPage();
              yPos = 20;
            }
            doc.text(`${ub.badges.name} - ${ub.badges.description}`, 20, yPos);
            yPos += 6;
          }
        });
        yPos += 10;
      }

      if (entries && entries.length > 0) {
        doc.addPage();
        yPos = 20;

        doc.setFontSize(14);
        doc.text('Daily Entries', 20, yPos);
        yPos += 10;

        doc.setFontSize(9);
        entries.forEach((entry: any) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFont(undefined, 'bold');
          doc.text(new Date(entry.entry_date).toLocaleDateString(), 20, yPos);
          yPos += 6;

          doc.setFont(undefined, 'normal');
          if (entry.morning_intention) {
            doc.text(`Intention: ${entry.morning_intention.substring(0, 80)}`, 20, yPos);
            yPos += 5;
          }
          if (entry.reflection_text) {
            doc.text(`Reflection: ${entry.reflection_text.substring(0, 80)}`, 20, yPos);
            yPos += 5;
          }
          if (entry.rating) {
            doc.text(`Rating: ${'⭐'.repeat(entry.rating)}`, 20, yPos);
            yPos += 5;
          }
          yPos += 3;
        });
      }

      doc.save(`mindful-money-report-${new Date().toISOString().split('T')[0]}.pdf`);

      await supabase.from('data_exports').insert({
        user_id: user.id,
        export_type: 'pdf',
        date_range_start: dateRangeStart || null,
        date_range_end: dateRangeEnd || null
      });

      return true;
    } catch (err) {
      console.error('Error exporting to PDF:', err);
      setError(err instanceof Error ? err.message : 'Failed to export PDF');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    exportToCSV,
    exportToPDF,
    getExportHistory
  };
}
