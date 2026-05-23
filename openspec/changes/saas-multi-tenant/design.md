# SDD Design: Multi-Tenant SaaS Platform

## Architecture

### Component Tree
```
<AuthProvider>           ← owns user/session/profile/tenant/subscription
  <AppProvider>          ← owns POS state (products, orders, day), now tenant-aware
    <BrowserRouter>
      <ProtectedRoute>  ← redirects to /login if !user
        <Layout>        ← sidebar/nav
          <Pages>       ← POS pages (Index, Menu, CashRegister, etc.)
        </Layout>
      </ProtectedRoute>
    </BrowserRouter>
  </AppProvider>
</AuthProvider>
```

### Data Flow
```
[Supabase Auth] → AuthProvider (user, session)
                      ↓
              [Profile Query] → (perfiles) 
                      ↓
              [Tenant Query] → (inquilinos) → tenant_id
                      ↓
              [Subscription Query] → (suscripciones) → plan/status
                      ↓
              AppProvider uses tenant_id for scoped mutations
```

### Auth Trigger Flow (handle_new_user)
```
[User signs up] → Supabase Auth creates auth.users row
                      ↓
              DB Trigger: on_auth_user_created
                      ↓
              1. INSERT inquilinos (tenant)
              2. INSERT perfiles (profile as owner)
              3. INSERT suscripciones (30-day trial)
              4. INSERT ubicaciones (default location)
                      ↓
              [User receives confirmation email]
```

## Key Decisions

### Why Supabase Auth instead of custom?
- Built-in email/password, magic links, OAuth
- Session management with refresh tokens
- Database triggers can react to user creation
- Saves months of development time

### Why feature-branch-chain for rollout?
- Phase 1 is purely additive (new files) → safe to deploy immediately
- Phase 2 touches DB + existing queries → needs careful review
- Chained PRs keep each review focused and small
- Tracker branch (PR #1) accumulates all phases

### Why not build org-scoped queries into AppContext yet?
- Current queries work because RLS is disabled
- When RLS is enabled, policies auto-scope by tenant_id
- Adding `.eq('tenant_id', id)` would break existing NULL-tenant_id data
- Minimum change needed for now: inject tenant_id on INSERT

## DB Schema (Relevant Tables)

```
inquilinos         →  id, name, slug, logo_url, owner_id, created_at
perfiles           →  id (FK to auth.users), tenant_id, full_name, role, is_active, created_at
suscripciones      →  id, tenant_id, plan, status, expires_at, created_at
ubicaciones        →  id, tenant_id, name, address
invitaciones       →  id, tenant_id, email, role, token, expires_at, accepted_at

productos          →  id, tenant_id, name, price, category, ...
categorias         →  id, tenant_id, name
sesiones_dia       →  id, tenant_id, date, exchange_rate, is_open, ...
pedidos            →  id, tenant_id, day_session_id, ticket_number, customer_name, ...
order_items        →  id, order_id, product_id, quantity       ← NO tenant_id!
items_pedido       →  id, order_id, product_id, quantity, tenant_id  ← HAS tenant_id + RLS
```
