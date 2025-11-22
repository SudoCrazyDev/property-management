-- Create inspector_statuses table
CREATE TABLE IF NOT EXISTS inspector_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_inspector_statuses_name ON inspector_statuses(name);

-- Insert initial inspector statuses
INSERT INTO inspector_statuses (name) VALUES
  ('Pass'),
  ('Fail'),
  ('N/A'),
  ('Needs Attention')
ON CONFLICT (name) DO NOTHING;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_inspector_statuses_updated_at
  BEFORE UPDATE ON inspector_statuses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

