-- Create technician_checklists table
-- This table stores the technician's checklist items for each job
CREATE TABLE IF NOT EXISTS technician_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES property_locations(id),
  attribute_id UUID NOT NULL REFERENCES location_attributes(id),
  status_id UUID REFERENCES technician_statuses(id), -- Nullable - can be set later
  images JSONB DEFAULT '[]'::jsonb, -- Array of image paths for this attribute
  notes TEXT, -- Optional notes from technician
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, location_id, attribute_id) -- One checklist entry per job-location-attribute combination
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_technician_checklists_job_id ON technician_checklists(job_id);
CREATE INDEX IF NOT EXISTS idx_technician_checklists_location_id ON technician_checklists(location_id);
CREATE INDEX IF NOT EXISTS idx_technician_checklists_attribute_id ON technician_checklists(attribute_id);
CREATE INDEX IF NOT EXISTS idx_technician_checklists_status_id ON technician_checklists(status_id);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_technician_checklists_updated_at
  BEFORE UPDATE ON technician_checklists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

