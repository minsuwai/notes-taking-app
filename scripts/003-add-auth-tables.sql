-- Create users table for custom auth (fallback when Supabase auth is not used)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add user_id to notes table
ALTER TABLE notes 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Create index for user notes
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);

-- Update published notes index to include user_id
DROP INDEX IF EXISTS idx_notes_published;
CREATE INDEX IF NOT EXISTS idx_notes_published ON notes(published, published_at DESC, user_id) WHERE published = TRUE;
