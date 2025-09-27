import React, { useEffect, useState } from 'react';
import { Badge } from '../../types';
import { Award, X, Star } from 'lucide-react';

interface BadgeNotificationProps {
  badges: Badge[];
  onClose: () => void;
}

export default function BadgeNotification({ badges, onClose }: BadgeNotificationProps) {
  const [currentBadgeIndex, setCurrentBadgeIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (badges.length === 0) return;

    // Auto-advance through badges every 3 seconds
    const timer = setInterval(() => {
      setCurrentBadgeIndex((prev) => {
        if (prev >= badges.length - 1) {
          // All badges shown, close notification
          setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }, 1000);
          return prev;
        }
        return prev + 1;
      });
    }, 3000);

    return () => clearInterval(timer);
  }, [badges.length, onClose]);

  if (!isVisible || badges.length === 0) return null;

  const currentBadge = badges[currentBadgeIndex];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center animate-in fade-in zoom-in duration-300">
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Award className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Badge Earned! 🎉</h2>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{currentBadge.name}</h3>
          <p className="text-gray-600 text-sm">{currentBadge.description}</p>
        </div>

        {badges.length > 1 && (
          <div className="flex justify-center gap-2 mb-4">
            {badges.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentBadgeIndex ? 'bg-purple-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}

        <div className="text-xs text-gray-500">
          {badges.length > 1 && currentBadgeIndex < badges.length - 1
            ? `${currentBadgeIndex + 1} of ${badges.length} new badges`
            : 'Keep up the great work!'
          }
        </div>
      </div>
    </div>
  );
}