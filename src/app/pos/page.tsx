'use client';

import React, { useState, useEffect, useRef } from 'react';
import { actionGetProducts, actionCreateOrder, actionGetPaidOrders, actionGetBusinessConfig, actionProcessPayment } from '@/features/pos/server';
import { actionGetBusinessPlan } from '@/features/auth/server';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LogoutButton } from '@/components/LogoutButton';
import { DashboardButton } from '@/components/DashboardButton';
import { Product, CartItem, POSFormData as FormData, Sale } from '@/types';

interface UserData {
  businessId: string;
  locationId: string;
  vendorId: string;
  email: string;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<FormData>({
    clientName: '',
    clientPhone: '',
    deliveryType: 'mostrador',
    clientAddress: '',
    paymentMethod: 'efectivo',
    comprobante: 'whatsapp',
  });
  const [lastWhatsAppUrl, setLastWhatsAppUrl] = useState<string>('');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [successFolio, setSuccessFolio] = useState('');
  const [paidOrders, setPaidOrders] = useState<Sale[]>([]);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [showFullCartModal, setShowFullCartModal] = useState(false);
  const [cartSearchTerm, setCartSearchTerm] = useState('');
  const [ordersSearchTerm, setOrdersSearchTerm] = useState('');
  const [ordersPage, setOrdersPage] = useState(0);
  const [requiresCajero, setRequiresCajero] = useState(false);
  const ordersPerPage = 5;
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastOrderCountRef = useRef(0);
  const cartItemsRef = useRef<HTMLDivElement>(null);

  const getTimeSinceCreation = (date: Date): string => {
    const now = new Date();
    const secondsAgo = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

    if (secondsAgo < 60) return `hace ${secondsAgo}s`;
    if (secondsAgo < 3600) return `hace ${Math.floor(secondsAgo / 60)}m`;
    return `hace ${Math.floor(secondsAgo / 3600)}h`;
  };

  const getFormattedDate = (date: Date): string => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const getAvailableStock = (productId: string): number => {
    const product = products.find((p) => p.id === productId);
    if (!product) return 0;
    const cartQty = cart.find((item) => item.productId === productId)?.qty || 0;
    return product.stock - cartQty;
  };

  const filteredOrders = paidOrders.filter((order) => {
    const searchLower = ordersSearchTerm.toLowerCase();
    return (
      order.folio.toLowerCase().includes(searchLower) ||
      (order.clientName && order.clientName.toLowerCase().includes(searchLower))
    );
  });

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const paginatedOrders = filteredOrders.slice(
    ordersPage * ordersPerPage,
    (ordersPage + 1) * ordersPerPage
  );

  const pollPaidOrders = async () => {
    if (!userData) return;

    try {
      const orders = await actionGetPaidOrders(userData.businessId, userData.vendorId);
      setPaidOrders(orders);

      // Check if new order became paid
      if (orders.length > lastOrderCountRef.current && lastOrderCountRef.current > 0) {
        setNotificationMessage(`¡Nueva orden pagada! ${orders[0]?.folio || ''}`);
        setTimeout(() => setNotificationMessage(''), 4000);
      }

      lastOrderCountRef.current = orders.length;
    } catch (err) {
      console.error('Error polling paid orders:', err);
    }
  };

  useEffect(() => {
    const initializePage = async () => {
      try {
        const userJSON = localStorage.getItem('user');
        if (!userJSON) {
          setError('Usuario no autenticado');
          setLoading(false);
          return;
        }

        const user = JSON.parse(userJSON) as UserData;

        // Get businessId from localStorage (saved by login page from JWT)
        const businessId = localStorage.getItem('businessId');
        if (businessId) {
          user.businessId = businessId;
        }

        setUserData(user);

        // Get business plan
        const planResult = await actionGetBusinessPlan(user.businessId);
        if (planResult.success) {
          localStorage.setItem('plan', planResult.plan);
          console.log('Plan saved:', planResult.plan);
        }

        // Get business config (requiresCajero)
        const configResult = await actionGetBusinessConfig(user.businessId);
        if (configResult.success) {
          setRequiresCajero(configResult.requiresCajero);
        }

        const productsData = await actionGetProducts(user.businessId, user.locationId);
        setProducts(productsData);
        setFilteredProducts(productsData);

        // Initial load of paid orders
        const initialOrders = await actionGetPaidOrders(user.businessId, user.vendorId);
        setPaidOrders(initialOrders);
        lastOrderCountRef.current = initialOrders.length;

        setLoading(false);
      } catch (err) {
        console.error('Error initializing POS:', err);
        setError('Error al cargar los productos');
        setLoading(false);
      }
    };

    initializePage();
  }, []);

