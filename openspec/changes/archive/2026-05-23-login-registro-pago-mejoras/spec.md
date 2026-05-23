# Delta Specs: Login/Registro/Pago — UX Redesign & Fiscal Data

> **Change**: `login-registro-pago-mejoras`  
> **Domains**: `auth` (modified), `fiscal-data-capture` (new), `subscription-payment` (modified)

---

## 1. Auth — LoginPage (MODIFIED)

### Requisitos Funcionales

| # | Requisito | Criterio |
|---|-----------|----------|
| A-1 | La pantalla de login DEBE usar layout split en desktop (≥768px): formulario a la izquierda, imagen decorativa a la derecha | CSS Grid / Flexbox 50/50 |
| A-2 | En mobile (<768px) DEBE ocultar el panel derecho y mostrar solo el formulario a ancho completo | Hidden + stack |
| A-3 | El panel izquierdo DEBE centrar verticalmente el Card del formulario | Flexbox centrado |
| A-4 | El formulario DEBE mantener los campos: email, password, botón submit, error message, loading state | Sin cambios de lógica |
| A-5 | El branding DEBE mostrar "PanchoPOS" (ya no dice PedidoClaro) | Texto actualizado |
| A-6 | El link a registro DEBE permanecer funcional: `Link to="/register"` | Ruta existente |
| A-7 | El panel derecho DEBE mostrar una imagen/ilustración decorativa alusiva a PanchoPOS (burger, POS, restaurante) | SVG o imagen placeholder |
| A-8 | La lógica de auth (`signIn`, redirect por rol) NO DEBE modificarse | Misma implementación |

### Escenarios

#### Escenario A-H1: Login exitoso en desktop

- **GIVEN** un usuario en desktop (>768px) en la ruta `/login`
- **WHEN** ingresa email y contraseña válidos y presiona "Iniciar Sesión"
- **THEN** se ejecuta `signIn()` y redirige según su rol (`/dashboard` o `/admin`)
- **AND** el layout muestra formulario izquierdo + imagen derecha

#### Escenario A-H2: Login exitoso en mobile

- **GIVEN** un usuario en mobile (<768px) en la ruta `/login`
- **WHEN** ingresa credenciales válidas
- **THEN** el formulario ocupa el ancho completo, la imagen no se renderiza
- **AND** el flujo de auth funciona igual que en desktop

#### Escenario A-E1: Error de credenciales

- **GIVEN** un usuario en la pantalla de login
- **WHEN** ingresa email o contraseña incorrectos
- **THEN** se muestra el mensaje de error traducido ("Email o contraseña incorrectos")
- **AND** el formulario permanece en pantalla, los campos se conservan

#### Escenario A-E2: Loading state durante submit

- **GIVEN** un usuario que completó el formulario
- **WHEN** presiona "Iniciar Sesión" y la petición está en curso
- **THEN** el botón muestra un spinner (`Loader2`) y se deshabilita
- **AND** se previene doble envío

### Validaciones de UI

| Elemento | Validación |
|----------|------------|
| Email | `type="email"`, `required` |
| Password | `required` |
| Imagen decorativa | `display: none` en <768px, `object-fit: cover` en desktop |

### Criterios de Aceptación

- [ ] Layout split funciona en desktop (2 columnas, formulario centrado)
- [ ] Mobile stack: solo formulario, sin scroll horizontal
- [ ] Todos los textos existentes (branding, errores, links) actualizados a "PanchoPOS"
- [ ] `npm run build` sin errores
- [ ] `npm run test` pasa

---

## 2. Fiscal Data Capture — Registro Extendido (NEW)

### Requisitos Funcionales

| # | Requisito | Criterio |
|---|-----------|----------|
| F-1 | El formulario de registro DEBE organizarse en secciones: Datos del dueño, Datos de la empresa, Credenciales | Layout con separadores |
| F-2 | El campo Documento de Identidad DEBE soportar: cédula (V/E + 6-8 dígitos) o pasaporte (letras + dígitos) | Selector de tipo + input |
| F-3 | El campo Teléfono DEBE incluir selector de código de país con bandera (+58 para Venezuela por defecto) | Select con flag + Input |
| F-4 | El campo RIF DEBE validar formato venezolano: `[J|G|V|E]-XXXXXXXX-X` | Regex validation |
| F-5 | Todos los nuevos campos DEBEN pasarse como `raw_user_meta_data` en `supabase.auth.signUp()` | Extender `options.data` |
| F-6 | La función `signUp()` en `AuthContext` DEBE aceptar los nuevos parámetros | Modificar firma |
| F-7 | La migración de BD DEBE agregar columnas `document_id`, `phone`, `rif` a `perfiles` | Nullable, sin defaults |
| F-8 | El trigger `handle_new_user()` DEBE extraer `document_id`, `phone`, `rif` de `raw_user_meta_data` y guardarlos en `perfiles` | Sin romper lógica existente |
| F-9 | La validación de password (≥6 chars, confirmación) DEBE mantenerse sin cambios | Password igual que hoy |

