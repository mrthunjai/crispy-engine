import './globals.css'
import type { Metadata } from 'next'
import { CartProvider } from './context/CartContext'
import { StoreProvider } from './components/StoreProvider'

export const metadata: Metadata = {
  title: 'Everyday, considered',
  description: 'Contemporary essentials, made to move.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StoreProvider><CartProvider>{children}</CartProvider></StoreProvider>
      </body>
    </html>
  )
}

