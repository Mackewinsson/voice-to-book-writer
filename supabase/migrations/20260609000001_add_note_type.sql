-- Run this in your Supabase SQL Editor to add note types

ALTER TABLE blocks ADD COLUMN IF NOT EXISTS note_type VARCHAR(50) DEFAULT 'normal';

-- You may need to refresh the schema cache after running this in the API settings or let it take effect automatically.
