-- Create a junction table for note-category relationships (many-to-many)
CREATE TABLE IF NOT EXISTS note_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(note_id, category_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_note_categories_note_id ON note_categories(note_id);
CREATE INDEX IF NOT EXISTS idx_note_categories_category_id ON note_categories(category_id);

-- Enable RLS on note_categories table
ALTER TABLE note_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for note_categories
CREATE POLICY "Users can view own note categories" ON note_categories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM notes 
      WHERE notes.id = note_categories.note_id 
      AND notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own note categories" ON note_categories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM notes 
      WHERE notes.id = note_categories.note_id 
      AND notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own note categories" ON note_categories
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM notes 
      WHERE notes.id = note_categories.note_id 
      AND notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own note categories" ON note_categories
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM notes 
      WHERE notes.id = note_categories.note_id 
      AND notes.user_id = auth.uid()
    )
  );

-- Allow public read access to published note categories (for the blog)
CREATE POLICY "Anyone can view published note categories" ON note_categories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM notes 
      WHERE notes.id = note_categories.note_id 
      AND notes.published = true
    )
  );
