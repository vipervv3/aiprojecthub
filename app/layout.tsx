import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import PWAInstallPrompt from '@/components/pwa-install-prompt'

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
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AI ProjectHub',
  },
  other: {
    'application-name': 'AI ProjectHub',
    'mobile-web-app-capable': 'yes',
    'theme-color': '#2563eb',
    'msapplication-TileColor': '#2563eb',
    'format-detection': 'telephone=no',
  },
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '180x180', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '167x167', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '152x152', type: 'image/png' },
    ],
    shortcut: '/icon-192x192.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Additional PWA Meta Tags - Next.js metadata doesn't cover all of these */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
          <PWAInstallPrompt />
        </Providers>
      </body>
    </html>
  )
}




