### Validaciones por Campo

| Campo | Tipo | Validación | Error |
|-------|------|------------|-------|
| Documento de Identidad | Tipo: select (V, E, Pasaporte) + número: input | Requerido. V/E + 6-8 dígitos. Pasaporte: 6-12 alfanumérico | "Debe indicar V/E seguido del número de cédula" |
| Teléfono | Código país: select + número: input | Requerido. Código país obligatorio. Mínimo 7 dígitos después del código | "Debe ingresar un teléfono válido con código de país" |
| RIF | Input con formato automático | Requerido. Formato: `[JGVEP]-[0-9]{8,9}-[0-9]` | "El RIF debe tener formato: J-XXXXXXXX-X" |
| Nombre completo | Input | Requerido (existente) | Sin cambios |
| Email | Email input | Requerido, formato email (existente) | Sin cambios |
| Contraseña | Password input | Mínimo 6 caracteres (existente) | Sin cambios |

### Escenarios

#### Escenario F-H1: Registro completo exitoso

- **GIVEN** un usuario nuevo en la página de registro
- **WHEN** completa todos los campos (nombre, documento V-12345678, teléfono +584141234567, RIF J-12345678-9, email, password, confirmación)
- **THEN** `signUp()` envía los datos a Supabase con `raw_user_meta_data` conteniendo `full_name`, `tenant_name`, `document_id`, `phone`, `rif`
- **AND** el trigger `handle_new_user()` crea tenant, perfil (con nuevos campos), suscripción trial y ubicación
- **AND** se muestra pantalla de éxito con mensaje de confirmación

#### Escenario F-H2: Solo cédula venezolana

- **GIVEN** un usuario que selecciona "V" como tipo de documento
- **WHEN** ingresa "12345678" como número
- **THEN** el campo se valida como válido (V + 8 dígitos)
- **AND** `raw_user_meta_data.document_id` se envía como "V-12345678"

#### Escenario F-E1: Formato RIF inválido

- **GIVEN** un usuario completando el formulario
- **WHEN** ingresa un RIF sin formato correcto (ej: "123456789")
- **THEN** se muestra error: "El RIF debe tener formato: J-XXXXXXXX-X"
- **AND** el formulario NO se envía

#### Escenario F-E2: Teléfono sin código de país

- **GIVEN** un usuario en el campo teléfono
- **WHEN** intenta enviar sin seleccionar código de país
- **THEN** se muestra error: "Debe seleccionar un código de país"
- **AND** el envío se bloquea

#### Escenario F-E3: Contraseñas no coinciden

- **GIVEN** un usuario que llenó todos los campos
- **WHEN** password y confirmPassword son diferentes
- **THEN** se muestra "Las contraseñas no coinciden"
- **AND** no se envía la petición

#### Escenario F-E4: Error de BD (trigger falla)

- **GIVEN** un usuario que se registra exitosamente en Auth
- **WHEN** el trigger `handle_new_user()` falla (ej. columna no existe aún)
- **THEN** el usuario de Auth se crea pero el perfil queda incompleto
- **AND** se loguea el error en Supabase para depuración
- **AND** el frontend muestra mensaje genérico de error

### Criterios de Aceptación

- [ ] Los 3 nuevos campos aparecen en el formulario con validaciones funcionales
- [ ] `signUp()` acepta y envía `document_id`, `phone`, `rif` como `user_metadata`
- [ ] Migración `ALTER TABLE perfiles ADD COLUMN` ejecutada sin errores
- [ ] Trigger `handle_new_user()` extrae y guarda los nuevos campos en `perfiles`
- [ ] La suscripción trial y ubicación por defecto se siguen creando (no regression)
- [ ] `npm run build` sin errores
- [ ] `npm run test` pasa

---

## 3. Subscription Payment — Pago en Bs Real (MODIFIED)

### Requisitos Funcionales

