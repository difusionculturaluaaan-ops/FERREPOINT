'use server';

import { prisma } from '@/lib/prisma';
import { generateMockCFDI40, CFDIResponse, CFDIClientInfo, CFDIBusinessInfo } from '@/lib/facturama';

export async function actionGenerateFactura(
 saleId: string,
 clientRfc?: string,
 clientRazonSocial?: string,
 clientCp?: string,
 usoCfdi: string = 'G03'
): Promise<CFDIResponse> {
 try {
 const sale = await prisma.sale.findUnique({
 where: { id: saleId },
 include: {
 business: true,
 items: { include: { product: true } }
 }
 });

 if (!sale) {
 return {
 success: false,
 message: 'Venta no encontrada',
 sandboxMode: true
 };
 }

 const issuer: CFDIBusinessInfo = {
 rfc: sale.business.rfc || 'FCE200101ABC',
 razonSocial: sale.business.name || 'Ferretería Centro S.A. de C.V.',
 codigoPostal: '06000',
 regimenFiscal: '601'
 };

 const receiver: CFDIClientInfo = {
 rfc: clientRfc || sale.clientRfc || 'XAXX010101000',
 razonSocial: clientRazonSocial || sale.clientName || 'PÚBLICO EN GENERAL',
 codigoPostal: clientCp || '06000',
 regimenFiscal: clientRfc && clientRfc !== 'XAXX010101000' ? '601' : '616',
 usoCfdi
 };

 const items = sale.items.map((item) => ({
 productCode: item.product?.clave || '01010101',
 description: item.product?.name || 'Producto Ferretería',
 unitCode: 'H87',
 unitPrice: item.price,
 quantity: item.qty,
 subtotal: item.subtotal,
 taxAmount: item.subtotal * 0.16,
 total: item.subtotal * 1.16
 }));

 const result = await generateMockCFDI40({
 folio: sale.folio,
 issuer,
 receiver,
 items,
 paymentMethod: sale.paymentMethod || 'efectivo'
 });

 return result;
 } catch (error) {
 console.error('[actionGenerateFactura] Error:', error);
 return {
 success: false,
 message: error instanceof Error ? error.message : 'Error al generar factura',
 sandboxMode: true
 };
 }
}
