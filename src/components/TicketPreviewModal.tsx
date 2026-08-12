'use client';

import React from 'react';

export interface TicketPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  folio: string;
  clientName?: string;
  paymentMethod?: string;
  dateStr?: string;
  items: { name: string; qty: number; price: number; subtotal: number }[];
  subtotal: number;
  iva: number;
  total: number;
  ticketType?: 'completo' | 'resumido';
  whatsAppUrl?: string;
  onPrint?: () => void;
}

export function TicketPreviewModal({
  isOpen,
  onClose,
  folio,
  clientName = 'Cliente Mostrador',
  paymentMethod = 'EFECTIVO',
  dateStr,
  items,
  subtotal,
  iva,
  total,
  ticketType = 'completo',
  whatsAppUrl,
  onPrint,
}: TicketPreviewModalProps) {
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
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
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
          maxWidth: '520px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color, #374151)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--bg-primary, #111827)',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: 'var(--text-primary, #fff)' }}>
              📄 Previsualización de Ticket
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #9ca3af)' }}>
              Folio #{folio} • FERREPOINT
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              color: 'var(--text-secondary, #9ca3af)',
              cursor: 'pointer',
              padding: '0.25rem',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body: Ticket Renderer */}
        <div
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            backgroundColor: '#121212',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            flex: 1,
          }}
        >
          {/* Thermal Paper Simulation */}
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
            {/* Header */}
            <div style={{ textAlign: 'center', paddingBottom: '6px', borderBottom: '2px solid #000', marginBottom: '8px' }}>
              <div style={{ fontSize: '16px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>
                FERREPOINT
              </div>
              <div style={{ fontSize: '9.5px', fontWeight: '700', color: '#333', textTransform: 'uppercase', marginTop: '2px' }}>
                Ticket de Venta ({ticketType.toUpperCase()})
              </div>
            </div>

            {/* Meta Info */}
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
                  <td style={{ fontWeight: '700', color: '#333' }}>Pago:</td>
                  <td style={{ textAlign: 'right', fontWeight: '600' }}>{paymentMethod.toUpperCase()}</td>
                </tr>
              </tbody>
            </table>

            {/* Items Table */}
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
                {ticketType === 'completo' ? (
                  items.map((item, idx) => (
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
                  ))
                ) : (
                  <tr>
                    <td style={{ padding: '6px 4px 6px 0', verticalAlign: 'top', width: '62%' }}>
                      <div style={{ fontWeight: '700', fontSize: '11px' }}>Resumen de venta</div>
                      <div style={{ fontSize: '9.5px', color: '#555' }}>
                        {items.reduce((acc, i) => acc + i.qty, 0)} artículos
                      </div>
                    </td>
                    <td
                      style={{
                        padding: '6px 0',
                        textAlign: 'right',
                        fontWeight: '700',
                        fontFamily: '"Consolas", "Courier New", monospace',
                      }}
                    >
                      ${subtotal.toFixed(2)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Totals */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <tbody>
                <tr>
                  <td style={{ fontWeight: '700', color: '#333', padding: '2px 0' }}>Subtotal:</td>
                  <td style={{ textAlign: 'right', fontFamily: '"Consolas", "Courier New", monospace', fontWeight: '700' }}>
                    ${subtotal.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '700', color: '#333', padding: '2px 0' }}>IVA (16%):</td>
                  <td style={{ textAlign: 'right', fontFamily: '"Consolas", "Courier New", monospace', fontWeight: '700' }}>
                    ${iva.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      fontSize: '13px',
                      fontWeight: '900',
                      borderTop: '2px solid #000',
                      borderBottom: '2px solid #000',
                      padding: '6px 0',
                    }}
                  >
                    TOTAL:
                  </td>
                  <td
                    style={{
                      fontSize: '13.5px',
                      fontWeight: '900',
                      textAlign: 'right',
                      fontFamily: '"Consolas", "Courier New", monospace',
                      borderTop: '2px solid #000',
                      borderBottom: '2px solid #000',
                      padding: '6px 0',
                    }}
                  >
                    ${total.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ textAlign: 'center', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '12px', paddingTop: '6px' }}>
              ¡Gracias por su compra!
            </div>
          </div>
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
              onClick={onPrint}
              style={{
                flex: 1,
                minWidth: '140px',
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
              🖨️ Imprimir Ticket
            </button>
          )}

          {whatsAppUrl && (
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                minWidth: '140px',
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
