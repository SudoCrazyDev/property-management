-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone_number VARCHAR(50),
  birthday DATE,
  gender VARCHAR(50),
  role_id UUID NOT NULL REFERENCES roles(id),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_name ON users(first_name, last_name);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial admin user
-- Note: You'll need to create the auth user first in Supabase Auth, then update the auth_user_id
-- For now, this creates a user record. The auth_user_id can be set after creating the auth user.
INSERT INTO users (
  first_name,
  last_name,
  email,
  phone_number,
  birthday,
  gender,
  role_id
) VALUES (
  'Admin',
  'User',
  'admin@example.com',
  '+1 (555) 0000',
  '1990-01-01',
  'Other',
  (SELECT id FROM roles WHERE name = 'Admin' LIMIT 1)
)
ON CONFLICT (email) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  USING (auth.uid() = auth_user_id);

-- Policy: Admins can view all users
CREATE POLICY "Admins can view all users"
  ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_user_id = auth.uid()
      AND role_id = (SELECT id FROM roles WHERE name = 'Admin' LIMIT 1)
    )
  );

-- Policy: Admins can insert users
CREATE POLICY "Admins can insert users"
  ON users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_user_id = auth.uid()
      AND role_id = (SELECT id FROM roles WHERE name = 'Admin' LIMIT 1)
    )
  );

-- Policy: Admins can update users
CREATE POLICY "Admins can update users"
  ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_user_id = auth.uid()
      AND role_id = (SELECT id FROM roles WHERE name = 'Admin' LIMIT 1)
    )
  );

-- Policy: Admins can delete users
CREATE POLICY "Admins can delete users"
  ON users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_user_id = auth.uid()
      AND role_id = (SELECT id FROM roles WHERE name = 'Admin' LIMIT 1)
    )
  );

