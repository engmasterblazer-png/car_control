import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Frota | Gestão de Veículos',
  description:
    'Gerencie sua frota de veículos, despesas e manutenções com uma interface inspirada no iOS.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#f2f2f7',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="font-sans text-[#1c1c1e] antialiased min-h-screen bg-[#f2f2f7] selection:bg-ios-blue/20">
        {children}
      </body>
    </html>
  )
}
