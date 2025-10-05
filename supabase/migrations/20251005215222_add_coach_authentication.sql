/*
  # Add Coach Authentication Support

  This migration adds authentication support for coaches and updates RLS policies
  to allow coaches to view and respond to messages.

  ## 1. Changes to Existing Tables

  ### `coaches`
  - Add `user_id` (uuid, foreign key to auth.users) to link coach to auth account

  ### `profiles`
  - Already has `role` column to identify coaches

  ## 2. New Policies
  - Coaches can view messages from their assigned users
  - Coaches can insert messages to their assigned users
  - Coaches can view their own coach profile
  - Coaches can view their assigned users

  ## 3. Important Notes
  - Coaches must be created in auth.users first, then linked in coaches table
  - The sample coach email is 'sarah@mindfulmoneycoach.com'
  - Default password setup should be done manually via Supabase Auth
*/

-- Add user_id to coaches table to link with auth.users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coaches' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE coaches ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE;
  END IF;
END $$;

-- Update RLS policies for coaches to view messages from assigned users
DROP POLICY IF EXISTS "Coaches can view assigned user messages" ON coach_messages;
CREATE POLICY "Coaches can view assigned user messages"
  ON coach_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coaches
      WHERE coaches.user_id = auth.uid()
      AND coaches.id = coach_messages.coach_id
    )
  );

-- Allow coaches to insert messages to their assigned users
DROP POLICY IF EXISTS "Coaches can send messages to assigned users" ON coach_messages;
CREATE POLICY "Coaches can send messages to assigned users"
  ON coach_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coaches
      WHERE coaches.user_id = auth.uid()
      AND coaches.id = coach_messages.coach_id
    ) AND sender_type = 'coach'
  );

-- Allow coaches to update read status on messages
DROP POLICY IF EXISTS "Coaches can update message read status" ON coach_messages;
CREATE POLICY "Coaches can update message read status"
  ON coach_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coaches
      WHERE coaches.user_id = auth.uid()
      AND coaches.id = coach_messages.coach_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coaches
      WHERE coaches.user_id = auth.uid()
      AND coaches.id = coach_messages.coach_id
    )
  );

-- Allow coaches to view their own profile
DROP POLICY IF EXISTS "Coaches can view own profile" ON coaches;
CREATE POLICY "Coaches can view own profile"
  ON coaches
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR active = true);

-- Allow coaches to view their assigned users
DROP POLICY IF EXISTS "Coaches can view assigned users" ON coach_assignments;
CREATE POLICY "Coaches can view assigned users"
  ON coach_assignments
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM coaches
      WHERE coaches.user_id = auth.uid()
      AND coaches.id = coach_assignments.coach_id
    )
  );

-- Allow coaches to view basic user profile info for their assigned users
DROP POLICY IF EXISTS "Coaches can view assigned user profiles" ON profiles;
CREATE POLICY "Coaches can view assigned user profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM coach_assignments ca
      JOIN coaches c ON c.id = ca.coach_id
      WHERE c.user_id = auth.uid()
      AND ca.user_id = profiles.id
    )
  );

CREATE INDEX IF NOT EXISTS idx_coaches_user_id ON coaches(user_id);
