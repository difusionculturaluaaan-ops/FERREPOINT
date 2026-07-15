'use client'

import { useState, useEffect } from 'react'
import { actionGetOrdersForWarehouse, actionMarkOrderAsReady } from '@/features/pos/server'
import { ThemeToggle } from '@/components/ThemeToggle'

interface OrderItem {
  productId: string
  qty: number
  price: number
  subtotal: number
  product: {
    id: string
    name: string
    clave: string
  }
}

interface Order {
  id: string
  folio: string
  status: string
  clientName: string
  clientPhone?: string
  clientAddress?: string
  deliveryType: string
  items: any[]
  vendor: {
    id: string
    name: string
  }
  paymentProcessedAt?: Date | string
  total: number
}

interface Toast {
  id: string
  message: string
  type: 'success' | 'error'
}

export default function BodegaPage() {
  const [ordersToPrep, setOrdersToPrep] = useState<Order[]>([])
  const [ordersPrepared, setOrdersPrepared] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [isPolling, setIsPolling] = useState(true)

  // Load businessId from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('user')
      if (stored) {
        const user = JSON.parse(stored)
        setBusinessId(user.businessId)
      }
    } catch (error) {
      console.error('Error loading businessId from localStorage:', error)
    }
  }, [])

  // Initial load
  useEffect(() => {
    if (businessId) {
      loadOrders()
    }
  }, [businessId])

  // Auto-refresh polling every 3 seconds
  useEffect(() => {
    if (!businessId || !isPolling) return

    const interval = setInterval(() => {
      loadOrders()
    }, 3000)

    return () => clearInterval(interval)
  }, [businessId, isPolling])

  const loadOrders = async () => {
    if (!businessId) return

    try {
      setIsLoading(true)
      const allOrders = await actionGetOrdersForWarehouse(businessId)

      // Separate into pending and prepared
      const pending = allOrders.filter((o: any) => o.status === 'pagada')
      const prepared = allOrders.filter((o: any) => o.status === 'preparada')

      setOrdersToPrep(pending)
      setOrdersPrepared(prepared)
    } catch (error) {
      console.error('Error loading orders:', error)
      showToast('Error al cargar órdenes', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkAsReady = async (saleId: string, folio: string) => {
    try {
      const result = await actionMarkOrderAsReady(saleId)
      if (result.success) {
        showToast(`✓ Orden #${folio} lista para entrega`, 'success')
        await loadOrders()
      } else {
        showToast(result.error || 'Error al actualizar orden', 'error')
      }
    } catch (error) {
      console.error('Error marking order as ready:', error)
      showToast('Error al actualizar orden', 'error')
    }
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { id, message, type }])

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }

  if (!businessId) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-secondary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', color: 'var(--text-primary)' }}>Cargando...</h1>
          <a href="/" style={{ color: 'var(--accent-orange)', textDecoration: 'none' }}>
            Volver al inicio
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)' }}>
      {/* Header */}
      <div style={{
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-color)',
        padding: '1.5rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '600',
          color: 'var(--text-primary)',
          margin: '0'
        }}>
          Bodega
        </h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <ThemeToggle />
          <a
            href="/"
            style={{
              color: 'var(--accent-orange)',
              textDecoration: 'none',
              fontWeight: '500',
              fontSize: '14px'
            }}
          >
            Volver al inicio
          </a>
        </div>
      </div>

      {/* Stats Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '2rem',
        padding: '2rem',
        maxWidth: '1400px',
        margin: '0 auto',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          padding: '1.5rem',
        }}>
          <div style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '0.5rem'
          }}>
            Órdenes por Preparar
          </div>
          <div style={{
            fontSize: '32px',
            fontWeight: '600',
            color: 'var(--error)'
          }}>
            {ordersToPrep.length}
          </div>
        </div>
        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          padding: '1.5rem',
        }}>
          <div style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '0.5rem'
          }}>
            Órdenes Preparadas
          </div>
          <div style={{
            fontSize: '32px',
            fontWeight: '600',
            color: 'var(--success)'
          }}>
            {ordersPrepared.length}
          </div>
        </div>
      </div>

      {/* Two Sections Layout */}
      <div style={{
        padding: '0 2rem',
        maxWidth: '1400px',
        margin: '0 auto',
        marginBottom: '2rem',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2rem'
      }}>
        {/* Section 1: Órdenes por Preparar */}
        <div>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ color: 'var(--error)', fontSize: '20px' }}>🔴</span>
            Órdenes por Preparar ({ordersToPrep.length})
          </h2>

          {isLoading ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: 'var(--text-secondary)',
              background: 'var(--bg-primary)',
              borderRadius: '4px',
              border: '1px solid var(--border-color)'
            }}>
              Cargando...
            </div>
          ) : ordersToPrep.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: 'var(--text-secondary)',
              background: 'var(--bg-primary)',
              borderRadius: '4px',
              border: '1px solid var(--border-color)'
            }}>
              No hay órdenes por preparar
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {ordersToPrep.map(order => (
                <div
                  key={order.id}
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    padding: '1.5rem'
                  }}
                >
                  {/* Folio - Large & Prominent */}
                  <div style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: 'var(--accent-orange)',
                    marginBottom: '1rem'
                  }}>
                    #{order.folio}
                  </div>

                  {/* Client Info */}
                  <div style={{
                    marginBottom: '1rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid var(--border-color)'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'var(--text-primary)'
                    }}>
                      {order.clientName}
                    </div>
                    {order.clientPhone && (
                      <div style={{
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        marginTop: '0.25rem'
                      }}>
                        📱 {order.clientPhone}
                      </div>
                    )}
                    {order.clientAddress && (
                      <div style={{
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        marginTop: '0.25rem',
                        fontStyle: 'italic'
                      }}>
                        📍 {order.clientAddress}
                      </div>
                    )}
                  </div>

                  {/* Items List */}
                  <div style={{
                    marginBottom: '1rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid var(--border-color)'
                  }}>
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          fontSize: '13px',
                          color: 'var(--text-primary)',
                          marginBottom: '0.5rem',
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span>{item.qty}x {item.product.name}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          ${item.subtotal.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Total & Button */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: 'var(--accent-orange)'
                    }}>
                      Total: ${order.total.toFixed(2)}
                    </div>
                    <button
                      onClick={() => handleMarkAsReady(order.id, order.folio)}
                      style={{
                        background: 'var(--success)',
                        color: 'var(--bg-primary)',
                        border: 'none',
                        padding: '10px 16px',
                        borderRadius: '4px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '13px',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = '#2D7A3A'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'var(--success)'
                      }}
                    >
                      ✓ MARCAR COMO LISTA
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Órdenes Preparadas */}
        <div>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ color: 'var(--success)', fontSize: '20px' }}>🟢</span>
            Órdenes Preparadas ({ordersPrepared.length})
          </h2>

          {isLoading ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: 'var(--text-secondary)',
              background: 'var(--bg-primary)',
              borderRadius: '4px',
              border: '1px solid var(--border-color)'
            }}>
              Cargando...
            </div>
          ) : ordersPrepared.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: 'var(--text-secondary)',
              background: 'var(--bg-primary)',
              borderRadius: '4px',
              border: '1px solid var(--border-color)'
            }}>
              No hay órdenes preparadas
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {ordersPrepared.map(order => (
                <div
                  key={order.id}
                  style={{
                    background: 'var(--bg-primary)',
                    border: '2px solid var(--success)',
                    borderRadius: '4px',
                    padding: '1.5rem'
                  }}
                >
                  {/* Folio - Large & Prominent */}
                  <div style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: 'var(--success)',
                    marginBottom: '1rem'
                  }}>
                    #{order.folio}
                  </div>

                  {/* Client Info */}
                  <div style={{
                    marginBottom: '1rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid var(--border-color)'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'var(--text-primary)'
                    }}>
                      {order.clientName}
                    </div>
                    {order.clientPhone && (
                      <div style={{
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        marginTop: '0.25rem'
                      }}>
                        📱 {order.clientPhone}
                      </div>
                    )}
                    {order.clientAddress && (
                      <div style={{
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        marginTop: '0.25rem',
                        fontStyle: 'italic'
                      }}>
                        📍 {order.clientAddress}
                      </div>
                    )}
                  </div>

                  {/* Items List */}
                  <div style={{
                    marginBottom: '1rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid var(--border-color)'
                  }}>
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          fontSize: '13px',
                          color: 'var(--text-primary)',
                          marginBottom: '0.5rem',
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span>{item.qty}x {item.product.name}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          ${item.subtotal.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'var(--success)'
                  }}>
                    Total: ${order.total.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Toast Notifications */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        zIndex: 9999
      }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            style={{
              background: toast.type === 'success' ? 'var(--success)' : 'var(--error)',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '500',
              animation: 'slideIn 0.3s ease-out'
            }}
          >
            {toast.message}
          </div>
        ))}
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
  )
}
