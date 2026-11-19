// app/downloads/page.js — the offline library.
//
// IMPORTANT: this page has NO server data. Everything is read in the browser
// (IndexedDB + localStorage), so its HTML is identical for everyone and the
// service worker (public/sw.js) can cache it and reuse it offline — also for
// /downloads?lesson=<id>, which plays a saved lesson inside this same page.
import { Suspense } from 'react'
import DownloadsClient, { DownloadsSkeleton } from './DownloadsClient'

export const metadata = {
  title: 'Downloads',
  description: 'Lessons saved on this device. They open without internet or data.',
}

export default function DownloadsPage() {
  return (
    <Suspense fallback={<DownloadsSkeleton />}>
      <DownloadsClient />
    </Suspense>
  )
}
