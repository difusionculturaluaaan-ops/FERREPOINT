'use client'

import { useState, useEffect } from 'react'
import { actionGetSurtidoOrders, actionUpdateSurtidoItem, actionCompleteSurtidoOrder, actionGetBodegaStats } from '@/features/bodega/server'
import { ThemeToggle } from '@/components/ThemeToggle'

interface SurtidoItem {
  id: string
  qty: number
  qtyPicked: number
  product: {
    id: string
    name: string
    clave: string
  }
}

interface SurtidoOrder {
  id: string
  saleId?: string
  status: 'pendiente' | 'en_proceso' | 'completado'
  items: SurtidoItem[]
  sale?: {
    folio: string
    total: number
  }
  createdAt: string
}

export default function BodegaPage() {
  const [orders, setOrders] = useState<SurtidoOrder[]>([])
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, completed: 0, total: 0 })
  const [activeTab, setActiveTab] = useState<'pendiente' | 'en_proceso' | 'completado'>('pendiente')
  const [isLoading, setIsLoading] = useState(true)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [locationId, setLocationId] = useState<string | null>(null)

  useEffect(() => {
    loadContext()
  }, [])

  const loadContext = async () => {
    try {
      const res = await fetch('/api/pos/context')
      const data = await res.json()
      if (!data.error) {
        setBusinessId(data.businessId)
        setLocationId(data.locationId)
      }
    } catch (error) {
      console.error('Error loading context:', error)
    }
  }

  useEffect(() => {
    if (businessId && locationId) {
      loadOrders()
      loadStats()
    }
  }, [businessId, locationId, activeTab])

  const loadOrders = async () => {
    setIsLoading(true)
    const result = await actionGetSurtidoOrders(businessId!, locationId!, activeTab)
    setOrders(result as any)
    setIsLoading(false)
  }

  const loadStats = async () => {
    const result = await actionGetBodegaStats(businessId!, locationId!)
    setStats(result)
  }

  const handleQtyChange = async (itemId: string, newQty: number) => {
    await actionUpdateSurtidoItem(itemId, newQty)
    await loadOrders()
  }

  const handleCompleteOrder = async (orderId: string) => {
    const result = await actionCompleteSurtidoOrder(orderId)
    if (result.success) {
      alert('Orden completada exitosamente')
      await loadOrders()
      await loadStats()
    }
  }

  if (!businessId || !locationId) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-secondary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', color: 'var(--text-primary)' }}>Cargando contexto...</h1>
          <a href="/" style={{ color: 'var(--accent-orange)', textDecoration: 'none' }}>
            Volver al inicio
          </a>
        </div>
      </div>
    )
  }

  const filteredOrders = orders.filter(o => o.status === activeTab)

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

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1.5rem',
        padding: '2rem',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '28px',
            fontWeight: '600',
            color: 'var(--error)'
          }}>
            {stats.pending}
          </div>
          <div style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            marginTop: '0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Pendientes
          </div>
        </div>
        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '28px',
            fontWeight: '600',
            color: 'var(--warning)'
          }}>
            {stats.inProgress}
          </div>
          <div style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            marginTop: '0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            En Proceso
          </div>
        </div>
        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '28px',
            fontWeight: '600',
            color: 'var(--success)'
          }}>
            {stats.completed}
          </div>
          <div style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            marginTop: '0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Completadas
          </div>
        </div>
        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '28px',
            fontWeight: '600',
            color: 'var(--accent-orange)'
          }}>
            {stats.total}
          </div>
          <div style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            marginTop: '0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Total
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        padding: '0 2rem',
        maxWidth: '1400px',
        margin: '0 auto',
        marginBottom: '2rem'
      }}>
        {(['pendiente', 'en_proceso', 'completado'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 16px',
              background: activeTab === tab ? 'var(--accent-orange)' : 'var(--bg-primary)',
              color: activeTab === tab ? 'var(--bg-primary)' : 'var(--text-secondary)',
              border: `1px solid ${activeTab === tab ? 'var(--accent-orange)' : 'var(--border-color)'}`,
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              if (activeTab !== tab) {
                e.currentTarget.style.background = 'var(--bg-secondary)'
              }
            }}
            onMouseLeave={e => {
              if (activeTab !== tab) {
                e.currentTarget.style.background = 'var(--bg-primary)'
              }
            }}
          >
            {tab === 'pendiente' && 'Pendientes'}
            {tab === 'en_proceso' && 'En Proceso'}
            {tab === 'completado' && 'Completadas'}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div style={{
        padding: '0 2rem',
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {isLoading ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: 'var(--text-secondary)'
          }}>
            Cargando órdenes...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: 'var(--text-secondary)'
          }}>
            No hay órdenes para mostrar
          </div>
        ) : (
          filteredOrders.map(order => (
            <div
              key={order.id}
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '1.5rem'
              }}
            >
              {/* Order Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1.5rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid var(--border-color)'
              }}>
                <div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'var(--text-primary)'
                  }}>
                    Orden {order.sale?.folio || order.id.substring(0, 8)}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    marginTop: '0.25rem'
                  }}>
                    {new Date(order.createdAt).toLocaleString('es-MX')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--accent-orange)'
                  }}>
                    ${order.sale?.total.toFixed(2) || '0.00'}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      padding: '4px 8px',
                      borderRadius: '3px',
                      marginTop: '0.5rem',
                      fontWeight: '500',
                      display: 'inline-block',
                      background:
                        order.status === 'pendiente'
                          ? '#FCEAA3'
                          : order.status === 'en_proceso'
                          ? '#E3F2FD'
                          : '#E8F5E9',
                      color:
                        order.status === 'pendiente'
                          ? '#9D6C1D'
                          : order.status === 'en_proceso'
                          ? '#1565C0'
                          : '#2E7D32'
                    }}
                  >
                    {order.status === 'pendiente' && 'Pendiente'}
                    {order.status === 'en_proceso' && 'En Proceso'}
                    {order.status === 'completado' && 'Completado'}
                  </div>
                </div>
              </div>

              {/* Items */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                marginBottom: '1.5rem'
              }}>
                {order.items.map(item => {
                  const isComplete = item.qtyPicked >= item.qty
                  return (
                    <div
                      key={item.id}
                      style={{
                        background: 'var(--bg-secondary)',
                        padding: '1rem',
                        borderRadius: '4px',
                        border: `1px solid ${isComplete ? 'var(--success)' : 'var(--warning)'}`,
                        display: 'grid',
                        gridTemplateColumns: 'auto 1fr auto auto',
                        gap: '1rem',
                        alignItems: 'center'
                      }}
                    >
                      <div
                        style={{
                          fontSize: '20px',
                          fontWeight: '600',
                          color: isComplete ? 'var(--success)' : 'var(--warning)',
                          textAlign: 'center'
                        }}
                      >
                        {isComplete ? '✓' : '○'}
                      </div>

                      <div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: 'var(--text-primary)'
                        }}>
                          {item.product.name}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: 'var(--text-secondary)'
                        }}>
                          {item.product.clave}
                        </div>
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        <div style={{
                          fontSize: '12px',
                          color: 'var(--text-secondary)'
                        }}>
                          Necesarios
                        </div>
                        <div style={{
                          fontSize: '18px',
                          fontWeight: '600',
                          color: 'var(--text-primary)'
                        }}>
                          {item.qty}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                          onClick={() => handleQtyChange(item.id, Math.max(0, item.qtyPicked - 1))}
                          style={{
                            background: 'var(--accent-orange)',
                            color: 'var(--bg-primary)',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          value={item.qtyPicked}
                          onChange={e => handleQtyChange(item.id, parseInt(e.target.value) || 0)}
                          style={{
                            width: '50px',
                            padding: '4px',
                            textAlign: 'center',
                            border: `2px solid ${isComplete ? 'var(--success)' : 'var(--warning)'}`,
                            borderRadius: '3px',
                            fontSize: '14px',
                            fontWeight: '600'
                          }}
                        />
                        <button
                          onClick={() => handleQtyChange(item.id, item.qtyPicked + 1)}
                          style={{
                            background: 'var(--accent-orange)',
                            color: 'var(--bg-primary)',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Complete Button */}
              {order.status !== 'completado' && (
                <button
                  onClick={() => handleCompleteOrder(order.id)}
                  disabled={!order.items.every(i => i.qtyPicked >= i.qty)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: order.items.every(i => i.qtyPicked >= i.qty)
                      ? 'var(--success)'
                      : 'var(--border-color)',
                    color: 'var(--bg-primary)',
                    border: 'none',
                    borderRadius: '4px',
                    fontWeight: '600',
                    cursor: order.items.every(i => i.qtyPicked >= i.qty)
                      ? 'pointer'
                      : 'not-allowed',
                    fontSize: '14px'
                  }}
                  onMouseEnter={e => {
                    if (order.items.every(i => i.qtyPicked >= i.qty)) {
                      e.currentTarget.style.background = '#2D7A3A'
                    }
                  }}
                  onMouseLeave={e => {
                    if (order.items.every(i => i.qtyPicked >= i.qty)) {
                      e.currentTarget.style.background = 'var(--success)'
                    }
                  }}
                >
                  Completar Orden
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
