'use server'

import { prisma } from '@/lib/prisma'

export async function actionGetDailySummary(businessId: string, locationId: string, date?: Date) {
  try {
    const targetDate = date || new Date()
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    const sales = await prisma.sale.findMany({
      where: {
        businessId,
        locationId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        items: true,
        vendor: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    const totalSales = sales.length
    const totalIngresos = sales.reduce((sum, s) => sum + s.total, 0)
    const totalCosto = sales.reduce((sum, s) => {
      return sum + s.items.reduce((itemSum, item) => {
        return itemSum + item.qty * 0 // TODO: get actual cost from product
      }, 0)
    }, 0)

    const avgTicket = totalSales > 0 ? totalIngresos / totalSales : 0

    // Por vendedor
    const byVendor = sales.reduce((acc, sale) => {
      const vendor = sale.vendor
      const existing = acc.find(v => v.vendorId === sale.vendorId)
      if (existing) {
        existing.total += sale.total
        existing.count += 1
      } else {
        acc.push({
          vendorId: sale.vendorId,
          vendorName: vendor.name,
          total: sale.total,
          count: 1
        })
      }
      return acc
    }, [] as Array<{ vendorId: string; vendorName: string; total: number; count: number }>)

    byVendor.sort((a, b) => b.total - a.total)

    return {
      date: targetDate.toISOString().split('T')[0],
      totalSales,
      totalIngresos,
      totalCosto,
      avgTicket,
      margin: totalIngresos - totalCosto,
      marginPercent: totalIngresos > 0 ? ((totalIngresos - totalCosto) / totalIngresos) * 100 : 0,
      byVendor
    }
  } catch (error) {
    console.error('Error fetching daily summary:', error)
    return {
      date: new Date().toISOString().split('T')[0],
      totalSales: 0,
      totalIngresos: 0,
      totalCosto: 0,
      avgTicket: 0,
      margin: 0,
      marginPercent: 0,
      byVendor: []
    }
  }
}

export async function actionGetWeeklySummary(businessId: string, locationId: string, weekStartDate?: Date) {
  try {
    const startDate = weekStartDate || new Date()
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 7)
    endDate.setHours(23, 59, 59, 999)

    const sales = await prisma.sale.findMany({
      where: {
        businessId,
        locationId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                costPrice: true
              }
            }
          }
        }
      }
    })

    const dailyData: Record<string, { sales: number; ingresos: number; costo: number }> = {}

    sales.forEach(sale => {
      const dayKey = sale.createdAt.toISOString().split('T')[0]
      if (!dailyData[dayKey]) {
        dailyData[dayKey] = { sales: 0, ingresos: 0, costo: 0 }
      }
      dailyData[dayKey].sales += 1
      dailyData[dayKey].ingresos += sale.total
      dailyData[dayKey].costo += sale.items.reduce((sum, item) => {
        return sum + item.qty * item.product.costPrice
      }, 0)
    })

    const totalIngresos = Object.values(dailyData).reduce((sum, d) => sum + d.ingresos, 0)
    const totalCosto = Object.values(dailyData).reduce((sum, d) => sum + d.costo, 0)

    return {
      weekStart: startDate.toISOString().split('T')[0],
      days: dailyData,
      totalSales: sales.length,
      totalIngresos,
      totalCosto,
      margin: totalIngresos - totalCosto,
      avgDaily: sales.length > 0 ? totalIngresos / 7 : 0
    }
  } catch (error) {
    console.error('Error fetching weekly summary:', error)
    return {
      weekStart: new Date().toISOString().split('T')[0],
      days: {},
      totalSales: 0,
      totalIngresos: 0,
      totalCosto: 0,
      margin: 0,
      avgDaily: 0
    }
  }
}

export async function actionGetInventoryHealth(businessId: string) {
  try {
    const products = await prisma.product.findMany({
      where: { businessId, active: true },
      select: {
        id: true,
        name: true,
        clave: true,
        stock: true,
        minStock: true,
        costPrice: true
      }
    })

    const critical = products.filter(p => p.stock < p.minStock)
    const overstock = products.filter(p => p.stock > p.minStock * 3)
    const healthy = products.filter(p => p.stock >= p.minStock && p.stock <= p.minStock * 3)

    const totalValue = products.reduce((sum, p) => sum + p.stock * p.costPrice, 0)

    return {
      totalProducts: products.length,
      critical: critical.length,
      criticalList: critical.slice(0, 10),
      overstock: overstock.length,
      healthy: healthy.length,
      totalValue,
      criticalValue: critical.reduce((sum, p) => sum + p.stock * p.costPrice, 0)
    }
  } catch (error) {
    console.error('Error fetching inventory health:', error)
    return {
      totalProducts: 0,
      critical: 0,
      criticalList: [],
      overstock: 0,
      healthy: 0,
      totalValue: 0,
      criticalValue: 0
    }
  }
}

export async function actionGetTopProducts(businessId: string, locationId: string, days: number = 30) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    const sales = await prisma.sale.findMany({
      where: {
        businessId,
        locationId,
        createdAt: { gte: startDate }
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                clave: true,
                price: true,
                costPrice: true
              }
            }
          }
        }
      }
    })

    const productStats: Record<string, {
      name: string
      clave: string
      qty: number
      revenue: number
      cost: number
      count: number
    }> = {}

    sales.forEach(sale => {
      sale.items.forEach(item => {
        const prodId = item.product.id
        if (!productStats[prodId]) {
          productStats[prodId] = {
            name: item.product.name,
            clave: item.product.clave,
            qty: 0,
            revenue: 0,
            cost: 0,
            count: 0
          }
        }
        productStats[prodId].qty += item.qty
        productStats[prodId].revenue += item.subtotal
        productStats[prodId].cost += item.qty * item.product.costPrice
        productStats[prodId].count += 1
      })
    })

    return Object.entries(productStats)
      .map(([id, data]) => ({
        id,
        ...data,
        margin: data.revenue - data.cost
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  } catch (error) {
    console.error('Error fetching top products:', error)
    return []
  }
}
