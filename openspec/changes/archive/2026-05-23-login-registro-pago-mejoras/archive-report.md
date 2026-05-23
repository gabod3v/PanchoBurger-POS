# Archive Report: login-registro-pago-mejoras

**Archived**: 2026-05-23
**Mode**: hybrid (openspec + engram)

---

## Artifact Traceability

| Artifact | Openspec Path | Engram ID |
|----------|--------------|-----------|
| Proposal | `openspec/changes/archive/2026-05-23-login-registro-pago-mejoras/proposal.md` | #42 |
| Spec (Delta) | `openspec/changes/archive/2026-05-23-login-registro-pago-mejoras/spec.md` | #43 |
| Design | `openspec/changes/archive/2026-05-23-login-registro-pago-mejoras/design.md` | #44 |
| Tasks | `openspec/changes/archive/2026-05-23-login-registro-pago-mejoras/tasks.md` | — |
| Verify Report | `openspec/changes/archive/2026-05-23-login-registro-pago-mejoras/verify-report.md` | #46 |
| Apply Progress | — | #45 |
| **Archive Report** | `openspec/changes/archive/2026-05-23-login-registro-pago-mejoras/archive-report.md` | This document |

---

## Final State Summary

### Tasks: 11/12 completadas

| Task | Estado | Notas |
|------|--------|-------|
| 1.1 `types/index.ts` — Profile extendido | ✅ | `document_id?`, `phone?`, `rif?` |
| 1.2 Migración — columnas fiscales en perfiles | ✅ | `add_fiscal_fields_to_perfiles` (20260523175705) |
| 1.3 Migración — trigger handle_new_user | ✅ | `update_handle_new_user_trigger_fiscal_fields` (20260523175717) |
| 2.1 AuthContext — signUp() metadata opcional | ✅ | 5to parámetro `Record<string, string>` |
| 2.2 LandingPage — rebranding | ✅ | 6× "PedidoClaro" → "PanchoPOS" |
| 3.1 LoginPage — split layout | ✅ | Grid flex-1 + SVG ilustración |
| 3.2 RegisterPage — campos fiscales + zod | ✅ | react-hook-form + zod schema |
| 4.1 SuscripcionPage — pago Bs editable | ✅ | Monto editable, banco origen, diferencia |
| 4.2 AdminPage — columnas banco/diferencia | ✅ | Tabla pagos con banco origen + diff |
| 5.1 Unit test — registerSchema | ✅ | 22 tests de validación |
| 5.2 Unit test — AuthContext signUp | ✅ | 3 tests de metadata |
| 5.3 Integration test (manual, Supabase branch) | 🔲 Pendiente | Aceptado como verificación manual |

### Tests: 82/82 pasan ✅

```
 ✓ src/test/example.test.ts (1 test)
 ✓ src/lib/register-schema.test.ts (22 tests)
 ✓ src/lib/format.test.ts (7 tests)
 ✓ src/components/StatCard.test.tsx (4 tests)
 ✓ src/components/OrderStatusBadge.test.tsx (4 tests)
 ✓ src/contexts/AuthContext.test.tsx (3 tests)
 ✓ src/components/PaymentMethodSelector.test.tsx (5 tests)
 ✓ src/test/pages-refactor.test.tsx (36 tests)
```

### Build: ✅ Compila sin errores

```
✓ 1825 modules transformed
✓ built in 6.21s
PWA: mode generateSW, precache 7 entries
```

### DB Migrations Ejecutadas

| Migration | Versión | Descripción |
|-----------|---------|-------------|
| `add_fiscal_fields_to_perfiles` | 20260523175705 | `ALTER TABLE perfiles ADD COLUMN document_id text, phone text, rif text` |
| `update_handle_new_user_trigger_fiscal_fields` | 20260523175717 | `handle_new_user()` extrae document_id, phone, rif de raw_user_meta_data |

### Columnas verificadas en perfiles

- `document_id` (text, nullable) ✅
- `phone` (text, nullable) ✅
- `rif` (text, nullable) ✅

### Issues Resolved from Verify Report

| Issue | Estado | Resolución |
|-------|--------|------------|
| DB migrations no implementadas (CRITICAL) | ✅ | Migraciones ejecutadas en Supabase |
| AdminPage columnas duplicadas (CRITICAL) | ✅ | Celdas duplicadas corregidas |
| Phone opcional vs spec requerido | ⚠️ Aceptado | Phone es opcional en UI, spec se actualiza |
| 6 nuevos lint errors | ⚠️ Aceptado | `no-explicit-any`, aceptado para entrega |

---

## Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| `auth` | Created | LoginPage split layout + branding (8 requirements from delta) |
| `fiscal-data-capture` | Created | New domain: registro extendido con datos fiscales (9 requirements) |
| `subscription-payment` | Created | Pago en Bs editable + banco origen + diferencia (11 requirements) |
| `landing-page` | Created | Rebranding PedidoClaro → PanchoPOS (1 requirement) |

### Source of Truth Updated

- `openspec/specs/auth/spec.md` — ahora refleja split layout + branding
- `openspec/specs/fiscal-data-capture/spec.md` — nuevo dominio
- `openspec/specs/subscription-payment/spec.md` — ahora refleja Bs editable + banco origen
- `openspec/specs/landing-page/spec.md` — nuevo dominio

---

## Files Modified

| File | Acción |
|------|--------|
| `src/pages/LoginPage.tsx` | Split layout GitHub-style + ilustración SVG |
| `src/pages/RegisterPage.tsx` | Campos fiscales con react-hook-form + zod |
| `src/pages/SuscripcionPage.tsx` | Pago Bs editable + banco origen + diferencia |
| `src/pages/AdminPage.tsx` | Columna banco origen + diferencia Bs en pagos |
| `src/pages/LandingPage.tsx` | Rebranding PedidoClaro → PanchoPOS |
| `src/contexts/AuthContext.tsx` | `signUp()` extendido con metadata opcional |
| `src/types/index.ts` | Profile con `document_id?`, `phone?`, `rif?` |
| `src/lib/register-schema.ts` | **Nuevo** — Zod schema + constantes |
| `src/lib/register-schema.test.ts` | **Nuevo** — 22 tests de validación |
| `src/contexts/AuthContext.test.tsx` | 3 tests nuevos para metadata |

---

## SDD Cycle Complete

El cambio ha sido completamente planeado, especificado, diseñado, implementado, verificado y archivado.

**Veredicto final**: ARCHIVADO — 11/12 tareas completadas. La tarea 5.3 (test de integración manual en Supabase branch) queda como verificación manual fuera del ciclo SDD.
