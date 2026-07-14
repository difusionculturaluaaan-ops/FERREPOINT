'use client'

import { useState, useEffect } from 'react'
import {
  actionRecordMovement,
  actionGetMovements,
  actionGetMovementsSummary,
  actionGetProductsForMovement
} from '@/features/almacen/server'
import { ThemeToggle } from '@/components/ThemeToggle'

interface Movement {
  id: string
  type: 'entrada' | 'salida' | 'ajuste'
  qty: number
  reason?: string
  reference?: string
  createdAt: string
  product: {
    name: string
    clave: string
    category: string
    costPrice: number
    price: number
  }
}

interface Product {
  id: string
  clave: string
  name: string
  category: string
  stock: number
  costPrice: number
  price: number
}

interface Summary {
  totalMovements: number
  entradas: number
  salidas: number
  ajustes: number
  totalEntradasCosto: number
  totalSalidasCosto: number
  totalSalidasVenta: number
  margenTotal: number
}

const typeLabels = {
  entrada: 'Entrada',
  salida: 'Salida',
  ajuste: 'Ajuste'
}

const typeColors = {
  entrada: '#10b981',
  salida: '#ef4444',
  ajuste: '#f59e0b'
}

export default function AlmacenPage() {
  const [movements, setMovements] = useState<Movement[]>([])
  const [summary, setSummary] = useState<Summary>({
    totalMovements: 0,
    entradas: 0,
    salidas: 0,
    ajustes: 0,
    totalEntradasCosto: 0,
    totalSalidasCosto: 0,
    totalSalidasVenta: 0,
    margenTotal: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [locationId, setLocationId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'entrada' | 'salida' | 'ajuste'>('entrada')
  const [filterType, setFilterType] = useState<string>('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [searchProducts, setSearchProducts] = useState('')
  const [productSuggestions, setProductSuggestions] = useState<Product[]>([])
  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
    type: 'entrada' as 'entrada' | 'salida' | 'ajuste',
    qty: '',
    reason: '',
    reference: ''
  })

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
  }, [businessId, locationId, filterType, dateRange])

  const loadData = async () => {
    setIsLoading(true)
    const start = dateRange.start ? new Date(dateRange.start) : undefined
    const end = dateRange.end ? new Date(dateRange.end) : undefined

    const movs = await actionGetMovements(
      businessId!,
      locationId,
      filterType || undefined,
      start,
      end
    )
    setMovements(movs as any)

    const sum = await actionGetMovementsSummary(businessId!, start, end)
    setSummary(sum)
    setIsLoading(false)
  }

  const handleProductSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchProducts(value)
    setFormData({ ...formData, productName: value, productId: '' })

    if (value.length > 0) {
      const products = await actionGetProductsForMovement(businessId!, value)
      setProductSuggestions(products)
    } else {
      setProductSuggestions([])
    }
  }

  const handleSelectProduct = (product: Product) => {
    setFormData({
      ...formData,
      productId: product.id,
      productName: `${product.clave} - ${product.name}`
    })
    setSearchProducts(`${product.clave} - ${product.name}`)
    setProductSuggestions([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.productId || !formData.qty) {
      alert('Completa todos los campos requeridos')
      return
    }

    const result = await actionRecordMovement(
      businessId!,
      locationId!,
      formData.productId,
      formData.type,
      parseInt(formData.qty),
      formData.reason || undefined,
      formData.reference || undefined
    )

    if (result.success) {
      setShowForm(false)
      setFormData({
        productId: '',
        productName: '',
        type: 'entrada',
        qty: '',
        reason: '',
        reference: ''
      })
      setSearchProducts('')
      await loadData()
      alert('Movimiento registrado exitosamente')
    } else {
      alert(result.error || 'Error al registrar movimiento')
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

  const filteredMovements = movements.filter(m => !filterType || m.type === filterType)

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
          Almacén
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

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
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
          <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--accent-orange)' }}>
            {summary.totalMovements}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Total Movimientos
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
            color: typeColors.entrada,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            ↓ {summary.entradas}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Entradas
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            ${summary.totalEntradasCosto.toFixed(2)}
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
            color: typeColors.salida,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            ↑ {summary.salidas}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Salidas
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            ${summary.totalSalidasCosto.toFixed(2)} costo
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
            color: summary.margenTotal >= 0 ? 'var(--success)' : 'var(--error)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            ${summary.margenTotal.toFixed(2)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Margen Total
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        padding: '0 2rem',
        maxWidth: '1600px',
        margin: '0 auto',
        marginBottom: '2rem',
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '14px'
            }}
          >
            <option value="">Todos los tipos</option>
            <option value="entrada">Entradas</option>
            <option value="salida">Salidas</option>
            <option value="ajuste">Ajustes</option>
          </select>

          <input
            type="date"
            value={dateRange.start}
            onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
            style={{
              padding: '10px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '14px'
            }}
          />

          <input
            type="date"
            value={dateRange.end}
            onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
            style={{
              padding: '10px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '14px'
            }}
          />
        </div>

        <button
          onClick={() => {
            setShowForm(true)
            setFormData({ ...formData, type: activeTab as 'entrada' | 'salida' | 'ajuste' })
          }}
          style={{
            padding: '10px 16px',
            background: 'var(--accent-orange)',
            color: 'var(--bg-primary)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px'
          }}
        >
          Registrar Movimiento
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <form
            onSubmit={handleSubmit}
            style={{
              background: 'var(--bg-primary)',
              padding: '2rem',
              borderRadius: '4px',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <h2 style={{ marginTop: 0, color: 'var(--text-primary)' }}>
              Registrar Movimiento
            </h2>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Tipo de Movimiento
              </label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="entrada">Entrada (Compra/Devolución)</option>
                <option value="salida">Salida (Venta/Daño)</option>
                <option value="ajuste">Ajuste (Corrección)</option>
              </select>
            </div>

            <div style={{ marginBottom: '1rem', position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Producto
              </label>
              <input
                type="text"
                value={searchProducts}
                onChange={handleProductSearch}
                placeholder="Buscar por clave o nombre..."
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  boxSizing: 'border-box'
                }}
              />
              {productSuggestions.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderTop: 'none',
                  borderRadius: '0 0 4px 4px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 1001
                }}>
                  {productSuggestions.map(prod => (
                    <div
                      key={prod.id}
                      onClick={() => handleSelectProduct(prod)}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border-color)',
                        fontSize: '13px',
                        color: 'var(--text-primary)'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'var(--bg-primary)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'var(--bg-secondary)'
                      }}
                    >
                      <strong>{prod.clave}</strong> - {prod.name}
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Stock: {prod.stock} | Costo: ${prod.costPrice.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Cantidad
              </label>
              <input
                type="number"
                min="1"
                value={formData.qty}
                onChange={e => setFormData({ ...formData, qty: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Razón/Observaciones
              </label>
              <textarea
                value={formData.reason}
                onChange={e => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Ej: Compra a Proveedor X, Daño en transporte, etc."
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  minHeight: '60px'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Referencia (Factura, OC, etc.)
              </label>
              <input
                type="text"
                value={formData.reference}
                onChange={e => setFormData({ ...formData, reference: e.target.value })}
                placeholder="Ej: FAC-2024-001234"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '2rem'
            }}>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setFormData({
                    productId: '',
                    productName: '',
                    type: 'entrada',
                    qty: '',
                    reason: '',
                    reference: ''
                  })
                  setSearchProducts('')
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'var(--border-color)',
                  color: 'var(--text-primary)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'var(--accent-orange)',
                  color: 'var(--bg-primary)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Registrar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Movements List */}
      <div style={{
        padding: '0 2rem',
        maxWidth: '1600px',
        margin: '0 auto',
        marginBottom: '2rem'
      }}>
        {isLoading ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: 'var(--text-secondary)',
            background: 'var(--bg-primary)',
            borderRadius: '4px'
          }}>
            Cargando movimientos...
          </div>
        ) : filteredMovements.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: 'var(--text-secondary)',
            background: 'var(--bg-primary)',
            borderRadius: '4px'
          }}>
            No hay movimientos para mostrar
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {filteredMovements.map(movement => (
              <div
                key={movement.id}
                style={{
                  background: 'var(--bg-primary)',
                  border: `2px solid ${typeColors[movement.type]}`,
                  borderRadius: '4px',
                  padding: '1rem',
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto',
                  gap: '1rem',
                  alignItems: 'center'
                }}
              >
                <div style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: typeColors[movement.type],
                  textAlign: 'center',
                  minWidth: '50px'
                }}>
                  {movement.type === 'entrada' && '↓'}
                  {movement.type === 'salida' && '↑'}
                  {movement.type === 'ajuste' && '↔'}
                </div>

                <div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--text-primary)'
                  }}>
                    {movement.product.name}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    marginTop: '0.25rem'
                  }}>
                    {movement.product.clave} • {movement.product.category}
                  </div>
                  {movement.reason && (
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      marginTop: '0.25rem'
                    }}>
                      {movement.reason}
                    </div>
                  )}
                  {movement.reference && (
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      marginTop: '0.25rem'
                    }}>
                      Ref: {movement.reference}
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: typeColors[movement.type]
                  }}>
                    {movement.type === 'salida' ? '−' : '+'}{movement.qty} pz
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    marginTop: '0.25rem'
                  }}>
                    ${(movement.qty * movement.product.costPrice).toFixed(2)} costo
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    marginTop: '0.25rem'
                  }}>
                    {new Date(movement.createdAt).toLocaleString('es-MX')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
