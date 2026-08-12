'use client';

import React, { useState } from 'react';

export interface TicketPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  folio: string;
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
  dateStr?: string;
  items: { name: string; qty: number; price: number; subtotal: number; clave?: string }[];
  subtotal: number;
  iva: number;
  total: number;
  ticketType?: 'completo' | 'resumido';
  whatsAppUrl?: string;
  onPrint?: (format: 'carta' | 'ticket') => void;
}

export function TicketPreviewModal({
  isOpen,
  onClose,
  folio,
  clientName = 'Cliente Mostrador',
  clientPhone = '',
  clientAddress = '',
  paymentMethod = 'EFECTIVO',
  vendorName = 'Vendedor General',
  businessName = 'DEMOFerretodo - Ferretería',
  businessRfc = 'DFE240101XYZ',
  businessAddress = 'Av. Ferretera #500, Col. Industrial',
  businessPhone = '818-555-9000',
  businessEmail = 'contacto@demoferretodo.com',
  dateStr,
  items,
  subtotal,
  iva,
  total,
  ticketType = 'completo',
  whatsAppUrl,
  onPrint,
}: TicketPreviewModalProps) {
  const [format, setFormat] = useState<'carta' | 'ticket'>('carta');

  if (!isOpen) return null;

  const formattedDate = dateStr || new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'medium' });

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg-secondary, #1f2937)',
          border: '1px solid var(--border-color, #374151)',
          borderRadius: '1rem',
          maxWidth: format === 'carta' ? '860px' : '520px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
          transition: 'max-width 0.3s ease-in-out',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid var(--border-color, #374151)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--bg-primary, #111827)',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: 'var(--text-primary, #fff)' }}>
              📄 Previsualización de Comprobante
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #9ca3af)' }}>
              Folio #{folio} • {businessName}
            </span>
          </div>

          {/* Format Selector Toggle */}
          <div style={{ display: 'flex', gap: '4px', background: '#374151', padding: '3px', borderRadius: '8px' }}>
            <button
              onClick={() => setFormat('carta')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                fontWeight: '700',
                fontSize: '0.8rem',
                cursor: 'pointer',
                backgroundColor: format === 'carta' ? 'var(--accent-orange, #e8632c)' : 'transparent',
                color: '#ffffff',
                transition: 'all 0.2s',
              }}
            >
              📄 Nota Carta (Completo)
            </button>
            <button
              onClick={() => setFormat('ticket')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                fontWeight: '700',
                fontSize: '0.8rem',
                cursor: 'pointer',
                backgroundColor: format === 'ticket' ? 'var(--accent-orange, #e8632c)' : 'transparent',
                color: '#ffffff',
                transition: 'all 0.2s',
              }}
            >
              🧾 Ticket Térmico (80mm)
            </button>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.4rem',
              color: 'var(--text-secondary, #9ca3af)',
              cursor: 'pointer',
              padding: '0.25rem',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body: Document Preview */}
        <div
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            backgroundColor: '#0f172a',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            flex: 1,
          }}
        >
          {format === 'carta' ? (
            /* Executive Letter Preview Card */
            <div
              style={{
                width: '100%',
                maxWidth: '780px',
                backgroundColor: '#ffffff',
                color: '#1e293b',
                padding: '28px',
                borderRadius: '8px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                fontSize: '13px',
                lineHeight: 1.5,
              }}
            >
              {/* Executive Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '3px solid var(--accent-orange, #e8632c)',
                  paddingBottom: '16px',
                  marginBottom: '18px',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
                    {businessName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', lineHeight: '1.4' }}>
                    <strong>RFC:</strong> {businessRfc}<br />
                    <strong>Dirección:</strong> {businessAddress}<br />
                    <strong>Tel:</strong> {businessPhone} | <strong>Email:</strong> {businessEmail}
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    textAlign: 'right',
                    minWidth: '200px',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b' }}>
                    Nota de Venta
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--accent-orange, #e8632c)', margin: '2px 0' }}>
                    #{folio}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{formattedDate}</div>
                </div>
              </div>

              {/* Client & Metadata Info */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '16px',
                  backgroundColor: '#f1f5f9',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  fontSize: '12.5px',
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', marginBottom: '2px' }}>
                    DATOS DEL CLIENTE:
                  </label>
                  <span style={{ fontWeight: '700', color: '#0f172a' }}>{clientName}</span>
                  {clientPhone && <div style={{ fontSize: '11px', color: '#64748b' }}>Tel: {clientPhone}</div>}
                  {clientAddress && <div style={{ fontSize: '11px', color: '#64748b' }}>Entrega: {clientAddress}</div>}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <label style={{ display: 'block', fontSize: '10.5px', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', marginBottom: '2px' }}>
                    DETALLES DE OPERACIÓN:
                  </label>
                  <div>
                    Forma de Pago: <strong style={{ textTransform: 'uppercase', color: 'var(--accent-orange, #e8632c)' }}>{paymentMethod}</strong>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#475569' }}>Vendedor: {vendorName}</div>
                </div>
              </div>

              {/* Full Width Table of Items */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                    <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Código</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Descripción del Producto</th>
                    <th style={{ textAlign: 'center', padding: '8px 10px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', width: '10%' }}>Cant.</th>
                    <th style={{ textAlign: 'right', padding: '8px 10px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', width: '16%' }}>P. Unitario</th>
                    <th style={{ textAlign: 'right', padding: '8px 10px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', width: '18%' }}>Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', fontFamily: 'monospace', fontSize: '11.5px', color: '#475569' }}>
                        {item.clave || `PROD-${idx + 1}`}
                      </td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#1e293b' }}>
                        {item.name}
                      </td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '700', color: '#0f172a' }}>
                        {item.qty}
                      </td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontFamily: '"Consolas", monospace', fontSize: '12.5px' }}>
                        ${item.price.toFixed(2)}
                      </td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontFamily: '"Consolas", monospace', fontSize: '12.5px', fontWeight: '700', color: 'var(--accent-orange, #e8632c)' }}>
                        ${item.subtotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals & Notes Section */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', alignItems: 'start' }}>
                <div style={{ backgroundColor: '#fafafa', border: '1px dashed #cbd5e1', borderRadius: '6px', padding: '12px', fontSize: '11.5px' }}>
                  <strong style={{ color: '#475569', display: 'block', marginBottom: '2px', fontSize: '10.5px', textTransform: 'uppercase' }}>
                    IMPORTE TOTAL EN LETRA:
                  </strong>
                  <span style={{ fontWeight: '700', color: '#0f172a' }}>
                    ${total.toFixed(2)} M.N.
                  </span>
                  <p style={{ marginTop: '8px', fontSize: '10.5px', color: '#94a3b8', lineHeight: '1.3' }}>
                    Este comprobante es un recibo oficial de compra en mostrador. Conservar para cualquier garantía o aclaración.
                  </p>
                </div>

                <div style={{ backgroundColor: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px', fontSize: '12.5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#64748b' }}>Subtotal:</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: '700' }}>${subtotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#64748b' }}>IVA (16%):</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: '700' }}>${iva.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #0f172a', paddingTop: '8px', fontSize: '17px', fontWeight: '900', color: 'var(--accent-orange, #e8632c)' }}>
                    <span>TOTAL:</span>
                    <span style={{ fontFamily: 'monospace' }}>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Thermal Ticket 80mm Preview Card */
            <div
              style={{
                width: '280px',
                backgroundColor: '#ffffff',
                color: '#000000',
                padding: '16px 14px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                borderRadius: '4px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                fontSize: '11px',
                lineHeight: 1.35,
                borderTop: '4px solid var(--accent-orange, #e8632c)',
              }}
            >
              <div style={{ textAlign: 'center', paddingBottom: '6px', borderBottom: '2px solid #000', marginBottom: '8px' }}>
                <div style={{ fontSize: '16px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  {businessName}
                </div>
                <div style={{ fontSize: '9.5px', fontWeight: '700', color: '#333', textTransform: 'uppercase', marginTop: '2px' }}>
                  Ticket de Venta ({ticketType.toUpperCase()})
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px', marginBottom: '8px' }}>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: '700', color: '#333' }}>Folio:</td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>#{folio}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '700', color: '#333' }}>Fecha:</td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>{formattedDate}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '700', color: '#333' }}>Cliente:</td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>{clientName}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '700', color: '#333' }}>Atendido:</td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>{vendorName}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '700', color: '#333' }}>Pago:</td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>{paymentMethod.toUpperCase()}</td>
                  </tr>
                </tbody>
              </table>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px', tableLayout: 'fixed', marginBottom: '8px' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', borderBottom: '1px solid #000', paddingBottom: '4px' }}>
                      Cant. / Descripción
                    </th>
                    <th style={{ textAlign: 'right', fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', borderBottom: '1px solid #000', paddingBottom: '4px' }}>
                      Importe
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '4px 4px 4px 0', verticalAlign: 'top', borderBottom: '1px solid #eee', width: '62%' }}>
                        <div style={{ fontWeight: '700', fontSize: '11px', lineHeight: 1.25, wordBreak: 'break-word' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '9.5px', color: '#555', marginTop: '1px' }}>
                          {item.qty} × ${item.price.toFixed(2)}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: '4px 0',
                          verticalAlign: 'top',
                          borderBottom: '1px solid #eee',
                          width: '38%',
                          textAlign: 'right',
                          fontWeight: '700',
                          fontFamily: '"Consolas", "Courier New", monospace',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        ${item.subtotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: '700', color: '#333', padding: '2px 0' }}>Subtotal:</td>
                    <td style={{ textAlign: 'right', fontFamily: '"Consolas", monospace', fontWeight: '700' }}>
                      ${subtotal.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '700', color: '#333', padding: '2px 0' }}>IVA (16%):</td>
                    <td style={{ textAlign: 'right', fontFamily: '"Consolas", monospace', fontWeight: '700' }}>
                      ${iva.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: '13px', fontWeight: '900', borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '6px 0' }}>
                      TOTAL:
                    </td>
                    <td style={{ fontSize: '13.5px', fontWeight: '900', textAlign: 'right', fontFamily: '"Consolas", monospace', borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '6px 0' }}>
                      ${total.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ textAlign: 'center', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', marginTop: '12px', paddingTop: '6px' }}>
                ¡Gracias por su compra!
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderTop: '1px solid var(--border-color, #374151)',
            backgroundColor: 'var(--bg-primary, #111827)',
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          {onPrint && (
            <button
              onClick={() => onPrint(format)}
              style={{
                flex: 1,
                minWidth: '150px',
                padding: '0.85rem 1rem',
                backgroundColor: 'var(--accent-orange, #e8632c)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: '800',
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(232, 99, 44, 0.35)',
              }}
            >
              🖨️ {format === 'carta' ? 'Imprimir Nota Carta' : 'Imprimir Ticket 80mm'}
            </button>
          )}

          {whatsAppUrl && (
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                minWidth: '150px',
                padding: '0.85rem 1rem',
                backgroundColor: '#25D366',
                color: 'white',
                borderRadius: '0.5rem',
                fontWeight: '800',
                fontSize: '0.95rem',
                textAlign: 'center',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)',
              }}
            >
              📱 Enviar por WhatsApp
            </a>
          )}

          <button
            onClick={onClose}
            style={{
              padding: '0.85rem 1.25rem',
              backgroundColor: 'var(--bg-tertiary, #374151)',
              color: 'var(--text-primary, #fff)',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: '700',
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
