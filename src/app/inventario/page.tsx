'use client'

import { useState, useEffect } from 'react'
import {
  actionGetProducts,
  actionCreateProduct,
  actionUpdateProduct,
  actionDeleteProduct,
  actionGetInventorySummary
} from '@/features/inventario/server'
import { ThemeToggle } from '@/components/ThemeToggle'

interface Product {
  id: string
  clave: string
  name: string
  category: string
  costPrice: number
  price: number
  margin: number
  stock: number
  minStock: number
  unit: string
  active: boolean
  image?: any
  supplier?: any
}

interface Summary {
  totalProducts: number
  lowStock: number
  totalInventoryValue: number
  totalRetailValue: number
  avgMargin: number
}

export default function InventarioPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [summary, setSummary] = useState<Summary>({
    totalProducts: 0,
    lowStock: 0,
    totalInventoryValue: 0,
    totalRetailValue: 0,
    avgMargin: 0
  })
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [locationId, setLocationId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    clave: '',
    name: '',
    category: '',
    price: '',
    costPrice: '',
    stock: '',
    minStock: '',
    unit: 'pz'
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
  }, [businessId, locationId, search])

  const loadData = async () => {
    setIsLoading(true)
    const prods = await actionGetProducts(businessId!, locationId, search)
    setProducts(prods)
    const sum = await actionGetInventorySummary(businessId!)
    setSummary(sum)
    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const data = {
      clave: formData.clave,
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price) || 0,
      costPrice: parseFloat(formData.costPrice) || 0,
      stock: parseInt(formData.stock) || 0,
      minStock: parseInt(formData.minStock) || 0,
      unit: formData.unit
    }

    if (editingId) {
      const result = await actionUpdateProduct(editingId, data)
      if (result.success) {
        setShowForm(false)
        setEditingId(null)
        setFormData({
          clave: '',
          name: '',
          category: '',
          price: '',
          costPrice: '',
          stock: '',
          minStock: '',
          unit: 'pz'
        })
        await loadData()
      } else {
        alert(result.error || 'Error al actualizar')
      }
    } else {
      const result = await actionCreateProduct(businessId!, locationId!, data)
      if (result.success) {
        setShowForm(false)
        setFormData({
          clave: '',
          name: '',
          category: '',
          price: '',
          costPrice: '',
          stock: '',
          minStock: '',
          unit: 'pz'
        })
        await loadData()
      } else {
        alert(result.error || 'Error al crear')
      }
    }
  }

  const handleEdit = (product: Product) => {
    setEditingId(product.id)
    setFormData({
      clave: product.clave,
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      costPrice: product.costPrice.toString(),
      stock: product.stock.toString(),
      minStock: product.minStock.toString(),
      unit: product.unit
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar este producto?')) {
      const result = await actionDeleteProduct(id)
      if (result.success) {
        await loadData()
      } else {
        alert(result.error || 'Error al eliminar')
      }
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({
      clave: '',
      name: '',
      category: '',
      price: '',
      costPrice: '',
      stock: '',
      minStock: '',
      unit: 'pz'
    })
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
          Inventario
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
          <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--accent-orange)' }}>
            {summary.totalProducts}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Productos Activos
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
            {summary.lowStock}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Stock Bajo
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
            ${summary.totalInventoryValue.toFixed(2)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Valor Costo Total
          </div>
        </div>

        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--success)' }}>
            ${summary.totalRetailValue.toFixed(2)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Valor Venta Total
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
            {summary.avgMargin.toFixed(1)}%
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Margen Promedio
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
        <input
          type="text"
          placeholder="Buscar por nombre o clave..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1,
            padding: '10px 12px',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontSize: '14px'
          }}
        />
        <button
          onClick={() => {
            setShowForm(true)
            setEditingId(null)
            setFormData({
              clave: '',
              name: '',
              category: '',
              price: '',
              costPrice: '',
              stock: '',
              minStock: '',
              unit: 'pz'
            })
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
          Nuevo Producto
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
              {editingId ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Clave
              </label>
              <input
                type="text"
                value={formData.clave}
                onChange={e => setFormData({ ...formData, clave: e.target.value })}
                required
                disabled={!!editingId}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  opacity: editingId ? 0.6 : 1
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Nombre
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
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
                Categoría
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Precio Costo
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={e => setFormData({ ...formData, costPrice: e.target.value })}
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
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Precio Venta
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
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
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Stock
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={e => setFormData({ ...formData, stock: e.target.value })}
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
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Stock Mínimo
                </label>
                <input
                  type="number"
                  value={formData.minStock}
                  onChange={e => setFormData({ ...formData, minStock: e.target.value })}
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
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Unidad
              </label>
              <select
                value={formData.unit}
                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="pz">Pieza</option>
                <option value="kg">Kilogramo</option>
                <option value="l">Litro</option>
                <option value="m">Metro</option>
                <option value="m2">Metro Cuadrado</option>
              </select>
            </div>

            <div style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '2rem'
            }}>
              <button
                type="button"
                onClick={handleCancel}
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
                {editingId ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Table */}
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
            Cargando productos...
          </div>
        ) : products.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: 'var(--text-secondary)',
            background: 'var(--bg-primary)',
            borderRadius: '4px'
          }}>
            No hay productos para mostrar
          </div>
        ) : (
          <div style={{
            overflowX: 'auto',
            background: 'var(--bg-primary)',
            borderRadius: '4px',
            border: '1px solid var(--border-color)'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)'
                }}>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Clave
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Nombre
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Categoría
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'right',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Costo
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'right',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Venta
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'right',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Margen
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Stock
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Mín.
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr
                    key={product.id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      backgroundColor: product.stock <= product.minStock ? 'rgba(220, 38, 38, 0.05)' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '1rem', fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500' }}>
                      {product.clave}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '14px', color: 'var(--text-primary)' }}>
                      {product.name}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '14px', color: 'var(--text-secondary)' }}>
                      {product.category}
                    </td>
                    <td style={{
                      padding: '1rem',
                      fontSize: '14px',
                      color: 'var(--text-primary)',
                      textAlign: 'right',
                      fontWeight: '500'
                    }}>
                      ${product.costPrice.toFixed(2)}
                    </td>
                    <td style={{
                      padding: '1rem',
                      fontSize: '14px',
                      color: 'var(--text-primary)',
                      textAlign: 'right',
                      fontWeight: '600'
                    }}>
                      ${product.price.toFixed(2)}
                    </td>
                    <td style={{
                      padding: '1rem',
                      fontSize: '14px',
                      color: 'var(--accent-orange)',
                      textAlign: 'right',
                      fontWeight: '600'
                    }}>
                      {product.margin.toFixed(1)}%
                    </td>
                    <td style={{
                      padding: '1rem',
                      fontSize: '14px',
                      textAlign: 'center',
                      fontWeight: '600',
                      color: product.stock <= product.minStock ? 'var(--error)' : 'var(--success)'
                    }}>
                      {product.stock}
                    </td>
                    <td style={{
                      padding: '1rem',
                      fontSize: '14px',
                      textAlign: 'center',
                      color: 'var(--text-secondary)'
                    }}>
                      {product.minStock}
                    </td>
                    <td style={{
                      padding: '1rem',
                      fontSize: '14px',
                      textAlign: 'center',
                      display: 'flex',
                      gap: '0.5rem',
                      justifyContent: 'center'
                    }}>
                      <button
                        onClick={() => handleEdit(product)}
                        style={{
                          padding: '4px 8px',
                          background: 'var(--accent-orange)',
                          color: 'var(--bg-primary)',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        style={{
                          padding: '4px 8px',
                          background: 'var(--error)',
                          color: 'var(--bg-primary)',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
