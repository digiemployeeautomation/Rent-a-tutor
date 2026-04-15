'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TopBar() {
  const [avatar, setAvatar] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setAvatar(user.user_metadata?.avatar_url)
    })
  }, [])

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
      <Link href="/" className="text-xl font-bold text-blue-600">
        Rent<span className="text-pink-400">a</span>Tutor
      </Link>
      <Link href="/dashboard/student/settings" className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-semibold overflow-hidden">
        {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : '?'}
      </Link>
    </header>
  )
}
