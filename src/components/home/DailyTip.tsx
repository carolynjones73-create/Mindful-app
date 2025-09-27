import React from 'react';
import { Lightbulb, CheckCircle } from 'lucide-react';
import { Tip, QuickAction } from '../../types';

interface DailyTipProps {
  tip: Tip;
  quickActions: QuickAction[];
  onActionComplete: (actionId: string) => void;
  completedActions: string[];
}

export default function DailyTip({ tip, quickActions, onActionComplete, completedActions }: DailyTipProps) {
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
          <h4 className="text-lg font-semibold text-gray-700">Quick Actions:</h4>
          <div className="space-y-3">
            {quickActions.map((action) => {
              const isCompleted = completedActions.includes(action.id);
              return (
                <button
                  key={action.id}
                  onClick={() => !isCompleted && onActionComplete(action.id)}
                  disabled={isCompleted}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-200 ${
                    isCompleted
                      ? 'bg-sage-green/10 border-sage-green/30 text-palm-green'
                      : 'bg-soft-ivory border-greige text-gray-700 hover:bg-warm-beige/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className={`w-5 h-5 ${isCompleted ? 'text-palm-green' : 'text-gray-400'}`} />
                    <span className={`${isCompleted ? 'line-through' : ''}`}>{action.action_text}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}