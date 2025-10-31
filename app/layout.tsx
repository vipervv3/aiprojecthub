import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI ProjectHub - Intelligent Management',
  description: 'AI-powered project management platform with intelligent task extraction, meeting intelligence, and smart notifications.',
  keywords: ['AI', 'project management', 'task management', 'meeting intelligence', 'notifications'],
  authors: [{ name: 'AI ProjectHub Team' }],
  openGraph: {
    title: 'AI ProjectHub - Intelligent Management',
    description: 'AI-powered project management platform with intelligent task extraction, meeting intelligence, and smart notifications.',
    type: 'website',
    locale: 'en_US',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}




















