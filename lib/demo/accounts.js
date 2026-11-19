// lib/demo/accounts.js
//
// SERVER-ONLY. Create and clean up throw-away demo users with the
// service-role (admin) client. Only users whose email ends with
// @DEMO_EMAIL_DOMAIN are ever listed for deletion.
import { randomBytes } from 'node:crypto'
import {
  DEMO_EMAIL_DOMAIN, DEMO_SOFT_CAP, DEMO_HARD_CAP, DEMO_MAX_AGE_MS, isDemoEmail,
} from '@/lib/demo/config'

const PER_PAGE = 1000
const MAX_PAGES = 10

// All demo users, oldest first.
export async function listDemoUsers(admin) {
  const demo = []
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PER_PAGE })
    if (error) throw new Error(`listUsers: ${error.message}`)
    const users = data?.users ?? []
    for (const u of users) if (isDemoEmail(u.email)) demo.push(u)
    if (users.length < PER_PAGE) break
  }
  return demo.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
}

// Above the soft cap, delete demo users older than DEMO_MAX_AGE_MS (oldest
// first) until we are back under it. Returns how many demo users remain.
export async function pruneDemoUsers(admin) {
  const demo = await listDemoUsers(admin)
  let remaining = demo.length
  if (remaining < DEMO_SOFT_CAP) return remaining

  const cutoff = Date.now() - DEMO_MAX_AGE_MS
  for (const u of demo) {
    if (remaining < DEMO_SOFT_CAP) break
    if (new Date(u.created_at).getTime() > cutoff) break // sorted: the rest are newer
    if (!isDemoEmail(u.email)) continue // belt and braces
    const { error } = await admin.auth.admin.deleteUser(u.id)
    if (error) {
      console.warn('[demo] could not delete', u.id, error.message)
      continue
    }
    remaining--
  }
  return remaining
}

export function isOverHardCap(count) {
  return count >= DEMO_HARD_CAP
}

export async function createDemoUser(admin) {
  const email = `demo-${randomBytes(6).toString('hex')}@${DEMO_EMAIL_DOMAIN}`
  const password = randomBytes(18).toString('base64url')
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Demo Student', role: 'student', is_demo: true },
  })
  if (error || !data?.user) throw new Error(`createUser: ${error?.message || 'no user returned'}`)
  return { user: data.user, email, password }
}
