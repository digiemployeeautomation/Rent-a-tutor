import { describe, it, expect } from 'vitest'
import { pruneDemoUsers, listDemoUsers } from '../accounts.js'
import { DEMO_SOFT_CAP, isDemoEmail } from '../config.js'

const HOUR = 3_600_000

function fakeAdmin(users) {
  const deleted = []
  return {
    deleted,
    auth: {
      admin: {
        async listUsers({ page, perPage }) {
          return { data: { users: users.slice((page - 1) * perPage, page * perPage) }, error: null }
        },
        async deleteUser(id) {
          deleted.push(id)
          return { error: null }
        },
      },
    },
  }
}

function demoUser(i, hoursAgo) {
  return { id: `d${i}`, email: `demo-${i}@demo.rentatutor.app`, created_at: new Date(Date.now() - hoursAgo * HOUR).toISOString() }
}

describe('demo accounts', () => {
  it('recognises only the demo email domain', () => {
    expect(isDemoEmail('demo-abc@demo.rentatutor.app')).toBe(true)
    expect(isDemoEmail('Demo-ABC@DEMO.rentatutor.app')).toBe(true)
    expect(isDemoEmail('student@gmail.com')).toBe(false)
    expect(isDemoEmail('x@demo.rentatutor.app.evil.com')).toBe(false)
    expect(isDemoEmail(null)).toBe(false)
  })

  it('lists only demo users, oldest first', async () => {
    const admin = fakeAdmin([demoUser(1, 1), { id: 'real', email: 'real@gmail.com', created_at: new Date(0).toISOString() }, demoUser(2, 5)])
    const list = await listDemoUsers(admin)
    expect(list.map((u) => u.id)).toEqual(['d2', 'd1'])
  })

  it('does nothing below the soft cap', async () => {
    const admin = fakeAdmin([demoUser(1, 100), demoUser(2, 200)])
    expect(await pruneDemoUsers(admin)).toBe(2)
    expect(admin.deleted).toEqual([])
  })

  it('above the cap deletes only demo users older than 24h, never real users', async () => {
    const users = [{ id: 'real', email: 'teacher@school.zm', created_at: new Date(0).toISOString() }]
    for (let i = 0; i < DEMO_SOFT_CAP + 5; i++) users.push(demoUser(i, i < 10 ? 48 + i : 1))
    const admin = fakeAdmin(users)
    const remaining = await pruneDemoUsers(admin)
    expect(admin.deleted).not.toContain('real')
    expect(admin.deleted.length).toBe(6) // back under the cap: 305 -> 299
    expect(admin.deleted.every((id) => Number(id.slice(1)) < 10)).toBe(true)
    expect(remaining).toBe(DEMO_SOFT_CAP - 1)
  })

  it('cannot prune fresh demo users', async () => {
    const users = []
    for (let i = 0; i < DEMO_SOFT_CAP + 2; i++) users.push(demoUser(i, 1))
    const admin = fakeAdmin(users)
    expect(await pruneDemoUsers(admin)).toBe(DEMO_SOFT_CAP + 2)
    expect(admin.deleted).toEqual([])
  })
})
