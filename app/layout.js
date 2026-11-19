import './globals.css'
import localFont from 'next/font/local'
import { ThemeProvider } from '@/context/ThemeContext'
import { ToastProvider } from '@/components/ui/toast'
import AppShell from '@/components/layout/AppShell'
import OfflineRegistrar from '@/components/offline/OfflineRegistrar'

// Fonts are bundled with the app (no request to Google at run time), so
// they also work in offline lessons.
const sans = localFont({ src: './fonts/inter-latin.woff2', variable: '--font-sans', weight: '400 700', display: 'swap' })
const display = localFont({ src: './fonts/bricolage-latin.woff2', variable: '--font-display', weight: '400 800', display: 'swap' })

export const metadata = {
  title: { default: 'Rent a Tutor — High school & IELTS, taught step by step', template: '%s · Rent a Tutor' },
  description: 'Online tutoring for Zambian secondary school subjects and IELTS preparation. Clear lessons, instant feedback, and downloads that work offline.',
  manifest: '/manifest.webmanifest',
  applicationName: 'Rent a Tutor',
  appleWebApp: { capable: true, title: 'Rent a Tutor', statusBarStyle: 'default' },
}

export const viewport = {
  themeColor: '#0B1730',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${display.variable}`}>
      <body className="bg-paper font-sans text-ink-900 antialiased">
        <ThemeProvider>
          <ToastProvider>
            <AppShell>
              {children}
            </AppShell>
            <OfflineRegistrar />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
