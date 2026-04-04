import React from "react"
import type { Metadata } from 'next'
import { Inter, Zen_Dots, Bruno_Ace, Exo } from 'next/font/google'
import { LenisProvider } from "@/components/lenis-provider"

import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const zenDots = Zen_Dots({ weight: '400', subsets: ['latin'], variable: '--font-zen-dots' })
const brunoAce = Bruno_Ace({ weight: '400', subsets: ['latin'], variable: '--font-bruno-ace' })
const exo = Exo({ subsets: ['latin'], variable: '--font-exo' })

export const metadata: Metadata = {
  title: 'V0X3D - Turntable System',
  description: 'Premium 3D Turntable Experience - Special Edition',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${zenDots.variable} ${brunoAce.variable} ${exo.variable}`}>
      <body className="font-sans antialiased">
        <LenisProvider>{children}</LenisProvider>
      </body>
    </html>
  )
}
