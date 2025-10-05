import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, User } from 'lucide-react';
import { useCoachAuth } from '../../contexts/CoachAuthContext';
import { supabase } from '../../lib/supabase';
import { CoachMessage } from '../../types';

interface CoachMessagesProps {
  userId: string;
  onBack: () => void;
}

export default function CoachMessages({ userId, onBack }: CoachMessagesProps) {
  const { coach } = useCoachAuth();
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userProfile, setUserProfile] = useState<{ email: string; full_name: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUserProfile();
    fetchMessages();
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchUserProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .maybeSingle();

    setUserProfile(data);
  };

  const fetchMessages = async () => {
    if (!coach) return;

    try {
      const { data: msgs } = await supabase
        .from('coach_messages')
        .select('*')
        .eq('user_id', userId)
        .eq('coach_id', coach.id)
        .order('created_at', { ascending: true });

      setMessages(msgs || []);

      const unreadMessages = (msgs || []).filter(
        m => m.sender_type === 'user' && !m.read
      );

      if (unreadMessages.length > 0) {
        await supabase
          .from('coach_messages')
          .update({ read: true })
          .eq('user_id', userId)
          .eq('coach_id', coach.id)
          .eq('sender_type', 'user')
          .eq('read', false);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !coach) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('coach_messages')
        .insert({
          user_id: userId,
          coach_id: coach.id,
          message: newMessage,
          sender_type: 'coach',
        });

      if (error) throw error;

      setNewMessage('');
      await fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
            <User className="text-slate-600" size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">
              {userProfile?.full_name || userProfile?.email}
            </h2>
            <p className="text-sm text-slate-600">{userProfile?.email}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-6">
        <div className="bg-white border border-slate-200 rounded-lg h-[calc(100vh-200px)] flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-slate-500 py-12">
                <p>No messages yet</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_type === 'coach' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-3 ${
                      msg.sender_type === 'coach'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(msg.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-200 p-4">
            <div className="flex gap-2">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type your response..."
                className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                rows={3}
                disabled={sending}
              />
              <button
                onClick={handleSend}
                disabled={!newMessage.trim() || sending}
                className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end"
              >
                <Send size={20} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Press Enter to send, Shift + Enter for new line
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
