import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const business = await prisma.business.findFirst()
    if (!business) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 })
    }

    const location = await prisma.location.findFirst({
      where: { businessId: business.id }
    })

    if (!location) {
      return NextResponse.json({ error: 'No location found' }, { status: 404 })
    }

    const orders = await prisma.surtidoOrder.findMany({
      where: {
        businessId: business.id,
        locationId: location.id,
        status: status ? (status as any) : undefined
      },
      include: {
        items: {
          include: { product: true }
        },
        sale: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
