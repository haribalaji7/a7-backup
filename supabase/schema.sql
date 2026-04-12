-- Agri Nova - Supabase Database Schema
-- Run this in the Supabase SQL Editor

-- Users table (extends Supabase auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Farms table
CREATE TABLE farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  soil_type TEXT,
  land_area DECIMAL(10,2),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Soil analysis records
CREATE TABLE soil_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  nitrogen DECIMAL(6,2),
  phosphorus DECIMAL(6,2),
  potassium DECIMAL(6,2),
  ph DECIMAL(4,2),
  moisture DECIMAL(5,2),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Finance transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disease scan history
CREATE TABLE scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  image_url TEXT,
  disease TEXT,
  confidence INTEGER,
  severity TEXT,
  treatment TEXT,
  prevention TEXT,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crop recommendations
CREATE TABLE crop_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  crop_name TEXT NOT NULL,
  confidence INTEGER,
  season TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weather cache
CREATE TABLE weather_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location TEXT NOT NULL,
  temperature DECIMAL(5,2),
  humidity DECIMAL(5,2),
  conditions TEXT,
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE soil_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_cache ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Farms policies
CREATE POLICY "Users can view own farms" ON farms FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create farms" ON farms FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own farms" ON farms FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own farms" ON farms FOR DELETE USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = transactions.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can create transactions" ON transactions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = transactions.farm_id AND farms.user_id = auth.uid())
);

-- Scans policies
CREATE POLICY "Users can view own scans" ON scans FOR SELECT USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = scans.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can create scans" ON scans FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = scans.farm_id AND farms.user_id = auth.uid())
);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Feedback table
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT,
  email TEXT,
  type TEXT CHECK (type IN ('general', 'bug', 'feature', 'improvement')),
  message TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit feedback" ON feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view feedback" ON feedback FOR SELECT USING (true);

-- Community Questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  user_name TEXT,
  answers_count INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community Answers table
CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  user_name TEXT,
  is_accepted BOOLEAN DEFAULT false,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Questions policies
CREATE POLICY "Public can read questions" ON questions FOR SELECT USING (true);
CREATE POLICY "Auth can create questions" ON questions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Answers policies
CREATE POLICY "Public can read answers" ON answers FOR SELECT USING (true);
CREATE POLICY "Auth can create answers" ON answers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Rate limiting for login emails
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_email_sent TIMESTAMP WITH TIME ZONE;