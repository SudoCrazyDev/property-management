-- Create property_locations table
CREATE TABLE IF NOT EXISTS property_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_property_locations_name ON property_locations(name);

-- Insert initial property locations
INSERT INTO property_locations (name) VALUES
  ('Entryway/Hallways'),
  ('Living Room'),
  ('Dining Area'),
  ('Kitchen'),
  ('Bedroom'),
  ('Bathroom')
ON CONFLICT (name) DO NOTHING;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_property_locations_updated_at
  BEFORE UPDATE ON property_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

