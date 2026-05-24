# Proposal: Company Branding

## Intent

Replace hardcoded branding (`/logo.png`, "Pancho Burger", fixed CSS) with per-tenant visual identity. `inquilinos.logo_url` exists but is unused.

## Scope

**In**: DB columns for colors, logo upload via Storage, dynamic CSS theming, branding config page, Layout update, backwards compat defaults. **Out**: Dynamic PWA icons (static manifest), custom fonts, email branding.

## Capabilities

**New**: `tenant-branding` — per-tenant logo, name, colors across UI. **Modified**: None.

## Approach

1. **DB**: `ALTER inquilinos ADD primary_color text DEFAULT '0 0% 9%', ADD accent_color text DEFAULT '217 91% 60%'`. New Storage bucket `tenant-logos` (public, RLS: owner-only upload).
2. **Theme**: AuthContext sets `--primary`, `--accent`, `--sidebar-primary` on `:root` from tenant data after load. Cascades through existing shadcn/ui HSL Tailwind setup.
3. **Logo**: Upload → `tenant-logos/{tenant_id}/{file}` → URL saved to `inquilinos.logo_url`. `<img>` with fallback to PedidoClaro default.
4. **Layout**: Replace hardcoded `/logo.png` + "Pancho Burger" in mobile header + desktop sidebar with dynamic logo + tenant name.
5. **Config page**: `/configuracion` (owner + super_admin). Form: name, logo upload+preview, two HSL color pickers with swatches. Live preview via CSS var injection. Saves to `inquilinos`.
6. **Backwards compat**: NULL colors → `:root` defaults (DB-level DEFAULT + JS null-coalescing). Remove `public/logo.png`.

## Affected Areas

| Area | Impact | What |
|------|--------|------|
| `inquilinos` table | +2 cols | `primary_color`, `accent_color` |
| `handle_new_user()` | None | DB defaults suffice |
| `src/types/index.ts` | Modified | Add color fields to Tenant |
| `src/contexts/AuthContext.tsx` | Modified | Inject CSS vars |
| `src/components/Layout.tsx` | Modified | Dynamic logo + brand |
| `src/pages/BrandingPage.tsx` | New | `/configuracion` |
| `public/logo.png` | Removed | Use tenant or default |
| `vite.config.ts` | Modified | PWA → "PedidoClaro" |
| Supabase Storage | New | `tenant-logos` bucket |

## Risks

| Risk | Mitigation |
|------|------------|
| Color picker too complex | HSL sliders + preset swatches |
| Public bucket abuse | RLS: authenticated + tenant owner only |
| NULL colors crash | DB defaults + JS null-coalescing |

## Rollback

DB revert columns, delete bucket, git revert code.

## Dependencies

Supabase Storage (already in supabase-js client).

## Success Criteria

- [ ] Owner uploads logo → visible in header + sidebar immediately
- [ ] Color changes apply live across entire UI
- [ ] Existing tenants without branding see clean defaults
- [ ] Branding persists across reloads and sessions
- [ ] Only owner can access `/configuracion`
- [ ] Hardcoded `/logo.png` + "Pancho Burger" gone from Layout
