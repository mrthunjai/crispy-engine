import { createHash, randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import type { CartItem } from '../../components/StoreProvider'
import { hasSupabaseServerConfig, supabaseRest } from '../../lib/supabase-rest'
import type { Tables } from '../../lib/database.types'
import { getAuthenticatedUser } from '../../lib/supabase/authorization'

export const dynamic = 'force-dynamic'

const COOKIE_NAME = 'store_guest_cart'
const THIRTY_DAYS = 60 * 60 * 24 * 30

type CartRow = Pick<Tables<'carts'>, 'id'>
type CartItemRow = Pick<Tables<'cart_items'>, 'cart_id' | 'product_id' | 'variant_id' | 'product_name_snapshot' | 'image_url_snapshot' | 'colour_snapshot' | 'size_snapshot' | 'price_paise_snapshot' | 'quantity'>
type VariantRow = Pick<Tables<'product_variants'>, 'id' | 'product_id' | 'colour' | 'size' | 'price_paise' | 'is_discontinued'> & { inventory: { stock_quantity: number } | { stock_quantity: number }[] | null }
type ProductRow = Pick<Tables<'products'>, 'id' | 'slug' | 'name' | 'status'> & { product_images: Pick<Tables<'product_images'>, 'image_url' | 'sort_order'>[] }

const first = <T,>(value: T | T[] | null): T | null => value ? (Array.isArray(value) ? value[0] ?? null : value) : null
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')
const inFilter = (ids: string[]) => `in.(${ids.join(',')})`

async function getCart(request: NextRequest) {
  const user = await getAuthenticatedUser()
  let token = request.cookies.get(COOKIE_NAME)?.value
  let setCookie = false
  if (!token) { token = randomBytes(32).toString('base64url'); setCookie = true }
  const tokenHash = hashToken(token)

  if (user) {
    const guestCarts = await supabaseRest<CartRow[]>(`carts?select=id&guest_token_hash=eq.${tokenHash}&status=eq.active&limit=1`)
    if (guestCarts[0]) {
      await supabaseRest('rpc/merge_guest_cart', {
        method: 'POST',
        body: JSON.stringify({ p_guest_cart_id: guestCarts[0].id, p_user_id: user.id }),
      })
    }
    let userCarts = await supabaseRest<CartRow[]>(`carts?select=id&user_id=eq.${user.id}&status=eq.active&limit=1`)
    if (!userCarts[0]) {
      userCarts = await supabaseRest<CartRow[]>('carts', {
        method: 'POST',
        prefer: 'return=representation',
        body: JSON.stringify({ user_id: user.id, status: 'active' }),
      })
    }
    return { cart: userCarts[0], token, setCookie: false, clearCookie: true }
  }

  const matches = await supabaseRest<CartRow[]>(`carts?select=id&guest_token_hash=eq.${tokenHash}&status=eq.active&limit=1`)
  let cart = matches[0]
  if (!cart) {
    const created = await supabaseRest<CartRow[]>('carts', {
      method: 'POST',
      prefer: 'return=representation',
      body: JSON.stringify({ guest_token_hash: tokenHash, status: 'active', expires_at: new Date(Date.now() + THIRTY_DAYS * 1000).toISOString() })
    })
    cart = created[0]
    setCookie = true
  }
  return { cart, token, setCookie, clearCookie: false }
}

async function loadItems(cartId: string): Promise<CartItem[]> {
  const rows = await supabaseRest<CartItemRow[]>(`cart_items?select=cart_id,product_id,variant_id,product_name_snapshot,image_url_snapshot,colour_snapshot,size_snapshot,price_paise_snapshot,quantity&cart_id=eq.${cartId}&order=created_at.asc`)
  if (!rows.length) return []
  const productIds = Array.from(new Set(rows.map((row)=>row.product_id)))
  const variantIds = Array.from(new Set(rows.map((row)=>row.variant_id)))
  const [products, variants] = await Promise.all([
    supabaseRest<ProductRow[]>(`products?select=id,slug,name,status,product_images(image_url,sort_order)&id=${inFilter(productIds)}`),
    supabaseRest<VariantRow[]>(`product_variants?select=id,product_id,colour,size,price_paise,is_discontinued,inventory(stock_quantity)&id=${inFilter(variantIds)}`)
  ])
  const productMap = new Map(products.map((product)=>[product.id,product]))
  const variantMap = new Map(variants.map((variant)=>[variant.id,variant]))
  return rows.flatMap((row) => {
    const product = productMap.get(row.product_id)
    const variant = variantMap.get(row.variant_id)
    if (!product || !variant) return []
    const inventory = first(variant.inventory)
    const image = row.image_url_snapshot || [...product.product_images].sort((a,b)=>a.sort_order-b.sort_order)[0]?.image_url || ''
    return [{ productId: row.product_id, variantId: row.variant_id, slug: product.slug, name: row.product_name_snapshot, image, size: row.size_snapshot, colour: row.colour_snapshot, quantity: row.quantity, pricePaise: row.price_paise_snapshot, stockQuantity: inventory?.stock_quantity ?? 0 }]
  })
}

function cartResponse(items: CartItem[], token: string, setCookie: boolean, clearCookie = false, status = 200) {
  const response = NextResponse.json({ items }, { status })
  if (setCookie) response.cookies.set(COOKIE_NAME, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: THIRTY_DAYS })
  if (clearCookie) response.cookies.delete(COOKIE_NAME)
  return response
}

