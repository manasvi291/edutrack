import './globals.css'

export const metadata = {
  title: 'EduTrack - Learning Dashboard',
  description: 'Track your courses, progress and achievements',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://cdn.jsdelivr.net/npm/remixicon@4.9.0/fonts/remixicon.css"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
