import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const business = await prisma.business.findFirst({
      where: { sales: { some: {} } }
    }) || await prisma.business.findFirst()

    if (!business) {
      return NextResponse.json(
        { error: 'No business found. Run seed first.' },
        { status: 404 }
      )
    }

    const location = await prisma.location.findFirst({
      where: { businessId: business.id }
    })

    if (!location) {
      return NextResponse.json(
        { error: 'No location found' },
        { status: 404 }
      )
    }

    const vendor = await prisma.user.findFirst({
      where: {
        businessId: business.id,
        role: { in: ['vendedor', 'dueno', 'admin'] }
      }
    })

    return NextResponse.json({
      businessId: business.id,
      locationId: location.id,
      vendorId: vendor?.id || '',
      businessName: business.name,
      vendorName: vendor?.name || 'Vendedor'
    })
  } catch (error) {
    console.error('Error fetching context:', error)
    return NextResponse.json(
      { error: 'Failed to fetch context' },
      { status: 500 }
    )
  }
}
