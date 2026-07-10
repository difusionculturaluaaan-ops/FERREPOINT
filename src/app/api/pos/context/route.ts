import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const business = await prisma.business.findFirst()
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
        role: { in: ['vendedor', 'dueno'] }
      }
    })

    if (!vendor) {
      return NextResponse.json(
        { error: 'No vendor found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      businessId: business.id,
      locationId: location.id,
      vendorId: vendor.id,
      businessName: business.name,
      vendorName: vendor.name
    })
  } catch (error) {
    console.error('Error fetching context:', error)
    return NextResponse.json(
      { error: 'Failed to fetch context' },
      { status: 500 }
    )
  }
}
