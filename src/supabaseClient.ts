import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Faltan las variables publicas de Supabase.')
}

export const PORTFOLIO_BUCKET = 'portfolio-media'
export const PORTFOLIO_FUNCTION_URL = import.meta.env.DEV
  ? '/api/portfolio'
  : `${supabaseUrl}/functions/v1/portfolio-api`

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})

export function getPublicMediaUrl(path: string) {
  return supabase.storage.from(PORTFOLIO_BUCKET).getPublicUrl(path).data.publicUrl
}

export function getSupabaseRequestHeaders(accessToken?: string) {
  return {
    apikey: supabasePublishableKey,
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  }
}
