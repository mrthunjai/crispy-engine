import { NextRequest, NextResponse } from 'next/server'
import { getAllInventory, updateStock } from '../../lib/inventory'

export async function GET() {
  const items = getAllInventory()
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  try {
    const { slug, stock } = await req.json()
    if (!slug || stock === undefined || isNaN(Number(stock))) {
      return NextResponse.json(
        { error: 'Valid slug and stock quantity are required.' },
        { status: 400 }
      )
    }

    const updated = updateStock(slug, Number(stock))
    if (!updated) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, item: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

