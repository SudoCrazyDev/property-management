-- Create job_types table
CREATE TABLE IF NOT EXISTS job_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_job_types_name ON job_types(name);

-- Insert initial job types
INSERT INTO job_types (name) VALUES
  ('Move In'),
  ('Move Out')
ON CONFLICT (name) DO NOTHING;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_job_types_updated_at
  BEFORE UPDATE ON job_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

