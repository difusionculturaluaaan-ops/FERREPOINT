'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { actionGetUsers, actionCreateUser, actionUpdateUser } from '@/features/auth/server'
import { LogoutButton } from '@/components/LogoutButton'
import { ThemeToggle } from '@/components/ThemeToggle'

interface User {
  id: string
  email: string
  name: string
  role: string
  active: boolean
  createdAt: Date | string
}

const ROLES = [
  { key: 'dueno', label: '👑 Dueño', color: '#e8632c' },
  { key: 'bodeguero', label: '📦 Bodeguero', color: '#b088d1' },
  { key: 'vendedor', label: '🛒 Vendedor', color: '#5b9bd9' },
  { key: 'cajero', label: '💳 Cajero', color: '#4fae82' },
  { key: 'chofer', label: '🚚 Chofer', color: '#d68b5f' }
]

export default function UsuariosPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'vendedor',
    password: ''
  })

  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; general?: string }>({})

  const businessId = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}').businessId : ''

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    if (!businessId) return
    setLoading(true)
    const data = await actionGetUsers(businessId)
    setUsers(data)
    setLoading(false)
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) ||
                          user.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: typeof errors = {}

    if (!form.name) newErrors.name = 'Nombre requerido'
    if (!form.email) newErrors.email = 'Email requerido'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Email inválido'
    if (!editingId && !form.password) newErrors.password = 'Contraseña requerida'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})

    try {
      if (editingId) {
        await actionUpdateUser(editingId, {
          name: form.name,
          email: form.email,
          role: form.role
        })
        setToast('Usuario actualizado')
      } else {
        await actionCreateUser(businessId, form.email, form.password, form.name, form.role as any)
        setToast('Usuario creado. Se envió una contraseña temporal por correo.')
      }

      setShowModal(false)
      setForm({ name: '', email: '', role: 'vendedor', password: '' })
      await loadUsers()
    } catch (error) {
      setErrors({ general: 'Error al guardar usuario' })
    }
  }

  const handleNewUser = () => {
    setEditingId(null)
    setForm({ name: '', email: '', role: 'vendedor', password: '' })
    setErrors({})
    setShowModal(true)
  }

  const handleEdit = (user: User) => {
    setEditingId(user.id)
    setForm({ name: user.name, email: user.email, role: user.role, password: '' })
    setErrors({})
    setShowModal(true)
  }

  const handleToggleActive = async (user: User) => {
    await actionUpdateUser(user.id, { active: !user.active })
    setToast(user.active ? 'Usuario desactivado' : 'Usuario activado')
    await loadUsers()
  }

  if (toast) {
    setTimeout(() => setToast(''), 3000)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)' }}>
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
            FERREPOINT / Usuarios
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>

      {/* Page Header */}
      <div style={{ padding: '32px 32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
              Gestión de Usuarios
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0' }}>
              Administra empleados, roles y permisos
            </p>
          </div>
          <button
            onClick={handleNewUser}
            style={{
              padding: '10px 20px',
              background: 'var(--accent-orange)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            + Nuevo Usuario
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {ROLES.map(role => {
            const count = users.filter(u => u.role === role.key && u.active).length
            return (
              <div key={role.key} style={{
                background: 'var(--bg-primary)',
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                  {role.label.split(' ')[0]}
                </div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: role.color, marginBottom: '4px' }}>
                  {count}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {role.label.split(' ').slice(1).join(' ')}
                </div>
              </div>
            )
          })}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1,
              minWidth: '250px',
              padding: '10px 14px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '13px'
            }}
          />
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['all', ...ROLES.map(r => r.key)].map(role => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                style={{
                  padding: '8px 14px',
                  background: roleFilter === role ? 'var(--accent-orange)' : 'var(--bg-primary)',
                  color: roleFilter === role ? '#fff' : 'var(--text-primary)',
                  border: `1px solid ${roleFilter === role ? 'var(--accent-orange)' : 'var(--border-color)'}`,
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                {role === 'all' ? 'Todos' : ROLES.find(r => r.key === role)?.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            Cargando...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            Sin resultados
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              background: 'var(--bg-primary)',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid var(--border-color)'
            }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '12px', color: 'var(--text-primary)' }}>
                    Usuario
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '12px', color: 'var(--text-primary)' }}>
                    Rol
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '12px', color: 'var(--text-primary)' }}>
                    Estado
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '12px', color: 'var(--text-primary)' }}>
                    Alta
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', fontSize: '12px', color: 'var(--text-primary)' }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, idx) => (
                  <tr key={user.id} style={{
                    borderBottom: idx < filteredUsers.length - 1 ? '1px solid var(--border-color)' : 'none'
                  }}>
                    <td style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        background: 'var(--bg-secondary)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '600',
                        fontSize: '12px'
                      }}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)' }}>
                          {user.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {user.email}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <div style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: `${ROLES.find(r => r.key === user.role)?.color}20`,
                        color: ROLES.find(r => r.key === user.role)?.color
                      }}>
                        {ROLES.find(r => r.key === user.role)?.label}
                      </div>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: user.active ? '#3fb950' : '#8b8b8d'
                        }} />
                        <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                          {user.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {new Date(user.createdAt).toLocaleDateString('es-MX')}
                    </td>
                    <td style={{ padding: '14px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleEdit(user)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--accent-orange)',
                          cursor: 'pointer',
                          fontSize: '16px',
                          marginRight: '12px'
                        }}
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => handleToggleActive(user)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--accent-orange)',
                          cursor: 'pointer',
                          fontSize: '16px'
                        }}
                      >
                        {user.active ? '⏸' : '▶'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
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
        }} onClick={() => setShowModal(false)}>
          <div
            style={{
              background: 'var(--bg-primary)',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '400px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: '1px solid var(--border-color)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 1.5rem 0' }}>
              {editingId ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>

            {errors.general && (
              <div style={{
                background: 'rgba(220, 53, 50, 0.12)',
                border: '1px solid #dc3532',
                borderRadius: '6px',
                padding: '10px',
                marginBottom: '1rem',
                fontSize: '13px',
                color: '#ff6b66'
              }}>
                ⚠️ {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem'
                }}>
                  Nombre
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'var(--bg-secondary)',
                    border: errors.name ? '1px solid #dc3532' : '1px solid var(--border-color)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
                {errors.name && <div style={{ fontSize: '11px', color: '#ff6b66', marginTop: '4px' }}>{errors.name}</div>}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem'
                }}>
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'var(--bg-secondary)',
                    border: errors.email ? '1px solid #dc3532' : '1px solid var(--border-color)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
                {errors.email && <div style={{ fontSize: '11px', color: '#ff6b66', marginTop: '4px' }}>{errors.email}</div>}
              </div>

              {!editingId && (
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '12.5px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'var(--bg-secondary)',
                      border: errors.password ? '1px solid #dc3532' : '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                  {errors.password && <div style={{ fontSize: '11px', color: '#ff6b66', marginTop: '4px' }}>{errors.password}</div>}
                </div>
              )}

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '0.75rem'
                }}>
                  Rol
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {ROLES.map(role => (
                    <button
                      key={role.key}
                      type="button"
                      onClick={() => setForm({ ...form, role: role.key })}
                      style={{
                        padding: '8px 14px',
                        background: form.role === role.key ? role.color : 'var(--bg-secondary)',
                        color: form.role === role.key ? '#fff' : 'var(--text-primary)',
                        border: `1px solid ${form.role === role.key ? role.color : 'var(--border-color)'}`,
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {role.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer'
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
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'var(--accent-orange)',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: '600',
          zIndex: 2000,
          animation: 'slideIn 0.3s'
        }}>
          ✓ {toast}
          <style>{`
            @keyframes slideIn {
              from { transform: translateX(400px); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </div>
  )
}
