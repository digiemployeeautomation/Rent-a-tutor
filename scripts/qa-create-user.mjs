// scripts/qa-create-user.mjs — creates (or resets) the throw-away QA student used by qa-fetch.mjs.
import fs from 'node:fs'
import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const file = '.env.local'
let text = fs.readFileSync(file, 'utf8')
const env = Object.fromEntries(text.split(/\r?\n/).filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]))
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })

const email = 'qa.student@rentatutor.test'
const password = env.QA_PASSWORD || crypto.randomBytes(12).toString('base64url')

const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 })
let user = list.users.find((u) => u.email === email)
if (user) {
  await admin.auth.admin.updateUserById(user.id, { password })
} else {
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: 'QA Student', role: 'student' } })
  if (error) { console.error(error.message); process.exit(1) }
  user = data.user
}

const { error: pErr } = await admin.from('user_ielts_profile').upsert({
  user_id: user.id, variant: 'academic', target_band: 7, weakest_section: 'writing', hours_per_week: 6,
  completed_at: new Date().toISOString(),
}, { onConflict: 'user_id' })
if (pErr) console.error('profile:', pErr.message)

if (!env.QA_EMAIL) {
  text = text.replace(/\s*$/, '\n') + `QA_EMAIL=${email}\nQA_PASSWORD=${password}\n`
  fs.writeFileSync(file, text)
}
console.log('QA user ready:', user.id)
