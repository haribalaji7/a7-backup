-- ============================================================
-- Agri Nova – Weather Cache Database Schema & Seeding
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. CREATE TABLE
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS weather_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location TEXT NOT NULL,
  temperature DECIMAL(5,2),
  humidity DECIMAL(5,2),
  conditions TEXT,
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 2. CREATE INDEXES FOR OPTIMIZED CACHE LOOKUPS
-- ────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_weather_cache_location ON weather_cache (location);
CREATE INDEX IF NOT EXISTS idx_weather_cache_expires_at ON weather_cache (expires_at);

-- ────────────────────────────────────────────────────────────
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ────────────────────────────────────────────────────────────

ALTER TABLE weather_cache ENABLE ROW LEVEL SECURITY;

-- Select Policy: Anyone (public and authenticated users) can check/read cached weather
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can read weather cache' AND tablename = 'weather_cache') THEN
    CREATE POLICY "Public can read weather cache" ON weather_cache FOR SELECT USING (true);
  END IF;
END $$;

-- Insert Policy: Authenticated users/APIs can cache new weather data
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can insert weather cache' AND tablename = 'weather_cache') THEN
    CREATE POLICY "Anyone can insert weather cache" ON weather_cache FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Update Policy: Authenticated users/APIs can update existing cache entries
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can update weather cache' AND tablename = 'weather_cache') THEN
    CREATE POLICY "Anyone can update weather cache" ON weather_cache FOR UPDATE USING (true);
  END IF;
END $$;

-- Delete Policy: Anyone can purge expired cache entries
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can delete weather cache' AND tablename = 'weather_cache') THEN
    CREATE POLICY "Anyone can delete weather cache" ON weather_cache FOR DELETE USING (true);
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 4. SEED SAMPLE CACHED WEATHER DATA
--    This pre-populates some popular agricultural hubs with
--    recently cached data.
-- ────────────────────────────────────────────────────────────

-- First, clean up any existing duplicate locations to avoid confusion
TRUNCATE TABLE weather_cache;

INSERT INTO weather_cache (location, temperature, humidity, conditions, fetched_at, expires_at)
VALUES
  (
    'New Delhi',
    34.5,
    52.0,
    'Hazy and Sunny',
    NOW(),
    NOW() + INTERVAL '1 hour'
  ),
  (
    'Hyderabad',
    31.2,
    64.0,
    'Partly Cloudy',
    NOW(),
    NOW() + INTERVAL '1 hour'
  ),
  (
    'Pune',
    29.8,
    72.0,
    'Pleasant and Breezy',
    NOW(),
    NOW() + INTERVAL '1 hour'
  ),
  (
    'Nashik',
    28.5,
    78.0,
    'Light Rain Showers',
    NOW(),
    NOW() + INTERVAL '1 hour'
  ),
  (
    'Vijayawada',
    33.8,
    60.0,
    'Mainly Clear',
    NOW(),
    NOW() + INTERVAL '1 hour'
  ),
  (
    'Amritsar',
    35.2,
    45.0,
    'Sunny',
    NOW(),
    NOW() + INTERVAL '1 hour'
  ),
  (
    'Bengaluru',
    26.4,
    81.0,
    'Overcast',
    NOW(),
    NOW() + INTERVAL '1 hour'
  );

-- ────────────────────────────────────────────────────────────
-- 5. HELPER FUNCTION TO CLEAN UP EXPIRED CACHE ENTRIES
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION purge_expired_weather_cache()
RETURNS INT AS $$
DECLARE
  deleted_count INT;
BEGIN
  DELETE FROM weather_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Done! Weather cache schema, policies, and seeds created.
-- ============================================================
