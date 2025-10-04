/*
  # Add Premium Trial Support

  1. Changes
    - Add `trial_started_at` column to profiles table
    - Add `trial_ends_at` column to profiles table
    - Add `trial_notified` column to track if user was notified about trial ending
  
  2. Notes
    - Trial starts when user completes onboarding
    - Trial lasts 30 days from signup
    - Users get premium features during trial period
    - Notification sent 3 days before trial ends
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'trial_started_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN trial_started_at timestamptz DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'trial_ends_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN trial_ends_at timestamptz DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'trial_notified'
  ) THEN
    ALTER TABLE profiles ADD COLUMN trial_notified boolean DEFAULT false;
  END IF;
END $$;
