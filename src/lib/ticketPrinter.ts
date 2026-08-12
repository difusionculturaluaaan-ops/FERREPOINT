export interface TicketItem {
  name: string;
  qty: number;
  price: number;
  subtotal: number;
}

export interface PrintTicketParams {
  title?: string;
  subtitle?: string;
  folio: string;
  dateStr?: string;
  clientName?: string;
  paymentMethod?: string;
  items: TicketItem[];
  subtotal: number;
  iva: number;
  total: number;
  ticketType?: 'completo' | 'resumido';
}

export function generateTicketHTML(params: PrintTicketParams): string {
  const {
    title = 'FERREPOINT',
    subtitle = 'Ticket de Venta',
    folio,
    dateStr = new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'medium' }),
    clientName = 'Cliente Mostrador',
    paymentMethod = 'EFECTIVO',
    items = [],
    subtotal,
    iva,
    total,
    ticketType = 'completo',
  } = params;

  const itemsHTML = ticketType === 'completo'
    ? items.map(item => `
      <tr>
        <td class="col-desc">
          <div class="item-name">${item.name}</div>
          <div class="item-sub">${item.qty} × $${item.price.toFixed(2)}</div>
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
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    @page {
      size: 80mm auto;
      margin: 0mm;
    }
    html, body {
      background: #ffffff;
      color: #000000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      width: 100%;
      background: #ffffff;
    }
    .ticket-wrapper {
      width: 240px;
      max-width: 240px;
      margin: 0 auto;
      padding: 10px 8px 14px 8px;
      box-sizing: border-box;
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
      margin-bottom: 2px;
    }
    .brand-subtitle {
      font-size: 9.5px;
      font-weight: 700;
      color: #333333;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
      margin-bottom: 6px;
    }
    .meta-table td {
      padding: 2px 0;
    }
    .meta-label {
      font-weight: 700;
      color: #333333;
    }
    .meta-value {
      text-align: right;
      font-weight: 600;
    }
    .divider-solid {
      border-top: 1px solid #000000;
      margin: 6px 0;
    }
    .divider-dashed {
      border-top: 1px dashed #666666;
      margin: 6px 0;
    }
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
    .items-table th.th-price {
      text-align: right;
      padding-right: 2px;
    }
    .items-table td {
      padding: 5px 0;
      vertical-align: top;
      border-bottom: 1px solid #eeeeee;
    }
    .col-desc {
      width: 62%;
      padding-right: 4px;
    }
    .col-price {
      width: 38%;
      text-align: right;
      font-weight: 700;
      font-family: "Consolas", "Courier New", monospace;
      font-size: 11px;
      white-space: nowrap;
      padding-right: 2px;
    }
    .item-name {
      font-weight: 700;
      font-size: 11px;
      line-height: 1.25;
      word-break: break-word;
    }
    .item-sub {
      font-size: 9.5px;
      color: #555555;
      margin-top: 1px;
    }
    .totals-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-top: 6px;
    }
    .totals-table td {
      padding: 3px 0;
    }
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
      letter-spacing: 0.5px;
      margin-top: 10px;
      padding-top: 6px;
    }
    @media print {
      html, body {
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .ticket-wrapper {
        width: 240px !important;
        max-width: 240px !important;
        margin: 0 auto !important;
        padding: 4px 6px 12px 6px !important;
      }
    }
  </style>
</head>
<body>
  <div class="ticket-wrapper">
    <div class="brand-header">
      <div class="brand-title">${title}</div>
      <div class="brand-subtitle">${subtitle} (${ticketType.toUpperCase()})</div>
    </div>

    <table class="meta-table">
      <tr>
        <td class="meta-label">Folio:</td>
        <td class="meta-value">#${folio}</td>
      </tr>
      <tr>
        <td class="meta-label">Fecha:</td>
        <td class="meta-value">${dateStr}</td>
      </tr>
      <tr>
        <td class="meta-label">Cliente:</td>
        <td class="meta-value">${clientName}</td>
      </tr>
      <tr>
        <td class="meta-label">Pago:</td>
        <td class="meta-value">${paymentMethod}</td>
      </tr>
    </table>

    <table class="items-table">
      <thead>
        <tr>
          <th>Cant. / Descripción</th>
          <th class="th-price">Importe</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHTML}
      </tbody>
    </table>

    <table class="totals-table">
      <tr>
        <td class="meta-label">Subtotal:</td>
        <td class="col-price">$${subtotal.toFixed(2)}</td>
      </tr>
      <tr>
        <td class="meta-label">IVA (16%):</td>
        <td class="col-price">$${iva.toFixed(2)}</td>
      </tr>
      <tr class="total-main">
        <td class="meta-label">TOTAL:</td>
        <td class="col-price">$${total.toFixed(2)}</td>
      </tr>
    </table>

    <div class="footer-text">
      ¡Gracias por su compra!
    </div>
  </div>
  <script>
    window.onload = function() {
      window.print();
      setTimeout(function() { window.close(); }, 600);
    };
  </script>
</body>
</html>`;
}
