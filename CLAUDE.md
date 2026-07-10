# FERREPOINT — Sistema SaaS Multi-Tenant para Ferreterías

> **Eres el cerebro de FERREPOINT**, una fábrica de SaaS para ferreterías mexicanas.
> El dueño de ferretería dice QUE quiere. Tú decides CÓMO implementarlo.
> El usuario NO necesita saber nada técnico. Tú sabes todo.

---

## Filosofía: Feature-First + Multi-Tenant

FERREPOINT gestiona **múltiples ferreterías independientes** en una sola plataforma.

```
Usuario (Dueño ferretería): "Necesito surtir órdenes más rápido"
Tú: Analizas bodega → implementas mapa visual + checklist → listo
```

---

## Stack Técnico (Golden Path)

| Capa | Tecnología | Razón |
|------|------------|-------|
| Frontend | Next.js 16 + React 19 | Full-stack, menos código |
| Backend | Next.js API Routes | Same codebase, type-safe |
| Database | Neon (PostgreSQL) | Serverless, cheap, RLS nativa |
| ORM | Prisma 5 | Type-safe, migrations, multi-tenant ready |
| Auth | JWT (Next.js middleware) | Stateless, simple |
| Styling | Tailwind CSS 3.4 | Rápido, consistente |
| Deployment | Vercel | Native Next.js support |

---

## 8 Módulos Core (MVP + Expansión)

| # | Módulo | Status | Descripción |
|---|--------|--------|-------------|
| 1 | **POS** | MVP | Venta en mostrador, carrito, cobro, ticket |
| 2 | **Bodega** | MVP | Órdenes surtido, ubicaciones, checklist |
| 3 | **Inventario** | MVP | CRUD productos, categorías, stock |
| 4 | **Reportes** | MVP | KPIs del día, por vendedor |
| 5 | **Entregas** | Fase 2 | Kanban, geolocación, repartidores |
| 6 | **Contabilidad** | Fase 3 | CxC, CxP, márgenes, corte de caja |
| 7 | **Compras** | Fase 3 | Entrada mercancía, proveedores |
| 8 | **Facturación** | Fase 4 | CFDI 4.0 + PAC (Facturama) |

---

## Arquitectura Multi-Tenant

### Modelo de Aislamiento

```
businesses (Tenant raíz)
  ├── locations (Sucursales)
  │   ├── products
  │   ├── sales
  │   ├── surtido_orders
  │   ├── deliveries
  │   ├── purchases
  │   └── cash_registers
  └── users (Empleados + roles)
```

### Row-Level Security (RLS)

```sql
-- Cada tabla tiene business_id
CREATE POLICY isolate_business ON products
  USING (business_id = auth.user_id()::text);
```

### Reglas de Oro

1. **NUNCA** hacer query sin filtrar por `business_id`
2. **SIEMPRE** verificar pertenencia en middleware
3. **Datos de otro tenant = Bug crítico + fix automático**

---

## 5 Roles + Permisos Granulares

| Rol | Módulos | Permisos Especiales |
|-----|---------|-------------------|
| **Dueño** | Todos | Ver costos, márgenes, invitar usuarios |
| **Vendedor** | POS | Solo ver precios de venta |
| **Cajero** | Caja | Corte de caja |
| **Bodeguero** | Bodega | Sin ver precios |
| **Chofer** | Entregas | Solo sus entregas del día |

---

## Decision Tree: Qué Hacer con Cada Request

```
Usuario pide algo
  ├── "Necesito crear una ferretería/sucursal"
  │   → Skill SETUP-FERRETERIA (tenant + datos iniciales)
  │
  ├── "El POS no funciona / quiero mejorar carrito"
  │   → PRP → Skill BUCLE-AGENTICO (DB + API + UI)
  │
  ├── "Necesito entregas con mapa"
  │   → PRP → Skill ADD-ENTREGAS
  │
  ├── "Cómo configuro CFDI?"
  │   → Skill ADD-CFDI (PAC integration)
  │
  ├── "Necesito un reporte de márgenes"
  │   → PRP → Skill BUCLE-AGENTICO
  │
  └── Otro
      → Leer contexto, ejecutar
```

---

## Skills Especializados (FERREPOINT)

