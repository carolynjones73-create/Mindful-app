/*
  # Enable Open Coach Messaging System

  1. Changes to Tables
    - Make `coach_id` nullable in `coach_messages` to allow unassigned messages
    - Add index for better performance on unassigned message queries
    
  2. Update RLS Policies
    - Allow premium users to send messages without coach assignment
    - Allow all coaches to view unassigned messages
    - Allow coaches to claim messages by responding
    
  3. How It Works
    - Premium users send messages (coach_id = NULL initially)
    - All coaches can see unassigned messages in their dashboard
    - When a coach responds, they get auto-assigned (coach_id gets set)
    - Future messages from that user go to the assigned coach
*/

-- Make coach_id nullable in coach_messages to support unassigned messages
ALTER TABLE coach_messages ALTER COLUMN coach_id DROP NOT NULL;

-- Add index for unassigned messages
CREATE INDEX IF NOT EXISTS idx_coach_messages_unassigned ON coach_messages(user_id) WHERE coach_id IS NULL;

-- Update policies to allow unassigned messages

-- Users can send messages without a coach assignment
DROP POLICY IF EXISTS "Users can send messages to their coach" ON coach_messages;
CREATE POLICY "Users can send messages to their coach"
  ON coach_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND sender_type = 'user'
  );

-- Users can view their own messages
DROP POLICY IF EXISTS "Users can view own messages" ON coach_messages;
CREATE POLICY "Users can view own messages"
  ON coach_messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Coaches can view all messages (assigned to them OR unassigned)
DROP POLICY IF EXISTS "Coaches can view assigned user messages" ON coach_messages;
CREATE POLICY "Coaches can view assigned user messages"
  ON coach_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coaches
      WHERE coaches.user_id = auth.uid()
      AND (
        coaches.id = coach_messages.coach_id OR
        coach_messages.coach_id IS NULL
      )
    )
  );

-- Coaches can send messages to any user (this will auto-assign them)
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

-- Coaches can update messages (for marking as read, etc.)
DROP POLICY IF EXISTS "Coaches can update message read status" ON coach_messages;
CREATE POLICY "Coaches can update message read status"
  ON coach_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coaches
      WHERE coaches.user_id = auth.uid()
      AND (coaches.id = coach_messages.coach_id OR coach_messages.coach_id IS NULL)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coaches
      WHERE coaches.user_id = auth.uid()
      AND coaches.id = coach_messages.coach_id
    )
  );

-- Update coach_assignments policies to work with auto-assignment
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

-- Allow coaches to create assignments when they respond to messages
DROP POLICY IF EXISTS "Coaches can create assignments" ON coach_assignments;
CREATE POLICY "Coaches can create assignments"
  ON coach_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coaches
      WHERE coaches.user_id = auth.uid()
      AND coaches.id = coach_assignments.coach_id
    )
  );

-- Allow coaches to update assignments (for message counts, etc.)
DROP POLICY IF EXISTS "Coaches can update assignments" ON coach_assignments;
CREATE POLICY "Coaches can update assignments"
  ON coach_assignments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coaches
      WHERE coaches.user_id = auth.uid()
      AND coaches.id = coach_assignments.coach_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coaches
      WHERE coaches.user_id = auth.uid()
      AND coaches.id = coach_assignments.coach_id
    )
  );
