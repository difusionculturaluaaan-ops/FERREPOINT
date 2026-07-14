'use server'

import { prisma } from '@/lib/prisma'

export async function actionCreateDelivery(
  businessId: string,
  locationId: string,
  driverId: string,
  saleId: string,
  clientName: string,
  clientPhone: string,
  address: string,
  lat?: number,
  lng?: number
) {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { items: true }
    })

    if (!sale) {
      return { error: 'Venta no encontrada' }
    }

    const delivery = await prisma.delivery.create({
      data: {
        businessId,
        locationId,
        driverId,
        saleId,
        clientName,
        clientPhone,
        address,
        latitude: lat,
        longitude: lng,
        status: 'pendiente',
        items: {
          create: sale.items.map(item => ({
            productId: item.productId,
            qty: item.qty
          }))
        }
      },
      include: {
        driver: { select: { name: true, email: true } },
        sale: { select: { folio: true, total: true } },
        items: {
          include: {
            product: { select: { name: true, clave: true } }
          }
        }
      }
    })

    return { success: true, delivery }
  } catch (error) {
    console.error('Error creating delivery:', error)
    return { error: 'Error al crear entrega' }
  }
}

export async function actionGetDeliveries(
  businessId: string,
  locationId?: string,
  status?: string,
  driverId?: string
) {
  try {
    const deliveries = await prisma.delivery.findMany({
      where: {
        businessId,
        ...(locationId && { locationId }),
        ...(status && { status: status as any }),
        ...(driverId && { driverId })
      },
      include: {
        driver: { select: { id: true, name: true, email: true } },
        sale: { select: { folio: true, total: true } },
        items: {
          include: {
            product: { select: { name: true, clave: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return deliveries
  } catch (error) {
    console.error('Error fetching deliveries:', error)
    return []
  }
}

export async function actionUpdateDeliveryStatus(
  deliveryId: string,
  status: 'pendiente' | 'en_ruta' | 'completado' | 'cancelado',
  latitude?: number,
  longitude?: number
) {
  try {
    const delivery = await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        status,
        ...(latitude && { latitude }),
        ...(longitude && { longitude }),
        ...(status === 'completado' && { completedAt: new Date() })
      },
      include: {
        driver: { select: { name: true } },
        sale: { select: { folio: true } }
      }
    })

    return { success: true, delivery }
  } catch (error) {
    console.error('Error updating delivery:', error)
    return { error: 'Error al actualizar entrega' }
  }
}

export async function actionGetDeliveryStats(businessId: string, locationId?: string) {
  try {
    const deliveries = await prisma.delivery.findMany({
      where: {
        businessId,
        ...(locationId && { locationId })
      }
    })

    const pending = deliveries.filter(d => d.status === 'pendiente').length
    const inRoute = deliveries.filter(d => d.status === 'en_ruta').length
    const completed = deliveries.filter(d => d.status === 'completado').length
    const cancelled = deliveries.filter(d => d.status === 'cancelado').length

    // Entregas completadas hoy
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const completedToday = deliveries.filter(
      d => d.status === 'completado' && d.completedAt && new Date(d.completedAt) >= today
    ).length

    return {
      pending,
      inRoute,
      completed,
      cancelled,
      completedToday,
      total: deliveries.length,
      activeDeliveries: pending + inRoute
    }
  } catch (error) {
    console.error('Error fetching delivery stats:', error)
    return {
      pending: 0,
      inRoute: 0,
      completed: 0,
      cancelled: 0,
      completedToday: 0,
      total: 0,
      activeDeliveries: 0
    }
  }
}

export async function actionGetDriverDeliveries(driverId: string) {
  try {
    const deliveries = await prisma.delivery.findMany({
      where: {
        driverId,
        status: { in: ['pendiente', 'en_ruta'] }
      },
      include: {
        sale: { select: { folio: true, total: true } },
        items: {
          include: {
            product: { select: { name: true, clave: true } }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return deliveries
  } catch (error) {
    console.error('Error fetching driver deliveries:', error)
    return []
  }
}

export async function actionUpdateDriverLocation(
  deliveryId: string,
  latitude: number,
  longitude: number
) {
  try {
    await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        latitude,
        longitude,
        lastLocationUpdate: new Date()
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Error updating location:', error)
    return { error: 'Error al actualizar ubicación' }
  }
}

export async function actionGetAvailableDrivers(businessId: string, locationId: string) {
  try {
    const drivers = await prisma.user.findMany({
      where: {
        businessId,
        role: 'chofer',
        active: true
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    return drivers
  } catch (error) {
    console.error('Error fetching drivers:', error)
    return []
  }
}
