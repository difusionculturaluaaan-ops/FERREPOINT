'use server'

import { prisma } from '@/lib/prisma'

export async function actionGetProducts(businessId: string, search?: string) {
  try {
    const products = await prisma.product.findMany({
      where: {
        businessId,
        active: true,
        OR: search
          ? [
              { name: { contains: search, mode: 'insensitive' } },
              { clave: { contains: search, mode: 'insensitive' } }
            ]
          : undefined
      },
      orderBy: { name: 'asc' },
      take: 100
    })

    return products
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

export async function actionCreateSale(
  businessId: string,
  locationId: string,
  vendorId: string,
  items: Array<{ productId: string; qty: number }>,
  clientName?: string,
  clientRfc?: string,
  paymentMethod: string = 'Efectivo',
  comprobante: string = 'completo'
) {
  try {
    // Get products for calculation
    const products = await prisma.product.findMany({
      where: { id: { in: items.map(i => i.productId) } }
    })

    // Calculate totals
    let subtotal = 0
    const saleItems = []

    for (const item of items) {
      const product = products.find(p => p.id === item.productId)
      if (!product) continue

      const itemTotal = product.price * item.qty
      subtotal += itemTotal

      saleItems.push({
        productId: product.id,
        qty: item.qty,
        price: product.price,
        subtotal: itemTotal
      })
    }

    const iva = subtotal * 0.16
    const total = subtotal + iva

    // Generate folio
    const lastSale = await prisma.sale.findFirst({
      where: { businessId },
      orderBy: { createdAt: 'desc' }
    })

    let nextFolio = 'V50741'
    if (lastSale) {
      const lastNum = parseInt(lastSale.folio.substring(1))
      nextFolio = `V${lastNum + 1}`
    }

    // Create sale with items
    const sale = await prisma.sale.create({
      data: {
        businessId,
        locationId,
        folio: nextFolio,
        vendorId,
        clientName: clientName || 'Público General',
        clientRfc: clientRfc || 'XAXX010101000',
        paymentMethod,
        comprobante,
        subtotal,
        iva,
        total,
        items: {
          create: saleItems
        }
      },
      include: { items: true }
    })

    // Decrement product stock
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.qty } }
      })
    }

    // Create surtido order (automatically)
    await prisma.surtidoOrder.create({
      data: {
        businessId,
        locationId,
        saleId: sale.id,
        status: 'pendiente',
        items: {
          create: saleItems.map(si => ({
            productId: si.productId,
            qty: si.qty
          }))
        }
      }
    })

    return {
      success: true,
      sale: {
        ...sale,
        message: `Venta ${nextFolio} completada - Total: $${total.toFixed(2)}`
      }
    }
  } catch (error) {
    console.error('Error creating sale:', error)
    return { error: 'Error al crear venta' }
  }
}

export async function actionGetSalesReports(businessId: string) {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todaySales = await prisma.sale.findMany({
      where: {
        businessId,
        createdAt: { gte: today }
      },
      include: { vendor: true, items: true }
    })

    const salesCount = todaySales.length
    const totalIngresos = todaySales.reduce((sum, s) => sum + s.subtotal, 0)
    const avgTicket = salesCount > 0 ? totalIngresos / salesCount : 0

    // By vendor
    const byVendor: Record<string, { name: string; total: number; count: number }> = {}
    todaySales.forEach(sale => {
      const vendorName = sale.vendor.name
      if (!byVendor[vendorName]) {
        byVendor[vendorName] = { name: vendorName, total: 0, count: 0 }
      }
      byVendor[vendorName].total += sale.total
      byVendor[vendorName].count++
    })

    return {
      salesCount,
      totalIngresos: parseFloat(totalIngresos.toFixed(2)),
      avgTicket: parseFloat(avgTicket.toFixed(2)),
      byVendor: Object.values(byVendor).sort((a, b) => b.total - a.total),
      recentSales: todaySales
        .slice(-5)
        .reverse()
        .map(s => ({
          folio: s.folio,
          vendor: s.vendor.name,
          total: s.total,
          time: s.createdAt.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
        }))
    }
  } catch (error) {
    console.error('Error fetching reports:', error)
    return {
      salesCount: 0,
      totalIngresos: 0,
      avgTicket: 0,
      byVendor: [],
      recentSales: []
    }
  }
}
