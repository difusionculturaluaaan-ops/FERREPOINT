"use server"

import { prisma } from "@/lib/prisma"
import { broadcastAppEvent } from "@/lib/eventEmitter"

// Crear orden (sin pagar) - VENDEDOR
export async function actionCreateOrder(
  businessId: string,
  locationId: string,
  vendorId: string,
  items: { productId: string; qty: number; price: number; subtotal: number }[],
  clientName?: string,
  clientPhone?: string,
  clientAddress?: string,
  deliveryType: "mostrador" | "domicilio" = "mostrador",
  paymentMethod?: string,
  comprobante?: string
) {
  try {
    let targetBusinessId = businessId
    if (!targetBusinessId || targetBusinessId === "undefined") {
      const firstBiz = await prisma.business.findFirst()
      targetBusinessId = firstBiz?.id || ""
    }

    if (!targetBusinessId) {
      return { success: false, error: "No existe una empresa registrada para esta orden" }
    }

    let targetLocationId = locationId
    if (!targetLocationId || targetLocationId === "undefined") {
      const firstLoc = await prisma.location.findFirst({ where: { businessId: targetBusinessId } })
      targetLocationId = firstLoc?.id || ""
    }
    if (!targetLocationId) {
      const anyLoc = await prisma.location.findFirst()
      targetLocationId = anyLoc?.id || ""
    }

    let targetVendorId = vendorId
    if (!targetVendorId || targetVendorId === "undefined") {
      const firstVendor = await prisma.user.findFirst({ where: { businessId: targetBusinessId } })
      targetVendorId = firstVendor?.id || ""
    }
    if (!targetVendorId) {
      const anyVendor = await prisma.user.findFirst()
      targetVendorId = anyVendor?.id || ""
    }

    if (!targetLocationId || !targetVendorId) {
      return { success: false, error: "No se encontró sucursal o usuario asignado para esta venta" }
    }

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
    const iva = subtotal * 0.16
    const total = subtotal + iva

    // Generar folio único
    const lastSale = await prisma.sale.findFirst({
      where: { businessId: targetBusinessId },
      orderBy: { createdAt: "desc" }
    })
    const folioNumber = lastSale ? parseInt(lastSale.folio) + 1 : 1
    const folio = folioNumber.toString()

    // Crear sale (orden)
    const sale = await prisma.sale.create({
      data: {
        folio,
        clientName: clientName || "Cliente Mostrador",
        clientPhone,
        clientAddress,
        deliveryType,
        paymentMethod: paymentMethod || null,
        comprobante: comprobante || "completo",
        subtotal,
        iva,
        total,
        status: "pendiente",
        business: { connect: { id: targetBusinessId } },
        location: { connect: { id: targetLocationId } },
        vendor: { connect: { id: targetVendorId } },
        items: {
          create: items.map(item => ({
            productId: item.productId,
            qty: item.qty,
            price: item.price,
            subtotal: item.subtotal
          }))
        }
      },
      include: { items: true }
    })

    broadcastAppEvent({
      type: 'ORDER_CREATED',
      businessId,
      locationId,
      data: { saleId: sale.id, folio: sale.folio, total: sale.total, clientName: sale.clientName },
      timestamp: new Date().toISOString()
    })

    return { success: true, sale, message: `Orden #${folio} creada` }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error("Create order error:", errorMsg)
    return { success: false, error: `Error: ${errorMsg}` }
  }
}

// Procesar pago - CAJERO / VENDEDOR
export async function actionProcessPayment(
  saleId: string,
  paymentMethod: "efectivo" | "transferencia" | "tarjeta" | "credito" | string,
  cajeroId: string,
  comprobante?: string
) {
  try {
    const sale = await prisma.sale.update({
      where: { id: saleId },
      data: {
        status: "pagada",
        paymentMethod,
        paymentProcessedAt: new Date(),
        paidBy: cajeroId,
        comprobante: comprobante || `CPD-${saleId.slice(0, 8).toUpperCase()}`
      },
      include: { items: true, vendor: true }
    })

    // Auto-create SurtidoOrder if domicilio delivery
    if (sale.deliveryType === "domicilio" && sale.items.length > 0) {
      try {
        const { actionCreateSurtidoOrder } = await import("@/features/bodega/server")
        const itemsData = sale.items.map(item => ({
          productId: item.productId,
          qty: item.qty,
          price: item.price,
          subtotal: item.subtotal
        }))

        const surtidoResult = await actionCreateSurtidoOrder(
          sale.businessId,
          sale.locationId,
          sale.id,
          itemsData
        )

        console.log("[actionProcessPayment] SurtidoOrder created:", surtidoResult.success)
      } catch (err) {
        console.error("[actionProcessPayment] Error creating SurtidoOrder:", err)
      }
    }

    broadcastAppEvent({
      type: 'ORDER_PAID',
      businessId: sale.businessId,
      locationId: sale.locationId,
      data: { saleId: sale.id, folio: sale.folio, total: sale.total, clientName: sale.clientName },
      timestamp: new Date().toISOString()
    })

    return { success: true, sale, message: `Orden #${sale.folio} pagada ✓` }
  } catch (error) {
    console.error("Process payment error:", error)
    return { success: false, error: "Error al procesar pago" }
  }
}

