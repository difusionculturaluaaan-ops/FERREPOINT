"use server"

import { prisma } from "@/lib/prisma"

// Crear orden (sin pagar) - VENDEDOR
export async function actionCreateOrder(
  businessId: string,
  locationId: string,
  vendorId: string,
  items: { productId: string; qty: number; price: number; subtotal: number }[],
  clientName?: string,
  clientPhone?: string,
  clientAddress?: string,
  deliveryType: "mostrador" | "domicilio" = "mostrador"
) {
  try {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
    const iva = subtotal * 0.16
    const total = subtotal + iva

    // Generar folio único
    const lastSale = await prisma.sale.findFirst({
      where: { businessId },
      orderBy: { createdAt: "desc" }
    })
    const folioNumber = lastSale ? parseInt(lastSale.folio) + 1 : 1
    const folio = folioNumber.toString()

    // Crear sale (orden)
    const sale = await prisma.sale.create({
      data: {
        folio,
        clientName: clientName || "Cliente",
        clientPhone,
        clientAddress,
        deliveryType,
        paymentMethod: null,
        comprobante: "",
        subtotal,
        iva,
        total,
        status: "pendiente",
        business: { connect: { id: businessId } },
        location: { connect: { id: locationId } },
        vendor: { connect: { id: vendorId } },
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

    return { success: true, sale, message: `Orden #${folio} creada` }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error("Create order error:", errorMsg, { businessId, locationId, vendorId, itemsCount: items.length })
    return { success: false, error: `Error: ${errorMsg}` }
  }
}

// Obtener órdenes pendientes de pago - CAJERO
export async function actionGetPendingOrders(businessId: string) {
  try {
    const orders = await prisma.sale.findMany({
      where: { businessId, status: "pendiente" },
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

// Procesar pago - CAJERO
export async function actionProcessPayment(
  saleId: string,
  paymentMethod: "efectivo" | "transferencia" | "tarjeta",
  cajeroId: string
) {
  try {
    const sale = await prisma.sale.update({
      where: { id: saleId },
      data: {
        status: "pagada",
        paymentMethod,
        paymentProcessedAt: new Date(),
        paidBy: cajeroId,
        comprobante: `CPD-${saleId.slice(0, 8).toUpperCase()}`
      },
      include: { items: true, vendor: true }
    })

    return { success: true, sale, message: `Orden #${sale.folio} pagada ✓` }
  } catch (error) {
    console.error("Process payment error:", error)
    return { success: false, error: "Error al procesar pago" }
  }
}

// Obtener órdenes pagadas (para Vendedor) - NOTIFICACIÓN
export async function actionGetPaidOrders(businessId: string, vendorId: string) {
  try {
    const orders = await prisma.sale.findMany({
      where: { businessId, vendorId, status: { in: ["pagada", "preparada"] } },
      include: { items: true },
      orderBy: { paymentProcessedAt: "desc" }
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
      orderBy: { paymentProcessedAt: "asc" }
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

    return { success: true, message: `Orden #${sale.folio} lista para entrega` }
  } catch (error) {
    console.error("Mark order as ready error:", error)
    return { success: false, error: "Error al actualizar orden" }
  }
}

// Obtener productos - VENDEDOR
export async function actionGetProducts(businessId: string, locationId?: string) {
  try {
    const products = await prisma.product.findMany({
      where: { businessId, active: true },
      include: { image: true }
    })
    return products
  } catch (error) {
    console.error("Get products error:", error)
    return []
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
