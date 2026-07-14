import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

function createMockClient(): SupabaseClient {
  const result = Promise.resolve({ data: null, error: null })
  const chain = () => result
  return new Proxy({} as SupabaseClient, {
    get: () => chain,
  })
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '%c[Nortek CRM] %cSupabase .env not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env',
    'color:#c8ff00', 'color:#EF4444'
  )
}

export const supabase: SupabaseClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient()
