import './globals.css'
import type { Metadata } from 'next'
import { CartProvider } from './context/CartContext'
import { StoreProvider } from './components/StoreProvider'
import { getCatalogue } from './lib/catalogue'

export const metadata: Metadata = {
  title: 'Everyday, considered',
  description: 'Contemporary essentials, made to move.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const catalogue = await getCatalogue()
  return (
    <html lang="en">
      <body>
        <StoreProvider initialProducts={catalogue}>
          <CartProvider>{children}</CartProvider>
        </StoreProvider>
      </body>
    </html>
  )
}

