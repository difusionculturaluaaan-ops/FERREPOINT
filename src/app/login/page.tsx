'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { actionLogin } from '@/features/auth/server'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const demoCredentials = [
    { role: '👑 Dueño', email: 'dueno@ferreteria.com', password: 'password123' },
    { role: '🛒 Vendedor', email: 'vendedor@ferreteria.com', password: 'password123' }
  ]

  const handleDemoLogin = (email: string) => {
    setEmail(email)
    setPassword('password123')
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email) {
      setError('Ingresa tu correo electrónico')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Correo inválido')
      return
    }

    if (!password) {
      setError('Ingresa tu contraseña')
      return
    }

    setIsLoading(true)

    try {
      const result = await actionLogin(email, password)

      if (result.success && result.token) {
        localStorage.setItem('token', result.token)
        if (result.user) localStorage.setItem('user', JSON.stringify(result.user))

        // Extract businessId from JWT and save separately (JWT always has it)
        try {
          const parts = result.token.split('.')
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]))
            localStorage.setItem('businessId', payload.businessId || '')
            console.log('businessId saved:', payload.businessId)
          }
        } catch (err) {
          console.warn('Could not extract businessId from token')
        }

        // Set cookie for middleware
        const cookieString = `token=${result.token}; path=/; max-age=${7 * 24 * 60 * 60}`
        document.cookie = cookieString
        console.log('Cookie set:', cookieString)
        console.log('All cookies:', document.cookie)

        setShowSuccess(true)

        setTimeout(() => {
          if (result.user) {
            console.log('User data:', result.user)
            const dashboardMap: Record<string, string> = {
              dueno: '/',
              vendedor: '/pos',
              bodeguero: '/bodega',
              chofer: '/entregas',
              cajero: '/caja'
            }
            const target = dashboardMap[result.user.role] || '/'
            console.log('Redirecting to:', target)
            router.push(target)
          } else {
            console.log('No user data returned')
          }
        }, 2200)
      } else {
        setError(result.error || 'Credenciales incorrectas')
      }
    } catch (err) {
      setError('Error al iniciar sesión')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 32px',
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '30px',
            height: '30px',
            background: 'var(--accent-orange)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            color: '#fff',
            fontWeight: 'bold'
          }}>
            🔐
          </div>
          <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
            FERREPOINT
          </span>
        </div>
        <ThemeToggle />
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '960px',
          display: 'grid',
          gridTemplateColumns: '1.05fr 1fr',
          borderRadius: '16px',
          boxShadow: '0 30px 80px rgba(0,0,0,0.35)',
          overflow: 'hidden',
          background: 'var(--bg-primary)'
        }}>
          {/* Panel Izquierdo - Marca */}
          <div style={{
            background: 'var(--bg-secondary)',
            padding: '52px 44px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '2rem'
          }}>
            <div>
              <div style={{
                display: 'inline-block',
                background: 'rgba(232, 99, 44, 0.15)',
                color: 'var(--accent-orange)',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: '700',
                letterSpacing: '0.5px',
                marginBottom: '1rem'
              }}>
                PANEL DE CONTROL
              </div>
              <h1 style={{
                fontSize: '32px',
                fontWeight: '800',
                color: 'var(--text-primary)',
                margin: '0 0 0.5rem 0'
              }}>
                Gestión Integral de Ferreterías
              </h1>
              <p style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                margin: '0',
                lineHeight: '1.6'
              }}>
                Sistema SaaS completo: punto de venta, bodega, inventario, reportes financieros y entregas.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { icon: '🛒', text: 'Punto de Venta (POS)' },
                { icon: '📦', text: 'Bodega y Surtido' },
                { icon: '📊', text: 'Inventario' },
                { icon: '📈', text: 'Reportes y Financiero' }
              ].map(feature => (
                <div key={feature.text} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '20px' }}>{feature.icon}</span>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Panel Derecho - Formulario */}
          <div style={{
            padding: '52px 44px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '800',
              color: 'var(--text-primary)',
              margin: '0 0 0.5rem 0'
            }}>
              Iniciar Sesión
            </h2>
            <p style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              margin: '0 0 2rem 0'
            }}>
              Ingresa con tu correo y contraseña
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Email */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem'
                }}>
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value)
                    setError('')
                  }}
                  placeholder="tu@correo.com"
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '9px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Password */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{
                    fontSize: '12.5px',
                    fontWeight: '600',
                    color: 'var(--text-primary)'
                  }}>
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-orange)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      padding: '0'
                    }}
                  >
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '9px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Error Banner */}
              {error && (
                <div style={{
                  background: 'rgba(220, 53, 50, 0.12)',
                  border: '1px solid #dc3532',
                  borderRadius: '6px',
                  padding: '10px',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  animation: 'shake 0.5s'
                }}>
                  <span style={{ fontSize: '16px' }}>⚠️</span>
                  <span style={{ fontSize: '13px', color: '#ff6b66', fontWeight: '500' }}>
                    {error}
                  </span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: isLoading ? 'rgba(232, 99, 44, 0.7)' : 'var(--accent-orange)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '9px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  marginTop: '1rem',
                  transition: 'background 0.2s'
                }}
              >
                {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
              </button>
            </form>

            {/* Demo Credentials */}
            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
              <p style={{
                fontSize: '11px',
                fontWeight: '700',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '0.75rem'
              }}>
                Credenciales de Demostración
              </p>
              {demoCredentials.map(cred => (
                <button
                  key={cred.email}
                  onClick={() => handleDemoLogin(cred.email)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    marginBottom: '6px',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--accent-orange)'
                    e.currentTarget.style.color = '#fff'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--bg-secondary)'
                    e.currentTarget.style.color = 'var(--text-primary)'
                  }}
                >
                  {cred.role}: {cred.email}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Success Overlay */}
      {showSuccess && (
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
            borderRadius: '12px',
            padding: '3rem',
            textAlign: 'center',
            maxWidth: '300px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '1rem', animation: 'bounce 0.6s' }}>✓</div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: 'var(--text-primary)',
              margin: '0 0 0.5rem 0'
            }}>
              ¡Bienvenido de nuevo!
            </h3>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              margin: '0'
            }}>
              Ingresando...
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        @keyframes bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  )
}
