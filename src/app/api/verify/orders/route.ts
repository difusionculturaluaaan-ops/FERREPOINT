import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const orders = await prisma.sale.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: { items: { include: { product: { select: { name: true } } } } }
    })

    return NextResponse.json({
      success: true,
      count: orders.length,
      orders: orders.map(o => ({
        folio: o.folio,
        cliente: o.clientName,
        telefono: o.clientPhone,
        direccion: o.clientAddress,
        entrega: o.deliveryType,
        total: o.total,
        articulos: o.items.length,
        status: o.status,
        items: o.items.map(i => ({ nombre: i.product.name, qty: i.qty }))
      }))
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
