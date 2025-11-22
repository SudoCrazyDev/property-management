-- Create location_attributes table
CREATE TABLE IF NOT EXISTS location_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_location_attributes_name ON location_attributes(name);

-- Insert initial location attributes
INSERT INTO location_attributes (name) VALUES
  ('Walls'),
  ('Baseboards and Trim'),
  ('Flooring'),
  ('Doors'),
  ('Windows'),
  ('Blinds/Shades'),
  ('Light Fixtures'),
  ('Electrical Outlets'),
  ('HVAC Vents')
ON CONFLICT (name) DO NOTHING;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_location_attributes_updated_at
  BEFORE UPDATE ON location_attributes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

