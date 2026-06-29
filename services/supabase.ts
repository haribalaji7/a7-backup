import { createClient } from '@supabase/supabase-js';
import { MockSupabaseClient } from './mockSupabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Detect if using the default paused Supabase instance, or manual mock override
const useMock = !supabaseUrl || supabaseUrl.includes("xlnbfdcaarevnnmlgpfr") || process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === "true";

export const supabase = useMock
  ? (new MockSupabaseClient() as any)
  : createClient(supabaseUrl, supabaseAnonKey);