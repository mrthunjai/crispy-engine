import './globals.css'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'KESHEV — Everyday, considered', description: 'Contemporary essentials, made to move.' }
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html> }
