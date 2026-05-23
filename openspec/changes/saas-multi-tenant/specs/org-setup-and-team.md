# Phase 3 — Org Setup & Team Management

## Requirements

1. After first login, new users see an organization setup wizard (not the dashboard)
2. Wizard steps:
   - Restaurant info (name, logo, location address)
   - First products (quick-add a few menu items)
   - Invite team members (optional, skip)
3. Team management page for owners:
   - List members with roles
   - Invite by email (creates `invitaciones` row)
   - Change roles (manager, cashier, kitchen_staff)
   - Remove/disable members
4. Profile page for any user:
   - View/update full name
   - View role and tenant info
   - Change email (delegates to Supabase Auth)

## Scenarios

### First Login
- New user signs up → email confirmed → redirected to `/setup` (not `/`)
- `ProtectedRoute` checks if profile has `setup_completed` → if not, redirects to wizard
- Wizard saves org info → redirects to dashboard

### Team Invite
- Owner goes to `/team` → enters email + role → invite sent
- Invited user gets email with magic link → accepts → profile created with role
- Invite expires after 7 days

### Team Member Login
- Invited user signs up → trigger creates profile with `pending_verification`
- Magic link accepted → status changed to `active`
- Redirected to dashboard (no wizard — org already exists)
