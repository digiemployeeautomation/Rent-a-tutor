import './globals.css'
import { cookies } from 'next/headers'
import { ThemeProvider } from '@/context/ThemeContext'

export const metadata = {
  title: 'Rent a Tutor',
  description: "Zambia's online tutoring platform for O-Level and A-Level students",
}

export default async function RootLayout({ children }) {
  // Read the role cookie set at login so the server renders the correct theme
  // immediately — prevents the green→blue flash tutors would otherwise see.
  // The ThemeContext will keep it in sync on the client after hydration.
  const cookieStore = await cookies()
  const roleCookie  = cookieStore.get('rat-role')?.value
  const theme       = roleCookie === 'tutor' ? 'tutor' : 'student'

  return (
    <html lang="en" data-theme={theme}>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
