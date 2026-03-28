import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
 
// Single shared instance for client components.
// Imported everywhere as: import { supabase } from '@/lib/supabase'
export const supabase = createClientComponentClient()
