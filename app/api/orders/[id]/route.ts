import { NextRequest, NextResponse } from 'next/server'
import { getOrderById } from '../../../lib/orders'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const order = getOrderById(id)

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  return NextResponse.json({ order })
}

