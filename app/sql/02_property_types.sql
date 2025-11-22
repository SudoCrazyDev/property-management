-- Create property_types table
CREATE TABLE IF NOT EXISTS property_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_property_types_name ON property_types(name);

-- Insert initial property types
INSERT INTO property_types (name) VALUES
  ('House'),
  ('Apartment'),
  ('Condo'),
  ('Duplex'),
  ('Multi-Family'),
  ('Commercial')
ON CONFLICT (name) DO NOTHING;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_property_types_updated_at
  BEFORE UPDATE ON property_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

