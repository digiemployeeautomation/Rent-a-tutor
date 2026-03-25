import './globals.css'

export const metadata = {
  title: 'Rent a Tutor',
  description: "Zambia's online tutoring platform for O-Level and A-Level students",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
