-- Create profiles table for tracking freemium usage and BYOK
CREATE TABLE profiles (
  user_id TEXT PRIMARY KEY,
  free_seconds_remaining INTEGER DEFAULT 900,
  openai_api_key TEXT
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- For MVP multi-tenancy without strict JWT sync:
CREATE POLICY "Allow authenticated profiles" ON profiles FOR ALL TO public USING (true) WITH CHECK (true);
