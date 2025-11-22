-- Create users table with custom authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50),
  birthday DATE,
  gender VARCHAR(50),
  role_id UUID NOT NULL REFERENCES roles(id),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_name ON users(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial admin user
-- Note: The password_hash will be set when you run the create-admin-user script
-- Default password: Admin123! (change after first login)
-- The password_hash placeholder will be replaced by the application
INSERT INTO users (
  first_name,
  last_name,
  email,
  password_hash,
  phone_number,
  birthday,
  gender,
  role_id,
  is_active
) VALUES (
  'Admin',
  'User',
  'admin@example.com',
  '$2a$10$placeholder_hash_replace_with_actual_hash', -- Will be updated by app
  '+1 (555) 0000',
  '1990-01-01',
  'Other',
  (SELECT id FROM roles WHERE name = 'Admin' LIMIT 1),
  true
)
ON CONFLICT (email) DO NOTHING;

-- Note: Authentication is handled at the application level
-- Passwords are hashed using bcryptjs before storing in password_hash field
-- Sessions are managed via localStorage in the application

