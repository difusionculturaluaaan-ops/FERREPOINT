'use client'

import { useState, useEffect } from 'react'
import { actionGetSurtidoOrders, actionUpdateSurtidoItem, actionCompleteSurtidoOrder, actionGetBodegaStats } from '@/features/bodega/server'

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
    setOrders(result)
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
      alert(result.message)
      await loadOrders()
      await loadStats()
    }
  }

  if (!businessId || !locationId) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>⏳ Cargando contexto...</h1>
        <a href="/" style={{ color: '#E8610A', textDecoration: 'underline' }}>
          Volver al inicio
        </a>
      </div>
    )
  }

  const filteredOrders = orders.filter(o => o.status === activeTab)

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '1rem' }}>
      {/* Header */}
      <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1 style={{ fontSize: '28px', margin: 0 }}>🏭 Bodega</h1>
          <a
            href="/pos"
            style={{
              background: '#2B2F35',
              color: '#fff',
              padding: '10px 20px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            ← Volver al POS
          </a>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <div style={{ background: '#FFF3E0', padding: '1rem', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#E8610A' }}>{stats.pending}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Pendientes</div>
          </div>
          <div style={{ background: '#E3F2FD', padding: '1rem', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976D2' }}>{stats.inProgress}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>En Proceso</div>
          </div>
          <div style={{ background: '#E8F5E9', padding: '1rem', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#388E3C' }}>{stats.completed}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Completadas</div>
          </div>
          <div style={{ background: '#F3E5F5', padding: '1rem', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#7B1FA2' }}>{stats.total}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Total</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {(['pendiente', 'en_proceso', 'completado'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              background: activeTab === tab ? '#E8610A' : '#fff',
              color: activeTab === tab ? '#fff' : '#666',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            {tab === 'pendiente' && '⏳ Pendientes'}
            {tab === 'en_proceso' && '🔄 En Proceso'}
            {tab === 'completado' && '✅ Completadas'}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
            Cargando órdenes...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
            No hay órdenes {activeTab === 'pendiente' ? 'pendientes' : activeTab === 'en_proceso' ? 'en proceso' : 'completadas'}
          </div>
        ) : (
          filteredOrders.map(order => (
            <div
              key={order.id}
              style={{
                background: '#fff',
                padding: '1.5rem',
                borderRadius: '8px',
                border: `2px solid ${
                  order.status === 'pendiente'
                    ? '#FFB74D'
                    : order.status === 'en_proceso'
                    ? '#64B5F6'
                    : '#81C784'
                }`
              }}
            >
              {/* Order Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    {order.sale?.folio || `Orden ${order.id.substring(0, 8)}`}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    {new Date(order.createdAt).toLocaleTimeString('es-MX', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#E8610A' }}>
                    ${order.sale?.total.toFixed(2) || 'N/A'}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background:
                        order.status === 'pendiente'
                          ? '#FFF3E0'
                          : order.status === 'en_proceso'
                          ? '#E3F2FD'
                          : '#E8F5E9',
                      color:
                        order.status === 'pendiente'
                          ? '#E8610A'
                          : order.status === 'en_proceso'
                          ? '#1976D2'
                          : '#388E3C',
                      fontWeight: 'bold'
                    }}
                  >
                    {order.status === 'pendiente' && '⏳ Pendiente'}
                    {order.status === 'en_proceso' && '🔄 En Proceso'}
                    {order.status === 'completado' && '✅ Completado'}
                  </div>
                </div>
              </div>

              {/* Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                {order.items.map(item => (
                  <div
                    key={item.id}
                    style={{
                      background: '#f9f9f9',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      display: 'grid',
                      gridTemplateColumns: '1fr 100px 100px',
                      gap: '1rem',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                        {item.product.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#999' }}>
                        {item.product.clave}
                      </div>
                    </div>

                    {/* Required vs Picked */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#666' }}>Necesarios</div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#E8610A' }}>
                        {item.qty}
                      </div>
                    </div>

                    {/* Qty Picker */}
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        onClick={() => handleQtyChange(item.id, Math.max(0, item.qtyPicked - 1))}
                        style={{
                          background: '#E8610A',
                          color: '#fff',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
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
                          border: `2px solid ${
                            item.qtyPicked >= item.qty ? '#388E3C' : '#FFB74D'
                          }`,
                          borderRadius: '4px',
                          fontSize: '14px',
                          fontWeight: 'bold'
                        }}
                      />
                      <button
                        onClick={() => handleQtyChange(item.id, item.qtyPicked + 1)}
                        style={{
                          background: '#E8610A',
                          color: '#fff',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
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
                      ? '#388E3C'
                      : '#ccc',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: order.items.every(i => i.qtyPicked >= i.qty)
                      ? 'pointer'
                      : 'not-allowed'
                  }}
                >
                  ✅ Completar Orden
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