  // Polling effect for paid orders
  useEffect(() => {
    if (!userData) return;

    // Initial poll
    pollPaidOrders();

    // Set up interval polling (3 seconds)
    pollingIntervalRef.current = setInterval(() => {
      pollPaidOrders();
    }, 3000);

    // Cleanup interval on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [userData]);

  // Auto-scroll cart when items added
  useEffect(() => {
    if (cartItemsRef.current && cart.length > 0) {
      setTimeout(() => {
        if (cartItemsRef.current) {
          cartItemsRef.current.scrollTop = cartItemsRef.current.scrollHeight;
        }
      }, 0);
    }
  }, [cart]);

  useEffect(() => {
    const lowercaseSearch = searchTerm.toLowerCase();
    const filtered = products.filter(
      (p) =>
        p.name.toLowerCase().includes(lowercaseSearch) ||
        p.clave.toLowerCase().includes(lowercaseSearch) ||
        p.category.toLowerCase().includes(lowercaseSearch)
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      setError(`${product.name} está agotado`);
      return;
    }

    const existingItem = cart.find((item) => item.productId === product.id);

    if (existingItem) {
      if (existingItem.qty >= product.stock) {
        setError(`No hay stock suficiente de ${product.name}`);
        return;
      }
      const updatedCart = cart.map((item) =>
        item.productId === product.id
          ? {
              ...item,
              qty: item.qty + 1,
              subtotal: (item.qty + 1) * item.price,
            }
          : item
      );
      setCart(updatedCart);
    } else {
      const newItem: CartItem = {
        productId: product.id,
        clave: product.clave,
        name: product.name,
        price: product.price,
        qty: 1,
        subtotal: product.price,
      };
      setCart([...cart, newItem]);
    }

    setError('');
  };

  const handleRemoveFromCart = (productId: string) => {
    const updatedCart = cart.filter((item) => item.productId !== productId);
    setCart(updatedCart);
  };

  const handleQuantityChange = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveFromCart(productId);
      return;
    }

    const product = products.find((p) => p.id === productId);
    if (product && newQty > product.stock) {
      setError(`Stock máximo de ${product.name}: ${product.stock}`);
      return;
    }

    const updatedCart = cart.map((item) =>
      item.productId === productId
        ? {
            ...item,
            qty: newQty,
            subtotal: newQty * item.price,
          }
        : item
    );
    setCart(updatedCart);
    setError('');
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = subtotal * 0.16;
  const total = subtotal + tax;

  const buildWhatsAppUrl = (folio: string, clientName: string, phone: string, totalAmt: number, itemsList: CartItem[], method: string) => {
    const cleanPhone = (phone || '').replace(/\D/g, '');
    const formattedItems = itemsList.map(i => `• ${i.qty}x ${i.name} ($${i.subtotal.toFixed(2)})`).join('\n');
    const msg = `*FERREPOINT* — Comprobante de Venta 🧾\n\n` +
      `*Folio:* #${folio}\n` +
      `*Cliente:* ${clientName || 'Cliente Mostrador'}\n` +
      `*Forma de Pago:* ${method.toUpperCase()}\n\n` +
      `*Productos:*\n${formattedItems}\n\n` +
      `*Total:* $${totalAmt.toFixed(2)}\n\n` +
      `¡Gracias por tu preferencia en Ferretería Centro! 🏗️`;
    const encoded = encodeURIComponent(msg);
    return cleanPhone ? `https://wa.me/52${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userData) {
      setError('Usuario no autenticado');
      return;
    }

    if (cart.length === 0) {
      setError('El carrito está vacío');
      return;
    }

    if (formData.deliveryType !== 'mostrador' && !formData.clientAddress.trim()) {
      setError('Por favor ingresa la dirección de entrega');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const items = cart.map((item) => ({
        productId: item.productId,
        qty: item.qty,
        price: item.price,
        subtotal: item.subtotal,
      }));

      const response = await actionCreateOrder(
        userData.businessId,
        userData.locationId,
        userData.vendorId,
        items,
        formData.clientName || 'Cliente Mostrador',
        formData.clientPhone || undefined,
        formData.clientAddress || undefined,
        formData.deliveryType,
        formData.paymentMethod,
        formData.comprobante
      );

      if (response.success && response.sale) {
        const folioStr = response.sale.folio || 'N/A';
        const waUrl = buildWhatsAppUrl(
          folioStr,
          formData.clientName || 'Cliente Mostrador',
          formData.clientPhone || '',
          total,
          cart,
          formData.paymentMethod
        );
        setLastWhatsAppUrl(waUrl);

        // Si no requiere cajero, procesar pago inmediatamente
        if (!requiresCajero && response.sale?.id) {
          const paymentResult = await actionProcessPayment(
            response.sale.id,
            formData.paymentMethod,
            userData.vendorId,
            formData.comprobante
          );

          if (paymentResult.success) {
            setSuccessFolio(folioStr);
            setSuccessMessage(`✓ Venta completada. Folio: #${folioStr}`);
          } else {
            setError('Orden creada pero error al procesar pago');
          }
        } else {
          setSuccessFolio(folioStr);
          setSuccessMessage(`Orden creada. Folio: #${folioStr}`);
        }

        // Si eligió comprobante por WhatsApp, abrirlo automáticamente
        if (formData.comprobante === 'whatsapp' || formData.clientPhone) {
          window.open(waUrl, '_blank');
        }

        setTimeout(() => {
          setCart([]);
          setFormData({
            clientName: '',
            clientPhone: '',
            deliveryType: 'mostrador',
            clientAddress: '',
            paymentMethod: 'efectivo',
            comprobante: 'whatsapp',
          });
          setSuccessMessage('');
          setSuccessFolio('');
          setLastWhatsAppUrl('');
          setShowPaymentModal(false);

          if (userData) {
            actionGetPaidOrders(userData.businessId, userData.vendorId).then(setPaidOrders);
          }
        }, 5000);
      } else {
        setError((response as any).error || 'Error al crear la orden');
      }
    } catch (err) {
      console.error('Error creating order:', err);
      setError('Error al crear la orden. Por favor intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{`
        /* Responsividad POS */
        @media (max-width: 768px) {
          [data-pos-main] {
            grid-template-columns: 1fr !important;
          }
          [data-pos-sidebar] {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 50%;
            border-top: 1px solid var(--border-color);
            background: var(--bg-primary);
            overflow-y: auto;
            z-index: 100;
          }
          [data-pos-catalog] {
            height: 50vh;
            overflow-y: auto;
          }
        }

        @media (max-width: 480px) {
          [data-pos-sidebar] {
            height: 60%;
          }
          [data-pos-catalog] {
            height: 40vh;
          }
          [data-pos-header-right] {
            gap: 0.5rem !important;
          }
          [data-pos-title] {
            font-size: 1.1rem !important;
          }
        }
      `}</style>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title} data-pos-title>🛒 PUNTO DE VENTA</h1>
        </div>
        <div style={styles.headerRight} data-pos-header-right>
          <button
            onClick={() => {
              setShowOrdersModal(true);
              setOrdersPage(0);
            }}
            style={styles.ordersButton}
          >
            📋 Órdenes ({paidOrders.length})
          </button>
          <DashboardButton />
          <ThemeToggle />
          <LogoutButton />
        </div>
      </header>

      {successMessage && (
        <div style={styles.successAlert}>
          <div style={styles.successContent}>
            <span style={styles.successIcon}>✓</span>
            <div>
              <p style={styles.successTitle}>{successMessage}</p>
              <p style={styles.successFolio}>Folio: #{successFolio}</p>
            </div>
            {lastWhatsAppUrl && (
              <a
                href={lastWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  marginLeft: 'auto',
                  background: '#25D366',
                  color: '#fff',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '13px',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(37,211,102,0.3)'
                }}
              >
                💬 Enviar por WhatsApp
              </a>
            )}
          </div>
        </div>
      )}

      {notificationMessage && (
        <div style={styles.notificationAlert}>
          <span style={styles.notificationIcon}>✓</span>
          <p>{notificationMessage}</p>
        </div>
      )}

      {error && (
        <div style={styles.errorAlert}>
          <span style={styles.errorIcon}>⚠</span>
          <p>{error}</p>
        </div>
      )}

      <div style={styles.mainContent} data-pos-main>
        <div style={styles.catalogSection} data-pos-catalog>
          <div style={styles.searchContainer}>
            <input
              type="text"
              placeholder="Buscar producto por nombre, clave o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
            <span style={styles.resultCount}>
              {filteredProducts.length} producto(s)
            </span>
          </div>

          {filteredProducts.length > 0 ? (
            <div style={styles.productsGrid}>
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  style={{
                    ...styles.productCard,
                    opacity: product.stock > 0 ? 1 : 0.5,
                  }}
                >
                  <div style={styles.productInfo}>
                    <p style={styles.productClave}>{product.clave}</p>
                    <h3 style={styles.productName}>{product.name}</h3>
                    <p style={styles.productCategory}>{product.category}</p>
                    <p style={styles.productPrice}>
                      ${product.price.toFixed(2)}
                    </p>
                    <p
                      style={{
                        ...styles.productStock,
                        color: getAvailableStock(product.id) > 5 ? 'var(--text-success)' : 'var(--text-warning)',
                      }}
                    >
                      Disponible: {getAvailableStock(product.id)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock <= 0}
                    style={{
                      ...styles.addButton,
                      opacity: product.stock > 0 ? 1 : 0.5,
                      cursor: product.stock > 0 ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {product.stock > 0 ? '+ Agregar' : 'Agotado'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <p>No se encontraron productos</p>
            </div>
          )}
        </div>

        <div style={styles.sidebarSection} data-pos-sidebar>
          <div style={styles.cartBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={styles.cartTitle}>Carrito ({cart.length})</h2>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowFullCartModal(true)}
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--accent-orange)',
                    color: 'var(--accent-orange)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  🔍 Ver Detallado
                </button>
              )}
            </div>

            {cart.length > 0 ? (
              <>
                <div ref={cartItemsRef} style={styles.cartItems}>
                  {cart.map((item) => (
                    <div key={item.productId} style={styles.cartItem}>
                      <div style={styles.cartItemDetails}>
                        <p style={styles.cartItemName}>{item.qty}x {item.name}</p>
                        <p style={styles.cartItemClave}>{item.clave}</p>
                      </div>
                      <div style={styles.qtyControls}>
                        <button
                          onClick={() =>
                            handleQuantityChange(item.productId, item.qty - 1)
                          }
                          style={styles.qtyButton}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) =>
                            handleQuantityChange(
                              item.productId,
                              parseInt(e.target.value) || 1
                            )
                          }
                          style={styles.qtyInput}
                        />
                        <button
                          onClick={() =>
                            handleQuantityChange(item.productId, item.qty + 1)
                          }
                          style={styles.qtyButton}
                        >
                          +
                        </button>
                      </div>
                      <div style={styles.cartItemPrice}>
                        <p style={styles.itemSubtotal}>
                          ${item.subtotal.toFixed(2)}
                        </p>
                        <button
                          onClick={() => handleRemoveFromCart(item.productId)}
                          style={styles.removeButton}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={styles.cartTotals}>
                  <div style={styles.totalRow}>
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div style={styles.totalRow}>
                    <span>IVA (16%):</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div style={styles.totalRowFinal}>
                    <span>TOTAL:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setShowFullCartModal(true)}
                    style={{
                      ...styles.cobrButton,
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                      flex: '0 0 auto',
                      width: 'auto',
                      padding: '0.75rem 1rem'
                    }}
                    title="Ver pantalla completa del carrito"
                  >
                    🔍
                  </button>
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    style={{ ...styles.cobrButton, flex: 1, marginTop: '0.75rem' }}
                  >
                    💳 COBRAR (${total.toFixed(2)})
                  </button>
                </div>
              </>
            ) : (
              <p style={styles.emptyCart}>El carrito está vacío</p>
            )}
          </div>

          {/* Payment Modal */}
          {showPaymentModal && (
            <div style={styles.modalOverlay}>
              <div style={styles.modalContent}>
                <form onSubmit={handleCreateOrder} style={{ width: '100%' }}>
                  <div style={styles.modalHeader}>
                    <h2 style={styles.modalTitle}>Pago y Datos del Cliente</h2>
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(false)}
                      style={styles.closeButton}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Order Summary */}
                  <div style={styles.orderSummary}>
                    <div style={styles.orderSummaryRow}>
                      <span>Items:</span>
                      <span style={styles.orderSummaryValue}>{cart.length}</span>
                    </div>
                    <div style={styles.orderSummaryRow}>
                      <span>Subtotal:</span>
                      <span style={styles.orderSummaryValue}>${subtotal.toFixed(2)}</span>
                    </div>
                    <div style={styles.orderSummaryRow}>
                      <span>IVA (16%):</span>
                      <span style={styles.orderSummaryValue}>${tax.toFixed(2)}</span>
                    </div>
                    <div style={styles.orderSummaryTotal}>
                      <span style={{ fontWeight: '700' }}>TOTAL A PAGAR:</span>
                      <span style={styles.totalAmountDisplay}>${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div style={styles.modalBody}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Nombre del Cliente *</label>
                      <input
                        type="text"
                        name="clientName"
                        value={formData.clientName}
                        onChange={handleInputChange}
                        placeholder="Ej: Juan García"
                        style={styles.input}
                        required
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Teléfono</label>
                      <input
                        type="tel"
                        name="clientPhone"
                        value={formData.clientPhone}
                        onChange={handleInputChange}
                        placeholder="Ej: 5551234567"
                        style={styles.input}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Tipo de Entrega *</label>
                      <select
                        name="deliveryType"
                        value={formData.deliveryType}
                        onChange={handleInputChange}
                        style={styles.select}
                      >
                        <option value="mostrador">En Mostrador</option>
                        <option value="domicilio">Entrega a Domicilio</option>
                      </select>
                    </div>

                    {formData.deliveryType !== 'mostrador' && (
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Dirección de Entrega *</label>
                        <input
                          type="text"
                          name="clientAddress"
                          value={formData.clientAddress}
                          onChange={handleInputChange}
                          placeholder="Ej: Calle Principal 123, Apto 4"
                          style={styles.input}
                          required={formData.deliveryType === 'domicilio'}
                        />
                      </div>
                    )}

                    {/* FORMA DE PAGO */}
                    <div style={styles.formGroup}>
                      <label style={styles.label}>FORMA DE PAGO *</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'efectivo' }))}
                          style={{
                            padding: '10px 4px',
                            borderRadius: '8px',
                            border: formData.paymentMethod === 'efectivo' ? '2px solid var(--accent-orange)' : '1px solid var(--border-color)',
                            background: formData.paymentMethod === 'efectivo' ? 'var(--nal, #FFF0E6)' : 'var(--bg-primary)',
                            color: formData.paymentMethod === 'efectivo' ? 'var(--accent-orange)' : 'var(--text-primary)',
                            fontWeight: '700',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          💵 Efectivo
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'tarjeta' }))}
                          style={{
                            padding: '10px 4px',
                            borderRadius: '8px',
                            border: formData.paymentMethod === 'tarjeta' ? '2px solid var(--accent-orange)' : '1px solid var(--border-color)',
                            background: formData.paymentMethod === 'tarjeta' ? 'var(--nal, #FFF0E6)' : 'var(--bg-primary)',
                            color: formData.paymentMethod === 'tarjeta' ? 'var(--accent-orange)' : 'var(--text-primary)',
                            fontWeight: '700',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          💳 Tarjeta
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'transferencia' }))}
                          style={{
                            padding: '10px 4px',
                            borderRadius: '8px',
                            border: formData.paymentMethod === 'transferencia' ? '2px solid var(--accent-orange)' : '1px solid var(--border-color)',
                            background: formData.paymentMethod === 'transferencia' ? 'var(--nal, #FFF0E6)' : 'var(--bg-primary)',
                            color: formData.paymentMethod === 'transferencia' ? 'var(--accent-orange)' : 'var(--text-primary)',
                            fontWeight: '700',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          🏦 Transfer.
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'credito' }))}
                          style={{
                            padding: '10px 4px',
                            borderRadius: '8px',
                            border: formData.paymentMethod === 'credito' ? '2px solid var(--accent-orange)' : '1px solid var(--border-color)',
                            background: formData.paymentMethod === 'credito' ? 'var(--nal, #FFF0E6)' : 'var(--bg-primary)',
                            color: formData.paymentMethod === 'credito' ? 'var(--accent-orange)' : 'var(--text-primary)',
                            fontWeight: '700',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          💳 Crédito
                        </button>
                      </div>
                    </div>

                    {/* COMPROBANTE */}
                    <div style={styles.formGroup}>
                      <label style={styles.label}>COMPROBANTE *</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, comprobante: 'completo' }))}
                          style={{
                            padding: '9px 4px',
                            borderRadius: '8px',
                            border: formData.comprobante === 'completo' ? '2px solid var(--accent-orange)' : '1px solid var(--border-color)',
                            background: formData.comprobante === 'completo' ? 'var(--nal, #FFF0E6)' : 'var(--bg-primary)',
                            color: formData.comprobante === 'completo' ? 'var(--accent-orange)' : 'var(--text-primary)',
                            fontWeight: '600',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          📄 Completo
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, comprobante: 'resumido' }))}
                          style={{
                            padding: '9px 4px',
                            borderRadius: '8px',
                            border: formData.comprobante === 'resumido' ? '2px solid var(--accent-orange)' : '1px solid var(--border-color)',
                            background: formData.comprobante === 'resumido' ? 'var(--nal, #FFF0E6)' : 'var(--bg-primary)',
                            color: formData.comprobante === 'resumido' ? 'var(--accent-orange)' : 'var(--text-primary)',
                            fontWeight: '600',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          📋 Resumido
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, comprobante: 'whatsapp' }))}
                          style={{
                            padding: '9px 4px',
                            borderRadius: '8px',
                            border: '2px solid #25D366',
                            background: formData.comprobante === 'whatsapp' ? 'rgba(37,211,102,0.15)' : 'var(--bg-primary)',
                            color: formData.comprobante === 'whatsapp' ? '#128C7E' : 'var(--text-primary)',
                            fontWeight: '700',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          💬 WhatsApp
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, comprobante: 'sin_papel' }))}
                          style={{
                            padding: '9px 4px',
                            borderRadius: '8px',
                            border: formData.comprobante === 'sin_papel' ? '2px solid var(--accent-orange)' : '1px solid var(--border-color)',
                            background: formData.comprobante === 'sin_papel' ? 'var(--nal, #FFF0E6)' : 'var(--bg-primary)',
                            color: formData.comprobante === 'sin_papel' ? 'var(--accent-orange)' : 'var(--text-primary)',
                            fontWeight: '600',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          🚫 Sin papel
                        </button>
                      </div>
                    </div>

                    {/* ENTREGA A DOMICILIO */}
                    <div style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer'
                    }}
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      deliveryType: prev.deliveryType === 'domicilio' ? 'mostrador' : 'domicilio'
                    }))}
                    >
                      <input
                        type="checkbox"
                        checked={formData.deliveryType === 'domicilio'}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          deliveryType: e.target.checked ? 'domicilio' : 'mostrador'
                        }))}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                        🚚 ¿Entrega a domicilio?
                      </span>
                    </div>
                  </div>

                  <div style={styles.modalFooter}>
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(false)}
                      style={styles.cancelButton}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={cart.length === 0 || submitting}
                      style={{
                        ...styles.submitButton,
                        opacity: cart.length === 0 || submitting ? 0.5 : 1,
                        cursor: cart.length === 0 || submitting ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {submitting
                        ? 'Procesando...'
                        : requiresCajero
                        ? '📥 ENVIAR A CAJA PARA COBRO'
                        : '✓ COBRAR Y COMPLETAR VENTA'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Orders Modal */}
      {showOrdersModal && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: '600px' }}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>📋 Órdenes Pagadas ({paidOrders.length})</h2>
              <button
                type="button"
                onClick={() => setShowOrdersModal(false)}
                style={styles.closeButton}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.ordersSearchContainer}>
                <input
                  type="text"
                  placeholder="Buscar por folio o cliente..."
                  value={ordersSearchTerm}
                  onChange={(e) => {
                    setOrdersSearchTerm(e.target.value);
                    setOrdersPage(0);
                  }}
                  style={styles.ordersSearchInput}
                />
              </div>

              {filteredOrders.length > 0 ? (
                <>
                  <div style={styles.ordersListContainer}>
                    {paginatedOrders.map((order) => (
                      <div key={order.id} style={styles.orderCard}>
                        <div style={styles.orderCardHeader}>
                          <div>
                            <p style={styles.orderFolio}>Folio #{order.folio}</p>
                            <p style={styles.orderClient}>{order.clientName || 'Cliente'}</p>
                          </div>
                          <span style={styles.orderBadge}>✓ Pagada</span>
                        </div>
                        <div style={styles.orderCardBody}>
                          <p style={styles.orderDetail}>
                            <strong>Total:</strong> ${order.total.toFixed(2)}
                          </p>
                          <p style={styles.orderDetail}>
                            <strong>Entrega:</strong>{' '}
                            {order.deliveryType === 'mostrador' ? 'En Mostrador' : 'Domicilio'}
                          </p>
                          <p style={styles.orderDetail}>
                            <strong>Pago:</strong>{' '}
                            {order.paymentMethod === 'efectivo' ? '💵 Efectivo' :
                             order.paymentMethod === 'tarjeta' ? '💳 Tarjeta' :
                             order.paymentMethod === 'transferencia' ? '🏦 Transferencia' : 'N/A'}
                          </p>
                          <p style={styles.orderDate}>
                            📅 {getFormattedDate(order.createdAt)}
                          </p>
                          <p style={styles.orderTime}>
                            {getTimeSinceCreation(order.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div style={styles.paginationContainer}>
                      <button
                        onClick={() => setOrdersPage(Math.max(0, ordersPage - 1))}
                        disabled={ordersPage === 0}
                        style={{
                          ...styles.paginationButton,
                          opacity: ordersPage === 0 ? 0.5 : 1,
                          cursor: ordersPage === 0 ? 'not-allowed' : 'pointer',
                        }}
                      >
                        ← Anterior
                      </button>
                      <span style={styles.paginationInfo}>
                        Página {ordersPage + 1} de {totalPages}
                      </span>
                      <button
                        onClick={() => setOrdersPage(Math.min(totalPages - 1, ordersPage + 1))}
                        disabled={ordersPage === totalPages - 1}
                        style={{
                          ...styles.paginationButton,
                          opacity: ordersPage === totalPages - 1 ? 0.5 : 1,
                          cursor: ordersPage === totalPages - 1 ? 'not-allowed' : 'pointer',
                        }}
                      >
                        Siguiente →
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p style={styles.emptyOrdersMessage}>
                  {ordersSearchTerm ? 'No hay órdenes que coincidan con la búsqueda' : 'Sin órdenes pagadas'}
                </p>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setShowOrdersModal(false)}
                style={{
                  ...styles.cancelButton,
                  flex: 1,
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Full Cart Modal */}
      {showFullCartModal && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: '850px', width: '95%' }}>
            <div style={styles.modalHeader}>
              <h2 style={{ ...styles.modalTitle, display: 'flex', alignItems: 'center', gap: '8px' }}>
                🛒 Carrito de Compras Detallado ({cart.length} productos)
              </h2>
              <button
                type="button"
                onClick={() => setShowFullCartModal(false)}
                style={styles.closeButton}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              {/* Search input within cart */}
              <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Filtrar productos en el carrito..."
                  value={cartSearchTerm}
                  onChange={(e) => setCartSearchTerm(e.target.value)}
                  style={{ ...styles.searchInput, flex: 1 }}
                />
                {cart.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm('¿Vaciar todo el carrito?')) {
                        setCart([]);
                        setShowFullCartModal(false);
                      }
                    }}
                    style={{
                      backgroundColor: 'var(--accent-red, #dc2626)',
                      color: 'white',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '600'
                    }}
                  >
                    🗑 Vaciar Carrito
                  </button>
                )}
              </div>

              {/* Cart items table */}
              <div style={{ overflowX: 'auto', maxHeight: '48vh', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px' }}>#</th>
                      <th style={{ padding: '10px 12px' }}>Clave</th>
                      <th style={{ padding: '10px 12px' }}>Producto</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Precio Unit.</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Cantidad</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Subtotal</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart
                      .filter(item =>
                        item.name.toLowerCase().includes(cartSearchTerm.toLowerCase()) ||
                        item.clave.toLowerCase().includes(cartSearchTerm.toLowerCase())
                      )
                      .map((item, idx) => (
                        <tr key={item.productId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{idx + 1}</td>
                          <td style={{ padding: '10px 12px', fontWeight: '600', color: 'var(--text-secondary)' }}>{item.clave}</td>
                          <td style={{ padding: '10px 12px', fontWeight: '600' }}>{item.name}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>${item.price.toFixed(2)}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', alignItems: 'center' }}>
                              <button
                                onClick={() => handleQuantityChange(item.productId, item.qty - 1)}
                                style={styles.qtyButton}
                              >−</button>
                              <input
                                type="number"
                                value={item.qty}
                                onChange={(e) => handleQuantityChange(item.productId, parseInt(e.target.value) || 1)}
                                style={{ ...styles.qtyInput, width: '45px' }}
                              />
                              <button
                                onClick={() => handleQuantityChange(item.productId, item.qty + 1)}
                                style={styles.qtyButton}
                              >+</button>
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: 'var(--accent-orange)' }}>
                            ${item.subtotal.toFixed(2)}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleRemoveFromCart(item.productId)}
                              style={styles.removeButton}
                              title="Eliminar producto"
                            >🗑</button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div style={{ marginTop: '1.25rem', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Total de artículos: <strong>{cart.reduce((sum, i) => sum + i.qty, 0)} unidades</strong></span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Subtotal: <strong>${subtotal.toFixed(2)}</strong> | IVA (16%): <strong>${tax.toFixed(2)}</strong></div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--accent-orange)', marginTop: '4px' }}>
                    TOTAL: ${total.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setShowFullCartModal(false)}
                style={styles.cancelButton}
              >
                Seguir Agregando Productos
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowFullCartModal(false);
                  setShowPaymentModal(true);
                }}
                style={{ ...styles.submitButton, marginTop: 0 }}
              >
                💳 IR A COBRAR (${total.toFixed(2)})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    backgroundColor: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border-color)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
  },
  headerRight: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '700',
    margin: 0,
    color: 'var(--accent-orange)',
  },
  successAlert: {
    backgroundColor: 'var(--bg-success)',
    borderLeft: '4px solid var(--text-success)',
    padding: '1rem',
    margin: '1rem',
    borderRadius: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  successContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  successIcon: {
    fontSize: '1.5rem',
    color: 'var(--text-success)',
    fontWeight: 'bold',
  },
  successTitle: {
    margin: 0,
    fontWeight: '600',
    color: 'var(--text-success)',
  },
  successFolio: {
    margin: '0.25rem 0 0 0',
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
  },
  errorAlert: {
    backgroundColor: 'var(--bg-danger)',
    borderLeft: '4px solid var(--text-danger)',
    color: 'var(--text-danger)',
    padding: '1rem',
    margin: '1rem',
    borderRadius: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  errorIcon: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 400px',
    gap: '1rem',
    padding: '1rem',
    flex: 1,
    overflow: 'hidden',
  },
  catalogSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    overflow: 'hidden',
  },
  searchContainer: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    padding: '0.75rem',
    border: '1px solid var(--border-color)',
    borderRadius: '0.5rem',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
  },
  resultCount: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    whiteSpace: 'nowrap',
  },
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '1rem',
    overflow: 'auto',
    paddingRight: '0.5rem',
  },
  productCard: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '0.5rem',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  productInfo: {
    flex: 1,
  },
  productClave: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    margin: 0,
    fontWeight: '600',
  },
  productName: {
    fontSize: '0.95rem',
    fontWeight: '600',
    margin: '0.25rem 0',
    color: 'var(--text-primary)',
  },
  productCategory: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    margin: '0.25rem 0',
  },
  productPrice: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: 'var(--accent-orange)',
    margin: '0.5rem 0 0 0',
  },
  productStock: {
    fontSize: '0.8rem',
    margin: '0.25rem 0 0 0',
  },
  addButton: {
    padding: '0.5rem',
    backgroundColor: 'var(--accent-orange)',
    color: 'white',
    border: 'none',
    borderRadius: '0.4rem',
    fontWeight: '600',
    fontSize: '0.85rem',
  },
  emptyState: {
    textAlign: 'center',
    padding: '2rem',
    color: 'var(--text-secondary)',
  },
  sidebarSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    overflow: 'hidden',
  },
  cartBox: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '0.5rem',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    flex: '1 1 auto',
    maxHeight: '55vh',
    minHeight: '220px',
    overflow: 'hidden',
  },
  cartTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    margin: 0,
    color: 'var(--text-primary)',
  },
  cartItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    overflow: 'auto',
    flex: 1,
    paddingRight: '0.5rem',
  },
  cartItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.5rem 0',
    borderBottom: '1px solid var(--border-color)',
    fontSize: '0.85rem',
    gap: '0.5rem',
  },
  cartItemDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
    flex: 1,
    minWidth: 0,
  },
  cartItemName: {
    fontWeight: '600',
    margin: 0,
    fontSize: '0.85rem',
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    lineHeight: '1.2',
  },
  cartItemClave: {
    color: 'var(--text-secondary)',
    margin: 0,
    fontSize: '0.7rem',
  },
  qtyControls: {
    display: 'flex',
    gap: '0.2rem',
    alignItems: 'center',
    flexShrink: 0,
  },
  qtyButton: {
    width: '20px',
    height: '20px',
    padding: 0,
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    borderRadius: '0.2rem',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: 'bold',
  },
  qtyInput: {
    width: 'auto',
    minWidth: '24px',
    maxWidth: '40px',
    padding: '0.15rem 0.25rem',
    textAlign: 'center',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    borderRadius: '0.2rem',
    fontSize: '0.75rem',
    fontWeight: '600',
  },
  cartItemPrice: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '0.3rem',
    flexShrink: 0,
  },
  itemPrice: {
    margin: 0,
    fontSize: '0.7rem',
    color: 'var(--text-secondary)',
    display: 'none',
  },
  itemSubtotal: {
    margin: 0,
    fontWeight: '700',
    fontSize: '0.8rem',
    color: 'var(--accent-orange)',
  },
  removeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem',
    padding: '0 0.25rem',
    flexShrink: 0,
  },
  emptyCart: {
    textAlign: 'center',
    color: 'var(--text-secondary)',
    margin: '1rem 0',
    fontSize: '0.9rem',
  },
  cartTotals: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '0.75rem',
    fontSize: '0.9rem',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    color: 'var(--text-secondary)',
  },
  totalRowFinal: {
    display: 'flex',
    justifyContent: 'space-between',
    fontWeight: '700',
    color: 'var(--accent-orange)',
    fontSize: '1rem',
    paddingTop: '0.5rem',
    borderTop: '1px solid var(--border-color)',
  },
  formBox: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '0.5rem',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    flex: 1,
    overflow: 'auto',
  },
  formTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    margin: 0,
    marginBottom: '0.5rem',
    color: 'var(--text-primary)',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  input: {
    padding: '0.6rem',
    border: '1px solid var(--border-color)',
    borderRadius: '0.4rem',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
  },
  select: {
    padding: '0.6rem',
    border: '1px solid var(--border-color)',
    borderRadius: '0.4rem',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
  },
  submitButton: {
    padding: '0.75rem',
    backgroundColor: 'var(--accent-orange)',
    color: 'white',
    border: 'none',
    borderRadius: '0.4rem',
    fontWeight: '700',
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  notificationAlert: {
    backgroundColor: 'var(--bg-success)',
    borderLeft: '4px solid var(--text-success)',
    color: 'var(--text-success)',
    padding: '1rem',
    margin: '1rem',
    borderRadius: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    animation: 'slideIn 0.3s ease-out',
  },
  notificationIcon: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
  },
  paidOrdersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    overflow: 'auto',
    flex: 1,
    paddingRight: '0.5rem',
  },
  paidOrderItem: {
    backgroundColor: 'var(--bg-primary)',
    padding: '0.75rem',
    borderRadius: '0.4rem',
    border: '1px solid var(--border-color)',
    borderLeft: '3px solid var(--text-success)',
    fontSize: '0.85rem',
  },
  paidOrderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.35rem',
  },
  paidOrderFolio: {
    fontWeight: '700',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
  },
  paidOrderBadge: {
    backgroundColor: 'var(--bg-success)',
    color: 'var(--text-success)',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    fontSize: '0.7rem',
    fontWeight: '600',
  },
  paidOrderClient: {
    margin: '0.25rem 0',
    color: 'var(--text-secondary)',
    fontSize: '0.8rem',
  },
  paidOrderFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '0.35rem',
    paddingTop: '0.35rem',
    borderTop: '1px solid var(--border-color)',
  },
  paidOrderTotal: {
    fontWeight: '600',
    color: 'var(--accent-orange)',
    fontSize: '0.9rem',
  },
  paidOrderTime: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
  },
  cobrButton: {
    width: '100%',
    padding: '0.75rem',
    marginTop: '0.75rem',
    background: 'var(--accent-orange)',
    color: '#fff',
    border: 'none',
    borderRadius: '0.5rem',
    fontWeight: '600',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'var(--bg-primary)',
    borderRadius: '0.75rem',
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column' as const,
    border: '1px solid var(--border-color)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    borderBottom: '1px solid var(--border-color)',
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: '0',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '0.25rem',
    transition: 'all 0.2s',
  },
  modalBody: {
    flex: 1,
    overflow: 'auto',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },
  modalFooter: {
    display: 'flex',
    gap: '0.75rem',
    padding: '1.5rem',
    borderTop: '1px solid var(--border-color)',
  },
  cancelButton: {
    flex: 1,
    padding: '0.75rem',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '0.5rem',
    fontWeight: '600',
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  paymentMethodsContainer: {
    display: 'flex',
    gap: '1rem',
    flexDirection: 'column' as const,
  },
  paymentMethodLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  radioInput: {
    cursor: 'pointer',
    width: '18px',
    height: '18px',
  },
  paymentMethodText: {
    fontSize: '0.95rem',
    fontWeight: '500',
    color: 'var(--text-primary)',
  },
  ordersButton: {
    padding: '0.5rem 1rem',
    background: 'var(--accent-orange)',
    color: '#fff',
    border: 'none',
    borderRadius: '0.5rem',
    fontWeight: '600',
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginRight: '1rem',
  },
  ordersSearchContainer: {
    marginBottom: '1rem',
  },
  ordersSearchInput: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid var(--border-color)',
    borderRadius: '0.5rem',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    boxSizing: 'border-box' as const,
  },
  ordersListContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
    maxHeight: '400px',
    overflowY: 'auto' as const,
  },
  orderCard: {
    border: '1px solid var(--border-color)',
    borderRadius: '0.5rem',
    padding: '1rem',
    backgroundColor: 'var(--bg-secondary)',
  },
  orderCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.75rem',
  },
  orderFolio: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: 'var(--accent-orange)',
    margin: '0 0 0.25rem 0',
  },
  orderClient: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    margin: '0',
  },
  orderBadge: {
    fontSize: '0.75rem',
    background: 'rgba(76, 175, 80, 0.2)',
    color: 'var(--text-success)',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    fontWeight: '600',
  },
  orderCardBody: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  orderDetail: {
    fontSize: '0.85rem',
    color: 'var(--text-primary)',
    margin: '0',
  },
  orderDate: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'var(--accent-orange)',
    margin: '0.5rem 0 0 0',
  },
  orderTime: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    margin: '0.25rem 0 0 0',
  },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid var(--border-color)',
  },
  paginationButton: {
    padding: '0.5rem 1rem',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '0.5rem',
    fontWeight: '600',
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  paginationInfo: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  emptyOrdersMessage: {
    textAlign: 'center' as const,
    color: 'var(--text-secondary)',
    padding: '2rem 1rem',
    fontSize: '0.9rem',
    margin: '0',
  },
  orderSummary: {
    background: 'linear-gradient(135deg, var(--accent-orange), rgba(232, 99, 44, 0.8))',
    color: '#fff',
    padding: '1rem 1.5rem',
    borderRadius: '0 0 0.5rem 0.5rem',
    borderTop: '2px solid rgba(255, 255, 255, 0.2)',
  },
  orderSummaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
    fontSize: '0.95rem',
  },
  orderSummaryValue: {
    fontWeight: '600',
  },
  orderSummaryTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '2px solid rgba(255, 255, 255, 0.3)',
    fontSize: '1.1rem',
  },
  totalAmountDisplay: {
    fontSize: '1.5rem',
    fontWeight: '800',
    letterSpacing: '0.05em',
  },
};
