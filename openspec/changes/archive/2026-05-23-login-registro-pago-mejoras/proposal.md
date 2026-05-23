# Proposal: Login/Registro/Pago — UX Redesign & Fiscal Data

## Intent

Tres mejoras convergentes en la experiencia de onboarding y pago: (1) el login tiene un layout obsoleto (centrado, sin personalidad), (2) el registro no captura datos fiscales venezolanos necesarios para facturación, y (3) el flujo de pago en Bs no permite al usuario ingresar cuánto pagó realmente, obligando a conciliación manual. Además el sistema aún se autodenomina "PedidoClaro" en la Landing Page.

## Scope

### In Scope
- **LoginPage**: Rediseño split layout (izquierda formulario, derecha ilustración), conservando funcionalidad y ruta
- **LandingPage**: Reemplazar 6 ocurrencias de "PedidoClaro" por "PanchoPOS" (navbar, features, demo, footer)
- **RegisterPage**: Agregar campos — Documento de Identidad, Teléfono (select código país + input), RIF de la empresa
- **DB `perfiles`**: Migración para agregar columnas `document_id`, `phone`, `rif`
- **Trigger `handle_new_user()`**: Extraer nuevos campos de `raw_user_meta_data` y guardarlos en `perfiles`
- **AuthContext `signUp()`**: Pasar nuevos campos como user_metadata
- **SuscripcionPage**: Diálogo de pago rediseñado — mostrar monto esperado en USD + Bs (tasa BCV), campo para que el usuario ingrese monto REAL pagado en Bs, campo banco de origen, y mostrar diferencia en UI
- **AdminPage**: Tabla de pagos con columnas: banco de origen, monto Bs pagado vs esperado

### Out of Scope
- Traducción multi-idioma
- Integración con pasarela de pago automática (Zelle, PayPal, etc.)
- Dark mode para login/register
- Validación de RIF contra SENIAT
- Edición de datos fiscales desde perfil de usuario (post-registro)

## Capabilities

### New Capabilities
- `fiscal-data-capture`: Captura de documento de identidad, teléfono con código de país, y RIF durante el registro

### Modified Capabilities
- `auth`: LoginPage cambia layout significativamente (split vs centrado)
- `subscription-payment`: Pago en Bs cambia de automático a input manual con conciliación visual

## Approach

**Login**: Split layout usando grid CSS. Left panel: formulario centrado verticalmente con Card simplificado + logo PanchoPOS + link a registro. Right panel: ilustración SVG o placeholder decorativo (misma lógica de auth, solo cambia el markup).

**Registro**: Agregar 3 secciones al formulario — Datos del dueño (nombre, documento, teléfono), Datos de la empresa (nombre/RIF), Credenciales (email, contraseña). Usar `Input` con `select` para código de país. Los nuevos campos viajan como `raw_user_meta_data` en `supabase.auth.signUp()`. El trigger `handle_new_user()` los extrae y persiste en `perfiles`.

**Pago**: El diálogo muestra dos secciones — "Esperado" (USD + conversión a Bs a tasa BCV) y "Pagado" (campos editables: monto Bs real, banco de origen, referencia, teléfono). El monto Bs real se guarda en `amount_bs` (ya existe). El banco de origen se guarda en `bank_origin` (columna ya existe). La UI muestra la diferencia si el usuario pagó de más o de menos.

**Rebranding**: Regex replace en LandingPage para "PedidoClaro" → "PanchoPOS". Incluir navbar, descripciones, footer y copyright.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/pages/LoginPage.tsx` | Modified | Split layout, misma lógica de auth |
| `src/pages/LandingPage.tsx` | Modified | 6x "PedidoClaro" → "PanchoPOS" |
| `src/pages/RegisterPage.tsx` | Modified | +3 campos, +secciones, nuevo layout |
| `src/pages/SuscripcionPage.tsx` | Modified | Diálogo: monto Bs editable, banco origen |
| `src/pages/AdminPage.tsx` | Modified | Tabla pagos: banco origen, monto Bs vs esperado |
| `src/contexts/AuthContext.tsx` | Modified | signUp pasa nuevos campos como metadata |
| `supabase/.../migration.sql` | New | ALTER TABLE perfiles ADD COLUMN ... |
| `supabase/.../migration.sql` | New | CREATE OR REPLACE FUNCTION handle_new_user() |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Trigger `handle_new_user()` modificado puede romper registro existente | Medium | Probar en branch de Supabase primero. Hacer migration reversible. |
| Layout split puede romper en móviles muy angostos | Low | Right panel se oculta en <768px con stack vertical |
| Usuarios existentes sin datos fiscales | Low | Columnas nullable, sin migración de backfill |
| Landing Page rebranding deja algún "PedidoClaro" residual | Low | Revisión visual + grep post-cambio |

## Rollback Plan

Por commit independiente por feature. Cada feature tiene su propio commit atómico:

1. `git revert <commit-login>` si el split layout falla
2. `git revert <commit-register>` si los campos nuevos rompen el registro
3. `git revert <commit-payment>` si el diálogo de pago tiene bugs
4. `git revert <commit-rebrand>` si queda algún PedidoClaro

La migración de DB tiene su propio `supabase migration down` o revert manual con `ALTER TABLE perfiles DROP COLUMN`.

## Dependencies

- Supabase branch de desarrollo para probar cambios en trigger y schema
- `handle_new_user()` debe modificarse SIN perder la lógica existente (tenant + perfil + suscripción trial + ubicación)

## Success Criteria

- [ ] LoginPage tiene layout split en desktop, stack en mobile, misma funcionalidad
- [ ] RegisterPage envía documento, teléfono y RIF; se guardan en `perfiles`
- [ ] Diálogo de pago muestra monto USD + Bs esperado, usuario ingresa Bs real + banco origen
- [ ] AdminPage muestra banco origen, monto Bs pagado vs esperado en tabla de pagos
- [ ] LandingPage no contiene "PedidoClaro" — solo "PanchoPOS"
- [ ] `npm run dev` build sin errores
- [ ] `npm run test` pasa
