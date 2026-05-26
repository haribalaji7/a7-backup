-- Security Fixes Migration
-- Run this in the Supabase SQL Editor

-- 1. Fix feedback table RLS - replace permissive WITH CHECK (true)
DROP POLICY IF EXISTS "Anyone can submit feedback" ON feedback;
DROP POLICY IF EXISTS "Anyone can view feedback" ON feedback;

CREATE POLICY "Anyone can submit feedback" ON feedback FOR INSERT WITH CHECK (
  auth.uid() = user_id OR (name IS NOT NULL AND email IS NOT NULL AND message IS NOT NULL)
);
CREATE POLICY "Users can view own feedback" ON feedback FOR SELECT USING (auth.uid() = user_id);

-- 2. Revoke SELECT from anon on sensitive user data tables (GraphQL exposure)
REVOKE SELECT ON farms FROM anon;
REVOKE SELECT ON profiles FROM anon;
REVOKE SELECT ON soil_analysis FROM anon;
REVOKE SELECT ON transactions FROM anon;
REVOKE SELECT ON scans FROM anon;
REVOKE SELECT ON weather_cache FROM anon;

-- 3. Revoke also from authenticated (keeps them RLS-protected only)
REVOKE SELECT ON farms FROM authenticated;
REVOKE SELECT ON profiles FROM authenticated;
REVOKE SELECT ON soil_analysis FROM authenticated;
REVOKE SELECT ON transactions FROM authenticated;
REVOKE SELECT ON scans FROM authenticated;
REVOKE SELECT ON weather_cache FROM authenticated;

-- 4. Fix handle_new_user - SECURITY INVOKER + explicit search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  SET search_path TO auth, public;
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- 5. feedback table should also be protected from anon in GraphQL (keep RLS for INSERT but revoke SELECT)
REVOKE SELECT ON feedback FROM anon;