// Facturama API client & Local Sandbox Mock service for CFDI 4.0

export interface CFDIBusinessInfo {
 rfc: string;
 razonSocial: string;
 codigoPostal: string;
 regimenFiscal: string; // e.g. '601' - General de Ley Personas Morales
}

export interface CFDIClientInfo {
 rfc: string;
 razonSocial: string;
 codigoPostal: string;
 regimenFiscal: string; // e.g. '616' - Sin obligaciones fiscales / '601'
 usoCfdi: string; // e.g. 'G03' - Gastos en general
}

export interface CFDILineItem {
 productCode: string;
 description: string;
 unitCode: string; // e.g. 'H87' - Pieza
 unitPrice: number;
 quantity: number;
 subtotal: number;
 taxAmount: number;
 total: number;
}

export interface CFDIResponse {
 success: boolean;
 uuid?: string;
 folio?: string;
 xmlContent?: string;
 pdfUrl?: string;
 qrCodeUrl?: string;
 fechaEmision?: string;
 selloSAT?: string;
 selloCFD?: string;
 cadenaOriginal?: string;
 message?: string;
 sandboxMode: boolean;
}

export async function generateMockCFDI40(params: {
 folio: string;
 issuer: CFDIBusinessInfo;
 receiver: CFDIClientInfo;
 items: CFDILineItem[];
 paymentMethod: string;
}): Promise<CFDIResponse> {
 const isSandbox = process.env.FACTURAMA_SANDBOX !== 'false';
 const now = new Date().toISOString();
 
 // Generate deterministically formatted mock UUID
 const randomHex = (len: number) => Math.random().toString(16).substring(2, 2 + len).toUpperCase();
 const uuid = `${randomHex(8)}-${randomHex(4)}-4${randomHex(3)}-${randomHex(4)}-${randomHex(12)}`;

 const subtotal = params.items.reduce((acc, item) => acc + item.subtotal, 0);
 const iva = params.items.reduce((acc, item) => acc + item.taxAmount, 0);
 const total = subtotal + iva;

 // Build clean mock CFDI 4.0 XML
 const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante 
 xmlns:cfdi="http://www.sat.gob.mx/cfd/4" 
 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
 Version="4.0" 
 Folio="${params.folio}" 
 Fecha="${now}" 
 FormaPago="${params.paymentMethod === 'tarjeta' ? '04' : params.paymentMethod === 'transferencia' ? '03' : '01'}" 
 SubTotal="${subtotal.toFixed(2)}" 
 Moneda="MXN" 
 Total="${total.toFixed(2)}" 
 TipoDeComprobante="I" 
 Exportacion="01" 
 LugarExpedicion="${params.issuer.codigoPostal}">
 <cfdi:Emisor Rfc="${params.issuer.rfc}" Nombre="${params.issuer.razonSocial}" RegimenFiscal="${params.issuer.regimenFiscal}"/>
 <cfdi:Receptor Rfc="${params.receiver.rfc}" Nombre="${params.receiver.razonSocial}" DomicilioFiscalReceptor="${params.receiver.codigoPostal}" RegimenFiscalReceptor="${params.receiver.regimenFiscal}" UsoCFDI="${params.receiver.usoCfdi}"/>
 <cfdi:Conceptos>
 ${params.items.map(item => `
 <cfdi:Concepto ClaveProdServ="${item.productCode || '01010101'}" Cantidad="${item.quantity}" ClaveUnidad="${item.unitCode || 'H87'}" Descripcion="${item.description}" ValorUnitario="${item.unitPrice.toFixed(2)}" Importe="${item.subtotal.toFixed(2)}">
 <cfdi:Impuestos>
 <cfdi:Traslados>
 <cfdi:Traslado Base="${item.subtotal.toFixed(2)}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${item.taxAmount.toFixed(2)}"/>
 </cfdi:Traslados>
 </cfdi:Impuestos>
 </cfdi:Concepto>`).join('')}
 </cfdi:Conceptos>
 <cfdi:Impuestos TotalImpuestosTrasladados="${iva.toFixed(2)}">
 <cfdi:Traslados>
 <cfdi:Traslado Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${iva.toFixed(2)}"/>
 </cfdi:Traslados>
 </cfdi:Impuestos>
 <cfdi:Complemento>
 <tfd:TimbreFiscalDigital 
 xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" 
 Version="1.1" 
 UUID="${uuid}" 
 FechaTimbrado="${now}" 
 RfcProvCertif="SAT970701NN3" 
 SelloCFD="MOCK_SELLO_CFD_${randomHex(32)}" 
 NoCertificadoSAT="00001000000504465028" 
 SelloSAT="MOCK_SELLO_SAT_${randomHex(32)}"/>
 </cfdi:Complemento>
</cfdi:Comprobante>`;

 return {
 success: true,
 uuid,
 folio: params.folio,
 xmlContent,
 pdfUrl: `https://facturama.mx/mock-pdf/${uuid}`,
 qrCodeUrl: `https://www.sat.gob.mx/consulta/qr?id=${uuid}&re=${params.issuer.rfc}&rr=${params.receiver.rfc}&tt=${total.toFixed(2)}`,
 fechaEmision: now,
 selloSAT: `MOCK_SELLO_SAT_${randomHex(16)}`,
 selloCFD: `MOCK_SELLO_CFD_${randomHex(16)}`,
 cadenaOriginal: `||1.1|${uuid}|${now}|SAT970701NN3||`,
 message: 'Factura CFDI 4.0 timbrada exitosamente (Modo Prueba / Sandbox)',
 sandboxMode: isSandbox
 };
}
