'use client'

import Header from '../components/Header'
import Footer from '../components/Footer'
import ProductCard from '../components/ProductCard'
import Link from 'next/link'
import { products } from '../lib/data'
import { useStore } from '../components/StoreProvider'

export default function Wishlist(){const {wishlist}=useStore();const saved=products.filter((product)=>wishlist.includes(product.id));return <><Header/><main className="px-5 pb-24 pt-36 md:px-10"><p className="text-[10px] uppercase tracking-[.25em]">Saved for later</p><h1 className="mt-5 text-7xl tracking-[-.08em] md:text-[10rem]">Wishlist <span className="text-black/30">({saved.length})</span></h1>{saved.length?<div className="mt-16 grid gap-x-5 gap-y-12 md:grid-cols-3">{saved.map((product)=><ProductCard key={product.id} p={product}/>)}</div>:<div className="mt-16 border-y border-black/15 py-24 text-center"><p className="text-3xl tracking-tight">Nothing saved yet.</p><Link href="/shop" className="mt-7 inline-flex bg-ink px-6 py-4 text-[10px] uppercase tracking-[.2em] text-white">Explore the collection</Link></div>}</main><Footer/></>}
