import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

/**
 * Use in: Server Components
 *
 * const supabase = createSupabaseServerClient()
 * const { data: { user } } = await supabase.auth.getUser()
 */
export function createSupabaseServerClient() {
  return createServerComponentClient({ cookies })
}
