import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xlnbfdcaarevnnmlgpfr.supabase.co';
const supabaseAnonKey = 'xlnbfdcaarevnnmlgpfr';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('Testing Supabase connection...');
  console.log('URL:', supabaseUrl);
  
  try {
    const { data, error } = await supabase.from('users').select('*').limit(1);
    console.log('Connected! Response:', { data, error });
  } catch (err) {
    console.error('Error:', err);
  }
}

testConnection();