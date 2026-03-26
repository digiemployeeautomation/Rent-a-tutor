import './globals.css'
import { ThemeProvider } from '@/context/ThemeContext'

export const metadata = {
  title: 'Rent a Tutor',
  description: "Zambia's online tutoring platform for O-Level and A-Level students",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="student">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
