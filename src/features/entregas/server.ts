'use server'

import { prisma } from '@/lib/prisma'

// Generar mensaje WhatsApp con ubicación del cliente para el chofer
export async function actionGenerateWhatsappMessage(
  businessId: string,
  saleId: string
) {
  try {
    // Obtener datos de la orden (multi-tenant: filtrar por businessId)
    const sale = await prisma.sale.findFirst({
      where: {
        id: saleId,
        businessId // Multi-tenant safety
      },
      include: {
        items: {
          include: { product: true }
        }
      }
    })

    if (!sale) {
      return { success: false, error: 'Orden no encontrada' }
    }

    if (!sale.clientLatitude || !sale.clientLongitude) {
      return { success: false, error: 'Orden sin coordenadas GPS' }
    }

    if (sale.deliveryType !== 'domicilio') {
      return { success: false, error: 'Esta orden es para mostrador, no requiere entrega' }
    }

    // Construir Google Maps URL
    const googleMapsUrl = `https://maps.google.com/?q=${sale.clientLatitude},${sale.clientLongitude}`

    // Construir mensaje WhatsApp formateado
    const itemsText = sale.items
      .map(item => `• ${item.product.name} (x${item.qty})`)
      .join('\n')

    const whatsappMessage = `📦 *NUEVA ENTREGA - FERREPOINT*

*Folio:* #${sale.folio}
*Cliente:* ${sale.clientName || 'Cliente'}
*Tel:* ${sale.clientPhone || 'N/A'}

*📍 UBICACIÓN GPS:*
${googleMapsUrl}

*Dirección:*
${sale.clientAddress}

*Productos:*
${itemsText}

*💰 Monto:* $${sale.total.toFixed(2)}`

    return {
      success: true,
      message: whatsappMessage,
      googleMapsUrl,
      clientPhone: sale.clientPhone,
      folio: sale.folio
    }
  } catch (error) {
    console.error('Error generating whatsapp message:', error)
    return { success: false, error: 'Error al generar mensaje' }
  }
}

// Actualizar que se envió WhatsApp al chofer
export async function actionMarkWhatsappSent(
  businessId: string,
  saleId: string,
  choferPhone: string
) {
  try {
    const sale = await prisma.sale.update({
      where: {
        id: saleId
      },
      data: {
        choferPhone,
        whatsappSentAt: new Date()
      }
    })

    // Multi-tenant verification
    if (sale.businessId !== businessId) {
      return { success: false, error: 'No autorizado' }
    }

    return { success: true, sale }
  } catch (error) {
    console.error('Error marking whatsapp sent:', error)
    return { success: false, error: 'Error al actualizar' }
  }
}

// Obtener órdenes listas para entregar (por chofer o todas)
export async function actionGetDeliveryOrders(
  businessId: string,
  locationId: string,
  choferEmail?: string
) {
  try {
    const where: any = {
      businessId,
      locationId,
      deliveryType: 'domicilio',
      status: 'preparada'
    }

    const orders = await prisma.sale.findMany({
      where,
      include: {
        items: { include: { product: true } },
        vendor: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return orders
  } catch (error) {
    console.error('Error getting delivery orders:', error)
    return []
  }
}

// Marcar orden como entregada
export async function actionMarkOrderDelivered(
  businessId: string,
  saleId: string
) {
  try {
    const sale = await prisma.sale.update({
      where: { id: saleId },
      data: {
        status: 'entregada'
      }
    })

    // Multi-tenant verification
    if (sale.businessId !== businessId) {
      return { success: false, error: 'No autorizado' }
    }

    return { success: true, sale }
  } catch (error) {
    console.error('Error marking delivered:', error)
    return { success: false, error: 'Error al actualizar' }
  }
}
