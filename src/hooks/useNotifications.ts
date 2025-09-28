import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from './useProfile';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const { user } = useAuth();
  const { profile } = useProfile();

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      
      // Listen for permission changes
      const checkPermission = () => {
        setPermission(Notification.permission);
      };
      
      // Check permission periodically in case it changed
      const interval = setInterval(checkPermission, 1000);
      
      return () => clearInterval(interval);
    }
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (permission === 'granted') {
      return true;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    
    if (result === 'granted') {
      await setupPushSubscription();
      // Force a re-check after a short delay to ensure state is updated
      setTimeout(() => {
        setPermission(Notification.permission);
      }, 100);
      return true;
    }
    
    return false;
  };

  const setupPushSubscription = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push messaging is not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        setSubscription(existingSubscription);
        return;
      }

      // Create new subscription
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          // You'll need to generate VAPID keys for production
          'BEl62iUYgUivxIkv69yViEuiBIa40HI80NqIUHI80NqIUHI80NqIUHI80NqIUHI80NqIUHI80NqI'
        )
      });

      setSubscription(newSubscription);
      
      // Store subscription in your backend
      // await storeSubscription(newSubscription);
      
    } catch (error) {
      console.error('Error setting up push subscription:', error);
    }
  };

  const scheduleNotifications = async () => {
    if (!profile || permission !== 'granted') return;

    const morningTime = profile.notification_morning || '07:00:00';
    const eveningTime = profile.notification_evening || '20:00:00';

    // Schedule morning notification
    scheduleLocalNotification(
      'The Mindful Money App',
      'Start your day with intention and inspiration! 🌅',
      morningTime
    );

    // Schedule evening notification
    scheduleLocalNotification(
      'The Mindful Money App',
      'Time to reflect on your progress today! 🌙',
      eveningTime
    );
  };

  const scheduleLocalNotification = (title: string, body: string, time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    // If the time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const timeUntilNotification = scheduledTime.getTime() - now.getTime();

    setTimeout(() => {
      if (permission === 'granted') {
        new Notification(title, {
          body,
          tag: title.toLowerCase().replace(' ', '-'),
          requireInteraction: true
        });
      }

      // Reschedule for next day
      setTimeout(() => scheduleLocalNotification(title, body, time), 24 * 60 * 60 * 1000);
    }, timeUntilNotification);
  };

  const showTestNotification = () => {
    if (permission === 'granted' && 'Notification' in window) {
      console.log('Showing test notification...');
      new Notification('Money Mindset', {
        body: 'Test notification - your notifications are working! 🎉',
        icon: '/favicon.ico',
        tag: 'test-notification',
        requireInteraction: false
      });
    } else {
      console.log('Cannot show notification. Permission:', permission, 'Notification support:', 'Notification' in window);
      alert('Notifications are not available. Permission: ' + permission);
    }
  };

  return {
    permission,
    subscription,
    requestPermission,
    scheduleNotifications,
    showTestNotification,
    isSupported: 'Notification' in window
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}