| # | Requisito | Criterio |
|---|-----------|----------|
| P-1 | El diálogo de pago DEBE mostrar el monto esperado en USD y su equivalente sugerido en Bs (tasa BCV) | Sección "Esperado" |
| P-2 | El usuario DEBE poder EDITAR el monto en Bs que realmente pagó | Input numérico editable |
| P-3 | El campo `bank_origin` DEBE estar disponible: selector con bancos venezolanos predefinidos O input libre | Select + opción "Otro" |
| P-4 | El campo `phone_origin` DEBE incluir selector de código de país + input (igual que en registro) | Reusing pattern |
| P-5 | La UI DEBE mostrar la diferencia entre monto Bs esperado y monto Bs real pagado | Indicador visual |
| P-6 | Los datos de Pago Móvil (banco, teléfono, RIF, beneficiario) DEBEN mantenerse desde `configuracion_pago` | Sin cambios |
| P-7 | El campo `reference_number` DEBE mantenerse como obligatorio | Sin cambios |
| P-8 | En AdminPage, la tabla de pagos DEBE mostrar columna: Banco de Origen | Nueva columna |
| P-9 | En AdminPage, la tabla de pagos DEBE mostrar columna: Monto Bs Pagado vs Esperado | Diferencia visual |
| P-10 | El `INSERT` en `pagos_suscripcion` DEBE incluir `amount_bs` con el valor REAL ingresado por el usuario | No el calculado automático |
| P-11 | El `INSERT` en `pagos_suscripcion` DEBE incluir `bank_origin` con el banco seleccionado | Columna ya existe en BD |

### Escenarios

#### Escenario P-H1: Pago con monto exacto

- **GIVEN** un usuario en el diálogo de pago para plan Professional ($59)
- **WHEN** el diálogo muestra: Esperado $59 ≈ Bs 3,422 (tasa 58), y el usuario ingresa monto Bs real = 3,422
- **THEN** el sistema guarda `amount_bs = 3422` y `bank_origin = "BANCO DE VENEZUELA"`
- **AND** la UI muestra "Monto exacto — sin diferencia"

#### Escenario P-H2: Pago con monto diferente

- **GIVEN** un usuario pagó por transferencia un monto redondeado
- **WHEN** ingresa Bs 3,500 como monto real (esperado era 3,422)
- **THEN** el sistema guarda `amount_bs = 3500` (el valor real)
- **AND** la UI muestra "Pagaste Bs 78.00 adicionales" con indicador visual

#### Escenario P-E1: Referencia vacía

- **GIVEN** un usuario en el diálogo de pago
- **WHEN** intenta confirmar sin ingresar número de referencia
- **THEN** el botón "Confirmar Pago" se mantiene deshabilitado
- **AND** se muestra validación en el campo referencia

#### Escenario P-E2: Sin tasa BCV disponible

- **GIVEN** un usuario en el diálogo de pago
- **WHEN** `exchange_rate` es 0 (no hay sesión del día)
- **THEN** se muestra mensaje: "Tasa BCV no disponible. Contacta al administrador."
- **AND** el campo monto Bs esperado se oculta
- **AND** el usuario puede ingresar monto Bs manualmente

#### Escenario P-E3: Admin visualiza pago con banco de origen

- **GIVEN** un super_admin en el tab de Pagos de AdminPage
- **WHEN** hay pagos pendientes con `bank_origin` poblado
- **THEN** la tabla muestra la columna "Banco Origen" con el valor
- **AND** la tabla muestra "Bs Pagado | Bs Esperado | Diferencia"

### Validaciones

| Campo | Validación |
|-------|------------|
| Monto Bs real | `required`, `min=0`, numérico con 2 decimales |
| Banco de origen | `required`, selección de lista o input "Otro" |
| Teléfono origen | `optional`, con código de país si se ingresa |
| Referencia | `required`, mínimo 3 caracteres |
| Diferencia Bs | Solo visual — no bloquea el envío |

### Criterios de Aceptación

- [ ] Diálogo de pago muestra: monto USD, equivalente Bs sugerido (tasa BCV), campo Bs editable
- [ ] Usuario puede seleccionar banco de origen (predefinido + "Otro")
- [ ] Usuario puede ingresar teléfono con código de país
- [ ] Diferencia Bs se muestra visualmente
- [ ] `INSERT` guarda `amount_bs` real y `bank_origin`
- [ ] AdminPage muestra banco de origen y diferencia Bs en tabla de pagos
- [ ] `npm run build` sin errores
- [ ] `npm run test` pasa

---

## 4. Rebranding LandingPage

### Requisitos Funcionales

| # | Requisito |
|---|-----------|
| L-1 | Las 6 ocurrencias de "PedidoClaro" en LandingPage DEBEN ser reemplazadas por "PanchoPOS" |

### Scenarios

- **GIVEN** la LandingPage renderizada
- **WHEN** se inspecciona el contenido
- **THEN** no existe el texto "PedidoClaro" en navbar, hero, features, demo, pricing, footer, email, o copyright
- **AND** todas las referencias dicen "PanchoPOS"

### Criterios de Aceptación

- [ ] `grep -r "PedidoClaro" src/pages/LandingPage.tsx` no encuentra resultados
- [ ] El email en el footer cambia a `soporte@panchopos.com`
