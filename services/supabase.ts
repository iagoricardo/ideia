
import { createClient } from '@supabase/supabase-js';

// Credenciais fornecidas pelo usuário
// Project Reference obtido do payload do token JWT: safbtwzeajjnrqzdexup
const SUPABASE_URL = 'https://safbtwzeajjnrqzdexup.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhZmJ0d3plYWpqbnJxemRleHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NTc2MjksImV4cCI6MjA3OTIzMzYyOX0.E3irGttFiq4jLzXDCEYRKTAc-eHdHTyJ0HgDsjuLiEQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