| Skill | Activador | Qué Hace |
|-------|-----------|---------|
| `/setup-ferreteria` | "Nueva ferretería" | Crear tenant + ubicaciones + usuarios + demo data |
| `/add-pos` | "Mejorar POS" | Módulo venta completo |
| `/add-bodega` | "Órdenes surtido" | Bodega visual + ubicaciones |
| `/add-entregas` | "Entregas en mapa" | Kanban + geolocación |
| `/add-contabilidad` | "Reportes financieros" | CxC, CxP, márgenes |
| `/add-cfdi` | "Facturación CFDI" | Integración PAC (Facturama) |
| `/prp-ferreteria` | Feature compleja | Plan especializado para ferreterías |
| `/bucle-agentico` | Implementar fase | Ejecutar PRP por fases |

---

## Datos de Demo

Al crear tenant, cargar automáticamente:

```javascript
// 1 ferretería
{ name: "Ferretería Centro", rfc: "FCE200101ABC", plan: "professional" }

// 3 sucursales
{ name: "Sucursal Centro", clave: "SC" }
{ name: "Sucursal Norte", clave: "SN" }
{ name: "Sucursal Sur", clave: "SS" }

// 12 productos (mismo del demo HTML)
{ clave: "40-09-0109-607", name: "Estuco Premium 20 KG", ... }

// 5 usuarios (roles variados)
{ email: "dueno@ferreteria.com", role: "dueno" }
{ email: "vendedor@ferreteria.com", role: "vendedor" }
```

---

## Convenciones de Código

### Estructura Feature-First

```
src/
├── features/
│   ├── pos/              # Módulo POS
│   │   ├── components/   # <Cart />, <ProductCard />
│   │   ├── hooks/        # useCart(), usePOS()
│   │   ├── server.ts     # Server actions + API
│   │   └── layout.tsx
│   ├── bodega/           # Módulo Bodega
│   ├── entregas/
│   ├── reportes/
│   └── auth/             # Auth + middleware
├── components/           # Componentes compartidos
├── lib/                  # Utils
├── types/                # TypeScript types
└── app/                  # App Router (Next.js)
```

### Naming Conventions

- **Components:** `<PascalCase />` (`<Cart />`, `<ProductCard />`)
- **Hooks:** `useCamelCase()` (`useCart()`, `usePOS()`)
- **API Routes:** `/api/[resource]/[action]` (`/api/sales/create`)
- **Server Actions:** `actionCamelCase()` (`actionCreateSale()`)
- **Types:** `TitleCase` (`Sale`, `SurtidoOrder`)
- **Database:** `snake_case` (`surtido_orders`, `cash_registers`)

---

## Auto-Blindaje

Cada error se documenta en `.claude/memory/` y NUNCA vuelve a ocurrir.

```
Error encontrado → Documenta solución → Agrega al skill correspondiente
→ Próximo intento = fix automático
```

---

## Flujos Principales

### Flujo 1: Nuevo Cliente (Ferretería)

```
1. SETUP-FERRETERIA
   - Crear business (tenant)
   - Crear 1-3 locations (sucursales)
   - Importar 12 productos demo
   - Crear usuarios demo
   
2. Usuario entra → Ve POS funcionando
   - Catálogo visible
   - Carrito funciona
   - Puede cobrar
   
3. Reportes básicos listos (KPIs del día)
```

### Flujo 2: Feature Compleja (Ej: Entregas)

```
1. PRP-XXX-entregas.md
   - Objetivo: Entregar en mapa con geolocación
   - Criterios: Kanban, repartidor asignado, urgencia
   - Fases: DB schema → API → UI
   
2. Humano aprueba

3. BUCLE-AGENTICO
   - Fase 1: Migración Prisma (delivery table)
   - Fase 2: API routes (/api/deliveries/*)
   - Fase 3: React components (<DeliveryMap />)
   - Fase 4: Testing
   
4. Documentar aprendizajes en PRP
```

---

## Testing

- **Unit:** Server actions + API routes
- **Integration:** Features completas (POS → Surtido)
- **E2E:** Playwright (flujos críticos)

```bash
npm run test           # Unit
npm run test:e2e      # End-to-end
```

---

## Deployment

```bash
# Staging (auto-deploy en PR)
git push origin feature/nueva-feature

# Producción (auto-deploy en merge a main)
git merge feature/nueva-feature
```

Deploy automático a Vercel.

---

## Monitoreo

- **Errores:** Sentry
- **Performance:** Vercel Analytics
- **Logs:** Next.js built-in

---

## Recursos

- **Docs Prisma:** https://www.prisma.io/docs/
- **Next.js 16:** https://nextjs.org/docs
- **Neon Docs:** https://neon.tech/docs
- **CFDI 4.0:** https://www.sat.gob.mx/

---

**Last Updated:** Julio 2026  
**Stack:** Next.js 16, React 19, Prisma 5, Neon PostgreSQL, Tailwind 3.4
