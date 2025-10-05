import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { Coach } from '../types';

interface CoachAuthContextType {
  user: User | null;
  coach: Coach | null;
  loading: boolean;
  isCoach: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const CoachAuthContext = createContext<CoachAuthContextType | undefined>(undefined);

export function CoachAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [coach, setCoach] = useState<Coach | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCoachProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCoachProfile(session.user.id);
      } else {
        setCoach(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchCoachProfile = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (profile?.role === 'coach') {
        const { data: coachData } = await supabase
          .from('coaches')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        setCoach(coachData);
      } else {
        setCoach(null);
      }
    } catch (error) {
      console.error('Error fetching coach profile:', error);
      setCoach(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setCoach(null);
  };

  const value = {
    user,
    coach,
    loading,
    isCoach: !!coach,
    signIn,
    signOut
  };

  return (
    <CoachAuthContext.Provider value={value}>
      {children}
    </CoachAuthContext.Provider>
  );
}

export function useCoachAuth() {
  const context = useContext(CoachAuthContext);
  if (context === undefined) {
    throw new Error('useCoachAuth must be used within a CoachAuthProvider');
  }
  return context;
}
