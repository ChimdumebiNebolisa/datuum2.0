import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/ui/simple-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Datuum 2.0 - Advanced Data Visualization',
  description: 'Privacy-first data visualization platform with Python-powered analytics',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    apple: '/favicon.svg',
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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script 
          src="https://cdn.jsdelivr.net/pyodide/v0.26.0/full/pyodide.js"
          crossOrigin="anonymous"
        />
      </head>
      <body className={inter.className}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
