/**
 * Cliente Supabase — reemplaza las llamadas a Google Apps Script.
 * Credenciales en .env (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).
 */
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn(
    '⚠️ Faltan credenciales de Supabase. Copiá .env.example como .env y completá VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(url || 'https://placeholder.supabase.co', anonKey || 'placeholder');

export default supabase;
