# Delta: Auth — User Roles & Profile Enhancement

> **Change**: `user-roles-and-profile`
> **Domain**: `auth` (modified)
> **New specs**: `user-branch-permissions`, `profile-avatar`
> **Base spec**: `openspec/specs/auth/spec.md` — login page layout **remains unchanged**

---

## ADDED Requirements

### R-A1: Profile avatar_url field

`Profile` type MUST include `avatar_url?: string`, loaded from `perfiles` on auth init.

#### Scenario: Loads with avatar

- GIVEN a user with `avatar_url` in `perfiles`
- WHEN `AuthContext.loadUserData()` runs
- THEN `profile.avatar_url` contains the stored URL
- AND avatar renders on ProfilePage

#### Scenario: Loads without avatar

- GIVEN a user without `avatar_url`
- WHEN AuthContext loads
- THEN `profile.avatar_url` is undefined/null
- AND initials fallback is shown

### R-A2: BranchContext permission-scoped loading

BranchContext MUST load branches via `perfiles_ubicaciones` JOIN, falling back to all tenant branches when no permissions exist.

#### Scenario: Scoped branches

- GIVEN a user with rows in `perfiles_ubicaciones`
- WHEN BranchContext fetches branches
- THEN it queries `ubicaciones` JOINed on `perfiles_ubicaciones WHERE user_id = auth.uid()`
- AND only permitted branches are returned

#### Scenario: Fallback for unassigned

- GIVEN a user with zero `perfiles_ubicaciones` rows
- WHEN BranchContext fetches branches
- THEN it queries all `ubicaciones` by tenant_id (current behavior)
- AND backward compatibility is maintained

### R-A3: hasBranchAccess helper

AuthContext SHOULD expose `hasBranchAccess(branchId: string): boolean`.

#### Scenario: Check assigned branch

- GIVEN a user assigned to branch "A"
- WHEN `hasBranchAccess("A")` is called
- THEN returns true
- AND `hasBranchAccess("B")` returns false

## Unchanged

The existing `openspec/specs/auth/spec.md` (login page layout, signIn, signUp, redirect logic) is **not modified** by this change. All auth changes here are additive: new profile field, new context behavior, new helper.

## Acceptance Criteria

- [ ] `avatar_url` loaded in AuthContext profile on init
- [ ] BranchContext queries `perfiles_ubicaciones` with fallback
- [ ] `hasBranchAccess(branchId)` available in `useAuth()`
- [ ] `npm run build` passes, `npm run test` passes
