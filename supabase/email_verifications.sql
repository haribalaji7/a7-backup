-- Run this in Supabase SQL Editor
-- Table to store temporary email verifications (OTP codes)

CREATE TABLE IF NOT EXISTS public.email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON public.email_verifications(email);

ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (no anon/authenticated access needed)
CREATE POLICY "Service role has full access" ON public.email_verifications
  FOR ALL USING (true) WITH CHECK (true);
