-- Enable Row Level Security on notes table
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Drop the custom users table since we'll use Supabase Auth
DROP TABLE IF EXISTS users CASCADE;

-- Update notes table to use Supabase auth.users
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_user_id_fkey;
ALTER TABLE notes ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Create RLS policies for notes table
-- Users can only see their own notes
CREATE POLICY "Users can view own notes" ON notes
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own notes
CREATE POLICY "Users can insert own notes" ON notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own notes
CREATE POLICY "Users can update own notes" ON notes
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own notes
CREATE POLICY "Users can delete own notes" ON notes
  FOR DELETE USING (auth.uid() = user_id);

-- Allow public read access to published notes (for the blog)
CREATE POLICY "Anyone can view published notes" ON notes
  FOR SELECT USING (published = true);

-- Create a function to automatically set user_id on insert
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set user_id
DROP TRIGGER IF EXISTS set_user_id_trigger ON notes;
CREATE TRIGGER set_user_id_trigger
  BEFORE INSERT ON notes
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();
