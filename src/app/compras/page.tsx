'use client'

import { useState, useEffect } from 'react'
import {
  actionCreatePurchaseOrder,
  actionGetPurchaseOrders,
  actionReceivePurchaseItem,
  actionGetPurchaseSummary
} from '@/features/compras/server'
import { actionGetSuppliers } from '@/features/inventario/server'
import { actionGetProductsForMovement } from '@/features/almacen/server'
import { ThemeToggle } from '@/components/ThemeToggle'

interface Supplier {
  id: string
  name: string
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

interface PurchaseOrderItem {
  id: string
  productId: string
  qty: number
  qtyReceived: number
  product: {
    name: string
    clave: string
    costPrice: number
  }
}

interface PurchaseOrder {
  id: string
  poNumber: string
  status: string
  total: number
  reference?: string
  createdAt: string
  supplier: {
    id: string
    name: string
  }
  items: PurchaseOrderItem[]
}

interface Summary {
  pending: number
  partiallyReceived: number
  completed: number
  totalPending: number
  totalOrders: number
}

export default function ComprasPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [summary, setSummary] = useState<Summary>({
    pending: 0,
    partiallyReceived: 0,
    completed: 0,
    totalPending: 0,
    totalOrders: 0
  })
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [locationId, setLocationId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    supplierId: '',
    reference: '',
    items: [{ productId: '', qty: '' }]
  })
  const [productSearch, setProductSearch] = useState('')
  const [productSuggestions, setProductSuggestions] = useState<Product[]>([])
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])

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
  }, [businessId, locationId, statusFilter, supplierFilter])

  const loadData = async () => {
    setIsLoading(true)
    const sups = await actionGetSuppliers(businessId!)
    setSuppliers(sups as any)

    const orders = await actionGetPurchaseOrders(
      businessId!,
      statusFilter || undefined,
      supplierFilter || undefined
    )
    setPurchaseOrders(orders as any)

    const sum = await actionGetPurchaseSummary(businessId!)
    setSummary(sum)
    setIsLoading(false)
  }

  const handleProductSearch = async (e: React.ChangeEvent<HTMLInputElement>, itemIdx: number) => {
    const value = e.target.value
    setProductSearch(value)

    if (value.length > 0) {
      const products = await actionGetProductsForMovement(businessId!, value)
      setProductSuggestions(products)
    } else {
      setProductSuggestions([])
    }
  }

  const handleSelectProduct = (product: Product, itemIdx: number) => {
    const newItems = [...formData.items]
    newItems[itemIdx].productId = product.id
    setFormData({ ...formData, items: newItems })
    setProductSuggestions([])
    setProductSearch('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.supplierId) {
      alert('Selecciona un proveedor')
      return
    }

    const validItems = formData.items.filter(item => item.productId && item.qty)
    if (validItems.length === 0) {
      alert('Agrega al menos un producto')
      return
    }

    const result = await actionCreatePurchaseOrder(
      businessId!,
      formData.supplierId,
      validItems.map(item => ({
        productId: item.productId,
        qty: parseInt(item.qty)
      })),
      formData.reference || undefined
    )

    if (result.success) {
      setShowForm(false)
      setFormData({
        supplierId: '',
        reference: '',
        items: [{ productId: '', qty: '' }]
      })
      await loadData()
      alert('Orden de compra creada exitosamente')
    } else {
      alert(result.error || 'Error al crear orden')
    }
  }

  const handleReceiveItem = async (poItemId: string, available: number) => {
    const qty = prompt(`Recibir cuántas unidades? (máx ${available})`)
    if (!qty) return

    const qtyNum = parseInt(qty)
    if (isNaN(qtyNum) || qtyNum <= 0 || qtyNum > available) {
      alert('Cantidad inválida')
      return
    }

    const result = await actionReceivePurchaseItem(poItemId, qtyNum)
    if (result.success) {
      await loadData()
      alert('Mercancía recibida y stock actualizado')
    } else {
      alert(result.error || 'Error al recibir')
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
          Compras
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
          <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--error)' }}>
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
          <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--warning)' }}>
            {summary.partiallyReceived}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            En Recepción
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
        </div>

        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--accent-orange)' }}>
            ${summary.totalPending.toFixed(2)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Monto Pendiente
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
            {summary.totalOrders}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Total Órdenes
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
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '14px'
            }}
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="parcialmente_recibido">En Recepción</option>
            <option value="completado">Completadas</option>
          </select>

          <select
            value={supplierFilter}
            onChange={e => setSupplierFilter(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '14px'
            }}
          >
            <option value="">Todos los proveedores</option>
            {suppliers.map(sup => (
              <option key={sup.id} value={sup.id}>
                {sup.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setShowForm(true)}
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
          Nueva Orden de Compra
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
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <h2 style={{ marginTop: 0, color: 'var(--text-primary)' }}>
              Nueva Orden de Compra
            </h2>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Proveedor
              </label>
              <select
                value={formData.supplierId}
                onChange={e => setFormData({ ...formData, supplierId: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="">Selecciona un proveedor</option>
                {suppliers.map(sup => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Referencia (Factura, etc.)
              </label>
              <input
                type="text"
                value={formData.reference}
                onChange={e => setFormData({ ...formData, reference: e.target.value })}
                placeholder="FAC-2024-001234"
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

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Productos
              </label>
              {formData.items.map((item, idx) => (
                <div key={idx} style={{ marginBottom: '0.75rem', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Buscar producto..."
                    value={item.productId ? `Producto ${idx + 1}` : ''}
                    onChange={e => handleProductSearch(e, idx)}
                    style={{
                      padding: '8px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <input
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={e => {
                      const newItems = [...formData.items]
                      newItems[idx].qty = e.target.value
                      setFormData({ ...formData, items: newItems })
                    }}
                    placeholder="Cantidad"
                    style={{
                      padding: '8px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, items: [...formData.items, { productId: '', qty: '' }] })}
                style={{
                  padding: '8px 12px',
                  background: 'var(--border-color)',
                  color: 'var(--text-primary)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  marginTop: '0.5rem'
                }}
              >
                + Agregar producto
              </button>
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
                  setFormData({ supplierId: '', reference: '', items: [{ productId: '', qty: '' }] })
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
                Crear Orden
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Purchase Orders List */}
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
            Cargando órdenes...
          </div>
        ) : purchaseOrders.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: 'var(--text-secondary)',
            background: 'var(--bg-primary)',
            borderRadius: '4px'
          }}>
            No hay órdenes para mostrar
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {purchaseOrders.map(order => (
              <div
                key={order.id}
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  padding: '1.5rem'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid var(--border-color)'
                }}>
                  <div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: 'var(--text-primary)'
                    }}>
                      {order.poNumber}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      marginTop: '0.25rem'
                    }}>
                      {order.supplier.name} • {order.reference}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'var(--accent-orange)'
                    }}>
                      ${order.total.toFixed(2)}
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
                            : order.status === 'parcialmente_recibido'
                            ? '#E3F2FD'
                            : '#E8F5E9',
                        color:
                          order.status === 'pendiente'
                            ? '#9D6C1D'
                            : order.status === 'parcialmente_recibido'
                            ? '#1565C0'
                            : '#2E7D32'
                      }}
                    >
                      {order.status === 'pendiente' && 'Pendiente'}
                      {order.status === 'parcialmente_recibido' && 'En Recepción'}
                      {order.status === 'completado' && 'Completado'}
                      {order.status === 'cancelado' && 'Cancelado'}
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  {order.items.map(item => {
                    const remaining = item.qty - item.qtyReceived
                    return (
                      <div
                        key={item.id}
                        style={{
                          background: 'var(--bg-secondary)',
                          padding: '1rem',
                          borderRadius: '4px',
                          display: 'grid',
                          gridTemplateColumns: '1fr auto auto',
                          gap: '1rem',
                          alignItems: 'center'
                        }}
                      >
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
                            {item.product.clave} • ${item.product.costPrice.toFixed(2)}
                          </div>
                        </div>

                        <div style={{
                          textAlign: 'center',
                          minWidth: '100px'
                        }}>
                          <div style={{
                            fontSize: '12px',
                            color: 'var(--text-secondary)'
                          }}>
                            {item.qtyReceived}/{item.qty}
                          </div>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: remaining > 0 ? 'var(--error)' : 'var(--success)',
                            marginTop: '0.25rem'
                          }}>
                            {remaining} pendientes
                          </div>
                        </div>

                        {remaining > 0 && order.status !== 'cancelado' && (
                          <button
                            onClick={() => handleReceiveItem(item.id, remaining)}
                            style={{
                              padding: '6px 12px',
                              background: 'var(--success)',
                              color: 'var(--bg-primary)',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}
                          >
                            Recibir
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
