# Tasks: User Roles & Profile Enhancement

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~540 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | exception-ok |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Medium

## Phase 1: Foundation — DB Migrations

- [x] **T-1** Create migration `add_avatar_url_to_perfiles` — `ALTER TABLE perfiles ADD COLUMN avatar_url TEXT;`
  - Verify: migration runs cleanly; existing rows get `avatar_url = NULL`
- [x] **T-2** Create migration `create_perfiles_ubicaciones` — join table (user_id FK→perfiles, ubicacion_id FK→ubicaciones, role TEXT, is_active BOOLEAN) + RLS policies (self-read, manager-read-all, owner-insert)
  - Verify: table created with FKs, RLS enabled, policies correct
- [x] **T-3** Create migration `create_avatars_bucket` — `storage.buckets` INSERT + RLS policy `storage.foldername(name)[1] = auth.uid()`
  - Verify: bucket exists, RLS blocks cross-user access

## Phase 2: Core Logic — Types & Contexts

- [x] **T-4** Extend `src/types/index.ts` — add `avatar_url?: string` to `Profile`; add `BranchPermission` interface (`id`, `ubicacion_id`, `role`, `is_active`)
  - Verify: `Profile.avatar_url` exists; `BranchPermission` is exported
- [x] **T-5** Update `src/contexts/AuthContext.tsx` — load `avatar_url` from `perfiles` in `loadUserData`; expose `hasBranchAccess(branchId): boolean` checking `perfiles_ubicaciones`
  - Verify: `profile.avatar_url` populated on init; `useAuth().hasBranchAccess(id)` works
- [x] **T-6** Refactor `src/contexts/BranchContext.tsx` — `fetchBranches` JOINs `perfiles_ubicaciones` for current user; fallback to all tenant branches when no permission rows exist; expose `userPermissions: BranchPermission[]`
  - Verify: scoped user sees only assigned branches; unassigned user sees all (backward compat)

## Phase 3: UI Layer — Components & Pages

- [x] **T-7** Update `src/pages/ProfilePage.tsx` — clickable avatar zone with upload to `avatars/{user_id}/`; file validation (≤2MB, JPEG/PNG/WebP); remove-avatar button; inline edit for `phone` + `document_id`; toast feedback
  - Verify: upload updates preview + `avatar_url`; oversized/wrong-type rejected client-side; remove clears avatar
- [x] **T-8** Add branch assignment to `src/components/TeamSection.tsx` — toggle branches for owner; read-only tags for non-owners; upserts `perfiles_ubicaciones` rows
  - Verify: owner assigns branches → rows persist; non-owner sees tags/fallback
- [x] **T-9** Update `src/components/Layout.tsx` — sidebar avatar shows `<img>` when `profile.avatar_url` exists, falls back to initials; BranchSelector already adaptive (auto-hides at ≤1 branch)
  - Verify: avatar image renders when URL set; initials fallback otherwise

## Phase 4: Integration & Testing

- [x] **T-10** Write unit tests for `BranchContext` — mock supabase, test JOIN path (user with assigned branches) and fallback path (no rows); assert `branches[]` and `userPermissions`
  - Verify: `npm run test` passes; scenarios from spec R-2
- [x] **T-11** Write unit tests for `AuthContext` — extend existing test to assert `avatar_url` loaded on profile, undefined when missing
  - Verify: `npm run test` passes; spec scenario R-A1
- [x] **T-12** Write unit tests for `ProfilePage` file validation — mock `File` objects; test type rejection (PDF → toast "Formato no soportado") and size rejection (>2MB → toast "menor a 2MB")
  - Verify: `npm run test` passes; spec scenarios R-1 (size, format)
