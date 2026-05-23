# ⚠️ RLS BACKFILL & ENABLE MIGRATION
# DO NOT APPLY UNTIL AUTH SYSTEM IS DEPLOYED AND TESTED
# See openspec/changes/saas-multi-tenant/specs/multi-tenant-integration.md

-- =====================================================
-- STEP 1: Create a default tenant for existing data
-- =====================================================
-- Run this AFTER creating at least one admin user via the register form
-- so we know their user_id (replace '<ADMIN_USER_ID>')
--
-- INSERT INTO public.inquilinos (id, name, slug, owner_id)
-- VALUES (gen_random_uuid(), 'Default Tenant', 'default-tenant', '<ADMIN_USER_ID>')
-- RETURNING id;

-- =====================================================
-- STEP 2: Backfill tenant_id on existing rows
-- =====================================================
-- Replace '<DEFAULT_TENANT_ID>' with the ID from step 1
--
-- UPDATE public.productos SET tenant_id = '<DEFAULT_TENANT_ID>' WHERE tenant_id IS NULL;
-- UPDATE public.categorias SET tenant_id = '<DEFAULT_TENANT_ID>' WHERE tenant_id IS NULL;
-- UPDATE public.sesiones_dia SET tenant_id = '<DEFAULT_TENANT_ID>' WHERE tenant_id IS NULL;
-- UPDATE public.pedidos SET tenant_id = '<DEFAULT_TENANT_ID>' WHERE tenant_id IS NULL;

-- =====================================================
-- STEP 3: Migrate order_items → items_pedido
-- =====================================================
-- items_pedido has tenant_id and RLS; order_items does not
--
-- INSERT INTO public.items_pedido (order_id, product_id, quantity, tenant_id)
-- SELECT oi.order_id, oi.product_id, oi.quantity, p.tenant_id
-- FROM public.order_items oi
-- JOIN public.pedidos p ON p.id = oi.order_id
-- WHERE NOT EXISTS (
--   SELECT 1 FROM public.items_pedido ip
--   WHERE ip.order_id = oi.order_id AND ip.product_id = oi.product_id
-- );

-- =====================================================
-- STEP 4: ENABLE RLS on business tables
-- =====================================================
-- POLICIES ALREADY EXIST (defined in 10_enable_rls_business_tables migration)
-- They just need to be enabled:
--
-- ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.sesiones_dia ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.items_pedido ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 5: Update AppContext queries (order_items → items_pedido)
-- =====================================================
-- In AppContext.tsx:
--   - Read: change `items:order_items(...)` to `items:items_pedido(...)` 
--   - Write: change `order_items` to `items_pedido` in addOrder/deleteOrder
--   - The items_pedido join needs to go through products too:
--     items:items_pedido(quantity, product:productos(*))
