# User Branch Permissions Specification

## Purpose

Branch-level access control. Staff see only their assigned branch's data; managers/owners with multiple branches can switch between them.

## Requirements

### R-1: Join Table

The system MUST create `perfiles_ubicaciones` (id PK, user_id FK→perfiles, ubicacion_id FK→ubicaciones, role TEXT, is_active BOOLEAN default true).

#### Scenario: Owner assigns staff to branch

- GIVEN an owner/manager on TeamManagementPage
- WHEN they assign a staff member to a branch
- THEN a row is inserted in `perfiles_ubicaciones`
- AND the staff's branch list updates immediately

#### Scenario: Unassigned user fallback

- GIVEN a user with no rows in `perfiles_ubicaciones`
- WHEN BranchContext loads branches
- THEN ALL active `ubicaciones` for the tenant are returned (backward compatible)

#### Scenario: Staff sees only assigned branch

- GIVEN a user assigned to exactly 1 branch
- WHEN BranchContext loads
- THEN only that single branch appears in `branches[]`

### R-2: BranchContext Scoping

BranchContext MUST query `perfiles_ubicaciones` JOIN `ubicaciones` for the current user, falling back to all tenant branches when empty.

#### Scenario: Multi-branch user sees selector

- GIVEN a user with 2+ assigned branches
- WHEN layout renders
- THEN a branch dropdown appears in the sidebar/header
- AND user can switch active branch

#### Scenario: Single-branch user hides selector

- GIVEN a user with exactly 1 assigned branch
- WHEN layout renders
- THEN no branch selector is shown
- AND `activeBranch` defaults to that single branch

### R-3: Team Management Assignment

TeamManagementPage MUST show branch assignment per user for owner/manager roles.

#### Scenario: Owner assigns multiple branches

- GIVEN an owner on TeamManagementPage
- WHEN they edit a staff member's branch assignment
- THEN a multi-select of branches appears
- AND selected branches persist to `perfiles_ubicaciones`

#### Scenario: Manager reads only

- GIVEN a manager (not owner) viewing TeamManagementPage
- THEN the branch assignment column is read-only
- AND existing assignments display as tags

### R-4: RLS

`perfiles_ubicaciones` MUST enforce: users read own rows; owner/manager reads all for tenant.

#### Scenario: User queries own assignments

- GIVEN any authenticated user
- WHEN querying `perfiles_ubicaciones`
- THEN only `user_id = auth.uid()` rows return

## Acceptance Criteria

- [ ] Migration creates `perfiles_ubicaciones` with FKs and RLS
- [ ] Unassigned users see all tenant branches (backward compatible)
- [ ] Staff sees only assigned branch
- [ ] Multi-branch user sees selector; single-branch hides it
- [ ] Owner can assign staff to branches
- [ ] `npm run build` passes, `npm run test` passes
