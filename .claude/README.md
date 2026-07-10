# FERREPOINT — Claude/AI Infrastructure

> Sistema de soporte para la IA en el desarrollo de FERREPOINT

---

## 📁 Estructura

```
.claude/
├── skills/              # Comandos especializados por dominio
├── PRPs/                # Product Requirements Proposals
├── memory/              # Memoria persistente (git-versioned)
└── design-systems/      # Sistemas visuales
```

---

## 📚 Skills (Comandos IA)

### Disponibles

- `/setup-ferreteria` — Crear tenant + datos iniciales
- `/add-pos` — Módulo POS completo
- `/add-bodega` — Bodega visual + surtido
- `/add-entregas` — Entregas con geolocación
- `/add-contabilidad` — Reportes financieros
- `/add-cfdi` — Facturación CFDI 4.0
- `/prp-ferreteria` — Plan de feature (dominio ferreterías)
- `/bucle-agentico` — Ejecutar PRP por fases

### Invocación

```
Usuario: "Necesito entregas en mapa"
→ IA reconoce `/add-entregas`
→ Ejecuta skill automáticamente
```

---

## 📋 PRPs (Product Requirements)

Blueprints de features **antes** de codificar.

```
prp-base.md → Copia como PRP-001-nombre.md → Completa → Aprobado → Código
```

**Estados**: PENDIENTE → APROBADO → EN PROGRESO → COMPLETADO

---

## 🧠 Memory (Memoria Persistente)

Aprendizajes acumulativos. **NO se resetea entre sesiones.**

```
memory/
├── MEMORY.md                  # Índice
├── user_profile.md            # Quién es el usuario
├── ferrepoint_spec.md         # Especificación del proyecto
├── patterns_and_conventions.md
└── errors_and_fixes.md        # Auto-blindaje
```

---

## 🎨 Design Systems

5 sistemas visuales pre-diseñados:
- Bento Grid
- Gradient Mesh
- Liquid Glass
- Neobrutalism
- Neumorphism

*Adaptados a FERREPOINT (más adelante)*

---

## 📖 Cómo Usar

### Para el usuario

```
"Necesito agregar un módulo de entregas"
→ IA busca skill más cercano (/add-entregas)
→ Ejecuta automáticamente
→ O propone PRP si es complejo
```

### Para la IA

```
1. Leer CLAUDE.md (reglas del juego)
2. Consultar .claude/memory/ (contexto del proyecto)
3. Buscar skill aplicable
4. Si no existe → generar PRP
5. Ejecutar → documentar en memory
```

---

**Last Updated**: Julio 2026
