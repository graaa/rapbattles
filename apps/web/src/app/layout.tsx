import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RapBattle Voter',
  description: 'Live rap battle voting system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  )
}
