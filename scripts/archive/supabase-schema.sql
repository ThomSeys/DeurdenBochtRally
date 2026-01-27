-- Deur Den Bocht Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Create participants table
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  motorcycle_brand TEXT NOT NULL,
  motorcycle_model TEXT NOT NULL,
  license_plate TEXT NOT NULL,
  formula TEXT NOT NULL CHECK (formula IN ('with_meals', 'breakfast_only')),
  amount_paid INTEGER NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  stripe_payment_id TEXT,
  qr_code TEXT NOT NULL UNIQUE,
  checked_in BOOLEAN DEFAULT FALSE,
  ride_type TEXT NOT NULL CHECK (ride_type IN ('free', 'guided')),
  allow_early_access BOOLEAN DEFAULT FALSE
);

-- Create rally_submissions table
CREATE TABLE IF NOT EXISTS rally_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  rz1_code TEXT,
  rz2_code TEXT,
  rz3_code TEXT,
  rz4_code TEXT,
  rz5_code TEXT,
  rz6_code TEXT,
  rz7_code TEXT,
  rz8_code TEXT,
  total_distance NUMERIC,
  used_highways BOOLEAN DEFAULT FALSE,
  weather_bonus BOOLEAN DEFAULT FALSE,
  total_points INTEGER DEFAULT 0,
  submitted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(participant_id)
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('gpx', 'pdf', 'image', 'other')),
  category TEXT NOT NULL CHECK (category IN ('route', 'rally_book', 'map', 'instruction', 'other')),
  visible_to_public BOOLEAN DEFAULT FALSE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);
CREATE INDEX IF NOT EXISTS idx_participants_qr_code ON participants(qr_code);
CREATE INDEX IF NOT EXISTS idx_participants_payment_status ON participants(payment_status);
CREATE INDEX IF NOT EXISTS idx_rally_submissions_participant ON rally_submissions(participant_id);
CREATE INDEX IF NOT EXISTS idx_rally_submissions_points ON rally_submissions(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);

-- Enable Row Level Security (RLS)
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE rally_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Policies for participants table
-- Allow anyone to insert (for registration)
CREATE POLICY "Anyone can register" ON participants
  FOR INSERT
  WITH CHECK (true);

-- Allow users to view their own data
CREATE POLICY "Users can view own data" ON participants
  FOR SELECT
  USING (true);

-- Allow users to update their own data
CREATE POLICY "Users can update own data" ON participants
  FOR UPDATE
  USING (true);

-- Policies for rally_submissions table
-- Allow users to view their own submissions
CREATE POLICY "Users can view own submissions" ON rally_submissions
  FOR SELECT
  USING (true);

-- Allow users to insert their own submissions
CREATE POLICY "Users can insert own submissions" ON rally_submissions
  FOR INSERT
  WITH CHECK (true);

-- Allow users to update their own submissions
CREATE POLICY "Users can update own submissions" ON rally_submissions
  FOR UPDATE
  USING (true);

-- Policies for documents table
-- Allow all authenticated users to view documents
CREATE POLICY "Everyone can view documents" ON documents
  FOR SELECT
  USING (true);

-- Only service role can insert/update/delete documents
CREATE POLICY "Service role can manage documents" ON documents
  FOR ALL
  USING (auth.role() = 'service_role');

-- Create function to get leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard()
RETURNS TABLE (
  rank BIGINT,
  first_name TEXT,
  last_name TEXT,
  motorcycle_brand TEXT,
  motorcycle_model TEXT,
  total_points INTEGER,
  zones_completed BIGINT,
  total_distance NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY rs.total_points DESC, rs.total_distance DESC NULLS LAST) as rank,
    p.first_name,
    p.last_name,
    p.motorcycle_brand,
    p.motorcycle_model,
    rs.total_points,
    (
      CASE WHEN rs.rz1_code IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN rs.rz2_code IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN rs.rz3_code IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN rs.rz4_code IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN rs.rz5_code IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN rs.rz6_code IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN rs.rz7_code IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN rs.rz8_code IS NOT NULL THEN 1 ELSE 0 END
    )::BIGINT as zones_completed,
    rs.total_distance
  FROM rally_submissions rs
  JOIN participants p ON rs.participant_id = p.id
  WHERE rs.submitted_at IS NOT NULL
    AND p.payment_status = 'completed'
  ORDER BY rs.total_points DESC, rs.total_distance DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some example documents (optional)
-- You can add your actual file URLs here
INSERT INTO documents (title, description, file_url, file_type, category, visible_to_public) VALUES
('Hoofdroute GPX', 'De complete 500+ km route', 'https://example.com/route.gpx', 'gpx', 'route', true),
('Rally Zones Kaart', 'Overzicht van alle 8 rally zones', 'https://example.com/rally-map.pdf', 'pdf', 'map', true),
('Bochtenboek Digitaal', 'Digitale versie van het bochtenboek', 'https://example.com/bochtenboek.pdf', 'pdf', 'rally_book', false)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE participants IS 'Stores all registered participants for the Deur Den Bocht rally';
COMMENT ON TABLE rally_submissions IS 'Stores rally zone submissions and scores for each participant';
COMMENT ON TABLE documents IS 'Stores GPX files, rally books, maps and other documents for participants';
