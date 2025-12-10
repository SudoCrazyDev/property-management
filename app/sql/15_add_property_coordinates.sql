-- Add latitude and longitude columns to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Create index for faster geospatial queries
CREATE INDEX IF NOT EXISTS idx_properties_coordinates ON properties(latitude, longitude);

