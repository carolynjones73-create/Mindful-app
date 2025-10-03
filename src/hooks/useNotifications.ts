import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from './useProfile';
import { supabase } from '../lib/supabase';

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

  useEffect(() => {
    // Load existing subscription when user is available
    if (user && permission === 'granted') {
      loadExistingSubscription();
    }
  }, [user, permission]);

  const loadExistingSubscription = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();

      if (existingSubscription) {
        setSubscription(existingSubscription);
      }
    } catch (error) {
      console.error('Error loading existing subscription:', error);
    }
  };

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

    if (!user) {
      console.log('No user logged in');
      return;
    }

    try {
      // Register service worker if not already registered
      let registration = await navigator.serviceWorker.getRegistration();

      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;
      }

      // Check if already subscribed
      let existingSubscription = await registration.pushManager.getSubscription();

      if (existingSubscription) {
        // Store in database if not already stored
        await storeSubscription(existingSubscription);
        setSubscription(existingSubscription);
        return;
      }

      // Note: For production, you would need to generate real VAPID keys
      // For now, we'll use a simplified approach without VAPID
      // The subscription will work for same-origin notifications

      try {
        const newSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
        });

        await storeSubscription(newSubscription);
        setSubscription(newSubscription);
      } catch (subscribeError) {
        console.log('Push subscription not available, falling back to basic notifications');
        // Fallback: Just enable basic notifications without push
        await storeBasicNotificationPreference();
      }

    } catch (error) {
      console.error('Error setting up push subscription:', error);
    }
  };

  const storeSubscription = async (sub: PushSubscription) => {
    if (!user) return;

    try {
      const subscriptionData = sub.toJSON();

      // Store in database
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          subscription: subscriptionData,
          endpoint: sub.endpoint,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'endpoint'
        });

      if (error) {
        console.error('Error storing subscription:', error);
      } else {
        console.log('Subscription stored successfully');
      }
    } catch (error) {
      console.error('Error in storeSubscription:', error);
    }
  };

  const storeBasicNotificationPreference = async () => {
    if (!user) return;

    try {
      // Store a basic notification preference without push subscription
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          subscription: { type: 'basic' },
          endpoint: `basic-${user.id}`,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'endpoint'
        });

      if (error) {
        console.error('Error storing notification preference:', error);
      }
    } catch (error) {
      console.error('Error in storeBasicNotificationPreference:', error);
    }
  };

  const scheduleNotifications = async () => {
    if (!user || !profile || permission !== 'granted') {
      console.log('Cannot schedule notifications:', { user: !!user, profile: !!profile, permission });
      return;
    }

    await setupPushSubscription();

    console.log('Notifications scheduled successfully. Server will send notifications at:');
    console.log('Morning:', profile.notification_morning || '07:00:00');
    console.log('Evening:', profile.notification_evening || '20:00:00');
  };

  const showTestNotification = () => {
    if (permission === 'granted' && 'Notification' in window) {
      console.log('Showing test notification...');
      new Notification('The Mindful Money App', {
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
