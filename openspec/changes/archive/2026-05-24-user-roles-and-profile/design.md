# Design: User Roles & Profile Enhancement

## Technical Approach

Three independent but deployable layers: (1) DB migration adding `perfiles_ubicaciones` join table + `avatar_url` column + Storage bucket, (2) BranchContext refactor to scope branches via the join table with fallback, (3) UI: ProfilePage avatar upload + TeamManagement branch assignment + avatar display in sidebar.

## Architecture Decisions

| Decision | Option | Chosen | Rationale |
|----------|--------|--------|-----------|
| Branch permission fallback | NULL-means-all vs NULL-means-none | NULL-means-all (fallback) | Backward compatible: existing unassigned users keep all branches |
| BranchSelector display logic | gated by `branches.length` | `branches.length <= 1 → hide` | Already implemented; scoping auto-solves single/multi behavior |
| Avatar storage path pattern | flat vs `{user_id}/` prefix | `avatars/{user_id}/{ts}-{name}` | RLS enforced via folder prefix match; prevents cross-user access |
| Perfiles table name | English "profiles" | Keep `perfiles` | Existing convention across all code |
| Branch assignment CRUD | direct supabase calls | Direct query in TeamManagementPage | No reusable admin API needed yet; follows existing pattern |

## Data Flow

```
AuthContext.loadUserData()
  → SELECT * from perfiles WHERE id = auth.uid()
  → profile.avatar_url (new field)

BranchContext.fetchBranches()
  → Check perfiles_ubicaciones WHERE user_id = auth.uid()
    ├── Has rows → JOIN ubicaciones WHERE id IN (ubicacion_ids)
    └── No rows → SELECT * from ubicaciones WHERE tenant_id = X (fallback)
  → branches[] scoped
  → activeBranch auto-selected first or from localStorage

ProfilePage avatar upload
  → File select → validate (type + size ≤ 2MB)
  → supabase.storage.from('avatars').upload(`{user_id}/...`)
  → supabase.from('perfiles').update({ avatar_url })
  → refreshProfile()
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/XXXXXX_add_perfiles_ubicaciones.sql` | Create | Join table + RLS policies |
| `supabase/migrations/XXXXXX_add_avatar_url.sql` | Create | ALTER TABLE perfiles ADD COLUMN avatar_url TEXT |
| `supabase/migrations/XXXXXX_create_avatars_bucket.sql` | Create | Storage bucket + RLS policies |
| `src/types/index.ts` | Modify | `Profile` gains `avatar_url?: string`; add `BranchPermission` interface |
| `src/contexts/AuthContext.tsx` | Modify | `avatar_url` loaded in profile; expose `hasBranchAccess` |
| `src/contexts/BranchContext.tsx` | Modify | Scope branches via `perfiles_ubicaciones` JOIN with fallback; add `userPermissions` |
| `src/pages/ProfilePage.tsx` | Modify | Avatar upload zone, file validation, inline edit phone + document_id |
| `src/pages/TeamManagementPage.tsx` | Modify | Branch assignment column (multi-select for owner, tags for manager read-only) |
| `src/components/Layout.tsx` | Modify | Show avatar image in sidebar (instead of initials-only); BranchSelector already adaptive |

## Interfaces / Contracts

```typescript
// In src/types/index.ts
export interface BranchPermission {
  id: string;
  ubicacion_id: string;
  role: UserRole;
  is_active: boolean;
}

// Profile gains:
export interface Profile {
  // ... existing fields
  avatar_url?: string;   // NEW
}

// BranchContext gains:
interface BranchContextType {
  // ... existing fields
  userPermissions: BranchPermission[];  // NEW — raw permission rows
  hasBranchAccess: (branchId: string) => boolean;  // NEW
}

// AuthContext gains:
interface AuthContextType {
  // ... existing fields
  hasBranchAccess: (branchId: string) => boolean;  // NEW
}
```

## Migration SQL

### perfiles_ubicaciones
```sql
CREATE TABLE perfiles_ubicaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  ubicacion_id UUID NOT NULL REFERENCES ubicaciones(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'staff',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, ubicacion_id)
);

ALTER TABLE perfiles_ubicaciones ENABLE ROW LEVEL SECURITY;

-- Users read own rows; users with perfiles.role IN ('owner','manager') read all
CREATE POLICY "users_read_own" ON perfiles_ubicaciones
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "managers_read_all" ON perfiles_ubicaciones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM perfiles WHERE id = auth.uid()
      AND role IN ('owner', 'manager', 'super_admin')
    )
  );

-- Owner inserts
CREATE POLICY "owner_insert" ON perfiles_ubicaciones
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles WHERE id = auth.uid()
      AND role IN ('owner', 'super_admin')
    )
  );
```

### avatar_url
```sql
ALTER TABLE perfiles ADD COLUMN avatar_url TEXT;
```

### avatars bucket
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

CREATE POLICY "users_own_folder" ON storage.objects
  FOR ALL USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | `BranchContext` scoping logic | Mock supabase, test fallback path and JOIN path |
| Unit | `AuthContext` loads `avatar_url` | Extend existing AuthContext test to assert avatar_url on profile |
| Unit | `ProfilePage` file validation | Test type/size rejection with mock File objects |
| Integration | `TeamManagementPage` branch assignment | Mock `perfiles_ubicaciones` CRUD |
| E2E | Upload avatar, verify preview + URL | Manual — Storage requires real Supabase |

## Migration / Rollout

Deploy migrations in order: (1) `avatar_url` column (non-breaking), (2) `perfiles_ubicaciones` table, (3) Storage bucket. BranchContext refactor goes live last — until then, unassigned users see fallback. No feature flags needed.

Rollback: revert BranchContext to tenant-only query, drop `perfiles_ubicaciones` and `avatar_url` column, delete `avatars` bucket.

## Open Questions

- None — all decisions resolved by existing patterns and specs.
