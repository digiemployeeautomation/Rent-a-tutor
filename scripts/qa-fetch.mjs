// scripts/qa-fetch.mjs — fetch pages from the local dev server as a signed-in QA student.
//
//   node scripts/qa-fetch.mjs /dashboard/student /practice            (GET, prints status + size + error hints)
//   node scripts/qa-fetch.mjs --body /practice                        (also prints the visible text of the page)
//   node scripts/qa-fetch.mjs --post /api/x '{"a":1}'                 (POST JSON, prints the response)
//   node scripts/qa-fetch.mjs --cookie                                (prints the Cookie header to use with curl)
//
// Uses QA_EMAIL / QA_PASSWORD from .env.local (a throw-away test student).
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/).filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
)
const BASE = process.env.QA_BASE || 'http://localhost:3210'
const url = env.NEXT_PUBLIC_SUPABASE_URL
const ref = new URL(url).hostname.split('.')[0]

const supabase = createClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
const { data, error } = await supabase.auth.signInWithPassword({ email: env.QA_EMAIL, password: env.QA_PASSWORD })
if (error) { console.error('sign-in failed:', error.message); process.exit(1) }
const s = data.session
const raw = JSON.stringify([s.access_token, s.refresh_token, null, null, null])
const name = `sb-${ref}-auth-token`
const parts = raw.length <= 3180 ? [[name, raw]] : raw.match(/.{1,3180}/g).map((v, i) => [`${name}.${i}`, v])
const cookie = parts.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('; ')

// Git Bash rewrites a leading "/" into a Windows path; undo that. Paths may also be given without the leading slash.
const norm = (p) => (p.startsWith('--') || p.startsWith('{') ? p : '/' + p.replace(/^[A-Za-z]:[\/].*?[\/]Git[\/]?/, '').replace(/^\/+/, ''))
const args = process.argv.slice(2).map(norm)
if (args[0] === '--cookie') { console.log(cookie); process.exit(0) }

if (args[0] === '--post') {
  const res = await fetch(BASE + args[1], { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: args[2] || '{}' })
  console.log(res.status, (await res.text()).slice(0, 2000))
  process.exit(0)
}

const showBody = args[0] === '--body'
for (const path of showBody ? args.slice(1) : args) {
  const res = await fetch(BASE + path, { headers: { cookie }, redirect: 'manual' })
  const html = await res.text()
  const loc = res.headers.get('location')
  const hint = /Application error|Unhandled Runtime Error|__next_error__|digest:/i.test(html) ? '  <-- ERROR MARKER IN HTML' : ''
  console.log(`${res.status} ${path} (${html.length} bytes)${loc ? ' -> ' + loc : ''}${hint}`)
  if (showBody) {
    const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    console.log(text.slice(0, 3000))
  }
}
