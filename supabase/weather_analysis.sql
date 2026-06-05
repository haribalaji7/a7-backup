-- ============================================================
-- Agri Nova – Historical Weather Analysis & Analytics
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. CREATE HISTORICAL WEATHER LOGS TABLE
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS weather_historical (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  recorded_date DATE NOT NULL,
  temp_max DECIMAL(5,2) NOT NULL,
  temp_min DECIMAL(5,2) NOT NULL,
  temp_avg DECIMAL(5,2) NOT NULL,
  humidity_avg DECIMAL(5,2) NOT NULL CHECK (humidity_avg >= 0 AND humidity_avg <= 100),
  wind_speed_max DECIMAL(5,2) NOT NULL,
  rainfall_sum DECIMAL(6,2) DEFAULT 0.00,
  uv_index_max DECIMAL(3,1) DEFAULT 0.0,
  weather_code INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure unique weather record per farm per day
  CONSTRAINT unique_farm_weather_date UNIQUE (farm_id, recorded_date)
);

-- ────────────────────────────────────────────────────────────
-- 2. ENABLE ROW LEVEL SECURITY & POLICIES
-- ────────────────────────────────────────────────────────────

ALTER TABLE weather_historical ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can view own farm weather history' 
      AND tablename = 'weather_historical'
  ) THEN
    CREATE POLICY "Users can view own farm weather history" ON weather_historical
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM farms 
          WHERE farms.id = weather_historical.farm_id 
            AND farms.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can manage own farm weather history' 
      AND tablename = 'weather_historical'
  ) THEN
    CREATE POLICY "Users can manage own farm weather history" ON weather_historical
      FOR ALL WITH CHECK (
        EXISTS (
          SELECT 1 FROM farms 
          WHERE farms.id = weather_historical.farm_id 
            AND farms.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 3. SEED HISTORICAL WEATHER DATA (Last 30 Days)
--    We locate a farm or create a demo farm to link logs to.
-- ────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_farm_id UUID;
  v_date DATE;
  v_i INTEGER;
  v_temp_max DECIMAL(5,2);
  v_temp_min DECIMAL(5,2);
  v_temp_avg DECIMAL(5,2);
  v_humidity DECIMAL(5,2);
  v_wind DECIMAL(5,2);
  v_rain DECIMAL(6,2);
  v_uv DECIMAL(3,1);
  v_code INTEGER;
BEGIN
  -- 1. Try to find an existing farm
  SELECT id INTO v_farm_id FROM farms LIMIT 1;
  
  -- 2. If no farm exists, create a demo farm
  IF v_farm_id IS NULL THEN
    -- Try to find a user profile to link to
    DECLARE
      v_user_id UUID;
    BEGIN
      SELECT id INTO v_user_id FROM profiles LIMIT 1;
      
      -- Create a demo farm linked to that profile or default
      INSERT INTO farms (name, location, soil_type, land_area, user_id)
      VALUES ('Analysis Demo Farm', 'Central Valley', 'Loamy', 15.5, v_user_id)
      RETURNING id INTO v_farm_id;
    END;
  END IF;

  -- 3. Seed 30 days of weather data ending yesterday
  FOR v_i IN 1..30 LOOP
    v_date := CURRENT_DATE - v_i;
    
    -- Simulate realistic seasonal weather variance
    -- Introduce occasional rainy periods, hot/dry periods
    IF v_i % 7 = 0 THEN
      -- Heavy rain day
      v_temp_max := 24.0 + (random() * 3.0);
      v_temp_min := 18.0 + (random() * 2.0);
      v_humidity := 88.0 + (random() * 10.0);
      v_wind := 22.0 + (random() * 12.0);
      v_rain := 12.0 + (random() * 18.0);
      v_uv := 2.0 + (random() * 2.0);
      v_code := 65; -- Heavy rain
    ELSIF v_i % 5 = 0 THEN
      -- Drizzle / Showers day
      v_temp_max := 27.0 + (random() * 2.0);
      v_temp_min := 20.0 + (random() * 2.0);
      v_humidity := 75.0 + (random() * 12.0);
      v_wind := 12.0 + (random() * 8.0);
      v_rain := 1.5 + (random() * 4.5);
      v_uv := 4.0 + (random() * 3.0);
      v_code := 61; -- Slight rain
    ELSIF v_i % 11 = 0 THEN
      -- Heatwave day
      v_temp_max := 36.0 + (random() * 3.0);
      v_temp_min := 25.0 + (random() * 2.0);
      v_humidity := 45.0 + (random() * 10.0);
      v_wind := 8.0 + (random() * 5.0);
      v_rain := 0.0;
      v_uv := 9.0 + (random() * 2.0);
      v_code := 0; -- Clear sky
    ELSE
      -- Pleasant sunny / partly cloudy days
      v_temp_max := 29.0 + (random() * 4.0);
      v_temp_min := 21.0 + (random() * 3.0);
      v_humidity := 55.0 + (random() * 15.0);
      v_wind := 10.0 + (random() * 7.0);
      v_rain := 0.0;
      v_uv := 6.0 + (random() * 3.0);
      v_code := 1; -- Mainly clear
    END IF;
    
    v_temp_avg := (v_temp_max + v_temp_min) / 2.0;

    -- Insert record (skip if duplicate)
    INSERT INTO weather_historical (
      farm_id, recorded_date, temp_max, temp_min, temp_avg, 
      humidity_avg, wind_speed_max, rainfall_sum, uv_index_max, weather_code
    )
    VALUES (
      v_farm_id, v_date, v_temp_max, v_temp_min, v_temp_avg, 
      v_humidity, v_wind, v_rain, v_uv, v_code
    )
    ON CONFLICT (farm_id, recorded_date) DO NOTHING;
  END LOOP;
END $$;

-- ────────────────────────────────────────────────────────────
-- 4. ANALYTICAL VIEWS
-- ────────────────────────────────────────────────────────────

-- View: Weekly Weather Summary
CREATE OR REPLACE VIEW view_weather_weekly_summary AS
SELECT 
  farm_id,
  DATE_TRUNC('week', recorded_date)::DATE AS week_start,
  ROUND(AVG(temp_avg), 1) AS avg_temp,
  ROUND(MAX(temp_max), 1) AS peak_temp,
  ROUND(MIN(temp_min), 1) AS lowest_temp,
  ROUND(AVG(humidity_avg), 1) AS avg_humidity,
  ROUND(SUM(rainfall_sum), 2) AS total_rainfall_mm,
  ROUND(MAX(wind_speed_max), 1) AS max_wind_gust,
  COUNT(*) AS records_count
FROM weather_historical
GROUP BY farm_id, DATE_TRUNC('week', recorded_date)
ORDER BY week_start DESC;

-- View: Weather Advisories and High-Risk Situations
CREATE OR REPLACE VIEW view_weather_crop_advisories AS
SELECT
  w.id,
  w.farm_id,
  f.name AS farm_name,
  w.recorded_date,
  w.temp_max,
  w.humidity_avg,
  w.rainfall_sum,
  w.wind_speed_max,
  CASE
    WHEN w.rainfall_sum > 10.0 THEN 'HEAVY RAINFALL: High risk of soil erosion and waterlogging. Delay fertilizer spraying.'
    WHEN w.temp_max > 35.0 THEN 'HEAT STRESS RISK: High evapotranspiration rate. Increase irrigation frequency.'
    WHEN w.temp_max < 15.0 THEN 'COLD SUSCEPTIBILITY: Slow crop growth rates. Protect young seedlings.'
    WHEN w.humidity_avg > 80.0 AND w.temp_avg BETWEEN 20.0 AND 30.0 THEN 'HIGH DISEASE RISK: Warm, humid conditions favor fungal growth (e.g., Blight). Inspect crop leaves.'
    WHEN w.wind_speed_max > 25.0 THEN 'HIGH WIND WARNING: Risk of physical crop damage and rapid soil drying. Suspend pesticide spraying.'
    ELSE 'OPTIMAL: Favorable conditions for normal farming activities.'
  END AS advisory_status,
  CASE
    WHEN w.rainfall_sum > 10.0 OR w.temp_max > 35.0 OR w.wind_speed_max > 25.0 OR (w.humidity_avg > 80.0 AND w.temp_avg BETWEEN 20.0 AND 30.0) THEN TRUE
    ELSE FALSE
  END AS has_active_alert
FROM weather_historical w
JOIN farms f ON f.id = w.farm_id
ORDER BY w.recorded_date DESC;

-- View: Correlation Between Rain and Soil Moisture
-- Combines soil_analysis inputs with rain logs
CREATE OR REPLACE VIEW view_soil_weather_correlation AS
SELECT
  s.recorded_at::DATE AS analysis_date,
  f.id AS farm_id,
  f.name AS farm_name,
  s.moisture AS recorded_soil_moisture,
  w.rainfall_sum AS rain_on_day_mm,
  w.temp_avg AS temp_avg_celsius,
  w.humidity_avg AS humidity_avg_pct
FROM soil_analysis s
JOIN farms f ON f.id = s.farm_id
LEFT JOIN weather_historical w ON w.farm_id = f.id AND w.recorded_date = s.recorded_at::DATE
ORDER BY s.recorded_at DESC;

-- ============================================================
-- Seeding & analytics views created successfully!
-- ============================================================
