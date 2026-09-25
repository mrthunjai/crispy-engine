'use client'

import Link from 'next/link'
import { Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react'
import { useState } from 'react'
import { useStore } from './StoreProvider'
import { assetPath } from '../lib/data'

export default function Header() {
  const [open,setOpen]=useState(false)
  const {cartCount}=useStore()
  return <>
    <header className="fixed top-0 z-30 flex h-16 w-full items-center justify-between bg-ink px-5 text-white md:px-10">
      <button className="md:hidden" onClick={()=>setOpen(true)} aria-label="Open menu"><Menu size={18}/></button>
      <nav className="hidden gap-7 text-[10px] uppercase tracking-[.24em] md:flex"><Link href="/about">About</Link><Link href="/shop">Shop</Link><Link href="/">Home</Link><Link href="/journal">News</Link></nav>
      <Link href="/" className="absolute left-1/2 -translate-x-1/2" aria-label="Home"><img src={assetPath('/brand/logo-white.png')} alt="" className="h-9 w-14 object-contain"/></Link>
      <div className="flex items-center gap-5 text-[10px] uppercase tracking-[.2em]"><Link href="/search" aria-label="Search"><Search size={17}/></Link><Link href="/account" className="hidden items-center gap-2 md:flex"><UserRound size={17}/><span>Sign up / Log in</span></Link><Link href="/cart" className="flex items-center gap-2"><ShoppingBag size={17}/><span>({cartCount})</span></Link></div>
    </header>
    {open&&<div className="fixed inset-0 z-40 bg-ink p-6 text-white"><button className="absolute right-6 top-6" onClick={()=>setOpen(false)} aria-label="Close menu"><X/></button><img src={assetPath('/brand/logo-white.png')} alt="" className="h-12 w-20 object-contain"/><div className="mt-16 flex flex-col gap-5 text-4xl tracking-tight">{[['Shop','/shop'],['About','/about'],['Home','/'],['News','/journal'],['Account','/account']].map(([n,h])=><Link key={h} href={h} onClick={()=>setOpen(false)}>{n}</Link>)}</div></div>}
  </>
}
