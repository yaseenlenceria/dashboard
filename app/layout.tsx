import './globals.css'
import type { Metadata } from 'next'
import Providers from './providers'

export const metadata: Metadata = {
  title: 'SleepCycle Dashboard',
  description: 'Content management system for SleepCycle blog',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}