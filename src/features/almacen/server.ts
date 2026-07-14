'use server'

import { prisma } from '@/lib/prisma'

export async function actionRecordMovement(
  businessId: string,
  locationId: string,
  productId: string,
  type: 'entrada' | 'salida' | 'ajuste',
  qty: number,
  reason?: string,
  reference?: string
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true, name: true, clave: true }
    })

    if (!product) {
      return { error: 'Producto no encontrado' }
    }

    const newStock = type === 'salida' ? product.stock - qty : product.stock + qty

    if (newStock < 0) {
      return { error: `Stock insuficiente. Disponible: ${product.stock}` }
    }

    const movement = await prisma.stockMovement.create({
      data: {
        businessId,
        productId,
        type,
        qty,
        reason,
        reference
      },
      include: {
        product: {
          select: {
            name: true,
            clave: true,
            price: true,
            costPrice: true
          }
        }
      }
    })

    await prisma.product.update({
      where: { id: productId },
      data: { stock: Math.max(0, newStock) }
    })

    return { success: true, movement }
  } catch (error) {
    console.error('Error recording movement:', error)
    return { error: 'Error al registrar movimiento' }
  }
}

export async function actionGetMovements(
  businessId: string,
  locationId?: string,
  type?: string,
  startDate?: Date,
  endDate?: Date
) {
  try {
    const movements = await prisma.stockMovement.findMany({
      where: {
        businessId,
        ...(type && { type: type as any }),
        ...(startDate && { createdAt: { gte: startDate } }),
        ...(endDate && { createdAt: { lte: endDate } })
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            clave: true,
            category: true,
            price: true,
            costPrice: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return movements
  } catch (error) {
    console.error('Error fetching movements:', error)
    return []
  }
}

export async function actionGetMovementsSummary(
  businessId: string,
  startDate?: Date,
  endDate?: Date
) {
  try {
    const movements = await prisma.stockMovement.findMany({
      where: {
        businessId,
        ...(startDate && { createdAt: { gte: startDate } }),
        ...(endDate && { createdAt: { lte: endDate } })
      },
      include: {
        product: {
          select: {
            costPrice: true,
            price: true
          }
        }
      }
    })

    const entradas = movements.filter(m => m.type === 'entrada')
    const salidas = movements.filter(m => m.type === 'salida')
    const ajustes = movements.filter(m => m.type === 'ajuste')

    const totalEntradasCosto = entradas.reduce((sum, m) => sum + m.qty * m.product.costPrice, 0)
    const totalSalidasCosto = salidas.reduce((sum, m) => sum + m.qty * m.product.costPrice, 0)
    const totalSalidasVenta = salidas.reduce((sum, m) => sum + m.qty * m.product.price, 0)

    return {
      totalMovements: movements.length,
      entradas: entradas.length,
      salidas: salidas.length,
      ajustes: ajustes.length,
      totalEntradasCosto,
      totalSalidasCosto,
      totalSalidasVenta,
      margenTotal: totalSalidasVenta - totalSalidasCosto
    }
  } catch (error) {
    console.error('Error fetching movements summary:', error)
    return {
      totalMovements: 0,
      entradas: 0,
      salidas: 0,
      ajustes: 0,
      totalEntradasCosto: 0,
      totalSalidasCosto: 0,
      totalSalidasVenta: 0,
      margenTotal: 0
    }
  }
}

export async function actionGetProductsForMovement(
  businessId: string,
  search?: string
) {
  try {
    const products = await prisma.product.findMany({
      where: {
        businessId,
        active: true,
        ...(search && {
          OR: [
            { name: { contains: search } },
            { clave: { contains: search } }
          ]
        })
      },
      select: {
        id: true,
        clave: true,
        name: true,
        category: true,
        stock: true,
        costPrice: true,
        price: true
      },
      orderBy: { name: 'asc' },
      take: 20
    })

    return products
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

export async function actionGetMovementDetail(movementId: string) {
  try {
    const movement = await prisma.stockMovement.findUnique({
      where: { id: movementId },
      include: {
        product: true,
        business: true
      }
    })

    return movement
  } catch (error) {
    console.error('Error fetching movement:', error)
    return null
  }
}
