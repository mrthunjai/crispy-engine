'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, Heart, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { assetPath, money, type Product } from '../lib/data'
import { useStore } from './StoreProvider'

export default function ProductShowcase({items}:{items:Product[]}) {
  return <div className="rounded-[2rem] bg-white p-4 shadow-[0_20px_80px_rgba(17,17,17,.08)] md:p-8">
    <div className="flex items-center justify-between border-b border-black/10 pb-5"><img src={assetPath('/brand/logo-black.png')} alt="" className="h-7 w-11 object-contain"/><div className="flex gap-5 text-[10px] uppercase tracking-[.18em] text-black/50"><span>Overview</span><span>Details</span><span>Care</span></div></div>
    <div className="hide-scrollbar mt-8 flex items-end gap-3 overflow-x-auto pb-2 md:gap-4">{items.map(item=><Link key={item.slug} href={`/product/${item.slug}`} className="group relative h-[390px] w-[170px] shrink-0 overflow-hidden bg-[#eeeae2] transition-[flex-basis,width] duration-500 hover:w-[290px] md:h-[520px] md:w-[150px] md:hover:w-[360px]"><img src={item.image} alt={item.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105"/><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#202737] via-[#202737]/75 to-transparent px-5 pb-5 pt-24 text-white opacity-100 transition duration-300 md:opacity-0 md:group-hover:opacity-100"><p className="text-xl tracking-[-.05em]">{item.name}</p><p className="mt-1 text-xs text-white/65">{item.type}</p><p className="mt-4 text-sm">{money(item.pricePaise)}</p></div><span className="absolute bottom-5 right-5 flex h-11 w-11 items-center justify-center bg-[#ff665d] text-white opacity-0 transition duration-300 group-hover:opacity-100"><Plus size={18}/></span></Link>)}</div>
    <div className="mt-5 flex items-center justify-between border-t border-black/10 pt-5"><p className="text-xs text-black/45">Hover a piece to explore · Click to configure</p><span className="flex items-center gap-2 text-[10px] uppercase tracking-[.18em]">Swipe on mobile <ArrowRight size={14}/></span></div>
  </div>
}

export function ProductConfigurator({p}:{p:Product}) {
  const {addToCart,isWishlisted,toggleWishlist}=useStore()
  const [colour,setColour]=useState(p.colors[0])
  const availableSizes=p.variants.filter((variant)=>variant.colour===colour&&variant.stockQuantity>0).map((variant)=>variant.size)
  const [size,setSize]=useState(availableSizes[Math.floor(availableSizes.length/2)] || p.sizes[0])
  const [added,setAdded]=useState(false)
  const variant=useMemo(()=>p.variants.find((item)=>item.colour===colour&&item.size===size),[colour,p.variants,size])
  const selectColour=(next:string)=>{ setColour(next); const first=p.variants.find((item)=>item.colour===next&&item.stockQuantity>0); if(first)setSize(first.size) }
  const add=()=>{ if(!variant)return; addToCart(p,variant); setAdded(true); window.setTimeout(()=>setAdded(false),1600) }
  const saved=isWishlisted(p.id)
  return <div className="overflow-hidden rounded-[2rem] bg-white shadow-[0_20px_80px_rgba(17,17,17,.08)] md:grid md:grid-cols-2">
    <div className="relative min-h-[520px] bg-[#202737] p-6 text-white md:min-h-[680px]"><Link href="/shop" className="absolute left-6 top-6 z-10 flex items-center gap-2 text-[10px] uppercase tracking-[.18em] text-white/70"><ArrowLeft size={14}/> Back</Link><div className="flex h-full items-center justify-center pt-8"><img src={p.image} alt={p.name} className="h-[78%] w-full object-cover"/></div><div className="absolute bottom-6 left-6"><p className="text-[10px] uppercase tracking-[.2em] text-white/50">{p.category}</p><p className="mt-2 text-3xl tracking-[-.06em]">{money(variant?.pricePaise??p.pricePaise)}</p></div></div>
    <div className="p-7 md:p-12"><p className="text-[10px] uppercase tracking-[.22em] text-black/45">Configure the piece</p><h1 className="mt-4 text-4xl tracking-[-.07em] md:text-6xl">{p.name}</h1><p className="mt-4 max-w-md text-sm leading-6 text-black/55">{p.description}</p>
      <section className="mt-10"><p className="mb-4 text-[10px] uppercase tracking-[.2em]">Colour / {colour}</p><div className="flex flex-wrap gap-3">{p.colors.map((item)=><button key={item} onClick={()=>selectColour(item)} className={`border px-4 py-3 text-xs ${colour===item?'border-ink bg-[#202737] text-white':'border-black/15'}`}>{item}</button>)}</div></section>
      <section className="mt-8"><p className="mb-4 text-[10px] uppercase tracking-[.2em]">Size / {size}</p><div className="grid grid-cols-5 gap-2">{p.sizes.map((item)=>{const option=p.variants.find((v)=>v.colour===colour&&v.size===item);const unavailable=!option||option.stockQuantity<1;return <button key={item} disabled={unavailable} onClick={()=>setSize(item)} className={`border py-3 text-xs disabled:cursor-not-allowed disabled:opacity-30 ${size===item?'border-ink bg-[#202737] text-white':'border-black/15'}`}>{item}</button>})}</div></section>
      {variant&&variant.stockQuantity<=4&&<p className="mt-5 text-xs text-[#d74c45]">Only {variant.stockQuantity} left in this option.</p>}
      <div className="mt-12 flex gap-3"><button onClick={add} disabled={!variant||variant.stockQuantity<1} className="flex flex-1 items-center justify-between bg-[#ff665d] px-5 py-4 text-[10px] uppercase tracking-[.2em] text-white disabled:opacity-40">{added?'Added to bag':'Add to bag'} <Plus size={17}/></button><button onClick={()=>toggleWishlist(p.id)} aria-label={saved?'Remove from wishlist':'Add to wishlist'} className={`flex h-12 w-12 items-center justify-center border border-black/15 ${saved?'bg-ink text-white':''}`}><Heart size={17} fill={saved?'currentColor':'none'}/></button></div>
    </div>
  </div>
}
