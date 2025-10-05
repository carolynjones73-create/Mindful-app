import { Calendar, ExternalLink } from 'lucide-react';
import { Coach } from '../../types';

interface SessionBookingPromptProps {
  coach: Coach;
  messageCount: number;
  messageLimit: number;
}

export default function SessionBookingPrompt({ coach, messageCount, messageLimit }: SessionBookingPromptProps) {
  const messagesRemaining = messageLimit - messageCount;
  const isAtLimit = messageCount >= messageLimit;

  if (!coach.calendly_url) {
    return null;
  }

  if (isAtLimit) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Calendar className="text-blue-600" size={24} />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-blue-900 text-lg mb-2">
              Message Limit Reached
            </h4>
            <p className="text-blue-800 mb-4">
              You've used all {messageLimit} messages included with your premium plan. Ready for a deeper dive?
            </p>
            <p className="text-blue-800 mb-4">
              Book a 1-on-1 session with {coach.name.split(' ')[0]} to get personalized guidance and unlock unlimited messaging for the month.
            </p>
            <a
              href={coach.calendly_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <Calendar size={20} />
              Book Your Session
              <ExternalLink size={16} />
            </a>
            <p className="text-xs text-blue-700 mt-3">
              Sessions are paid separately and include unlimited messaging for 30 days
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (messagesRemaining <= 3) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Calendar className="text-amber-600 flex-shrink-0" size={20} />
          <div className="flex-1">
            <p className="text-sm text-amber-900 mb-2">
              <strong>Only {messagesRemaining} message{messagesRemaining !== 1 ? 's' : ''} remaining</strong> in your monthly allowance.
            </p>
            <p className="text-sm text-amber-800 mb-3">
              Want unlimited messaging? Book a 1-on-1 session with {coach.name.split(' ')[0]}.
            </p>
            <a
              href={coach.calendly_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-amber-700 hover:text-amber-900 font-semibold text-sm"
            >
              View Available Times
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
