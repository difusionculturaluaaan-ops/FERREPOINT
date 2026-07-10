'use client'

import { useState, useEffect } from 'react'
import { actionGetProducts, actionCreateSale } from '@/features/pos/server'

interface Product {
  id: string
  name: string
  clave: string
  category: string
  price: number
  stock: number
}

interface CartItem {
  product: Product
  qty: number
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingSale, setIsCreatingSale] = useState(false)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [locationId, setLocationId] = useState<string | null>(null)
  const [vendorId, setVendorId] = useState<string | null>(null)

  useEffect(() => {
    loadContext()
  }, [])

  const loadContext = async () => {
    try {
      const res = await fetch('/api/pos/context')
      const data = await res.json()
      if (data.error) {
        alert(data.error)
        return
      }
      setBusinessId(data.businessId)
      setLocationId(data.locationId)
      setVendorId(data.vendorId)
    } catch (error) {
      alert('Error cargando contexto')
    }
  }

  useEffect(() => {
    if (businessId) {
      loadProducts()
    }
  }, [search, businessId])

  const loadProducts = async () => {
    setIsLoading(true)
    const prods = await actionGetProducts(businessId, search || undefined)
    setProducts(prods)
    setIsLoading(false)
  }

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.product.id === product.id)
    if (existing) {
      if (existing.qty < product.stock) {
        setCart(cart.map(item =>
          item.product.id === product.id
            ? { ...item, qty: item.qty + 1 }
            : item
        ))
      }
    } else {
      setCart([...cart, { product, qty: 1 }])
    }
  }

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId)
    } else {
      const product = products.find(p => p.id === productId)
      if (product && qty <= product.stock) {
        setCart(cart.map(item =>
          item.product.id === productId ? { ...item, qty } : item
        ))
      }
    }
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId))
  }

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0)
    const iva = subtotal * 0.16
    return { subtotal, iva, total: subtotal + iva }
  }

  const handleCheckout = async () => {
    if (cart.length === 0) return
    setIsCreatingSale(true)
    try {
      const result = await actionCreateSale(
        businessId,
        locationId,
        vendorId,
        cart.map(item => ({ productId: item.product.id, qty: item.qty }))
      )
      if (result.success) {
        alert(`✓ ${result.sale.message}`)
        setCart([])
        await loadProducts()
      }
    } catch (error) {
      alert('Error al crear venta')
    }
    setIsCreatingSale(false)
  }

  const { subtotal, iva, total } = calculateTotal()

  if (!businessId || !locationId || !vendorId) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>⏳ Cargando contexto...</h1>
        <p>Si esta página no carga, asegúrate de haber ejecutado el seed primero.</p>
        <a href="/" style={{ color: '#E8610A', textDecoration: 'underline' }}>
          Volver al inicio
        </a>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1rem', height: '100vh', padding: '1rem', background: '#f5f5f5' }}>
      {/* Products side */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '1rem' }}>📊 POS</h1>
          <input
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '6px'
            }}
          />
        </div>

        <div style={{
          flex: 1,
          overflow: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '1rem'
        }}>
          {isLoading ? (
            <div>Cargando...</div>
          ) : (
            products.map(product => (
              <div
                key={product.id}
                style={{
                  background: '#fff',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => addToCart(product)}
              >
                <h3 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  {product.name.substring(0, 30)}
                </h3>
                <p style={{ fontSize: '11px', color: '#666', marginBottom: '0.5rem' }}>
                  {product.clave}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#E8610A' }}>
                    ${product.price.toFixed(2)}
                  </span>
                  <span style={{ fontSize: '11px', background: '#f0f0f0', padding: '2px 6px', borderRadius: '4px' }}>
                    {product.stock}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Cart side */}
      <div style={{
        background: '#fff',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #ddd' }}>
          <h2 style={{ fontSize: '18px', margin: 0 }}>🛒 Carrito</h2>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {cart.length === 0 ? (
            <p style={{ color: '#999', fontSize: '14px' }}>Vacío</p>
          ) : (
            cart.map(item => (
              <div
                key={item.product.id}
                style={{
                  background: '#f9f9f9',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  {item.product.name.substring(0, 20)}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <button
                    onClick={() => updateQty(item.product.id, item.qty - 1)}
                    style={{
                      background: '#E8610A',
                      color: '#fff',
                      border: 'none',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={item.qty}
                    onChange={e => updateQty(item.product.id, parseInt(e.target.value) || 0)}
                    style={{
                      width: '40px',
                      padding: '2px',
                      textAlign: 'center',
                      fontSize: '12px'
                    }}
                  />
                  <button
                    onClick={() => updateQty(item.product.id, item.qty + 1)}
                    style={{
                      background: '#E8610A',
                      color: '#fff',
                      border: 'none',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    style={{
                      background: '#d32f2f',
                      color: '#fff',
                      border: 'none',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      marginLeft: 'auto'
                    }}
                  >
                    ✕
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
                  <span>${item.product.price.toFixed(2)} x {item.qty}</span>
                  <span style={{ fontWeight: 'bold', color: '#000' }}>
                    ${(item.product.price * item.qty).toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: '1rem', borderTop: '1px solid #ddd', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
            <span>IVA (16%):</span>
            <span>${iva.toFixed(2)}</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '16px',
            fontWeight: 'bold',
            paddingTop: '0.75rem',
            borderTop: '1px solid #ddd'
          }}>
            <span>Total:</span>
            <span style={{ color: '#E8610A' }}>${total.toFixed(2)}</span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isCreatingSale}
            style={{
              background: cart.length === 0 ? '#ccc' : '#2B2F35',
              color: '#fff',
              border: 'none',
              padding: '12px',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              marginTop: '0.5rem'
            }}
          >
            {isCreatingSale ? '⏳ Procesando...' : '✓ Cobrar'}
          </button>
        </div>
      </div>
    </div>
  )
}
