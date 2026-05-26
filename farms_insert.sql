-- Create farms from CSV data
-- Run this in Supabase SQL Editor

-- Insert farms for each unique region in the CSV
INSERT INTO farms (id, name, location, soil_type, land_area, latitude, longitude, created_at) VALUES
(gen_random_uuid(), 'North Farm 1', 'North Region', 'Black', 10.0, 28.6139, 77.2090, NOW()),
(gen_random_uuid(), 'North Farm 2', 'North Region', 'Loamy', 15.0, 28.7041, 77.1026, NOW()),
(gen_random_uuid(), 'South Farm 1', 'South Region', 'Red', 8.0, 12.2958, 76.8547, NOW()),
(gen_random_uuid(), 'East Farm 1', 'East Region', 'Sandy', 12.0, 22.5726, 88.3639, NOW()),
(gen_random_uuid(), 'West Farm 1', 'West Region', 'Black', 20.0, 19.0760, 72.8777, NOW()),
(gen_random_uuid(), 'Central Farm 1', 'Central Region', 'Loamy', 18.0, 23.2599, 77.4126, NOW());

-- Get the created farm IDs (copy these for soil_analysis inserts)
SELECT id, name, location FROM farms;