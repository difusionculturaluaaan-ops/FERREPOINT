export interface TicketItem {
  name: string;
  qty: number;
  price: number;
  subtotal: number;
  clave?: string;
}

export interface PrintTicketParams {
  title?: string;
  subtitle?: string;
  folio: string;
  dateStr?: string;
  clientName?: string;
  clientPhone?: string;
  clientAddress?: string;
  paymentMethod?: string;
  vendorName?: string;
  businessName?: string;
  businessRfc?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  items: TicketItem[];
  subtotal: number;
  iva: number;
  total: number;
  ticketType?: 'completo' | 'resumido';
  paperFormat?: 'carta' | 'ticket';
}

function numeroALetras(num: number): string {
  const enteros = Math.floor(num);
  const centavos = Math.round((num - enteros) * 100);
  const centavosStr = String(centavos).padStart(2, '0') + '/100 M.N.';

  if (enteros === 0) return `CERO PESOS ${centavosStr}`;

  const Unidades = (n: number): string => {
    switch (n) {
      case 1: return 'UN';
      case 2: return 'DOS';
      case 3: return 'TRES';
      case 4: return 'CUATRO';
      case 5: return 'CINCO';
      case 6: return 'SEIS';
      case 7: return 'SIETE';
      case 8: return 'OCHO';
      case 9: return 'NUEVE';
      default: return '';
    }
  };

  const Decenas = (n: number): string => {
    const decena = Math.floor(n / 10);
    const unidad = n % 10;
    switch (decena) {
      case 1:
        switch (unidad) {
          case 0: return 'DIEZ';
          case 1: return 'ONCE';
          case 2: return 'DOCE';
          case 3: return 'TRECE';
          case 4: return 'CATORCE';
          case 5: return 'QUINCE';
          default: return 'DIECI' + Unidades(unidad);
        }
      case 2:
        return unidad === 0 ? 'VEINTE' : 'VEINTI' + Unidades(unidad);
      case 3: return 'TREINTA' + (unidad > 0 ? ' Y ' + Unidades(unidad) : '');
      case 4: return 'CUARENTA' + (unidad > 0 ? ' Y ' + Unidades(unidad) : '');
      case 5: return 'CINCUENTA' + (unidad > 0 ? ' Y ' + Unidades(unidad) : '');
      case 6: return 'SESENTA' + (unidad > 0 ? ' Y ' + Unidades(unidad) : '');
      case 7: return 'SETENTA' + (unidad > 0 ? ' Y ' + Unidades(unidad) : '');
      case 8: return 'OCHENTA' + (unidad > 0 ? ' Y ' + Unidades(unidad) : '');
      case 9: return 'NOVENTA' + (unidad > 0 ? ' Y ' + Unidades(unidad) : '');
      default: return Unidades(unidad);
    }
  };

  const Centenas = (n: number): string => {
    const centena = Math.floor(n / 100);
    const resto = n % 100;
    switch (centena) {
      case 1: return resto === 0 ? 'CIEN' : 'CIENTO ' + Decenas(resto);
      case 2: return 'DOSCIENTOS ' + Decenas(resto);
      case 3: return 'TRESCIENTOS ' + Decenas(resto);
      case 4: return 'CUATROCIENTOS ' + Decenas(resto);
      case 5: return 'QUINIENTOS ' + Decenas(resto);
      case 6: return 'SEISCIENTOS ' + Decenas(resto);
      case 7: return 'SETECIENTOS ' + Decenas(resto);
      case 8: return 'OCHOCIENTOS ' + Decenas(resto);
      case 9: return 'NOVECIENTOS ' + Decenas(resto);
      default: return Decenas(resto);
    }
  };

  const Seccion = (n: number, divisor: number, strSingular: string, strPlural: string): string => {
    const cientos = Math.floor(n / divisor);
    const resto = n % divisor;
    let letras = '';

    if (cientos > 0) {
      if (cientos > 1) {
        letras = Centenas(cientos) + ' ' + strPlural;
      } else {
        letras = strSingular;
      }
    }
    if (resto > 0) {
      letras += ' ';
    }
    return letras;
  };

  const Miles = (n: number): string => {
    const divisor = 1000;
    const cientos = Math.floor(n / divisor);
    const resto = n % divisor;
    const strMiles = Seccion(n, divisor, 'UN MIL', 'MIL');
    const strCentenas = Centenas(resto);

    if (strMiles === '') return strCentenas;
    return strMiles + ' ' + strCentenas;
  };

  const Millones = (n: number): string => {
    const divisor = 1000000;
    const cientos = Math.floor(n / divisor);
    const resto = n % divisor;
    const strMillones = Seccion(n, divisor, 'UN MILLON', 'MILLONES');
    const strMiles = Miles(resto);

    if (strMillones === '') return strMiles;
    return strMillones + ' ' + strMiles;
  };

  return (Millones(enteros) + ' PESOS ' + centavosStr).trim();
}

