import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'

const publicRoutes = ['/login', '/api/auth/login', '/_next', '/static']
const roleRoutes: Record<string, string[]> = {
  dueno: ['/', '/admin', '/inventario', '/bodega', '/pos', '/entregas', '/contabilidad', '/reportes'],
  vendedor: ['/pos', '/reportes'],
  cajero: ['/pos', '/reportes'],
  bodeguero: ['/bodega', '/reportes'],
  chofer: ['/entregas']
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('token')?.value

  // Rutas públicas — pasar sin verificación
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Sin token → redirigir a login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Verificar JWT
  try {
    const payload = verifyToken(token)

    // Verificar acceso por rol
    const allowedRoutes = roleRoutes[payload.role as string] || []
    const hasAccess = allowedRoutes.some(route => pathname.startsWith(route))

    if (!hasAccess) {
      // Redirigir al dashboard del rol
      const dashboardMap: Record<string, string> = {
        dueno: '/',
        vendedor: '/pos',
        bodeguero: '/bodega',
        chofer: '/entregas',
        cajero: '/pos'
      }
      return NextResponse.redirect(new URL(dashboardMap[payload.role as string] || '/login', request.url))
    }

    return NextResponse.next()
  } catch (error) {
    // Token inválido — redirigir a login
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: ['/((?!_next|static|favicon|api).*)']
}
