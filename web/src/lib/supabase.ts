import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente para operaciones administrativas (usar con cuidado)
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey
)

