import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pzryuvurgcdpvdqgubyf.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6cnl1dnVyZ2NkcHZkcWd1YnlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTkwNTAsImV4cCI6MjA4OTU5NTA1MH0.eg1plm6x9Zk8DhlN1p6UNVRTh3SSwzMqPMkEzoICpYM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});