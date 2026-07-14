'use client'

import { useState, useEffect } from 'react'
import {
  actionGetFinancialSummary,
  actionGetAccountsReceivable,
  actionGetAccountsPayable,
  actionGetCashCloses,
  actionGetProductProfitability,
  actionRecordPaymentReceivable,
  actionRecordPaymentPayable,
  actionCreateCashClose
} from '@/features/contabilidad/server'
import { ThemeToggle } from '@/components/ThemeToggle'

interface FinancialSummary {
  period: { start?: Date; end?: Date }
  sales: {
    count: number
    totalIngresos: number
    totalCosto: number
    margin: number
    marginPercent: number
  }
  cxc: {
    total: number
    pending: number
    overdue: number
    count: number
  }
  cxp: {
    total: number
    pending: number
    overdue: number
    count: number
  }
  netCash: number
}

export default function ContabilidadPage() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [cxc, setCxc] = useState<any[]>([])
  const [cxp, setCxp] = useState<any[]>([])
  const [cashCloses, setCashCloses] = useState<any[]>([])
  const [profitability, setProfitability] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [locationId, setLocationId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'resumen' | 'cxc' | 'cxp' | 'caja' | 'rentabilidad'>('resumen')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

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
  }, [businessId, locationId, viewMode, dateRange])

  const loadData = async () => {
    setIsLoading(true)

    const start = dateRange.start ? new Date(dateRange.start) : undefined
    const end = dateRange.end ? new Date(dateRange.end) : undefined

    const sum = await actionGetFinancialSummary(businessId!, start, end)
    setSummary(sum)

    const cxcData = await actionGetAccountsReceivable(businessId!)
    setCxc(cxcData as any)

    const cxpData = await actionGetAccountsPayable(businessId!)
    setCxp(cxpData as any)

    const cashData = await actionGetCashCloses(businessId!, locationId!)
    setCashCloses(cashData as any)

    const profData = await actionGetProductProfitability(businessId!)
    setProfitability(profData as any)

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
          Contabilidad
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
          { id: 'resumen', label: 'Resumen Financiero' },
          { id: 'cxc', label: 'Cuentas por Cobrar' },
          { id: 'cxp', label: 'Cuentas por Pagar' },
          { id: 'caja', label: 'Corte de Caja' },
          { id: 'rentabilidad', label: 'Rentabilidad' }
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

      {/* Date Range */}
      {viewMode === 'resumen' && (
        <div style={{
          background: 'var(--bg-primary)',
          borderBottom: '1px solid var(--border-color)',
          padding: '1rem 2rem',
          display: 'flex',
          gap: '1rem',
          maxWidth: '1600px',
          margin: '0 auto',
          alignItems: 'center'
        }}>
          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
            Período:
          </label>
          <input
            type="date"
            value={dateRange.start}
            onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '14px'
            }}
          />
          <span style={{ color: 'var(--text-secondary)' }}>a</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '14px'
            }}
          />
        </div>
      )}

      {/* Content */}
      <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>
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
        ) : viewMode === 'resumen' && summary ? (
          <>
            {/* KPI Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
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
                <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--success)' }}>
                  ${summary.sales.totalIngresos.toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Ingresos Totales
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  {summary.sales.count} ventas
                </div>
              </div>

              <div style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '1.5rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  ${summary.sales.totalCosto.toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Costo Total
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
                  color: summary.sales.margin >= 0 ? 'var(--success)' : 'var(--error)'
                }}>
                  ${summary.sales.margin.toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Margen Bruto
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  {summary.sales.marginPercent.toFixed(1)}%
                </div>
              </div>

              <div style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '1.5rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '20px', fontWeight: '600', color: 'var(--warning)' }}>
                  ${summary.cxc.pending.toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  CxC Pendiente
                </div>
                <div style={{ fontSize: '11px', color: 'var(--error)', marginTop: '0.25rem' }}>
                  {summary.cxc.overdue} vencidas
                </div>
              </div>

              <div style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '1.5rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '20px', fontWeight: '600', color: 'var(--error)' }}>
                  ${summary.cxp.pending.toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  CxP Pendiente
                </div>
                <div style={{ fontSize: '11px', color: 'var(--error)', marginTop: '0.25rem' }}>
                  {summary.cxp.overdue} vencidas
                </div>
              </div>
            </div>

            {/* Net Cash */}
            <div style={{
              background: 'var(--bg-primary)',
              border: `2px solid ${summary.netCash >= 0 ? 'var(--success)' : 'var(--error)'}`,
              borderRadius: '4px',
              padding: '2rem',
              textAlign: 'center',
              marginBottom: '2rem'
            }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                FLUJO DE CAJA NETO (Ingresos - CxP + CxC)
              </div>
              <div style={{
                fontSize: '32px',
                fontWeight: '600',
                color: summary.netCash >= 0 ? 'var(--success)' : 'var(--error)'
              }}>
                ${summary.netCash.toFixed(2)}
              </div>
            </div>
          </>
        ) : viewMode === 'cxc' ? (
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            padding: '1.5rem',
            overflowX: 'auto'
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 1rem 0' }}>
              Cuentas por Cobrar
            </h2>
            {cxc.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Sin cuentas por cobrar
              </div>
            ) : (
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
                      Cliente
                    </th>
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'right',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase'
                    }}>
                      Monto
                    </th>
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'right',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase'
                    }}>
                      Pagado
                    </th>
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'center',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase'
                    }}>
                      Vencimiento
                    </th>
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'center',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase'
                    }}>
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cxc.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem', fontSize: '14px', color: 'var(--text-primary)' }}>
                        {item.clientName}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '14px', color: 'var(--text-primary)', fontWeight: '600' }}>
                        ${item.amount.toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '14px', color: 'var(--accent-orange)', fontWeight: '600' }}>
                        ${item.amountPaid.toFixed(2)}
                      </td>
                      <td style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        fontSize: '14px',
                        color: new Date(item.dueDate) < new Date() ? 'var(--error)' : 'var(--text-secondary)'
                      }}>
                        {new Date(item.dueDate).toLocaleDateString('es-MX')}
                      </td>
                      <td style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          borderRadius: '3px',
                          background: item.status === 'pendiente' ? '#FCEAA3' : item.status === 'parcial' ? '#E3F2FD' : '#E8F5E9',
                          color: item.status === 'pendiente' ? '#9D6C1D' : item.status === 'parcial' ? '#1565C0' : '#2E7D32'
                        }}>
                          {item.status === 'pendiente' ? 'Pendiente' : item.status === 'parcial' ? 'Parcial' : 'Pagado'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : viewMode === 'cxp' ? (
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            padding: '1.5rem',
            overflowX: 'auto'
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 1rem 0' }}>
              Cuentas por Pagar
            </h2>
            {cxp.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Sin cuentas por pagar
              </div>
            ) : (
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
                      Proveedor
                    </th>
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'right',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase'
                    }}>
                      Monto
                    </th>
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'right',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase'
                    }}>
                      Pagado
                    </th>
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'center',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase'
                    }}>
                      Vencimiento
                    </th>
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'center',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase'
                    }}>
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cxp.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem', fontSize: '14px', color: 'var(--text-primary)' }}>
                        {item.supplier.name}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '14px', color: 'var(--text-primary)', fontWeight: '600' }}>
                        ${item.amount.toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '14px', color: 'var(--accent-orange)', fontWeight: '600' }}>
                        ${item.amountPaid.toFixed(2)}
                      </td>
                      <td style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        fontSize: '14px',
                        color: new Date(item.dueDate) < new Date() ? 'var(--error)' : 'var(--text-secondary)'
                      }}>
                        {new Date(item.dueDate).toLocaleDateString('es-MX')}
                      </td>
                      <td style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          borderRadius: '3px',
                          background: item.status === 'pendiente' ? '#FCEAA3' : item.status === 'parcial' ? '#E3F2FD' : '#E8F5E9',
                          color: item.status === 'pendiente' ? '#9D6C1D' : item.status === 'parcial' ? '#1565C0' : '#2E7D32'
                        }}>
                          {item.status === 'pendiente' ? 'Pendiente' : item.status === 'parcial' ? 'Parcial' : 'Pagado'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : viewMode === 'caja' ? (
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            padding: '1.5rem',
            overflowX: 'auto'
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 1rem 0' }}>
              Histórico de Cortes de Caja
            </h2>
            {cashCloses.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Sin cortes de caja
              </div>
            ) : (
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
                      Fecha
                    </th>
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'right',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase'
                    }}>
                      Inicial
                    </th>
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'right',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase'
                    }}>
                      Final
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
                      Diferencia
                    </th>
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'center',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase'
                    }}>
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cashCloses.map(close => (
                    <tr key={close.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem', fontSize: '14px', color: 'var(--text-primary)' }}>
                        {new Date(close.date).toLocaleDateString('es-MX')}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '14px', color: 'var(--text-primary)' }}>
                        ${close.initialCash.toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '14px', color: 'var(--text-primary)', fontWeight: '600' }}>
                        ${close.finalCash.toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '14px', color: 'var(--success)', fontWeight: '600' }}>
                        ${close.totalIngresos.toFixed(2)}
                      </td>
                      <td style={{
                        padding: '0.75rem',
                        textAlign: 'right',
                        fontSize: '14px',
                        color: close.difference === 0 ? 'var(--success)' : close.difference > 0 ? 'var(--success)' : 'var(--error)',
                        fontWeight: '600'
                      }}>
                        ${close.difference.toFixed(2)}
                      </td>
                      <td style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          borderRadius: '3px',
                          background: close.status === 'cuadrado' ? '#E8F5E9' : '#FCEAA3',
                          color: close.status === 'cuadrado' ? '#2E7D32' : '#9D6C1D'
                        }}>
                          {close.status === 'cuadrado' ? 'Cuadrado' : 'Diferencia'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : viewMode === 'rentabilidad' ? (
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            padding: '1.5rem',
            overflowX: 'auto'
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 1rem 0' }}>
              Rentabilidad por Producto (últimos 30 días)
            </h2>
            {profitability.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Sin datos de rentabilidad
              </div>
            ) : (
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
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'right',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase'
                    }}>
                      %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {profitability.map(prod => (
                    <tr key={prod.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem', fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500' }}>
                        {prod.name}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '14px', color: 'var(--text-primary)' }}>
                        {prod.qty}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '14px', color: 'var(--success)', fontWeight: '600' }}>
                        ${prod.revenue.toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '14px', color: 'var(--text-secondary)' }}>
                        ${prod.cost.toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '14px', color: 'var(--accent-orange)', fontWeight: '600' }}>
                        ${prod.margin.toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '14px', color: 'var(--accent-orange)', fontWeight: '600' }}>
                        {prod.marginPercent.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
