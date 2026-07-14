'use server'

import { prisma } from '@/lib/prisma'

// Cuentas por Cobrar (CxC)
export async function actionCreateAccountsReceivable(
  businessId: string,
  saleId: string,
  clientName: string,
  amount: number,
  dueDate: Date
) {
  try {
    const cxc = await prisma.accountsReceivable.create({
      data: {
        businessId,
        saleId,
        clientName,
        amount,
        amountPaid: 0,
        dueDate,
        status: 'pendiente'
      }
    })

    return { success: true, cxc }
  } catch (error) {
    console.error('Error creating CxC:', error)
    return { error: 'Error al crear cuenta por cobrar' }
  }
}

export async function actionGetAccountsReceivable(businessId: string, status?: string) {
  try {
    const cxc = await prisma.accountsReceivable.findMany({
      where: {
        businessId,
        ...(status && { status: status as any })
      },
      include: {
        sale: {
          select: {
            folio: true,
            createdAt: true
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    })

    return cxc
  } catch (error) {
    console.error('Error fetching CxC:', error)
    return []
  }
}

export async function actionRecordPaymentReceivable(
  cxcId: string,
  amount: number,
  paymentMethod: string
) {
  try {
    const cxc = await prisma.accountsReceivable.findUnique({
      where: { id: cxcId }
    })

    if (!cxc) {
      return { error: 'Cuenta no encontrada' }
    }

    const newAmountPaid = cxc.amountPaid + amount
    const newStatus = newAmountPaid >= cxc.amount ? 'pagado' : 'parcial'

    await prisma.accountsReceivable.update({
      where: { id: cxcId },
      data: {
        amountPaid: newAmountPaid,
        status: newStatus
      }
    })

    await prisma.paymentReceivable.create({
      data: {
        cxcId,
        amount,
        paymentMethod,
        paymentDate: new Date()
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Error recording payment:', error)
    return { error: 'Error al registrar pago' }
  }
}

// Cuentas por Pagar (CxP)
export async function actionCreateAccountsPayable(
  businessId: string,
  poId: string,
  supplierId: string,
  amount: number,
  dueDate: Date
) {
  try {
    const cxp = await prisma.accountsPayable.create({
      data: {
        businessId,
        poId,
        supplierId,
        amount,
        amountPaid: 0,
        dueDate,
        status: 'pendiente'
      }
    })

    return { success: true, cxp }
  } catch (error) {
    console.error('Error creating CxP:', error)
    return { error: 'Error al crear cuenta por pagar' }
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
        supplier: {
          select: {
            name: true
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    })

    return cxp
  } catch (error) {
    console.error('Error fetching CxP:', error)
    return []
  }
}

export async function actionRecordPaymentPayable(
  cxpId: string,
  amount: number,
  paymentMethod: string
) {
  try {
    const cxp = await prisma.accountsPayable.findUnique({
      where: { id: cxpId }
    })

    if (!cxp) {
      return { error: 'Cuenta no encontrada' }
    }

    const newAmountPaid = cxp.amountPaid + amount
    const newStatus = newAmountPaid >= cxp.amount ? 'pagado' : 'parcial'

    await prisma.accountsPayable.update({
      where: { id: cxpId },
      data: {
        amountPaid: newAmountPaid,
        status: newStatus
      }
    })

    await prisma.paymentPayable.create({
      data: {
        cxpId,
        amount,
        paymentMethod,
        paymentDate: new Date()
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Error recording payment:', error)
    return { error: 'Error al registrar pago' }
  }
}

// Corte de Caja
export async function actionCreateCashClose(
  businessId: string,
  locationId: string,
  date: Date,
  initialCash: number,
  finalCash: number,
  observations?: string
) {
  try {
    const sales = await prisma.sale.findMany({
      where: {
        businessId,
        locationId,
        createdAt: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lte: new Date(date.setHours(23, 59, 59, 999))
        }
      },
      include: {
        items: {
          include: {
            product: { select: { costPrice: true } }
          }
        }
      }
    })

    const totalSales = sales.length
    const totalIngresos = sales.reduce((sum, s) => sum + s.total, 0)
    const totalCosto = sales.reduce((sum, s) => {
      return sum + s.items.reduce((itemSum, item) => {
        return itemSum + item.qty * item.product.costPrice
      }, 0)
    }, 0)

    const expectedCash = initialCash + totalIngresos
    const difference = finalCash - expectedCash

    const cashClose = await prisma.cashClose.create({
      data: {
        businessId,
        locationId,
        date,
        initialCash,
        finalCash,
        totalSales,
        totalIngresos,
        totalCosto,
        margin: totalIngresos - totalCosto,
        difference,
        observations,
        status: difference === 0 ? 'cuadrado' : 'faltante'
      }
    })

    return { success: true, cashClose }
  } catch (error) {
    console.error('Error creating cash close:', error)
    return { error: 'Error al crear corte de caja' }
  }
}

export async function actionGetCashCloses(businessId: string, locationId?: string) {
  try {
    const closes = await prisma.cashClose.findMany({
      where: {
        businessId,
        ...(locationId && { locationId })
      },
      orderBy: { date: 'desc' }
    })

    return closes
  } catch (error) {
    console.error('Error fetching cash closes:', error)
    return []
  }
}

// Resumen Financiero
export async function actionGetFinancialSummary(businessId: string, startDate?: Date, endDate?: Date) {
  try {
    const cxc = await prisma.accountsReceivable.findMany({
      where: { businessId }
    })

    const cxp = await prisma.accountsPayable.findMany({
      where: { businessId }
    })

    const sales = await prisma.sale.findMany({
      where: {
        businessId,
        ...(startDate && { createdAt: { gte: startDate } }),
        ...(endDate && { createdAt: { lte: endDate } })
      },
      include: {
        items: {
          include: {
            product: { select: { costPrice: true } }
          }
        }
      }
    })

    const totalIngresos = sales.reduce((sum, s) => sum + s.total, 0)
    const totalCosto = sales.reduce((sum, s) => {
      return sum + s.items.reduce((itemSum, item) => {
        return itemSum + item.qty * item.product.costPrice
      }, 0)
    }, 0)

    const totalMargin = totalIngresos - totalCosto

    const cxcPending = cxc.reduce((sum, c) => sum + (c.amount - c.amountPaid), 0)
    const cxpPending = cxp.reduce((sum, c) => sum + (c.amount - c.amountPaid), 0)

    const cxcOverdue = cxc.filter(c => c.dueDate < new Date() && c.status !== 'pagado').length
    const cxpOverdue = cxp.filter(c => c.dueDate < new Date() && c.status !== 'pagado').length

    return {
      period: { start: startDate, end: endDate },
      sales: {
        count: sales.length,
        totalIngresos,
        totalCosto,
        margin: totalMargin,
        marginPercent: totalIngresos > 0 ? (totalMargin / totalIngresos) * 100 : 0
      },
      cxc: {
        total: cxc.reduce((sum, c) => sum + c.amount, 0),
        pending: cxcPending,
        overdue: cxcOverdue,
        count: cxc.length
      },
      cxp: {
        total: cxp.reduce((sum, c) => sum + c.amount, 0),
        pending: cxpPending,
        overdue: cxpOverdue,
        count: cxp.length
      },
      netCash: totalIngresos - cxpPending + cxcPending
    }
  } catch (error) {
    console.error('Error fetching financial summary:', error)
    return null
  }
}

// Rentabilidad por Producto
export async function actionGetProductProfitability(businessId: string, days: number = 30) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const sales = await prisma.sale.findMany({
      where: {
        businessId,
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
                costPrice: true
              }
            }
          }
        }
      }
    })

    const profitability: Record<string, {
      name: string
      clave: string
      qty: number
      revenue: number
      cost: number
      margin: number
      marginPercent: number
      count: number
    }> = {}

    sales.forEach(sale => {
      sale.items.forEach(item => {
        const prodId = item.product.id
        if (!profitability[prodId]) {
          profitability[prodId] = {
            name: item.product.name,
            clave: item.product.clave,
            qty: 0,
            revenue: 0,
            cost: 0,
            margin: 0,
            marginPercent: 0,
            count: 0
          }
        }
        profitability[prodId].qty += item.qty
        profitability[prodId].revenue += item.subtotal
        profitability[prodId].cost += item.qty * item.product.costPrice
        profitability[prodId].count += 1
      })
    })

    return Object.entries(profitability)
      .map(([id, data]) => ({
        id,
        ...data,
        margin: data.revenue - data.cost,
        marginPercent: data.revenue > 0 ? ((data.revenue - data.cost) / data.revenue) * 100 : 0
      }))
      .sort((a, b) => b.margin - a.margin)
  } catch (error) {
    console.error('Error fetching product profitability:', error)
    return []
  }
}
