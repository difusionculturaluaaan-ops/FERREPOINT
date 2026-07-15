'use client';

import React, { useState, useEffect } from 'react';
import { actionGetProducts, actionCreateOrder } from '@/features/pos/server';
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
}

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
  });
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [successFolio, setSuccessFolio] = useState('');

  useEffect(() => {
    const initializePage = async () => {
      try {
        const userJSON = localStorage.getItem('user');
        if (!userJSON) {
          setError('Usuario no autenticado');
          setLoading(false);
          return;
        }

        const user: UserData = JSON.parse(userJSON);
        setUserData(user);

        const productsData = await actionGetProducts(user.businessId, user.locationId);
        setProducts(productsData);
        setFilteredProducts(productsData);
        setLoading(false);
      } catch (err) {
        console.error('Error initializing POS:', err);
        setError('Error al cargar los productos');
        setLoading(false);
      }
    };

    initializePage();
  }, []);

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
        setSuccessFolio(response.sale?.folio || 'N/A');
        setSuccessMessage(`Orden creada exitosamente. Folio: ${response.sale?.folio || 'N/A'}`);

        setTimeout(() => {
          setCart([]);
          setFormData({
            clientName: '',
            clientPhone: '',
            deliveryType: 'mostrador',
            clientAddress: '',
          });
          setSuccessMessage('');
          setSuccessFolio('');
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
                        color: product.stock > 5 ? 'var(--text-success)' : 'var(--text-warning)',
                      }}
                    >
                      Stock: {product.stock}
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
          <div style={styles.cartBox}>
            <h2 style={styles.cartTitle}>Carrito ({cart.length})</h2>

            {cart.length > 0 ? (
              <>
                <div style={styles.cartItems}>
                  {cart.map((item) => (
                    <div key={item.productId} style={styles.cartItem}>
                      <div style={styles.cartItemDetails}>
                        <p style={styles.cartItemName}>{item.name}</p>
                        <p style={styles.cartItemClave}>{item.clave}</p>
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
                      </div>
                      <div style={styles.cartItemPrice}>
                        <p style={styles.itemPrice}>
                          ${item.price.toFixed(2)}
                        </p>
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
              </>
            ) : (
              <p style={styles.emptyCart}>El carrito está vacío</p>
            )}
          </div>

          <form onSubmit={handleCreateOrder} style={styles.formBox}>
            <h2 style={styles.formTitle}>Datos del Cliente</h2>

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
                <option value="entrega">Entrega a Domicilio</option>
                <option value="retiro">Retiro Posterior</option>
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
          </form>
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
    backgroundColor: 'var(--bg-primary)',
    padding: '0.75rem',
    borderRadius: '0.4rem',
    border: '1px solid var(--border-color)',
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: '0.5rem',
    fontSize: '0.85rem',
  },
  cartItemDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  cartItemName: {
    fontWeight: '600',
    margin: 0,
    fontSize: '0.9rem',
  },
  cartItemClave: {
    color: 'var(--text-secondary)',
    margin: 0,
    fontSize: '0.75rem',
  },
  qtyControls: {
    display: 'flex',
    gap: '0.25rem',
    alignItems: 'center',
    marginTop: '0.25rem',
  },
  qtyButton: {
    width: '24px',
    height: '24px',
    padding: 0,
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    borderRadius: '0.3rem',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 'bold',
  },
  qtyInput: {
    width: '40px',
    padding: '0.25rem',
    textAlign: 'center',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    borderRadius: '0.3rem',
    fontSize: '0.8rem',
  },
  cartItemPrice: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '0.25rem',
    justifyContent: 'center',
  },
  itemPrice: {
    margin: 0,
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  itemSubtotal: {
    margin: 0,
    fontWeight: '600',
    fontSize: '0.9rem',
    color: 'var(--accent-orange)',
  },
  removeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    padding: 0,
    marginTop: '0.25rem',
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
};
