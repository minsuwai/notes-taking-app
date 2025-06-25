-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add category_id to notes table
ALTER TABLE notes 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_notes_category_id ON notes(category_id);

-- Insert some default categories
INSERT INTO categories (name, slug, description, color) VALUES
  ('Technology', 'technology', 'Tech-related articles and tutorials', '#3b82f6'),
  ('Personal', 'personal', 'Personal thoughts and experiences', '#10b981'),
  ('Work', 'work', 'Work-related notes and projects', '#f59e0b'),
  ('Ideas', 'ideas', 'Creative ideas and brainstorming', '#8b5cf6'),
  ('Learning', 'learning', 'Educational content and study notes', '#ef4444')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS on categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read categories (they're shared)
CREATE POLICY "Anyone can view categories" ON categories
  FOR SELECT USING (true);

-- Only authenticated users can manage categories
CREATE POLICY "Authenticated users can manage categories" ON categories
  FOR ALL USING (auth.uid() IS NOT NULL);
