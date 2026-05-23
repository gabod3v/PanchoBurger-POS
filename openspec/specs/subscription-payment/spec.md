# Subscription Payment — Pago en Bs Real

> **Source**: Delta spec from `login-registro-pago-mejoras` change (archived 2026-05-23)
> **Status**: Current

---

## Requisitos Funcionales

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

## Escenarios

### Escenario P-H1: Pago con monto exacto

- **GIVEN** un usuario en el diálogo de pago para plan Professional ($59)
- **WHEN** el diálogo muestra: Esperado $59 ≈ Bs 3,422 (tasa 58), y el usuario ingresa monto Bs real = 3,422
- **THEN** el sistema guarda `amount_bs = 3422` y `bank_origin = "BANCO DE VENEZUELA"`
- **AND** la UI muestra "Monto exacto — sin diferencia"

### Escenario P-H2: Pago con monto diferente

- **GIVEN** un usuario pagó por transferencia un monto redondeado
- **WHEN** ingresa Bs 3,500 como monto real (esperado era 3,422)
- **THEN** el sistema guarda `amount_bs = 3500` (el valor real)
- **AND** la UI muestra "Pagaste Bs 78.00 adicionales" con indicador visual

### Escenario P-E1: Referencia vacía

- **GIVEN** un usuario en el diálogo de pago
- **WHEN** intenta confirmar sin ingresar número de referencia
- **THEN** el botón "Confirmar Pago" se mantiene deshabilitado
- **AND** se muestra validación en el campo referencia

### Escenario P-E2: Sin tasa BCV disponible

- **GIVEN** un usuario en el diálogo de pago
- **WHEN** `exchange_rate` es 0 (no hay sesión del día)
- **THEN** se muestra mensaje: "Tasa BCV no disponible. Contacta al administrador."
- **AND** el campo monto Bs esperado se oculta
- **AND** el usuario puede ingresar monto Bs manualmente

### Escenario P-E3: Admin visualiza pago con banco de origen

- **GIVEN** un super_admin en el tab de Pagos de AdminPage
- **WHEN** hay pagos pendientes con `bank_origin` poblado
- **THEN** la tabla muestra la columna "Banco Origen" con el valor
- **AND** la tabla muestra "Bs Pagado | Bs Esperado | Diferencia"

## Validaciones

| Campo | Validación |
|-------|------------|
| Monto Bs real | `required`, `min=0`, numérico con 2 decimales |
| Banco de origen | `required`, selección de lista o input "Otro" |
| Teléfono origen | `optional`, con código de país si se ingresa |
| Referencia | `required`, mínimo 3 caracteres |
| Diferencia Bs | Solo visual — no bloquea el envío |

## Criterios de Aceptación

- [ ] Diálogo de pago muestra: monto USD, equivalente Bs sugerido (tasa BCV), campo Bs editable
- [ ] Usuario puede seleccionar banco de origen (predefinido + "Otro")
- [ ] Usuario puede ingresar teléfono con código de país
- [ ] Diferencia Bs se muestra visualmente
- [ ] `INSERT` guarda `amount_bs` real y `bank_origin`
- [ ] AdminPage muestra banco de origen y diferencia Bs en tabla de pagos
- [ ] `npm run build` sin errores
- [ ] `npm run test` pasa
