/*
  # Flute Learning App Schema

  ## New Tables
  
  ### `swars`
  - `id` (uuid, primary key) - Unique identifier for each swar
  - `name` (text) - Name of the swar (sa, re, ga, ma, pa, dha, ni)
  - `pitch` (text) - Pitch level (low, mid, high)
  - `audio_url` (text) - URL to the audio file
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `practice_songs`
  - `id` (uuid, primary key) - Unique identifier for each song
  - `title` (text) - Song title
  - `notes` (text) - Musical notes in sequence
  - `difficulty` (text) - Difficulty level (easy, medium, hard)
  - `audio_url` (text, nullable) - Optional audio URL for the song
  - `created_at` (timestamptz) - Creation timestamp

  ### `game_scores`
  - `id` (uuid, primary key) - Unique identifier for each score
  - `score` (integer) - The score achieved
  - `streak` (integer) - Longest streak in that session
  - `session_id` (text) - Session identifier for tracking
  - `created_at` (timestamptz) - Creation timestamp

  ## Security
  - Enable RLS on all tables
  - Allow public read access (no auth required)
  - Allow public insert/update access for game scores and swar recordings
*/

-- Create swars table
CREATE TABLE IF NOT EXISTS swars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  pitch text NOT NULL DEFAULT 'mid',
  audio_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create practice_songs table
CREATE TABLE IF NOT EXISTS practice_songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  notes text NOT NULL,
  difficulty text DEFAULT 'easy',
  audio_url text,
  created_at timestamptz DEFAULT now()
);

-- Create game_scores table
CREATE TABLE IF NOT EXISTS game_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  score integer NOT NULL DEFAULT 0,
  streak integer NOT NULL DEFAULT 0,
  session_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE swars ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required)
CREATE POLICY "Allow public read access to swars"
  ON swars FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to swars"
  ON swars FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update to swars"
  ON swars FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to practice_songs"
  ON practice_songs FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to practice_songs"
  ON practice_songs FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public read access to game_scores"
  ON game_scores FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to game_scores"
  ON game_scores FOR INSERT
  TO anon
  WITH CHECK (true);

-- Insert default swars (mid pitch)
INSERT INTO swars (name, pitch, audio_url) VALUES
  ('Sa', 'mid', NULL),
  ('Re', 'mid', NULL),
  ('Ga', 'mid', NULL),
  ('Ma', 'mid', NULL),
  ('Pa', 'mid', NULL),
  ('Dha', 'mid', NULL),
  ('Ni', 'mid', NULL)
ON CONFLICT DO NOTHING;

-- Insert some sample practice songs
INSERT INTO practice_songs (title, notes, difficulty) VALUES
  ('Twinkle Twinkle', 'Sa Sa Pa Pa Dha Dha Pa - Ma Ma Ga Ga Re Re Sa', 'easy'),
  ('Simple Scale', 'Sa Re Ga Ma Pa Dha Ni Sa', 'easy'),
  ('Happy Birthday', 'Sa Sa Re Sa Ma Ga - Sa Sa Re Sa Pa Ma', 'medium')
ON CONFLICT DO NOTHING;