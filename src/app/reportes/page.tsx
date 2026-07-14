'use client'

import { useState, useEffect } from 'react'
import {
  actionGetDailySummary,
  actionGetWeeklySummary,
  actionGetInventoryHealth,
  actionGetTopProducts
} from '@/features/reportes/server'
import { ThemeToggle } from '@/components/ThemeToggle'

interface VendorReport {
  vendorId: string
  vendorName: string
  total: number
  count: number
}

interface DailySummary {
  date: string
  totalSales: number
  totalIngresos: number
  totalCosto: number
  avgTicket: number
  margin: number
  marginPercent: number
  byVendor: VendorReport[]
}

interface InventoryHealth {
  totalProducts: number
  critical: number
  criticalList: any[]
  overstock: number
  healthy: number
  totalValue: number
  criticalValue: number
}

interface TopProduct {
  id: string
  name: string
  clave: string
  qty: number
  revenue: number
  cost: number
  count: number
  margin: number
}

export default function ReportesPage() {
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null)
  const [inventoryHealth, setInventoryHealth] = useState<InventoryHealth | null>(null)
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [locationId, setLocationId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [viewMode, setViewMode] = useState<'hoy' | 'semana' | 'inventario' | 'top-productos'>('hoy')

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
  }, [businessId, locationId, viewMode, selectedDate])

  const loadData = async () => {
    setIsLoading(true)

    if (viewMode === 'hoy') {
      const date = new Date(selectedDate)
      const summary = await actionGetDailySummary(businessId!, locationId!, date)
      setDailySummary(summary)
    } else if (viewMode === 'semana') {
      await actionGetWeeklySummary(businessId!, locationId!, new Date(selectedDate))
    } else if (viewMode === 'inventario') {
      const health = await actionGetInventoryHealth(businessId!)
      setInventoryHealth(health)
    } else if (viewMode === 'top-productos') {
      const products = await actionGetTopProducts(businessId!, locationId!, 30)
      setTopProducts(products)
    }

    setIsLoading(false)
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
          Reportes
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

      {/* View Tabs */}
      <div style={{
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-color)',
        padding: '0 2rem',
        display: 'flex',
        gap: '1rem',
        maxWidth: '1600px',
        margin: '0 auto'
      }}>
        {[
          { id: 'hoy', label: 'Hoy' },
          { id: 'semana', label: 'Semana' },
          { id: 'inventario', label: 'Inventario' },
          { id: 'top-productos', label: 'Top Productos' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id as any)}
            style={{
              padding: '1rem 1.5rem',
              background: viewMode === tab.id ? 'var(--accent-orange)' : 'transparent',
              color: viewMode === tab.id ? 'var(--bg-primary)' : 'var(--text-secondary)',
              border: 'none',
              borderBottom: viewMode === tab.id ? '3px solid var(--accent-orange)' : '3px solid transparent',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              if (viewMode !== tab.id) {
                e.currentTarget.style.color = 'var(--text-primary)'
              }
            }}
            onMouseLeave={e => {
              if (viewMode !== tab.id) {
                e.currentTarget.style.color = 'var(--text-secondary)'
              }
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Date Selector */}
      {(viewMode === 'hoy' || viewMode === 'semana') && (
        <div style={{
          background: 'var(--bg-primary)',
          borderBottom: '1px solid var(--border-color)',
          padding: '1.5rem 2rem',
          display: 'flex',
          gap: '1rem',
          maxWidth: '1600px',
          margin: '0 auto',
          alignItems: 'center'
        }}>
          <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>
            {viewMode === 'hoy' ? 'Fecha:' : 'Semana comenzando:'}
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '14px'
            }}
          />
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            style={{
              padding: '8px 16px',
              background: 'var(--accent-orange)',
              color: 'var(--bg-primary)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '12px'
            }}
          >
            Hoy
          </button>
        </div>
      )}

      {/* Content */}
      <div style={{
        padding: '2rem',
        maxWidth: '1600px',
        margin: '0 auto'
      }}>
        {isLoading ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: 'var(--text-secondary)',
            background: 'var(--bg-primary)',
            borderRadius: '4px'
          }}>
            Cargando datos...
          </div>
        ) : viewMode === 'hoy' && dailySummary ? (
          <>
            {/* KPI Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '1.5rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--accent-orange)' }}>
                  {dailySummary.totalSales}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '0.5rem', textTransform: 'uppercase' }}>
                  Ventas
                </div>
              </div>

              <div style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '1.5rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--success)' }}>
                  ${dailySummary.totalIngresos.toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '0.5rem', textTransform: 'uppercase' }}>
                  Total Ingresos
                </div>
              </div>

              <div style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '1.5rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '20px', fontWeight: '600', color: 'var(--accent-orange)' }}>
                  ${dailySummary.avgTicket.toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '0.5rem', textTransform: 'uppercase' }}>
                  Ticket Promedio
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
                  fontSize: '20px',
                  fontWeight: '600',
                  color: dailySummary.margin >= 0 ? 'var(--success)' : 'var(--error)'
                }}>
                  {dailySummary.marginPercent.toFixed(1)}%
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '0.5rem', textTransform: 'uppercase' }}>
                  Margen
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  ${dailySummary.margin.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Vendedor Breakdown */}
            <div style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              padding: '1.5rem'
            }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 1rem 0' }}>
                Ventas por Vendedor
              </h2>
              {dailySummary.byVendor.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  Sin ventas hoy
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{
                          padding: '0.75rem',
                          textAlign: 'left',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: 'var(--text-secondary)',
                          textTransform: 'uppercase'
                        }}>
                          Vendedor
                        </th>
                        <th style={{
                          padding: '0.75rem',
                          textAlign: 'right',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: 'var(--text-secondary)',
                          textTransform: 'uppercase'
                        }}>
                          Ventas
                        </th>
                        <th style={{
                          padding: '0.75rem',
                          textAlign: 'right',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: 'var(--text-secondary)',
                          textTransform: 'uppercase'
                        }}>
                          Total
                        </th>
                        <th style={{
                          padding: '0.75rem',
                          textAlign: 'right',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: 'var(--text-secondary)',
                          textTransform: 'uppercase'
                        }}>
                          Promedio
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailySummary.byVendor.map(vendor => (
                        <tr
                          key={vendor.vendorId}
                          style={{ borderBottom: '1px solid var(--border-color)' }}
                        >
                          <td style={{
                            padding: '0.75rem',
                            fontSize: '14px',
                            color: 'var(--text-primary)',
                            fontWeight: '500'
                          }}>
                            {vendor.vendorName}
                          </td>
                          <td style={{
                            padding: '0.75rem',
                            textAlign: 'right',
                            fontSize: '14px',
                            color: 'var(--text-primary)'
                          }}>
                            {vendor.count}
                          </td>
                          <td style={{
                            padding: '0.75rem',
                            textAlign: 'right',
                            fontSize: '14px',
                            color: 'var(--accent-orange)',
                            fontWeight: '600'
                          }}>
                            ${vendor.total.toFixed(2)}
                          </td>
                          <td style={{
                            padding: '0.75rem',
                            textAlign: 'right',
                            fontSize: '14px',
                            color: 'var(--text-secondary)'
                          }}>
                            ${(vendor.total / vendor.count).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : viewMode === 'inventario' && inventoryHealth ? (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '1.5rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--accent-orange)' }}>
                  {inventoryHealth.totalProducts}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Total Productos
                </div>
              </div>

              <div style={{
                background: 'var(--bg-primary)',
                border: '2px solid var(--error)',
                borderRadius: '4px',
                padding: '1.5rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--error)' }}>
                  {inventoryHealth.critical}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Stock Crítico
                </div>
              </div>

              <div style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '1.5rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--warning)' }}>
                  {inventoryHealth.overstock}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Sobrestock
                </div>
              </div>

              <div style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '1.5rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  ${inventoryHealth.totalValue.toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Valor Total Inventario
                </div>
              </div>
            </div>

            {inventoryHealth.critical > 0 && (
              <div style={{
                background: 'var(--bg-primary)',
                border: '2px solid var(--error)',
                borderRadius: '4px',
                padding: '1.5rem'
              }}>
                <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--error)', margin: '0 0 1rem 0' }}>
                  Productos con Stock Crítico
                </h2>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{
                          padding: '0.75rem',
                          textAlign: 'left',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: 'var(--text-secondary)',
                          textTransform: 'uppercase'
                        }}>
                          Clave
                        </th>
                        <th style={{
                          padding: '0.75rem',
                          textAlign: 'left',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: 'var(--text-secondary)',
                          textTransform: 'uppercase'
                        }}>
                          Producto
                        </th>
                        <th style={{
                          padding: '0.75rem',
                          textAlign: 'center',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: 'var(--text-secondary)',
                          textTransform: 'uppercase'
                        }}>
                          Stock
                        </th>
                        <th style={{
                          padding: '0.75rem',
                          textAlign: 'center',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: 'var(--text-secondary)',
                          textTransform: 'uppercase'
                        }}>
                          Mín.
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryHealth.criticalList.map(prod => (
                        <tr key={prod.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{
                            padding: '0.75rem',
                            fontSize: '14px',
                            color: 'var(--text-primary)',
                            fontWeight: '600'
                          }}>
                            {prod.clave}
                          </td>
                          <td style={{
                            padding: '0.75rem',
                            fontSize: '14px',
                            color: 'var(--text-primary)'
                          }}>
                            {prod.name}
                          </td>
                          <td style={{
                            padding: '0.75rem',
                            textAlign: 'center',
                            fontSize: '14px',
                            color: 'var(--error)',
                            fontWeight: '600'
                          }}>
                            {prod.stock}
                          </td>
                          <td style={{
                            padding: '0.75rem',
                            textAlign: 'center',
                            fontSize: '14px',
                            color: 'var(--text-secondary)'
                          }}>
                            {prod.minStock}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : viewMode === 'top-productos' ? (
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            padding: '1.5rem'
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 1rem 0' }}>
              Top 10 Productos (últimos 30 días)
            </h2>
            {topProducts.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Sin datos
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'left',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase'
                      }}>
                        Producto
                      </th>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'right',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase'
                      }}>
                        Cantidad
                      </th>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'right',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase'
                      }}>
                        Ingresos
                      </th>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'right',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase'
                      }}>
                        Costo
                      </th>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'right',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase'
                      }}>
                        Margen
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((prod, idx) => (
                      <tr key={prod.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{
                          padding: '0.75rem',
                          fontSize: '14px',
                          color: 'var(--text-primary)',
                          fontWeight: '500'
                        }}>
                          {idx + 1}. {prod.name}
                        </td>
                        <td style={{
                          padding: '0.75rem',
                          textAlign: 'right',
                          fontSize: '14px',
                          color: 'var(--text-primary)'
                        }}>
                          {prod.qty}
                        </td>
                        <td style={{
                          padding: '0.75rem',
                          textAlign: 'right',
                          fontSize: '14px',
                          color: 'var(--accent-orange)',
                          fontWeight: '600'
                        }}>
                          ${prod.revenue.toFixed(2)}
                        </td>
                        <td style={{
                          padding: '0.75rem',
                          textAlign: 'right',
                          fontSize: '14px',
                          color: 'var(--text-secondary)'
                        }}>
                          ${prod.cost.toFixed(2)}
                        </td>
                        <td style={{
                          padding: '0.75rem',
                          textAlign: 'right',
                          fontSize: '14px',
                          color: 'var(--success)',
                          fontWeight: '600'
                        }}>
                          ${prod.margin.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
