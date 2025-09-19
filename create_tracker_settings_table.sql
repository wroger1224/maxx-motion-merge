-- Create user_tracker_settings table
CREATE TABLE user_tracker_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  connected_tracker TEXT,
  last_sync_date TIMESTAMP,
  auto_sync_enabled BOOLEAN DEFAULT true,
  sync_frequency TEXT DEFAULT 'daily', -- daily, weekly, manual
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure one settings record per user
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX idx_user_tracker_settings_user_id ON user_tracker_settings(user_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE user_tracker_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own tracker settings
CREATE POLICY "Users can view own tracker settings" ON user_tracker_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tracker settings" ON user_tracker_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tracker settings" ON user_tracker_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tracker settings" ON user_tracker_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_tracker_settings_updated_at 
  BEFORE UPDATE ON user_tracker_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();