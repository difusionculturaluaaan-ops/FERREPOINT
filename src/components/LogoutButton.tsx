'use client'

import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    document.cookie = 'token=; Max-Age=0'
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        padding: '8px 16px',
        background: 'var(--accent-orange)',
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.opacity = '0.9'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.opacity = '1'
      }}
    >
      Cerrar Sesión
    </button>
  )
}
