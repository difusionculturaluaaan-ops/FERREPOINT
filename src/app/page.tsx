'use client'

import { useState, useEffect } from 'react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LogoutButton } from '@/components/LogoutButton'

const ALL_NAV_MODULES = [
  { key: 'pos', label: '🛒 Punto de Venta', href: '/pos' },
  { key: 'inventario', label: '📦 Inventario', href: '/inventario' },
  { key: 'caja', label: '💳 Caja & Cobros', href: '/caja' },
  { key: 'bodega', label: '🗺 Bodega', href: '/bodega' },
  { key: 'almacen', label: '🏬 Almacén', href: '/almacen' },
  { key: 'compras', label: '🛒 Compras', href: '/compras' },
  { key: 'contabilidad', label: '💰 Contabilidad', href: '/contabilidad' },
  { key: 'entregas', label: '🚚 Entregas', href: '/entregas' },
  { key: 'reportes', label: '📊 Reportes', href: '/reportes' },
]

export default function Home() {
  const [userRole, setUserRole] = useState<string | null>(null)
  const [enabledModules, setEnabledModules] = useState<string[]>([])

  useEffect(() => {
    const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {}
    setUserRole(user.role || null)
    setEnabledModules(user.enabledModules || ['pos', 'inventario', 'caja', 'bodega', 'almacen', 'compras', 'contabilidad', 'entregas', 'reportes'])
  }, [])

  const visibleModules = userRole === 'super_admin'
    ? ALL_NAV_MODULES
    : ALL_NAV_MODULES.filter(m => enabledModules.length === 0 || enabledModules.includes(m.key))

  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--bg-secondary)',
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start'
    }}>
      {/* Header */}
      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 1.5rem',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '30px',
            height: '30px',
            background: 'var(--accent-orange)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#fff'
          }}>
            🏪
          </div>
          <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
            FERREPOINT
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {userRole === 'super_admin' && (
            <a
              href="/superadmin"
              style={{
                background: '#F97316',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: '6px',
                fontWeight: '700',
                fontSize: '13px',
                textDecoration: 'none'
              }}
            >
              ⚡ SuperAdmin Dashboard
            </a>
          )}
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>

      <div style={{ maxWidth: '750px', width: '100%', padding: '0 0.5rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '600',
            color: 'var(--accent-orange)',
            margin: '0 0 0.5rem 0',
            letterSpacing: '-0.5px'
          }}>
            FERREPOINT
          </h1>
          <p style={{
            fontSize: '16px',
            color: 'var(--text-secondary)',
            margin: '0',
            fontWeight: '400'
          }}>
            Sistema integral de gestión para ferreterías
          </p>
        </div>

        {/* Navigation Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          {visibleModules.map(mod => (
            <a
              key={mod.key}
              href={mod.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-primary)',
                color: 'var(--accent-orange)',
                border: `1px solid var(--border-color)`,
                padding: '14px 20px',
                borderRadius: '8px',
                textAlign: 'center',
                textDecoration: 'none',
                fontSize: '15px',
                fontWeight: '700',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--bg-tertiary)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--bg-primary)'
              }}
            >
              {mod.label}
            </a>
          ))}
        </div>

        {/* Admin Section - Para Admins y Encargados */}
        {(userRole === 'admin' || userRole === 'dueno' || userRole === 'super_admin' || userRole === 'encargado') && (
          <div style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            background: 'var(--bg-primary)',
            border: `2px solid var(--accent-orange)`,
            borderRadius: '12px'
          }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '700',
              color: 'var(--accent-orange)',
              margin: '0 0 1rem 0',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              ⚙️ Administración de Personal
            </h3>
            <a
              href="/admin/usuarios"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--accent-orange)',
                color: '#fff',
                border: 'none',
                padding: '14px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '15px',
                fontWeight: '700',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.opacity = '0.9'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.opacity = '1'
              }}
            >
              👥 Gestionar Usuarios y Permisos de Empleados
            </a>
          </div>
        )}
      </div>
    </main>
  )
}
