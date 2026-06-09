-- Create payments table to track orders and avoid duplicate processing
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(user_id),
  order_id TEXT NOT NULL UNIQUE,
  amount_total INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view their own payments
CREATE POLICY "Allow users to view own payments" 
  ON payments FOR SELECT 
  TO authenticated 
  USING (auth.uid()::text = user_id);
