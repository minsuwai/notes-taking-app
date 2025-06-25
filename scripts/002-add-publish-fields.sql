-- Add published fields to notes table
ALTER TABLE notes 
ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

-- Create an index for published notes
CREATE INDEX IF NOT EXISTS idx_notes_published ON notes(published, published_at DESC) WHERE published = TRUE;
