'use client'

import { useState, useEffect } from 'react'
import {
  actionGetDeliveries,
  actionUpdateDeliveryStatus,
  actionGetDeliveryStats,
  actionCreateDelivery,
  actionGetAvailableDrivers
} from '@/features/entregas/server'
import { ThemeToggle } from '@/components/ThemeToggle'

interface Driver {
  id: string
  name: string
  email: string
}

interface DeliveryItem {
  id: string
  productId: string
  qty: number
  product: {
    name: string
    clave: string
  }
}

interface Delivery {
  id: string
  clientName: string
  clientPhone: string
  address: string
  status: 'pendiente' | 'en_ruta' | 'completado' | 'cancelado'
  latitude?: number
  longitude?: number
  driver: { name: string; id: string; email: string }
  sale: { folio: string; total: number }
  items: DeliveryItem[]
  createdAt: string
  completedAt?: string
}

interface Summary {
  pending: number
  inRoute: number
  completed: number
  cancelled: number
  completedToday: number
  total: number
  activeDeliveries: number
}

export default function EntregasPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [summary, setSummary] = useState<Summary>({
    pending: 0,
    inRoute: 0,
    completed: 0,
    cancelled: 0,
    completedToday: 0,
    total: 0,
    activeDeliveries: 0
  })
  const [drivers, setDrivers] = useState<Driver[]>([])
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
      loadData()
    }
  }, [businessId, locationId])

  const loadData = async () => {
    setIsLoading(true)
    const devs = await actionGetDeliveries(businessId!, locationId!)
    setDeliveries(devs as any)

    const sum = await actionGetDeliveryStats(businessId!, locationId!)
    setSummary(sum)

    const drv = await actionGetAvailableDrivers(businessId!, locationId!)
    setDrivers(drv as any)

    setIsLoading(false)
  }

  const handleStatusChange = async (deliveryId: string, newStatus: 'pendiente' | 'en_ruta' | 'completado' | 'cancelado') => {
    const result = await actionUpdateDeliveryStatus(deliveryId, newStatus)
    if (result.success) {
      await loadData()
    } else {
      alert(result.error || 'Error al actualizar')
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
        </div>
      </div>
    )
  }

  const pendingDeliveries = deliveries.filter(d => d.status === 'pendiente')
  const inRouteDeliveries = deliveries.filter(d => d.status === 'en_ruta')
  const completedDeliveries = deliveries.filter(d => d.status === 'completado')

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
          Entregas
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

      {/* Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '1.5rem',
        padding: '2rem',
        maxWidth: '1600px',
        margin: '0 auto'
      }}>
        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--warning)' }}>
            {summary.pending}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
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
          <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--accent-orange)' }}>
            {summary.inRoute}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            En Ruta
          </div>
        </div>

        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--success)' }}>
            {summary.completed}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Completadas
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {summary.completedToday} hoy
          </div>
        </div>

        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--error)' }}>
            {summary.cancelled}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Canceladas
          </div>
        </div>

        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--accent-orange)' }}>
            {summary.total}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Total
          </div>
        </div>
      </div>

      {/* Kanban */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '2rem',
        padding: '0 2rem',
        maxWidth: '1600px',
        margin: '0 auto',
        marginBottom: '2rem'
      }}>
        {/* Pendientes */}
        <div style={{
          background: 'var(--bg-primary)',
          border: '2px solid var(--warning)',
          borderRadius: '4px',
          padding: '1rem',
          minHeight: '400px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h2 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            margin: '0 0 1rem 0',
            borderBottom: '2px solid var(--warning)',
            paddingBottom: '0.75rem'
          }}>
            Pendientes ({pendingDeliveries.length})
          </h2>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pendingDeliveries.map(delivery => (
              <div
                key={delivery.id}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--warning)',
                  borderRadius: '4px',
                  padding: '0.75rem',
                  cursor: 'pointer'
                }}
                onClick={() => handleStatusChange(delivery.id, 'en_ruta')}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'var(--bg-secondary)'
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {delivery.sale.folio}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {delivery.clientName}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {delivery.driver.name}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  ${delivery.sale.total.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* En Ruta */}
        <div style={{
          background: 'var(--bg-primary)',
          border: '2px solid var(--accent-orange)',
          borderRadius: '4px',
          padding: '1rem',
          minHeight: '400px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h2 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            margin: '0 0 1rem 0',
            borderBottom: '2px solid var(--accent-orange)',
            paddingBottom: '0.75rem'
          }}>
            En Ruta ({inRouteDeliveries.length})
          </h2>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {inRouteDeliveries.map(delivery => (
              <div
                key={delivery.id}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--accent-orange)',
                  borderRadius: '4px',
                  padding: '0.75rem',
                  cursor: 'pointer'
                }}
                onClick={() => handleStatusChange(delivery.id, 'completado')}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(232, 97, 10, 0.1)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'var(--bg-secondary)'
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {delivery.sale.folio}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {delivery.clientName}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--accent-orange)', fontWeight: '500' }}>
                  {delivery.driver.name}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  📍 {delivery.address.substring(0, 30)}...
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Completadas */}
        <div style={{
          background: 'var(--bg-primary)',
          border: '2px solid var(--success)',
          borderRadius: '4px',
          padding: '1rem',
          minHeight: '400px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h2 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            margin: '0 0 1rem 0',
            borderBottom: '2px solid var(--success)',
            paddingBottom: '0.75rem'
          }}>
            Completadas ({completedDeliveries.length})
          </h2>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {completedDeliveries.map(delivery => (
              <div
                key={delivery.id}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--success)',
                  borderRadius: '4px',
                  padding: '0.75rem',
                  opacity: 0.7
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {delivery.sale.folio}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {delivery.clientName}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--success)', fontWeight: '500' }}>
                  ✓ Entregado
                </div>
                {delivery.completedAt && (
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    {new Date(delivery.completedAt).toLocaleTimeString('es-MX')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
