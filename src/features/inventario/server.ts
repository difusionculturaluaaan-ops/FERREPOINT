'use server'

import { prisma } from '@/lib/prisma'

export async function actionGetProducts(businessId: string, locationId?: string, search?: string) {
  try {
    const products = await prisma.product.findMany({
      where: {
        businessId,
        ...(locationId && { locationId }),
        ...(search && {
          OR: [
            { name: { contains: search } },
            { clave: { contains: search } }
          ]
        })
      },
      include: {
        image: true,
        supplier: true,
        location: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return products
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

export async function actionCreateProduct(
  businessId: string,
  locationId: string,
  data: {
    clave: string
    name: string
    category: string
    price: number
    costPrice: number
    stock: number
    minStock?: number
    unit: string
    supplierId?: string
    imageId?: string
  }
) {
  try {
    const margin = data.price > 0 ? ((data.price - data.costPrice) / data.price) * 100 : 0

    const product = await prisma.product.create({
      data: {
        ...data,
        businessId,
        locationId,
        margin: parseFloat(margin.toFixed(2)),
        minStock: data.minStock || 0,
        active: true
      },
      include: {
        image: true,
        supplier: true
      }
    })

    return { success: true, product }
  } catch (error: any) {
    console.error('Error creating product:', error)
    if (error.code === 'P2002') {
      return { error: 'Producto con esta clave ya existe' }
    }
    return { error: 'Error al crear producto' }
  }
}

export async function actionUpdateProduct(
  productId: string,
  data: {
    name?: string
    category?: string
    price?: number
    costPrice?: number
    stock?: number
    minStock?: number
    unit?: string
    supplierId?: string | null
    imageId?: string | null
    active?: boolean
  }
) {
  try {
    let margin: number | undefined
    if (data.price !== undefined && data.costPrice !== undefined) {
      margin = data.price > 0 ? ((data.price - data.costPrice) / data.price) * 100 : 0
    } else if (data.price !== undefined) {
      const current = await prisma.product.findUnique({ where: { id: productId } })
      if (current && data.price > 0) {
        margin = ((data.price - current.costPrice) / data.price) * 100
      }
    } else if (data.costPrice !== undefined) {
      const current = await prisma.product.findUnique({ where: { id: productId } })
      if (current && current.price > 0) {
        margin = ((current.price - data.costPrice) / current.price) * 100
      }
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        ...data,
        ...(margin !== undefined && { margin: parseFloat(margin.toFixed(2)) })
      },
      include: {
        image: true,
        supplier: true
      }
    })

    return { success: true, product }
  } catch (error) {
    console.error('Error updating product:', error)
    return { error: 'Error al actualizar producto' }
  }
}

export async function actionDeleteProduct(productId: string) {
  try {
    await prisma.product.delete({
      where: { id: productId }
    })

    return { success: true }
  } catch (error) {
    console.error('Error deleting product:', error)
    return { error: 'Error al eliminar producto' }
  }
}

export async function actionGetInventorySummary(businessId: string) {
  try {
    const products = await prisma.product.findMany({
      where: { businessId, active: true },
      select: {
        id: true,
        name: true,
        stock: true,
        minStock: true,
        price: true,
        costPrice: true,
        margin: true
      }
    })

    const totalProducts = products.length
    const lowStock = products.filter(p => p.stock <= p.minStock).length
    const totalInventoryValue = products.reduce((sum, p) => sum + p.stock * p.costPrice, 0)
    const totalRetailValue = products.reduce((sum, p) => sum + p.stock * p.price, 0)
    const avgMargin = products.length > 0
      ? parseFloat((products.reduce((sum, p) => sum + p.margin, 0) / products.length).toFixed(2))
      : 0

    return {
      totalProducts,
      lowStock,
      totalInventoryValue,
      totalRetailValue,
      avgMargin
    }
  } catch (error) {
    console.error('Error fetching inventory summary:', error)
    return {
      totalProducts: 0,
      lowStock: 0,
      totalInventoryValue: 0,
      totalRetailValue: 0,
      avgMargin: 0
    }
  }
}

export async function actionRecordStockMovement(
  businessId: string,
  productId: string,
  type: 'entrada' | 'salida' | 'ajuste',
  qty: number,
  reason?: string,
  reference?: string
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return { error: 'Producto no encontrado' }
    }

    const newStock = type === 'salida' ? product.stock - qty : product.stock + qty

    await prisma.product.update({
      where: { id: productId },
      data: { stock: Math.max(0, newStock) }
    })

    const movement = await prisma.stockMovement.create({
      data: {
        businessId,
        productId,
        type,
        qty,
        reason,
        reference
      }
    })

    return { success: true, movement }
  } catch (error) {
    console.error('Error recording stock movement:', error)
    return { error: 'Error al registrar movimiento' }
  }
}

export async function actionGetStockMovements(
  businessId: string,
  productId?: string,
  startDate?: Date,
  endDate?: Date
) {
  try {
    const movements = await prisma.stockMovement.findMany({
      where: {
        businessId,
        ...(productId && { productId }),
        ...(startDate && { createdAt: { gte: startDate } }),
        ...(endDate && { createdAt: { lte: endDate } })
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
      },
      orderBy: { createdAt: 'desc' }
    })

    return movements
  } catch (error) {
    console.error('Error fetching stock movements:', error)
    return []
  }
}

export async function actionGetSuppliers(businessId: string) {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { businessId },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            clave: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return suppliers
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return []
  }
}

export async function actionCreateSupplier(
  businessId: string,
  data: {
    name: string
    contact?: string
    email?: string
    phone?: string
    address?: string
  }
) {
  try {
    const supplier = await prisma.supplier.create({
      data: {
        ...data,
        businessId
      }
    })

    return { success: true, supplier }
  } catch (error) {
    console.error('Error creating supplier:', error)
    return { error: 'Error al crear proveedor' }
  }
}
