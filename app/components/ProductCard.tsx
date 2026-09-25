'use client'

import Link from 'next/link'
import { ArrowUpRight, Heart, ShoppingBag, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { money, type Product } from '../lib/data'
import { useStore } from './StoreProvider'

export default function ProductCard({p}:{p:Product}) {
  const {addToCart, isWishlisted, toggleWishlist}=useStore()
  const [quickView,setQuickView]=useState(false)
  const [colour,setColour]=useState(p.colors[0])
  const firstVariant=p.variants.find((variant)=>variant.colour===colour&&variant.stockQuantity>0) ?? p.variants[0]
  const [size,setSize]=useState(firstVariant.size)
  const variant=useMemo(()=>p.variants.find((item)=>item.colour===colour&&item.size===size),[colour,p.variants,size])
  const saved=isWishlisted(p.id)
  const changeColour=(next:string)=>{setColour(next);const available=p.variants.find((item)=>item.colour===next&&item.stockQuantity>0);if(available)setSize(available.size)}
  const add=()=>{if(!variant||variant.stockQuantity<1)return;addToCart(p,variant);setQuickView(false)}
  return <>
    <article className="group">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#e5e1d8]">
        <Link href={`/product/${p.slug}`}><img src={p.image} alt={p.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105"/></Link>
        {p.tag&&<span className="absolute left-4 top-4 bg-white px-3 py-2 text-[9px] uppercase tracking-[.2em]">{p.tag}</span>}
        <button onClick={()=>toggleWishlist(p.id)} aria-label={saved?'Remove from wishlist':'Add to wishlist'} className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full ${saved?'bg-ink text-white':'bg-white'}`}><Heart size={16} fill={saved?'currentColor':'none'}/></button>
        <div className="absolute bottom-4 right-4 flex gap-2 opacity-100 transition md:opacity-0 md:group-hover:opacity-100"><button onClick={()=>setQuickView(true)} className="flex h-10 items-center gap-2 bg-white px-4 text-[9px] uppercase tracking-[.16em]">Quick add <ShoppingBag size={14}/></button><Link href={`/product/${p.slug}`} aria-label={`View ${p.name}`} className="flex h-10 w-10 items-center justify-center rounded-full bg-white"><ArrowUpRight size={16}/></Link></div>
      </div>
      <div className="flex justify-between gap-4 pt-4 text-sm"><div><p>{p.name}</p><p className="mt-1 text-xs text-black/45">{p.type}</p></div><p className="shrink-0">{money(p.pricePaise)}</p></div>
    </article>
    {quickView&&<div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 md:items-center md:p-6" role="dialog" aria-modal="true" aria-label={`Quick add ${p.name}`} onMouseDown={(event)=>{if(event.target===event.currentTarget)setQuickView(false)}}><div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto bg-[#f3f1eb] p-6 md:grid md:grid-cols-2 md:gap-8 md:p-8"><button onClick={()=>setQuickView(false)} className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white" aria-label="Close quick view"><X size={17}/></button><img src={p.image} alt={p.name} className="aspect-[4/5] h-full max-h-[540px] w-full object-cover"/><div className="pt-6 md:pt-8"><p className="text-[9px] uppercase tracking-[.22em] text-black/45">Quick add</p><h2 className="mt-3 text-4xl tracking-[-.06em]">{p.name}</h2><p className="mt-3 text-sm text-black/50">{money(variant?.pricePaise??p.pricePaise)}</p><div className="mt-8"><p className="mb-3 text-[9px] uppercase tracking-[.2em]">Colour / {colour}</p><div className="flex flex-wrap gap-2">{p.colors.map((item)=><button key={item} onClick={()=>changeColour(item)} className={`border px-4 py-3 text-xs ${colour===item?'border-ink bg-ink text-white':'border-black/15'}`}>{item}</button>)}</div></div><div className="mt-6"><p className="mb-3 text-[9px] uppercase tracking-[.2em]">Size / {size}</p><div className="grid grid-cols-5 gap-2">{p.sizes.map((item)=>{const option=p.variants.find((entry)=>entry.colour===colour&&entry.size===item);return <button key={item} disabled={!option||option.stockQuantity<1} onClick={()=>setSize(item)} className={`border py-3 text-xs disabled:opacity-25 ${size===item?'border-ink bg-ink text-white':'border-black/15'}`}>{item}</button>})}</div></div><button onClick={add} disabled={!variant||variant.stockQuantity<1} className="mt-8 flex w-full items-center justify-between bg-[#ff665d] px-5 py-4 text-[10px] uppercase tracking-[.2em] text-white disabled:opacity-40">Add selected variant <ShoppingBag size={16}/></button><Link href={`/product/${p.slug}`} className="mt-5 block text-center text-[9px] uppercase tracking-[.2em] underline">View full details</Link></div></div></div>}
  </>
}
