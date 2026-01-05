import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check your .env.local file."
  );
}

// Singleton pattern para evitar múltiples instancias
let supabaseInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

// Cliente principal de Supabase (singleton)
export const supabase = ((): SupabaseClient => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage:
          typeof window !== "undefined" ? window.localStorage : undefined,
        storageKey: "sb-auth-token",
      },
    });
  }
  return supabaseInstance;
})();

// Cliente para operaciones administrativas (singleton)
// NOTA: En el cliente (navegador), supabaseAdmin es igual a supabase
// Las operaciones administrativas dependen de las políticas RLS y el rol del usuario
export const supabaseAdmin = ((): SupabaseClient => {
  if (!supabaseAdminInstance) {
    // En el navegador, usar el mismo cliente con autenticación
    // Las políticas RLS permitirán las operaciones según el rol del usuario
    supabaseAdminInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return supabaseAdminInstance;
})();
