# Tasks: Company Branding

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~350–420 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | exception-ok |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Medium

## Phase 1: Foundation — DB, Types, Helpers

### Task 1.1: Migration — add color columns to inquilinos
**Files**: Supabase migration (new file)
**Acceptance**: `inquilinos` table has `primary_color`, `accent_color`, `sidebar_color` (nullable text). Existing rows unchanged.
**Depends on**: none
**Status**: ✅ Done — applied via supabase_apply_migration

### Task 1.2: Create Supabase Storage bucket `tenant-assets`
**Files**: Supabase console (bucket config, RLS policy)
**Acceptance**: Bucket exists with public read, authenticated write, owner-only upload RLS. Cashier gets 403.
**Depends on**: none
**Status**: ✅ Done — bucket created + RLS policies applied

### Task 1.3: Extend Tenant type with branding fields
**Files**: `src/types/index.ts`
**Acceptance**: `Tenant` interface has `primary_color`, `accent_color`, `sidebar_color` as optional nullable strings. No TS errors.
**Depends on**: none
**Status**: ✅ Done

### Task 1.4: Create branding helpers (`applyBranding`, `resetBranding`, `saveBranding`)
**Files**: `src/lib/branding.ts` (new)
**Acceptance**: `applyBranding(tenant)` sets `--primary`, `--accent`, `--sidebar-background` CSS vars on `document.documentElement`; null values fall through to defaults. `resetBranding()` clears them. `saveBranding()` does `supabase.from('inquilinos').update(...)`.
**Depends on**: 1.3
**Status**: ✅ Done

### Task 1.5: Create default fallback logo SVG
**Files**: `public/default-logo.svg` (new)
**Acceptance**: Inline SVG renders a generic store icon as 32×32 placeholder.
**Depends on**: none
**Status**: ✅ Done

## Phase 2: Core Implementation — Auth, Layout

### Task 2.1: Wire applyBranding into AuthContext
**Files**: `src/contexts/AuthContext.tsx`
**Acceptance**: After `loadUserData()` resolves, `applyBranding(tenant)` is called. Expose `refreshTenant()` public method. On sign-out, `resetBranding()` is called. CSS vars persist across reloads.
**Depends on**: 1.3, 1.4
**Status**: ✅ Done

### Task 2.2: Dynamic logo + name in Layout
**Files**: `src/components/Layout.tsx`
**Acceptance**: Mobile header and desktop sidebar show `userTenant.logo_url` (with fallback to `default-logo.svg`). No hardcoded `/logo.png`. No hardcoded "Pancho Burger". Tenant name from DB.
**Depends on**: 1.5, 2.1
**Status**: ✅ Done

### Task 2.3: Update AdminLayout hardcoded name
**Files**: `src/components/AdminLayout.tsx`
**Acceptance**: Header shows "PedidoClaro — Admin" instead of "Pancho Burger — Admin".
**Depends on**: none
**Status**: ✅ Done

## Phase 3: Config Page

### Task 3.1: Create ConfiguracionPage
**Files**: `src/pages/ConfiguracionPage.tsx` (new)
**Acceptance**: Form with: tenant name text input, logo upload (accepts PNG/JPG/WebP, ≤2MB, preview before save), 3 HSL color pickers with preset swatches. "Guardar" button persists all fields via `saveBranding()` and re-applies branding live. Toast on success/error. Cashier role sees nothing (guard added in App.tsx).
**Depends on**: 1.3, 1.4, 2.1
**Status**: ✅ Done

### Task 3.2: Add `/configuracion` route with role guard
**Files**: `src/App.tsx`
**Acceptance**: Route `/configuracion` renders `<ConfiguracionPage>` inside `<Layout>` for owner/super_admin. Cashier/kitchen_staff redirected to `/dashboard`.
**Depends on**: 3.1
**Status**: ✅ Done

## Phase 4: Cleanup

### Task 4.1: Remove hardcoded `/logo.png`
**Files**: `public/logo.png` (delete)
**Acceptance**: File no longer exists. Build passes. No broken image references.
**Depends on**: 2.2
**Status**: ✅ Done — file removed, PWA manifest updated to use logo.svg

## Phase 5: Testing

### Task 5.1: Unit test branding helpers
**Files**: `src/lib/__tests__/branding.test.ts` (new)
**Acceptance**: jsdom test: `applyBranding` sets correct CSS vars, null values don't override, `resetBranding` clears all. `saveBranding` calls `supabase.from('inquilinos').update` with correct payload.
**Depends on**: 1.4
**Status**: ✅ Done

### Task 5.2: Integration test ConfiguracionPage
**Files**: `src/pages/__tests__/ConfiguracionPage.test.tsx` (new)
**Acceptance**: Mock `useAuth` with owner role, render page, fill name field, assert update call includes all branding fields. Cashier mock asserts redirect.
**Depends on**: 3.1
**Status**: ✅ Done

### Task 5.3: Verify AuthContext branding integration
**Files**: `src/contexts/__tests__/AuthContext.test.tsx` (new, or extend existing)
**Acceptance**: Mock `inquilinos` select returns branding fields; assert `applyBranding` called with tenant data.
**Depends on**: 2.1
**Status**: ✅ Done

## Summary

| Phase | Tasks | Focus |
|-------|-------|-------|
| Phase 1 | 5 | DB, types, helpers, Storage, fallback assets |
| Phase 2 | 3 | Auth wiring, Layout, AdminLayout |
| Phase 3 | 2 | Config page + route with guard |
| Phase 4 | 1 | Remove dead asset |
| Phase 5 | 3 | Unit + integration tests |
| **Total** | **14** | |

### Implementation Order
Start with Phase 1 (everything depends on it), then Phase 2 (core UX), then Phase 3 (config page), then Phase 4 (cleanup), finally Phase 5 (tests).

### Next Step
Ready for implementation (sdd-apply) as a single PR — `exception-ok` delivery strategy is granted.
