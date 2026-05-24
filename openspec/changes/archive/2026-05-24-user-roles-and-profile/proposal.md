# Proposal: User Roles & Profile Enhancement

## Intent

Solve two pain points: (1) branch-level access control — staff should see only their branch's data, and multi-branch managers (like Joselyn) should switch between branches easily. (2) Profile page is bare-bones with no avatar upload or interactive UX.

## Scope

### In Scope
- Join table `perfiles_ubicaciones` linking users → branches they can access
- Migration: add `avatar_url` column to `perfiles`
- Branch assignment UI in Team Management (owner/manager assigns staff to branches)
- Branch-aware BranchContext: only loads branches the user has permission to see
- Multi-branch user flow: user with 2+ branches sees branch selector, can switch
- Profile page redesign: avatar upload (Supabase Storage), editable fields, richer layout
- Supabase Storage bucket `avatars` with RLS policies

### Out of Scope
- Fine-grained feature permissions per role (e.g., "cashier can't see reports") — future work
- Role hierarchy/ownership transfer
- Branch creation/management (already in BranchManager)

## Capabilities

### New Capabilities
- `user-branch-permissions`: Assigning users to branches, branch-scoped data access, multi-branch switching
- `profile-avatar`: Avatar upload via Supabase Storage, profile page redesign with richer UX

### Modified Capabilities
- `auth`: `Profile` type gains `avatar_url`, `BranchContext` loads user-scoped branches instead of all tenant branches. `hasRole` may gain `hasBranchAccess(branchId)`.

## Approach

1. **DB**: Create `perfiles_ubicaciones` (user_id FK→perfiles, location_id FK→ubicaciones). Add `avatar_url` to `perfiles`. Storage bucket `avatars` with user-ID-scoped RLS.
2. **Types/Contexts**: Update `Profile` type. Refactor `BranchContext` to query `perfiles_ubicaciones` for the current user instead of all `ubicaciones` by tenant. Add `setActiveBranchId` flow for multi-branch users.
3. **Team Management**: Add branch assignment column per user (checkboxes / multi-select).
4. **Profile Page**: Replace with avatar upload (dropzone → Supabase Storage), inline editable fields, visual improvement.
5. **Branch Selector**: If user has 2+ branches, show a dropdown in the sidebar/header.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `supabase/migrations/` | New | `perfiles_ubicaciones` table, `avatar_url` column, Storage bucket |
| `src/types/index.ts` | Modified | `Profile` gains `avatar_url` |
| `src/contexts/BranchContext.tsx` | Modified | Scope branches to user's permissions |
| `src/pages/ProfilePage.tsx` | Modified | Redesign + avatar upload |
| `src/pages/TeamManagementPage.tsx` | Modified | Add branch assignment column |
| `src/components/Layout.tsx` | Modified | Branch selector for multi-branch users |
| `src/contexts/AuthContext.tsx` | Modified | Load `avatar_url` on profile fetch |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Existing users have NULL branch permissions | High | Default: all tenant branches (backward compatible) |
| Storage RLS misconfig leaks avatars | Medium | Test RLS policies before merge; user-ID folder prefix |
| Branch selector UX confusion for single-branch users | Low | Don't show selector if user has only 1 branch |

## Rollback Plan

Revert migration `perfiles_ubicaciones` and `avatar_url` column. Restore `BranchContext` to query all branches by tenant. Rollback `ProfilePage` to current version.

## Dependencies

- Supabase Storage bucket `avatars` creation
- RLS policies on `perfiles_ubicaciones` (users read own rows, owner/manager reads all for tenant)

## Success Criteria

- [ ] Owner can assign staff to specific branches in Team Management
- [ ] Staff user sees only their assigned branches in branch selector
- [ ] Multi-branch user can switch branches and data scopes correctly
- [ ] Profile page shows avatar upload with preview before saving
- [ ] `npm run build` passes, `npm run test` passes
