import React, { useState, useEffect } from 'react';
import { Sun, Quote as QuoteIcon, Target, CheckCircle } from 'lucide-react';
import { getRandomQuote, getTipForQuote, Quote } from '../../data/quotes';

interface MorningBoostProps {
  onIntentionComplete: (intention: string) => void;
  isCompleted: boolean;
  intention?: string;
}

export default function MorningBoost({ onIntentionComplete, isCompleted, intention }: MorningBoostProps) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [tip, setTip] = useState<string>('');
  const [currentIntention, setCurrentIntention] = useState('');

  useEffect(() => {
    // Get a random quote and corresponding tip
    const randomQuote = getRandomQuote();
    setQuote(randomQuote);
    setTip(getTipForQuote(randomQuote));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentIntention.trim()) {
      onIntentionComplete(currentIntention);
    }
  };

  const getThemeColors = (category: string) => {
    switch (category) {
      case 'money': return 'bg-green-50 border-green-200 text-green-800';
      case 'mindset': return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'progress': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  if (isCompleted && intention) {
    return (
      <div className="bg-gradient-to-br from-sage-green/10 to-palm-green/10 rounded-lg border border-sage-green/30 p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-sage-green/20 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-palm-green" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Morning Intention Set</h3>
            <p className="text-palm-green">You're ready to tackle the day!</p>
          </div>
        </div>
        <div className="bg-white/80 rounded-lg p-4 border border-sage-green/30">
          <p className="text-sm font-medium text-palm-green mb-2">Your intention for today:</p>
          <p className="text-gray-900 italic text-lg font-serif">"{intention}"</p>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Inspiring Quote */}
      <div className={`rounded-lg p-6 border ${getThemeColors(quote.category)}`}>
        <div className="flex items-start gap-4">
          <QuoteIcon className="w-6 h-6 mt-1 flex-shrink-0 opacity-60" />
          <div>
            <blockquote className="text-lg font-medium mb-3 leading-relaxed font-serif italic">
              "{quote.text}"
            </blockquote>
            <cite className="text-base font-semibold">— {quote.author}</cite>
          </div>
        </div>
      </div>

      {/* Actionable Tip */}
      <div className="bg-gradient-to-br from-golden-cream to-warm-blush rounded-lg p-6 border border-golden-cream">
        <h4 className="text-lg font-bold text-soft-clay mb-3">💡 Today's Tip:</h4>
        <p className="text-gray-900 leading-relaxed">{tip}</p>
      </div>

      {/* Intention Setting */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 border space-y-4">
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-3">
            <Target className="w-5 h-5 inline mr-2" />
            What's your main intention or focus for today?
          </label>
          <textarea
            value={currentIntention}
            onChange={(e) => setCurrentIntention(e.target.value)}
            className="w-full px-4 py-3 border border-greige rounded-lg focus:ring-2 focus:ring-soft-clay focus:border-transparent resize-none"
            rows={4}
            placeholder="Based on today's inspiration, I intend to focus on..."
            required
          />
        </div>

        <button
          type="submit"
          disabled={!currentIntention.trim()}
          className="w-full bg-gradient-to-r from-soft-clay to-muted-taupe text-white py-3 px-6 rounded-lg font-semibold hover:from-muted-taupe hover:to-soft-clay focus:ring-2 focus:ring-soft-clay focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          Set My Intention
        </button>
      </form>
    </div>
  );
}