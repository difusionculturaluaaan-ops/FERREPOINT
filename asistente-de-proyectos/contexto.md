# FERREPOINT — Contexto General del Proyecto & Arquitectura SaaS Multi-Tenant

**Última actualización:** 2026-08-08  
**Estado:** Producción Activa en Vercel  
**URL de Producción:** [https://ferrepoint.vercel.app](https://ferrepoint.vercel.app)  
**Demo Cliente Interactiva:** [https://ferrepoint.vercel.app/demo.html](https://ferrepoint.vercel.app/demo.html)

---

## 🎯 Visión del Proyecto
FERREPOINT es un sistema integral **SaaS Multi-Tenant** diseñado específicamente para cadenas y negocios de ferreterías, materiales de construcción y acabados. Permite administrar múltiples empresas clientes (Tenants), sucursales, inventarios, puntos de venta (POS), surtido en bodega por pasillos, choferes y despachos, flujo de caja, cobranza y contabilidad.

---

## 💻 Stack Tecnológico
- **Framework**: Next.js 15 (App Router, React 18, Server Actions, API Routes)
- **Lenguaje**: TypeScript
- **Base de Datos**: PostgreSQL alojado en **Neon** (Prisma ORM 5.22)
- **Autenticación**: JWT (jose), bcryptjs, cookies HTTP & `localStorage`
- **Real-Time Notifications**: Server-Sent Events / Event Emitter (`useRealtimeEvents`)
- **Estilos**: Vanilla CSS con variables CSS personalizadas y diseño responsivo flotante
- **Integraciones**: WhatsApp API (`wa.me`) para comprobantes directos, Facturama (CFDI 4.0)

---

## 👥 Jerarquía de Roles & Permisos Multi-Tenant

| Rol | Clave | Nivel | Responsabilidades y Accesos |
| :--- | :--- | :--- | :--- |
| **Super Admin SaaS** | `super_admin` | Plataforma Global | Control total de empresas clientes (`Business`), asignación de Planes y activaciones modulares en `/superadmin`. Sin restricción por sucursal. |
| **Admin Empresa (Dueño)** | `admin` / `dueno` | Tenant (Empresa) | Gestión de sucursales, finanzas, reportes consolidados y alta/edición de empleados en `/admin/usuarios`. |
| **Encargado de Sucursal** | `encargado` | Sucursal Específica | Gerencia de tienda, inventarios locales, transferencias de stock y corte de caja diario. |
| **Vendedor** | `vendedor` | Mostrador / POS | Creación de ventas, carrito, comprobantes WhatsApp, consulta de productos e historial. |
| **Cajero** | `cajero` | Caja & Cobranza | Cobro de órdenes enviadas a caja en `/caja`, selección de método de pago y corte de caja. |
| **Bodeguero** | `bodeguero` | Almacén | Surtido de pedidos organizados por pasillos y nivel de anaquel en `/bodega`. |
| **Chofer** | `chofer` | Logística | Tablero Kanban de despachos a domicilio y entregas en `/entregas`. |

---

## 🧩 Activación Modular de Procesos (Feature Toggling por Tenant)

Cada empresa cliente (`Business`) tiene un arreglo `enabledModules String[]` en Prisma que define qué servicios tiene contratados y activos:

1. `pos` — 🛒 Punto de Venta (Ventas, tickets y comprobantes WhatsApp - *Siempre activo*)
2. `inventario` — 📦 Gestión de Inventario & Stock
3. `caja` — 💳 Caja & Cobros Pendientes
4. `bodega` — 🗺 Bodega & Surtido por Pasillos
5. `entregas` — 🚚 Entregas & Choferes
6. `compras` — 🛒 Compras & Proveedores
7. `contabilidad` — 💰 Contabilidad & Márgenes
8. `cxc` — 📋 Cuentas por Cobrar & Fiados
9. `facturacion` — 🧾 Facturación CFDI 4.0

### Enfoque de Seguridad:
- **Middleware**: Intercepta rutas (`/entregas`, `/bodega`, etc.) y verifica `payload.enabledModules` en el token JWT. Redirige a `/` si el módulo no está contratado.
- **Dashboard (`/`)**: Renderiza dinámicamente los botones de los módulos contratados por el tenant.
- **SuperAdmin (`/superadmin`)**: Formulario con checkboxes para activar/desactivar módulos por ferretería.

---

## 🛒 Punto de Venta (POS) & Comprobantes

- **Formas de Pago**: `💵 Efectivo`, `💳 Tarjeta`, `🏦 Transferencia`, `💳 Crédito` (Fiado / CxC).
- **Tipos de Comprobante**: `📄 Completo`, `📋 Resumido`, `💬 WhatsApp` (formato con emojis y total), `🚫 Sin papel`.
- **Modo Flotante**: Dialog emergente centrado con desenfoque de fondo (`backdrop-filter: blur(3px)`).
- **Auto-Seeding**: Si un nuevo tenant tiene 0 productos al ingresar a POS o Inventario, el sistema le siembra automáticamente 12 productos ferreteros base (Estuco, Pintura, Tornillos, Clavos, Cemento, Tubo PVC, etc.).

---

## 🔑 Credenciales de Acceso Rápidas

| Tipo de Cuenta | Correo Electrónico | Contraseña |
| :--- | :--- | :--- |
| **Super Admin SaaS** | `superadmin@ferrepoint.com` | `password123` |
| **Business Admin (Ferretodo)** | `demoferretodo@ferreteria.com` | `password123` |
| **Admin Empresa (Matriz)** | `admin@ferreteria.com` | `password123` |
| **Vendedor Demo** | `vendedor@ferreteria.com` | `password123` |
| **Cajero Demo** | `cajero@ferreteria.com` | `password123` |

---

## 📁 Estructura del Código

```
FERREPOINT/
├── prisma/
│   ├── schema.prisma          # Esquema Multi-Tenant Neon PostgreSQL
│   └── seed.ts                # Seeder inicial
├── src/
│   ├── app/
│   │   ├── page.tsx           # Dashboard principal con filtrado modular
│   │   ├── login/page.tsx     # Pantalla de Login limpia
│   │   ├── superadmin/        # Panel Global SaaS SuperAdmin
│   │   ├── admin/usuarios/   # Administración de empleados y roles
│   │   ├── pos/               # Punto de Venta interactivo
│   │   ├── caja/              # Cobro de órdenes y cortes de caja
│   │   ├── bodega/            # Surtido por pasillo
│   │   ├── inventario/        # Catálogo, costos y márgenes
│   │   └── entregas/          # Kanban de despachos
│   ├── features/
│   │   ├── auth/server.ts     # Login, tokens, tenants y roles
│   │   ├── pos/server.ts      # Venta, cobro, folios y autorresolución de businessId
│   │   └── inventario/server.ts
│   ├── lib/
│   │   ├── seedTenantCatalog.ts # Catálogo base autosembrable para nuevos tenants
│   │   ├── jwt.ts
│   │   └── prisma.ts
│   └── middleware.ts          # Control de acceso JWT y Feature Flags por URL
└── asistente_de_proyectos/
    └── contexto.md            # Documentación completa del proyecto
```