export function generateTicketHTML(params: PrintTicketParams): string {
  const {
    title = 'FERREPOINT',
    subtitle = 'Comprobante de Venta',
    folio,
    dateStr = new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'medium' }),
    clientName = 'Cliente Mostrador',
    clientPhone = '',
    clientAddress = '',
    paymentMethod = 'EFECTIVO',
    vendorName = 'Vendedor General',
    businessName = 'FERREPOINT - Ferretería y Materiales',
    businessRfc = 'XAXX010101000',
    businessAddress = 'Av. Principal #100, Col. Centro',
    businessPhone = '800-555-3377',
    businessEmail = 'contacto@ferrepoint.com',
    items = [],
    subtotal,
    iva,
    total,
    ticketType = 'completo',
    paperFormat = 'carta',
  } = params;

  const totalEnLetras = numeroALetras(total);

  if (paperFormat === 'carta') {
    return generateLetterInvoiceHTML({
      title,
      subtitle,
      folio,
      dateStr,
      clientName,
      clientPhone,
      clientAddress,
      paymentMethod,
      vendorName,
      businessName,
      businessRfc,
      businessAddress,
      businessPhone,
      businessEmail,
      items,
      subtotal,
      iva,
      total,
      totalEnLetras,
      ticketType,
    });
  }

  // Thermal Ticket Layout (80mm / 58mm)
  const itemsHTML = ticketType === 'completo'
    ? items.map(item => `
      <tr>
        <td class="col-desc">
          <div class="item-name">${item.name}</div>
          <div class="item-sub">${item.clave ? '[' + item.clave + '] ' : ''}${item.qty} × $${item.price.toFixed(2)}</div>
        </td>
        <td class="col-price">$${item.subtotal.toFixed(2)}</td>
      </tr>
    `).join('')
    : `
      <tr>
        <td class="col-desc">
          <div class="item-name">Resumen de venta</div>
          <div class="item-sub">${items.reduce((acc, i) => acc + i.qty, 0)} artículos</div>
        </td>
        <td class="col-price">$${subtotal.toFixed(2)}</td>
      </tr>
    `;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Ticket #${folio}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: 80mm auto; margin: 0mm; }
    html, body {
      background: #ffffff;
      color: #000000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body { width: 100%; background: #ffffff; }
    .ticket-wrapper {
      width: 240px;
      max-width: 240px;
      margin: 0 auto;
      padding: 10px 8px 14px 8px;
    }
    .brand-header {
      text-align: center;
      padding-bottom: 6px;
      border-bottom: 2px solid #000000;
      margin-bottom: 8px;
    }
    .brand-title {
      font-size: 16px;
      font-weight: 900;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    .brand-subtitle {
      font-size: 9.5px;
      font-weight: 700;
      color: #333333;
      text-transform: uppercase;
      margin-top: 2px;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
      margin-bottom: 6px;
    }
    .meta-table td { padding: 2px 0; }
    .meta-label { font-weight: 700; color: #333333; }
    .meta-value { text-align: right; font-weight: 600; }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
      table-layout: fixed;
    }
    .items-table th {
      text-align: left;
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      border-bottom: 1px solid #000000;
      padding-bottom: 4px;
    }
    .items-table th.th-price { text-align: right; padding-right: 2px; }
    .items-table td { padding: 5px 0; vertical-align: top; border-bottom: 1px solid #eeeeee; }
    .col-desc { width: 62%; padding-right: 4px; }
    .col-price {
      width: 38%;
      text-align: right;
      font-weight: 700;
      font-family: "Consolas", "Courier New", monospace;
      font-size: 11px;
      white-space: nowrap;
      padding-right: 2px;
    }
    .item-name { font-weight: 700; font-size: 11px; line-height: 1.25; word-break: break-word; }
    .item-sub { font-size: 9.5px; color: #555555; margin-top: 1px; }
    .totals-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 6px; }
    .totals-table td { padding: 3px 0; }
    .total-main td {
      font-size: 13.5px;
      font-weight: 900;
      border-top: 2px solid #000000;
      border-bottom: 2px solid #000000;
      padding: 6px 0 !important;
    }
    .footer-text {
      text-align: center;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      margin-top: 10px;
      padding-top: 6px;
    }
    @media print {
      html, body { width: 100% !important; margin: 0 !important; padding: 0 !important; }
      .ticket-wrapper { width: 240px !important; max-width: 240px !important; margin: 0 auto !important; padding: 4px 6px 12px 6px !important; }
    }
  </style>
</head>
<body>
  <div class="ticket-wrapper">
    <div class="brand-header">
      <div class="brand-title">${businessName}</div>
      <div class="brand-subtitle">${subtitle} (${ticketType.toUpperCase()})</div>
    </div>
    <table class="meta-table">
      <tr><td class="meta-label">Folio:</td><td class="meta-value">#${folio}</td></tr>
      <tr><td class="meta-label">Fecha:</td><td class="meta-value">${dateStr}</td></tr>
      <tr><td class="meta-label">Cliente:</td><td class="meta-value">${clientName}</td></tr>
      <tr><td class="meta-label">Atendido por:</td><td class="meta-value">${vendorName}</td></tr>
      <tr><td class="meta-label">Pago:</td><td class="meta-value">${paymentMethod}</td></tr>
    </table>
    <table class="items-table">
      <thead>
        <tr><th>Cant. / Descripción</th><th class="th-price">Importe</th></tr>
      </thead>
      <tbody>${itemsHTML}</tbody>
    </table>
    <table class="totals-table">
      <tr><td class="meta-label">Subtotal:</td><td class="col-price">$${subtotal.toFixed(2)}</td></tr>
      <tr><td class="meta-label">IVA (16%):</td><td class="col-price">$${iva.toFixed(2)}</td></tr>
      <tr class="total-main"><td class="meta-label">TOTAL:</td><td class="col-price">$${total.toFixed(2)}</td></tr>
    </table>
    <div class="footer-text">¡Gracias por su compra!</div>
  </div>
  <script>
    window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 600); };
  </script>
</body>
</html>`;
}

function generateLetterInvoiceHTML(data: {
  title: string;
  subtitle: string;
  folio: string;
  dateStr: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  paymentMethod: string;
  vendorName: string;
  businessName: string;
  businessRfc: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  items: TicketItem[];
  subtotal: number;
  iva: number;
  total: number;
  totalEnLetras: string;
  ticketType: string;
}): string {
  const itemsRows = data.items.map((item, idx) => `
    <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 12px; color: #475569;">
        ${item.clave || `PROD-${idx + 1}`}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #1e293b;">
        ${item.name}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 700; color: #0f172a;">
        ${item.qty}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace; font-size: 13px;">
        $${item.price.toFixed(2)}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace; font-size: 13px; font-weight: 700; color: #e8632c;">
        $${item.subtotal.toFixed(2)}
      </td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Comprobante de Venta #${data.folio}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: letter; margin: 12mm; }
    body {
      background-color: #ffffff;
      color: #1e293b;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .document-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 24px;
      background: #ffffff;
    }
    .header-grid {
      display: grid;
      grid-template-columns: 1fr 240px;
      gap: 20px;
      border-bottom: 3px solid #e8632c;
      padding-bottom: 18px;
      margin-bottom: 20px;
    }
    .company-name {
      font-size: 22px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.5px;
      text-transform: uppercase;
    }
    .company-details {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
      line-height: 1.4;
    }
    .invoice-card {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px 16px;
      text-align: right;
    }
    .invoice-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #64748b;
    }
    .invoice-folio {
      font-size: 24px;
      font-weight: 900;
      color: #e8632c;
      margin: 2px 0;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      background: #f1f5f9;
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 24px;
      font-size: 12.5px;
    }
    .info-block label {
      display: block;
      font-size: 10.5px;
      font-weight: 800;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 2px;
    }
    .info-block span {
      font-weight: 600;
      color: #0f172a;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 13px;
    }
    .items-table th {
      background: #0f172a;
      color: #ffffff;
      padding: 10px 12px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .totals-container {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 20px;
      align-items: start;
    }
    .words-box {
      background: #fafafa;
      border: 1px dashed #cbd5e1;
      border-radius: 6px;
      padding: 12px;
      font-size: 11.5px;
    }
    .totals-card {
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px;
      font-size: 13px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .total-grand {
      display: flex;
      justify-content: space-between;
      border-top: 2px solid #0f172a;
      padding-top: 8px;
      margin-top: 8px;
      font-size: 18px;
      font-weight: 900;
      color: #e8632c;
    }
    .footer-note {
      margin-top: 32px;
      padding-top: 14px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
    }
    @media print {
      body { background: #ffffff !important; }
      .document-container { padding: 0 !important; max-width: 100% !important; }
    }
  </style>
</head>
<body>
  <div class="document-container">
    <div class="header-grid">
      <div>
        <div class="company-name">${data.businessName}</div>
        <div class="company-details">
          <strong>RFC:</strong> ${data.businessRfc}<br />
          <strong>Dirección:</strong> ${data.businessAddress}<br />
          <strong>Tel:</strong> ${data.businessPhone} | <strong>Email:</strong> ${data.businessEmail}
        </div>
      </div>
      <div class="invoice-card">
        <div class="invoice-title">Nota de Venta</div>
        <div class="invoice-folio">#${data.folio}</div>
        <div style="font-size: 11px; color: #64748b;">${data.dateStr}</div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-block">
        <label>Cliente:</label>
        <span>${data.clientName}</span>
        ${data.clientPhone ? `<br /><small style="color:#64748b;">Tel: ${data.clientPhone}</small>` : ''}
        ${data.clientAddress ? `<br /><small style="color:#64748b;">Entrega: ${data.clientAddress}</small>` : ''}
      </div>
      <div class="info-block" style="text-align: right;">
        <label>Forma de Pago:</label>
        <span style="text-transform: uppercase; color: #e8632c;">${data.paymentMethod}</span>
        <br />
        <label style="margin-top: 6px;">Atendido Por:</label>
        <span>${data.vendorName}</span>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th style="text-align: left; width: 14%;">Código</th>
          <th style="text-align: left;">Descripción de Producto</th>
          <th style="text-align: center; width: 12%;">Cant.</th>
          <th style="text-align: right; width: 16%;">P. Unitario</th>
          <th style="text-align: right; width: 18%;">Importe</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <div class="totals-container">
      <div class="words-box">
        <strong style="color: #475569; display: block; margin-bottom: 2px;">IMPORTE EN LETRA:</strong>
        <span style="font-weight: 700; color: #0f172a;">${data.totalEnLetras}</span>
        <p style="margin-top: 10px; font-size: 10.5px; color: #94a3b8;">
          Este comprobante es un recibo de compra en mostrador. Conservar para cualquier aclaración o devolución.
        </p>
      </div>

      <div class="totals-card">
        <div class="totals-row">
          <span style="color: #64748b;">Subtotal:</span>
          <span style="font-family: monospace; font-weight: 700;">$${data.subtotal.toFixed(2)}</span>
        </div>
        <div class="totals-row">
          <span style="color: #64748b;">IVA (16%):</span>
          <span style="font-family: monospace; font-weight: 700;">$${data.iva.toFixed(2)}</span>
        </div>
        <div class="total-grand">
          <span>TOTAL:</span>
          <span style="font-family: monospace;">$${data.total.toFixed(2)}</span>
        </div>
      </div>
    </div>

    <div class="footer-note">
      ¡Gracias por tu preferencia! — FERREPOINT Software para Ferreterías
    </div>
  </div>
  <script>
    window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 600); };
  </script>
</body>
</html>`;
}
