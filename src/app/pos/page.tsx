'use client'

import { useState, useEffect } from 'react'
import { actionGetProducts, actionCreateSale } from '@/features/pos/server'
import { actionCreateDelivery, actionGetAvailableDrivers } from '@/features/entregas/server'
import { ThemeToggle } from '@/components/ThemeToggle'

interface ProductImage {
  id: string
  name: string
  category: string
  imageUrl: string
}

interface Product {
  id: string
  name: string
  clave: string
  category: string
  price: number
  costPrice: number
  stock: number
  image?: ProductImage | null
}

interface CartItem {
  product: Product
  qty: number
}

interface Driver {
  id: string
  name: string
  email: string
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
  const [showCheckout, setShowCheckout] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('efectivo')
  const [comprobante, setComprobante] = useState('completo')
  const [clientName, setClientName] = useState('')
  const [clientRfc, setClientRfc] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [selectedDriver, setSelectedDriver] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [lastSale, setLastSale] = useState<any>(null)

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

      const drv = await actionGetAvailableDrivers(data.businessId, data.locationId)
      setDrivers(drv as any)
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

  const handleCheckout = () => {
    if (cart.length === 0) return
    setShowCheckout(true)
  }

  const handlePrintReceipt = () => {
    const content = `
FERREPOINT - RECIBO DE VENTA
================================
Fecha: ${new Date().toLocaleString('es-MX')}

${clientName ? `Cliente: ${clientName}\n` : ''}${clientRfc ? `RFC: ${clientRfc}\n` : ''}

ARTÍCULOS:
${cart.map(item => `
${item.product.clave} - ${item.product.name}
$${item.product.price.toFixed(2)} × ${item.qty} = $${(item.product.price * item.qty).toFixed(2)}
Costo: $${item.product.costPrice.toFixed(2)} × ${item.qty}
`).join('')}

Subtotal: $${subtotal.toFixed(2)}
IVA (16%): $${iva.toFixed(2)}
TOTAL: $${total.toFixed(2)}

Forma de pago: TARJETA
Comprobante: ${comprobante === 'completo' ? 'COMPLETO' : comprobante === 'resumido' ? 'RESUMIDO' : 'SIN PAPEL'}

================================
    `.trim()

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write('<pre style="font-family: monospace; font-size: 12px;">' + content + '</pre>')
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleCompleteSale = async () => {
    if (cart.length === 0) return
    setIsCreatingSale(true)
    try {
      const result = await actionCreateSale(
        businessId,
        locationId,
        vendorId,
        cart.map(item => ({ productId: item.product.id, qty: item.qty })),
        clientName || undefined,
        clientRfc || undefined,
        paymentMethod,
        comprobante
      )

      if (result.success) {
        setLastSale(result.sale)

        // Crear entrega si se seleccionó conductor
        if (selectedDriver && deliveryAddress) {
          await actionCreateDelivery(
            businessId,
            locationId,
            selectedDriver,
            result.sale.id,
            clientName || 'Cliente sin nombre',
            clientPhone || '000-0000',
            deliveryAddress
          )
        }

        // Imprimir si se seleccionó
        if (comprobante !== 'sin') {
          handlePrintReceipt()
        }

        alert(`✓ ${result.sale.message}`)
        setCart([])
        setShowCheckout(false)
        setClientName('')
        setClientRfc('')
        setClientPhone('')
        setSelectedDriver('')
        setDeliveryAddress('')
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
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-secondary)',
        padding: '2rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Cargando contexto...
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Si esta página no carga, asegúrate de haber ejecutado el seed primero.
          </p>
          <a href="/" style={{ color: 'var(--accent-orange)', textDecoration: 'none', fontWeight: '500' }}>
            Volver al inicio
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 380px',
      gap: '0',
      height: '100vh',
      background: 'var(--bg-secondary)'
    }}>
      {/* Products Section */}
      <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-color)' }}>
        {/* Header */}
        <div style={{
          background: 'var(--bg-primary)',
          borderBottom: '1px solid var(--border-color)',
          padding: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            margin: '0'
          }}>
            Punto de Venta
          </h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <ThemeToggle />
            <a
              href="/"
              style={{
                fontSize: '13px',
                color: 'var(--accent-orange)',
                textDecoration: 'none',
                fontWeight: '500'
              }}
            >
              Volver
            </a>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '1rem', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '14px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              boxSizing: 'border-box',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Products Grid */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '0.75rem',
          padding: '0.75rem',
          background: 'var(--bg-secondary)',
          gridAutoRows: 'max-content'
        } as React.CSSProperties}>
          {isLoading ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
              Cargando productos...
            </div>
          ) : products.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
              No se encontraron productos
            </div>
          ) : (
            products.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent-orange)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-color)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {/* Product Image */}
                <div style={{
                  width: '100%',
                  height: '100px',
                  background: 'var(--bg-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  borderRadius: '4px 4px 0 0'
                }}>
                  {product.image?.imageUrl ? (
                    <img
                      src={product.image.imageUrl}
                      alt={product.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={e => {
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.parentElement!.textContent = 'Sin imagen'
                      }}
                    />
                  ) : (
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      textAlign: 'center',
                      padding: '0.5rem'
                    }}>
                      Sin imagen
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    lineHeight: '1.2'
                  }}>
                    {product.name}
                  </div>
                  <div style={{
                    fontSize: '9px',
                    color: 'var(--text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {product.clave}
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '0.35rem',
                    borderTop: '1px solid var(--border-color)',
                    gap: '0.25rem'
                  }}>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'var(--accent-orange)',
                      flex: 1
                    }}>
                      ${product.price.toFixed(2)}
                    </span>
                    <span style={{
                      fontSize: '9px',
                      background: 'var(--bg-secondary)',
                      color: 'var(--accent-orange)',
                      padding: '1px 4px',
                      borderRadius: '2px',
                      fontWeight: '500',
                      whiteSpace: 'nowrap'
                    }}>
                      {product.stock}
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Cart Section */}
      <div style={{
        background: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}>
        {/* Cart Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-primary)'
        }}>
          <h2 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            margin: '0'
          }}>
            Carrito
          </h2>
          <div style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            marginTop: '0.25rem'
          }}>
            {cart.length} artículo{cart.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Cart Items */}
        <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
          {cart.length === 0 ? (
            <div style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              fontSize: '14px'
            }}>
              Carrito vacío
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {cart.map(item => (
                <div
                  key={item.product.id}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    padding: '0.75rem',
                    fontSize: '13px'
                  }}
                >
                  <div style={{
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {item.product.name}
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    alignItems: 'center'
                  }}>
                    <button
                      onClick={() => updateQty(item.product.id, item.qty - 1)}
                      style={{
                        background: 'var(--accent-orange)',
                        color: '#fff',
                        border: 'none',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={item.qty}
                      onChange={e => updateQty(item.product.id, parseInt(e.target.value) || 0)}
                      style={{
                        width: '40px',
                        padding: '2px 4px',
                        textAlign: 'center',
                        fontSize: '12px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '3px'
                      }}
                    />
                    <button
                      onClick={() => updateQty(item.product.id, item.qty + 1)}
                      style={{
                        background: 'var(--accent-orange)',
                        color: '#fff',
                        border: 'none',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      style={{
                        background: '#EA4335',
                        color: '#fff',
                        border: 'none',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                        marginLeft: 'auto'
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: 'var(--text-secondary)',
                    fontSize: '12px'
                  }}>
                    <span>${item.product.price.toFixed(2)} × {item.qty}</span>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                      ${(item.product.price * item.qty).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-primary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '13px',
            color: 'var(--text-secondary)'
          }}>
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '13px',
            color: 'var(--text-secondary)'
          }}>
            <span>IVA (16%)</span>
            <span>${iva.toFixed(2)}</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '15px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-color)'
          }}>
            <span>Total</span>
            <span style={{ color: 'var(--accent-orange)' }}>${total.toFixed(2)}</span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isCreatingSale}
            style={{
              background: cart.length === 0 ? 'var(--border-color)' : 'var(--success)',
              color: '#fff',
              border: 'none',
              padding: '12px',
              borderRadius: '4px',
              fontWeight: '600',
              cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              marginTop: '0.5rem',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => cart.length > 0 && (e.currentTarget.style.background = '#2D7A3A')}
            onMouseLeave={e => cart.length > 0 && (e.currentTarget.style.background = 'var(--success)')}
          >
            {isCreatingSale ? 'Procesando transacción...' : 'Cobrar'}
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
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
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: '8px',
            padding: '2rem',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 1.5rem 0' }}>
              Venta Actual
            </h2>

            {/* Cliente Info */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                Cliente (opcional)
              </label>
              <input
                type="text"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="Nombre del cliente"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  marginBottom: '0.5rem',
                  boxSizing: 'border-box'
                }}
              />
              <input
                type="text"
                value={clientRfc}
                onChange={e => setClientRfc(e.target.value)}
                placeholder="RFC"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  marginBottom: '0.75rem',
                  boxSizing: 'border-box'
                }}
              />
              <input
                type="tel"
                value={clientPhone}
                onChange={e => setClientPhone(e.target.value)}
                placeholder="Teléfono / WhatsApp (opcional)"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Forma de Pago */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.75rem' }}>
                FORMA DE PAGO
              </label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {[
                  { value: 'efectivo', label: '💵 Efectivo' },
                  { value: 'transferencia', label: '🏦 Transferencia' },
                  { value: 'tarjeta', label: '💳 Tarjeta' }
                ].map(method => (
                  <button
                    key={method.value}
                    onClick={() => setPaymentMethod(method.value)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: paymentMethod === method.value ? 'var(--accent-orange)' : 'var(--bg-secondary)',
                      color: paymentMethod === method.value ? '#fff' : 'var(--text-primary)',
                      border: `1px solid ${paymentMethod === method.value ? 'var(--accent-orange)' : 'var(--border-color)'}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '12px'
                    }}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Comprobante */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.75rem' }}>
                COMPROBANTE
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[
                  { value: 'completo', label: '✓ Completo' },
                  { value: 'resumido', label: 'Resumido' },
                  { value: 'whatsapp', label: 'WhatsApp' },
                  { value: 'sin', label: 'Sin papel' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setComprobante(opt.value)}
                    style={{
                      padding: '8px 12px',
                      background: comprobante === opt.value ? 'var(--success)' : 'var(--bg-secondary)',
                      color: comprobante === opt.value ? '#fff' : 'var(--text-primary)',
                      border: `1px solid ${comprobante === opt.value ? 'var(--success)' : 'var(--border-color)'}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '12px'
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Entrega */}
            <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                Entregar a Domicilio (opcional)
              </label>
              <select
                value={selectedDriver}
                onChange={e => setSelectedDriver(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  marginBottom: '0.5rem',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">Sin entrega</option>
                {drivers.map(driver => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name}
                  </option>
                ))}
              </select>
              {selectedDriver && (
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={e => setDeliveryAddress(e.target.value)}
                  placeholder="Dirección de entrega"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              )}
            </div>

            {/* Totals */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '14px',
                marginBottom: '0.5rem'
              }}>
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
                <span style={{ color: 'var(--text-primary)' }}>${subtotal.toFixed(2)}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '14px',
                marginBottom: '1rem'
              }}>
                <span style={{ color: 'var(--text-secondary)' }}>IVA (16%):</span>
                <span style={{ color: 'var(--text-primary)' }}>${iva.toFixed(2)}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '16px',
                fontWeight: '600',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-color)'
              }}>
                <span style={{ color: 'var(--text-primary)' }}>TOTAL:</span>
                <span style={{ color: 'var(--accent-orange)' }}>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowCheckout(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'var(--border-color)',
                  color: 'var(--text-primary)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCompleteSale}
                disabled={isCreatingSale}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'var(--accent-orange)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isCreatingSale ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  opacity: isCreatingSale ? 0.7 : 1
                }}
              >
                {isCreatingSale ? 'PROCESANDO...' : `COBRAR - $${total.toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
