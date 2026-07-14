'use server'

import { prisma } from '@/lib/prisma'

export async function actionCreatePurchaseOrder(
  businessId: string,
  supplierId: string,
  items: Array<{
    productId: string
    qty: number
  }>,
  reference?: string
) {
  try {
    // Validate supplier and products
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      select: { id: true, businessId: true }
    })

    if (!supplier || supplier.businessId !== businessId) {
      return { error: 'Proveedor no encontrado' }
    }

    // Validate all products exist and belong to business
    const products = await prisma.product.findMany({
      where: {
        businessId,
        id: { in: items.map(i => i.productId) }
      },
      select: { id: true, name: true, price: true, costPrice: true }
    })

    if (products.length !== items.length) {
      return { error: 'Uno o más productos no encontrados' }
    }

    // Calculate total
    const total = items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId)
      return sum + (product?.costPrice || 0) * item.qty
    }, 0)

    // Create PO with items
    const order = await prisma.purchaseOrder.create({
      data: {
        businessId,
        supplierId,
        poNumber: `PO-${Date.now()}`,
        status: 'pendiente',
        total,
        reference,
        items: {
          create: items.map(item => ({
            productId: item.productId,
            qty: item.qty,
            qtyReceived: 0
          }))
        }
      },
      include: {
        supplier: { select: { name: true } },
        items: {
          include: {
            product: { select: { name: true, clave: true, costPrice: true } }
          }
        }
      }
    })

    return { success: true, order }
  } catch (error) {
    console.error('Error creating purchase order:', error)
    return { error: 'Error al crear orden de compra' }
  }
}

export async function actionGetPurchaseOrders(
  businessId: string,
  status?: string,
  supplierId?: string
) {
  try {
    const orders = await prisma.purchaseOrder.findMany({
      where: {
        businessId,
        ...(status && { status: status as any }),
        ...(supplierId && { supplierId })
      },
      include: {
        supplier: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { name: true, clave: true, costPrice: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return orders
  } catch (error) {
    console.error('Error fetching purchase orders:', error)
    return []
  }
}

export async function actionReceivePurchaseItem(
  poItemId: string,
  qtyReceived: number
) {
  try {
    const poItem = await prisma.purchaseOrderItem.findUnique({
      where: { id: poItemId },
      include: {
        order: { select: { businessId: true } },
        product: { select: { id: true, name: true } }
      }
    })

    if (!poItem) {
      return { error: 'Línea de orden no encontrada' }
    }

    if (qtyReceived > poItem.qty - poItem.qtyReceived) {
      return { error: `No puede recibir más de ${poItem.qty - poItem.qtyReceived} unidades` }
    }

    // Update PO item
    await prisma.purchaseOrderItem.update({
      where: { id: poItemId },
      data: { qtyReceived: poItem.qtyReceived + qtyReceived }
    })

    // Create stock movement (entrada) in Almacén
    await prisma.stockMovement.create({
      data: {
        businessId: poItem.order.businessId,
        productId: poItem.product.id,
        type: 'entrada',
        qty: qtyReceived,
        reason: `Recepción de orden de compra`,
        reference: `PO-${poItemId.substring(0, 8)}`
      }
    })

    // Update product stock
    await prisma.product.update({
      where: { id: poItem.product.id },
      data: { stock: { increment: qtyReceived } }
    })

    // Check if PO is fully received
    const allItems = await prisma.purchaseOrderItem.findMany({
      where: { orderId: poItem.orderId }
    })

    const allReceived = allItems.every(item => item.qtyReceived === item.qty)
    if (allReceived) {
      await prisma.purchaseOrder.update({
        where: { id: poItem.orderId },
        data: { status: 'completado' }
      })
    } else {
      const anyReceived = allItems.some(item => item.qtyReceived > 0)
      if (anyReceived) {
        await prisma.purchaseOrder.update({
          where: { id: poItem.orderId },
          data: { status: 'parcialmente_recibido' }
        })
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error receiving purchase item:', error)
    return { error: 'Error al recibir mercancía' }
  }
}

export async function actionCancelPurchaseOrder(poId: string) {
  try {
    await prisma.purchaseOrder.update({
      where: { id: poId },
      data: { status: 'cancelado' }
    })

    return { success: true }
  } catch (error) {
    console.error('Error canceling purchase order:', error)
    return { error: 'Error al cancelar orden' }
  }
}

export async function actionGetPurchaseSummary(businessId: string) {
  try {
    const orders = await prisma.purchaseOrder.findMany({
      where: { businessId },
      include: {
        items: {
          include: {
            product: { select: { costPrice: true } }
          }
        }
      }
    })

    const pending = orders.filter(o => o.status === 'pendiente').length
    const partiallyReceived = orders.filter(o => o.status === 'parcialmente_recibido').length
    const completed = orders.filter(o => o.status === 'completado').length

    const totalPending = orders
      .filter(o => o.status === 'pendiente' || o.status === 'parcialmente_recibido')
      .reduce((sum, o) => sum + o.total, 0)

    return {
      pending,
      partiallyReceived,
      completed,
      totalPending,
      totalOrders: orders.length
    }
  } catch (error) {
    console.error('Error fetching purchase summary:', error)
    return {
      pending: 0,
      partiallyReceived: 0,
      completed: 0,
      totalPending: 0,
      totalOrders: 0
    }
  }
}
