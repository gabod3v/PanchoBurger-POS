# Landing Page — Rebranding

> **Source**: Delta spec from `login-registro-pago-mejoras` change (archived 2026-05-23)
> **Status**: Current

---

## Requisitos Funcionales

| # | Requisito |
|---|-----------|
| L-1 | Las 6 ocurrencias de "PedidoClaro" en LandingPage DEBEN ser reemplazadas por "PanchoPOS" |

## Escenarios

- **GIVEN** la LandingPage renderizada
- **WHEN** se inspecciona el contenido
- **THEN** no existe el texto "PedidoClaro" en navbar, hero, features, demo, pricing, footer, email, o copyright
- **AND** todas las referencias dicen "PanchoPOS"

## Criterios de Aceptación

- [ ] `grep -r "PedidoClaro" src/pages/LandingPage.tsx` no encuentra resultados
- [ ] El email en el footer cambia a `soporte@panchopos.com`
