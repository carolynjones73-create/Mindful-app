# Notification System Setup

The app now has a server-side notification system that will send scheduled notifications to users at their chosen times.

## How It Works

1. When users enable notifications, their push subscription is stored in the `push_subscriptions` table
2. The `notification-cron` Edge Function runs every minute to check for users who should receive notifications
3. Notifications are sent based on each user's `notification_morning` and `notification_evening` times in their profile

## Setting Up the Cron Job

To make notifications work, you need to trigger the `notification-cron` Edge Function every minute. Here are your options:

### Option 1: External Cron Service (Recommended for Production)

Use a service like [cron-job.org](https://cron-job.org) or [EasyCron](https://www.easycron.com):

1. Create a free account
2. Set up a cron job to run every minute
3. Use this URL: `https://[your-project-id].supabase.co/functions/v1/notification-cron`
4. Schedule: `* * * * *` (every minute)

### Option 2: GitHub Actions (Free)

Create `.github/workflows/notifications.yml`:

```yaml
name: Send Notifications
on:
  schedule:
    - cron: '* * * * *'
  workflow_dispatch:

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Notification Function
        run: |
          curl -X POST https://[your-project-id].supabase.co/functions/v1/notification-cron
```

### Option 3: Supabase pg_cron (Advanced)

If you have access to Supabase's pg_cron extension:

```sql
SELECT cron.schedule(
  'send-notifications',
  '* * * * *',
  $$
  SELECT net.http_post(
    url:='https://[your-project-id].supabase.co/functions/v1/notification-cron',
    headers:='{"Content-Type": "application/json"}'::jsonb
  );
  $$
);
```

## Testing Notifications

1. Enable notifications in the app
2. Set your morning/evening notification times in settings
3. Use the "Test Notification" button to verify notifications work
4. Check the browser console for confirmation messages
5. Manually trigger the cron function to test scheduled notifications:
   ```bash
   curl -X POST https://[your-project-id].supabase.co/functions/v1/notification-cron
   ```

## Database Tables

### push_subscriptions
Stores user notification preferences and push subscriptions:
- `user_id`: References the user
- `subscription`: Push subscription data (JSONB)
- `endpoint`: Unique push endpoint
- `created_at` / `updated_at`: Timestamps

## Edge Functions

### notification-cron
- Runs every minute via external cron
- Checks all users' notification times
- Sends notifications to users whose time matches current time
- Returns statistics about sent/failed notifications

### send-notifications (deprecated)
- Manual trigger option
- Can be called with `?type=morning` or `?type=evening`

## Current Limitations

1. **VAPID Keys**: For production Web Push notifications, you'll need to generate VAPID keys
2. **Service Worker**: Basic service worker is included but may need customization
3. **Timezone**: Currently uses server timezone. Consider adding user timezone support
4. **Mobile Apps**: For native mobile apps, consider integrating FCM (Firebase Cloud Messaging)

## Future Enhancements

- Add timezone support for international users
- Implement notification delivery tracking
- Add notification history/logs
- Support for custom notification messages
- Batch notification sending for performance
- Integration with mobile push services (FCM, APNs)
