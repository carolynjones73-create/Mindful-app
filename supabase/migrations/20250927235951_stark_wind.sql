/*
  # Create testimonials table

  1. New Tables
    - `testimonials`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `milestone_days` (integer, milestone achieved - 7, 30, or 90 days)
      - `rating` (integer, 1-5 star rating)
      - `testimonial_text` (text, user's testimonial content)
      - `allow_public_use` (boolean, permission to use testimonial publicly)
      - `submitted_at` (timestamp, when testimonial was submitted)

  2. Security
    - Enable RLS on `testimonials` table
    - Add policy for authenticated users to insert their own testimonials
    - Add policy for authenticated users to read their own testimonials
*/

CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_days integer NOT NULL CHECK (milestone_days IN (7, 30, 90)),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  testimonial_text text NOT NULL,
  allow_public_use boolean DEFAULT false,
  submitted_at timestamptz DEFAULT now()
);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own testimonials"
  ON testimonials
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own testimonials"
  ON testimonials
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);