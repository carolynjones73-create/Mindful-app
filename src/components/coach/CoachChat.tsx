import { useState, useEffect } from 'react';
import { MessageCircle, Send, Lock, User } from 'lucide-react';
import { useSubscription } from '../../hooks/useSubscription';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { CoachMessage, Coach } from '../../types';
import SessionBookingPrompt from './SessionBookingPrompt';

export default function CoachChat() {
  const { isPremium } = useSubscription();
  const { user } = useAuth();
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [coach, setCoach] = useState<Coach | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [messageLimit, setMessageLimit] = useState(10);

  const isAtLimit = messageCount >= messageLimit;

  useEffect(() => {
    if (user && isPremium) {
      fetchCoachAndMessages();
    }
  }, [user, isPremium]);

  const fetchCoachAndMessages = async () => {
    if (!user) return;

    try {
      const { data: assignment } = await supabase
        .from('coach_assignments')
        .select('*, coach:coaches(*)')
        .eq('user_id', user.id)
        .maybeSingle();

      if (assignment?.coach) {
        setCoach(assignment.coach);
        setMessageCount(assignment.message_count || 0);
        setMessageLimit(assignment.message_limit || 10);

        const { data: msgs } = await supabase
          .from('coach_messages')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        setMessages(msgs || []);
      }
    } catch (error) {
      console.error('Error fetching coach data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !coach) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('coach_messages')
        .insert({
          user_id: user.id,
          coach_id: coach.id,
          message: newMessage,
          sender_type: 'user',
        });

      if (error) throw error;

      const { error: updateError } = await supabase
        .from('coach_assignments')
        .update({ message_count: messageCount + 1 })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setNewMessage('');
      await fetchCoachAndMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  if (!isPremium) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <MessageCircle className="text-emerald-600" size={24} />
          <h3 className="text-lg font-semibold text-slate-800">Money Coach Chat</h3>
        </div>

        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-6 text-center">
          <Lock className="mx-auto text-amber-600 mb-4" size={48} />
          <h4 className="font-bold text-amber-900 text-xl mb-2">Premium Feature</h4>
          <p className="text-amber-800 mb-4">
            Get personalized guidance from a certified money coach. Ask questions, get accountability, and transform your financial life.
          </p>
          <div className="bg-white/70 rounded-lg p-4 text-left space-y-2 mb-4">
            <div className="flex items-center gap-2 text-amber-900">
              <MessageCircle size={16} className="text-emerald-600" />
              <span className="text-sm">Direct messaging with certified coaches</span>
            </div>
            <div className="flex items-center gap-2 text-amber-900">
              <MessageCircle size={16} className="text-emerald-600" />
              <span className="text-sm">24-48 hour response time</span>
            </div>
            <div className="flex items-center gap-2 text-amber-900">
              <MessageCircle size={16} className="text-emerald-600" />
              <span className="text-sm">Personalized financial guidance</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!coach) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <MessageCircle className="text-emerald-600" size={24} />
          <h3 className="text-lg font-semibold text-slate-800">Money Coach Chat</h3>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
          <p className="text-slate-600">
            You don't have a coach assigned yet. Contact support to get matched with a money coach.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-4">
        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
          <User className="text-emerald-600" size={24} />
        </div>
        <div>
          <h4 className="font-semibold text-slate-800">{coach.name}</h4>
          <p className="text-sm text-slate-600">{coach.bio}</p>
        </div>
      </div>

      <SessionBookingPrompt
        coach={coach}
        messageCount={messageCount}
        messageLimit={messageLimit}
      />

      <div className="bg-white border border-slate-200 rounded-lg p-6 h-96 flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              <MessageCircle className="mx-auto mb-2 text-slate-300" size={48} />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    msg.sender_type === 'user'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(msg.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isAtLimit && handleSend()}
            placeholder={isAtLimit ? "Message limit reached. Book a session to continue." : "Type your message..."}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            disabled={sending || isAtLimit}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending || isAtLimit}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <strong>Response Time:</strong> Your coach typically responds within 24-48 hours. For urgent financial matters, please contact a professional financial advisor.
      </div>
    </div>
  );
}
