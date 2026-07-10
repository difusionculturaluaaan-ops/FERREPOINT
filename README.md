# 🏗️ FERREPOINT — SaaS Multi-Tenant para Ferreterías

Sistema completo de gestión para ferreterías mexicanas con POS, Bodega, Entregas, Contabilidad y Facturación CFDI.

![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React 19](https://img.shields.io/badge/React-19-blue?logo=react)
![Prisma 5](https://img.shields.io/badge/Prisma-5-2D3748)
![Neon PostgreSQL](https://img.shields.io/badge/Neon-PostgreSQL-336791?logo=postgresql)
![Tailwind 3.4](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwindcss)

---

## 🚀 Quick Start

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar base de datos (Neon)

```bash
# Copiar template
cp .env.example .env

# Editar .env con credenciales de Neon
# DATABASE_URL=postgresql://...
# DATABASE_URL_UNPOOLED=postgresql://...

# Ejecutar migraciones
npm run db:push

# (Opcional) Ver datos en Prisma Studio
npm run db:studio
```

### 3. Iniciar dev

```bash
npm run dev
```

- App: http://localhost:3000
- API: http://localhost:3000/api

---

## 📦 Stack

| Capa | Tecnología | Razón |
|------|------------|-------|
| **Frontend** | Next.js 16 + React 19 | Full-stack, menos código |
| **Backend** | Next.js API Routes | Same codebase, type-safe |
| **Database** | Neon (PostgreSQL) | Serverless, cheap, RLS |
| **ORM** | Prisma 5 | Type-safe, multi-tenant ready |
| **Auth** | JWT | Stateless, simple |
| **Styling** | Tailwind CSS 3.4 | Rápido, consistente |
| **Deployment** | Vercel | Native Next.js |

---

## 📊 Módulos

### MVP (Fase 1) ✅

- ✅ **POS** — Venta en mostrador
- ✅ **Bodega** — Órdenes de surtido
- ✅ **Inventario** — CRUD de productos
- ✅ **Reportes** — KPIs del día

### Fase 2 ⏳

- 🔄 **Entregas** — Kanban + Geolocación

### Fase 3 ⏳

- 🔄 **Contabilidad** — CxC, CxP, Márgenes
- 🔄 **Compras** — Entrada de mercancía

### Fase 4 ⏳

- 🔄 **CFDI 4.0** — Facturación automática

---

## 🏗️ Estructura del Proyecto

```
ferrepoint/
├── src/
│   ├── app/                    # App Router (Next.js)
│   │   ├── (auth)/
│   │   ├── (dashboard)/
│   │   └── api/
│   ├── features/               # Feature-First Architecture
│   │   ├── pos/
│   │   ├── bodega/
│   │   ├── entregas/
│   │   └── auth/
│   ├── components/             # Componentes compartidos
│   ├── lib/                    # Utils
│   └── types/                  # TypeScript types
├── prisma/
│   └── schema.prisma           # Database schema
├── .claude/                    # AI Infrastructure
│   ├── skills/                 # Comandos especializados
│   ├── PRPs/                   # Blueprints de features
│   ├── memory/                 # Memoria persistente
│   └── design-systems/
├── CLAUDE.md                   # Documento maestro (IA)
└── package.json
```

---

## 🗄️ Database (Neon + Prisma)

### Multi-Tenant Architecture

```
businesses (Tenant raíz)
  ├── locations (Sucursales)
  │   ├── products
  │   ├── sales
  │   ├── surtido_orders
  │   ├── deliveries
  │   └── cash_registers
  └── users (Empleados + roles)
```

### Row-Level Security (RLS)

Neon + Prisma maneja aislamiento de tenants automáticamente.

---

## 🔐 Roles + Permisos

| Rol | Módulos | Permisos |
|-----|---------|----------|
| **Dueño** | Todos | Ver costos, invitar usuarios |
| **Vendedor** | POS | Solo precios de venta |
| **Cajero** | Caja | Corte de caja |
| **Bodeguero** | Bodega | Sin ver precios |
| **Chofer** | Entregas | Solo sus entregas |

---

## 📝 Datos de Demo

Cada ferretería nueva recibe automáticamente:

```javascript
// 1 negocio
{ name: "Ferretería Centro", rfc: "FCE200101ABC" }

// 12 productos iniciales
Estuco, Yeso, Cemento, Block, Varilla, Malla, Pintura, Impermeabilizante, Tubo, Pala...

// 5 usuarios demo
Dueño, Vendedor 1, Vendedor 2, Bodeguero, Chofer

// Órdenes de surtido de ejemplo
```

---

## 🛠️ Desarrollo

### Crear nueva feature

```bash
# 1. Crear PRP en .claude/PRPs/
# 2. Ejecutar skill /bucle-agentico
# 3. Skill automáticamente:
#    - Crea/modifica DB (prisma/)
#    - Crea server actions (src/features/*/server.ts)
#    - Crea UI components (src/features/*/components/)
```

### Estructura Feature

```
src/features/pos/
├── components/
│   ├── Cart.tsx
│   ├── ProductCard.tsx
│   └── PaymentForm.tsx
├── hooks/
│   ├── useCart.ts
│   └── usePOS.ts
├── server.ts              # Server actions
├── types.ts               # Tipos locales
└── layout.tsx
```

### Server Actions (Type-Safe)

```typescript
// src/features/pos/server.ts
"use server"

export async function actionCreateSale(input: SaleInput) {
  const sale = await prisma.sale.create({ data: ... })
  return sale
}
```

### Components

```typescript
// src/features/pos/components/Cart.tsx
"use client"

export function Cart() {
  const handleCheckout = async () => {
    const result = await actionCreateSale(cartData)
    // ...
  }
}
```

---

## 🧪 Testing

```bash
npm run test              # Unit tests
npm run test:e2e         # End-to-end (Playwright)
```

---

## 🚢 Deployment

```bash
# Auto-deploy a Vercel en merge a main
git merge feature/nueva-feature
git push origin main
```

**Vercel detecta Next.js automáticamente.**

---

## 📖 Documentación

- **CLAUDE.md** — Guía completa para IA (Decision tree, Skills, Flujos)
- **.claude/README.md** — Infraestructura de IA (Skills, PRPs, Memory)
- **prisma/schema.prisma** — Schema multi-tenant

---

## 🐛 Reportar Bugs

Bug encontrado → Documenta en `.claude/memory/errors_and_fixes.md` → Auto-blindaje para próxima vez

---

## 📞 Stack

- **Questions?** Ver CLAUDE.md
- **Need help?** Consulta `.claude/` subdirectories
- **Docs**: Neon, Prisma, Next.js 16

---

**Última actualización**: Julio 2026  
**Versión**: 0.1.0 (MVP)  
**Estado**: En construcción 🏗️
