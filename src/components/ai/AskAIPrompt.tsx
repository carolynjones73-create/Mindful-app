import { useState } from 'react';
import { Brain, Sparkles, Lock, Loader } from 'lucide-react';
import { useSubscription } from '../../hooks/useSubscription';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function AskAIPrompt() {
  const { isPremium } = useSubscription();
  const { user } = useAuth();
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!question.trim() || !user) return;

    setLoading(true);
    setError('');
    setResponse('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-ai-prompt`;

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate prompt');
      }

      setResponse(data.prompt);
    } catch (err) {
      console.error('Error generating AI prompt:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate prompt');
    } finally {
      setLoading(false);
    }
  };

  if (!isPremium) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Brain className="text-emerald-600" size={24} />
          <h3 className="text-lg font-semibold text-slate-800">Ask AI</h3>
        </div>

        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-6 text-center">
          <Lock className="mx-auto text-amber-600 mb-4" size={48} />
          <h4 className="font-bold text-amber-900 text-xl mb-2">Premium Feature</h4>
          <p className="text-amber-800 mb-4">
            Get personalized reflection prompts powered by AI based on your financial goals and current challenges.
          </p>
          <div className="bg-white/70 rounded-lg p-4 text-left space-y-2 mb-4">
            <div className="flex items-center gap-2 text-amber-900">
              <Sparkles size={16} className="text-emerald-600" />
              <span className="text-sm">Contextual prompts based on your goals</span>
            </div>
            <div className="flex items-center gap-2 text-amber-900">
              <Sparkles size={16} className="text-emerald-600" />
              <span className="text-sm">Personalized reflection questions</span>
            </div>
            <div className="flex items-center gap-2 text-amber-900">
              <Sparkles size={16} className="text-emerald-600" />
              <span className="text-sm">Break through money mindset blocks</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Brain className="text-emerald-600" size={24} />
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Ask AI for a Custom Prompt</h3>
          <p className="text-sm text-slate-600">
            Get personalized reflection questions based on your money journey
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            What would you like to reflect on?
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., I'm struggling with impulse purchases. Can you give me a prompt to reflect on why I do this?"
            rows={4}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            disabled={loading}
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={!question.trim() || loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? (
            <>
              <Loader className="animate-spin" size={20} />
              Generating...
            </>
          ) : (
            <>
              <Sparkles size={20} />
              Generate Prompt
            </>
          )}
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {response && (
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="text-emerald-600" size={20} />
              <h4 className="font-semibold text-slate-800">Your Custom Prompt</h4>
            </div>
            <p className="text-slate-700 text-lg leading-relaxed italic">{response}</p>
            <p className="text-xs text-slate-500 mt-4">
              Use this prompt in your next morning or evening reflection
            </p>
          </div>
        )}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <h4 className="font-medium text-slate-800 mb-2">Tips for Better Prompts</h4>
        <ul className="text-sm text-slate-600 space-y-1">
          <li>• Be specific about what you're struggling with</li>
          <li>• Mention your current financial goals</li>
          <li>• Share emotions or patterns you've noticed</li>
          <li>• Ask for prompts that dig deeper into your "why"</li>
        </ul>
      </div>
    </div>
  );
}
