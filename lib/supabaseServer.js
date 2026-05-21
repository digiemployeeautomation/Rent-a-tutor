// lib/supabaseServer.js
//
// Two server-side Supabase helpers:
//   - createServerClient()       — for app/api/**/route.js (Route Handlers)
//   - createServerComponentClientFor() — for app/**/page.js (Server Components)
//
// They differ in cookie handling: Route Handlers can write Set-Cookie;
// Server Components are read-only. Using the wrong one in a Server
// Component triggers a Server Components render 500 in production.
import {
  createRouteHandlerClient,
  createServerComponentClient,
} from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export function createServerClient() {
  return createRouteHandlerClient({ cookies })
}

export function createServerComponentClientFor() {
  return createServerComponentClient({ cookies })
}

// Service-role client. Bypasses RLS — use only for writes that the
// authenticated user must NOT be able to forge (e.g. grade rows).
// Reads should still go through the user-scoped client so RLS applies.
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL is not set')
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
