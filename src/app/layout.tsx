import React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.scss'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Industrial Automation AI-First IDE',
  description: 'AI-powered development environment for industrial automation programming',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}