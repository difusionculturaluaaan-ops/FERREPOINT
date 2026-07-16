import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { canAccessModule } from '@/lib/plans'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
)

const publicRoutes = ['/login', '/api/auth/login', '/upgrade', '/_next', '/static']
const roleRoutes: Record<string, string[]> = {
  dueno: ['/', '/admin', '/inventario', '/bodega', '/pos', '/caja', '/entregas', '/contabilidad', '/reportes'],
  vendedor: ['/pos', '/reportes'],
  cajero: ['/caja', '/pos', '/reportes'],
  bodeguero: ['/bodega', '/reportes'],
  chofer: ['/entregas']
}

// Map routes to modules for plan checking
const routeModules: Record<string, string> = {
  '/bodega': 'bodega',
  '/entregas': 'entregas',
  '/contabilidad': 'contabilidad',
  '/inventario': 'inventario',
  '/reportes': 'reportes',
  '/pos': 'pos'
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('token')?.value

  console.log('[Middleware] Path:', pathname, 'Has token:', !!token)

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
    const verified = await jwtVerify(token, secret)
    const payload = verified.payload

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
        cajero: '/caja'
      }
      return NextResponse.redirect(new URL(dashboardMap[payload.role as string] || '/login', request.url))
    }

    // Verificar acceso por plan (solo para módulos que requieren plan)
    // Nota: En producción, esto se verificaría contra la BD del negocio
    // Por ahora, confiar en que el cliente valida contra localStorage

    return NextResponse.next()
  } catch (error) {
    console.log('[Middleware] Token verification failed:', error)
    // Token inválido — redirigir a login
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: ['/((?!_next|static|favicon|api).*)']
}
