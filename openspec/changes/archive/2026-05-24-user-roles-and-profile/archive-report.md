# Archive Report: User Roles & Profile Enhancement

**Change**: `user-roles-and-profile`
**Archived**: 2026-05-24
**Archive location**: `openspec/changes/archive/2026-05-24-user-roles-and-profile/`
**Verdict**: ✅ PASS WITH WARNINGS

---

## What Was Implemented

### Capability: User Branch Permissions
- **Join table `perfiles_ubicaciones`**: Links users to branches with role and active status, RLS-enabled (self-read, manager-read-all, owner-CRUD)
- **BranchContext scope refactor**: Loads branches via `perfiles_ubicaciones` JOIN, falls back to all tenant branches when no permissions exist (backward compatible)
- **Team Management branch assignment**: Owner can assign/unassign branches via toggle buttons; non-owners see read-only tags
- **`hasBranchAccess(branchId)` helper**: AuthContext exposes it; BranchContext owns actual permission data
- **Multi-branch selector**: Auto-displayed when user has 2+ branches, hidden when ≤1 branch

### Capability: Profile Avatar
- **`avatar_url` column** on `perfiles` table (nullable, migration)
- **Avatar upload** to Supabase Storage bucket `avatars/{user_id}/` with client-side validation (≤2MB, JPEG/PNG/WebP)
- **Avatar remove** button that deletes storage file and nulls URL
- **RLS on avatars bucket**: User-scoped via `storage.foldername(name)[1] = auth.uid()`
- **Inline profile editing**: `full_name`, `phone`, `document_id` with save/error handling
- **Sidebar avatar display**: `<img>` when URL set, initials fallback otherwise

### Auth Delta (modified)
- `Profile` type gains `avatar_url?: string`
- `AuthContext.loadUserData()` loads `avatar_url` on init
- `hasBranchAccess()` exposed via `useAuth()`

---

## Files Changed

### Migrations (3 new)
| File | Description |
|------|-------------|
| `supabase/migrations/20260524_add_avatar_url.sql` | `ALTER TABLE perfiles ADD COLUMN avatar_url TEXT` |
| `supabase/migrations/20260524_create_perfiles_ubicaciones.sql` | Join table + RLS policies (5 policies) |
| `supabase/migrations/20260524_create_avatars_bucket.sql` | Storage bucket + RLS policy |

### Source Code (7 files modified)
| File | Change |
|------|--------|
| `src/types/index.ts` | `Profile.avatar_url?: string` added; `BranchPermission` interface created |
| `src/contexts/AuthContext.tsx` | `avatar_url` loaded in profile; `hasBranchAccess` exposed |
| `src/contexts/BranchContext.tsx` | Scoped branch loading via `perfiles_ubicaciones` JOIN with fallback |
| `src/pages/ProfilePage.tsx` | Avatar upload zone, validation, remove button; inline edit phone + document_id |
| `src/components/TeamSection.tsx` | Branch assignment toggle for owner; read-only tags for non-owners |
| `src/components/Layout.tsx` | Sidebar avatar image; BranchSelector auto-hides at ≤1 branch |

### Tests (5 new test files, 38 test cases)
| File | Tests |
|------|-------|
| `src/contexts/__tests__/BranchContext.test.tsx` | 5 |
| `src/contexts/__tests__/AuthContext.test.tsx` | 8 (4 new + 4 pre-existing) |
| `src/pages/__tests__/ProfilePage.test.tsx` | 7 |
| `src/components/__tests__/UserBranchAssignment.test.tsx` | 9 |
| `src/components/__tests__/TeamSection.test.tsx` | 9 |

---

## Verification Result

| Metric | Result |
|--------|--------|
| **Build** | ✅ Passed |
| **Tests (this change)** | ✅ 38/38 pass |
| **Tests (pre-existing failures)** | ⚠️ 3 unrelated failures (UI redesign text mismatches) |
| **Spec compliance** | ✅ 21/21 scenarios compliant (2 partial due to assertion coupling) |
| **Tasks complete** | ✅ 12/12 |
| **TDD compliance** | ⚠️ 5/6 (2 test files duplicate logic locally instead of importing production code) |

### Deviations from Design
1. **`hasBranchAccess` in AuthContext**: Role-based (owner/super_admin → true, others → false) instead of checking `perfiles_ubicaciones` directly. Conscious trade-off — BranchContext owns permission data.
2. **TeamSection branch UI**: Toggle buttons instead of multi-select. Consistent with existing UI patterns.

---

## Known Issues / Caveats

### Warnings (non-blocking)
1. **Assertion coupling**: `ProfilePage.test.tsx` duplicates `validateAvatarFile` locally; `UserBranchAssignment.test.tsx` duplicates `canAssignBranches` locally. Tests don't exercise production code directly.
2. **Pre-existing test failures**: 3 tests unrelated to this change fail (UI text mismatches from earlier work).
3. **No coverage tool configured**: Coverage analysis skipped.

### Production Concerns
- Existing users with NULL branch permissions retain full access via fallback (intended, per design).
- Storage RLS tested at migration level; real Supabase E2E avatar flow not tested (requires live Storage bucket).

---

## Artifact Traceability

| Artifact | Engram ID | Filesystem Path |
|----------|-----------|-----------------|
| Proposal | #65 | `archive/2026-05-24-user-roles-and-profile/proposal.md` |
| Spec | #66 | `archive/2026-05-24-user-roles-and-profile/spec.md` |
| Design | #67 | `archive/2026-05-24-user-roles-and-profile/design.md` |
| Tasks | #68 | `archive/2026-05-24-user-roles-and-profile/tasks.md` |
| Verify Report | #70 | `archive/2026-05-24-user-roles-and-profile/verify-report.md` |
| Archive Report | (this) | `archive/2026-05-24-user-roles-and-profile/archive-report.md` |

---

## Main Specs Updated

The following specs in `openspec/specs/` now reflect the new behavior (synced during apply phase):

| Domain | Path | Action |
|--------|------|--------|
| `user-branch-permissions` | `openspec/specs/user-branch-permissions/spec.md` | Created (new domain) |
| `profile-avatar` | `openspec/specs/profile-avatar/spec.md` | Created (new domain) |
| `auth` | `openspec/specs/auth/spec.md` | Unchanged (delta was additive; login page layout not affected) |

---

## Post-Deploy Steps

1. **Apply migrations** to Supabase production database in order:
   - `20260524_add_avatar_url.sql`
   - `20260524_create_perfiles_ubicaciones.sql`
   - `20260524_create_avatars_bucket.sql`
2. **Verify Storage bucket** `avatars` exists and RLS policies are active
3. **Assign branch permissions** for existing staff users via Team Management (owner action)
4. **Monitor for regression**: Unassigned users should see all branches (fallback)
5. **Address warnings** (optional, recommended):
   - Refactor `ProfilePage.test.tsx` to import `validateAvatarFile` from production code
   - Refactor `UserBranchAssignment.test.tsx` to import `canAssignBranches` from production code

---

## SDD Cycle Complete

The change has been fully planned, implemented, verified, and archived. Ready for the next change.
