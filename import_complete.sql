-- Complete import: Create farms per region and auto-map soil data
-- Run ALL at once in Supabase SQL Editor

-- Create farms for each region with mapping
WITH farms_cte AS (
  INSERT INTO farms (id, name, location, soil_type, land_area, created_at) 
  VALUES 
    (gen_random_uuid(), 'North Farm', 'North', 'Black', 10.0, NOW()),
    (gen_random_uuid(), 'South Farm', 'South', 'Red', 8.0, NOW()),
    (gen_random_uuid(), 'East Farm', 'East', 'Sandy', 12.0, NOW()),
    (gen_random_uuid(), 'West Farm', 'West', 'Black', 20.0, NOW()),
    (gen_random_uuid(), 'Central Farm', 'Central', 'Loamy', 18.0, NOW())
  RETURNING id, name, location
),
soil_north AS (
  INSERT INTO soil_analysis (farm_id, nitrogen, phosphorus, potassium, ph, recorded_at)
  SELECT (SELECT id FROM farms_cte WHERE location = 'North'), nitrogen, phosphorus, potassium, ph, NOW()
  FROM (VALUES 
    (45, 30, 35, 6.5), (60, 45, 50, 6.8), (55, 35, 40, 6.0), (58, 42, 48, 6.6), 
    (68, 52, 58, 6.9), (42, 28, 33, 6.1), (52, 38, 44, 6.4), (72, 55, 62, 7.1),
    (48, 30, 35, 5.9), (62, 45, 50, 6.7), (40, 26, 32, 6.0), (60, 44, 50, 6.6),
    (71, 53, 61, 6.9), (44, 31, 36, 5.9), (69, 51, 57, 6.7), (59, 43, 48, 6.5)
  ) AS v(n,p,k,ph)
  RETURNING id
),
soil_south AS (
  INSERT INTO soil_analysis (farm_id, nitrogen, phosphorus, potassium, ph, recorded_at)
  SELECT (SELECT id FROM farms_cte WHERE location = 'South'), nitrogen, phosphorus, potassium, ph, NOW()
  FROM (VALUES 
    (35, 20, 25, 5.8), (40, 25, 30, 5.5), (30, 18, 22, 5.2), (38, 22, 28, 5.6),
    (36, 24, 26, 5.7), (33, 19, 24, 5.4), (39, 25, 29, 5.8), (37, 23, 27, 5.6),
    (41, 28, 33, 5.7), (43, 30, 35, 5.8)
  ) AS v(n,p,k,ph)
  RETURNING id
),
soil_east AS (
  INSERT INTO soil_analysis (farm_id, nitrogen, phosphorus, potassium, ph, recorded_at)
  SELECT (SELECT id FROM farms_cte WHERE location = 'East'), nitrogen, phosphorus, potassium, ph, NOW()
  FROM (VALUES 
    (80, 55, 65, 7.2), (65, 48, 52, 6.5), (75, 60, 70, 7.0), (73, 56, 65, 7.0),
    (64, 46, 52, 6.6), (76, 57, 66, 7.1), (74, 54, 63, 7.0)
  ) AS v(n,p,k,ph)
  RETURNING id
),
soil_west AS (
  INSERT INTO soil_analysis (farm_id, nitrogen, phosphorus, potassium, ph, recorded_at)
  SELECT (SELECT id FROM farms_cte WHERE location = 'West'), nitrogen, phosphorus, potassium, ph, NOW()
  FROM (VALUES 
    (50, 40, 45, 6.2), (45, 32, 38, 6.3), (54, 40, 46, 6.3), (47, 34, 40, 6.4),
    (53, 39, 45, 6.4), (51, 37, 42, 6.2), (49, 36, 41, 6.3), (56, 41, 47, 6.5),
    (48, 33, 38, 6.1)
  ) AS v(n,p,k,ph)
  RETURNING id
),
soil_central AS (
  INSERT INTO soil_analysis (farm_id, nitrogen, phosphorus, potassium, ph, recorded_at)
  SELECT (SELECT id FROM farms_cte WHERE location = 'Central'), nitrogen, phosphorus, potassium, ph, NOW()
  FROM (VALUES 
    (70, 50, 55, 6.8), (78, 58, 68, 7.3), (66, 50, 56, 6.8), (70, 52, 60, 6.9),
    (67, 49, 55, 6.8), (63, 47, 53, 6.7)
  ) AS v(n,p,k,ph)
  RETURNING id
)
SELECT 'Created farms and soil analysis successfully!' AS status;