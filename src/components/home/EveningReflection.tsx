import React, { useState } from 'react';
import { Moon, Star } from 'lucide-react';
import { Prompt } from '../../types';

interface EveningReflectionProps {
  prompt: Prompt;
  onComplete: (reflection: string, rating: number) => void;
  isCompleted: boolean;
  morningIntention?: string;
  userGoals?: string[];
  completedReflection?: string;
  completedRating?: number;
  committedAction?: string;
  actionCompleted?: boolean;
  onActionCompletionUpdate?: (completed: boolean) => void;
}

export default function EveningReflection({ 
  prompt, 
  onComplete, 
  isCompleted, 
  morningIntention, 
  userGoals,
  completedReflection,
  completedRating
  committedAction,
  actionCompleted,
  onActionCompletionUpdate
}: EveningReflectionProps) {
  const [reflection, setReflection] = useState('');
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);

  const getConversationalPrompts = () => {
    const goalMapping: { [key: string]: string } = {
      'Save more money': 'saving money',
      'Reduce spending': 'reducing your spending',
      'Build an emergency fund': 'building your emergency fund',
      'Pay off debt': 'paying off debt',
      'Invest for the future': 'investing for your future',
      'Track expenses better': 'tracking your expenses',
      'Create a budget': 'creating your budget',
      'Improve financial mindset': 'improving your financial mindset'
    };

    if (morningIntention) {
      return {
        greeting: "Hey there! Let's reflect on your day together.",
        mainPrompt: `Earlier today, you set an intention to focus on: "${morningIntention}". How did that go for you?`,
        followUp: [
          "What moments today made you feel proud of your progress?",
          "Was there anything that made it challenging to stick to your intention?",
          "What's one thing you learned about yourself today?"
        ]
      };
    } else {
      const goalText = userGoals && userGoals.length > 0 
        ? `working on ${userGoals.slice(0, 2).map(goal => goalMapping[goal] || goal.toLowerCase()).join(' and ')}`
        : 'your financial journey';
      
      return {
        greeting: "No worries about missing the morning intention - life happens!",
        mainPrompt: `Let's still take a moment to reflect. How did your day go with ${goalText}?`,
        followUp: [
          "What's one small win you can celebrate from today?",
          "Did anything happen today that moved you closer to your goals?",
          "What's on your mind as you wrap up the day?"
        ]
      };
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reflection.trim() && rating > 0) {
      onComplete(reflection, rating);
    }
  };

  if (isCompleted) {
    return (
      <div className="bg-gradient-to-br from-opal to-soft-sky rounded-lg border border-opal p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-opal rounded-lg flex items-center justify-center">
            <Moon className="w-6 h-6 text-muted-taupe" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Thanks for sharing!</h3>
            <p className="text-muted-taupe">Your reflection helps you grow. See you tomorrow! 🌟</p>
          </div>
        </div>
        
        {completedReflection && (
          <div className="bg-white/80 rounded-lg p-4 border border-opal mb-4">
            <p className="text-sm font-medium text-muted-taupe mb-2">Your reflection:</p>
            <p className="text-gray-900 mb-3 italic font-serif">"{completedReflection}"</p>
            
            {completedRating && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-taupe">Your day rating:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= completedRating
                          ? 'text-golden-cream fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-taupe">({completedRating}/5)</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  const prompts = getConversationalPrompts();

  return (
    <div className="bg-white rounded-lg border p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Action Follow-up */}
        {committedAction && onActionCompletionUpdate && (
          <div className="bg-golden-cream/30 rounded-lg p-4 border border-golden-cream">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">
              🎯 Action Check-in
            </h4>
            <p className="text-gray-700 mb-4">
              This morning you committed to: <strong>"{committedAction}"</strong>
            </p>
            <div className="flex items-center gap-4">
              <span className="text-gray-700 font-medium">Did you complete this action?</span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => onActionCompletionUpdate(true)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    actionCompleted === true
                      ? 'bg-green-100 text-green-800 border-2 border-green-300'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-green-50'
                  }`}
                >
                  ✅ Yes, I did it!
                </button>
                <button
                  type="button"
                  onClick={() => onActionCompletionUpdate(false)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    actionCompleted === false
                      ? 'bg-orange-100 text-orange-800 border-2 border-orange-300'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-orange-50'
                  }`}
                >
                  ❌ Not this time
                </button>
              </div>
            </div>
            {actionCompleted === true && (
              <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-green-800 font-medium">🎉 Awesome! You followed through on your commitment!</p>
              </div>
            )}
            {actionCompleted === false && (
              <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-orange-800">That's okay! Every attempt is progress. What did you learn?</p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          <div className="bg-opal/50 rounded-lg p-4 border border-opal">
            <p className="text-gray-900 font-medium mb-3">{prompts.mainPrompt}</p>
            <div className="space-y-2">
              {prompts.followUp.map((question, index) => (
                <p key={index} className="text-sm text-muted-taupe flex items-start gap-2">
                  <span className="text-greige mt-1">•</span>
                  {question}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-3">
            Share whatever's on your mind - there's no right or wrong answer:
          </label>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            className="w-full px-4 py-3 border border-greige rounded-lg focus:ring-2 focus:ring-muted-taupe focus:border-transparent resize-none"
            rows={5}
            placeholder="I felt... Today I... Tomorrow I want to... or just share what's on your mind!"
            required
          />
        </div>

        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-3">
            How are you feeling about today? (1 = rough day, 5 = amazing day)
          </label>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-2 transition-all duration-200 hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoveredRating || rating)
                      ? 'text-golden-cream fill-current'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>Tough day</span>
            <span>Amazing day</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={!reflection.trim() || rating === 0}
          className="w-full bg-gradient-to-r from-muted-taupe to-soft-clay text-white py-3 px-6 rounded-lg font-semibold hover:from-soft-clay hover:to-muted-taupe focus:ring-2 focus:ring-muted-taupe focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          Share My Reflection
        </button>
      </form>
    </div>
  );
}