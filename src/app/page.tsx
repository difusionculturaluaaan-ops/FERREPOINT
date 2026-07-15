'use client'

import { useTransition, useState, useEffect } from 'react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LogoutButton } from '@/components/LogoutButton'

export default function Home() {
  const [isPending, startTransition] = useTransition()
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {}
    setUserRole(user.role || null)
  }, [])

  const handleSeed = async () => {
    startTransition(async () => {
      try {
        const res = await fetch('/api/seed', { method: 'POST' })
        const data = await res.json()
        if (data.success) {
          alert('Base de datos poblada con datos de demo\n\n' +
            `Dueño: ${data.credentials.dueno}\n` +
            `Vendedor: ${data.credentials.vendedor}`)
          window.location.href = '/pos'
        }
      } catch (error) {
        alert('Error al popular la base de datos')
      }
    })
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--bg-secondary)',
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Header */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.5rem 2rem',
        borderBottom: '1px solid var(--border-color)'
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
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>

      <div style={{ maxWidth: '600px', width: '100%' }}>
        {/* Header */}
        <div style={{ marginBottom: '3rem' }}>
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

        {/* Status Card */}
        <div style={{
          background: 'var(--bg-primary)',
          border: `1px solid var(--border-color)`,
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            margin: '0 0 1rem 0',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Estado Fase 1 - MVP
          </h2>

          <ul style={{
            fontSize: '14px',
            lineHeight: '2',
            color: 'var(--text-secondary)',
            margin: '0',
            paddingLeft: '0',
            listStyle: 'none'
          }}>
            <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span>
              Base de datos (SQLite)
            </li>
            <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span>
              Prisma ORM multi-tenant
            </li>
            <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span>
              Stack Next.js 15 + React 18
            </li>
            <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span>
              Módulo POS (carrito, cobro)
            </li>
            <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span>
              Módulo Bodega (surtido)
            </li>
            <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span>
              Módulo Reportes (KPIs del día, vendedor, inventario)
            </li>
            <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span>
              Módulo Inventario (costos, márgenes, stock)
            </li>
            <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span>
              Módulo Almacén (movimientos de stock)
            </li>
            <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span>
              Módulo Compras (órdenes, recepción automática)
            </li>
            <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span>
              Módulo Contabilidad (CxC, CxP, flujo de caja, rentabilidad)
            </li>
            <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span>
              Módulo Entregas (Kanban, geolocación, repartidores)
            </li>
          </ul>
        </div>

        {/* Seed Button */}
        <button
          onClick={handleSeed}
          disabled={isPending}
          style={{
            width: '100%',
            background: 'var(--accent-orange)',
            color: '#FFFFFF',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: isPending ? 'not-allowed' : 'pointer',
            opacity: isPending ? 0.7 : 1,
            marginBottom: '1rem',
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => !isPending && (e.currentTarget.style.background = 'var(--accent-orange-dark)')}
          onMouseLeave={e => !isPending && (e.currentTarget.style.background = 'var(--accent-orange)')}
        >
          {isPending ? 'Poblando base de datos...' : 'Preparar datos de demostración'}
        </button>

        {/* Navigation Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <a
            href="/pos"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-primary)',
              color: 'var(--accent-orange)',
              border: `1px solid var(--border-color)`,
              padding: '12px 24px',
              borderRadius: '4px',
              textAlign: 'center',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '500',
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
            Punto de Venta
          </a>
          <a
            href="/bodega"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-primary)',
              color: 'var(--accent-orange)',
              border: `1px solid var(--border-color)`,
              padding: '12px 24px',
              borderRadius: '4px',
              textAlign: 'center',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '500',
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
            Bodega
          </a>
          <a
            href="/reportes"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-primary)',
              color: 'var(--accent-orange)',
              border: `1px solid var(--border-color)`,
              padding: '12px 24px',
              borderRadius: '4px',
              textAlign: 'center',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '500',
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
            Reportes
          </a>
          <a
            href="/inventario"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-primary)',
              color: 'var(--accent-orange)',
              border: `1px solid var(--border-color)`,
              padding: '12px 24px',
              borderRadius: '4px',
              textAlign: 'center',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '500',
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
            Inventario
          </a>
          <a
            href="/almacen"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-primary)',
              color: 'var(--accent-orange)',
              border: `1px solid var(--border-color)`,
              padding: '12px 24px',
              borderRadius: '4px',
              textAlign: 'center',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '500',
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
            Almacén
          </a>
          <a
            href="/compras"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-primary)',
              color: 'var(--accent-orange)',
              border: `1px solid var(--border-color)`,
              padding: '12px 24px',
              borderRadius: '4px',
              textAlign: 'center',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '500',
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
            Compras
          </a>
          <a
            href="/contabilidad"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-primary)',
              color: 'var(--accent-orange)',
              border: `1px solid var(--border-color)`,
              padding: '12px 24px',
              borderRadius: '4px',
              textAlign: 'center',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '500',
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
            Contabilidad
          </a>
          <a
            href="/entregas"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-primary)',
              color: 'var(--accent-orange)',
              border: `1px solid var(--border-color)`,
              padding: '12px 24px',
              borderRadius: '4px',
              textAlign: 'center',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '500',
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
            Entregas
          </a>
        </div>

        {/* Admin Section - Solo para Dueño */}
        {userRole === 'dueno' && (
          <div style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            background: 'var(--bg-primary)',
            border: `2px solid var(--accent-orange)`,
            borderRadius: '8px'
          }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '700',
              color: 'var(--accent-orange)',
              margin: '0 0 1rem 0',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              ⚙️ Administración
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
                padding: '12px 24px',
                borderRadius: '4px',
                textDecoration: 'none',
                fontSize: '15px',
                fontWeight: '600',
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
              👥 Gestionar Usuarios
            </a>
          </div>
        )}

        {/* Credentials */}
        <div style={{
          background: 'var(--bg-tertiary)',
          border: `1px solid var(--border-color)`,
          borderRadius: '4px',
          padding: '1rem',
          fontSize: '13px',
          color: 'var(--text-secondary)',
          lineHeight: '1.8'
        }}>
          <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>
            Credenciales de demostración:
          </strong>
          Dueño: dueno@ferreteria.com / password123<br />
          Vendedor: vendedor@ferreteria.com / password123
        </div>
      </div>
    </main>
  )
}
