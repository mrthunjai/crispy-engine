'use client'
import Link from 'next/link'
import { Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react'
import { useState } from 'react'
import { useCart } from '../context/CartContext'

export default function Header({ count }: { count?: number }) {
  const [open, setOpen] = useState(false)
  const cart = useCart()
  const displayCount = count !== undefined ? count : cart.count

  return (
    <>
      <header className="fixed top-0 z-30 flex w-full items-center justify-between bg-ink px-5 py-5 text-white md:px-10">
        <button className="md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu size={18} />
        </button>
        <nav className="hidden gap-7 text-[10px] uppercase tracking-[.24em] md:flex">
          <Link href="/about">About</Link>
          <Link href="/shop">Shop</Link>
          <Link href="/">Home</Link>
          <Link href="/journal">Journal</Link>
        </nav>
        <Link href="/" className="absolute left-1/2 -translate-x-1/2 text-xl font-bold tracking-[-.08em]">
          KESHEV
        </Link>
        <div className="flex items-center gap-5 text-[10px] uppercase tracking-[.2em]">
          <Link href="/search" aria-label="Search">
            <Search size={17} />
          </Link>
          <Link href="/account" className="hidden md:block" aria-label="Account">
            <UserRound size={17} />
          </Link>
          <Link href="/cart" className="flex items-center gap-2">
            <ShoppingBag size={17} />
            <span>({displayCount})</span>
          </Link>
        </div>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 bg-ink p-6 text-white">
          <button className="absolute right-6 top-6" onClick={() => setOpen(false)} aria-label="Close menu">
            <X />
          </button>
          <div className="mt-20 flex flex-col gap-5 text-4xl tracking-tight">
            {[
              ['Shop', '/shop'],
              ['About', '/about'],
              ['Journal', '/journal'],
              ['Account', '/account'],
            ].map(([n, h]) => (
              <Link key={h} href={h} onClick={() => setOpen(false)}>
                {n}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

