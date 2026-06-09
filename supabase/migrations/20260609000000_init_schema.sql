-- The tables were already created manually in the dashboard, 
-- so we just need to ensure RLS is enabled and the policies are applied!

ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist so this script doesn't fail if run multiple times
DROP POLICY IF EXISTS "Allow public all books" ON books;
DROP POLICY IF EXISTS "Allow public all chapters" ON chapters;
DROP POLICY IF EXISTS "Allow public all blocks" ON blocks;

-- Create policies to allow public access (since we don't have user auth yet)
CREATE POLICY "Allow public all books" ON books FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all chapters" ON chapters FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all blocks" ON blocks FOR ALL TO public USING (true) WITH CHECK (true);
