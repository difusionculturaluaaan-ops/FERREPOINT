'use server'

import { prisma } from '@/lib/prisma'

export async function actionGetFinancialSummary(
  businessId: string,
  locationId?: string,
  range: 'today' | 'week' | 'month' | 'all' = 'today'
) {
  try {
    let targetBusinessId = businessId
    if (!targetBusinessId || targetBusinessId === "undefined") {
      const firstBiz = await prisma.business.findFirst()
      targetBusinessId = firstBiz?.id || ""
    }

    if (!targetBusinessId) {
      return null
    }

    const now = new Date()
    let startDate = new Date()
    const endDate = new Date(now)
    endDate.setHours(23, 59, 59, 999)

    if (range === 'today') {
      startDate.setHours(0, 0, 0, 0)
    } else if (range === 'week') {
      startDate.setDate(now.getDate() - 7)
      startDate.setHours(0, 0, 0, 0)
    } else if (range === 'month') {
      startDate.setDate(now.getDate() - 30)
      startDate.setHours(0, 0, 0, 0)
    } else if (range === 'all') {
      startDate = new Date(2000, 0, 1)
    }

    const sales = await prisma.sale.findMany({
      where: {
        businessId: targetBusinessId,
        ...(locationId && locationId !== "undefined" ? { locationId } : {}),
        status: { in: ['pagada', 'preparada', 'entregada'] },
        createdAt: { gte: startDate, lte: endDate }
      },
      include: {
        items: {
          include: {
            product: { select: { costPrice: true, name: true, price: true } }
          }
        },
        vendor: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" }
    })

    let grossIncome = 0
    let totalCost = 0
    let efectivoTotal = 0
    let tarjetaTotal = 0
    let transferenciaTotal = 0
    let creditoTotal = 0

    const salesList = sales.map(sale => {
      grossIncome += sale.total

      let saleCost = 0
      sale.items.forEach(item => {
        const itemCost = (item.product?.costPrice && item.product.costPrice > 0)
          ? item.product.costPrice * item.qty
          : (item.price * 0.7) * item.qty
        saleCost += itemCost
      })
      totalCost += saleCost

      const method = (sale.paymentMethod || 'efectivo').toLowerCase()
      if (method === 'efectivo') efectivoTotal += sale.total
      else if (method === 'tarjeta') tarjetaTotal += sale.total
      else if (method === 'transferencia') transferenciaTotal += sale.total
      else if (method === 'credito') creditoTotal += sale.total

      const saleProfit = sale.total - saleCost

      return {
        id: sale.id,
        folio: sale.folio,
        clientName: sale.clientName || 'Cliente Mostrador',
        vendorName: sale.vendor?.name || 'Vendedor',
        paymentMethod: sale.paymentMethod || 'efectivo',
        subtotal: sale.subtotal,
        iva: sale.iva,
        total: sale.total,
        cost: saleCost,
        profit: saleProfit,
        createdAt: sale.createdAt
      }
    })

    const grossProfit = grossIncome - totalCost
    const marginPercent = grossIncome > 0 ? parseFloat(((grossProfit / grossIncome) * 100).toFixed(1)) : 0

    return {
      date: now.toISOString().split('T')[0],
      range,
      totalSales: sales.length,
      grossIncome,
      totalCost,
      grossProfit,
      marginPercent,
      efectivoTotal,
      tarjetaTotal,
      transferenciaTotal,
      creditoTotal,
      salesList
    }
  } catch (error) {
    console.error('Error calculating financial summary:', error)
    return null
  }
}

export async function actionGetTodayCashCloseSummary(businessId: string, locationId?: string) {
  try {
    let targetBusinessId = businessId
    if (!targetBusinessId || targetBusinessId === "undefined") {
      const firstBiz = await prisma.business.findFirst()
      targetBusinessId = firstBiz?.id || ""
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endOfDay = new Date(today)
    endOfDay.setHours(23, 59, 59, 999)

    const sales = await prisma.sale.findMany({
      where: {
        businessId: targetBusinessId,
        ...(locationId && locationId !== "undefined" ? { locationId } : {}),
        status: { in: ['pagada', 'preparada', 'entregada'] },
        createdAt: { gte: today, lte: endOfDay }
      }
    })

    let totalEfectivo = 0
    let totalTarjeta = 0
    let totalTransferencia = 0
    let totalVentas = 0

    sales.forEach(s => {
      totalVentas += s.total
      const method = (s.paymentMethod || 'efectivo').toLowerCase()
      if (method === 'efectivo') totalEfectivo += s.total
      else if (method === 'tarjeta') totalTarjeta += s.total
      else if (method === 'transferencia') totalTransferencia += s.total
    })

    return {
      totalEfectivo,
      totalTarjeta,
      totalTransferencia,
      totalVentas,
      salesCount: sales.length
    }
  } catch (error) {
    console.error('Error fetching today cash close summary:', error)
    return { totalEfectivo: 0, totalTarjeta: 0, totalTransferencia: 0, totalVentas: 0, salesCount: 0 }
  }
}

export async function actionCreateCashClose(
  businessId: string,
  locationId: string,
  initialCash: number,
  finalCash: number,
  observations?: string
) {
  try {
    let targetBusinessId = businessId
    if (!targetBusinessId || targetBusinessId === "undefined") {
      const firstBiz = await prisma.business.findFirst()
      targetBusinessId = firstBiz?.id || ""
    }
    let targetLocationId = locationId
    if (!targetLocationId || targetLocationId === "undefined") {
      const firstLoc = await prisma.location.findFirst({ where: { businessId: targetBusinessId } })
      targetLocationId = firstLoc?.id || ""
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endOfDay = new Date(today)
    endOfDay.setHours(23, 59, 59, 999)

    const sales = await prisma.sale.findMany({
      where: {
        businessId: targetBusinessId,
        status: { in: ['pagada', 'preparada', 'entregada'] },
        paymentMethod: 'efectivo',
        createdAt: { gte: today, lte: endOfDay }
      }
    })

    const totalSalesAmount = sales.reduce((sum, s) => sum + s.total, 0)
    const expectedCash = initialCash + totalSalesAmount
    const difference = finalCash - expectedCash

    let status: 'cuadrado' | 'faltante' | 'sobrante' = 'cuadrado'
    if (difference < -1) status = 'faltante'
    if (difference > 1) status = 'sobrante'

    const cashClose = await prisma.cashClose.create({
      data: {
        businessId: targetBusinessId,
        locationId: targetLocationId,
        date: today,
        initialCash,
        finalCash,
        totalSales: sales.length,
        totalIngresos: totalSalesAmount,
        totalCosto: totalSalesAmount * 0.7,
        margin: totalSalesAmount * 0.3,
        difference: Math.abs(difference),
        status,
        observations
      }
    })

    return { success: true, cashClose }
  } catch (error) {
    console.error('Error creating cash close:', error)
    return { error: 'Error al crear corte de caja' }
  }
}

export async function actionGetCashCloseHistory(businessId: string, locationId?: string, days: number = 30) {
  try {
    let targetBusinessId = businessId
    if (!targetBusinessId || targetBusinessId === "undefined") {
      const firstBiz = await prisma.business.findFirst()
      targetBusinessId = firstBiz?.id || ""
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    return await prisma.cashClose.findMany({
      where: {
        businessId: targetBusinessId,
        ...(locationId && locationId !== "undefined" ? { locationId } : {}),
        date: { gte: startDate }
      },
      orderBy: { createdAt: 'desc' }
    })
  } catch (error) {
    console.error('Error fetching cash close history:', error)
    return []
  }
}

export async function actionGetCxCSummary(businessId: string, locationId?: string) {
  try {
    let targetBusinessId = businessId
    if (!targetBusinessId || targetBusinessId === "undefined") {
      const firstBiz = await prisma.business.findFirst()
      targetBusinessId = firstBiz?.id || ""
    }

    // Obtenemos cuentas registradas en AccountsReceivable o ventas a credito sin registrar
    const cxc = await prisma.accountsReceivable.findMany({
      where: { businessId: targetBusinessId },
      include: { sale: true }
    })

    const creditSales = await prisma.sale.findMany({
      where: {
        businessId: targetBusinessId,
        paymentMethod: 'credito',
        status: { in: ['pagada', 'pendiente', 'preparada', 'entregada'] }
      }
    })

    const totalAmountFromSales = creditSales.reduce((sum, item) => sum + item.total, 0)
    const totalAmount = cxc.length > 0 ? cxc.reduce((sum, item) => sum + item.amount, 0) : totalAmountFromSales
    const totalPaid = cxc.reduce((sum, item) => sum + item.amountPaid, 0)
    const pending = totalAmount - totalPaid

    return {
      totalAmount,
      totalPaid,
      pending,
      overdue: 0,
      collectionRate: totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0,
      count: cxc.length || creditSales.length,
      creditSalesList: creditSales
    }
  } catch (error) {
    console.error('Error calculating CxC summary:', error)
    return { totalAmount: 0, totalPaid: 0, pending: 0, overdue: 0, collectionRate: 0, count: 0, creditSalesList: [] }
  }
}

export async function actionGetCxPSummary(businessId: string) {
  try {
    let targetBusinessId = businessId
    if (!targetBusinessId || targetBusinessId === "undefined") {
      const firstBiz = await prisma.business.findFirst()
      targetBusinessId = firstBiz?.id || ""
    }

    const cxp = await prisma.accountsPayable.findMany({
      where: { businessId: targetBusinessId },
      include: { supplier: true, po: true }
    })

    const totalAmount = cxp.reduce((sum, item) => sum + item.amount, 0)
    const totalPaid = cxp.reduce((sum, item) => sum + item.amountPaid, 0)
    const pending = totalAmount - totalPaid

    return {
      totalAmount,
      totalPaid,
      pending,
      count: cxp.length,
      list: cxp
    }
  } catch (error) {
    console.error('Error fetching CxP summary:', error)
    return { totalAmount: 0, totalPaid: 0, pending: 0, count: 0, list: [] }
  }
}
