import type { Metadata, Viewport } from 'next'
import { Source_Serif_4, IBM_Plex_Mono } from 'next/font/google'
import { ToastProvider } from '@/components/bongen/toast'
import './globals.css'

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '600', '700'],
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-plex-mono',
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'Bongen — Gängets tips, en bong.',
  description:
    'Alla tippar var för sig. Garderingarna hamnar där ni är oense, och systemet håller sig inom budgeten.',
}

export const viewport: Viewport = {
  themeColor: '#232120',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="sv" className="dark">
      <body className={`${sourceSerif.variable} ${plexMono.variable}`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
