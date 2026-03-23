// Exportar tudo do shared
export { supabase } from './services/supabase';
export { useAuth } from './hooks/useAuth';  
export * from './types';
export { formatDate, formatCPF, calcularProximaPromocao } from './utils/formatters';