const unavailable = () => NextResponse.json({ code: 'SUPABASE_NOT_CONFIGURED' }, { status: 503 })
const failure = (error: unknown) => {
  console.error('Cart API error', error)
  return NextResponse.json({ error: 'The cart could not be updated.' }, { status: 500 })
}

export async function GET(request: NextRequest) {
  if (!hasSupabaseServerConfig()) return unavailable()
  try { const {cart,token,setCookie,clearCookie}=await getCart(request); return cartResponse(await loadItems(cart.id),token,setCookie,clearCookie) }
  catch(error){ return failure(error) }
}

export async function POST(request: NextRequest) {
  if (!hasSupabaseServerConfig()) return unavailable()
  try {
    const body = await request.json() as { productId?: string; variantId?: string; quantity?: number }
    if (!body.productId || !body.variantId) return NextResponse.json({error:'Product and variant are required.'},{status:400})
    const {cart,token,setCookie,clearCookie}=await getCart(request)
    const variants = await supabaseRest<VariantRow[]>(`product_variants?select=id,product_id,colour,size,price_paise,is_discontinued,inventory(stock_quantity)&id=eq.${body.variantId}&product_id=eq.${body.productId}&limit=1`)
    const products = await supabaseRest<ProductRow[]>(`products?select=id,slug,name,status,product_images(image_url,sort_order)&id=eq.${body.productId}&status=eq.active&limit=1`)
    const variant=variants[0]; const product=products[0]; const inventory=variant?first(variant.inventory):null
    if(!variant||!product||variant.is_discontinued||!inventory||inventory.stock_quantity<1) return NextResponse.json({error:'This variant is unavailable.'},{status:409})
    const existing=await supabaseRest<CartItemRow[]>(`cart_items?select=*&cart_id=eq.${cart.id}&variant_id=eq.${variant.id}&limit=1`)
    const quantity=Math.min(inventory.stock_quantity,(existing[0]?.quantity??0)+Math.max(1,Number(body.quantity)||1))
    const image=[...product.product_images].sort((a,b)=>a.sort_order-b.sort_order)[0]?.image_url??null
    await supabaseRest('cart_items?on_conflict=cart_id,variant_id',{method:'POST',prefer:'resolution=merge-duplicates,return=minimal',body:JSON.stringify({cart_id:cart.id,product_id:product.id,variant_id:variant.id,product_name_snapshot:product.name,image_url_snapshot:image,colour_snapshot:variant.colour,size_snapshot:variant.size,price_paise_snapshot:variant.price_paise,quantity})})
    return cartResponse(await loadItems(cart.id),token,setCookie,clearCookie)
  } catch(error){ return failure(error) }
}

export async function PATCH(request: NextRequest) {
  if (!hasSupabaseServerConfig()) return unavailable()
  try {
    const body=await request.json() as {variantId?:string;quantity?:number}
    if(!body.variantId||!Number.isFinite(body.quantity)) return NextResponse.json({error:'Variant and quantity are required.'},{status:400})
    const {cart,token,setCookie,clearCookie}=await getCart(request)
    const inventoryRows=await supabaseRest<{stock_quantity:number}[]>(`inventory?select=stock_quantity&variant_id=eq.${body.variantId}&limit=1`)
    const quantity=Math.min(Math.max(1,Number(body.quantity)),inventoryRows[0]?.stock_quantity??0)
    if(quantity<1) return NextResponse.json({error:'This variant is unavailable.'},{status:409})
    await supabaseRest(`cart_items?cart_id=eq.${cart.id}&variant_id=eq.${body.variantId}`,{method:'PATCH',prefer:'return=minimal',body:JSON.stringify({quantity})})
    return cartResponse(await loadItems(cart.id),token,setCookie,clearCookie)
  } catch(error){ return failure(error) }
}

export async function DELETE(request: NextRequest) {
  if (!hasSupabaseServerConfig()) return unavailable()
  try {
    const body=await request.json() as {variantId?:string;clear?:boolean}
    if(!body.variantId&&!body.clear) return NextResponse.json({error:'Variant is required.'},{status:400})
    const {cart,token,setCookie,clearCookie}=await getCart(request)
    const filter=body.clear?'':`&variant_id=eq.${body.variantId}`
    await supabaseRest(`cart_items?cart_id=eq.${cart.id}${filter}`,{method:'DELETE',prefer:'return=minimal'})
    return cartResponse(await loadItems(cart.id),token,setCookie,clearCookie)
  } catch(error){ return failure(error) }
}