// Obtener órdenes pendientes de pago - CAJERO
export async function actionGetPendingOrders(businessId: string) {
  try {
    let targetBusinessId = businessId
    if (!targetBusinessId || targetBusinessId === "undefined") {
      const firstBiz = await prisma.business.findFirst()
      targetBusinessId = firstBiz?.id || ""
    }

    const orders = await prisma.sale.findMany({
      where: {
        ...(targetBusinessId ? { businessId: targetBusinessId } : {}),
        status: "pendiente"
      },
      include: {
        items: { include: { product: true } },
        vendor: true
      },
      orderBy: { createdAt: "desc" }
    })
    return orders
  } catch (error) {
    console.error("Get pending orders error:", error)
    return []
  }
}

// Obtener órdenes pagadas (para Vendedor) - NOTIFICACIÓN
export async function actionGetPaidOrders(businessId: string, vendorId: string) {
  try {
    let targetBusinessId = businessId
    if (!targetBusinessId || targetBusinessId === "undefined") {
      const firstBiz = await prisma.business.findFirst()
      targetBusinessId = firstBiz?.id || ""
    }

    const orders = await prisma.sale.findMany({
      where: {
        ...(targetBusinessId ? { businessId: targetBusinessId } : {}),
        status: { in: ["pagada", "preparada"] }
      },
      include: { items: true },
      orderBy: { createdAt: "desc" }
    })
    return orders
  } catch (error) {
    console.error("Get paid orders error:", error)
    return []
  }
}

// Obtener órdenes para preparar en bodega (si es domicilio)
export async function actionGetOrdersForWarehouse(businessId: string) {
  try {
    const orders = await prisma.sale.findMany({
      where: {
        businessId,
        status: "pagada",
        deliveryType: "domicilio"
      },
      include: {
        items: { include: { product: true } },
        vendor: true
      },
      orderBy: { createdAt: "asc" }
    })

    return orders
  } catch (error) {
    console.error("Get warehouse orders error:", error)
    return []
  }
}

// Marcar orden como preparada - BODEGUERO
export async function actionMarkOrderAsReady(saleId: string) {
  try {
    const sale = await prisma.sale.update({
      where: { id: saleId },
      data: { status: "preparada" }
    })

    broadcastAppEvent({
      type: 'SURTIDO_UPDATED',
      businessId: sale.businessId,
      locationId: sale.locationId,
      data: { saleId: sale.id, folio: sale.folio, status: sale.status },
      timestamp: new Date().toISOString()
    })

    return { success: true, message: `Orden #${sale.folio} lista para entrega` }
  } catch (error) {
    console.error("Mark order as ready error:", error)
    return { success: false, error: "Error al actualizar orden" }
  }
}

// Obtener productos - VENDEDOR
export async function actionGetProducts(businessId: string, locationId?: string) {
  try {
    let products = await prisma.product.findMany({
      where: { businessId, active: true },
      include: { image: true }
    })

    if (products.length === 0 && businessId) {
      const { seedTenantDefaultCatalog } = await import('@/lib/seedTenantCatalog')
      await seedTenantDefaultCatalog(businessId, locationId)
      products = await prisma.product.findMany({
        where: { businessId, active: true },
        include: { image: true }
      })
    }

    return products
  } catch (error) {
    console.error("Get products error:", error)
    return []
  }
}

// Obtener configuración del business (si requiere Cajero)
export async function actionGetBusinessConfig(businessId: string) {
  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { requiresCajero: true }
    })
    return { success: true, requiresCajero: business?.requiresCajero || false }
  } catch (error) {
    console.error("Get business config error:", error)
    return { success: false, requiresCajero: false }
  }
}

// Alias para compatibilidad con código existente
export async function actionCreateSale(
  businessId: string,
  locationId: string,
  vendorId: string,
  items: { productId: string; qty: number; price: number; subtotal: number }[],
  clientName?: string,
  clientPhone?: string,
  clientAddress?: string,
  deliveryType: "mostrador" | "domicilio" = "mostrador"
) {
  return actionCreateOrder(
    businessId,
    locationId,
    vendorId,
    items,
    clientName,
    clientPhone,
    clientAddress,
    deliveryType
  )
}
