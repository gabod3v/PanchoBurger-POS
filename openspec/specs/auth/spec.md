# Auth — LoginPage

> **Source**: Delta spec from `login-registro-pago-mejoras` change (archived 2026-05-23)
> **Status**: Current

---

## Requisitos Funcionales

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

## Escenarios

### Escenario A-H1: Login exitoso en desktop

- **GIVEN** un usuario en desktop (>768px) en la ruta `/login`
- **WHEN** ingresa email y contraseña válidos y presiona "Iniciar Sesión"
- **THEN** se ejecuta `signIn()` y redirige según su rol (`/dashboard` o `/admin`)
- **AND** el layout muestra formulario izquierdo + imagen derecha

### Escenario A-H2: Login exitoso en mobile

- **GIVEN** un usuario en mobile (<768px) en la ruta `/login`
- **WHEN** ingresa credenciales válidas
- **THEN** el formulario ocupa el ancho completo, la imagen no se renderiza
- **AND** el flujo de auth funciona igual que en desktop

### Escenario A-E1: Error de credenciales

- **GIVEN** un usuario en la pantalla de login
- **WHEN** ingresa email o contraseña incorrectos
- **THEN** se muestra el mensaje de error traducido ("Email o contraseña incorrectos")
- **AND** el formulario permanece en pantalla, los campos se conservan

### Escenario A-E2: Loading state durante submit

- **GIVEN** un usuario que completó el formulario
- **WHEN** presiona "Iniciar Sesión" y la petición está en curso
- **THEN** el botón muestra un spinner (`Loader2`) y se deshabilita
- **AND** se previene doble envío

## Validaciones de UI

| Elemento | Validación |
|----------|------------|
| Email | `type="email"`, `required` |
| Password | `required` |
| Imagen decorativa | `display: none` en <768px, `object-fit: cover` en desktop |

## Criterios de Aceptación

- [ ] Layout split funciona en desktop (2 columnas, formulario centrado)
- [ ] Mobile stack: solo formulario, sin scroll horizontal
- [ ] Todos los textos existentes (branding, errores, links) actualizados a "PanchoPOS"
- [ ] `npm run build` sin errores
- [ ] `npm run test` pasa
