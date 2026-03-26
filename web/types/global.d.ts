import { SupabaseClient } from '@supabase/supabase-js';

declare global {
  interface Window {
    supabase?: SupabaseClient;
    initializeSupabase?: () => Promise<void>;
    getCurrentUser?: () => Promise<any>;
    isGestor?: () => Promise<boolean>;
    isAdministrador?: () => Promise<boolean>;
    temPermissao?: (permissao: string) => Promise<boolean>;
    logout?: () => Promise<void>;
    aplicarPermissoesUI?: () => Promise<any>;
    initializeUserSystem?: () => Promise<void>;
  }
}

export {};