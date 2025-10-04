/*
  # Add Habit Tracking and Analytics - Phase 2

  This migration adds habit tracking based on financial goals and supporting tables
  for advanced analytics.

  ## 1. New Tables

  ### `goals`
  User-defined financial goals
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `title` (text, goal name)
  - `description` (text, detailed goal description)
  - `target_date` (date, optional deadline)
  - `status` (text, 'active' | 'completed' | 'paused')
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `habits`
  User-defined habits tied to goals
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `goal_id` (uuid, optional foreign key to goals)
  - `name` (text, habit name)
  - `description` (text, habit description)
  - `frequency` (text, 'daily' | 'weekly')
  - `target_count` (integer, for weekly habits)
  - `icon` (text, emoji or icon identifier)
  - `created_at` (timestamptz)

  ### `habit_completions`
  Tracks daily habit check-ins
  - `id` (uuid, primary key)
  - `habit_id` (uuid, foreign key to habits)
  - `user_id` (uuid, foreign key to auth.users)
  - `completed_date` (date, when habit was completed)
  - `note` (text, optional note about the completion)
  - `created_at` (timestamptz)

  ## 2. Security
  - Enable RLS on all new tables
  - Users can only manage their own goals, habits, and completions
  - Proper foreign key constraints and cascading deletes

  ## 3. Indexes
  - Index on user_id for all tables for faster lookups
  - Index on completed_date for habit completions
  - Unique constraint on habit_id + completed_date to prevent duplicates
*/

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  target_date date,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on goals
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals"
  ON goals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON goals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON goals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON goals
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);

-- Create habits table
CREATE TABLE IF NOT EXISTS habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  goal_id uuid REFERENCES goals(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  frequency text DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly')),
  target_count integer DEFAULT 1,
  icon text DEFAULT '✓',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on habits
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own habits"
  ON habits
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habits"
  ON habits
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits"
  ON habits
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits"
  ON habits
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_goal_id ON habits(goal_id);

-- Create habit_completions table
CREATE TABLE IF NOT EXISTS habit_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  completed_date date DEFAULT CURRENT_DATE NOT NULL,
  note text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(habit_id, completed_date)
);

-- Enable RLS on habit_completions
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own habit completions"
  ON habit_completions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habit completions"
  ON habit_completions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habit completions"
  ON habit_completions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own habit completions"
  ON habit_completions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_habit_completions_user_id ON habit_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_id ON habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_date ON habit_completions(completed_date);

-- Function to update goals updated_at timestamp
CREATE OR REPLACE FUNCTION update_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_goals_updated_at ON goals;
CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION update_goals_updated_at();