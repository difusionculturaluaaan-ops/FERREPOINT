const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function generateMockCFDI40(params) {
  const isSandbox = true;
  const now = new Date().toISOString();
  
  const randomHex = (len) => Math.random().toString(16).substring(2, 2 + len).toUpperCase();
  const uuid = `${randomHex(8)}-${randomHex(4)}-4${randomHex(3)}-${randomHex(4)}-${randomHex(12)}`;

  const subtotal = params.items.reduce((acc, item) => acc + item.subtotal, 0);
  const iva = params.items.reduce((acc, item) => acc + item.taxAmount, 0);
  const total = subtotal + iva;

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

async function main() {
  console.log('🚀 TESTING CFDI 4.0 LOCAL SANDBOX GENERATOR\n');

  const targetSale = await prisma.sale.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { business: true, items: { include: { product: true } } }
  });

  if (!targetSale) {
    console.log('❌ No sales found in database.');
    return;
  }

  console.log(`📄 Generating CFDI 4.0 for Sale Folio #${targetSale.folio} (Client: ${targetSale.clientName || 'Público en General'})...`);

  const result = generateMockCFDI40({
    folio: targetSale.folio,
    issuer: {
      rfc: targetSale.business.rfc || 'FCE200101ABC',
      razonSocial: targetSale.business.name,
      codigoPostal: '06000',
      regimenFiscal: '601'
    },
    receiver: {
      rfc: targetSale.clientRfc || 'XAXX010101000',
      razonSocial: targetSale.clientName || 'PÚBLICO EN GENERAL',
      codigoPostal: '06000',
      regimenFiscal: '616',
      usoCfdi: 'G03'
    },
    items: targetSale.items.length > 0 ? targetSale.items.map(item => ({
      productCode: item.product ? item.product.clave : '01010101',
      description: item.product ? item.product.name : 'Producto Ferretería',
      unitCode: 'H87',
      unitPrice: item.price,
      quantity: item.qty,
      subtotal: item.subtotal,
      taxAmount: item.subtotal * 0.16,
      total: item.subtotal * 1.16
    })) : [{
      productCode: '40090109',
      description: 'Estuco Premium 20 KG',
      unitCode: 'H87',
      unitPrice: 250,
      quantity: 4,
      subtotal: 1000,
      taxAmount: 160,
      total: 1160
    }],
    paymentMethod: targetSale.paymentMethod || 'efectivo'
  });

  console.log('\n✅ CFDI 4.0 TIMBRADO EN MODO PRUEBA / SANDBOX:');
  console.log('════════════════════════════════════════════════════════════');
  console.log('UUID (Folio Fiscal):', result.uuid);
  console.log('Fecha Emisión:     ', result.fechaEmision);
  console.log('Sello SAT:         ', result.selloSAT);
  console.log('Cadena Original:   ', result.cadenaOriginal);
  console.log('PDF Preview URL:   ', result.pdfUrl);
  console.log('QR SAT URL:        ', result.qrCodeUrl);
  console.log('\n📄 XML PREVIEW (Primeras 15 líneas):');
  console.log(result.xmlContent.split('\n').slice(0, 15).join('\n'));
  console.log('...\n════════════════════════════════════════════════════════════');
  console.log('\n🎉 PRUEBA LOCAL DE FACTURACIÓN CFDI 4.0 COMPLETADA CON ÉXITO!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
