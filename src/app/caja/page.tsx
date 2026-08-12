'use client';

import { useState, useEffect, useCallback } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LogoutButton } from '@/components/LogoutButton';
import { DashboardButton } from '@/components/DashboardButton';
import { generateTicketHTML } from '@/lib/ticketPrinter';
import { TicketPreviewModal } from '@/components/TicketPreviewModal';
import { actionGetPendingOrders, actionProcessPayment, actionGetPaidOrders } from '@/features/pos/server';
import { PendingOrder, Sale } from '@/types';
import { useRealtimeEvents } from '@/hooks/useRealtimeEvents';

import { UserProfileBadge } from '@/components/UserProfileBadge';

export default function CajaPage() {
  const [activeTab, setActiveTab] = useState<'pendientes' | 'historial'>('pendientes');
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [paidOrders, setPaidOrders] = useState<Sale[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null);
  const [selectedPaidOrder, setSelectedPaidOrder] = useState<Sale | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('efectivo');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [businessId, setBusinessId] = useState('');
  const [cajeroId, setCajeroId] = useState('');
  const [previewTicketData, setPreviewTicketData] = useState<{
    isOpen: boolean;
    folio: string;
    clientName: string;
    paymentMethod: string;
    dateStr?: string;
    items: { name: string; qty: number; price: number; subtotal: number }[];
    subtotal: number;
    iva: number;
    total: number;
    ticketType: 'completo' | 'resumido';
    whatsAppUrl: string;
    saleObj: any;
  } | null>(null);

  // Show toast notification
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Refresh both pending and paid orders
  const loadAllOrders = useCallback(async (bizId: string) => {
    if (!bizId) return;
    try {
      setLoading(true);
      const [pendingRes, paidRes] = await Promise.all([
        actionGetPendingOrders(bizId),
        actionGetPaidOrders(bizId)
      ]);
      setOrders(Array.isArray(pendingRes) ? (pendingRes as PendingOrder[]) : []);
      setPaidOrders(Array.isArray(paidRes) ? (paidRes as unknown as Sale[]) : []);
    } catch (error) {
      console.error('Error loading orders in Caja:', error);
      showToast('Error al actualizar órdenes de caja', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Listen to real-time events
  useRealtimeEvents(businessId, useCallback((event) => {
    if (event.type === 'ORDER_CREATED') {
      showToast(`📥 Nueva orden enviada a caja: Folio #${event.data.folio}`, 'success');
      loadAllOrders(businessId);
    } else if (event.type === 'ORDER_PAID') {
      loadAllOrders(businessId);
    }
  }, [businessId, showToast, loadAllOrders]));

  // Load user data on mount
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCajeroId(user.id || '');
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }

    const biz = localStorage.getItem('businessId');
    if (biz) {
      setBusinessId(biz);
      loadAllOrders(biz);
    }
  }, [loadAllOrders]);

  // Handle payment processing
  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOrder) {
      showToast('Selecciona una orden para cobrar', 'error');
      return;
    }

    try {
      setProcessing(true);
      const result = await actionProcessPayment(
        selectedOrder.id,
        paymentMethod as "efectivo" | "transferencia" | "tarjeta",
        cajeroId
      );

      if (result.success) {
        showToast(`✓ Pago procesado con éxito. Folio: #${selectedOrder.folio}`, 'success');
        
        // Auto-print ticket if desired
        handlePrintTicket(selectedOrder, paymentMethod);

        setSelectedOrder(null);
        setPaymentMethod('efectivo');
        await loadAllOrders(businessId);
      } else {
        showToast((result as any).error || 'Error al procesar pago', 'error');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      showToast('Error al procesar pago', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Ticket printer helper
  const handlePrintTicket = (saleObj: any, methodUsed?: string) => {
    const printWin = window.open('', '_blank', 'width=380,height=600');
    if (!printWin) return;

    const dateStr = new Date(saleObj.createdAt || Date.now()).toLocaleString('es-MX', {
      dateStyle: 'short',
      timeStyle: 'medium',
    });

    const items = saleObj.items || [];
    const pMethod = (methodUsed || saleObj.paymentMethod || 'EFECTIVO').toUpperCase();

    const htmlContent = generateTicketHTML({
      title: 'FERREPOINT',
      subtitle: 'Comprobante de Caja',
      folio: saleObj.folio || 'N/A',
      dateStr,
      clientName: saleObj.clientName || 'Cliente Mostrador',
      paymentMethod: pMethod,
      items: items.map((i: any) => ({
        name: i.product?.name || i.name || 'Producto',
        qty: i.qty || 1,
        price: i.price || 0,
        subtotal: i.subtotal || 0,
      })),
      subtotal: saleObj.subtotal || 0,
      iva: saleObj.iva || 0,
      total: saleObj.total || 0,
      ticketType: 'completo'
    });

    printWin.document.write(htmlContent);
    printWin.document.close();
  };

  // Helper for WhatsApp link
  const getWhatsAppUrl = (saleObj: any) => {
    let cleanPhone = (saleObj.clientPhone || '').replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = '52' + cleanPhone;
    const formattedItems = (saleObj.items || []).map((i: any) => `• ${i.qty}x ${i.product?.name || i.name} ($${i.subtotal.toFixed(2)})`).join('\n');
    const msg = `*FERREPOINT* - Comprobante de Cobro \n\n` +
      `*Folio:* #${saleObj.folio}\n` +
      `*Cliente:* ${saleObj.clientName || 'Cliente Mostrador'}\n` +
      `*Método de Pago:* ${(saleObj.paymentMethod || 'Efectivo').toUpperCase()}\n\n` +
      `*Productos:*\n${formattedItems}\n\n` +
      `*Total:* $${(saleObj.total || 0).toFixed(2)}\n\n` +
      `¡Gracias por tu pago!`;
    const encoded = encodeURIComponent(msg);
    return cleanPhone ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}` : `https://api.whatsapp.com/send?text=${encoded}`;
  };

  // KPIs Calculations
  const totalCobrado = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const totalEfectivo = paidOrders.filter(o => o.paymentMethod === 'efectivo').reduce((sum, o) => sum + o.total, 0);
  const totalTarjeta = paidOrders.filter(o => o.paymentMethod === 'tarjeta').reduce((sum, o) => sum + o.total, 0);
  const totalTransferencia = paidOrders.filter(o => o.paymentMethod === 'transferencia').reduce((sum, o) => sum + o.total, 0);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Header */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.5rem',
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>
            💵 Caja & Cobros
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
            Recepción de pagos y control de cortes en tiempo real
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <UserProfileBadge />
          <DashboardButton />
          <ThemeToggle />
          <LogoutButton />
        </div>
      </header>

      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '1rem',
            right: '1rem',
            padding: '1rem 1.5rem',
            backgroundColor: toast.type === 'success' ? 'var(--accent-green, #10b981)' : 'var(--accent-red, #ef4444)',
            color: 'white',
            borderRadius: '0.5rem',
            zIndex: 100,
            fontSize: '0.875rem',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Main Layout Container */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        
        {/* KPI Metrics Summary Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}
        >
          <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 0.25rem 0', fontWeight: '600', textTransform: 'uppercase' }}>
              Total Cobrado Hoy
            </p>
            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent-orange, #e8632c)', margin: 0 }}>
              ${totalCobrado.toFixed(2)}
            </p>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{paidOrders.length} venta(s) registradas</span>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 0.25rem 0', fontWeight: '600', textTransform: 'uppercase' }}>
              💵 Efectivo
            </p>
            <p style={{ fontSize: '1.35rem', fontWeight: '700', margin: 0 }}>
              ${totalEfectivo.toFixed(2)}
            </p>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 0.25rem 0', fontWeight: '600', textTransform: 'uppercase' }}>
              💳 Tarjeta
            </p>
            <p style={{ fontSize: '1.35rem', fontWeight: '700', margin: 0 }}>
              ${totalTarjeta.toFixed(2)}
            </p>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 0.25rem 0', fontWeight: '600', textTransform: 'uppercase' }}>
              🏛️ Transferencia
            </p>
            <p style={{ fontSize: '1.35rem', fontWeight: '700', margin: 0 }}>
              ${totalTransferencia.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setActiveTab('pendientes')}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: activeTab === 'pendientes' ? 'var(--accent-orange, #e8632c)' : 'var(--bg-secondary)',
              color: activeTab === 'pendientes' ? '#fff' : 'var(--text-primary)',
              fontWeight: '700',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            ⏳ Órdenes Pendientes ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('historial')}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: activeTab === 'historial' ? 'var(--accent-orange, #e8632c)' : 'var(--bg-secondary)',
              color: activeTab === 'historial' ? '#fff' : 'var(--text-primary)',
              fontWeight: '700',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📋 Cobros del Día ({paidOrders.length})
          </button>
        </div>

        {/* TAB 1: PENDING ORDERS */}
        {activeTab === 'pendientes' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            
            {/* Left Column: List of Pending Orders */}
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', marginTop: 0 }}>
                Pendientes de Cobro
              </h2>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  Cargando órdenes pendientes...
                </div>
              ) : orders.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '3rem 1.5rem',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '0.75rem',
                    border: '1px dashed var(--border-color)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <p style={{ fontSize: '1.1rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>✓ Sin órdenes pendientes</p>
                  <span style={{ fontSize: '0.85rem' }}>Todas las ventas han sido cobradas o procesadas.</span>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '0.75rem', maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
                  {orders.map((order) => (
                    <button
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      style={{
                        padding: '1rem',
                        backgroundColor: selectedOrder?.id === order.id ? 'var(--accent-orange, #e8632c)' : 'var(--bg-secondary)',
                        border: selectedOrder?.id === order.id ? '2px solid var(--accent-orange, #e8632c)' : '1px solid var(--border-color)',
                        borderRadius: '0.75rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s',
                        color: selectedOrder?.id === order.id ? '#ffffff' : 'var(--text-primary)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <p style={{ margin: '0 0 0.25rem 0', fontWeight: '700', fontSize: '1rem' }}>
                            Folio #{order.folio || 'N/A'} — {order.clientName || 'Cliente Mostrador'}
                          </p>
                          <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', opacity: 0.9 }}>
                            {order.items.length} artículo(s)
                          </p>
                          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', opacity: 0.75 }}>
                            {new Date(order.createdAt).toLocaleTimeString('es-MX')}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right', fontWeight: '700', fontSize: '1.1rem' }}>
                          ${order.total.toFixed(2)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Order Details & Payment Form */}
            <div>
              {selectedOrder ? (
                <div
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '0.75rem',
                    border: '1px solid var(--border-color)',
                    padding: '1.5rem',
                  }}
                >
                  <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginTop: 0, marginBottom: '1rem' }}>
                    Cobrar Orden #{selectedOrder.folio || 'N/A'}
                  </h2>

                  {/* Client Info */}
                  <div style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>
                      Cliente
                    </p>
                    <p style={{ margin: 0, fontWeight: '700', fontSize: '1rem' }}>
                      {selectedOrder.clientName || 'Cliente Mostrador'}
                    </p>
                    {selectedOrder.clientPhone && (
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        📞 {selectedOrder.clientPhone}
                      </p>
                    )}
                  </div>

                  {/* Items List */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: '0 0 0.5rem 0' }}>
                      Detalle de Productos ({selectedOrder.items.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                      {selectedOrder.items.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '0.6rem 0.75rem',
                            backgroundColor: 'var(--bg-primary)',
                            borderRadius: '0.375rem',
                            fontSize: '0.85rem',
                          }}
                        >
                          <div>
                            <p style={{ margin: '0 0 0.2rem 0', fontWeight: '600' }}>{item.product?.name || 'Producto'}</p>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{item.qty} x ${item.price.toFixed(2)}</span>
                          </div>
                          <div style={{ fontWeight: '700', color: 'var(--accent-orange, #e8632c)' }}>
                            ${item.subtotal.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals */}
                  <div style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
                      <span>${selectedOrder.subtotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>IVA (16%):</span>
                      <span>${selectedOrder.iva.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: '800', color: 'var(--accent-orange, #e8632c)' }}>
                      <span>Total a Cobrar:</span>
                      <span>${selectedOrder.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Payment Form */}
                  <form onSubmit={handleProcessPayment}>
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                        Seleccionar Método de Pago
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                        {[
                          { id: 'efectivo', label: '💵 Efectivo' },
                          { id: 'tarjeta', label: '💳 Tarjeta' },
                          { id: 'transferencia', label: '🏛️ Transfer' }
                        ].map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setPaymentMethod(m.id)}
                            style={{
                              padding: '0.65rem 0.4rem',
                              borderRadius: '0.5rem',
                              border: paymentMethod === m.id ? '2px solid var(--accent-orange, #e8632c)' : '1px solid var(--border-color)',
                              background: paymentMethod === m.id ? 'var(--nal, #FFF0E6)' : 'var(--bg-primary)',
                              color: paymentMethod === m.id ? 'var(--accent-orange, #e8632c)' : 'var(--text-primary)',
                              fontWeight: '700',
                              fontSize: '0.82rem',
                              cursor: 'pointer'
                            }}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={processing}
                      style={{
                        width: '100%',
                        padding: '0.85rem',
                        backgroundColor: processing ? 'var(--text-secondary)' : 'var(--accent-orange, #e8632c)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontWeight: '700',
                        fontSize: '1rem',
                        cursor: processing ? 'not-allowed' : 'pointer',
                        opacity: processing ? 0.6 : 1,
                      }}
                    >
                      {processing ? 'Procesando Pago...' : `PROCESAR PAGO DE $${selectedOrder.total.toFixed(2)}`}
                    </button>
                  </form>
                </div>
              ) : (
                <div
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '0.75rem',
                    border: '1px dashed var(--border-color)',
                    padding: '4rem 1.5rem',
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    minHeight: '350px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <p style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>👈 Selecciona una orden pendiente</p>
                  <span style={{ fontSize: '0.85rem' }}>Para revisar sus artículos y procesar el cobro</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: HISTORIAL COBROS DEL DÍA */}
        {activeTab === 'historial' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            
            {/* Left Column: Paid Sales List */}
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', marginTop: 0 }}>
                Historial de Ventas Cobradas Hoy ({paidOrders.length})
              </h2>

              {paidOrders.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '3rem 1.5rem',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '0.75rem',
                    border: '1px dashed var(--border-color)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  No se han registrado cobros el día de hoy.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '0.75rem', maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
                  {paidOrders.map((sale) => (
                    <button
                      key={sale.id}
                      onClick={() => setSelectedPaidOrder(sale)}
                      style={{
                        padding: '1rem',
                        backgroundColor: selectedPaidOrder?.id === sale.id ? 'var(--accent-orange, #e8632c)' : 'var(--bg-secondary)',
                        border: selectedPaidOrder?.id === sale.id ? '2px solid var(--accent-orange, #e8632c)' : '1px solid var(--border-color)',
                        borderRadius: '0.75rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s',
                        color: selectedPaidOrder?.id === sale.id ? '#ffffff' : 'var(--text-primary)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: '700', fontSize: '1rem' }}>Folio #{sale.folio || 'N/A'}</span>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: 'rgba(16,185,129,0.2)',
                                color: '#10b981',
                                fontWeight: '700',
                                textTransform: 'uppercase'
                              }}
                            >
                              {sale.paymentMethod || 'PAGADO'}
                            </span>
                          </div>
                          <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', opacity: 0.9 }}>
                            {sale.clientName || 'Cliente Mostrador'}
                          </p>
                          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', opacity: 0.75 }}>
                            {new Date(sale.createdAt).toLocaleTimeString('es-MX')}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right', fontWeight: '700', fontSize: '1.1rem' }}>
                          ${sale.total.toFixed(2)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Selected Paid Order Detail & Reprint */}
            <div>
              {selectedPaidOrder ? (
                <div
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '0.75rem',
                    border: '1px solid var(--border-color)',
                    padding: '1.5rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>
                      Venta Pagada #{selectedPaidOrder.folio || 'N/A'}
                    </h2>
                    <span style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: '6px', background: '#10b981', color: '#fff', fontWeight: '700' }}>
                      COBRADA
                    </span>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem' }}>Cliente:</span>
                        <strong>{selectedPaidOrder.clientName || 'Cliente Mostrador'}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem' }}>Método Pago:</span>
                        <strong style={{ textTransform: 'uppercase' }}>{selectedPaidOrder.paymentMethod || 'Efectivo'}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem' }}>Fecha/Hora:</span>
                        <span>{new Date(selectedPaidOrder.createdAt).toLocaleString('es-MX')}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem' }}>Tipo Comprobante:</span>
                        <span style={{ textTransform: 'capitalize' }}>{selectedPaidOrder.comprobante || 'Completo'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: '0 0 0.5rem 0' }}>
                      Artículos Vendidos ({(selectedPaidOrder.items || []).length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                      {(selectedPaidOrder.items || []).map((item: any, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '0.6rem 0.75rem',
                            backgroundColor: 'var(--bg-primary)',
                            borderRadius: '0.375rem',
                            fontSize: '0.85rem',
                          }}
                        >
                          <div>
                            <p style={{ margin: '0 0 0.2rem 0', fontWeight: '600' }}>{item.product?.name || item.name || 'Producto'}</p>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{item.qty} x ${item.price.toFixed(2)}</span>
                          </div>
                          <div style={{ fontWeight: '700', color: 'var(--accent-orange, #e8632c)' }}>
                            ${item.subtotal.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals */}
                  <div style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
                      <span>${selectedPaidOrder.subtotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>IVA (16%):</span>
                      <span>${selectedPaidOrder.iva.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: '800', color: 'var(--accent-orange, #e8632c)' }}>
                      <span>Total Pagado:</span>
                      <span>${selectedPaidOrder.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setPreviewTicketData({
                        isOpen: true,
                        folio: selectedPaidOrder.folio || 'N/A',
                        clientName: selectedPaidOrder.clientName || 'Cliente Mostrador',
                        paymentMethod: selectedPaidOrder.paymentMethod || 'EFECTIVO',
                        dateStr: new Date(selectedPaidOrder.createdAt).toLocaleString('es-MX'),
                        items: (selectedPaidOrder.items || []).map((i: any) => ({
                          name: i.product?.name || i.name || 'Producto',
                          qty: i.qty || 1,
                          price: i.price || 0,
                          subtotal: i.subtotal || 0,
                        })),
                        subtotal: selectedPaidOrder.subtotal || 0,
                        iva: selectedPaidOrder.iva || 0,
                        total: selectedPaidOrder.total || 0,
                        ticketType: 'completo',
                        whatsAppUrl: getWhatsAppUrl(selectedPaidOrder),
                        saleObj: selectedPaidOrder
                      })}
                      style={{
                        flex: 1,
                        minWidth: '140px',
                        padding: '0.75rem',
                        backgroundColor: 'var(--accent-orange, #e8632c)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      🔍 VER PREVISUALIZACIÓN
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePrintTicket(selectedPaidOrder)}
                      style={{
                        flex: 1,
                        minWidth: '140px',
                        padding: '0.75rem',
                        backgroundColor: '#1A5FA8',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      🖨️ IMPRIMIR
                    </button>
                    <a
                      href={getWhatsAppUrl(selectedPaidOrder)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1,
                        minWidth: '140px',
                        padding: '0.75rem',
                        backgroundColor: '#25D366',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      💬 WHATSAPP
                    </a>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '0.75rem',
                    border: '1px dashed var(--border-color)',
                    padding: '4rem 1.5rem',
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    minHeight: '350px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <p style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>👈 Selecciona una orden cobrada</p>
                  <span style={{ fontSize: '0.85rem' }}>Para re-imprimir su ticket o consultar sus detalles</span>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {previewTicketData && (
        <TicketPreviewModal
          isOpen={previewTicketData.isOpen}
          onClose={() => setPreviewTicketData(null)}
          folio={previewTicketData.folio}
          clientName={previewTicketData.clientName}
          paymentMethod={previewTicketData.paymentMethod}
          dateStr={previewTicketData.dateStr}
          items={previewTicketData.items}
          subtotal={previewTicketData.subtotal}
          iva={previewTicketData.iva}
          total={previewTicketData.total}
          ticketType={previewTicketData.ticketType}
          whatsAppUrl={previewTicketData.whatsAppUrl}
          onPrint={() => {
            handlePrintTicket(previewTicketData.saleObj);
          }}
        />
      )}
    </div>
  );
}
