-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type_id UUID NOT NULL REFERENCES property_types(id),
  street_address VARCHAR(255) NOT NULL,
  unit_number VARCHAR(50),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50) NOT NULL,
  zip_code VARCHAR(20) NOT NULL,
  county VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Active',
  gallery JSONB DEFAULT '[]'::jsonb, -- Array of image paths
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create property_locations junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS property_location_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES property_locations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(property_id, location_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_properties_type_id ON properties(type_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_state ON properties(state);
CREATE INDEX IF NOT EXISTS idx_properties_zip_code ON properties(zip_code);
CREATE INDEX IF NOT EXISTS idx_property_location_assignments_property_id ON property_location_assignments(property_id);
CREATE INDEX IF NOT EXISTS idx_property_location_assignments_location_id ON property_location_assignments(location_id);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

