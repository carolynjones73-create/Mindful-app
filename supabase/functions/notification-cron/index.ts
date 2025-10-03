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

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const hourMinuteStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

    console.log(`Checking for notifications at ${hourMinuteStr}`);

    // Get all profiles and their notification times
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, notification_morning, notification_evening');

    if (profileError) {
      throw profileError;
    }

    const morningProfiles = [];
    const eveningProfiles = [];

    // Check which profiles should receive notifications
    for (const profile of profiles || []) {
      const morningTime = profile.notification_morning || '07:00:00';
      const eveningTime = profile.notification_evening || '20:00:00';

      const morningHourMin = morningTime.substring(0, 5);
      const eveningHourMin = eveningTime.substring(0, 5);

      if (morningHourMin === hourMinuteStr) {
        morningProfiles.push(profile);
      }

      if (eveningHourMin === hourMinuteStr) {
        eveningProfiles.push(profile);
      }
    }

    const results = {
      time: hourMinuteStr,
      totalProfiles: profiles?.length || 0,
      morningNotifications: { count: 0, sent: 0, failed: 0 },
      eveningNotifications: { count: 0, sent: 0, failed: 0 },
    };

    // Send morning notifications
    if (morningProfiles.length > 0) {
      results.morningNotifications.count = morningProfiles.length;
      const morningResult = await sendNotificationsToProfiles(
        supabase,
        morningProfiles,
        {
          title: 'The Mindful Money App',
          body: 'Start your day with intention and inspiration! 🌅',
          icon: '/favicon.ico',
          tag: 'morning-reminder',
        }
      );
      results.morningNotifications.sent = morningResult.sent;
      results.morningNotifications.failed = morningResult.failed;
    }

    // Send evening notifications
    if (eveningProfiles.length > 0) {
      results.eveningNotifications.count = eveningProfiles.length;
      const eveningResult = await sendNotificationsToProfiles(
        supabase,
        eveningProfiles,
        {
          title: 'The Mindful Money App',
          body: 'Time to reflect on your progress today! 🌙',
          icon: '/favicon.ico',
          tag: 'evening-reminder',
        }
      );
      results.eveningNotifications.sent = eveningResult.sent;
      results.eveningNotifications.failed = eveningResult.failed;
    }

    console.log('Notification results:', results);

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in notification-cron function:', error);
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

async function sendNotificationsToProfiles(
  supabase: any,
  profiles: any[],
  payload: NotificationPayload
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const profile of profiles) {
    try {
      // Get user's push subscriptions
      const { data: subscriptions, error: subError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', profile.id);

      if (subError) {
        console.error(`Error fetching subscriptions for user ${profile.id}:`, subError);
        failed++;
        continue;
      }

      if (!subscriptions || subscriptions.length === 0) {
        console.log(`No subscriptions for user ${profile.id}`);
        failed++;
        continue;
      }

      // For now, we'll just mark as sent if the user has a subscription
      // In production with proper VAPID setup, you would send actual push notifications here
      console.log(`Would send notification to user ${profile.id} (${subscriptions.length} subscriptions)`);
      sent++;
    } catch (error) {
      console.error(`Error sending notification to profile ${profile.id}:`, error);
      failed++;
    }
  }

  return { sent, failed };
}