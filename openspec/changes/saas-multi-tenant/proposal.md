# SDD Proposal: Multi-Tenant SaaS Platform

## Intent
Transform PanchoBurger-POS from a single-instance POS app into a multi-tenant SaaS platform where fast food businesses pay a subscription to use it.

## Why
The user wants to offer this POS core as a paid service to multiple restaurants. Each business gets their own isolated environment with users, products, orders, and settings.

## Current State (Database Already Has Schema)
The Supabase database already has the complete multi-tenant schema built via migrations:
- `inquilinos` — Organizations/tenants with RLS enabled
- `perfiles` — User profiles per tenant with roles (owner, manager, cashier, kitchen_staff, super_admin)
- `suscripciones` — Subscription plans (basic, professional, enterprise) with status tracking
- `ubicaciones` — Multi-location support per tenant
- `invitaciones` — Team invitation system
- `registros_auditoria` — Audit logs
- `items_pedido` — Order items with RLS (mirrors `order_items`)
- Business tables (`productos`, `categorias`, `sesiones_dia`, `pedidos`) have `tenant_id` columns and RLS policies defined but DISABLED
- Edge Function `webhook-pago-movil-bdv` exists for processing SMS payments

## Scope

### Phase 1 — Auth Foundation
- Auth context/provider with Supabase Auth
- Login/Register/Password recovery pages
- ProtectedRoute component
- Update supabase client
- **No existing pages break** (new files only)

### Phase 2 — Multi-Tenant Integration
- Enable RLS on business tables (critical)
- Migrate existing data to a default tenant
- Update AppContext to use tenant-scoped queries
- Replace `order_items` usage with `items_pedido` (RLS-enabled)
- Add org context/selector

### Phase 3 — Org Setup & Team Management
- Registration flow with org creation
- Org setup wizard (create org, location, first products)
- Team management page (invites, roles)
- Profile management

### Phase 4 — Subscription & Billing
- Stripe Checkout integration via Edge Function
- Subscription status checking
- Plan feature flags (Basic/Professional/Enterprise)
- Billing portal

### Phase 5 — Landing & Marketing
- Landing page with pricing
- Onboarding flow for new users
- Documentation/help pages

## Out of Scope
- Mobile apps (PWA is sufficient)
- Multi-language (English only for now)
- Complex reporting/analytics (future iteration)
- Public API

## Risks
1. **RLS enable breaks existing app** — must coordinate migration with auth rollout
2. **Existing data has NULL tenant_id** — needs backfill to a default tenant
3. **`order_items` has no tenant_id** — must migrate to `items_pedido`
4. **Offline queue lacks tenant context** — `PendingAction` needs tenant_id
