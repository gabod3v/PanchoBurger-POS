# Fiscal Data Capture — Registro Extendido

> **Source**: Delta spec from `login-registro-pago-mejoras` change (archived 2026-05-23)
> **Status**: Current

---

## Requisitos Funcionales

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

## Validaciones por Campo

| Campo | Tipo | Validación | Error |
|-------|------|------------|-------|
| Documento de Identidad | Tipo: select (V, E, Pasaporte) + número: input | Requerido. V/E + 6-8 dígitos. Pasaporte: 6-12 alfanumérico | "Debe indicar V/E seguido del número de cédula" |
| Teléfono | Código país: select + número: input | Requerido. Código país obligatorio. Mínimo 7 dígitos después del código | "Debe ingresar un teléfono válido con código de país" |
| RIF | Input con formato automático | Requerido. Formato: `[JGVEP]-[0-9]{8,9}-[0-9]` | "El RIF debe tener formato: J-XXXXXXXX-X" |
| Nombre completo | Input | Requerido (existente) | Sin cambios |
| Email | Email input | Requerido, formato email (existente) | Sin cambios |
| Contraseña | Password input | Mínimo 6 caracteres (existente) | Sin cambios |

## Escenarios

### Escenario F-H1: Registro completo exitoso

- **GIVEN** un usuario nuevo en la página de registro
- **WHEN** completa todos los campos (nombre, documento V-12345678, teléfono +584141234567, RIF J-12345678-9, email, password, confirmación)
- **THEN** `signUp()` envía los datos a Supabase con `raw_user_meta_data` conteniendo `full_name`, `tenant_name`, `document_id`, `phone`, `rif`
- **AND** el trigger `handle_new_user()` crea tenant, perfil (con nuevos campos), suscripción trial y ubicación
- **AND** se muestra pantalla de éxito con mensaje de confirmación

### Escenario F-H2: Solo cédula venezolana

- **GIVEN** un usuario que selecciona "V" como tipo de documento
- **WHEN** ingresa "12345678" como número
- **THEN** el campo se valida como válido (V + 8 dígitos)
- **AND** `raw_user_meta_data.document_id` se envía como "V-12345678"

### Escenario F-E1: Formato RIF inválido

- **GIVEN** un usuario completando el formulario
- **WHEN** ingresa un RIF sin formato correcto (ej: "123456789")
- **THEN** se muestra error: "El RIF debe tener formato: J-XXXXXXXX-X"
- **AND** el formulario NO se envía

### Escenario F-E2: Teléfono sin código de país

- **GIVEN** un usuario en el campo teléfono
- **WHEN** intenta enviar sin seleccionar código de país
- **THEN** se muestra error: "Debe seleccionar un código de país"
- **AND** el envío se bloquea

### Escenario F-E3: Contraseñas no coinciden

- **GIVEN** un usuario que llenó todos los campos
- **WHEN** password y confirmPassword son diferentes
- **THEN** se muestra "Las contraseñas no coinciden"
- **AND** no se envía la petición

### Escenario F-E4: Error de BD (trigger falla)

- **GIVEN** un usuario que se registra exitosamente en Auth
- **WHEN** el trigger `handle_new_user()` falla (ej. columna no existe aún)
- **THEN** el usuario de Auth se crea pero el perfil queda incompleto
- **AND** se loguea el error en Supabase para depuración
- **AND** el frontend muestra mensaje genérico de error

## Criterios de Aceptación

- [ ] Los 3 nuevos campos aparecen en el formulario con validaciones funcionales
- [ ] `signUp()` acepta y envía `document_id`, `phone`, `rif` como `user_metadata`
- [ ] Migración `ALTER TABLE perfiles ADD COLUMN` ejecutada sin errores
- [ ] Trigger `handle_new_user()` extrae y guarda los nuevos campos en `perfiles`
- [ ] La suscripción trial y ubicación por defecto se siguen creando (no regression)
- [ ] `npm run build` sin errores
- [ ] `npm run test` pasa
