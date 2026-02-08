import type { Metadata } from 'next'
import { Oswald, DM_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const oswald = Oswald({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700'],
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: 'Stryktipset — Samarbeta • Tippa • Vinn',
  description:
    'Collaboratively build your Stryktipset bong with friends in real-time.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="sv" className="dark">
      <body className={`${oswald.variable} ${dmMono.variable}`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
