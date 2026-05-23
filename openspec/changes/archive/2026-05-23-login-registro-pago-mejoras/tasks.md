# Tasks: Login/Registro/Pago — UX Redesign & Fiscal Data

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~320–420 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | exception-ok |
| Chain strategy | size-exception |

```
Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Medium
```

## Phase 1: Foundation (Types + DB)

- [x] 1.1 `src/types/index.ts` — Add `document_id?`, `phone?`, `rif?` to `Profile`
- [ ] 1.2 `supabase/migrations/..._add_fiscal_columns.sql` — `ALTER TABLE perfiles ADD COLUMN document_id text, phone text, rif text`
- [ ] 1.3 `supabase/migrations/..._update_trigger.sql` — Update `handle_new_user()` to extract `document_id`, `phone`, `rif` from `raw_user_meta_data` and persist in `perfiles`

## Phase 2: Auth & Branding

- [x] 2.1 `src/contexts/AuthContext.tsx` — Extend `signUp()` signature: add 5th optional param `metadata?: Record<string, string>`, pass as `options.data`
- [x] 2.2 `src/pages/LandingPage.tsx` — Replace 6× "PedidoClaro" → "PanchoPOS", "PC" → "PP", email `soporte@panchopos.com`

## Phase 3: UI — Login & Register

- [x] 3.1 `src/pages/LoginPage.tsx` — Restructure to grid 2-column: left = form (centered), right = SVG illustration. Mobile: single column (form only). Keep exact same auth logic, error/loading states, redirect, link to register
- [x] 3.2 `src/pages/RegisterPage.tsx` — Migrate from `useState` to `react-hook-form` + `zod`. Add sections: Datos del dueño (document ID, phone with country code), Datos de la empresa (RIF), Credenciales. Pass new fields as `metadata` to `signUp()`. Keep existing success/error/loading states

## Phase 4: UI — Payment & Admin

- [x] 4.1 `src/pages/SuscripcionPage.tsx` — Redesign payment dialog: section "Esperado" (USD + Bs conversion), section "Pagado" (editable Bs amount, bank origin select + "Otro", phone origin with country code). Show difference indicator. Save `amount_bs` real + `bank_origin`
- [x] 4.2 `src/pages/AdminPage.tsx` — Update `PaymentRow` type with `bank_origin?`. Add "Banco Origen" column to pending payments table. Add "Banco Origen" + "Bs Pagado | Bs Esperado | Diferencia" columns to history table

## Phase 5: Testing

- [x] 5.1 Unit test — Zod `registerSchema` validation (valid/invalid document, RIF format, phone, password match)
- [x] 5.2 Unit test — `AuthContext.signUp()` passes `metadata` as `options.data` to Supabase
- [ ] 5.3 Integration test (manual on Supabase branch) — Insert auth user with `raw_user_meta_data` containing new fields, verify `handle_new_user()` populates `perfiles` correctly

## Implementation Order

Foundation → Auth & Branding → Login/Register UI → Payment/Admin UI → Tests. DB migrations run first so trigger and schema are ready before RegisterPage sends data.

## Review Workload Forecast

- Estimated changed lines: ~320–420
- 400-line budget risk: Medium
- Chained PRs recommended: No
- Delivery strategy: exception-ok
- Decision needed before apply: No
