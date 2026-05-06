import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase: any = null;

if (supabaseUrl && supabaseKey && supabaseUrl !== 'https://tu-proyecto.supabase.co' && supabaseKey !== 'tu_clave_anon_aqui') {
    supabase = createClient(supabaseUrl, supabaseKey);
} else {
    console.warn('Supabase no configurado. La app funcionará en modo offline.');
}

export { supabase };
