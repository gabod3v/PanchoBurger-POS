# SDD Tasks: Multi-Tenant SaaS Platform

## Phase 1 — Auth Foundation ✅ DONE

| # | Task | Status | Files |
|---|------|--------|-------|
| 1 | Add Profile, Tenant, Subscription, UserRole types | ✅ | `src/types/index.ts` |
| 2 | Create AuthContext with signIn/signUp/signOut/refreshProfile | ✅ | `src/contexts/AuthContext.tsx` |
| 3 | Create LoginPage | ✅ | `src/pages/LoginPage.tsx` |
| 4 | Create RegisterPage | ✅ | `src/pages/RegisterPage.tsx` |
| 5 | Create ProtectedRoute component | ✅ | `src/components/ProtectedRoute.tsx` |
| 6 | Update App.tsx with AuthProvider + auth routes | ✅ | `src/App.tsx` |
| 7 | Fix auth trigger for perfiles table | ✅ | Migration `fix_auth_trigger_for_perfiles` |
| 8 | Verify build + tests pass | ✅ | Build OK, 57 tests pass |

## Phase 2 — Multi-Tenant Integration 🟡 IN PROGRESS

| # | Task | Status | Files |
|---|------|--------|-------|
| 1 | Create useTenant hook (scoped queries) | ✅ | `src/hooks/useTenant.ts` |
| 2 | Inject tenant_id in AppContext INSERT mutations | ✅ | `src/contexts/AppContext.tsx` |
| 3 | Draft RLS backfill migration | ✅ | `openspec/.../draft-rls-backfill.sql` |
| 4 | Create useTenant docs and spec | ✅ | `openspec/.../multi-tenant-integration.md` |
| **5** | **Backfill tenant_id for existing data** | ⏳ PENDING | Manual SQL in Supabase (after review) |
| **6** | **Enable RLS on business tables** | ⏳ PENDING | Manual SQL (after backfill) |
| **7** | **Update order_items → items_pedido in AppContext** | ⏳ PENDING | `AppContext.tsx` reads/writes |
| **8** | **Add subscription status check (active/trial/expired)** | ⏳ PENDING | AuthContext or new hook |

## Phase 3 — Org Setup & Team Management 🔲 NOT STARTED

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Create OrgSetupWizard page | 🔲 | 4-step wizard (info, products, team, done) |
| 2 | Create TeamManagement page | 🔲 | List, invite, role management |
| 3 | Create ProfilePage | 🔲 | Name, email, role display |
| 4 | Add setup_completed flag to profiles | 🔲 | Redirect new users to wizard |
| 5 | Update ProtectedRoute for setup check | 🔲 | Route to wizard if !setup_completed |

## Phase 4 — Subscription & Billing 🔲 NOT STARTED

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Create Stripe Checkout Edge Function | 🔲 | |
| 2 | Create Stripe webhook handler | 🔲 | Update suscripciones on payment |
| 3 | Add plan feature flags | 🔲 | Expose via AuthContext |
| 4 | Create billing portal page | 🔲 | Manage subscription |

## Phase 5 — Landing & Marketing 🔲 NOT STARTED

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Landing page with pricing | 🔲 | |
| 2 | Onboarding flow | 🔲 | |
| 3 | Help/documentation | 🔲 | |

## Review Workload Forecast

| Phase | Estimated Lines | Chained PRs |
|-------|----------------|-------------|
| Phase 1 | ~350 | ✅ Done (branch: feat/saas-phase-1) |
| Phase 2 | ~200 (code) + migrations | ✅ Single PR after review |
| Phase 3 | ~500 | ✅ Chained PR recommended |
| Phase 4 | ~400+ | ✅ Chained PR recommended |
| Phase 5 | ~300 | ✅ Single PR |
