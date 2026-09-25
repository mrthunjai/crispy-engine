'use client'

import { useMemo, useState } from 'react'
import { Search as SearchIcon } from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ProductCard from '../components/ProductCard'
import { useStore } from '../components/StoreProvider'

export default function Search(){
  const {products}=useStore()
  const [query,setQuery]=useState('')
  const results=useMemo(()=>{const term=query.trim().toLowerCase();return term?products.filter((product)=>[product.name,product.category,product.type,...product.colors,...product.sizes].some((value)=>value.toLowerCase().includes(term))):products},[query])
  return <><Header/><main className="px-5 pb-24 pt-36 md:px-10"><p className="text-[10px] uppercase tracking-[.25em]">Find a piece</p><label className="mt-6 flex items-center gap-4 border-b border-ink pb-5"><SearchIcon size={26}/><input autoFocus value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Search the collection" className="w-full bg-transparent text-3xl tracking-tight outline-none md:text-5xl"/></label><p className="mt-6 text-xs text-black/45">{results.length} {results.length===1?'result':'results'}</p>{results.length?<div className="mt-8 grid gap-x-5 gap-y-12 md:grid-cols-3">{results.map((product)=><ProductCard key={product.id} p={product}/>)}</div>:<div className="mt-16 border-y border-black/15 py-20 text-center text-2xl">No pieces found.</div>}</main><Footer/></>
}
