'use server'

import { prisma } from '@/lib/prisma'

export async function actionGetFinancialSummary(businessId: string, locationId: string, date?: Date) {
  try {
    const targetDate = date || new Date()
    targetDate.setHours(0, 0, 0, 0)
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    const sales = await prisma.sale.findMany({
      where: {
        businessId,
        locationId,
        createdAt: { gte: targetDate, lte: endOfDay }
      },
      include: {
        items: {
          include: {
            product: { select: { costPrice: true } }
          }
        }
      }
    })

    let grossIncome = 0
    let totalCost = 0

    sales.forEach(sale => {
      grossIncome += sale.total
      sale.items.forEach(item => {
        totalCost += item.product.costPrice * item.qty
      })
    })

    const grossProfit = grossIncome - totalCost
    const marginPercent = grossIncome > 0 ? ((grossProfit / grossIncome) * 100).toFixed(2) : '0'

    return {
      date: targetDate.toISOString().split('T')[0],
      totalSales: sales.length,
      grossIncome,
      totalCost,
      grossProfit,
      marginPercent: parseFloat(marginPercent),
      operatingExpenses: 0,
      netProfit: grossProfit
    }
  } catch (error) {
    console.error('Error calculating financial summary:', error)
    return null
  }
}

export async function actionGetAccountsReceivable(businessId: string, locationId?: string, status?: string) {
  try {
    const cxc = await prisma.accountsReceivable.findMany({
      where: {
        businessId,
        ...(locationId && { sale: { locationId } }),
        ...(status && { status: status as any })
      },
      include: {
        sale: { select: { folio: true, total: true, createdAt: true } },
        payments: { select: { amount: true, paymentDate: true } }
      },
      orderBy: { dueDate: 'asc' }
    })

    return cxc.map(item => ({
      ...item,
      daysOverdue: item.dueDate < new Date() ? Math.floor((new Date().getTime() - item.dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0,
      percentPaid: item.amount > 0 ? (item.amountPaid / item.amount) * 100 : 0
    }))
  } catch (error) {
    console.error('Error fetching CxC:', error)
    return []
  }
}

export async function actionGetAccountsPayable(businessId: string, status?: string) {
  try {
    const cxp = await prisma.accountsPayable.findMany({
      where: {
        businessId,
        ...(status && { status: status as any })
      },
      include: {
        po: { select: { poNumber: true, total: true, createdAt: true } },
        supplier: { select: { name: true, contact: true } },
        payments: { select: { amount: true, paymentDate: true } }
      },
      orderBy: { dueDate: 'asc' }
    })

    return cxp.map(item => ({
      ...item,
      daysUntilDue: Math.floor((item.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
      isOverdue: item.dueDate < new Date(),
      percentPaid: item.amount > 0 ? (item.amountPaid / item.amount) * 100 : 0
    }))
  } catch (error) {
    console.error('Error fetching CxP:', error)
    return []
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
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endOfDay = new Date(today)
    endOfDay.setHours(23, 59, 59, 999)

    const sales = await prisma.sale.findMany({
      where: {
        businessId,
        locationId,
        paymentMethod: 'efectivo',
        createdAt: { gte: today, lte: endOfDay }
      }
    })

    const totalSalesAmount = sales.reduce((sum, s) => sum + s.total, 0)
    const difference = finalCash - (initialCash + totalSalesAmount)

    let status: 'cuadrado' | 'faltante' | 'sobrante' = 'cuadrado'
    if (difference < -1) status = 'faltante'
    if (difference > 1) status = 'sobrante'

    const cashClose = await prisma.cashClose.create({
      data: {
        businessId,
        locationId,
        date: today,
        initialCash,
        finalCash,
        totalSales: sales.length,
        totalIngresos: totalSalesAmount,
        totalCosto: 0,
        margin: 0,
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

export async function actionGetCashCloseHistory(businessId: string, locationId: string, days: number = 30) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    return await prisma.cashClose.findMany({
      where: { businessId, locationId, date: { gte: startDate } },
      orderBy: { date: 'desc' }
    })
  } catch (error) {
    console.error('Error fetching cash close history:', error)
    return []
  }
}

export async function actionGetCxCSummary(businessId: string, locationId?: string) {
  try {
    const cxc = await prisma.accountsReceivable.findMany({
      where: { businessId, ...(locationId && { sale: { locationId } }) }
    })

    const totalAmount = cxc.reduce((sum, item) => sum + item.amount, 0)
    const totalPaid = cxc.reduce((sum, item) => sum + item.amountPaid, 0)
    const pending = cxc.filter(item => item.status !== 'pagado').reduce((sum, item) => sum + (item.amount - item.amountPaid), 0)
    const overdue = cxc.filter(item => item.dueDate < new Date()).reduce((sum, item) => sum + (item.amount - item.amountPaid), 0)

    return {
      totalAmount,
      totalPaid,
      pending,
      overdue,
      collectionRate: totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0,
      count: cxc.length
    }
  } catch (error) {
    console.error('Error calculating CxC summary:', error)
    return null
  }
}

export async function actionGetCxPSummary(businessId: string) {
  try {
    const cxp = await prisma.accountsPayable.findMany({ where: { businessId } })

    const totalAmount = cxp.reduce((sum, item) => sum + item.amount, 0)
    const totalPaid = cxp.reduce((sum, item) => sum + item.amountPaid, 0)
    const pending = cxp.filter(item => item.status !== 'pagado').reduce((sum, item) => sum + (item.amount - item.amountPaid), 0)

    return {
      totalAmount,
      totalPaid,
      pending,
      paymentRate: totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0,
      count: cxp.length
    }
  } catch (error) {
    console.error('Error calculating CxP summary:', error)
    return null
  }
}
