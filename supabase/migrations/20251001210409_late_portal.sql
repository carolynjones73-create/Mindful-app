/*
  # Add action_completed column to daily_entries table

  1. Changes
    - Add `action_completed` column to `daily_entries` table
    - Set data type as boolean with default value false
    - Column allows null values to handle existing records

  2. Security
    - No RLS changes needed as existing policies already cover UPDATE operations
    - Users can update their own daily entries including this new column
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_entries' AND column_name = 'action_completed'
  ) THEN
    ALTER TABLE daily_entries ADD COLUMN action_completed boolean DEFAULT false;
  END IF;
END $$;