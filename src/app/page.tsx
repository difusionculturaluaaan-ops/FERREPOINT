'use client'

import { useTransition } from 'react'

export default function Home() {
  const [isPending, startTransition] = useTransition()

  const handleSeed = async () => {
    startTransition(async () => {
      try {
        const res = await fetch('/api/seed', { method: 'POST' })
        const data = await res.json()
        if (data.success) {
          alert('✓ Base de datos poblada con datos de demo\n\n' +
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
    <main style={{ padding: '2rem', maxWidth: '600px' }}>
      <h1>🏗️ FERREPOINT</h1>
      <p style={{ fontSize: '16px', color: '#666', marginBottom: '2rem' }}>
        Sistema SaaS multi-tenant para gestión integral de ferreterías
      </p>

      <div style={{
        background: '#f0f0f0',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h2 style={{ fontSize: '18px', marginBottom: '1rem' }}>✨ Fase 1 (MVP)</h2>
        <ul style={{ fontSize: '14px', lineHeight: '1.8', color: '#555' }}>
          <li>✅ Base de datos (SQLite)</li>
          <li>✅ Prisma ORM multi-tenant</li>
          <li>✅ Stack: Next.js 15 + React 18</li>
          <li>✅ API endpoints (POS, Productos)</li>
          <li>✅ Interfaz POS (carrito, cobro, ticket)</li>
          <li>🔄 Bodega (órdenes de surtido, checklist)</li>
          <li>⏳ Reportes (KPIs)</li>
          <li>⏳ Inventario (CRUD productos)</li>
        </ul>
      </div>

      <button
        onClick={handleSeed}
        disabled={isPending}
        style={{
          background: '#E8610A',
          color: '#fff',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: isPending ? 'not-allowed' : 'pointer',
          opacity: isPending ? 0.7 : 1,
          marginBottom: '1rem',
          width: '100%'
        }}
      >
        {isPending ? '⏳ Poblando BD...' : '🌱 Poblar BD con datos de demo'}
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        <a
          href="/pos"
          style={{
            display: 'block',
            background: '#2B2F35',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '8px',
            textAlign: 'center',
            textDecoration: 'none',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          📊 POS
        </a>
        <a
          href="/bodega"
          style={{
            display: 'block',
            background: '#E8610A',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '8px',
            textAlign: 'center',
            textDecoration: 'none',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          🏭 Bodega
        </a>
      </div>

      <p style={{ fontSize: '12px', color: '#999', lineHeight: '1.6' }}>
        <strong>Credenciales de demo:</strong><br/>
        Dueño: dueno@ferreteria.com / password123<br/>
        Vendedor: vendedor@ferreteria.com / password123
      </p>
    </main>
  )
}
