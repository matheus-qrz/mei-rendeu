import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// ─── Client público (browser / componentes) ───────────────
// Usa anon key — respeita RLS
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Client admin (API Routes / server) ───────────────────
// Usa service_role — bypassa RLS, NUNCA expor no cliente
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
