/*
  # Add Message Limits and Calendly Integration

  1. Changes to Tables
    - Add `calendly_url` to coaches table for booking links
    - Add `message_count` to coach_assignments to track messages sent
    - Add `message_limit` to coach_assignments (premium users get limited messages)
    
  2. New Tables
    - `coach_sessions` table to track booked sessions
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `coach_id` (uuid, references coaches)
      - `session_date` (timestamptz)
      - `calendly_event_id` (text, unique)
      - `status` (text: 'scheduled', 'completed', 'cancelled')
      - `created_at` (timestamptz)
    
  3. Security
    - Enable RLS on coach_sessions table
    - Add policies for users to view their own sessions
    - Add policies for coaches to view their sessions
*/

-- Add Calendly URL to coaches table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coaches' AND column_name = 'calendly_url'
  ) THEN
    ALTER TABLE coaches ADD COLUMN calendly_url text;
  END IF;
END $$;

-- Add message tracking to coach_assignments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coach_assignments' AND column_name = 'message_count'
  ) THEN
    ALTER TABLE coach_assignments ADD COLUMN message_count integer DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coach_assignments' AND column_name = 'message_limit'
  ) THEN
    ALTER TABLE coach_assignments ADD COLUMN message_limit integer DEFAULT 10;
  END IF;
END $$;

-- Create coach_sessions table
CREATE TABLE IF NOT EXISTS coach_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  coach_id uuid REFERENCES coaches(id) ON DELETE CASCADE NOT NULL,
  session_date timestamptz,
  calendly_event_id text UNIQUE,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE coach_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own sessions" ON coach_sessions;
DROP POLICY IF EXISTS "Users can create own sessions" ON coach_sessions;
DROP POLICY IF EXISTS "Coaches can view their sessions" ON coach_sessions;
DROP POLICY IF EXISTS "Coaches can update their sessions" ON coach_sessions;

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions"
  ON coach_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own sessions
CREATE POLICY "Users can create own sessions"
  ON coach_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Coaches can view their sessions
CREATE POLICY "Coaches can view their sessions"
  ON coach_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coaches
      WHERE coaches.id = coach_sessions.coach_id
      AND coaches.user_id = auth.uid()
    )
  );

-- Coaches can update their session notes
CREATE POLICY "Coaches can update their sessions"
  ON coach_sessions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coaches
      WHERE coaches.id = coach_sessions.coach_id
      AND coaches.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coaches
      WHERE coaches.id = coach_sessions.coach_id
      AND coaches.user_id = auth.uid()
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_coach_sessions_user_id ON coach_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_sessions_coach_id ON coach_sessions(coach_id);
