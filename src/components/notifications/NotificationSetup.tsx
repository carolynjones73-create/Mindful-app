import React, { useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { Bell, BellOff, TestTube, CheckCircle, AlertCircle } from 'lucide-react';

export default function NotificationSetup() {
  const { permission, requestPermission, scheduleNotifications, showTestNotification, isSupported } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      const granted = await requestPermission();
      if (granted) {
        await scheduleNotifications();
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (permission) {
      case 'granted':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'denied':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Bell className="w-6 h-6 text-gray-600" />;
    }
  };

  const getStatusText = () => {
    switch (permission) {
      case 'granted':
        return 'Notifications enabled';
      case 'denied':
        return 'Notifications blocked';
      default:
        return 'Notifications not set up';
    }
  };

  const getStatusColor = () => {
    switch (permission) {
      case 'granted':
        return 'bg-sage-green/10 border-sage-green/30';
      case 'denied':
        return 'bg-warm-blush border-soft-clay/30';
      default:
        return 'bg-golden-cream border-golden-cream';
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-warm-beige/30 rounded-2xl p-8 border border-greige shadow-lg">
        <div className="flex items-center gap-4">
          <BellOff className="w-6 h-6 text-gray-400" />
          <div>
            <p className="text-lg font-medium text-gray-700">Notifications not supported</p>
            <p className="text-base text-gray-500">Your browser doesn't support notifications</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-3xl p-8 border shadow-xl ${getStatusColor()}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-6">
          {getStatusIcon()}
          <div>
            <p className="text-xl font-semibold text-slate-900 tracking-wide">{getStatusText()}</p>
            <p className="text-lg text-slate-600 font-medium">
              {permission === 'granted' 
                ? 'You\'ll receive daily reminders at 7 AM and 8 PM'
                : 'Get reminded for your daily intentions and reflections'
              }
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        {permission !== 'granted' && (
          <button
            onClick={handleEnableNotifications}
            disabled={isLoading || permission === 'denied'}
            className="flex items-center gap-3 px-8 py-5 bg-gradient-to-r from-soft-clay to-muted-taupe text-white text-lg font-semibold rounded-2xl hover:from-muted-taupe hover:to-soft-clay disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl tracking-wide"
          >
            <Bell className="w-5 h-5" />
            {isLoading ? 'Setting up...' : 'Enable Notifications'}
          </button>
        )}

        {permission === 'granted' && (
          <button
            onClick={showTestNotification}
            className="flex items-center gap-3 px-8 py-5 bg-gradient-to-r from-muted-taupe to-soft-clay text-white text-lg font-semibold rounded-2xl hover:from-soft-clay hover:to-muted-taupe transition-all duration-200 shadow-lg hover:shadow-xl tracking-wide"
            title="Click to test if notifications are working"
          >
            <TestTube className="w-5 h-5" />
            Test Notification
          </button>
        )}

        {permission === 'denied' && (
          <p className="text-lg text-red-600 font-medium">
            Please enable notifications in your browser settings to receive reminders
          </p>
        )}
      </div>
    </div>
  );
}