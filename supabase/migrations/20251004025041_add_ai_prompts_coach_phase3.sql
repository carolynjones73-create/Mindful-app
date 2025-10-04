/*
  # Add AI Prompts and Money Coach - Phase 3

  This migration adds custom AI prompts and money coach chat functionality.

  ## 1. New Tables

  ### `custom_prompts`
  Stores user's custom AI-generated prompts
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `prompt_text` (text, the generated prompt)
  - `context` (text, user's context/question)
  - `goal_related` (boolean, if related to goals)
  - `created_at` (timestamptz)

  ### `ai_prompt_history`
  Tracks AI prompt generation for usage limits and badges
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `question_asked` (text, user's question)
  - `ai_response` (text, AI's response)
  - `created_at` (timestamptz)

  ### `coaches`
  Money coaches available for premium users
  - `id` (uuid, primary key)
  - `name` (text, coach name)
  - `email` (text, coach email)
  - `avatar_url` (text, profile picture URL)
  - `bio` (text, coach bio/specialties)
  - `active` (boolean, whether coach is active)
  - `created_at` (timestamptz)

  ### `coach_assignments`
  Links users to their assigned coach
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `coach_id` (uuid, foreign key to coaches)
  - `assigned_at` (timestamptz)

  ### `coach_messages`
  Chat messages between users and coaches
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `coach_id` (uuid, foreign key to coaches)
  - `message` (text, message content)
  - `sender_type` (text, 'user' | 'coach')
  - `read` (boolean, if message has been read)
  - `created_at` (timestamptz)

  ## 2. Security
  - Enable RLS on all new tables
  - Users can only see their own prompts and messages
  - Coaches can only see messages for their assigned users

  ## 3. Indexes
  - Index on user_id for all tables for faster lookups
  - Index on coach_id for messages
  - Index on created_at for messages (for ordering)
*/

-- Create custom_prompts table
CREATE TABLE IF NOT EXISTS custom_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prompt_text text NOT NULL,
  context text,
  goal_related boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on custom_prompts
ALTER TABLE custom_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own prompts"
  ON custom_prompts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prompts"
  ON custom_prompts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_custom_prompts_user_id ON custom_prompts(user_id);

-- Create ai_prompt_history table
CREATE TABLE IF NOT EXISTS ai_prompt_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question_asked text NOT NULL,
  ai_response text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on ai_prompt_history
ALTER TABLE ai_prompt_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own prompt history"
  ON ai_prompt_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prompt history"
  ON ai_prompt_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ai_prompt_history_user_id ON ai_prompt_history(user_id);

-- Create coaches table
CREATE TABLE IF NOT EXISTS coaches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  avatar_url text,
  bio text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on coaches (readable by all authenticated users)
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active coaches"
  ON coaches
  FOR SELECT
  TO authenticated
  USING (active = true);

-- Create coach_assignments table
CREATE TABLE IF NOT EXISTS coach_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  coach_id uuid REFERENCES coaches(id) ON DELETE CASCADE NOT NULL,
  assigned_at timestamptz DEFAULT now()
);

-- Enable RLS on coach_assignments
ALTER TABLE coach_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own coach assignment"
  ON coach_assignments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_coach_assignments_user_id ON coach_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_assignments_coach_id ON coach_assignments(coach_id);

-- Create coach_messages table
CREATE TABLE IF NOT EXISTS coach_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  coach_id uuid REFERENCES coaches(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('user', 'coach')),
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on coach_messages
ALTER TABLE coach_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON coach_messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages"
  ON coach_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND sender_type = 'user');

CREATE POLICY "Users can update own messages read status"
  ON coach_messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_coach_messages_user_id ON coach_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_messages_coach_id ON coach_messages(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_messages_created_at ON coach_messages(created_at);

-- Insert sample coach
INSERT INTO coaches (name, email, bio, active)
VALUES (
  'Sarah Johnson',
  'sarah@mindfulmoneycoach.com',
  'Certified Financial Coach with 10+ years experience helping people transform their relationship with money. Specializes in mindful spending, debt reduction, and building sustainable wealth.',
  true
)
ON CONFLICT (email) DO NOTHING;

-- Add badge for AI prompt usage
INSERT INTO badges (name, description, icon, requirement_type, requirement_value, tier, category)
VALUES 
  ('AI Explorer', 'Used AI prompts 25 times', '🤖', 'milestone', 25, 'premium', 'ai')
ON CONFLICT DO NOTHING;