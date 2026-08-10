'use server'

import { prisma } from '@/lib/prisma'

export async function actionGetSurtidoOrders(businessId: string, locationId: string, status?: string) {
  try {
    const orders = await prisma.surtidoOrder.findMany({
      where: {
        businessId,
        locationId,
        status: status ? (status as any) : undefined
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        sale: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return orders
  } catch (error) {
    console.error('Error fetching surtido orders:', error)
    return []
  }
}

export async function actionUpdateSurtidoItem(
  surtidoItemId: string,
  qtyPicked: number
) {
  try {
    const item = await prisma.surtidoItem.update({
      where: { id: surtidoItemId },
      data: { qtyPicked } as any,
      include: { order: true }
    })

    return { success: true, item }
  } catch (error) {
    console.error('Error updating surtido item:', error)
    return { error: 'Error al actualizar' }
  }
}

export async function actionCompleteSurtidoOrder(surtidoOrderId: string) {
  try {
    const order = await prisma.surtidoOrder.update({
      where: { id: surtidoOrderId },
      data: { status: 'completado' },
      include: { items: true }
    })

    return {
      success: true,
      message: `Orden ${surtidoOrderId.substring(0, 8)} completada`,
      order
    }
  } catch (error) {
    console.error('Error completing surtido order:', error)
    return { error: 'Error al completar orden' }
  }
}

export async function actionGetBodegaStats(businessId: string, locationId: string) {
  try {
    const orders = await prisma.surtidoOrder.findMany({
      where: { businessId, locationId }
    })

    const pending = orders.filter(o => o.status === 'pendiente').length
    const inProgress = orders.filter(o => o.status === 'en_proceso').length
    const completed = orders.filter(o => o.status === 'completado').length

    return {
      pending,
      inProgress,
      completed,
      total: orders.length
    }
  } catch (error) {
    console.error('Error fetching bodega stats:', error)
    return { pending: 0, inProgress: 0, completed: 0, total: 0 }
  }
}

// Auto-create SurtidoOrder when a domicilio order is paid
export async function actionCreateSurtidoOrder(
  businessId: string,
  locationId: string,
  saleId: string,
  items: { productId: string; qty: number; price: number; subtotal: number }[]
) {
  try {
    const surtidoOrder = await prisma.surtidoOrder.create({
      data: {
        businessId,
        locationId,
        saleId,
        status: 'pendiente',
        items: {
          create: items.map(item => ({
            productId: item.productId,
            qty: item.qty,
            surtido: false
          }))
        }
      },
      include: { items: { include: { product: true } } }
    })

    console.log('[actionCreateSurtidoOrder] Created:', { saleId, orderId: surtidoOrder.id, itemsCount: items.length })
    return { success: true, surtidoOrder }
  } catch (error) {
    console.error('Error creating surtido order:', error)
    return { success: false, error: String(error) }
  }
}
