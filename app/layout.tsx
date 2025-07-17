import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WorkSpace',
  description: 'WorkSpace - Web Application',
  generator: 'WorkSpace',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
