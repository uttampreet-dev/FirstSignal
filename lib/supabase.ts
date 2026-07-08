import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Anon client — safe to use in the browser (public keys).
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Service-role client — SERVER ONLY. The service key is not exposed to the browser
// (no NEXT_PUBLIC_ prefix), so it must never be evaluated during client bundle eval.
// We create it lazily via a proxy so that merely importing this module from a client
// component (e.g. for the anon `supabase` export) doesn't try to build the admin client
// with an undefined key.
let _admin: SupabaseClient | null = null
function getAdmin(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _admin
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getAdmin()
    const value = Reflect.get(client as object, prop, receiver)
    return typeof value === 'function' ? value.bind(client) : value
  },
})
