/*
  # Add Premium Features - Phase 1
  
  This migration adds support for premium subscriptions, premium badges, 
  multiple notification preferences, and data export tracking.

  ## 1. New Tables
  
  ### `notification_preferences`
  Stores custom notification times for premium users
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `time` (text, format: "HH:MM")
  - `message` (text, custom notification message)
  - `enabled` (boolean, whether this notification is active)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `data_exports`
  Tracks user data export requests for analytics
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `export_type` (text, 'pdf' or 'csv')
  - `date_range_start` (date, optional)
  - `date_range_end` (date, optional)
  - `created_at` (timestamptz)
  
  ## 2. Table Modifications
  
  ### `profiles`
  - Add `subscription_tier` column ('free' | 'premium'), defaults to 'free'
  - Add `subscription_started_at` (timestamptz, when premium started)
  - Add `subscription_ends_at` (timestamptz, when premium ends)
  
  ### `badges`
  - Add `tier` column ('free' | 'premium'), defaults to 'free'
  - Add `category` column for grouping badges
  
  ## 3. Security
  - Enable RLS on all new tables
  - Users can only manage their own notification preferences
  - Users can only see their own export history
  - Premium badges can only be earned by premium users
  
  ## 4. Premium Badge Definitions
  New premium-only badges are inserted with tier='premium'
  - "30 Day Premium Streak" - Complete 30 consecutive days with premium
  - "Data Conscious" - Export data 3 times
  - "Notification Master" - Set up 5 custom reminders
  - "Premium Pioneer" - First premium subscription
  - "Money Mindset Maven" - 100 day streak
*/

-- Add subscription columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_started_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_started_at timestamptz;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_ends_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_ends_at timestamptz;
  END IF;
END $$;

-- Add tier and category columns to badges table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'badges' AND column_name = 'tier'
  ) THEN
    ALTER TABLE badges ADD COLUMN tier text DEFAULT 'free' CHECK (tier IN ('free', 'premium'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'badges' AND column_name = 'category'
  ) THEN
    ALTER TABLE badges ADD COLUMN category text;
  END IF;
END $$;

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  time text NOT NULL,
  message text NOT NULL,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own notification preferences
CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own notification preferences
CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own notification preferences
CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notification preferences
CREATE POLICY "Users can delete own notification preferences"
  ON notification_preferences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Create data_exports table
CREATE TABLE IF NOT EXISTS data_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  export_type text NOT NULL CHECK (export_type IN ('pdf', 'csv')),
  date_range_start date,
  date_range_end date,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on data_exports
ALTER TABLE data_exports ENABLE ROW LEVEL SECURITY;

-- Users can view their own export history
CREATE POLICY "Users can view own export history"
  ON data_exports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own export records
CREATE POLICY "Users can insert own export records"
  ON data_exports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_data_exports_user_id ON data_exports(user_id);

-- Function to update notification_preferences updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();

-- Insert premium badge definitions
INSERT INTO badges (name, description, icon, requirement_type, requirement_value, tier, category)
VALUES 
  ('Premium Pioneer', 'Joined the premium community', '👑', 'milestone', 1, 'premium', 'subscription'),
  ('30 Day Premium Streak', 'Completed 30 consecutive days with premium', '🔥', 'streak', 30, 'premium', 'consistency'),
  ('Money Mindset Maven', 'Achieved 100 day streak', '💎', 'streak', 100, 'premium', 'consistency'),
  ('Data Conscious', 'Exported your data 3 times', '📊', 'milestone', 3, 'premium', 'data'),
  ('Notification Master', 'Set up 5 custom reminders', '🔔', 'milestone', 5, 'premium', 'customization')
ON CONFLICT DO NOTHING;