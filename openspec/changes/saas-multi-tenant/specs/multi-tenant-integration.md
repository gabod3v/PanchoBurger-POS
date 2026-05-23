# Phase 2 — Multi-Tenant Integration

## Requirements

1. New data (products, categories, sessions, orders) is tagged with `tenant_id`
2. RLS policies can be safely enabled on business tables
3. Existing data is backfilled with a default tenant_id
4. The app gracefully handles both single-tenant (existing) and multi-tenant (new) modes

## Changes

### AppContext (DONE)
- `performMutation` now injects `tenant_id` into all INSERT operations when `AuthContext.tenant` is available (line 281)
- Query reads remain unchanged — RLS handles scoping when enabled

### useTenant hook (DONE)
- `fromTenant(table)` — scoped query builder with `.eq('tenant_id', id)`
- `withTenant(payload)` — adds `tenant_id` to insert data
- `isOwner` / `tenantId` / `tenant` — convenience accessors

### RLS Migration (PENDING — DO NOT APPLY BEFORE BACKFILL)
- Enable RLS on: `productos`, `categorias`, `sesiones_dia`, `pedidos`
- Backfill `tenant_id = <default_tenant_id>` for existing rows
- Migrate `order_items` → `items_pedido` (items_pedido has RLS + tenant_id)
- Test with authenticated user before flipping

### Order Items
- `order_items` table has NO `tenant_id`
- `items_pedido` table EXISTS with `tenant_id` and RLS
- Phase 2 must migrate writes from `order_items` to `items_pedido`
- Read side (order + join) can stay on `order_items` until migration

## Migration Steps (Manual / Script)

1. Create a "default tenant" entry in `inquilinos` for existing data
2. Backfill: `UPDATE productos SET tenant_id = '<default>' WHERE tenant_id IS NULL`
3. Backfill: `UPDATE categorias SET tenant_id = '<default>' WHERE tenant_id IS NULL`
4. Backfill: `UPDATE sesiones_dia SET tenant_id = '<default>' WHERE tenant_id IS NULL`
5. Backfill: `UPDATE pedidos SET tenant_id = '<default>' WHERE tenant_id IS NULL`
6. Copy `order_items` → `items_pedido` (with tenant_id from pedidos join)
7. **ENABLE RLS** on business tables
8. Verify app works with authenticated user
9. Create a test second tenant to verify isolation
