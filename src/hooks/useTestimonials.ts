import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface TestimonialData {
  id: string;
  user_id: string;
  milestone_days: number;
  rating: number;
  testimonial_text: string;
  allow_public_use: boolean;
  submitted_at: string;
}

export function useTestimonials() {
  const [shouldShowPrompt, setShouldShowPrompt] = useState<7 | 30 | 90 | null>(null);
  const [userTestimonials, setUserTestimonials] = useState<TestimonialData[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      checkForMilestonePrompt();
      fetchUserTestimonials();
    }
  }, [user]);

  const fetchUserTestimonials = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setUserTestimonials(data || []);
    } catch (error) {
      console.error('Error fetching user testimonials:', error);
    }
  };

  const checkForMilestonePrompt = async () => {
    if (!user) return;

    try {
      // Get user's daily entries to calculate streak/days
      const { data: entries, error } = await supabase
        .from('daily_entries')
        .select('entry_date, morning_completed, evening_completed')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false });

      if (error) throw error;

      // Calculate completed days (both morning and evening)
      const completedDays = entries?.filter(entry => 
        entry.morning_completed && entry.evening_completed
      ).length || 0;

      // Get existing testimonials to avoid duplicate prompts
      const { data: testimonials, error: testimonialsError } = await supabase
        .from('testimonials')
        .select('milestone_days')
        .eq('user_id', user.id);

      if (testimonialsError) throw testimonialsError;

      const submittedMilestones = testimonials?.map(t => t.milestone_days) || [];

      // Check for milestone eligibility
      if (completedDays >= 90 && !submittedMilestones.includes(90)) {
        setShouldShowPrompt(90);
      } else if (completedDays >= 30 && !submittedMilestones.includes(30)) {
        setShouldShowPrompt(30);
      } else if (completedDays >= 7 && !submittedMilestones.includes(7)) {
        setShouldShowPrompt(7);
      }
    } catch (error) {
      console.error('Error checking milestone prompt:', error);
    }
  };

  const dismissPrompt = () => {
    setShouldShowPrompt(null);
  };

  const handleTestimonialSubmitted = () => {
    setShouldShowPrompt(null);
    fetchUserTestimonials();
  };

  return {
    shouldShowPrompt,
    userTestimonials,
    dismissPrompt,
    handleTestimonialSubmitted,
    refetch: checkForMilestonePrompt
  };
}