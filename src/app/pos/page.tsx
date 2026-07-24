'use client';

import React, { useState, useEffect, useRef } from 'react';
import { actionGetProducts, actionCreateOrder, actionGetPaidOrders, actionGetBusinessConfig, actionProcessPayment } from '@/features/pos/server';
import { actionGetBusinessPlan } from '@/features/auth/server';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LogoutButton } from '@/components/LogoutButton';

interface Product {
  id: string;
  businessId: string;
  locationId?: string;
  clave: string;
  name: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  active: boolean;
  image?: {
    id: string;
    name: string;
    category: string;
    imageUrl: string;
  };
}

interface CartItem {
  productId: string;
  clave: string;
  name: string;
  price: number;
  qty: number;
  subtotal: number;
}

interface FormData {
  clientName: string;
  clientPhone: string;
  deliveryType: 'mostrador' | 'domicilio';
  clientAddress: string;
  paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia';
}

interface UserData {
  businessId: string;
  locationId: string;
  vendorId: string;
  email: string;
}

interface Sale {
  id: string;
  folio: string;
  clientName?: string;
  total: number;
  status: string;
  paymentProcessedAt?: Date;
  createdAt: Date;
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
  });
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [successFolio, setSuccessFolio] = useState('');
  const [paidOrders, setPaidOrders] = useState<Sale[]>([]);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [requiresCajero, setRequiresCajero] = useState(false);
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

  const getAvailableStock = (productId: string): number => {
    const product = products.find((p) => p.id === productId);
    if (!product) return 0;
    const cartQty = cart.find((item) => item.productId === productId)?.qty || 0;
    return product.stock - cartQty;
  };

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

    if (!formData.clientName.trim()) {
      setError('Por favor ingresa el nombre del cliente');
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
        formData.clientName || undefined,
        formData.clientPhone || undefined,
        formData.clientAddress || undefined,
        formData.deliveryType
      );

      if (response.success) {
        // Si no requiere cajero, procesar pago inmediatamente
        if (!requiresCajero && response.sale?.id) {
          const paymentResult = await actionProcessPayment(
            response.sale.id,
            formData.paymentMethod as "efectivo" | "transferencia" | "tarjeta",
            userData.vendorId
          );

          if (paymentResult.success) {
            setSuccessFolio(response.sale?.folio || 'N/A');
            setSuccessMessage(`✓ Orden pagada. Folio: ${response.sale?.folio || 'N/A'}`);
          } else {
            setError('Orden creada pero error al procesar pago');
          }
        } else {
          setSuccessFolio(response.sale?.folio || 'N/A');
          setSuccessMessage(`Orden creada. Folio: ${response.sale?.folio || 'N/A'}`);
        }

        setTimeout(() => {
          setCart([]);
          setFormData({
            clientName: '',
            clientPhone: '',
            deliveryType: 'mostrador',
            clientAddress: '',
            paymentMethod: 'efectivo',
          });
          setSuccessMessage('');
          setSuccessFolio('');
          setShowPaymentModal(false);

          // Recargar órdenes pagadas
          if (userData) {
            actionGetPaidOrders(userData.businessId, userData.vendorId).then(setPaidOrders);
          }
        }, 3000);
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
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>🛒 PUNTO DE VENTA</h1>
        </div>
        <div style={styles.headerRight}>
          <ThemeToggle />
          <LogoutButton />
        </div>
      </header>

      {successMessage && (
        <div style={styles.successAlert}>
          <div style={styles.successContent}>
            <span style={styles.successIcon}>✓</span>
            <div>
              <p style={styles.successTitle}>Orden creada exitosamente</p>
              <p style={styles.successFolio}>Folio: {successFolio}</p>
            </div>
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

      <div style={styles.mainContent}>
        <div style={styles.catalogSection}>
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

        <div style={styles.sidebarSection}>
          <div style={{ ...styles.cartBox, maxHeight: '35%' }}>
            <h2 style={styles.cartTitle}>Carrito ({cart.length})</h2>

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

                <button
                  onClick={() => setShowPaymentModal(true)}
                  style={styles.cobrButton}
                >
                  💳 COBRAR
                </button>
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

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Forma de Pago *</label>
                      <div style={styles.paymentMethodsContainer}>
                        <label style={styles.paymentMethodLabel}>
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="efectivo"
                            checked={formData.paymentMethod === 'efectivo'}
                            onChange={handleInputChange}
                            style={styles.radioInput}
                          />
                          <span style={styles.paymentMethodText}>💵 Efectivo</span>
                        </label>
                        <label style={styles.paymentMethodLabel}>
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="tarjeta"
                            checked={formData.paymentMethod === 'tarjeta'}
                            onChange={handleInputChange}
                            style={styles.radioInput}
                          />
                          <span style={styles.paymentMethodText}>💳 Tarjeta</span>
                        </label>
                        <label style={styles.paymentMethodLabel}>
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="transferencia"
                            checked={formData.paymentMethod === 'transferencia'}
                            onChange={handleInputChange}
                            style={styles.radioInput}
                          />
                          <span style={styles.paymentMethodText}>🏦 Transferencia</span>
                        </label>
                      </div>
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
                      {submitting ? 'Procesando...' : '✓ GENERAR ORDEN'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div style={{ ...styles.cartBox, maxHeight: '32%' }}>
            <h2 style={styles.cartTitle}>✓ Órdenes Pagadas ({paidOrders.length})</h2>

            {paidOrders.length > 0 ? (
              <div style={styles.paidOrdersList}>
                {paidOrders.map((order) => (
                  <div key={order.id} style={styles.paidOrderItem}>
                    <div style={styles.paidOrderHeader}>
                      <span style={styles.paidOrderFolio}>{order.folio}</span>
                      <span style={styles.paidOrderBadge}>✓ Pagada</span>
                    </div>
                    <p style={styles.paidOrderClient}>
                      {order.clientName || 'Cliente'}
                    </p>
                    <div style={styles.paidOrderFooter}>
                      <span style={styles.paidOrderTotal}>
                        ${order.total.toFixed(2)}
                      </span>
                      <span style={styles.paidOrderTime}>
                        {getTimeSinceCreation(order.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={styles.emptyCart}>Sin órdenes pagadas</p>
            )}
          </div>
        </div>
      </div>
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
    maxHeight: '50%',
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
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
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
};
