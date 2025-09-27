import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Tip, QuickAction, Prompt } from '../types';

export function useDailyContent() {
  const [tip, setTip] = useState<Tip | null>(null);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDailyContent();
  }, []);

  const fetchDailyContent = async () => {
    try {
      // Fetch random active tip
      const { data: tips, error: tipsError } = await supabase
        .from('tips')
        .select('*')
        .eq('is_active', true);

      if (tipsError) throw tipsError;

      if (tips && tips.length > 0) {
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        setTip(randomTip);

        // Fetch quick actions for this tip
        const { data: actions, error: actionsError } = await supabase
          .from('quick_actions')
          .select('*')
          .eq('tip_id', randomTip.id);

        if (actionsError) throw actionsError;
        setQuickActions(actions || []);
      }

      // Fetch random active prompt
      const { data: prompts, error: promptsError } = await supabase
        .from('prompts')
        .select('*')
        .eq('is_active', true);

      if (promptsError) throw promptsError;

      if (prompts && prompts.length > 0) {
        const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
        setPrompt(randomPrompt);
      }
    } catch (error) {
      console.error('Error fetching daily content:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    tip,
    quickActions,
    prompt,
    loading,
    refetch: fetchDailyContent
  };
}