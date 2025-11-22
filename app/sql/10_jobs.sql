-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type_id UUID NOT NULL REFERENCES job_types(id),
  date DATE NOT NULL,
  property_id UUID NOT NULL REFERENCES properties(id),
  inspector_id UUID REFERENCES users(id), -- Nullable/Optional
  technician_id UUID REFERENCES users(id), -- Nullable/Optional
  qa_id UUID REFERENCES users(id), -- Nullable/Optional (for QA assignment)
  status VARCHAR(50) NOT NULL DEFAULT 'In-Review',
  inspected_date DATE,
  fix_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_jobs_job_type_id ON jobs(job_type_id);
CREATE INDEX IF NOT EXISTS idx_jobs_property_id ON jobs(property_id);
CREATE INDEX IF NOT EXISTS idx_jobs_inspector_id ON jobs(inspector_id);
CREATE INDEX IF NOT EXISTS idx_jobs_technician_id ON jobs(technician_id);
CREATE INDEX IF NOT EXISTS idx_jobs_qa_id ON jobs(qa_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_date ON jobs(date);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

