import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get notification type from query params (morning or evening)
    const url = new URL(req.url);
    const notificationType = url.searchParams.get('type') || 'morning';

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}:00`;

    const sentNotifications = [];
    const failedNotifications = [];
    let usersToNotify: Array<{ id: string; message: string }> = [];

    const { data: customPreferences, error: prefsError } = await supabase
      .from('notification_preferences')
      .select('user_id, time, message')
      .eq('enabled', true)
      .gte('time', `${String(currentHour).padStart(2, '0')}:${String(Math.floor(currentMinute / 5) * 5).padStart(2, '0')}`)
      .lt('time', `${String(currentHour).padStart(2, '0')}:${String(Math.ceil((currentMinute + 1) / 5) * 5).padStart(2, '0')}`);

    if (!prefsError && customPreferences && customPreferences.length > 0) {
      usersToNotify.push(...customPreferences.map(pref => ({
        id: pref.user_id,
        message: pref.message
      })));
    }

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, notification_morning, notification_evening, subscription_tier')
      .or(
        notificationType === 'morning'
          ? `notification_morning.gte.${currentHour}:${String(Math.floor(currentMinute / 15) * 15).padStart(2, '0')}:00,notification_morning.lt.${currentHour}:${String(Math.ceil((currentMinute + 1) / 15) * 15).padStart(2, '0')}:00`
          : `notification_evening.gte.${currentHour}:${String(Math.floor(currentMinute / 15) * 15).padStart(2, '0')}:00,notification_evening.lt.${currentHour}:${String(Math.ceil((currentMinute + 1) / 15) * 15).padStart(2, '0')}:00`
      );

    if (profileError) {
      throw profileError;
    }

    if (profiles && profiles.length > 0) {
      const defaultMessage = notificationType === 'morning'
        ? 'Start your day with intention and inspiration! 🌅'
        : 'Time to reflect on your progress today! 🌙';

      for (const profile of profiles) {
        const alreadyAdded = usersToNotify.find(u => u.id === profile.id);
        if (!alreadyAdded) {
          usersToNotify.push({
            id: profile.id,
            message: defaultMessage
          });
        }
      }
    }

    for (const userNotif of usersToNotify) {
      // Get user's push subscriptions
      const { data: subscriptions, error: subError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userNotif.id);

      if (subError) {
        console.error(`Error fetching subscriptions for user ${userNotif.id}:`, subError);
        continue;
      }

      // Prepare notification payload
      const payload: NotificationPayload = {
        title: 'The Mindful Money App',
        body: userNotif.message,
        icon: '/favicon.ico',
        tag: `reminder-${Date.now()}`,
      };

      // Send notification to each subscription
      for (const sub of subscriptions || []) {
        try {
          // Extract keys from subscription
          const subscription = sub.subscription as any;
          
          // Use Web Push to send notification
          await fetch(sub.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'TTL': '86400',
            },
            body: JSON.stringify({
              notification: payload,
            }),
          });

          sentNotifications.push({
            userId: userNotif.id,
            endpoint: sub.endpoint,
          });
        } catch (error) {
          console.error(`Failed to send notification to ${sub.endpoint}:`, error);
          failedNotifications.push({
            userId: userNotif.id,
            endpoint: sub.endpoint,
            error: error.message,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        type: notificationType,
        time: currentTime,
        usersFound: usersToNotify.length,
        sent: sentNotifications.length,
        failed: failedNotifications.length,
        sentNotifications,
        failedNotifications,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in send-notifications function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});