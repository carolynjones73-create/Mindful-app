import React from 'react';
import { Lightbulb, CheckCircle } from 'lucide-react';
import { Tip, QuickAction } from '../../types';

interface DailyTipProps {
  tip: Tip;
  quickActions: QuickAction[];
  onActionCommit: (actionId: string) => void;
  committedActionId?: string;
}

export default function DailyTip({ tip, quickActions, onActionCommit, committedActionId }: DailyTipProps) {
  const getThemeColor = (theme: string) => {
    switch (theme) {
      case 'money': return 'bg-sage-green/20 text-palm-green border-sage-green/30';
      case 'mindset': return 'bg-opal/50 text-muted-taupe border-opal';
      case 'progress': return 'bg-soft-sky/50 text-muted-taupe border-soft-sky';
      default: return 'bg-warm-beige text-gray-800 border-greige';
    }
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 bg-sage-green/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-6 h-6 text-palm-green" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-xl font-bold text-gray-900">{tip.title}</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getThemeColor(tip.theme)}`}>
              {tip.theme}
            </span>
          </div>
          <p className="text-gray-600 leading-relaxed">{tip.content}</p>
        </div>
      </div>

      {quickActions.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-700">Choose ONE action to focus on today:</h4>
          <p className="text-sm text-gray-600 mb-4">
            Select the action you'll commit to doing today. We'll check in with you this evening!
          </p>
          <div className="space-y-3">
            {quickActions.map((action) => {
              const isCommitted = committedActionId === action.id;
              return (
                <button
                  key={action.id}
                  onClick={() => !committedActionId && onActionCommit(action.id)}
                  disabled={!!committedActionId}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-200 ${
                    isCommitted
                      ? 'bg-sage-green/10 border-sage-green/30 text-palm-green'
                      : committedActionId
                      ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-soft-ivory border-greige text-gray-700 hover:bg-warm-beige/30 hover:border-soft-clay/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isCommitted 
                        ? 'bg-palm-green border-palm-green' 
                        : 'border-gray-400'
                    }`}>
                      {isCommitted && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`${isCommitted ? 'font-medium' : ''}`}>
                      {action.action_text}
                    </span>
                    {isCommitted && (
                      <span className="ml-auto text-sm font-medium text-palm-green">
                        ✓ Committed
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          
          {committedActionId && (
            <div className="bg-sage-green/10 border border-sage-green/30 rounded-lg p-4 mt-4">
              <p className="text-sm font-medium text-palm-green mb-2">
                🎯 Great choice! You've committed to this action.
              </p>
              <p className="text-sm text-gray-700">
                We'll check in with you this evening to see how it went. Remember, small consistent actions lead to big changes!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}