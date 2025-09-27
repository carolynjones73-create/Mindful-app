import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Target, User, ArrowRight } from 'lucide-react';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const goalOptions = [
    'Save more money',
    'Reduce spending',
    'Build an emergency fund',
    'Pay off debt',
    'Invest for the future',
    'Track expenses better',
    'Create a budget',
    'Improve financial mindset'
  ];

  const toggleGoal = (goal: string) => {
    setGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const handleComplete = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email!,
          full_name: fullName,
          goals: goals,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Show error to user instead of silently failing
      alert('There was an error setting up your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-ivory to-warm-blush flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-sage-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
            {step === 1 ? (
              <User className="w-8 h-8 text-palm-green" />
            ) : (
              <Target className="w-8 h-8 text-palm-green" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {step === 1 ? 'Welcome!' : 'Your Goals'}
          </h1>
          <p className="text-gray-600">
            {step === 1 
              ? "Let's get to know you better" 
              : 'What would you like to achieve?'
            }
          </p>
        </div>

        {step === 1 ? (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What should we call you?
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 border border-greige rounded-lg focus:ring-2 focus:ring-soft-clay focus:border-transparent"
                placeholder="Enter your name"
                required
              />
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!fullName.trim()}
              className="w-full bg-soft-clay text-white py-3 px-4 rounded-lg font-medium hover:bg-muted-taupe focus:ring-2 focus:ring-soft-clay focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Select all that apply (you can change these later):
              </p>
              <div className="space-y-2">
                {goalOptions.map((goal) => (
                  <button
                    key={goal}
                    onClick={() => toggleGoal(goal)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                      goals.includes(goal)
                        ? 'bg-sage-green/10 border-sage-green/30 text-palm-green'
                        : 'bg-white border-greige text-gray-700 hover:bg-soft-ivory'
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-warm-beige text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-greige transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                disabled={loading || goals.length === 0}
                className="flex-1 bg-soft-clay text-white py-3 px-4 rounded-lg font-medium hover:bg-muted-taupe focus:ring-2 focus:ring-soft-clay focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Setting up...' : 'Get Started'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}