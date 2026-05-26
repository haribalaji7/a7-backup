-- Step 1: Run this FIRST to create a farm and get its ID
INSERT INTO farms (name, location, soil_type, land_area) 
VALUES ('CSV Import Farm', 'North Region', 'Black', 10.0)
RETURNING id;