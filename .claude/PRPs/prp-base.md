# PRP-XXX: [Título de la Feature]

> **Estado**: PENDIENTE
> **Fecha**: YYYY-MM-DD
> **Módulo**: [POS / Bodega / Entregas / Reportes / Contabilidad / CFDI]

---

## Objetivo

[Qué se construye - estado final deseado en 1-2 oraciones]

*Ejemplo: Crear un mapa visual de la tienda que resalte ubicaciones de productos en el carrito actual.*

---

## Por Qué

| Problema | Solución |
|----------|----------|
| [Dolor del usuario] | [Cómo lo resuelve esta feature] |

**Valor de negocio**: [Impacto medible - velocidad, errores evitados, dinero]

---

## Qué

### Criterios de Éxito

- [ ] [Criterio medible 1]
- [ ] [Criterio medible 2]
- [ ] [Criterio medible 3]

### Datos de Ejemplo

```javascript
// Contexto de datos para la feature
// (Ferretería, productos, usuarios, etc)
```

---

## Contexto

### Referencias

- `src/features/[existente]/` - Patrón a seguir
- [URL de docs relevante]
- [Link a issue/discussion]

### Código Existente

```
src/
├── features/pos/
├── features/bodega/
└── lib/
```

---

## Blueprint (Fases)

### Fase 1: Database

- [ ] Crear/modificar tablas en Prisma
- [ ] Ejecutar `npm run db:push`
- [ ] Generar tipos con `npm run db:generate`

### Fase 2: API (Server Actions)

- [ ] Crear server actions en `src/features/[modulo]/server.ts`
- [ ] Validar input con Zod
- [ ] Retornar datos tipados

### Fase 3: UI (Components)

- [ ] Crear componentes React en `src/features/[modulo]/components/`
- [ ] Conectar con server actions
- [ ] Estilar con Tailwind

### Fase 4: Testing

- [ ] Casos de éxito
- [ ] Validaciones
- [ ] Edge cases

---

## Notas de Implementación

(Gotchas, decisiones arquitectónicas, etc)

---

## Aprendizajes (Auto-Blindaje)

(Se actualiza post-implementación)

---

**Template v1** — FERREPOINT PRP System
