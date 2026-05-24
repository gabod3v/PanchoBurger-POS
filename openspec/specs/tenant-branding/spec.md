# Tenant Branding Specification

> Full spec from `company-branding` change.

## Requirements

### R-1: Columnas de color en `inquilinos`

| Columna | Default | CSS Var |
|---------|---------|---------|
| `primary_color` | `0 0% 9%` | `--primary` |
| `accent_color` | `217 91% 60%` | `--accent` |
| `sidebar_color` | `0 0% 9%` | `--sidebar-primary` |

- **R-1-H1**: GIVEN tenant sin colores → WHEN consulta → THEN NULL, sistema aplica defaults.
- **R-1-H2**: GIVEN tenant existente → WHEN owner guarda colores → THEN persisten en `inquilinos`.

### R-2: Bucket `tenant-logos`

Bucket público-lectura, RLS escritura solo owner/manager del tenant.

- **R-2-H1**: GIVEN owner autenticado → WHEN sube imagen (PNG/JPG/WebP, ≤2MB) a `tenant-logos/{id}/logo.*` → THEN guarda + `logo_url` actualizado.
- **R-2-E1**: GIVEN cashier → WHEN intenta upload → THEN 403.

### R-3: CSS vars dinámicas

AuthContext inyecta `--primary`, `--accent`, `--sidebar-primary` en `:root` tras cargar tenant.

- **R-3-H1**: GIVEN tenant con `primary_color` seteado → WHEN AuthContext carga → THEN `document.documentElement.style.setProperty(...)` + shadcn/ui lo refleja.
- **R-3-E1**: GIVEN colores NULL → WHEN carga completa → THEN vars mantienen defaults de `index.css`.
- **R-3-H2**: GIVEN colores personalizados → WHEN recarga → THEN re-inyecta sin FOUC.

### R-4: Header y Sidebar dinámicos

Layout MUST usar tenant name + logo. No hardcodea "Pancho Burger" ni `/logo.png`.

- **R-4-H1**: GIVEN tenant con `name` y `logo_url` → WHEN renderiza → THEN header + sidebar muestran logo y nombre.
- **R-4-E1**: GIVEN `logo_url IS NULL` → WHEN renderiza → THEN icono `Store` de lucide como placeholder.

### R-5: Página `/configuracion`

Ruta para owner/super_admin: formulario con nombre, logo upload+preview, 3 color pickers HSL con swatches + preview en vivo.

- **R-5-H1**: GIVEN owner en `/configuracion` → WHEN cambia color en picker → THEN CSS var se actualiza en vivo, preview refleja.
- **R-5-H2**: GIVEN cambios pendientes → WHEN "Guardar" → THEN persiste (nombre, logo_url, 3 colores) + toast.
- **R-5-E1**: GIVEN cashier → WHEN navega a `/configuracion` → THEN redirect a `/dashboard`.

### R-6: Retrocompatibilidad

Todos los cambios retrocompatibles: tenants legacy sin branding ven defaults sin cambios.

- **R-6-H1**: GIVEN tenant preexistente con logo_url=NULL, colores=NULL → WHEN usa sistema → THEN UI con defaults + icono Store, sin errores ni cambios visuales.

## Criterios de Aceptación

- [ ] Inquilinos sin branding usan defaults sin errores
- [ ] Owner personaliza colores y logo desde `/configuracion`
- [ ] Colores persisten en recarga y aplican en toda la UI
- [ ] Logo en header mobile + sidebar desktop
- [ ] RLS impide upload por cashier/kitchen_staff
- [ ] Sin "Pancho Burger" hardcodeado en Layout
- [ ] `npm run build` sin errores
