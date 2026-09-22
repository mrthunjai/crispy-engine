'use client'

import { useMemo, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ProductCard from '../components/ProductCard'
import { products } from '../lib/data'

type Sort = 'featured'|'price-low'|'price-high'|'name'

export default function Shop(){
  const [category,setCategory]=useState('All')
  const [size,setSize]=useState('All')
  const [colour,setColour]=useState('All')
  const [sort,setSort]=useState<Sort>('featured')
  const sizes=Array.from(new Set(products.flatMap((product)=>product.sizes)))
  const colours=Array.from(new Set(products.flatMap((product)=>product.colors)))
  const visible=useMemo(()=>products.filter((product)=>(category==='All'||product.category===category)&&(size==='All'||product.sizes.includes(size))&&(colour==='All'||product.colors.includes(colour))).sort((a,b)=>sort==='price-low'?a.pricePaise-b.pricePaise:sort==='price-high'?b.pricePaise-a.pricePaise:sort==='name'?a.name.localeCompare(b.name):0),[category,colour,size,sort])
  return <><Header/><main className="site-main mx-auto max-w-7xl"><div className="mb-10 flex items-end justify-between gap-8"><div><p className="site-kicker">The collection</p><h1 className="site-title">Shop</h1></div><p className="hidden max-w-xs text-right text-sm leading-6 text-black/50 md:block">A small system of everyday pieces. Choose a piece, then select its colour and size.</p></div>
    <div className="mb-10 grid gap-3 border-y border-black/15 py-5 sm:grid-cols-2 lg:grid-cols-4">
      <Filter label="Category" value={category} setValue={setCategory} options={['All','Tops','Bottoms']}/>
      <Filter label="Size" value={size} setValue={setSize} options={['All',...sizes]}/>
      <Filter label="Colour" value={colour} setValue={setColour} options={['All',...colours]}/>
      <label className="text-[9px] uppercase tracking-[.2em] text-black/50">Sort<select value={sort} onChange={(event)=>setSort(event.target.value as Sort)} className="mt-2 w-full bg-transparent py-2 text-xs text-ink outline-none"><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name</option></select></label>
    </div>
    <p className="mb-5 text-xs text-black/45">{visible.length} {visible.length===1?'piece':'pieces'}</p>
    {visible.length?<div className="grid gap-x-5 gap-y-12 md:grid-cols-2 lg:grid-cols-3">{visible.map((product)=><ProductCard key={product.id} p={product}/>)}</div>:<div className="border border-black/15 py-24 text-center"><p className="text-2xl tracking-tight">No pieces match those filters.</p><button onClick={()=>{setCategory('All');setSize('All');setColour('All')}} className="mt-5 text-[10px] uppercase tracking-[.2em] underline">Clear filters</button></div>}
  </main><Footer/></>
}

function Filter({label,value,setValue,options}:{label:string,value:string,setValue:(value:string)=>void,options:string[]}){return <label className="text-[9px] uppercase tracking-[.2em] text-black/50">{label}<select value={value} onChange={(event)=>setValue(event.target.value)} className="mt-2 w-full bg-transparent py-2 text-xs text-ink outline-none">{options.map((option)=><option key={option}>{option}</option>)}</select></label>}
