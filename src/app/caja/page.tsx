'use client';

import { useState, useEffect } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LogoutButton } from '@/components/LogoutButton';
import { actionGetPendingOrders, actionProcessPayment } from '@/features/pos/server';

interface PendingOrder {
  id: string;
  businessId: string;
  locationId: string;
  folio: string;
  vendorId: string;
  clientName: string;
  clientPhone?: string;
  clientAddress?: string;
  deliveryType: string;
  paymentMethod?: string;
  comprobante: string;
  subtotal: number;
  iva: number;
  total: number;
  status: string;
  createdAt: Date;
  items: {
    id: string;
    saleId: string;
    productId: string;
    qty: number;
    price: number;
    subtotal: number;
    product: {
      id: string;
      name: string;
      clave: string;
    };
  }[];
  vendor: {
    id: string;
    name: string;
    email: string;
  };
}

interface Receipt {
  saleId: string;
  paymentMethod: string;
  timestamp: string;
}

export default function CajaPage() {
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('efectivo');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [businessId, setBusinessId] = useState('');
  const [cajeroId, setCajeroId] = useState('');

  // Load user data on mount
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setBusinessId(user.businessId || '');
        setCajeroId(user.id || '');
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
  }, []);

  // Load orders when businessId is available
  useEffect(() => {
    if (businessId) {
      loadOrders();
    }
  }, [businessId]);

  // Load pending orders
  const loadOrders = async () => {
    if (!businessId) return;
    try {
      setLoading(true);
      const result = await actionGetPendingOrders(businessId);
      setOrders(Array.isArray(result) ? (result as PendingOrder[]) : []);
    } catch (error) {
      console.error('Error loading orders:', error);
      showToast('Error al cargar órdenes', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Handle payment processing
  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOrder) {
      showToast('Selecciona una orden', 'error');
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
        setReceipt({
          saleId: selectedOrder.id,
          paymentMethod,
          timestamp: new Date().toLocaleString('es-MX'),
        });
        showToast('✓ Pago procesado correctamente', 'success');

        // Refresh orders after 2 seconds
        setTimeout(() => {
          loadOrders();
          setSelectedOrder(null);
          setReceipt(null);
          setPaymentMethod('efectivo');
        }, 2000);
      } else {
        showToast((result as any).message || 'Error al procesar pago', 'error');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      showToast('Error al procesar pago', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <header
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          padding: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            💳 Caja
          </h1>
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              margin: '0.5rem 0 0 0',
            }}
          >
            Procesamiento de pagos
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
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
            backgroundColor:
              toast.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)',
            color: 'white',
            borderRadius: '0.5rem',
            zIndex: 50,
            fontSize: '0.875rem',
            fontWeight: '500',
            animation: 'slideIn 0.3s ease-out',
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Main Content */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2rem',
          padding: '2rem',
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        {/* Left Panel: Orders List */}
        <div>
          <h2
            style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              marginBottom: '1rem',
              marginTop: 0,
            }}
          >
            📋 Órdenes Pendientes ({orders.length})
          </h2>

          {loading ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '300px',
                color: 'var(--text-secondary)',
              }}
            >
              Cargando órdenes...
            </div>
          ) : orders.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '2rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.5rem',
                border: '1px dashed var(--border-color)',
                color: 'var(--text-secondary)',
              }}
            >
              No hay órdenes pendientes
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gap: '1rem',
                maxHeight: 'calc(100vh - 200px)',
                overflowY: 'auto',
              }}
            >
              {orders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  style={{
                    padding: '1rem',
                    backgroundColor:
                      selectedOrder?.id === order.id
                        ? 'var(--accent-orange)'
                        : 'var(--bg-secondary)',
                    border:
                      selectedOrder?.id === order.id
                        ? '2px solid var(--accent-orange)'
                        : '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    color: selectedOrder?.id === order.id ? 'white' : 'var(--text-primary)',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedOrder?.id !== order.id) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                        'var(--bg-tertiary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedOrder?.id !== order.id) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                        'var(--bg-secondary)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>
                        {order.clientName || 'Cliente'}
                      </p>
                      <p
                        style={{
                          margin: '0.25rem 0',
                          fontSize: '0.875rem',
                          opacity: 0.8,
                        }}
                      >
                        {order.items.length} artículos
                      </p>
                      <p
                        style={{
                          margin: '0.25rem 0',
                          fontSize: '0.75rem',
                          opacity: 0.7,
                        }}
                      >
                        {new Date(order.createdAt).toLocaleTimeString('es-MX')}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: '600' }}>
                      ${order.total.toFixed(2)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel: Order Details + Payment Form */}
        <div>
          {selectedOrder ? (
            <div
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)',
                padding: '1.5rem',
              }}
            >
              {/* Order Details Header */}
              <h2
                style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginTop: 0,
                  marginBottom: '1rem',
                }}
              >
                📦 Detalles de Orden
              </h2>

              {/* Client Info */}
              <div
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ marginBottom: '0.5rem' }}>
                  <p
                    style={{
                      margin: '0 0 0.25rem 0',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      fontWeight: '600',
                    }}
                  >
                    Cliente
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {selectedOrder.clientName || 'Sin nombre'}
                  </p>
                </div>
                {selectedOrder.clientPhone && (
                  <div>
                    <p
                      style={{
                        margin: '0 0 0.25rem 0',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        fontWeight: '600',
                      }}
                    >
                      Teléfono
                    </p>
                    <p
                      style={{
                        margin: 0,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {selectedOrder.clientPhone}
                    </p>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    margin: '0 0 0.75rem 0',
                  }}
                >
                  Artículos ({selectedOrder.items.length})
                </h3>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  {selectedOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.75rem',
                        backgroundColor: 'var(--bg-primary)',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: '0 0 0.25rem 0', fontWeight: '500' }}>
                          {item.product.name}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {item.qty} x ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <div
                        style={{
                          textAlign: 'right',
                          fontWeight: '600',
                          color: 'var(--accent-orange)',
                        }}
                      >
                        ${item.subtotal.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem',
                    paddingBottom: '0.5rem',
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
                  <span style={{ fontWeight: '600' }}>
                    ${selectedOrder.subtotal.toFixed(2)}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem',
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>Impuesto:</span>
                  <span style={{ fontWeight: '600' }}>
                    ${selectedOrder.iva.toFixed(2)}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: 'var(--accent-orange)',
                  }}
                >
                  <span>Total:</span>
                  <span>${selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Form */}
              {!receipt ? (
                <form onSubmit={handleProcessPayment}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        display: 'block',
                        marginBottom: '0.75rem',
                      }}
                    >
                      Método de Pago
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {['efectivo', 'transferencia', 'tarjeta'].map((method) => (
                        <label
                          key={method}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem',
                            backgroundColor: 'var(--bg-primary)',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLLabelElement).style.backgroundColor =
                              'var(--bg-tertiary)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLLabelElement).style.backgroundColor =
                              'var(--bg-primary)';
                          }}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={method}
                            checked={paymentMethod === method}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            style={{ cursor: 'pointer' }}
                          />
                          <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>
                            {method === 'efectivo' && '💵 Efectivo'}
                            {method === 'transferencia' && '🏦 Transferencia'}
                            {method === 'tarjeta' && '💳 Tarjeta'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={processing}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: processing
                        ? 'var(--text-secondary)'
                        : 'var(--accent-orange)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontWeight: '600',
                      cursor: processing ? 'not-allowed' : 'pointer',
                      fontSize: '1rem',
                      transition: 'opacity 0.2s',
                      opacity: processing ? 0.6 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!processing) {
                        (e.currentTarget as HTMLButtonElement).style.opacity = '0.9';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!processing) {
                        (e.currentTarget as HTMLButtonElement).style.opacity = '1';
                      }
                    }}
                  >
                    {processing ? 'Procesando...' : '✓ PROCESAR PAGO'}
                  </button>
                </form>
              ) : (
                // Receipt
                <div
                  style={{
                    backgroundColor: 'var(--accent-green)',
                    color: 'white',
                    padding: '1.5rem',
                    borderRadius: '0.5rem',
                    textAlign: 'center',
                  }}
                >
                  <p
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      margin: '0 0 0.5rem 0',
                    }}
                  >
                    ✓ PAGO PROCESADO
                  </p>
                  <p style={{ margin: '0.5rem 0', fontSize: '0.875rem' }}>
                    Venta ID: {receipt.saleId}
                  </p>
                  <p style={{ margin: '0.5rem 0', fontSize: '0.875rem' }}>
                    Método: {receipt.paymentMethod.toUpperCase()}
                  </p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem' }}>
                    {receipt.timestamp}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.5rem',
                border: '1px dashed var(--border-color)',
                padding: '3rem 1.5rem',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                minHeight: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              Selecciona una orden para ver los detalles
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
