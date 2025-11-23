-- Create qa_statuses table
CREATE TABLE IF NOT EXISTS qa_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_qa_statuses_name ON qa_statuses(name);

-- Insert initial QA statuses
INSERT INTO qa_statuses (name) VALUES
  ('Passed'),
  ('On-Going Inspector'),
  ('On-Going Technician')
ON CONFLICT (name) DO NOTHING;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_qa_statuses_updated_at
  BEFORE UPDATE ON qa_statuses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

