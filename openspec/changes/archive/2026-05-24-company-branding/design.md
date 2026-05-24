# Design: Company Branding

## Technical Approach

Extend the existing `inquilinos` row (already loaded by AuthContext) with color columns, inject them as CSS variables on the `:root` element after login, replace hardcoded `/logo.png` with the tenant's `logo_url`, and add a `/configuracion` page for owners to manage branding. Supabase Storage handles logo uploads.

## Architecture Decisions

### Decision: No separate BrandingContext

| Option | Tradeoff | Decision |
|--------|----------|----------|
| New BrandingContext + Provider | Cleaner separation, extra re-render layer | ✗ |
| Extend AuthContext state | Single source of truth, already loads tenant | ✓ |
| React Query for branding | Caching + refetch, but overkill for single row | ✗ |

Rationale: AuthContext already fetches the full `inquilinos` row on login. Adding fields to the `Tenant` type and a `refreshTenant()` method is ~10 lines. A separate context adds complexity with zero benefit at this scope.

### Decision: HSL values in DB, not hex

Rationale: The existing `:root` variables and Tailwind config use `hsl(var(--primary))`. Storing HSL strings (`"0 0% 9%"`) avoids conversion, lets us set CSS vars directly, and keeps the color picker simpler (HSL sliders map 1:1 to DB values).

### Decision: CSS variable injection on auth load

Store colors as HSL strings. After `loadUserData()` resolves, call a `applyBranding(tenant)` function that sets `--primary`, `--accent`, `--sidebar-background` on `document.documentElement`. If a color is NULL → skip it (`:root` defaults remain). Logo handled via React state + `<img src>` directly.

## Data Flow

```
Login ──→ AuthContext.loadUserData()
               │
               ├── supabase.from('inquilinos') ──→ tenant (includes primary_color, accent_color, sidebar_color, logo_url)
               │
               └── applyBranding(tenant) ──→ document.documentElement.style.setProperty(...)
                                                  │
                                                  ▼
                                          Tailwind reads hsl(var(--...))
                                                  │
                                                  ▼
                                          All components re-theme

Config Page ──→ saveBranding() ──→ supabase.from('inquilinos').update(...)
                                        │
                                        ├── applyBranding(updatedTenant) ──→ live preview
                                        └── toast.success()
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/types/index.ts` | Modify | Add `primary_color`, `accent_color`, `sidebar_color` to `Tenant` |
| `src/contexts/AuthContext.tsx` | Modify | Import `applyBranding`, call after tenant load; expose `refreshTenant()` |
| `src/lib/branding.ts` | Create | `applyBranding()` + `resetBranding()` helpers; `saveBranding()` mutation |
| `src/components/Layout.tsx` | Modify | Dynamic logo (`userTenant.logo_url`), remove `/logo.png` hardcode |
| `src/components/AdminLayout.tsx` | Modify | Replace "Pancho Burger — Admin" with "PedidoClaro — Admin" |
| `src/pages/ConfiguracionPage.tsx` | Create | `/configuracion` form: name, logo upload, 3 color pickers |
| `src/App.tsx` | Modify | Add route `/configuracion` with owner/manager guard |
| `public/logo.png` | Remove | No longer needed; fallback to inline SVG or nothing |
| Supabase migration | Apply | `ALTER TABLE inquilinos ADD COLUMN ...` |
| Supabase Storage | Create | Bucket `tenant-assets`, public read, RLS write |

## Interfaces / Contracts

```typescript
// Extend Tenant
export interface Tenant {
  // ... existing fields
  primary_color?: string | null;  // HSL: "H S% L%" e.g. "0 0% 9%"
  accent_color?: string | null;  // HSL
  sidebar_color?: string | null;  // HSL
}

// branding.ts helpers
export function applyBranding(tenant: Tenant | null): void;
export function resetBranding(): void;
export async function saveBranding(
  tenantId: string,
  data: { name?: string; logo_url?: string; primary_color?: string; accent_color?: string; sidebar_color?: string }
): Promise<void>;
```

## CSS Variable Strategy

```typescript
// src/lib/branding.ts
const DEFAULTS = {
  '--primary': '0 0% 9%',
  '--accent': '217 91% 60%',
  '--sidebar-background': '0 0% 98%',
};

export function applyBranding(tenant: Tenant | null) {
  const root = document.documentElement;
  if (!tenant) return resetBranding();

  const vars: Record<string, string | null | undefined> = {
    '--primary': tenant.primary_color,
    '--accent': tenant.accent_color,
    '--sidebar-background': tenant.sidebar_color,
  };

  for (const [key, value] of Object.entries(vars)) {
    if (value) {
      root.style.setProperty(key, value);
    } else {
      root.style.removeProperty(key); // fallback to :root default
    }
  }
}

export function resetBranding() {
  const root = document.documentElement;
  for (const key of Object.keys(DEFAULTS)) {
    root.style.removeProperty(key);
  }
}
```

Logo is NOT a CSS var — it's handled via React:

```tsx
// Layout.tsx
<img
  src={userTenant?.logo_url || '/default-logo.svg'}
  alt="Logo"
  className="w-8 h-8 rounded-lg object-cover"
/>
```

A small inline SVG (`/public/default-logo.svg`) serves as fallback.

## Migration SQL

```sql
ALTER TABLE inquilinos
  ADD COLUMN primary_color text DEFAULT NULL,
  ADD COLUMN accent_color text DEFAULT NULL,
  ADD COLUMN sidebar_color text DEFAULT NULL;
```

No data migration needed — NULL = defaults in CSS.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `applyBranding()` sets/removes CSS vars correctly | jsdom + assert `style.getPropertyValue` |
| Integration | Config page form saves + applies branding | Mock Supabase, render page, fill fields, assert update call |
| Integration | AuthContext loads branding + applies CSS vars | Mock `inquilinos` select, assert `applyBranding` called |
| E2E | Logo upload flow | Playwright: upload file, check Storage API call, check `<img>` src |

## Migration / Rollout

No migration required for existing data. NULL values fall through to the existing `:root` defaults — zero visual change for existing tenants. The `public/logo.png` removal is safe: the code will fall back to a new `public/default-logo.svg`.

## Open Questions

None.
