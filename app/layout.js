import './globals.css'
import { ThemeProvider } from '@/context/ThemeContext'
import { ToastProvider } from '@/components/ui/toast'
import AppShell from '@/components/layout/AppShell'

export const metadata = {
  title: 'Rent a Tutor',
  description: "Zambia's online learning platform for O-Level students",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans bg-white text-gray-900">
        <ThemeProvider>
          <ToastProvider>
            <AppShell>
              {children}
            </AppShell>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
