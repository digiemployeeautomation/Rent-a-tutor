import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

/**
 * Use in: Client Components ('use client')
 *
 * const supabase = createSupabaseBrowserClient()
 */
export function createSupabaseBrowserClient() {
  return createClientComponentClient()
}

// Drop-in replacement for your existing lib/supabase.js
// Replace the contents of lib/supabase.js with this file
// so existing imports keep working unchanged.
export const supabase = createSupabaseBrowserClient()
