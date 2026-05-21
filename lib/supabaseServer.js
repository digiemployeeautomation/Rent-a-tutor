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
import { cookies } from 'next/headers'

export function createServerClient() {
  return createRouteHandlerClient({ cookies })
}

export function createServerComponentClientFor() {
  return createServerComponentClient({ cookies })
}
