import { createClient } from '@supabase/supabase-js';
import { MockSupabaseClient } from './mockSupabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

// Detect if using the default paused Supabase instance, or manual mock override
const useMock = !supabaseUrl || supabaseUrl.includes("xlnbfdcaarevnnmlgpfr") || process.env.SUPABASE_SERVICE_KEY === "true";

export const supabaseAdmin = useMock
  ? (new MockSupabaseClient() as any)
  : createClient(supabaseUrl, supabaseServiceKey);
